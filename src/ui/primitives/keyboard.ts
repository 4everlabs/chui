import type { KeyEvent } from "@opentui/core";

export const isEnterKey = (key: KeyEvent) => {
  return key.name === "return" || key.name === "enter" || key.sequence === "\r";
};
