/** Standalone server error page (no app CSS available). English-only, on-brand. */
export function renderErrorPage(): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Page unavailable — Campus Path</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      * { box-sizing: border-box; }
      body {
        font: 15px/1.6 "DM Sans", system-ui, -apple-system, sans-serif;
        background: radial-gradient(circle at top, #14365F 0%, #0B1F3A 55%, #081628 100%);
        color: #0B1F3A;
        display: grid; place-items: center; min-height: 100vh; margin: 0; padding: 1.5rem;
      }
      .card {
        max-width: 28rem; width: 100%; text-align: center; padding: 2.25rem 2rem;
        background: #fff; border: 1px solid rgba(255,255,255,.18); border-radius: 1.75rem;
        box-shadow: 0 28px 60px -24px rgba(0,0,0,.55);
      }
      .mark {
        width: 52px; height: 52px; margin: 0 auto 1rem; border-radius: 1rem;
        display: grid; place-items: center; font-size: 1.5rem;
        background: #F6D98A; color: #0B1F3A;
      }
      h1 { font-size: 1.35rem; margin: 0 0 .5rem; letter-spacing: -.02em; }
      p { color: #53627A; margin: 0 0 1.5rem; }
      .actions { display: flex; gap: .6rem; justify-content: center; flex-wrap: wrap; }
      a, button {
        padding: .65rem 1.1rem; border-radius: .8rem; font: inherit; font-weight: 600;
        cursor: pointer; text-decoration: none; border: 1px solid transparent;
      }
      .primary { background: #0B1F3A; color: #fff; }
      .secondary { background: #fff; color: #0B1F3A; border-color: #D9E0EA; }
      small { display: block; margin-top: 1.25rem; color: #8A97AB; }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="mark">✦</div>
      <h1>Page unavailable</h1>
      <p>Something interrupted this page. Your saved data is safe — try again or return home.</p>
      <div class="actions">
        <button class="primary" onclick="location.reload()">Try again</button>
        <a class="secondary" href="/">Go home</a>
      </div>
      <small>Campus Path · Find your way on campus</small>
    </div>
  </body>
</html>`;
}
