import { InputRenderable, type RenderContext } from "@opentui/core";
import { sizes } from "../design";

export type TextInputOptions = {
  id?: string;
  width?: number;
  placeholder?: string;
};

export function createTextInput(renderer: RenderContext, options: TextInputOptions = {}) {
  return new InputRenderable(renderer, {
    id: options.id,
    width: options.width ?? sizes.inputWidth,
    placeholder: options.placeholder,
  });
}
