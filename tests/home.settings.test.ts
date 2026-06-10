import { afterEach, describe, expect, test } from "bun:test";
import { createTestRenderer } from "@opentui/core/testing";
import { createHomeScreen } from "../src/ui/screens/home";

let cleanup: (() => void) | null = null;

afterEach(() => {
  cleanup?.();
  cleanup = null;
});

const click = (renderable: any) => {
  renderable._mouseListeners?.up?.({ type: "up" } as any);
};

describe("home settings", () => {
  test("opens settings from the larger top-right button", async () => {
    const testSetup = await createTestRenderer({ width: 120, height: 40 });
    cleanup = () => testSetup.renderer.destroy();

    const home = createHomeScreen(testSetup.renderer);
    testSetup.renderer.root.add(home.view);
    await testSetup.renderOnce();

    const settingsButton = home.view.findDescendantById("chat-settings-button") as any;
    const settingsOverlay = home.view.findDescendantById("chat-settings-overlay") as any;
    const settingsModal = home.view.findDescendantById("chat-settings-modal") as any;

    expect(settingsButton.width).toBe(12);
    expect(settingsButton.height).toBe(3);
    expect(settingsOverlay.visible).toBe(false);

    click(settingsButton);

    expect(settingsOverlay.visible).toBe(true);
    expect(settingsModal.border).toBe(true);
  });

  test("toggles compact sidebar and version visibility", async () => {
    const testSetup = await createTestRenderer({ width: 120, height: 40 });
    cleanup = () => testSetup.renderer.destroy();

    const home = createHomeScreen(testSetup.renderer);
    testSetup.renderer.root.add(home.view);
    await testSetup.renderOnce();

    const usersPanel = home.view.findDescendantById("chat-users-panel") as any;
    const compactRow = home.view.findDescendantById("chat-settings-sidebar-row") as any;
    const versionRow = home.view.findDescendantById("chat-settings-version-row") as any;
    const versionText = home.view.findDescendantById("chat-users-version") as any;
    const initialSidebarWidth = usersPanel.width;

    click(compactRow);
    click(versionRow);
    await testSetup.renderOnce();

    expect(usersPanel.width).toBeLessThan(initialSidebarWidth);
    expect(versionText.visible).toBe(false);
  });
});
