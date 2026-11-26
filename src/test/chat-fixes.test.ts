import { describe, expect, it } from "vitest";
import fs from "node:fs";
import { completedPairs, normalizeMessages } from "../../supabase/functions/_shared/chat-history";
import { chatErrorMessage, codeFromHttp } from "@/lib/chat-errors";
import { inferWhenFromText } from "../../supabase/functions/campus-ai/date-intent";

type Line = { role: string; content: string; status?: string | undefined };

describe("chat history normalization", () => {
  it("excludes failed, cancelled and pending turns", () => {
    const lines: Line[] = [
      { role: "user", content: "hello", status: "sent" },
      { role: "assistant", content: "hi" },
      { role: "user", content: "math", status: "failed" },
      { role: "user", content: "again", status: "cancelled" },
      { role: "user", content: "pending", status: "pending" },
    ];
    expect(completedPairs(lines).map((l) => l.content)).toEqual(["hello", "hi"]);
  });

  it("merges consecutive same-role turns and keeps alternation", () => {
    const messages: Line[] = [
      { role: "user", content: "a" },
      { role: "user", content: "b" },
      { role: "assistant", content: "c" },
      { role: "assistant", content: "d" },
      { role: "user", content: "e" },
    ];
    expect(normalizeMessages(messages, 6).map((m) => `${m.role}:${m.content}`)).toEqual([
      "user:b",
      "assistant:d",
      "user:e",
    ]);
  });

  it("drops empty turns and leading/trailing assistants", () => {
    expect(
      normalizeMessages([
        { role: "assistant", content: "orphan" },
        { role: "user", content: "  " },
        { role: "user", content: "ok" },
        { role: "assistant", content: "answer" },
      ]).map((m) => m.content),
    ).toEqual(["ok", "answer"]);
  });
});

describe("chat error messages", () => {
  it("maps HTTP codes to bilingual messages with a ref", () => {
    expect(codeFromHttp(429)).toBe("limit");
    expect(codeFromHttp(503)).toBe("busy");
    expect(codeFromHttp(401)).toBe("unauthenticated");
    expect(chatErrorMessage("limit", "abc12345")).toContain("Ref: abc12345");
    expect(chatErrorMessage("busy")).toContain("AI is busy");
  });
});

describe("chat UI invariants", () => {
  const source = fs.readFileSync("src/components/sohoj/AskCampusAi.tsx", "utf8");

  it("has exactly one close button and the updated bilingual disclaimer", () => {
    expect(source.match(/aria-label="Close chat"/g)).toHaveLength(1);
    expect(source).toContain("[&>button]:hidden");
    expect(source).toContain("General answers can be wrong");
    expect(source.replace(/\s+/g, " ")).toContain("সাধারণ উত্তরে ভুল থাকতে পারে");
    expect(source).not.toContain("Answers come only from Campus Path data");
  });

  it("renders math as plain text without raw HTML", () => {
    expect(source).not.toContain("dangerouslySetInnerHTML");
    const math = "(a+b)^2 = a² + 2ab + b²";
    expect(math).toContain("^");
    expect(math).toContain("+");
    expect(renderInlineText(math)).toBe(math);
  });
});

const renderInlineText = (text: string) =>
  text
    .split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
    .map((part) =>
      part.startsWith("**") && part.endsWith("**")
        ? part.slice(2, -2)
        : part.startsWith("`") && part.endsWith("`")
          ? part.slice(1, -1)
          : part,
    )
    .join("");

describe("server-side date intent", () => {
  it("maps Bangla, English and Banglish day cues without model input", () => {
    expect(inferWhenFromText("আজকের রুটিন")).toEqual({ kind: "relative", offset: 0 });
    expect(inferWhenFromText("kalke class ache?")).toEqual({ kind: "relative", offset: 1 });
    expect(inferWhenFromText("পরশু কী আছে")).toEqual({ kind: "relative", offset: 2 });
    expect(inferWhenFromText("gotokal kotha")).toEqual({ kind: "relative", offset: -1 });
    expect(inferWhenFromText("robibar ki class?")).toEqual({
      kind: "weekday",
      weekday: 0,
      which: "this",
    });
    expect(inferWhenFromText("শুক্রবার")).toEqual({ kind: "weekday", weekday: 5, which: "this" });
    expect(inferWhenFromText("কেমন আছো?")).toBeUndefined();
  });
});
