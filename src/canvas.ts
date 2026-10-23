import {FORMAT,type PlaneGeometry} from './motion';
export type CanvasSize={width:number;height:number};
export const DEFAULT_CANVAS:CanvasSize={width:2228,height:1672};
/** Even output dimensions are required by the delivered H.264/yuv420p video. */
export function canvasSize(canvas?:CanvasSize):CanvasSize {
 const size=canvas??DEFAULT_CANVAS;
 for(const key of ['width','height'] as const){
  if(!Number.isInteger(size[key])||size[key]<64||size[key]>4096||size[key]%2!==0)throw new Error(`canvas.${key} must be an even integer from 64 to 4096.`);
 }
 return size;
}
export const logicalCanvasHeight=(canvas?:CanvasSize)=>{const {width,height}=canvasSize(canvas);return height*FORMAT.width/width;};
/** Preserve image proportions and map the complete offscreen-to-offscreen travel.
 * Unlike stretching y alone, this keeps both exits complete on shorter canvases too. */
export function fitPlaneToHeight(plane:PlaneGeometry,height=FORMAT.height):PlaneGeometry {
 if(height===FORMAT.height)return plane;
 if(plane.group==='clipped-page')return {...plane,y:plane.y*height/FORMAT.height,height:Math.max(plane.height,height)};
 return {...plane,y:-plane.height+(plane.y+plane.height)*(height+plane.height)/(FORMAT.height+plane.height)};
}
