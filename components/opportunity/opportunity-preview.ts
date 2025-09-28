const PARAGRAPH_SPLIT_REGEX = /\n+/;

export type LandingDefaults = {
  slug: string;
  title: string;
  body: string;
};

export const LANDING_DEFAULTS: LandingDefaults = {
  slug: "openai-codex-hackathon",
  title: "Hackers, You're Home",
  body: "The GPT-5 Codex Hackathon is around the corner, and The Ned is ready to host your crew. Keep the team minutes from the event, with flexible workspaces, restorative suites, and on-demand room service between pushes. Secure your block and unlock late checkout plus welcome cocktails for your hackers tonight.",
} as const;

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function createOpportunityPreviewHtml(values: LandingDefaults) {
  const paragraphs = values.body
    .split(PARAGRAPH_SPLIT_REGEX)
    .filter(Boolean)
    .map((paragraph) => `<p>${escapeHtml(paragraph.trim())}</p>`)
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charSet="utf-8" />
    <title>${escapeHtml(values.title)} | The Ned</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      :root {
        color-scheme: light;
        font-size: 16px;
      }
      * {
        box-sizing: border-box;
      }
      body {
        margin: 0;
        font-family: 'Playfair Display', 'Georgia', serif;
        background: #f9f6f1;
        color: #2c1a12;
        min-height: 100vh;
        display: flex;
        flex-direction: column;
      }
      header {
        padding: 1.75rem 3rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid rgba(0,0,0,0.06);
        background: #ffffff;
        box-shadow: 0 8px 24px rgba(28, 13, 3, 0.06);
      }
      header span {
        font-size: 0.75rem;
        letter-spacing: 0.2em;
        text-transform: uppercase;
        color: rgba(44, 26, 18, 0.55);
      }
      main {
        flex: 1;
        display: grid;
        gap: 2rem;
        padding: 3rem 2.5rem 4rem;
        max-width: 960px;
        margin: 0 auto;
      }
      .hero {
        background: linear-gradient(145deg, #ffffff 0%, #f2ebe2 100%);
        border: 1px solid rgba(44, 26, 18, 0.08);
        border-radius: 28px;
        padding: 3.25rem;
        box-shadow: 0 26px 48px rgba(40, 26, 15, 0.18);
      }
      .hero h1 {
        font-size: clamp(2rem, 4vw, 3rem);
        margin: 0 0 1rem;
        letter-spacing: -0.02em;
      }
      .hero p {
        font-size: 1.15rem;
        line-height: 1.75;
        margin: 0 0 1.75rem;
        color: rgba(44, 26, 18, 0.7);
      }
      .cta {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.85rem 1.75rem;
        border-radius: 9999px;
        background: linear-gradient(120deg, #c08b4d 0%, #eab676 100%);
        color: #ffffff;
        font-weight: 600;
        text-decoration: none;
        box-shadow: 0 16px 28px rgba(173, 120, 60, 0.3);
      }
      .cta span {
        font-size: 0.875rem;
        letter-spacing: 0.04em;
      }
      .meta {
        display: flex;
        gap: 1.5rem;
        flex-wrap: wrap;
        font-size: 0.85rem;
        color: rgba(44, 26, 18, 0.55);
        background: #ffffff;
        padding: 1.5rem 2rem;
        border-radius: 18px;
        border: 1px solid rgba(44, 26, 18, 0.08);
        box-shadow: 0 18px 40px rgba(33, 22, 12, 0.08);
      }
      footer {
        padding: 2rem 3rem 3rem;
        font-size: 0.75rem;
        color: rgba(44, 26, 18, 0.45);
        text-align: center;
        background: #f2ece4;
      }
    </style>
  </head>
  <body>
    <header>
      <strong>The Ned</strong>
      <span>${escapeHtml(values.slug)} landing • Exclusive offer</span>
    </header>
    <main>
      <section class="hero">
        <h1>${escapeHtml(values.title)}</h1>
        ${paragraphs}
        <a class="cta" href="#book">
          <span>Reserve with code HACKERS</span>
        </a>
      </section>
      <section class="meta">
        <div>Stay window: Oct 24 – Oct 27</div>
        <div>Special rate: 10% off suites</div>
        <div>Perks: Late checkout • Workspace access</div>
      </section>
    </main>
    <footer>© ${new Date().getFullYear()} The Ned New York · 1170 Broadway</footer>
  </body>
</html>`;
}
