#!/usr/bin/env python3
from pathlib import Path
import csv, re, sys
root=Path(__file__).resolve().parents[1]
blocks=list((root/'rtl/blocks').rglob('*.vhd'))
tbs=list((root/'tb/blocks').rglob('*.vhd'))
cores={p.stem for p in (root/'rtl/cores').glob('*.vhd')}
errors=[]
if len(blocks)!=3600: errors.append(f'block count {len(blocks)} != 3600')
if len(tbs)!=3600: errors.append(f'testbench count {len(tbs)} != 3600')
seen=set()
for p in blocks:
    s=p.read_text(encoding='utf-8')
    m=re.search(r'entity\s+([a-z0-9_]+)\s+is',s,re.I)
    a=re.search(r'architecture\s+rtl\s+of\s+([a-z0-9_]+)\s+is',s,re.I)
    if not m or not a: errors.append(f'missing design unit: {p}'); continue
    if m.group(1).lower()!=p.stem.lower() or a.group(1).lower()!=p.stem.lower(): errors.append(f'name mismatch: {p}')
    if p.stem in seen: errors.append(f'duplicate entity: {p.stem}')
    seen.add(p.stem)
    for ref in re.findall(r'entity\s+work\.([a-z0-9_]+)',s,re.I):
        if ref not in cores: errors.append(f'unresolved core {ref} in {p}')
    if 'TODO' in s or 'FIXME' in s: errors.append(f'placeholder marker in {p}')
    if re.search(r'\b[a-zA-Z][a-zA-Z0-9_]*_\b', s): errors.append(f'illegal trailing underscore identifier in {p}')
for p in tbs:
    s=p.read_text(encoding='utf-8')
    expected=p.stem[3:]
    if not re.search(rf'entity\s+work\.{re.escape(expected)}\b',s,re.I):
        errors.append(f'TB does not instantiate DUT {expected}: {p}')
    if not re.search(rf'entity\s+{re.escape(p.stem)}\s+is',s,re.I):
        errors.append(f'TB entity mismatch: {p}')
    if re.search(r'\b[a-zA-Z][a-zA-Z0-9_]*_\b', s): errors.append(f'illegal trailing underscore identifier in {p}')
    # A signal declaration after architecture begin is a common generator error.
    arch=re.search(r'architecture\s+sim\s+of\s+\w+\s+is(?P<decl>.*?)\bbegin\b(?P<body>.*)end\s+architecture',s,re.I|re.S)
    if not arch: errors.append(f'malformed TB architecture: {p}')
    elif re.search(r'(^|;)\s*signal\s+\w+',arch.group('body'),re.I|re.M): errors.append(f'signal declaration after begin: {p}')
with (root/'reports/verification_matrix.csv').open(newline='',encoding='utf-8') as f:
    rows=list(csv.DictReader(f))
if len(rows)!=3600: errors.append(f'manifest rows {len(rows)} != 3600')
if errors:
    print('\n'.join(errors));sys.exit(1)
print(f'PASS: {len(blocks)} block files, {len(tbs)} instantiated-DUT TBs, {len(cores)} cores, {len(rows)} manifest rows')
