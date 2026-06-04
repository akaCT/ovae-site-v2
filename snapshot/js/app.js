/* ============================================================
   The AI Leverage Snapshot — flow engine + rendering
   Depends on window.SNAP_CONTENT (data/content.js) and window.SnapScore (js/score.js)
   ============================================================ */
(function () {
  "use strict";
  var C = window.SNAP_CONTENT || {};
  var Score = window.SnapScore;
  var SUBMIT_URL = "https://muguotipixphthfxjssu.supabase.co/functions/v1/snapshot-submit";
  var STYLE_NAME = { centaur: "Centaur", cyborg: "Cyborg", self: "Self-Automator" };
  var STYLE_COLOR = { centaur: "#7BC9C4", cyborg: "#C9A77B", self: "#C97D5C" };
  var RUNGS = ["Unaware", "Searcher", "Drafter", "Operator", "Builder", "Conductor"];

  // ---- state ----
  var S = {
    picks: [], role: null, confirmerPicks: [], ceiling: [], barely: false, mirror: null,
    actA: null, doBusiness: false, industry: "generic",
    bizAnswers: [], appetite: null, dollar: {}, actB: null, persona: null,
    name: "", email: "", company: "", revenue: "", headcount: "", submitted: false, id: null,
    attribution: {}
  };
  var app, stepIdx = 0, steps = [];

  // ---- dom helpers ----
  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === "class") n.className = attrs[k];
      else if (k === "html") n.innerHTML = attrs[k];
      else if (k === "text") n.textContent = attrs[k];
      else if (k.slice(0, 2) === "on") n.addEventListener(k.slice(2), attrs[k]);
      else n.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (c) { if (c != null) n.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return n;
  }
  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }
  function vlex() { return (C.lexicon && (C.lexicon[S.industry] || C.lexicon.generic)) || {}; }
  // fill {{business}}/{{customer}}/etc. tokens using the active vertical's lexicon
  function T(str) {
    if (typeof str !== "string" || str.indexOf("{{") < 0) return str;
    var L = vlex();
    var customerByVert = { "home-services": "customer", dtc: "customer", agency: "client", course: "student", services: "client", "b2b-saas": "customer", generic: "customer" };
    var map = {
      business: L.noun || "your business", customer: customerByVert[S.industry] || "customer",
      channel: "your main channel", metric: "your key numbers", token: "your tool", unit: L.unit || "a task"
    };
    return str.replace(/\{\{([a-z_]+)\}\}/g, function (m, k) { return map[k] != null ? map[k] : m; });
  }
  // vertical business result/opportunity copy for a dimension, with generic fallback
  function bizResult(dim) {
    var L = vlex(), g = (C.lexicon && C.lexicon.generic) || {};
    var r = (L.business && L.business[dim] && L.business[dim].result) || (g.business && g.business[dim] && g.business[dim].result);
    return T(r || defaultOpp(dim));
  }

  // ---- living card ----
  function renderCard() {
    var lit = S.actA || S.picks.length;
    var name = S.actA ? (STYLE_NAME[S.actA.style] + " " + S.actA.rungName) : (S.picks.length ? "Reading you in…" : "???");
    return el("div", { class: "livingcard" + (lit ? " lit" : "") }, [
      el("div", { class: "lc-wash" }),
      el("div", { class: "lc-label", text: "AI You · " + monthYear() }),
      el("div", { class: "lc-id" + (S.actA ? "" : " ph"), text: name })
    ]);
  }
  function monthYear() {
    try { return new Date().toLocaleString("en-US", { month: "long", year: "numeric" }); } catch (e) { return ""; }
  }

  // ---- progress ----
  function progress(section) { // 1=You, 2=Identity, 3=Business
    var dots = [1, 2, 3].map(function (i) {
      var cls = "dot" + (i < section ? " done" : i === section ? " cur" : "");
      return el("div", { class: cls }, i === section ? [el("span")] : []);
    });
    var label = section === 1 ? "You" : section === 2 ? "Your result" : "Your business";
    return el("div", { class: "progress" }, dots.concat([el("div", { class: "progress-label", text: label })]));
  }

  // ---- screen scaffold ----
  function paint(node, section, withCard) {
    clear(app);
    var inner = el("div", { class: "screen" }, []);
    if (section) inner.appendChild(progress(section));
    if (withCard) inner.appendChild(renderCard());
    inner.appendChild(node);
    var stage = el("div", { class: "stage" }, [inner]);
    app.appendChild(stage);
    window.scrollTo(0, 0);
  }
  function next() { stepIdx++; run(); }
  function run() {
    while (stepIdx < steps.length && steps[stepIdx].when && !steps[stepIdx].when(S)) stepIdx++;
    if (stepIdx >= steps.length) return;
    steps[stepIdx].render(S, next);
  }

  // ---- option pickers ----
  function optionList(opts, onPick, getLabel) {
    return el("div", { class: "opts" }, opts.map(function (o) {
      var label = getLabel ? getLabel(o) : (o.label || o);
      var inner = [el("span", { html: label })];
      if (o && o.sub) inner.push(el("span", { class: "opt-sub", html: o.sub }));
      return el("button", { class: "opt", onclick: function () { onPick(o); } }, [
        el("span", { class: "tick" }),
        el("span", {}, inner)
      ]);
    }));
  }

  // ============================================================
  // BUILD THE FLOW
  // ============================================================
  function buildSteps() {
    steps = [];

    // 0 — cold open
    steps.push({ when: null, render: function (s, go) {
      var hook = (C.hook && C.hook.headline) || "AI has 6 levels. Which one are you?";
      var sub = (C.hook && C.hook.sub) || "90 seconds, no signup. Find your level — and the one habit that gets you to the next.";
      paint(el("div", {}, [
        el("div", { class: "kicker", text: "The AI Leverage Snapshot" }),
        el("h1", { class: "hook", text: hook }),
        el("p", { class: "sub", text: sub }),
        el("div", { class: "btn-row" }, [el("button", { class: "btn btn-primary btn-block", onclick: go, html: "Find my level &nbsp;→" })]),
        el("div", { class: "reassure" }, [
          el("span", { text: "90 seconds" }), el("span", { text: "Instant result" }), el("span", { text: "Free" })
        ]),
        el("div", { class: "credit", text: "Grounded in research from Wharton, Kellogg & BCG" })
      ]), 0, false);
    }});

    // 1..n — scenarios (core measurement)
    (C.scenarios || []).forEach(function (sc) {
      steps.push({ when: null, render: function (s, go) {
        paint(el("div", {}, [
          el("h2", { class: "q-stem", text: sc.stem }),
          sc.help ? el("p", { class: "q-help", text: sc.help }) : null,
          optionList(sc.options, function (o) {
            s.picks.push({ rung: o.rung, style: o.style });
            if (o.barely) s.barely = true;
            go();
          })
        ]), 1, true);
      }});
    });

    // role router
    if (C.roleRouter) steps.push({ when: null, render: function (s, go) {
      paint(el("div", {}, [
        el("h2", { class: "q-stem", text: C.roleRouter.stem }),
        optionList(C.roleRouter.options, function (o) { s.role = o.value; go(); })
      ]), 1, true);
    }});

    // adaptive confirmers
    (C.confirmers || []).forEach(function (cf) {
      steps.push({
        when: function (s) {
          // confirmers run before scoring, so expose a provisional rung (max claimed pick)
          var pr = s.picks.length ? Math.max.apply(null, s.picks.map(function (p) { return p.rung || 0; })) : 0;
          var ss = { picks: s.picks, role: s.role, rung: pr, style: (s.picks[0] || {}).style };
          try { return cf.showIf ? !!cf.showIf(ss) : true; } catch (e) { return true; }
        },
        render: function (s, go) {
          paint(el("div", {}, [
            el("h2", { class: "q-stem", text: cf.stem }),
            optionList(cf.options, function (o) { s.confirmerPicks.push({ rung: o.rung, style: o.style }); go(); })
          ]), 1, true);
        }
      });
    });

    // ceiling (multi-select)
    if (C.ceiling) steps.push({ when: null, render: function (s, go) {
      var chosen = [];
      var box = el("div", { class: "opts" }, C.ceiling.options.map(function (o) {
        return el("button", { class: "opt", onclick: function (e) {
          var b = e.currentTarget; var i = chosen.indexOf(o);
          if (i >= 0) { chosen.splice(i, 1); b.classList.remove("sel"); }
          else {
            if (o.none) { chosen.length = 0; document.querySelectorAll(".opt.sel").forEach(function (x) { x.classList.remove("sel"); }); }
            else { var ni = chosen.findIndex(function (c) { return c.none; }); if (ni >= 0) { chosen.splice(ni, 1); } }
            chosen.push(o); b.classList.add("sel");
          }
        } }, [el("span", { class: "tick" }), el("span", { html: o.label })]);
      }));
      paint(el("div", {}, [
        el("h2", { class: "q-stem", text: C.ceiling.stem }),
        el("p", { class: "q-help", text: "Pick all that apply." }),
        box,
        el("div", { class: "btn-row" }, [el("button", { class: "btn btn-primary btn-block", text: "Continue", onclick: function () { s.ceiling = chosen.slice(); go(); } })])
      ]), 1, true);
    }});

    // mirror (not scored)
    if (C.mirror) steps.push({ when: null, render: function (s, go) {
      paint(el("div", {}, [
        el("h2", { class: "q-stem", text: C.mirror.stem }),
        el("p", { class: "q-help", text: "Just a hunch — we won't hold you to it." }),
        optionList(C.mirror.options, function (o) { s.mirror = o.value; go(); })
      ]), 1, true);
    }});

    // EMAIL GATE — universal. Compute personal score, capture EVERY completer here.
    steps.push({ when: null, render: function (s, go) {
      if (!s.actA) s.actA = Score.scoreActA({ picks: s.picks, confirmers: s.confirmerPicks, ceiling: s.ceiling, barely: s.barely });
      renderGate(s, go);
    }});

    // PERSONAL REVEAL (ungated payoff, post-email)
    steps.push({ when: null, render: function (s, go) { renderPersonalReveal(s, go); }});

    // BUSINESS PROFILE (industry + revenue + headcount) — Act 2 only
    steps.push({ when: function (s) { return s.doBusiness; }, render: function (s, go) { renderProfile(s, go); } });

    // BUSINESS QUESTIONS (role-forked, one per screen)
    steps.push({ when: function (s) { return s.doBusiness; }, render: function (s, go) { renderBusiness(s, go); } });

    // APPETITE
    steps.push({ when: function (s) { return s.doBusiness && C.appetite; }, render: function (s, go) {
      paint(el("div", {}, [
        el("h2", { class: "q-stem", text: C.appetite.stem }),
        optionList(C.appetite.options, function (o) { s.appetite = o.value; updateLead(s); go(); })
      ]), 3, false);
    }});

    // BUSINESS REVEAL
    steps.push({ when: function (s) { return s.doBusiness; }, render: function (s, go) {
      s.actB = Score.scoreActB(s.role, s.bizAnswers);
      s.persona = Score.persona(s.actA, s.actB);
      updateLead(s);
      renderBusinessReveal(s);
    }});

    // CLOSEOUT (for those who stop after the personal result)
    steps.push({ when: function (s) { return !s.doBusiness; }, render: function (s) { renderCloseout(s); } });
  }

  // ============================================================
  // REVEAL SCREENS
  // ============================================================
  function renderPersonalReveal(s, go) {
    var a = s.actA;
    var idName = STYLE_NAME[a.style] + " " + a.rungName;
    var rc = (C.copy && C.copy.rung && C.copy.rung[a.rung]) || {};
    var stc = (C.copy && C.copy.style && C.copy.style[a.style]) || {};
    var node = el("div", { class: "reveal" }, []);

    // identity drop
    node.appendChild(el("div", { class: "identity-drop" }, [
      el("div", { class: "tribe-label", text: "Your AI level: " + a.rung + " of 5 · " + STYLE_NAME[a.style] }),
      el("div", { class: "id-name", text: idName }),
      el("div", { class: "id-blurb", text: T(stc.blurb || rc.blurb || "") })
    ]));

    // flattering fact
    var ff = (C.copy && typeof C.copy.flatteringFact === "function") ? C.copy.flatteringFact(a.rung) : null;
    if (ff) node.appendChild(el("div", { class: "flatter", html: T(ff) }));

    // 2D map
    node.appendChild(el("div", { class: "mapwrap" }, [mapSVG(a)]));

    // mirror result (relative-confidence guess vs measured level)
    if (s.mirror != null) {
      var expect = { behind: 1, average: 2, ahead: 3, frontier: 5 }[s.mirror];
      var guessLabel = { behind: "behind most", average: "about average", ahead: "ahead of most", frontier: "way ahead" }[s.mirror];
      if (expect != null) {
        var line = a.rung > expect ? "You sell yourself short. You're further along than you guessed."
          : a.rung < expect ? "You're optimistic about it, and that instinct helps. There's more room ahead than it feels."
          : "You read yourself well. That kind of self-awareness is rarer than the skill itself.";
        node.appendChild(el("p", { class: "center muted", html: "<b>You guessed you're " + guessLabel + ".</b> " + line }));
      }
    }

    // peer mirror
    var pm = pickPeerMirror(s.role, a.rung);
    var habits = pm && (pm.habits || (Array.isArray(pm) ? pm : null));
    if (habits && habits.length) {
      var ahead = (pm && pm.aheadName) ? pm.aheadName : "the level above";
      node.appendChild(el("div", { class: "peer" }, [
        el("div", { class: "peer-h", text: "Habits of the level above you — " + ahead + ":" })
      ].concat(habits.map(function (h) {
        return el("div", { class: "habit not" }, [el("span", { class: "hb", text: "→" }), el("span", { html: T(h) })]);
      }))));
    }

    // unaware delight
    if (a.rung === 0 && C.copy && C.copy.unawareDelight) {
      node.appendChild(el("div", { class: "peer" }, [
        el("div", { class: "peer-h", text: "You said you barely use AI. You already rely on it here:" })
      ].concat((C.copy.unawareDelight || []).map(function (h) {
        return el("div", { class: "habit has" }, [el("span", { class: "hb", text: "✓" }), el("span", { html: h })]);
      }))));
    }

    // level-up prompt
    var prompt = pickPrompt(a.rung, s.role);
    var promptText = prompt && (typeof prompt === "string" ? prompt : prompt.text);
    promptText = T(promptText);
    if (promptText) {
      var ptitle = (prompt && prompt.title) ? prompt.title : "Your level-up move";
      var pt = el("div", { class: "prompt-text", text: promptText });
      var cb = el("button", { class: "copybtn", text: "Copy", onclick: function () {
        if (navigator.clipboard) navigator.clipboard.writeText(promptText);
        cb.textContent = "Copied ✓"; cb.classList.add("done");
      }});
      node.appendChild(el("div", { class: "prompt-box" }, [
        el("div", { class: "pb-h" }, [el("div", { class: "pb-t", text: ptitle + " — paste into ChatGPT or Claude" }), cb]),
        pt
      ]));
    }

    // share + download
    var shareBtn = el("button", { class: "btn btn-primary btn-block", html: "↗ &nbsp;Share my result", onclick: function () { shareResult(s, shareBtn); } });
    node.appendChild(el("div", { class: "sharecard-wrap" }, [
      shareBtn,
      el("button", { class: "btn btn-block", html: "↓ &nbsp;Download my level card", onclick: function () { downloadCard(a); } })
    ]));
    var ownerish = s.role === "owner" || s.role === "team";
    node.appendChild(el("div", { class: "btn-row" }, [
      el("button", { class: "btn btn-primary btn-block", html: (ownerish ? "See how ready my business is &nbsp;→" : "See what this means for my team &nbsp;→"), onclick: function () { s.doBusiness = true; go(); } }),
      el("button", { class: "btn btn-ghost btn-block", text: "I'm good with my result", onclick: function () { s.doBusiness = false; go(); } })
    ]));

    paint(node, 2, false);
  }

  function renderGate(s, go) {
    var nameI = el("input", { class: "field", placeholder: "First name", type: "text" });
    var emailI = el("input", { class: "field", placeholder: "Email", type: "email" });
    var err = el("div", { class: "fine", style: "color:var(--rust)", text: "" });
    var node = el("div", { class: "gate" }, [
      el("div", { class: "gate-card" }, [
        el("h2", { class: "q-stem", text: "Your result is ready." }),
        el("p", { class: "q-help", text: "Where should we send your AI level, your shareable card, and your level-up move? You'll see it on the next screen too." }),
        nameI, emailI,
        el("div", { class: "spacer" }),
        el("button", { class: "btn btn-primary btn-block", html: "Show me my level &nbsp;→", onclick: function () {
          if (!nameI.value.trim() || !/.+@.+\..+/.test(emailI.value)) { err.textContent = "A first name and a valid email, please."; return; }
          s.name = nameI.value.trim(); s.email = emailI.value.trim();
          submitLead(s);
          go();
        }}),
        err,
        el("p", { class: "fine", text: "No spam, no list-selling. Your result, plus only what helps you level up." })
      ])
    ]);
    paint(node, 2, false);
  }

  function renderProfile(s, go) {
    var companyI = el("input", { class: "field", placeholder: "Company (optional)", type: "text" });
    var ind = chipRow(industryChips(), function (v) { s.industry = v.value; }, true);
    var rev = chipRow(C.revenueBands || ["Under $1M", "$1–5M", "$5–10M", "$10–25M", "$25–50M", "$50M+"], function (v) { s.revenue = v; });
    var head = chipRow(C.headcountBands || ["1–10", "11–25", "26–75", "76–200", "200+"], function (v) { s.headcount = v; });
    paint(el("div", {}, [
      el("h2", { class: "q-stem", text: "A few details so the numbers fit you." }),
      el("p", { class: "fine", text: "What kind of business?" }), ind,
      el("div", { class: "spacer" }),
      el("p", { class: "fine", text: "Annual revenue" }), rev,
      el("div", { class: "spacer" }),
      el("p", { class: "fine", text: "Headcount" }), head,
      el("div", { class: "spacer" }), companyI,
      el("div", { class: "spacer" }),
      el("button", { class: "btn btn-primary btn-block", html: "Continue &nbsp;→", onclick: function () { s.company = companyI.value.trim(); updateLead(s); go(); } })
    ]), 3, false);
  }

  function renderCloseout(s) {
    var a = s.actA;
    paint(el("div", { class: "reveal center" }, [
      el("div", { class: "identity-drop" }, [
        el("div", { class: "tribe-label", text: "You're all set" }),
        el("div", { class: "id-name", text: STYLE_NAME[a.style] + " " + a.rungName }),
        el("div", { class: "id-blurb", text: "We've emailed your result. Re-take it in 90 days to watch your level move." })
      ]),
      el("div", { class: "btn-row" }, [
        el("button", { class: "btn btn-block", html: "↓ &nbsp;Download my card", onclick: function () { downloadCard(a); } }),
        el("a", { class: "btn btn-ghost btn-block", href: "https://ovae.ai", text: "See how Ovae works" })
      ]),
      el("div", { class: "footer", html: "<a href='/snapshot/'>Restart ↺</a>" })
    ]), 3, false);
  }

  function renderBusiness(s, go) {
    var qs = (C.business && (C.business[s.role] || C.business.owner)) || [];
    var i = 0;
    function ask() {
      if (i >= qs.length) { go(); return; }
      var q = qs[i];
      var stem = T(q.stem);
      paint(el("div", {}, [
        el("h2", { class: "q-stem", text: stem }),
        optionList(q.options, function (o) { s.bizAnswers.push({ dim: q.dim, v: o.v, id: q.id }); i++; ask(); })
      ]), 3, false);
    }
    ask();
  }

  function renderBusinessReveal(s) {
    var b = s.actB, p = s.persona;
    var pc = (C.copy && C.copy.persona && C.copy.persona[p.key]) || {};
    var node = el("div", { class: "reveal" }, []);

    node.appendChild(el("div", { class: "center" }, [el("span", { class: "persona-badge", text: p.label })]));
    node.appendChild(el("div", { class: "index-hero" }, [
      el("div", { class: "ix-num", text: String(s.actA.index) }),
      el("div", { class: "ix-cap", text: "Your AI Leverage Index" })
    ]));
    if (pc.blurb) node.appendChild(el("p", { class: "center id-blurb", html: T(pc.blurb) }));

    // dimension bars
    node.appendChild(el("h2", { text: "Where your business stands · " + b.band }));
    var bars = el("div", { class: "bars" }, Object.keys(b.dims).map(function (d) {
      var isC = d === b.constraint;
      return el("div", { class: "bar-row" + (isC ? " constraint" : "") }, [
        el("div", { class: "bl" }, [el("span", { html: isC ? "<b>" + Score.DIM_NAME[d] + "</b>" : Score.DIM_NAME[d] }), el("span", { class: "mono", text: b.dims[d].pct + "%" })]),
        el("div", { class: "bar-track" }, [el("div", { class: "bar-fill", style: "width:" + b.dims[d].pct + "%" })])
      ]);
    }));
    node.appendChild(bars);

    // fix order
    node.appendChild(el("h2", { text: "Your first three moves" }));
    var fixes = el("div", { class: "fixlist" }, b.fixOrder.map(function (d) {
      var opp = bizResult(d);
      return el("div", { class: "fix" }, [el("div", {}, [el("div", { class: "fx-h", text: Score.DIM_NAME[d] }), el("div", { class: "fx-b", html: opp })])]);
    }));
    node.appendChild(fixes);

    // CTA — role + appetite conditioned
    node.appendChild(ctaFor(s));

    node.appendChild(el("div", { class: "footer", html: "Ovae — Latin, plural of <i>ovum</i>: eggs, origins. &nbsp;·&nbsp; <a href='/snapshot/'>Restart ↺</a>" }));
    paint(node, 3, false);
  }

  function ctaFor(s) {
    var hot = s.appetite === "build_now" || s.appetite === "want_help";
    var owner = s.role === "owner";
    if (owner && hot) {
      return el("div", { class: "cta-card" }, [
        el("div", { class: "cc-h", text: "This is exactly what we install." }),
        el("div", { class: "cc-b", text: "A 30-minute call with CT & Isaiah maps your constraint to the first build. We take on a handful of flagship engagements." }),
        el("a", { class: "btn btn-primary", href: "https://ovae.ai/#contact", html: "Book a 30-min call &nbsp;→" })
      ]);
    }
    if (s.appetite === "convince") {
      return el("div", { class: "cta-card" }, [
        el("div", { class: "cc-h", text: "Make the case in one screenshot." }),
        el("div", { class: "cc-b", text: "Send this card to the person who owns the call. It shows the leverage your team is leaving on the table — with your name on the find." }),
        el("button", { class: "btn btn-primary", html: "↓ Download the team-gap card", onclick: function () { downloadCard(s.actA); } })
      ]);
    }
    return el("div", { class: "cta-card" }, [
      el("div", { class: "cc-h", text: "Keep your momentum." }),
      el("div", { class: "cc-b", text: "We'll send your full breakdown plus the operator's playbook for your level. Re-take in 90 days to watch your number move." }),
      el("a", { class: "btn btn-primary", href: "https://ovae.ai", html: "See how Ovae works &nbsp;→" })
    ]);
  }

  // ============================================================
  // 2D MAP + SHARE CARD
  // ============================================================
  function mapSVG(a) {
    var W = 520, H = 280, padL = 44, padR = 24, padT = 28, padB = 44;
    var x = function (r) { return padL + (r / 5) * (W - padL - padR); };
    var lanes = { centaur: padT + 30, cyborg: H / 2, self: H - padB - 24 };
    var ns = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(ns, "svg");
    svg.setAttribute("viewBox", "0 0 " + W + " " + H);
    function add(tag, attrs, txt) { var e = document.createElementNS(ns, tag); Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); }); if (txt != null) e.textContent = txt; svg.appendChild(e); return e; }
    // axis labels
    RUNGS.forEach(function (nm, r) {
      add("line", { x1: x(r), y1: padT, x2: x(r), y2: H - padB, stroke: "rgba(232,228,220,0.05)" });
      add("text", { x: x(r), y: H - padB + 18, fill: "#6F6A63", "font-size": "9", "font-family": "DM Mono, monospace", "text-anchor": "middle" }, String(r));
    });
    add("text", { x: padL, y: padT - 12, fill: "#6F6A63", "font-size": "9", "font-family": "DM Mono, monospace" }, "SEARCHER");
    add("text", { x: W - padR, y: padT - 12, fill: "#6F6A63", "font-size": "9", "font-family": "DM Mono, monospace", "text-anchor": "end" }, "CONDUCTOR");
    Object.keys(lanes).forEach(function (st) {
      add("text", { x: 6, y: lanes[st] + 3, fill: STYLE_COLOR[st], "font-size": "8.5", "font-family": "DM Mono, monospace" }, STYLE_NAME[st].toUpperCase().slice(0, 7));
    });
    // faint archetype dots
    [[1, "cyborg"], [2, "centaur"], [3, "self"], [4, "cyborg"], [5, "self"]].forEach(function (d) {
      if (d[0] === a.rung && d[1] === a.style) return;
      add("circle", { cx: x(d[0]), cy: lanes[d[1]], r: 4, fill: STYLE_COLOR[d[1]], opacity: "0.18" });
    });
    // opportunity arrow (empty region ahead)
    if (a.rung < 5) add("text", { x: x(Math.min(5, a.rung + 1)), y: lanes[a.style] - 14, fill: "#6F6A63", "font-size": "9", "font-family": "DM Mono, monospace", "text-anchor": "middle" }, "→ next");
    // you
    var cx = x(a.rung), cy = lanes[a.style];
    add("circle", { cx: cx, cy: cy, r: 13, fill: STYLE_COLOR[a.style], opacity: "0.22" });
    add("circle", { cx: cx, cy: cy, r: 7, fill: STYLE_COLOR[a.style] });
    add("text", { x: cx, y: cy - 20, fill: "#E8E4DC", "font-size": "12", "font-weight": "600", "font-family": "DM Sans, sans-serif", "text-anchor": "middle" }, "YOU");
    return svg;
  }

  function shareResult(s, btn) {
    Promise.resolve(s._idP).then(function () {
      if (!s.id) { if (btn) btn.innerHTML = "Link not ready — tap again"; return; }
      var url = location.origin + "/snapshot/u/?id=" + s.id;
      var text = "I'm a " + STYLE_NAME[s.actA.style] + " " + s.actA.rungName + " on the AI Leverage Snapshot. AI has 6 levels — which one are you?";
      if (navigator.share) { navigator.share({ title: "My AI level", text: text, url: url }).catch(function () {}); }
      else if (navigator.clipboard) { navigator.clipboard.writeText(url); if (btn) btn.innerHTML = "✓ &nbsp;Link copied"; }
      else { window.prompt("Copy your result link:", url); }
    });
  }

  function downloadCard(a) {
    var w = 1080, h = 1350, cv = document.createElement("canvas"); cv.width = w; cv.height = h;
    var g = cv.getContext("2d");
    g.fillStyle = "#14101A"; g.fillRect(0, 0, w, h);
    var grd = g.createRadialGradient(w, 0, 0, w, 0, 900); grd.addColorStop(0, "rgba(123,201,196,0.12)"); grd.addColorStop(1, "rgba(20,16,26,0)");
    g.fillStyle = grd; g.fillRect(0, 0, w, h);
    g.fillStyle = "#7BC9C4"; g.font = "600 30px 'DM Mono', monospace"; g.fillText("THE AI LEVERAGE SNAPSHOT", 80, 130);
    g.fillStyle = "#6F6A63"; g.font = "26px 'DM Mono', monospace"; g.fillText("AI YOU · " + monthYear().toUpperCase(), 80, 175);
    g.fillStyle = STYLE_COLOR[a.style]; g.font = "600 96px 'DM Sans', sans-serif";
    g.fillText(STYLE_NAME[a.style], 80, 430);
    g.fillStyle = "#E8E4DC"; g.fillText(a.rungName, 80, 540);
    g.fillStyle = "#A39E96"; g.font = "34px 'DM Sans', sans-serif";
    g.fillText("Level " + a.rung + " of 5  ·  " + STYLE_NAME[a.style] + " style", 80, 610);
    // mini ladder
    var ly = 820, lx0 = 80, lw = w - 160;
    g.strokeStyle = "rgba(232,228,220,0.12)"; g.lineWidth = 3; g.beginPath(); g.moveTo(lx0, ly); g.lineTo(lx0 + lw, ly); g.stroke();
    for (var r = 0; r <= 5; r++) {
      var px = lx0 + (r / 5) * lw;
      g.fillStyle = r === a.rung ? STYLE_COLOR[a.style] : "rgba(232,228,220,0.25)";
      g.beginPath(); g.arc(px, ly, r === a.rung ? 22 : 9, 0, 7); g.fill();
      g.fillStyle = "#6F6A63"; g.font = "22px 'DM Mono', monospace"; g.textAlign = "center"; g.fillText(String(r), px, ly + 60); g.textAlign = "left";
    }
    g.fillStyle = "#6F6A63"; g.font = "24px 'DM Mono', monospace"; g.fillText("SEARCHER", lx0, ly + 110); g.textAlign = "right"; g.fillText("CONDUCTOR", lx0 + lw, ly + 110); g.textAlign = "left";
    g.fillStyle = "#E8E4DC"; g.font = "30px 'DM Sans', sans-serif"; g.fillText("What level are you? → ovae.ai/snapshot", 80, h - 90);
    var url = cv.toDataURL("image/png");
    var link = document.createElement("a"); link.href = url; link.download = "ai-you-" + a.style + "-" + a.rungName.toLowerCase() + ".png"; link.click();
  }

  // ============================================================
  // CONTENT PICKERS + SUBMIT
  // ============================================================
  function pickPeerMirror(role, rung) {
    var pm = C.copy && C.copy.peerMirror;
    if (!pm) return null;
    var byRole = pm[role] || pm.owner || pm.generic || pm;
    return byRole && byRole[rung] ? byRole[rung] : (byRole && byRole[Math.min(rung + 1, 5)] ? byRole[Math.min(rung + 1, 5)] : null);
  }
  function pickPrompt(rung, role) {
    var P = C.prompts; if (!P) return null;
    var byRole = P[role] || P.generic || P;
    return (byRole && byRole[rung]) || (P.generic && P.generic[rung]) || null;
  }
  function defaultOpp(d) {
    var m = { BI: "Get one dashboard you actually trust — you can't automate what you can't see.",
      KPD: "Move the critical knowledge out of one person's head and into a system.",
      AUTO: "Prove your highest-value workflow by hand, then build it as an agent.",
      DATA: "Connect your core tools so data flows without anyone re-keying it.",
      TEAM: "Document and automate one core process so output rises without hiring.",
      REV: "Instrument the revenue engine so growth is repeatable, not heroic." };
    return m[d] || "";
  }
  function chipRow(items, onPick, isObj) {
    var row = el("div", { class: "chips" }, items.map(function (it) {
      var label = isObj ? it.label : it;
      return el("button", { class: "chip", onclick: function (e) {
        row.querySelectorAll(".chip").forEach(function (c) { c.classList.remove("sel"); });
        e.currentTarget.classList.add("sel"); onPick(it);
      }, text: label });
    }));
    return row;
  }
  function industryChips() {
    var L = C.lexicon || {};
    var labels = { generic: "Other / general", "home-services": "Home services", dtc: "DTC / ecommerce", agency: "Agency", course: "Course / creator", services: "Professional services", "b2b-saas": "B2B / SaaS" };
    return Object.keys(labels).filter(function (k) { return k === "generic" || L[k]; }).map(function (k) { return { value: k, label: labels[k] }; });
  }

  function buildPayload(s) {
    return {
      name: s.name, email: s.email, company: s.company || null, role: s.role, industry: s.industry,
      rung: s.actA ? s.actA.rung : null, rung_name: s.actA ? s.actA.rungName : null,
      style: s.actA ? s.actA.style : null, ai_index: s.actA ? s.actA.index : null,
      persona: s.persona ? s.persona.key : null, band: s.actB ? s.actB.band : null,
      business_pct: s.actB ? s.actB.pct : null, constraint: s.actB ? s.actB.constraint : null,
      appetite: s.appetite, revenue: s.revenue || null, headcount: s.headcount || null,
      answers: { picks: s.picks, ceiling: s.ceiling, mirror: s.mirror, biz: s.bizAnswers },
      flag: deriveFlag(s), attribution: s.attribution || {}, via: (s.attribution && s.attribution.via) || null,
      user_agent: navigator.userAgent, referrer: document.referrer || null
    };
  }
  function post(payload) {
    try {
      return fetch(SUBMIT_URL, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) })
        .then(function (r) { return r.json(); }).catch(function () { return null; });
    } catch (e) { return Promise.resolve(null); }
  }
  // insert the lead the instant email is given; remember the id-promise
  function submitLead(s) {
    if (s.submitted || !s.email) return;
    s.submitted = true;
    s._idP = post(buildPayload(s)).then(function (j) { if (j && j.id) s.id = j.id; return s.id; });
  }
  // enrich the SAME row as they go deeper — always wait for the insert's id first
  // so a fast user can never spawn a duplicate or lose the patch.
  function updateLead(s) {
    if (!s.email) return;
    if (!s.submitted) { submitLead(s); return; }
    Promise.resolve(s._idP).then(function () {
      var p = buildPayload(s); if (s.id) p.id = s.id; post(p);
    });
  }
  function deriveFlag(s) {
    var hot = s.appetite === "build_now" || s.appetite === "want_help";
    var bizLow = s.actB && s.actB.pct < 50;
    if (s.role === "owner" && hot && s.actA.rung >= 3 && bizLow) return "flagship";
    if (s.role === "owner" && (hot || bizLow)) return "qualified";
    return "nurture";
  }

  // ---- boot ----
  // neutral attribution: who handed out the link (?via=adam). Aliases accepted; never reads as "referral".
  function parseAttribution() {
    var attr = {};
    try {
      var q = new URLSearchParams(location.search);
      var via = q.get("via") || q.get("from") || q.get("by") || q.get("host") || q.get("x");
      if (via) attr.via = String(via).slice(0, 80);
      ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"].forEach(function (k) { if (q.get(k)) attr[k] = String(q.get(k)).slice(0, 120); });
      attr.landing = location.pathname;
      var saved = null; try { saved = JSON.parse(localStorage.getItem("snap_attr") || "null"); } catch (e) {}
      if (attr.via || Object.keys(attr).length > 1) { try { localStorage.setItem("snap_attr", JSON.stringify(attr)); } catch (e) {} }
      else if (saved) attr = saved;
    } catch (e) {}
    return attr;
  }
  function boot() {
    app = document.getElementById("app");
    if (!app) return;
    S.attribution = parseAttribution();
    if (!C.scenarios) { app.innerHTML = "<div class='stage'><p class='muted center'>Loading…</p></div>"; return; }
    try { if (Score && Score.selftest) Score.selftest(); } catch (e) {}
    buildSteps(); stepIdx = 0; run();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
