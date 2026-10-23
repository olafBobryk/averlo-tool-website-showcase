import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const runtime=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const temp=await mkdtemp(path.join(tmpdir(),'showcase-canvas-'));
try{
 const output=path.join(temp,'geometry.mjs');
 await build({stdin:{contents:"export {canvasSize,logicalCanvasHeight,fitPlaneToHeight} from './src/canvas';export {contentGeometryAt} from './src/content-layout';",resolveDir:runtime},bundle:true,platform:'node',format:'esm',outfile:output});
 const {canvasSize,logicalCanvasHeight,fitPlaneToHeight,contentGeometryAt}=await import(pathToFileURL(output));
 assert.deepEqual(canvasSize(),{width:2228,height:1672});
 assert.equal(logicalCanvasHeight({width:1080,height:1350}),1392.5);
 for(const canvas of [{width:1081,height:1350},{width:1080},{width:0,height:1350},{width:1080,height:8192}])assert.throws(()=>canvasSize(canvas));
 // Sample every phase at fractional source times. Cards must keep their source
 // proportions, and a complete exit must remain complete at either boundary.
 for(const height of [500,836,1392.5,1980])for(let i=0;i<=3600;i++){
  const original=contentGeometryAt(i/10),adapted=contentGeometryAt(i/10,height);
  for(let j=0;j<original.length;j++){
   const a=original[j],b=adapted[j];
   if(height===836)assert.deepEqual(b,a);
   assert.equal(a.width,b.width);assert.equal(a.x,b.x);assert.equal(a.opacity,b.opacity);
   if(a.group==='clipped-page')continue;
   assert.equal(a.height,b.height);
   if(a.y+a.height<=0)assert.ok(b.y+b.height<.00001,'incomplete top exit');
   if(a.y>=836)assert.ok(b.y>=height-.00001,'incomplete bottom exit');
  }
 }
 // Verify that entry/exit boundaries correspond to the actual new viewport,
 // including shorter frames, where simply multiplying y would cut off an exit.
 const card={id:'test',section:'test',group:'solo',x:100,y:0,width:500,height:300,opacity:1};
 for(const height of [500,1392.5,1980]){
  assert.equal(fitPlaneToHeight({...card,y:-300},height).y,-300);
  assert.equal(fitPlaneToHeight({...card,y:836},height).y,height);
 }
 console.log('Canvas checks passed: defaults, dimensions, proportions and full-height travel across every phase.');
}finally{await rm(temp,{recursive:true,force:true});}
