import React from 'react';
import {AbsoluteFill,useVideoConfig} from 'remotion';
import {Scene,type SceneProps} from './Scene';
import {FORMAT} from './motion';
/** All phases share one viewport; the source image is always scaled uniformly. */
export const CanvasScene:React.FC<SceneProps>=(props)=>{
 const {width,height}=useVideoConfig(),scale=width/FORMAT.width;
 return <AbsoluteFill style={{overflow:'hidden'}}><div style={{position:'absolute',width:FORMAT.width,height:height/scale,transform:`scale(${scale})`,transformOrigin:'top left'}}><Scene {...props} viewportHeight={height/scale}/></div></AbsoluteFill>;
};
