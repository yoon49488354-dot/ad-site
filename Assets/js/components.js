(function () {
  const path = window.location.pathname.toLowerCase();

  // 각 페이지 식별
  const isSalaryPage = path.endsWith("salary-calculator.html");
  const isParttimePage = path.endsWith("parttime-calculator.html");
  const isRetirementPage = path.endsWith("retirement-calculator.html");
  const isAreaPage = path.endsWith("area-calculator.html");
  const isDiscountPage = path.endsWith("discount-calculator.html");
  const isPercentagePage = path.endsWith("percentage-calculator.html");
  const isDutchpayPage = path.endsWith("dutchpay-calculator.html");
  const isPxRemPage = path.endsWith("px-rem-calculator.html");
  const isUnitPage = path.endsWith("unit-converter.html");
  const isVolumePage = path.endsWith("volume-calculator.html");
  const isSpeedPage = path.endsWith("speed-calculator.html");
  const isDataSizePage = path.endsWith("data-size-calculator.html");

  const isSubPage = isSalaryPage || isParttimePage || isRetirementPage ||
    isAreaPage || isDiscountPage || isPercentagePage || isDutchpayPage ||
    isPxRemPage || isUnitPage || isVolumePage || isSpeedPage || isDataSizePage;
  const isHomePage = !isSubPage || path.endsWith("index.html") || path.endsWith("/");

  // 카테고리 활성 그룹 확인
  const isCalcGroupActive = isSalaryPage || isParttimePage || isRetirementPage;
  const isLifeGroupActive = isAreaPage || isDiscountPage || isPercentagePage || isDutchpayPage;
  const isDevGroupActive = isPxRemPage || isUnitPage || isVolumePage || isSpeedPage || isDataSizePage;

  // 헤더 렌더링
  const header = document.querySelector('[data-shared-component="header"]');
  if (header) {
    header.outerHTML = `
      <header class="site-header">
        <div class="container site-header__inner">
          <div class="site-header__brand-group">
            <a class="brand" href="index.html" aria-label="세상의 모든 계산기 홈">
              <span class="brand__icon" aria-hidden="true">∑</span>
              <span>세상의 모든 <strong>계산기</strong></span>
            </a>
            <span class="site-header__tagline">일상의 모든 계산을 한곳에서</span>
          </div>

          <nav class="site-nav" aria-label="주요 메뉴">
            <ul class="site-nav__list">
              <!-- 홈 메뉴 -->
              <li class="site-nav__item">
                <a href="index.html" class="site-nav__link${isHomePage ? ' is-current' : ''}">홈</a>
              </li>

              <!-- 1. 계산도구 -->
              <li class="site-nav__item site-nav__item--dropdown">
                <details class="site-nav__details">
                  <summary class="site-nav__summary${isCalcGroupActive ? ' is-current' : ''}">
                    <span>계산도구</span>
                    <svg class="site-nav__chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </summary>
                  <div class="site-nav__dropdown-menu">
                    <ul>
                      <li><a href="salary-calculator.html"${isSalaryPage ? ' class="is-current"' : ''}>월급·연봉</a></li>
                      <li><a href="parttime-calculator.html"${isParttimePage ? ' class="is-current"' : ''}>아르바이트</a></li>
                      <li><a href="retirement-calculator.html"${isRetirementPage ? ' class="is-current"' : ''}>퇴직금</a></li>
                    </ul>
                  </div>
                </details>
              </li>

              <!-- 2. 생활계산 -->
              <li class="site-nav__item site-nav__item--dropdown">
                <details class="site-nav__details">
                  <summary class="site-nav__summary${isLifeGroupActive ? ' is-current' : ''}">
                    <span>생활계산</span>
                    <svg class="site-nav__chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </summary>
                  <div class="site-nav__dropdown-menu">
                    <ul>
                      <li><a href="area-calculator.html"${isAreaPage ? ' class="is-current"' : ''}>평수</a></li>
                      <li><a href="discount-calculator.html"${isDiscountPage ? ' class="is-current"' : ''}>할인율</a></li>
                      <li><a href="percentage-calculator.html"${isPercentagePage ? ' class="is-current"' : ''}>퍼센트</a></li>
                      <li><a href="dutchpay-calculator.html"${isDutchpayPage ? ' class="is-current"' : ''}>더치페이</a></li>
                    </ul>
                  </div>
                </details>
              </li>

              <!-- 3. 개발도구 -->
              <li class="site-nav__item site-nav__item--dropdown">
                <details class="site-nav__details">
                  <summary class="site-nav__summary${isDevGroupActive ? ' is-current' : ''}">
                    <span>개발도구</span>
                    <svg class="site-nav__chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </summary>
                  <div class="site-nav__dropdown-menu">
                    <ul>
                      <li><a href="px-rem-calculator.html"${isPxRemPage ? ' class="is-current"' : ''}>PX·REM</a></li>
                      <li><a href="unit-converter.html"${isUnitPage || isVolumePage || isSpeedPage || isDataSizePage ? ' class="is-current"' : ''}>단위 변환</a></li>
                    </ul>
                  </div>
                </details>
              </li>
            </ul>
          </nav>
        </div>
      </header>`;

    // 드롭다운 마우스 호버 및 외부 클릭 인터랙션
    const detailsList = document.querySelectorAll(".site-nav__details");
    detailsList.forEach((details) => {
      let closeTimer = null;
      details.addEventListener("mouseenter", () => {
        if (window.innerWidth > 760) {
          clearTimeout(closeTimer);
          detailsList.forEach((other) => {
            if (other !== details) other.removeAttribute("open");
          });
          details.setAttribute("open", "");
        }
      });
      details.addEventListener("mouseleave", () => {
        if (window.innerWidth > 760) {
          closeTimer = setTimeout(() => {
            details.removeAttribute("open");
          }, 150);
        }
      });
    });

    // 외부 클릭 시 열린 드롭다운 닫기
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".site-nav__details")) {
        detailsList.forEach((details) => details.removeAttribute("open"));
      }
    });
  }

  // 푸터 렌더링
  const footer = document.querySelector('[data-shared-component="footer"]');
  if (footer) {
    footer.outerHTML = `
      <footer class="site-footer">
        <div class="container site-footer__container">
          <!-- 1. 푸터 상단 -->
          <div class="site-footer__top">
            <div class="site-footer__brand">
              <a class="brand" href="index.html" aria-label="세상의 모든 계산기 홈">
                <span class="brand__icon" aria-hidden="true">∑</span>
                <span>세상의 모든 <strong>계산기</strong></span>
              </a>
            </div>
            <p class="site-footer__slogan">일상에 필요한 계산을 더 쉽게</p>
          </div>

          <!-- 2. 푸터 중앙 (카테고리 네비게이션) -->
          <div class="site-footer__middle">
            <nav class="site-footer__nav" aria-label="사이트 맵">
              <div class="site-footer__col">
                <h3 class="site-footer__col-title">계산 도구</h3>
                <ul class="site-footer__links">
                  <li><a href="salary-calculator.html">월급·연봉</a></li>
                  <li><a href="parttime-calculator.html">아르바이트</a></li>
                  <li><a href="retirement-calculator.html">퇴직금</a></li>
                </ul>
              </div>
              <div class="site-footer__col">
                <h3 class="site-footer__col-title">생활 계산</h3>
                <ul class="site-footer__links">
                  <li><a href="area-calculator.html">평수·㎡</a></li>
                  <li><a href="discount-calculator.html">할인율</a></li>
                  <li><a href="percentage-calculator.html">퍼센트</a></li>
                  <li><a href="dutchpay-calculator.html">더치페이</a></li>
                </ul>
              </div>
              <div class="site-footer__col">
                <h3 class="site-footer__col-title">개발 도구</h3>
                <ul class="site-footer__links">
                  <li><a href="px-rem-calculator.html">PX·REM</a></li>
                  <li><a href="unit-converter.html">단위 변환</a></li>
                </ul>
              </div>
              <div class="site-footer__col">
                <h3 class="site-footer__col-title">고객 지원</h3>
                <ul class="site-footer__links">
                  <li><a href="#none" data-placeholder="사이트 소개">사이트 소개</a></li>
                  <li><a href="#none" data-placeholder="문의하기">문의하기</a></li>
                  <li><a href="#none" data-placeholder="이용 가이드">이용 가이드</a></li>
                </ul>
              </div>
            </nav>
          </div>

          <!-- 3. 푸터 하단 -->
          <div class="site-footer__bottom">
            <div class="site-footer__policy-wrap">
              <ul class="site-footer__policies">
                <li><a href="#none" data-placeholder="개인정보처리방침">개인정보처리방침</a></li>
                <li><span class="site-footer__divider" aria-hidden="true">·</span></li>
                <li><a href="#none" data-placeholder="이용약관">이용약관</a></li>
                <li><span class="site-footer__divider" aria-hidden="true">·</span></li>
                <li><a href="#none" data-placeholder="면책조항">면책조항</a></li>
              </ul>
              <p class="site-footer__disclaimer">본 사이트에서 제공하는 계산 결과는 참고용이며, 실제 결과와 차이가 있을 수 있습니다.</p>
            </div>
            <p class="site-footer__copyright">© 2026 세상의 모든 계산기. All rights reserved.</p>
          </div>
        </div>
      </footer>
      <button type="button" class="back-to-top-btn" id="backToTopBtn" aria-label="페이지 맨 위로 이동">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <polyline points="18 15 12 9 6 15"></polyline>
        </svg>
      </button>`;

    // TOP 버튼 스크롤 반응 및 클릭 이벤트
    const topBtn = document.getElementById("backToTopBtn");
    if (topBtn) {
      window.addEventListener("scroll", () => {
        if (window.scrollY > 200) {
          topBtn.classList.add("is-visible");
        } else {
          topBtn.classList.remove("is-visible");
        }
      }, { passive: true });

      topBtn.addEventListener("click", () => {
        window.scrollTo({
          top: 0,
          behavior: "smooth"
        });
      });
    }

    // 미제작 페이지 링크 클릭 시 토스트 알림 안내
    const placeholderLinks = document.querySelectorAll('.site-footer a[data-placeholder]');
    let toastTimer = null;
    placeholderLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const featureName = link.getAttribute("data-placeholder");
        showToast(`${featureName} 서비스는 준비 중입니다.`);
      });
    });

    function showToast(message) {
      let toast = document.getElementById("siteToast");
      if (!toast) {
        toast = document.createElement("div");
        toast.id = "siteToast";
        toast.className = "site-toast";
        toast.setAttribute("role", "status");
        toast.setAttribute("aria-live", "polite");
        document.body.appendChild(toast);
      }
      toast.textContent = message;
      toast.classList.add("is-show");
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => {
        toast.classList.remove("is-show");
      }, 2200);
    }
  }
})();
