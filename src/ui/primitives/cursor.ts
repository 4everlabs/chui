import type { CliRenderer } from "@opentui/core";

export const applyTextCursorStyle = (renderer: CliRenderer) => {
  renderer.setCursorStyle({
    style: "line",
    blinking: true,
  });
};
