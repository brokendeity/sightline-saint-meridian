# Backspool automatic vault lane

Open `SIGHTLINE_BACKSPOOL_VAULT_PLAYGROUND.html?capture=backspool&vaultcourse=1` on port 8766. This updated game includes a marked lane in the central plaza, straight ahead of the normal spawn. It is based on accepted V3; V3 and all older entrypoints remain unchanged.

## Try it

1. Tap **Shift** or click **L3** once to enable Flow.
2. Hold forward along the cyan arrows. **Do not press Jump.**
3. At full speed Backspool automatically flips over the low barrier, planter and cargo cases. A gentler left-stick input produces the actual vault actions instead.
4. The counter reaches **Automatic · 3/3** after all three actions finish and their supported exits are reached. Use **Start vault test** to return to the run-up and repeat.

The course observes existing controllers; it never requests a vault/flip, supplies a scripted velocity or moves the actor through obstacles. The explicit start/retry button relocates the player to the marked beginning and clears unfinished movement/combat activity. It does not refill health or erase existing stored replay actions. Manual Jump input is labelled separately, and blocked/interrupted actions do not earn automatic completion credit.

The three visible bodies have matching physical bounds. Repeated decoration is instanced, for 14 potential course draw calls, with no extra dynamic lights. The lane is checked against existing city colliders before creation and invalidates affected pedestrian navigation. No city buildings, streets, character proportions, animation curves or original game files are modified.

## Validation

`node scripts/test_backspool_vault_course.cjs` passed 16 checks:

- Keyboard Flow toggle + forward clears all three with no Jump.
- Simulated full-stick controller input clears all three automatically.
- Gentle controller input completes three actual `vault` actions with no A press.
- The counter observes completed source actions and supported ground contact.
- Running without Flow does not receive automatic credit; manual Jump is distinguished.
- Retry, controller disconnect/resume, pause, duplicate prevention and 44 px touch-button access work.
- Desktop, portrait and landscape captures were reviewed; no shader/page errors occurred.

The installed develop-web-game Playwright client also ran against active gameplay. Evidence is in `output/vault-course/`. Physical controller/touchscreen use remains a user playtest; simulated device checks are not hardware certification.

Rebuild with `python3 scripts/build_backspool_vault_playground.py`. The builder verifies its V3 base hash and writes only the new playground entrypoint and its manifest.
