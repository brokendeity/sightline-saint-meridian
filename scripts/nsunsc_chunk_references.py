"""Source identities must include chunk names; identical payloads can have different page contexts."""
import hashlib,collections

def chunk_index(chunks):
 result=collections.defaultdict(list)
 for c in chunks:result[(c.name,hashlib.sha256(c.data).hexdigest())].append(c)
 return result

def resolve_reference(candidates,index):
 identities=set();invalid=False
 for c in candidates:
  if not 0<=index<len(c.chunks):invalid=True;continue
  t=c.chunks[index];identities.add((type(t).__name__,t.name,getattr(t,'filePath','')))
 if len(identities)==1 and not invalid:
  typ,name,path=next(iter(identities));return dict(index=index,status='resolved',type=typ,name=name,path=path)
 return dict(index=index,status='ambiguous' if len(identities)>1 else 'unresolved',candidateIdentities=[dict(type=t,name=n,path=p) for t,n,p in sorted(identities)])

def source_identity(candidates):
 identities={(type(c).__name__,c.name,getattr(c,'filePath','')) for c in candidates}
 if len(identities)==1:
  typ,name,path=next(iter(identities));return dict(type=typ,name=name,path=path,status='resolved')
 return dict(status='ambiguous' if identities else 'unresolved')
