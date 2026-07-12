// Cloudflare Pages Function — route: /calendar?listing=elegante|design
// Fetches Barbara's Airbnb .ics export feeds server-side (avoids browser CORS block)
// and returns the booked/blocked date ranges as JSON.
//
// SET THESE in Cloudflare → Pages → your project → Settings → Environment variables:
//   ICS_ELEGANTE = <Airbnb export .ics URL for the Elegant Holiday Home>
//   ICS_DESIGN   = <Airbnb export .ics URL for the Design Apartment>
// (Airbnb: Listing → Availability → Connect calendars → Export calendar → copy the .ics link)

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const key = url.searchParams.get("listing");

  const feeds = {
    elegante: env.ICS_ELEGANTE,
    design: env.ICS_DESIGN,
  };

  const icsUrl = feeds[key];
  if (!key || !(key in feeds)) return json({ error: "unknown listing" }, 400);
  if (!icsUrl) return json({ error: "calendar not configured yet", busy: [] }, 200);

  try {
    const resp = await fetch(icsUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (BarbarasRome calendar sync)" },
      cf: { cacheTtl: 1800, cacheEverything: true }, // cache 30 min
    });
    if (!resp.ok) return json({ error: "feed fetch failed", status: resp.status, busy: [] }, 200);
    const text = await resp.text();
    return json({ listing: key, busy: parseICS(text) }, 200);
  } catch (e) {
    return json({ error: String(e), busy: [] }, 200);
  }
}

// Minimal iCalendar parser: pulls DTSTART / DTEND from each VEVENT (all-day blocks).
function parseICS(text) {
  const events = [];
  const blocks = text.split("BEGIN:VEVENT").slice(1);
  for (const b of blocks) {
    const start = matchDate(b, "DTSTART");
    const end = matchDate(b, "DTEND");
    if (start && end) events.push({ start, end });
  }
  return events;
}

function matchDate(block, field) {
  // handles "DTSTART;VALUE=DATE:20260105" and "DTSTART:20260105T000000Z"
  const re = new RegExp(field + "[^:\\n]*:(\\d{8})");
  const m = block.match(re);
  if (!m) return null;
  const d = m[1];
  return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=1800",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
