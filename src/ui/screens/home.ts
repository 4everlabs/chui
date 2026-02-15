import {
  BoxRenderable,
  InputRenderableEvents,
  ScrollBoxRenderable,
  TextAttributes,
  TextRenderable,
  type CliRenderer,
} from "@opentui/core";
import { colors, spacing } from "../design";
import { createButton } from "../primitives/button";
import { createTextBubble } from "../primitives/text_bubble";
import { createTextInput } from "../primitives/text_input";

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
  const sidebarWidth = Math.max(22, Math.min(28, Math.floor(renderer.width * 0.24)));
  const searchInputWidth = Math.max(12, sidebarWidth - 6);
  const composerInputWidth = Math.max(
    22,
    Math.min(64, renderer.width - sidebarWidth - 16),
  );
  const replyButtonWidth = Math.max(
    14,
    Math.min(24, Math.floor((renderer.width - sidebarWidth - 8) * 0.5)),
  );

  let currentUsername = "";
  let selectedUsername: string | null = null;
  let users: HomeChatUser[] = [];
  let messages: HomeChatMessage[] = [];
  let sending = false;
  let userSearchQuery = "";
  let userRowIds: string[] = [];
  let messageRowIds: string[] = [];
  const messagePlaceholderId = "chat-placeholder";

  const view = new BoxRenderable(renderer, {
    id: "home",
    flexDirection: "row",
    flexGrow: 1,
    width: "100%",
    gap: spacing.sm,
    padding: spacing.sm,
  });

  const usersPanel = new BoxRenderable(renderer, {
    id: "chat-users-panel",
    width: sidebarWidth,
    minWidth: 22,
    border: true,
    flexDirection: "column",
    gap: spacing.sm,
    padding: spacing.sm,
  });

  const usersSearch = createTextInput(renderer, {
    id: "chat-users-search",
    width: searchInputWidth,
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
    fg: colors.gray100,
    attributes: TextAttributes.BOLD,
  });
  usersListTitleWrap.add(usersListTitle);

  usersPanel.add(usersListTitleWrap);
  usersPanel.add(usersScroll);

  const chatPanel = new BoxRenderable(renderer, {
    id: "chat-panel",
    flexDirection: "column",
    flexGrow: 1,
    border: true,
    padding: spacing.sm,
    gap: spacing.xs,
  });

  const chatTopControls = new BoxRenderable(renderer, {
    id: "chat-top-controls",
    flexDirection: "column",
    gap: spacing.sm,
  });

  const chatMessageBox = new BoxRenderable(renderer, {
    id: "chat-message-box",
    border: true,
    width: "70%",
    minHeight: 5,
    alignSelf: "flex-end",
    alignItems: "center",
    justifyContent: "center",
  });
  const chatHeader = new TextRenderable(renderer, {
    id: "chat-header",
    content: "Message",
    fg: colors.gray100,
  });
  chatMessageBox.add(chatHeader);

  let submitMessage = () => {};
  const replyButton = createButton(renderer, {
    id: "chat-reply-button",
    label: "Reply",
    width: replyButtonWidth,
    height: 5,
    variant: "muted",
    onPress: () => submitMessage(),
  });

  chatTopControls.add(chatMessageBox);
  chatTopControls.add(replyButton);
  chatPanel.add(chatTopControls);

  const messagesScroll = new ScrollBoxRenderable(renderer, {
    id: "chat-messages-scroll",
    flexGrow: 1,
    stickyScroll: true,
    stickyStart: "bottom",
    padding: spacing.xs,
  });
  chatPanel.add(messagesScroll);

  const composerBox = new BoxRenderable(renderer, {
    id: "chat-composer-box",
    border: true,
    padding: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
  });

  const composerInput = createTextInput(renderer, {
    id: "chat-composer-input",
    width: composerInputWidth,
    placeholder: "User types here",
  });

  composerBox.add(composerInput);
  chatPanel.add(composerBox);

  const status = new TextRenderable(renderer, {
    id: "chat-status",
    content: " ",
    fg: colors.gray500,
  });
  chatPanel.add(status);

  view.add(usersPanel);
  view.add(chatPanel);

  const setStatus = (message: string, color: string = colors.gray500) => {
    status.content = message || " ";
    status.fg = color;
  };

  const updateHeader = () => {
    if (!selectedUsername) {
      chatHeader.content = "Message";
      return;
    }

    chatHeader.content = selectedUsername;
  };

  const renderUsers = () => {
    userRowIds.forEach((id) => usersScroll.remove(id));
    userRowIds = [];

    const q = userSearchQuery.trim().toLowerCase();
    const visibleUsers = q
      ? users.filter((user) => user.username.toLowerCase().includes(q))
      : users;

    if (visibleUsers.length === 0) {
      const id = "chat-user-empty";
      usersScroll.add(
        new TextRenderable(renderer, {
          id,
          content: q ? "No match" : "No users found",
          fg: colors.gray500,
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
        borderColor: selected ? colors.teal : colors.gray700,
        backgroundColor: selected ? colors.outgoingBubbleBackground : undefined,
        paddingLeft: spacing.sm,
        paddingRight: spacing.sm,
        paddingTop: spacing.xs,
        paddingBottom: spacing.xs,
        marginBottom: spacing.xs,
        onMouseUp: () => {
          if (selectedUsername !== user.username) {
            selectedUsername = user.username;
            messages = [];
            updateHeader();
            renderUsers();
            renderMessages();
          }

          Promise.resolve(options.onSelectUser?.(user.username)).catch((error) => {
            const message = error instanceof Error ? error.message : String(error);
            setStatus(message, colors.error);
          });
        },
      });

      row.add(
        new TextRenderable(renderer, {
          content: user.username,
          fg: selected ? colors.gray700 : colors.gray100,
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
      const placeholder = new BoxRenderable(renderer, {
        id: messagePlaceholderId,
        alignItems: "center",
        justifyContent: "center",
        flexGrow: 1,
      });
      placeholder.add(
        new TextRenderable(renderer, {
          content: "Chat",
          fg: colors.gray100,
          attributes: TextAttributes.BOLD,
        }),
      );
      messagesScroll.add(placeholder);
      messageRowIds.push(messagePlaceholderId);
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

    const body = composerInput.value.trim();
    if (!body) {
      setStatus("Type a message first", colors.warning);
      return;
    }

    sending = true;
    setStatus("Sending...", colors.warning);

    Promise.resolve(options.onSendMessage?.(selectedUsername, body))
      .then(() => {
        composerInput.value = "";
        setStatus(" ");
      })
      .catch((error) => {
        const message = error instanceof Error ? error.message : String(error);
        setStatus(message, colors.error);
      })
      .finally(() => {
        sending = false;
        composerInput.focus();
      });
  };

  usersSearch.on(InputRenderableEvents.CHANGE, (value: string) => {
    userSearchQuery = value;
    renderUsers();
  });
  composerInput.on(InputRenderableEvents.ENTER, submitMessage);

  updateHeader();
  renderUsers();
  renderMessages();

  return {
    view,
    focus: () => composerInput.focus(),
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
      messages = [...nextMessages].sort((a, b) => a.createdAt - b.createdAt);
      renderMessages();
    },
    clearComposer: () => {
      composerInput.value = "";
    },
    setStatus,
  };
};
