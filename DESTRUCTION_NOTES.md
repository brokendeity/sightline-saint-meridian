# Impact destruction

Updated current toon build in place.

Landing/wall/rail impacts create procedural crater/scorch and crack marks plus gravity-driven, bouncing rubble. At speeds>=28m/s, building shell sections are removed with matching partitioned AABB collision sections. Repeated heavy hits deplete integrity and destroy the building; decorative instances and rooftop props are cleared. Debris48 on collapse/<=26 per normal strike is capped160 active pieces; decals capped48. Shared geometry/textures bound allocations.

Ground craters are visual surface marks, not excavated terrain or changed ground collision. Building damage changes actual mesh geometry and collision. Collapse removes the structure and sprays debris; it is not a rigid-body simulation of an entire falling tower. Damage persists until reload; R resets the player only.

VIP spawns/recovery and roof-read markers use surviving roof sections; destroyed towers are excluded from future mission roof selection, with a plaza fallback if no roofs remain.

Validated: carved wall space absent from collision sections; three190m/s impacts destroy a test building and remove its collision; debris expires; heavy ground landing creates a mark.20/20 existing regressions passed. Wall and floor screenshots inspected. Existing FBX warnings remain, no new runtime errors.

Evidence: output/playwright/destruction-wall.png, destruction-floor.png, destruction-regression-results.txt.
