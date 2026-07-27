#!/usr/bin/env python3
from pathlib import Path
import re,sys,json
root=Path(__file__).resolve().parents[1]; errors=[]
for p in sorted((root/'rtl').rglob('*.vhd')):
 s=p.read_text();
 if '{{' in s or '}}' in s: errors.append(f'{p}: unresolved placeholder')
 if not re.search(r'end\s+(entity|architecture|rtl|\w+)\s*;',s,re.I): errors.append(f'{p}: missing end declaration')
 if s.count('(')!=s.count(')'): errors.append(f'{p}: unbalanced parentheses')
print(json.dumps({'files':len(list((root/'rtl').rglob('*.vhd'))),'errors':errors},indent=2));sys.exit(1 if errors else 0)
