"""Decode bounded raster inputs and produce literal page + preparation evidence."""
import sys,json,hashlib,importlib.util
from pathlib import Path
import cv2,numpy as np
root=Path(sys.argv[1]); request=json.loads((root/'request.json').read_text())
(root/'evidence').mkdir(exist_ok=True)
images=[]; records=[]
for i,item in enumerate(request['images']):
 raw=(root/f'image-{i}').read_bytes()
 if hashlib.sha256(raw).hexdigest()!=item['sha256']:raise ValueError('Image hash changed; upload the original again.')
 # Header dimensions were checked by the service; decode and verify independently.
 image=cv2.imdecode(np.frombuffer(raw,np.uint8),cv2.IMREAD_UNCHANGED)
 if image is None or image.ndim!=3 or image.shape[2] not in [3,4]:raise ValueError('Upload an RGB or RGBA PNG/JPEG image.')
 h,w=image.shape[:2]
 if w!=item['width'] or h!=item['height']:raise ValueError('Measured image dimensions do not match the upload declaration.')
 if w*h>100_000_000:raise ValueError('Image exceeds 100 megapixels.')
 image=cv2.cvtColor(image,cv2.COLOR_BGR2BGRA) if image.shape[2]==3 else image
 images.append(image);records.append({'sha256':item['sha256'],'width':w,'height':h})
if request['mode']=='sections':
 width=max(im.shape[1] for im in images);height=sum(round(im.shape[0]*width/im.shape[1]) for im in images)
 if width*height>100_000_000:raise ValueError('Assembled page exceeds 100 megapixels; use smaller exports.')
 arrays=[];bands=[];top=0
 for i,im in enumerate(images):
  h=round(im.shape[0]*width/im.shape[1]);arrays.append(cv2.resize(im,(width,h),interpolation=cv2.INTER_LANCZOS4) if im.shape[1]!=width else im)
  bands.append({'id':f'S{i+1}','order':i,'x':0,'y':top,'width':width,'height':h,'background':'source','rationale':'Supplied section image; order preserved.','uncertainty':''});top+=h
 page=np.concatenate(arrays);logical={'width':width,'height':height};sections=bands
else:
 page=images[0];logical=request['page'];sections=request['sections']
height,width=page.shape[:2];sx=width/logical['width'];sy=height/logical['height']
cv2.imwrite(str(root/'page.png'),page)
# Literal source crops used for evidence and the unchanged palette algorithm.
spec=importlib.util.spec_from_file_location('palette',Path(__file__).with_name('prepare-background.py'));palette=importlib.util.module_from_spec(spec);spec.loader.exec_module(palette)
selected=set(request['shots']['solo']+request['shots']['columns']['left']+request['shots']['columns']['right']+sum(request['shots']['pairs'],[]))
samples=[];balanced_samples=[];balanced_ids=[];crops={};tiles=[]
# Match the source-coordinate viewport spans in sequence.ts and contracts.ts.
# Include every intersecting section in the balanced strategy without changing palette-v1.
opening=request['shots']['opening']
opening_spans=[(opening['leftY'],836/(394/logical['width'])),(opening['rightY'],(836-91)/(516/logical['width']))]
balanced_selected=selected|{s['id'] for s in sections if any(s['y']<y+span and s['y']+s['height']>y for y,span in opening_spans)}
overlay=page.copy()
for s in sections:
 y0=round(s['y']*sy);y1=round((s['y']+s['height'])*sy)
 if y0<0 or y1>height or y1<=y0:raise ValueError('Section crop is outside the image.')
 crop=page[y0:y1];crops[s['id']]=crop
 cv2.line(overlay,(0,y0),(width-1,y0),(60,80,250,255),max(2,round(width/500)))
 cv2.putText(overlay,s['id'],(12,y0+min(50,y1-y0-2)),cv2.FONT_HERSHEY_SIMPLEX,max(.7,width/1800),(60,80,250,255),2)
 h=max(1,round(crop.shape[0]*360/width));tile=cv2.resize(crop,(360,h),interpolation=cv2.INTER_AREA)
 label=np.full((32,360,4),255,np.uint8);cv2.putText(label,s['id'],(8,23),cv2.FONT_HERSHEY_SIMPLEX,.65,(0,0,0,255),1);tiles.append(np.concatenate([label,tile]))
 if s['id'] in balanced_selected:
  xs=np.floor((np.arange(96)+.5)*s['width']/96*sx).astype(int);ys=np.floor((s['y']+(np.arange(96)+.5)*s['height']/96)*sy).astype(int)
  sample=cv2.cvtColor(page[ys[:,None],xs[None,:]],cv2.COLOR_BGRA2RGBA)
  balanced_samples.append(sample);balanced_ids.append(s['id'])
  if s['id'] in selected:samples.append(sample)
for pair in request['shots']['pairs']:
 a,b=[crops[k] for k in pair]
 if a.shape==b.shape and np.array_equal(a,b):raise ValueError('Paired shots contain identical pixels. Select visually different sections.')
palette_decision=palette.palette(samples)
b=request['background'];balanced_decision=None
if b['mode']=='auto-balanced':
 spec=importlib.util.spec_from_file_location('balanced',Path(__file__).with_name('balanced-background.py'));balanced=importlib.util.module_from_spec(spec);spec.loader.exec_module(balanced)
 balanced_decision=balanced.balanced(balanced_samples,balanced_ids)
if balanced_decision:
 balanced_decision['pairScores']=[{'sections':pair,'minimumSectionScore':min(balanced_decision['candidates'][0]['sectionScores'][k] for k in pair)} for pair in request['shots']['pairs']]
color=b.get('override') or (balanced_decision['color'] if b['mode']=='auto-balanced' else palette_decision['color'] if b['mode']=='auto-palette' else b['contrast']['color'])
cv2.imwrite(str(root/'evidence/boundaries.png'),cv2.resize(overlay,(min(1200,width),round(height*min(1200,width)/width)),interpolation=cv2.INTER_AREA))
cv2.imwrite(str(root/'evidence/sections.png'),np.concatenate(tiles))
for i,pair in enumerate(request['shots']['pairs']):
 parts=[cv2.resize(crops[k],(500,round(crops[k].shape[0]*500/width)),interpolation=cv2.INTER_AREA) for k in pair]
 bg=tuple(int(color[j:j+2],16) for j in (5,3,1))+(255,);canvas=np.full((max(p.shape[0] for p in parts)+48,1072,4),bg,np.uint8)
 for x,p in zip([24,548],parts):canvas[24:24+p.shape[0],x:x+500]=p
 cv2.imwrite(str(root/f'evidence/pair-{i+1}.png'),canvas)
result={'manifest':{**logical,'sections':sections},'shots':request['shots'],'image':'page.png','background':{'color':color.upper(),'input':b,'palette':palette_decision,**({'balanced':balanced_decision} if balanced_decision else {})},'mapping':{'rasterWidth':width,'rasterHeight':height,'scaleX':sx,'scaleY':sy},'images':records,'coverage':request.get('coverage',[]),'omissions':request.get('omissions',[]),'review':request['review'],'pageHash':hashlib.sha256((root/'page.png').read_bytes()).hexdigest()}
(root/'prepared.json').write_text(json.dumps(result,indent=2)+'\n')
