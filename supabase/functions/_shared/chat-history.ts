export type ChatTurn = { role: string; content: string };

/** Drop empty/duplicate/orphan turns, merge same-role runs, keep last N in user/assistant alternation. */
export function normalizeMessages<T extends ChatTurn>(messages: T[], max = 8): T[] {
  const cleaned: T[] = [];
  for (const message of messages) {
    const role = message.role;
    if (role !== "user" && role !== "assistant") continue;
    const content = String(message.content ?? "").trim();
    if (!content) continue;
    const last = cleaned[cleaned.length - 1];
    if (last && last.role === role) {
      // Keep the latest message of a consecutive same-role run.
      cleaned[cleaned.length - 1] = { ...message, role, content } as T;
    } else {
      cleaned.push({ ...message, role, content } as T);
    }
  }
  while (cleaned.length && cleaned[0]?.role !== "user") cleaned.shift();
  return cleaned.slice(-max);
}

/** Only completed user+assistant pairs; failed/cancelled/pending turns are excluded. */
export function completedPairs<
  T extends { role: string; content: string; status?: string | undefined },
>(lines: T[]): T[] {
  const pairs: T[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line || line.role !== "user" || line.status !== "sent") continue;
    pairs.push(line);
    const answer = lines[i + 1];
    if (answer?.role === "assistant" && answer.content) {
      pairs.push(answer);
      i++;
    } else break;
  }
  return pairs;
}
