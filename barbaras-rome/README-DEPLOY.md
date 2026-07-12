# Barbara's Rome — Deploy Guide (Cloudflare Pages)

This folder is a complete, self-contained website. Everything it needs is inside:

```
barbaras-rome/
├── index.html              ← the website
├── assets/
│   ├── boutique/01–16      ← Boutique Apartment photos
│   ├── design/01–15        ← Design Apartment photos
│   └── barbara.jpg         ← (add this — see step 5)
└── functions/
    └── calendar.js         ← live Airbnb availability (Cloudflare function)
```

---

## 1. Put it on Cloudflare Pages (free)

**Easiest — drag & drop:**
1. Go to **dash.cloudflare.com** → **Workers & Pages** → **Create** → **Pages** → **Upload assets**.
2. Drag the whole `barbaras-rome` folder in.
3. Click **Deploy**. You'll get a live URL like `barbaras-rome.pages.dev` in under a minute.

*(Alternative: push the folder to a GitHub repo and "Connect to Git" — gives auto-deploy on every change. Either works.)*

## 2. Connect your domain (boutiquehotelitaly.com)

In the project → **Custom domains** → **Set up a domain** → type `boutiquehotelitaly.com`.
If the domain's DNS is already on Cloudflare, it's one click. If not, Cloudflare shows the DNS records to add at your registrar.

## 3. Turn on live availability (the calendar)

1. In Airbnb, for **each** listing: **Listing → Availability → Connect calendars → Export calendar** → copy the `.ics` link.
2. In Cloudflare → your Pages project → **Settings → Environment variables** add two:
   - `ICS_ELEGANTE` = the Elegant Holiday Home `.ics` link
   - `ICS_DESIGN` = the Design Apartment `.ics` link
3. **Re-deploy** (Deployments → Retry deployment). The Availability section now reads live booked/free nights from Airbnb. It caches ~30 min and Airbnb itself refreshes every few hours.

> Until you add these, the calendar simply shows "send your dates via the form" — nothing breaks.

## 4. Make the contact form actually send (recommended)

Right now the form opens the visitor's email app addressed to `info@boutiquehotelitaly.com`. To have it send silently with spam protection, the simplest option on Cloudflare is a free **Web3Forms** or **Formspree** endpoint:
- Sign up, get an endpoint, and I can switch the form's 6 lines of code to POST to it (no more email-app popup).
- Ask me and I'll wire it in.

## 5. Add Barbara's photo

Drop her headshot into `assets/` named exactly **`barbara.jpg`** (or `.png`). The site picks it up automatically. Until then it shows her Airbnb profile photo as a fallback.

---

## Optional next steps
- **Stripe deposit button** — create a Stripe Payment Link per apartment, send me the links, I'll add "Pay deposit" buttons.
- **Two-way calendar sync** — paste the same `.ics` links into Booking.com / VRBO so nothing double-books.
