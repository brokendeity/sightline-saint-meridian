export function createThreadrailSystem(deps) {
  const { state, aim, tag, say, clamp, ghost, ring, dist, forward, right, railDir3, unit3, dot3, railPoint, isClimbRail, recordRailAnalytics, railStatus, railQuality, railIdentityProfile, authoringIntent, phase29RecordAuthoredRail, phase30RecordSurfaceRail, phase39RecordCommit, liveAnchors, setPose, recordRailPopAnalytics, railPopSkillInfo, setMomentumSkill, phase49TriggerAudio, phase31UseCoyoteChain } = deps;

    function makeRail(a, b) {
      const status = railStatus(a, b);
      const quality = railQuality(a, b, status, aim.held);
      if (!status.ok) {
        recordRailAnalytics(status, quality, false);
        state.p.lastFailure = status.text;
        state.p.lastRailGrade = "BAD";
        state.p.lastRailQuality = 0;
        state.designerWarnings = (state.designerWarnings || 0) + 1;
        state.designerLastSelection = "REJECTED: " + status.text + " / dist " + Math.round(status.distance || 0) + " / slope " + Math.round((status.slope || 0) * 100) + "%";
        tag(status.text, "#fb7185");
        say(status.text + ": hold LMB to split-aim the second pin, or aim low to create a ground-ramp cartridge.");
        return;
      }
      if (a.z > b.z) [a, b] = [b, a];
      recordRailAnalytics(status, quality, true);
      const energyCost = quality.grade === "PERFECT" ? 9 : quality.grade === "CLEAN" ? 10 : quality.grade === "STABLE" ? 12 : 15;
      state.p.energy = clamp(state.p.energy - energyCost, 0, 100);
      state.p.lastRailGrade = quality.grade;
      state.p.lastRailQuality = quality.score;
      state.p.lastRailType = status.type;
      state.p.recentRailTypeTimer = 140;
      state.designerAuthoringReads = (state.designerAuthoringReads || 0) + 1;
      state.designerLastRailType = status.type;
      state.designerLastSelection = quality.grade + " " + status.text + " / " + Math.round(status.distance || 0) + "u / slope " + Math.round((status.slope || 0) * 100) + "% / " + (aim.held ? "MANUAL" : "AUTO");
      const phase39Profile = phase39RecordCommit(a, b, status, quality);
      const identity = railIdentityProfile(status.type);
      state.railIdentityName = identity.name;
      state.railIdentityFeel = identity.feel;
      state.railIdentityExpression = identity.expression;
      state.railIdentityColor = identity.color;
      state.railIdentityNote = "CARTRIDGE AUTHORING / " + identity.expression;
      state.railIdentityHeat = 110;
      const authorIntent = authoringIntent(a, b, status, quality);
      const phase29Profile = phase29RecordAuthoredRail(a, b, status, quality);
      const phase30Profile = phase30RecordSurfaceRail(a, b, status, quality, phase29Profile);
      if (a.virtual || b.virtual) state.p.freeformRails += 1;
      if (status.type === "emergencyRail") state.p.emergencyRails += 1;
      if (status.type === "diagonal" || status.type === "freeformRail") state.p.diagonalRails += 1;
      if (status.type === "sameSide") state.p.sameWallAuthorRails += 1;
      if (status.type === "groundRamp" || status.type === "verticalClimb") state.p.groundLaunchRails += 1;
      state.p.authoredRails += 1;
      if (quality.manual) state.p.manualSplitRails += 1; else state.p.autoSplitRails += 1;
      if (quality.grade === "PERFECT") { state.p.perfectRails += 1; state.score += 160; state.slowMo = Math.max(state.slowMo, 5); }
      else if (quality.grade === "CLEAN") { state.p.cleanRails += 1; state.score += 90; }
      else if (quality.grade === "ROUGH") { state.p.roughRails += 1; state.shake = Math.max(state.shake, 8); }
      state.carts.push({
        start: { x: state.p.x, y: state.p.y + 46, z: state.p.z + 10 },
        split: { x: (a.x + b.x) / 2, y: Math.max(a.y, b.y) + 55, z: (a.z + b.z) / 2 },
        a,
        b,
        type: status.type,
        label: status.text,
        color: status.color,
        climb: status.climb,
        quality,
        grade: quality.grade,
        qScore: quality.score,
        identity,
        identityName: identity.name,
        identityExpression: identity.expression,
        identityColor: identity.color,
        identitySpark: identity.spark,
        manual: quality.manual,
        freeform: quality.freeform,
        authorIntent,
        phase29Profile,
        phase29Signature: phase29Profile.signature,
        routeFeel: phase29Profile.feel,
        dynamicRoute: phase29Profile.dynamic,
        phase30Profile,
        phase30SurfaceRead: phase30Profile.read,
        surfaceAuthored: phase30Profile.hasP30,
        phase39Profile,
        phase39IntentId: phase39Profile.intentId,
        phase39IntentLabel: phase39Profile.label,
        pin1: false,
        pin2: false,
        t: 0,
        born: false,
        snapped: false
      });
      ghost(state.p.rail ? "CHAIN PREP" : status.type === "emergencyRail" ? "EMERGENCY" : status.type === "groundRamp" ? "GROUND PIN" : quality.freeform ? "FREEFORM" : quality.manual ? "MANUAL SPLIT" : "AUTO SPLIT");
      ring({ x: state.p.x, y: state.p.y + 45, z: state.p.z }, quality.color, quality.grade === "PERFECT" ? 40 : 28, 26);
      tag(quality.grade + " " + authorIntent, quality.color);
      say(authorIntent + " created a " + quality.grade + " " + status.text + ". " + (status.type === "emergencyRail" ? "Emergency rails are rough but save bad air routes." : quality.grade === "PERFECT" ? "Perfect rail will enter with cleaner contact and longer life." : quality.grade === "ROUGH" ? "Rough rail will wobble more; still usable, but chain carefully." : "Shift Afterstep to catch it."));
    }

    function refreshRails() {
      const live = liveAnchors();
      state.rails.forEach(r => {
        if (!r.dynamic) return;
        const a = live.find(x => x.id === r.aId);
        const b = live.find(x => x.id === r.bId);
        if (a) r.a = a;
        if (b) r.b = b;
      });
    }

    function transitionRailTypeBonus(rail) {
      if (!rail) return 0;
      const t = rail.type || rail.identity?.type || "freeformRail";
      if (t === "verticalClimb" || t === "groundRamp") return 34;
      if (t === "sameSide") return 28;
      if (t === "droneRail") return 24;
      if (t === "cross") return 18;
      if (t === "emergencyRail") return -16;
      return 8;
    }

    function railTransitionCandidateScore(rail, sampleT, q, exclude = null) {
      const p = state.p;
      const ph = state.phase31RailTransition || {};
      const d = dist(p, q);
      const railDir = railDir3(rail);
      const currentDir = p.rail?.rail ? railDir3(p.rail.rail) : unit3({ x: p.vx || forward().x, y: p.vy || 0, z: p.vz || forward().z });
      const forwardDelta = q.z - p.z;
      const forwardScore = clamp(forwardDelta / 360, -1, 1) * 82;
      const dirScore = clamp(dot3(railDir, currentDir), -1, 1) * 42;
      const distScore = 118 - Math.abs(d - 260) * 0.28;
      const heightDelta = Math.abs(q.y - p.y);
      const heightScore = 34 - heightDelta * 0.10;
      const typeScore = transitionRailTypeBonus(rail);
      const continuity = rail.a?.surfaceSide === rail.b?.surfaceSide && rail.type === "sameSide" ? 18 : 0;
      const chainWindow = p.rail ? clamp((p.rail.t || 0) * 80, 0, 68) : (ph.coyoteTimer > 0 ? 34 : 0);
      const qualityScore = rail.grade === "PERFECT" ? 26 : rail.grade === "CLEAN" ? 16 : rail.grade === "ROUGH" ? -10 : 0;
      const wrongWayPenalty = forwardDelta < -70 ? 160 : forwardDelta < 20 ? 52 : 0;
      const sameRailPenalty = exclude && rail === exclude ? 999 : 0;
      const emergencyPenalty = rail.type === "emergencyRail" && p.rail ? 28 : 0;
      const score = distScore + forwardScore + dirScore + heightScore + typeScore + continuity + chainWindow + qualityScore - wrongWayPenalty - sameRailPenalty - emergencyPenalty;
      let reason = "FORWARD CONTINUITY";
      if (forwardDelta < -70) reason = "REJECTED: BACKWARD LOCK";
      else if (d > 520) reason = "FAR BUT VALID";
      else if (rail.type === "sameSide") reason = "SAME-SIDE CHAIN";
      else if (rail.type === "verticalClimb" || rail.type === "groundRamp") reason = "UPWARD FLOW";
      else if (rail.type === "droneRail") reason = "MOVING HOOK FLOW";
      return { rail, t: sampleT, d, q, score, reason, forwardDelta, dirScore, color: score > 165 ? "#86efac" : score > 115 ? "#facc15" : "#fb923c" };
    }

    function closestRail(exclude = null, maxDistance = 430) {
      const ph = state.phase31RailTransition || (state.phase31RailTransition = {});
      let best = null;
      let candidates = 0;
      let avoided = 0;
      for (const rail of state.rails) {
        if (exclude && rail === exclude) continue;
        for (let i = 2; i < 40; i++) {
          const t = i / 42;
          const q = railPoint(rail, t);
          const d = dist(state.p, q);
          if (d >= maxDistance) continue;
          const c = railTransitionCandidateScore(rail, t, q, exclude);
          if (c.forwardDelta < -70) { avoided += 1; continue; }
          candidates += 1;
          if (!best || c.score > best.score) best = c;
        }
      }
      ph.candidateCount = candidates;
      ph.bestScore = best ? Math.round(best.score) : 0;
      ph.bestDistance = best ? Math.round(best.d) : 0;
      ph.railRef = best?.rail || null;
      ph.railT = best?.t || 0;
      ph.nextRailLabel = best ? ((best.rail.identityName || best.rail.label || best.rail.type || "THREADRAIL") + " @ " + ph.bestDistance + "m") : "NONE";
      ph.currentHint = best ? best.reason : "NO VALID FORWARD RAIL";
      ph.color = best?.color || (candidates ? "#fb923c" : "#94a3b8");
      if (avoided) {
        ph.lastAvoided = "Prevented " + avoided + " backward/wrong-angle lock" + (avoided === 1 ? "" : "s");
        state.p.phase31WrongLocksPrevented += avoided;
      }
      if (best) state.p.phase31RailHints += 1;
      return best;
    }

    function phase31ArmCoyote(railState, popInfo = null) {
      const ph = state.phase31RailTransition || (state.phase31RailTransition = {});
      const next = closestRail(railState?.rail || null, 620);
      if (!next) {
        ph.coyoteTimer = Math.max(ph.coyoteTimer || 0, 18);
        ph.coyoteRail = null;
        ph.coyoteT = 0;
        ph.lastReason = "Rail-pop coyote active, but no clean next rail was found.";
        return null;
      }
      ph.coyoteRail = next.rail;
      ph.coyoteT = next.t;
      ph.coyoteTimer = popInfo?.perfect ? 46 : popInfo?.tight ? 38 : 30;
      ph.lastReason = "Coyote chain armed: Shift can still catch " + (next.rail.identityName || next.rail.type || "next rail") + ".";
      ph.color = next.color || "#a78bfa";
      state.p.phase31TransitionAssists += 1;
      return next;
    }

    function exitRail(boost = 1, extra = { x: 0, y: 0, z: 0 }) {
      const p = state.p;
      if (!p.rail) return;
      const a = p.rail.rail.a;
      const b = p.rail.rail.b;
      const length = Math.max(1, dist(a, b));
      const pop = railPopSkillInfo(p.rail);
      recordRailPopAnalytics(pop);
      const clean = pop.ready;
      const exitingRailState = p.rail;
      phase31ArmCoyote(exitingRailState, pop);
      const climbRail = isClimbRail(p.rail.rail);
      const multiplier = p.momentumMultiplier || 1;
      const popBoost = boost + pop.boost + (climbRail ? 0.12 : 0) + (multiplier - 1) * 0.22;
      p.vx = ((b.x - a.x) / length) * 20 * popBoost + extra.x;
      p.vy = ((b.y - a.y) / length) * (climbRail ? 18 : 12) + 9 + extra.y + (pop.perfect ? 6 : pop.tight ? 4 : pop.ready ? 2 : 0) + (climbRail ? 3 : 0);
      p.vz = ((b.z - a.z) / length) * 20 * popBoost + extra.z;
      p.airControl = pop.perfect ? 64 : pop.tight ? 55 : pop.ready ? 38 : climbRail ? 28 : 16;
      p.railClimbState = climbRail ? "CLIMB EXIT" : "CRUISE EXIT";
      setPose(pop.perfect ? "PERFECT_POP" : pop.ready ? "RAIL_POP" : "STUMBLE", pop.perfect ? 38 : pop.ready ? 30 : 24, 8);
      p.rail = null;
      p.bootGlow = pop.perfect ? 34 : pop.ready ? 22 : 12;
      state.routeStarted = true;
      state.shake = pop.perfect ? 20 : pop.ready ? 11 : 7;
      state.lastPopGrade = pop.grade;
      ring({ x: p.x, y: p.y + 12, z: p.z }, pop.perfect ? "rgba(134,239,172,.95)" : pop.ready ? "rgba(255,248,203,.72)" : "rgba(148,163,184,.5)", pop.perfect ? 60 : pop.ready ? 40 : 28, 30);
      if (pop.perfect || pop.tight) {
        p.perfectPops += pop.perfect ? 1 : 0;
        p.momentumTightPops += 1;
        p.recentPopTimer = pop.perfect ? 120 : 90;
        state.score += pop.perfect ? 260 : 170;
        setMomentumSkill(pop.perfect ? "PERFECT POP PEAK" : "TIGHT POP", pop.perfect ? 1.25 : 0.85, pop.color, pop.hint);
        say((pop.perfect ? "PERFECT RAIL POP" : "TIGHT RAIL POP") + ": " + pop.hint);
      } else if (pop.early || pop.late) {
        if (pop.early) p.momentumEarlyPops += 1; else p.momentumLatePops += 1;
        p.recentPopTimer = 56;
        state.score += 60;
        setMomentumSkill(pop.label, 0.34, pop.color, pop.hint);
        say(pop.label + ": " + pop.hint);
      } else {
        p.momentumDeadPops += 1;
        dropMomentumSkill("DEAD POP - NO BOOST", 22);
        say("Dead rail-pop: you jumped outside the meter window. It works, but kills the flow boost.");
      }
    }

  return { makeRail, refreshRails, closestRail, phase31ArmCoyote, exitRail, transitionRailTypeBonus, railTransitionCandidateScore };
}
