let translations = {
    EN: {
        system: {},
        privacy: {},
        terms: {},
        "child-safety": {}
    },

    KO: {
        system: {},
        privacy: {},
        terms: {},
        "child-safety": {}
    }
};


/**
 * Normalize the language code.
 */
function normalizeLanguage(lang) {

    return lang === "ko"
        ? "ko"
        : "en";
}


/**
 * Convert the language code to the locale folder name.
 */
function getLocaleFolder(lang) {

    return normalizeLanguage(lang) === "ko"
        ? "KO"
        : "EN";
}


/**
 * Get the user's saved language or detect the browser language.
 */
function getDefaultLanguage() {

    const savedLang =
        localStorage.getItem("smk-language") ||
        localStorage.getItem("site_lang");

    if (savedLang) {

        return normalizeLanguage(
            savedLang
        );
    }


    const systemLang =
        navigator.language ||
        navigator.userLanguage ||
        "en";


    return systemLang
        .toLowerCase()
        .startsWith("ko")
        ? "ko"
        : "en";
}


/**
 * Get the translation key for the current page.
 */
function getPageTranslationKey() {

    return document.body?.dataset?.page ||
        "system";
}


/**
 * Load the translation JSON for the specified page.
 */
async function loadTranslations(
    lang,
    pageName = getPageTranslationKey()
) {

    const normalizedLang =
        normalizeLanguage(lang);

    const localeFolder =
        getLocaleFolder(normalizedLang);

    const filePath =
        `assets/languages/${localeFolder}/${pageName}.json`;


    try {

        const response =
            await fetch(filePath);

        if (!response.ok) {

            throw new Error(
                `Unable to load ${filePath}`
            );
        }


        const data =
            await response.json();


        translations[localeFolder][pageName] =
            data;


        return data;

    } catch (error) {

        console.error(
            `Failed to load translations for ${pageName} (${localeFolder}):`,
            error
        );


        return (
            translations[localeFolder]?.[pageName] ||
            {}
        );
    }
}


/**
 * Get the currently loaded translations for a page.
 */
function getActiveTranslations(
    lang,
    pageName = getPageTranslationKey()
) {

    const normalizedLang =
        normalizeLanguage(lang);

    const localeFolder =
        getLocaleFolder(normalizedLang);


    return (
        translations[localeFolder]?.[pageName] ||
        {}
    );
}


/**
 * Apply style elements contained in a dynamically loaded
 * legal HTML document to the main document.
 */
function applyLegalStyles(
    parsedDocument,
    fileName
) {

    if (!parsedDocument?.head) {
        return;
    }


    const styles =
        parsedDocument.head.querySelectorAll(
            "style"
        );


    styles.forEach(
        (sourceStyle, index) => {

            const styleId =
                `legal-style-${fileName}-${index}`;


            if (
                document.getElementById(styleId)
            ) {
                return;
            }


            const style =
                document.createElement("style");


            style.id =
                styleId;


            style.textContent =
                sourceStyle.textContent;


            document.head.appendChild(
                style
            );
        }
    );
}


/**
 * Load the language-specific HTML content
 * for legal and policy pages.
 */
async function loadLegalContent(
    lang,
    pageName
) {

    const normalizedLang =
        normalizeLanguage(lang);


    const legalFiles = {

        terms: {
            en: "terms-en.html",
            ko: "terms-ko.html"
        },

        privacy: {
            en: "privacy-en.html",
            ko: "privacy-ko.html"
        },

        "child-safety": {
            en: "child-safety-en.html",
            ko: "child-safety-ko.html"
        }
    };


    const fileName =
        legalFiles[pageName]?.[normalizedLang];


    if (!fileName) {
        return false;
    }


    const container =
        document.getElementById(
            "dynamic-content-container"
        );


    if (!container) {
        return false;
    }


    try {

        const response =
            await fetch(fileName);


        if (!response.ok) {

            throw new Error(
                `Unable to load ${fileName} (${response.status})`
            );
        }


        const html =
            await response.text();


        /**
         * Parse the complete legal HTML document.
         */
        const parser =
            new DOMParser();


        const parsedDocument =
            parser.parseFromString(
                html,
                "text/html"
            );


        /**
         * Apply styles from the legal document.
         */
        applyLegalStyles(
            parsedDocument,
            fileName
        );


        /**
         * Insert only the body contents.
         */
        if (parsedDocument.body) {

            container.innerHTML =
                parsedDocument.body.innerHTML;

        } else {

            container.innerHTML =
                html;
        }


        /**
         * Wait for the browser to update the layout
         * before checking the document height.
         */
        requestAnimationFrame(
            () => {

                updateScrollBottomButton();

                updateBackToTop();

            }
        );


        return true;

    } catch (error) {

        console.error(
            `Failed to load legal content: ${fileName}`,
            error
        );


        container.innerHTML = `
            <div class="content-error">
                <p>
                    ${
                        normalizedLang === "ko"
                            ? "페이지 내용을 불러오지 못했습니다."
                            : "Unable to load this page content."
                    }
                </p>
            </div>
        `;


        requestAnimationFrame(
            () => {

                updateScrollBottomButton();

            }
        );


        return false;
    }
}


/**
 * Apply external HTML content to legal pages.
 */
async function applyPageContent(
    activeTranslations,
    lang,
    pageName
) {

    const container =
        document.getElementById(
            "dynamic-content-container"
        );


    if (!container) {
        return;
    }


    await loadLegalContent(
        lang,
        pageName
    );
}


/**
 * Load system.json for the shared footer.
 */
async function loadSystemTranslations(
    lang
) {

    const normalizedLang =
        normalizeLanguage(lang);

    const localeFolder =
        getLocaleFolder(normalizedLang);

    const filePath =
        `assets/languages/${localeFolder}/system.json`;


    try {

        const response =
            await fetch(filePath);


        if (!response.ok) {

            throw new Error(
                `Unable to load ${filePath}`
            );
        }


        const data =
            await response.json();


        translations[localeFolder].system =
            data;


        return data;

    } catch (error) {

        console.error(
            `Failed to load system translations (${localeFolder}):`,
            error
        );


        return (
            translations[localeFolder]?.system ||
            {}
        );
    }
}


/**
 * Render the shared footer using system.json.
 */
async function renderSharedFooter(
    lang
) {

    const footerTarget =
        document.getElementById(
            "site-footer"
        );


    if (!footerTarget) {
        return;
    }


    const systemTranslations =
        await loadSystemTranslations(lang);


    const footerHtml = `
        <footer class="footer">

            <div class="container footer-inner">

                <div class="footer-left">

                    <div class="logo-wrap footer-logo">

                        <img
                            src="assets/img/logo.png"
                            alt="SMK Logo"
                            class="logo small"
                        >

                    </div>

                    <p class="footer-copyright">
                        ${
                            systemTranslations["footer.copyright"] ||
                            "© 2024 SMK DevLabs. All rights reserved."
                        }
                    </p>

                </div>


                <div class="footer-right">

                    <ul class="footer-links-list">

                        <li>
                            <a href="terms.html">
                                ${
                                    systemTranslations["footer.terms"] ||
                                    "Terms"
                                }
                            </a>
                        </li>

                        <li>
                            <a href="privacy.html">
                                ${
                                    systemTranslations["footer.privacy"] ||
                                    "Privacy"
                                }
                            </a>
                        </li>

                        <li>
                            <a href="child-safety.html">
                                ${
                                    systemTranslations["footer.childSafety"] ||
                                    "Child Safety Standards"
                                }
                            </a>
                        </li>

                    </ul>

                </div>

            </div>

        </footer>
    `;


    footerTarget.innerHTML =
        footerHtml;
}


/**
 * Render translations for the current page.
 */
async function renderTranslations(
    lang,
    pageName = getPageTranslationKey()
) {

    const normalizedLang =
        normalizeLanguage(lang);


    const activeTranslations =
        getActiveTranslations(
            normalizedLang,
            pageName
        );


    /**
     * Apply current page translations.
     */
    document
        .querySelectorAll(
            "[data-i18n-key]"
        )
        .forEach(
            (element) => {

                const key =
                    element.dataset.i18nKey;


                const value =
                    activeTranslations[key];


                if (value !== undefined) {

                    element.textContent =
                        value;
                }
            }
        );


    /**
     * Render the shared footer from system.json.
     */
    await renderSharedFooter(
        normalizedLang
    );


    /**
     * Apply inline Korean and English content.
     */
    document
        .querySelectorAll(
            "[data-ko]"
        )
        .forEach(
            (element) => {

                if (
                    normalizedLang === "ko"
                ) {

                    element.innerHTML =
                        element.dataset.ko;

                } else if (
                    element.dataset.en
                ) {

                    element.innerHTML =
                        element.dataset.en;
                }
            }
        );


    /**
     * Toggle language-specific sections.
     */
    const sectionKo =
        document.getElementById(
            "sectionKo"
        );


    const sectionEn =
        document.getElementById(
            "sectionEn"
        );


    if (
        sectionKo &&
        sectionEn
    ) {

        if (
            normalizedLang === "ko"
        ) {

            sectionKo.classList.add(
                "active"
            );

            sectionEn.classList.remove(
                "active"
            );

        } else {

            sectionKo.classList.remove(
                "active"
            );

            sectionEn.classList.add(
                "active"
            );
        }
    }


    /**
     * Update the home button text.
     */
    const homeBtnText =
        document.getElementById(
            "homeBtnText"
        );


    if (homeBtnText) {

        homeBtnText.textContent =
            activeTranslations[
                "ui.homeButton"
            ] ||
            (
                normalizedLang === "ko"
                    ? "홈으로 가기"
                    : "Back to Home"
            );
    }


    /**
     * Update the HTML language attribute.
     */
    document.documentElement.lang =
        normalizedLang;


    /**
     * Update the document title.
     */
    const titleElement =
        document.querySelector(
            "title[data-i18n-key]"
        );


    if (titleElement) {

        document.title =
            activeTranslations[
                titleElement.dataset.i18nKey
            ] ||
            titleElement.textContent;
    }


    /**
     * Update the meta description.
     */
    const descriptionElement =
        document.querySelector(
            'meta[name="description"][data-i18n-key]'
        );


    if (descriptionElement) {

        descriptionElement.setAttribute(
            "content",

            activeTranslations[
                descriptionElement.dataset.i18nKey
            ] ||
            descriptionElement.getAttribute(
                "content"
            )
        );
    }


    /**
     * Update the language toggle button.
     */
    const langButton =
        document.getElementById(
            "langToggle"
        );


    if (langButton) {

        langButton.textContent =
            activeTranslations[
                "ui.toggleLabel"
            ] ||
            (
                normalizedLang === "ko"
                    ? "EN"
                    : "KR"
            );
    }


    /**
     * Save the selected language.
     */
    localStorage.setItem(
        "smk-language",
        normalizedLang
    );


    localStorage.setItem(
        "site_lang",
        normalizedLang
    );
}


/**
 * Apply the selected language to the page.
 */
async function applyLanguageAsync(
    lang,
    pageName = getPageTranslationKey()
) {

    const normalizedLang =
        normalizeLanguage(lang);


    /**
     * Load the current page translation JSON.
     */
    await loadTranslations(
        normalizedLang,
        pageName
    );


    const activeTranslations =
        getActiveTranslations(
            normalizedLang,
            pageName
        );


    /**
     * Apply page translations and render the footer.
     */
    await renderTranslations(
        normalizedLang,
        pageName
    );


    /**
     * Load external legal page content.
     */
    await applyPageContent(
        activeTranslations,
        normalizedLang,
        pageName
    );


    /**
     * Recalculate the navigation controls
     * after dynamic content has been inserted.
     */
    requestAnimationFrame(
        () => {

            initializeScrollBottomButton();

            updateBackToTop();
            updateScrollBottomButton();

        }
    );


    /**
     * Perform an additional delayed check.
     *
     * This is useful when the dynamically loaded
     * legal document changes its height after layout.
     */
    setTimeout(
        () => {

            updateScrollBottomButton();

        },
        100
    );


    setTimeout(
        () => {

            updateScrollBottomButton();

        },
        300
    );
}


/**
 * Toggle between Korean and English.
 */
async function toggleLanguage() {

    const currentLang =
        getDefaultLanguage();


    await applyLanguageAsync(
        currentLang === "ko"
            ? "en"
            : "ko",

        getPageTranslationKey()
    );
}


/* =========================================================
   Back-to-top button
   ========================================================= */


/**
 * Update the visibility of the back-to-top button.
 */
function updateBackToTop() {

    const backToTop =
        document.querySelector(
            ".back-to-top"
        );


    if (!backToTop) {
        return;
    }


    if (
        getScrollPosition() > 100
    ) {

        backToTop.classList.add(
            "show"
        );

    } else {

        backToTop.classList.remove(
            "show"
        );
    }
}


/* =========================================================
   Scroll-to-bottom button
   ========================================================= */


/**
 * Get the actual vertical scroll position.
 */
function getScrollPosition() {

    return Math.max(
        window.scrollY || 0,

        window.pageYOffset || 0,

        document.documentElement.scrollTop || 0,

        document.body
            ? document.body.scrollTop || 0
            : 0
    );
}


/**
 * Get the actual document height.
 *
 * The larger value between documentElement and body
 * is used to handle differences between browsers
 * and dynamically inserted content.
 */
function getDocumentHeight() {

    return Math.max(
        document.documentElement.scrollHeight,

        document.documentElement.offsetHeight,

        document.body
            ? document.body.scrollHeight
            : 0,

        document.body
            ? document.body.offsetHeight
            : 0
    );
}


/**
 * Determine whether the document has reached
 * the bottom tolerance area.
 *
 * An 80px tolerance is used intentionally.
 */
function isPageAtBottom() {

    const scrollPosition =
        getScrollPosition();


    const viewportBottom =
        scrollPosition +
        window.innerHeight;


    const documentHeight =
        getDocumentHeight();


    return (
        viewportBottom >=
        documentHeight - 80
    );
}


/**
 * Find or create the scroll-to-bottom button.
 */
function getOrCreateScrollBottomButton() {

    let button =
        document.getElementById(
            "scroll-bottom-button"
        );


    if (button) {
        return button;
    }


    button =
        document.createElement(
            "button"
        );


    button.id =
        "scroll-bottom-button";


    button.type =
        "button";


    button.setAttribute(
        "aria-label",
        "Scroll to bottom"
    );


    button.setAttribute(
        "title",
        "Scroll to bottom"
    );


    document.body.appendChild(
        button
    );


    return button;
}


/**
 * Update the visibility of the scroll-to-bottom button.
 */
function updateScrollBottomButton() {

    const button =
        document.getElementById(
            "scroll-bottom-button"
        );


    if (!button) {
        return;
    }


    const atBottom =
        isPageAtBottom();


    if (atBottom) {

        button.classList.add(
            "hidden"
        );


        /**
         * Also use the native hidden property
         * as a fallback if CSS does not hide it.
         */
        button.hidden =
            true;

    } else {

        button.classList.remove(
            "hidden"
        );


        button.hidden =
            false;
    }
}


/**
 * Scroll smoothly to the bottom of the document.
 */
function scrollToBottom() {

    const documentHeight =
        getDocumentHeight();


    window.scrollTo({

        top:
            documentHeight,

        behavior:
            "smooth"
    });
}


/**
 * Initialize the scroll-to-bottom button.
 *
 * This function is safe to call multiple times.
 */
function initializeScrollBottomButton() {

    if (getPageTranslationKey() === "system") {
        return;
    }

    const button =
        getOrCreateScrollBottomButton();

    if (!button) {
        return;
    }

    if (
        button.dataset.scrollBottomBound !==
        "true"
    ) {

        button.addEventListener(
            "click",
            scrollToBottom
        );

        button.dataset.scrollBottomBound =
            "true";
    }

    updateScrollBottomButton();
}


/* =========================================================
   Dynamic document height monitoring
   ========================================================= */


/**
 * Initialize observers that detect changes
 * to dynamically loaded page content.
 */
function initializeScrollBottomObservers() {

    /**
     * Prevent duplicate observers.
     */
    if (
        window.__smkScrollBottomObserversInitialized
    ) {

        return;
    }


    window.__smkScrollBottomObserversInitialized =
        true;


    /**
     * Observe DOM changes.
     *
     * This catches dynamic replacement of
     * #dynamic-content-container.
     */
    const mutationObserver =
        new MutationObserver(
            () => {

                requestAnimationFrame(
                    () => {

                        updateScrollBottomButton();

                    }
                );
            }
        );


    mutationObserver.observe(
        document.body,
        {
            childList: true,
            subtree: true
        }
    );


    /**
     * Observe actual layout size changes.
     *
     * This catches document height changes
     * that do not necessarily trigger a scroll event.
     */
    if (
        typeof ResizeObserver !==
        "undefined"
    ) {

        const resizeObserver =
            new ResizeObserver(
                () => {

                    requestAnimationFrame(
                        () => {

                            updateScrollBottomButton();

                        }
                    );
                }
            );


        resizeObserver.observe(
            document.documentElement
        );


        resizeObserver.observe(
            document.body
        );
    }


    /**
     * Recheck after all page resources are loaded.
     */
    window.addEventListener(
        "load",
        () => {

            updateScrollBottomButton();


            requestAnimationFrame(
                () => {

                    updateScrollBottomButton();

                }
            );


            setTimeout(
                updateScrollBottomButton,
                100
            );


            setTimeout(
                updateScrollBottomButton,
                300
            );


            setTimeout(
                updateScrollBottomButton,
                600
            );
        }
    );


    /**
     * Recheck when smooth scrolling has finished.
     */
    if (
        "onscrollend" in window
    ) {

        window.addEventListener(
            "scrollend",
            () => {

                updateScrollBottomButton();

            },
            {
                passive: true
            }
        );
    }
}


/* =========================================================
   Global events
   ========================================================= */


/**
 * Listen for scrolling.
 */
window.addEventListener(
    "scroll",
    () => {

        updateBackToTop();

        updateScrollBottomButton();

    },
    {
        passive: true
    }
);


/**
 * Listen for window size changes.
 */
window.addEventListener(
    "resize",
    () => {

        updateBackToTop();

        updateScrollBottomButton();

    }
);


/**
 * Expose language functions globally.
 */
window.applyLanguage =
    applyLanguageAsync;


window.toggleLanguage =
    toggleLanguage;


/* =========================================================
   Initial page setup
   ========================================================= */


/**
 * Initialize the page.
 */
document.addEventListener(
    "DOMContentLoaded",

    async () => {

        /**
         * Initialize the scroll-to-bottom button
         * before loading dynamic content.
         */
        initializeScrollBottomButton();


        /**
         * Start monitoring dynamic document height.
         */
        initializeScrollBottomObservers();


        const langButton =
            document.getElementById(
                "langToggle"
            );


        /**
         * Prevent duplicate language button listeners.
         */
        if (
            langButton &&
            !langButton.dataset.bound
        ) {

            langButton.addEventListener(
                "click",
                () => {

                    toggleLanguage();

                }
            );


            langButton.dataset.bound =
                "true";
        }


        /**
         * Apply the default language.
         */
        await applyLanguageAsync(
            getDefaultLanguage(),
            getPageTranslationKey()
        );


        /**
         * Perform final navigation checks
         * after all dynamic content has been loaded.
         */
        initializeScrollBottomButton();

        updateBackToTop();

        updateScrollBottomButton();


        /**
         * Additional checks for late layout changes.
         */
        requestAnimationFrame(
            () => {

                updateScrollBottomButton();

            }
        );


        setTimeout(
            () => {

                updateScrollBottomButton();

            },
            100
        );


        setTimeout(
            () => {

                updateScrollBottomButton();

            },
            500
        );
    }
);
