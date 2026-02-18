import {
  BoxRenderable,
  TextRenderable,
  TextareaRenderable,
  type RenderContext,
} from "@opentui/core";
import { colors, spacing } from "../design";
import { createButton } from "./button";

export type MessageComposerOptions = {
  idPrefix?: string;
  totalWidth: number;
  placeholder?: string;
  onSubmit?: () => void;
};

export type MessageComposer = {
  view: BoxRenderable;
  input: TextareaRenderable;
  setOnSubmit: (handler: () => void) => void;
  setTotalWidth: (totalWidth: number) => void;
  setStatus: (message: string, color?: string) => void;
  getValue: () => string;
  clear: () => void;
  focus: () => void;
};

export function createMessageComposer(
  renderer: RenderContext,
  options: MessageComposerOptions,
): MessageComposer {
  const idPrefix = options.idPrefix ?? "message-composer";
  const buttonWidth = 6;
  const sideInset = 0;
  const minLines = 1;
  const maxLines = 5;
  const borderSize = 2;
  const baseTotalWidth = Math.max(24, options.totalWidth);

  let onSubmit = options.onSubmit ?? (() => {});
  let totalWidth = baseTotalWidth;
  let composerLines = minLines;
  let statusMessage = " ";
  let statusColor = colors.textMuted;

  const view = new BoxRenderable(renderer, {
    id: `${idPrefix}-row`,
    width: totalWidth,
    flexDirection: "row",
    gap: spacing.xs,
    alignItems: "flex-start",
  });

  const inputBox = new BoxRenderable(renderer, {
    id: `${idPrefix}-box`,
    border: true,
    height: minLines + borderSize,
    minWidth: 12,
    flexDirection: "column",
    gap: 0,
    paddingLeft: spacing.xs,
    paddingRight: spacing.xs,
    paddingTop: 0,
    paddingBottom: 0,
    alignItems: "flex-start",
    justifyContent: "flex-start",
  });

  const input = new TextareaRenderable(renderer, {
    id: `${idPrefix}-input`,
    width: 8,
    height: minLines,
    wrapMode: "char",
    placeholder: options.placeholder,
    onSubmit: () => onSubmit(),
    onContentChange: () => syncHeights(),
    keyBindings: [
      { name: "return", action: "submit" },
      { name: "linefeed", action: "submit" },
      { name: "return", shift: true, action: "newline" },
      { name: "linefeed", shift: true, action: "newline" },
    ],
  });

  const sendButton = createButton(renderer, {
    id: `${idPrefix}-send-button`,
    label: "send",
    width: buttonWidth,
    height: minLines + borderSize,
    variant: "primary",
    borderColor: colors.primary,
    backgroundColor: colors.primary,
    textColor: colors.textInverted,
    onPress: () => onSubmit(),
  });
  const statusText = new TextRenderable(renderer, {
    id: `${idPrefix}-status`,
    content: statusMessage,
    fg: statusColor,
    wrapMode: "word",
  });

  inputBox.add(input);
  inputBox.add(statusText);
  view.add(inputBox);
  view.add(sendButton);

  const getStatusLines = () => (statusMessage.trim() ? 1 : 0);

  const updateWidths = () => {
    const innerRowWidth = Math.max(20, totalWidth - sideInset * 2);
    const inputBoxWidth = Math.max(12, innerRowWidth - buttonWidth - spacing.xs);
    const inputInnerWidth = Math.max(8, inputBoxWidth - borderSize - spacing.xs * 2);
    view.width = totalWidth;
    inputBox.width = inputBoxWidth;
    input.width = inputInnerWidth;
    statusText.width = inputInnerWidth;
  };

  const syncHeights = () => {
    const measuredInputLines = input.plainText.trim()
      ? input.virtualLineCount
      : minLines;
    const nextLines = Math.max(minLines, Math.min(maxLines, measuredInputLines));
    if (nextLines !== composerLines) {
      composerLines = nextLines;
    }
    const statusLines = getStatusLines();

    input.height = composerLines;
    inputBox.height = composerLines + borderSize + statusLines;
    sendButton.height = composerLines + borderSize;
  };
  updateWidths();
  syncHeights();

  return {
    view,
    input,
    setOnSubmit: (handler: () => void) => {
      onSubmit = handler;
    },
    setTotalWidth: (_nextTotalWidth: number) => {
      // Fully responsive: allow both growth and shrink with viewport changes.
      totalWidth = Math.max(24, _nextTotalWidth);
      updateWidths();
      syncHeights();
    },
    setStatus: (message: string, color: string = colors.textMuted) => {
      statusMessage = message || " ";
      statusColor = color;
      statusText.content = statusMessage;
      statusText.fg = statusColor;
      syncHeights();
    },
    getValue: () => input.plainText,
    clear: () => {
      input.setText("");
      statusMessage = " ";
      statusColor = colors.textMuted;
      statusText.content = statusMessage;
      statusText.fg = statusColor;
      syncHeights();
    },
    focus: () => input.focus(),
  };
}
