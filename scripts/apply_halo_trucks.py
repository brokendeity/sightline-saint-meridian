from pathlib import Path
root=Path(__file__).resolve().parents[1]
file=root/'SIGHTLINE_SAINT_MERIDIAN_TOON.html';backup=root/'.pre-halo-trucks.html'
if not backup.exists():backup.write_bytes(file.read_bytes())
s=backup.read_text()
needle='const cityImportPromise=importBlenderCity().then(result=>{roadNetwork.build();return result;});'
assert s.count(needle)==1
s=s.replace(needle,needle+'\n'+(root/'scripts/game_halo_trucks.js').read_text())
s=s.replace('roadNetwork.tick(worldDt);updateCourier(dt);','roadNetwork.tick(worldDt);haloTrucks.tick(worldDt);updateCourier(dt);')
s=s.replace('roads:roadNetworkState(),coordinates:','roads:roadNetworkState(),haloTrucks:haloTruckState(),coordinates:')
s=s.replace('function state(){return{...stats,', 'function state(){return{...stats,vehicleActors:window.haloTruckState?.().count||0,')
file.write_text(s)
