import { create } from 'zustand'

export const useThemes = create((set) => {
  const initialTheme = typeof window !== 'undefined' ? (localStorage.getItem('theme') || 'light') : 'light';
  return {
    dark: initialTheme === 'dark',
    setDark: (isDark) => {
      const themeValue = isDark ? 'dark' : 'light';
      if (typeof window !== 'undefined') {
        document.documentElement.setAttribute('data-theme', themeValue);
        localStorage.setItem('theme', themeValue);
      }
      set({ dark: isDark });
    },
    toggleTheme: () => set((state) => {
      const nextDark = !state.dark;
      const themeValue = nextDark ? 'dark' : 'light';
      if (typeof window !== 'undefined') {
        document.documentElement.setAttribute('data-theme', themeValue);
        localStorage.setItem('theme', themeValue);
      }
      return { dark: nextDark };
    })
  }
})

export default useThemes;
