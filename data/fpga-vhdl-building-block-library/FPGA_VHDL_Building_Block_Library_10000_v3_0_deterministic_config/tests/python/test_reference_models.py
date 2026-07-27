from pathlib import Path
import sys,random,math,json,time
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'reference_models'))
from models import *
random.seed(0xB10C)
checks=0
for width in (4,8,16,32):
 for _ in range(5000):
  a=random.getrandbits(width);b=random.getrandbits(width)
  for sub in (False,True):
   r,c,o=add_sub(a,b,width,sub); exp=(a-b if sub else a+b)&mask(width);assert r==exp;checks+=1
  for direction in (0,1):
   for rotate in (0,1): barrel(a,width,random.randrange(width),direction,random.randrange(2),rotate);checks+=1
  rs,st=sat_add(a,b,width,True);assert 0<=rs<=mask(width);checks+=1
for inputs in (2,4,8,16,32):
 for req in range(min(1<<inputs,4096)):
  v,i,oh=priority(req,inputs,True);assert (oh==0)==(not v);checks+=1
for _ in range(10000):
 width=random.choice((8,16,32));a=random.getrandbits(width);b=random.getrandbits(width)
 q,r,z=udiv(a,b,width);assert z or q*b+r==a;checks+=1
 root,rem=isqrt(a);assert root*root+rem==a and (root+1)*(root+1)>a;checks+=1
for _ in range(10000):
 v=random.getrandbits(24);y,ov=fixed_rescale(v,24,16,8);assert 0<=y<65536;checks+=1
assert crc_msb(b'1',16,0x1021,0xFFFF)==0xC782;checks+=1
v=1
seen=set()
for _ in range(255):seen.add(v);v=lfsr_step(v,8,0xB8)
assert len(seen)==255 and v==1;checks+=1
seq=[4,8,12,16,20];assert moving_average(seq,4)==[4,6,8,10,14];checks+=1
report={'status':'PASS','checks':checks,'seed':'0xB10C','scope':'Python bit-exact reference models; not VHDL simulation'}
(ROOT/'reports/reference_model_test_report.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report))
