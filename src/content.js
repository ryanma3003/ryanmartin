// ╔════════════════════════════════════════════════════════════════════════════╗
// ║  CONTENT.JS — the ONLY file you need to edit to update the résumé/game.    ║
// ║  It is rendered into static HTML at build time (SEO, screen readers,       ║
// ║  copy-paste); the game reads the rendered DOM, never this file.            ║
// ╚════════════════════════════════════════════════════════════════════════════╝
//
// ENEMIES: any item with an `enemy` becomes a career milestone in the game.
//   kind  → sprite. Must exist in that section's biome atlas:
//           forest:   'slime' | 'mushroom'
//           mountain: 'bat' | 'golem' | 'dragon'        (harder skill → harder enemy)
//           castle:   'knight' | 'darkknight' | 'spikes' (spikes = obstacle the hero jumps)
//           boss:     'boss'
//   xp    → XP awarded when the hero passes it.
//   label → text in the "DEFEATED:" banner. Keep it short (≤ 40 chars).

// ---------------------------------------------------------------- PROFILE / SEO
export const PROFILE = {
  name: 'Ryan Martin Hidayat',
  shortName: 'RYAN.DEV',
  role: 'Senior Full-Stack Engineer',
  location: 'Jakarta, Indonesia',
  email: 'ryan.martin3003@gmail.com',
  linkedin: 'https://linkedin.com/in/ryanhid',
  github: 'https://github.com/ryanma3003',
  resumePdf: 'Ryan Martin Hidayat - Senior Full-Stack Engineer Resume.pdf', // lives in /public
};

export const SITE = {
  url: 'https://ryanma3003.github.io/ryanmartin/',
  title: 'Ryan Martin Hidayat — Senior Full-Stack Engineer | Golang · Laravel · AWS · Cybersecurity',
  description:
    'Senior Full-Stack Engineer with 10 years of IT experience across software engineering, cloud infrastructure, and cybersecurity. Golang, PHP/Laravel, AWS, Docker, Zero Trust. Play the résumé as an 8-bit adventure.',
  knowsAbout: ['Golang', 'Laravel', 'PHP', 'AWS', 'Docker', 'Cybersecurity', 'Zero Trust Architecture'],
};

// ---------------------------------------------------------------- TITLE SCREEN
export const TITLE = {
  kicker: 'PLAYER 1 · JAKARTA, ID',
  tagline: 'Golang · Laravel · AWS · Cybersecurity — building scalable, secure, high-availability systems.',
  start: 'PRESS START',
  hint: 'Scroll to play. Every section is a level; every milestone is an enemy.',
};

// ---------------------------------------------------------------- WORLD 1 · FOREST (about)
export const ABOUT = {
  zone: '1-1 FOREST',
  heading: 'About Me',
  summary: [
    'Senior Full-Stack Engineer with 10 years of IT experience, including 8 years designing, building, and modernizing enterprise web applications across software engineering, cloud infrastructure, and cybersecurity.',
    'Expert in Golang, PHP/Laravel, JavaScript/TypeScript, Python, and SQL, with hands-on AWS (EC2, S3, Lambda), Docker, Linux, and CI/CD (GitHub Actions) delivery.',
    'Track record of launching SaaS platforms from zero to production, cutting server CPU load by 70% through serverless architecture, and hardening government systems with Zero Trust access. I combine engineering depth with security expertise to deliver scalable, secure, high-availability systems.',
  ],
  stats: [
    { label: 'Years in IT', value: '10', enemy: { kind: 'slime', xp: 100, label: '10 years in IT' } },
    { label: 'Years building web apps', value: '8', enemy: { kind: 'mushroom', xp: 100, label: '8 years shipping web apps' } },
    { label: 'Class', value: 'Full-Stack + Security' },
    { label: 'Base', value: 'Jakarta, ID' },
  ],
  education: {
    degree: 'Bachelor of Information Systems',
    school: 'Universitas Islam Negeri (UIN) Syarif Hidayatullah Jakarta',
    period: '2011 – 2016',
    enemy: { kind: 'slime', xp: 80, label: 'B.Sc. Information Systems' },
  },
  certifications: [
    { name: 'Google Cybersecurity Specialization', issuer: 'Google', enemy: { kind: 'mushroom', xp: 80, label: 'Google Cybersecurity cert' } },
    { name: 'Database Administration Fundamentals', issuer: 'Microsoft', enemy: { kind: 'slime', xp: 60, label: 'Microsoft DB Admin cert' } },
  ],
};

// ---------------------------------------------------------------- WORLD 2 · MOUNTAIN CAVE (skills)
// Ordered easy → hard: the deeper you go, the tougher the monster.
export const SKILLS = {
  zone: '2-1 MOUNTAIN CAVE',
  heading: 'Skills & Stack',
  intro: 'Deeper in the cave, tougher monsters. Each skill tree below was earned in production.',
  groups: [
    { name: 'Languages', items: ['Golang', 'PHP', 'JavaScript', 'TypeScript', 'Python', 'SQL', 'HTML', 'CSS'], enemy: { kind: 'bat', xp: 120, label: 'Languages ×8 mastered' } },
    { name: 'Frameworks', items: ['Laravel', 'Lumen', 'React', 'Vue.js', 'Svelte', 'Flask', 'Rasa'], enemy: { kind: 'bat', xp: 120, label: 'Frameworks ×7 tamed' } },
    { name: 'Databases & Messaging', items: ['PostgreSQL', 'MySQL', 'Redis', 'RabbitMQ'], enemy: { kind: 'golem', xp: 180, label: 'Data layer: Postgres → RabbitMQ' } },
    { name: 'Cloud & DevOps', items: ['AWS (EC2, S3, Lambda)', 'Serverless', 'Docker', 'Linux', 'GitHub Actions', 'CI/CD'], enemy: { kind: 'golem', xp: 180, label: 'Cloud & DevOps golem' } },
    { name: 'AI & Data', items: ['LLM Response Evaluation', 'RLHF', 'Data Labeling', 'Annotation', 'Image & Search Analysis'], enemy: { kind: 'golem', xp: 160, label: 'AI & data training' } },
    { name: 'Security', items: ['Zero Trust Architecture', 'Secure Tunneling (Tailscale)', 'Cybersecurity Maturity Assessment', 'Gap Analysis', 'CIRT/CSIRT Establishment'], enemy: { kind: 'dragon', xp: 300, label: 'Security dragon slain' } },
  ],
  competencies: [
    'Full-Stack Development', 'Microservices', 'RESTful API Design', 'System Design', 'Cloud Architecture', 'Serverless',
    'Cloud Migration', 'CI/CD', 'DevSecOps', 'Zero Trust Architecture', 'Cybersecurity Maturity Assessment', 'Gap Analysis',
    'Incident Response (CIRT/CSIRT)', 'Performance Optimization', 'Scalability', 'Payment Gateway Integration',
    'Stakeholder Management', 'Technical Leadership',
  ],
};

// ---------------------------------------------------------------- WORLD 3 · CASTLE (experience)
export const EXPERIENCE = {
  zone: '3-1 CASTLE',
  heading: 'Experience',
  jobs: [
    {
      role: 'Cyber Security Analyst',
      company: 'National Cyber and Crypto Agency (BSSN)',
      location: 'Jakarta, Indonesia',
      period: '2022 – Present',
      current: true,
      bullets: [
        { text: 'Led the establishment of Computer Security Incident Response Teams (CSIRT) for stakeholder organizations, defining incident response procedures, roles, and escalation workflows.', enemy: { kind: 'darkknight', xp: 250, label: 'Boss: led CSIRT establishment' } },
        { text: 'Conducted cybersecurity maturity assessments for stakeholder organizations, delivering gap analyses, risk-prioritized remediation roadmaps, and executive-level reports.' },
        { text: 'Architected and launched a secure web platform that digitized the end-to-end assessment process, eliminating manual workflows and accelerating assessment turnaround.', enemy: { kind: 'knight', xp: 200, label: 'Assessments fully digitized' } },
        { text: 'Engineered a Zero Trust architecture using secure tunneling (Tailscale), closing 100% of inbound ports and shrinking the external attack surface while maintaining uninterrupted access for authorized users.', enemy: { kind: 'spikes', xp: 220, label: '100% of inbound ports closed' } },
        { text: 'Boosted platform scalability and reduced response times by implementing concurrent processing (Golang goroutines) to handle high-volume request loads.' },
      ],
    },
    {
      role: 'AI Training Data Annotator (Freelance)',
      company: 'Freelance',
      location: 'Remote',
      period: '2025',
      bullets: [
        { text: 'Evaluated, rated, and ranked large language model (LLM) responses for factual accuracy, safety, tone, and helpfulness, producing high-quality training data for model alignment (RLHF).', enemy: { kind: 'knight', xp: 120, label: 'LLM alignment data (RLHF)' } },
      ],
    },
    {
      role: 'Full-Stack Engineer',
      company: 'PT Visi Tujuan Bersama',
      location: 'Jakarta, Indonesia',
      period: '2019 – 2022',
      bullets: [
        { text: "Architected and built the company's core SaaS platform from scratch (Laravel, MySQL), taking it from concept to production for B2B and B2C clients.", enemy: { kind: 'darkknight', xp: 250, label: 'SaaS: zero → production' } },
        { text: 'Designed and shipped KPI tracking, talent profiling, and 360-degree performance evaluation modules, expanding the product’s revenue-generating feature set.' },
        { text: 'Integrated payment gateway workflows to automate revenue tracking and commission distribution, eliminating manual reconciliation.' },
        { text: 'Implemented CI/CD pipelines (GitHub Actions), increasing deployment frequency and reducing release failures and manual deployment effort.', enemy: { kind: 'spikes', xp: 150, label: 'Release failures cut by CI/CD' } },
        { text: 'Reduced server CPU utilization from 99% to 30% by offloading resource-intensive PDF generation to serverless functions (AWS Lambda).', enemy: { kind: 'darkknight', xp: 250, label: 'Server CPU 99% → 30%' } },
        { text: 'Led cloud migration from VPS to AWS (EC2, S3, Lambda), improving elasticity, scalability, and system availability.', enemy: { kind: 'knight', xp: 200, label: 'Led VPS → AWS migration' } },
      ],
    },
    {
      role: 'Full-Stack Engineer',
      company: 'PT Bank DKI',
      location: 'Jakarta, Indonesia',
      period: '2018 – 2019',
      bullets: [
        { text: "Maintained and extended the bank's internal HRIS (PHP, MySQL), delivering new features and resolving production defects." },
        { text: 'Built a centralized employee forum module that shifted 85% of HR information delivery onto the HRIS, streamlining internal communication.', enemy: { kind: 'knight', xp: 150, label: '85% of HR comms moved to HRIS' } },
        { text: 'Refactored KPI services to eliminate downtime during peak submission periods, ensuring reliable performance under high concurrent load.', enemy: { kind: 'spikes', xp: 150, label: 'Peak-load downtime eliminated' } },
      ],
    },
    {
      role: 'IT Technical Support',
      company: 'PT Kinarya Alihdaya Mandiri',
      location: 'Jakarta, Indonesia',
      period: '2017 – 2018',
      bullets: [
        { text: 'Resolved hardware and software incidents for end users, maintaining operational continuity and meeting service-level targets.', enemy: { kind: 'knight', xp: 80, label: 'Service-level targets met' } },
        { text: 'Configured systems, troubleshot technical issues, and managed IT asset maintenance across the organization.' },
      ],
    },
    {
      role: 'IT Technical Support',
      company: 'PT Mitra Integrasi Informatika',
      location: 'Jakarta, Indonesia',
      period: '2016 – 2017',
      bullets: [
        { text: 'Delivered frontline IT support, diagnosing and resolving user issues to sustain internal IT operations.' },
        { text: 'Configured systems and troubleshot infrastructure issues in support of the internal IT team.' },
      ],
    },
  ],
};

// ---------------------------------------------------------------- WORLD 3 · CASTLE KEEP (projects)
export const PROJECTS = {
  zone: '3-2 CASTLE KEEP',
  heading: 'Selected Projects',
  items: [
    { name: 'Stakeholder Management Platform', year: '2026', points: ['Architected an enterprise platform unifying cybersecurity assessments, automated risk surveys, executive dashboards, a learning management system (LMS), event RSVP, and micro-blogging.', 'Implemented event-driven messaging with RabbitMQ and caching with Redis for scalable, responsive performance.'], tech: ['Golang', 'Vue.js', 'PostgreSQL', 'Redis', 'RabbitMQ', 'Docker'], enemy: { kind: 'darkknight', xp: 250, label: 'Stakeholder platform shipped' } },
    { name: 'Zi.Care HRIS', year: '2023', points: ['Built an end-to-end HR digitalization platform covering attendance, KPI tracking, 360-degree reviews, leave management, payroll processing, tax calculation, and turnover analytics dashboards.'], tech: ['Golang', 'Vue.js', 'PostgreSQL', 'Redis', 'Docker'], enemy: { kind: 'knight', xp: 200, label: 'Zi.Care HRIS shipped' } },
    { name: 'DJKI AI Chatbot and Live Agent', year: '2023', points: ['Developed an AI chatbot that automates responses to frequently asked user questions and seamlessly escalates complex cases to live agents.'], tech: ['Python', 'Flask', 'Rasa', 'SQL'], enemy: { kind: 'knight', xp: 180, label: 'DJKI AI chatbot shipped' } },
    { name: 'Daulat Umat Landing Page and Zakat Payment', year: '2021', points: ['Developed charity campaign landing pages and payment web services that process donation, zakat, and fitrah transactions.'], tech: ['Lumen', 'Svelte', 'SQL'], enemy: { kind: 'spikes', xp: 150, label: 'Zakat payments live' } },
    { name: 'Subrosa Landing Page and Reservation System', year: '2021', points: ['Built a restaurant website with online table reservations and integrated payment processing, deployed on AWS.'], tech: ['Laravel', 'SQL', 'HTML', 'CSS', 'AWS'], enemy: { kind: 'knight', xp: 150, label: 'Subrosa reservations live' } },
    { name: 'EPMS – Bank DKI', year: '2019', points: ['Developed an employee performance management system for tracking employee KPIs and appraisals.'], tech: ['PHP', 'SQL', 'HTML', 'CSS'], enemy: { kind: 'knight', xp: 120, label: 'EPMS shipped for Bank DKI' } },
    { name: 'Berkat Panduan Hikam Company Profile Website', year: '2017', points: ['Built and launched a responsive company profile website.'], tech: ['Laravel', 'SQL', 'HTML', 'CSS'], enemy: { kind: 'spikes', xp: 100, label: 'First client site launched' } },
  ],
};

// ---------------------------------------------------------------- BOSS ROOM (contact / footer)
export const CONTACT = {
  zone: 'BOSS ROOM',
  boss: { name: 'THE FINAL CHALLENGE', enemy: { kind: 'boss', xp: 1000, label: 'THE FINAL CHALLENGE' } },
  heading: "Let's Work Together",
  pitch: 'Open to senior full-stack, backend (Golang), cloud, and security-focused engineering roles — remote or Jakarta-based.',
  victory: 'VICTORY! Final move: hire the hero.',
  ctas: [
    { label: 'Hire Me', href: 'mailto:ryan.martin3003@gmail.com?subject=Let%27s%20work%20together', primary: true },
    { label: 'GitHub', href: 'https://github.com/ryanma3003', external: true },
    { label: 'LinkedIn', href: 'https://linkedin.com/in/ryanhid', external: true },
    { label: 'Résumé PDF', href: 'Ryan%20Martin%20Hidayat%20-%20Senior%20Full-Stack%20Engineer%20Resume.pdf', download: true },
  ],
  footer: '© 2026 Ryan Martin Hidayat. Built with vanilla JS + three.js (WebGPU, WebGL2 fallback).',
};
