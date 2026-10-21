"""Resolve source codes through player parameters and the shipped English message table."""
import json,struct
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];DEST=ROOT/'assets/nsunsc-library'
rows=[json.loads(p.read_text()) for p in DEST.glob('*/index.json')]
def raw(path):
 r=next(r for r in rows if r['path']==path);return (ROOT/r['unsupported'][0]['url']).read_bytes(),r
msg,mr=raw('data/message/WIN64/eng/messageInfo.bin.xfbin');param,pr=raw('data/spc/playerSettingParam.bin.xfbin')
def crc(s):
 h=0xffffffff
 for x in s.encode():
  h^=x<<24
  for i in range(8):h=((h<<1)^0x04c11db7 if h&0x80000000 else h<<1)&0xffffffff
 return h^0xffffffff
def string(b,o):
 if not 0<=o<len(b):return ''
 return b[o:b.find(b'\0',o)].decode('utf-8',errors='replace')
def ptr(b,o):return string(b,o+struct.unpack_from('<Q',b,o)[0])
messages={struct.unpack_from('<I',msg,20+i*48)[0]:ptr(msg,20+i*48+24) for i in range(struct.unpack_from('<I',msg,8)[0])}
# Stored message IDs use little-endian non-reflected CRC32 (poly 04C11DB7, init/final FFFFFFFF).
assert messages[crc('char_0724')]=='Naruto Uzumaki (Part 1)'
characters={}
for i in range(struct.unpack_from('<I',param,8)[0]):
 o=20+i*64;code=ptr(param,o+16);base=ptr(param,o+32);variant=ptr(param,o+40);name=messages.get(crc(variant)) or messages.get(crc(base))
 if len(code)>=4 and name:characters.setdefault(code[:4],[]).append(dict(code=code,name=name,message=variant,baseName=messages.get(crc(base))))
(DEST/'character-names.json').write_text(json.dumps(dict(provenance=[mr['sha256'],pr['sha256']],characters=characters),indent=2));print('Resolved',len(characters),'source families',sum(map(len,characters.values())),'variants')
