#!/usr/bin/env python3
"""Generate a deterministic locked VHDL wrapper from a block manifest and JSON configuration."""
from __future__ import annotations
import argparse, hashlib, json, re
from pathlib import Path

def vhdl_literal(value):
    if isinstance(value, bool): return 'true' if value else 'false'
    if isinstance(value, int): return str(value)
    raise ValueError(f'Unsupported generic value: {value!r}')

def signature(entity, values):
    raw=json.dumps({'entity':entity,'configuration':values},sort_keys=True,separators=(',',':'))
    return hashlib.sha256(raw.encode()).hexdigest()[:16].upper()

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument('--manifest',required=True,type=Path)
    ap.add_argument('--config',required=True,type=Path)
    ap.add_argument('--output',required=True,type=Path)
    ap.add_argument('--entity-name')
    args=ap.parse_args()
    manifest=json.loads(args.manifest.read_text())
    request=json.loads(args.config.read_text())
    block=manifest['block']; specs={g['name']:g for g in manifest['configuration']['generics']}
    values=dict(manifest['configuration']['resolved_defaults']); values.update(request.get('generics',{}))
    unknown=sorted(set(values)-set(specs))
    if unknown: raise SystemExit(f'Unknown generics: {unknown}')
    for name,s in specs.items():
        if name not in values: raise SystemExit(f'Missing generic {name}')
        v=values[name]; typ=s['type']
        if typ=='boolean' and not isinstance(v,bool): raise SystemExit(f'{name} must be boolean')
        if typ in ('positive','natural') and (not isinstance(v,int) or isinstance(v,bool)): raise SystemExit(f'{name} must be integer')
        if typ=='positive' and v < 1: raise SystemExit(f'{name} must be >= 1')
        if typ=='natural' and v < 0: raise SystemExit(f'{name} must be >= 0')
    sig=signature(block['entity'],values)
    wrapper=args.entity_name or request.get('wrapper_entity') or f"{block['entity']}_cfg_{sig.lower()}"
    if not re.match(r'^[A-Za-z][A-Za-z0-9_]*$',wrapper): raise SystemExit('Invalid VHDL wrapper entity name')
    generics=[]
    for g in manifest['configuration']['generics']:
        generics.append(f"    {g['name']} : {g['type']} := {vhdl_literal(values[g['name']])}")
    generics += ["    G_CONFIG_SCHEMA : natural := 1", f'    G_CONFIG_ID : string := "{block["entity"].upper()}_{sig}"']
    ports=manifest['interface']['ports']
    port_lines=[f"    {p['name']} : {p['direction']} {p['type']}" for p in ports]
    assertions=['  assert G_CONFIG_SCHEMA = 1 report "Unsupported deterministic configuration schema" severity failure;']
    for g in manifest['configuration']['generics']:
        assertions.append(f"  assert {g['name']} = {vhdl_literal(values[g['name']])} report \"Locked configuration mismatch: {g['name']}\" severity failure;")
    gm=',\n'.join(f"      {g['name']} => {g['name']}" for g in manifest['configuration']['generics'])
    pm=',\n'.join(f"      {p['name']} => {p['name']}" for p in ports)
    genmap=f"\n    generic map (\n{gm}\n    )" if gm else ''
    text=f'''-- Generated deterministic wrapper. Do not edit manually.
-- Configuration ID: {block['entity'].upper()}_{sig}
library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity {wrapper} is
  generic (\n{';\n'.join(generics)}\n  );
  port (\n{';\n'.join(port_lines)}\n  );
end entity;

architecture deterministic_wrapper of {wrapper} is
begin
{chr(10).join(assertions)}
  u_block : entity work.{block['entity']}{genmap}
    port map (\n{pm}\n    );
end architecture;
'''
    args.output.parent.mkdir(parents=True,exist_ok=True); args.output.write_text(text)
    report={'wrapper_entity':wrapper,'source_entity':block['entity'],'configuration_id':f"{block['entity'].upper()}_{sig}",'resolved_generics':values,'output':str(args.output)}
    args.output.with_suffix('.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report,indent=2))
if __name__=='__main__': main()
