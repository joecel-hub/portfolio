// Single source of truth for the visitor's "reduce motion" OS setting.
// Read once at boot: modules decide up front whether to animate at all.
export const prefersReducedMotion =
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches
