/**
 * Circular country flags (Iconify `circle-flags`) next to any country a label,
 * chart axis or sentence names.
 *
 * `countryIso(name)` maps a country name or common abbreviation to its
 * `circle-flags` code. Multi-country regions (LATAM, Europe, APAC) and words that
 * are also everyday nouns (Turkey, Georgia, Jordan, Chad) deliberately have none,
 * so a flag never appears where a country isn't meant.
 */
import { Icon } from "@iconify/react";

const ENTRIES = {
  "united states": "us", "united states of america": "us", usa: "us", us: "us", "u.s.": "us", "u.s.a.": "us",
  "united kingdom": "gb", uk: "gb", "u.k.": "gb", "great britain": "gb", britain: "gb",
  england: "gb-eng", scotland: "gb-sct", wales: "gb-wls",
  australia: "au", "new zealand": "nz", canada: "ca", ireland: "ie",
  germany: "de", france: "fr", italy: "it", spain: "es", portugal: "pt", netherlands: "nl", belgium: "be",
  switzerland: "ch", austria: "at", sweden: "se", norway: "no", denmark: "dk", finland: "fi", poland: "pl",
  greece: "gr", russia: "ru", ukraine: "ua",
  india: "in", china: "cn", japan: "jp", "south korea": "kr", singapore: "sg", "hong kong": "hk", taiwan: "tw",
  thailand: "th", vietnam: "vn", indonesia: "id", malaysia: "my", philippines: "ph", pakistan: "pk", bangladesh: "bd",
  "united arab emirates": "ae", uae: "ae", "saudi arabia": "sa", israel: "il", egypt: "eg",
  "south africa": "za", nigeria: "ng", kenya: "ke",
  brazil: "br", mexico: "mx", argentina: "ar", chile: "cl", colombia: "co", peru: "pe",
};

/** `circle-flags` code for a country name or abbreviation, or null. */
export function countryIso(name) {
  const key = String(name ?? "").trim().toLowerCase();
  return ENTRIES[key] ?? null;
}

export const flagUrl = (iso) => `https://api.iconify.design/circle-flags/${iso}.svg`;

/** A country's circular flag, sized to the text beside it. Renders nothing for a non-country. */
export function CountryFlag({ name, iso, size = 16, style }) {
  const code = iso || countryIso(name);
  if (!code) return null;
  return <Icon icon={`circle-flags:${code}`} width={size} height={size} style={{ flexShrink: 0, display: "inline-block", verticalAlign: "-0.2em", ...style }} aria-hidden="true" />;
}

/** A country name with its flag; a plain name when it isn't a country. */
export function CountryName({ name, size = 16, gap = 6 }) {
  const code = countryIso(name);
  if (!code) return <>{name}</>;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap }}>
      <CountryFlag iso={code} size={size} />
      <span>{name}</span>
    </span>
  );
}

// Longest names first so "United States" wins over "US"; case-sensitive so the
// pronoun "us" and the noun "china" are left alone. "New Mexico" is not Mexico.
const PROSE_NAMES = Object.keys(ENTRIES)
  .filter((k) => k.length > 3 && !k.includes("."))
  .map((k) => k.replace(/\b\w/g, (c) => c.toUpperCase()))
  .concat(["US", "UK", "USA", "UAE", "U.S.", "U.K."])
  .sort((a, b) => b.length - a.length);
const PROSE_RX = new RegExp(`(?<![\\w.]|New )(${[...new Set(PROSE_NAMES)].map((n) => n.replace(/\./g, "\\.")).join("|")})(?![\\w]|\\]|\\(| !\\[)`, "g");

/** Markdown with an inline flag image after every country it names. Text that is
 * already a markdown link, or is already followed by a flag, is left as it was. */
export function withCountryFlags(markdown) {
  const text = String(markdown ?? "");
  if (!text) return text;
  return text.replace(PROSE_RX, (match) => {
    const iso = countryIso(match);
    return iso ? `${match} ![](${flagUrl(iso)})` : match;
  });
}

/** A plain string with an inline flag after each country it names (tab labels,
 * table cells, banner text). Anything that isn't a string is returned untouched. */
export function FlagText({ text, size = 16 }) {
  if (typeof text !== "string" || !text) return text ?? null;
  const parts = [];
  let last = 0;
  for (const match of text.matchAll(PROSE_RX)) {
    const iso = countryIso(match[0]);
    if (!iso) continue;
    const end = match.index + match[0].length;
    parts.push(text.slice(last, end), <CountryFlag key={end} iso={iso} size={size} style={{ margin: "0 0.15em 0 0.3em" }} />);
    last = end;
  }
  if (!parts.length) return text;
  return <>{parts}{text.slice(last)}</>;
}

/** True for the flag images `withCountryFlags` emits, so a markdown renderer can size them. */
export const isFlagSrc = (src) => typeof src === "string" && src.startsWith("https://api.iconify.design/circle-flags/");
