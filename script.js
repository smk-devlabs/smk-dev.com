document.addEventListener("DOMContentLoaded", () => {
  const langButton = document.getElementById("langToggle");
  let currentLang = localStorage.getItem("smk-language");

  // 저장된 언어가 없으면 시스템 언어 확인
  if (!currentLang) {
    const systemLang = navigator.language || navigator.userLanguage;
    currentLang = systemLang.toLowerCase().startsWith("ko") ? "ko" : "en";
  }

  function applyLanguage(lang) {
    // 1. 메인/푸터 등 data-ko 속성이 있는 일반 요소 처리
    document.querySelectorAll("[data-ko]").forEach((element) => {
      if (lang === "ko") {
        element.innerHTML = element.dataset.ko;
      } else {
        if (element.dataset.en) {
          element.innerHTML = element.dataset.en;
        }
      }
    });

    // 2. 법적 문서 페이지 내의 섹션(sectionKo, sectionEn) 처리
    const sectionKo = document.getElementById("sectionKo");
    const sectionEn = document.getElementById("sectionEn");
    if (sectionKo && sectionEn) {
      if (lang === "ko") {
        sectionKo.classList.add("active");
        sectionEn.classList.remove("active");
      } else {
        sectionKo.classList.remove("active");
        sectionEn.classList.add("active");
      }
    }

    // 3. 법적 문서 페이지 내의 '홈으로 가기' 버튼 텍스트 처리
    const homeBtnText = document.getElementById("homeBtnText");
    if (homeBtnText) {
      homeBtnText.textContent = lang === "ko" ? "홈으로 가기" : "Back to Home";
    }

    document.documentElement.lang = lang;

    // 현재 언어가 한국어면 버튼에 'English' 표시, 영어면 '한국어' 표시
    if (langButton) {
      langButton.innerText = lang === "ko" ? "EN" : "KR";
    }

    localStorage.setItem("smk-language", lang);
  }

  // 최초 실행
  applyLanguage(currentLang);

  // 버튼 클릭 이벤트
  if (langButton) {
    langButton.addEventListener("click", () => {
      currentLang = currentLang === "ko" ? "en" : "ko";
      applyLanguage(currentLang);
    });
  }
});
