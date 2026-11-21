import { afterEach, describe, expect, it } from "vitest";
import { hideLovableBadge } from "@/lib/hide-badge";

describe("Lovable badge scrubber", () => {
  let stop: (() => void) | undefined;
  afterEach(() => stop?.());

  it("hides an injected Edit with Lovable pill", () => {
    document.body.innerHTML = `
      <main>App content</main>
      <div class="host-badge"><span>Edit with Lovable</span><button>x</button></div>
    `;
    stop = hideLovableBadge();
    const badge = document.querySelector(".host-badge") as HTMLElement;
    expect(badge.style.display).toBe("none");
    expect(badge.getAttribute("data-sohoj-hidden-badge")).toBe("1");
    expect(document.querySelector("main")?.textContent).toContain("App content");
  });

  it("leaves normal app text alone", () => {
    document.body.innerHTML = `<p>Edit your routine in Admin Panel</p>`;
    stop = hideLovableBadge();
    expect((document.querySelector("p") as HTMLElement).style.display).not.toBe("none");
  });
});
