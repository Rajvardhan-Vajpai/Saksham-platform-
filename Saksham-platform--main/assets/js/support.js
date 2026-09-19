/* ---- FAQ Search / Filter ---- */
(function () {
  const input = document.getElementById("faqSearch");
  const items = document.querySelectorAll(".faq-item");

  input.addEventListener("input", function () {
    const q = this.value.toLowerCase().trim();
    items.forEach(function (item) {
      const text = item.textContent.toLowerCase();
      item.style.display = q === "" || text.includes(q) ? "" : "none";
    });
  });
})();

/* ---- Contact Form Submit ---- */
(function () {
  const form = document.getElementById("supportForm");
  const success = document.getElementById("formSuccess");

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    // Simulate submission (replace with real API call when backend supports it)
    const btn = document.getElementById("submitBtn");
    btn.disabled = true;
    btn.textContent = "Submitting…";

    setTimeout(function () {
      form.style.display = "none";
      success.style.display = "block";
    }, 800);
  });
})();