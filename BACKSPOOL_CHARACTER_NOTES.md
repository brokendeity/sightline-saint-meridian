# Backspool character selection

Choose Sightline or Backspool in the Character selector below the sound controls. Selection persists after reload. Model/animation loads happen on the first Backspool selection; later switches reuse cached skins, skeletons and clips. Errors preserve the current character. Switching clears held input and pauses simulation during loading. The city, missions, controller mappings and physical capsule remain unchanged. Trucks remain removed.

Backspool uses the supplied Breathing Idle with skin FBX and yellow suit texture. Skin height is normalized to 1.82 m. Native mesh scale required an independently calibrated 6 mm outline. Foot-contact samples, mixer bindings and red body afterimages are rebuilt when switching; ghost pools remain bounded at six.

All 121 FBX files from the three requested folders were parsed and validated against the Backspool skeleton. Runtime animation data was extracted using the game's FBX parser, optimized, rounded to five decimal places, and gzip-compressed to 3.95 MB. The 6.58 MB model uses the existing FBX pipeline to preserve skeleton binding. Source FBX copies and full-precision JSON are retained locally as reproducible conversion inputs, but the game downloads only backspool.fbx, its texture, and animations-web.json.gz.

Automatic gameplay mappings: idle → Breathing Idle; walk → Sneak Walk; run → Standard Run; sprint → sprint; grounded aim → Shooting ability out of hand; takeoff → jump from idle to jump; rail transit → rail grinding; controlled air/air aim → held airborne sample of Falling To Landing; landing → Falling To Landing; uncontrolled air → Big Body Blow; impact → Fall Flat on face. Ground and air dodges use supplied directional dodge/aerial evade clips. There is no superhero flying clip in the supplied folders, so Backspool's rail grinding pose serves rail transit.

The Animations button provides a searchable, categorized menu for every supplied clip, including combat, cover and parkour moves. Preview pauses world movement and returns to the prior gameplay/menu state. Playing a combat or parkour preview does not implement a new combat or wall-climbing mechanic. The full animation assets are available for those future mechanics.

Diagnostics: window.characterState() reports active character, loading state, clip count and preview. render_game_to_text includes this state. Backup: .pre-backspool-switch.html. Rebuild: python3 scripts/apply_backspool_switch.py. This patcher uses the truck-free, road-enabled backup.

Validation: 225 existing regression checks passed. Eleven additional character checks passed, including all 121 animated skeletons, all gameplay mappings, plaza sole contact, air/transit/dodge selection, cache restoration, bounded afterimages and truck absence. Actual UI selection, punch preview and return-to-game were exercised. Screenshots: output/playwright/backspool-character.png and backspool-animation-menu.png. The bundled web-game client ran; detailed canvas verification used isolated Playwright captures because of its previously documented capture limitation. The original FBX loader's four-weight warning also applies to Backspool.

## Hero separation and controller switch

Hold L3 + LT + RT + R3 (standard gamepad buttons 10, 6, 7, 11) simultaneously to toggle heroes in either direction. The chord consumes aim/fire/sprint/recenter inputs. It triggers once, and all four buttons must be released before another switch. The dropdown remains an accessible fallback.

Backspool is a distinct hero awaiting user-defined powers. Sightline rail launch, perception aim, micro-rail dodge, kinetic brace and rail-read scanner are blocked while Backspool is active. Switching to Backspool cancels queued/current rail flight, scanner visuals and perception effects; airborne momentum is reduced to ordinary movement speed without teleporting. Ordinary locomotion, jumping and all animation previews remain. This supersedes the earlier shared-power behavior and the earlier Backspool rail/dodge gameplay mappings; the clips are retained for preview/future integration. Eleven chord/hero-separation checks pass, including hold/release gating and midair transition.
