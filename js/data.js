/* ============================================================
   BASTA PLAY · data.js
   All game content: modes, puzzles, memory, speed, strategy,
   achievements, ranks. Exposed on window.BASTA_DATA
   ============================================================ */
(function () {
  "use strict";

  const MODES = [
    { id: "puzzle",   title: "Marketing Puzzle",  icon: "🧩", tint: "#1E5BD6",
      desc: "Solve branding & marketing challenges — order funnels, match concepts, crack the strategy.",
      tag: "Logic", best: "puzzleBest" },
    { id: "memory",   title: "Memory Challenge",  icon: "🧠", tint: "#F97316",
      desc: "Watch the brand sequence light up, then reproduce it perfectly from memory.",
      tag: "Focus", best: "memoryBest" },
    { id: "speed",    title: "Speed Challenge",   icon: "⚡", tint: "#1E5BD6",
      desc: "React in a flash. Tap the right brand element before the clock beats you.",
      tag: "Reflex", best: "speedBest" },
    { id: "strategy", title: "Strategy Challenge",icon: "♟️", tint: "#F97316",
      desc: "Real marketing scenarios. Pick the smartest decision and build your impact.",
      tag: "Decision", best: "strategyBest" }
  ];

  /* ---------- MARKETING PUZZLE ----------
     Two puzzle types: "order" (sequence the steps) and "quiz" (best answer). */
  const PUZZLES = [
    { type: "order", q: "Arrange the AIDA marketing funnel in the correct order.",
      hint: "The classic path a customer travels toward a purchase.",
      items: ["Awareness", "Interest", "Desire", "Action"] },
    { type: "order", q: "Order the brand-building journey from first to last.",
      hint: "How a brand grows in a customer's mind.",
      items: ["Awareness", "Recognition", "Preference", "Loyalty"] },
    { type: "order", q: "Sequence a campaign lifecycle correctly.",
      hint: "From idea to insight.",
      items: ["Research", "Strategy", "Creative", "Launch", "Measure"] },
    { type: "order", q: "Put the content marketing funnel in order.",
      hint: "Top to bottom of the funnel.",
      items: ["Attract", "Engage", "Convert", "Delight"] },
    { type: "quiz", q: "Which element makes a brand instantly recognizable across every touchpoint?",
      hint: "Consistency is the key word.",
      options: ["A one-time viral post", "A consistent visual identity", "A large ad budget", "Frequent logo redesigns"],
      answer: 1 },
    { type: "quiz", q: "A 'call to action' (CTA) is designed to…",
      hint: "It tells the audience what to do next.",
      options: ["Describe company history", "Prompt an immediate response", "List every product feature", "Fill white space"],
      answer: 1 },
    { type: "quiz", q: "What does a strong brand 'tagline' primarily communicate?",
      hint: "Think about Basta's: نصنع التجربة ويستمر الأثر.",
      options: ["Legal disclaimers", "The brand's promise & value", "The office address", "Pricing details"],
      answer: 1 },
    { type: "quiz", q: "Which metric best measures brand awareness growth?",
      hint: "It's about how many people know you.",
      options: ["Reach & impressions", "Office rent", "Number of meetings", "Paper used"],
      answer: 0 },
    { type: "order", q: "Order these by the customer journey (marketing perspective).",
      hint: "Stranger to advocate.",
      items: ["Stranger", "Lead", "Customer", "Advocate"] },
    { type: "quiz", q: "In positioning, the 'unique value proposition' answers which question?",
      hint: "It sets you apart.",
      options: ["Where is the office?", "Why choose us over others?", "What time do we open?", "Who is the CEO?"],
      answer: 1 },
    { type: "quiz", q: "Which channel is best for building long-term organic brand trust?",
      hint: "Slow, compounding, owned.",
      options: ["Paid pop-up ads", "Consistent content & community", "Random cold calls", "Spam email blasts"],
      answer: 1 },
    { type: "order", q: "Arrange the design workflow for a brand identity.",
      hint: "From listening to delivery.",
      items: ["Brief", "Concept", "Design", "Refine", "Deliver"] }
  ];

  /* ---------- MEMORY: brand tiles ---------- */
  const MEMORY_TILES = [
    { icon: "▲", fill: "#1E5BD6", glow: "0 0 24px #1E5BD6", label: "Blue arrow" },
    { icon: "■", fill: "#F97316", glow: "0 0 24px #F97316", label: "Orange block" },
    { icon: "●", fill: "#4d82e6", glow: "0 0 24px #4d82e6", label: "Sky dot" },
    { icon: "◆", fill: "#fb8f42", glow: "0 0 24px #fb8f42", label: "Amber diamond" },
    { icon: "✦", fill: "#1a4fbd", glow: "0 0 24px #1a4fbd", label: "Deep spark" },
    { icon: "▬", fill: "#F97316", glow: "0 0 24px #F97316", label: "Orange bar" }
  ];

  /* ---------- SPEED: targets ---------- */
  const SPEED_ELEMENTS = [
    { icon: "▲", color: "#1E5BD6", name: "Blue Arrow" },
    { icon: "■", color: "#F97316", name: "Orange Square" },
    { icon: "●", color: "#4d82e6", name: "Blue Dot" },
    { icon: "◆", color: "#fb8f42", name: "Orange Gem" },
    { icon: "★", color: "#1E5BD6", name: "Blue Star" },
    { icon: "✚", color: "#F97316", name: "Orange Plus" }
  ];

  /* ---------- STRATEGY scenarios ---------- */
  const STRATEGY = [
    { scenario: "A new coffee brand has a tiny budget but a beautiful story. What's the smartest first move?",
      context: "Limited budget · strong narrative",
      options: [
        { t: "Spend it all on one TV ad", pts: 1, why: "High cost, low targeting — risky for a small brand." },
        { t: "Build organic storytelling on social + micro-influencers", pts: 3, why: "Best fit: leverages the story, targets the right people, and scales affordably." },
        { t: "Print thousands of flyers", pts: 1, why: "Broad and untargeted; hard to measure impact." },
        { t: "Wait until the budget grows", pts: 0, why: "Momentum lost — competitors move in." }
      ]},
    { scenario: "Engagement dropped 40% after you started posting 5x daily. What do you do?",
      context: "Over-posting · falling engagement",
      options: [
        { t: "Post even more to stay visible", pts: 0, why: "Fatigue is the cause — more volume worsens it." },
        { t: "Cut to fewer, higher-quality posts and study the analytics", pts: 3, why: "Correct: quality over quantity, driven by data." },
        { t: "Change the logo", pts: 0, why: "Unrelated to the posting-frequency problem." },
        { t: "Delete the account and restart", pts: 0, why: "Destroys your audience and history." }
      ]},
    { scenario: "A competitor copies your campaign style. Best response?",
      context: "Imitation · brand differentiation",
      options: [
        { t: "Sue them immediately", pts: 1, why: "Slow, costly, often unwinnable for a 'style'." },
        { t: "Double down on your unique brand voice & innovate", pts: 3, why: "Best: stay ahead by being unmistakably you." },
        { t: "Copy their next move", pts: 0, why: "You become the follower and lose identity." },
        { t: "Ignore the market entirely", pts: 1, why: "Passive; misses a chance to differentiate." }
      ]},
    { scenario: "Your ad has great clicks but almost no conversions. Where do you look first?",
      context: "High CTR · low conversion",
      options: [
        { t: "Increase the ad budget", pts: 0, why: "Amplifies a broken funnel — wastes money." },
        { t: "Audit the landing page & offer match", pts: 3, why: "Correct: the drop is after the click — fix the destination." },
        { t: "Change the ad platform", pts: 1, why: "Premature; the ad itself is performing on clicks." },
        { t: "Add more ad variations", pts: 1, why: "Doesn't address the post-click gap." }
      ]},
    { scenario: "A client wants to target 'everyone'. What's the professional recommendation?",
      context: "Targeting · segmentation",
      options: [
        { t: "Agree — bigger reach is better", pts: 0, why: "Targeting everyone reaches no one effectively." },
        { t: "Define clear audience segments & a primary persona", pts: 3, why: "Best: focused targeting drives relevance and ROI." },
        { t: "Only target the cheapest audience", pts: 1, why: "Cost-led, not value-led — weak strategy." },
        { t: "Let the algorithm decide with no input", pts: 1, why: "Guidance improves algorithmic performance." }
      ]},
    { scenario: "Launch day: a product photo has a typo in the caption, already live for 1 hour.",
      context: "Crisis · brand trust",
      options: [
        { t: "Leave it — nobody will notice", pts: 0, why: "Erodes brand professionalism and trust." },
        { t: "Quietly fix it and monitor engagement", pts: 3, why: "Best: correct fast, stay calm, keep the launch clean." },
        { t: "Delete the whole post & the momentum", pts: 1, why: "Loses reach and engagement already earned." },
        { t: "Post a long public apology", pts: 1, why: "Over-reaction for a minor caption fix." }
      ]},
    { scenario: "You have one strong reel that outperformed everything. What's next?",
      context: "Winning content · scaling",
      options: [
        { t: "Never touch it again", pts: 0, why: "Wastes a proven winner." },
        { t: "Analyze why it worked, then create a repeatable series", pts: 3, why: "Correct: turn one win into a scalable format." },
        { t: "Repost the exact same reel daily", pts: 1, why: "Audience fatigue kills the magic quickly." },
        { t: "Switch to a totally different style", pts: 0, why: "Abandons proven insight." }
      ]}
  ];

  /* ---------- ACHIEVEMENTS ---------- */
  const ACHIEVEMENTS = [
    { id: "first_play",  icon: "🎯", name: "First Move",    desc: "Play your first game." },
    { id: "puzzle_ace",  icon: "🧩", name: "Puzzle Ace",    desc: "Perfect a Marketing Puzzle." },
    { id: "memory_pro",  icon: "🧠", name: "Mind Palace",   desc: "Reach level 6 in Memory." },
    { id: "speed_demon", icon: "⚡", name: "Speed Demon",   desc: "Score 20+ in Speed Challenge." },
    { id: "strategist",  icon: "♟️", name: "Master Strategist", desc: "Ace a Strategy Challenge." },
    { id: "streak3",     icon: "🔥", name: "On Fire",       desc: "Keep a 3-day play streak." },
    { id: "coin100",     icon: "💰", name: "Coin Collector", desc: "Bank 100 coins." },
    { id: "level5",      icon: "⭐", name: "Rising Star",    desc: "Reach player level 5." },
    { id: "level10",     icon: "🌟", name: "Brand Legend",   desc: "Reach player level 10." },
    { id: "daily",       icon: "📅", name: "Daily Grinder",  desc: "Complete a Daily Challenge." },
    { id: "allmodes",    icon: "🏆", name: "Full Spectrum",  desc: "Play all four game modes." },
    { id: "perfectionist", icon: "💎", name: "Perfectionist", desc: "Win 10 games total." }
  ];

  /* ---------- RANKS (by level) ---------- */
  const RANKS = [
    { min: 1,  name: "Rookie" },
    { min: 3,  name: "Junior Marketer" },
    { min: 5,  name: "Brand Builder" },
    { min: 8,  name: "Growth Hacker" },
    { min: 11, name: "Strategist" },
    { min: 15, name: "Creative Director" },
    { min: 20, name: "Marketing Legend" }
  ];

  /* Seeded RNG (mulberry32) for the Daily Challenge */
  function seededRandom(seed) {
    let t = seed >>> 0;
    return function () {
      t += 0x6D2B79F5;
      let r = Math.imul(t ^ (t >>> 15), 1 | t);
      r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }

  window.BASTA_DATA = {
    MODES, PUZZLES, MEMORY_TILES, SPEED_ELEMENTS, STRATEGY,
    ACHIEVEMENTS, RANKS, seededRandom
  };
})();
