import {
  ASCIIFontRenderable,
  BoxRenderable,
  type RenderContext,
} from "@opentui/core";
import { colors, createBodyText, sizes, spacing } from "../design_system";
import { createButton } from "../components/button";

export type SplashScreenOptions = {
  onEnter: () => void;
};

export function createSplashScreen(renderer: RenderContext, options: SplashScreenOptions) {
  const root = new BoxRenderable(renderer, {
    id: "splash",
    alignItems: "center",
    justifyContent: "center",
    flexGrow: 1,
  });

  const content = new BoxRenderable(renderer, {
    flexDirection: "column",
    alignItems: "center",
    gap: spacing.sm,
  });

  content.add(
    new ASCIIFontRenderable(renderer, {
      font: "block",
      text: "CHUI",
      color: colors.teal,
    }),
  );

  content.add(createBodyText(renderer, "instant messenger for the terminal"));

  const enterButton = createButton(renderer, {
    id: "enter-button",
    label: "enter",
    width: sizes.buttonSquare,
    height: sizes.buttonSquare,
    variant: "accent",
    onPress: options.onEnter,
  });
  content.add(enterButton);

  root.add(content);

  return root;
}
