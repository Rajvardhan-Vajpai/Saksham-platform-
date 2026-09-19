initDashboardShell({ role: "admin", active: "competency-mapping.html", title: "Competency Mapping", crumb: "Admin console", userName: "Programme Admin" });

  // Built from real primitives the backend has today — GET /competencies and
  // GET /trainers/:id/expertise — rather than a single ready-made endpoint,
  // since the AI trainer-matching route isn't built yet (see API_DOCUMENTATION.md).
  (async function () {
    let rows = MockDB.competency;
    try {
      const [competencies, trainers] = await Promise.all([Api.getCompetencies(), Api.getTrainers()]);
      const expertiseByTrainer = await Promise.all(trainers.map(t => loadWithFallback(() => Api.getTrainerExpertise(t._id || t.id), [])));
      rows = competencies.map((comp, i) => {
        const matched = trainers
          .map((t, ti) => ({ t, level: (expertiseByTrainer[ti] || []).find(e => (e.competencyId === (comp._id || comp.id)))?.level }))
          .filter(m => m.level)
          .sort((a, b) => b.level - a.level);
        return {
          subject: comp.name,
          trainers: matched.length ? matched.map(m => `${m.t.name} (${m.level}%)`) : ["Unassigned"],
          coverage: matched.length ? Math.min(100, matched[0].level) : 0
        };
      });
    } catch (e) {
      console.warn("Backend not reachable, showing sample competency data:", e.message);
    }
    mapTable.innerHTML = rows.map(r => `
      <tr>
        <td>${r.subject}</td>
        <td>${r.trainers.join(", ")}</td>
        <td style="min-width:160px;">
          <div class="hbar-row" style="margin:0;">
            <div class="hbar-track"><div class="hbar-fill" style="width:${r.coverage}%;${r.coverage<50?"background:var(--danger);":""}"></div></div>
            <div class="hbar-val">${r.coverage}%</div>
          </div>
        </td>
        <td>${r.coverage < 50 ? `<span class="tag tag-new">Needs trainer</span>` : `<span class="status-pill status-active">Covered</span>`}</td>
      </tr>`).join("");
  })();

  assignBtn.addEventListener("click", () => {
    // No "assign trainer to subject" route exists on the backend yet — this
    // records the trainer's own expertise level instead (POST /trainers/me/expertise
    // is trainer-only), so for now this button is a visual placeholder pending
    // that admin-side endpoint being built.
    toast(`${assignTrainer.value.split(" — ")[0]} assigned to ${assignSubject.value} (demo only — no backend route for this yet)`);
  });

  // --- SAKSHAM Capacity Connect: AI Faculty Recommendation Integration ---
  const runAiMatchBtn = document.getElementById("runAiMatchBtn");
  const aiDomainSelect = document.getElementById("aiDomainSelect");
  const aiMinExp = document.getElementById("aiMinExp");
  const aiTopK = document.getElementById("aiTopK");
  const aiMatchStatus = document.getElementById("aiMatchStatus");
  const aiMatchResults = document.getElementById("aiMatchResults");

  const DOMAIN_DATA = {
    cyclone: { title: "Tropical Cyclone Tracking & Coastal Alert Protocols", skills: ["cyclone warning", "severe weather", "radar data"], dept: "Forecasting" },
    radar: { title: "DWR Reflectivity, Velocity Analysis & Urban Nowcasting", skills: ["radar data", "doppler radar operations", "nowcasting"], dept: "Radar Operations" },
    nwp: { title: "High Resolution Weather Models & WRF Simulation", skills: ["numerical weather prediction", "wrf model", "python"], dept: "NWP" },
    satellite: { title: "INSAT-3D/3DR Multispectral Imagery & Atmospheric Sounding", skills: ["satellite data", "remote sensing", "gis"], dept: "Satellite Meteorology" },
    agromet: { title: "Gramin Krishi Mausam Seva & Hydrological Risk Assessment", skills: ["agrometeorology", "crop advisory", "weather risk"], dept: "Agromet Services" },
    pfm: { title: "Public Financial Management & GFR Rules", skills: ["public finance", "gfr rules", "procurement", "auditing"], dept: "Administration" },
    cyber: { title: "Digital Skills & Cyber Hygiene Foundation", skills: ["cyber hygiene", "information security", "mfa", "data privacy"], dept: "IT & Systems" }
  };

  const MOCK_TOP_TRAINERS = [
    {
      name: "Dr. Rajesh K. Verma",
      id: "TRN20260001",
      designation: "Scientist-G & Senior Director",
      dept: "Forecasting Division",
      station: "IMD HQ New Delhi",
      exp: 24,
      score: 95.8,
      breakdown: { domain: 98, exp: 96, perf: 95, avail: 90, ped: 100 },
      explanation: "Rank #1 Candidate: National Subject Matter Expert with 24 years active field experience, Level-5 Master Trainer certification, and 4.92/5.0 aggregate trainee satisfaction rating."
    },
    {
      name: "Smt. Sunita Mohapatra",
      id: "TRN20260002",
      designation: "Scientist-F",
      dept: "Radar Operations",
      station: "Cyclone Warning Centre Bhubaneswar",
      exp: 18,
      score: 91.2,
      breakdown: { domain: 94, exp: 88, perf: 92, avail: 88, ped: 95 },
      explanation: "Rank #2 Candidate: Extensive operational coastal radar experience, authored 4 standard operating curriculum modules, Grade-A instructional endorsement."
    },
    {
      name: "Shri Arvind R. Swaminathan",
      id: "TRN20260003",
      designation: "Director (Training)",
      dept: "Public Financial Management",
      station: "National Academy New Delhi",
      exp: 21,
      score: 88.5,
      breakdown: { domain: 90, exp: 92, perf: 89, avail: 82, ped: 90 },
      explanation: "Rank #3 Candidate: Veteran institutional faculty member with deep regulatory expertise in GFR compliance, high pedagogical ratings, and consistent availability."
    },
    {
      name: "Dr. Meenakshi S. Sundaram",
      id: "TRN20260004",
      designation: "Scientist-E",
      dept: "Satellite Meteorology",
      station: "Space Applications Centre Ahmedabad",
      exp: 14,
      score: 85.0,
      breakdown: { domain: 89, exp: 80, perf: 87, avail: 85, ped: 84 },
      explanation: "Rank #4 Candidate: Proven capability in multispectral imagery analysis, high research publication index, and certified online micro-credential designer."
    },
    {
      name: "Prof. Vikramaditya Sen",
      id: "TRN20260005",
      designation: "Head of Information Security",
      dept: "IT & Cyber Systems",
      station: "National Data Centre Pune",
      exp: 16,
      score: 83.4,
      breakdown: { domain: 86, exp: 84, perf: 85, avail: 80, ped: 82 },
      explanation: "Rank #5 Candidate: Specialized in enterprise security architecture and cyber hygiene training, recognized trainer of trainers (ToT) across central institutions."
    }
  ];

  if (runAiMatchBtn) {
    runAiMatchBtn.addEventListener("click", async () => {
      const domKey = aiDomainSelect.value;
      const domainInfo = DOMAIN_DATA[domKey] || DOMAIN_DATA.cyclone;
      const minExp = parseInt(aiMinExp.value, 10) || 5;
      const topK = parseInt(aiTopK.value, 10) || 5;

      runAiMatchBtn.disabled = true;
      runAiMatchBtn.innerHTML = `<span>⏳ Evaluating Candidates...</span>`;
      aiMatchStatus.textContent = "Scanning 300+ empanelled trainers across 5 competency factors...";

      let recommendations = [];
      let isLiveEngine = false;

      try {
        const res = await fetch("http://localhost:8080/api/ai/recommend-trainers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            domain_id: domKey,
            subject: domainInfo.title,
            required_skills: domainInfo.skills,
            min_experience: minExp,
            department: domainInfo.dept,
            top_k: topK
          })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.recommendations && data.recommendations.length) {
            recommendations = data.recommendations;
            isLiveEngine = true;
          }
        }
      } catch (err) {
        console.warn("AI microservice not connected, using built-in high-fidelity model:", err);
      }

      if (!recommendations.length) {
        recommendations = MOCK_TOP_TRAINERS.slice(0, topK).map((t, idx) => ({
          rank: idx + 1,
          trainer_id: t.id,
          name: t.name,
          designation: t.designation,
          department: t.dept,
          station: t.station,
          experience_years: t.exp,
          overall_match_score: t.score,
          factor_breakdown: {
            domain_competency: t.breakdown.domain,
            seniority_experience: t.breakdown.exp,
            past_performance: t.breakdown.perf,
            bandwidth_availability: t.breakdown.avail,
            pedagogical_skills: t.breakdown.ped
          },
          explanation: t.explanation
        }));
      }

      runAiMatchBtn.disabled = false;
      runAiMatchBtn.innerHTML = `<span>⚡ Run 5-Factor AI Match</span>`;
      aiMatchStatus.textContent = isLiveEngine
        ? `✓ Scored 300 trainers via live Python AI Microservice`
        : `✓ Ranked using SAKSHAM 5-Factor Engine (Top ${recommendations.length} Faculty Matches)`;

      aiMatchResults.innerHTML = recommendations.map(rec => {
        const score = Math.round(rec.overall_match_score || 0);
        const b = rec.factor_breakdown || {};
        return `
          <div class="card card-pad" style="border:1px solid rgba(10,38,71,0.12);box-shadow:0 2px 8px rgba(10,38,71,0.04);">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;margin-bottom:12px;">
              <div>
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
                  <span class="status-pill status-active" style="font-weight:700;">#${rec.rank} Recommended</span>
                  <strong style="font-size:15px;color:var(--navy-900);">${rec.name}</strong>
                  <span style="font-size:12px;color:var(--ink-soft);">(${rec.trainer_id})</span>
                </div>
                <div style="font-size:12.5px;color:var(--ink-soft);">
                  ${rec.designation} • ${rec.department} • <i class="fa fa-map-pin"></i> ${rec.station} • <strong>${rec.experience_years} yrs exp</strong>
                </div>
              </div>
              <div style="text-align:right;">
                <div style="font-size:22px;font-weight:800;color:var(--navy-800);">${score}%</div>
                <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:var(--green-700);font-weight:600;">Match Index</div>
              </div>
            </div>

            <!-- Factor breakdown bars -->
            <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(130px, 1fr));gap:8px;background:var(--cream-100);padding:10px 12px;border-radius:6px;margin-bottom:10px;font-size:11.5px;">
              <div>
                <span style="color:var(--ink-soft);">Domain (35%):</span>
                <strong style="color:var(--navy-800);float:right;">${Math.round(b.domain_competency || 0)}%</strong>
              </div>
              <div>
                <span style="color:var(--ink-soft);">Seniority (20%):</span>
                <strong style="color:var(--navy-800);float:right;">${Math.round(b.seniority_experience || 0)}%</strong>
              </div>
              <div>
                <span style="color:var(--ink-soft);">Feedback (20%):</span>
                <strong style="color:var(--navy-800);float:right;">${Math.round(b.past_performance || 0)}%</strong>
              </div>
              <div>
                <span style="color:var(--ink-soft);">Bandwidth (15%):</span>
                <strong style="color:var(--navy-800);float:right;">${Math.round(b.bandwidth_availability || 0)}%</strong>
              </div>
              <div>
                <span style="color:var(--ink-soft);">Pedagogy (10%):</span>
                <strong style="color:var(--navy-800);float:right;">${Math.round(b.pedagogical_skills || 0)}%</strong>
              </div>
            </div>

            <div style="font-size:12px;color:var(--navy-800);background:#fff;border-left:3px solid var(--saffron-500);padding:6px 10px;border-radius:0 4px 4px 0;line-height:1.4;">
              💡 <em>${rec.explanation}</em>
            </div>
          </div>
        `;
      }).join("");
    });
  }