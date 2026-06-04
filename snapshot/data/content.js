// ============================================================================
// The AI Leverage Snapshot - content.js
// Defines window.SNAP_CONTENT, the single content contract for the engine.
//
// CONTRACTS THE REST OF THE ENGINE HONORS:
//  - Every option may carry an optional `sub` (short muted second line). Renderer
//    shows `label` bold + tappable; `sub` smaller/dimmed. Options without `sub`
//    render as today. Tap target = whole row.
//  - Act 1 options carry rung:0..5 + style ('centaur'|'cyborg'|'self'). `ceiling:true`
//    flags the "without you checking" signal the ceiling cap can revoke.
//  - Act 2 business options carry dim ('BI'|'KPD'|'AUTO'|'DATA'|'TEAM'|'REV') + v:0..3.
//  - Semantic IDs are the join key everywhere. NEVER key off array indices.
//  - lexicon[vertical] swaps stems/examples/result-lines only; option labels stay shared.
//  - copy.flatteringFact and copy.peerMirror feed the reveal; prompts feed the
//    copy-paste level-up button. business[dim].result is OWNER-ALTITUDE (safe for
//    role=owner/solo only; team/ic forks fall back to rung/persona copy).
// ============================================================================

window.SNAP_CONTENT = {

  landing: [
  {
    "id": "value",
    "type": "value-strip",
    "heading": "What you walk away with",
    "body": "",
    "items": [
      {
        "title": "Your level + style",
        "text": "Named in plain English."
      },
      {
        "title": "Your spot on the map",
        "text": "Level by style, at a glance."
      },
      {
        "title": "A prompt to level up",
        "text": "Tailored to you. Use it in 5 minutes."
      }
    ]
  },
  {
    "id": "preview",
    "type": "preview",
    "heading": "What you get",
    "body": "One clean card. Built to screenshot, or act on today.",
    "items": []
  },
  {
    "id": "cta",
    "type": "cta",
    "heading": "Find your level.",
    "body": "90 seconds. Free."
  }
],

  forkCopy: {
  "fork": {
    "generic": {
      "stem": "That's where you stand. Now the part that actually pays off.",
      "sub": "Knowing your level is the easy part. The part that changes things is seeing how much of your week is spent on work AI could already carry, and the one move that closes the most of that gap fastest. Let's find it.",
      "primary": "Show me the move that pays off most",
      "secondary": "Not now, just my result"
    },
    "owner": {
      "stem": "That was you. Now let's talk about the money.",
      "sub": "You just saw where you personally stand on AI. The real number isn't your skill level. It's what your {{business}} is quietly leaving on the table every week you run it the old way. We'll show you the gap and the single highest-leverage move to close it.",
      "primary": "Show me what my business is losing",
      "secondary": "Not now, just my result"
    },
    "team": {
      "stem": "That's where you stand. Now look at the people you lead.",
      "sub": "Your own score is one thing. The bigger lever is the gap between how your team works today and how it could: the hours your people burn on work AI should already be doing. We'll map your team's real leverage gap and the one move worth the most this quarter.",
      "primary": "Show me my team's leverage gap",
      "secondary": "Not now, just my result"
    },
    "ic": {
      "stem": "That's your level. Now see what it's actually worth.",
      "sub": "Knowing where you rank is the easy part. The part that changes things is how much of your week goes to work AI could carry, and the one shift that makes you the person who delivers twice the output without working more. Let's find it.",
      "primary": "Show me where I'm leaving output behind",
      "secondary": "Not now, just my result"
    },
    "solo": {
      "stem": "That's you on paper. Now the part that pays.",
      "sub": "You run the whole thing, so every hour you don't reclaim is yours. We'll show you exactly where your {{business}} is leaking time and {{customer}} attention to work AI should be handling, plus the single move that buys back the most hours fastest.",
      "primary": "Show me the hours I'm losing",
      "secondary": "Not now, just my result"
    }
  },
  "gate": {
    "stem": "Where should we send your full result?",
    "sub": "Drop your email and we'll unlock your complete AI Leverage Snapshot plus a personalized AI prompt built for exactly how you work. It's yours to keep and use today. One email, and you can unsubscribe anytime.",
    "button": "Unlock my result + my prompt"
  }
},


  // Cold-open hook (LOCKED). Lead with LEVEL; style is the bonus reveal.
  hook: {
    headline: "AI has 6 levels. Which one are you?",
    sub: "90 seconds. Find your level, your AI type, and the one habit that gets you to the next.",
    cta: "Find my level"
  },

  // ==========================================================================
  // ACT 1 CORE MEASUREMENT - recognition, not self-grade.
  // Tool-agnostic: a non-technical operator who DIRECTS the work can land on the
  // top rung without writing code. "Built a thing" = a repeatable setup, not software.
  // ==========================================================================

  scenarios: [
    // PRIMARY scenario. Single biggest signal. Labels are scannable bold leads;
    // `sub` carries the one distinguishing verb so options 5/6/7 don't blur.
    {
      id: 'sc_core',
      stem: "Think about the last real thing you used AI for, for work. Which is closest to what actually happened?",
      options: [
        { label: "Barely touch it.", sub: "Tried it once or twice, didn't stick.", rung: 0, style: 'cyborg' },
        { label: "Quick answers.", sub: "I ask it things, like a smarter search.", rung: 1, style: 'cyborg' },
        { label: "First drafts.", sub: "It writes a draft, I fix it up.", rung: 2, style: 'centaur' },
        { label: "Back-and-forth.", sub: "I shape the work with it, turn by turn.", rung: 3, style: 'cyborg' },
        { label: "A setup I reuse.", sub: "Same instructions and context. I kick it off and run it each time.", rung: 3, style: 'centaur', ceiling: true },
        { label: "Hand off a whole job.", sub: "I start it once, it finishes the job on its own.", rung: 4, style: 'centaur', ceiling: true },
        { label: "It runs a process for me.", sub: "It runs multiple steps by itself, I just steer.", rung: 5, style: 'self', ceiling: true }
      ]
    }
  ],

  // roleRouter - scope of the person, routes Act 2 fork and confirmer logic.
  // NOT scored. Sits after the core scenario so a rung exists before we ask who they are.
  roleRouter: {
    id: 'role',
    stem: "One quick thing so the rest fits you. Which sounds most like your spot?",
    options: [
      { value: 'owner', label: "I own or run the business.", sub: "Founder, CEO, principal." },
      { value: 'team',  label: "I lead a team or department.", sub: "Inside a larger company." },
      { value: 'ic',    label: "I'm an individual contributor.", sub: "I do the work, I don't run the place." },
      { value: 'solo',  label: "It's just me.", sub: "Solo operator, freelancer, one-person shop." }
    ]
  },

  // ==========================================================================
  // ADAPTIVE CONFIRMERS - only one fires per session (showIf ranges are disjoint:
  // rung 0 / 2-3 / 4 / 5). They CONFIRM or DEMOTE the rung so one flattering tap
  // can't inflate the result. showIf reads {rung, style, role}.
  // ==========================================================================
  confirmers: [
    // C1 - BUILDER GATE. Fires on a claim of rung >= 4. Builder requires BUILT and
    // TOUCHES-REAL-WORK. Only opt1 confirms 4; the rest demote to Operator (3).
    {
      id: 'cf_built',
      stem: "You're at the high end. Be honest about that setup. Which is true?",
      showIf: function (s) { return s.rung >= 4; },
      options: [
        { label: "A real setup that does work that matters.", sub: "A custom assistant, an automation, or a saved workflow I rely on.", rung: 4, style: 'self' },
        { label: "More of an experiment than something I rely on.", rung: 3, style: 'cyborg' },
        { label: "It worked once, no reusable setup.", sub: "I'd start from scratch to do it again.", rung: 3, style: 'cyborg' }
      ]
    },

    // C2 - ORCHESTRATOR GATE. Fires on a claim of rung 5. Opt1 itself asserts the
    // built+real system, so the gate is REAL as a DOUBLE gate (C2 opt1 + ceiling
    // capRung>=5). C1 never co-fires (ranges disjoint), so score.js must NOT
    // condition Conductor on cf_built being answered.
    {
      id: 'cf_orchestrate',
      stem: "Top of the ladder is a system, not a single chat. Which fits?",
      showIf: function (s) { return s.rung >= 5; },
      options: [
        { label: "A system I set up runs the steps and hands off between them.", sub: "I set the goal and steer, I don't do each step.", rung: 5, style: 'self' },
        { label: "One strong setup I lean on, still hands-on.", rung: 4, style: 'self' },
        { label: "Power user, nothing runs unless I start it.", rung: 3, style: 'cyborg' }
      ]
    },

    // C3 - OPERATOR LIFT. Fires for the modal middle (rung 2-3). Bounded to [1,3];
    // cannot reach Builder (that needs C1's artifact check, which doesn't fire here).
    {
      id: 'cf_repeat',
      stem: "Outside that one example, how does AI usually show up in your week?",
      showIf: function (s) { return s.rung >= 2 && s.rung <= 3; },
      options: [
        { label: "Part of how I work.", sub: "Same kinds of tasks, and I've gotten good at setting it up.", rung: 3, style: 'cyborg' },
        { label: "Now and then.", sub: "For a first draft when I'm stuck or short on time.", rung: 2, style: 'centaur' },
        { label: "Rarely.", sub: "A quick question here and there, nothing regular.", rung: 1, style: 'cyborg' }
      ]
    },

    // C4 - UNAWARE RESCUE. Fires only at rung 0. Bounded to [0,2].
    {
      id: 'cf_floor',
      stem: "Quick gut check. In the last month, did you...",
      showIf: function (s) { return s.rung === 0; },
      options: [
        { label: "Use an AI answer for real work, even once.", rung: 1, style: 'cyborg' },
        { label: "Have it draft or rewrite something.", rung: 2, style: 'centaur' },
        { label: "Nope, genuinely haven't.", rung: 0, style: 'cyborg' }
      ]
    }
  ],

  // ==========================================================================
  // CEILING - multi-select HARD CAP, not additive scoring.
  // capRung is the MINIMUM ceiling the selected items unlock; score.js takes the
  // MAX capRung across selections, then caps rung to it. Selecting only "Nothing"
  // caps the final rung at Operator (3). "Nothing" is mutually exclusive in the UI.
  // The ceiling never RAISES rung; it only permits or revokes the top rungs.
  // ==========================================================================
  ceiling: {
    id: 'ceiling',
    stem: "What does AI do for you WITHOUT you checking it first? Pick all that apply.",
    multi: true,
    options: [
      { label: "Nothing, I check everything.", capRung: 3, exclusive: true },
      { label: "Low-stakes stuff.", sub: "Sorting, summarizing, first-pass replies I trust.", capRung: 4 },
      { label: "A recurring task runs itself.", sub: "I just spot-check now and then.", capRung: 4 },
      { label: "Real work ships without me each time.", sub: "Replies, content, actions go out on their own.", capRung: 5 },
      { label: "A whole process runs alone.", sub: "It only pings me when it hits something it can't handle.", capRung: 5 }
    ]
  },

  // ==========================================================================
  // MIRROR - NOT scored. Feeds the reveal's "mirror-result" contrast line.
  // ==========================================================================
  mirror: {
    id: 'mirror',
    stem: "Last one, no wrong answer. Compared to most people you work with, how good are you with AI?",
    options: [
      { value: 'behind',   label: "Behind everyone else." },
      { value: 'average',  label: "About average." },
      { value: 'ahead',    label: "Ahead of most in my circle." },
      { value: 'frontier', label: "Way ahead. People ask me how I do it." }
    ]
  },

  // ==========================================================================
  // ACT 2 - BUSINESS leverage, role-forked, behavioral proxies (observable facts).
  // dim in {BI,KPD,AUTO,DATA,TEAM,REV}. v:0..3 (0 worst, 3 best).
  // Shared semantic IDs reused across forks so score.js maps id->dim uniformly.
  // KPD = key-person dependency / bus-factor (ONE construct). B_ownerinloop moved
  // to TEAM (it's a delegation/ownership-leverage signal, not key-person risk).
  // ==========================================================================
  business: {

    // OWNER - full polished fork, 7 questions. BI and KPD carry the 1.5x weight.
    owner: [

      // KPD - bus-factor. The canonical proxy. Person-agnostic.
      { id: 'B_keyperson', dim: 'KPD',
        stem: 'If your single most valuable person quit this Friday, how long until someone else fully covers their work?',
        options: [
          { label: "Never, really.", sub: "That role basically walks out the door with them.", v: 0 },
          { label: "Months of scramble.", sub: "We'd lose customers or quality along the way.", v: 1 },
          { label: "A few weeks.", sub: "Painful, but documented enough to hand off.", v: 2 },
          { label: "Days.", sub: "The work runs on systems and SOPs, not one person's head.", v: 3 } ] },

      // TEAM - delegation / ownership leverage (re-dimmed from KPD). How much truly needs the owner.
      { id: 'B_ownerinloop', dim: 'TEAM',
        stem: 'Of the decisions and approvals last week, how many genuinely needed you?',
        options: [
          { label: "Almost all of them.", sub: "Work stops moving when I'm unreachable.", v: 0 },
          { label: "A lot.", sub: "Routine flows, but anything that matters waits for me.", v: 1 },
          { label: "A handful.", sub: "The team decides inside clear guardrails.", v: 2 },
          { label: "Nearly none.", sub: "I'd only get pulled in on the truly strategic calls.", v: 3 } ] },

      // BI - do you see the business before or after the fact?
      { id: 'B_visibility', dim: 'BI',
        stem: 'When you want to know how the business is actually doing right now, what do you do?',
        options: [
          { label: "Go by gut.", sub: "There's no single place that tells me.", v: 0 },
          { label: "Pull numbers by hand.", sub: "Usually days after I needed them.", v: 1 },
          { label: "Open a dashboard.", sub: "Mostly current, though I still sanity-check it.", v: 2 },
          { label: "Glance at a live view.", sub: "And the system already flags what's off.", v: 3 } ] },

      // AUTO - real automation in production, person-agnostic.
      { id: 'B_automation', dim: 'AUTO',
        stem: 'How many real workflows (not demos) run start-to-finish without a person doing the steps by hand?',
        options: [
          { label: "Zero.", sub: "Every workflow is somebody clicking through it.", v: 0 },
          { label: "One or two, and brittle.", sub: "They break and someone scrambles.", v: 1 },
          { label: "Several run reliably.", sub: "A human supervises, not executes.", v: 2 },
          { label: "A maintained system of them.", sub: "We add and improve them on purpose.", v: 3 } ] },

      // DATA - is the data ready for AI to act on, not just look at?
      { id: 'B_data', dim: 'DATA',
        stem: 'If you wanted to answer a brand-new question about the business today, how fast could you get clean data for it?',
        options: [
          { label: "I couldn't trust the answer.", sub: "The data is scattered or a mess.", v: 0 },
          { label: "After a few days of cleanup.", sub: "Someone has to stitch it together.", v: 1 },
          { label: "Pretty fast.", sub: "It's mostly consolidated and reasonably clean.", v: 2 },
          { label: "Instantly.", sub: "It's connected enough that an AI could query it for me.", v: 3 } ] },

      // REV - can you repeat a good month on purpose? (attribution construct)
      { id: 'B_revenue', dim: 'REV',
        stem: 'When a great month happens, do you know specifically why, well enough to repeat it on purpose?',
        options: [
          { label: "No.", sub: "Good and bad months both feel like weather.", v: 0 },
          { label: "In hindsight, sort of.", sub: "We piece together what worked weeks later.", v: 1 },
          { label: "Yes.", sub: "I can name the two or three drivers and we lean on them on purpose.", v: 2 },
          { label: "Yes, and we re-run them.", sub: "We deliberately repeat those drivers and watch them hold.", v: 3 } ] },

      // TEAM (output-per-head) - the leverage proof. Note: this dim shares with
      // B_ownerinloop; score.js should average the two TEAM questions before
      // applying the dim weight.
      { id: 'B_leverage', dim: 'TEAM',
        stem: 'Over the last two years, how has your output moved relative to the number of people producing it?',
        options: [
          { label: "We added people to keep up.", sub: "Output barely moved.", v: 0 },
          { label: "Output grew with headcount.", sub: "Roughly proportional hiring.", v: 1 },
          { label: "Output outpaced headcount.", sub: "On at least one function.", v: 2 },
          { label: "Output up, heads flat.", sub: "And I can show the number.", v: 3 } ] }
    ],

    // TEAM lead / manager. Starter set.
    team: [
      { id: 'B_keyperson', dim: 'KPD',
        stem: 'If your strongest person quit Friday, how long until someone else carries their load?',
        options: [
          { label: "We'd be stuck.", sub: "That work lives entirely in their head.", v: 0 },
          { label: "Weeks of scramble.", sub: "Output drops while we backfill.", v: 1 },
          { label: "A week or so.", sub: "Documented enough to reassign.", v: 2 },
          { label: "A day or two.", sub: "The work runs on shared systems, not one person.", v: 3 } ] },
      { id: 'B_visibility', dim: 'BI',
        stem: 'When your boss asks how your function is doing, where does the answer come from?',
        options: [
          { label: "I scramble to assemble it.", sub: "There's no standing view.", v: 0 },
          { label: "A spreadsheet I update by hand.", sub: "Usually a few days behind.", v: 1 },
          { label: "A dashboard.", sub: "Mostly live, though I still check it.", v: 2 },
          { label: "A live view.", sub: "It flags problems before anyone has to ask.", v: 3 } ] },
      { id: 'B_automation', dim: 'AUTO',
        stem: "How much of your team's recurring work still happens by hand, step by step?",
        options: [
          { label: "Basically all of it.", sub: "Manual clicking and copy-paste.", v: 0 },
          { label: "A bit is automated.", sub: "It's flaky and we babysit it.", v: 1 },
          { label: "Several routines run reliably.", sub: "We supervise instead of execute.", v: 2 },
          { label: "Most of the grind is automated.", sub: "And we keep improving it.", v: 3 } ] },
      { id: 'B_data', dim: 'DATA',
        stem: 'When you need data from another team to do your job, how does it reach you?',
        options: [
          { label: "I beg for it and re-key it by hand.", v: 0 },
          { label: "Someone exports it when they get to it.", v: 1 },
          { label: "It flows into a shared place I can pull from.", v: 2 },
          { label: "It's connected.", sub: "I (or a tool) can query it on demand.", v: 3 } ] },
      { id: 'B_leverage', dim: 'TEAM',
        stem: 'Over the last year, did your team get more done without simply adding more people?',
        options: [
          { label: "No.", sub: "We only kept up by adding hands or hours.", v: 0 },
          { label: "A little.", sub: "Mostly through people working harder.", v: 1 },
          { label: "Yes.", sub: "Better tools or process lifted output on one thing.", v: 2 },
          { label: "Clearly yes.", sub: "Output up, heads flat, and I can point to how.", v: 3 } ] }
    ],

    // INDIVIDUAL CONTRIBUTOR. Personal-leverage proxies inside a larger org.
    ic: [
      { id: 'B_automation', dim: 'AUTO',
        stem: 'How much of your recurring work do you still do by hand, step by step, each week?',
        options: [
          { label: "Most of it.", sub: "Lots of repetitive manual work.", v: 0 },
          { label: "A fair amount.", sub: "I've automated one or two things.", v: 1 },
          { label: "Some.", sub: "I've offloaded the obvious repetitive stuff.", v: 2 },
          { label: "Very little.", sub: "The grind is mostly out of my week.", v: 3 } ] },
      { id: 'B_visibility', dim: 'BI',
        stem: 'When someone asks the status of your work, how fast can you give a real answer?',
        options: [
          { label: "I have to go dig and reconstruct it.", v: 0 },
          { label: "A few minutes of checking notes and tabs.", v: 1 },
          { label: "Quickly.", sub: "I keep one place that stays current.", v: 2 },
          { label: "Instantly.", sub: "It's tracked somewhere that updates itself.", v: 3 } ] },
      { id: 'B_data', dim: 'DATA',
        stem: 'How much of your day is spent moving information between tools by hand?',
        options: [
          { label: "A lot.", sub: "Copy-paste between apps is half my job.", v: 0 },
          { label: "Some.", sub: "A couple of annoying manual hops.", v: 1 },
          { label: "A little.", sub: "The important paths are connected.", v: 2 },
          { label: "Almost none.", sub: "My tools talk to each other.", v: 3 } ] },
      { id: 'B_keyperson', dim: 'KPD',
        stem: 'If you were out for two weeks, how much of your work could a teammate just pick up?',
        options: [
          { label: "Almost none.", sub: "It's all in my head and my files.", v: 0 },
          { label: "The basics, badly.", sub: "They'd be guessing on the rest.", v: 1 },
          { label: "Most of it.", sub: "Documented well enough to hand off.", v: 2 },
          { label: "All of it.", sub: "My work runs on shared, repeatable systems.", v: 3 } ] }
    ],

    // SOLO / freelancer / founder-of-one. Capacity and dependency on self.
    solo: [
      { id: 'B_keyperson', dim: 'KPD',
        stem: 'If you got sick for two weeks, what happens to the business?',
        options: [
          { label: "It stops cold.", sub: "Nothing moves without me.", v: 0 },
          { label: "It limps.", sub: "Clients wait, revenue pauses.", v: 1 },
          { label: "The routine keeps running.", sub: "Only new work waits.", v: 2 },
          { label: "It keeps serving and selling.", sub: "Without me touching it.", v: 3 } ] },
      { id: 'B_automation', dim: 'AUTO',
        stem: 'How much of your week goes to admin and busywork instead of the work people pay you for?',
        options: [
          { label: "Most of it.", sub: "I'm buried in admin and chasing things.", v: 0 },
          { label: "A big chunk.", sub: "I keep meaning to automate it.", v: 1 },
          { label: "Some.", sub: "I've automated the worst of it.", v: 2 },
          { label: "Very little.", sub: "The busywork mostly runs itself.", v: 3 } ] },
      { id: 'B_revenue', dim: 'REV',
        stem: 'Where does your next client or sale actually come from?',
        options: [
          { label: "Whoever happens to refer me.", sub: "I can't predict it.", v: 0 },
          { label: "Hustle.", sub: "I go find each one when the pipeline runs dry.", v: 1 },
          { label: "A repeatable channel.", sub: "I can turn it up when I want more.", v: 2 },
          { label: "A system.", sub: "It brings me leads while I do the work.", v: 3 } ] },
      { id: 'B_leverage', dim: 'TEAM',
        stem: 'In the last year, did you earn more without simply working more hours?',
        options: [
          { label: "No.", sub: "More income only ever means more hours.", v: 0 },
          { label: "Barely.", sub: "I raised rates but the grind is the same.", v: 1 },
          { label: "Yes.", sub: "Tools or templates let me do more in the same time.", v: 2 },
          { label: "Clearly yes.", sub: "I've broken the time-for-money link.", v: 3 } ] }
    ]
  },

  // ==========================================================================
  // APPETITE - PRIMARY qualifier. hot:true marks intent worth a routing ping
  // (gated further server-side by scope=owner + business-gap + buffer).
  // ==========================================================================
  appetite: {
    id: 'appetite',
    stem: "Be honest about where you are with this. There's no wrong answer.",
    options: [
      { value: 'build_now', label: "Ready to build this.", sub: "I just need the right people to do it with.", hot: true },
      { value: 'want_help', label: "Want help figuring out where to start.", hot: true },
      { value: 'convince',  label: "Sold, but I need to convince someone first.", hot: false },
      { value: 'curious',   label: "Just curious where I stand.", hot: false }
    ]
  },

  // ==========================================================================
  // DOLLAR - optional + skippable (mirrors readiness C1/C2). Midpoints feed the
  // report ROI sentence. NOTE: D1 is a COST band; it assumes the email gate keeps
  // a revenue band/headcount field. If the gate drops revenue, swap D1 to revenue.
  // ==========================================================================
  dollar: {
    optional: true,
    skipLabel: "Skip, show me ranges instead",
    intro: "Two ranges and one sentence. This is what lets your report show real dollars instead of vague upside. Skip it anytime.",
    fields: [
      { id: 'D1', dim: 'cost',
        stem: 'Roughly what do you spend a year on the people and tools doing work that could be systematized?',
        options: [
          { v: '<100k',     l: '< $100K' },
          { v: '100k-500k', l: '$100K to $500K' },
          { v: '500k-2m',   l: '$500K to $2M' },
          { v: '2m+',       l: '$2M+' },
          { v: 'unsure',    l: 'Not sure' } ] },
      { id: 'D2', dim: 'upside',
        stem: 'If you freed up that time and capacity, what is a realistic 12-month revenue upside?',
        options: [
          { v: '<250k',   l: '< $250K' },
          { v: '250k-1m', l: '$250K to $1M' },
          { v: '1m-3m',   l: '$1M to $3M' },
          { v: '3m+',     l: '$3M+' },
          { v: 'unsure',  l: 'Not sure' } ] }
    ],
    // midpoints for the ROI sentence (null = skipped/unsure, fall back to ranges)
    D1_MID: { '<100k': 50000, '100k-500k': 300000, '500k-2m': 1250000, '2m+': 3000000, 'unsure': null },
    D2_MID: { '<250k': 125000, '250k-1m': 625000, '1m-3m': 2000000, '3m+': 5000000, 'unsure': null }
  },

  // ==========================================================================
  // LEXICON - the universality layer. Same engine, native words.
  // CONTRACT:
  //   label    : vertical name (industry chip)
  //   noun     : what the business IS ("your home-services company")
  //   unit     : atomic unit of work ("a job")
  //   a1.taskExamples  : string[] (native "real task" examples for Act 1 stems)
  //   a1.buildExample  : string   (native "thing you built" for cf_built)
  //   a1.ceilingNote   : string   (native gloss for the ceiling "without checking" stem)
  //   business[DIM].stem   : vertical-native question stem (options stay generic)
  //   business[DIM].result : OWNER-ALTITUDE constraint line (safe for owner/solo only)
  // Dim IDs {BI,KPD,AUTO,DATA,TEAM,REV} are the join key. KPD = bus-factor everywhere.
  // generic + home-services are full; others are real but lighter (tonight scope).
  // ==========================================================================
  lexicon: {

    // ---------------------------------------------------------------- GENERIC
    generic: {
      label: 'Business',
      noun: 'your business',
      unit: 'a task',
      a1: {
        taskExamples: [
          'writing or replying to something important',
          'turning messy notes or data into a usable plan',
          "handing off a recurring task so you don't redo it each time"
        ],
        buildExample: 'a saved prompt, template, or small automation you reuse',
        ceilingNote: 'work that finishes and goes out without you reading it first'
      },
      business: {
        BI: {
          stem: 'When you want to know how the business is doing right now, how do you find out?',
          result: "Your top constraint is visibility. The numbers that run the business live in your head or in scattered places, so every decision waits on you to pull them together. One trusted view is the foundation everything else stacks on."
        },
        KPD: {
          stem: 'If your single most valuable person left, how long until someone else fully covers their work?',
          result: "Too much of the operation lives in one or two people's heads, so you can't grow or step away without it wobbling. Putting how-you-do-things into documented systems is what lets output rise without your bus-factor risk rising with it."
        },
        AUTO: {
          stem: 'How many real workflows (not demos) currently run on automation or AI?',
          result: "Almost everything still runs on people doing it by hand. Your biggest unlock is moving the repeatable work onto systems your team supervises instead of executes. That is where the hours come back."
        },
        DATA: {
          stem: 'Do your core tools (CRM, finance, ops, marketing) actually talk to each other?',
          result: "Your systems are islands, so every cross-system answer is a manual stitch job. Connecting them so data flows without hands is what makes everything above it possible."
        },
        TEAM: {
          stem: "Are your important processes written down, or do they live in people's heads?",
          result: "The business runs on what specific people know, not on documented systems. Output is capped at headcount until the process lives somewhere a system can run it."
        },
        REV: {
          stem: 'How does your revenue engine (marketing, sales, fulfillment) actually run?',
          result: "Revenue runs on heroics, not a system. The same demand could convert far better with the engine instrumented and partly automated. You have growth sitting in the customers you already touch."
        }
      }
    },

    // ---------------------------------------------------- HOME-SERVICES (DEEP)
    'home-services': {
      label: 'Home Services',
      noun: 'your home-services company',
      unit: 'a job',
      a1: {
        taskExamples: [
          'replying to a customer who wants a quote',
          'writing the follow-up on an estimate that went quiet',
          'drafting the dispatch text or a review-request message'
        ],
        buildExample: 'a saved reply template, an auto review-request, or a missed-call text-back',
        ceilingNote: 'a quote, follow-up, or dispatch that goes out to a customer without you or the office reading it first'
      },
      business: {
        BI: {
          stem: "When you want to know how this week is going (booked jobs, revenue, who's where), how do you find out?",
          result: "You're flying on gut and end-of-month QuickBooks. Your top constraint is visibility: booked-vs-completed jobs, revenue by trade, and tech utilization aren't in one place you can glance at. ServiceTitan, Jobber, or Housecall already hold this data, it just isn't pulled into a view you trust. That one dashboard is the foundation for everything below."
        },
        // KPD = bus-factor (realigned to match the business section).
        KPD: {
          stem: 'If your best office person or lead tech left tomorrow, how long until someone else fully covers their work?',
          result: "Too much of the operation lives in one or two people's heads: how to quote, how to schedule, how to handle the angry customer. Until that's documented and on rails, you can't grow without cloning those people, and every hire starts from zero. Systematizing it is how output rises without your payroll rising the same amount."
        },
        AUTO: {
          stem: 'How much of the office work (reminders, dispatch texts, estimate follow-ups, review requests) runs on its own?',
          result: "Your office runs on people remembering to do things. Reminders, dispatch confirmations, estimate follow-ups, and review requests still go out by hand, which means they go out late or not at all. These are the textbook automations every modern shop runs. Set once, they recover revenue while the office sleeps."
        },
        DATA: {
          stem: 'Do your field software (ServiceTitan, Jobber, Housecall), your phones, and your books actually talk to each other?',
          result: "Your FSM, your phone system, and your accounting live in separate silos, so every real answer is a manual export-and-stitch. Wiring the call data, the job data, and the dollars together is what lets you finally see cost-per-lead by source and stop guessing where the marketing money works."
        },
        // TEAM = output-per-head (realigned).
        TEAM: {
          stem: 'Over the last two years, has the shop done more revenue without adding people to match?',
          result: "Output is still capped at headcount. More jobs means more techs and more office staff. Systematizing dispatch, quoting, and follow-up is how revenue climbs without payroll climbing the same amount."
        },
        // REV absorbs the missed-call / speed-to-lead leak (the strongest home-services dollar).
        REV: {
          stem: 'From the first call to the finished job to the next season, where does revenue quietly leak?',
          result: "Your revenue engine leaks at both ends. Up front: a caller who hits voicemail rarely calls back, they dial the next company on the list, so every missed call with no text-back is a paid lead dropped at the door. Out back: no review-request cadence stalls your Google rank, no estimate follow-up lets won-but-not-closed work die, and no seasonal or membership outreach means you re-buy customers you already earned. Missed-call text-back, asking for reviews, chasing estimates, and bringing customers back are four taps that compound, and most shops never run all four."
        }
      }
    },

    // ---------------------------------------------------------------- DTC
    dtc: {
      label: 'DTC / E-commerce',
      noun: 'your store',
      unit: 'an order',
      a1: {
        taskExamples: [
          'writing product copy or an ad variation',
          'drafting the next email or SMS campaign',
          'answering a customer-service ticket'
        ],
        buildExample: 'a saved prompt for product descriptions or an automated CX reply flow',
        ceilingNote: 'copy, an email, or a CX reply that ships to customers without you reviewing it'
      },
      business: {
        BI: {
          stem: 'When you want to know contribution margin and blended CAC right now, how do you find out?',
          result: "You're steering on revenue and gut, not contribution margin. Until blended CAC, margin after fees and shipping and returns, and LTV sit in one view, you can't tell which products and channels actually make money. That visibility is the foundation for every spend decision."
        },
        KPD: {
          stem: 'If your most valuable person left, how long until someone else fully covers their work?',
          result: "Too much of how the store runs lives in one or two people's heads: merchandising calls, launch playbooks, the CX judgment. Documenting it is what lets you grow or step back without quality swinging on who's working."
        },
        AUTO: {
          stem: 'How much of your retention engine (flows, win-backs, post-purchase, CX triage) runs on its own?',
          result: "Your retention runs on whoever has time to hit send. Abandoned-cart, post-purchase, win-back, and CX triage are the standard automated flows. Unbuilt, they leave repeat revenue on the table every single day."
        },
        DATA: {
          stem: 'Do your store, ad platforms, email/SMS, and 3PL actually share data?',
          result: "Your stack is stitched by exports. With Shopify, the ad platforms, Klaviyo, and your 3PL not talking, true per-channel ROAS and cohort LTV are guesses. Connecting them is what turns reporting from a chore into a decision engine."
        },
        TEAM: {
          stem: 'Are your merchandising, launch, and CX playbooks documented, or do they ride on a few people?',
          result: "Launches and CX run on tribal knowledge, so quality swings with who's working. Documenting the playbooks is what lets output scale past the few people who currently hold it."
        },
        REV: {
          stem: 'How does your growth engine (acquisition, retention, AOV) actually run?',
          result: "Growth leans on paid acquisition while retention and AOV sit underused. The cheapest revenue you have is the customers you already won. A systematized retention and post-purchase engine is the unlock hiding in plain sight."
        }
      }
    },

    // ---------------------------------------------------------------- AGENCY
    agency: {
      label: 'Agency',
      noun: 'your agency',
      unit: 'a deliverable',
      a1: {
        taskExamples: [
          'drafting a client deliverable or deck',
          'writing a proposal or scope',
          'turning a messy client brief into a plan'
        ],
        buildExample: 'a reusable deliverable template or an automated client-reporting flow',
        ceilingNote: 'a deliverable or client email that goes out without a human reviewing it'
      },
      business: {
        BI: {
          stem: 'When you want to know real margin per client and utilization right now, how do you find out?',
          result: "You bill hours but can't see which clients actually make money. Margin-per-client and team utilization in one view is the foundation. Without it you keep over-servicing the accounts quietly losing you money."
        },
        KPD: {
          stem: 'If a key person left, how long until someone else fully covers their accounts?',
          result: "Delivery and client relationships live in a few senior heads. Documenting how the work gets done is what lets you grow without those people becoming single points of failure."
        },
        AUTO: {
          stem: 'How much of the delivery machine (reporting, QA, status updates, first drafts) runs on its own?',
          result: "Your margin leaks through manual reporting and first drafts done from scratch. Automating reporting, QA, and draft generation is where agency margin is won. It's billable judgment your team should spend time on, not assembly."
        },
        DATA: {
          stem: 'Do your PM tool, time tracking, and finance actually talk to each other?',
          result: "Project, time, and finance live apart, so true profitability is a manual reconcile. Connecting them is what makes per-client margin real-time instead of a quarterly autopsy."
        },
        TEAM: {
          stem: 'Is your delivery process documented, or does quality depend on which person is staffed?',
          result: "Quality rides on your senior people, so you can't scale without cloning them. Documented, AI-assisted process is how you protect quality while growing headcount-light."
        },
        REV: {
          stem: 'How does new revenue happen, referrals and heroics, or a system?',
          result: "Growth depends on referrals and founder hustle. A systematized pipeline plus productized offers is the move that makes revenue predictable instead of feast-or-famine."
        }
      }
    },

    // ---------------------------------------------------------------- COURSE
    course: {
      label: 'Course / Creator',
      noun: 'your course business',
      unit: 'an enrollment',
      a1: {
        taskExamples: [
          'writing a sales email or launch sequence',
          'turning a lesson outline into a script',
          'answering a student question in the community'
        ],
        buildExample: 'a saved prompt for lesson scripts or an automated student-onboarding flow',
        ceilingNote: 'a launch email or student reply that goes out without you reviewing it'
      },
      business: {
        BI: {
          stem: 'When you want to know funnel conversion and refund rate right now, how do you find out?',
          result: "You see revenue, not the funnel. Where opt-ins, sales-page conversion, and refund rate sit in one view is the foundation. Without it, every launch is a guess about what to change."
        },
        KPD: {
          stem: 'If you stepped back for a month, how much of the business could keep running?',
          result: "The whole business runs through you, which makes you the ceiling. Documenting the content and launch system is the first step to it running without you in every loop."
        },
        AUTO: {
          stem: 'How much of the student journey (onboarding, nudges, win-backs, support) runs on its own?',
          result: "Engagement and support run on your manual attention, which caps how many students you can serve well. Automated onboarding, progress nudges, and AI-assisted support are what let completion (and testimonials) scale past you."
        },
        DATA: {
          stem: 'Do your course platform, email, and payment tools actually share data?',
          result: "Platform, email, and payments don't connect, so cohort behavior and true LTV are invisible. Wiring them together is what turns gut-feel launches into a repeatable, measurable system."
        },
        TEAM: {
          stem: 'Is your content and launch process documented, or is it all in your head?',
          result: "The whole business is in your head, which makes you the ceiling. Documenting the content and launch system is the first step to it running without you in every loop."
        },
        REV: {
          stem: 'How does revenue grow, launch-to-launch adrenaline, or an evergreen system?',
          result: "Revenue spikes and crashes around launches. An evergreen funnel plus an ascension path turns one-time buyers into recurring revenue. The audience you already have is the growth."
        }
      }
    },

    // ---------------------------------------------------- SERVICES (pro services / consulting)
    services: {
      label: 'Professional Services',
      noun: 'your firm',
      unit: 'an engagement',
      a1: {
        taskExamples: [
          'drafting a client memo or proposal',
          'turning meeting notes into a deliverable',
          'researching a question for a client'
        ],
        buildExample: 'a reusable proposal template or an automated client-intake flow',
        ceilingNote: 'a client deliverable or email that goes out without a human reviewing it'
      },
      business: {
        BI: {
          stem: 'When you want to know realization rate and which engagements are profitable, how do you find out?',
          result: "You bill time but can't see realization or true engagement margin. One view of utilization and profitability is the foundation. Without it you keep taking work that looks busy and loses money."
        },
        KPD: {
          stem: 'If a key partner left, how long until someone else fully covers their work?',
          result: "Delivery depends on specific partners, so the firm's knowledge walks out with them. Documenting and AI-assisting the methodology is what lets you grow without each departure setting you back."
        },
        AUTO: {
          stem: 'How much of the work (intake, research, first drafts, reporting) runs on automation or AI?',
          result: "Your experts spend hours on intake, research, and first drafts that AI now does well. Automating the assembly frees senior judgment for the work clients actually pay a premium for."
        },
        DATA: {
          stem: 'Do your CRM, time tracking, and billing actually talk to each other?',
          result: "Client, time, and billing systems are disconnected, so profitability is a manual reconcile. Connecting them makes engagement margin visible in real time instead of after the fact."
        },
        TEAM: {
          stem: 'Is your methodology documented, or does it depend on which partner runs it?',
          result: "Delivery depends on specific partners, capping growth at their availability. Documenting and AI-assisting the methodology is how you scale the firm without diluting quality."
        },
        REV: {
          stem: 'How does new business happen, the partners network, or a system?',
          result: "Revenue rides on partner relationships and referrals. A systematized pipeline and productized offerings make growth less dependent on a few rainmakers."
        }
      }
    },

    // ---------------------------------------------------------------- B2B SAAS
    'b2b-saas': {
      label: 'B2B SaaS',
      noun: 'your SaaS company',
      unit: 'an account',
      a1: {
        taskExamples: [
          'drafting a sales or onboarding email',
          'writing a spec, PRD, or release note',
          'triaging a support ticket or bug report'
        ],
        buildExample: 'a saved prompt for specs or an automated lead-routing/CS flow',
        ceilingNote: 'a customer email, release note, or support reply that ships without a human reviewing it'
      },
      business: {
        BI: {
          stem: 'When you want to know net revenue retention and pipeline health right now, how do you find out?',
          result: "You watch MRR but not the leading indicators. NRR, activation, and pipeline coverage in one trusted view is the foundation. Without it, churn and stalls surface too late to fix."
        },
        KPD: {
          stem: 'If a key person left, how long until someone else fully covers their work?',
          result: "Execution depends on a handful of people who hold the playbook. Documenting and AI-assisting the motion is what keeps a departure from stalling the whole company."
        },
        AUTO: {
          stem: 'How much of the GTM and CS motion (lead routing, onboarding, health scoring, support) runs on its own?',
          result: "Your GTM and CS run on people doing manual triage. Automating routing, onboarding, and health scoring is where efficient growth comes from. It lets the team manage exceptions, not every account by hand."
        },
        DATA: {
          stem: 'Do your product analytics, CRM, and billing actually share data?',
          result: "Product, CRM, and billing are siloed, so a true customer-360 (and accurate NRR) is a manual stitch. Connecting them is what makes usage-based selling and proactive CS possible."
        },
        TEAM: {
          stem: 'Is your GTM and delivery process documented, or does it ride on a few key people?',
          result: "Execution depends on a handful of people who hold the playbook. Documenting and AI-assisting the motion is how output scales faster than headcount."
        },
        REV: {
          stem: 'How does revenue grow, founder-led heroics, or a repeatable engine?',
          result: "Growth still leans on founder-led selling and reactive expansion. A systematized pipeline plus instrumented expansion turns the base you already have into your most efficient growth channel."
        }
      }
    }
  },

  // ==========================================================================
  // COPY - reveal surfaces.
  // ==========================================================================
  copy: {

    // ---- rung 0..5: {name, blurb} ----
    rung: {
      0: {
        name: "Newcomer",
        blurb: "You haven't really put AI to work yet. That's a standing start, not a hole. The people three levels up didn't learn anything you can't pick up in an afternoon. You're one habit away from your first 'wait, that just saved me an hour.'"
      },
      1: {
        name: "Searcher",
        blurb: "You reach for AI the way you reach for Google: quick questions, quick answers. That already puts you ahead of everyone who never opens the tab. The next step is small and specific. Stop asking it to find things and start asking it to make things."
      },
      2: {
        name: "Drafter",
        blurb: "You hand AI the blank page and let it take the first swing: emails, outlines, the thing you've been putting off. Most people never make that move. You've turned it from a reference into a co-writer. Next you turn the co-writer into a worker."
      },
      3: {
        name: "Operator",
        blurb: "You run real work through AI on purpose. You know which tasks to give it, you steer it as you go, and you catch it when it's wrong. You're past where most people quietly give up. You're not asking 'can AI help here' anymore. You're asking 'how much of this can it carry.'"
      },
      4: {
        name: "Builder",
        blurb: "You've wired AI into how the work gets done: a saved system you set up once that keeps paying you back. That's a different game from prompting. Build it once, let it run. The last rung is letting it run without you in the loop."
      },
      5: {
        name: "Conductor",
        blurb: "You direct a system that does multi-step work while you're doing something else. You set the goal, the agents handle the middle, you check the output. This is the top of the ladder and almost nobody's here yet. Your edge isn't speed. It's that you're operating at a scale solo work can't reach."
      }
    },

    // ---- style: lateral, not ranked. {name, blurb} ----
    style: {
      centaur: {
        name: "Delegator",
        blurb: "You split the work cleanly. You take the parts that need a human, AI takes the parts that don't. Whole tasks go over the wall and come back done. It's the most controllable way to work with AI, and it holds up at scale because you stay the judge of what's good."
      },
      cyborg: {
        name: "Collaborator",
        blurb: "You blend with AI turn by turn. A sentence from you, a sentence from it, back and forth until it's right. The line between your work and its work disappears. You're not delegating, you're thinking alongside it in real time, and your taste shows up in every loop."
      },
      self: {
        name: "Automator",
        blurb: "You'd rather build the thing that does the work than do the work yourself. Set it up once, let it run. There's a real catch the research keeps finding: when the system runs perfectly without you, your own skill at that task quietly erodes. The move is to automate the grind and keep your hands on the judgment calls."
      }
    },

    // ---- persona: YOU(rung) x BUSINESS(band). label sourced from .name ----
    persona: {
      // high YOU / low BIZ
      bottlenecked_builder: {
        name: "Bottlenecked",
        blurb: "Personally, you're flying. You've got AI habits most people are years from. But the business around you hasn't caught up, so all that leverage dead-ends at you. You're the fastest part of a slow machine. The fix isn't getting better at AI. It's getting the rest of the operation to run at your speed."
      },
      // low YOU / high BIZ
      next_at_wheel: {
        name: "Coasting",
        blurb: "The business is already pulling real leverage out of AI, but it's running on systems, not on you. You're standing next to a fast car you haven't fully learned to drive. That's a good problem. The infrastructure already exists, so every habit you pick up pays off right away instead of starting from zero."
      },
      // low / low - expected modal cell; framed as leapfrog
      ground_floor: {
        name: "Untapped",
        blurb: "You and the business are both early, and that's a good place to be standing. Everyone above you had to unlearn old habits to get here. You don't. You get to build it right from the start while competitors are mid-renovation. Most companies that leapfrogged the last tech shift looked a lot like this the year before they did it."
      },
      // high / high
      ai_native: {
        name: "Compounding",
        blurb: "You move with AI by instinct and the business is built around it. You're in the small group that's setting the pace of this shift, not chasing it. The risk up here isn't falling behind. It's getting comfortable. The frontier moves fast, and your real competition is your own last quarter."
      }
    },

    // ---- flatteringFact(rung) -> string. Flattering + lateral on the surface,
    //      honest underneath. Stats softened to directional language. ----
    flatteringFact: function (rung) {
      var facts = {
        0: "Most people who say they 'don't use AI' are already using it without noticing. And the ones who start on purpose tend to catch up fast. You're not behind. You just haven't started, which is a much easier place to begin from.",
        1: "You're already in the half of people who actually open the tool. What separates you from a power user isn't talent or budget. It's one kind of request you haven't tried yet.",
        2: "Handing AI the first draft is the move most people are still too cautious to make. You've crossed from 'asking AI' to 'working with AI,' which is the part that actually trips people up.",
        3: "You're past the wall where most people quietly give up. Running real work through AI on purpose is the foundation everything above the line is built on, and most people never get there.",
        4: "Building a system instead of repeating a prompt is what separates people who use AI from people who get real leverage out of it. Very few ever make that jump. You did.",
        5: "Directing a system of agents to do multi-step work is the rarest spot on the ladder. Most people don't even know it's an option yet. You're not using the frontier. You're standing on it."
      };
      return facts[rung] || facts[3];
    },

    // ---- unawareDelight: items 0..5 = "you already use AI this week" checklist,
    //      item 6 = the first-win CTA. ----
    unawareDelight: [
      "Your phone's autocorrect and next-word suggestions. That's a language model finishing your sentences all day.",
      "Email already pulling the dates and flights out of a message and offering to drop them on your calendar.",
      "Maps rerouting you around traffic before you hit it. It predicted the jam, not just reported it.",
      "Your photos app that lets you search 'dog at the beach' and actually finds it, no tags, no albums.",
      "Spam and scam filters catching the junk before it reaches you. That's AI reading every message first.",
      "The shows, songs, and posts lined up next for you. That's a recommendation engine that has your taste pretty well figured out.",
      "Easiest first win this week: open ChatGPT, Claude, or Gemini (all free) and paste in a real email you need to write. Tell it 'write this for me, keep it short and warm.' One paste. That's the whole thing, and you've just skipped straight past Searcher."
    ],

    // ---- peerMirror: keyed role x rung. Each = { aheadName, habits:[3] }.
    //      peerMirror[N] = the habits of the rung ONE step ahead (N+1).
    //      Rung 5 has no rung above, so it shows depth/durability moves of the
    //      sharpest conductors (carries the de-skilling nuance). ----
    peerMirror: {
      owner: {
        0: { aheadName: 'Searcher', habits: [
          'Asks AI a real work question before Googling it: pricing wording, a refund reply, what a clause means.',
          'Keeps one chat open during the workday instead of opening it once a month and forgetting.',
          'Pastes a real email or doc in and asks "make this clearer" instead of writing from blank.'
        ] },
        1: { aheadName: 'Drafter', habits: [
          'Has AI write the first draft of the thing they dread: the proposal, the firing email, the late-invoice nudge, then edits.',
          'Gives it context up front ("we sell X to Y, tone is Z") instead of one-line prompts.',
          'Reuses two or three prompts that worked instead of starting cold every time.'
        ] },
        2: { aheadName: 'Operator', habits: [
          'Runs a repeating task through AI on a schedule: weekly numbers summary, inbox triage, lead follow-ups, not just one-offs.',
          "Feeds it their actual data (last month's sales, the customer list) and asks what to do, not just what to write.",
          'Has a saved set of instructions ("how we talk to customers") they paste so output sounds like the business, not a robot.'
        ] },
        3: { aheadName: 'Builder', habits: [
          'Built one thing that runs without them touching it: an auto-reply, a report that generates itself, a form that routes leads.',
          'Connected AI to a tool they already use (email, sheet, CRM, calendar) so it acts, not just talks.',
          'Can point to one process the business does faster because they wired AI into it, with hours saved they can name.'
        ] },
        4: { aheadName: 'Conductor', habits: [
          'Has AI doing multi-step jobs end to end (research a lead, draft outreach, log it, follow up) while they review, not run it.',
          'Runs more than one of these at once and spends their time checking output, not producing it.',
          'Designed the system so a new hire could step in, because the steps live in the setup, not in their head.'
        ] },
        5: { aheadName: 'the sharpest Conductors', habits: [
          "Knows their numbers: which automations earn, which drift, and kills the ones that don't instead of letting them rot.",
          "Keeps a human checkpoint on anything that touches money or a customer's trust, on purpose.",
          "Re-skills deliberately so the business doesn't become a black box only the machine understands."
        ] }
      },
      team: {
        0: { aheadName: 'Searcher', habits: [
          'Asks AI before asking a coworker for the easy stuff: how to phrase it, what a term means, where to start.',
          'Keeps a tab open through the day instead of treating it as a novelty.',
          'Pastes the actual message or doc in and asks "tighten this" instead of staring at a blank box.'
        ] },
        1: { aheadName: 'Drafter', habits: [
          'Has AI write the first version of recurring work: status updates, replies, meeting notes, then makes it theirs.',
          'Front-loads context ("here\'s the project, the audience, the tone") so the draft lands closer.',
          'Saves the two or three prompts that keep working and reuses them instead of reinventing each time.'
        ] },
        2: { aheadName: 'Operator', habits: [
          'Runs a repeating part of their week through AI (summarizing threads, prepping the deck, cleaning the spreadsheet) every time, not once.',
          'Feeds it real inputs (the ticket queue, the data export) and asks for the next action, not just words.',
          'Keeps a personal instruction block so output matches how their team actually writes and works.'
        ] },
        3: { aheadName: 'Builder', habits: [
          'Built one small thing that runs on its own and shares it: a template, a saved workflow, a bot a teammate now uses too.',
          'Wired AI into a tool the team already lives in (Slack, the doc, the tracker) so it does, not just suggests.',
          'Can name a task the team finishes faster because of something they set up, not just because they personally prompt well.'
        ] },
        4: { aheadName: 'Conductor', habits: [
          'Has AI run a multi-step job for the team end to end (intake, draft, route, follow up) while they review the output.',
          'Set it up so teammates trigger it without them, instead of being the one person who knows the trick.',
          'Spends their time checking and improving the system rather than doing the steps by hand.'
        ] },
        5: { aheadName: 'the sharpest Conductors', habits: [
          'Tracks whether the automations actually save the team time and retires the ones that quietly broke.',
          'Builds in a human check on anything customer-facing or high-stakes, deliberately, not as an afterthought.',
          "Teaches the rest of the team to run and read the system so it isn't one person's secret."
        ] }
      },
      ic: {
        0: { aheadName: 'Searcher', habits: [
          'Asks AI the "how do I even start" questions instead of avoiding them or guessing.',
          'Keeps it open while working instead of opening it once and closing it.',
          'Pastes their own work in and asks for a clearer version instead of writing from scratch.'
        ] },
        1: { aheadName: 'Drafter', habits: [
          "Lets AI write the first draft of the boring recurring stuff, then edits hard so it's actually theirs.",
          'Gives it the real context up front instead of vague one-liners, so the draft needs less fixing.',
          'Keeps a few prompts that work and reuses them instead of starting cold.'
        ] },
        2: { aheadName: 'Operator', habits: [
          'Runs a repeating chunk of their job through AI every time (research, first-pass code, data cleanup), not just occasionally.',
          'Hands it real material (the dataset, the codebase snippet, the brief) and asks for the next step, not just prose.',
          'Has a saved instruction block so output matches their style and standards without re-explaining.'
        ] },
        3: { aheadName: 'Builder', habits: [
          'Built one reusable thing that does the work for them: a script, a saved workflow, a prompt-tool they run repeatedly.',
          'Connected AI to a tool they actually use so it performs the task, not just describes it.',
          'Can point to specific hours they got back from something they built once and now reuse.'
        ] },
        4: { aheadName: 'Conductor', habits: [
          'Has AI run a multi-step task start to finish while they supervise (gather, draft, check, output).',
          'Runs it on real work and trusts it enough to review results instead of redoing them.',
          'Set it up so it could run for a teammate too, not just in their own head.'
        ] },
        5: { aheadName: 'the sharpest Conductors', habits: [
          "Keeps the judgment calls human on purpose, so the skill that makes them valuable doesn't atrophy.",
          'Checks that their automations still produce good work and fixes them when they drift.',
          'Can explain how their system works to someone else, which means they actually understand it.'
        ] }
      },
      solo: {
        0: { aheadName: 'Searcher', habits: [
          "Asks AI the question they'd normally pay someone or stall on: wording, what something means, where to begin.",
          'Keeps it open as a working tool, not a thing they tried once.',
          'Pastes their own draft in and asks "make this better" instead of writing alone from zero.'
        ] },
        1: { aheadName: 'Drafter', habits: [
          'Has AI write the first version of the work they avoid: the pitch, the post, the client reply, then edits.',
          "Tells it who they are and who they're talking to, so the draft sounds like them, not a template.",
          'Reuses the prompts that work instead of rebuilding from scratch each time.'
        ] },
        2: { aheadName: 'Operator', habits: [
          'Runs the repeating parts of their business through AI (content, invoicing copy, client follow-ups) on a rhythm.',
          'Feeds it their real numbers and client info and asks what to do next, not just what to say.',
          'Keeps a saved "this is my business, this is my voice" block so everything sounds consistent.'
        ] },
        3: { aheadName: 'Builder', habits: [
          'Built one thing that runs without them: an auto-responder, a content pipeline, a booking flow that just works.',
          'Wired AI into a tool they already pay for so it does the task, not just advises on it.',
          'Can name the hours per week they bought back by building something once instead of doing it daily.'
        ] },
        4: { aheadName: 'Conductor', habits: [
          'Has AI run whole jobs end to end (find leads, draft outreach, follow up, log it) while they just review.',
          'Runs a few of these at once, acting more like the owner of a small machine than the worker in it.',
          "Built it so the business could keep moving on a day they don't touch it."
        ] },
        5: { aheadName: 'the sharpest Conductors', habits: [
          'Watches which automations actually make money and cuts the dead weight instead of collecting tools.',
          'Keeps a hand on anything that touches a client relationship or their money, deliberately.',
          "Stays sharp on the core craft so the business isn't a box only the AI understands."
        ] }
      }
    }
  },

  // ==========================================================================
  // PROMPTS - copy-paste "level-up" prompt by [role][rung], generic fallback.
  // {{token}} slots are replaced from lexicon[vertical] at render time
  // (business/customer/metric/channel; fall back to sane defaults if missing).
  // Each = { title, moves, text }. \n are real line breaks in the copy box;
  // [BRACKETS] are literal user fill-ins.
  // ==========================================================================
  prompts: {
  generic: {
    0: { title: 'Your first real AI move', moves: 'Newcomer to Searcher', text:
"I just took an AI assessment. It pegged me as a Newcomer (level 0 of 5), running {{business}}. Use that as context: I barely use AI on purpose yet, so go gentle, no jargon, no shame.\n\nYou are my AI-leverage guide. Your job is to get me one real win today and show me the next small step.\n\nPHASE 1 - ASK ME FIRST (don't analyze yet). Ask me 3-4 easy questions, one or two at a time. Adapt to how I work: I lean toward [delegating / collaborating / automating]. Only ask what you can't already guess: what I actually do day to day, the one task that eats the most time, and what would make me think \"oh, that's useful.\" If an answer is vague, ask one simple follow-up. Wait for me.\n\nPHASE 2 - THEN GIVE ME, in plain words:\n1. ONE QUICK WIN - a task from my answers AI can do right now, and do it with me in this chat.\n2. THE SHORT LIST - 2-3 everyday tasks I could hand to AI this week, easiest first.\n3. TOMORROW - the single first step, small enough I'll actually do it.\n4. ONE THING TO KEEP DOING MYSELF - so I don't over-rely on it yet.\nKeep it concrete and friendly. Meet me where I am." },
    1: { title: 'Stop asking, start making', moves: 'Searcher to Drafter', text:
"I just took an AI assessment. It pegged me as a Searcher (level 1 of 5), running {{business}}. Use that as context: I already ask AI quick questions like a search engine, and I'm ready to have it actually make things.\n\nYou are my AI-leverage guide. Be helpful and honest, not flattering.\n\nPHASE 1 - ASK ME FIRST (don't analyze yet). Ask me up to 5 questions, a few at a time. Adapt to how I work: I lean toward [delegating / collaborating / automating]. Skip anything you can already infer. Cover: what I do and who I serve, the writing or thinking tasks that eat my week, what I've tried with AI that didn't stick. One sharp follow-up if I'm vague. Wait for me.\n\nPHASE 2 - THEN GIVE ME:\n1. WHAT'S WORKING - what to keep doing.\n2. THE MAP - a short list of my recurring tasks tagged could-be-AI-now vs keep-human, biased toward what I'm not doing yet but easily could.\n3. THE ONE MOVE - the highest-payoff change this week and the first step tomorrow, plus 2 runners-up.\n4. A REUSABLE PROMPT - written for my work, that I can save and reuse.\nKeep it specific to my context and simple enough to act on today." },
    2: { title: 'Turn one-offs into a routine', moves: 'Drafter to Operator', text:
"I just took an AI assessment. It pegged me as a Drafter (level 2 of 5), running {{business}}. Use that as context: I already paste real work in for drafts, and I want AI woven into my week on purpose.\n\nYou are an AI-leverage diagnostician. Be honest, not flattering.\n\nPHASE 1 - INTERVIEW ME FIRST (don't analyze yet). Ask me up to 6 questions, a few at a time, adapting as I answer. Adapt to how I work: I lean toward [delegating / collaborating / automating]. Skip what you can infer. Cover: a normal week and the tasks that repeat, where AI already shows up, what I tried that didn't stick, my constraints (tools, data, time). One sharp follow-up on anything vague. Wait for me.\n\nPHASE 2 - THEN GIVE ME:\n1. MY AI TODAY + what's working to keep.\n2. THE MAP - a table of my recurring work tagged already-AI / could-be-AI-now / keep-human, biased toward what I could automate but haven't.\n3. THE ONE MOVE - highest-ROI routine to set up this month + the first step tomorrow, then 2 runners-up.\n4. A REUSABLE SETUP - a saved instruction block for my top repeating task, with [INPUT] as the only swap.\n5. WEEKLY 15-MIN REVIEW checklist.\nMeet me where I am, prefer examples from my context, label any estimates." },
    3: { title: 'Build something that runs without you', moves: 'Operator to Builder', text:
"I just took an AI assessment. It pegged me as an Operator (level 3 of 5), running {{business}}. Use that as context: I run real work through AI daily and deliberately, and I'm ready to build setups that produce finished work on their own.\n\nYou are an AI-leverage diagnostician. Be sharp and honest, not flattering.\n\nPHASE 1 - INTERVIEW ME FIRST (don't analyze yet). Ask me up to 7 questions, a few at a time, adapting. Adapt to how I work: I lean toward [delegating / collaborating / automating]. Skip what you can infer. Cover: my highest-frequency workflows, where I'm still the bottleneck, the tools and data I can connect, what I've tried to automate that broke, what winning looks like in 90 days. One sharp follow-up if vague. Wait for me.\n\nPHASE 2 - THEN GIVE ME:\n1. MY AI TODAY + my leverage archetype, starting with what to keep.\n2. THE MAP - a table of my recurring work tagged already-AI / could-be-AI-now / keep-human, biased toward what I could build but haven't.\n3. THE ONE MOVE - the highest-ROI thing to build this month + the first step tomorrow, then 2-3 runners-up, with rough setup time.\n4. DURABILITY & SAFETY - where a build could silently fail and where to keep a human in the loop.\n5. WEEKLY 15-MIN REVIEW checklist.\n6. WHERE THIS GOES - 30/60/90 days of compounding.\nKeep it specific enough to start building today, label estimates." },
    4: { title: 'Chain it into a hands-off system', moves: 'Builder to Conductor', text:
"I just took an AI assessment. It pegged me as a Builder (level 4 of 5), running {{business}}. Use that as context: I've already built AI setups that produce finished work, and I want to direct a system of multi-step agents.\n\nYou are an AI-leverage diagnostician operating at a systems level. Be rigorous and honest, never flattering.\n\nPHASE 1 - INTERVIEW ME FIRST (don't analyze yet). Ask me up to 8 sharp questions, a few at a time, adapting hard to my answers. Adapt to how I work: I lean toward [delegating / collaborating / automating]. Skip anything you can infer. Cover: what I've already built and what it earns or saves, where my builds still need me in the loop, which multi-step job is the best candidate to fully orchestrate, my tools/data/integration constraints, and what winning looks like in 90 days. Push back on vague answers with one pointed follow-up. Wait for me.\n\nPHASE 2 - THEN GIVE ME:\n1. MY AI TODAY + leverage archetype, starting with what's working to keep.\n2. THE MAP - my workflows tagged already-automated / orchestratable-now / keep-human, biased toward the multi-step jobs I could hand off but haven't.\n3. THE ONE MOVE - the single highest-ROI orchestration to stand up this month, the first step tomorrow, then 2-3 runners-up, with a design for how the steps hand off.\n4. DURABILITY & SAFETY - silent-failure modes, where over-automation costs me the outcome, where a human checkpoint stays on purpose. Flag over-automation as readily as under.\n5. WEEKLY 15-MIN REVIEW checklist for a running system.\n6. WHERE THIS GOES - 30/60/90 days of compounding.\nLabel estimates, prefer my real examples, make it actionable now." },
    5: { title: 'Make the system pay and last', moves: 'Conductor, going deeper', text:
"I just took an AI assessment. It pegged me as a Conductor (level 5 of 5), running {{business}}. Use that as context: I already direct a system of AI agents doing multi-step work, so skip the basics and go straight to durability, economics, and risk.\n\nYou are an AI-leverage diagnostician for advanced operators. Be adversarial and honest, never flattering. Assume I can handle hard truths.\n\nPHASE 1 - INTERVIEW ME FIRST (don't analyze yet). Ask me up to 8 sharp questions, a few at a time. Skip what you can infer. Cover: what's running and what each is supposed to save or earn, how I currently measure that, where I've felt drift or a near-miss, where I'm over-automated, and where my own skill might be quietly eroding. Challenge weak answers with one pointed follow-up. Wait for me.\n\nPHASE 2 - THEN GIVE ME:\n1. THE LEDGER - how to measure which workflows actually pay (value vs upkeep) and which to kill.\n2. FAILURE MAP - where each could silently fail and the cheapest early warning for each.\n3. OVER-AUTOMATION & DE-SKILLING - where I've automated past the point of safety or am losing a skill that makes me valuable, and what to keep human on purpose.\n4. HUMAN-IN-THE-LOOP - the exact points to keep human, deliberately.\n5. WEEKLY 15-MIN REVIEW to catch drift before it costs me.\n6. WHERE THIS GOES - the next frontier move for someone already here.\nLabel estimates, prefer my real numbers, no flattery." }
  },
  owner: {
    0: { title: 'Your first real AI move', moves: 'Newcomer to Searcher', text:
"I just took an AI assessment. It pegged me as a Newcomer (level 0 of 5), and I own/run {{business}} serving {{customer}}. Use that as context: I barely use AI on purpose yet, so go gentle, no jargon, no shame.\n\nYou are my practical business assistant. Get me one real win today and show me the next small step.\n\nPHASE 1 - ASK ME FIRST (don't analyze yet). Ask me 3-4 easy questions, one or two at a time. Adapt to how I work: I lean toward [delegating / collaborating / automating]. Only ask what you can't guess about {{business}}: the task that eats the most of my time, what I'd love to stop doing myself, what a win would feel like. One simple follow-up if I'm vague. Wait for me.\n\nPHASE 2 - THEN GIVE ME, in plain words:\n1. ONE QUICK WIN - a {{business}} task AI can do right now, and do it with me here (a {{customer}} reply, a pricing note, the thing I've been avoiding).\n2. THE SHORT LIST - 2-3 things this week I could hand to AI, easiest first.\n3. TOMORROW - the single first step, small enough I'll actually do it.\n4. ONE THING TO KEEP DOING MYSELF - so I don't lose the {{customer}} touch.\nKeep it concrete and friendly." },
    1: { title: 'Stop asking, start making', moves: 'Searcher to Drafter', text:
"I just took an AI assessment. It pegged me as a Searcher (level 1 of 5), and I own/run {{business}} serving {{customer}}. Use that as context: I already ask AI quick questions, and I'm ready to have it make real work.\n\nYou are my AI-leverage guide for {{business}}. Be honest, not flattering.\n\nPHASE 1 - ASK ME FIRST (don't analyze yet). Ask me up to 5 questions, a few at a time. Adapt to how I work: I lean toward [delegating / collaborating / automating]. Skip what you can infer about {{business}}. Cover: how I make money and who {{customer}} is, the writing/admin tasks that eat my week, what I tried with AI that didn't stick. One sharp follow-up if vague. Wait for me.\n\nPHASE 2 - THEN GIVE ME:\n1. WHAT'S WORKING - keep it.\n2. THE MAP - my recurring {{business}} tasks tagged could-be-AI-now vs keep-human, biased toward what I'm not doing yet.\n3. THE ONE MOVE - highest-payoff change this week + first step tomorrow, plus 2 runners-up.\n4. A REUSABLE PROMPT - in my business's voice, ready to save and reuse for {{customer}}.\nSpecific to {{business}}, simple enough to act on today." },
    2: { title: 'Run your business on a rhythm', moves: 'Drafter to Operator', text:
"I just took an AI assessment. It pegged me as a Drafter (level 2 of 5), and I own/run {{business}} serving {{customer}}. Use that as context: I already paste real work in for drafts, and I want AI woven into how I run the business.\n\nYou are an AI-leverage diagnostician for owners. Be honest, not flattering.\n\nPHASE 1 - INTERVIEW ME FIRST (don't analyze yet). Ask me up to 6 questions, a few at a time, adapting. Adapt to how I work: I lean toward [delegating / collaborating / automating]. Skip what you can infer. Cover: a normal week in {{business}}, the tasks that repeat (around {{customer}}, {{channel}}, {{metric}}), where AI already shows up, my constraints (tools, data, team, budget). One sharp follow-up if vague. Wait for me.\n\nPHASE 2 - THEN GIVE ME:\n1. MY AI TODAY + what's working to keep.\n2. THE MAP - my recurring work tagged already-AI / could-be-AI-now / keep-human, biased toward what I could systematize but haven't.\n3. THE ONE MOVE - highest-ROI routine to set up this month + first step tomorrow, then 2 runners-up.\n4. A REUSABLE SETUP - a saved instruction block with my business voice baked in for my top repeating {{customer}} task.\n5. WEEKLY 15-MIN REVIEW checklist.\nPrefer examples from {{business}}, label any estimates." },
    3: { title: 'Build something that runs your business', moves: 'Operator to Builder', text:
"I just took an AI assessment. It pegged me as an Operator (level 3 of 5), and I own/run {{business}} serving {{customer}}. Use that as context: I run real work through AI daily and deliberately, and I'm ready to build setups that run without me.\n\nYou are an AI-leverage diagnostician for owners. Be sharp and honest, not flattering.\n\nPHASE 1 - INTERVIEW ME FIRST (don't analyze yet). Ask me up to 7 questions, a few at a time, adapting. Adapt to how I work: I lean toward [delegating / collaborating / automating]. Skip what you can infer. Cover: my highest-frequency workflows in {{business}}, where I'm still the bottleneck, the tools/data I could connect (CRM, email, sheets, booking), what I tried to automate that broke, what winning looks like in 90 days. One sharp follow-up if vague. Wait for me.\n\nPHASE 2 - THEN GIVE ME:\n1. MY AI TODAY + my leverage archetype, what to keep.\n2. THE MAP - recurring work tagged already-AI / could-be-AI-now / keep-human, biased toward what I could build but haven't.\n3. THE ONE MOVE - highest-ROI thing to build this month + first step tomorrow, then 2-3 runners-up, with rough setup time and hours/week saved.\n4. DURABILITY & SAFETY - where a build could silently fail and where to keep a human before anything reaches {{customer}} or touches money.\n5. WEEKLY 15-MIN REVIEW checklist.\n6. WHERE THIS GOES - 30/60/90 days of compounding for {{business}}.\nSpecific enough to start building today, label estimates." },
    4: { title: 'Run a hands-off pipeline', moves: 'Builder to Conductor', text:
"I just took an AI assessment. It pegged me as a Builder (level 4 of 5), and I own/run {{business}} serving {{customer}}. Use that as context: I've already built AI setups that produce finished work, and I want to direct a multi-step system across the business.\n\nYou are an AI-leverage diagnostician working at a systems level. Be rigorous and honest, never flattering.\n\nPHASE 1 - INTERVIEW ME FIRST (don't analyze yet). Ask me up to 8 sharp questions, a few at a time, adapting hard. Adapt to how I work: I lean toward [delegating / collaborating / automating]. Skip what you can infer. Cover: what I've built in {{business}} and what it earns/saves, where it still needs me, which multi-step job (e.g. lead in, research, outreach, log, follow up) is the best candidate to orchestrate, my integration/data constraints, and what winning looks like in 90 days. Push back on vague answers. Wait for me.\n\nPHASE 2 - THEN GIVE ME:\n1. MY AI TODAY + archetype, what's working to keep.\n2. THE MAP - workflows tagged already-automated / orchestratable-now / keep-human, biased toward the multi-step jobs I could hand off.\n3. THE ONE MOVE - the single highest-ROI orchestration to stand up this month, first step tomorrow, then 2-3 runners-up, with a hand-off design.\n4. DURABILITY & SAFETY - silent-failure modes, where over-automation costs me the {{customer}} relationship, where a human checkpoint stays on purpose. Flag over- as readily as under-automation.\n5. WEEKLY 15-MIN REVIEW for a running system.\n6. WHERE THIS GOES - 30/60/90 days.\nLabel estimates, prefer {{business}} examples." },
    5: { title: 'Make it pay and make it last', moves: 'Conductor, going deeper', text:
"I just took an AI assessment. It pegged me as a Conductor (level 5 of 5), and I own/run {{business}} serving {{customer}}. Use that as context: I already direct a system of AI agents, so skip the basics and go straight to durability, economics, and risk.\n\nYou are an AI-leverage diagnostician for advanced owners. Be adversarial and honest, never flattering.\n\nPHASE 1 - INTERVIEW ME FIRST (don't analyze yet). Ask me up to 8 sharp questions, a few at a time. Skip what you can infer. Cover: what's running in {{business}} and what each should save or earn, how I measure that today, where I've felt drift or a near-miss, where I'm over-automated, and where automating has cost me the {{customer}} touch that wins business. Challenge weak answers. Wait for me.\n\nPHASE 2 - THEN GIVE ME:\n1. THE LEDGER - measure which workflows actually pay (value vs upkeep) and which to kill.\n2. FAILURE MAP - where each could silently fail and the cheapest early warning.\n3. OVER-AUTOMATION & THE CUSTOMER - where I've automated past the point that protects the {{customer}} relationship or my own edge, and what to pull back to human.\n4. HUMAN-IN-THE-LOOP - exact points to keep human, deliberately, anything touching {{customer}} trust or money.\n5. WEEKLY 15-MIN REVIEW to catch drift before {{customer}} feels it.\n6. WHERE THIS GOES - the next frontier move for {{business}}.\nLabel estimates, prefer my real numbers, no flattery." }
  },
  team: {
    0: { title: 'Your first real AI move at work', moves: 'Newcomer to Searcher', text:
"I just took an AI assessment. It pegged me as a Newcomer (level 0 of 5). I lead a team inside a larger company. Use that as context: I barely use AI on purpose yet, so go gentle, no jargon, no shame.\n\nYou are my practical work assistant. Get me one real win today and show me the next small step.\n\nPHASE 1 - ASK ME FIRST (don't analyze yet). Ask me 3-4 easy questions, one or two at a time. Adapt to how I work: I lean toward [delegating / collaborating / automating]. Only ask what you can't guess: what my team does, the task that eats the most of my week, what I'd love to stop doing by hand. One simple follow-up if vague. Wait for me.\n\nPHASE 2 - THEN GIVE ME, in plain words:\n1. ONE QUICK WIN - a task from my answers AI can do right now, and do it with me here.\n2. THE SHORT LIST - 2-3 things this week I could hand to AI, easiest first.\n3. TOMORROW - the single first step, small enough I'll actually do it.\n4. ONE THING TO KEEP HUMAN - so nothing important slips.\nKeep it concrete and friendly." },
    1: { title: 'Stop asking, start making', moves: 'Searcher to Drafter', text:
"I just took an AI assessment. It pegged me as a Searcher (level 1 of 5). I lead a team inside a larger company. Use that as context: I already ask AI quick questions, and I'm ready to have it make real work.\n\nYou are my AI-leverage guide. Be honest, not flattering.\n\nPHASE 1 - ASK ME FIRST (don't analyze yet). Ask me up to 5 questions, a few at a time. Adapt to how I work: I lean toward [delegating / collaborating / automating]. Skip what you can infer. Cover: my role and what my team produces, the recurring work that eats my week (updates, replies, reporting), what I tried with AI that didn't stick. One sharp follow-up if vague. Wait for me.\n\nPHASE 2 - THEN GIVE ME:\n1. WHAT'S WORKING - keep it.\n2. THE MAP - my recurring work tagged could-be-AI-now vs keep-human, biased toward what I'm not doing yet.\n3. THE ONE MOVE - highest-payoff change this week + first step tomorrow, plus 2 runners-up.\n4. A REUSABLE PROMPT - in how my team actually writes, ready to save and reuse.\nSpecific to my context, simple enough to act on today." },
    2: { title: 'Run part of your week on a rhythm', moves: 'Drafter to Operator', text:
"I just took an AI assessment. It pegged me as a Drafter (level 2 of 5). I lead a team inside a larger company. Use that as context: I already paste real work in for drafts, and I want AI woven into my team's week.\n\nYou are an AI-leverage diagnostician for team leads. Be honest, not flattering.\n\nPHASE 1 - INTERVIEW ME FIRST (don't analyze yet). Ask me up to 6 questions, a few at a time, adapting. Adapt to how I work: I lean toward [delegating / collaborating / automating]. Skip what you can infer. Cover: a normal week leading my team, the tasks that repeat, where AI already shows up, my constraints (tools, data, approvals, what IT allows). One sharp follow-up if vague. Wait for me.\n\nPHASE 2 - THEN GIVE ME:\n1. MY AI TODAY + what's working to keep.\n2. THE MAP - recurring team work tagged already-AI / could-be-AI-now / keep-human, biased toward what I could systematize but haven't.\n3. THE ONE MOVE - highest-ROI routine to set up this month + first step tomorrow, then 2 runners-up.\n4. A REUSABLE SETUP - a saved instruction block matching how my team writes, with [INPUT] as the only swap.\n5. WEEKLY 15-MIN REVIEW checklist.\nPrefer examples from my context, label estimates." },
    3: { title: 'Build something your team can reuse', moves: 'Operator to Builder', text:
"I just took an AI assessment. It pegged me as an Operator (level 3 of 5). I lead a team inside a larger company. Use that as context: I run real work through AI daily and deliberately, and I'm ready to build setups my team reuses.\n\nYou are an AI-leverage diagnostician for team leads. Be sharp and honest, not flattering.\n\nPHASE 1 - INTERVIEW ME FIRST (don't analyze yet). Ask me up to 7 questions, a few at a time, adapting. Adapt to how I work: I lean toward [delegating / collaborating / automating]. Skip what you can infer. Cover: my team's highest-frequency workflows, where the team bottlenecks, the tools we already live in (Slack, docs, the tracker), what we tried to automate that broke, what winning looks like in 90 days. One sharp follow-up if vague. Wait for me.\n\nPHASE 2 - THEN GIVE ME:\n1. MY AI TODAY + leverage archetype, what to keep.\n2. THE MAP - recurring work tagged already-AI / could-be-AI-now / keep-human, biased toward what I could build but haven't.\n3. THE ONE MOVE - highest-ROI thing to build this month + first step tomorrow, then 2-3 runners-up, including how to hand it to a teammate so it doesn't live only in my head.\n4. DURABILITY & SAFETY - where a build could silently fail, where to keep a human on anything customer-facing or high-stakes.\n5. WEEKLY 15-MIN REVIEW checklist.\n6. WHERE THIS GOES - 30/60/90 days of compounding for my team.\nSpecific enough to start building today, label estimates." },
    4: { title: 'Run a hands-off job for the team', moves: 'Builder to Conductor', text:
"I just took an AI assessment. It pegged me as a Builder (level 4 of 5). I lead a team inside a larger company. Use that as context: I've built AI setups that produce finished work, and I want to direct a multi-step system the whole team uses.\n\nYou are an AI-leverage diagnostician at a systems level. Be rigorous and honest, never flattering.\n\nPHASE 1 - INTERVIEW ME FIRST (don't analyze yet). Ask me up to 8 sharp questions, a few at a time, adapting hard. Adapt to how I work: I lean toward [delegating / collaborating / automating]. Skip what you can infer. Cover: what I've built and what it saves the team, where it still needs me, which multi-step job (intake, draft, route, follow up) is the best to orchestrate, integration/approval constraints, what winning looks like in 90 days. Push back on vague answers. Wait for me.\n\nPHASE 2 - THEN GIVE ME:\n1. MY AI TODAY + archetype, what's working to keep.\n2. THE MAP - workflows tagged already-automated / orchestratable-now / keep-human, biased toward multi-step jobs the team could hand off.\n3. THE ONE MOVE - the single highest-ROI orchestration to stand up this month, first step tomorrow, then 2-3 runners-up, designed so teammates trigger it without me.\n4. DURABILITY & SAFETY - silent-failure modes, where over-automation hurts, where a human checkpoint stays on purpose for anything customer-facing or high-stakes. Flag over- as readily as under-automation.\n5. WEEKLY 15-MIN REVIEW for a running system.\n6. WHERE THIS GOES - 30/60/90 days, including teaching the team to run and read it.\nLabel estimates, prefer my real examples." },
    5: { title: 'Make it durable and shared', moves: 'Conductor, going deeper', text:
"I just took an AI assessment. It pegged me as a Conductor (level 5 of 5). I lead a team inside a larger company. Use that as context: I already direct a system of AI agents for my team, so skip the basics and go straight to durability, measurement, and not-just-me risk.\n\nYou are an AI-leverage diagnostician for advanced team leads. Be adversarial and honest, never flattering.\n\nPHASE 1 - INTERVIEW ME FIRST (don't analyze yet). Ask me up to 8 sharp questions, a few at a time. Skip what you can infer. Cover: what's running for the team and what each should save, how I measure that, where I've felt drift or a near-miss, where we're over-automated, and how much only I know how to run. Challenge weak answers. Wait for me.\n\nPHASE 2 - THEN GIVE ME:\n1. THE LEDGER - measure which workflows actually save the team time vs upkeep, and which to retire.\n2. FAILURE MAP - where each could silently fail and the cheapest early warning.\n3. KEY-PERSON RISK - where the system depends only on me, and how to make teammates able to run and read it.\n4. HUMAN-IN-THE-LOOP - exact points to keep human, deliberately, for customer-facing or high-stakes steps.\n5. WEEKLY 15-MIN REVIEW to catch drift.\n6. WHERE THIS GOES - the next move for a team already here.\nLabel estimates, prefer real numbers, no flattery." }
  },
  ic: {
    0: { title: 'Your first real AI move', moves: 'Newcomer to Searcher', text:
"I just took an AI assessment. It pegged me as a Newcomer (level 0 of 5). I'm an individual contributor: I do the work, I don't run the place. Use that as context: I barely use AI on purpose yet, so go gentle, no jargon, no shame.\n\nYou are my practical work assistant. Get me one real win on my actual work today and show me the next small step.\n\nPHASE 1 - ASK ME FIRST (don't analyze yet). Ask me 3-4 easy questions, one or two at a time. Adapt to how I work: I lean toward [delegating / collaborating / automating]. Only ask what you can't guess: what I actually do, the task that eats the most of my week, what I'd love to stop grinding through. One simple follow-up if vague. Wait for me.\n\nPHASE 2 - THEN GIVE ME, in plain words:\n1. ONE QUICK WIN - a task from my answers AI can do right now, and do it with me here.\n2. THE SHORT LIST - 2-3 things this week I could hand to AI, easiest first.\n3. TOMORROW - the single first step, small enough I'll actually do it.\n4. ONE THING TO KEEP DOING MYSELF - so I keep my edge.\nKeep it concrete and friendly. No fluff." },
    1: { title: 'Stop starting from zero', moves: 'Searcher to Drafter', text:
"I just took an AI assessment. It pegged me as a Searcher (level 1 of 5). I'm an individual contributor. Use that as context: I already ask AI quick questions, and I'm ready to have it make real work.\n\nYou are my AI-leverage guide. Be honest, not flattering.\n\nPHASE 1 - ASK ME FIRST (don't analyze yet). Ask me up to 5 questions, a few at a time. Adapt to how I work: I lean toward [delegating / collaborating / automating]. Skip what you can infer. Cover: what I do and the standard my work has to hit, the recurring tasks that eat my week, what I tried with AI that didn't stick. One sharp follow-up if vague. Wait for me.\n\nPHASE 2 - THEN GIVE ME:\n1. WHAT'S WORKING - keep it.\n2. THE MAP - my recurring tasks tagged could-be-AI-now vs keep-human, biased toward what I'm not doing yet.\n3. THE ONE MOVE - highest-payoff change this week + first step tomorrow, plus 2 runners-up.\n4. A REUSABLE PROMPT - that holds my style and standards, ready to save and reuse.\nSpecific to my work, simple enough to act on today." },
    2: { title: 'Run a chunk of your job on a rhythm', moves: 'Drafter to Operator', text:
"I just took an AI assessment. It pegged me as a Drafter (level 2 of 5). I'm an individual contributor. Use that as context: I already paste real work in for drafts, and I want AI woven into my week on purpose.\n\nYou are an AI-leverage diagnostician for individual contributors. Be honest, not flattering.\n\nPHASE 1 - INTERVIEW ME FIRST (don't analyze yet). Ask me up to 6 questions, a few at a time, adapting. Adapt to how I work: I lean toward [delegating / collaborating / automating]. Skip what you can infer. Cover: a normal week and my most repeated tasks, where AI already shows up, what I tried that didn't stick, my constraints (tools, data, what's allowed). One sharp follow-up if vague. Wait for me.\n\nPHASE 2 - THEN GIVE ME:\n1. MY AI TODAY + what's working to keep.\n2. THE MAP - my recurring work tagged already-AI / could-be-AI-now / keep-human, biased toward what I could systematize but haven't.\n3. THE ONE MOVE - highest-ROI routine to set up this month + first step tomorrow, then 2 runners-up.\n4. A REUSABLE SETUP - a saved instruction block that holds my style and standards, with [INPUT] as the only swap.\n5. WEEKLY 15-MIN REVIEW checklist.\nPrefer examples from my work, label estimates." },
    3: { title: 'Build a tool that does the work for you', moves: 'Operator to Builder', text:
"I just took an AI assessment. It pegged me as an Operator (level 3 of 5). I'm an individual contributor. Use that as context: I run real work through AI daily and deliberately, and I'm ready to build reusable tools that do the work for me.\n\nYou are an AI-leverage diagnostician for individual contributors. Be sharp and honest, not flattering.\n\nPHASE 1 - INTERVIEW ME FIRST (don't analyze yet). Ask me up to 7 questions, a few at a time, adapting. Adapt to how I work: I lean toward [delegating / collaborating / automating]. Skip what you can infer. Cover: my highest-frequency tasks, where I'm slowest, the tools I already use (editor, sheets, the terminal, my apps), what I tried to automate that broke, what winning looks like in 90 days. One sharp follow-up if vague. Wait for me.\n\nPHASE 2 - THEN GIVE ME:\n1. MY AI TODAY + leverage archetype, what to keep.\n2. THE MAP - recurring work tagged already-AI / could-be-AI-now / keep-human, biased toward what I could build but haven't.\n3. THE ONE MOVE - highest-ROI thing to build this month + first step tomorrow, then 2-3 runners-up, with rough setup time and time/week saved.\n4. DURABILITY & SAFETY - where a build could silently fail and what to verify the first few runs.\n5. WEEKLY 15-MIN REVIEW checklist.\n6. WHERE THIS GOES - 30/60/90 days of compounding for my work.\nSpecific enough to start building today, label estimates." },
    4: { title: 'Chain it into a hands-off task', moves: 'Builder to Conductor', text:
"I just took an AI assessment. It pegged me as a Builder (level 4 of 5). I'm an individual contributor. Use that as context: I've built AI setups that produce finished work, and I want to direct a multi-step task that runs while I review.\n\nYou are an AI-leverage diagnostician at a systems level. Be rigorous and honest, never flattering.\n\nPHASE 1 - INTERVIEW ME FIRST (don't analyze yet). Ask me up to 8 sharp questions, a few at a time, adapting hard. Adapt to how I work: I lean toward [delegating / collaborating / automating]. Skip what you can infer. Cover: what I've built and what it saves me, where it still needs me, which multi-step task (gather, draft, self-check, format, output) is the best to orchestrate, my tool/data constraints, what winning looks like in 90 days. Push back on vague answers. Wait for me.\n\nPHASE 2 - THEN GIVE ME:\n1. MY AI TODAY + archetype, what's working to keep.\n2. THE MAP - workflows tagged already-automated / orchestratable-now / keep-human, biased toward multi-step tasks I could hand off.\n3. THE ONE MOVE - the single highest-ROI orchestration to build this month, first step tomorrow, then 2-3 runners-up, designed so I review results instead of redoing them and a teammate could run it too.\n4. DURABILITY & SAFETY - silent-failure modes, where over-automation risks de-skilling me, where my judgment must stay in the loop. Flag over- as readily as under-automation.\n5. WEEKLY 15-MIN REVIEW for a running setup.\n6. WHERE THIS GOES - 30/60/90 days.\nLabel estimates, prefer my real examples." },
    5: { title: 'Keep the edge while it scales', moves: 'Conductor, going deeper', text:
"I just took an AI assessment. It pegged me as a Conductor (level 5 of 5). I'm an individual contributor. Use that as context: I already direct a system of AI agents on my work, so skip the basics and go straight to reliability and not dulling the skills that make me valuable.\n\nYou are an AI-leverage diagnostician for advanced individual contributors. Be adversarial and honest, never flattering.\n\nPHASE 1 - INTERVIEW ME FIRST (don't analyze yet). Ask me up to 8 sharp questions, a few at a time. Skip what you can infer. Cover: what's running and what each should produce, how I verify quality today, where I've felt drift or a near-miss, which heavily-automated task might be eroding a core skill, and what I'd struggle to do by hand now. Challenge weak answers. Wait for me.\n\nPHASE 2 - THEN GIVE ME:\n1. QUALITY CHECK - how to verify each still produces good work and catch drift.\n2. FAILURE MAP - where each could silently fail and the cheapest early warning.\n3. DE-SKILLING WATCH - where automation risks dulling the skill that makes me valuable, and what to keep doing by hand on purpose.\n4. HUMAN-IN-THE-LOOP - the judgment calls that must stay mine.\n5. OWN IT - make sure I can explain how the whole system works, so it's not a black box.\n6. WEEKLY 15-MIN REVIEW to catch drift.\nLabel estimates, prefer my real examples, no flattery." }
  },
  solo: {
    0: { title: 'Your first real AI move', moves: 'Newcomer to Searcher', text:
"I just took an AI assessment. It pegged me as a Newcomer (level 0 of 5), and it's just me running {{business}} serving {{customer}}. Use that as context: I barely use AI on purpose yet, so go gentle, no jargon, no shame.\n\nYou are my practical assistant. Get me one real win today and show me the next small step.\n\nPHASE 1 - ASK ME FIRST (don't analyze yet). Ask me 3-4 easy questions, one or two at a time. Adapt to how I work: I lean toward [delegating / collaborating / automating]. Only ask what you can't guess about {{business}}: the task that eats the most of my week, what I'd love to stop doing, what a win would feel like. One simple follow-up if vague. Wait for me.\n\nPHASE 2 - THEN GIVE ME, in plain words:\n1. ONE QUICK WIN - a {{business}} task AI can do right now, and do it with me here (a {{customer}} message, the thing I've been avoiding).\n2. THE SHORT LIST - 2-3 things this week I could hand to AI, easiest first.\n3. TOMORROW - the single first step, small enough I'll actually do it.\n4. ONE THING TO KEEP DOING MYSELF - so I keep the {{customer}} touch.\nKeep it concrete and friendly." },
    1: { title: 'Stop asking, start making', moves: 'Searcher to Drafter', text:
"I just took an AI assessment. It pegged me as a Searcher (level 1 of 5), and it's just me running {{business}} serving {{customer}}. Use that as context: I already ask AI quick questions, and I'm ready to have it make real work.\n\nYou are my AI-leverage guide for {{business}}. Be honest, not flattering.\n\nPHASE 1 - ASK ME FIRST (don't analyze yet). Ask me up to 5 questions, a few at a time. Adapt to how I work: I lean toward [delegating / collaborating / automating]. Skip what you can infer. Cover: what I sell and who {{customer}} is, the recurring work that eats my week, what I tried with AI that didn't stick. One sharp follow-up if vague. Wait for me.\n\nPHASE 2 - THEN GIVE ME:\n1. WHAT'S WORKING - keep it.\n2. THE MAP - my recurring {{business}} tasks tagged could-be-AI-now vs keep-human, biased toward what I'm not doing yet.\n3. THE ONE MOVE - highest-payoff change this week + first step tomorrow, plus 2 runners-up.\n4. A REUSABLE PROMPT - in my voice with {{customer}}, ready to save and reuse.\nSpecific to {{business}}, simple enough to act on today." },
    2: { title: 'Run your business on a rhythm', moves: 'Drafter to Operator', text:
"I just took an AI assessment. It pegged me as a Drafter (level 2 of 5), and it's just me running {{business}} serving {{customer}}. Use that as context: I already paste real work in for drafts, and I want AI woven into how I run the business.\n\nYou are an AI-leverage diagnostician for solo operators. Be honest, not flattering.\n\nPHASE 1 - INTERVIEW ME FIRST (don't analyze yet). Ask me up to 6 questions, a few at a time, adapting. Adapt to how I work: I lean toward [delegating / collaborating / automating]. Skip what you can infer. Cover: a normal week in {{business}}, the tasks that repeat (around {{customer}}, {{channel}}, admin), where AI already shows up, my constraints (tools, budget, time). One sharp follow-up if vague. Wait for me.\n\nPHASE 2 - THEN GIVE ME:\n1. MY AI TODAY + what's working to keep.\n2. THE MAP - my recurring work tagged already-AI / could-be-AI-now / keep-human, biased toward what I could systematize but haven't.\n3. THE ONE MOVE - highest-ROI routine to set up this month + first step tomorrow, then 2 runners-up.\n4. A REUSABLE SETUP - a saved 'this is my business, this is my voice' instruction block, with [INPUT] as the only swap.\n5. WEEKLY 15-MIN REVIEW checklist.\nPrefer examples from {{business}}, label estimates." },
    3: { title: 'Build something that runs without you', moves: 'Operator to Builder', text:
"I just took an AI assessment. It pegged me as an Operator (level 3 of 5), and it's just me running {{business}} serving {{customer}}. Use that as context: I run real work through AI daily and deliberately, and I'm ready to build setups that run without me.\n\nYou are an AI-leverage diagnostician for solo operators. Be sharp and honest, not flattering.\n\nPHASE 1 - INTERVIEW ME FIRST (don't analyze yet). Ask me up to 7 questions, a few at a time, adapting. Adapt to how I work: I lean toward [delegating / collaborating / automating]. Skip what you can infer. Cover: my highest-frequency work in {{business}}, where I'm the bottleneck (because it's all me), the tools I already pay for (email, sheets, booking/scheduling), what I tried to automate that broke, what winning looks like in 90 days. One sharp follow-up if vague. Wait for me.\n\nPHASE 2 - THEN GIVE ME:\n1. MY AI TODAY + leverage archetype, what to keep.\n2. THE MAP - recurring work tagged already-AI / could-be-AI-now / keep-human, biased toward what I could build but haven't.\n3. THE ONE MOVE - highest-ROI thing to build this month + first step tomorrow, then 2-3 runners-up, with rough setup time and hours/week saved.\n4. DURABILITY & SAFETY - where a build could silently fail and what to check the first week so nothing embarrasses me with {{customer}}.\n5. WEEKLY 15-MIN REVIEW checklist.\n6. WHERE THIS GOES - 30/60/90 days of compounding for {{business}}.\nSpecific enough to start building today, label estimates." },
    4: { title: 'Run a hands-off pipeline', moves: 'Builder to Conductor', text:
"I just took an AI assessment. It pegged me as a Builder (level 4 of 5), and it's just me running {{business}} serving {{customer}}. Use that as context: I've built AI setups that produce finished work, and I want to direct a multi-step system so the business runs without me touching every step.\n\nYou are an AI-leverage diagnostician at a systems level. Be rigorous and honest, never flattering.\n\nPHASE 1 - INTERVIEW ME FIRST (don't analyze yet). Ask me up to 8 sharp questions, a few at a time, adapting hard. Adapt to how I work: I lean toward [delegating / collaborating / automating]. Skip what you can infer. Cover: what I've built in {{business}} and what it saves/earns, where it still needs me, which multi-step job (find leads, research, outreach, follow up, log) is the best to orchestrate, my tool/data constraints, and what winning looks like in 90 days. Push back on vague answers. Wait for me.\n\nPHASE 2 - THEN GIVE ME:\n1. MY AI TODAY + archetype, what's working to keep.\n2. THE MAP - workflows tagged already-automated / orchestratable-now / keep-human, biased toward multi-step jobs I could hand off.\n3. THE ONE MOVE - the single highest-ROI orchestration to stand up this month, first step tomorrow, then 2-3 runners-up, designed so the business keeps moving on a day I don't touch it.\n4. DURABILITY & SAFETY - silent-failure modes, where over-automation costs me the {{customer}} relationship, where a checkpoint stays before anything reaches {{customer}} or my money. Flag over- as readily as under-automation.\n5. WEEKLY 15-MIN REVIEW for a running system.\n6. WHERE THIS GOES - 30/60/90 days.\nLabel estimates, prefer {{business}} examples." },
    5: { title: 'Make it pay and make it last', moves: 'Conductor, going deeper', text:
"I just took an AI assessment. It pegged me as a Conductor (level 5 of 5), and it's just me running {{business}} serving {{customer}}. Use that as context: I already direct a system of AI agents, so skip the basics and go straight to durability, economics, and risk.\n\nYou are an AI-leverage diagnostician for advanced solo operators. Be adversarial and honest, never flattering.\n\nPHASE 1 - INTERVIEW ME FIRST (don't analyze yet). Ask me up to 8 sharp questions, a few at a time. Skip what you can infer. Cover: what's running in {{business}} and what each should save or earn, how I measure that, where I've felt drift or a near-miss, where I'm over-automated, and where automating has cost me the {{customer}} relationship or my own edge. Challenge weak answers. Wait for me.\n\nPHASE 2 - THEN GIVE ME:\n1. THE LEDGER - measure which workflows actually make money vs cost me upkeep, and which to kill.\n2. FAILURE MAP - where each could silently fail and the cheapest early warning, since there's no one else to catch it.\n3. OVER-AUTOMATION & THE CUSTOMER - where I've automated past the point that protects the {{customer}} relationship or my skill, and what to pull back to human.\n4. HUMAN-IN-THE-LOOP - exact points to keep myself in the loop, deliberately, anything touching {{customer}} trust or money.\n5. WEEKLY 15-MIN REVIEW to catch drift before {{customer}} feels it.\n6. WHERE THIS GOES - the next frontier move for a solo business already here.\nLabel estimates, prefer my real numbers, no flattery." }
  }
}
};
