import { afterEach, describe, expect, test } from "bun:test";
import { createTestRenderer } from "@opentui/core/testing";
import { spacing } from "../src/ui/design";
import { createMessageComposer } from "../src/ui/primitives/message_composer";

let cleanup: (() => void) | null = null;

afterEach(() => {
  cleanup?.();
  cleanup = null;
});

describe("message composer layout", () => {
  test("keeps bottom input margin equal to side padding", async () => {
    const testSetup = await createTestRenderer({ width: 120, height: 40 });
    cleanup = () => testSetup.renderer.destroy();

    const composer = createMessageComposer(testSetup.renderer, {
      idPrefix: "composer-test",
      totalWidth: 64,
      placeholder: "User types here",
    });
    testSetup.renderer.root.add(composer.view);
    await testSetup.renderOnce();

    const inputBox = (composer.view as any).findDescendantById("composer-test-box") as any;
    const input = composer.input as any;

    const contentTop = inputBox.y + 1;
    const contentBottom = inputBox.y + inputBox.height - 1;
    const bottomInset = contentBottom - (input.y + input.height);
    expect(bottomInset).toBe(spacing.xs);
  });

  test("keeps send button height and y aligned with input box while input grows", async () => {
    const testSetup = await createTestRenderer({ width: 120, height: 40 });
    cleanup = () => testSetup.renderer.destroy();

    const composer = createMessageComposer(testSetup.renderer, {
      idPrefix: "composer-sync",
      totalWidth: 64,
      placeholder: "User types here",
    });
    testSetup.renderer.root.add(composer.view);
    await testSetup.renderOnce();

    const inputBox = (composer.view as any).findDescendantById("composer-sync-box") as any;
    const sendButton = (composer.view as any).findDescendantById(
      "composer-sync-send-button",
    ) as any;

    composer.input.setText("first line\nsecond line\nthird line\nfourth line");
    await testSetup.renderOnce();

    expect(sendButton.height).toBe(inputBox.height);
    expect(sendButton.y).toBe(inputBox.y);

    composer.setStatus("status row should not change row alignment");
    await testSetup.renderOnce();

    expect(sendButton.height).toBe(inputBox.height);
    expect(sendButton.y).toBe(inputBox.y);
  });
});
