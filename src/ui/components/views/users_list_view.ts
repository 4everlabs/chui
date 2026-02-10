import {
  BoxRenderable,
  InputRenderableEvents,
  ScrollBoxRenderable,
  TextRenderable,
  type CliRenderer,
} from "@opentui/core";
import { colors, sizes, spacing } from "../../design";
import { createTextInput } from "../primitives";

export type UserListItem = {
  username: string;
  email?: string;
};

type UsersListView = {
  view: BoxRenderable;
  setUsers: (users: UserListItem[]) => void;
  setSearch: (query: string) => void;
  focus: () => void;
};

type UsersListViewOptions = {
  initialUsers?: UserListItem[];
};

export const createUsersListView = (
  renderer: CliRenderer,
  options: UsersListViewOptions = {},
): UsersListView => {
  let users: UserListItem[] = options.initialUsers ?? [];
  let searchQuery = "";

  const searchInput = createTextInput(renderer, {
    id: "users-search-input",
    placeholder: "Search users...",
  });

  const scrollBox = new ScrollBoxRenderable(renderer, {
    id: "users-scroll",
    height: 15,
    showScrollbar: true,
  });

  let listChildIds: string[] = [];

  const renderList = () => {
    listChildIds.forEach((id) => scrollBox.remove(id));
    listChildIds = [];
    const q = searchQuery.trim().toLowerCase();
    const filtered = q
      ? users.filter(
          (u) =>
            u.username.toLowerCase().includes(q) ||
            (u.email?.toLowerCase().includes(q) ?? false),
        )
      : users;

    if (filtered.length === 0) {
      const empty = new TextRenderable(renderer, {
        id: "users-empty",
        content: q ? "No users match your search" : "No users yet",
        fg: colors.gray500,
      });
      scrollBox.add(empty);
      listChildIds.push("users-empty");
      return;
    }

    filtered.forEach((u, i) => {
      const id = `user-${i}`;
      const line = new TextRenderable(renderer, {
        id,
        content: u.email ? `${u.username} (${u.email})` : u.username,
        fg: colors.gray100,
      });
      scrollBox.add(line);
      listChildIds.push(id);
    });
  };

  searchInput.on(InputRenderableEvents.CHANGE, (value: string) => {
    searchQuery = value;
    renderList();
  });

  const view = new BoxRenderable(renderer, {
    id: "users-list",
    flexDirection: "column",
    flexGrow: 1,
    gap: spacing.sm,
    paddingLeft: spacing.md,
    paddingRight: spacing.md,
  });

  const header = new TextRenderable(renderer, {
    content: "CHUI Users",
    fg: colors.teal,
  });
  view.add(header);

  const searchRow = new BoxRenderable(renderer, {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  });
  searchRow.add(searchInput);
  view.add(searchRow);

  view.add(scrollBox);

  renderList();

  return {
    view,
    setUsers: (u: UserListItem[]) => {
      users = u;
      renderList();
    },
    setSearch: (q: string) => {
      searchQuery = q;
      renderList();
    },
    focus: () => searchInput.focus(),
  };
};
