/** Small swappable provider wrapper: Gemini API behind one call() function. */

export type ChatMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content?: string;
  name?: string;
};

export type ToolDef = {
  type: "function";
  function: { name: string; description: string; parameters: Record<string, unknown> };
};

export type ToolCall = { id: string; name: string; args: Record<string, unknown> };
export type ProviderResult = { content: string; toolCalls: ToolCall[] };

export const AI_BUSY_MESSAGE =
  "AI এখন ব্যস্ত — কিছুক্ষণ পরে আবার চেষ্টা করুন / AI is busy right now — please try again later.";

export class ProviderBusyError extends Error {}
export class ProviderError extends Error {
  constructor(public status: number) {
    super(`Provider error ${status}`);
  }
}

function geminiSchema(schema: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(schema)) {
    if (key === "additionalProperties") continue;
    if (key === "type" && typeof value === "string") {
      out[key] = value.toUpperCase();
    } else if (key === "properties" && value && typeof value === "object") {
      out[key] = Object.fromEntries(
        Object.entries(value as Record<string, unknown>).map(([k, v]) => [
          k,
          v && typeof v === "object" ? geminiSchema(v as Record<string, unknown>) : v,
        ]),
      );
    } else if (Array.isArray(value)) {
      out[key] = value.map((v) =>
        v && typeof v === "object" ? geminiSchema(v as Record<string, unknown>) : v,
      );
    } else {
      out[key] = value;
    }
  }
  return out;
}

function toContents(messages: ChatMessage[]) {
  const contents: Record<string, unknown>[] = [];
  for (const message of messages) {
    if (message.role === "system") continue;
    if (message.role === "tool") {
      contents.push({
        role: "user",
        parts: [
          {
            functionResponse: {
              name: message.name ?? "tool",
              response: { result: message.content ?? "" },
            },
          },
        ],
      });
    } else {
      contents.push({
        role: message.role === "assistant" ? "model" : "user",
        parts: [{ text: message.content ?? "" }],
      });
    }
  }
  return contents;
}

export function parseGeminiResponse(data: unknown): ProviderResult {
  const parts = ((data as { candidates?: { content?: { parts?: unknown[] } }[] })?.candidates?.[0]
    ?.content?.parts ?? []) as {
    text?: string;
    functionCall?: { name?: string; args?: Record<string, unknown> };
  }[];
  const content = parts
    .map((p) => p.text ?? "")
    .join("\n")
    .trim();
  const toolCalls: ToolCall[] = parts
    .filter((p) => p.functionCall?.name)
    .map((p, i) => ({
      id: `call_${i}_${p.functionCall!.name}`,
      name: p.functionCall!.name!,
      args: p.functionCall!.args ?? {},
    }));
  return { content, toolCalls };
}

export async function callProvider(opts: {
  key: string;
  model: string;
  system: string;
  messages: ChatMessage[];
  tools: ToolDef[];
  maxTokens: number;
  timeoutMs: number;
}): Promise<ProviderResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs);
  let response: Response;
  try {
    response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(opts.model)}:generateContent`,
      {
        method: "POST",
        signal: controller.signal,
        headers: { "content-type": "application/json", "x-goog-api-key": opts.key },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: opts.system }] },
          contents: toContents(opts.messages),
          tools: [
            {
              function_declarations: opts.tools.map((t) => ({
                name: t.function.name,
                description: t.function.description,
                parameters: geminiSchema(t.function.parameters),
              })),
            },
          ],
          generationConfig: { maxOutputTokens: opts.maxTokens, temperature: 0.2 },
        }),
      },
    );
  } catch {
    throw new ProviderError(0);
  } finally {
    clearTimeout(timer);
  }
  if (response.status === 429) throw new ProviderBusyError();
  if (!response.ok) throw new ProviderError(response.status);
  return parseGeminiResponse(await response.json());
}
