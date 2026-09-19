/* Mock data — stands in for your REST API responses until you point
   API_BASE_URL (see api.js) at your real backend. Every shape here
   mirrors what the corresponding endpoint should return. */
const MockDB = {
  session: { name: "Aditi Sharma", role: "trainee", id: "U1042", initials: "AS" },

  announcements: [
    { date: "11 SEP", title: "New course launched: Public Financial Management", body: "A 6-module course covering budgeting, procurement and audit basics is now open for enrollment.", tag: "New content" },
    { date: "08 SEP", title: "Assessment window extended for Cyber Hygiene", body: "The MCQ deadline for the Cyber Hygiene Foundation course has been extended to 20 Sep.", tag: "Notice" },
    { date: "02 SEP", title: "500 trainees crossed Advanced Excel certification", body: "Congratulations to all officers who completed the certification this quarter.", tag: "Achievement" }
  ],

  ticker: [
    "Enrollment open: Disaster Management Fundamentals — closes 25 Sep",
    "New trainer library upload: RTI Act 2005 — case studies",
    "Maintenance window: portal will be briefly unavailable 14 Sep, 2–3 AM",
    "1,240 certificates issued this month across all departments"
  ],

  stats: { learners: "18,420", courses: "312", trainers: "640", certificates: "9,860" },

  courses: [
    { id: "C101", title: "Public Financial Management", category: "Governance", trainer: "R. Mehta", duration: "6 modules", level: "Intermediate", progress: 40, enrolled: true },
    { id: "C102", title: "Cyber Hygiene Foundation", category: "Digital Skills", trainer: "S. Iyer", duration: "4 modules", level: "Beginner", progress: 100, enrolled: true },
    { id: "C103", title: "RTI Act 2005 — Practice & Procedure", category: "Policy", trainer: "K. Nair", duration: "5 modules", level: "Intermediate", progress: 0, enrolled: false },
    { id: "C104", title: "Disaster Management Fundamentals", category: "Emergency Response", trainer: "P. Verma", duration: "8 modules", level: "Beginner", progress: 0, enrolled: false },
    { id: "C105", title: "Advanced MS Excel for Reporting", category: "Digital Skills", trainer: "S. Iyer", duration: "3 modules", level: "Advanced", progress: 70, enrolled: true },
    { id: "C106", title: "Effective File Noting", category: "Governance", trainer: "R. Mehta", duration: "2 modules", level: "Beginner", progress: 0, enrolled: false }
  ],

  resources: [
    { type: "video", title: "Module 3 — Budget Cycle Explained", meta: "42 min • Recorded lecture" },
    { type: "ppt", title: "Procurement Rules — Slide Deck", meta: "28 slides" },
    { type: "pdf", title: "Audit Basics — Reading Material", meta: "14 pages" },
    { type: "doc", title: "Case Study: State Budget 2024", meta: "6 pages" }
  ],

  trainerLibrary: [
    { type: "video", title: "RTI Act — Case Studies (Recorded)", meta: "Uploaded 3 Sep • 55 min", visible: true },
    { type: "ppt", title: "Cyber Hygiene — Phishing Awareness", meta: "Uploaded 29 Aug • 22 slides", visible: true },
    { type: "pdf", title: "Excel Shortcuts Reference Sheet", meta: "Uploaded 20 Aug • 4 pages", visible: false }
  ],

  quizzes: [
    { id: "Q1", title: "Cyber Hygiene Foundation — Final Assessment", subject: "Digital Skills", deadline: "20 Sep 2026", attempts: 128, avgScore: "76%" },
    { id: "Q2", title: "Public Financial Management — Module 3 Quiz", subject: "Governance", deadline: "18 Sep 2026", attempts: 64, avgScore: "68%" }
  ],

  questions: [
    { q: "Which document authorizes government expenditure for a financial year?", options: ["Finance Bill", "Appropriation Act", "Economic Survey", "Audit Report"], answer: 1 },
    { q: "The Comptroller and Auditor General submits reports to whom?", options: ["The Prime Minister", "The President", "The Finance Secretary", "The Cabinet Secretary"], answer: 1 },
    { q: "Which of these is a preventive cyber hygiene practice?", options: ["Reusing passwords", "Ignoring software updates", "Enabling two-factor authentication", "Clicking unknown links"], answer: 2 },
    { q: "Under RTI Act 2005, the default response period is:", options: ["7 days", "15 days", "30 days", "45 days"], answer: 2 },
    { q: "Zero-based budgeting requires each expense to be:", options: ["Carried forward automatically", "Justified afresh each cycle", "Approved only by audit", "Ignored if under threshold"], answer: 1 }
  ],

  trainees: [
    { name: "Aditi Sharma", dept: "Finance", course: "Public Financial Management", progress: 40, score: "—" },
    { name: "Rohit Kulkarni", dept: "IT", course: "Cyber Hygiene Foundation", progress: 100, score: "82%" },
    { name: "Meera Pillai", dept: "Revenue", course: "Cyber Hygiene Foundation", progress: 100, score: "91%" },
    { name: "Sanjay Das", dept: "Administration", course: "Advanced MS Excel", progress: 70, score: "—" },
    { name: "Farah Khan", dept: "Finance", course: "Public Financial Management", progress: 15, score: "—" }
  ],

  users: [
    { name: "Farah Khan", email: "farah.khan@gov.in", role: "Trainee", dept: "Finance", status: "pending", applied: "10 Sep 2026" },
    { name: "Vikram Rao", email: "vikram.rao@gov.in", role: "Trainer", dept: "IT", status: "pending", applied: "09 Sep 2026" },
    { name: "Aditi Sharma", email: "aditi.sharma@gov.in", role: "Trainee", dept: "Finance", status: "approved", applied: "02 Aug 2026" },
    { name: "R. Mehta", email: "r.mehta@gov.in", role: "Trainer", dept: "Governance", status: "approved", applied: "14 Jun 2026" },
    { name: "Imran Sheikh", email: "imran.sheikh@gov.in", role: "Trainee", dept: "Revenue", status: "rejected", applied: "28 Jul 2026" }
  ],

  competency: [
    { subject: "Public Financial Management", trainers: ["R. Mehta (98%)", "A. Bose (74%)"], coverage: 92 },
    { subject: "Digital Skills / Cyber Hygiene", trainers: ["S. Iyer (95%)"], coverage: 68 },
    { subject: "Policy & RTI", trainers: ["K. Nair (89%)"], coverage: 54 },
    { subject: "Disaster Management", trainers: ["P. Verma (81%)"], coverage: 40 },
    { subject: "Office Procedure", trainers: ["Unassigned"], coverage: 12 }
  ],

  adminActivity: [
    { who: "R. Mehta", action: "Uploaded new lecture to Trainer Library", when: "2 hours ago" },
    { who: "Admin", action: "Approved trainer application — Vikram Rao", when: "5 hours ago" },
    { who: "System", action: "Certificate issued to Meera Pillai (Cyber Hygiene)", when: "Yesterday" },
    { who: "S. Iyer", action: "Published new questionnaire — Excel Module 2", when: "Yesterday" }
  ]
};
