initDashboardShell({ role: "trainee", active: "assessment.html", title: "Assessment", crumb: "Trainee workspace" });

  const params = new URLSearchParams(location.search);
  const assessmentId = params.get("id");
  let questions = MockDB.questions;
  let current = 0;
  let answers = Array(questions.length).fill(null);
  let seconds = 600;

  // If we arrived with a real ?id=, try to load real questions (GET /assessments/:id —
  // trainees receive options only, no correctAnswer, so scoring happens server-side on submit).
  (async function loadReal() {
    if (!assessmentId) return;
    try {
      const data = await Api.getAssessment(assessmentId);
      questions = data.questions.map(q => ({ q: q.question, options: q.options }));
      answers = Array(questions.length).fill(null);
      seconds = (data.duration || 10) * 60;
      renderQuestion();
    } catch (e) {
      console.warn("Backend not reachable, using sample questions:", e.message);
    }
  })();

  function renderQuestion() {
    const q = questions[current];
    qIndex.textContent = `Question ${current + 1} of ${questions.length}`;
    qText.textContent = q.q;
    qOptions.innerHTML = q.options.map((opt, i) => `
      <label class="mcq-option ${answers[current] === i ? "selected" : ""}">
        <input type="radio" name="opt" value="${i}" ${answers[current] === i ? "checked" : ""}>
        ${opt}
      </label>`).join("");
    prevBtn.disabled = current === 0;
    nextBtn.textContent = current === questions.length - 1 ? "Finish" : "Next →";
    renderNav();
  }

  function renderNav() {
    qNav.innerHTML = questions.map((_, i) => `
      <button class="${answers[i] !== null ? "answered" : ""} ${i === current ? "current" : ""}" data-goto="${i}">${i + 1}</button>`).join("");
  }

  qOptions.addEventListener("change", (e) => {
    if (e.target.name === "opt") {
      answers[current] = Number(e.target.value);
      renderQuestion();
    }
  });
  qNav.addEventListener("click", (e) => {
    if (e.target.dataset.goto !== undefined) { current = Number(e.target.dataset.goto); renderQuestion(); }
  });
  prevBtn.addEventListener("click", () => { if (current > 0) { current--; renderQuestion(); } });
  nextBtn.addEventListener("click", () => { if (current < questions.length - 1) { current++; renderQuestion(); } else submit(); });
  submitBtn.addEventListener("click", submit);

  async function submit() {
    quizView.style.display = "none";
    resultView.style.display = "block";
    clearInterval(timerHandle);

    if (assessmentId) {
      // Backend scores it server-side — never trust a client-computed score for real assessments.
      try {
        const result = await Api.submitAssessment(assessmentId, answers.map((a, i) => ({ questionId: i, selectedOption: a })));
        const pct = Math.round((result.score / result.totalMarks) * 100) || 0;
        scoreText.textContent = `${result.score} / ${result.totalMarks} (${pct}%)`;
        scoreBar.style.width = pct + "%";
        return;
      } catch (e) {
        console.warn("Backend not reachable, falling back to local scoring:", e.message);
      }
    }
    // Demo mode (no real assessment id, or backend unreachable): score against MockDB's answer key.
    let correct = 0;
    answers.forEach((a, i) => { if (a === (MockDB.questions[i] || {}).answer) correct++; });
    const pct = Math.round((correct / questions.length) * 100);
    scoreText.textContent = `${correct} / ${questions.length} (${pct}%)`;
    scoreBar.style.width = pct + "%";
  }

  function tick() {
    seconds--;
    if (seconds <= 0) { submit(); return; }
    const m = String(Math.floor(seconds / 60)).padStart(2, "0");
    const s = String(seconds % 60).padStart(2, "0");
    timer.textContent = `${m}:${s}`;
  }
  const timerHandle = setInterval(tick, 1000);

  renderQuestion();