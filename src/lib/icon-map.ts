/** Maps the data layer's icon names to Google Material Symbols names. */
const ICON_NAMES: Record<string, string> = {
  Newspaper: "newspaper",
  Activity: "monitoring",
  Users: "group",
  Swords: "compare_arrows",
  Megaphone: "campaign",
  Quote: "format_quote",
}

export function resolveIcon(name: string): string {
  return ICON_NAMES[name] ?? "insights"
}
