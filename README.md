# Diamond Automobile Service Center — Website

Static, frontend-only website (HTML + CSS + vanilla JS, GSAP for motion). No backend, no build step.

## Run locally

From this folder, start any static server:

```bash
py -3 -m http.server 5500        # Windows (Python)
# or
npx serve .                      # Node
```

Then open http://127.0.0.1:5500. Opening `index.html` directly also works.

## Edit business details

All business details live in **`js/config.js`**:

| Key | What it does |
|---|---|
| `whatsapp` | Number that receives WhatsApp chats and bookings (`91` + 10 digits) |
| `address` | Workshop address. While empty, the page says "Call us for directions" |
| `hours` | Opening hours. While empty, the page says "Call to confirm timings" |
| `mapQuery` | Address or `lat,lng`. Once set, a Google Map replaces the placeholder |

Phone numbers also appear as `tel:` links in `index.html` (search for `tel:+91`).

## Booking form

The form checks the fields in the browser, then opens WhatsApp with a pre-filled booking message.
Nothing is saved on the website. A booking arrives only when the customer presses **Send** in WhatsApp.

## Assets

- `assets/img/` — photos from Unsplash (free licence), resized to WebP. **Swap in real workshop photos when available**, keeping the same file names (`*-800.webp`, `*-1600.webp`).
- `assets/brands/` — Hero logo (Wikimedia Commons, public domain) and Honda logo (Simple Icons, CC0).
  Bajaj and TVS use text wordmarks. To use the official logos, add `bajaj.svg` / `tvs.svg` here and follow the comment in the Brands section of `index.html`.
- `assets/vendor/` — GSAP 3.12.5 + ScrollTrigger, stored locally.

## Structure

```
index.html        all sections (semantic HTML, SEO meta, JSON-LD)
css/styles.css    design tokens → components → sections → breakpoints
js/config.js      editable business details
js/main.js        navigation, menu, services, booking, lightbox, cursor, GSAP motion
```

Animations turn off automatically for visitors who have `prefers-reduced-motion` enabled.
