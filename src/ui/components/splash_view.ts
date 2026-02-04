import {
  ASCIIFontRenderable,
  BoxRenderable,
  TextAttributes,
  TextRenderable,
  type CliRenderer,
} from "@opentui/core";

type SplashViewOptions = {
  onEnter: () => void;
};

type SplashView = {
  view: BoxRenderable;
};

export const createSplashView = (
  renderer: CliRenderer,
  options: SplashViewOptions,
): SplashView => {
  const enterButton = new BoxRenderable(renderer, {
    width: 9,
    height: 5,
    border: true,
    alignItems: "center",
    justifyContent: "center",
    onMouseUp: options.onEnter,
  });
  enterButton.add(new TextRenderable(renderer, { content: "enter" }));

  const splashView = new BoxRenderable(renderer, {
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
  splashContent.add(
    new ASCIIFontRenderable(renderer, { font: "block", text: "CHUI" }),
  );
  splashContent.add(
    new TextRenderable(renderer, {
      content: "instant messenger for the terminal",
      attributes: TextAttributes.DIM,
    }),
  );
  splashContent.add(enterButton);
  splashView.add(splashContent);

  return { view: splashView };
};
