#!/usr/bin/env python3
from pathlib import Path
import json,re,sys
root=Path(__file__).resolve().parents[1]
errors=[]
for m in sorted((root/'manifests/facades').glob('*.json')):
 d=json.loads(m.read_text()); f=list((root/'rtl/facades').rglob(d['facadeId']+'.vhd'))
 if not f: errors.append(f"{m.name}: facade VHDL missing")
 elif not re.search(rf"entity\s+{re.escape(d['facadeId'])}\s+is",f[0].read_text(),re.I):errors.append(f"{m.name}: entity mismatch")
print(json.dumps({'facades':len(list((root/'manifests/facades').glob('*.json'))),'errors':errors},indent=2));sys.exit(1 if errors else 0)
