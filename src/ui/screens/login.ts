import { BoxRenderable, InputRenderable, type RenderContext } from "@opentui/core";
import { createSubheadingText, sizes, spacing } from "../design_system";
import { createButton } from "../components/button";

export type LoginScreen = {
  view: BoxRenderable;
  input: InputRenderable;
};

export function createLoginScreen(renderer: RenderContext): LoginScreen {
  const root = new BoxRenderable(renderer, {
    id: "login",
    alignItems: "center",
    justifyContent: "center",
    flexGrow: 1,
  });

  const content = new BoxRenderable(renderer, {
    flexDirection: "column",
    alignItems: "center",
    gap: spacing.sm,
  });

  content.add(createSubheadingText(renderer, "username"));

  const row = new BoxRenderable(renderer, {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  });

  const input = new InputRenderable(renderer, {
    id: "username-input",
    width: sizes.inputWidth,
    placeholder: "Enter username...",
  });

  const loginButton = createButton(renderer, {
    id: "login-button",
    label: "login",
    width: sizes.buttonWide,
    height: sizes.buttonHeight,
    variant: "muted",
  });

  row.add(input);
  row.add(loginButton);
  content.add(row);
  root.add(content);

  return { view: root, input };
}
