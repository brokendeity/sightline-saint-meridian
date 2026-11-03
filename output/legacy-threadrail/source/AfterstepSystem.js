// Handles the Afterstep core traversal mechanic.

export function createAfterstepSystem(deps) {
  const {
    state,
    keys,
    setPose,
    ghost,
    ring,
    burst,
    closestRail,
    entryBoostFor,
    isClimbRail,
    say,
    tag,
    nearbyParkourSurface,
    startWallRun,
    forward,
    right,
    exitRail,
    phase31UseCoyoteChain
  } = deps;

  function canAfterstepNow() {
    const p = state.p;
    if (state.result) return false;
    if (p.afterCharge > 0) return false;
    if (state.carts.length === 0) return false;
    if (state.aimLocks.length > 0 && !state.aim.down) return false;
    return true;
  }

  function afterstep() {
    const p = state.p;
    if (state.result) return;
    if (!p.rail && !p.launch && phase31UseCoyoteChain && phase31UseCoyoteChain("COYOTE AFTERSTEP CHAIN")) return;
    
    p.afterCharge = 22;
    setPose("AFTERSTEP_WINDUP", 22, 6);
    p.launchAnticipations += 1;
    ghost("AFTERSTEP");
    ring({ x: p.x, y: p.y + 10, z: p.z }, "rgba(255,214,74,.75)", 46, 28);
    burst({ x: p.x, y: p.y + 14, z: p.z }, "rgba(255,204,65,.9)", 14, 4, 3);
    
    if (p.rail) {
      const next = closestRail(p.rail.rail, 540);
      if (next) {
        p.launch = { rail: next.rail, t: next.t, timer: 42, fromChain: true, entryBoost: entryBoostFor(next.rail, true), from: { x: p.x, y: p.y, z: p.z } };
        setPose("AFTERSTEP_LAUNCH", 42, 12);
        p.afterstepLaunches += 1;
        p.rail = null;
        p.grounded = false;
        state.shake = 14;
        state.routeStarted = true;
        state.slowMo = 6;
        tag("CHAIN WINDOW HIT", "#86efac");
        p.afterstepBoost = 42;
        p.momentum = Math.max(p.momentum, 1.15);
        p.verticalMomentum = Math.max(p.verticalMomentum, isClimbRail(next.rail) ? 1.35 : 0.65);
        say(isClimbRail(next.rail) ? "RAIL-CHAIN AFTERSTEP: climb boost loaded. Hold the upward grind." : "RAIL-CHAIN AFTERSTEP: kicked off current rail toward the next hard Threadrail.");
        return;
      }
      const wall = nearbyParkourSurface(92);
      if (wall) {
        p.grindWallTransfers += 1;
        startWallRun(wall, "GRIND-TO-WALL TRANSFER");
        return;
      }
      const f = forward();
      exitRail(1.38, { x: f.x * 6, y: 5, z: f.z * 6 });
      p.lastFailure = "NO RAIL LOCKED";
      tag("NO RAIL LOCKED", "#fb7185");
      say("Afterstep rail-kick: no next rail locked, boosted into free air. Fire a new cartridge.");
      return;
    }
    
    const near = closestRail(null, 430);
    if (near) {
      p.launch = { rail: near.rail, t: near.t, timer: 44, fromChain: false, entryBoost: entryBoostFor(near.rail, false), from: { x: p.x, y: p.y, z: p.z } };
      setPose("AFTERSTEP_LAUNCH", 44, 12);
      p.afterstepLaunches += 1;
      p.grounded = false;
      state.routeStarted = true;
      state.slowMo = 5;
      p.afterstepBoost = 38;
      p.momentum = Math.max(p.momentum, 1.0);
      p.verticalMomentum = Math.max(p.verticalMomentum, isClimbRail(near.rail) ? 1.2 : 0.5);
      tag(isClimbRail(near.rail) ? "AFTERSTEP CLIMB LOCK" : "AFTERSTEP LOCK", isClimbRail(near.rail) ? "#86efac" : "#facc15");
      say(isClimbRail(near.rail) ? "AFTERSTEP DRIVE: loading climb force into the upward Threadrail." : "AFTERSTEP DRIVE: launching toward the rail, not web-pulling.");
      return;
    }
    
    const wall = !p.grounded ? nearbyParkourSurface(88) : null;
    if (wall) {
      startWallRun(wall, "AFTERSTEP WALL-RUN");
      return;
    }
    
    const f = forward();
    const r = right();
    const side = (keys.has("d") ? 1 : 0) - (keys.has("a") ? 1 : 0);
    p.vx += f.x * 12 + r.x * side * 7;
    p.vz += f.z * 12 + r.z * side * 7;
    p.vy += p.grounded ? 8.5 : 3.2;
    setPose("AFTERSTEP_LAUNCH", 34, 10);
    p.afterstepLaunches += 1;
    p.afterstepBoost = 30;
    p.momentum = Math.max(p.momentum, 0.85);
    p.verticalMomentum = Math.max(p.verticalMomentum, 0.45);
    p.grounded = false;
    p.lastFailure = "NO RAIL READY";
    state.routeStarted = true;
    say("Afterstep burst: create a rail, then press Shift near it.");
  }

  return { canAfterstepNow, afterstep };
}
