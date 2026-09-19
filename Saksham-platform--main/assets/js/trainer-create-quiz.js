initDashboardShell({ role: "trainer", active: "create-quiz.html", title: "Create Questionnaire", crumb: "Trainer workspace", userName: "R. Mehta" });

  function addQuestion() {
    const tpl = document.getElementById("qTemplate").content.cloneNode(true);
    qList.appendChild(tpl);
    renumber();
  }
  function renumber() {
    document.querySelectorAll(".q-block").forEach((el, i) => el.querySelector(".q-num").textContent = `Question ${i + 1}`);
    qCount.textContent = document.querySelectorAll(".q-block").length;
  }
  addQBtn.addEventListener("click", addQuestion);
  qList.addEventListener("click", (e) => {
    if (e.target.classList.contains("remove-q")) { e.target.closest(".q-block").remove(); renumber(); }
  });

  publishBtn.addEventListener("click", async () => {
    const title = quizTitle.value.trim();
    if (!title) { toast("Give the questionnaire a title first"); return; }
    if (!document.querySelectorAll(".q-block").length) { toast("Add at least one question"); return; }
    // Shape matches POST /assessments in API_DOCUMENTATION.md.
    const questions = [...document.querySelectorAll(".q-block")].map(b => ({
      question: b.querySelector(".q-text").value,
      options: [...b.querySelectorAll(".opt")].map(o => o.value),
      correctAnswer: Number(b.querySelector(".correct-opt").value),
      marks: 1,
      difficulty: "medium"
    }));
    try {
      const courses = await Api.getCourses();
      const course = (Array.isArray(courses) ? courses : []).find(c => c.title === quizSubject.value);
      await Api.createAssessment({
        courseId: course ? (course._id || course.id) : undefined,
        title,
        description: "",
        duration: 15,
        deadline: quizDeadline.value,
        passingScore: 50,
        questions
      });
      toast("Questionnaire published — trainees have been notified");
    } catch (e) {
      console.warn("Backend not reachable, questionnaire not actually saved:", e.message);
      toast("Backend not reachable — this is demo mode, nothing was saved");
    }
  });

  addQuestion();