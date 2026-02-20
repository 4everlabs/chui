import {
  BoxRenderable,
  InputRenderableEvents,
  LayoutEvents,
  ScrollBoxRenderable,
  TextAttributes,
  TextRenderable,
  type CliRenderer,
} from "@opentui/core";
import { colors, spacing } from "../design";
import { createMessageComposer } from "../primitives/message_composer";
import { createPanel } from "../primitives/panel";
import { createTextBubble } from "../primitives/text_bubble";
import { createTextInput } from "../primitives/text_input";
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
  const computeSidebarWidth = () => Math.max(22, Math.min(28, Math.floor(renderer.width * 0.24)));
  const getSearchInputWidth = (sidebarWidth: number) => Math.max(12, sidebarWidth - 6);
  const getComposerTotalWidth = (sidebarWidth: number) => {
    // Home view uses left/right padding and a single inter-panel gap.
    const appHorizontalPadding = spacing.sm * 2;
    const interPanelGap = spacing.sm;
    // Chat panel also has its own border + horizontal padding that reduce available content width.
    const chatPanelHorizontalPadding = spacing.xs * 2;
    const chatPanelBorder = 2;
    return Math.max(
      24,
      renderer.width
        - sidebarWidth
        - appHorizontalPadding
        - interPanelGap
        - chatPanelHorizontalPadding
        - chatPanelBorder,
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
    flexDirection: "row",
    flexGrow: 1,
    width: "100%",
    gap: spacing.sm,
    padding: spacing.sm,
  });

  const usersPanel = createPanel(renderer, {
    id: "chat-users-panel",
    width: sidebarWidth,
    minWidth: 22,
    flexDirection: "column",
    gap: spacing.sm,
    padding: userCardInset,
  });

  const usersSearch = createTextInput(renderer, {
    id: "chat-users-search",
    width: getSearchInputWidth(sidebarWidth),
    placeholder: "Search",
  });
  usersPanel.add(usersSearch);

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
  usersPanel.add(
    new TextRenderable(renderer, {
      id: "chat-users-version",
      content: `v${APP_VERSION}`,
      fg: colors.textMuted,
    }),
  );

  const chatPanel = createPanel(renderer, {
    id: "chat-panel",
    flexDirection: "column",
    flexGrow: 1,
    padding: spacing.xs,
    gap: 0,
  });

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

  const setStatus = (message: string, color: string = colors.textMuted) => {
    composer.setStatus(message, color);
  };

  const updateHeader = () => {};

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
        border: true,
        borderStyle: "single",
        borderColor: selected ? colors.primary : colors.surfaceBorderMuted,
        backgroundColor: selected ? colors.outgoingBubbleBackground : undefined,
        paddingLeft: userCardInset,
        paddingRight: userCardInset,
        paddingTop: spacing.xs,
        paddingBottom: spacing.xs,
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
      if (selectedUsername) {
        composer.focus();
        return;
      }

      usersSearch.focus();
    },
    setCurrentUsername: (username: string) => {
      currentUsername = username;
      renderMessages();
    },
    setUsers: (nextUsers: HomeChatUser[]) => {
      users = nextUsers;
      if (selectedUsername && !users.some((u) => u.username === selectedUsername)) {
        selectedUsername = null;
      }
      updateHeader();
      renderUsers();
      renderMessages();
    },
    setSelectedUser: (username: string | null) => {
      selectedUsername = username;
      updateHeader();
      renderUsers();
      renderMessages();
    },
    setMessages: (nextMessages: HomeChatMessage[]) => {
      messages = sortMessagesByCreatedAt(nextMessages);
      renderMessages();
    },
    appendMessage: (message: HomeChatMessage) => {
      if (messages.length === 0 || messages[messages.length - 1]!.createdAt <= message.createdAt) {
        messages = [...messages, message];
      } else {
        messages = sortMessagesByCreatedAt([...messages, message]);
      }
      renderMessages();
    },
    clearComposer: () => {
      composer.clear();
    },
    setStatus,
  };
};
