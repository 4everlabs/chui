import {
  InputRenderableEvents,
  TextRenderable,
  type CliRenderer,
  type KeyEvent,
} from "@opentui/core";
import { colors, sizes, type StatusVariant } from "../design";
import { createAuthFormLayout } from "./auth_form";
import { createButton } from "./button";
import { createTextInput } from "./text_input";

type TextInput = ReturnType<typeof createTextInput>;

type AuthFieldConfig<TKey extends string> = {
  key: TKey;
  id: string;
  label: string;
  placeholder: string;
};

type AuthLinkConfig = {
  id: string;
  text: string;
  color?: string;
  underline?: boolean;
  onPress?: () => void;
};

type TwoFieldAuthScreenOptions<TKeyOne extends string, TKeyTwo extends string> = {
  screenId: string;
  formId: string;
  fields: [
    AuthFieldConfig<TKeyOne>,
    AuthFieldConfig<TKeyTwo>,
  ];
  submitButton: {
    id: string;
    label: string;
    variant?: "primary" | "accent" | "danger" | "muted";
  };
  link?: AuthLinkConfig;
  footerText?: string;
  footerColor?: string;
  onSubmit?: (values: Record<TKeyOne | TKeyTwo, string>) => void;
};

type TwoFieldAuthScreenResult<TKeyOne extends string, TKeyTwo extends string> = {
  view: ReturnType<typeof createAuthFormLayout>["view"];
  status: TextRenderable;
  setStatus: (message: string, variant?: StatusVariant) => void;
  focus: () => void;
  getValues: () => Record<TKeyOne | TKeyTwo, string>;
  inputs: Record<TKeyOne | TKeyTwo, TextInput>;
};

const bindSubmitAndTabNavigation = (
  inputs: TextInput[],
  submit: () => void,
) => {
  inputs.forEach((input) => {
    input.on(InputRenderableEvents.ENTER, submit);
  });

  const focusInputAt = (index: number) => {
    const total = inputs.length;
    const safeIndex = ((index % total) + total) % total;
    inputs[safeIndex]?.focus();
  };

  inputs.forEach((input, index) => {
    input.onKeyDown = (key: KeyEvent) => {
      if (key.name !== "tab") return;
      key.preventDefault();
      key.stopPropagation();
      focusInputAt(key.shift ? index - 1 : index + 1);
    };
  });
};

export const createTwoFieldAuthScreen = <
  TKeyOne extends string,
  TKeyTwo extends string,
>(
  renderer: CliRenderer,
  options: TwoFieldAuthScreenOptions<TKeyOne, TKeyTwo>,
): TwoFieldAuthScreenResult<TKeyOne, TKeyTwo> => {
  const [fieldOne, fieldTwo] = options.fields;

  const inputOne = createTextInput(renderer, {
    id: fieldOne.id,
    width: sizes.authInputWidth,
    placeholder: fieldOne.placeholder,
  });
  const inputTwo = createTextInput(renderer, {
    id: fieldTwo.id,
    width: sizes.authInputWidth,
    placeholder: fieldTwo.placeholder,
  });

  const getValues = () => ({
    [fieldOne.key]: inputOne.value,
    [fieldTwo.key]: inputTwo.value,
  }) as Record<TKeyOne | TKeyTwo, string>;

  const submit = () => {
    options.onSubmit?.(getValues());
  };

  const actionButton = createButton(renderer, {
    id: options.submitButton.id,
    label: options.submitButton.label,
    width: sizes.buttonForm,
    height: sizes.buttonHeight,
    variant: options.submitButton.variant ?? "primary",
    onPress: submit,
  });

  const formLayout = createAuthFormLayout(renderer, {
    screenId: options.screenId,
    formId: options.formId,
  });
  formLayout.addField(fieldOne.label, inputOne);
  formLayout.addField(fieldTwo.label, inputTwo);
  formLayout.addAction(actionButton);

  if (options.link) {
    formLayout.addLink(options.link);
  }

  if (options.footerText) {
    formLayout.form.add(
      new TextRenderable(renderer, {
        content: options.footerText,
        fg: options.footerColor ?? colors.textMuted,
      }),
    );
  }

  bindSubmitAndTabNavigation([inputOne, inputTwo], submit);

  return {
    view: formLayout.view,
    status: formLayout.status,
    setStatus: formLayout.setStatus,
    focus: () => inputOne.focus(),
    getValues,
    inputs: {
      [fieldOne.key]: inputOne,
      [fieldTwo.key]: inputTwo,
    } as Record<TKeyOne | TKeyTwo, TextInput>,
  };
};
