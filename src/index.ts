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
  getCurrentUser,
  listConversationMessages,
  listMyConversations,
  listProfiles,
  restoreConvexAuthFromSession,
  sendDirectMessage,
  type ConversationMessage,
  type ConversationSummary,
} from "./data/convex_actions.js";
import {
  createHomeScreen,
} from "./ui/screens/home.js";
import {
  createLoginScreen,
} from "./ui/screens/login.js";
import {
  createSignUpScreen,
} from "./ui/screens/signup.js";
import {
  createSplashScreen,
} from "./ui/screens/splash.js";
import {
  colors,
  getViewportConstraintMessage,
  isViewportSupported,
  spacing,
} from "./ui/design/index.js";
import { applyTextCursorStyle } from "./ui/primitives/cursor.js";

const renderer = await createCliRenderer({
  exitOnCtrlC: true,
  targetFps: 30,
});
applyTextCursorStyle(renderer);

const appShell = new BoxRenderable(renderer, {
  id: "app-shell",
  flexDirection: "column",
  flexGrow: 1,
  width: "100%",
});
const appContent = new BoxRenderable(renderer, {
  id: "app-content",
  flexGrow: 1,
  width: "100%",
});
const appErrorLine = new TextRenderable(renderer, {
  id: "app-error-line",
  content: " ",
  fg: colors.error,
  wrapMode: "word",
});
appShell.add(appContent);
appShell.add(appErrorLine);
renderer.root.add(appShell);

type AppRoute = "splash" | "login" | "signup" | "home";

const minSizeScreen = createMinSizeScreen(renderer);
let activeRoute: AppRoute = "splash";
const autoTestProfileEnabled = process.env.CHUI_TEST_PROFILE === "1";
const autoTestUsername = process.env.CHUI_TEST_USERNAME ?? "test";
const autoTestPassword = process.env.CHUI_TEST_PASSWORD ?? "test";

let loginScreen: ReturnType<typeof createLoginScreen>;
let signUpScreen: ReturnType<typeof createSignUpScreen>;
let homeScreen: ReturnType<typeof createHomeScreen>;
let currentUsername: string | null = null;
let selectedChatUsername: string | null = null;
let conversationIdByUsername = new Map<string, string>();
let activeConversationLoadId = 0;
const conversationMessageLimit = 60;

const renderCurrentRoute = () => {
  removeIfPresent(appContent, "splash");
  removeIfPresent(appContent, "login");
  removeIfPresent(appContent, "signup");
  removeIfPresent(appContent, "home");
  removeIfPresent(appContent, "min-size");

  if (!isViewportSupported(renderer.width, renderer.height)) {
    minSizeScreen.setSize(renderer.width, renderer.height);
    appContent.add(minSizeScreen.view);
    return;
  }

  if (activeRoute === "splash") {
    appContent.add(splashScreen.view);
    splashScreen.focus();
    return;
  }

  if (activeRoute === "login") {
    appContent.add(loginScreen.view);
    loginScreen.focus();
    return;
  }

  if (activeRoute === "signup") {
    appContent.add(signUpScreen.view);
    signUpScreen.focus();
    return;
  }

  appContent.add(homeScreen.view);
  homeScreen.focus();
};

const showHome = async () => {
  activeRoute = "home";
  clearBottomError();
  renderCurrentRoute();
  try {
    await refreshHomeData();
  } catch (error) {
    homeScreen.setUsers([]);
    homeScreen.setMessages([]);
    homeScreen.setSelectedUser(null);
    homeScreen.setStatus("Unable to load conversations", colors.error);
    setBottomError(error);
  }
};

const showLogin = () => {
  activeRoute = "login";
  clearBottomError();
  renderCurrentRoute();
};

const showSignUp = () => {
  activeRoute = "signup";
  clearBottomError();
  renderCurrentRoute();
};

const getErrorMessage = (error: unknown) => {
  return error instanceof Error ? error.message : String(error);
};

const setBottomError = (error: unknown) => {
  const message = getErrorMessage(error).trim();
  appErrorLine.content = message || "Unknown error";
};

const clearBottomError = () => {
  appErrorLine.content = " ";
};

const inferUsernameFromCurrentUser = (payload: unknown): string | null => {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const data = payload as {
    profile?: { username?: unknown };
    authUser?: { name?: unknown; email?: unknown };
    identity?: { name?: unknown; email?: unknown };
  };

  const profileUsername =
    typeof data.profile?.username === "string" ? data.profile.username.trim() : "";
  if (profileUsername) {
    return profileUsername;
  }

  const authName = typeof data.authUser?.name === "string" ? data.authUser.name.trim() : "";
  if (authName) {
    return authName;
  }

  const identityName = typeof data.identity?.name === "string"
    ? data.identity.name.trim()
    : "";
  if (identityName) {
    return identityName;
  }

  const email = typeof data.authUser?.email === "string"
    ? data.authUser.email.trim()
    : typeof data.identity?.email === "string"
      ? data.identity.email.trim()
      : "";
  if (email && email.includes("@")) {
    return email.split("@")[0] ?? null;
  }

  return null;
};

const toHomeMessages = (messages: ConversationMessage[]) => {
  return messages.map((message) => ({
    id: String(message._id),
    senderUsername: message.senderUsername,
    body: message.body,
    createdAt: message.createdAt,
  }));
};

const loadConversationForUser = async (username: string) => {
  const loadId = ++activeConversationLoadId;
  selectedChatUsername = username;
  homeScreen.setSelectedUser(username);

  const conversationId = conversationIdByUsername.get(username);
  if (!conversationId) {
    if (loadId !== activeConversationLoadId || selectedChatUsername !== username) {
      return;
    }
    homeScreen.setMessages([]);
    homeScreen.setStatus(`No conversation with ${username} yet. Send the first message.`);
    return;
  }

  const messages = await listConversationMessages(conversationId, conversationMessageLimit);
  if (loadId !== activeConversationLoadId || selectedChatUsername !== username) {
    return;
  }
  homeScreen.setMessages(toHomeMessages(messages));
  homeScreen.setStatus(" ");
};

const refreshHomeData = async () => {
  if (!currentUsername) {
    homeScreen.setUsers([]);
    homeScreen.setMessages([]);
    homeScreen.setSelectedUser(null);
    homeScreen.setStatus("Log in to view conversations", colors.warning);
    return;
  }

  homeScreen.setCurrentUsername(currentUsername);
  homeScreen.setStatus("Loading conversations...", colors.warning);

  const [profiles, conversations] = await Promise.all([
    listProfiles(),
    listMyConversations(200),
  ]);

  const chatUsers = profiles
    .map((profile) => profile.username)
    .filter((username) => username !== currentUsername)
    .sort((a, b) => a.localeCompare(b));

  const users = chatUsers.map((username) => ({ username }));
  homeScreen.setUsers(users);

  const map = new Map<string, string>();
  conversations.forEach((conversation: ConversationSummary) => {
    const otherUsername = conversation.otherUser?.username;
    if (otherUsername) {
      map.set(otherUsername, String(conversation.conversationId));
    }
  });
  conversationIdByUsername = map;

  if (
    selectedChatUsername &&
    users.some((user) => user.username === selectedChatUsername)
  ) {
    await loadConversationForUser(selectedChatUsername);
    return;
  }

  if (users.length === 0) {
    selectedChatUsername = null;
    homeScreen.setSelectedUser(null);
    homeScreen.setMessages([]);
    homeScreen.setStatus("No other users available yet");
    return;
  }

  selectedChatUsername = null;
  homeScreen.setSelectedUser(null);
  homeScreen.setMessages([]);
  homeScreen.setStatus("Select a user to view messages");
};

const handleSelectChatUser = async (username: string) => {
  try {
    await loadConversationForUser(username);
  } catch (error) {
    homeScreen.setStatus("Unable to load chat", colors.error);
    setBottomError(error);
  }
};

const handleSendMessage = async (toUsername: string, body: string) => {
  const trimmedBody = body.trim();
  if (!trimmedBody) {
    homeScreen.setStatus("Type a message first", colors.warning);
    return;
  }

  try {
    const result = await sendDirectMessage(toUsername, trimmedBody);
    const conversationId = String(result.conversationId);
    conversationIdByUsername.set(toUsername, conversationId);
    if (selectedChatUsername === toUsername && currentUsername) {
      homeScreen.appendMessage({
        id: String(result.messageId),
        senderUsername: currentUsername,
        body: trimmedBody,
        createdAt: result.createdAt,
      });
    }
    homeScreen.clearComposer();
    homeScreen.setStatus(" ");
    clearBottomError();
  } catch (error) {
    homeScreen.setStatus("Unable to send message", colors.error);
    setBottomError(error);
  }
};

let isSubmitting = false;

const handleLogin = async (email: string, password: string) => {
  if (isSubmitting) return;

  const e = (email ?? "").trim();
  const p = password ?? "";
  if (!e || !p) {
    loginScreen.setStatus("Username/email and password required", "error");
    return;
  }

  loginScreen.setStatus("Signing in...", "warning");
  isSubmitting = true;

  try {
    const result = await signInWithEmailAndPassword(e, p);
    currentUsername = result.username;
    loginScreen.setStatus(`Logged in as ${result.username}`, "success");
    clearBottomError();
    await showHome();
  } catch (error) {
    loginScreen.setStatus("Login failed", "error");
    setBottomError(error);
  } finally {
    isSubmitting = false;
  }
};

const handleSignUp = async (
  username: string,
  password: string,
) => {
  if (isSubmitting) return;

  const u = (username ?? "").trim();
  const p = password ?? "";
  if (!u || !p) {
    signUpScreen.setStatus("Username and password required", "error");
    return;
  }

  signUpScreen.setStatus("Creating account...", "warning");
  isSubmitting = true;

  try {
    const result = await signUpWithUsernameEmailAndPassword(u, p);
    currentUsername = result.username;
    signUpScreen.setStatus(`Logged in as ${result.username}`, "success");
    clearBottomError();
    await showHome();
  } catch (error) {
    signUpScreen.setStatus("Sign up failed", "error");
    setBottomError(error);
  } finally {
    isSubmitting = false;
  }
};

const bootTestProfile = async () => {
  if (!autoTestProfileEnabled) {
    return;
  }

  const username = autoTestUsername.trim();
  const password = autoTestPassword;
  if (!username || !password) {
    showLogin();
    return;
  }

  try {
    const signedUp = await signUpWithUsernameEmailAndPassword(username, password);
    currentUsername = signedUp.username;
    clearBottomError();
    await showHome();
  } catch {
    try {
      const signedIn = await signInWithEmailAndPassword(username, password);
      currentUsername = signedIn.username;
      clearBottomError();
      await showHome();
    } catch (error) {
      showLogin();
      setBottomError(error);
    }
  }
};

const bootPersistedSession = async () => {
  const loadUsername = async () => {
    const user = await getCurrentUser();
    return inferUsernameFromCurrentUser(user);
  };

  try {
    let restoredUsername = await loadUsername();
    if (!restoredUsername && await restoreConvexAuthFromSession()) {
      restoredUsername = await loadUsername();
    }
    if (!restoredUsername) {
      return;
    }

    currentUsername = restoredUsername;
    clearBottomError();
    await showHome();
  } catch (error) {
    if (await restoreConvexAuthFromSession()) {
      try {
        const restoredUsername = await loadUsername();
        if (restoredUsername) {
          currentUsername = restoredUsername;
          clearBottomError();
          await showHome();
          return;
        }
      } catch {
        // fall through to normal login path
      }
    }
    setBottomError(error);
  }
};

loginScreen = createLoginScreen(renderer, {
  onSubmit: handleLogin,
  onSignUpClick: showSignUp,
});

signUpScreen = createSignUpScreen(renderer, {
  onSubmit: handleSignUp,
  onBackToLogin: showLogin,
});

homeScreen = createHomeScreen(renderer, {
  onSelectUser: handleSelectChatUser,
  onSendMessage: handleSendMessage,
});

const splashScreen = createSplashScreen(renderer, { onEnter: showLogin });

renderer.root.on(LayoutEvents.RESIZED, renderCurrentRoute);
renderCurrentRoute();
if (autoTestProfileEnabled) {
  await bootTestProfile();
} else {
  await bootPersistedSession();
}

function removeIfPresent(view: BoxRenderable, id: string) {
  if (view.getRenderable(id)) {
    view.remove(id);
  }
}

function createMinSizeScreen(renderer: CliRenderer) {
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
