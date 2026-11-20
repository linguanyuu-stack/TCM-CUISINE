import numpy as np, cv2, glob, os
from PIL import Image
from scipy import ndimage as ndi
def cut(path, out):
    im=np.asarray(Image.open(path).convert('RGB')).astype(np.float32)
    h,w,_=im.shape
    border=np.concatenate([im[:6].reshape(-1,3),im[-6:].reshape(-1,3),im[:,:6].reshape(-1,3),im[:,-6:].reshape(-1,3)])
    bg=np.median(border,0)
    d=np.sqrt(((im-bg)**2).sum(2))
    ds=np.sqrt(((im-np.array([238,184,130.]))**2).sum(2))
    m=d>78
    m=ndi.binary_opening(m,iterations=1)
    m=ndi.binary_closing(m,iterations=4)
    m=ndi.binary_fill_holes(m)
    lab,n=ndi.label(m); sizes=ndi.sum(m,lab,range(1,n+1)); big=np.argmax(sizes)+1
    keep=np.zeros_like(m)
    for i,s in enumerate(sizes):
        if s>0.04*sizes[big-1]: keep|=lab==(i+1)
    ys,_=np.where(keep); ybot=ys.max(); ytop=ys.min()
    band=np.zeros_like(m); band[int(ybot-0.2*(ybot-ytop)):]=True
    shad=keep&(ds<60)&band
    outside=~keep
    lab2,n2=ndi.label(shad)
    touch=ndi.binary_dilation(outside,iterations=2)
    for i in range(1,n2+1):
        c=lab2==i
        if (c&touch).any(): keep&=~c
    keep=ndi.binary_opening(keep,iterations=1)
    lab,n=ndi.label(keep); sizes=ndi.sum(keep,lab,range(1,n+1)); big=np.argmax(sizes)+1
    k2=np.zeros_like(keep)
    for i,s in enumerate(sizes):
        if s>0.04*sizes[big-1]: k2|=lab==(i+1)
    keep=ndi.binary_fill_holes(k2)
    a=(keep*255).astype(np.uint8)
    a=cv2.erode(a,np.ones((2,2),np.uint8)); a=cv2.GaussianBlur(a,(3,3),0)
    ys,xs=np.where(a>8)
    y0,y1,x0,x1=ys.min(),ys.max()+1,xs.min(),xs.max()+1
    Image.fromarray(np.dstack([im.astype(np.uint8),a])[y0:y1,x0:x1],'RGBA').save(out)
os.makedirs('cut',exist_ok=True)
for p in sorted(glob.glob('cells/*.png')): cut(p,'cut/'+os.path.basename(p))
fs=sorted(glob.glob('cut/*.png'))
W=Image.new('RGB',(9*260,3*300),(60,110,90))
for i,f in enumerate(fs):
    im=Image.open(f); im.thumbnail((250,290)); W.paste(im,((i%9)*260+5,(i//9)*300+5),im)
W.save('cutsheet.png')
