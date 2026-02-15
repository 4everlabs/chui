import { BoxRenderable, TextRenderable, type RenderContext } from "@opentui/core";
import {
  messageBubbleStyles,
  messageTextStyles,
  sizes,
  spacing,
  type MessageBubbleVariant,
} from "../design";

export type TextBubbleOptions = {
  id?: string;
  text: string;
  variant?: MessageBubbleVariant;
};

export function createTextBubble(renderer: RenderContext, options: TextBubbleOptions) {
  const variant = options.variant ?? "incoming";
  const bubbleStyle = messageBubbleStyles[variant];
  const textStyle = messageTextStyles[variant];

  const bubble = new BoxRenderable(renderer, {
    id: options.id,
    border: true,
    borderStyle: "single",
    borderColor: bubbleStyle.borderColor,
    backgroundColor: bubbleStyle.backgroundColor,
    alignSelf: bubbleStyle.alignSelf,
    maxWidth: sizes.bubbleMaxWidth,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
    paddingLeft: spacing.sm,
    paddingRight: spacing.sm,
  });

  bubble.add(
    new TextRenderable(renderer, {
      content: options.text,
      fg: textStyle.fg,
      attributes: textStyle.attributes,
      wrapMode: "word",
    }),
  );

  return bubble;
}
