// blocked/blocked.js — Logic for the blocked page

(async function () {
  // 1. Extract which site was blocked from the URL params
  const params = new URLSearchParams(window.location.search);
  const blockedSite = params.get('site') || 'a distracting site';

  // Display the blocked site name
  const siteNameEl = document.getElementById('blocked-site-name');
  const prettyName = blockedSite.replace(/\.(com|org|net|io|co)$/i, '')
    .replace(/\./g, ' ')
    .replace(/^./, (c) => c.toUpperCase());
  siteNameEl.textContent = `You tried to visit ${prettyName}`;

  // 2. Load user data — wallpaper + focus text
  const data = await chrome.storage.local.get(['user', 'dailyFocus']);

  // Wallpaper
  const wallpaperEl = document.getElementById('wallpaper');
  if (data.user?.wallpaper) {
    wallpaperEl.style.backgroundImage = `url(${data.user.wallpaper})`;
  } else {
    wallpaperEl.style.backgroundImage = `url('../assets/default-wallpaper.jpg')`;
  }

  // Focus text
  const focusCard = document.getElementById('blocked-focus-card');
  const focusTextEl = document.getElementById('blocked-focus-text');
  if (data.dailyFocus?.text) {
    focusTextEl.textContent = `"${data.dailyFocus.text}"`;
    focusCard.style.display = 'block';
  } else {
    focusCard.style.display = 'none';
  }

  // 3. Disable Focus Mode button
  const disableBtn = document.getElementById('disable-focus-btn');
  disableBtn.addEventListener('click', async () => {
    disableBtn.textContent = 'Disabling...';
    disableBtn.disabled = true;

    chrome.runtime.sendMessage({ type: 'DISABLE_FOCUS_MODE' }, (response) => {
      if (response?.success) {
        // Go back or open a new tab
        if (window.history.length > 1) {
          window.history.back();
        } else {
          window.location.href = 'chrome://newtab';
        }
      } else {
        disableBtn.textContent = 'Disable Focus Mode';
        disableBtn.disabled = false;
      }
    });
  });
})();
