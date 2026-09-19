/* =========================================================
   Saksham Platform — Support & Help Page Script (support.js)
   Extracted from support.html into independent JavaScript file
   ========================================================= */

/* ---- FAQ Search / Filter ---- */
(function () {
  const input = document.getElementById("faqSearch");
  const items = document.querySelectorAll(".faq-item");

  if (!input) return;

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
  const btn = document.getElementById("submitBtn");

  if (!form) return;

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    if (btn) {
      btn.disabled = true;
      btn.textContent = "Submitting…";
    }

    setTimeout(function () {
      form.style.display = "none";
      if (success) {
        success.style.display = "block";
      }
    }, 800);
  });
})();
