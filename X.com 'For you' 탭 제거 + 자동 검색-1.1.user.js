// ==UserScript==
// @name         X.com 'For you' 탭 제거 + 자동 검색
// @namespace    https://x.com
// @version      1.1
// @description  'For you'(추천) 탭만 삭제하고, 접속 시 filter:follows -filter:replies 검색으로 이동
// @match        https://x.com/*
// @match        https://twitter.com/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  /* ========== 1) 'For you' 탭만 제거 ========== */
  const isForYouLabel = (str) => {
    if (!str) return false;
    const s = str.trim().toLowerCase();
    // 필요한 언어 표현을 여기 추가
    return s === 'for you' || s.includes('추천');
  };

  const removeForYouTab = () => {
    document.querySelectorAll('[role="tablist"]').forEach(tablist => {
      tablist.querySelectorAll('[role="tab"]').forEach(tab => {
        const label = tab.getAttribute('aria-label') || tab.textContent;
        if (isForYouLabel(label)) tab.remove();
      });
    });
  };

  removeForYouTab();
  const mo = new MutationObserver(removeForYouTab);
  mo.observe(document.documentElement, { childList: true, subtree: true });
  setInterval(removeForYouTab, 2000); // 보정용(선택)

  /* ========== 2) 접속 시 자동 검색 이동 ========== */
  const queryString = 'filter:follows -filter:replies';
  const encodedQ = encodeURIComponent(queryString);

  const isOnDesiredSearch = () => {
    const url = new URL(location.href);
    const q = url.searchParams.get('q') || '';
    // 이미 원하는 쿼리면 true
    return decodeURIComponent(q).toLowerCase().includes('filter:follows')
        && decodeURIComponent(q).toLowerCase().includes('-filter:replies');
  };

  const shouldTriggerFromHere = () => {
    // 홈/루트에서만 자동 이동 (트윗/프로필 등은 방해하지 않음)
    const p = location.pathname.replace(/\/+$/, ''); // trailing slash 제거
    return p === '' || p === '/' || p === '/home' || p === '/explore';
  };

  const goSearch = () => {
    const target = `/search?q=${encodedQ}&src=typed_query&f=live`;
    if (!isOnDesiredSearch() && shouldTriggerFromHere()) {
      // 같은 세션에서 한 번만 자동 이동 (루프 방지)
      if (!sessionStorage.getItem('autoSearchDone')) {
        sessionStorage.setItem('autoSearchDone', '1');
        location.href = target;
      }
    }
  };

  // 초기 실행(약간의 지연으로 SPA 초기화 대기)
  setTimeout(goSearch, 300);

  // SPA 내 라우팅 대응: history 변경 감지
  const _pushState = history.pushState;
  history.pushState = function () {
    const ret = _pushState.apply(this, arguments);
    setTimeout(goSearch, 0);
    return ret;
  };
  window.addEventListener('popstate', () => setTimeout(goSearch, 0));
})();
