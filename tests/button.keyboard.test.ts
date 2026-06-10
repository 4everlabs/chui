import { afterEach, describe, expect, test } from "bun:test";
import { createTestRenderer } from "@opentui/core/testing";
import { createButton } from "../src/ui/primitives/button";

let cleanup: (() => void) | null = null;

afterEach(() => {
  cleanup?.();
  cleanup = null;
});

const createKeyEvent = (name: string, sequence: string) => {
  let defaultPrevented = false;
  let propagationStopped = false;

  return {
    key: {
      name,
      sequence,
      ctrl: false,
      shift: false,
      meta: false,
      option: false,
      eventType: "press",
      repeated: false,
      preventDefault: () => {
        defaultPrevented = true;
      },
      stopPropagation: () => {
        propagationStopped = true;
      },
    },
    get defaultPrevented() {
      return defaultPrevented;
    },
    get propagationStopped() {
      return propagationStopped;
    },
  };
};

describe("button keyboard activation", () => {
  test("presses on return", async () => {
    const testSetup = await createTestRenderer({ width: 80, height: 24 });
    cleanup = () => testSetup.renderer.destroy();

    let pressCount = 0;
    const button = createButton(testSetup.renderer, {
      label: "enter",
      width: 9,
      height: 3,
      onPress: () => {
        pressCount += 1;
      },
    });
    const event = createKeyEvent("return", "\r");

    expect(button.focusable).toBe(true);

    button.onKeyDown?.(event.key as any);

    expect(pressCount).toBe(1);
    expect(event.defaultPrevented).toBe(true);
    expect(event.propagationStopped).toBe(true);
  });

  test("presses on spacebar", async () => {
    const testSetup = await createTestRenderer({ width: 80, height: 24 });
    cleanup = () => testSetup.renderer.destroy();

    let pressCount = 0;
    const button = createButton(testSetup.renderer, {
      label: "enter",
      width: 9,
      height: 3,
      onPress: () => {
        pressCount += 1;
      },
    });
    const event = createKeyEvent("space", " ");

    button.onKeyDown?.(event.key as any);

    expect(pressCount).toBe(1);
    expect(event.defaultPrevented).toBe(true);
    expect(event.propagationStopped).toBe(true);
  });
});
