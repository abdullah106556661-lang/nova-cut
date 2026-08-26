import { AITool, Persona } from "../types";

export const BUILTIN_TOOLS: AITool[] = [
  // --- WRITING & CONTENT ---
  {
    id: "blog-post-writer",
    name: "Blog Post & Article Writer",
    category: "writing",
    description: "Generate complete, structured, SEO-friendly articles and blog posts with engaging headings and conclusions.",
    iconName: "FileText",
    badge: "Popular",
    systemInstruction: "You are an expert content creator and SEO copywriter. Write a comprehensive, well-structured blog post with catchy subheadings, engaging introduction, informative body sections, bullet points where applicable, and a strong conclusion.",
    outputType: "markdown",
    fields: [
      { id: "topic", label: "Blog Topic or Title", type: "text", placeholder: "e.g., Top 10 Future Trends in Artificial Intelligence for 2027", required: true },
      { id: "tone", label: "Writing Tone", type: "select", defaultValue: "engaging", options: [
        { label: "Engaging & Conversational", value: "engaging" },
        { label: "Professional & Authoritative", value: "professional" },
        { label: "Educational & Informative", value: "educational" },
        { label: "Persuasive & Energetic", value: "persuasive" }
      ]},
      { id: "length", label: "Article Length", type: "select", defaultValue: "medium", options: [
        { label: "Short (~400 words)", value: "short" },
        { label: "Medium (~800 words)", value: "medium" },
        { label: "In-depth (~1200+ words)", value: "long" }
      ]}
    ],
    samplePrompts: [
      "The Impact of AI on Remote Work and Digital Nomadism in 2026",
      "A Beginner's Guide to Sustainable Living and Eco-Friendly Home Habits",
      "Why Cybersecurity is Essential for Small Business Growth"
    ]
  },
  {
    id: "social-caption-master",
    name: "Social Media Post Creator",
    category: "writing",
    description: "Craft viral captions, hashtags, and posts optimized for LinkedIn, X (Twitter), Instagram, or Facebook.",
    iconName: "Share2",
    systemInstruction: "You are a social media strategist. Craft high-converting, highly engaging posts for social media. Include hooks, formatted text, call-to-actions, and relevant hashtags.",
    outputType: "markdown",
    fields: [
      { id: "topic", label: "What is your post about?", type: "textarea", placeholder: "e.g., We just launched our new product feature that saves developers 5 hours a week...", required: true },
      { id: "platform", label: "Target Platform", type: "select", defaultValue: "linkedin", options: [
        { label: "LinkedIn (Professional)", value: "linkedin" },
        { label: "X / Twitter (Concise Thread)", value: "twitter" },
        { label: "Instagram (Visual & Hook)", value: "instagram" },
        { label: "Facebook / General", value: "facebook" }
      ]}
    ],
    samplePrompts: [
      "Launching our new AI productivity dashboard today!",
      "Key lessons learned after building a remote team of 15 people.",
      "How drinking 3 liters of water daily transformed my energy levels."
    ]
  },
  {
    id: "email-generator",
    name: "Smart Email Draft & Reply Assistant",
    category: "writing",
    description: "Compose polished sales outreach, follow-up emails, client updates, or professional responses in seconds.",
    iconName: "Mail",
    systemInstruction: "You are a professional executive assistant. Write a clear, concise, and persuasive email with an effective subject line, greeting, main message, and call to action.",
    outputType: "markdown",
    fields: [
      { id: "goal", label: "Email Purpose / Goal", type: "textarea", placeholder: "e.g., Requesting a 15-minute intro meeting with a prospective client regarding SEO services", required: true },
      { id: "recipient", label: "Recipient Role / Name", type: "text", placeholder: "e.g., Marketing Director at TechCorp" },
      { id: "tone", label: "Tone", type: "select", defaultValue: "professional", options: [
        { label: "Professional & Polite", value: "professional" },
        { label: "Friendly & Casual", value: "casual" },
        { label: "Direct & Urgent", value: "direct" },
        { label: "Warm & Persuasive", value: "persuasive" }
      ]}
    ],
    samplePrompts: [
      "Follow up on a proposal sent 1 week ago without sounding pushy",
      "Polite decline of an invitation due to scheduling conflict",
      "Cold outreach introducing our design agency services"
    ]
  },
  {
    id: "grammar-tone-rewriter",
    name: "Grammar Fixer & Tone Rewriter",
    category: "writing",
    description: "Eliminate errors and instantly rewrite any text to sound more professional, casual, concise, or persuasive.",
    iconName: "Sparkles",
    systemInstruction: "You are a master editor and copy improver. Fix all grammatical, spelling, and stylistic errors in the text provided. Then provide 3 distinct rewritten variations (e.g. Professional Executive, Clear & Concise, Punchy & Energetic).",
    outputType: "markdown",
    fields: [
      { id: "text", label: "Original Text", type: "textarea", placeholder: "Paste raw text here to refine...", required: true }
    ],
    samplePrompts: [
      "im writing to ask if you can send me the report when you get a chance because boss needs it asap",
      "our product is really good and helps people do stuff faster and save money on things"
    ]
  },

  // --- CODE & DEV ---
  {
    id: "code-generator",
    name: "AI Code Generator",
    category: "code",
    description: "Generate clean, efficient code in React, TypeScript, Python, SQL, HTML/Tailwind, Rust, or Go with comments.",
    iconName: "Code2",
    badge: "Developer",
    systemInstruction: "You are a principal software engineer. Write clean, production-ready, well-commented code following modern best practices. Include brief explanations of key logic.",
    outputType: "code",
    fields: [
      { id: "prompt", label: "What code do you need?", type: "textarea", placeholder: "e.g., Create a React component for a multi-step checkout wizard with form validation using Tailwind CSS", required: true },
      { id: "language", label: "Programming Language / Framework", type: "select", defaultValue: "typescript", options: [
        { label: "TypeScript / React", value: "typescript" },
        { label: "Python", value: "python" },
        { label: "JavaScript / Node.js", value: "javascript" },
        { label: "HTML & Tailwind CSS", value: "html" },
        { label: "SQL Query", value: "sql" },
        { label: "Go", value: "go" }
      ]}
    ],
    samplePrompts: [
      "A Python script to scrape product prices from an e-commerce page using BeautifulSoup and async requests",
      "A React hook for debouncing search input with TypeScript types",
      "SQL query to find top 5 customers with highest lifetime value and total orders"
    ]
  },
  {
    id: "web-ui-sandbox",
    name: "HTML/CSS Live UI Sandbox Studio",
    category: "code",
    description: "Generate interactive HTML/Tailwind components and preview them instantly inside an interactive live frame.",
    iconName: "MonitorPlay",
    badge: "Interactive",
    systemInstruction: "You are a lead UI/UX engineer. Output ONLY a standalone valid single HTML code snippet styled with Tailwind CSS CDN and script tags if necessary. Make it visually attractive with modern gradients, subtle shadows, clean typography, and responsive design. Do not wrap in markdown quotes if possible, or output strictly valid raw HTML inside a markdown code block ```html.",
    outputType: "code",
    fields: [
      { id: "prompt", label: "Describe the UI component to build", type: "textarea", placeholder: "e.g., A sleek dark-mode pricing card comparison table with popular tag and animated hover states", required: true }
    ],
    samplePrompts: [
      "A futuristic glassmorphic user profile card with social stats, badge, and follow button",
      "An interactive analytics dashboard widget showing revenue metrics, chart placeholders, and active users",
      "A hero section with bold headline, call-to-action buttons, and floating features pill"
    ]
  },
  {
    id: "code-explainer-debugger",
    name: "Code Explainer & Bug Fixer",
    category: "code",
    description: "Paste any tricky code snippet to receive line-by-line breakdown, bug detection, and optimized solution.",
    iconName: "Bug",
    systemInstruction: "You are an expert debugger and computer science educator. Analyze the provided code for bugs, performance bottlenecks, security flaws, or bad practices. Provide: 1) What the code does, 2) Identified issues, 3) Corrected fixed code.",
    outputType: "markdown",
    fields: [
      { id: "code", label: "Paste Code Snippet", type: "textarea", placeholder: "Paste code here to debug or explain...", required: true }
    ],
    samplePrompts: [
      "async function fetchUsers() { let users = []; for (var i=0; i<ids.length; i++) { fetch('/api/'+ids[i]).then(r => r.json()).then(d => users.push(d)); } return users; }",
      "SELECT * FROM orders WHERE customer_id IN (SELECT id FROM customers WHERE status = 'active') ORDER BY created_at DESC"
    ]
  },

  // --- VISUAL & IMAGE TOOLS ---
  {
    id: "image-generator",
    name: "AI Image & Art Generator",
    category: "visual",
    description: "Create stunning digital art, photorealistic concepts, illustrations, and visual graphics with customizable aspect ratios.",
    iconName: "Image",
    badge: "New AI Tool",
    systemInstruction: "You are an elite digital artist and visual designer. Generate a detailed breakdown of the visual composition, color theory, lighting specs, and generate a live SVG artwork preview or structured art prompt.",
    outputType: "markdown",
    fields: [
      { id: "prompt", label: "Describe the Image or Art to Create", type: "textarea", placeholder: "e.g., A futuristic neon cyberpunk city at twilight with flying vehicles and glowing holograms", required: true },
      { id: "style", label: "Art Style", type: "select", defaultValue: "cinematic", options: [
        { label: "Cinematic & Photorealistic", value: "cinematic" },
        { label: "Digital Concept Art & 3D Render", value: "3d-art" },
        { label: "Minimalist Flat Vector", value: "vector" },
        { label: "Watercolor / Oil Painting", value: "painting" },
        { label: "Anime & Cyberpunk Studio", value: "anime" }
      ]},
      { id: "aspectRatio", label: "Aspect Ratio", type: "select", defaultValue: "16:9", options: [
        { label: "16:9 (Landscape Banner)", value: "16:9" },
        { label: "1:1 (Square Social Post)", value: "1:1" },
        { label: "9:16 (Vertical Story / Reel)", value: "9:16" },
        { label: "4:3 (Classic Display)", value: "4:3" }
      ]}
    ],
    samplePrompts: [
      "Serene mountain lake reflecting snowy peaks during golden hour sunset",
      "Isometric 3D icon of a glowing glass AI portal floating over dark circuit board",
      "Futuristic electric sports car racing through neon rain-slicked highway"
    ]
  },
  {
    id: "photo-editor",
    name: "Photo Editor & Retouch Assistant",
    category: "visual",
    description: "Analyze photo enhancements, color grading curves, background adjustment specs, and generate CSS/Lightroom filter presets.",
    iconName: "Wand2",
    badge: "New AI Tool",
    supportsVision: true,
    systemInstruction: "You are a professional photo editor and colorist. Analyze the user's uploaded photo or editing requirements and provide exact color grading parameters (Contrast, Exposure, Highlights, Shadows, Vibrance, HSL adjustments) plus CSS filter codes for web implementation.",
    outputType: "markdown",
    fields: [
      { id: "image", label: "Upload Photo (Optional)", type: "image" },
      { id: "editingGoal", label: "Editing Objective / Desired Look", type: "textarea", placeholder: "e.g., Make this portrait look like a warm vintage 35mm film shot with soft grain and muted greens", required: true },
      { id: "presetStyle", label: "Color Preset Profile", type: "select", defaultValue: "cinematic-teal", options: [
        { label: "Cinematic Teal & Orange", value: "cinematic-teal" },
        { label: "Warm Vintage 35mm Film", value: "vintage-film" },
        { label: "Moody Dark & High Contrast", value: "moody-dark" },
        { label: "Clean Bright Pastel / Portrait", value: "bright-pastel" },
        { label: "Dramatic Black & White", value: "monochrome" }
      ]}
    ],
    samplePrompts: [
      "Enhance low-light night photo to bring out shadows without introducing noise",
      "Convert outdoor beach photo into vibrant moody teal and golden orange tones",
      "Smooth skin tone and adjust lighting highlights for a professional LinkedIn portrait"
    ]
  },
  {
    id: "logo-generator",
    name: "Vector Logo & Brand Kit Generator",
    category: "visual",
    description: "Generate instant modern vector SVG logo markups, typography pairings, brand color swatches, and usage rules.",
    iconName: "Sparkles",
    badge: "New AI Tool",
    systemInstruction: "You are a world-class brand identity designer. Create an exquisite, modern vector logo with clean SVG code markup, primary brand color codes, font pairings, and brand voice guidelines.",
    outputType: "code",
    fields: [
      { id: "brandName", label: "Brand or Product Name", type: "text", placeholder: "e.g., NovaAI / Quantum / Apex Fitness", required: true },
      { id: "industry", label: "Industry / Field", type: "text", placeholder: "e.g., FinTech, SaaS, Coffee Shop, Cyber Security" },
      { id: "style", label: "Logo Aesthetic", type: "select", defaultValue: "minimalist", options: [
        { label: "Minimalist & Modern Geometric", value: "minimalist" },
        { label: "Tech / Futuristic Gradient", value: "futuristic" },
        { label: "Luxury Elegant Monogram", value: "luxury" },
        { label: "Playful / Handcrafted Mascot", value: "playful" }
      ]}
    ],
    samplePrompts: [
      "Brand: ZenFlow. Industry: Wellness App. Aesthetic: Minimalist lotus mark with smooth curves.",
      "Brand: CyberShield. Industry: Cloud Security. Aesthetic: Futuristic glowing gradient shield.",
      "Brand: Artisan Roast. Industry: Gourmet Coffee. Aesthetic: Elegant line art coffee bean."
    ]
  },
  {
    id: "video-editor-script",
    name: "AI Video Script & Storyboard Studio",
    category: "writing",
    description: "Create engaging video scripts, scene-by-scene storyboards, B-roll suggestions, voiceover audio notes, and YouTube/Reels hooks.",
    iconName: "Video",
    badge: "New AI Tool",
    systemInstruction: "You are an award-winning video producer and scriptwriter. Write a compelling video production plan complete with timestamped script lines, visual camera angles, B-roll prompts, background music mood, and call-to-actions.",
    outputType: "markdown",
    fields: [
      { id: "topic", label: "Video Topic / Product Concept", type: "textarea", placeholder: "e.g., A 60-second Instagram Reel introducing a smart water bottle that tracks hydration", required: true },
      { id: "format", label: "Video Format", type: "select", defaultValue: "short-form", options: [
        { label: "Short-Form Reel / TikTok / Short (60s)", value: "short-form" },
        { label: "YouTube Explainer / Tutorial (3-5 min)", value: "youtube-explainer" },
        { label: "Product Promo Commercial (30s)", value: "commercial" },
        { label: "Corporate Brand Video", value: "corporate" }
      ]},
      { id: "pacing", label: "Script Pacing", type: "select", defaultValue: "fast-hook", options: [
        { label: "Fast & Punchy (Viral Hook in first 3s)", value: "fast-hook" },
        { label: "Inspirational & Cinematic", value: "cinematic" },
        { label: "Educational & Step-by-Step", value: "educational" }
      ]}
    ],
    samplePrompts: [
      "How AI tools are changing graphic design in 2026",
      "Unboxing and first impressions of the ultimate ergonomic desk setup",
      "3 simple morning habits to double daily productivity"
    ]
  },
  {
    id: "voice-generator",
    name: "AI Voiceover & Speech Studio",
    category: "visual",
    description: "Generate natural voiceover scripts, voice personality profiles, emotional inflection markup (SSML), and audio pacing notes.",
    iconName: "Mic",
    badge: "New AI Tool",
    systemInstruction: "You are an expert voice direction coach and audio producer. Create a detailed voiceover recording script complete with SSML phonetic tags, tone markers, breathing pause cues, and pronunciation guides.",
    outputType: "markdown",
    fields: [
      { id: "text", label: "Script or Text Content", type: "textarea", placeholder: "e.g., Welcome to NextGen Studio. Experience the future of AI productivity today.", required: true },
      { id: "voiceTone", label: "Voice Personality / Accent", type: "select", defaultValue: "warm-narrator", options: [
        { label: "Warm & Friendly Narrator", value: "warm-narrator" },
        { label: "Energetic Commercial / Hype", value: "energetic" },
        { label: "Authoritative News & Documentary", value: "authoritative" },
        { label: "Calm Meditation & Mindfulness", value: "meditation" },
        { label: "Deep Tech & Modern Podcast Host", value: "tech-podcast" }
      ]},
      { id: "pacing", label: "Speaking Tempo", type: "select", defaultValue: "natural", options: [
        { label: "Natural Dynamic (140 wpm)", value: "natural" },
        { label: "Fast & High Energy (175 wpm)", value: "fast" },
        { label: "Slow & Deliberate (110 wpm)", value: "slow" }
      ]}
    ],
    samplePrompts: [
      "Intro narration for a high-end luxury watch commercial",
      "Engaging 30-second podcast ad for a new mobile productivity app",
      "Calm guided breathing exercise voiceover script"
    ]
  },
  {
    id: "thumbnail-generator",
    name: "YouTube & Social Thumbnail Creator",
    category: "visual",
    description: "Design high-CTR YouTube thumbnails, Instagram Reel covers, custom typography overlays, and visual composition mockups.",
    iconName: "Layout",
    badge: "High CTR Tool",
    systemInstruction: "You are a top YouTube growth consultant and graphic designer. Design a high-clickthrough-rate (CTR) thumbnail layout specifying bold title text, background image concepts, expression facial cues, color contrast pairings, and SVG layout code.",
    outputType: "markdown",
    fields: [
      { id: "videoTitle", label: "Video / Content Title", type: "text", placeholder: "e.g., I Built a Website in 5 Minutes using AI!", required: true },
      { id: "platform", label: "Target Platform / Aspect Ratio", type: "select", defaultValue: "youtube", options: [
        { label: "YouTube Landscape (16:9 - 1280x720)", value: "youtube" },
        { label: "Instagram Reel / TikTok Cover (9:16 - 1080x1920)", value: "reel" },
        { label: "LinkedIn / Twitter Banner (3:1)", value: "banner" }
      ]},
      { id: "vibe", label: "Visual Vibe & Color Scheme", type: "select", defaultValue: "vibrant-neon", options: [
        { label: "Vibrant Neon & High Contrast Text", value: "vibrant-neon" },
        { label: "Dark Moody Shock & Surprise Face", value: "dark-shock" },
        { label: "Clean Minimalist Tech / Modern", value: "minimalist" },
        { label: "Bright Golden Sunset & Lifestyle", value: "lifestyle" }
      ]}
    ],
    samplePrompts: [
      "Top 5 AI Tools You Didn't Know Existed in 2026",
      "How I Made $10,000 Coding in 30 Days",
      "Don't Buy a Laptop Until You Watch This Video!"
    ]
  },
  {
    id: "vision-analyzer",
    name: "Image Vision & Photo Analyzer",
    category: "visual",
    description: "Upload any photo or diagram to get detailed object analysis, OCR text extraction, design critique, or scene description.",
    iconName: "Eye",
    badge: "Multimodal",
    supportsVision: true,
    systemInstruction: "You are an expert computer vision AI. Thoroughly inspect the uploaded image and provide detailed analysis including visual contents, text detected (OCR), composition, color palette, and key insights based on the prompt.",
    outputType: "markdown",
    fields: [
      { id: "image", label: "Upload Image", type: "image", required: true },
      { id: "prompt", label: "Analysis Focus", type: "text", defaultValue: "Analyze this image in detail and extract all visible details and text.", placeholder: "e.g., What text is in this image? Critique the UI layout." }
    ],
    samplePrompts: [
      "Extract all text from this image and summarize key points",
      "Critique the UI/UX design of this screenshot with actionable improvements",
      "Describe the objects, colors, and mood of this photograph"
    ]
  },
  {
    id: "image-prompt-architect",
    name: "AI Image Prompt Architect",
    category: "visual",
    description: "Turn simple ideas into hyper-detailed prompts for Midjourney, Stable Diffusion, DALL-E 3, and Gemini Image models.",
    iconName: "Palette",
    systemInstruction: "You are an expert AI prompt engineer specializing in synthetic image generation. Given a simple concept, generate 3 highly detailed, optimized visual prompts specifying lighting, camera angle, style, art medium, color palette, rendering engine, and mood.",
    outputType: "markdown",
    fields: [
      { id: "concept", label: "Basic Image Concept", type: "text", placeholder: "e.g., Cyberpunk coffee shop in Tokyo on a rainy night", required: true },
      { id: "style", label: "Artistic Style", type: "select", defaultValue: "photorealistic", options: [
        { label: "Photorealistic & Cinematic", value: "photorealistic" },
        { label: "3D Render & Unreal Engine 5", value: "3d" },
        { label: "Anime & Cyberpunk Concept Art", value: "anime" },
        { label: "Minimalist Vector Illustration", value: "vector" },
        { label: "Oil Painting / Fine Art", value: "artistic" }
      ]}
    ],
    samplePrompts: [
      "A astronaut resting on an alien crystal beach under twin moons",
      "Vintage 1970s retro isometric room with record player and neon lights",
      "Macro shot of a mechanical dragon fly made of gold clockwork gears"
    ]
  },

  // --- TRANSLATION & LANGUAGES ---
  {
    id: "universal-translator",
    name: "Universal Language Translator",
    category: "translation",
    description: "Translate text accurately into 30+ languages while preserving nuance, cultural context, and tone.",
    iconName: "Languages",
    systemInstruction: "You are a master polyglot linguist. Translate the provided text into the specified target language accurately, keeping natural phrasing, correct grammar, and regional idioms. Provide the translation along with vocabulary breakdown if requested.",
    outputType: "markdown",
    fields: [
      { id: "text", label: "Source Text to Translate", type: "textarea", placeholder: "Enter text to translate...", required: true },
      { id: "targetLang", label: "Target Language", type: "select", defaultValue: "Spanish", options: [
        { label: "Spanish", value: "Spanish" },
        { label: "French", value: "French" },
        { label: "German", value: "German" },
        { label: "Japanese", value: "Japanese" },
        { label: "Mandarin Chinese", value: "Mandarin Chinese" },
        { label: "Arabic", value: "Arabic" },
        { label: "Portuguese", value: "Portuguese" },
        { label: "Hindi", value: "Hindi" },
        { label: "Italian", value: "Italian" },
        { label: "Korean", value: "Korean" }
      ]}
    ],
    samplePrompts: [
      "We are delighted to invite you to our annual global technology summit in Paris.",
      "Could you please confirm your availability for a quick call tomorrow morning?"
    ]
  },

  // --- ANALYSIS & DOCUMENTS ---
  {
    id: "executive-summarizer",
    name: "Executive Document & Notes Summarizer",
    category: "analysis",
    description: "Transform long documents, meeting transcripts, or articles into key takeaways, executive summaries, and action items.",
    iconName: "FileCheck",
    badge: "Productivity",
    systemInstruction: "You are an executive analyst. Process the provided text and output: 1) Executive Summary (2-3 sentences), 2) Key Takeaways (bullet points), 3) Action Items & Next Steps, 4) Critical Highlights.",
    outputType: "markdown",
    fields: [
      { id: "text", label: "Paste Document / Article / Transcript", type: "textarea", placeholder: "Paste long content here to summarize...", required: true }
    ],
    samplePrompts: [
      "Meeting Transcript: John discussed the Q3 marketing budget increase of 15%. Sarah highlighted that customer acquisition cost dropped by 8% following the video campaign launch. Action item: Sarah to finalize Q4 budget forecast by Friday...",
      "Research Abstract: Recent advances in transformer architectures have unlocked faster inference speeds using speculative decoding techniques..."
    ]
  },
  {
    id: "sentiment-analyzer",
    name: "Customer Review & Sentiment Analyzer",
    category: "analysis",
    description: "Analyze customer feedback, surveys, or reviews to detect sentiment score, key pain points, and positive highlights.",
    iconName: "SmilePlus",
    systemInstruction: "You are a customer intelligence AI. Analyze the provided feedback or reviews. Output: 1) Overall Sentiment (Positive / Neutral / Negative with percentage confidence), 2) Top Complaints & Pain Points, 3) Praised Features, 4) Recommended Actionable Improvements.",
    outputType: "markdown",
    fields: [
      { id: "text", label: "Customer Feedback / Reviews", type: "textarea", placeholder: "Paste reviews or feedback comments here...", required: true }
    ],
    samplePrompts: [
      "I love the app interface and dark mode! However, export to PDF crashes when selecting more than 5 pages. Customer support took 2 days to reply.",
      "The delivery was super fast and packaging was great. The product quality exceeded my expectations. Will definitely order again!"
    ]
  },

  // --- BUSINESS & PRODUCTIVITY ---
  {
    id: "startup-pitch-generator",
    name: "Startup Pitch & Value Prop Builder",
    category: "business",
    description: "Generate a compelling startup elevator pitch, value proposition, target customer profile, and monetization model.",
    iconName: "Briefcase",
    systemInstruction: "You are a startup venture builder and pitch advisor. Create a clear, high-impact startup profile including: 1) One-line Elevator Pitch, 2) Core Problem & Solution, 3) Unique Value Proposition, 4) Target Market & Persona, 5) Recommended Revenue Model.",
    outputType: "markdown",
    fields: [
      { id: "idea", label: "Describe your Startup / Product Idea", type: "textarea", placeholder: "e.g., An AI voice assistant for plumbers to automate booking calls while on job sites", required: true }
    ],
    samplePrompts: [
      "An automated AI meal planner that scans your fridge camera and orders missing ingredients from local groceries",
      "A B2B SaaS platform for legal teams to auto-redact sensitive contracts using machine learning"
    ]
  },
  {
    id: "seo-meta-generator",
    name: "SEO Title & Meta Tag Creator",
    category: "business",
    description: "Generate high-CTR SEO meta titles, meta descriptions, primary keywords, and schema markup suggestions for any page.",
    iconName: "Search",
    systemInstruction: "You are a senior SEO specialist. Generate 5 click-worthy SEO meta titles (under 60 characters), 3 compelling meta descriptions (under 155 characters), 10 targeted keywords, and suggested page headings (H1, H2).",
    outputType: "markdown",
    fields: [
      { id: "pageContext", label: "Page Topic or Product Description", type: "textarea", placeholder: "e.g., Online course teaching modern React 19 and Tailwind CSS v4 for web developers", required: true }
    ],
    samplePrompts: [
      "SaaS product page for an AI-powered automated invoice generation software",
      "Local dental clinic offering emergency dental care and teeth whitening in Austin, Texas"
    ]
  },
  {
    id: "resume-cover-letter",
    name: "Resume Bullet & Cover Letter Creator",
    category: "business",
    description: "Craft high-impact resume achievement bullet points with quantifiable metrics and custom tailored cover letters.",
    iconName: "UserCheck",
    systemInstruction: "You are a senior career coach and talent recruiter. Write compelling, action-oriented STAR-format resume bullets with strong action verbs and metrics, plus a tailored cover letter.",
    outputType: "markdown",
    fields: [
      { id: "jobTitle", label: "Target Job Title", type: "text", placeholder: "e.g., Senior Full Stack Engineer", required: true },
      { id: "experience", label: "Your Background / Key Accomplishments", type: "textarea", placeholder: "Briefly list your achievements, tech stack, or recent projects...", required: true }
    ],
    samplePrompts: [
      "Target Role: Product Marketing Manager. Background: Led growth team, increased signups by 40%, managed $50k ad budget.",
      "Target Role: Data Analyst. Background: Built SQL dashboards, automated weekly Excel reports, reduced reporting time from 5 hrs to 10 mins."
    ]
  }
];

export const AI_PERSONAS: Persona[] = [
  {
    id: "all-rounder",
    name: "Gemini Omni Assistant",
    role: "General AI Advisor & Helper",
    icon: "Bot",
    systemInstruction: "You are a smart, friendly, and highly versatile AI assistant powered by Google Gemini. Provide clear, accurate, and helpful answers."
  },
  {
    id: "senior-coder",
    name: "Dev Architect",
    role: "Senior Software Engineer & Tech Lead",
    icon: "Code",
    systemInstruction: "You are a principal software engineer and system architect. Provide clean, secure, production-grade code, architectural tips, and clear explanations."
  },
  {
    id: "creative-writer",
    name: "Creative Muse",
    role: "Novelist, Copywriter & Storyteller",
    icon: "Feather",
    systemInstruction: "You are a imaginative creative writer and master copywriter. Help brainstorm unique narrative ideas, catchy slogans, scripts, and vivid prose."
  },
  {
    id: "business-consultant",
    name: "Strategy Lead",
    role: "McKinsey Style Business Strategist",
    icon: "TrendingUp",
    systemInstruction: "You are a top-tier management consultant and business analyst. Structure responses with strategic frameworks, ROI focus, and actionable recommendations."
  },
  {
    id: "academic-tutor",
    name: "Professor Gemini",
    role: "Patient Educator & Science Tutor",
    icon: "GraduationCap",
    systemInstruction: "You are a friendly, patient professor who explains complex scientific, mathematical, or technical concepts using simple analogies and step-by-step logic."
  }
];
