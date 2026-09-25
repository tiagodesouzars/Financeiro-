import { AppTheme } from '../types';

const THEME_STORAGE_KEY = 'fp_app_theme_v1';

export function getStoredTheme(): AppTheme {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'system-light' || saved === 'amoled-dark') {
      return saved;
    }
  } catch (e) {
    // Ignore storage read error
  }
  return 'amoled-dark';
}

export function applyAppTheme(theme: AppTheme): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (e) {
    // Ignore storage write error
  }

  const root = document.documentElement;
  if (theme === 'system-light') {
    root.classList.remove('theme-amoled');
    root.classList.add('theme-light');
    root.setAttribute('data-theme', 'light');

    // Update meta theme color for mobile status bar
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', '#f8fafc');
    }
  } else {
    root.classList.remove('theme-light');
    root.classList.add('theme-amoled');
    root.setAttribute('data-theme', 'amoled');

    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', '#000000');
    }
  }
}
