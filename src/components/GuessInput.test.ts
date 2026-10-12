// @vitest-environment happy-dom
import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import GuessInput from "./GuessInput.vue";

const options = [
  { id: 1, name: "Nikola Jokić", teamName: "Denver Nuggets" },
  { id: 6, name: "Luka Dončić", teamName: "Los Angeles Lakers" },
  { id: 15, name: "Victor Wembanyama", teamName: "San Antonio Spurs" },
];

describe("GuessInput", () => {
  it("filters regardless of accents", async () => {
    const wrapper = mount(GuessInput, { props: { options, excluded: new Set<number>() } });
    await wrapper.get("input").setValue("doncic");
    const items = wrapper.findAll("li");
    expect(items).toHaveLength(1);
    expect(items[0].text()).toContain("Luka Dončić");
  });

  it("hides players that were already guessed", async () => {
    const wrapper = mount(GuessInput, { props: { options, excluded: new Set([6]) } });
    await wrapper.get("input").setValue("doncic");
    expect(wrapper.findAll("li")).toHaveLength(0);
    expect(wrapper.text()).toContain("No player found");
  });

  it("emits `pick` with the id of the player chosen with the keyboard", async () => {
    const wrapper = mount(GuessInput, { props: { options, excluded: new Set<number>() } });
    const input = wrapper.get("input");
    await input.setValue("i"); // Jokić, Dončić, Wembanyama
    await input.trigger("keydown", { key: "ArrowDown" });
    await input.trigger("keydown", { key: "Enter" });
    expect(wrapper.emitted("pick")).toEqual([[6]]);
    expect(input.element.value).toBe("");
  });
});
