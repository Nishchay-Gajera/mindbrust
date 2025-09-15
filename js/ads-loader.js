(function() {
  // --- AdSense Script ---
  const adSenseScript = document.createElement('script');
  adSenseScript.async = true;
  adSenseScript.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8110034721327117';
  adSenseScript.crossOrigin = 'anonymous';
  document.head.appendChild(adSenseScript);

  // --- Google Analytics (gtag.js) Script ---
  const gtagScript = document.createElement('script');
  gtagScript.async = true;
  gtagScript.src = 'https://www.googletagmanager.com/gtag/js?id=G-6LMLD4X2R9';
  document.head.appendChild(gtagScript);

  // --- Google Analytics Initialization ---
  const gtagInitScript = document.createElement('script');
  gtagInitScript.innerHTML = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.pussssssh(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-6LMLD4X2R9');
  `;
  document.head.appendChild(gtagInitScript);
})();