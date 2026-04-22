const initReveal = () => {
  const revealItems = document.querySelectorAll(".reveal");

  if (!revealItems.length) {
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.16 }
  );

  revealItems.forEach((item) => observer.observe(item));
};

window.RYD_initReveal = initReveal;

const setActiveNav = () => {
  const page = document.body.dataset.page;
  if (!page) {
    return;
  }

  document.querySelectorAll("[data-nav]").forEach((link) => {
    if (link.dataset.nav === page) {
      link.classList.add("active");
    }
  });
};

const initNavbar = () => {
  const navWrap = document.querySelector(".nav-wrap");
  const navLinks = navWrap?.querySelector(".nav-links");
  const navCta = navWrap?.querySelector(".nav-cta");

  if (!navWrap || !navLinks || !navCta || navWrap.querySelector(".nav-toggle")) {
    return;
  }

  const navPanel = document.createElement("div");
  navPanel.className = "nav-panel";
  navPanel.id = "primary-nav-panel";

  const navToggle = document.createElement("button");
  navToggle.type = "button";
  navToggle.className = "nav-toggle";
  navToggle.setAttribute("aria-expanded", "false");
  navToggle.setAttribute("aria-controls", navPanel.id);
  navToggle.setAttribute("aria-label", "Open navigation menu");
  navToggle.innerHTML = [
    '<span class="sr-only">Toggle navigation</span>',
    '<span class="nav-toggle-icon" aria-hidden="true">',
    '  <span class="nav-toggle-bar"></span>',
    '  <span class="nav-toggle-bar"></span>',
    '  <span class="nav-toggle-bar"></span>',
    "</span>"
  ].join("");

  navWrap.insertBefore(navToggle, navLinks);
  navWrap.appendChild(navPanel);
  navPanel.append(navLinks, navCta);

  const mobileQuery = window.matchMedia("(max-width: 980px)");

  const closeMenu = () => {
    navWrap.classList.remove("menu-open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Open navigation menu");
    document.body.classList.remove("nav-open");

    if (mobileQuery.matches) {
      navPanel.hidden = true;
    }
  };

  const openMenu = () => {
    navWrap.classList.add("menu-open");
    navToggle.setAttribute("aria-expanded", "true");
    navToggle.setAttribute("aria-label", "Close navigation menu");
    navPanel.hidden = false;
    document.body.classList.add("nav-open");
  };

  const syncMenuState = () => {
    if (mobileQuery.matches) {
      if (!navWrap.classList.contains("menu-open")) {
        navPanel.hidden = true;
      }
      return;
    }

    navPanel.hidden = false;
    navWrap.classList.remove("menu-open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Open navigation menu");
    document.body.classList.remove("nav-open");
  };

  navToggle.addEventListener("click", () => {
    if (navWrap.classList.contains("menu-open")) {
      closeMenu();
      return;
    }

    openMenu();
  });

  navPanel.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      if (mobileQuery.matches) {
        closeMenu();
      }
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && navWrap.classList.contains("menu-open")) {
      closeMenu();
    }
  });

  if (typeof mobileQuery.addEventListener === "function") {
    mobileQuery.addEventListener("change", syncMenuState);
  } else {
    mobileQuery.addListener(syncMenuState);
  }

  syncMenuState();
};

document.addEventListener("DOMContentLoaded", () => {
  initReveal();
  initNavbar();
  setActiveNav();
});
