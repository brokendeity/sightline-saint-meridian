#!/usr/bin/env python3
"""Install the bounded Saint Meridian visual layer into an explicitly selected HTML.

Default is the playable main HTML. --output can write a separate QA page without
changing it. Every mutation has an exact single-site anchor; unexpected source
changes stop before writing. Running twice is harmless.
"""
from pathlib import Path
import argparse

ROOT = Path(__file__).resolve().parent.parent
parser = argparse.ArgumentParser()
parser.add_argument("target", nargs="?", type=Path, default=ROOT / "SIGHTLINE_SAINT_MERIDIAN_TOON.html")
parser.add_argument("--output", type=Path)
args = parser.parse_args()
source = args.target.read_text()
marker = "// Saint Meridian visual polish. View state only: no targets, support volumes or input changes."
if marker in source:
    # Safe follow-up for builds that installed the visual layer just before the
    # visor restoration hook was added. Preserve every other caller's edits.
    old_fog = "scene.fog.density=railRead?.0017:.00135;"
    if source.count(old_fog) == 1:
        source = source.replace(old_fog, "scene.fog.density=railRead?.0017:importedCity.status==='ready'?.00108:.00135;", 1)
        (args.output or args.target).write_text(source)
        print("Visual polish installed; updated standard-vision fog restoration.")
    else:
        if args.output:
            args.output.write_text(source)
        print("Visual polish already installed; no source changes.")
    raise SystemExit(0)

def replace_once(before: str, after: str):
    global source
    count = source.count(before)
    if count != 1:
        raise SystemExit(f"Expected one visual hook, found {count}: {before[:100]}")
    source = source.replace(before, after, 1)

replacement = (ROOT / "scripts/game_visual_upgrade.js").read_text()
# r128 allocates DEPTH_COMPONENT16 for a depth-only offscreen target. Near=.05 and
# far=1800 make close architectural layers quantize to the same depth, producing
# diagonal stripes. Packed depth/stencil selects DEPTH24_STENCIL8 without changing
# camera clipping, removing geometry, changing MSAA or adding another render pass.
replace_once(
    "new PhaseTarget(1,1,{depthBuffer:true})",
    "new PhaseTarget(1,1,{depthBuffer:true,stencilBuffer:true})",
)
replace_once(
    "window.importedCityState=()=>({...importedCity,families:importedCity.families.map(f=>({...f}))});",
    "window.importedCityState=()=>({...importedCity,families:importedCity.families.map(f=>({...f}))});\n\n" + replacement,
)
replace_once(
    "mat.customProgramCacheKey=()=> 'SaintMeridianBuildingVertexEmission1';holder.geometry.dispose();return mat;",
    "mat.customProgramCacheKey=()=> 'SaintMeridianBuildingVertexEmission1';holder.geometry.dispose();return cityVisualPolish.material(mat);",
)
replace_once(
    "new THREE.Color(.018,.038,.053):material.color.clone()).multiplyScalar(1.18),emission=material.emissive.clone().multiplyScalar(material.emissiveIntensity||1);if(/cyan|pale lamps/i.test(material.name))emission.multiplyScalar(1.4);",
    "new THREE.Color(.032,.053,.075):material.color.clone()).multiplyScalar(1.18),emission=material.emissive.clone().multiplyScalar(material.emissiveIntensity||1);if(/cyan|pale lamps/i.test(material.name))emission.multiplyScalar(.85);if(/warm soffit/i.test(material.name)){tint.multiplyScalar(.78);emission.multiplyScalar(.8)}if(/brushed silver/i.test(material.name))tint.multiplyScalar(.74);",
)
replace_once(
    "importedCity.status='ready';importedCity.buildings=buildingColliders.length;",
    "importedCity.status='ready';importedCity.buildings=buildingColliders.length;try{cityVisualPolish.build()}catch(error){console.error('Saint Meridian visual polish unavailable',error)}",
)
replace_once(
    "if(typeof updateVisualBudget==='function')updateVisualBudget(dt);updateDroneSpotlights();",
    "if(typeof updateVisualBudget==='function')updateVisualBudget(dt);updateDroneSpotlights();if(typeof cityVisualPolish!=='undefined')cityVisualPolish.update(dt);",
)
replace_once(
    "const nearby=nightEmitters.slice().sort((a,b)=>a.position.distanceToSquared(s.pos)-b.position.distanceToSquared(s.pos));",
    "const nearby=nightEmitters.filter(e=>!e.owner||cityVisualPolish.isSourceValid(e)).sort((a,b)=>a.position.distanceToSquared(s.pos)-b.position.distanceToSquared(s.pos));",
)
replace_once(
    "visuals:{...stylizedState(),buildings:importedCityState()}",
    "visuals:{...stylizedState(),buildings:importedCityState(),polish:visualPolishState()}",
)
replace_once(
    "scene.fog.density=railRead?.0017:.00135;",
    "scene.fog.density=railRead?.0017:importedCity.status==='ready'?.00108:.00135;",
)
target = args.output or args.target
target.write_text(source)
print(f"Installed visual polish in {target}: material hook, import commit hook, render hook, surface tuning, runtime stats.")
