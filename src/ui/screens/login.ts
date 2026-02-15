import {
  InputRenderableEvents,
  TextRenderable,
  type CliRenderer,
} from "@opentui/core";
import { APP_VERSION } from "../../app/version.js";
import { colors, sizes, type StatusVariant } from "../design";
import { createAuthFormLayout } from "../primitives/auth_form";
import { createButton } from "../primitives/button";
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
  const emailInput = createTextInput(renderer, {
    id: "email-input",
    width: sizes.authInputWidth,
    placeholder: "Enter username or email...",
  });

  const passwordInput = createTextInput(renderer, {
    id: "password-input",
    width: sizes.authInputWidth,
    placeholder: "Enter password...",
  });

  const submit = () => {
    options.onSubmit?.(emailInput.value, passwordInput.value);
  };

  const loginButton = createButton(renderer, {
    id: "login-button",
    label: "Log in",
    width: sizes.buttonForm,
    height: sizes.buttonHeight,
    variant: "primary",
    onPress: submit,
  });

  const formLayout = createAuthFormLayout(renderer, {
    screenId: "login",
    formId: "login-form",
  });

  formLayout.addField("User", emailInput);
  formLayout.addField("Password", passwordInput);
  formLayout.addAction(loginButton);
  formLayout.addLink({
    id: "sign-up-link",
    text: "Make an account",
    color: colors.teal,
    underline: true,
    onPress: options.onSignUpClick,
  });
  formLayout.form.add(
    new TextRenderable(renderer, {
      content: `version: ${APP_VERSION}`,
      fg: colors.gray500,
    }),
  );

  [emailInput, passwordInput].forEach((input) => {
    input.on(InputRenderableEvents.ENTER, submit);
  });

  return {
    view: formLayout.view,
    emailInput,
    passwordInput,
    status: formLayout.status,
    setStatus: formLayout.setStatus,
    focus: () => emailInput.focus(),
    getValues: () => ({ email: emailInput.value, password: passwordInput.value }),
  };
};
