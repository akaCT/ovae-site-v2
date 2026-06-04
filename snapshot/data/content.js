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
        name: "Unaware",
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
        name: "The Bottlenecked Builder",
        blurb: "Personally, you're flying. You've got AI habits most people are years from. But the business around you hasn't caught up, so all that leverage dead-ends at you. You're the fastest part of a slow machine. The fix isn't getting better at AI. It's getting the rest of the operation to run at your speed."
      },
      // low YOU / high BIZ
      next_at_wheel: {
        name: "Next at the Wheel",
        blurb: "The business is already pulling real leverage out of AI, but it's running on systems, not on you. You're standing next to a fast car you haven't fully learned to drive. That's a good problem. The infrastructure already exists, so every habit you pick up pays off right away instead of starting from zero."
      },
      // low / low - expected modal cell; framed as leapfrog
      ground_floor: {
        name: "Ground Floor",
        blurb: "You and the business are both early, and that's a good place to be standing. Everyone above you had to unlearn old habits to get here. You don't. You get to build it right from the start while competitors are mid-renovation. Most companies that leapfrogged the last tech shift looked a lot like this the year before they did it."
      },
      // high / high
      ai_native: {
        name: "AI-Native",
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
      0: { title: 'Your first real AI move', moves: 'Unaware to Searcher', text:
"You are my practical assistant. I don't use AI much yet and I want one quick win today.\n\nHere is something real I have to deal with this week:\n[PASTE the email, message, or task you've been putting off]\n\nDo three things:\n1. Tell me, in plain language, the fastest way to handle this.\n2. Write a version I can actually use or send.\n3. Suggest one more thing this week I could hand to you instead of doing the hard way.\n\nKeep it short and concrete. No theory." },
      1: { title: 'Stop writing from blank', moves: 'Searcher to Drafter', text:
"Be my drafting partner. Before you answer, here is my context:\n- What I do: [one line]\n- Who I'm talking to: [audience]\n- The tone I want: [e.g. warm, direct, professional]\n\nThe task:\n[PASTE or describe the thing you need to write]\n\nWrite a complete first draft I can edit, not an outline. Then list 3 questions whose answers would make the next draft sharper. At the end, give me a reusable version of this prompt I can save and use again for similar tasks." },
      2: { title: 'Turn a one-off into a routine', moves: 'Drafter to Operator', text:
"I want to turn a repeating task into a reliable routine I run through you every time.\n\nThe task I do over and over: [describe it]\nThe raw input I usually start from: [PASTE a real example: data, a thread, a list]\nWhat a good finished result looks like: [describe or paste an example]\n\nDo this:\n1. Process the example I pasted and produce the finished result now.\n2. Write me a single reusable instruction block I can paste each time, with [INPUT] as the only thing I swap.\n3. Tell me what real input I should feed you next time to get an even better result." },
      3: { title: 'Build something that runs without you', moves: 'Operator to Builder', text:
"Help me build one small thing that runs without me doing it by hand each time.\n\nThe repeating task: [describe it]\nThe tools I already use: [e.g. Gmail, Google Sheets, Notion, my CRM]\nHow good it has to be before I'd trust it: [be honest]\n\nDo this:\n1. Recommend the simplest way to automate this with tools I already have: a saved workflow, a script, a no-code zap, or a reusable assistant.\n2. Give me exact step-by-step setup instructions I can follow in 30 minutes.\n3. Tell me what to check the first few runs so I catch mistakes before they cost me." },
      4: { title: 'Chain it into one hands-off job', moves: 'Builder to Conductor', text:
"I already automate single tasks. Now I want one multi-step job to run end to end while I only review the output.\n\nThe job, start to finish: [e.g. find a lead, research them, draft outreach, log it, follow up]\nThe tools and data involved: [list them]\n\nDo this:\n1. Map the job into clear steps and tell me which can run automatically and which need me.\n2. Design a setup where the steps hand off to each other (agent, workflow, or connected tools) and I only check the result.\n3. Give me one place to put a human checkpoint so nothing high-stakes goes out unreviewed.\n4. List what I should monitor weekly to know it's still working." },
      5: { title: 'Make the machine pay and last', moves: 'Conductor, going deeper', text:
"I run several AI-driven workflows already. Help me make them durable and worth it, not just impressive.\n\nWhat I have running: [list your automations/agents]\nWhat each was supposed to save or earn: [rough numbers]\n\nDo this:\n1. Show me how to measure whether each one actually pays: time saved or money made vs. upkeep.\n2. Flag where I'm over-automated and at risk of de-skilling or a silent failure.\n3. Tell me exactly where to keep a human in the loop on purpose.\n4. Give me a simple weekly review I can run to catch drift before it costs me." }
    },
    owner: {
      0: { title: 'Your first real AI move', moves: 'Unaware to Searcher', text:
"You are my practical business assistant. I run {{business}} and I barely use AI yet. I want one quick win today.\n\nHere's something real I'm dealing with this week:\n[PASTE the {{customer}} email, the pricing question, or the task you've been avoiding]\n\nDo three things:\n1. Tell me in plain language the fastest way to handle this.\n2. Write a version I can actually send or use.\n3. Name one more thing this week I could hand to you instead of doing it the slow way.\n\nShort and concrete. No theory." },
      1: { title: 'Stop writing from blank', moves: 'Searcher to Drafter', text:
"Be my drafting partner for my business. Context first:\n- My business: {{business}}\n- Who I serve: {{customer}}\n- My tone with them: [warm / direct / premium / no-nonsense]\n\nThe task:\n[PASTE the proposal, the {{customer}} reply, or the message you need to write]\n\nWrite a complete first draft I can edit, not an outline. Then give me a saved, reusable version of this prompt so next time I just drop in the new details. Flag anything you assumed that I should correct." },
      2: { title: 'Run your business on a rhythm', moves: 'Drafter to Operator', text:
"I want to run a repeating part of my business through you every time, using my real data.\n\nMy business: {{business}}\nThe repeating task: [e.g. weekly {{metric}} summary, {{customer}} follow-ups, content for {{channel}}]\nReal input I start from: [PASTE last week's numbers, the {{customer}} list, or recent {{customer}} messages]\n\nDo this:\n1. Process what I pasted and produce the finished result now.\n2. Tell me the single most useful action to take based on it. Not just words, a decision.\n3. Write me a reusable instruction block (with my business voice baked in) I paste each week, swapping only the new data." },
      3: { title: 'Build something that runs your business without you', moves: 'Operator to Builder', text:
"Help me build one thing in my business that runs without me touching it each time.\n\nMy business: {{business}}\nThe repeating task that eats my time: [e.g. answering the same {{customer}} questions, sending follow-ups, routing new leads]\nTools I already pay for: [e.g. email, Google Sheets, my booking tool, my CRM]\n\nDo this:\n1. Recommend the simplest automation using tools I already have.\n2. Give me exact setup steps I can finish in under an hour.\n3. Tell me what to watch the first week so a mistake doesn't reach a {{customer}}.\n4. Estimate the hours a week this buys back." },
      4: { title: 'Run a hands-off pipeline', moves: 'Builder to Conductor', text:
"I automate single tasks in my business already. Now I want one multi-step job to run end to end while I just review.\n\nMy business: {{business}}\nThe job start to finish: [e.g. new lead, research, draft outreach, log in CRM, follow up if no reply]\nTools and data involved: [list them]\n\nDo this:\n1. Break the job into steps and mark which run automatically vs. need me.\n2. Design how the steps hand off so I only check the output.\n3. Put one human checkpoint before anything reaches a {{customer}} or touches money.\n4. Give me a 5-minute weekly review to confirm it's still working and still earning." },
      5: { title: 'Make it pay and make it last', moves: 'Conductor, going deeper', text:
"I run several AI workflows in my business. Help me make them durable and profitable, not just clever.\n\nMy business: {{business}}\nWhat's running: [list automations/agents]\nWhat each should save or earn: [rough numbers]\n\nDo this:\n1. Show me how to measure which ones actually pay vs. cost me in upkeep.\n2. Flag where I'm over-automated, risk of silent failure or losing the {{customer}} touch that wins business.\n3. Tell me exactly where to keep a human in the loop on purpose.\n4. Give me a weekly review to catch drift before a {{customer}} feels it." }
    },
    team: {
      0: { title: 'Your first real AI move at work', moves: 'Unaware to Searcher', text:
"You are my practical work assistant. I barely use AI yet and want one quick win today.\n\nHere's something real on my plate this week:\n[PASTE the message, doc, or task you've been putting off]\n\nDo three things:\n1. Tell me the fastest way to handle it, in plain language.\n2. Write a version I can actually use or send.\n3. Name one more thing this week I could hand to you instead of doing it the slow way.\n\nShort and concrete." },
      1: { title: 'Stop writing from blank', moves: 'Searcher to Drafter', text:
"Be my drafting partner at work. Context first:\n- My role / team: [one line]\n- Who this is for: [audience]\n- Tone: [how your team actually writes]\n\nThe task:\n[PASTE the update, reply, or doc you need to write]\n\nWrite a complete first draft I can edit, not an outline. Then give me a reusable version of this prompt so next time I just drop in the new details. Flag any assumptions I should correct." },
      2: { title: 'Run part of your week on a rhythm', moves: 'Drafter to Operator', text:
"I want to run a repeating part of my work through you every time, with my real inputs.\n\nMy role: [one line]\nThe repeating task: [e.g. summarizing threads, prepping the weekly deck, cleaning a tracker]\nReal input I start from: [PASTE a thread, an export, or last week's version]\n\nDo this:\n1. Process what I pasted and produce the finished result now.\n2. Tell me the most useful next action it points to.\n3. Write a reusable instruction block (matching how my team writes) I paste each time, swapping only the new input." },
      3: { title: 'Build something your team can reuse', moves: 'Operator to Builder', text:
"Help me build one small thing that runs without me doing it by hand, and that a teammate could use too.\n\nMy role: [one line]\nThe repeating task: [describe it]\nTools the team already uses: [e.g. Slack, Google Docs, the project tracker]\n\nDo this:\n1. Recommend the simplest reusable build (a saved workflow, a template, or a bot) using tools we already have.\n2. Give me setup steps I can finish in 30 minutes.\n3. Tell me how to hand it to a teammate so it doesn't live only in my head.\n4. Tell me what to check the first few runs." },
      4: { title: 'Run a hands-off job for the team', moves: 'Builder to Conductor', text:
"I automate single tasks already. Now I want one multi-step job to run end to end for my team while I review the output.\n\nMy team's job, start to finish: [e.g. intake request, draft response, route to owner, follow up]\nTools and data involved: [list them]\n\nDo this:\n1. Break it into steps and mark which run automatically vs. need a person.\n2. Design how steps hand off so I only check results.\n3. Set it up so teammates can trigger it without me.\n4. Add one human checkpoint for anything customer-facing or high-stakes, and a weekly check to confirm it still works." },
      5: { title: 'Make it durable and shared', moves: 'Conductor, going deeper', text:
"I run several AI workflows for my team. Help me make them durable, measurable, and not dependent on just me.\n\nWhat's running: [list them]\nWhat each should save the team: [rough numbers]\n\nDo this:\n1. Show me how to measure whether each actually saves time vs. upkeep.\n2. Flag where we're over-automated or at risk of a silent failure.\n3. Tell me where to keep a human in the loop on purpose.\n4. Give me a way to teach the team to run and read the system, plus a weekly review to catch drift." }
    },
    ic: {
      0: { title: 'Your first real AI move', moves: 'Unaware to Searcher', text:
"You are my practical work assistant. I barely use AI yet and want one quick win on my actual work today.\n\nHere's something real I have to do this week:\n[PASTE the task, the doc, or the problem you've been stalling on]\n\nDo three things:\n1. Tell me the fastest sane way to handle it.\n2. Produce a first version I can actually use.\n3. Name one more thing this week I could hand to you instead of grinding through it.\n\nShort and concrete. No fluff." },
      1: { title: 'Stop starting from zero', moves: 'Searcher to Drafter', text:
"Be my drafting partner on my real work. Context first:\n- What I do: [one line]\n- Who/what this is for: [audience or system]\n- The standard it has to hit: [be specific]\n\nThe task:\n[PASTE or describe what you need: the doc, the code, the analysis]\n\nProduce a complete first version I can edit and improve, not an outline. Then give me a reusable version of this prompt for similar tasks, and list 3 questions that would make the next pass sharper." },
      2: { title: 'Run a chunk of your job on a rhythm', moves: 'Drafter to Operator', text:
"I want to run a repeating part of my job through you every time, with real material.\n\nWhat I do: [one line]\nThe repeating task: [e.g. first-pass research, boilerplate code, data cleanup, summarizing]\nReal input I start from: [PASTE the dataset, the snippet, or the brief]\n\nDo this:\n1. Process what I pasted and produce the finished result now.\n2. Tell me the next step it points to, not just prose.\n3. Write a reusable instruction block that holds my style and standards, so I paste it and swap only the input." },
      3: { title: 'Build a tool that does the work for you', moves: 'Operator to Builder', text:
"Help me build one reusable thing that does a repeating task for me instead of me doing it each time.\n\nWhat I do: [one line]\nThe repeating task: [describe it]\nTools I already use: [e.g. VS Code, Sheets, Notion, the terminal]\n\nDo this:\n1. Recommend the simplest reusable build (a script, a saved workflow, or a focused assistant) using tools I have.\n2. Give me exact setup steps I can do in 30 minutes.\n3. Tell me what to verify the first few runs so a mistake doesn't slip through.\n4. Estimate the time per week this saves." },
      4: { title: 'Chain it into a hands-off task', moves: 'Builder to Conductor', text:
"I automate single tasks already. Now I want one multi-step task to run start to finish while I only review.\n\nThe task, end to end: [e.g. gather inputs, draft, self-check, format, output]\nTools and data involved: [list them]\n\nDo this:\n1. Break it into steps and mark which run automatically vs. need me.\n2. Design how the steps hand off so I review results instead of redoing them.\n3. Build it so a teammate could run it too, not just me.\n4. Add a checkpoint where my judgment is required, and what to monitor." },
      5: { title: 'Keep the edge while it scales', moves: 'Conductor, going deeper', text:
"I run several AI-driven workflows on my work. Help me make them reliable without dulling the skills that make me valuable.\n\nWhat's running: [list them]\nWhat each should produce: [describe]\n\nDo this:\n1. Show me how to verify each still produces good work and catch when it drifts.\n2. Flag where heavy automation risks de-skilling me, and what to keep doing by hand on purpose.\n3. Tell me where a human judgment call must stay in the loop.\n4. Make sure I can explain how the whole system works, so I actually own it." }
    },
    solo: {
      0: { title: 'Your first real AI move', moves: 'Unaware to Searcher', text:
"You are my practical assistant. I run {{business}} solo and barely use AI yet. I want one quick win today.\n\nHere's something real on my plate this week:\n[PASTE the {{customer}} message, the task, or the thing you've been avoiding]\n\nDo three things:\n1. Tell me the fastest way to handle it, plainly.\n2. Write a version I can actually use or send.\n3. Name one more thing this week I could hand to you instead of doing it the slow way.\n\nShort and concrete." },
      1: { title: 'Stop writing from blank', moves: 'Searcher to Drafter', text:
"Be my drafting partner. I run {{business}} solo. Context first:\n- What I sell: {{business}}\n- Who I sell to: {{customer}}\n- My voice: [how you actually talk to {{customer}}]\n\nThe task:\n[PASTE the pitch, post, or {{customer}} reply you need to write]\n\nWrite a complete first draft in my voice, not an outline. Then give me a reusable version of this prompt so next time I just drop in the details. Flag anything you assumed." },
      2: { title: 'Run your business on a rhythm', moves: 'Drafter to Operator', text:
"I run {{business}} solo and want to run the repeating parts through you every time, with my real info.\n\nThe repeating task: [e.g. content for {{channel}}, invoicing copy, {{customer}} follow-ups]\nReal input I start from: [PASTE recent {{customer}} messages, my numbers, or my client list]\n\nDo this:\n1. Process what I pasted and produce the finished result now.\n2. Tell me the smartest next action it points to.\n3. Write a reusable 'this is my business, this is my voice' instruction block I paste each time, swapping only the new info." },
      3: { title: 'Build something that runs without you', moves: 'Operator to Builder', text:
"Help me build one thing in my solo business that runs without me touching it each time.\n\nMy business: {{business}}\nThe task that eats my time: [e.g. the same {{customer}} questions, follow-ups, booking, content posting]\nTools I already pay for: [e.g. email, Sheets, my booking/scheduling tool]\n\nDo this:\n1. Recommend the simplest automation using tools I already have.\n2. Give me exact setup steps I can finish in under an hour.\n3. Tell me what to check the first week so nothing embarrasses me with a {{customer}}.\n4. Estimate the hours a week this buys back." },
      4: { title: 'Run a hands-off pipeline', moves: 'Builder to Conductor', text:
"I automate single tasks in my solo business. Now I want one multi-step job to run end to end while I just review.\n\nMy business: {{business}}\nThe job start to finish: [e.g. find leads, research, draft outreach, follow up, log]\nTools and data involved: [list them]\n\nDo this:\n1. Break it into steps and mark which run automatically vs. need me.\n2. Design how the steps hand off so I only check the output.\n3. Put a checkpoint before anything reaches a {{customer}} or my money.\n4. Build it so the business keeps moving on a day I don't touch it, and tell me what to review weekly." },
      5: { title: 'Make it pay and make it last', moves: 'Conductor, going deeper', text:
"I run my solo business on several AI workflows. Help me make them profitable and durable, not just a pile of tools.\n\nMy business: {{business}}\nWhat's running: [list automations/agents]\nWhat each should save or earn: [rough numbers]\n\nDo this:\n1. Show me how to see which ones actually make money vs. cost me upkeep.\n2. Flag where I'm over-automated and risk losing the {{customer}} relationship or a silent failure.\n3. Tell me exactly where to keep myself in the loop on purpose.\n4. Give me a weekly review to catch drift before a {{customer}} feels it." }
    }
  }
};
