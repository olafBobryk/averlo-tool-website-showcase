import {logicalCanvasHeight,type CanvasSize} from './canvas';
import baselineManifest from './section-manifest.json';
export let manifest=baselineManifest;
export type PageSection={id:string;order:number;x:number;y:number;width:number;height:number;background:string};
/** Content-independent sequence. Section discovery is reviewed at import time. */
export function createSequence(sections:PageSection[],pageWidth:number){
  if(sections.length<2)throw new Error('Showcase needs at least two distinct sections.');
  const ordered=[...sections].sort((a,b)=>a.y-b.y||a.x-b.x);
  const at=(i:number)=>ordered[i%ordered.length];
  const rightSourceEnd=(836-91)/(516/pageWidth);
  const leftStart=ordered.find(s=>s.y>=rightSourceEnd);
  if(!leftStart)throw new Error('The page needs a distinct lower passage for the opening strips.');
  const columns=Array.from({length:Math.min(7,ordered.length)},(_,i)=>at(3+i));
  const leftCount=Math.min(4,Math.ceil(columns.length/2));
  const left=columns.slice(0,leftCount),right=columns.slice(leftCount);
  return {ordered,opening:{rightY:0,leftY:leftStart.y,rightSourceEnd},solo:[at(1),at(2)],columns:{left,right},pairs:[[at(3),at(4)],[at(5),at(0)]]};
}
export let sequence=createSequence(manifest.sections,manifest.width);
// Names here identify legacy motion tracks, never semantic selection criteria.
let bindings:Record<string,PageSection|undefined>={
  biology:sequence.solo[0],intentional:sequence.solo[1],
  connected:sequence.columns.left[0],rhythm:sequence.columns.left[1],
  ingredients:sequence.columns.left[2],protocol:sequence.columns.left[3],
  formulation:sequence.columns.right[0],footer:sequence.columns.right[1],hero:sequence.columns.right[2],
};
export function sectionForPlane(instance:string,slot:string){
  if(instance==='connected-isolated')return sequence.pairs[0][0];
  if(instance==='rhythm-isolated')return sequence.pairs[0][1];
  if(instance==='ingredients-isolated')return sequence.pairs[1][0];
  if(instance==='hero-isolated')return sequence.pairs[1][1];
  return bindings[slot];
}
export type ShowcaseInput={canvas?:CanvasSize;manifest:typeof baselineManifest;shots:{opening:{leftY:number;rightY:number};solo:[string,string];columns:{left:string[];right:string[]};pairs:[[string,string],[string,string]]};image:string;background:{color:string}};
export function configureShowcase(input:ShowcaseInput){
 manifest=input.manifest;
 const height=logicalCanvasHeight(input.canvas);
 const lookup=(id:string)=>{const s=manifest.sections.find(s=>s.id===id);if(!s)throw new Error('Unknown section '+id);return s;};
 sequence={ordered:manifest.sections,opening:{...input.shots.opening,rightSourceEnd:input.shots.opening.rightY+(height-91*height/836)/(516/manifest.width)},solo:input.shots.solo.map(lookup),columns:{left:input.shots.columns.left.map(lookup),right:input.shots.columns.right.map(lookup)},pairs:input.shots.pairs.map(pair=>pair.map(lookup))};
 bindings={biology:sequence.solo[0],intentional:sequence.solo[1],connected:sequence.columns.left[0],rhythm:sequence.columns.left[1],ingredients:sequence.columns.left[2],protocol:sequence.columns.left[3],formulation:sequence.columns.right[0],footer:sequence.columns.right[1],hero:sequence.columns.right[2]};
}
