import { BoxRenderable, type RenderContext } from "@opentui/core";

type LayoutSize = number | "auto" | `${number}%`;
type LayoutSpacing = number | `${number}%`;

type PanelOptions = {
  id?: string;
  width?: LayoutSize;
  minWidth?: LayoutSize;
  flexGrow?: number;
  border?: boolean | Array<"top" | "right" | "bottom" | "left">;
  borderColor?: string;
  gap?: number;
  padding?: LayoutSpacing;
  paddingTop?: LayoutSpacing;
  paddingRight?: LayoutSpacing;
  paddingBottom?: LayoutSpacing;
  paddingLeft?: LayoutSpacing;
  flexDirection?: "column" | "row";
  alignItems?: "flex-start" | "flex-end" | "center" | "stretch" | "baseline";
  justifyContent?:
    | "flex-start"
    | "flex-end"
    | "center"
    | "space-between"
    | "space-around"
    | "space-evenly";
};

export function createPanel(renderer: RenderContext, options: PanelOptions = {}) {
  const border = options.border ?? true;

  return new BoxRenderable(renderer, {
    id: options.id,
    border,
    ...(border === false
      ? {}
      : {
          borderStyle: "single" as const,
          borderColor: options.borderColor,
        }),
    flexDirection: options.flexDirection ?? "column",
    width: options.width,
    minWidth: options.minWidth,
    flexGrow: options.flexGrow,
    gap: options.gap,
    padding: options.padding,
    paddingTop: options.paddingTop,
    paddingRight: options.paddingRight,
    paddingBottom: options.paddingBottom,
    paddingLeft: options.paddingLeft,
    alignItems: options.alignItems,
    justifyContent: options.justifyContent,
  });
}
