# Railo — Check Your Seat Before You Book.

A static, responsive website for Bangladesh train route exploration, forward-facing seat research, station information and journey planning.

## Files

- `index.html` — all page sections
- `styles.css` — responsive styling
- `script.js` — interactive features and starter records
- `data/trains.json` — station IDs, directional ordered stops, train data, and verification fields for route search
- `data/routes.json` — route data template
- `data/stations.json` — station data template
- `data/coaches.json` — coach/seat data schema

**Route and station data:** the site combines Bangladesh Railway's E-Ticketing public `all-trains/info` feed, the official E-Ticketing Train Details view, and secondary Gojatra timetable pages. The public feed supplied 134 directional train-number/origin/destination records and 30 endpoint stations (retrieved 2026-10-23): `https://railspaapi.shohoz.com/v1.0/web/all-trains/info`. Gojatra's public station directory lists 227 station timetable pages. Its schedule pages supplied 1,598 timetable rows, consolidated into 1,584 directional station-pair/train records; 34 matched the e-ticket records and 1,550 additional records were added. Five Gojatra route pages supplied 28 more timetable rows for the Dhaka/Chattogram/Cox's Bazar corridors; route records already present were updated rather than duplicated. On 2026-10-23, official Train Details for 30-Oct-2026 confirmed ordered routes, schedules and off days for trains 709, 710, 717, 718, 719, 720, 723, 724, 739, 740, 753, 754, 755, 756, 759, 760, 769, 770 and 821–824. Trains 813 and 815 expose only partial route details, and trains 814 and 816 remain incomplete. Each reviewed route has its official search URL and verification date attached. These schedules are dated snapshots, not live updates. Gojatra says its timetable was read from Bangladesh Railway publications on 2026-08-21, but Gojatra is a secondary source and those schedules have not been independently checked against each primary document. Sources: [Bangladesh Railway E-Ticketing](https://eticket.railway.gov.bd/), [Gojatra train directory](https://gojatra.com/train/), [Gojatra Bangladesh Railway train list](https://gojatra.com/train/bangladesh-railway-train-list/), [Bangladesh Railway timetable files](https://railway.gov.bd/pages/files/6919975d933eb65569ddc526), and [Bangladesh Railway route map (2018)](https://railway.gov.bd/pages/static-pages/691997c5933eb65569ddf053).

The combined station catalog currently contains 255 station IDs. It is not a verified complete nationwide station, substation, junction, train, or route list. Most secondary timetable records are directional station pairs rather than full ordered stop lists. Where those records are used, route search combines same-train, same-direction evidence only when its station order is unique; it does not require times to be present to establish that order. If ordering is ambiguous, the site avoids guessing. Official E-Ticketing Train Details provide dated ordered route schedules for trains 709, 710, 717, 718, 719, 720, 723, 724, 739, 740, 753, 754, 755, 756, 759, 760, 769, 770 and 821–824. Missing times display as “Not available”; incomplete or unverified routes remain marked as such. Official route entries distinguish stations where no halt/departure is shown: these are displayed as pass-through stations but are excluded from boarding and destination search. Each official schedule is a 30-Oct-2026 snapshot and should not be treated as live information. Trains 813 and 815 expose only partial route details; 814 and 816 remain incomplete, and missing stops are not guessed. Search results cite the contributing sources when available and avoid showing a full-route duration for a partial journey. The Dulahazara secondary-source supplement remains documented separately; its station page does not expose times. Fare tables are not imported because prices cannot consistently be attributed to individual train records. The application does not claim complete national route coverage. Direct `file://` use falls back to the few embedded preliminary records because browsers block fetching local JSON files; use a local server or deploy to Vercel for the full static catalog.

Additional official Train Details reviewed on 2026-10-23 for 29-Oct-2026 confirm the ordered stops and schedules for Banalata Express (791, 792) on the Dhaka–Rajshahi corridor and Kalni Express (773, 774) on the Dhaka–Sylhet corridor. These are dated snapshots; route search follows each train’s displayed stop order and does not infer intermediate stations absent from the official details. For 774, the official page displays conflicting arrival/departure times at Shaistaganj, so both times are shown as “Not available” while the verified stop remains in the route.

The seat finder currently uses an illustrative layout in `data/coaches.json` for AC_B, AC_S, SNIGDHA, F_BERTH, F_SEAT, F_CHAIR, S_CHAIR, SHOVAN, SHULOV, and AC_CHAIR. Choose a code from the Coach list; there is no separate class selector. Demo seat labels and positions are placeholders, and no seat number, window position, or facing direction is verified. Replace the preview only with coach-specific, source-backed seat data.

## Current features

- Responsive homepage and navigation
- Route-based station search with searchable English/Bangla station suggestions, directional matching across official ordered stops, pass-through-aware boarding/destination matching, deduplicated train results, and route details
- Train/direction and coach-class selection in one Coach control
- Seat map UI with orientation/window/verified filters
- Export visible seat data as CSV
- Station directory section (under development)
- Journey planner section (under development)
- Railway travel guides section (under development)
- Data-report form placeholder
- Privacy, contact and official link sections

## Before publishing

1. Verify every train number, route, class, stoppage, off-day, fare and schedule against current official sources.
2. Collect seat orientation evidence for each exact coach and direction. Never publish guessed forward-facing seats.
3. Replace the placeholder coach in `data/coaches.json` and maintain a source and last-verified date for each verified record.
4. Add a real monitored contact email and working report submission storage if you want reports to reach you.
5. Review the Privacy Policy once analytics, ads, cookies, external services or a backend are added.
6. Create useful original travel guides; do not publish placeholder pages solely to gain ad approval.
7. Apply for AdSense only after the site has useful original content and complies with current Google publisher policies.

## Free deployment

You can deploy this static site with a free static hosting service such as Cloudflare Pages or GitHub Pages. Review current plan terms before publishing.
Official sources:

- Bangladesh Railway: https://railway.gov.bd/
- Official e-ticketing: https://eticket.railway.gov.bd/
- Google Search Console: https://search.google.com/search-console/
- Google AdSense: https://adsense.google.com/start/

## Limitations

This is an independent information project, not an official Bangladesh Railway product. It does not book tickets, check live seat availability, provide live train locations, or send reports to a server. Some records are taken from the official e-ticket information feed; many timetable records are transcribed from Gojatra, a secondary publisher that says it uses Bangladesh Railway publications. Official route schedules cover selected corridors and the cited service date only; national route coverage remains incomplete. Verify travel details with Bangladesh Railway. Fare tables are not included, and seat orientations are intentionally not prefilled.
