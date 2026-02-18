import { TextRenderable, type CliRenderer } from "@opentui/core";
import { colors, type StatusVariant } from "../design";
import { createTwoFieldAuthScreen } from "../primitives/auth_screen_factory";
import { createTextInput } from "../primitives/text_input";

type TextInput = ReturnType<typeof createTextInput>;

type SignUpScreen = {
  view: ReturnType<typeof createAuthFormLayout>["view"];
  usernameInput: TextInput;
  passwordInput: TextInput;
  status: TextRenderable;
  setStatus: (message: string, variant?: StatusVariant) => void;
  focus: () => void;
  getValues: () => { username: string; password: string };
};

type SignUpScreenOptions = {
  onSubmit?: (username: string, password: string) => void;
  onBackToLogin?: () => void;
};

export const createSignUpScreen = (
  renderer: CliRenderer,
  options: SignUpScreenOptions = {},
): SignUpScreen => {
  const authScreen = createTwoFieldAuthScreen(renderer, {
    screenId: "signup",
    formId: "signup-form",
    fields: [
      {
        key: "username",
        id: "signup-username-input",
        label: "Username",
        placeholder: "Enter username...",
      },
      {
        key: "password",
        id: "signup-password-input",
        label: "Password",
        placeholder: "Enter password...",
      },
    ],
    submitButton: {
      id: "signup-button",
      label: "Create account",
      variant: "primary",
    },
    link: {
      id: "back-to-login",
      text: "Back to login",
      color: colors.textMuted,
      onPress: options.onBackToLogin,
    },
    onSubmit: ({ username, password }) => {
      options.onSubmit?.(username, password);
    },
  });
  const usernameInput = authScreen.inputs.username;
  const passwordInput = authScreen.inputs.password;

  return {
    view: authScreen.view,
    usernameInput,
    passwordInput,
    status: authScreen.status as TextRenderable,
    setStatus: authScreen.setStatus,
    focus: authScreen.focus,
    getValues: authScreen.getValues as () => { username: string; password: string },
  };
};
