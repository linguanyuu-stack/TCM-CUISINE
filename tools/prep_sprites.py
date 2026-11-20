import numpy as np, cv2, json, shutil
from PIL import Image, ImageDraw
# sprite selection: name -> cut file
SEL={'shan':'s2_r0c0','shan2':'s2_r0c2','zao_cup':'s2_r1c1','zao_wave':'s2_r1c2','zao_pour':'s2_r1c0',
'di_sleep':'s2_r2c1','di_stretch':'s2_r2c2','di_yawn':'s2_r2c0',
'gui_cup':'s3_r1c1','ma_cheer':'s3_r2c0','ma_sit':'s3_r2c2','ma_sleep':'s3_r2c1',
'qi_run':'s4_r0c0','qi_jump':'s4_r0c1','qi2_stir':'s4_r1c0','qi2_tray':'s4_r1c2','dou_ref':'s4_r2c0'}
for k,v in SEL.items(): shutil.copy('cut/%s.png'%v,'assets/%s.png'%k)
# 烏烏 arm removal
im=np.array(Image.open('cut/s3_r0c1.png')).astype(np.uint8)
h,w,_=im.shape
poly=np.array([(316,141),(334,136),(352,139),(362,150),(361,168),(351,176),(339,179),(331,189),(316,193),(302,187),(298,172),(304,157)],np.int32)
hole=np.zeros((h,w),np.uint8); cv2.fillPoly(hole,[poly],255); hole=cv2.dilate(hole,np.ones((3,3),np.uint8))
yy,xx=np.mgrid[0:h,0:w]
P1=np.array([298,166.]);P2=np.array([366,186.]); d=P2-P1
cross=d[0]*(yy-P1[1])-d[1]*(xx-P1[0])
inside=cross>0
rgb=im[:,:,:3].copy(); a=im[:,:,3].copy()
rgb[a<20]=(150,62,52)
rgb=cv2.inpaint(rgb,hole,6,cv2.INPAINT_TELEA)
hm=hole>0
a[hm&~inside]=0
a[hm&inside]=255
# outline along cut
dist=np.abs(cross)/np.hypot(*d)
gold=hm&inside&(dist<4.5)&(dist>=1.8)
rgb[gold]=(222,158,62)
edge=hm&inside&(dist<1.8)
rgb[edge]=(92,44,20)
a[hm&inside&(dist<0.8)]=200
out=np.dstack([rgb,a])
Image.fromarray(out,'RGBA').save('assets/wu_body.png')
Image.open('cut/s3_r0c1.png').save('assets/wu_orig.png')
# texture swatch
Image.fromarray(np.array(Image.open('cut/s3_r0c1.png'))[205:255,150:250,:3]).save('assets/wu_tex.png')
