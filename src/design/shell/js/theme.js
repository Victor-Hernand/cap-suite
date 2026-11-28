import { writeItem } from './storage.js';

export function toggleTheme() {
  const dark = document.documentElement.classList.toggle('dark');
  const theme = dark ? 'dark' : 'light';
  writeItem('theme', theme);
  return theme;
}
