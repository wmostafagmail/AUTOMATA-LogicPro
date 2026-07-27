#!/usr/bin/env python3
from pathlib import Path
import json, re, sys
root=Path(__file__).resolve().parents[2]
index=json.loads((root/'manifests/library_index.json').read_text())
errors=[]
for b in index['blocks']:
    mp=root/b['manifest']; wp=root/b['wrapper']
    if not mp.is_file(): errors.append(f'missing manifest: {mp}') ; continue
    if not wp.is_file(): errors.append(f'missing wrapper: {wp}') ; continue
    m=json.loads(mp.read_text())
    if m['block']['name'] != b['name']: errors.append(f'name mismatch: {mp}')
    text=wp.read_text()
    if not re.search(r'entity\s+'+re.escape(m['block']['wrapper_entity'])+r'\s+is',text,re.I): errors.append(f'wrapper entity mismatch: {wp}')
    if f"entity work.{m['block']['entity']}" not in text: errors.append(f'DUT missing: {wp}')
    for g in m['configuration']['generics']:
        if g['name'] not in text: errors.append(f'generic missing {g["name"]}: {wp}')
print(json.dumps({'block_count':index['block_count'],'checked':len(index['blocks']),'errors':errors[:100],'error_count':len(errors)},indent=2))
sys.exit(1 if errors else 0)
