import {
  BoxRenderable,
  TextRenderable,
  TextareaRenderable,
  type RenderContext,
} from "@opentui/core";
import { colors, spacing } from "../design";

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
  const buttonWidth = 8;
  const minLines = 1;
  const maxLines = 5;
  const borderSize = 2;
  const horizontalPadding = spacing.xs;
  const verticalBottomPadding = horizontalPadding;
  const bottomSpacing = spacing.xs;
  const baseTotalWidth = Math.max(24, options.totalWidth);

  let onSubmit = options.onSubmit ?? (() => {});
  let totalWidth = baseTotalWidth;
  let composerLines = minLines;
  let controlHeight = minLines + borderSize + verticalBottomPadding;
  let statusMessage = " ";
  let statusColor = colors.textMuted;

  const view = new BoxRenderable(renderer, {
    id: `${idPrefix}-composer`,
    width: totalWidth,
    flexDirection: "column",
    gap: 0,
    alignItems: "flex-start",
  });

  const row = new BoxRenderable(renderer, {
    id: `${idPrefix}-row`,
    width: totalWidth,
    flexDirection: "row",
    gap: spacing.xs,
    alignItems: "flex-start",
    marginBottom: bottomSpacing,
  });

  const inputBox = new BoxRenderable(renderer, {
    id: `${idPrefix}-box`,
    border: true,
    borderStyle: "single",
    height: controlHeight,
    minWidth: 12,
    flexDirection: "column",
    gap: 0,
    paddingLeft: horizontalPadding,
    paddingRight: horizontalPadding,
    paddingTop: 0,
    paddingBottom: verticalBottomPadding,
    alignItems: "flex-start",
    justifyContent: "flex-start",
  });

  const input = new TextareaRenderable(renderer, {
    id: `${idPrefix}-input`,
    width: 8,
    height: minLines,
    wrapMode: "char",
    cursorStyle: {
      style: "line",
      blinking: true,
    },
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

  const sendButton = new BoxRenderable(renderer, {
    id: `${idPrefix}-send-button`,
    width: buttonWidth,
    height: controlHeight,
    border: true,
    borderStyle: "single",
    borderColor: colors.surfaceBorder,
    backgroundColor: undefined,
    paddingLeft: horizontalPadding,
    paddingRight: horizontalPadding,
    paddingTop: 0,
    paddingBottom: verticalBottomPadding,
    alignItems: "flex-start",
    justifyContent: "flex-start",
    onMouseUp: () => onSubmit(),
  });
  const sendButtonLabel = new TextRenderable(renderer, {
    id: `${idPrefix}-send-button-label`,
    content: "send",
    fg: colors.textPrimary,
  });
  const statusText = new TextRenderable(renderer, {
    id: `${idPrefix}-status`,
    content: statusMessage,
    fg: statusColor,
    wrapMode: "word",
  });

  inputBox.add(input);
  sendButton.add(sendButtonLabel);
  view.add(statusText);
  row.add(inputBox);
  row.add(sendButton);
  view.add(row);

  const getStatusLines = () => (statusMessage.trim() ? 1 : 0);

  const updateWidths = () => {
    const innerRowWidth = Math.max(20, totalWidth);
    const inputBoxWidth = Math.max(12, innerRowWidth - buttonWidth - spacing.xs);
    const inputInnerWidth = Math.max(
      8,
      inputBoxWidth - borderSize - horizontalPadding * 2,
    );
    view.width = totalWidth;
    row.width = totalWidth;
    inputBox.width = inputBoxWidth;
    input.width = inputInnerWidth;
    statusText.width = totalWidth;
  };

  const syncHeights = () => {
    const measuredInputLines = input.plainText.trim()
      ? input.virtualLineCount
      : minLines;
    const nextLines = Math.max(minLines, Math.min(maxLines, measuredInputLines));
    if (nextLines !== composerLines) {
      composerLines = nextLines;
    }
    input.height = composerLines;
    controlHeight = composerLines + borderSize + verticalBottomPadding;
    inputBox.height = controlHeight;
    inputBox.minHeight = controlHeight;
    inputBox.maxHeight = controlHeight;
    sendButton.height = controlHeight;
    sendButton.minHeight = controlHeight;
    sendButton.maxHeight = controlHeight;
    statusText.height = getStatusLines();
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
