import {
  ASCIIFontRenderable,
  BoxRenderable,
  createCliRenderer,
  InputRenderable,
  TextRenderable,
  TextAttributes,
} from "@opentui/core";

const renderer = await createCliRenderer({
  exitOnCtrlC: true,
  targetFps: 30,

});

let splashView: BoxRenderable;
let loginView: BoxRenderable;
let loginInput: InputRenderable;

const showLogin = () => {
  renderer.root.remove("splash");
  renderer.root.add(loginView);
  loginInput.focus();
};

const enterButton = new BoxRenderable(renderer, {
  width: 9,
  height: 5,
  border: true,
  alignItems: "center",
  justifyContent: "center",
  onMouseUp: showLogin,
});
enterButton.add(new TextRenderable(renderer, { content: "enter" }));

splashView = new BoxRenderable(renderer, {
  id: "splash",
  alignItems: "center",
  justifyContent: "center",
  flexGrow: 1,
});

const splashContent = new BoxRenderable(renderer, {
  flexDirection: "column",
  alignItems: "center",
  gap: 1,
});
splashContent.add(new ASCIIFontRenderable(renderer, { font: "block", text: "CHUI" }));
splashContent.add(
  new TextRenderable(renderer, {
    content: "instant messenger for the terminal",
    attributes: TextAttributes.DIM,
  }),
);
splashContent.add(enterButton);
splashView.add(splashContent);

loginInput = new InputRenderable(renderer, {
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

loginView = new BoxRenderable(renderer, {
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
loginView.add(loginContent);

renderer.root.add(splashView);