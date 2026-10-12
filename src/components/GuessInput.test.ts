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
  it("filtre sans tenir compte des accents", async () => {
    const wrapper = mount(GuessInput, { props: { options, excluded: new Set<number>() } });
    await wrapper.get("input").setValue("doncic");
    const items = wrapper.findAll("li");
    expect(items).toHaveLength(1);
    expect(items[0].text()).toContain("Luka Dončić");
  });

  it("n'affiche pas les joueurs déjà proposés", async () => {
    const wrapper = mount(GuessInput, { props: { options, excluded: new Set([6]) } });
    await wrapper.get("input").setValue("doncic");
    expect(wrapper.findAll("li")).toHaveLength(0);
    expect(wrapper.text()).toContain("Aucun joueur trouvé");
  });

  it("émet `pick` avec l'id du joueur choisi au clavier", async () => {
    const wrapper = mount(GuessInput, { props: { options, excluded: new Set<number>() } });
    const input = wrapper.get("input");
    await input.setValue("i"); // Jokić, Dončić, Wembanyama
    await input.trigger("keydown", { key: "ArrowDown" });
    await input.trigger("keydown", { key: "Enter" });
    expect(wrapper.emitted("pick")).toEqual([[6]]);
    expect(input.element.value).toBe("");
  });
});
