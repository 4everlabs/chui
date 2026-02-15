import { type RenderContext } from "@opentui/core";
import { createText, textStyles, type TextVariant } from "../design";

export function createLabel(
  renderer: RenderContext,
  content: string,
  variant: TextVariant = "subheading",
) {
  return createText(renderer, content, textStyles[variant]);
}
