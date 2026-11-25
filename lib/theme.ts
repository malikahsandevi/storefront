import type { PaletteColors, StoreAppearance } from "./api";

// The theme engine: the admin-kept palette arrives as four role
// colours (primary / secondary / text / background) per mode. Every
// other tone the design needs — surfaces, hairlines, muted text, the
// primary's darker state, its glow — is DERIVED from those four with
// color-mix, so any of the admin's palettes in either mode renders
// correctly with zero colour copies in the frontend.

function varsFor(colors: PaletteColors, light: boolean): string {
  const { primary, secondary, text, background } = colors;
  // Ahsan's rule (2026-11-25): in LIGHT mode the design's grays —
  // panel surfaces, hairline borders, dividers, muted fills — are
  // #DBDBDB, anchored exactly. The gradient's second stop steps one
  // shade deeper off the same anchor so panels keep their depth.
  // Text tones are NOT grays: muted text keeps deriving from the
  // near-black text colour so it stays readable.
  const gray = light ? "#dbdbdb" : null;
  return [
    `--sf-bg:${background}`,
    `--sf-bg-2:${gray ? `color-mix(in srgb, ${gray} 45%, ${background})` : `color-mix(in srgb, ${background} 93%, ${text})`}`,
    `--sf-surface:${gray ?? `color-mix(in srgb, ${background} 89%, ${text})`}`,
    `--sf-surface-2:${gray ? `color-mix(in srgb, ${gray} 82%, ${text})` : `color-mix(in srgb, ${background} 82%, ${text})`}`,
    `--sf-line:${gray ?? `color-mix(in srgb, ${text} 17%, ${background})`}`,
    `--sf-primary:${primary}`,
    `--sf-primary-dark:color-mix(in srgb, ${primary} 74%, #000)`,
    `--sf-secondary:${secondary}`,
    `--sf-text:${text}`,
    `--sf-muted:color-mix(in srgb, ${text} 72%, ${background})`,
    `--sf-muted-2:color-mix(in srgb, ${text} 50%, ${background})`,
    `--sf-glow:color-mix(in srgb, ${primary} 42%, transparent)`,
  ].join(";");
}

/** The <style> payload for the root layout: BOTH modes' variable
 *  sets, keyed off the <html> data-mode attribute — the visitor's
 *  effective mode. That is the admin-kept mode by default, or the
 *  visitor's own saved header-switch choice when they have one
 *  (see themeBootScript). Token derivation stays in varsFor above,
 *  so the admin palette and the light-mode #DBDBDB rule behave
 *  identically whichever mode the attribute selects. */
export function themeCss(appearance: StoreAppearance): string {
  return (
    `:root[data-mode="dark"]{${varsFor(appearance.colorsDark, false)}}` +
    `:root[data-mode="light"]{${varsFor(appearance.colorsLight, true)}}`
  );
}

/** The pre-paint boot script for the root layout <head>: resolves
 *  the visitor's effective mode BEFORE first paint, in this order —
 *  (1) their saved header-switch choice (localStorage "sf-mode"),
 *  (2) the admin-kept mode, (3) admin "system" follows the OS via
 *  prefers-color-scheme — and stamps it on <html data-mode>, which
 *  is what themeCss keys off. The admin setting is never written
 *  from the storefront; a saved choice lives only in this
 *  visitor's browser and affects nobody else. */
export function themeBootScript(appearance: StoreAppearance): string {
  const admin = JSON.stringify(appearance.mode);
  return `(function(){try{var m=localStorage.getItem("sf-mode");if(m!=="dark"&&m!=="light"){m=null}if(!m){var a=${admin};m=a==="system"?(window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark"):a}document.documentElement.setAttribute("data-mode",m)}catch(e){}})();`;
}

/** The mode the page should declare: for "system" the dark set is
 *  what renders first, so components keyed to the attribute match
 *  the default paint. */
export function themeMode(appearance: StoreAppearance): string {
  return appearance.mode === "light" ? "light" : "dark";
}
