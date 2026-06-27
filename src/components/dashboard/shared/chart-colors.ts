// Centralized chart colors mapped to the theme variables. Using oklch vars
// keeps charts consistent across light/dark automatically.
export const chartColors = {
  primary: "var(--chart-1)",
  secondary: "var(--chart-2)",
  tertiary: "var(--chart-3)",
  quaternary: "var(--chart-4)",
  quinary: "var(--chart-5)",
  muted: "var(--muted-foreground)",
  border: "var(--border)",
};

export const eventTypeMeta: Record<
  string,
  { label: string; color: string }
> = {
  sent: { label: "Sent", color: "var(--chart-1)" },
  delivered: { label: "Delivered", color: "var(--chart-3)" },
  open: { label: "Opened", color: "var(--chart-2)" },
  click: { label: "Clicked", color: "var(--chart-4)" },
  bounce: { label: "Bounced", color: "var(--chart-5)" },
  unsubscribe: { label: "Unsubscribed", color: "#a855f7" },
  complaint: { label: "Complaint", color: "#ef4444" },
};
