renderTicker("ticker", MockDB.ticker);

  (async function () {
    const stats = await loadWithFallback(Api.getStats, MockDB.stats);
    document.getElementById("statGrid").innerHTML = `
      <div class="stat-item"><div class="stat-num">${stats.learners}</div><div class="stat-label">Registered learners</div></div>
      <div class="stat-item"><div class="stat-num">${stats.courses}</div><div class="stat-label">Courses available</div></div>
      <div class="stat-item"><div class="stat-num">${stats.trainers}</div><div class="stat-label">Active trainers</div></div>
      <div class="stat-item"><div class="stat-num">${stats.certificates}</div><div class="stat-label">Certificates issued</div></div>`;

    const items = await loadWithFallback(Api.getAnnouncements, MockDB.announcements);
    const tagClass = t => t === "Achievement" ? "tag-achieve" : (t === "New content" ? "tag-new" : "tag-info");
    document.getElementById("noticeGrid").innerHTML = items.map(n => `
      <div class="notice-card">
        <div class="notice-date"><div class="d">${n.date.split(" ")[0]}</div><div class="m">${n.date.split(" ")[1]}</div></div>
        <div class="notice-body">
          <span class="tag ${tagClass(n.tag)}">${n.tag}</span>
          <h4 style="margin-top:6px;">${n.title}</h4>
          <p>${n.body}</p>
        </div>
      </div>`).join("");

    try {
      const courseRes = await fetch("dataset/courses.json?t=" + new Date().getTime());
      if (courseRes.ok) {
        const allCourses = await courseRes.json();
        const coursesToShow = allCourses.slice(0, 6);
        document.getElementById("courseGrid").innerHTML = coursesToShow.map(c => `
          <div class="role-card" style="display:flex; flex-direction:column;">
            <h4 style="margin:0 0 10px 0;">${c.title}</h4>
            <div style="margin-bottom:10px;"><span class="tag tag-info">${c.category}</span></div>
            <p style="font-size:13.5px; flex-grow:1; color:#555;">${c.description.substring(0, 100)}...</p>
            <div style="font-size:12px; color:#888; margin-top:15px; border-top:1px solid #eee; padding-top:10px;">
              <strong>Difficulty:</strong> ${c.difficulty} &nbsp;|&nbsp; <strong>Duration:</strong> ${c.duration_weeks} weeks
            </div>
          </div>
        `).join("");
      }
    } catch (err) {
      console.error("Error loading courses:", err);
      document.getElementById("courseGrid").innerHTML = `
        <div style="grid-column: 1 / -1; padding: 20px; background: #fff3f3; color: #d32f2f; border: 1px solid #ffcdd2; border-radius: 8px; text-align: center;">
          <h4 style="margin-top: 0;">Unable to load courses</h4>
          <p style="margin-bottom: 0;">Error details: ${err.message}. If this says "Failed to fetch", ensure you are running a local server (e.g. <code>python -m http.server 8080</code>) and accessing it via <code>http://localhost:8080</code>, not <code>file:///</code>.</p>
        </div>
      `;
    }
  })();

// ----------------------------------------------------

import { createChat } from 'https://cdn.jsdelivr.net/npm/@n8n/chat/dist/chat.bundle.es.js';

	createChat({
		webhookUrl: 'https://wnyraj.app.n8n.cloud/webhook/3dd76b11-b8b6-40e3-a926-76040b0887f4/chat'
	});

// ----------------------------------------------------

/* ---- Utility Bar: Font Size Controls ---- */
(function () {
  const sizes = [14, 16, 18]; // small, default, large (px)
  let sizeIdx = 1; // start at default

  function applySize() {
    document.documentElement.style.fontSize = sizes[sizeIdx] + "px";
  }

  document.getElementById("fontMinus").addEventListener("click", function (e) {
    e.preventDefault();
    if (sizeIdx > 0) sizeIdx--;
    applySize();
  });
  document.getElementById("fontReset").addEventListener("click", function (e) {
    e.preventDefault();
    sizeIdx = 1;
    applySize();
  });
  document.getElementById("fontPlus").addEventListener("click", function (e) {
    e.preventDefault();
    if (sizeIdx < sizes.length - 1) sizeIdx++;
    applySize();
  });
})();

/* ---- Utility Bar: High Contrast Toggle ---- */
(function () {
  const btn = document.getElementById("contrastToggle");
  let active = false;
  btn.addEventListener("click", function (e) {
    e.preventDefault();
    active = !active;
    document.body.classList.toggle("high-contrast", active);
    btn.textContent = active ? "Normal View" : "High Contrast";
  });
})();

/* ---- Utility Bar: Hindi / English Language Toggle ---- */
(function () {
  const btn = document.getElementById("langToggle");
  let isHindi = false;

  const translations = {
    "Skip to Main Content": "मुख्य सामग्री पर जाएं",
    "Screen Reader Access": "स्क्रीन रीडर",
    "Home": "होम",
    "Courses": "पाठ्यक्रम",
    "About": "हमारे बारे में",
    "Help": "सहायता",
    "Log in": "लॉग इन",
    "Sign up": "साइन अप",
    "High Contrast": "उच्च कंट्रास्ट",
    "Normal View": "सामान्य दृश्य",
    "MISSION SAKSHAM · CAPACITY BUILDING PROGRAMME": "मिशन सक्षम · क्षमता निर्माण कार्यक्रम",
    "Learn, get certified, and grow with your department.": "सीखें, प्रमाणित हों, और अपने विभाग के साथ आगे बढ़ें।",
    "One platform for course enrollment, competency-based assessments, and shared learning resources — built for trainees, trainers and administrators alike.": "पाठ्यक्रम नामांकन, योग्यता-आधारित मूल्यांकन और साझा शिक्षण संसाधनों के लिए एक मंच — प्रशिक्षुओं, प्रशिक्षकों और प्रशासकों के लिए।",
    "Create your account": "अपना खाता बनाएं",
    "Browse courses": "पाठ्यक्रम देखें",
    "Three roles, one platform": "तीन भूमिकाएं, एक मंच",
    "Built around three roles": "तीन भूमिकाओं पर आधारित",
    "Every account is approved before it becomes active, and each role sees a workspace shaped for its work.": "हर खाता सक्रिय होने से पहले स्वीकृत किया जाता है, और हर भूमिका को अपने कार्य के अनुसार कार्यक्षेत्र मिलता है।",
    "Trainee": "प्रशिक्षु",
    "Trainer": "प्रशिक्षक",
    "Admin": "व्यवस्थापक",
    "Announcements & achievements": "घोषणाएं और उपलब्धियां",
    "Published by the programme administrator.": "कार्यक्रम प्रशासक द्वारा प्रकाशित।",
    "Platform": "प्लेटफ़ॉर्म",
    "Register": "पंजीकरण",
    "Support": "सहायता",
    "Help centre": "सहायता केंद्र",
    "Accessibility statement": "सुगम्यता विवरण",
    "Contact us": "संपर्क करें",
    "Policies": "नीतियां",
    "Terms of use": "उपयोग की शर्तें",
    "Privacy policy": "गोपनीयता नीति",
    "Copyright policy": "कॉपीराइट नीति",
    "Registered learners": "पंजीकृत शिक्षार्थी",
    "Courses available": "उपलब्ध पाठ्यक्रम",
    "Active trainers": "सक्रिय प्रशिक्षक",
    "Certificates issued": "प्रमाणपत्र जारी",
    "Saksham": "सक्षम",
    "National Training & Competency Platform": "राष्ट्रीय प्रशिक्षण एवं योग्यता मंच"
  };

  // Build reverse map
  const reverseMap = {};
  for (const [en, hi] of Object.entries(translations)) {
    reverseMap[hi] = en;
  }

  function swapText(root, map) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
    let node;
    while ((node = walker.nextNode())) {
      const trimmed = node.textContent.trim();
      if (trimmed && map[trimmed]) {
        node.textContent = node.textContent.replace(trimmed, map[trimmed]);
      }
    }
  }

  btn.addEventListener("click", function (e) {
    e.preventDefault();
    if (isHindi) {
      swapText(document.body, reverseMap);
      btn.textContent = "हिंदी";
      document.title = "Saksham — National Training & Competency Platform";
    } else {
      swapText(document.body, translations);
      btn.textContent = "English";
      document.title = "सक्षम — राष्ट्रीय प्रशिक्षण एवं योग्यता मंच";
    }
    isHindi = !isHindi;
  });
})();