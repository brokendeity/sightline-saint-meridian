"""Functional upper service-face windscreen and cantilevered mantle visor.

Protects the exposed committed first mantle with visible physical geometry.
The lower face stays open for the existing climb and uphill cartridge route.
The rear centre remains open for the next wall; roof wings cover oblique rays.
"""
def author_wall_mantle_cover(structure):
    col='SM_V02_ROOFTOP_ROUTES'
    def part(name,lo,hi,material='steel',walkable=False,solid=True):
        structure('mastery-mantle-cover-'+name,
                  [(lo[i]+hi[i])/2 for i in range(3)],
                  [hi[i]-lo[i] for i in range(3)],col,
                  'physical upper service-face windscreen and mantle visor',
                  material=material,walkable=walkable,solid=solid,besideStairFlight=True)
    for side,x in [('west',59.8),('east',68.2)]:
        part(side+'-glass',[x-.04,93,292],[x+.04,99.3,306.5],'glass')
        for label,y in [('bottom',93.05),('top',99.4)]:
            part(side+'-'+label+'-frame',[x-.07,y-.07,291.9],[x+.07,y+.07,306.6])
        part(side+'-front-frame',[x-.07,93,306.43],[x+.07,99.3,306.57])
    part('front-glass',[59.8,93,306.46],[68.2,99.3,306.54],'glass')
    part('front-bottom-frame',[59.73,92.99,306.43],[68.27,93.11,306.57])
    part('roof',[59.6,99.3,298],[68.4,99.6,306.7],'steel',True)
    part('roof-west-wing',[59.6,99.3,292],[62.5,99.6,298],'steel',True)
    part('roof-east-wing',[65.5,99.3,292],[68.4,99.6,298],'steel',True)
    # Rear roof columns sit on the actual first service-room roof atY96.
    for i,x in enumerate([60.25,67.75]):
        part('roof-post-'+str(i),[x-.09,96,299.56],[x+.09,99.3,299.74])
    for i,x in enumerate([60,68]):
        part('side-mount-'+str(i),[x-.25,99.15,291.85],[x+.25,99.65,292.35])
    part('warm-soffit',[60.05,99.265,306.36],[67.95,99.295,306.44],'warm',False,False)
