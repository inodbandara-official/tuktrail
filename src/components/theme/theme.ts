export type ThemePreference = "system" | "light" | "dark";
export const THEME_COOKIE = "theme";

/**
 * Runs in <head> before first paint. Reads the cookie client-side so the root layout
 * never calls cookies() (which would make every route dynamic under cacheComponents).
 */
export const THEME_INIT_SCRIPT = `(function(){try{var m=document.cookie.match(/(?:^|; )${THEME_COOKIE}=(light|dark)/);if(m)document.documentElement.setAttribute("data-theme",m[1]);}catch(e){}})();`;

function readCookie(): ThemePreference {
  const m = document.cookie.match(new RegExp(`(?:^|; )${THEME_COOKIE}=(light|dark)`));
  return (m?.[1] as ThemePreference | undefined) ?? "system";
}

export function applyTheme(pref: ThemePreference) {
  const root = document.documentElement;
  if (pref === "system") {
    root.removeAttribute("data-theme");
    document.cookie = `${THEME_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
  } else {
    root.setAttribute("data-theme", pref);
    document.cookie = `${THEME_COOKIE}=${pref}; path=/; max-age=31536000; SameSite=Lax`;
  }
}

/** External-store adapter for useSyncExternalStore: the <html data-theme> attribute is the source of truth. */
export function subscribeTheme(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  // Dev Strict Mode can strip <html> attributes on remount; restore from the cookie.
  const pref = readCookie();
  if (pref !== "system" && document.documentElement.getAttribute("data-theme") !== pref) applyTheme(pref);
  return () => observer.disconnect();
}

export function getThemeSnapshot(): ThemePreference {
  const v = document.documentElement.getAttribute("data-theme");
  return v === "light" || v === "dark" ? v : "system";
}

export function getServerThemeSnapshot(): ThemePreference {
  return "system";
}
