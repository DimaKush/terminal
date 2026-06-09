import { writable } from 'svelte/store';
import themes from '../../themes.json';
import type { Theme } from '../interfaces/theme';

const getRandomTheme = (): Theme => {
  const randomIndex = Math.floor(Math.random() * themes.length);
  return themes[randomIndex];
};

const defaultColorscheme: Theme = getRandomTheme();

export const theme = writable<Theme>(
  JSON.parse(
    localStorage.getItem('colorscheme') || JSON.stringify(defaultColorscheme),
  ),
);

theme.subscribe((value) => {
  localStorage.setItem('colorscheme', JSON.stringify(value));
});
