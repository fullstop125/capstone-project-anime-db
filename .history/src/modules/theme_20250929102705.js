// Theme utilities and wiring
// Exports an initTheme() method to apply stored theme and wire delegated handlers
export function updateThemeToggleIcon(theme) {
  const el = document.getElementById('theme-toggle');
  if (!el) return;
  if (theme === 'light') el.innerHTML = '<i class="fas fa-sun"></i>';
  else el.innerHTML = '<i class="fas fa-moon"></i>';
}

export function applyTheme(theme) {
  const root = document.documentElement;
  if (!theme) return;
  if (theme === 'light') {
    root.classList.remove('dark');
    updateThemeToggleIcon('light');
  } else {
    root.classList.add('dark');
    updateThemeToggleIcon('dark');
  }
  try { localStorage.setItem('theme', theme); } catch (e) { /* ignore */ }
}

export function applyThemeClass(themeClass) {
  const root = document.documentElement;
  // remove previous theme-* classes
  Array.from(root.classList).forEach((cls) => { if (cls.startsWith('theme-')) root.classList.remove(cls); });
  if (themeClass) root.classList.add(themeClass);
  try { localStorage.setItem('themeClass', themeClass || ''); } catch (e) { /* ignore */ }
}

export function initTheme() {
  // Apply saved light/dark theme first
  const savedTheme = localStorage.getItem('theme') || 'dark';
  applyTheme(savedTheme);

  // delegated click handling so theme toggle works even if element wasn't present at init
  document.addEventListener('click', (e) => {
    const toggle = e.target.closest && e.target.closest('#theme-toggle');
    if (!toggle) return;
    const root = document.documentElement;
    const isDark = root.classList.contains('dark');
    const newTheme = isDark ? 'light' : 'dark';
    applyTheme(newTheme);
    toggle.classList.add('pulse');
    setTimeout(() => toggle.classList.remove('pulse'), 520);
  });

  // delegated swatch clicks
  document.addEventListener('click', (e) => {
    const sw = e.target.closest && e.target.closest('.theme-swatch');
    if (!sw) return;
    const t = sw.dataset.theme;
    if (t) {
      applyThemeClass(t);
      // small toast helper may not exist here; try to call a global showToast if available
      try { if (typeof showToast === 'function') showToast('Theme applied', 1200); } catch (err) { /* ignore */ }
    }
  });

  // Apply saved theme class if present
  const savedThemeClass = localStorage.getItem('themeClass');
  if (savedThemeClass) applyThemeClass(savedThemeClass);
}

export default { initTheme, applyTheme, applyThemeClass, updateThemeToggleIcon };
