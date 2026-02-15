import { BoxRenderable, TextRenderable, type RenderContext } from "@opentui/core";
import { buttonStyles, type ButtonVariant } from "../design";

export type ButtonOptions = {
  id?: string;
  label: string;
  width: number;
  height: number;
  variant?: ButtonVariant;
  onPress?: () => void;
};

export function createButton(renderer: RenderContext, options: ButtonOptions) {
  const variant = options.variant ?? "primary";
  const style = buttonStyles[variant];

  const button = new BoxRenderable(renderer, {
    id: options.id,
    width: options.width,
    height: options.height,
    border: true,
    borderColor: style.borderColor,
    alignItems: "center",
    justifyContent: "center",
    onMouseUp: () => {
      options.onPress?.();
    },
  });

  button.add(
    new TextRenderable(renderer, {
      content: options.label,
      fg: style.textColor,
    }),
  );

  return button;
}
