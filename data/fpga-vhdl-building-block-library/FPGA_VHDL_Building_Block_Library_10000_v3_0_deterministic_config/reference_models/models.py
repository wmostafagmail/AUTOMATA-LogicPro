from __future__ import annotations

def mask(width:int)->int: return (1<<width)-1

def to_signed(v:int,width:int)->int:
    v &= mask(width)
    return v-(1<<width) if v&(1<<(width-1)) else v

def add_sub(a:int,b:int,width:int,subtract:bool,signed_mode:bool=False):
    m=mask(width); raw=(a-b if subtract else a+b); result=raw&m
    carry_borrow = int((a&m)<(b&m)) if subtract else int(raw>m)
    sa,sb,sr=to_signed(a,width),to_signed(b,width),to_signed(result,width)
    overflow=int(((sa<0)==(sb<0) and (sr<0)!=(sa<0)) if not subtract else ((sa<0)!=(sb<0) and (sr<0)!=(sa<0)))
    return result,carry_borrow,overflow

def barrel(v:int,width:int,n:int,direction:int,arithmetic:int,rotate:int)->int:
    m=mask(width);v&=m;n%=width
    if rotate:
        return (((v<<n)|(v>>(width-n))) if direction==0 else ((v>>n)|(v<<(width-n))))&m if n else v
    if direction==0:return (v<<n)&m
    if arithmetic:return (to_signed(v,width)>>n)&m
    return v>>n

def priority(req:int,inputs:int,high=True):
    rng=range(inputs-1,-1,-1) if high else range(inputs)
    for i in rng:
        if req>>i&1:return True,i,1<<i
    return False,0,0

def sat_add(a:int,b:int,width:int,signed_mode=True):
    if signed_mode:
        x=to_signed(a,width)+to_signed(b,width);lo=-(1<<(width-1));hi=(1<<(width-1))-1
        sat=x<lo or x>hi;x=min(max(x,lo),hi);return x&mask(width),sat
    x=(a&mask(width))+(b&mask(width));sat=x>mask(width);return min(x,mask(width)),sat

def lfsr_step(v:int,width:int,poly:int)->int:
    lsb=v&1;v>>=1
    if lsb:v^=poly
    return v&mask(width)

def crc_msb(data:bytes,width:int,poly:int,init:int)->int:
    c=init&mask(width)
    for byte in data:
        for bit in range(7,-1,-1):
            fb=((c>>(width-1))&1)^((byte>>bit)&1);c=(c<<1)&mask(width)
            if fb:c^=poly
    return c

def udiv(a:int,b:int,width:int):
    if b==0:return mask(width),a&mask(width),True
    return (a&mask(width))//(b&mask(width)),(a&mask(width))%(b&mask(width)),False

def isqrt(x:int):
    import math
    r=math.isqrt(x);return r,x-r*r

def fixed_rescale(v:int,in_width:int,out_width:int,shift:int,round_nearest=True,saturate=True):
    x=to_signed(v,in_width)
    if round_nearest and shift:
        x += (1<<(shift-1)) if x>=0 else -(1<<(shift-1))
    x >>= shift
    lo=-(1<<(out_width-1));hi=(1<<(out_width-1))-1;ov=x<lo or x>hi
    if saturate:x=min(max(x,lo),hi)
    return x&mask(out_width),ov

def moving_average(samples,window):
    out=[];hist=[]
    for x in samples:
        hist.append(x)
        if len(hist)>window:hist.pop(0)
        out.append(int(sum(hist)/len(hist)))
    return out
