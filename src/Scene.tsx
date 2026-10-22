import React from 'react';
import {AbsoluteFill,useCurrentFrame} from 'remotion';
import {geometryAt,railsAt,FORMAT,PlaneGeometry,toSourceFrame} from './motion';
import {FigmaContent} from './FigmaContent';
import {resolveBackground,railColorFor,type BackgroundInput} from './background';
import {sectionForPlane,configureShowcase,type ShowcaseInput} from './sequence';
import {contentGeometryAt} from './content-layout';
export type SectionSlot = {id:string;render?:(geometry:PlaneGeometry)=>React.ReactNode};
export type SceneProps = {input?:ShowcaseInput;background?:BackgroundInput;highQuality?:boolean;contentMode?:'figma'|'blank';guides?:boolean;outline?:boolean;frameOverride?:number;sections?:SectionSlot[]};
/** The only composition renderer. Source images never enter these content slots. */
export const Scene:React.FC<SceneProps>=({input,background,highQuality=false,guides=false,outline=false,frameOverride,sections=[],contentMode='figma'})=>{
 if(input)configureShowcase(input);
 const resolvedBackground=input?{color:input.background.color,railColor:railColorFor(input.background.color)}:resolveBackground(background);
 const current=useCurrentFrame(); const frame=toSourceFrame(frameOverride??current);
 const planes=(contentMode==='figma'?contentGeometryAt(frame):geometryAt(frame)).filter(p=>contentMode==='blank'||p.group==='clipped-page'||sectionForPlane(p.id,p.section)), rails=railsAt(frame);
 return <AbsoluteFill data-scene-frame={frame} style={{background:outline?'transparent':resolvedBackground.color,overflow:'hidden'}}>
  {!outline&&<svg width={FORMAT.width} height={FORMAT.height} style={{position:'absolute',inset:0}} aria-hidden>
    {rails.map(l=><line key={l.id} x1={l.x+.5} x2={l.x+.5} y1={-l.offset} y2={840} stroke={resolvedBackground.railColor} strokeWidth={1} opacity={l.opacity} strokeDasharray={`${l.dash} ${l.gap}`}/>)}
  </svg>}
  {planes.map(p=>{
   const content=sections.find(s=>s.id===p.section)?.render?.(p);
   return <div key={p.id} data-plane={p.id} style={{position:'absolute',left:p.x,top:p.y,width:p.width,height:p.height,opacity:p.opacity,overflow:'hidden',background:!outline&&contentMode==='blank'?'#d9d9d9':'transparent',boxSizing:'border-box',outline:outline?'2px solid #8dffbf':undefined,outlineOffset:-1}}>
    {!outline&&(content??(contentMode==='figma'?<FigmaContent plane={p} frame={frame} highQuality={highQuality} image={input?.image}/>:null))}
    {guides&&!outline&&<><div style={{position:'absolute',inset:0,border:'1px solid #00aa6e'}}/><span style={{position:'absolute',left:8,top:8,fontFamily:'monospace',fontSize:13,color:'#005b3d',whiteSpace:'nowrap'}}>{p.id}</span></>}
   </div>
  })}
  {guides&&!outline&&<div style={{position:'absolute',left:14,bottom:12,fontFamily:'monospace',fontSize:14,color:'#8dffbf',background:'#111b',padding:'6px 9px'}}>f {frame.toString().padStart(3,'0')} · {(frame/30).toFixed(3)}s</div>}
 </AbsoluteFill>;
};
export const Reference:React.FC<{frameOverride?:number;overlay?:boolean}>=({frameOverride,overlay=false})=>{
 const current=useCurrentFrame();const frame=Math.floor(toSourceFrame(frameOverride??current));
 return <AbsoluteFill style={{background:'#000'}}><img alt="Original video at the current frame" src={`/reference-frames/${String(frame).padStart(3,'0')}.png`} width={1114} height={836}/>{overlay&&<Scene frameOverride={frameOverride??current} outline/>}</AbsoluteFill>;
};
