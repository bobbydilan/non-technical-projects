// ============================================================
//  Barbara's Rome — Calendar Worker
//  A tiny standalone Cloudflare Worker that reads Barbara's
//  channel calendars (Airbnb / Booking / VRBO) and returns the
//  combined booked dates as JSON. A date is "booked" if ANY
//  platform has it booked.
//
//  HOW TO DEPLOY (5 min, all in the Cloudflare dashboard):
//   1. Cloudflare → Workers & Pages → Create → Workers
//      → "Hello World" → Deploy.
//   2. Open it → Edit code → delete everything → paste THIS
//      whole file → Deploy.
//   3. Copy the Worker URL (https://...workers.dev).
//   4. In index.html set:  const CALENDAR_API = "<that URL>";
//      then re-upload the site to Cloudflare.
// ============================================================

// Each apartment lists every channel's .ics export link.
// Add or remove links freely; "xxx" entries are ignored.
const ICS = {
  elegante: [
    "https://www.airbnb.com/calendar/ical/955784924116728166.ics?t=c2080aa85ad94df99caa0330603228f1&locale=en-GB",
    "https://ical.booking.com/v1/export?t=5daef875-8658-4bcc-ab10-dc08dbba6850",
    "https://www.vrbo.com/icalendar/b1c72e77b9694ffa8bcd9abb189cc70c.ics?nonTentative",
    // No complete Agoda export link yet (the one provided had no token) — add it here if you get it.
  ],
  design: [
    // Two Airbnb listings point to the SAME physical apartment — both merged:
    "https://www.airbnb.com/calendar/ical/1307820916785977055.ics?t=ef158e71800f48f8b318d309d8b4368b&locale=en-GB",
    "https://www.airbnb.com/calendar/ical/1192087934293857635.ics?t=90a38254d64a46bf8d76c1fbfdd08ba6&locale=en-GB",
    "https://ical.booking.com/v1/export?t=48e229a1-9e4f-45db-9afc-1c12b363e9f4",
    "https://www.vrbo.com/icalendar/1dc73e7fc5c840babea000eee85d2097.ics?nonTentative",
  ],
};

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const key = url.searchParams.get("listing");

    if (!key || !(key in ICS)) {
      return json({ error: "unknown listing", busy: [] }, 400);
    }

    const feeds = (ICS[key] || []).filter((u) => u && u !== "xxx");
    if (!feeds.length) {
      return json({ listing: key, configured: false, busy: [] });
    }

    const all = [];
    await Promise.all(
      feeds.map(async (feed) => {
        try {
          const resp = await fetch(feed, {
            headers: { "User-Agent": "Mozilla/5.0 (BarbarasRome calendar)" },
            cf: { cacheTtl: 1800, cacheEverything: true }, // cache 30 min
          });
          if (resp.ok) {
            const text = await resp.text();
            for (const ev of parseICS(text)) all.push(ev);
          }
        } catch (e) {
          /* skip a feed that fails, keep the others */
        }
      })
    );

    return json({ listing: key, configured: true, busy: all });
  },
};

// Pull DTSTART / DTEND (all-day blocks) out of each VEVENT.
function parseICS(text) {
  const events = [];
  const blocks = text.split("BEGIN:VEVENT").slice(1);
  for (const b of blocks) {
    const start = grabDate(b, "DTSTART");
    const end = grabDate(b, "DTEND");
    if (start && end) events.push({ start, end });
  }
  return events;
}

function grabDate(block, field) {
  const m = block.match(new RegExp(field + "[^:\\n]*:(\\d{8})"));
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
