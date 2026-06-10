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
import { isCtrlCKey } from "./ui/primitives/keyboard.js";
import {
  parseUsername,
  parseUsernameOrThrow,
  USERNAME_RULES_TEXT,
  type Username,
} from "../shared/username.js";
import { debugLog } from "./app/debug_log.js";

const renderer = await createCliRenderer({
  exitOnCtrlC: true,
  targetFps: 30,
});
applyTextCursorStyle(renderer);
debugLog("app started", {
  width: renderer.width,
  height: renderer.height,
});

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
let currentUsername: Username | null = null;
let selectedChatUsername: Username | null = null;
let conversationIdByUsername = new Map<Username, string>();
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
  debugLog("route changed", { route: activeRoute });
  clearBottomError();
  renderCurrentRoute();
  try {
    await refreshHomeData();
  } catch (error) {
    debugLog("home refresh failed", { error });
    homeScreen.setUsers([]);
    homeScreen.setMessages([]);
    homeScreen.setSelectedUser(null);
    homeScreen.setStatus("Unable to load conversations", colors.error);
    setBottomError(error);
  }
};

const showLogin = () => {
  activeRoute = "login";
  debugLog("route changed", { route: activeRoute });
  clearBottomError();
  renderCurrentRoute();
};

const showSignUp = () => {
  activeRoute = "signup";
  debugLog("route changed", { route: activeRoute });
  clearBottomError();
  renderCurrentRoute();
};

const getErrorMessage = (error: unknown) => {
  return error instanceof Error ? error.message : String(error);
};

const setBottomError = (error: unknown) => {
  const message = getErrorMessage(error).trim();
  debugLog("bottom error set", { message: message || "Unknown error" });
  appErrorLine.content = message || "Unknown error";
};

const clearBottomError = () => {
  appErrorLine.content = " ";
};

const inferUsernameFromCurrentUser = (payload: unknown): Username | null => {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const data = payload as {
    profile?: { username?: unknown };
    authUser?: { name?: unknown; email?: unknown };
    identity?: { name?: unknown; email?: unknown };
  };

  const profileUsername = typeof data.profile?.username === "string"
    ? parseUsername(data.profile.username)
    : null;
  if (profileUsername) {
    return profileUsername;
  }

  const authName = typeof data.authUser?.name === "string"
    ? parseUsername(data.authUser.name)
    : null;
  if (authName) {
    return authName;
  }

  const identityName = typeof data.identity?.name === "string"
    ? parseUsername(data.identity.name)
    : null;
  if (identityName) {
    return identityName;
  }

  const email = typeof data.authUser?.email === "string"
    ? data.authUser.email.trim()
    : typeof data.identity?.email === "string"
      ? data.identity.email.trim()
      : "";
  if (email && email.includes("@")) {
    const fromEmailLocalPart = email.split("@")[0];
    return fromEmailLocalPart ? parseUsername(fromEmailLocalPart) : null;
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

const loadConversationForUser = async (username: Username) => {
  const loadId = ++activeConversationLoadId;
  selectedChatUsername = username;
  homeScreen.setSelectedUser(username);
  debugLog("conversation selected", { username, loadId });

  const conversationId = conversationIdByUsername.get(username);
  if (!conversationId) {
    if (loadId !== activeConversationLoadId || selectedChatUsername !== username) {
      return;
    }
    homeScreen.setMessages([]);
    homeScreen.setStatus(" ");
    debugLog("conversation empty", { username, loadId });
    return;
  }

  const messages = await listConversationMessages(conversationId, conversationMessageLimit);
  if (loadId !== activeConversationLoadId || selectedChatUsername !== username) {
    return;
  }
  homeScreen.setMessages(toHomeMessages(messages));
  homeScreen.setStatus(" ");
  debugLog("conversation loaded", {
    username,
    loadId,
    conversationId,
    messageCount: messages.length,
  });
};

const refreshHomeData = async () => {
  if (!currentUsername) {
    debugLog("home refresh skipped", { reason: "missing current username" });
    homeScreen.setUsers([]);
    homeScreen.setMessages([]);
    homeScreen.setSelectedUser(null);
    homeScreen.setStatus("Log in to view conversations", colors.warning);
    return;
  }

  homeScreen.setCurrentUsername(currentUsername);
  homeScreen.setStatus("Loading conversations...", colors.warning);
  debugLog("home refresh started", { currentUsername });

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
  debugLog("home refresh loaded", {
    profileCount: profiles.length,
    chatUserCount: users.length,
    conversationCount: conversations.length,
  });

  const map = new Map<Username, string>();
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
  homeScreen.setStatus(" ");
};

const handleSelectChatUser = async (username: string) => {
  try {
    await loadConversationForUser(parseUsernameOrThrow(username));
  } catch (error) {
    debugLog("conversation load failed", { username, error });
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
    const normalizedToUsername = parseUsernameOrThrow(toUsername);
    debugLog("message send started", {
      toUsername: normalizedToUsername,
      bodyLength: trimmedBody.length,
    });
    const result = await sendDirectMessage(normalizedToUsername, trimmedBody);
    const conversationId = String(result.conversationId);
    conversationIdByUsername.set(normalizedToUsername, conversationId);
    if (selectedChatUsername === normalizedToUsername && currentUsername) {
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
    debugLog("message sent", {
      toUsername: normalizedToUsername,
      conversationId,
      messageId: result.messageId,
    });
  } catch (error) {
    debugLog("message send failed", { toUsername, error });
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
  debugLog("login started", { hasIdentifier: Boolean(e) });

  try {
    const result = await signInWithEmailAndPassword(e, p);
    currentUsername = result.username;
    debugLog("login succeeded", {
      username: result.username,
      userId: result.userId,
    });
    loginScreen.setStatus(`Logged in as ${result.username}`, "success");
    clearBottomError();
    await showHome();
  } catch (error) {
    debugLog("login failed", { error });
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

  const parsedUsername = parseUsername(username ?? "");
  const p = password ?? "";
  if (!parsedUsername || !p) {
    signUpScreen.setStatus(`Username (${USERNAME_RULES_TEXT}) and password required`, "error");
    return;
  }

  signUpScreen.setStatus("Creating account...", "warning");
  isSubmitting = true;
  debugLog("signup started", { username: parsedUsername });

  try {
    const result = await signUpWithUsernameEmailAndPassword(parsedUsername, p);
    currentUsername = result.username;
    debugLog("signup succeeded", {
      username: result.username,
      userId: result.userId,
    });
    signUpScreen.setStatus(`Logged in as ${result.username}`, "success");
    clearBottomError();
    await showHome();
  } catch (error) {
    debugLog("signup failed", { username: parsedUsername, error });
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
  debugLog("test profile boot started", { autoTestUsername });

  const username = parseUsername(autoTestUsername);
  const password = autoTestPassword;
  if (!username || !password) {
    debugLog("test profile boot skipped", { reason: "invalid credentials" });
    showLogin();
    return;
  }

  try {
    const signedUp = await signUpWithUsernameEmailAndPassword(username, password);
    currentUsername = signedUp.username;
    debugLog("test profile signup succeeded", {
      username: signedUp.username,
      userId: signedUp.userId,
    });
    clearBottomError();
    await showHome();
  } catch {
    try {
      const signedIn = await signInWithEmailAndPassword(username, password);
      currentUsername = signedIn.username;
      debugLog("test profile login succeeded", {
        username: signedIn.username,
        userId: signedIn.userId,
      });
      clearBottomError();
      await showHome();
    } catch (error) {
      debugLog("test profile boot failed", { username, error });
      showLogin();
      setBottomError(error);
    }
  }
};

const bootPersistedSession = async () => {
  debugLog("persisted session boot started");

  const loadUsername = async () => {
    const user = await getCurrentUser();
    return inferUsernameFromCurrentUser(user);
  };

  try {
    let restoredUsername = await loadUsername();
    if (!restoredUsername && await restoreConvexAuthFromSession()) {
      debugLog("persisted session token refreshed");
      restoredUsername = await loadUsername();
    }
    if (!restoredUsername) {
      debugLog("persisted session unavailable");
      return;
    }

    currentUsername = restoredUsername;
    debugLog("persisted session restored", { username: restoredUsername });
    clearBottomError();
    await showHome();
  } catch (error) {
    debugLog("persisted session load failed", { error });
    if (await restoreConvexAuthFromSession()) {
      try {
        const restoredUsername = await loadUsername();
        if (restoredUsername) {
          currentUsername = restoredUsername;
          debugLog("persisted session restored after refresh", {
            username: restoredUsername,
          });
          clearBottomError();
          await showHome();
          return;
        }
      } catch (refreshError) {
        debugLog("persisted session refresh failed", { error: refreshError });
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

renderer.keyInput.on("keypress", (key) => {
  if (activeRoute !== "splash" || isCtrlCKey(key)) {
    return;
  }

  key.preventDefault();
  key.stopPropagation();
  showLogin();
});

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
