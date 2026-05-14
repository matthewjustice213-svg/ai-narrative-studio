import { describe, expect, it } from "vitest";
import { useProjectStore } from "../useProjectStore.js";

describe("selection performance", () => {
  it("does not notify subscribers when selecting the already selected node", () => {
    useProjectStore.setState({ selection: { type: "scene", id: "scene-opening" } });
    let notifications = 0;
    const unsubscribe = useProjectStore.subscribe(() => {
      notifications += 1;
    });

    useProjectStore.getState().selectScene("scene-opening");
    unsubscribe();

    expect(notifications).toBe(0);
  });
});
