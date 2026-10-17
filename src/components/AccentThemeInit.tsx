'use client';

import { useEffect } from 'react';
import { applyAccentTheme, getStoredAccentColor, PRESET_ACCENT_THEMES } from '@/utils/theme';
import { db } from '@/utils/db';

export function AccentThemeInit() {
  useEffect(() => {
    // 1. Immediately apply cached color from localStorage for zero delay
    const initial = getStoredAccentColor();
    applyAccentTheme(initial.primary, initial.secondary);

    // 2. Hydrate from Cloudflare D1 PlatformSettings in background
    let mounted = true;
    (async () => {
      try {
        const settings = await db.getPlatformSettings();
        if (!mounted) return;
        if (settings.accentColor) {
          const matched = PRESET_ACCENT_THEMES.find(t => t.id === settings.accentTheme || t.primary.toLowerCase() === settings.accentColor?.toLowerCase());
          const sec = matched ? matched.secondary : settings.accentSecondary;
          applyAccentTheme(settings.accentColor, sec);
          localStorage.setItem('st_accent_color', settings.accentColor);
          if (settings.accentTheme) {
            localStorage.setItem('st_accent_theme', settings.accentTheme);
          }
        }
      } catch (err) {
        // Fall back gracefully to local preference
      }
    })();

    // 3. Listen for cross-tab or in-page custom events
    const handleSettingsUpdated = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.accentColor) {
        const sec = customEvent.detail.accentSecondary;
        applyAccentTheme(customEvent.detail.accentColor, sec);
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'st_accent_color' && e.newValue) {
        const initial = getStoredAccentColor();
        applyAccentTheme(initial.primary, initial.secondary);
      }
    };

    window.addEventListener('st_settings_updated', handleSettingsUpdated);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      mounted = false;
      window.removeEventListener('st_settings_updated', handleSettingsUpdated);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return null;
}
