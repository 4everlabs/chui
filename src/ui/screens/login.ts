import { TextRenderable, type CliRenderer } from "@opentui/core";
import { APP_VERSION } from "../../app/version.js";
import { colors, type StatusVariant } from "../design";
import { createTwoFieldAuthScreen } from "../primitives/auth_screen_factory";
import { createTextInput } from "../primitives/text_input";

type TextInput = ReturnType<typeof createTextInput>;

type LoginScreen = {
  view: ReturnType<typeof createAuthFormLayout>["view"];
  emailInput: TextInput;
  passwordInput: TextInput;
  status: TextRenderable;
  setStatus: (message: string, variant?: StatusVariant) => void;
  focus: () => void;
  getValues: () => { email: string; password: string };
};

type LoginScreenOptions = {
  onSubmit?: (email: string, password: string) => void;
  onSignUpClick?: () => void;
};

export const createLoginScreen = (
  renderer: CliRenderer,
  options: LoginScreenOptions = {},
): LoginScreen => {
  const authScreen = createTwoFieldAuthScreen(renderer, {
    screenId: "login",
    formId: "login-form",
    fields: [
      {
        key: "email",
        id: "email-input",
        label: "User",
        placeholder: "Enter username or email...",
      },
      {
        key: "password",
        id: "password-input",
        label: "Password",
        placeholder: "Enter password...",
      },
    ],
    submitButton: {
      id: "login-button",
      label: "Log in",
      variant: "primary",
    },
    link: {
      id: "sign-up-link",
      text: "Make an account",
      color: colors.accent,
      underline: true,
      onPress: options.onSignUpClick,
    },
    footerText: `version: ${APP_VERSION}`,
    footerColor: colors.textMuted,
    onSubmit: ({ email, password }) => {
      options.onSubmit?.(email, password);
    },
  });
  const emailInput = authScreen.inputs.email;
  const passwordInput = authScreen.inputs.password;

  return {
    view: authScreen.view,
    emailInput,
    passwordInput,
    status: authScreen.status as TextRenderable,
    setStatus: authScreen.setStatus,
    focus: authScreen.focus,
    getValues: authScreen.getValues as () => { email: string; password: string },
  };
};
