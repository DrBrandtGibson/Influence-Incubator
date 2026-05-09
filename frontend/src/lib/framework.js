// All verbatim PDF questions / prompts / structures used across Steps 1–7.
// Strings here are the source of truth for the framework content.

// ============ STEP 1 — DEFINE Your Purpose ============
export const DRIVEN_QUESTIONS = [
    "Are you a person who has a clear destination in mind, or do you let life happen to you?",
    "What does it mean to you to live a life with intention and purpose?",
    "What are the most important values that guide your decisions and actions?",
    "How do you measure success in your personal life and work? Is it by external standards, or by your own internal compass?",
    "What is one thing you can begin doing today to live more deliberately and align with your true direction?"
];

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
    { key: "y1", label: "1-Year Aim" },
    { key: "y3", label: "3-Year Aim" },
    { key: "y5", label: "5-Year Aim" }
];

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
