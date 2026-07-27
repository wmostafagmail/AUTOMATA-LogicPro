from pathlib import Path
import re, json, hashlib, csv, shutil, textwrap, os
ROOT=Path('/mnt/data/FPGA_VHDL_Building_Block_Library_10000_v3_0_deterministic_config')
BLOCKS=ROOT/'rtl/blocks'; MAN=ROOT/'manifests/blocks'; WRAP=ROOT/'generated/default_wrappers'
MAN.mkdir(parents=True,exist_ok=True); WRAP.mkdir(parents=True,exist_ok=True)

def split_decls(s):
    out=[]; cur=''; depth=0
    for ch in s:
        if ch=='(': depth+=1
        elif ch==')': depth-=1
        if ch==';' and depth==0:
            if cur.strip(): out.append(cur.strip())
            cur=''
        else: cur+=ch
    if cur.strip(): out.append(cur.strip())
    return out

def parse_entity(p):
    t=p.read_text(errors='ignore')
    em=re.search(r'entity\s+(\w+)\s+is\s*(.*?)end\s+entity\s*;',t,re.I|re.S)
    if not em: return None
    name=em.group(1); body=em.group(2)
    def balanced_clause(text, keyword):
        km=re.search(r'\b'+keyword+r'\s*\(', text, re.I)
        if not km: return None
        start=text.find('(', km.start())
        depth=0
        for i in range(start, len(text)):
            ch=text[i]
            if ch=='(': depth+=1
            elif ch==')':
                depth-=1
                if depth==0: return text[start+1:i]
        return None
    gbody=balanced_clause(body,'generic')
    pbody=balanced_clause(body,'port')
    gens=[]; ports=[]
    if gbody is not None:
      for d in split_decls(gbody):
        m=re.match(r'(.+?)\s*:\s*(positive|natural|boolean)(?:\s*:=\s*(.+))?$',d,re.I|re.S)
        if not m: continue
        names=[x.strip() for x in m.group(1).split(',')]
        typ=m.group(2).lower(); default=(m.group(3) or '').strip()
        for n in names:
          gens.append({'name':n,'type':typ,'default':default,'minimum':1 if typ=='positive' else (0 if typ=='natural' else None)})
    if pbody is not None:
      for d in split_decls(pbody):
        m=re.match(r'(.+?)\s*:\s*(inout|in|out|buffer)\s+(.+)$',d,re.I|re.S)
        if not m: continue
        names=[x.strip() for x in m.group(1).split(',')]
        direction=m.group(2).lower(); typ=' '.join(m.group(3).split())
        for n in names: ports.append({'name':n,'direction':direction,'type':typ})
    rel=p.relative_to(BLOCKS)
    comments={}
    for key in ['Block','Category','Implementation tier','Verification status','Protocol status','Timing status','CDC status','Numerical status']:
      mm=re.search(r'^--\s*'+re.escape(key)+r':\s*(.*)$',t,re.M|re.I)
      if mm: comments[key.lower().replace(' ','_')]=mm.group(1).strip()
    return name, rel, gens, ports, comments

def default_json(g):
    d=g['default']
    if g['type']=='boolean': return d.lower()=='true'
    try: return int(d)
    except: return d

def stable_sig(name, cfg):
    s=json.dumps({'entity':name,'configuration':cfg},sort_keys=True,separators=(',',':'))
    return hashlib.sha256(s.encode()).hexdigest()[:16].upper()

def wrapper_text(name, rel, gens, ports, cfg, sig):
    wn=name+'_det_cfg'
    genlines=[]
    for g in gens:
      val=cfg[g['name']]
      vs='true' if val is True else 'false' if val is False else str(val)
      genlines.append(f"    {g['name']} : {g['type']} := {vs}")
    genlines += ["    G_CONFIG_SCHEMA : natural := 1", f'    G_CONFIG_ID : string := "{name.upper()}_{sig}"']
    generic=';\n'.join(genlines)
    portdecl=[]
    for p in ports: portdecl.append(f"    {p['name']} : {p['direction']} {p['type']}")
    porttxt=';\n'.join(portdecl)
    checks=[]
    for g in gens:
      val=cfg[g['name']]; vs='true' if val is True else 'false' if val is False else str(val)
      checks.append(f'  assert {g["name"]} = {vs} report "Locked deterministic configuration mismatch: {g["name"]}" severity failure;')
    checks.insert(0,'  assert G_CONFIG_SCHEMA = 1 report "Unsupported deterministic configuration schema" severity failure;')
    gm=',\n'.join(f'      {g["name"]} => {g["name"]}' for g in gens)
    pm=',\n'.join(f'      {p["name"]} => {p["name"]}' for p in ports)
    genmap=f'\n    generic map (\n{gm}\n    )' if gens else ''
    return f'''-- Deterministic generated wrapper. Do not edit manually.
-- Source block: {name}
-- Configuration ID: {name.upper()}_{sig}
-- Source: rtl/blocks/{rel.as_posix()}
library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity {wn} is
  generic (
{generic}
  );
  port (
{porttxt}
  );
end entity;

architecture deterministic_wrapper of {wn} is
begin
{chr(10).join(checks)}

  u_block : entity work.{name}{genmap}
    port map (
{pm}
    );
end architecture;
'''

rows=[]; index=[]
for p in sorted(BLOCKS.rglob('*.vhd')):
    parsed=parse_entity(p)
    if not parsed: continue
    name, rel, gens, ports, comments=parsed
    cfg={g['name']:default_json(g) for g in gens}
    sig=stable_sig(name,cfg)
    category=rel.parts[0]
    clk_ports=[x['name'] for x in ports if 'clk' in x['name'].lower() or 'clock' in x['name'].lower()]
    rst_ports=[x['name'] for x in ports if 'rst' in x['name'].lower() or 'reset' in x['name'].lower()]
    manifest={
      '$schema':'../../schemas/block_manifest.schema.json','schema_version':1,
      'block':{'name':name,'entity':name,'version':'3.0.0','category':category,'source':f'rtl/blocks/{rel.as_posix()}','wrapper_entity':name+'_det_cfg'},
      'configuration':{'id':f'{name.upper()}_{sig}','hash_algorithm':'sha256-64','locked':True,'generics':gens,'resolved_defaults':cfg},
      'interface':{'ports':ports,'clock_ports':clk_ports,'reset_ports':rst_ports},
      'contracts':{
        'latency':{'kind':'declared_by_block_family','cycles':None},
        'throughput':{'kind':'declared_by_block_family','transactions_per_cycle':None},
        'reset':{'policy':'preserve_source_entity_contract'},
        'cdc':{'status':comments.get('cdc_status','integration_review_required'),'clock_domain_count':len(clk_ports)},
        'protocol':{'status':comments.get('protocol_status','internal_or_unspecified')},
        'numerical':{'status':comments.get('numerical_status','not_applicable_or_requires_reference_model')}
      },
      'maturity':{'implementation_tier':comments.get('implementation_tier','unclassified'),'verification':comments.get('verification_status','static_validation_only'),'timing':comments.get('timing_status','target_specific_signoff_required')},
      'generation':{'wrapper_path':f'generated/default_wrappers/{category}/{name}_det_cfg.vhd','configuration_file':f'configurations/default/{name}.json'}
    }
    mp=MAN/category/(name+'.json'); mp.parent.mkdir(parents=True,exist_ok=True); mp.write_text(json.dumps(manifest,indent=2)+'\n')
    wp=WRAP/category/(name+'_det_cfg.vhd'); wp.parent.mkdir(parents=True,exist_ok=True); wp.write_text(wrapper_text(name,rel,gens,ports,cfg,sig))
    cp=ROOT/'configurations/default'/category/(name+'.json'); cp.parent.mkdir(parents=True,exist_ok=True); cp.write_text(json.dumps({'schema_version':1,'block':name,'wrapper_entity':name+'_det_cfg','configuration_id':f'{name.upper()}_{sig}','generics':cfg},indent=2)+'\n')
    index.append({'name':name,'category':category,'manifest':str(mp.relative_to(ROOT)),'wrapper':str(wp.relative_to(ROOT)),'config_id':f'{name.upper()}_{sig}','generic_count':len(gens),'port_count':len(ports)})

(ROOT/'manifests/library_index.json').write_text(json.dumps({'schema_version':1,'block_count':len(index),'blocks':index},indent=2)+'\n')
with (ROOT/'manifests/library_index.csv').open('w',newline='') as f:
 w=csv.DictWriter(f,fieldnames=index[0].keys()); w.writeheader(); w.writerows(index)
print('generated',len(index))
