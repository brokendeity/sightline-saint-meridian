# Current reference-view surface and lighting study

This is diagnosis, not completed architecture or approved visual acceptance.
`V02_Upper_Anchor_Reference_Surfaces.json` binds the current entry, script,
screenshots, camera matrices, actual mesh hits, source-owner identities and
temporary lighting-isolation views. Both original A/B bookmarks remain intact.
The additional public-gallery view is labelled separately and cannot replace B.

A32×18 view-space ray grid identifies actual visible surfaces, including
frustum-culling-disabled instanced objects. Original owner141,160 and162 meshes
use their source-backed PBR material. More distant originals still use the
preserved toon material. Decorative fittings keep their actual ancestry/owner.
Original vertex color/emission values are matched to the existing material
contract; classification is not guessed from the resulting pixel color.

The B-view broad pale highlight is on original building141, despite appearing
on the right side of the image: the camera looks along positiveZ, so screen-right
is toward negative worldX. It is the source's **midnight cladding** palette,
not a missing material or a white replacement wall.

At85 sampled cladding pixels, mean displayed luminance was50.89/255 and the
maximum236.84/255. Temporarily removing only the existing warm directional light
reduced these to7.62/255 and22.25/255. Removing only the shared tower reflection
probe had a much smaller effect. This isolates a strong direct-light/specular
contribution; it does not prove a unique physical cause or a final material fix.
The warm directional has intensity0.25 and does not cast shadows. These values
and all other lighting were restored after each labelled diagnostic capture.

Deleting the warm light globally would darken other city surfaces and the hero.
It is not an accepted repair and has not been shipped. The next source work
should evaluate panel-scale surface relief, physically appropriate painted-metal
roughness/reflectance, and motivated light/shadow response together. Original
geometry, collision, traversal and destruction ownership must remain preserved.

The major structural mismatch remains equally visible: broad, coffered deck
undersides dominate both the original lower view and the elevated-gallery study;
the approved reference has more articulated facades, occupied warm terraces,
structural detail and visible canyon depth. A new camera angle alone does not
resolve that difference. Future Blender refinements must preserve the proven
circulation and bring those actual surfaces toward the reference.

The temporary no-light/no-probe images are diagnostic variants only. They are
never selectable game builds, and no lighting-isolation setting is retained in
the playable candidate.
