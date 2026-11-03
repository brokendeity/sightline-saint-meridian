// World anchor data — blocks, traversal anchors, challenge gates, recovery pads.
// Extracted from the monolith's world-building setup.

function makeAnchor(data) {
  return {
    surfaceSide: data.surfaceSide ?? (data.side < 0 ? "left" : data.side > 0 ? "right" : "center"),
    railRole: data.railRole ?? "mid",
    virtual: false,
    ...data
  };
}

/** Generate the corridor of buildings that line both sides of the route. */
export function createBlocks() {
  const blocks = [];
  for (let i = 0; i < 30; i++) {
    const z = i * 230 - 260;
    const lh = 170 + ((i * 47) % 165);
    const rh = 180 + ((i * 59) % 165);
    blocks.push({ x: -650, z, w: 345, d: 175, h: lh });
    blocks.push({ x: 305, z: z + 80, w: 345, d: 175, h: rh });
  }
  return blocks;
}

/** Generate all traversal anchors: procedural + Phase 8 authored playground set. */
export function createAnchors() {
  const anchors = [];
  for (let i = 0; i < 30; i++) {
    const z = i * 230 - 260;
    const lh = 170 + ((i * 47) % 165);
    const rh = 180 + ((i * 59) % 165);
    if (i > 0) {
      anchors.push(makeAnchor({ id: "L" + i, x: -292 - (i % 2) * 42, y: lh - 20, z: z + 105, side: -1, kind: i % 2 ? "SIGN" : "FIRE ESCAPE", surfaceSide: "left", railRole: lh > 270 ? "high" : "mid" }));
      anchors.push(makeAnchor({ id: "R" + i, x: 292 + (i % 2) * 52, y: rh - 24, z: z + 145, side: 1, kind: i % 2 ? "BILLBOARD" : "ROOF HOOK", surfaceSide: "right", railRole: rh > 280 ? "high" : "mid" }));
      if (i % 2 === 0) anchors.push(makeAnchor({ id: "G" + i + "C", x: (i % 4 === 0 ? -65 : 65), y: 4, z: z + 74, side: 0, kind: "GROUND SOCKET", surfaceSide: "ground", railRole: "low" }));
      if (i % 3 === 0) anchors.push(makeAnchor({ id: "G" + i + "L", x: -188, y: 5, z: z + 152, side: 0, kind: "STREET PIN", surfaceSide: "ground", railRole: "low" }));
      if (i % 3 === 1) anchors.push(makeAnchor({ id: "G" + i + "R", x: 188, y: 5, z: z + 122, side: 0, kind: "STREET PIN", surfaceSide: "ground", railRole: "low" }));
    }
  }

  // Phase 8: authored traversal playground anchors.
  [
    { id: "P8_RAMP_GROUND", x: -175, y: 5, z: 615, side: 0, kind: "ROUTE GROUND SOCKET", surfaceSide: "ground", railRole: "low" },
    { id: "P8_RAMP_WALL", x: -318, y: 238, z: 930, side: -1, kind: "RAMP WALL HOOK", surfaceSide: "left", railRole: "high" },
    { id: "P8_CLIMB_GROUND", x: 170, y: 5, z: 1180, side: 0, kind: "VERTICAL START PIN", surfaceSide: "ground", railRole: "low" },
    { id: "P8_CLIMB_WALL", x: 340, y: 330, z: 1490, side: 1, kind: "VERTICAL CLIMB HOOK", surfaceSide: "right", railRole: "high" },
    { id: "P8_RIGHT_CHAIN_1", x: 352, y: 210, z: 1810, side: 1, kind: "RIGHT WALL CHAIN 1", surfaceSide: "right", railRole: "mid" },
    { id: "P8_RIGHT_CHAIN_2", x: 365, y: 246, z: 2140, side: 1, kind: "RIGHT WALL CHAIN 2", surfaceSide: "right", railRole: "mid" },
    { id: "P8_RIGHT_CHAIN_3", x: 338, y: 285, z: 2490, side: 1, kind: "RIGHT WALL CHAIN 3", surfaceSide: "right", railRole: "high" },
    { id: "P8_LEFT_POP", x: -326, y: 284, z: 2860, side: -1, kind: "RAIL POP HOOK", surfaceSide: "left", railRole: "high" },
    { id: "P8_RIGHT_POP", x: 324, y: 288, z: 3180, side: 1, kind: "RAIL POP LANDING", surfaceSide: "right", railRole: "high" },
    { id: "P8_SNAP_LEFT", x: -320, y: 240, z: 3550, side: -1, kind: "SNAPBACK SETUP HOOK", surfaceSide: "left", railRole: "mid" },
    { id: "P8_SNAP_RIGHT", x: 320, y: 250, z: 3880, side: 1, kind: "SNAPBACK EXIT HOOK", surfaceSide: "right", railRole: "mid" },
    { id: "P8_DRONE_ENTRY", x: -310, y: 285, z: 4310, side: -1, kind: "DRONE ENTRY HOOK", surfaceSide: "left", railRole: "high" },
    { id: "P8_FINAL_RIGHT", x: 330, y: 305, z: 4850, side: 1, kind: "FINAL ROUTE HOOK", surfaceSide: "right", railRole: "high" }
  ].forEach(a => anchors.push(makeAnchor(a)));

  return anchors;
}

export { makeAnchor };

export const CHALLENGE_GATE_SEEDS = [
  { id: "G1", x: -130, y: 120, z: 900, r: 126, method: "groundRamp", label: "GATE 1: GROUND-RAMP CLIMB", need: "clear with Ground Ramp / Vertical Climb", color: "#86efac", score: 260 },
  { id: "G2", x: 205, y: 190, z: 1525, r: 128, method: "verticalClimb", label: "GATE 2: UPWARD GRIND", need: "keep Afterstep momentum on an upward rail", color: "#60a5fa", score: 320 },
  { id: "G3", x: 230, y: 220, z: 2180, r: 128, method: "sameSide", label: "GATE 3: SAME-SIDE CHAIN", need: "build a rail on the same wall side", color: "#facc15", score: 260 },
  { id: "G4", x: -70, y: 245, z: 3040, r: 138, method: "perfectPop", label: "GATE 4: PERFECT RAIL-POP", need: "hit Space during the green rail-pop window", color: "#86efac", score: 420 },
  { id: "G5", x: 65, y: 230, z: 3650, r: 142, method: "snapback", label: "GATE 5: SNAPBACK RECOVERY", need: "bank with Q, then use E or a Clean Snap near this gate", color: "#fff4c4", score: 440 },
  { id: "G6", x: 0, y: 270, z: 4550, r: 150, method: "droneRail", label: "GATE 6: MOVING DRONE HOOK", need: "chain through a Drone Rail", color: "#2dd4bf", score: 520 }
];

export const RECOVERY_PAD_SEEDS = [
  { id: "REC1", x: 0, z: 1700, r: 118, used: false, label: "RECOVERY PAD" },
  { id: "REC2", x: -95, z: 3360, r: 118, used: false, label: "SAFE STOOP" },
  { id: "REC3", x: 90, z: 4740, r: 132, used: false, label: "AFTERSTEP REBOOT" }
];

export function cloneChallengeGates() {
  return CHALLENGE_GATE_SEEDS.map(g => ({ ...g, hit: false, failed: false, pulse: 0 }));
}

export function cloneRecoveryPads() {
  return RECOVERY_PAD_SEEDS.map(p => ({ ...p }));
}
