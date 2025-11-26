export type ThemeName = 'light' | 'dark'
export type ThemeSetting = ThemeName | 'auto'

export interface DesignTokens {
  color: {
    primary: string
    primaryHover: string
    primaryActive: string
    primaryMuted: string
    success: string
    successMuted: string
    warning: string
    warningMuted: string
    danger: string
    dangerMuted: string
    info: string
    infoMuted: string
  }
  text: {
    primary: string
    secondary: string
    tertiary: string
    inverse: string
    placeholder: string
  }
  surface: {
    base: string
    card: string
    raised: string
    overlay: string
  }
  border: {
    subtle: string
    strong: string
    focus: string
  }
  radius: {
    xs: number
    sm: number
    md: number
    lg: number
    full: number
  }
  spacing: {
    xxs: number
    xs: number
    sm: number
    md: number
    lg: number
    xl: number
    xxl: number
  }
  shadow: {
    soft: string
    card: string
    pop: string
  }
  typography: {
    fontFamily: string
    codeFontFamily: string
    size: {
      xs: number
      sm: number
      md: number
      lg: number
      xl: number
    }
    lineHeight: {
      tight: number
      normal: number
      relaxed: number
    }
    weight: {
      regular: number
      medium: number
      semibold: number
      bold: number
    }
  }
  motion: {
    fast: string
    normal: string
    slow: string
  }
  state: {
    focusRing: string
    focusColor: string
    hover: string
    active: string
    muted: string
  }
}

const baseTypography = {
  fontFamily:
    "'SF Pro Display', 'Poppins', 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', system-ui, -apple-system, sans-serif",
  codeFontFamily: "'SFMono-Regular', 'JetBrains Mono', 'Fira Code', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  size: {
    xs: 12,
    sm: 13,
    md: 14,
    lg: 16,
    xl: 18,
  },
  lineHeight: {
    tight: 1.3,
    normal: 1.5,
    relaxed: 1.7,
  },
  weight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
}

const baseSpacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
}

const baseRadius = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  full: 999,
}

export const lightTokens: DesignTokens = {
  color: {
    primary: '#3370ff',
    primaryHover: '#4a86ff',
    primaryActive: '#1f64ff',
    primaryMuted: '#e8f0ff',
    success: '#22c55e',
    successMuted: '#e8f7ef',
    warning: '#f59e0b',
    warningMuted: '#fdf3e4',
    danger: '#ef4444',
    dangerMuted: '#fdecec',
    info: '#0ea5e9',
    infoMuted: '#e0f7ff',
  },
  text: {
    primary: '#111827',
    secondary: '#4b5563',
    tertiary: '#6b7280',
    inverse: '#f8fafc',
    placeholder: '#9ca3af',
  },
  surface: {
    base: '#f6f8fb',
    card: '#ffffff',
    raised: '#edf2ff',
    overlay: 'rgba(15, 23, 42, 0.72)',
  },
  border: {
    subtle: '#e5e7eb',
    strong: '#cbd5e1',
    focus: 'rgba(51, 112, 255, 0.5)',
  },
  radius: baseRadius,
  spacing: baseSpacing,
  shadow: {
    soft: '0 4px 20px rgba(15, 23, 42, 0.06)',
    card: '0 10px 30px rgba(15, 23, 42, 0.08)',
    pop: '0 18px 40px rgba(15, 23, 42, 0.14)',
  },
  typography: baseTypography,
  motion: {
    fast: '180ms cubic-bezier(0.4, 0, 0.2, 1)',
    normal: '220ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '320ms cubic-bezier(0.4, 0, 0.2, 1)',
  },
  state: {
    focusRing: '0 0 0 3px rgba(51, 112, 255, 0.25)',
    focusColor: 'rgba(51, 112, 255, 0.35)',
    hover: '#f2f6ff',
    active: '#e5edff',
    muted: '#eef2f7',
  },
}

export const darkTokens: DesignTokens = {
  color: {
    primary: '#5c8aff',
    primaryHover: '#7aa2ff',
    primaryActive: '#3b6dff',
    primaryMuted: '#1f2a44',
    success: '#34d399',
    successMuted: '#123227',
    warning: '#fbbf24',
    warningMuted: '#3a2a0f',
    danger: '#f87171',
    dangerMuted: '#3b1215',
    info: '#38bdf8',
    infoMuted: '#0b2531',
  },
  text: {
    primary: '#e5e7eb',
    secondary: '#cbd5e1',
    tertiary: '#94a3b8',
    inverse: '#0b1222',
    placeholder: '#64748b',
  },
  surface: {
    base: '#0f172a',
    card: '#111827',
    raised: '#162036',
    overlay: 'rgba(9, 12, 17, 0.75)',
  },
  border: {
    subtle: '#1f2937',
    strong: '#334155',
    focus: 'rgba(92, 138, 255, 0.5)',
  },
  radius: baseRadius,
  spacing: baseSpacing,
  shadow: {
    soft: '0 8px 30px rgba(0, 0, 0, 0.28)',
    card: '0 16px 40px rgba(0, 0, 0, 0.32)',
    pop: '0 22px 60px rgba(0, 0, 0, 0.4)',
  },
  typography: baseTypography,
  motion: {
    fast: '180ms cubic-bezier(0.32, 0, 0.67, 1)',
    normal: '220ms cubic-bezier(0.32, 0, 0.67, 1)',
    slow: '340ms cubic-bezier(0.32, 0, 0.67, 1)',
  },
  state: {
    focusRing: '0 0 0 3px rgba(92, 138, 255, 0.35)',
    focusColor: 'rgba(92, 138, 255, 0.55)',
    hover: '#1f2937',
    active: '#22304a',
    muted: '#111827',
  },
}

export const themes: Record<ThemeName, DesignTokens> = {
  light: lightTokens,
  dark: darkTokens,
}

export const themeOptions: ThemeName[] = ['light', 'dark']

const px = (value: number) => `${value}px`

export const tokensToCssVars = (tokens: DesignTokens) => {
  const vars: Record<string, string> = {
    '--color-primary': tokens.color.primary,
    '--color-primary-hover': tokens.color.primaryHover,
    '--color-primary-active': tokens.color.primaryActive,
    '--color-primary-muted': tokens.color.primaryMuted,
    '--color-success': tokens.color.success,
    '--color-success-muted': tokens.color.successMuted,
    '--color-warning': tokens.color.warning,
    '--color-warning-muted': tokens.color.warningMuted,
    '--color-danger': tokens.color.danger,
    '--color-danger-muted': tokens.color.dangerMuted,
    '--color-info': tokens.color.info,
    '--color-info-muted': tokens.color.infoMuted,

    '--text-primary': tokens.text.primary,
    '--text-secondary': tokens.text.secondary,
    '--text-tertiary': tokens.text.tertiary,
    '--text-inverse': tokens.text.inverse,
    '--text-placeholder': tokens.text.placeholder,

    '--surface-base': tokens.surface.base,
    '--surface-card': tokens.surface.card,
    '--surface-raised': tokens.surface.raised,
    '--surface-overlay': tokens.surface.overlay,

    '--border-subtle': tokens.border.subtle,
    '--border-strong': tokens.border.strong,
    '--border-focus': tokens.border.focus,

    '--radius-xs': px(tokens.radius.xs),
    '--radius-sm': px(tokens.radius.sm),
    '--radius-md': px(tokens.radius.md),
    '--radius-lg': px(tokens.radius.lg),
    '--radius-full': px(tokens.radius.full),

    '--space-xxs': px(tokens.spacing.xxs),
    '--space-xs': px(tokens.spacing.xs),
    '--space-sm': px(tokens.spacing.sm),
    '--space-md': px(tokens.spacing.md),
    '--space-lg': px(tokens.spacing.lg),
    '--space-xl': px(tokens.spacing.xl),
    '--space-xxl': px(tokens.spacing.xxl),

    '--shadow-soft': tokens.shadow.soft,
    '--shadow-card': tokens.shadow.card,
    '--shadow-pop': tokens.shadow.pop,

    '--font-family': tokens.typography.fontFamily,
    '--font-family-code': tokens.typography.codeFontFamily,
    '--font-size-xs': px(tokens.typography.size.xs),
    '--font-size-sm': px(tokens.typography.size.sm),
    '--font-size-md': px(tokens.typography.size.md),
    '--font-size-lg': px(tokens.typography.size.lg),
    '--font-size-xl': px(tokens.typography.size.xl),
    '--line-height-tight': tokens.typography.lineHeight.tight.toString(),
    '--line-height-normal': tokens.typography.lineHeight.normal.toString(),
    '--line-height-relaxed': tokens.typography.lineHeight.relaxed.toString(),

    '--font-weight-regular': tokens.typography.weight.regular.toString(),
    '--font-weight-medium': tokens.typography.weight.medium.toString(),
    '--font-weight-semibold': tokens.typography.weight.semibold.toString(),
    '--font-weight-bold': tokens.typography.weight.bold.toString(),

    '--motion-fast': tokens.motion.fast,
    '--motion-normal': tokens.motion.normal,
    '--motion-slow': tokens.motion.slow,

    '--state-hover': tokens.state.hover,
    '--state-active': tokens.state.active,
    '--state-muted': tokens.state.muted,
    '--focus-ring': tokens.state.focusRing,
    '--focus-color': tokens.state.focusColor,
  }

  const elementPlusVars: Record<string, string> = {
    '--el-color-primary': tokens.color.primary,
    '--el-color-primary-light-3': tokens.color.primaryHover,
    '--el-color-primary-light-5': tokens.color.primaryMuted,
    '--el-color-primary-dark-2': tokens.color.primaryActive,
    '--el-color-success': tokens.color.success,
    '--el-color-warning': tokens.color.warning,
    '--el-color-danger': tokens.color.danger,
    '--el-color-info': tokens.color.info,
    '--el-text-color-primary': tokens.text.primary,
    '--el-text-color-regular': tokens.text.secondary,
    '--el-text-color-placeholder': tokens.text.placeholder,
    '--el-bg-color': tokens.surface.card,
    '--el-bg-color-page': tokens.surface.base,
    '--el-bg-color-overlay': tokens.surface.overlay,
    '--el-border-color': tokens.border.subtle,
    '--el-border-color-light': tokens.border.strong,
    '--el-border-color-lighter': tokens.border.subtle,
    '--el-border-radius-base': px(tokens.radius.sm),
    '--el-border-radius-small': px(tokens.radius.xs),
    '--el-border-radius-round': px(tokens.radius.full),
    '--el-box-shadow': tokens.shadow.soft,
    '--el-box-shadow-light': tokens.shadow.card,
    '--el-box-shadow-lighter': tokens.shadow.pop,
    '--el-font-size-base': px(tokens.typography.size.md),
    '--el-font-size-small': px(tokens.typography.size.sm),
    '--el-font-size-large': px(tokens.typography.size.lg),
  }

  return { ...vars, ...elementPlusVars }
}

export const resolveThemeName = (setting: ThemeSetting): ThemeName => {
  if (setting === 'auto' && typeof window !== 'undefined') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    return prefersDark ? 'dark' : 'light'
  }
  return setting === 'dark' ? 'dark' : 'light'
}

export const applyTheme = (theme: ThemeName) => {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  const vars = tokensToCssVars(themes[theme])

  Object.entries(vars).forEach(([key, value]) => {
    root.style.setProperty(key, value)
  })

  root.dataset.theme = theme
  root.classList.toggle('dark', theme === 'dark')
  root.style.setProperty('color-scheme', theme === 'dark' ? 'dark' : 'light')
}
