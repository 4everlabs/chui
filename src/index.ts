import {
  BoxRenderable,
  createCliRenderer,
  LayoutEvents,
  TextRenderable,
  type CliRenderer,
} from "@opentui/core";
import {
  signInWithEmailAndPassword,
  signUpWithUsernameEmailAndPassword,
  listProfiles,
} from "./data/convex_actions.js";
import {
  createHomeView,
  createLoginView,
  createSignUpView,
  createSplashView,
  createUsersListView,
  type UserListItem,
} from "./ui/components/index.js";
import {
  colors,
  getViewportConstraintMessage,
  isViewportSupported,
  spacing,
} from "./ui/design/index.js";

const renderer = await createCliRenderer({
  exitOnCtrlC: true,
  targetFps: 30,
});

type AppRoute = "splash" | "login" | "signup" | "home" | "users";

const minSizeView = createMinSizeView(renderer);
let activeRoute: AppRoute = "splash";

let loginView: ReturnType<typeof createLoginView>;
let signUpView: ReturnType<typeof createSignUpView>;
let homeView: ReturnType<typeof createHomeView>;
let usersListView: ReturnType<typeof createUsersListView>;

const renderCurrentRoute = () => {
  removeIfPresent(renderer, "splash");
  removeIfPresent(renderer, "login");
  removeIfPresent(renderer, "signup");
  removeIfPresent(renderer, "home");
  removeIfPresent(renderer, "users");
  removeIfPresent(renderer, "min-size");

  if (!isViewportSupported(renderer.width, renderer.height)) {
    minSizeView.setSize(renderer.width, renderer.height);
    renderer.root.add(minSizeView.view);
    return;
  }

  if (activeRoute === "splash") {
    renderer.root.add(splashView.view);
    return;
  }

  if (activeRoute === "login") {
    renderer.root.add(loginView.view);
    loginView.focus();
    return;
  }

  if (activeRoute === "signup") {
    renderer.root.add(signUpView.view);
    signUpView.focus();
    return;
  }

  if (activeRoute === "users") {
    renderer.root.add(usersListView.view);
    usersListView.focus();
    return;
  }

  renderer.root.add(homeView.view);
};

const showHome = () => {
  activeRoute = "home";
  renderCurrentRoute();
};

const showLogin = () => {
  activeRoute = "login";
  renderCurrentRoute();
};

const showSignUp = () => {
  activeRoute = "signup";
  renderCurrentRoute();
};

const showUsers = async () => {
  activeRoute = "users";
  renderCurrentRoute();
  try {
    const users = await listProfiles();
    usersListView.setUsers(users as UserListItem[]);
  } catch {
    usersListView.setUsers([]);
  }
};

let isSubmitting = false;

const handleLogin = async (email: string, password: string) => {
  if (isSubmitting) return;

  const e = (email ?? "").trim();
  const p = password ?? "";
  if (!e || !p) {
    loginView.setStatus("Email and password required", "#F87171");
    return;
  }

  loginView.setStatus("Signing in...", "#FBBF24");
  isSubmitting = true;

  try {
    const result = await signInWithEmailAndPassword(e, p);
    loginView.setStatus(`Logged in as ${result.username}`, "#34D399");
    showHome();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    loginView.setStatus(message, "#F87171");
  } finally {
    isSubmitting = false;
  }
};

const handleSignUp = async (
  username: string,
  email: string,
  password: string,
) => {
  if (isSubmitting) return;

  const u = (username ?? "").trim();
  const e = (email ?? "").trim();
  const p = password ?? "";
  if (!u || !e || !p) {
    signUpView.setStatus("Username, email, and password required", "#F87171");
    return;
  }
  if (!e.includes("@")) {
    signUpView.setStatus("Valid email required for password reset", "#F87171");
    return;
  }

  signUpView.setStatus("Creating account...", "#FBBF24");
  isSubmitting = true;

  try {
    const result = await signUpWithUsernameEmailAndPassword(u, e, p);
    signUpView.setStatus(`Logged in as ${result.username}`, "#34D399");
    showHome();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    signUpView.setStatus(message, "#F87171");
  } finally {
    isSubmitting = false;
  }
};

loginView = createLoginView(renderer, {
  onSubmit: handleLogin,
  onSignUpClick: showSignUp,
});

signUpView = createSignUpView(renderer, {
  onSubmit: handleSignUp,
  onBackToLogin: showLogin,
});

homeView = createHomeView(renderer, {
  onUsersClick: showUsers,
});

usersListView = createUsersListView(renderer);

const splashView = createSplashView(renderer, { onEnter: showLogin });

renderer.root.on(LayoutEvents.RESIZED, renderCurrentRoute);
renderCurrentRoute();

function removeIfPresent(renderer: CliRenderer, id: string) {
  if (renderer.root.getRenderable(id)) {
    renderer.root.remove(id);
  }
}

function createMinSizeView(renderer: CliRenderer) {
  const view = new BoxRenderable(renderer, {
    id: "min-size",
    alignItems: "center",
    justifyContent: "center",
    flexGrow: 1,
    flexDirection: "column",
    gap: spacing.xs,
    paddingLeft: spacing.sm,
    paddingRight: spacing.sm,
  });

  const title = new TextRenderable(renderer, {
    content: "Resize Terminal",
    fg: colors.yellow,
  });
  const details = new TextRenderable(renderer, {
    content: getViewportConstraintMessage(renderer.width, renderer.height),
    fg: colors.gray300,
    wrapMode: "word",
  });

  view.add(title);
  view.add(details);

  return {
    view,
    setSize: (width: number, height: number) => {
      details.content = getViewportConstraintMessage(width, height);
    },
  };
}
