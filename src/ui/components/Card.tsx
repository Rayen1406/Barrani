import type { ReactNode } from "react";

export function Card({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "impostor";
  children: ReactNode;
}) {
  return <div className={`card card--${tone}`}>{children}</div>;
}
