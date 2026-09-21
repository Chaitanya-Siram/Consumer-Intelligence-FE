import { create } from 'zustand'

export const useThemes = create((set) => {
  const initialTheme = typeof window !== 'undefined' ? (localStorage.getItem('theme') || 'light') : 'light';
  // setDark/toggleTheme both apply data-theme, but nothing applied it for this
  // initial read — a page load (or deep link) after a prior toggle rendered in
  // light CSS while the toggle UI itself already showed dark. Match on load too.
  if (typeof window !== 'undefined') {
    document.documentElement.setAttribute('data-theme', initialTheme);
  }
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
