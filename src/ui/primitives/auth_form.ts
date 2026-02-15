import {
  BoxRenderable,
  TextAttributes,
  TextRenderable,
  type RenderContext,
  type Renderable,
} from "@opentui/core";
import { createCenteredScreen } from "../layout";
import { colors, sizes, spacing, statusStyles, type StatusVariant } from "../design";
import { createLabel } from "./text";

type AuthFormOptions = {
  screenId: string;
  formId: string;
};

type LinkOptions = {
  id: string;
  text: string;
  color?: string;
  underline?: boolean;
  onPress?: () => void;
};

export type AuthFormLayout = {
  view: BoxRenderable;
  form: BoxRenderable;
  status: TextRenderable;
  addField: (label: string, input: Renderable) => void;
  addAction: (action: Renderable) => void;
  addLink: (options: LinkOptions) => void;
  setStatus: (message: string, variant?: StatusVariant) => void;
};

export function createAuthFormLayout(
  renderer: RenderContext,
  options: AuthFormOptions,
): AuthFormLayout {
  const view = createCenteredScreen(renderer, options.screenId);

  const form = new BoxRenderable(renderer, {
    id: options.formId,
    flexDirection: "column",
    width: sizes.authFormWidth,
    border: true,
    padding: spacing.md,
    gap: spacing.sm,
  });

  const fields = new BoxRenderable(renderer, {
    flexDirection: "column",
    gap: spacing.xs,
  });

  const actions = new BoxRenderable(renderer, {
    flexDirection: "column",
    gap: spacing.xs,
  });

  const footer = new BoxRenderable(renderer, {
    flexDirection: "column",
    alignItems: "center",
    gap: spacing.xs,
  });

  const status = new TextRenderable(renderer, {
    content: " ",
    fg: statusStyles.neutral.textColor,
  });

  form.add(fields);
  form.add(actions);
  form.add(status);
  form.add(footer);
  view.add(form);

  const addField = (label: string, input: Renderable) => {
    const row = new BoxRenderable(renderer, {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
    });

    const labelWrap = new BoxRenderable(renderer, {
      width: sizes.authLabelWidth,
    });
    labelWrap.add(createLabel(renderer, label));

    row.add(labelWrap);
    row.add(input);
    fields.add(row);
  };

  const addAction = (action: Renderable) => {
    const row = new BoxRenderable(renderer, {
      flexDirection: "row",
      justifyContent: "center",
      marginTop: spacing.xs,
    });
    row.add(action);
    actions.add(row);
  };

  const addLink = (linkOptions: LinkOptions) => {
    const row = new BoxRenderable(renderer, {
      id: linkOptions.id,
      onMouseUp: () => linkOptions.onPress?.(),
    });
    row.add(
      new TextRenderable(renderer, {
        content: linkOptions.text,
        fg: linkOptions.color ?? colors.teal,
        attributes: linkOptions.underline ? TextAttributes.UNDERLINE : undefined,
      }),
    );
    footer.add(row);
  };

  const setStatus = (message: string, variant: StatusVariant = "neutral") => {
    status.content = message || " ";
    status.fg = statusStyles[variant].textColor;
  };

  return {
    view,
    form,
    status,
    addField,
    addAction,
    addLink,
    setStatus,
  };
}
