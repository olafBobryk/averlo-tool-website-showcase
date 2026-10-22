import React from 'react';
import {Composition,registerRoot} from 'remotion';
import {Scene} from './Scene';
import {FORMAT} from './motion';
const Root=()=> <>
 <Composition id="WebsiteShowcase" component={Scene} {...FORMAT} defaultProps={{guides:false,outline:false,contentMode:'figma'}}/>
 <Composition id="WebsiteShowcase4K" component={Scene} {...FORMAT} defaultProps={{guides:false,outline:false,contentMode:'figma',highQuality:true}}/>
</>;
registerRoot(Root);
