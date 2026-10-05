import { describe, expect, it } from "vitest";
import { NAV, PAGE_TITLES, SETTINGS_ITEM } from "./config";

describe("nav config", () => {
  it("has a unique href per item across all groups", () => {
    const hrefs = NAV.flatMap((g) => g.items.map((i) => i.href));
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it("has a page title for every nav item and the settings item", () => {
    const hrefs = [...NAV.flatMap((g) => g.items.map((i) => i.href)), SETTINGS_ITEM.href];
    for (const href of hrefs) {
      expect(PAGE_TITLES[href]).toBeTruthy();
    }
  });
});
