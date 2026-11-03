export function createRecoverySystem(deps) {
  const { state, aim, tag, say, clamp, ghost, ring, dist, forward, right, railDir3, unit3, dot3, railPoint, isClimbRail, recordRailAnalytics, railStatus, railQuality, railIdentityProfile, authoringIntent, phase29RecordAuthoredRail, phase30RecordSurfaceRail, phase39RecordCommit, liveAnchors, setPose, recordRailPopAnalytics, railPopSkillInfo, setMomentumSkill, phase49TriggerAudio, burst, phase31UseCoyoteChain, exitRail, nearestPointOnLine, makeRail } = deps;

    function phase32PickRouteNudge(kind = "GENERAL") {
      const ph = state.phase32FailureRecovery || (state.phase32FailureRecovery = {});
      let target = null;
      let label = "RECOVERY ROUTE";
      const p = state.p;
      if (kind.includes("CHAIN") || kind.includes("CONTACT") || kind.includes("CLIMB")) {
        const next = closestRail(p.rail?.rail || null, kind.includes("CHAIN") ? 650 : 520);
        if (next) {
          const q = railPoint(next.rail, next.t || 0.24);
          target = { x: q.x, y: q.y + 24, z: q.z };
          label = kind.includes("CHAIN") ? "NEXT RAIL SAVE" : kind.includes("CLIMB") ? "MOMENTUM RAIL" : "CLEAN CONTACT TARGET";
        }
      }
      if (!target && state.recoveryPads?.length) {
        let best = null;
        for (const pad of state.recoveryPads) {
          const d = Math.abs((pad.z || 0) - p.z) + Math.abs((pad.x || 0) - p.x) * 0.35;
          if ((pad.z || 0) >= p.z - 120 && (!best || d < best.d)) best = { pad, d };
        }
        if (best) {
          target = { x: best.pad.x || 0, y: 18, z: best.pad.z || p.z + 220 };
          label = "RECOVERY PAD";
        }
      }
      if (!target) target = { x: clamp(p.x, -120, 120), y: Math.max(50, p.y + 38), z: p.z + 260 };
      ph.routeNudgeTarget = target;
      ph.routeNudgeLabel = label;
      ph.routeNudgeT = 170;
    }

    function phase32ManualTutorial() {
      const ph = state.phase32FailureRecovery || (state.phase32FailureRecovery = {});
      ph.tutorialStep = ((ph.tutorialStep || 0) + 1) % (ph.tutorialSteps?.length || 1);
      const step = ph.tutorialSteps?.[ph.tutorialStep] || "LMB → SHIFT → SPACE → Q/E";
      state.p.phase32ManualLessonRequests += 1;
      state.p.phase32TutorialPrompts += 1;
      phase32SetLesson("MANUAL_TUTOR_" + ph.tutorialStep, "TUTOR STEP " + (ph.tutorialStep + 1), step, "Practice this input in the next route beat.", "#38bdf8", "TUTOR", 220);
    }

    function setMomentumSkill(kind, quality = 1, color = "#facc15", note = "") {
      const p = state.p;
      const q = clamp(quality, 0, 1.65);
      const gain = Math.round(60 * q + (p.chain || 0) * 8);
      state.momentumSkillScore += gain;
      state.momentumSkillHeat = clamp((state.momentumSkillHeat || 0) + 18 * q, 0, 100);
      state.momentumCombo = Math.max(1, (state.momentumCombo || 0) + 1);
      state.momentumComboBest = Math.max(state.momentumComboBest || 0, state.momentumCombo);
      state.momentumComboT = 145;
      state.lastMomentumTech = kind;
      state.momentumSkillNote = note || kind;
      state.momentumSkillColor = color;
      p.momentumSkillScore += gain;
      p.momentumMultiplier = clamp(1 + (state.momentumCombo || 0) * 0.035 + q * 0.08, 1, 1.55);
      p.lastMomentumTech = kind;
      if (state.momentumSkillScore > 3200) state.momentumSkillTier = "THREAD SAINT";
      else if (state.momentumSkillScore > 1900) state.momentumSkillTier = "RUNNER";
      else if (state.momentumSkillScore > 900) state.momentumSkillTier = "CLEAN";
      else state.momentumSkillTier = "CADET";
      tag(kind, color);
    }

  return { phase32PickRouteNudge, phase32ManualTutorial, setMomentumSkill };
}
