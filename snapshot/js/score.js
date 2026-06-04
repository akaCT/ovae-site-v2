/* ============================================================
   The AI Leverage Snapshot — scoring engine (client-side, pure)
   window.SnapScore = { scoreActA, scoreActB, persona, selftest }
   All cut points are config constants (uncalibrated — retune after ~50 responses).
   ============================================================ */
(function () {
  "use strict";

  // ---- config constants (calibration knobs) ----
  var RUNG_NAMES = ["Newcomer", "Searcher", "Drafter", "Operator", "Builder", "Conductor"];
  var YOU_HIGH_CUT = 3;        // Operator+ counts as "high you" for the quadrant
  var BIZ_HIGH_CUT = 50;       // business pct >= 50 (Leveraged+) counts as "high business"
  var INDEX_BY_RUNG = [6, 22, 40, 60, 80, 93]; // private 0-100 anchor per rung
  var DIM_WEIGHT = { BI: 1.5, KPD: 1.5, AUTO: 1.0, DATA: 1.0, TEAM: 1.0, REV: 1.0 };
  var DIM_NAME = {
    BI: "Business Intelligence", KPD: "Key-Person Dependency", AUTO: "Workflow Automation",
    DATA: "Data Infrastructure", TEAM: "Team Leverage", REV: "Revenue Engine"
  };
  var TIE_BREAK = ["BI", "KPD", "DATA", "AUTO", "TEAM", "REV"];
  var BANDS = [
    { max: 25, name: "Blind" }, { max: 50, name: "Surfacing" },
    { max: 75, name: "Leveraged" }, { max: 100, name: "AI-Native" }
  ];

  function clampRung(r) { return Math.max(0, Math.min(5, r | 0)); }

  // ---- ceiling: highest rung the unsupervised-action checklist permits ----
  // selections = array of chosen ceiling option objects; each may carry capRung.
  // Convention: "none / I review everything" => cap 3 (Operator).
  //   any single unsupervised action => cap 4 ; multi-step end-to-end => cap 5.
  function ceilingCap(selections) {
    if (!selections || !selections.length) return 3;
    var caps = selections.map(function (o) {
      return (o && typeof o.capRung === "number") ? o.capRung : (o && o.none ? 3 : 4);
    });
    return Math.max.apply(null, caps);
  }

  // ---- Act A: personal AI fluency ----
  // a = { picks:[{rung,style}], ceiling:[chosen ceiling opts], barely:bool }
  function scoreActA(a) {
    a = a || {};
    var picks = (a.picks || []).filter(Boolean);
    var confirmers = (a.confirmers || []).filter(Boolean);
    var scenarioMax = picks.length ? Math.max.apply(null, picks.map(function (p) { return clampRung(p.rung); })) : 0;
    // the matching confirmer is the more deliberate read — it can raise or lower the scenario claim
    var claimed = confirmers.length ? Math.max.apply(null, confirmers.map(function (p) { return clampRung(p.rung); })) : scenarioMax;

    // explicit "barely use it" floor
    if (a.barely && claimed <= 1) claimed = scenarioMax >= 1 ? 1 : 0;

    // Guttman ceiling: zero/low unsupervised autonomy can't sit at Builder/Conductor
    var cap = ceilingCap(a.ceiling);
    var rung = Math.min(claimed, cap);
    rung = clampRung(rung);

    // style: dominant tag across all picks, tie-break toward the highest-rung pick
    var allForStyle = picks.concat(confirmers);
    var tally = { centaur: 0, cyborg: 0, self: 0 };
    allForStyle.forEach(function (p) { if (p.style && tally.hasOwnProperty(p.style)) tally[p.style] += 1; });
    var style = "cyborg", best = -1;
    Object.keys(tally).forEach(function (k) { if (tally[k] > best) { best = tally[k]; style = k; } });
    if (best <= 0) {
      var top = allForStyle.slice().sort(function (x, y) { return clampRung(y.rung) - clampRung(x.rung); })[0];
      if (top && top.style) style = top.style;
    }

    var index = INDEX_BY_RUNG[rung];
    // small lateral nudge so two same-rung people differ a touch (private only)
    if (style === "self" && rung >= 3) index = Math.min(99, index + 3);
    if (style === "centaur" && rung <= 2) index = Math.max(1, index - 2);

    return {
      rung: rung, rungName: RUNG_NAMES[rung], style: style,
      index: index, claimedRung: claimed, capped: rung < claimed
    };
  }

  // ---- Act B: business leverage (reuse readiness weighted-average) ----
  // role-forked questions are supplied by content; here we just need {qid: {dim, v}}.
  // answers = array of {dim, v} (v in 0..3)
  function scoreActB(role, answers) {
    answers = (answers || []).filter(function (x) { return x && x.dim && typeof x.v === "number"; });
    var byDim = {};
    answers.forEach(function (x) {
      if (!byDim[x.dim]) byDim[x.dim] = [];
      byDim[x.dim].push(Math.max(0, Math.min(3, x.v)));
    });
    var dims = {};
    Object.keys(byDim).forEach(function (d) {
      var arr = byDim[d];
      var avg = arr.reduce(function (s, v) { return s + v; }, 0) / arr.length; // 0..3
      dims[d] = { pct: Math.round((avg / 3) * 100), count: arr.length };
    });

    var wSum = 0, wTot = 0;
    Object.keys(dims).forEach(function (d) {
      var w = DIM_WEIGHT[d] || 1.0;
      wSum += dims[d].pct * w; wTot += w;
    });
    var pct = wTot ? Math.round(wSum / wTot) : 0;
    var band = BANDS.find(function (b) { return pct <= b.max; }).name;

    // constraint = lowest unweighted dim; co-constraint if two lowest within one item-step
    var ordered = Object.keys(dims).sort(function (x, y) {
      if (dims[x].pct === dims[y].pct) return TIE_BREAK.indexOf(x) - TIE_BREAK.indexOf(y);
      return dims[x].pct - dims[y].pct;
    });
    var constraint = ordered[0] || null;
    var co = [];
    if (ordered[1]) {
      var step = Math.round(100 / 3 / Math.max(1, dims[ordered[0]].count)); // ~one item move
      if (Math.abs(dims[ordered[0]].pct - dims[ordered[1]].pct) <= step) co = [ordered[0], ordered[1]];
    }
    return {
      role: role, pct: pct, band: band, dims: dims,
      constraint: constraint, constraintName: constraint ? DIM_NAME[constraint] : null,
      coConstraints: co, fixOrder: ordered.slice(0, 3)
    };
  }

  // ---- persona quadrant (narrative only — never routes) ----
  function persona(actA, actB) {
    var youHigh = actA && actA.rung >= YOU_HIGH_CUT;
    var bizHigh = actB && actB.pct >= BIZ_HIGH_CUT;
    var key, label;
    if (youHigh && !bizHigh) { key = "bottlenecked_builder"; label = "Bottlenecked"; }
    else if (!youHigh && bizHigh) { key = "next_at_wheel"; label = "Coasting"; }
    else if (!youHigh && !bizHigh) { key = "ground_floor"; label = "Untapped"; }
    else { key = "ai_native"; label = "Compounding"; }
    return { key: key, label: label, youHigh: !!youHigh, bizHigh: !!bizHigh };
  }

  // ---- self-tests: assert no impossible states ----
  function selftest() {
    var fails = [];
    function ok(cond, msg) { if (!cond) fails.push(msg); }
    // claimed Orchestrator but reviews everything => capped to Operator
    var r1 = scoreActA({ picks: [{ rung: 5, style: "self" }], ceiling: [{ none: true, capRung: 3 }] });
    ok(r1.rung === 3, "ceiling cap should hold (got " + r1.rung + ")");
    // claimed Builder + runs multi-step unsupervised => stays Builder+
    var r2 = scoreActA({ picks: [{ rung: 4, style: "self" }], ceiling: [{ capRung: 5 }] });
    ok(r2.rung === 4, "uncapped builder should stay 4 (got " + r2.rung + ")");
    // barely use => floor 0/1
    var r3 = scoreActA({ picks: [{ rung: 1, style: "cyborg" }], barely: true, ceiling: [{ none: true }] });
    ok(r3.rung <= 1, "barely-user floored (got " + r3.rung + ")");
    // business band math
    var b = scoreActB("owner", [{ dim: "BI", v: 0 }, { dim: "KPD", v: 0 }, { dim: "REV", v: 3 }]);
    ok(b.band === "Blind" || b.band === "Surfacing", "low BI/KPD should drag band low (got " + b.band + ")");
    ok(b.constraint === "BI" || b.constraint === "KPD", "constraint should be a zero dim (got " + b.constraint + ")");
    // persona quadrant
    var p = persona({ rung: 4 }, { pct: 20 });
    ok(p.key === "bottlenecked_builder", "high-you/low-biz => bottlenecked_builder (got " + p.key + ")");
    if (fails.length) { console.error("SnapScore selftest FAILED:", fails); }
    else { console.log("SnapScore selftest passed"); }
    return fails;
  }

  window.SnapScore = {
    scoreActA: scoreActA, scoreActB: scoreActB, persona: persona, selftest: selftest,
    RUNG_NAMES: RUNG_NAMES, DIM_NAME: DIM_NAME, config: { YOU_HIGH_CUT: YOU_HIGH_CUT, BIZ_HIGH_CUT: BIZ_HIGH_CUT }
  };
})();
