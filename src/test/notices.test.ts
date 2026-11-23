import { describe, expect, it } from "vitest";
import {
  isSafeNoticeUrl,
  makeManualNotice,
  mergeNotices,
  newNotices,
  normalizeDate,
  parseNoticesHtml,
  validateManualNotice,
  type Notice,
} from "@/lib/notices";

const HTML = `<table id="noticeTable"><tbody>
<tr class="table-tr">
  <td class="table-td" data-column="id">১</td>
  <td class="table-td" data-column="title"> পরীক্ষা নিয়ন্ত্রক কমিটি </td>
  <td class="table-td" data-column="files"></td>
  <td class="table-td" data-column="image"></td>
  <td class="table-td" data-column="publish_date"><span>০৪-১১-২০২৬</span></td>
  <td class="table-td"><a href="/pages/notices/পরীক্ষা-নিয়ন্ত্রক-কমিটি-1xhpkb">দেখুন</a></td>
</tr>
<tr class="table-tr">
  <td class="table-td" data-column="id">২</td>
  <td class="table-td" data-column="title"> ভর্তি বিষয়ে আলোচনা </td>
  <td class="table-td" data-column="files"></td>
  <td class="table-td" data-column="image"><a href="https://cdn.example.com/a.jpg"><img src="https://cdn.example.com/a.jpg"></a></td>
  <td class="table-td" data-column="publish_date"><span>০৭-১০-২০২৬</span></td>
  <td class="table-td"><a href="/pages/notices/ভর্তি-বিষয়ে-আলোচনা-s07t64">দেখুন</a></td>
</tr>
</tbody></table>`;

const BASE = "https://rajshahi.polytech.gov.bd/pages/notices";

describe("notice parsing", () => {
  it("parses title, date, absolute detail URL and image", () => {
    const notices = parseNoticesHtml(HTML, BASE, "rpi");
    expect(notices).toHaveLength(2);
    expect(notices[0]?.title).toBe("পরীক্ষা নিয়ন্ত্রক কমিটি");
    expect(notices[0]?.date).toBe("2026-11-04");
    expect(notices[0]?.url).toContain(BASE);
    expect(notices[0]?.url).toContain("1xhpkb");
    expect(notices[1]?.image).toBe("https://cdn.example.com/a.jpg");
    expect(notices[1]?.instituteId).toBe("rpi");
  });

  it("normalizes Bangla dd-mm-yyyy dates", () => {
    expect(normalizeDate("০৪-১১-২০২৬")).toBe("2026-11-04");
    expect(normalizeDate("07/10/2026")).toBe("2026-10-07");
  });
});

const notice = (id: string): Notice => ({
  id,
  title: id,
  date: "2026-11-04",
  url: `${BASE}/${id}`,
  instituteId: "rpi",
  source: "fetched",
  fetchedAt: "2026-11-04T00:00:00Z",
});

describe("notice dedupe", () => {
  it("merges without duplicates and detects only genuinely new notices", () => {
    const a = notice("a");
    const b = notice("b");
    expect(newNotices([a], [a, b]).map((n) => n.id)).toEqual(["b"]);
    expect(mergeNotices([a], [a, b])).toHaveLength(2);
  });
});

describe("manual notice validation", () => {
  const valid = { title: "Notice", date: "04-11-2026", url: "", instituteId: "rpi" };

  it("accepts a short manual notice", () => {
    expect(validateManualNotice(valid)).toEqual({});
    expect(makeManualNotice(valid).source).toBe("manual");
  });

  it("requires a title and a valid http(s) link", () => {
    expect(validateManualNotice({ ...valid, title: "" })["title"]).toBeDefined();
    expect(validateManualNotice({ ...valid, url: "ftp://x" })["url"]).toBeDefined();
  });
});

describe("fetch proxy URL safety", () => {
  it("allows public http(s) URLs and blocks local/private targets", () => {
    expect(isSafeNoticeUrl(BASE)).toBe(true);
    expect(isSafeNoticeUrl("http://localhost:8080/x")).toBe(false);
    expect(isSafeNoticeUrl("http://127.0.0.1/x")).toBe(false);
    expect(isSafeNoticeUrl("http://192.168.1.4/x")).toBe(false);
    expect(isSafeNoticeUrl("file:///etc/passwd")).toBe(false);
  });
});
