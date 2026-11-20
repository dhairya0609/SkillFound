const DEMO_RECRUITER_EMAIL = "demo.recruiter@example.com";
const DEMO_CANDIDATE_EMAIL = "demo.candidate@example.com";
const SEED_RECRUITER_EMAIL = "talent.team@example.com";

export const recruiters = [
  {
    key: "demoRecruiter",
    fullName: "Riya Kapoor",
    email: DEMO_RECRUITER_EMAIL,
    phoneNumber: "9000000001",
    isDemo: true,
    profile: { headline: "Talent partner · Kestrelbyte, Monsoon Grid, Inkloom Studio" },
  },
  {
    key: "seedRecruiter",
    fullName: "Dev Malhotra",
    email: SEED_RECRUITER_EMAIL,
    phoneNumber: "9000000002",
    isDemo: false,
    profile: { headline: "Hiring lead" },
  },
];

export const companies = [
  {
    name: "Kestrelbyte",
    tagline: "Payments infrastructure for Indian small businesses",
    industry: "Fintech",
    size: "51–200",
    founded: 2019,
    locations: ["Bengaluru", "Remote (India)"],
    benefits: ["Health insurance for you, your partner and parents", "₹40,000 yearly learning budget", "Hybrid: 3 office days a week", "ESOPs for full-time roles", "26 days of paid leave"],
    verified: true,
    owner: "demoRecruiter",
    initials: "KB",
    colors: ["#4f46e5", "#7c3aed"],
    location: "Bengaluru",
    website: "https://kestrelbyte.example.com",
    description:
      "Payments infrastructure for Indian SMEs: UPI collections, payouts and reconciliation behind one API. 120 people, Series B.",
  },
  {
    name: "Monsoon Grid",
    tagline: "Generation forecasts for solar and wind operators",
    industry: "Climate tech",
    size: "11–50",
    founded: 2021,
    locations: ["Pune", "Remote (India)"],
    benefits: ["Health insurance including parents", "Flexible hours with core hours 11–4", "Annual team offsite", "Home-office setup allowance", "ESOPs for full-time roles"],
    verified: true,
    owner: "demoRecruiter",
    initials: "MG",
    colors: ["#0891b2", "#0d9488"],
    location: "Pune",
    website: "https://monsoongrid.example.com",
    description:
      "Forecasting software that helps solar and wind operators predict generation and sell power at the right time.",
  },
  {
    name: "Inkloom Studio",
    tagline: "Product design and engineering studio for early-stage founders",
    industry: "Design & software services",
    size: "11–50",
    founded: 2018,
    locations: ["Mumbai", "Remote (India)"],
    benefits: ["Health insurance", "4-day week every other Friday", "₹25,000 yearly conference budget", "Latest MacBook and design tools", "Profit-sharing twice a year"],
    verified: true,
    owner: "demoRecruiter",
    initials: "IS",
    colors: ["#db2777", "#e11d48"],
    location: "Mumbai",
    website: "https://inkloom.example.com",
    description:
      "An independent product studio that designs and builds web apps for early-stage founders. 35 designers and engineers.",
  },
  {
    name: "Tidewell Health",
    tagline: "Remote patient monitoring for clinics in tier-2 cities",
    industry: "Health tech",
    size: "51–200",
    founded: 2020,
    locations: ["Hyderabad", "Remote (India)"],
    benefits: ["Health insurance including parents", "Wellness reimbursement", "Hybrid work", "Paid parental leave (26 weeks)", "Annual health check-ups"],
    verified: true,
    owner: "seedRecruiter",
    initials: "TH",
    colors: ["#059669", "#16a34a"],
    location: "Hyderabad",
    website: "https://tidewell.example.com",
    description:
      "Remote patient monitoring for clinics in tier-2 cities, with an Android app used by 40,000 patients.",
  },
  {
    name: "Northpine Freight",
    tagline: "Route planning and fleet visibility for logistics teams",
    industry: "Logistics software",
    size: "201–500",
    founded: 2016,
    locations: ["Gurugram", "Delhi NCR"],
    benefits: ["Health and accident insurance", "Performance bonus", "Cab facility for late shifts", "Hybrid: 3 office days a week", "Relocation support"],
    verified: true,
    owner: "seedRecruiter",
    initials: "NF",
    colors: ["#ea580c", "#d97706"],
    location: "Gurugram",
    website: "https://northpine.example.com",
    description:
      "Route planning and fleet visibility software for mid-size logistics companies across North India.",
  },
  {
    name: "Quillstack Learning",
    tagline: "Live, cohort-based coding courses for college students",
    industry: "Education",
    size: "51–200",
    founded: 2020,
    locations: ["Bengaluru", "Remote (India)"],
    benefits: ["Remote-first with a Bengaluru hub", "Health insurance", "₹30,000 yearly learning budget", "Free access to every course", "Quarterly team meetups"],
    verified: true,
    owner: "seedRecruiter",
    initials: "QL",
    colors: ["#2563eb", "#0284c7"],
    location: "Bengaluru",
    website: "https://quillstack.example.com",
    description:
      "Cohort-based coding courses for college students, taught live by working engineers. Remote-first team.",
  },
];

const describe = (about, duties) => ({ description: about, responsibilities: duties });

export const QUALIFICATIONS = {
  "Frontend Engineer (React)": [
    "2+ years building production React apps with TypeScript",
    "Comfortable writing unit and integration tests",
    "You care about accessibility and performance on slow devices",
    "Experience with state management at scale (Redux or similar)"
  ],
  "Backend Engineer, Payments": [
    "3+ years building backend services in Go or a similar language",
    "Solid SQL and data-modelling skills in PostgreSQL",
    "Experience with event streaming (Kafka or similar)",
    "You've owned services in production, including on-call"
  ],
  "SDE Intern, Web Platform": [
    "Final-year student or recent graduate in any discipline",
    "You've built at least one web project with JavaScript",
    "Basic Git and comfort asking questions",
    "Available full-time for 6 months"
  ],
  "Site Reliability Engineer": [
    "4+ years running production infrastructure",
    "Hands-on Kubernetes and Terraform on AWS",
    "Experience designing alerts and SLOs",
    "Calm, written-first incident communication"
  ],
  "Data Analyst": [
    "1+ year of analysis work using SQL",
    "Working Python (pandas) for data cleaning",
    "Experience building dashboards in Power BI or similar",
    "Clear written explanations for non-technical readers"
  ],
  "Machine Learning Engineer, Forecasting": [
    "3+ years shipping ML models to production",
    "Strong Python and PyTorch",
    "Time-series forecasting experience",
    "Familiar with model monitoring and retraining pipelines"
  ],
  "Data Engineer": [
    "2+ years building data pipelines",
    "Python plus Airflow, Spark or dbt",
    "Experience with AWS data services",
    "You write data-quality checks by default"
  ],
  "Data Science Intern": [
    "Student in statistics, maths, CS or a related field",
    "Comfortable with Python and pandas",
    "Solid grasp of basic statistics",
    "Available on-site in Pune for 3 months"
  ],
  "Product Designer": [
    "2+ years designing web or mobile products",
    "Strong Figma and prototyping skills",
    "Experience running usability tests",
    "A portfolio showing your process, not only final screens"
  ],
  "UI/UX Design Intern": [
    "Design student or self-taught designer",
    "A portfolio with at least two projects",
    "Working knowledge of Figma",
    "Available for 3–6 months"
  ],
  "Full Stack Developer (MERN)": [
    "1+ year building apps with MongoDB, Express, React and Node",
    "Comfortable owning a feature end to end",
    "Experience deploying to a cloud provider",
    "Clear communication with non-technical clients"
  ],
  "Motion Designer (Contract)": [
    "2+ years of motion design for products or brands",
    "After Effects and Lottie export experience",
    "A reel showing product animations",
    "Available for a 6-month contract"
  ],
  "Android Engineer": [
    "3+ years building Android apps in Kotlin",
    "Experience with Jetpack Compose",
    "Bluetooth LE or offline-first experience is a strong plus",
    "You test on low-end devices, not only flagships"
  ],
  "QA Automation Engineer": [
    "1+ year of test automation experience",
    "Playwright, Cypress or Selenium with JavaScript",
    "API testing experience",
    "Experience running tests in CI"
  ],
  "Backend Developer (Node.js)": [
    "2+ years building Node.js services in TypeScript",
    "Solid PostgreSQL skills",
    "Experience with AWS and Docker",
    "Care with sensitive data and audit logs"
  ],
  "Clinical Data Analyst": [
    "Graduate in life sciences, pharmacy, statistics or similar",
    "Comfortable with Excel and basic SQL",
    "Attention to detail with health data",
    "Python is a plus, not required"
  ],
  "Senior Full Stack Engineer": [
    "5+ years building web products end to end",
    "Strong React, Node.js and TypeScript",
    "Experience making and documenting architecture decisions",
    "You've mentored other engineers"
  ],
  "DevOps Engineer": [
    "3+ years in DevOps or platform roles",
    "AWS, Docker and Kubernetes in production",
    "Infrastructure as code with Terraform",
    "Experience reducing cloud costs"
  ],
  "Product Manager, Routing": [
    "4+ years in product management",
    "Comfortable writing SQL for your own analysis",
    "Experience with B2B or operations-heavy products",
    "You talk to users every week"
  ],
  "Operations Analyst (Part-time)": [
    "Final-year student or graduate",
    "Strong with Excel or Google Sheets",
    "Clear written English",
    "Available 20 hours a week"
  ],
  "Frontend Developer (React), New Grad": [
    "2025 or 2026 graduate in any discipline",
    "At least one React project you can walk us through",
    "Solid HTML, CSS and JavaScript fundamentals",
    "Curiosity about how students learn"
  ],
  "Technical Content Writer": [
    "1+ year of technical writing",
    "Working knowledge of JavaScript",
    "Comfortable writing in Markdown",
    "Examples of tutorials you've written"
  ],
  "Python Developer": [
    "1+ year building web backends in Python",
    "Django and Django REST framework",
    "PostgreSQL and query optimisation basics",
    "Experience integrating third-party APIs"
  ],
  "Engineering Manager": [
    "8+ years in software, 2+ managing engineers",
    "Hands-on background in Node.js or similar",
    "Track record of hiring and growing engineers",
    "Comfortable running planning with product and design"
  ],
  "Generative AI Engineer": [
    "2+ years building production software in Python",
    "Hands-on experience with LLM APIs and retrieval (RAG)",
    "Experience with a vector database",
    "You measure quality with evaluations, not vibes"
  ]
};

export const jobs = [
  {
    company: "Kestrelbyte",
    title: "Frontend Engineer (React)",
    location: "Bengaluru",
    workMode: "Hybrid",
    jobType: "Full-time",
    salary: 12,
    salaryMax: 18,
    experienceLevel: 2,
    position: 2,
    daysAgo: 1,
    requirements: ["React", "TypeScript", "Redux", "Jest", "Accessibility", "REST APIs"],
    ...describe(
      "Our merchant dashboard is where 30,000 businesses see their money move. You'll join a four-person frontend team that owns it end to end, from design reviews to production monitoring.",
      [
        "Build and ship features in React and TypeScript, behind feature flags",
        "Turn Figma designs into accessible, well-tested components",
        "Improve performance on low-end Android phones and slow networks",
        "Review code and pair with backend engineers on API design",
      ]
    ),
  },
  {
    company: "Kestrelbyte",
    title: "Backend Engineer, Payments",
    location: "Bengaluru",
    workMode: "On-site",
    jobType: "Full-time",
    salary: 18,
    salaryMax: 28,
    experienceLevel: 3,
    position: 1,
    daysAgo: 3,
    requirements: ["Go", "PostgreSQL", "Kafka", "gRPC", "Distributed systems"],
    ...describe(
      "The payments core processes a few million UPI transactions a day. We need an engineer who cares about correctness, idempotency and clear on-call runbooks.",
      [
        "Design and build services in Go for collections and payouts",
        "Model money movement safely in PostgreSQL",
        "Own reliability of the services you ship, including on-call",
        "Work with banking partners to debug settlement issues",
      ]
    ),
  },
  {
    company: "Kestrelbyte",
    title: "SDE Intern, Web Platform",
    location: "Remote (India)",
    workMode: "Remote",
    jobType: "Internship",
    salary: 4,
    salaryMax: 5,
    experienceLevel: 0,
    position: 3,
    daysAgo: 2,
    requirements: ["JavaScript", "React", "Git", "HTML", "CSS"],
    ...describe(
      "A six-month paid internship on the web platform team. You'll get a mentor, real tickets from week one, and a pre-placement offer conversation at the end.",
      [
        "Fix bugs and build small features in our React codebase",
        "Write tests and learn how we review and deploy code",
        "Present a demo of your work to the company every month",
      ]
    ),
  },
  {
    company: "Kestrelbyte",
    title: "Site Reliability Engineer",
    location: "Bengaluru",
    workMode: "Hybrid",
    jobType: "Full-time",
    salary: 22,
    salaryMax: 32,
    experienceLevel: 4,
    position: 1,
    daysAgo: 6,
    requirements: ["Kubernetes", "Terraform", "AWS", "Prometheus", "Linux"],
    ...describe(
      "Payments can't go down. You'll help us keep 99.99% availability while the team doubles, and make the platform pleasant for product engineers to use.",
      [
        "Run and improve our Kubernetes clusters on AWS",
        "Manage infrastructure as code with Terraform",
        "Build alerting and SLO dashboards that people actually read",
        "Lead incident reviews and follow through on fixes",
      ]
    ),
  },
  {
    company: "Monsoon Grid",
    title: "Data Analyst",
    location: "Pune",
    workMode: "Hybrid",
    jobType: "Full-time",
    salary: 7,
    salaryMax: 11,
    experienceLevel: 1,
    position: 2,
    daysAgo: 2,
    requirements: ["SQL", "Python", "Power BI", "Excel", "Statistics"],
    ...describe(
      "Our customers decide how much power to sell based on our numbers. You'll make sure those numbers are explained clearly and checked carefully.",
      [
        "Write SQL and Python to analyse forecast accuracy by site",
        "Build Power BI reports for operations teams",
        "Investigate anomalies with the data engineering team",
        "Present findings to customers once a month",
      ]
    ),
  },
  {
    company: "Monsoon Grid",
    title: "Machine Learning Engineer, Forecasting",
    location: "Pune",
    workMode: "Hybrid",
    jobType: "Full-time",
    salary: 20,
    salaryMax: 30,
    experienceLevel: 3,
    position: 1,
    daysAgo: 5,
    requirements: ["Python", "PyTorch", "Time series", "MLOps", "SQL"],
    ...describe(
      "We forecast solar and wind generation 15 minutes to 7 days ahead. You'll improve the models and the pipeline that retrains them every night.",
      [
        "Train and evaluate time-series models in PyTorch",
        "Bring weather and satellite features into production safely",
        "Own model monitoring and retraining pipelines",
        "Explain model behaviour to non-ML teammates",
      ]
    ),
  },
  {
    company: "Monsoon Grid",
    title: "Data Engineer",
    location: "Remote (India)",
    workMode: "Remote",
    jobType: "Full-time",
    salary: 14,
    salaryMax: 22,
    experienceLevel: 2,
    position: 1,
    daysAgo: 8,
    requirements: ["Python", "Airflow", "Spark", "dbt", "AWS"],
    ...describe(
      "We ingest readings from 900 power plants every five minutes. You'll keep that data fresh, correct and cheap to query.",
      [
        "Build and maintain Airflow pipelines and dbt models",
        "Tune Spark jobs that process years of sensor history",
        "Add data quality checks that catch bad readings early",
      ]
    ),
  },
  {
    company: "Monsoon Grid",
    title: "Data Science Intern",
    location: "Pune",
    workMode: "On-site",
    jobType: "Internship",
    salary: 3,
    salaryMax: 4,
    experienceLevel: 0,
    position: 2,
    daysAgo: 4,
    requirements: ["Python", "Pandas", "Statistics", "Jupyter"],
    ...describe(
      "A three-month internship for students who enjoy statistics and want to see their analysis used by real customers.",
      [
        "Explore forecast errors and suggest improvements",
        "Clean and document datasets for the team",
        "Share a final write-up with the whole company",
      ]
    ),
  },
  {
    company: "Inkloom Studio",
    title: "Product Designer",
    location: "Mumbai",
    workMode: "Hybrid",
    jobType: "Full-time",
    salary: 10,
    salaryMax: 16,
    experienceLevel: 2,
    position: 1,
    daysAgo: 3,
    requirements: ["Figma", "Design systems", "Prototyping", "User research"],
    ...describe(
      "You'll lead design for two or three founder projects at a time, working directly with clients and our engineers.",
      [
        "Run discovery sessions and quick usability tests",
        "Design flows and high-fidelity UI in Figma",
        "Maintain our shared design system",
        "Review builds with engineers before release",
      ]
    ),
  },
  {
    company: "Inkloom Studio",
    title: "UI/UX Design Intern",
    location: "Remote (India)",
    workMode: "Remote",
    jobType: "Internship",
    salary: 2.5,
    salaryMax: 3.5,
    experienceLevel: 0,
    position: 2,
    daysAgo: 9,
    requirements: ["Figma", "Wireframing", "Visual design"],
    ...describe(
      "Learn how a studio ships products for real clients. You'll pair with a senior designer on every project.",
      [
        "Create wireframes and explore visual directions",
        "Help prepare client presentations",
        "Document components in our design system",
      ]
    ),
  },
  {
    company: "Inkloom Studio",
    title: "Full Stack Developer (MERN)",
    location: "Mumbai",
    workMode: "On-site",
    jobType: "Full-time",
    salary: 8,
    salaryMax: 14,
    experienceLevel: 1,
    position: 2,
    daysAgo: 1,
    requirements: ["MongoDB", "Express", "React", "Node.js", "REST APIs"],
    ...describe(
      "Build first versions of products for early-stage founders, usually from empty repo to launch in eight to twelve weeks.",
      [
        "Build APIs in Node.js and Express backed by MongoDB",
        "Ship React frontends from our designers' Figma files",
        "Set up deploys, logging and basic analytics",
        "Talk to clients about trade-offs in plain language",
      ]
    ),
  },
  {
    company: "Inkloom Studio",
    title: "Motion Designer (Contract)",
    location: "Remote (India)",
    workMode: "Remote",
    jobType: "Contract",
    salary: 9,
    salaryMax: 12,
    experienceLevel: 2,
    position: 1,
    daysAgo: 12,
    requirements: ["After Effects", "Lottie", "Figma"],
    ...describe(
      "A six-month contract to create product animations and launch videos for client projects.",
      [
        "Design micro-interactions and export them as Lottie files",
        "Produce short launch videos",
        "Work with engineers to keep animations light",
      ]
    ),
  },
  {
    company: "Tidewell Health",
    title: "Android Engineer",
    location: "Hyderabad",
    workMode: "Hybrid",
    jobType: "Full-time",
    salary: 14,
    salaryMax: 20,
    experienceLevel: 3,
    position: 1,
    daysAgo: 4,
    requirements: ["Kotlin", "Jetpack Compose", "Android SDK", "REST APIs", "Bluetooth LE"],
    ...describe(
      "Our Android app connects to blood-pressure and glucose devices over Bluetooth and must work offline for days.",
      [
        "Build features in Kotlin and Jetpack Compose",
        "Improve offline sync and Bluetooth reliability",
        "Keep the app fast on entry-level phones",
      ]
    ),
  },
  {
    company: "Tidewell Health",
    title: "QA Automation Engineer",
    location: "Hyderabad",
    workMode: "On-site",
    jobType: "Full-time",
    salary: 7,
    salaryMax: 10,
    experienceLevel: 1,
    position: 1,
    daysAgo: 7,
    requirements: ["Playwright", "JavaScript", "API testing", "CI/CD"],
    ...describe(
      "Help us release twice a week without breaking anything clinicians rely on.",
      [
        "Write Playwright tests for the clinic web app",
        "Automate API tests and run them in CI",
        "Work with developers to make features testable",
      ]
    ),
  },
  {
    company: "Tidewell Health",
    title: "Backend Developer (Node.js)",
    location: "Remote (India)",
    workMode: "Remote",
    jobType: "Full-time",
    salary: 12,
    salaryMax: 18,
    experienceLevel: 2,
    position: 2,
    daysAgo: 2,
    requirements: ["Node.js", "TypeScript", "PostgreSQL", "AWS", "Docker"],
    ...describe(
      "Build the APIs that turn device readings into alerts doctors can act on.",
      [
        "Design TypeScript services on Node.js and PostgreSQL",
        "Handle sensitive health data carefully, with audit trails",
        "Improve alert latency and reliability",
      ]
    ),
  },
  {
    company: "Tidewell Health",
    title: "Clinical Data Analyst",
    location: "Hyderabad",
    workMode: "On-site",
    jobType: "Full-time",
    salary: 6,
    salaryMax: 9,
    experienceLevel: 0,
    position: 1,
    daysAgo: 10,
    requirements: ["SQL", "Excel", "Healthcare data", "Python"],
    ...describe(
      "A great first role for graduates with a science background who like working with data.",
      [
        "Prepare monthly outcome reports for partner clinics",
        "Check data quality and flag unusual readings",
        "Automate repetitive reports with SQL and Python",
      ]
    ),
  },
  {
    company: "Northpine Freight",
    title: "Senior Full Stack Engineer",
    location: "Gurugram",
    workMode: "Hybrid",
    jobType: "Full-time",
    salary: 28,
    salaryMax: 40,
    experienceLevel: 5,
    position: 1,
    daysAgo: 5,
    requirements: ["React", "Node.js", "TypeScript", "PostgreSQL", "System design"],
    ...describe(
      "Lead the build of our new dispatcher console, used all day by operations teams planning thousands of deliveries.",
      [
        "Own features across React frontend and Node.js services",
        "Make architecture decisions and write them down",
        "Mentor two mid-level engineers",
      ]
    ),
  },
  {
    company: "Northpine Freight",
    title: "DevOps Engineer",
    location: "Gurugram",
    workMode: "Hybrid",
    jobType: "Full-time",
    salary: 15,
    salaryMax: 22,
    experienceLevel: 3,
    position: 1,
    daysAgo: 11,
    requirements: ["AWS", "Docker", "Kubernetes", "CI/CD", "Terraform"],
    ...describe(
      "Make deploys boring and cloud bills smaller for a 40-person engineering team.",
      [
        "Maintain CI/CD pipelines and container builds",
        "Run our Kubernetes workloads on AWS",
        "Reduce infrastructure cost without hurting reliability",
      ]
    ),
  },
  {
    company: "Northpine Freight",
    title: "Product Manager, Routing",
    location: "Gurugram",
    workMode: "On-site",
    jobType: "Full-time",
    salary: 25,
    salaryMax: 35,
    experienceLevel: 4,
    position: 1,
    daysAgo: 6,
    requirements: ["Product discovery", "SQL", "Roadmapping", "Stakeholder management"],
    ...describe(
      "Own the routing engine roadmap: the part of our product that decides which truck goes where.",
      [
        "Spend time with dispatchers and drivers to find real problems",
        "Prioritise the routing roadmap with engineering",
        "Measure outcomes with SQL, not opinions",
      ]
    ),
  },
  {
    company: "Northpine Freight",
    title: "Operations Analyst (Part-time)",
    location: "Gurugram",
    workMode: "On-site",
    jobType: "Part-time",
    salary: 3,
    salaryMax: 5,
    experienceLevel: 0,
    position: 2,
    daysAgo: 13,
    requirements: ["Excel", "Google Sheets", "Communication"],
    ...describe(
      "Twenty hours a week helping our customer success team keep data accurate. Flexible hours, suits final-year students.",
      [
        "Clean and update customer route data",
        "Prepare weekly performance sheets",
        "Coordinate with customers over email",
      ]
    ),
  },
  {
    company: "Quillstack Learning",
    title: "Frontend Developer (React), New Grad",
    location: "Remote (India)",
    workMode: "Remote",
    jobType: "Full-time",
    salary: 12,
    salaryMax: 15,
    experienceLevel: 0,
    position: 3,
    daysAgo: 1,
    requirements: ["React", "JavaScript", "HTML", "CSS", "Git"],
    ...describe(
      "Our new-grad program for 2026 graduates. You'll build the learning platform students use every evening, with a senior buddy for your first six months.",
      [
        "Build course and quiz features in React",
        "Fix accessibility and performance issues",
        "Join user interviews with students",
      ]
    ),
  },
  {
    company: "Quillstack Learning",
    title: "Technical Content Writer",
    location: "Remote (India)",
    workMode: "Remote",
    jobType: "Part-time",
    salary: 4,
    salaryMax: 6,
    experienceLevel: 1,
    position: 1,
    daysAgo: 15,
    requirements: ["Technical writing", "JavaScript", "Markdown", "SEO"],
    ...describe(
      "Write clear tutorials and course notes that help beginners actually finish what they start.",
      [
        "Write and edit JavaScript tutorials",
        "Turn live-class recordings into notes",
        "Keep older articles accurate and up to date",
      ]
    ),
  },
  {
    company: "Quillstack Learning",
    title: "Python Developer",
    location: "Bengaluru",
    workMode: "Hybrid",
    jobType: "Full-time",
    salary: 9,
    salaryMax: 14,
    experienceLevel: 1,
    position: 1,
    daysAgo: 9,
    requirements: ["Python", "Django", "PostgreSQL", "REST APIs"],
    ...describe(
      "Work on the Django backend that powers enrolments, payments and live-class scheduling.",
      [
        "Build Django APIs and admin tools",
        "Write migrations and keep PostgreSQL queries fast",
        "Integrate with video and payment providers",
      ]
    ),
  },
  {
    company: "Quillstack Learning",
    title: "Engineering Manager",
    location: "Bengaluru",
    workMode: "Hybrid",
    jobType: "Full-time",
    salary: 45,
    salaryMax: 60,
    experienceLevel: 8,
    position: 1,
    daysAgo: 14,
    requirements: ["People management", "System design", "Node.js", "Hiring"],
    ...describe(
      "Lead a team of seven engineers building the live classroom. You'll split time between people, delivery and technical direction.",
      [
        "Hire, coach and grow engineers",
        "Run planning with product and design",
        "Keep the architecture simple as we scale",
      ]
    ),
  },
  {
    company: "Quillstack Learning",
    title: "Generative AI Engineer",
    location: "Remote (India)",
    workMode: "Remote",
    jobType: "Full-time",
    salary: 18,
    salaryMax: 30,
    experienceLevel: 2,
    position: 1,
    daysAgo: 3,
    requirements: ["Python", "LLMs", "RAG", "Vector databases", "FastAPI"],
    ...describe(
      "Build an AI teaching assistant that answers student doubts using our course material, and measure whether it actually helps.",
      [
        "Build retrieval pipelines over course content",
        "Design evaluations for answer quality",
        "Ship features behind FastAPI services",
      ]
    ),
  },
];

export const candidates = [
  {
    key: "demoCandidate",
    fullName: "Aarav Mehta",
    email: DEMO_CANDIDATE_EMAIL,
    phoneNumber: "9000000010",
    isDemo: true,
    profile: {
      headline: "Frontend developer · React, TypeScript",
      bio: "Frontend developer who enjoys turning messy requirements into fast, accessible interfaces. Looking for a product team where I can grow into full-stack work.",
      skills: ["React", "TypeScript", "JavaScript", "Next.js", "Tailwind CSS", "Redux", "Node.js", "REST APIs", "Git", "Jest"],
      experienceSummary:
        "1.5 years as a frontend developer at a Pune agency building React dashboards for logistics and retail clients. Led the migration of a 40-screen app to TypeScript. Before that, a 6-month internship building landing pages.",
      yearsOfExperience: 1.5,
      location: "Pune",
    },
  },
  {
    key: "neha",
    fullName: "Neha Iyer",
    email: "neha.iyer@example.com",
    phoneNumber: "9000000011",
    profile: {
      headline: "Frontend engineer · React, accessibility",
      bio: "Frontend engineer focused on accessible design systems.",
      skills: ["React", "TypeScript", "Redux", "Jest", "CSS", "Accessibility", "Storybook"],
      experienceSummary: "2.5 years at a SaaS startup owning the component library and checkout flow.",
      yearsOfExperience: 2.5,
      location: "Bengaluru",
    },
  },
  {
    key: "kabir",
    fullName: "Kabir Singh",
    email: "kabir.singh@example.com",
    phoneNumber: "9000000012",
    profile: {
      headline: "Backend engineer · Go, Postgres",
      bio: "Backend engineer who likes boring, reliable systems.",
      skills: ["Go", "PostgreSQL", "Kafka", "Docker", "gRPC", "Redis"],
      experienceSummary: "4 years building lending and ledger services at a fintech; on-call lead for 1 year.",
      yearsOfExperience: 4,
      location: "Bengaluru",
    },
  },
  {
    key: "ananya",
    fullName: "Ananya Rao",
    email: "ananya.rao@example.com",
    phoneNumber: "9000000013",
    profile: {
      headline: "Data analyst · SQL, Power BI",
      bio: "Analyst who enjoys explaining numbers to non-technical teams.",
      skills: ["SQL", "Python", "Power BI", "Excel", "Statistics"],
      experienceSummary: "1 year as a data analyst at a retail chain building weekly sales dashboards.",
      yearsOfExperience: 1,
      location: "Pune",
    },
  },
  {
    key: "rohan",
    fullName: "Rohan Das",
    email: "rohan.das@example.com",
    phoneNumber: "9000000014",
    profile: {
      headline: "Full stack developer · MERN",
      bio: "Full stack developer who has shipped three client products end to end.",
      skills: ["MongoDB", "Express", "React", "Node.js", "REST APIs", "AWS"],
      experienceSummary: "1 year at a web agency building MERN apps for small businesses.",
      yearsOfExperience: 1,
      location: "Mumbai",
    },
  },
  {
    key: "meera",
    fullName: "Meera Pillai",
    email: "meera.pillai@example.com",
    phoneNumber: "9000000015",
    profile: {
      headline: "Product designer · design systems",
      bio: "Product designer who loves research and tidy design systems.",
      skills: ["Figma", "Design systems", "Prototyping", "User research", "HTML", "CSS"],
      experienceSummary: "3 years at a fintech designing onboarding and KYC flows.",
      yearsOfExperience: 3,
      location: "Mumbai",
    },
  },
  {
    key: "arjun",
    fullName: "Arjun Nair",
    email: "arjun.nair@example.com",
    phoneNumber: "9000000016",
    profile: {
      headline: "ML engineer · forecasting",
      bio: "ML engineer working on time-series forecasting.",
      skills: ["Python", "PyTorch", "Time series", "SQL", "MLOps", "Airflow"],
      experienceSummary: "3.5 years building demand forecasting models for a grocery delivery company.",
      yearsOfExperience: 3.5,
      location: "Pune",
    },
  },
  {
    key: "sana",
    fullName: "Sana Qureshi",
    email: "sana.qureshi@example.com",
    phoneNumber: "9000000017",
    profile: {
      headline: "Final-year CS student · web development",
      bio: "Final-year computer science student who builds web apps for campus clubs.",
      skills: ["JavaScript", "React", "HTML", "CSS", "Python", "Git"],
      experienceSummary: "Built a hostel complaint tracker used by 600 students; 2-month internship at a local startup.",
      yearsOfExperience: 0,
      location: "Hyderabad",
    },
  },
  {
    key: "vikram",
    fullName: "Vikram Joshi",
    email: "vikram.joshi@example.com",
    phoneNumber: "9000000018",
    profile: {
      headline: "SRE · Kubernetes, AWS",
      bio: "Site reliability engineer who has run payment-grade infrastructure.",
      skills: ["Kubernetes", "AWS", "Terraform", "Prometheus", "Linux", "Go"],
      experienceSummary: "5 years in infrastructure roles, most recently running Kubernetes for a payments company.",
      yearsOfExperience: 5,
      location: "Bengaluru",
    },
  },
];

// [job title, candidate, final status, days after posting they applied]
export const applications = [
  ["Frontend Engineer (React)", "neha", "interview", 0],
  ["Frontend Engineer (React)", "rohan", "viewed", 0],
  ["Frontend Engineer (React)", "sana", "applied", 0],
  ["Frontend Engineer (React)", "demoCandidate", "viewed", 0],
  ["Frontend Engineer (React)", "meera", "rejected", 0],
  ["Backend Engineer, Payments", "kabir", "shortlisted", 1],
  ["Backend Engineer, Payments", "rohan", "viewed", 1],
  ["Backend Engineer, Payments", "vikram", "applied", 2],
  ["Site Reliability Engineer", "vikram", "offered", 1],
  ["Site Reliability Engineer", "kabir", "interview", 2],
  ["Data Analyst", "ananya", "shortlisted", 0],
  ["Data Analyst", "arjun", "viewed", 1],
  ["Data Analyst", "sana", "rejected", 1],
  ["Machine Learning Engineer, Forecasting", "arjun", "interview", 1],
  ["Machine Learning Engineer, Forecasting", "ananya", "applied", 2],
  ["Product Designer", "meera", "shortlisted", 1],
  ["Product Designer", "sana", "applied", 2],
  ["Full Stack Developer (MERN)", "rohan", "shortlisted", 0],
  ["Full Stack Developer (MERN)", "demoCandidate", "interview", 0],
  ["Full Stack Developer (MERN)", "neha", "applied", 0],
  ["Full Stack Developer (MERN)", "sana", "applied", 0],
  ["SDE Intern, Web Platform", "sana", "viewed", 0],
  ["Backend Developer (Node.js)", "demoCandidate", "applied", 1],
  ["Senior Full Stack Engineer", "demoCandidate", "rejected", 1],
  ["Technical Content Writer", "demoCandidate", "applied", 0],
  ["Generative AI Engineer", "arjun", "viewed", 1],
  ["Python Developer", "kabir", "applied", 2],
  ["Android Engineer", "vikram", "viewed", 1],
];
