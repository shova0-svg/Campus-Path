import { readFileSync } from "node:fs";
import path from "node:path";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Logo } from "@/components/brand/Logo";

const manifest = JSON.parse(
  readFileSync(path.join(process.cwd(), "public/manifest.webmanifest"), "utf8"),
) as { name: string; short_name: string; theme_color: string; background_color: string };

describe("Campus Path PWA manifest", () => {
  it("uses the new brand name and colors", () => {
    expect(manifest.name).toBe("Campus Path");
    expect(manifest.short_name).toBe("Campus Path");
    expect(manifest.theme_color).toBe("#0B1F3A");
    expect(manifest.background_color).toBe("#0B1F3A");
  });
});

describe("<Logo>", () => {
  it("renders an accessible Campus Path icon", () => {
    render(<Logo variant="icon" size={40} />);
    expect(screen.getByAltText("Campus Path")).toBeTruthy();
  });

  it("renders the live wordmark with an accessible label", () => {
    render(<Logo />);
    expect(screen.getByLabelText("Campus Path")).toBeTruthy();
    expect(screen.getByAltText("Campus Path")).toBeTruthy();
    expect(screen.getByText("Campus")).toBeTruthy();
    expect(screen.getByText("Path")).toBeTruthy();
  });

  it("shows the tagline only when asked", () => {
    const { unmount } = render(<Logo />);
    expect(screen.queryByText("Find your way on campus")).toBeNull();
    unmount();
    render(<Logo showTagline />);
    expect(screen.getByText("Find your way on campus")).toBeTruthy();
  });
});
