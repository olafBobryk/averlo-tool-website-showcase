"""Color-aware image-presence checks, including rails-only failed captures."""
import cv2
import numpy as np

def inspect_frame(image,background,expected=None):
 h,w=image.shape[:2]
 bg=tuple(int(background[i:i+2],16) for i in (5,3,1))
 different=cv2.bitwise_not(cv2.inRange(image,tuple(max(0,c-30) for c in bg),tuple(min(255,c+30) for c in bg)))
 if int(image.max())-int(image.min())<8:return 'solid-color capture'
 if expected is not None:
  mask=np.zeros((h,w),dtype=np.uint8);sx=w/1114;sy=h/836
  for p in expected['planes']:
   if p['opacity']<.2:continue
   x0=max(0,int(np.ceil(p['x']*sx)));x1=min(w,int(np.floor((p['x']+p['width'])*sx)))
   y0=max(0,int(np.ceil(p['y']*sy)));y1=min(h,int(np.floor((p['y']+p['height'])*sy)))
   if x1>x0 and y1>y0:mask[y0:y1,x0:x1]=255
  for x in expected['rails']:
   mask[:,max(0,int((x-3)*sx)):min(w,int((x+4)*sx))]=0
  area=cv2.countNonZero(mask)
  if area>10000*sx*sy and cv2.countNonZero(cv2.bitwise_and(different,mask))<max(100*sx*sy,area*.002):
   return 'expected image content missing'
 return None
