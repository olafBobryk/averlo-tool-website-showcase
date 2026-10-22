"""Preparation only: deterministic palette choice from actual selected section pixels."""
import argparse,colorsys,hashlib,json,math
from pathlib import Path
import cv2
import numpy as np

def rgb(hex): return np.array([int(hex[i:i+2],16) for i in (1,3,5)],dtype=float)
def lum(values):
 c=values/255.;c=np.where(c<=.04045,c/12.92,((c+.055)/1.055)**2.4)
 return c@np.array([.2126,.7152,.0722])
def palette(samples):
 bins=[0]*12;edges=[]
 for rgba in samples:
  pixels=rgba[...,:3];alpha=rgba[...,3]>0
  # 16 RGB levels; explicit round-half-up, no random state or image library resize.
  q=np.floor(pixels.astype(float)/17+.5)*17
  for r,g,b in q[alpha]/255:
   h,l,s=colorsys.rgb_to_hls(r,g,b)
   if s>=.15:bins[min(11,int(h*12))]+=1
  yy,xx=np.indices(alpha.shape);border=(xx<5)|(xx>=91)|(yy<5)|(yy>=91)
  values=pixels[alpha&border].astype(float)
  if len(values):edges.append(lum(values))
 if not edges:raise ValueError('No visible section border pixels for contrast scoring')
 if sum(bins):
  index=max(range(12),key=lambda i:bins[i]);h=(index+.5)/12
  candidates=['#'+''.join(f'{math.floor(v*255+.5):02X}' for v in colorsys.hls_to_rgb(h,l,.16)) for l in [.08,.96]]
 else:index=None;candidates=['#000000','#FFFFFF']
 scores=[]
 for color in candidates:
  l=float(lum(rgb(color)))
  scores.append(float(np.mean([np.mean(np.log2((np.maximum(e,l)+.05)/(np.minimum(e,l)+.05))) for e in edges])))
 winner=0 if scores[0]>=scores[1] or scores[1]-scores[0]<=.05*max(scores) else 1
 return {'color':candidates[winner],'algorithm':'palette-v1-grid96-rgb16-hue12','hueHistogram':bins,'hueBin':index,'candidates':[{'color':c,'score':round(s,12)} for c,s in zip(candidates,scores)],'score':'equal-section mean log2 luminance contrast on outer 5% grid border; dark within 5%'}

def main():
 p=argparse.ArgumentParser();p.add_argument('--model-color');p.add_argument('--rationale-file');p.add_argument('--default-mode',choices=['auto-contrast','auto-palette'],default='auto-contrast');p.add_argument('--override');a=p.parse_args()
 root=Path(__file__).resolve().parent.parent
 source=root/'public/figma/page-flattened-2x.png';selection=json.loads((root/'working/background-selection.json').read_text())
 image=cv2.imread(str(source),cv2.IMREAD_UNCHANGED)
 if image is None:raise ValueError('Missing literal HQ PNG')
 image=cv2.cvtColor(image,cv2.COLOR_BGRA2RGBA if image.shape[2]==4 else cv2.COLOR_BGR2RGBA)
 h,w=image.shape[:2];sx=w/selection['width'];sy=h/selection['height'];samples=[]
 for s in selection['sections']:
  xs=np.floor((s['x']+(np.arange(96)+.5)*s['width']/96)*sx).astype(int)
  ys=np.floor((s['y']+(np.arange(96)+.5)*s['height']/96)*sy).astype(int)
  if xs.min()<0 or xs.max()>=w or ys.min()<0 or ys.max()>=h:raise ValueError('Section crop outside PNG')
  samples.append(image[ys[:,None],xs[None,:]])
 model=None
 if a.model_color:
  if a.model_color.upper() not in ['#000000','#FFFFFF']:raise ValueError('Model choice must be black or white')
  if not a.rationale_file:raise ValueError('Model choice requires a visual rationale file')
  rationale=Path(a.rationale_file).read_text().strip()
  if not rationale:raise ValueError('Empty model rationale')
  model={'color':a.model_color.upper(),'method':'agent visual inspection at input preparation','rationale':rationale,'preference':'dark when separation is comparable'}
 if a.override and (len(a.override)!=7 or a.override[0]!='#' or any(c not in '0123456789abcdefABCDEF' for c in a.override[1:])):raise ValueError('Invalid override')
 if a.default_mode=='auto-contrast' and not model and not a.override:raise ValueError('Provide inspected model decision or explicit override')
 result={'schemaVersion':1,'defaultInput':{'mode':a.default_mode,**({'override':a.override.upper()} if a.override else {})},'source':{'path':str(source.relative_to(root)),'sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'rasterWidth':w,'rasterHeight':h},'manifestSha256':hashlib.sha256((root/'src/section-manifest.json').read_bytes()).hexdigest(),'sequenceSha256':hashlib.sha256((root/'src/sequence.ts').read_bytes()).hexdigest(),'selection':selection,'decisions':{'auto-contrast':model,'auto-palette':palette(samples)}}
 for name in ['src/background-prepared.json','references/figma/background-decisions.json']:
  dest=root/name;dest.parent.mkdir(parents=True,exist_ok=True);dest.write_text(json.dumps(result,indent=2)+'\n')
 print(json.dumps({k:v and v['color'] for k,v in result['decisions'].items()}))
if __name__=='__main__':main()
