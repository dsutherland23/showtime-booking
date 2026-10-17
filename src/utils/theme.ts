export interface AccentTheme {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  hover: string;
  dark: string;
  description: string;
}

export const PRESET_ACCENT_THEMES: AccentTheme[] = [
  {
    id: 'gold',
    name: 'Imperial Gold',
    primary: '#d4af37',
    secondary: '#f5d061',
    hover: '#f3cf65',
    dark: '#aa841c',
    description: 'Classic Showtime Luxury Gold & Champagne',
  },
  {
    id: 'emerald',
    name: 'Caribbean Emerald',
    primary: '#10b981',
    secondary: '#34d399',
    hover: '#34d399',
    dark: '#059669',
    description: 'Vibrant Island Palm & Reggae Green',
  },
  {
    id: 'cyan',
    name: 'Tropical Aqua',
    primary: '#06b6d4',
    secondary: '#38bdf8',
    hover: '#22d3ee',
    dark: '#0891b2',
    description: 'Caribbean Ocean & Electric Cyan',
  },
  {
    id: 'purple',
    name: 'Royal Amethyst',
    primary: '#a855f7',
    secondary: '#c084fc',
    hover: '#c084fc',
    dark: '#7e22ce',
    description: 'Headline Stage Purple & Royalty',
  },
  {
    id: 'amber',
    name: 'Sunset Amber',
    primary: '#f59e0b',
    secondary: '#fbbf24',
    hover: '#fcd34d',
    dark: '#d97706',
    description: 'Warm Jamaican Sunset & Honey Amber',
  },
  {
    id: 'ruby',
    name: 'Carnival Crimson',
    primary: '#f43f5e',
    secondary: '#fb7185',
    hover: '#fda4af',
    dark: '#e11d48',
    description: 'High-Energy Carnival Red & Rose',
  },
  {
    id: 'blue',
    name: 'Sapphire Electric',
    primary: '#3b82f6',
    secondary: '#60a5fa',
    hover: '#93c5fd',
    dark: '#1d4ed8',
    description: 'Modern Electric Stage Blue',
  },
  {
    id: 'silver',
    name: 'Platinum Titanium',
    primary: '#94a3b8',
    secondary: '#cbd5e1',
    hover: '#e2e8f0',
    dark: '#64748b',
    description: 'High-Tech Sleek Chrome & Silver',
  },
];

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('');
  }
  const num = parseInt(clean, 16);
  if (isNaN(num)) return { r: 212, g: 175, b: 55 }; // Default gold fallback
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export function adjustLightness(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  const clamp = (v: number) => Math.min(255, Math.max(0, Math.round(v)));
  const nr = clamp(r + amount);
  const ng = clamp(g + amount);
  const nb = clamp(b + amount);
  return `#${((1 << 24) + (nr << 16) + (ng << 8) + nb).toString(16).slice(1)}`;
}

export function applyAccentTheme(primary: string, secondary?: string) {
  if (typeof window === 'undefined') return;
  const { r, g, b } = hexToRgb(primary);
  const sec = secondary || adjustLightness(primary, 40);
  const { r: sr, g: sg, b: sb } = hexToRgb(sec);
  const dark = adjustLightness(primary, -50);

  const root = document.documentElement;

  // Primary Accent Custom Properties
  root.style.setProperty('--accent', primary);
  root.style.setProperty('--accent-hover', sec);
  root.style.setProperty('--accent-dark', dark);
  root.style.setProperty('--accent-light', `rgba(${r}, ${g}, ${b}, 0.12)`);
  root.style.setProperty('--accent-gradient', `linear-gradient(135deg, ${sec} 0%, ${primary} 100%)`);

  // Gold aliases for backwards compatibility with existing UI components & text
  root.style.setProperty('--gold-primary', primary);
  root.style.setProperty('--gold-hover', sec);
  root.style.setProperty('--gold-dark', dark);
  root.style.setProperty('--gold-light', `rgba(${r}, ${g}, ${b}, 0.12)`);
  root.style.setProperty('--gold-gradient', `linear-gradient(135deg, ${sec} 0%, ${primary} 100%)`);
  root.style.setProperty('--gold-gradient-subtle', `linear-gradient(180deg, rgba(${r}, ${g}, ${b}, 0.05) 0%, rgba(${r}, ${g}, ${b}, 0.01) 100%)`);
  root.style.setProperty('--gold-text-gradient', `linear-gradient(135deg, #ffffff 0%, ${primary} 100%)`);

  // Dynamic Glows & Shadows
  root.style.setProperty('--glow-gold', `0 4px 20px rgba(${r}, ${g}, ${b}, 0.25)`);
  root.style.setProperty('--glow-gold-strong', `0 8px 32px rgba(${r}, ${g}, ${b}, 0.45)`);
  root.style.setProperty('--glow-sm', `0 2px 12px rgba(${r}, ${g}, ${b}, 0.15)`);
  root.style.setProperty('--border-color-hover', `rgba(${r}, ${g}, ${b}, 0.5)`);
  root.style.setProperty('--text-link', sec);
}

export function getStoredAccentColor(): { primary: string; secondary: string; themeId?: string } {
  if (typeof window === 'undefined') {
    return { primary: '#d4af37', secondary: '#f5d061', themeId: 'gold' };
  }
  const color = localStorage.getItem('st_accent_color') || '#d4af37';
  const themeId = localStorage.getItem('st_accent_theme') || 'gold';
  const matched = PRESET_ACCENT_THEMES.find(t => t.id === themeId || t.primary.toLowerCase() === color.toLowerCase());
  return {
    primary: matched ? matched.primary : color,
    secondary: matched ? matched.secondary : adjustLightness(color, 40),
    themeId: matched ? matched.id : 'custom',
  };
}
