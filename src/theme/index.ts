import {
  applyTheme as applyThemeTokens,
  resolveThemeName,
  themes,
  themeOptions,
  type ThemeName,
  type ThemeSetting,
  type DesignTokens,
} from "./tokens";

export type { ThemeName, ThemeSetting, DesignTokens } from "./tokens";
export { themes, themeOptions, resolveThemeName };

export const setThemeBySetting = (setting: ThemeSetting) => {
  const resolved = resolveThemeName(setting);
  applyThemeTokens(resolved);
  return resolved;
};

export const applyTheme = (theme: ThemeName) => {
  applyThemeTokens(theme);
  return theme;
};

export const getThemeTokens = (theme: ThemeName): DesignTokens => themes[theme];
