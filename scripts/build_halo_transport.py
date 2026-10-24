from pathlib import Path
root=Path(__file__).resolve().parent.parent
s=(root/'SIGHTLINE_BACKSPOOL_GROUND_TEXTURES.html').read_text()
module=(root/'scripts/game_halo_transport.js').read_text()
needle='const cityImportPromise=importBlenderCity().then(result=>{roadNetwork.build();return result;});'
assert s.count(needle)==1
s=s.replace(needle,needle+'\n'+module)
assert s.count('roadNetwork.tick(worldDt);updateCourier(dt);')==1
s=s.replace('roadNetwork.tick(worldDt);updateCourier(dt);','roadNetwork.tick(worldDt);haloTrucks.tick(worldDt);updateCourier(dt);')
s=s.replace('roads:roadNetworkState(),coordinates:','roads:roadNetworkState(),haloTrucks:haloTruckState(),coordinates:')
(root/'SIGHTLINE_BACKSPOOL_HALO_PATROLS.html').write_text(s)
