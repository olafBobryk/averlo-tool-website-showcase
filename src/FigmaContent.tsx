import React from 'react';
import {Img,staticFile} from 'remotion';
import {manifest,sequence,sectionForPlane} from './sequence';
import {imageZoomAt,imageLayoutAt,type PlaneGeometry} from './motion';
/** All typography, SVGs, blur, and imagery are baked into this literal Figma PNG. */
export function FigmaContent({plane,frame,highQuality=false,image}:{plane:PlaneGeometry;frame:number;highQuality?:boolean;image?:string}){
 const pageImage=staticFile(image??(highQuality?'figma/page-flattened-2x.png':'figma/page-flattened.png'));
 const zoom=imageZoomAt(plane,frame);
 if(plane.group==='clipped-page'){
  const left=plane.section==='page-left';const fullWidth=left?394:516;
  const scale=fullWidth/manifest.width;
  const cropY=left?sequence.opening.leftY:sequence.opening.rightY;
  return <div data-page-crop={cropY} data-image-zoom={zoom} style={{position:'absolute',width:fullWidth,height:1600,left:left?0:plane.width-fullWidth,transform:`scale(${zoom})`,transformOrigin:'50% 0'}}><Img src={pageImage} style={{position:'absolute',width:manifest.width*scale,height:manifest.height*scale,top:-cropY*scale,left:0,maxWidth:'none'}}/></div>;
 }
 const section=sectionForPlane(plane.id,plane.section);if(!section)return null;
 const {scale,left,top}=imageLayoutAt(plane,frame,section.width,section.height);
 return <div data-figma-section={section.id} data-image-zoom={zoom} data-image-scale={scale} style={{position:'absolute',inset:0}}><div style={{position:'absolute',left,top,width:section.width,height:section.height,transform:`scale(${scale})`,transformOrigin:'top left',overflow:'hidden'}}><Img src={pageImage} style={{position:'absolute',width:manifest.width,height:manifest.height,left:0,top:-section.y,maxWidth:'none'}}/></div></div>;
}
