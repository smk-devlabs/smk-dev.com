let translations = {
  EN: { system: {}, privacy: {}, terms: {}, "child-safety": {} },
  KO: { system: {}, privacy: {}, terms: {}, "child-safety": {} }
};

function normalizeLanguage(lang) {
  return lang === "ko" ? "ko" : "en";
}

function getLocaleFolder(lang) {
  return normalizeLanguage(lang) === "ko" ? "KO" : "EN";
}

function getDefaultLanguage() {
  const savedLang = localStorage.getItem("smk-language") || localStorage.getItem("site_lang");
  if (savedLang) {
    return normalizeLanguage(savedLang);
  }

  const systemLang = navigator.language || navigator.userLanguage || "en";
  return systemLang.toLowerCase().startsWith("ko") ? "ko" : "en";
}

function getPageTranslationKey() {
  return document.body?.dataset?.page || "system";
}

async function loadTranslations(lang, pageName = getPageTranslationKey()) {
  const normalizedLang = normalizeLanguage(lang);
  const localeFolder = getLocaleFolder(normalizedLang);
  const filePath = `assets/languages/${localeFolder}/${pageName}.json`;

  try {
    const response = await fetch(filePath);
    if (!response.ok) {
      throw new Error(`Unable to load ${filePath}`);
    }

    const data = await response.json();
    translations[localeFolder][pageName] = data;
    return data;
  } catch (error) {
    console.error(`Failed to load translations for ${pageName} (${localeFolder}):`, error);
    return translations[localeFolder][pageName] || {};
  }
}

function getActiveTranslations(lang, pageName = getPageTranslationKey()) {
  const normalizedLang = normalizeLanguage(lang);
  const localeFolder = getLocaleFolder(normalizedLang);
  return translations[localeFolder]?.[pageName] || {};
}

function applyPageContent(activeTranslations) {
  const container = document.getElementById("dynamic-content-container");
  if (container && activeTranslations.content) {
    container.innerHTML = activeTranslations.content;
  }
}

function renderTranslations(lang, pageName = getPageTranslationKey()) {
  const normalizedLang = normalizeLanguage(lang);
  const activeTranslations = getActiveTranslations(normalizedLang, pageName);

  document.querySelectorAll("[data-i18n-key]").forEach((element) => {
    const key = element.dataset.i18nKey;
    const value = activeTranslations[key];
    if (value !== undefined) {
      element.textContent = value;
    }
  });

  renderSharedFooter(activeTranslations);

  document.querySelectorAll("[data-ko]").forEach((element) => {
    if (normalizedLang === "ko") {
      element.innerHTML = element.dataset.ko;
    } else if (element.dataset.en) {
      element.innerHTML = element.dataset.en;
    }
  });

  const sectionKo = document.getElementById("sectionKo");
  const sectionEn = document.getElementById("sectionEn");
  if (sectionKo && sectionEn) {
    if (normalizedLang === "ko") {
      sectionKo.classList.add("active");
      sectionEn.classList.remove("active");
    } else {
      sectionKo.classList.remove("active");
      sectionEn.classList.add("active");
    }
  }

  const homeBtnText = document.getElementById("homeBtnText");
  if (homeBtnText) {
    homeBtnText.textContent = activeTranslations["ui.homeButton"] || (normalizedLang === "ko" ? "홈으로 가기" : "Back to Home");
  }

  document.documentElement.lang = normalizedLang;

  const titleElement = document.querySelector("title[data-i18n-key]");
  if (titleElement) {
    document.title = activeTranslations[titleElement.dataset.i18nKey] || titleElement.textContent;
  }

  const descriptionElement = document.querySelector('meta[name="description"][data-i18n-key]');
  if (descriptionElement) {
    descriptionElement.setAttribute(
      "content",
      activeTranslations[descriptionElement.dataset.i18nKey] || descriptionElement.getAttribute("content")
    );
  }

  applyPageContent(activeTranslations);

  const langButton = document.getElementById("langToggle");
  if (langButton) {
    langButton.textContent = activeTranslations["ui.toggleLabel"] || (normalizedLang === "ko" ? "EN" : "KR");
  }

  localStorage.setItem("smk-language", normalizedLang);
  localStorage.setItem("site_lang", normalizedLang);
}

async function applyLanguageAsync(lang, pageName = getPageTranslationKey()) {
  const normalizedLang = normalizeLanguage(lang);
  await loadTranslations(normalizedLang, pageName);
  renderTranslations(normalizedLang, pageName);
}

async function toggleLanguage() {
  const currentLang = getDefaultLanguage();
  await applyLanguageAsync(currentLang === "ko" ? "en" : "ko", getPageTranslationKey());
}

function updateBackToTop() {
  const backToTop = document.querySelector(".back-to-top");
  if (backToTop) {
    if (window.scrollY > 100) {
      backToTop.classList.add("show");
    } else {
      backToTop.classList.remove("show");
    }
  }
}

function renderSharedFooter(activeTranslations) {
  const footerTarget = document.getElementById("site-footer");
  if (!footerTarget) {
    return;
  }

  const footerHtml = `
    <footer class="footer">
      <div class="container footer-inner">
        <div class="footer-left">
          <div class="logo-wrap footer-logo">
            <img src="assets/img/logo.png" alt="SMK Logo" class="logo small">
          </div>
          <p class="footer-copyright" data-i18n-key="footer.copyright">${activeTranslations["footer.copyright"] || "© 2024 SMK DevLabs. All rights reserved."}</p>
        </div>
        <div class="footer-right">
          <ul class="footer-links-list">
            <li><a href="terms.html" data-i18n-key="footer.terms">${activeTranslations["footer.terms"] || "Terms of Service"}</a></li>
            <li><a href="privacy.html" data-i18n-key="footer.privacy">${activeTranslations["footer.privacy"] || "Privacy Policy"}</a></li>
            <li><a href="child-safety.html" data-i18n-key="footer.childSafety">${activeTranslations["footer.childSafety"] || "Child Safety Standards"}</a></li>
          </ul>
        </div>
      </div>
    </footer>
  `;

  footerTarget.innerHTML = footerHtml;
}

window.applyLanguage = applyLanguageAsync;
window.toggleLanguage = toggleLanguage;

window.addEventListener("scroll", updateBackToTop);

document.addEventListener("DOMContentLoaded", async () => {
  const langButton = document.getElementById("langToggle");
  if (langButton && !langButton.dataset.bound) {
    langButton.addEventListener("click", () => {
      toggleLanguage();
    });
    langButton.dataset.bound = "true";
  }

  await applyLanguageAsync(getDefaultLanguage(), getPageTranslationKey());
  updateBackToTop();
});
