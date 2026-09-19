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
    { id: "C1000", course_id: "C1000", title: "Doppler Radar Operations for Decision Makers", course_name: "Doppler Radar Operations for Decision Makers", category: "Doppler Radar Operations", competency: "Doppler radar operations", level: "Intermediate", delivery_mode: "Offline", duration_weeks: 2, duration_hours: 20, rating: "4.0", enrolled_count: "28", certification_offered: true },
    { id: "C1002", course_id: "C1002", title: "Doppler Radar Operations Refresher Course", course_name: "Doppler Radar Operations Refresher Course", category: "Doppler Radar Operations", competency: "Doppler radar operations", level: "Beginner", delivery_mode: "Online", duration_weeks: 2, duration_hours: 16, rating: "4.7", enrolled_count: "7", certification_offered: false },
    { id: "C106", course_id: "C106", title: "Cyclone Forecasting & Warning", course_name: "Cyclone Forecasting & Warning", category: "Cyclone Warning", competency: "Cyclone warning", level: "Beginner", delivery_mode: "Online", duration_weeks: 2, duration_hours: 16, rating: "3.9", enrolled_count: "7", certification_offered: false },
    { id: "C108", course_id: "C108", title: "Numerical Weather Prediction", course_name: "Numerical Weather Prediction", category: "Numerical Weather Prediction", competency: "Numerical weather prediction", level: "Beginner", delivery_mode: "Online", duration_weeks: 3, duration_hours: 24, rating: "4.1", enrolled_count: "12", certification_offered: false },
    { id: "C109", course_id: "C109", title: "Agrometeorological Advisory", course_name: "Agrometeorological Advisory", category: "Agromet Advisory", competency: "Agromet advisory", level: "Beginner", delivery_mode: "Online", duration_weeks: 3, duration_hours: 24, rating: "3.4", enrolled_count: "9", certification_offered: false },
    { id: "C112", course_id: "C112", title: "Seismology Fundamentals", course_name: "Seismology Fundamentals", category: "Seismology", competency: "Seismology", level: "Beginner", delivery_mode: "Online", duration_weeks: 2, duration_hours: 16, rating: "3.3", enrolled_count: "7", certification_offered: true }
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
