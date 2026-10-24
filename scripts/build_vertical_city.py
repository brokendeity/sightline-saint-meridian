from pathlib import Path
R=Path(__file__).resolve().parents[1]
s=(R/'SIGHTLINE_BACKSPOOL_WHIP_THROW.html').read_text()
needle='function updatePlayer(dt,realDt=dt)'
assert s.count(needle)==1
s=s.replace(needle,(R/'scripts/game_vertical_city.js').read_text()+'\n'+needle,1)
s=s.replace('haloTrucks.tick(worldDt);','haloTrucks.tick(worldDt);verticalCity.tick(worldDt);',1)
s=s.replace('</body>',"<script>const verticalReady=setInterval(()=>{if(gameReady&&roadNetworkState().ready){clearInterval(verticalReady);verticalCity.build();}},100);</script></body>")
(R/'SIGHTLINE_VERTICAL_MEGACITY_V1.html').write_text(s)
print('Built separate vertical prototype')
