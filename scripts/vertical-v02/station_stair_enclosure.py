"""Visible, collision-owning transit stair weather enclosure, game Y-up metres.

Four open portals retain the authored public paths. Glass is physical cover,
not an invisible combat exemption. Roof clearance is above the final landing.
"""
def author_station_stair_enclosure(structure):
    col='SM_V02_TRANSIT_STRUCTURES'
    def part(name,lo,hi,material='glass',walkable=False):
        if any(hi[i]-lo[i]<1e-6 for i in range(3)):return
        structure('station-stair-weather-'+name,
                  [(lo[i]+hi[i])/2 for i in range(3)],
                  [hi[i]-lo[i] for i in range(3)],col,
                  'physical transit stair shelter; open public entrances',
                  material=material,walkable=walkable,besideStairFlight=True)
    def wall(name,axis,plane,start,end,door=None):
        # Rectangle subtraction in wall-local horizontal/vertical coordinates.
        rects=[(start,end,84,103.1)]
        if door:
            a,b,c,d=door
            rects=[(start,a,84,103.1),(b,end,84,103.1),
                   (a,b,84,c),(a,b,d,103.1)]
        for i,(u,v,y0,y1) in enumerate(rects):
            if axis==0:lo=[plane-.05,y0,u];hi=[plane+.05,y1,v]
            else:lo=[u,y0,plane-.05];hi=[v,y1,plane+.05]
            part(name+'-'+str(i),lo,hi)
        if door:
            a,b,c,d=door
            for i,u in enumerate([a,b]):
                if axis==0:lo=[plane-.1,c,u-.06];hi=[plane+.1,d,u+.06]
                else:lo=[u-.06,c,plane-.1];hi=[u+.06,d,plane+.1]
                part(name+'-jamb-'+str(i),lo,hi,'steel')
            if axis==0:lo=[plane-.11,d,a-.06];hi=[plane+.11,d+.08,b+.06]
            else:lo=[a-.06,d,plane-.11];hi=[b+.06,d+.08,plane+.11]
            part(name+'-lintel',lo,hi,'warm')
    # A shallow glass box cropped the native third-person camera at the north
    # turn. Widen those actual landings; preserve the original stair centreline.
    for y in [84,90.4,96.8,100]:
        structure('station-stair-landing-north-'+str(y),[65.6,y-.09,372.55],
                  [12.4,.18,2.9],col,'widened north transit landing and camera clearance',
                  material='deck',walkable=True,besideStairFlight=True)
    wall('west',0,58.85,371.1,386.8,(374,377,84,86.7))
    wall('east',0,72.35,371.1,386.8,(375.3,378.3,100,102.7))
    # Both walk-outs and their normal return movement need capsule clearance,
    # including the momentum touchdown's westward line. A narrow central door
    # admitted entry but trapped the native return against its west jamb.
    wall('north',2,371.1,58.85,72.35,(62.3,68.8,100,102.7))
    wall('south',2,386.8,58.85,72.35,(64.9,68.1,100,102.7))
    part('roof',[58.7,103.1,370.95],[72.5,103.3,386.95],'steel',True)
    for x in [58.85,72.35]:
        for z in [371.1,386.8]:
            part('post-'+str(x)+'-'+str(z),[x-.09,84,z-.09],[x+.09,103.1,z+.09],'steel')
    for z in [371.1,386.8]:
        part('roof-trim-'+str(z),[58.7,103.2,z-.06],[72.5,103.26,z+.06],'cyan')
