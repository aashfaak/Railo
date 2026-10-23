# Railo — Check Your Seat Before You Book.

A static, responsive website for Bangladesh train route exploration, forward-facing seat research, station information and journey planning.

## Run locally
1. Extract the ZIP.
2. Serve the project folder locally (for example, with the VS Code Live Server extension) and open `index.html`.
3. The route-based station search loads `data/trains.json`, which requires a local web server. Opening `index.html` directly falls back to the small embedded preliminary records.
4. Internet is only needed for the optional Google Fonts import.

For a more reliable local development workflow, open this folder in VS Code and use the Live Server extension.

## Files
- `index.html` — all page sections
- `styles.css` — responsive styling
- `script.js` — interactive features and starter records
- `data/trains.json` — station IDs, directional ordered stops, train data, and verification fields for route search
- `data/routes.json` — route data template
- `data/stations.json` — station data template
- `data/coaches.json` — coach/seat data schema

**Route and station data:** the site combines two sources. The Bangladesh Railway E-Ticketing public `all-trains/info` feed supplied 134 directional train-number/origin/destination records and 30 endpoint stations (retrieved 2026-10-23): `https://railspaapi.shohoz.com/v1.0/web/all-trains/info`. Gojatra's public station directory lists 227 station timetable pages. Its schedule pages supplied 1,598 timetable rows, consolidated into 1,584 directional station-pair/train records; 34 matched the e-ticket records and 1,550 additional records were added. Five Gojatra route pages supplied 28 more timetable rows for the Dhaka/Chattogram/Cox's Bazar corridors; route records already present were updated rather than duplicated. Gojatra says its timetable was read from Bangladesh Railway publications on 2026-08-21, but Gojatra is a secondary source and these schedules have not been independently checked against each primary document. Sources: [Gojatra train directory](https://gojatra.com/train/), [Gojatra Bangladesh Railway train list](https://gojatra.com/train/bangladesh-railway-train-list/), [Bangladesh Railway timetable files](https://railway.gov.bd/pages/files/6919975d933eb65569ddc526), and [Bangladesh Railway route map (2018)](https://railway.gov.bd/pages/static-pages/691997c5933eb65569ddf053).

The combined station catalog currently contains 243 unique station IDs. It is not a verified complete nationwide station, substation, junction, train, or route list. Most timetable records are directional station pairs, not full ordered stop lists. A station-level timetable supplement now adds Dulahazara as an intermediate stop on trains 821–824, allowing searches there to respect each train's direction; unreported times remain unavailable. Other intermediate stops are only searchable where an ordered stop is explicitly present in the data. Duration is derived from published departure/arrival times only for the five priority route pages. Fare tables are not imported because their prices cannot consistently be attributed to individual train records. The application does not claim live updates or complete route coverage. Direct `file://` use falls back to the few embedded preliminary records because browsers block fetching local JSON files; use a local server or deploy to Vercel for the full static catalog.

## Current features
- Responsive homepage and navigation
- Route-based station search with searchable English/Bangla station suggestions, directional stop-order matching, deduplicated train results, and route details
- Route cards linked to the journey search
- Train/class/direction/coach selection
- Seat map UI with orientation/window/verified filters
- Export visible seat data as CSV
- Station directory search
- Trip budget calculator
- Locally saved budget and checklist
- Journey reminder setup (browser support/permissions vary)
- Travel guide cards
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
This is an independent information project, not an official Bangladesh Railway product. It does not book tickets, check live seat availability, provide live train locations, or send reports to a server. Some records are taken from the official e-ticket information feed; schedule names, times, and off days are transcribed from Gojatra, a secondary publisher that says it uses Bangladesh Railway publications. Verify travel details with Bangladesh Railway. Fares and complete intermediate stops are not included. Seat orientations are intentionally not prefilled.
