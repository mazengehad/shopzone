import { Injectable, signal, effect } from '@angular/core';

export type Theme = 'dark' | 'light';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  theme = signal<Theme>('dark');

  constructor() {
    // Check local storage for saved theme, or default to dark
    const savedTheme = localStorage.getItem('shopzone-theme') as Theme | null;
    
    // Default to dark exactly as requested, fall back to preferred color scheme if none specified
    if (savedTheme) {
      this.theme.set(savedTheme);
    } else {
      const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
      this.theme.set(prefersLight ? 'light' : 'dark');
    }

    // Effect to apply the theme to the DOM whenever it changes
    effect(() => {
      const currentTheme = this.theme();
      localStorage.setItem('shopzone-theme', currentTheme);
      document.documentElement.setAttribute('data-theme', currentTheme);
    });
  }

  toggleTheme() {
    this.theme.update(current => current === 'dark' ? 'light' : 'dark');
  }
}
