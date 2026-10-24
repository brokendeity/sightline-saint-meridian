"""Compose the environment with the newest gameplay build, without duplicate hooks."""
from pathlib import Path
R=Path(__file__).resolve().parents[1]
def apply_environment(source):
    if 'const verticalCity=(()=>{' in source:
        raise ValueError('Environment already present; rebuild the gameplay source first')
    needle='function updatePlayer(dt,realDt=dt)'
    assert source.count(needle)==1
    source=source.replace(needle,(R/'scripts/game_vertical_city.js').read_text()+'\n'+needle,1)
    assert source.count('haloTrucks.tick(worldDt);')==1
    source=source.replace('haloTrucks.tick(worldDt);','haloTrucks.tick(worldDt);verticalCity.tick(worldDt);',1)
    source=source.replace('</body>',"<script>const verticalReady=setInterval(()=>{if(gameReady&&roadNetworkState().ready){clearInterval(verticalReady);verticalCity.build();}},100);</script></body>")
    return source
if __name__=='__main__':
    source=(R/'SIGHTLINE_BACKSPOOL_WHIP_THROW.html').read_text()
    if 'const verticalCity=(()=>{' not in source:source=apply_environment(source)
    (R/'SIGHTLINE_VERTICAL_MEGACITY_V1.html').write_text(source)
    print('Updated environment preview from the current game')
