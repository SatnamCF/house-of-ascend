/* House of Ascend — interactions: nav, scroll reveal, stat counters, contact form */
(function () {
  "use strict";

  const nav = document.getElementById("nav");
  const toggle = document.getElementById("navToggle");
  const links = document.getElementById("navLinks");

  /* --- sticky nav background on scroll --- */
  const onScroll = () => nav.classList.toggle("is-scrolled", window.scrollY > 24);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* --- mobile menu --- */
  const closeMenu = () => {
    links.classList.remove("is-open");
    toggle.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
  };
  toggle.addEventListener("click", () => {
    const open = links.classList.toggle("is-open");
    toggle.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
  });
  links.querySelectorAll("a").forEach((a) => a.addEventListener("click", closeMenu));

  /* --- footer year --- */
  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* --- scroll reveal + stat counters via IntersectionObserver --- */
  const reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    const io = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          entry.target.querySelectorAll?.("[data-count]").forEach(animateCount);
          obs.unobserve(entry.target);
        });
      },
      { threshold: 0.18, rootMargin: "0px 0px -8% 0px" }
    );
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("is-visible"));
    document.querySelectorAll("[data-count]").forEach((el) => {
      el.textContent = el.dataset.count + (el.dataset.suffix || "");
    });
  }

  function animateCount(el) {
    const target = parseFloat(el.dataset.count);
    const suffix = el.dataset.suffix || "";
    const duration = 1500;
    const start = performance.now();
    const step = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /* --- contact form: posts straight to the inbox via FormSubmit (no backend needed) --- */
  const FORM_ENDPOINT = "https://formsubmit.co/ajax/thehouseofascend@gmail.com";
  const form = document.getElementById("contactForm");
  const note = document.getElementById("formNote");
  if (form) {
    const submitBtn = form.querySelector('button[type="submit"]');
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!form.checkValidity()) {
        note.textContent = "Please complete the required fields.";
        form.reportValidity();
        return;
      }
      const data = new FormData(form);
      if (data.get("_honey")) return; // honeypot tripped — silently ignore bots

      const original = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = "Sending…";
      note.style.color = "";
      note.textContent = "";

      const payload = {
        name: data.get("name") || "",
        email: data.get("email") || "",
        brand: data.get("brand") || "",
        message: data.get("message") || "",
        _subject: `New enquiry from ${data.get("name") || "a brand"} — House of Ascend`,
        _template: "table",
        _captcha: "false",
      };

      try {
        const res = await fetch(FORM_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json().catch(() => ({}));
        if (res.ok && String(json.success) === "true") {
          form.reset();
          note.textContent = "Thank you — your message has been sent. We'll be in touch shortly.";
        } else {
          throw new Error(json.message || "Request failed");
        }
      } catch (err) {
        note.style.color = "#e6a17a";
        note.textContent = "Sorry, something went wrong. Please email us directly at thehouseofascend@gmail.com.";
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = original;
      }
    });
  }
})();
