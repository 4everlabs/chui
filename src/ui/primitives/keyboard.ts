import type { KeyEvent } from "@opentui/core";

export const isEnterKey = (key: KeyEvent) => {
  return key.name === "return" || key.name === "enter" || key.sequence === "\r";
};

export const isSpaceKey = (key: KeyEvent) => {
  return key.name === "space" || key.sequence === " ";
};

export const isActivationKey = (key: KeyEvent) => {
  return isEnterKey(key) || isSpaceKey(key);
};

export const isCtrlCKey = (key: KeyEvent) => {
  return (key.ctrl && key.name === "c") || key.sequence === "\u0003";
};
