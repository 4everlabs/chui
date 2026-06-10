import { BoxRenderable, TextRenderable, type RenderContext } from "@opentui/core";
import { buttonStyles, type ButtonVariant } from "../design";
import { isActivationKey } from "./keyboard";

export type ButtonOptions = {
  id?: string;
  label: string;
  width: number;
  height: number;
  variant?: ButtonVariant;
  borderColor?: string;
  textColor?: string;
  backgroundColor?: string;
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
    borderStyle: "single",
    borderColor: options.borderColor ?? style.borderColor,
    backgroundColor: options.backgroundColor,
    focusable: true,
    alignItems: "center",
    justifyContent: "center",
    onMouseUp: () => {
      options.onPress?.();
    },
  });

  button.add(
    new TextRenderable(renderer, {
      content: options.label,
      fg: options.textColor ?? style.textColor,
    }),
  );
  button.onKeyDown = (key) => {
    if (!isActivationKey(key)) return;
    key.preventDefault();
    key.stopPropagation();
    options.onPress?.();
  };

  return button;
}
