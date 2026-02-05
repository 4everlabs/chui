import {
  TextAttributes,
  TextRenderable,
  type RenderContext,
} from "@opentui/core";

export const colors = {
  red: "#E5534B",
  teal: "#2EC4B6",
  yellow: "#F4D35E",
  white: "#FFFFFF",
  gray100: "#E6E6E6",
  gray300: "#C2C2C2",
  gray500: "#888888",
  gray700: "#444444",
};

export const spacing = {
  xs: 1,
  sm: 2,
};

export const sizes = {
  inputWidth: 24,
  buttonSquare: 7,
  buttonWide: 9,
  buttonHeight: 3,
};

export type TextStyle = {
  fg: string;
  attributes?: number;
};

export const textStyles: Record<"heading" | "subheading" | "body" | "muted", TextStyle> = {
  heading: {
    fg: colors.teal,
    attributes: TextAttributes.BOLD,
  },
  subheading: {
    fg: colors.yellow,
    attributes: TextAttributes.BOLD,
  },
  body: {
    fg: colors.gray300,
  },
  muted: {
    fg: colors.gray500,
  },
};

export function createText(
  renderer: RenderContext,
  content: string,
  style: TextStyle,
) {
  return new TextRenderable(renderer, {
    content,
    fg: style.fg,
    attributes: style.attributes,
  });
}

export function createHeadingText(renderer: RenderContext, content: string) {
  return createText(renderer, content, textStyles.heading);
}

export function createSubheadingText(renderer: RenderContext, content: string) {
  return createText(renderer, content, textStyles.subheading);
}

export function createBodyText(renderer: RenderContext, content: string) {
  return createText(renderer, content, textStyles.body);
}

export type ButtonVariant = "primary" | "accent" | "danger" | "muted";

export const buttonStyles: Record<ButtonVariant, { borderColor: string; textColor: string }> = {
  primary: {
    borderColor: colors.teal,
    textColor: colors.teal,
  },
  accent: {
    borderColor: colors.yellow,
    textColor: colors.yellow,
  },
  danger: {
    borderColor: colors.red,
    textColor: colors.red,
  },
  muted: {
    borderColor: colors.gray500,
    textColor: colors.gray700,
  },
};
