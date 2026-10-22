import data from './motion-data.json';
export type Curve = {kind:string;value?:number;start?:number;parameters?:number[];corrections?:number[][]};
export const FORMAT = {width:1114,height:836,fps:60,durationInFrames:821};
// Opening-only reading hold; smooth time ramps preserve the later choreography.
export const INTRO_TIMING={hold:45,departureEnd:135,returnStart:731,returnEnd:819};
const hermite=(t:number,a:number,b:number,m0:number,m1:number)=>
 (2*t*t*t-3*t*t+1)*a+(t*t*t-2*t*t+t)*m0+(-2*t*t*t+3*t*t)*b+(t*t*t-t*t)*m1;
export function toSourceFrame(outputFrame:number):number {
 const f=Math.max(0,outputFrame);
 if(f<=45)return 0;
 if(f<135)return hermite((f-45)/90,0,33,0,45);
 if(f<=731)return 33+(f-135)*.5;
 if(f<819)return hermite((f-731)/88,331,360,44,0);
 return 360;
}
export function toOutputFrame(sourceFrame:number):number {
 let lo=0,hi=FORMAT.durationInFrames-1;
 for(let i=0;i<40;i++){const mid=(lo+hi)/2;if(toSourceFrame(mid)<sourceFrame)lo=mid;else hi=mid;}
 return Math.round(hi);
}
export function evaluate(curve:Curve,frame:number):number {
  if(curve.kind==='constant') return curve.value!;
  const [base,velocity,amplitude,delay,frequency]=curve.parameters!;
  const local=frame-curve.start!;
  const q=Math.max(0,(local-delay)*frequency);
  const spring=1-(1+q)*Math.exp(-q);
  const keys=curve.corrections!;
  let correction=keys[0][1];
  if(frame>=keys[keys.length-1][0]) correction=keys[keys.length-1][1];
  else for(let i=1;i<keys.length;i++) {
    if(frame<=keys[i][0]) {
      const a=keys[i-1],b=keys[i];
      correction=a[1]+(b[1]-a[1])*(frame-a[0])/(b[0]-a[0]);break;
    }
  }
  return base+velocity*local+amplitude*spring+correction;
}
export type PlaneGeometry = {id:string;section:string;group:string;x:number;y:number;width:number;height:number;opacity:number};
export function referenceGeometryAt(frame:number):PlaneGeometry[] {
  return data.instances.filter(i=>frame>=i.first&&frame<i.last+1).map(i=>({
    id:i.id,section:i.section,group:i.group,
    x:evaluate(i.tracks.x,frame),y:evaluate(i.tracks.y,frame),
    width:Math.max(0,evaluate(i.tracks.width,frame)),height:Math.max(0,evaluate(i.tracks.height,frame)),
    opacity:Math.max(0,Math.min(1,evaluate(i.tracks.opacity,frame))),
  }));
}
export const referenceRailsAt=(frame:number)=>data.lines.map(l=>({...l,x:evaluate(l.x,frame)}));
// One target-based, critically damped entrance drives both rails and panels.
// Unit mass: stiffness = omega², damping = 2*omega; no measured corrections.
export const GUTTER_ENTRANCE={start:86,end:112,frequency:9};
export function gutterProgress(frame:number):number {
  const {start,end,frequency}=GUTTER_ENTRANCE;
  const t=Math.max(0,Math.min(1,(frame-start)/(end-start)));
  const response=(q:number)=>1-(1+q)*Math.exp(-q);
  return response(frequency*t)/response(frequency);
}
export const railsAt=(frame:number)=>{
  const rails=referenceRailsAt(frame);
  if(frame<86||frame>318)return rails;
  const spread=487+59*gutterProgress(frame);
  const positions=[556-spread,556,556+spread];
  return rails.map((rail,index)=>({...rail,x:positions[index]}));
};
const starts=new Map(data.instances.map(instance=>[instance.id,instance.first]));
const startingWidths=new Map(data.instances.map(instance=>[instance.id,evaluate(instance.tracks.width,instance.first)]));
/** Normalized critically damped response, with exact endpoints for seeking/loops. */
export function entranceProgress(frame:number,start:number,duration:number,frequency=8):number {
  const t=Math.max(0,Math.min(1,(frame-start)/duration));
  const response=(q:number)=>1-(1+q)*Math.exp(-q);
  return response(frequency*t)/response(frequency);
}
export const FINAL_PAIR_EXIT_START=310;
const isFinalPair=(plane:PlaneGeometry)=>['ingredients-isolated','hero-isolated'].includes(plane.id);
const columnLayoutFrame=(plane:PlaneGeometry,frame:number)=>isFinalPair(plane)?Math.min(frame,FINAL_PAIR_EXIT_START):frame;
export const isExpandingColumn=(plane:PlaneGeometry)=>plane.group.endsWith('-column')&&plane.id.endsWith('-isolated');
/** Authored expanding masks already settle exactly; no second scale correction. */
export function stableColumnSize(plane:PlaneGeometry,_frame:number){
 return {width:plane.width,height:plane.height};
}
/** Quintic trajectory with explicit endpoint velocities and zero endpoint acceleration. */
export function smoothTravel(t:number,a:number,b:number,v0:number,v1:number,duration:number):number {
 const x=Math.max(0,Math.min(1,t)),d=b-a,m0=v0*duration,m1=v1*duration;
 return a+m0*x+(10*d-6*m0-4*m1)*x**3+(-15*d+8*m0+7*m1)*x**4+(6*d-3*m0-3*m1)*x**5;
}
const instanceById=new Map(data.instances.map(i=>[i.id,i]));
const trackY=(id:string,f:number)=>evaluate(instanceById.get(id)!.tracks.y,f);
const velocityY=(id:string,f:number)=>(trackY(id,f+.001)-trackY(id,f))/.001;
/** Curated movement uses shared column entrance timing, not capture residuals. */
export function motionGeometryAt(frame:number):PlaneGeometry[]{
 return referenceGeometryAt(frame).map(p=>{
  if(p.group==='clipped-page')return p;
  const first=starts.get(p.id)!;
  const grid=p.id.endsWith('-grid');
  const start=grid?92:first,end=grid?112:first+20;
  let y=p.y;
  if(frame<=end){
   const leader=p.group==='left-column'?'connected-grid':'hero-grid';
   const target=trackY(p.id,end);
   const initial=grid?trackY(leader,start)+target-trackY(leader,end):trackY(p.id,start);
   y=smoothTravel((frame-start)/(end-start),initial,target,0,velocityY(p.id,end),end-start);
  }
  if(isExpandingColumn(p)){
   const progress=smoothTravel((frame-first)/20,0,1,0,0,20);
   return {...p,y,width:startingWidths.get(p.id)!+(535-startingWidths.get(p.id)!)*progress,height:302};
  }
  return {...p,y};
 });
}
export function imageZoomAt(plane:PlaneGeometry,frame:number):number {
  // Share the frame's actual scale progress: no independent timer or settling tail.
  if(isExpandingColumn(plane)){
    const [left,middle,right]=railsAt(columnLayoutFrame(plane,frame)).map(rail=>rail.x);
    const finalWidth=Math.min(middle-left,right-middle)-2*COLUMN_INSET;
    const initialScale=startingWidths.get(plane.id)!/SOURCE_COLUMN_WIDTH;
    const progress=Math.max(0,Math.min(1,(plane.width/finalWidth-initialScale)/(1-initialScale)));
    return .74+.26*progress;
  }
  // Begin the first solo's zoom as it enters view, not while it is above screen.
  if(plane.id==='biology-solo')return 1+.1*(1-entranceProgress(frame,26,24,4));
  // Opening is the settled loop boundary; returning strips supply their entrance.
  if(plane.group==='clipped-page')return plane.id.endsWith('closing')?1+.1*(1-entranceProgress(frame,331,29)):1;
  return 1+.1*(1-entranceProgress(frame,starts.get(plane.id)!,18));
}
/** Image scale is independent of the expanding reveal mask, centered within it. */
export function imageLayoutAt(plane:PlaneGeometry,frame:number,sectionWidth:number,sectionHeight:number){
  const expanding=isExpandingColumn(plane);
  const [left,middle,right]=railsAt(columnLayoutFrame(plane,frame)).map(rail=>rail.x);
  const width=expanding?Math.min(middle-left,right-middle)-2*COLUMN_INSET:plane.width;
  // Fit the full section width. Content masks use its native aspect ratio;
  // cropping is limited to the explicitly authored entrance zoom/reveal.
  const scale=Math.max(width/sectionWidth*imageZoomAt(plane,frame),plane.width/sectionWidth);
  return {scale,left:(plane.width-sectionWidth*scale)/2,top:(plane.height-sectionHeight*scale)/2};
}
/** Cards reach full strength while they are still travelling into place. */
export const ENTRANCE_FADE_FRAMES=15;
export function entranceOpacity(plane:PlaneGeometry,frame:number):number {
 // Page strips keep the authored wipe; they already start from no width.
 if(plane.group==='clipped-page')return 1;
 return entranceProgress(frame,starts.get(plane.id)!,ENTRANCE_FADE_FRAMES);
}
const outgoingTrack=data.instances.find(instance=>instance.id==='intentional-solo')!.tracks.y;
export const EXIT_START=85;
const exitY=evaluate(outgoingTrack,EXIT_START);
const exitVelocity=evaluate(outgoingTrack,EXIT_START)-evaluate(outgoingTrack,EXIT_START-1);
export function correctedExitY(frame:number):number {
  const elapsed=frame-EXIT_START;
  return exitY+exitVelocity*elapsed+10*elapsed*elapsed;
}
const finalPairSnapshot=new Map(motionGeometryAt(FINAL_PAIR_EXIT_START).map(plane=>[plane.id,{...plane,...stableColumnSize(plane,FINAL_PAIR_EXIT_START)}]));
const siblingExitTrack=data.instances.find(instance=>instance.id==='ingredients-isolated')!.tracks.y;
const followerExitTrack=data.instances.find(instance=>instance.id==='hero-isolated')!.tracks.y;
const EXIT_CONTINUATION=322;
const siblingExitY=(frame:number)=>{
  if(frame<=EXIT_CONTINUATION)return evaluate(siblingExitTrack,frame);
  const t=frame-EXIT_CONTINUATION;
  const velocity=evaluate(siblingExitTrack,EXIT_CONTINUATION)-evaluate(siblingExitTrack,EXIT_CONTINUATION-1);
  return evaluate(siblingExitTrack,EXIT_CONTINUATION)+velocity*t-3*t*t;
};
export function finalPairExitY(id:string,frame:number):number {
  if(id==='ingredients-isolated')return siblingExitY(frame);
  const start=FINAL_PAIR_EXIT_START+4;
  if(frame<start)return evaluate(followerExitTrack,frame);
  const velocityDifference=(evaluate(followerExitTrack,start)-evaluate(followerExitTrack,start-1))
    -(evaluate(siblingExitTrack,FINAL_PAIR_EXIT_START)-evaluate(siblingExitTrack,FINAL_PAIR_EXIT_START-1));
  return evaluate(followerExitTrack,start)+siblingExitY(frame-4)-siblingExitY(FINAL_PAIR_EXIT_START)
    +velocityDifference*(frame-start);
}
// Layout adaptation approved in review: keep the measured choreography but
// center the two-column planes within the moving rails with comfortable insets.
export const COLUMN_INSET=24;
const SOURCE_COLUMN_WIDTH=535;
const smoothstep5=(t:number)=>{const x=Math.max(0,Math.min(1,t));return x*x*x*(x*(x*6-15)+10)};
/** Clean strip reveals replace noisy measured corrections, with zero endpoint velocity. */
export function smoothStrip(plane:PlaneGeometry,frame:number):PlaneGeometry {
 if(plane.group!=='clipped-page')return plane;
 const left=plane.id.includes('left');
 const progress=plane.id.endsWith('opening')?1-smoothstep5(frame/33):smoothstep5((frame-331)/29);
 const width=(left?394:516)*progress;
 return {...plane,width,x:left?70:1046-width};
}
export function geometryAt(frame:number):PlaneGeometry[] {
  const planes=motionGeometryAt(frame).map(plane=>({
    ...smoothStrip(plane,frame),
    ...stableColumnSize(plane,frame),
    y:isFinalPair(plane)&&frame>=FINAL_PAIR_EXIT_START?finalPairExitY(plane.id,frame):plane.id==='intentional-solo'&&frame>=EXIT_START?correctedExitY(frame):plane.y,
    ...(isFinalPair(plane)&&frame>=FINAL_PAIR_EXIT_START?{width:finalPairSnapshot.get(plane.id)!.width,height:finalPairSnapshot.get(plane.id)!.height}:{}),
    opacity:isFinalPair(plane)&&frame>=FINAL_PAIR_EXIT_START?1:plane.opacity*entranceOpacity(plane,frame),
  }));
  if(frame<90)return planes.map(p=>smoothStrip(p,frame));
  for(let i=0;i<planes.length;i++)planes[i]=smoothStrip(planes[i],frame);
  return planes.map(plane=>{
    if(plane.group!=='left-column'&&plane.group!=='right-column')return plane;
    const [left,middle,right]=railsAt(columnLayoutFrame(plane,frame)).map(rail=>rail.x+.5);
    const fullWidth=Math.max(0,Math.min(middle-left,right-middle)-2*COLUMN_INSET);
    const center=plane.group==='left-column'?(left+middle)/2:(middle+right)/2;
    const scale=Math.min(1,plane.width/SOURCE_COLUMN_WIDTH);
    const width=fullWidth*scale;
    return {...plane,x:center-width/2,width};
  });
}
export const chapters=[
  {frame:0,title:'Page strips'}, {frame:30,title:'Single sections'},
  {frame:110,title:'Staggered columns'}, {frame:200,title:'Scale & drift'},
  {frame:275,title:'Second pair'}, {frame:342,title:'Return'},
];
