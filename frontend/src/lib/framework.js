// All verbatim PDF questions / prompts / structures used across Steps 1–7.
// Strings here are the source of truth for the framework content.

// ============ STEP 1 — DEFINE Your Purpose ============

// New section between Identity and Driven, not Drifter
export const FINDING_PURPOSE_QUESTIONS = [
    { key: "fp_q1", q: "Why did you start this business?" },
    { key: "fp_q2", q: "What difference do you hope to make in the world through your business?" },
    { key: "fp_q3", q: "Who has influenced you the most in starting this business, and why?" },
    { key: "fp_q4", q: "Please rank in order these priorities in your life:", helper: "Drag to reorder. 1 = highest priority." },
    { key: "fp_q5", q: "What would you describe as your purpose?" }
];

export const FINDING_PURPOSE_PRIORITIES = ["God", "Family", "Friends", "Work", "Community"];

export const NAPOLEON_HILL_LEARN_MORE = {
    title: "Finding Your Purpose",
    intro: "Napoleon Hill presented the concept years ago as Definiteness of Purpose — having a clear, unwavering vision of what one wants to achieve, coupled with a deep, intense desire and a persistent effort to realize that vision. This usually includes what you are willing to “give” to accomplish this goal.",
    points: [
        { title: "Clarity of Goal", body: "It requires having a specific and clearly defined objective. This clarity is crucial because it directs all your efforts and decisions towards achieving that particular goal." },
        { title: "Persistence and Commitment", body: "Hill emphasizes the importance of persistent and continuous effort towards your goal. This unwavering commitment is essential for overcoming obstacles and achieving success." },
        { title: "Burning Desire", body: "He talks about having a “burning desire” for its achievement. This intense desire acts as a powerful motivational force that propels you towards your goal." },
        { title: "Action-Oriented Approach", body: "Hill argues that simply having a purpose is not enough; it must be accompanied by continuous action. A definitive plan, coupled with continuous action toward that plan, is essential." },
        { title: "Influence on Subconscious Mind", body: "Hill believes that a definiteness of purpose, combined with a burning desire, impresses one’s objectives upon the subconscious mind, thereby setting in motion the forces that eventually lead to material realization." },
        { title: "Positive Influence on Others", body: "A clear purpose can also positively affect one’s ability to influence and lead others. It attracts the cooperation of other people who are attuned to the same goal." }
    ]
};

export const BECOME_DRIVEN_QUOTE = {
    text: "There are two patterns most people fall into: Drifting… or Driving. Drifting is unconscious. It's running on autopilot... Driven is conscious. It's choosing your values. Defining your identity.",
    attribution: "Russell Brunson"
};

export const BECOME_DRIVEN_LEARN_MORE = {
    title: "Become Driven",
    intro: "In Outwitting the Devil, Napoleon Hill defines the difference between a drifter and a driven person (non-drifter) based on whether they use their own mind, take initiative, and have a clear, definite purpose.",
    stat: { drifters: "98%", driven: "2%", note: "of the population are drifters; only 2% are driven individuals who refuse to let fear dictate their path." },
    drifter: {
        title: "The Drifter (the 98%)",
        items: [
            { name: "Lack of Purpose", body: "Total lack of a major purpose in life." },
            { name: "Passive Mindset", body: "Easily influenced by environment and external circumstances." },
            { name: "Avoids Thinking", body: "Works harder to avoid thinking than others do to earn a living." },
            { name: "Path of Least Resistance", body: "Always takes the easiest way out." },
            { name: "Fearful", body: "Subject to worry, sadness, sickness, and despair." },
            { name: "Unoriginal Opinions", body: "Has many opinions but none are their own." },
            { name: "Failure Management", body: "Repeats the same mistakes, never profiting by failure." }
        ]
    },
    driven: {
        title: "The Driven / Non-Drifter (the 2%)",
        items: [
            { name: "Definiteness of Purpose", body: "Has a major, specific goal they are working toward." },
            { name: "Independent Thinker", body: "Uses their own mind and does not allow external influences to dictate their choices." },
            { name: "Resilient", body: "Views failure as temporary defeat and keeps going." },
            { name: "Creator of Opportunity", body: "Creates opportunities rather than waiting for them." },
            { name: "Confidence", body: "Exhibits a high level of self-confidence and initiative." },
            { name: "Helpful", body: "Acts as a “go-giver” rather than a “go-getter,” providing value to others." },
            { name: "Self-Control", body: "Exercises command over their emotions and actions." }
        ]
    },
    takeaway: "The main takeaway: fear controls the 98% by disrupting their ability to think, while the 2% use their own minds and build the habit of definiteness of purpose."
};

export const DRIVEN_QUESTIONS = [
    "Are you a person who has a clear destination in mind, or do you let life happen to you?",
    "What does it mean to you to live a life with intention and purpose?",
    "What are the most important values that guide your decisions and actions?",
    "How do you measure success in your personal life and work? Is it by external standards, or by your own internal compass?",
    "What is one thing you can begin doing today to live more deliberately and align with your true direction?"
];

export const MTP_CHURCHILL_QUOTE = {
    text: "To each there comes in their lifetime a special moment when they are figuratively tapped on the shoulder and offered the chance to do a very special thing, unique to them and fitted to their talents. What a tragedy if that moment finds them unprepared or unqualified for that which could have been their finest hour.",
    attribution: "Winston S. Churchill"
};

export const MTP_LEARN_MORE = {
    title: "Finding Your MTP — Steven Kotler’s Process",
    intro: "Steven Kotler, a leading expert on peak performance, describes the process of finding your Massively Transformative Purpose (MTP) as a multi-step journey that combines personal passion with a larger, altruistic goal. Here’s a breakdown of the process as described by Kotler:",
    points: [
        { title: "Identify Your Passion(s)", body: "The first step involves introspection to discover what you are deeply passionate about. This could be anything that intensely interests you or activities that you find profoundly satisfying." },
        { title: "Link Your Passion to a Larger Purpose", body: "Kotler emphasizes the importance of aligning your personal passion with a larger purpose that can have a significant impact on the world. This step is about thinking how your passions can serve a bigger cause or address a major challenge." },
        { title: "Assess the Trends", body: "Understanding current trends and how they might intersect with your passions and the larger purpose is crucial. Kotler suggests that aligning your MTP with emerging trends can amplify its impact." },
        { title: "Think Exponentially, Not Linearly", body: "Kotler encourages thinking in terms of exponential growth and impact, as opposed to linear progression. This involves considering how technology and innovative approaches can be leveraged to achieve your MTP." },
        { title: "Develop a Growth Mindset", body: "A growth mindset, as opposed to a fixed mindset, is critical in pursuing an MTP. It involves embracing challenges, persisting in the face of setbacks, and viewing effort as the path to mastery." },
        { title: "Leverage the Crowd", body: "Kotler points out the importance of leveraging collective knowledge and resources. This could involve crowd-sourcing ideas, using social media to build communities, or engaging in collaborative projects." },
        { title: "Iterate and Adapt", body: "The journey towards realizing an MTP is often filled with trials and errors. Kotler suggests remaining flexible, learning from failures, and continuously adapting strategies." },
        { title: "Stay Committed and Persistent", body: "Finally, Kotler emphasizes the need for unwavering commitment and persistence. Finding and pursuing an MTP is a challenging path that requires resilience and a long-term perspective." }
    ]
};

export const MTP_KEY_ASPECTS = {
    title: "Key Aspects of an MTP",
    intro: "A “Massively Transformative Purpose” (MTP) refers to a highly ambitious, overarching objective or mission that drives you and your business to create significant change or impact in the world. Key characteristics of an MTP include:",
    points: [
        { title: "Visionary and Aspirational", body: "An MTP typically involves a bold and inspiring vision that challenges the status quo and aims to bring about substantial transformation." },
        { title: "Purpose-Driven", body: "It is rooted in a deep sense of purpose, often aligning with core values and a desire to make a meaningful impact." },
        { title: "Broad in Scope", body: "An MTP usually has a broad, often global scope, addressing major challenges or opportunities that affect many people or industries." },
        { title: "Motivational and Energizing", body: "It serves as a powerful motivator, not just for the individual or team behind it, but also for attracting and rallying others who share similar aspirations." },
        { title: "Long-Term Oriented", body: "An MTP is typically long-term in nature, focusing on significant achievements that may take years or even decades to realize." },
        { title: "Innovative and Disruptive", body: "It often involves innovative thinking and approaches, sometimes disrupting existing systems, models, or paradigms." }
    ]
};

export const MTP_EXAMPLES = {
    title: "Famous MTP Examples",
    intro: "Massively Transformative Purposes (MTPs) are grand, ambitious missions that drive individuals, companies, and organizations to create significant impact. Here are some notable examples:",
    points: [
        { title: "SpaceX", body: "“Enable humans to become a multiplanetary species.” Founded by Elon Musk, SpaceX’s MTP is not just about advancing space technology but about ensuring the survival and flourishing of humanity by making life multiplanetary, starting with colonizing Mars." },
        { title: "Tesla", body: "“Accelerate the world’s transition to sustainable energy.” Another venture of Elon Musk, Tesla’s MTP is focused on combating climate change by promoting sustainable energy through electric vehicles and renewable energy products." },
        { title: "Google", body: "“Organize the world’s information and make it universally accessible and useful.” Google’s MTP reflects its ambition to develop technologies that process, sort, and make the vast amounts of information on the internet accessible to everyone." },
        { title: "Facebook (Meta)", body: "“Give people the power to build community and bring the world closer together.” This MTP, evolving as the company transitions to focus on the metaverse, aims to create digital platforms and technologies that foster community and connectivity." },
        { title: "Amazon", body: "“To be Earth’s most customer-centric company.” Amazon’s MTP is about revolutionizing retail and customer service, focused on delivering an exceptional experience for consumers globally." },
        { title: "Microsoft", body: "“Empower every person and every organization on the planet to achieve more.” Microsoft’s MTP focuses on creating technology that enables people and businesses around the world to realize their full potential." },
        { title: "Singularity University", body: "“Educate, inspire, and empower leaders to apply exponential technologies to address humanity’s grand challenges.” Singularity University’s MTP is about using rapidly advancing technologies to solve major global issues like poverty, water scarcity, and energy needs." },
        { title: "Spanx", body: "“Elevating Women.” Sara Blakely utilized this MTP to build a multi-billion-dollar enterprise from $5,000 of personal savings." },
        { title: "Uber", body: "“Go anywhere, Get anything.” Uber’s MTP is not just focused on the transportation of individuals, but also allows the company to explore a wider business model of mobility-based services." },
        { title: "XPRIZE", body: "“A bridge to abundance for all.” This MTP was designed to encompass a vast range of different initiatives — from prizes for spaceflight to cleaning up oil spills to ocean health to a medical tricorder — while keeping the guardrails of competition and awards." }
    ],
    closing: "These MTPs are not just corporate slogans; they are deeply ingrained in the missions and operations of these organizations. They serve as guiding principles that shape company strategies, innovations, and the overall direction of their efforts."
};

export const MTP_CATEGORIES = [
    {
        key: "passions",
        label: "Passions",
        helper: "What are you so drawn to that you lose track of time?",
        questions: [
            "What activities make you feel most alive?",
            "What topics could you talk about for hours without getting tired?",
            "What do people consistently come to you for help or advice on?",
            "What did you love doing as a child that you've stopped doing as an adult?",
            "If money were no object, what would you spend most of your time doing?",
            "What injustice in the world makes you angry?",
            "What kind of work would feel like play to you?",
            "What books, podcasts or YouTube channels do you keep returning to?",
            "When do you feel most in 'flow'?",
            "What would you do for free, just because it matters?"
        ]
    },
    {
        key: "values",
        label: "Values",
        helper: "What principles are non-negotiable for you?",
        questions: [
            "What three values would you never compromise, even under pressure?",
            "Whose life or character do you most admire, and why?",
            "What kind of behavior in others triggers strong frustration in you (it often points to a value you hold)?",
            "Where in your life do you feel most aligned and integrated?",
            "Where do you feel most out of integrity right now?",
            "What were the values you grew up with, and which still serve you?",
            "What would you want said at your funeral?",
            "What kind of people do you want to surround yourself with, and what do they have in common?",
            "How do you want clients/customers to describe working with you?",
            "What do you wish more people stood for?"
        ]
    },
    {
        key: "strengths",
        label: "Strengths",
        helper: "What do you do better than most, almost by default?",
        questions: [
            "What comes naturally to you that others find difficult?",
            "What feedback do you consistently get about your strengths?",
            "In what kind of work or environment do you outperform others?",
            "What do you do faster, easier, or with more enjoyment than peers?",
            "What problems do friends or colleagues bring to you specifically?",
            "What has someone paid you to do, even informally, more than once?",
            "What are you confident teaching or leading on?",
            "What kind of thinking (analytical, creative, systems, emotional) is most natural to you?",
            "When you receive a compliment most often, what is it about?",
            "What would your best former boss/teacher/coach say is your superpower?"
        ]
    },
    {
        key: "patterns",
        label: "Patterns",
        helper: "What recurring themes show up across your life?",
        questions: [
            "What problem keeps re-appearing in your life that you keep solving?",
            "What kind of people seem drawn to you?",
            "What kinds of opportunities keep showing up unbidden?",
            "What are the recurring obstacles you've overcome, and what does it say about you?",
            "Across your jobs/projects, what is the consistent thread?",
            "What are you usually the 'go-to' person for in any group?",
            "What seasons of struggle taught you the most, and what was the lesson?",
            "What 'coincidences' have shaped your path?",
            "What recurring dreams, daydreams, or imagined scenarios do you have?",
            "What would your closest friend say is your 'thing'?"
        ]
    },
    {
        key: "impact",
        label: "Impact",
        helper: "What change do you want to leave behind?",
        questions: [
            "If you could change one thing about the world, what would it be?",
            "Whose life do you most want to make better?",
            "What would your customers say their life looks like before vs. after working with you?",
            "What is the legacy you want to be known for?",
            "In 50 years, what would have to be true for you to consider your life well-lived?",
            "What kind of transformation do you most want to facilitate?",
            "What story would you want a stranger to tell about meeting you?",
            "If you wrote one book that lasted, what would it be about?",
            "What is the smallest version of impact you'd be proud of (1 person)?",
            "What is the largest version of impact you can imagine creating?"
        ]
    }
];

export const SEVEN_LEVELS_DEEP = {
    intro: "Find your real WHY by asking 'why is that important?' seven times in a row.",
    starterPrompt: "What does success look like to you in your business?"
};

export const CHIEF_AIM_PROMPTS = [
    {
        key: "what",
        label: "WHAT — What is the definite chief aim?",
        helper: "Write the specific, concrete outcome you want to achieve."
    },
    {
        key: "give",
        label: "GIVE — What will you give in return?",
        helper: "What value, service, work, or skill will you exchange for it?"
    },
    {
        key: "date",
        label: "DATE — By when?",
        helper: "Set the specific date you intend to achieve this by."
    },
    {
        key: "results",
        label: "RESULTS — Visible signs you have arrived?",
        helper: "What will be measurably different about your life or business?"
    }
];

export const CHIEF_AIM_HORIZONS = [
    { key: "q3", label: "3-Month Goal", helper: "Your nearest-horizon win — within the next quarter." },
    { key: "y1", label: "1-Year Goal", helper: "Where you intend to be 12 months from now." },
    { key: "y3", label: "3-Year Goal", helper: "The medium-term horizon that compounds your work." },
    { key: "y5", label: "5-Year Goal", helper: "The long-arc transformation you are building toward." }
];

export const CHIEF_AIM_QUOTE = {
    text: "The most effective method to reaching your Massive Transformative Purpose is to create steps (High Hard Goals) that move you closer to the desired final result.",
    attribution: "Dr Brandt Gibson"
};

export const BUSINESS_STRUCTURES = [
    { key: "sole_prop", name: "Sole Proprietorship", best: "Solo, very early, low risk, simple income" },
    { key: "llc", name: "LLC", best: "Most solo entrepreneurs and coaches — liability protection + simplicity" },
    { key: "s_corp", name: "S-Corporation", best: "Higher revenue (>$80k profit) — self-employment tax savings" },
    { key: "non_profit", name: "Non-Profit (501c3)", best: "Mission-driven cause work, donor funding" }
];

// ============ STEP 2 — EXTRACT Your Audience ============
export const MASLOW_LEVELS = [
    { key: "physiological", label: "Physiological", helper: "Food, water, sleep, basic survival" },
    { key: "safety", label: "Safety", helper: "Health, employment, security, stability" },
    { key: "belonging", label: "Love & Belonging", helper: "Friendship, intimacy, family, connection" },
    { key: "esteem", label: "Esteem", helper: "Respect, status, recognition, mastery" },
    { key: "self_actualization", label: "Self-Actualization", helper: "Purpose, meaning, creativity, becoming" }
];

export const SIX_NEEDS = [
    { key: "certainty", label: "Certainty", helper: "Comfort, predictability, security" },
    { key: "variety", label: "Variety", helper: "Adventure, change, new experiences" },
    { key: "significance", label: "Significance", helper: "Importance, status, mastery" },
    { key: "connection", label: "Love & Connection", helper: "Belonging, intimacy, shared experience" },
    { key: "growth", label: "Growth", helper: "Learning, expansion, becoming more" },
    { key: "contribution", label: "Contribution", helper: "Giving, serving, leaving a legacy" }
];

export const NICHE_OPTIONS = [
    { key: "problem_to_solve", label: "A Problem to Solve", desc: "You help people overcome a specific painful issue." },
    { key: "transformation", label: "A Transformation to Lead", desc: "You guide a 'before → after' identity shift." },
    { key: "skill", label: "A Skill to Teach", desc: "You make a craft, system, or capability accessible." },
    { key: "identity", label: "An Identity to Champion", desc: "You serve a specific tribe or worldview." }
];

export const NICHE_QUESTIONS = [
    "Who exactly are you for? Be ruthlessly specific.",
    "What life-stage / role / situation are they in?",
    "What problem do they wake up frustrated about?",
    "What outcome do they crave but can't yet articulate?",
    "What have they tried that didn't work?",
    "What language and slang do they actually use?",
    "Where do they hang out (online and offline)?",
    "Who are the gurus or leaders they already follow?",
    "What would make them feel deeply seen by you?",
    "What is the ONE sentence summary of your micro-niche?"
];

export const DEMOGRAPHICS_QUESTIONS = [
    { key: "age", q: "What is the typical age range?" },
    { key: "gender", q: "What gender(s)?" },
    { key: "income", q: "What is their household / personal income range?" },
    { key: "education", q: "What is their education level?" },
    { key: "occupation", q: "What is their occupation or industry?" },
    { key: "family", q: "What is their family structure?" },
    { key: "location", q: "Where do they live (geography)?" },
    { key: "language", q: "What language(s) do they speak?" },
    { key: "tech", q: "What technology do they use day-to-day?" },
    { key: "buying_power", q: "What is their realistic buying power for your offer?" },
    { key: "life_stage", q: "What life-stage are they in (graduate, parent, empty-nester, etc.)?" }
];

export const PSYCHOGRAPHICS_QUESTIONS = [
    { key: "values", q: "What core values guide their choices?" },
    { key: "beliefs", q: "What beliefs do they hold about themselves and their problem?" },
    { key: "identity", q: "How do they describe themselves to others (identity)?" },
    { key: "fears", q: "What are their deepest fears around this problem?" },
    { key: "desires", q: "What do they secretly desire but haven't said out loud?" },
    { key: "frustrations", q: "What frustrations recur for them every week?" },
    { key: "aspirations", q: "Who do they aspire to become in 1–3 years?" },
    { key: "objections", q: "What objections do they raise when offered help?" },
    { key: "language", q: "What words and metaphors do they use to describe their pain?" },
    { key: "role_models", q: "Who are the people they want to be like?" },
    { key: "brand_affinities", q: "What brands, books, products do they love and reference?" }
];


// ============ STEP 3 — FRAME Your Story ============

// ---- Brand Voice ----
export const BRAND_VOICE_PROMPTS = [
    { key: "bv_q1",  q: "Three adjectives that describe how you want your brand to sound.", helper: "e.g. calm, deliberate, premium" },
    { key: "bv_q2",  q: "Three adjectives describing how you do NOT want to sound.", helper: "e.g. hypey, sales-y, casual" },
    { key: "bv_q3",  q: "If your brand were a person, who would they be?", helper: "A specific public figure, archetype, or composite. Be vivid." },
    { key: "bv_q4",  q: "What pet phrases or signature words do you find yourself returning to?" },
    { key: "bv_q5",  q: "What recurring metaphors or images do you reach for when explaining your work?" },
    { key: "bv_q6",  q: "How do you talk to a close friend vs. a stranger? Which mode feels more authentically you?" },
    { key: "bv_q7",  q: "What is your relationship with humor in your work? When does it serve, when does it distract?" },
    { key: "bv_q8",  q: "What level of vulnerability and personal disclosure feels right for you to share publicly?" },
    { key: "bv_q9",  q: "What phrases, clichés, or jargon would you NEVER use? List the words you actively avoid." },
    { key: "bv_q10", q: "Name 1–3 writers, podcasters, or speakers whose voice resonates with you. What about their voice specifically?" }
];

// ---- Story Bank (user-provided 9 categories, each with sub-questions) ----
export const STORY_BANK_PROMPTS = [
    {
        key: "sb_early_life", label: "Early Life", short: "Early Life",
        intro: "Set the scene of where you came from. The texture of those years carries the seeds of everything that came later.",
        questions: [
            { key: "q1", q: "What did your life look like?" },
            { key: "q2", q: "What are some important stories from this life?" }
        ]
    },
    {
        key: "sb_difficulties", label: "Difficulties", short: "Difficulties",
        intro: "The chapters that hurt. Naming them honestly is how they become useful.",
        questions: [
            { key: "q1", q: "What difficulties have you had in life?" },
            { key: "q2", q: "What bad habits did you have?" },
            { key: "q3", q: "What were you unable to overcome?" },
            { key: "q4", q: "What does nobody know about that time?" }
        ]
    },
    {
        key: "sb_embarrassing", label: "Embarrassing Moments", short: "Embarrassing",
        intro: "The moments you'd rather not remember. The ones that, when shared honestly, build the most trust.",
        questions: [
            { key: "q1", q: "What did you do?" },
            { key: "q2", q: "What are you not proud of?" },
            { key: "q3", q: "What did you hide?" },
            { key: "q4", q: "What have you never told anyone?" }
        ]
    },
    {
        key: "sb_failures", label: "Previous Failures", short: "Failures",
        intro: "Before the breakthrough, there were attempts. Map them honestly.",
        questions: [
            { key: "q1", q: "What did you already try?" },
            { key: "q2", q: "What help were you looking for?" },
            { key: "q3", q: "What did you spend?" },
            { key: "q4", q: "What did you try that failed?" }
        ]
    },
    {
        key: "sb_early_successes", label: "Your Successes", short: "Successes",
        intro: "Even before the big shift, there were wins worth remembering.",
        questions: [
            { key: "q1", q: "What did you experience?" },
            { key: "q2", q: "What did you learn?" },
            { key: "q3", q: "What were your pivotal moments?" }
        ]
    },
    {
        key: "sb_new_approach", label: "New Approach", short: "New Approach",
        intro: "The shift. What changed in how you saw things — and how you acted.",
        questions: [
            { key: "q1", q: "How did you change your approach?" },
            { key: "q2", q: "How did your philosophy change?" },
            { key: "q3", q: "How did your actions change?" },
            { key: "q4", q: "How did you change?" }
        ]
    },
    {
        key: "sb_misconceptions", label: "Misconceptions", short: "Misconceptions",
        intro: "The lies you uncovered. The truths you can now teach.",
        questions: [
            { key: "q1", q: "What lies did you uncover?" },
            { key: "q2", q: "What were the truths you exposed?" },
            { key: "q3", q: "What is the right way vs. the wrong way?" }
        ]
    },
    {
        key: "sb_transformation", label: "Transformation", short: "Transformation",
        intro: "The visible change. The first proof that the new way worked.",
        questions: [
            { key: "q1", q: "What changes did you see initially?" },
            { key: "q2", q: "What progress are you having?" },
            { key: "q3", q: "What were the first achieved goals?" }
        ]
    },
    {
        key: "sb_bragging_rights", label: "Bragging Rights", short: "Bragging",
        intro: "The current view. What life looks like now — and what you can save others years of.",
        questions: [
            { key: "q1", q: "How can you collapse time for others?" },
            { key: "q2", q: "What success have you achieved?" },
            { key: "q3", q: "How does life look different now?" },
            { key: "q4", q: "What are your bragging rights?" }
        ]
    }
];

// ---- Hero's Journey (Dr. Gibson 12-stage map; image-anchored) ----
export const HEROS_JOURNEY_IMAGE = "https://customer-assets.emergentagent.com/job_pro-unlock-3/artifacts/u640eo37_The%20Hero%27s%20Journey.png";

export const HEROS_JOURNEY_STAGES = [
    { key: "hj_01_ordinary_world",  stage: 1,  label: "Ordinary World",        helper: "Life before the journey began. The familiar — and the quiet ache underneath it." },
    { key: "hj_02_call",            stage: 2,  label: "Call To Adventure",     helper: "The moment that broke the routine. The invitation, problem, or rupture you could not ignore." },
    { key: "hj_03_refuse",          stage: 3,  label: "Refuse The Call",       helper: "The hesitation. The reasons you nearly stayed put. Fear, doubt, comfort." },
    { key: "hj_04_meet_mentor",     stage: 4,  label: "Meet The Mentor",       helper: "The teacher, book, person or moment that gave you courage and a first map." },
    { key: "hj_05_cross_threshold", stage: 5,  label: "Cross The Threshold",   helper: "The first irreversible step. The day you committed and there was no going back." },
    { key: "hj_06_tests_allies",    stage: 6,  label: "Tests, Trials & Allies", helper: "The early proving ground. Who helped, who hurt, what tested your resolve." },
    { key: "hj_07_final_approach",  stage: 7,  label: "Final Approach",        helper: "The point where the real, deeper challenge revealed itself." },
    { key: "hj_08_battle",          stage: 8,  label: "The Battle",            helper: "The hardest moment. Where you nearly broke. The dark night of the soul." },
    { key: "hj_09_seize_reward",    stage: 9,  label: "Seize The Reward",      helper: "The breakthrough. What you discovered, claimed, or earned on the other side." },
    { key: "hj_10_road_back",       stage: 10, label: "The Road Back",         helper: "The integration. Bringing the gift back to ordinary life — and the price paid for it." },
    { key: "hj_11_transformation",  stage: 11, label: "Transformation",        helper: "The identity-level shift that re-emerged on the other side." },
    { key: "hj_12_share_elixir",    stage: 12, label: "Share The Elixir",      helper: "What you now carry — and what you give to others. The reason you teach this." }
];

// ---- Hook-Story-Offer ----
export const HSO_FIELDS = [
    { key: "hso_hook",     label: "HOOK",   helper: "The attention-grabber. 1 sentence. A question, statistic, or pattern-interrupt that names the pain or stakes." },
    { key: "hso_story",    label: "STORY",  helper: "The bridge. A short personal or client transformation story (3–5 sentences) that earns emotional trust." },
    { key: "hso_offer",    label: "OFFER",  helper: "The specific path. What you are inviting them into — outcome, method, and a clear next step." }
];

// ---- Important Stories (Distillation) ----
export const DISTILLATION_PROMPTS = [
    { key: "dist_transformation_promise", label: "Transformation Promise (1 line)", helper: "Identify the transformation you wanted and what it looked like with this new solution. One vivid sentence: from [old identity/state] to [new identity/state]." },
    { key: "dist_elevator",               label: "200-word Elevator Pitch",        helper: "A condensed, present-tense narrative: the world you serve, the rupture, the new path, the result. Written in your voice." }
];

export const FRAME_BRAND_VOICE_QUOTE = {
    text: "People do not buy goods and services. They buy relations, stories and magic.",
    attribution: "Seth Godin"
};

export const FRAME_HEROS_JOURNEY_INTRO =
    "Joseph Campbell mapped the universal pattern of transformation across thousands of myths — the Hero's Journey. " +
    "Two journeys live inside every great brand: yours (the founder), and your customer's. " +
    "Use the 12 stages below to give shape to each. You don't need to fill every stage — sketch what is true.";

export const HSO_INTRO =
    "Hook · Story · Offer is the architecture every persuasive message uses — from the great sermons to the best podcast intros to your favorite landing page. " +
    "Once your Brand Voice, Story Bank and Hero's Journey are in place, this becomes assembly, not invention.";

// ============ STEP 4 — IGNITE Your Brand ============

// ---- 12 Jungian Brand Archetypes ----
export const BRAND_ARCHETYPES = [
    { key: "hero",       name: "The Hero",      motto: "Where there's a will, there's a way.",        vibe: "Courage, mastery, decisive action",   examples: ["Nike", "BMW", "U.S. Army"] },
    { key: "sage",       name: "The Sage",      motto: "The truth will set you free.",                vibe: "Wisdom, discernment, education",      examples: ["BBC", "Google", "TED"] },
    { key: "magician",   name: "The Magician",  motto: "I can make dreams come true.",                vibe: "Transformation, vision, possibility", examples: ["Disney", "Apple", "Tesla"] },
    { key: "outlaw",     name: "The Outlaw",    motto: "Rules are made to be broken.",                vibe: "Disruption, rebellion, freedom",      examples: ["Harley-Davidson", "Virgin", "Diesel"] },
    { key: "explorer",   name: "The Explorer",  motto: "Don't fence me in.",                          vibe: "Adventure, freedom, discovery",       examples: ["Patagonia", "Jeep", "REI"] },
    { key: "ruler",      name: "The Ruler",     motto: "Power isn't everything — it's the only thing.", vibe: "Authority, control, legacy",      examples: ["Rolex", "Mercedes-Benz", "American Express"] },
    { key: "creator",    name: "The Creator",   motto: "If you can imagine it, it can be done.",      vibe: "Imagination, expression, originality", examples: ["LEGO", "Adobe", "Crayola"] },
    { key: "caregiver",  name: "The Caregiver", motto: "Love your neighbor as yourself.",             vibe: "Compassion, generosity, protection",  examples: ["Johnson & Johnson", "UNICEF", "Volvo"] },
    { key: "innocent",   name: "The Innocent",  motto: "Free to be you and me.",                      vibe: "Optimism, simplicity, purity",        examples: ["Dove", "Coca-Cola", "Whole Foods"] },
    { key: "lover",      name: "The Lover",     motto: "I only have eyes for you.",                   vibe: "Passion, intimacy, sensuality",       examples: ["Chanel", "Godiva", "Victoria's Secret"] },
    { key: "jester",     name: "The Jester",    motto: "You only live once.",                         vibe: "Joy, play, humor",                    examples: ["Old Spice", "Skittles", "Geico"] },
    { key: "everyman",   name: "The Everyman",  motto: "All men and women are created equal.",        vibe: "Belonging, honesty, relatability",    examples: ["IKEA", "Target", "Levi's"] }
];

// ---- Pocket Media Empire Channels ----
export const POCKET_MEDIA_CHANNELS = [
    { key: "newsletter", name: "Newsletter", helper: "Direct line to your audience's inbox. The highest-trust channel you own." },
    { key: "blog",       name: "Blog",       helper: "Long-form, searchable, evergreen. The compound interest of marketing." },
    { key: "podcast",    name: "Podcast",    helper: "Intimate, on-demand voice. Builds parasocial trust at scale." },
    { key: "video",      name: "Video",      helper: "Highest engagement format. Short-form for reach, long-form for depth." },
    { key: "events",     name: "Events",     helper: "Real-time gathering. Workshops, webinars, retreats, summits." }
];

export const POCKET_MEDIA_FIELDS = [
    { key: "cadence",       label: "Cadence",         helper: "How often will you publish? Pick a rhythm you can keep for 12 months." },
    { key: "format",        label: "Format",          helper: "What does each piece look like? (e.g. 600-word email, 25-min interview)" },
    { key: "name",          label: "Working Name",    helper: "The channel name — the thing you'll write at the top." },
    { key: "url",           label: "URL (optional)",  helper: "Link to your existing channel — if it already lives somewhere." },
    { key: "first_5_ideas", label: "First 5 Ideas",   helper: "Five concrete first episodes / posts / issues. Specific titles, not topics." },
    { key: "audience_pull", label: "Audience Pull",   helper: "Why will someone subscribe? What ache or aspiration does this serve?" },
    { key: "kpi",           label: "KPI",             helper: "The single number you'll watch (subs, downloads, CTR, RSVPs, etc.)." }
];

// ---- Website Hub Templates ----
export const WEBSITE_HUB_TEMPLATES = [
    {
        key: "influencer",
        name: "InfluencerHub",
        desc: "For coaches, creators, and authors building an audience-first brand.",
        pages: [
            { key: "home",            name: "Home" },
            { key: "about",           name: "About / Story" },
            { key: "work_with",       name: "Work With Me / Services" },
            { key: "podcast_or_blog", name: "Podcast / Blog" },
            { key: "free_resource",   name: "Free Resource (Opt-in)" },
            { key: "speak",           name: "Speaking" },
            { key: "contact",         name: "Contact" }
        ]
    },
    {
        key: "medical",
        name: "MedicalHub",
        desc: "For practitioners and clinic-based experts integrating online presence.",
        pages: [
            { key: "home",              name: "Home" },
            { key: "about",             name: "About Provider" },
            { key: "services",          name: "Services / Treatments" },
            { key: "patient_resources", name: "Patient Resources" },
            { key: "team",              name: "Team" },
            { key: "locations",         name: "Locations & Hours" },
            { key: "book_appt",         name: "Book Appointment" },
            { key: "contact",           name: "Contact" }
        ]
    }
];

// ---- Marketing Plan Tracks ----
export const MARKETING_TRACKS = [
    { key: "diy",   name: "DIY Track",            subtitle: "You own the creation — slow and steady.",   helper: "You write, record, design, post yourself. Cheaper, more authentic. Time-intensive. Best for early stages where voice is being forged." },
    { key: "ai10x", name: "10X-with-AI Track",    subtitle: "AI as your creative team — speed and volume.", helper: "You direct; AI executes. Tools draft, illustrate, caption, voice. Faster output. Requires editing taste and a clear voice to keep it from going generic." }
];

export const MARKETING_TRACK_FIELDS = [
    { key: "weekly_schedule",   label: "Weekly Schedule", helper: "What does a typical week look like on this track? (hours and days)" },
    { key: "tools",             label: "Tools / Stack",   helper: "Software, platforms, services you'll use on this track." },
    { key: "time_investment",   label: "Time Investment", helper: "Realistic hours per week, and where they come from." },
    { key: "expected_outcome",  label: "Expected Outcome", helper: "What you'll have shipped after 90 days on this track." }
];

// ---- 30/60/90 Content Calendar ----
export const CALENDAR_PHASES = [
    { key: "d30",     label: "Days 0–30",  subtitle: "Foundation",    desc: "Establish presence. Ship the basics. Get reps." },
    { key: "d60",     label: "Days 31–60", subtitle: "Rhythm",        desc: "Lock in consistency. Layer in interaction." },
    { key: "d90",     label: "Days 61–90", subtitle: "Amplification", desc: "Expand reach. Launch one campaign or offer." },
    { key: "beyond",  label: "Beyond 90",  subtitle: "Compounding",   desc: "Identify what's working. Double down. Cut the rest." }
];

export const CALENDAR_PILLARS = [
    { key: "content",     label: "Content",     helper: "What you make and ship." },
    { key: "engagement",  label: "Engagement",  helper: "How you respond, DM, comment, show up." },
    { key: "growth",      label: "Growth",      helper: "Outreach, collabs, paid, SEO." },
    { key: "offer",       label: "Offer",       helper: "Funnels, launches, calls-to-action." }
];

// ---- Intros / Copy ----
export const IGNITE_INTROS = {
    archetypes: "Carl Jung mapped 12 universal archetypes that humans recognize across every culture. Your brand naturally lives in one as a primary, often shaded by a secondary. Choosing yours gives you a north star for tone, visuals, and decisions.",
    pocket_media: "Russell Brunson calls it your Pocket Media Empire — the small, owned channels that compound into an audience. You do not need every channel. You need 1–3 you will actually maintain.",
    website_hub: "Your website is the gravitational center of every other channel. Pick a template that fits your work, and let AI draft the spine.",
    marketing_plan: "Two ways to ship marketing in 2026: with your own two hands, or with AI as your creative team. Most operators run a blend — but it helps to articulate each track separately first.",
    calendar: "A 30/60/90 cadence beats a 12-month plan you'll never read. Four phases, four pillars per phase. Fill what is true. The blanks tell you where to focus."
};

export const IGNITE_JUNG_QUOTE = {
    text: "Until you make the unconscious conscious, it will direct your life and you will call it fate.",
    attribution: "Carl Jung"
};


// ============ STEP 5 — NURTURE The Transformation ============

// ---- Transformative Framework — questions seeded for the AI builder ----
export const FRAMEWORK_SEED_QUESTIONS = [
    { key: "fw_who",       label: "Who you're transforming",            helper: "In one sentence, name the person and the state you find them in." },
    { key: "fw_from",      label: "Their starting state",               helper: "The before. What life, work, or self looks like when they first arrive." },
    { key: "fw_to",        label: "Their ending state",                 helper: "The after. What's true once they've completed the journey with you." },
    { key: "fw_phases_n",  label: "How many phases feel right? (3–7)", helper: "Most signature frameworks land between 3 and 7 phases. Trust your gut." }
];

// ---- Continuity Program prompts ----
export const CONTINUITY_PROMPTS = [
    { key: "cp_name",          label: "Program Name",        helper: "What you'll call it on the order page. (Or click 'Suggest names' for ideas.)" },
    { key: "cp_what_monthly",  label: "What members get (monthly)",  helper: "The recurring deliverable. Be specific: ‘1 group call + 2 office hours + new playbook’." },
    { key: "cp_price",         label: "Price Point",         helper: "Monthly price (and annual price if offered)." },
    { key: "cp_retention_hook", label: "Retention Hook",     helper: "The single reason members renew month after month — beyond habit." },
    { key: "cp_churn_rituals", label: "Churn-Prevention Rituals", helper: "Specific rituals you'll run: onboarding sequence, win-of-the-week post, anniversary call, etc." }
];

// ---- SaaS Opportunity prompts ----
export const SAAS_INPUT_PROMPTS = [
    { key: "saas_painful_step", label: "Slowest, most painful manual step in your method", helper: "The 5–60 minute task you do over and over for every client. The bottleneck." },
    { key: "saas_who_loses_sleep", label: "Who loses sleep over this problem", helper: "The exact persona who would pay to never deal with this manually again." },
    { key: "saas_current_workaround", label: "Current workaround", helper: "What people do today — spreadsheets, Notion, hiring an assistant, etc." }
];

// ---- Community Design prompts ----
export const COMMUNITY_INPUT_PROMPTS = [
    { key: "com_identity",   label: "Shared identity",       helper: "The single label members would proudly wear. ‘Recovering perfectionists.’ ‘Functional medicine providers.’" },
    { key: "com_problem",    label: "Problem that brings them together", helper: "The shared ache that nothing else solves." },
    { key: "com_success",    label: "What success looks like for a member", helper: "The win every member is quietly hoping for." }
];

// ---- Intros / Copy ----
export const NURTURE_INTROS = {
    framework:   "Your Transformative Framework is the named, ownable method underneath every offer you make. Once it's named and visualized, every piece of marketing, every video, every keynote can reference it as a single artifact.",
    continuity:  "Continuity is your gravity. A subscription program that pulls people closer over time, deepens transformation, and provides reliable monthly revenue. The single most important asset you can build for stability.",
    saas:        "Some of what you teach can be productized. Where in your method is the manual, repeatable step that a software tool could collapse from hours to minutes? That's where a SaaS opportunity lives.",
    community:   "A community is the multiplier on your work. We'll design yours anchored in the ClickFunnels Communities structure — rooms, rituals, and rhythms that make members crave the next gathering."
};

export const NURTURE_QUOTE = {
    text: "Take care of your customers, and they will take care of you.",
    attribution: "Russell Brunson"
};

