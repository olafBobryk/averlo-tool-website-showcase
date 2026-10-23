import motionData from './motion-data.json';
import {fitPlaneToHeight} from './canvas';
import {geometryAt,railsAt,COLUMN_INSET,smoothTravel,type PlaneGeometry} from './motion';
import {sectionForPlane,sequence} from './sequence';
/** Keep the choreography's widths, but let the actual section determine height. */
function nativeGeometryAt(frame:number):PlaneGeometry[]{
 const rails=railsAt(frame);
 const columnWidth=Math.min(rails[1].x-rails[0].x,rails[2].x-rails[1].x)-2*COLUMN_INSET;
 return geometryAt(frame).map(plane=>{
  if(plane.group==='clipped-page')return plane;
  const section=sectionForPlane(plane.id,plane.section);
  if(!section)return plane;
  let offset=0;
  if(plane.id.endsWith('-grid')){
   const siblings=plane.group==='left-column'?sequence.columns.left:sequence.columns.right;
   const index=siblings.findIndex(s=>s.id===section.id);
   // Include preceding sections even once their motion instances leave the screen.
   // Otherwise removing a preceding card would make the remaining stack jump.
   offset=siblings.slice(0,index).reduce((sum,s)=>sum+columnWidth*s.height/s.width-302,0);
  }
  return {...plane,y:plane.y+offset,height:plane.width*section.height/section.width};
 });
}

const ends=new Map(motionData.instances.map(p=>[p.id,p.last+.5]));
const pairedIds=['ingredients-isolated','hero-isolated'];
/** Native-sized cards clear the viewport through continuous, complete exits. */
export function contentGeometryAt(frame:number,viewportHeight=836):PlaneGeometry[]{
 return nativeGeometryAt(frame).map(plane=>{
  if(plane.group==='clipped-page')return plane;
  const paired=pairedIds.includes(plane.id);
  if(paired){
   const start=plane.id===pairedIds[0]?310:314;
   if(frame<start)return plane;
   const initial=nativeGeometryAt(start).find(p=>p.id===plane.id)!;
   const siblings=pairedIds.map((id,i)=>nativeGeometryAt(310+i*4).find(p=>p.id===id)!);
   const travel=-Math.max(...siblings.map(p=>p.y+p.height))-2;
   const leader=siblings[0];
   const next=nativeGeometryAt(310.001).find(p=>p.id===pairedIds[0])!;
   const delta=smoothTravel((frame-start)/16.5,0,travel,(next.y-leader.y)/.001,travel/16.5,16.5);
   return {...plane,y:initial.y+delta};
  }
  const end=ends.get(plane.id)!;
  const start=end-18;
  if(frame<start)return plane;
  const initial=nativeGeometryAt(start).find(p=>p.id===plane.id)!;
  const next=nativeGeometryAt(start+.001).find(p=>p.id===plane.id)!;
  const final=nativeGeometryAt(end).find(p=>p.id===plane.id)!;
  const target=final.y<initial.y?-final.height-2:838;
  const velocity=(next.y-initial.y)/.001;
  return {...plane,y:smoothTravel((frame-start)/18,initial.y,target,velocity,(target-initial.y)/18,18)};
 }).map(plane=>fitPlaneToHeight(plane,viewportHeight));
}
