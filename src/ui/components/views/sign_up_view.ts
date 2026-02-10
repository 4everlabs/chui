import {
  BoxRenderable,
  InputRenderableEvents,
  TextRenderable,
  type CliRenderer,
} from "@opentui/core";
import { colors, sizes, spacing } from "../../design";
import { createButton, createLabel, createTextInput } from "../primitives";

type TextInput = ReturnType<typeof createTextInput>;

type SignUpView = {
  view: BoxRenderable;
  usernameInput: TextInput;
  emailInput: TextInput;
  passwordInput: TextInput;
  status: TextRenderable;
  setStatus: (message: string, color: string) => void;
  focus: () => void;
  getValues: () => { username: string; email: string; password: string };
};

type SignUpViewOptions = {
  onSubmit?: (username: string, email: string, password: string) => void;
  onBackToLogin?: () => void;
};

export const createSignUpView = (
  renderer: CliRenderer,
  options: SignUpViewOptions = {},
): SignUpView => {
  const usernameInput = createTextInput(renderer, {
    id: "signup-username-input",
    placeholder: "Enter username...",
  });

  const emailInput = createTextInput(renderer, {
    id: "signup-email-input",
    placeholder: "Enter email (for password reset)...",
  });

  const passwordInput = createTextInput(renderer, {
    id: "signup-password-input",
    placeholder: "Enter password...",
  });

  const submit = () => {
    options.onSubmit?.(
      usernameInput.value,
      emailInput.value,
      passwordInput.value,
    );
  };

  const signUpButton = createButton(renderer, {
    id: "signup-button",
    label: "Create account",
    width: 14,
    height: sizes.buttonHeight,
    variant: "primary",
    onPress: submit,
  });

  const formWidth = 44;

  const formBox = new BoxRenderable(renderer, {
    id: "signup-form",
    flexDirection: "column",
    padding: spacing.md,
    border: true,
    width: formWidth,
    gap: spacing.sm,
  });

  const usernameRow = new BoxRenderable(renderer, {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  });
  usernameRow.add(createLabel(renderer, "Username"));
  usernameRow.add(usernameInput);
  formBox.add(usernameRow);

  const emailRow = new BoxRenderable(renderer, {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  });
  emailRow.add(createLabel(renderer, "Email"));
  emailRow.add(emailInput);
  formBox.add(emailRow);

  const passwordRow = new BoxRenderable(renderer, {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  });
  passwordRow.add(createLabel(renderer, "Password"));
  passwordRow.add(passwordInput);
  formBox.add(passwordRow);

  const buttonRow = new BoxRenderable(renderer, {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: spacing.xs,
  });
  buttonRow.add(signUpButton);
  formBox.add(buttonRow);

  const status = new TextRenderable(renderer, {
    content: " ",
    fg: colors.gray500,
  });
  formBox.add(status);

  const backLink = new BoxRenderable(renderer, {
    id: "back-to-login",
    paddingTop: spacing.xs,
    onMouseUp: () => options.onBackToLogin?.(),
  });
  backLink.add(
    new TextRenderable(renderer, {
      content: "Back to login",
      fg: colors.gray500,
    }),
  );
  formBox.add(backLink);

  const signUpView = new BoxRenderable(renderer, {
    id: "signup",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    flexGrow: 1,
    width: "100%",
  });
  signUpView.add(formBox);

  [usernameInput, emailInput, passwordInput].forEach((input) => {
    input.on(InputRenderableEvents.ENTER, submit);
  });

  const setStatus = (message: string, color: string) => {
    status.content = message || " ";
    status.fg = color;
  };

  return {
    view: signUpView,
    usernameInput,
    emailInput,
    passwordInput,
    status,
    setStatus,
    focus: () => usernameInput.focus(),
    getValues: () => ({
      username: usernameInput.value,
      email: emailInput.value,
      password: passwordInput.value,
    }),
  };
};
