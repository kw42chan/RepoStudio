type Rgb = [number, number, number];

export type SlideGround = "light" | "dark" | "gradient";

export interface CarouselPalette {
  brandPrimary: string;
  brandSecondary: string;
  brandLight: string;
  brandDark: string;
  lightBg: string;
  lightBorder: string;
  darkBg: string;
}

export function parseHex(input: string): Rgb {
  const hex = input.trim().replace("#", "");
  const full =
    hex.length === 3
      ? hex
          .split("")
          .map((char) => char + char)
          .join("")
      : hex.padEnd(6, "0").slice(0, 6);
  const value = Number.parseInt(full, 16);
  if (Number.isNaN(value)) return [37, 99, 235];
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function toHex(rgb: Rgb): string {
  return `#${rgb.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}

function mix(from: Rgb, to: Rgb, amount: number): string {
  const mixed = from.map((channel, index) =>
    Math.round(channel + (to[index] - channel) * amount)
  ) as Rgb;
  return toHex(mixed);
}

export function carouselPalette(
  primary: string,
  secondary?: string
): CarouselPalette {
  const primaryRgb = parseHex(primary);
  const secondaryHex = toHex(parseHex(secondary || primary));
  const warm = primaryRgb[0] >= primaryRgb[2];
  const lightBg = warm ? "#F6F3EE" : "#F4F6F8";
  return {
    brandPrimary: toHex(primaryRgb),
    brandSecondary: secondaryHex,
    brandLight: secondaryHex,
    brandDark: mix(primaryRgb, [0, 0, 0], 0.3),
    lightBg,
    lightBorder: mix(parseHex(lightBg), [0, 0, 0], 0.08),
    darkBg: warm ? "#1A1918" : "#0F172A",
  };
}

export function slideGround(
  index: number,
  total: number,
  role: "cover" | "body" | "cta"
): SlideGround {
  if (role === "cover") return "light";
  if (role === "cta" || index === total - 1) return "gradient";
  if (index === 0) return "light";
  return index % 2 === 1 ? "dark" : "light";
}

export function brandMark(handle: string): { label: string; initial: string } {
  const trimmed = handle.trim() || "yourbrand";
  const bare = trimmed.replace(/^@/, "");
  const initial = (bare.match(/[a-z0-9]/i)?.[0] || "B").toUpperCase();
  return {
    label: trimmed.startsWith("@") ? trimmed : `@${bare}`,
    initial,
  };
}
