import {
  BoxRenderable,
  InputRenderable,
  TextRenderable,
  type CliRenderer,
} from "@opentui/core";

type LoginView = {
  view: BoxRenderable;
  input: InputRenderable;
  status: TextRenderable;
  setStatus: (message: string, color: string) => void;
};

export const createLoginView = (renderer: CliRenderer): LoginView => {
  const loginInput = new InputRenderable(renderer, {
    id: "username-input",
    width: 24,
    placeholder: "Enter username...",
  });

  const loginButton = new BoxRenderable(renderer, {
    width: 9,
    height: 3,
    border: true,
    alignItems: "center",
    justifyContent: "center",
  });
  loginButton.add(
    new TextRenderable(renderer, {
      content: "login",
      fg: "#444444",
    }),
  );

  const loginView = new BoxRenderable(renderer, {
    id: "login",
    alignItems: "center",
    justifyContent: "center",
    flexGrow: 1,
  });

  const loginContent = new BoxRenderable(renderer, {
    flexDirection: "column",
    alignItems: "center",
    gap: 1,
  });
  loginContent.add(new TextRenderable(renderer, { content: "username" }));

  const loginRow = new BoxRenderable(renderer, {
    flexDirection: "row",
    alignItems: "center",
    gap: 1,
  });
  loginRow.add(loginInput);
  loginRow.add(loginButton);
  loginContent.add(loginRow);

  const status = new TextRenderable(renderer, {
    content: " ",
    fg: "#94A3B8",
  });
  loginContent.add(status);
  loginView.add(loginContent);

  const setStatus = (message: string, color: string) => {
    status.setContent(message || " ");
    status.setFg(color);
  };

  return {
    view: loginView,
    input: loginInput,
    status,
    setStatus,
  };
};
