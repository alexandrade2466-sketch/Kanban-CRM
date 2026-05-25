/**
 * Volt N' Vent — LeadConnector (GoHighLevel) chat widget loader
 * Update WIDGET_ID here if you create a new widget in GHL.
 * Look/feel (colors, greeting, hours) is configured in GoHighLevel:
 * Sites → Chat Widget → your widget → Style / Messaging tabs
 */
(function () {
  var WIDGET_ID = '6a0ba8d851fd5b9cc7eca6c2';
  var LOADED = false;

  function injectLayoutStyles() {
    if (document.getElementById('vnv-chat-layout')) return;
    var style = document.createElement('style');
    style.id = 'vnv-chat-layout';
    style.textContent =
      '@media (max-width: 767px){body{padding-bottom:5.75rem}' +
      '.vnv-mobile-call{left:1rem!important;right:auto!important;bottom:5.5rem!important;z-index:40!important}' +
      '}';
    document.head.appendChild(style);
  }

  function loadWidget() {
    if (LOADED) return;
    LOADED = true;
    var script = document.createElement('script');
    script.src = 'https://widgets.leadconnectorhq.com/loader.js';
    script.async = true;
    script.setAttribute('data-resources-url', 'https://widgets.leadconnectorhq.com/chat-widget/loader.js');
    script.setAttribute('data-widget-id', WIDGET_ID);
    script.setAttribute('data-source', 'WEB_USER');
    document.body.appendChild(script);
  }

  injectLayoutStyles();

  function scheduleLoad() {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(loadWidget, { timeout: 2500 });
    } else {
      window.addEventListener('load', function () {
        setTimeout(loadWidget, 1200);
      });
    }
  }

  if (document.readyState === 'complete') {
    scheduleLoad();
  } else {
    window.addEventListener('load', scheduleLoad);
  }
})();
