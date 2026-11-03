export function createSnapbackSystem(deps) {
  const { state, aim, tag, say, clamp, ghost, ring, dist, forward, right, railDir3, unit3, dot3, railPoint, isClimbRail, recordRailAnalytics, railStatus, railQuality, railIdentityProfile, authoringIntent, phase29RecordAuthoredRail, phase30RecordSurfaceRail, phase39RecordCommit, liveAnchors, setPose, recordRailPopAnalytics, railPopSkillInfo, setMomentumSkill, phase49TriggerAudio, burst, phase31UseCoyoteChain, exitRail, nearestPointOnLine, makeRail } = deps;

    function canBankNow() {
      if (state.result) return false;
      if (state.p.snap) return false;
      return true;
    }

    function bank() {
      const p = state.p;
      const speed = Math.hypot(p.vx || 0, p.vy || 0, p.vz || 0);
      const routeTrace = captureSpoolRouteTrail(p.rail ? 30 : 22);
      const memoryGrade = gradeSpoolRouteMemory(routeTrace);
      p.bank = {
        x: p.x,
        y: p.y,
        z: p.z,
        max: clamp(520 + speed * 7 + (p.rail ? 80 : 0) + routeTrace.length * 3, 540, 760),
        perfect: false,
        redline: false,
        warn: false,
        redWarn: false,
        echo: p.rail ? "rail-bank" : p.grounded ? "ground-bank" : "air-bank",
        born: state.t,
        savedChain: p.chain,
        stateLabel: "SAFE TETHER",
        routeTrace,
        exitHint: routeTrace[routeTrace.length - 1] || null,
        memoryGrade,
        routeType: p.rail?.rail?.type || p.lastRailType || "freeformRail"
      };
      p.routeEchoBanks += 1;
      p.bankedExitReads += routeTrace.length ? 1 : 0;
      p.afterimageRouteScore += memoryGrade.score;
      state.spoolMemoryScore += memoryGrade.score;
      state.spoolMemoryHeat = 1;
      state.spoolStoredLength = routeTrace.length;
      state.spoolStoredType = p.bank.routeType;
      state.spoolMemoryStatus = memoryGrade.grade;
      state.spoolMemoryHint = "Stored " + routeTrace.length + " route samples. Follow the gold echo trail for Snapback / Clean Snap timing.";
      burst({ x: p.x, y: p.y + 24, z: p.z }, "rgba(255,204,65,.8)", 12, 3.5, 3);
      ring({ x: p.x, y: p.y + 24, z: p.z }, "rgba(255,204,65,.72)", 42, 30);
      spawnRouteReplayGhosts(routeTrace, "BANKED ROUTE", memoryGrade.color);
      ghost("BANKED ECHO");
      setPose("BANK", 22, 4);
      tag("BANKED ECHO SET / " + memoryGrade.grade, memoryGrade.color);
      say(p.rail ? "Spool-tension banked from the rail. The afterimage route is now visible: E recalls it, Space converts tension." : "Afterimage route banked. The tether now shows where Backspool already moved.");
    }

    function canSnapbackNow() {
      return !state.result && !!state.p.bank && !state.p.snap;
    }

    function release() {
      const p = state.p;
      if (!p.bank) {
        tag("NO BANKED ECHO", "#fb7185");
        say("No banked tether to release.");
        return;
      }
      p.snap = { g: { ...p.bank }, timer: 20, max: 20 };
      p.rail = null;
      p.launch = null;
      state.slowMo = 7;
      state.shake = 8;
      ghost("SNAPBACK WINDUP");
      setPose("SNAPBACK_WINDUP", 30, 12);
      tag("SNAPBACK WINDUP", "#fff8cb");
      say("SNAPBACK ANTICIPATION: line goes white-hot and taut before the yank.");
    }

    function snapLine(perfect = false, options = {}) {
      const p = state.p;
      if (!p.bank) return;
      const g = p.bank;
      const deliberate = !!options.deliberate;
      const forced = !!options.forced;
      const ten = bankTensionInfo(g);
      const length = Math.max(1, dist(p, g));
      const away = { x: (p.x - g.x) / length, y: (p.y - g.y) / length, z: (p.z - g.z) / length };
      const power = perfect ? 38 : deliberate ? 32 : 23;
      p.vx += away.x * power + (!perfect && !deliberate ? (Math.random() - 0.5) * 8 : 0);
      p.vy += perfect ? 13 : deliberate ? 9 : 3;
      p.vz += away.z * power + (!perfect && !deliberate ? (Math.random() - 0.5) * 8 : 0);
      p.airControl = perfect ? 58 : deliberate ? 38 : 22;
      p.afterCharge = Math.max(p.afterCharge || 0, perfect ? 24 : deliberate ? 18 : 8);
      p.momentum = Math.max(p.momentum || 0, perfect ? 1.05 : deliberate ? 0.9 : 0.55);
      p.verticalMomentum = Math.max(p.verticalMomentum || 0, perfect ? 0.8 : deliberate ? 0.58 : 0.25);
      const col = perfect ? "#86efac" : deliberate ? "#fb923c" : "#fff8cb";
      state.flashes.push({ a: { x: p.x, y: p.y + 24, z: p.z }, b: { x: g.x, y: g.y + 24, z: g.z }, life: perfect ? 72 : deliberate ? 62 : 50, color: col, width: perfect ? 11 : deliberate ? 10 : 8, jitter: perfect ? 2 : deliberate ? 5 : 8 });
      cutScannersAlong({ x: p.x, y: p.y, z: p.z }, g);
      p.snapbackStrikeHits += damageEnemiesAlongLine({ x: p.x, y: p.y + 24, z: p.z }, { x: g.x, y: g.y + 24, z: g.z }, perfect ? 74 : deliberate ? 68 : 58, perfect ? 42 : deliberate ? 34 : 26, perfect ? "CLEAN SNAP LINE STRIKE" : deliberate ? "DIRTY SNAP LINE STRIKE" : "FORCED SNAP LINE STRIKE", col, { pierce: perfect ? 18 : 10, stun: perfect ? 58 : 40 });
      burst({ x: p.x, y: p.y + 24, z: p.z }, perfect ? "rgba(134,239,172,1)" : deliberate ? "rgba(251,146,60,1)" : "rgba(255,248,203,1)", perfect ? 26 : deliberate ? 34 : 38, perfect ? 8 : 11, 4);
      ring({ x: p.x, y: p.y + 24, z: p.z }, perfect ? "rgba(134,239,172,.95)" : deliberate ? "rgba(251,146,60,.95)" : "rgba(255,248,203,.85)", perfect ? 64 : deliberate ? 62 : 46, 38);
      setPose(perfect ? "CLEAN_SNAP" : deliberate ? "DIRTY_SNAP" : "STUMBLE", perfect ? 36 : 32, perfect ? 8 : 10);
      commitSpoolMemoryReplay(perfect ? "CLEAN ROUTE REPLAY" : deliberate ? "DIRTY ROUTE BREAK" : "FORCED ROUTE BREAK");
      p.memorySnapbacks += 1;
      p.bank = null;
      p.recentSnapTimer = 110;
      p.bootGlow = perfect ? 32 : deliberate ? 28 : 18;
      state.slowMo = Math.max(state.slowMo, perfect ? 4 : deliberate ? 6 : 3);
      state.shake = perfect ? 16 : deliberate ? 23 : 27;
      if (perfect) {
        p.cleanSnaps += 1;
        p.tetherSaves += 1;
        state.score += 320;
        setMomentumSkill("CLEAN SNAP CONVERSION", 1.05, "#86efac", "Green-zone tether release converted tension into controlled speed.");
        tag("CLEAN SNAP +CONTROL", "#86efac");
        say("CLEAN SNAP: green-zone tension converted into controlled speed without losing the route.");
      } else if (deliberate) {
        p.dirtySnaps += 1;
        p.deliberateDirtySnaps += 1;
        p.dirtySnapBoosts += 1;
        state.score += 220;
        setMomentumSkill("DELIBERATE DIRTY SNAP", 0.72, "#fb923c", "Redline break used as a risky velocity spike.");
        tag("DIRTY SNAP BOOST", "#fb923c");
        say("DIRTY SNAP BOOST: you broke the redline on purpose. Big speed, less control, high style risk.");
      } else {
        p.dirtySnaps += 1;
        p.forcedDirtySnaps += 1;
        p.dirtySnapCrashes += 1;
        p.lastFailure = "FORCED DIRTY SNAP";
        dropMomentumSkill("FORCED DIRTY SNAP", 24);
        tag("FORCED DIRTY SNAP", "#fb7185");
        say("FORCED DIRTY SNAP: the tether overstretched and threw momentum wild. Use E earlier or pop redline on purpose.");
      }
    }

  return { canBankNow, bank, canSnapbackNow, release, snapLine };
}
