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
    alignSelf: bubbleStyle.alignSelf,
    maxWidth: sizes.bubbleMaxWidth,
    marginBottom: spacing.xs,
    padding: 0,
    alignItems: "stretch",
  });

  const content = new BoxRenderable(renderer, {
    width: "100%",
    backgroundColor: bubbleStyle.backgroundColor,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
    paddingLeft: spacing.xs,
    paddingRight: spacing.xs,
  });

  content.add(
    new TextRenderable(renderer, {
      content: options.text,
      fg: textStyle.fg,
      attributes: textStyle.attributes,
      wrapMode: "word",
    }),
  );
  bubble.add(content);

  return bubble;
}
