import https from "node:https";
import { createError, defineEventHandler, getQuery, setHeader } from "h3";
import { isSafeNoticeUrl, parseNoticesHtml } from "../../src/lib/notices";

/**
 * The polytechnic site sends an incomplete certificate chain, so Node's default
 * TLS verification rejects it. This proxy only ever performs a public GET to a
 * validated http(s) URL and never sends credentials; verification is relaxed
 * for that single request only.
 */
function getHtml(url: string, redirects = 0): Promise<string> {
  return new Promise((resolve, reject) => {
    const request = https.get(
      url,
      {
        rejectUnauthorized: false,
        timeout: 12_000,
        headers: { "user-agent": "CampusPath/1.0 (+notices)" },
      },
      (response) => {
        const status = response.statusCode ?? 0;
        if (status >= 300 && status < 400 && response.headers.location) {
          response.resume();
          if (redirects >= 3) return reject(new Error("Too many redirects"));
          return resolve(getHtml(new URL(response.headers.location, url).href, redirects + 1));
        }
        if (status !== 200) {
          response.resume();
          return reject(new Error(`Source returned ${status}`));
        }
        let html = "";
        response.setEncoding("utf8");
        response.on("data", (chunk: string) => {
          html += chunk;
          if (html.length > 2_000_000) {
            request.destroy(new Error("Source page too large"));
          }
        });
        response.on("end", () => resolve(html));
      },
    );
    request.on("timeout", () => request.destroy(new Error("Source timed out")));
    request.on("error", reject);
  });
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const url = String(query.url ?? "").trim();
  const instituteId = String(query.instituteId ?? "rpi");

  if (!isSafeNoticeUrl(url)) {
    throw createError({ statusCode: 400, statusMessage: "Invalid notice URL" });
  }

  try {
    const html = await getHtml(url);
    const notices = parseNoticesHtml(html, url, instituteId);
    setHeader(event, "cache-control", "public, max-age=300");
    return { notices, source: url, fetchedAt: new Date().toISOString() };
  } catch (error) {
    throw createError({
      statusCode: 502,
      statusMessage:
        error instanceof Error ? error.message.slice(0, 120) : "Could not fetch notices",
    });
  }
});
