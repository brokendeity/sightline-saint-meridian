"""Build narrow static evidence. Does not execute or modify the shipped program."""
import hashlib,json,pathlib,struct
ROOT=pathlib.Path(__file__).resolve().parents[1]
OUT=ROOT/'output/rea-forspoken'
exe=OUT/'FORSPOKEN.exe'
expected='da0e172c7d1db082f5e1fd20978ae0b72c5c0995eb0f6b0b428afc23912e551c'
h=hashlib.sha256()
with exe.open('rb') as f:
 for b in iter(lambda:f.read(8*1024*1024),b''):h.update(b)
assert h.hexdigest()==expected
with exe.open('rb') as f:
 f.seek(0x3c);pe=struct.unpack('<I',f.read(4))[0];f.seek(pe+6);n=struct.unpack('<H',f.read(2))[0];f.seek(pe+20);opt=struct.unpack('<H',f.read(2))[0];f.seek(pe+48);base=struct.unpack('<Q',f.read(8))[0];f.seek(pe+24+opt)
 sections=[struct.unpack('<8sIIIIIIHHI',f.read(40)) for _ in range(n)]
 constants=[]
 for va,kind in [(0x146d54048,'float'),(0x146d58a70,'uint32'),(0x146d54150,'double'),(0x146d54108,'double'),(0x146d53d1c,'float')]:
  s=next(s for s in sections if s[2]<=va-base<s[2]+s[3]);off=s[4]+va-base-s[2];f.seek(off);raw=f.read(8 if kind=='double' else 4)
  constants.append(dict(address=hex(va),fileOffset=hex(off),type=kind,rawHex=raw.hex(),value=struct.unpack({'float':'<f','double':'<d','uint32':'<I'}[kind],raw)[0]))
files=['142c46010.c','142c27380.c']
record=dict(schemaVersion=1,status='static pseudocode observations; runtime and units unverified',source=dict(path=str(exe.relative_to(ROOT)),sha256=expected,executed=False),exports=[dict(path=str((OUT/'ghidra-evidence'/x).relative_to(ROOT)),sha256=hashlib.sha256((OUT/'ghidra-evidence'/x).read_bytes()).hexdigest()) for x in files],constants=constants,observations=[
 dict(function='0x142c46010',label='source-path-associated vault judge candidate',facts=[
 'Returns false if either component lookup at 0x144bf7d80 or 0x144bf6860 returns null, or 0x14472ab50 produces no record.',
 'Traverses outer records with stride 0x260, indexed records with stride 0x50 and subrecords with stride 0x180.',
 'Requires a type-2 subrecord at +0x170 with bit 0 set at +0x80 and nonzero byte at +0x110.',
 'Calls 0x142a711e0 with the virtual +0x48 result and output +0xc8; false rejects the candidate.',
 'Checks a bit-masked float from output +0xb0 against object +0x170 (lower bound) and +0x174 (exclusive upper bound) on its conditional path. Mask 0x7fffffff strips the sign bit.',
 'Several branches use min(helper result + clamped nonnegative 0x144742800 result, double at pointed output +0xb8 +0x40), storing values at output +0x20/+0x24 and calling 0x142a712d0.',
 'A reverse search accumulates record +0x10 values with a 1.0 double cutoff; a special branch tests an accumulated quantity >0.5. Units are not recovered.',
 'The float global 0x146d54048 is 1.5, not zero; comparisons involving fVar27 earlier in the function must preserve that distinction.'
 ]),
 dict(function='0x142c27380',label='source-path-associated animation-warp output candidate',facts=[
 'For param_3 == 0x107d962, returns a four-component block from state +0x20 and another from +0x50 if the first block is nonzero.',
 'General path requires nonzero param_4 matching state +0x0c; accepts nonzero four-component state +0x10 or flags +0x40/+0x60.',
 'Copies output block 1 from state +0x10; output block 2 comes from +0x50 or +0x30 according to param_9 after state-ID dispatch.',
 'Sets output flag param_7 for a specific set of state IDs when state byte +0x68 is nonzero; it does not initialize that flag on every other path.',
 'Fallback for IDs 0x10794ce/0x107a346 scans 0x260/0x50/0x180 records and requires type 1, flags bits 0 and 1, and nonzero +0x110 before copying +0x100..+0x10c.',
 'That fallback computes another output through unresolved functions 0x142fe6927 and 0x142fdf410 with a verified 0.5 multiplier; transform semantics cannot be named from this expression alone.',
 'Other permitted paths delegate to 0x144bf5fd0; many IDs explicitly return false instead.'
 ])],limitations=['No recovered world-unit interpretation, geometry clearance threshold, input bindings, speed or animation assets are established by these two functions.','State ID names and output vector semantics remain unassigned. No runtime trace validates decompiler types.','Decompiler reports type-propagation warnings and overlapping globals; branch identities are static observations, not an exact original port.','Native Backspool traversal settings must be labelled authored, even if this evidence motivates separation of candidate eligibility and animation target outputs.'])
(OUT/'movement-source-evidence.json').write_text(json.dumps(record,indent=2)+'\n')
print(json.dumps(dict(output=str(OUT/'movement-source-evidence.json'),constants=constants),indent=2))
