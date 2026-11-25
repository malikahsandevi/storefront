import type { PaletteColors, StoreAppearance } from "./api";

// The theme engine: the admin-kept palette arrives as four role
// colours (primary / secondary / text / background) per mode. Every
// other tone the design needs — surfaces, hairlines, muted text, the
// primary's darker state, its glow — is DERIVED from those four with
// color-mix, so any of the admin's palettes in either mode renders
// correctly with zero colour copies in the frontend.

function varsFor(colors: PaletteColors): string {
  const { primary, secondary, text, background } = colors;
  return [
    `--sf-bg:${background}`,
    `--sf-bg-2:color-mix(in srgb, ${background} 93%, ${text})`,
    `--sf-surface:color-mix(in srgb, ${background} 89%, ${text})`,
    `--sf-surface-2:color-mix(in srgb, ${background} 82%, ${text})`,
    `--sf-line:color-mix(in srgb, ${text} 17%, ${background})`,
    `--sf-primary:${primary}`,
    `--sf-primary-dark:color-mix(in srgb, ${primary} 74%, #000)`,
    `--sf-secondary:${secondary}`,
    `--sf-text:${text}`,
    `--sf-muted:color-mix(in srgb, ${text} 72%, ${background})`,
    `--sf-muted-2:color-mix(in srgb, ${text} 50%, ${background})`,
    `--sf-glow:color-mix(in srgb, ${primary} 42%, transparent)`,
  ].join(";");
}

/** The <style> payload for the root layout: the active mode's
 *  variables on :root. For "system" mode the dark set is the default
 *  and the light set applies under the OS light preference — pure
 *  CSS, no client script, no flash. */
export function themeCss(appearance: StoreAppearance): string {
  const active = varsFor(appearance.colors);
  if (appearance.mode !== "system") return `:root{${active}}`;
  return `:root{${varsFor(appearance.colorsDark)}}@media (prefers-color-scheme: light){:root{${varsFor(appearance.colorsLight)}}}`;
}

/** The mode the page should declare: for "system" the dark set is
 *  what renders first, so components keyed to the attribute match
 *  the default paint. */
export function themeMode(appearance: StoreAppearance): string {
  return appearance.mode === "light" ? "light" : "dark";
}
