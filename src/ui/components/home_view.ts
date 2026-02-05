import { BoxRenderable, type CliRenderer } from "@opentui/core";

type HomeView = {
  view: BoxRenderable;
};

export const createHomeView = (renderer: CliRenderer): HomeView => {
  const homeView = new BoxRenderable(renderer, {
    id: "home",
    alignItems: "center",
    justifyContent: "center",
    flexGrow: 1,
  });

  return { view: homeView };
};
