import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { NoticeView } from "@/components/sohoj/NoticeView";
import { NoticeAdmin } from "@/components/sohoj/NoticeAdmin";
import type { Notice, NoticeSource } from "@/lib/notices";

const notice: Notice = {
  id: "x1",
  title: "পরীক্ষা নিয়ন্ত্রক কমিটি",
  date: "2026-11-04",
  url: "https://rajshahi.polytech.gov.bd/pages/notices/x1",
  instituteId: "rpi",
  source: "fetched",
  fetchedAt: "2026-11-04T00:00:00Z",
};

describe("NoticeView", () => {
  it("shows the notice title, date and original link", () => {
    render(<NoticeView notices={[notice]} loading={false} error="" onRefresh={vi.fn()} />);
    expect(screen.getByText("পরীক্ষা নিয়ন্ত্রক কমিটি")).toBeTruthy();
    expect(screen.getByText("2026-11-04")).toBeTruthy();
    expect(screen.getByText("দেখুন / View").closest("a")?.getAttribute("href")).toBe(notice.url);
  });

  it("shows a friendly empty state", () => {
    render(<NoticeView notices={[]} loading={false} error="" onRefresh={vi.fn()} />);
    expect(screen.getByText(/এখনো কোনো নোটিশ নেই/)).toBeTruthy();
  });
});

describe("NoticeAdmin", () => {
  const sources: NoticeSource[] = [
    {
      instituteId: "rpi",
      label: "Rajshahi",
      url: "https://rajshahi.polytech.gov.bd/pages/notices",
    },
  ];

  it("offers manual add, link drop and saved sources", () => {
    render(
      <NoticeAdmin
        sources={sources}
        onSourcesChange={vi.fn()}
        onAddManual={vi.fn()}
        onFetchNow={vi.fn()}
        loading={false}
        error=""
      />,
    );
    expect(screen.getByText(/Add notice manually/)).toBeTruthy();
    expect(screen.getByText(/Drop a notice link/)).toBeTruthy();
    expect(screen.getByText("Rajshahi")).toBeTruthy();
  });
});
