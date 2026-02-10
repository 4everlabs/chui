import {
  BoxRenderable,
  TextRenderable,
  type CliRenderer,
} from "@opentui/core";
import { colors, spacing } from "../../design";
import { createTextBubble } from "../primitives";

type HomeView = {
  view: BoxRenderable;
};

type HomeViewOptions = {
  onUsersClick?: () => void;
};

export const createHomeView = (
  renderer: CliRenderer,
  options: HomeViewOptions = {},
): HomeView => {
  const homeView = new BoxRenderable(renderer, {
    id: "home",
    flexDirection: "column",
    alignItems: "stretch",
    justifyContent: "center",
    flexGrow: 1,
    paddingLeft: spacing.md,
    paddingRight: spacing.md,
    gap: spacing.sm,
  });

  homeView.add(
    createTextBubble(renderer, {
      id: "sample-bubble-incoming",
      text: "Welcome to CHUI. This is an incoming message bubble.",
      variant: "incoming",
    }),
  );
  homeView.add(
    createTextBubble(renderer, {
      id: "sample-bubble-outgoing",
      text: "Nice. Outgoing messages are right-aligned with their own style.",
      variant: "outgoing",
    }),
  );

  if (options.onUsersClick) {
    const usersLink = new BoxRenderable(renderer, {
      id: "users-link",
      paddingTop: spacing.sm,
      onMouseUp: () => options.onUsersClick?.(),
    });
    usersLink.add(
      new TextRenderable(renderer, {
        content: "Users",
        fg: colors.teal,
      }),
    );
    homeView.add(usersLink);
  }

  return { view: homeView };
};
