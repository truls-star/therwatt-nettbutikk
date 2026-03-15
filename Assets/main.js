document.addEventListener("DOMContentLoaded", () => {
  const SUCCESS_MESSAGE =
    "Takk for forespørselen. Vi har mottatt informasjonen din og tar kontakt så snart som mulig.";
  const ERROR_MESSAGE =
    "Det oppstod en feil ved sending. Prøv igjen, eller kontakt oss på post@therwatt.no.";

  const languageOptions = [
    { code: "no", label: "Norsk" },
    { code: "en", label: "English" },
    { code: "fr", label: "Français" },
    { code: "es", label: "Español" },
    { code: "de", label: "Deutsch" }
  ];

  const buildTranslateUrl = (langCode) => {
    const pageUrl = `${location.origin}${location.pathname}${location.search}`;
    return `https://translate.google.com/translate?sl=no&tl=${langCode}&u=${encodeURIComponent(pageUrl)}`;
  };

  const initLanguageSelector = () => {
    const nav = document.querySelector(".nav");
    if (!nav || document.getElementById("languageSelect")) return;

    const langWrap = document.createElement("div");
    langWrap.className = "lang-switch";
    langWrap.innerHTML = `
      <label class="lang-label" for="languageSelect">Språk</label>
      <select id="languageSelect" class="lang-select" aria-label="Velg språk">
        ${languageOptions.map((opt) => `<option value="${opt.code}">${opt.label}</option>`).join("")}
      </select>
    `;

    const menuToggle = document.getElementById("menuToggle");
    nav.insertBefore(langWrap, menuToggle || null);

    const select = langWrap.querySelector("#languageSelect");
    select.value = "no";

    select.addEventListener("change", (event) => {
      const selectedLang = event.target.value;
      document.documentElement.lang = selectedLang;
      if (selectedLang !== "no") {
        location.href = buildTranslateUrl(selectedLang);
      }
    });
  };

  initLanguageSelector();

  const path = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll("[data-page]").forEach((el) => {
    if (el.getAttribute("data-page") === path) el.classList.add("active");
  });

  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();

  const toggle = document.getElementById("menuToggle");
  const menu = document.getElementById("mainMenu");
  if (toggle && menu) {
    toggle.addEventListener("click", () => {
      menu.classList.toggle("open");
      const isOpen = menu.classList.contains("open");
      toggle.innerHTML = isOpen
        ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>'
        : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>';
    });
    document.addEventListener("click", (e) => {
      if (!menu.contains(e.target) && !toggle.contains(e.target) && menu.classList.contains("open")) {
        menu.classList.remove("open");
        toggle.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>';
      }
    });
  }

  document.querySelectorAll(".nav-dropdown > a").forEach((trigger) => {
    trigger.addEventListener("click", (e) => {
      if (window.innerWidth <= 768) {
        e.preventDefault();
        trigger.parentElement.classList.toggle("open");
      }
    });
  });

  const scrollBtn = document.getElementById("scrollTop");
  if (scrollBtn) {
    window.addEventListener("scroll", () => {
      scrollBtn.classList.toggle("visible", window.scrollY > 400);
    });
    scrollBtn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  const setFormStatus = (form, message, isSuccess) => {
    const box = form.querySelector("[data-form-status]");
    if (!box) return;
    if (!message) {
      box.textContent = "";
      box.style.display = "none";
      return;
    }
    box.textContent = message;
    box.className = isSuccess ? "notice success" : "notice";
    box.style.display = "";
  };

  const postNetlifyForm = async (formData) => {
    await fetch("/__forms.html", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(formData).toString(),
    });
  };

  document.addEventListener("submit", async (event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;
    if (form.dataset.netlifyAjax !== "true") return;

    event.preventDefault();
    setFormStatus(form, "", true);

    if (!form.reportValidity()) {
      setFormStatus(form, "Fyll ut alle obligatoriske felt før innsending.", false);
      return;
    }

    const submitButton = form.querySelector("button[type='submit']");
    const originalLabel = submitButton ? (submitButton.dataset.submitLabel || submitButton.textContent) : "";
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Sender...";
    }

    try {
      const formData = new FormData(form);
      await postNetlifyForm(formData);

      const action = form.getAttribute("action");
      if (action) {
        window.location.href = action;
        return;
      }

      form.reset();
      setFormStatus(form, SUCCESS_MESSAGE, true);
    } catch (error) {
      setFormStatus(form, ERROR_MESSAGE, false);
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = originalLabel;
      }
    }
  });
});
