"""Create original sample pixels; no downloaded media or font files required."""
import cv2, numpy as np, hashlib, json
from pathlib import Path
root=Path(__file__).resolve().parent.parent/'sample'
page=np.zeros((5600,1440,3),np.uint8)
colors=[(54,68,36),(228,235,243),(203,215,191),(180,201,226),(66,51,58),(223,224,238),(44,56,71)]
for i,color in enumerate(colors):
 y=i*800;page[y:y+800]=color
 light=sum(color)<300; ink=(242,244,238) if light else (35,42,33)
 cv2.putText(page, f'AVERLO / SAMPLE {i+1:02}', (80,y+100), cv2.FONT_HERSHEY_SIMPLEX,1.5,ink,3)
 cv2.putText(page,['A different perspective','Make something move','Built for your ideas','Less setup. More making.','Your work in motion','Start with a sample','Make it yours'][i],(80,y+220),cv2.FONT_HERSHEY_SIMPLEX,1.5,ink,3)
 for j in range(3):
  x=80+j*430;cv2.rectangle(page,(x,y+300),(x+370,y+690),ink,3)
  cv2.circle(page,(x+185,y+470),85,(int(color[0]*.6+50),int(color[1]*.5+70),int(color[2]*.6+60)),-1)
  cv2.line(page,(x+40,y+610),(x+300,y+610),ink,5)
_,encoded=cv2.imencode('.png',page);raw=encoded.tobytes();(root/'image-0').write_bytes(raw)
request=json.loads((root/'request.json').read_text());request['images']=[{'sha256':hashlib.sha256(raw).hexdigest(),'width':1440,'height':5600}];(root/'request.json').write_text(json.dumps(request,indent=2)+'\n')
