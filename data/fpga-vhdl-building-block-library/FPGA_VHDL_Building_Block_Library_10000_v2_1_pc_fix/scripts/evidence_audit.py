#!/usr/bin/env python3
from pathlib import Path
import re,csv,json,sys,hashlib
ROOT=Path(__file__).resolve().parents[1]
errors=[];warnings=[]
all_vhd=list((ROOT/'rtl').rglob('*.vhd'))+list((ROOT/'tb').rglob('*.vhd'))
entity_files={}
entity_formals={}

def clean(s):
 s=re.sub(r'--.*','',s)
 s=re.sub(r'"(?:""|[^"])*"','""',s)
 return s

def split_names(part):
 return [x.strip().lower() for x in part.split(',') if x.strip()]

def balanced_sections(body, keyword):
 # Return the contents of keyword(...), respecting nested type/function parentheses.
 out=[]
 for m in re.finditer(r'\b'+re.escape(keyword)+r'\s*\(',body,re.I):
  start=body.find('(',m.start())
  depth=0
  for i in range(start,len(body)):
   ch=body[i]
   if ch=='(': depth+=1
   elif ch==')':
    depth-=1
    if depth==0:
     out.append(body[start+1:i]);break
 return out

for p in all_vhd:
 s=p.read_text(encoding='utf-8');c=clean(s)
 if c.count('(')!=c.count(')'):errors.append(f'unbalanced parentheses: {p.relative_to(ROOT)}')
 if re.search(r'\b[a-z][a-z0-9_]*_\b',c,re.I):errors.append(f'trailing underscore identifier: {p.relative_to(ROOT)}')
 for m in re.finditer(r'entity\s+([a-z][a-z0-9_]*)\s+is\b(.*?)end\s*(?:entity(?:\s+\1)?|\1)?\s*;',c,re.I|re.S):
  name=m.group(1).lower();body=m.group(2);entity_files.setdefault(name,[]).append(str(p.relative_to(ROOT)))
  names=set()
  for sec in balanced_sections(body,'generic')+balanced_sections(body,'port'):
   for decl in sec.split(';'):
    mm=re.match(r'\s*([a-z0-9_,\s]+)\s*:',decl,re.I)
    if mm:names.update(split_names(mm.group(1)))
  entity_formals[name]=names
for name,paths in entity_files.items():
 if len(paths)>1: errors.append(f'duplicate entity {name}: {paths}')
for p in list((ROOT/'rtl').rglob('*.vhd'))+list((ROOT/'tb').rglob('*.vhd')):
 c=clean(p.read_text(encoding='utf-8'))
 for m in re.finditer(r'entity\s+work\.([a-z][a-z0-9_]*)\b(.*?)(?=;)',c,re.I|re.S):
  target=m.group(1).lower();inst=m.group(2)
  if target not in entity_files:errors.append(f'unresolved entity work.{target} in {p.relative_to(ROOT)}');continue
  formals=entity_formals.get(target,set())
  for assoc in re.findall(r'([a-z][a-z0-9_]*)\s*=>',inst,re.I):
   if assoc.lower() != 'others' and assoc.lower() not in formals: errors.append(f'unknown formal {assoc} for {target} in {p.relative_to(ROOT)}')
# Core CDC audit
cdc_files=[]
for p in (ROOT/'rtl').rglob('*.vhd'):
 s=p.read_text(encoding='utf-8').lower()
 if any(k in p.stem.lower() for k in ('cdc','async_fifo','synchronizer','edge_detector')):
  cdc_files.append(str(p.relative_to(ROOT)))
  if 'async_reg' not in s and 'async_fifo' not in p.stem.lower():warnings.append(f'CDC-named source lacks ASYNC_REG marker: {p.relative_to(ROOT)}')
blocks=list((ROOT/'rtl/blocks').rglob('*.vhd'));tbs=list((ROOT/'tb/blocks').rglob('*.vhd'))
if len(blocks)!=10000:errors.append(f'expected 10000 catalog entities, got {len(blocks)}')
if len(tbs)!=10000:errors.append(f'expected 10000 catalog TBs, got {len(tbs)}')
report={'status':'PASS' if not errors else 'FAIL','vhdl_files_scanned':len(all_vhd),'entities':len(entity_files),'catalog_blocks':len(blocks),'catalog_testbenches':len(tbs),'errors':errors[:1000],'warnings':warnings[:1000],'cdc_named_files':len(cdc_files)}
(ROOT/'reports/evidence_audit.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps({k:v for k,v in report.items() if k not in ('errors','warnings')},indent=2))
if errors:
 print('\n'.join(errors[:50]),file=sys.stderr);sys.exit(1)
