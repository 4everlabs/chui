export const colors = {
  // Semantic neon palette (single source of truth for theme updates)
  primary: "#B86BFF", // neon purple
  secondary: "#FF35C9", // neon magenta
  accent: "#29F4FF", // neon cyan
  danger: "#FF3B30", // bright red

  textPrimary: "#F6F3FF",
  textSecondary: "#D8D2E8",
  textMuted: "#9A92B0",
  textInverted: "#1B1330",

  surfaceBorder: "#7A63A8",
  surfaceBorderMuted: "#5A536D",
  surfaceSelected: "#D4F8FF",

  success: "#47F6CB",
  warning: "#FFB020",
  error: "#FF3B30",

  incomingBubbleBorder: "#FF35C9",
  incomingBubbleBackground: "#FFD0F1",
  outgoingBubbleBorder: "#29F4FF",
  outgoingBubbleBackground: "#CFFFFF",
  systemBubbleBorder: "#B86BFF",
  systemBubbleBackground: "#E3D8FF",
  incomingMessageText: "#2B1035",
  outgoingMessageText: "#07323A",
  systemMessageText: "#20113A",

  // Backward-compatible aliases (prefer semantic names above in new code)
  red: "#FF3B30",
  teal: "#29F4FF",
  yellow: "#FF35C9",
  white: "#F6F3FF",
  gray100: "#F6F3FF",
  gray300: "#D8D2E8",
  gray500: "#9A92B0",
  gray700: "#5A536D",
} as const;

export const spacing = {
  xs: 1,
  sm: 2,
  md: 3,
} as const;

export const viewport = {
  minWidth: 80,
  minHeight: 20,
} as const;

export const sizes = {
  inputWidth: 24,
  authInputWidth: 30,
  authFormWidth: 48,
  authLabelWidth: 11,
  buttonSquare: 7,
  buttonWide: 9,
  buttonForm: 14,
  buttonTall: 5,
  buttonHeight: 3,
  bubbleMaxWidth: "75%",
} as const;
