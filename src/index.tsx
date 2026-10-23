import React from 'react';
import {Composition,registerRoot,type CalculateMetadataFunction} from 'remotion';
import {CanvasScene} from './CanvasScene';
import {canvasSize,DEFAULT_CANVAS} from './canvas';
import {Scene,type SceneProps} from './Scene';
import {FORMAT} from './motion';
const canvasMetadata:CalculateMetadataFunction<SceneProps>=({props})=>canvasSize(props.input?.canvas);
const Root=()=> <>
 <Composition id="WebsiteShowcase" component={Scene} {...FORMAT} defaultProps={{guides:false,outline:false,contentMode:'figma'}}/>
 <Composition id="WebsiteShowcase4K" component={Scene} {...FORMAT} defaultProps={{guides:false,outline:false,contentMode:'figma',highQuality:true}}/>
 <Composition id="WebsiteShowcaseCanvas" component={CanvasScene} width={DEFAULT_CANVAS.width} height={DEFAULT_CANVAS.height} fps={FORMAT.fps} durationInFrames={FORMAT.durationInFrames} defaultProps={{guides:false,outline:false,contentMode:'figma',highQuality:true}} calculateMetadata={canvasMetadata}/>
</>;
registerRoot(Root);
