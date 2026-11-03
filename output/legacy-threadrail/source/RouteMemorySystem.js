// Route Memory System
// Tracks previous rail segments to determine variety and penalty scaling.

export function createRouteMemorySystem(deps) {
  const { state, tag, clamp, railFamily } = deps;

  function recordAdaptiveRailContact(rail, profile) {
    const p = state.p;
    const family = railFamily(rail);
    const prev = state.routeMemory?.[state.routeMemory?.length - 1];
    const repeated = prev && prev.family === family;
    const straight = family === "STRAIGHT-LANE" || (rail && Math.abs((rail.b?.x || 0) - (rail.a?.x || 0)) < 85 && Math.abs((rail.b?.z || 0) - (rail.a?.z || 0)) > 240);
    
    state.routeRepeatStreak = repeated ? (state.routeRepeatStreak || 0) + 1 : 0;
    state.routeStraightStreak = straight ? (state.routeStraightStreak || 0) + 1 : 0;
    state.routeMemory = (state.routeMemory || []).concat([{ family, grade: rail?.grade || "NONE", contact: profile?.grade || "NONE", t: state.t, z: p.z }]).slice(-10);
    
    if (state.routeRepeatStreak >= 2 || state.routeStraightStreak >= 3) {
      state.adaptivePressure = clamp((state.adaptivePressure || 0) + 7 + state.routeRepeatStreak * 2 + state.routeStraightStreak, 0, 100);
      state.adaptiveWarnT = 95;
      state.adaptiveLastPunish = repeated ? "REPEATED " + family : "STRAIGHT RAIL SPAM";
      p.repeatedRailPunishes += repeated ? 1 : 0;
      p.overusedRoutePunishes += straight ? 1 : 0;
      p.adaptivePunishes += 1;
      p.lastAdaptiveEvent = state.adaptiveLastPunish;
      if (tag) tag("CIVIC HALO ADAPTS: " + state.adaptiveLastPunish, "#fb7185");
    } else if ((rail?.grade === "PERFECT" || profile?.grade === "PERFECT ENTRY") && family !== prev?.family) {
      state.adaptivePressure = clamp((state.adaptivePressure || 0) - 4, 0, 100);
      p.cleanStyleChains += 1;
      p.lastAdaptiveEvent = "CLEAN VARIED RAIL";
    }
  }

  function updateAdaptivePressure(uiDt) {
    const p = state.p;
    const speed = Math.hypot(p.vx || 0, p.vy || 0, p.vz || 0) + (p.rail ? (p.rail.speed || 0.007) * 1350 : 0);
    const stylish = !!(p.rail || p.launch || p.parkour || p.recentPopTimer > 0 || p.recentSnapTimer > 0 || p.flipTimer > 0 || p.wallRunEnergy > 0);
    const varied = (state.routeMemory || []).slice(-4).map(x => x.family).filter((v, i, a) => a.indexOf(v) === i).length;
    const sloppy = (state.routeStarted && p.grounded && !p.parkour && speed < 1.6) || p.glancingContacts > p.perfectEntries + p.cleanContacts + 1 || p.underSuppression || p.falls > 0;
    const clean = stylish && speed > 7.0 && varied >= 2 && !p.underSuppression && p.falls === 0;
    
    let delta = 0;
    if (sloppy) {
      delta += 0.052 * uiDt;
      p.sloppyRouteReads += uiDt > 0 ? 0.018 * uiDt : 0;
    }
    if (clean) delta -= 0.024 * uiDt;
    
    state.adaptivePressure = clamp((state.adaptivePressure || 0) + delta, 0, 100);
    if (state.adaptivePressure >= 85) {
      p.highAdaptivePressureFrames += 1;
      if (p.highAdaptivePressureFrames > 180 && !p.adaptiveOverwhelmed) {
        p.adaptiveOverwhelmed = true;
        p.adaptiveOverwhelmedEvents += 1;
        p.lastAdaptiveEvent = "OVERWHELMED BY CIVIC PRESSURE";
        if (tag) tag("ROUTE REJECTED: PRESSURE LIMIT", "#fb7185");
      }
    } else {
      p.highAdaptivePressureFrames = 0;
      p.adaptiveOverwhelmed = false;
    }
  }

  return { recordAdaptiveRailContact, updateAdaptivePressure };
}
