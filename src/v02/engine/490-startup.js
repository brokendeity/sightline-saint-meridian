


loadCharacter().catch(err=>{console.error(err);const ff=(typeof fflate!=='undefined')?'FFLATE READY':'FFLATE MISSING';const fx=(window.THREE&&THREE.FBXLoader)?'FBXLOADER READY':'FBXLOADER MISSING';loadtext.innerHTML='<span class="warn">FBX LOAD FAILED:</span> '+err.message+'<br><small>'+ff+' · '+fx+'</small><br>Open DevTools for details.'});resetPlayer();loop();
