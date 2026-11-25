"use client";

import type { ClockStyle } from "@/types/domain";
import { ClassicClock } from "./ClassicClock";
import { FlipClock } from "./FlipClock";
import { KitchenClock } from "./KitchenClock";
import type { ClockFaceProps } from "./types";

export function ClockDisplay({ style, ...props }: ClockFaceProps & { style: ClockStyle }) {
  switch (style) {
    case "flip":
      return <FlipClock {...props} />;
    case "kitchen":
      return <KitchenClock {...props} />;
    default:
      return <ClassicClock {...props} />;
  }
}
