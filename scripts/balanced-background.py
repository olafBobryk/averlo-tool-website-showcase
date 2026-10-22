"""Additive weakest-section strategy; original palette renderer stays intact."""
import importlib.util
from pathlib import Path
import numpy as np
spec=importlib.util.spec_from_file_location("palette",Path(__file__).with_name("prepare-background.py"))
palette=importlib.util.module_from_spec(spec);spec.loader.exec_module(palette)
lum=palette.lum
rgb=palette.rgb

def balanced(samples,section_ids=None):
 """Maximize the weakest section's geometric-mean edge separation.

 Candidates are frequent quantized source colors. Scores describe raster edge
 separation, not text accessibility or a guarantee about every pixel.
 """
 counts={};edges=[];ids=[]
 for index,rgba in enumerate(samples):
  pixels=rgba[...,:3];alpha=rgba[...,3]>0
  q=(np.floor(pixels.astype(float)/17+.5)*17).astype(np.uint8)
  colors,numbers=np.unique(q[alpha],axis=0,return_counts=True)
  for color,count in zip(colors,numbers):
   key='#'+''.join(f'{int(v):02X}' for v in color)
   counts[key]=counts.get(key,0)+int(count)
  yy,xx=np.indices(alpha.shape);border=(xx<5)|(xx>=91)|(yy<5)|(yy>=91)
  values=pixels[alpha&border].astype(float)
  if not len(values):raise ValueError('A selected section has no visible border pixels; review its crop or transparency.')
  edges.append(lum(values));ids.append(section_ids[index] if section_ids is not None else str(index))
 if not edges:raise ValueError('Select visible sections before choosing a balanced background.')
 candidates=sorted(c for c,count in counts.items() if count>=80)
 fallback=not candidates
 if fallback:candidates=['#000000','#FFFFFF']
 ranked=[]
 for color in candidates:
  l=float(lum(rgb(color)))
  scores=[float(2**np.mean(np.log2((np.maximum(e,l)+.05)/(np.minimum(e,l)+.05)))) for e in edges]
  ranked.append({'color':color,'minimumSectionScore':min(scores),'sectionScores':dict(zip(ids,scores))})
 ranked.sort(key=lambda c:(-round(c['minimumSectionScore'],12),c['color']))
 return {'color':ranked[0]['color'],'algorithm':'balanced-v1-grid96-rgb16-min-section',
  'score':'maximize minimum section geometric-mean luminance contrast on outer 5% grid border; 12-decimal score precision; hex order breaks ties',
  'candidateMinimumSamples':80,'fallback':fallback,'candidateCount':len(ranked),
  'candidates':ranked[:5],
  'limitation':'Image edge separation only; inspect paired previews and opening before rendering. No text accessibility guarantee.'}
