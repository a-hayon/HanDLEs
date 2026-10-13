// @vitest-environment happy-dom
import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import ComponentName from "./ComponentName.vue";

describe("ComponentName", () => {
  it("renders the title and count", () => {
    const wrapper = mount(ComponentName, { props: { title: "Players", count: 3 } });
    expect(wrapper.text()).toContain("Players (3)");
  });

  it("emits `select` with the count on click", async () => {
    const wrapper = mount(ComponentName, { props: { title: "Players", count: 3 } });
    await wrapper.get("button").trigger("click");
    expect(wrapper.emitted("select")).toEqual([[3]]);
  });
});
