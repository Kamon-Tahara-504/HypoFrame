/** 初回描画前に html に theme 用 class を付け、フラッシュを防ぐスクリプト */
export const themeScript = `
(function() {
  try {
    var s = localStorage.getItem('hypoframe-theme');
    if (s === 'dark') { document.documentElement.classList.add('dark'); document.documentElement.classList.remove('light'); }
    else if (s === 'light') { document.documentElement.classList.add('light'); document.documentElement.classList.remove('dark'); }
    else if (window.matchMedia('(prefers-color-scheme: dark)').matches) { document.documentElement.classList.add('dark'); document.documentElement.classList.remove('light'); }
    else { document.documentElement.classList.add('light'); document.documentElement.classList.remove('dark'); }
  } catch (e) { if (typeof console !== 'undefined' && console.warn) console.warn('Theme script error:', e); }
})();
`;

