import { createCliRenderer, InputRenderableEvents } from "@opentui/core";
import { upsertByUsername } from "./data/user_repository.js";
import { createLoginView } from "./ui/components/login_view.js";
import { createSplashView } from "./ui/components/splash_view.js";

const renderer = await createCliRenderer({
  exitOnCtrlC: true,
  targetFps: 30,
});

const loginView = createLoginView(renderer);

const showLogin = () => {
  renderer.root.remove("splash");
  renderer.root.add(loginView.view);
  loginView.input.focus();
};

const splashView = createSplashView(renderer, { onEnter: showLogin });

renderer.root.add(splashView.view);

let isSubmitting = false;

loginView.input.on(InputRenderableEvents.ENTER, async (value: string) => {
  if (isSubmitting) {
    return;
  }

  const username = value ?? "";
  loginView.setStatus("Saving/Loading...", "#FBBF24");
  isSubmitting = true;

  try {
    const result = await upsertByUsername(username);
    loginView.setStatus(
      `Logged in as ${result.username} (${result.userId})`,
      "#34D399",
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    loginView.setStatus(message, "#F87171");
  } finally {
    isSubmitting = false;
  }
});
