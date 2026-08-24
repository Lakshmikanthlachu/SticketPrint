# StickerCraft — Sticker & Label Printing Shop Template

A complete, premium HTML/CSS/JS template for a custom sticker, label and print-on-demand business, built as a full multipurpose front-end + admin dashboard suitable for client delivery or marketplace resale (ThemeForest / TemplateMonster style).

100% hand-authored HTML, CSS and vanilla JavaScript — **no build step, no framework dependency (no Tailwind/Bootstrap CDN, no jQuery)**. Just open any `.html` file in a browser.

## What's included

### Front-end website
- `index.html` — Home 1: general sticker & label shop landing page
- `home-enterprise.html` — Home 2: niche B2B/enterprise bulk-labeling landing page
- `about.html` — About Us (team, mission, timeline, testimonials)
- `products.html` — Products/Services grid (labels, barcode stickers, decals, die-cut, promo stickers)
- `product-details.html` — Product detail page with specs, pricing tiers and FAQs
- `materials.html` — Materials & Finishes showcase
- `bulk-pricing.html` — Bulk quantity pricing with a **live interactive calculator**
- `design-upload.html` — Design upload page with drag-and-drop UI and file guidelines
- `blog.html` — Blog listing with working client-side filter + search
- `blog-details.html` — Blog article page with sidebar
- `contact.html` — Contact page with quote request form and map placeholder
- `pricing.html` — Account/subscription plans
- `login.html` — Login / Register (tabbed)
- `404.html` — Custom 404 page
- `coming-soon.html` — Coming soon / maintenance page with live countdown

### Admin dashboard (`/admin`)
- `admin/dashboard.html` — Analytics overview (custom SVG bar + donut charts, no chart library dependency)
- `admin/orders.html` — Orders management table
- `admin/users.html` — Users management table
- `admin/messages.html` — Messages / inbox UI

### Assets
- `css/style.css` — Full design system: tokens, typography, components, animations (front-end)
- `css/dashboard.css` — Admin-only styles (sidebar, tables, charts, inbox)
- `js/main.js` — Site-wide interactions (nav, theme + RTL toggle, reveal-on-scroll, 3D tilt cards, counters, FAQ accordion, blog filter, forms, countdown, upload dropzone, pricing calculator)
- `js/dashboard.js` — Admin-only interactions (table search, select-all)

## Design features

- **Dark / light mode** — toggle in the header (moon/sun icon); implemented via a `data-theme` attribute and CSS custom properties.
- **RTL support** — toggle in the header (globe icon) flips `dir="rtl"` on `<body>`; all spacing/positioning uses CSS logical properties (`inset-inline-start`, `margin-inline`, etc.) so the layout mirrors correctly.
- **3D & motion** — mouse-tracked 3D tilt cards, animated gradient-mesh hero backgrounds, scroll-reveal (Intersection Observer), animated counters, custom "sticker peel corner" motif used throughout as an original signature visual instead of stock photography.
- **Original visuals only** — no stock photos or cartoon clipart. All imagery is built from CSS gradients, custom hand-authored inline SVG icons, and an original "die-cut sticker" motif — fully brand-neutral and easy to reskin.
- **Fully responsive**, mobile-first, tested at 375px–1440px+.
- **SEO-ready**: semantic HTML5, meta description + Open Graph tags per page, single accessible skip-link, descriptive alt/aria attributes on icons.

## Customizing

- **Colors**: edit the CSS custom properties at the top of `css/style.css` (`:root` and `[data-theme="dark"]`) — primary, accent, teal and gold are the four brand hues used throughout.
- **Fonts**: `Sora` (headings) + `Inter` (body) are loaded from Google Fonts in every page `<head>`; swap the `<link>` and the `--font-heading` / `--font-body` variables to change.
- **Content**: every page is static HTML — search and replace copy directly. Header/footer markup is duplicated per page (standard for static templates); update `js/main.js` selectors are all data-attribute driven so structure changes are safe.
- **Theme/RTL persistence**: the toggles are session-only (no `localStorage`) by default — add a few lines to `js/main.js` if you want the preference to persist across page loads.
- **Forms**: contact, newsletter, login and quote forms are demo-only (`data-demo-form` — they prevent default submission and show a confirmation message). Wire them up to your backend or a form service (Formspree, Netlify Forms, etc.) for production use.
- **Admin dashboard data**: all tables/stats/charts in `/admin` are static placeholder data — connect to your real backend/API to make it live.

## Browser support

Modern evergreen browsers (Chrome, Edge, Firefox, Safari). Uses CSS Grid, custom properties, `color-mix()`, and `:has()`-free selectors — no polyfills required.
