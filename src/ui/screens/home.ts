import {
  BoxRenderable,
  InputRenderableEvents,
  type KeyEvent,
  LayoutEvents,
  type Renderable,
  ScrollBoxRenderable,
  TextAttributes,
  TextRenderable,
  type CliRenderer,
} from "@opentui/core";
import { colors, spacing } from "../design";
import { createButton } from "../primitives/button";
import { createMessageComposer } from "../primitives/message_composer";
import { createPanel } from "../primitives/panel";
import { createTextBubble } from "../primitives/text_bubble";
import { createTextInput } from "../primitives/text_input";
import { isActivationKey } from "../primitives/keyboard";
import {
  filterUsersByQuery,
  sortMessagesByCreatedAt,
  toErrorMessage,
} from "./home_utils";
import { APP_VERSION } from "../../app/version.js";

export type HomeChatUser = {
  username: string;
};

export type HomeChatMessage = {
  id?: string;
  senderUsername: string;
  body: string;
  createdAt: number;
};

type HomeScreen = {
  view: BoxRenderable;
  focus: () => void;
  setCurrentUsername: (username: string) => void;
  setUsers: (users: HomeChatUser[]) => void;
  setSelectedUser: (username: string | null) => void;
  setMessages: (messages: HomeChatMessage[]) => void;
  appendMessage: (message: HomeChatMessage) => void;
  clearComposer: () => void;
  setStatus: (message: string, color?: string) => void;
};

type HomeScreenOptions = {
  onSelectUser?: (username: string) => void | Promise<void>;
  onSendMessage?: (toUsername: string, body: string) => void | Promise<void>;
};

export const createHomeScreen = (
  renderer: CliRenderer,
  options: HomeScreenOptions = {},
): HomeScreen => {
  const userCardInset = spacing.xs;
  let compactSidebar = false;
  let settingsOpen = false;
  let showVersion = true;

  const computeSidebarWidth = () => {
    if (compactSidebar) {
      return Math.max(18, Math.min(22, Math.floor(renderer.width * 0.2)));
    }

    return Math.max(22, Math.min(28, Math.floor(renderer.width * 0.24)));
  };
  const getSearchInputWidth = (sidebarWidth: number) => Math.max(12, sidebarWidth - 4);
  const getComposerTotalWidth = (sidebarWidth: number) => {
    const outerBorderWidth = 2;
    const chatPanelHorizontalPadding = spacing.xs * 2;
    return Math.max(
      24,
      renderer.width
        - sidebarWidth
        - outerBorderWidth
        - chatPanelHorizontalPadding,
    );
  };
  let sidebarWidth = computeSidebarWidth();
  const composerBaseWidth = getComposerTotalWidth(sidebarWidth);

  let currentUsername = "";
  let selectedUsername: string | null = null;
  let users: HomeChatUser[] = [];
  let messages: HomeChatMessage[] = [];
  let sending = false;
  let userSearchQuery = "";
  let userRowIds: string[] = [];
  let messageRowIds: string[] = [];

  const view = new BoxRenderable(renderer, {
    id: "home",
    position: "relative",
    flexDirection: "row",
    flexGrow: 1,
    width: "100%",
    height: "100%",
    border: true,
    borderStyle: "single",
    borderColor: colors.surfaceBorder,
    gap: 0,
    padding: 0,
  });

  const usersPanel = createPanel(renderer, {
    id: "chat-users-panel",
    width: sidebarWidth,
    minWidth: 22,
    border: ["right"],
    borderColor: colors.surfaceBorder,
    flexDirection: "column",
    gap: spacing.sm,
    padding: 0,
  });

  const usersSearch = createTextInput(renderer, {
    id: "chat-users-search",
    width: getSearchInputWidth(sidebarWidth),
    placeholder: "Search",
  });
  const usersSearchWrap = new BoxRenderable(renderer, {
    id: "chat-users-search-wrap",
    width: "100%",
    paddingLeft: spacing.xs,
    paddingRight: spacing.xs,
  });
  usersSearchWrap.add(usersSearch);
  usersPanel.add(usersSearchWrap);

  const usersScroll = new ScrollBoxRenderable(renderer, {
    id: "chat-users-scroll",
    flexGrow: 1,
    stickyScroll: true,
    stickyStart: "top",
  });

  const usersListTitleWrap = new BoxRenderable(renderer, {
    id: "chat-users-list-title-wrap",
    alignItems: "center",
    justifyContent: "center",
    flexGrow: 1,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  });
  const usersListTitle = new TextRenderable(renderer, {
    id: "chat-users-list-title",
    content: "User List",
    fg: colors.textPrimary,
    attributes: TextAttributes.BOLD,
  });
  usersListTitleWrap.add(usersListTitle);

  usersPanel.add(usersListTitleWrap);
  usersPanel.add(usersScroll);
  const versionText = new TextRenderable(renderer, {
    id: "chat-users-version",
    content: `v${APP_VERSION}`,
    fg: colors.textMuted,
  });
  usersPanel.add(versionText);

  const chatPanel = createPanel(renderer, {
    id: "chat-panel",
    border: false,
    flexDirection: "column",
    flexGrow: 1,
    paddingTop: spacing.xs,
    paddingRight: spacing.xs,
    paddingLeft: spacing.xs,
    paddingBottom: 0,
    gap: 0,
  });

  const settingsButton = createButton(renderer, {
    id: "chat-settings-button",
    label: "⚙ Settings",
    width: 12,
    height: 3,
    variant: "muted",
    onPress: () => toggleSettingsPanel(),
  });

  const chatTopBar = new BoxRenderable(renderer, {
    id: "chat-top-bar",
    width: "100%",
    height: 3,
    alignItems: "center",
    justifyContent: "flex-end",
  });
  chatTopBar.add(settingsButton);
  chatPanel.add(chatTopBar);

  const settingsOverlay = new BoxRenderable(renderer, {
    id: "chat-settings-overlay",
    position: "absolute",
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
    width: "100%",
    height: "100%",
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    visible: false,
  });
  const settingsModal = new BoxRenderable(renderer, {
    id: "chat-settings-modal",
    width: 68,
    maxWidth: "92%",
    border: true,
    borderStyle: "double",
    borderColor: colors.primary,
    backgroundColor: colors.textInverted,
    flexDirection: "column",
    gap: spacing.xs,
    padding: spacing.sm,
  });
  settingsOverlay.add(settingsModal);

  const settingsHeader = new BoxRenderable(renderer, {
    id: "chat-settings-header",
    width: "100%",
    height: 3,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  });
  const settingsTitleWrap = new BoxRenderable(renderer, {
    id: "chat-settings-title-wrap",
    flexDirection: "column",
  });
  settingsTitleWrap.add(
    new TextRenderable(renderer, {
      id: "chat-settings-title",
      content: "Settings",
      fg: colors.textPrimary,
      attributes: TextAttributes.BOLD,
      selectable: false,
    }),
  );
  settingsTitleWrap.add(
    new TextRenderable(renderer, {
      id: "chat-settings-subtitle",
      content: "User and chat preferences",
      fg: colors.textMuted,
      selectable: false,
    }),
  );
  const closeSettingsButton = createButton(renderer, {
    id: "chat-settings-close",
    label: "Close",
    width: 9,
    height: 3,
    variant: "muted",
    onPress: () => closeSettingsPanel(),
  });
  settingsHeader.add(settingsTitleWrap);
  settingsHeader.add(closeSettingsButton);
  settingsModal.add(settingsHeader);

  const settingsColumns = new BoxRenderable(renderer, {
    id: "chat-settings-columns",
    width: "100%",
    flexDirection: "row",
    gap: spacing.sm,
  });
  settingsModal.add(settingsColumns);

  const userSettingsPanel = new BoxRenderable(renderer, {
    id: "chat-user-settings-panel",
    width: "50%",
    border: true,
    borderStyle: "single",
    borderColor: colors.surfaceBorder,
    flexDirection: "column",
    gap: spacing.xs,
    padding: spacing.xs,
    title: "User settings",
    titleColor: colors.textPrimary,
  });
  const chatSettingsPanel = new BoxRenderable(renderer, {
    id: "chat-conversation-settings-panel",
    width: "50%",
    border: true,
    borderStyle: "single",
    borderColor: colors.surfaceBorder,
    flexDirection: "column",
    gap: spacing.xs,
    padding: spacing.xs,
    title: "Chat settings",
    titleColor: colors.textPrimary,
  });
  settingsColumns.add(userSettingsPanel);
  settingsColumns.add(chatSettingsPanel);

  const createInfoRow = (id: string, label: string, value: string) => {
    const row = new BoxRenderable(renderer, {
      id,
      width: "100%",
      height: 1,
      flexDirection: "row",
      justifyContent: "space-between",
      gap: spacing.xs,
    });
    row.add(
      new TextRenderable(renderer, {
        content: label,
        fg: colors.textSecondary,
        selectable: false,
      }),
    );
    const valueText = new TextRenderable(renderer, {
      id: `${id}-value`,
      content: value,
      fg: colors.textMuted,
      selectable: false,
    });
    row.add(valueText);

    return { row, valueText };
  };

  const createSettingsRow = (
    id: string,
    label: string,
    value: string,
    onPress: () => void,
  ) => {
    const row = new BoxRenderable(renderer, {
      id,
      width: "100%",
      height: 3,
      border: true,
      borderStyle: "single",
      borderColor: colors.surfaceBorderMuted,
      focusedBorderColor: colors.primary,
      focusable: true,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingLeft: spacing.xs,
      paddingRight: spacing.xs,
      onMouseUp: onPress,
    });
    row.add(
      new TextRenderable(renderer, {
        content: label,
        fg: colors.textSecondary,
        selectable: false,
      }),
    );
    const valueText = new TextRenderable(renderer, {
      id: `${id}-value`,
      content: value,
      fg: colors.textMuted,
      selectable: false,
    });
    row.add(valueText);
    row.onKeyDown = (key) => handleModalKey(key, onPress);

    return { row, valueText };
  };

  const currentUserSetting = createInfoRow(
    "chat-settings-current-user-row",
    "Username",
    "not loaded",
  );
  userSettingsPanel.add(currentUserSetting.row);

  const appVersionSetting = createInfoRow(
    "chat-settings-app-version-row",
    "App version",
    `v${APP_VERSION}`,
  );
  userSettingsPanel.add(appVersionSetting.row);

  const versionSetting = createSettingsRow(
    "chat-settings-version-row",
    "Version badge",
    "on",
    () => {
      showVersion = !showVersion;
      updateSettingsView();
    },
  );
  userSettingsPanel.add(versionSetting.row);

  const selectedChatSetting = createInfoRow(
    "chat-settings-selected-chat-row",
    "Selected chat",
    "none",
  );
  chatSettingsPanel.add(selectedChatSetting.row);

  const availableUsersSetting = createInfoRow(
    "chat-settings-users-row",
    "Available users",
    "0",
  );
  chatSettingsPanel.add(availableUsersSetting.row);

  const messageCountSetting = createInfoRow(
    "chat-settings-messages-row",
    "Messages loaded",
    "0",
  );
  chatSettingsPanel.add(messageCountSetting.row);

  const compactSidebarSetting = createSettingsRow(
    "chat-settings-sidebar-row",
    "Compact sidebar",
    "off",
    () => {
      compactSidebar = !compactSidebar;
      syncResponsiveWidths();
      updateSettingsView();
    },
  );
  chatSettingsPanel.add(compactSidebarSetting.row);

  const messagesScroll = new ScrollBoxRenderable(renderer, {
    id: "chat-messages-scroll",
    flexGrow: 1,
    stickyScroll: true,
    stickyStart: "bottom",
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: spacing.xs,
    paddingRight: spacing.xs,
    verticalScrollbarOptions: {
      visible: false,
    },
    horizontalScrollbarOptions: {
      visible: false,
    },
  });
  chatPanel.add(messagesScroll);

  const composer = createMessageComposer(renderer, {
    idPrefix: "chat-composer",
    totalWidth: composerBaseWidth,
    placeholder: "User types here",
  });
  let submitMessage = () => {};
  composer.setOnSubmit(() => submitMessage());
  chatPanel.add(composer.view);

  view.add(usersPanel);
  view.add(chatPanel);
  view.add(settingsOverlay);

  const modalFocusables: Renderable[] = [
    closeSettingsButton,
    versionSetting.row,
    compactSidebarSetting.row,
  ];
  let modalFocusIndex = 0;

  const setStatus = (message: string, color: string = colors.textMuted) => {
    composer.setStatus(message, color);
  };

  const updateHeader = () => {};

  function toggleSettingsPanel() {
    if (settingsOpen) {
      closeSettingsPanel();
      return;
    }

    openSettingsPanel();
  }

  function openSettingsPanel() {
    settingsOpen = true;
    updateSettingsView();
    modalFocusIndex = 0;
    modalFocusables[modalFocusIndex]?.focus();
  }

  function closeSettingsPanel() {
    settingsOpen = false;
    updateSettingsView();
    settingsButton.focus();
  }

  function handleModalKey(key: KeyEvent, onActivate?: () => void) {
    if (key.name === "escape") {
      key.preventDefault();
      key.stopPropagation();
      closeSettingsPanel();
      return;
    }

    if (key.name === "tab") {
      key.preventDefault();
      key.stopPropagation();
      const direction = key.shift ? -1 : 1;
      modalFocusIndex =
        (modalFocusIndex + direction + modalFocusables.length) % modalFocusables.length;
      modalFocusables[modalFocusIndex]?.focus();
      return;
    }

    if (onActivate && isActivationKey(key)) {
      key.preventDefault();
      key.stopPropagation();
      onActivate();
    }
  }

  function updateSettingsView() {
    settingsOverlay.visible = settingsOpen;
    compactSidebarSetting.valueText.content = compactSidebar ? "on" : "off";
    versionSetting.valueText.content = showVersion ? "on" : "off";
    versionText.visible = showVersion;
    currentUserSetting.valueText.content = currentUsername || "not loaded";
    appVersionSetting.valueText.content = `v${APP_VERSION}`;
    selectedChatSetting.valueText.content = selectedUsername ?? "none";
    availableUsersSetting.valueText.content = String(users.length);
    messageCountSetting.valueText.content = String(messages.length);
  }

  closeSettingsButton.onKeyDown = (key) => handleModalKey(key, closeSettingsPanel);

  const renderUsers = () => {
    userRowIds.forEach((id) => usersScroll.remove(id));
    userRowIds = [];

    const q = userSearchQuery.trim().toLowerCase();
    const visibleUsers = filterUsersByQuery(users, userSearchQuery);

    if (visibleUsers.length === 0) {
      const id = "chat-user-empty";
      usersScroll.add(
        new TextRenderable(renderer, {
          id,
          content: q ? "No match" : "No users found",
          fg: colors.textMuted,
        }),
      );
      userRowIds.push(id);
      return;
    }

    visibleUsers.forEach((user, index) => {
      const id = `chat-user-${index}`;
      const selected = user.username === selectedUsername;
      const row = new BoxRenderable(renderer, {
        id,
        border: ["bottom"],
        borderStyle: "single",
        borderColor: selected ? colors.primary : colors.surfaceBorderMuted,
        backgroundColor: selected ? colors.outgoingBubbleBackground : undefined,
        alignSelf: "stretch",
        paddingLeft: spacing.xs,
        paddingRight: spacing.xs,
        paddingTop: 0,
        paddingBottom: 0,
        marginBottom: userCardInset,
        onMouseUp: () => {
          if (selectedUsername !== user.username) {
            selectedUsername = user.username;
            messages = [];
            updateHeader();
            renderUsers();
            renderMessages();
          }

          Promise.resolve(options.onSelectUser?.(user.username)).catch((error) => {
            setStatus(toErrorMessage(error), colors.error);
          });
        },
      });

      row.add(
        new TextRenderable(renderer, {
          content: user.username,
          fg: selected ? colors.textInverted : colors.textPrimary,
        }),
      );

      usersScroll.add(row);
      userRowIds.push(id);
    });
  };

  const renderMessages = () => {
    messageRowIds.forEach((id) => messagesScroll.remove(id));
    messageRowIds = [];

    if (messages.length === 0) {
      const emptyId = "chat-message-empty";
      const emptyState = new BoxRenderable(renderer, {
        id: emptyId,
        width: "100%",
        flexGrow: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingBottom: spacing.md,
      });
      emptyState.add(
        new TextRenderable(renderer, {
          content: selectedUsername ? "No messages yet. Send the first message." : "Select a user to view messages",
          fg: colors.textMuted,
        }),
      );
      messagesScroll.add(emptyState);
      messageRowIds.push(emptyId);
      return;
    }

    messages.forEach((message, index) => {
      const bubbleId = message.id ?? `chat-message-${index}`;
      const variant =
        message.senderUsername === currentUsername ? "outgoing" : "incoming";
      messagesScroll.add(
        createTextBubble(renderer, {
          id: bubbleId,
          text: message.body,
          variant,
        }),
      );
      messageRowIds.push(bubbleId);
    });

    messagesScroll.scrollTo({
      x: 0,
      y: messagesScroll.scrollHeight,
    });
  };

  submitMessage = () => {
    if (sending) return;
    if (!selectedUsername) {
      setStatus("Select a user first", colors.warning);
      return;
    }

    const body = composer.getValue().trim();
    if (!body) {
      setStatus("Type a message first", colors.warning);
      return;
    }

    sending = true;
    setStatus("Sending...", colors.warning);

    Promise.resolve(options.onSendMessage?.(selectedUsername, body))
      .then(() => {
        composer.clear();
        setStatus(" ");
      })
      .catch((error) => {
        setStatus(toErrorMessage(error), colors.error);
      })
      .finally(() => {
        sending = false;
        composer.focus();
      });
  };

  usersSearch.on(InputRenderableEvents.CHANGE, (value: string) => {
    userSearchQuery = value;
    renderUsers();
  });

  const syncResponsiveWidths = () => {
    sidebarWidth = computeSidebarWidth();
    usersPanel.width = sidebarWidth;
    usersSearchWrap.width = sidebarWidth;
    usersSearch.width = getSearchInputWidth(sidebarWidth);
    composer.setTotalWidth(getComposerTotalWidth(sidebarWidth));
  };

  renderer.root.on(LayoutEvents.RESIZED, () => {
    syncResponsiveWidths();
  });

  syncResponsiveWidths();
  updateHeader();
  renderUsers();
  renderMessages();

  return {
    view,
    focus: () => {
      if (settingsOpen) {
        modalFocusables[modalFocusIndex]?.focus();
        return;
      }

      if (selectedUsername) {
        composer.focus();
        return;
      }

      usersSearch.focus();
    },
    setCurrentUsername: (username: string) => {
      currentUsername = username;
      updateSettingsView();
      renderMessages();
    },
    setUsers: (nextUsers: HomeChatUser[]) => {
      users = nextUsers;
      if (selectedUsername && !users.some((u) => u.username === selectedUsername)) {
        selectedUsername = null;
      }
      updateHeader();
      updateSettingsView();
      renderUsers();
      renderMessages();
    },
    setSelectedUser: (username: string | null) => {
      selectedUsername = username;
      updateHeader();
      updateSettingsView();
      renderUsers();
      renderMessages();
    },
    setMessages: (nextMessages: HomeChatMessage[]) => {
      messages = sortMessagesByCreatedAt(nextMessages);
      updateSettingsView();
      renderMessages();
    },
    appendMessage: (message: HomeChatMessage) => {
      if (messages.length === 0 || messages[messages.length - 1]!.createdAt <= message.createdAt) {
        messages = [...messages, message];
      } else {
        messages = sortMessagesByCreatedAt([...messages, message]);
      }
      updateSettingsView();
      renderMessages();
    },
    clearComposer: () => {
      composer.clear();
    },
    setStatus,
  };
};
