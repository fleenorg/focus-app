import type { ClockStyle } from "@/types/domain";

export const CLOCK_STYLE_OPTIONS: Array<{
  id: ClockStyle;
  label: string;
  description: string;
}> = [
  {
    id: "classic",
    label: "Classic digital",
    description: "Ring and numerals",
  },
  {
    id: "flip",
    label: "Vintage flip",
    description: "Split-flap desk clock",
  },
];
