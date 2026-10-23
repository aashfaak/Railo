/* RailPath BD starter project.
   Replace demo/placeholder records in data/*.json with carefully verified data.
   Never mark a seat as forward-facing without evidence for the specific coach and journey direction.
*/
const DATA = {
  trains: [
    { id: "coxsbazar-express", name: "Cox's Bazar Express", number: "814 / 813", routes: ["Chattogram → Cox's Bazar", "Cox's Bazar → Chattogram"], classes: ["S_CHAIR", "AC_CHAIR"], note: "Starter record; confirm current operations, classes and timetable with official sources." },
    { id: "sonar-bangla", name: "Sonar Bangla Express", number: "788 / 787", routes: ["Dhaka → Chattogram", "Chattogram → Dhaka"], classes: ["AC_B", "SNIGDHA", "S_CHAIR"], note: "Starter record; verify current details before publishing." },
    { id: "subarna-express", name: "Subarna Express", number: "702 / 701", routes: ["Dhaka → Chattogram", "Chattogram → Dhaka"], classes: ["AC_B", "SNIGDHA", "S_CHAIR"], note: "Starter record; verify current details before publishing." }
  ],
  stations: [
    { name: "Chattogram Railway Station", city: "Chattogram", region: "Chattogram Division", note: "Main railway station serving Chattogram. Verify platform, facilities and departure information on site.", status: "Details need verification" },
    { name: "Dhaka (Kamalapur) Railway Station", city: "Dhaka", region: "Dhaka", note: "Major railway station in the capital. Verify station facilities and train details with official sources.", status: "Details need verification" },
    { name: "Cox's Bazar Railway Station", city: "Cox's Bazar", region: "Chattogram Division", note: "Railway station serving Cox's Bazar. Verify local transport and station facilities before travel.", status: "Details need verification" },
    { name: "Cumilla Railway Station", city: "Cumilla", region: "Chattogram Division", note: "Station information and stopping services must be checked against current schedules.", status: "Details need verification" },
    { name: "Feni Railway Station", city: "Feni", region: "Chattogram Division", note: "Check current intercity stops and station facilities before relying on this listing.", status: "Details need verification" },
    { name: "Akhaura Junction", city: "Brahmanbaria", region: "Chattogram Division", note: "Junction information, connections and current stopping patterns require verification.", status: "Details need verification" }
  ],
  routes: [
    { id: "ctg-cox", from: "Chattogram", to: "Cox's Bazar", code: "CTG / CXB", tag: "COASTAL JOURNEY", description: "A popular route connecting port city Chattogram with Cox's Bazar.", note: "Confirm current train services and timetable.", trains: ["Cox's Bazar Express"] },
    { id: "dhaka-ctg", from: "Dhaka", to: "Chattogram", code: "DAC / CTG", tag: "INTERCITY", description: "A major intercity rail corridor between the capital and Chattogram.", note: "Confirm current train services and timetable.", trains: ["Sonar Bangla Express", "Subarna Express"] },
    { id: "dhaka-cox", from: "Dhaka", to: "Cox's Bazar", code: "DAC / CXB", tag: "LONG-DISTANCE", description: "Search for official directional train records between Dhaka and Cox's Bazar.", note: "Train services and schedules can change; verify official details.", trains: [] }
  ],
  guides: [
    { title: "How to read your train ticket", category: "TRAVEL BASICS", description: "Understand train, coach and seat labels, and keep booking references private.", body: "Check the train name/number, date, origin, destination, class, coach and seat. Keep your PNR and ticket QR code private. Always compare the ticket details with official booking information." },
    { title: "Choosing a forward-facing seat", category: "SEAT GUIDE", description: "What to check before trusting a seat direction label.", body: "A seat's direction depends on its physical orientation and the train's direction of travel for that specific journey. Do not infer it from seat number alone. Use a verified coach diagram or reliable physical evidence. If the information is uncertain, treat the direction as unknown." },
    { title: "Before leaving for the station", category: "CHECKLIST", description: "A practical checklist for a smoother rail journey.", body: "Confirm your travel date, train, departure time, station and coach. Allow enough time to reach the station. Keep ticket details and required ID accessible, pack essentials, and confirm onward transport at your destination." },
    { title: "Understanding coach classes", category: "RAILWAY BASICS", description: "A guide to comparing class names and amenities.", body: "Class names and availability depend on the train and route. Check the class offered for your particular train and date in the official booking system. Do not assume that every train has every class or the same layout." },
    { title: "Plan a train trip budget", category: "JOURNEY PLANNING", description: "Include more than just the ticket price.", body: "Estimate ticket cost for all travellers, local transport, food, luggage needs and onward transport. Use current official fare information and keep a buffer for unexpected expenses." },
    { title: "How we verify railway data", category: "DATA TRANSPARENCY", description: "Why this project distinguishes verified and unknown information.", body: "We aim to list a source and last-verified date for important information. Seat direction should only be labelled verified when evidence supports the specific coach and journey direction. Reports should be reviewed before changing public data." }
  ],
  coaches: []
};
const $ = (id) => document.getElementById(id);
const money = n => new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT", maximumFractionDigits: 0 }).format(n);
const safeText = value => String(value ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
let journeyData = { stations: [], trains: [] };
let journeySearchTrains = [];
let journeyFinderSelection = null;
const activeStationOption = { from: -1, to: -1 };
let selectedSeat = null;
let visibleSeats = [];
let toastTimer;
function toast(message) {
  const el = $("toast"); el.textContent = message; el.classList.add("show");
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove("show"), 3000);
}
function initNav() {
  $("menuToggle").addEventListener("click", () => {
    const open = $("mainNav").classList.toggle("open");
    $("menuToggle").setAttribute("aria-expanded", String(open));
  });
  $("mainNav").querySelectorAll("a").forEach(a => a.addEventListener("click", () => $("mainNav").classList.remove("open")));
}
function fillSelect(select, items, valueKey, labelKey, firstLabel) {
  select.innerHTML = "";
  if (firstLabel) select.add(new Option(firstLabel, ""));
  items.forEach(item => select.add(new Option(labelKey ? item[labelKey] : item, valueKey ? item[valueKey] : item)));
}
function normalizeStationName(value) {
  return String(value || "").trim().replace(/\s+/g, " ").toLocaleLowerCase();
}
function stationIdFromName(name) {
  const normalized = normalizeStationName(name);
  return journeyData.stations.find(station =>
    [station.name.en, station.name.bn, ...(station.searchNames || [])].filter(Boolean)
      .some(label => normalizeStationName(label) === normalized)
  )?.id || "";
}
function starterJourneyData() {
  const stationIds = {
    "Dhaka": "dhaka",
    "Chattogram": "chattogram",
    "Cox's Bazar": "coxsbazar"
  };
  const stations = DATA.stations.map(station => ({
    id: stationIds[station.city] || normalizeStationName(station.city).replace(/[^a-z0-9]+/g, "-"),
    name: { en: station.name, bn: null },
    searchNames: [station.city],
    verified: false,
    source: "Existing site station starter record.",
    lastVerified: null
  }));
  const stationById = new Map(stations.map(station => [station.id, station]));
  const trains = DATA.trains.map(train => ({
    id: train.id,
    name: { en: train.name, bn: null },
    trainNumbers: { values: String(train.number || "").split("/").map(number => number.trim()).filter(Boolean), verified: false },
    weeklyOffDay: { day: null, verified: false },
    fares: { values: [], verified: false },
    source: "Existing site starter train record; not independently verified.",
    routes: train.routes.map((route, index) => {
      const stationIdsInRoute = route.split(" → ").map(label => stationIds[label] || "");
      return {
        id: `${train.id}-starter-${index}`,
        verified: false,
        duration: { value: null, verified: false },
        stops: stationIdsInRoute.filter(id => stationById.has(id)).map(stationId => ({
          stationId,
          arrival: null,
          departure: null
        }))
      };
    })
  }));
  return { stations, trains, coverage: { complete: false } };
}
function normalizeJourneyData(data) {
  if (!Array.isArray(data?.stations) || !Array.isArray(data?.trains)) {
    throw new Error("The journey dataset must include station and train lists.");
  }
  const stationIds = new Set();
  const stations = data.stations.filter(station => {
    if (!station?.id || !station.name?.en || stationIds.has(station.id)) return false;
    stationIds.add(station.id);
    return true;
  });
  const trainIds = new Set();
  const trains = data.trains.filter(train => {
    if (!train?.id || !(train.name?.en || train.trainNumbers?.values?.length) || !Array.isArray(train.routes) || trainIds.has(train.id)) return false;
    trainIds.add(train.id);
    return true;
  }).map(train => ({
    ...train,
    routes: train.routes.filter(route => Array.isArray(route?.stops) && route.stops.length > 1)
      .map(route => ({
        ...route,
        stops: route.stops.filter(stop => stationIds.has(stop?.stationId))
      }))
      .filter(route => route.stops.length > 1)
  }));
  if (!stations.length || !trains.length) throw new Error("The journey dataset has no usable station or train records.");
  const usableTrains = trains.filter(train => train.routes.length);
  if (!usableTrains.length) throw new Error("The journey dataset has no usable directional route records.");
  return {
    stations,
    trains: usableTrains,
    coverage: data.coverage || { complete: false }
  };
}
async function loadJourneyData() {
  if (location.protocol === "file:") {
    journeyData = normalizeJourneyData(starterJourneyData());
    journeySearchTrains = buildJourneySearchTrains(journeyData);
    $("journeySearchStatus").textContent = "Using the site's preliminary route records; train services and route data are unverified.";
    syncRouteCardCounts();
    return;
  }
  try {
    const response = await fetch("data/trains.json");
    if (!response.ok) throw new Error(`Journey data request failed (${response.status}).`);
    journeyData = normalizeJourneyData(await response.json());
    $("journeySearchStatus").textContent = `${journeyData.trains.length} train records across ${journeyData.stations.length} stations loaded. Coverage is incomplete; schedule details are attributed to their source.`;
  } catch (error) {
    console.error("Unable to load the journey dataset; using existing preliminary route records.", error);
    journeyData = normalizeJourneyData(starterJourneyData());
    $("journeySearchStatus").textContent = "The route dataset could not be loaded. Showing the site's preliminary starter records.";
  }
  journeySearchTrains = buildJourneySearchTrains(journeyData);
  syncRouteCardCounts();
}
function syncRouteCardCounts() {
  DATA.routes.forEach(route => {
    const fromId = stationIdFromName(route.from);
    const toId = stationIdFromName(route.to);
    route.trains = journeyMatches(fromId, toId).map(({ train }) =>
      train.name.en || `Train no. ${train.trainNumbers?.values?.join(" / ") || "unavailable"}`
    );
  });
}
function setStationSelection(direction, station) {
  const input = $(`journey${direction === "from" ? "From" : "To"}`);
  const otherDirection = direction === "from" ? "to" : "from";
  const otherInput = $(`journey${otherDirection === "from" ? "From" : "To"}`);
  if (otherInput.dataset.stationId === station.id) {
    otherInput.value = "";
    otherInput.dataset.stationId = "";
    otherInput.closest(".station-input-wrap").querySelector(".station-clear").hidden = true;
    $(`journey${otherDirection === "from" ? "From" : "To"}Options`).hidden = true;
    otherInput.setAttribute("aria-expanded", "false");
  }
  input.dataset.stationId = station.id;
  input.value = [station.name.en, station.name.bn].filter(Boolean).join(" · ");
  input.removeAttribute("aria-activedescendant");
  input.setAttribute("aria-expanded", "false");
  $(`journey${direction === "from" ? "From" : "To"}Options`).hidden = true;
  input.closest(".station-input-wrap").querySelector(".station-clear").hidden = false;
  activeStationOption[direction] = -1;
  $("journeyResults").innerHTML = "";
  $("journeySearchStatus").textContent = "";
}
function renderStationOptions(direction) {
  const input = $(`journey${direction === "from" ? "From" : "To"}`);
  const list = $(`journey${direction === "from" ? "From" : "To"}Options`);
  const otherDirection = direction === "from" ? "to" : "from";
  const otherInput = $(`journey${otherDirection === "from" ? "From" : "To"}`);
  const otherStationId = otherInput.dataset.stationId || "";
  const query = normalizeStationName(input.value);
  const stations = journeyData.stations.filter(station =>
    station.id !== otherStationId &&
    [station.name.en, station.name.bn, ...(station.searchNames || [])].filter(Boolean)
      .some(label => normalizeStationName(label).includes(query))
  );
  activeStationOption[direction] = -1;
  input.removeAttribute("aria-activedescendant");
  list.hidden = false;
  input.setAttribute("aria-expanded", "true");
  list.innerHTML = stations.length
    ? stations.map((station, index) => `<button type="button" class="station-option" role="option" aria-selected="false" id="journey-${direction}-option-${index}" data-station-index="${index}">
        <span class="station-option-marker" aria-hidden="true">${direction === "from" ? "●" : "◎"}</span>
        <span><strong>${safeText(station.name.en)}</strong>${station.name.bn ? `<small lang="bn">${safeText(station.name.bn)}</small>` : ""}</span>
      </button>`).join("")
    : `<div class="station-options-empty">No matching stations found.</div>`;
  list.querySelectorAll("[data-station-index]").forEach(option => option.addEventListener("click", () => {
    setStationSelection(direction, stations[Number(option.dataset.stationIndex)]);
  }));
}
function setActiveStationOption(direction, index) {
  const list = $(`journey${direction === "from" ? "From" : "To"}Options`);
  const options = [...list.querySelectorAll('[role="option"]')];
  if (!options.length) return;
  activeStationOption[direction] = (index + options.length) % options.length;
  options.forEach((option, optionIndex) => {
    const active = optionIndex === activeStationOption[direction];
    option.setAttribute("aria-selected", String(active));
    option.classList.toggle("is-active", active);
  });
  const activeOption = options[activeStationOption[direction]];
  $(`journey${direction === "from" ? "From" : "To"}`).setAttribute("aria-activedescendant", activeOption.id);
  activeOption.scrollIntoView({ block: "nearest" });
}
function verifiedScheduleTime(stop, kind, route) {
  const value = stop?.[kind];
  if (value?.verified === true && value.time) return safeText(value.time);
  if (route?.scheduleVerified === true && typeof value === "string" && value) return safeText(value);
  return "Unavailable (not verified)";
}
function trainNumberLabel(train, route) {
  if (route.trainNumber?.verified === true && route.trainNumber.value) return safeText(route.trainNumber.value);
  return train.trainNumbers?.verified === true && train.trainNumbers.values?.length
    ? train.trainNumbers.values.map(safeText).join(" / ")
    : "Unavailable (not verified)";
}
function trainNameSimilarity(left, right) {
  const normalize = value => String(value || "").toLocaleLowerCase().normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "").replace(/express|expres|train/g, "")
    .replace(/[^a-z0-9]+/g, "");
  const a = normalize(left);
  const b = normalize(right);
  if (!a || !b) return 0;
  const row = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    let previous = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const saved = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + Number(a[i - 1] !== b[j - 1]));
      previous = saved;
    }
  }
  return 1 - row[b.length] / Math.max(a.length, b.length);
}
function journeyTrainGroups(data) {
  const byNumber = new Map();
  data.trains.forEach(train => {
    const numbers = train.trainNumbers?.values?.length === 1
      ? train.trainNumbers.values
      : [`id:${train.id}`];
    numbers.forEach(number => {
      const key = String(number);
      if (!byNumber.has(key)) byNumber.set(key, []);
      byNumber.get(key).push(train);
    });
  });
  const groups = [];
  byNumber.forEach((trains, number) => {
    const namedGroups = [];
    const unnamed = [];
    trains.forEach(train => {
      if (!train.name?.en) {
        unnamed.push(train);
        return;
      }
      const closest = namedGroups
        .map(group => ({ group, similarity: Math.max(...group.names.map(name => trainNameSimilarity(name, train.name.en))) }))
        .filter(candidate => candidate.similarity >= 0.72)
        .sort((a, b) => b.similarity - a.similarity)[0];
      if (closest) {
        closest.group.names.push(train.name.en);
        closest.group.trains.push(train);
      } else {
        namedGroups.push({ names: [train.name.en], trains: [train] });
      }
    });
    unnamed.forEach(train => {
      const candidates = namedGroups.map(group => ({
        group,
        overlap: train.routes.reduce((total, route) => {
          const routeStart = route.stops[0].stationId;
          const routeEnd = route.stops[route.stops.length - 1].stationId;
          const candidateStations = new Set(group.trains.flatMap(record =>
            record.routes.flatMap(candidate => candidate.stops.map(stop => stop.stationId))
          ));
          return total + Number(candidateStations.has(routeStart)) + Number(candidateStations.has(routeEnd));
        }, 0)
      })).filter(candidate => candidate.overlap > 0).sort((a, b) => b.overlap - a.overlap);
      if (candidates.length && (candidates.length === 1 || candidates[0].overlap > candidates[1].overlap)) {
        candidates[0].group.trains.push(train);
      } else {
        namedGroups.push({ names: [], trains: [train] });
      }
    });
    namedGroups.forEach(group => groups.push({ number, trains: group.trains }));
  });
  return groups;
}
function stopClockMinutes(stop, kind) {
  const value = stop?.[kind];
  const time = typeof value === "string" ? value : value?.time;
  const match = typeof time === "string" && time.match(/^(\d{1,2}):(\d{2})/);
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}
function journeyRouteAnchorScore(route) {
  if (route.duration?.verified === true && route.duration.value) return 4;
  if (route.verified === true) return 3;
  return 0;
}
function buildExpandedJourneyRoute(group, anchor) {
  const anchorStops = anchor.stops;
  const startId = anchorStops[0].stationId;
  const endId = anchorStops[anchorStops.length - 1].stationId;
  const sources = group.trains.flatMap(train => train.routes.map(route => ({ train, route })));
  const terminalRoutes = sources.filter(({ route }) =>
    route.stops[route.stops.length - 1].stationId === endId
  );
  const anchorStartTime = stopClockMinutes(anchorStops[0], "departure")
    ?? stopClockMinutes(anchorStops[0], "arrival")
    ?? null;
  const anchorEndTime = stopClockMinutes(anchorStops[anchorStops.length - 1], "arrival")
    ?? stopClockMinutes(anchorStops[anchorStops.length - 1], "departure")
    ?? null;
  const timedStops = terminalRoutes.flatMap(({ route }) => route.stops.slice(0, -1)
    .map((stop, index) => ({
      stop,
      route,
      stationId: stop.stationId,
      time: stopClockMinutes(stop, "departure") ?? stopClockMinutes(stop, "arrival"),
      confidence: route.stops[route.stops.length - 1].stationId === endId ? 2 : 1,
      index
    })))
    .filter(event => event.stationId !== startId && event.stationId !== endId && event.time !== null);
  const availableClocks = [...timedStops.map(event => event.time)];
  if (anchorStartTime !== null) availableClocks.push(anchorStartTime);
  if (anchorEndTime !== null) availableClocks.push(anchorEndTime);
  let timelineStart = anchorStartTime;
  if (timelineStart === null && availableClocks.length) {
    const uniqueClocks = [...new Set(availableClocks)].sort((a, b) => a - b);
    let largestGap = -1;
    uniqueClocks.forEach((clock, index) => {
      const next = uniqueClocks[(index + 1) % uniqueClocks.length] + (index === uniqueClocks.length - 1 ? 1440 : 0);
      if (next - clock > largestGap) {
        largestGap = next - clock;
        timelineStart = next % 1440;
      }
    });
  }
  const relativeTime = time => timelineStart === null ? null : (time - timelineStart + 1440) % 1440;
  const endRelative = anchorEndTime === null ? null : relativeTime(anchorEndTime);
  const allowedEvents = timedStops.filter(event => {
    const relative = relativeTime(event.time);
    return relative !== null && (endRelative === null || relative <= endRelative);
  });
  const byStation = new Map();
  allowedEvents.forEach(event => {
    const current = byStation.get(event.stationId);
    if (!current || event.confidence > current.confidence
      || (event.confidence === current.confidence && event.time < current.time)) {
      byStation.set(event.stationId, event);
    }
  });
  const stationTimes = new Map([...byStation].map(([stationId, event]) =>
    [stationId, relativeTime(event.time)]
  ));
  const supportCounts = new Map();
  sources.forEach(({ route }) => route.stops.forEach(stop =>
    supportCounts.set(stop.stationId, (supportCounts.get(stop.stationId) || 0) + 1)
  ));
  const knownStations = new Set([startId, endId, ...byStation.keys()]);
  const expandedEvents = new Map(byStation);
  sources.forEach(({ route }) => {
    if (!route.stops.some(stop => knownStations.has(stop.stationId))) return;
    const orderedTimes = route.stops.map(stop =>
      stopClockMinutes(stop, "departure") ?? stopClockMinutes(stop, "arrival")
    );
    const validTimes = orderedTimes.filter(time => time !== null).map(relativeTime);
    if (validTimes.some(time => time === null || (endRelative !== null && time > endRelative))) return;
    if (validTimes.some((time, index) => index > 0 && time < validTimes[index - 1])) return;
    route.stops.forEach((stop, index) => {
      if (knownStations.has(stop.stationId)) return;
      const time = orderedTimes[index];
      if (time === null) return;
      const relative = relativeTime(time);
      if (relative === null || (endRelative !== null && relative > endRelative)) return;
      expandedEvents.set(stop.stationId, {
        stop,
        route,
        stationId: stop.stationId,
        time,
        confidence: 1,
        relative
      });
      knownStations.add(stop.stationId);
      stationTimes.set(stop.stationId, relative);
    });
  });
  sources.forEach(({ route }) => {
    if (!route.stops.some(stop => expandedEvents.has(stop.stationId))) return;
    const times = route.stops.map(stop =>
      stopClockMinutes(stop, "departure") ?? stopClockMinutes(stop, "arrival")
    );
    const relativeTimes = times.filter(time => time !== null).map(relativeTime);
    if (relativeTimes.some(time => time === null || (endRelative !== null && time > endRelative))) return;
    if (relativeTimes.some((time, index) => index > 0 && time < relativeTimes[index - 1])) return;
    route.stops.forEach(stop => {
      const event = expandedEvents.get(stop.stationId);
      if (!event) return;
      event.stop = {
        ...event.stop,
        arrival: event.stop.arrival ?? stop.arrival ?? null,
        departure: event.stop.departure ?? stop.departure ?? null
      };
    });
  });
  const conflictingStations = new Set();
  [...expandedEvents.entries()].forEach(([stationId, event]) => {
    const relative = stationTimes.get(stationId);
    if (relative === undefined) return;
    [...expandedEvents.entries()].forEach(([otherId, otherEvent]) => {
      if (stationId === otherId) return;
      const otherTime = stationTimes.get(otherId);
      if (otherTime === undefined || Math.abs(otherTime - relative) > 5) return;
      const strongerEvidence = otherEvent.confidence > event.confidence
        || (otherEvent.confidence === event.confidence
          && (supportCounts.get(otherId) || 0) > (supportCounts.get(stationId) || 0));
      if (strongerEvidence) conflictingStations.add(stationId);
    });
  });
  conflictingStations.forEach(stationId => {
    expandedEvents.delete(stationId);
    stationTimes.delete(stationId);
  });
  const generatedStops = [...expandedEvents.entries()]
    .map(([stationId, event]) => ({ stationId, event, relative: stationTimes.get(stationId) }))
    .sort((a, b) => a.relative - b.relative)
    .map(({ stationId, event }) => ({
      stationId,
      arrival: event.stop.arrival ?? null,
      departure: event.stop.departure ?? null
    }));
  const explicitRoute = sources.map(({ route }) => route)
    .filter(route => route.stops[0].stationId === startId
      && route.stops[route.stops.length - 1].stationId === endId)
    .sort((a, b) => b.stops.length - a.stops.length)[0];
  const baseStops = (explicitRoute?.stops || anchorStops).map(stop => {
    const anchorStop = anchorStops.find(candidate => candidate.stationId === stop.stationId);
    return {
      ...stop,
      arrival: stop.arrival ?? anchorStop?.arrival ?? null,
      departure: stop.departure ?? anchorStop?.departure ?? null
    };
  });
  const orderedStops = [...baseStops];
  generatedStops.forEach(stop => {
    if (orderedStops.some(existing => existing.stationId === stop.stationId)) return;
    const time = stationTimes.get(stop.stationId);
    const position = orderedStops.findIndex(existing => {
      const existingTime = stopClockMinutes(existing, "departure") ?? stopClockMinutes(existing, "arrival");
      return existingTime !== null && relativeTime(existingTime) > time;
    });
    if (position < 0) {
      orderedStops.splice(Math.max(1, orderedStops.length - 1), 0, stop);
    } else {
      orderedStops.splice(position, 0, stop);
    }
  });
  const sourceUrls = [...new Set([
    anchor.sourceUrl,
    ...terminalRoutes.map(({ route }) => route.sourceUrl),
    ...[...expandedEvents.values()].map(event => event.route?.sourceUrl)
  ].filter(Boolean))].slice(0, 8);
  const verifiedOffDays = [...new Set(terminalRoutes
    .map(({ route }) => route.weeklyOffDay)
    .filter(offDay => offDay?.verified === true && offDay.day)
    .map(offDay => offDay.day))];
  return {
    ...anchor,
    id: `${anchor.id}-assembled-${startId}-${endId}`,
    stops: orderedStops,
    inferredIntermediateStops: orderedStops.length > anchorStops.length
      || orderedStops.some(stop => !anchorStops.some(anchorStop => anchorStop.stationId === stop.stationId)),
    sourceUrls,
    weeklyOffDay: anchor.weeklyOffDay?.verified === true
      ? anchor.weeklyOffDay
      : verifiedOffDays.length === 1
        ? { day: verifiedOffDays[0], verified: true }
        : anchor.weeklyOffDay,
    scheduleVerified: anchor.scheduleVerified === true
      || terminalRoutes.some(({ route }) => route.scheduleVerified === true)
  };
}
function buildJourneySearchTrains(data) {
  return journeyTrainGroups(data).map(group => {
    const trains = group.trains;
    const train = [...trains].sort((a, b) =>
      Number(Boolean(b.name?.en)) - Number(Boolean(a.name?.en)) || b.routes.length - a.routes.length
    )[0];
    const routes = trains.flatMap(record => record.routes);
    const anchors = new Map();
    routes.forEach(route => {
      if (!journeyRouteAnchorScore(route)) return;
      const key = `${route.stops[0].stationId}>${route.stops[route.stops.length - 1].stationId}`;
      const current = anchors.get(key);
      if (!current || journeyRouteAnchorScore(route) > journeyRouteAnchorScore(current)) anchors.set(key, route);
    });
    const expandedRoutes = [...anchors.values()].map(route => buildExpandedJourneyRoute(group, route));
    return { train, routes: [...routes, ...expandedRoutes] };
  });
}
function fareLabel(train, route) {
  const fares = route.fares || train.fares;
  if (fares?.verified !== true || !Array.isArray(fares.values) || !fares.values.length) return "Unavailable (not verified)";
  return fares.values.map(fare => `${safeText(fare.class || "Fare")}: ${safeText(fare.currency || "BDT")} ${safeText(fare.amount)}`).join(" · ");
}
function selectedFinderTrain() {
  const selectedId = $("trainSelect").value;
  if (journeyFinderSelection?.optionValue === selectedId) return journeyFinderSelection;
  return DATA.trains.find(train => train.id === selectedId);
}
function openJourneyInSeatFinder(match, fromStation, toStation) {
  const optionValue = `journey-result:${match.train.id}:${match.route.id}`;
  const trainSelect = $("trainSelect");
  trainSelect.querySelectorAll('option[data-journey-result="true"]').forEach(option => option.remove());
  journeyFinderSelection = {
    id: optionValue,
    optionValue,
    name: match.train.name.en || `Train no. ${match.train.trainNumbers?.values?.join(" / ") || "unavailable"}`,
    routes: [`${fromStation.name.en} → ${toStation.name.en}`],
    classes: []
  };
  const option = new Option(journeyFinderSelection.name, optionValue);
  option.dataset.journeyResult = "true";
  trainSelect.add(option);
  trainSelect.value = optionValue;
  updateTrainChoices();
  $("directionSelect").value = journeyFinderSelection.routes[0];
  renderSeatMap();
  location.hash = "#seat-finder";
}
function journeyMatches(fromId, toId) {
  const results = [];
  journeySearchTrains.forEach(service => {
    let bestMatch = null;
    service.routes.forEach(route => {
      const originIndex = route.stops.findIndex(stop => stop.stationId === fromId);
      const destinationIndex = route.stops.findIndex((stop, index) => index > originIndex && stop.stationId === toId);
      if (originIndex < 0 || destinationIndex <= originIndex) return;
      const match = { train: service.train, route, originIndex, destinationIndex };
      const score = candidate => candidate.route.stops.length * 2 + Number(candidate.route.scheduleVerified === true);
      if (!bestMatch || score(match) > score(bestMatch)) bestMatch = match;
    });
    if (bestMatch) results.push(bestMatch);
  });
  return results;
}
function renderJourneyResults(matches, fromStation, toStation) {
  const results = $("journeyResults");
  if (!matches.length) {
    results.innerHTML = `<div class="journey-empty panel"><span aria-hidden="true">↗</span><h3>No train records found for this route</h3><p>Try different stations. Available timetables do not cover every Bangladesh Railway route or intermediate stop.</p></div>`;
    $("journeySearchStatus").textContent = `No train records found for ${fromStation.name.en} to ${toStation.name.en}.`;
    return;
  }
  $("journeySearchStatus").textContent = `${matches.length} directional train record${matches.length === 1 ? "" : "s"} found. Timetable details are source-attributed; route coverage is incomplete.`;
  results.innerHTML = `<div class="journey-results-heading"><h3>${matches.length} train record${matches.length === 1 ? "" : "s"} found</h3><span>${safeText(fromStation.name.en)} <span aria-hidden="true">→</span> ${safeText(toStation.name.en)}</span></div>
    <div class="journey-result-list">${matches.map(({ train, route, originIndex, destinationIndex }, index) => {
      const originStop = route.stops[originIndex];
      const destinationStop = route.stops[destinationIndex];
      const stopNames = route.stops.map(stop => {
        const station = journeyData.stations.find(record => record.id === stop.stationId);
        return station?.name?.en || stop.stationId;
      });
      const durationPairs = new Set([
        "dhaka>chattogram",
        "chattogram>dhaka",
        "dhaka>cox-s-bazar",
        "chattogram>cox-s-bazar",
        "cox-s-bazar>chattogram"
      ]);
      const selectedPair = `${fromStation.id}>${toStation.id}`;
      const duration = durationPairs.has(selectedPair)
        && originIndex === 0 && destinationIndex === route.stops.length - 1
        && route.duration?.verified === true && route.duration.value
        ? safeText(route.duration.value)
        : "Unavailable (not verified)";
      const offDay = route.weeklyOffDay || train.weeklyOffDay;
      const weeklyOffDay = offDay?.verified === true && offDay.day
        ? safeText(offDay.day)
        : "Unavailable (not verified)";
      const sourceBadge = route.sourceType === "gojatra-timetable"
        ? route.verified ? "OFFICIAL ENDPOINT · PUBLISHED TIMETABLE" : "PUBLISHED TIMETABLE · GOJATRA"
        : route.verified ? "OFFICIAL ENDPOINT RECORD" : "PRELIMINARY · UNVERIFIED";
      const sourceNote = route.inferredIntermediateStops
        ? `Known intermediate stops are assembled from directional station timetable records. Sources: ${route.sourceUrls.map((url, sourceIndex) => `<a href="${safeText(url)}" target="_blank" rel="noopener">timetable ${sourceIndex + 1}</a>`).join(", ")}. Gojatra is a secondary source; verify current stopping patterns with Bangladesh Railway.`
        : route.sourceType === "gojatra-timetable"
        ? `Schedule details are transcribed from <a href="${safeText(route.sourceUrl)}" target="_blank" rel="noopener">this Gojatra station timetable</a>. Gojatra says its timetable is compiled from Bangladesh Railway publications; this copy has not been independently checked against the primary document.`
        : route.verified
          ? `Train number and directional endpoints are from the <a href="https://eticket.railway.gov.bd/" target="_blank" rel="noopener">Bangladesh Railway E-Ticketing public information feed</a>.`
          : "This record is preliminary and unverified. Confirm service and details with Bangladesh Railway.";
      const routeDetailsId = `journey-route-details-${index}`;
      return `<article class="journey-result-card panel" data-journey-result="${index}" tabindex="0" aria-label="Select ${safeText(train.name.en || "train")} for ${safeText(fromStation.name.en)} to ${safeText(toStation.name.en)} and open the facing direction finder">
        <div class="journey-result-top"><div class="journey-train-symbol" aria-hidden="true">🚆</div><div class="journey-train-name"><h4>${safeText(train.name.en || "Train name unavailable")}</h4>${train.name.bn ? `<p lang="bn">${safeText(train.name.bn)}</p>` : ""}</div><span class="route-verification-badge">${sourceBadge}</span></div>
        <div class="journey-result-route"><span>${safeText(fromStation.name.en)}</span><span class="journey-route-line" aria-hidden="true">→</span><span>${safeText(toStation.name.en)}</span></div>
        <div class="journey-data-grid">
          <div><span>Train number</span><strong>${trainNumberLabel(train, route)}</strong></div>
          <div><span>Departure</span><strong>${verifiedScheduleTime(originStop, "departure", route)}</strong></div>
          <div><span>Arrival</span><strong>${verifiedScheduleTime(destinationStop, "arrival", route)}</strong></div>
          <div><span>Est. duration</span><strong>${duration}</strong></div>
          <div><span>Weekly off day</span><strong>${weeklyOffDay}</strong></div>
          <div><span>Fare</span><strong>${fareLabel(train, route)}</strong></div>
        </div>
        <p class="journey-source-note">${sourceNote}</p>
        <button type="button" class="route-details-toggle" aria-expanded="false" aria-controls="${routeDetailsId}" data-route-details="${routeDetailsId}">View Route Details <span aria-hidden="true">⌄</span></button>
        <button type="button" class="button button-primary journey-use-train" data-use-journey-train="${index}">Find facing direction <span aria-hidden="true">↗</span></button>
        <div class="journey-route-details" id="${routeDetailsId}" hidden><strong>${route.inferredIntermediateStops ? "Known ordered route stops" : "Ordered route stations in the available record"}</strong><ol>${stopNames.map((name, stopIndex) => `<li${stopIndex === originIndex || stopIndex === destinationIndex ? ' class="journey-leg-stop"' : ""}>${safeText(name)}${stopIndex === originIndex ? " · departure" : ""}${stopIndex === destinationIndex ? " · destination" : ""}</li>`).join("")}</ol><p>${route.inferredIntermediateStops ? "This route combines available station timetable records; the published stop data may be incomplete." : "This record covers the selected station pair only; other intermediate stops are not listed here."}</p></div>
      </article>`;
    }).join("")}</div>`;
  results.querySelectorAll("[data-journey-result]").forEach(card => {
    const selectTrain = () => {
      const match = matches[Number(card.dataset.journeyResult)];
      if (match) openJourneyInSeatFinder(match, fromStation, toStation);
    };
    card.addEventListener("click", event => {
      if (event.target.closest("button, a, input, select")) return;
      selectTrain();
    });
    card.addEventListener("keydown", event => {
      if (event.target !== card || (event.key !== "Enter" && event.key !== " ")) return;
      event.preventDefault();
      selectTrain();
    });
  });
  results.querySelectorAll("[data-use-journey-train]").forEach(button => button.addEventListener("click", () => {
    const match = matches[Number(button.dataset.useJourneyTrain)];
    if (match) openJourneyInSeatFinder(match, fromStation, toStation);
  }));
  results.querySelectorAll("[data-route-details]").forEach(button => button.addEventListener("click", () => {
    const panel = $(button.dataset.routeDetails);
    const expanded = button.getAttribute("aria-expanded") === "true";
    button.setAttribute("aria-expanded", String(!expanded));
    panel.hidden = expanded;
    button.querySelector("span").textContent = expanded ? "⌄" : "⌃";
  }));
}
function initJourneySearch() {
  ["from", "to"].forEach(direction => {
    const input = $(`journey${direction === "from" ? "From" : "To"}`);
    const list = $(`journey${direction === "from" ? "From" : "To"}Options`);
    const picker = input.closest(".station-picker");
    input.addEventListener("focus", () => renderStationOptions(direction));
    input.addEventListener("input", () => {
      input.dataset.stationId = "";
      picker.querySelector(".station-clear").hidden = !input.value;
      $("journeyResults").innerHTML = "";
      renderStationOptions(direction);
      $("journeySearchStatus").textContent = "";
    });
    input.addEventListener("keydown", event => {
      if (event.key === "ArrowDown" && !list.hidden) {
        event.preventDefault();
        setActiveStationOption(direction, activeStationOption[direction] + 1);
      } else if (event.key === "ArrowUp" && !list.hidden) {
        event.preventDefault();
        const active = activeStationOption[direction] < 0
          ? list.querySelectorAll('[role="option"]').length - 1
          : activeStationOption[direction] - 1;
        setActiveStationOption(direction, active);
      } else if (event.key === "Enter" && !list.hidden && list.querySelector('[role="option"]')) {
        event.preventDefault();
        const index = activeStationOption[direction] < 0 ? 0 : activeStationOption[direction];
        const station = journeyData.stations.filter(record =>
          record.id !== (direction === "from"
            ? $("journeyTo").dataset.stationId
            : $("journeyFrom").dataset.stationId) &&
          [record.name.en, record.name.bn, ...(record.searchNames || [])].filter(Boolean)
            .some(label => normalizeStationName(label).includes(normalizeStationName(input.value)))
        )[index];
        if (station) setStationSelection(direction, station);
      } else if (event.key === "Escape") {
        list.hidden = true;
        input.setAttribute("aria-expanded", "false");
        input.removeAttribute("aria-activedescendant");
      }
    });
    picker.querySelector(".station-clear").addEventListener("click", () => {
      input.value = "";
      input.dataset.stationId = "";
      picker.querySelector(".station-clear").hidden = true;
      $("journeyResults").innerHTML = "";
      $("journeySearchStatus").textContent = "";
      renderStationOptions(direction);
      input.focus();
    });
  });
  document.addEventListener("click", event => {
    document.querySelectorAll(".station-picker").forEach(picker => {
      if (picker.contains(event.target)) return;
      const input = picker.querySelector("input");
      picker.querySelector(".station-options").hidden = true;
      input.setAttribute("aria-expanded", "false");
    });
  });
  $("swapStations").addEventListener("click", () => {
    const from = $("journeyFrom"), to = $("journeyTo");
    const fromValue = { text: from.value, id: from.dataset.stationId || "" };
    from.value = to.value;
    from.dataset.stationId = to.dataset.stationId || "";
    to.value = fromValue.text;
    to.dataset.stationId = fromValue.id;
    document.querySelectorAll(".station-options").forEach(list => { list.hidden = true; });
    document.querySelectorAll(".station-picker input").forEach(input => input.setAttribute("aria-expanded", "false"));
    document.querySelectorAll(".station-clear").forEach(button => {
      button.hidden = !button.closest(".station-picker").querySelector("input").value;
    });
    $("journeyResults").innerHTML = "";
    $("journeySearchStatus").textContent = "Stations swapped. Select Find Trains to search this direction.";
  });
  $("journeySearchForm").addEventListener("submit", event => {
    event.preventDefault();
    const fromId = $("journeyFrom").dataset.stationId;
    const toId = $("journeyTo").dataset.stationId;
    const fromStation = journeyData.stations.find(station => station.id === fromId);
    const toStation = journeyData.stations.find(station => station.id === toId);
    if (!fromStation || !toStation) {
      $("journeySearchStatus").textContent = "Choose both stations from the suggestion lists before searching.";
      (!fromStation ? $("journeyFrom") : $("journeyTo")).focus();
      return;
    }
    if (fromId === toId) {
      $("journeyResults").innerHTML = "";
      $("journeySearchStatus").textContent = "Choose two different stations for your journey.";
      $("journeyTo").focus();
      return;
    }
    renderJourneyResults(journeyMatches(fromId, toId), fromStation, toStation);
  });
}
function initSeatFinder() {
  fillSelect($("trainSelect"), DATA.trains, "id", "name", "Choose a train");
  const train = DATA.trains[0];
  fillSelect($("directionSelect"), train.routes, null, null, "Choose direction");
  fillSelect($("classSelect"), train.classes, null, null, "Choose class");
  fillSelect($("coachSelect"), [], null, null, "Choose coach");
  $("trainSelect").addEventListener("change", updateTrainChoices);
  $("directionSelect").addEventListener("change", renderSeatMap);
  $("classSelect").addEventListener("change", updateCoachChoices);
  $("coachSelect").addEventListener("change", renderSeatMap);
  ["forwardOnly","windowOnly","verifiedOnly"].forEach(id => $(id).addEventListener("change", renderSeatMap));
  $("resetFilters").addEventListener("click", () => {
    ["forwardOnly","windowOnly","verifiedOnly"].forEach(id => $(id).checked = false);
    $("directionSelect").value = ""; $("classSelect").value = ""; $("coachSelect").value = "";
    renderSeatMap();
  });
  $("downloadSeatData").addEventListener("click", exportVisibleSeats);
  renderSeatMap();
}
function updateTrainChoices() {
  const train = selectedFinderTrain();
  fillSelect($("directionSelect"), train?.routes || [], null, null, "Choose direction");
  fillSelect($("classSelect"), train?.classes || [], null, null, "Choose class");
  fillSelect($("coachSelect"), [], null, null, "Choose coach");
  renderSeatMap();
}
function updateCoachChoices() {
  const train = $("trainSelect").value, cls = $("classSelect").value;
  const records = DATA.coaches.filter(c => c.trainId === train && c.class === cls);
  const coaches = [...new Set(records.map(c => c.coach))];
  fillSelect($("coachSelect"), coaches, null, null, "Choose coach");
  renderSeatMap();
}
function currentCoach() {
  return DATA.coaches.find(c => c.trainId === $("trainSelect").value && c.class === $("classSelect").value && c.coach === $("coachSelect").value);
}
function renderSeatMap() {
  const train = selectedFinderTrain();
  const coach = currentCoach();
  selectedSeat = null; visibleSeats = [];
  $("selectedSeat").textContent = "Select a seat to view its details.";
  $("coachHeading").textContent = coach ? `${coach.coach} · ${coach.class.replaceAll("_"," ")}` : (train ? train.name : "Choose a train");
  $("coachSubheading").textContent = coach
    ? `${train.name} · ${$("directionSelect").value || "Journey direction not selected"}`
    : journeyFinderSelection?.optionValue === $("trainSelect").value
      ? `Journey: ${$("directionSelect").value}. No verified coach layout is available for this train yet.`
      : "No verified coach layout has been added yet. Add research data in data/coaches.json.";
  $("seatMap").innerHTML = "";
  if (!train || !$("directionSelect").value || !$("classSelect").value || !$("coachSelect").value || !coach) {
    $("seatMap").innerHTML = `<div class="empty-state"><span>▦</span><strong>${coach ? "Choose a journey direction" : "No verified seat map yet"}</strong><p>${coach ? "Select the direction of travel to inspect this coach." : "The site is ready for your collected coach data. No seat directions are invented in this demo."}</p></div>`;
    $("seatCount").textContent = "No verified seats loaded";
    return;
  }
  const direction = $("directionSelect").value;
  const seats = (coach.seats || []).filter(seat => {
    if ($("forwardOnly").checked && seat.orientation !== "forward") return false;
    if ($("windowOnly").checked && !seat.window) return false;
    if ($("verifiedOnly").checked && !seat.verified) return false;
    return true;
  });
  visibleSeats = seats;
  seats.forEach(seat => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "seat" + (seat.window ? " is-window" : "") + (seat.orientation === "forward" ? " is-forward" : seat.orientation === "backward" ? " is-backward" : "") + (seat.verified ? "" : " is-unverified");
    btn.textContent = seat.number;
    btn.setAttribute("aria-label", `Seat ${seat.number}, ${seat.orientation || "orientation unknown"}${seat.window ? ", window seat" : ""}`);
    btn.addEventListener("click", () => {
      document.querySelectorAll(".seat.is-selected").forEach(s => s.classList.remove("is-selected"));
      btn.classList.add("is-selected"); selectedSeat = seat;
      $("selectedSeat").textContent = `Seat ${seat.number} · ${seat.orientation === "forward" ? "Forward-facing" : seat.orientation === "backward" ? "Backward-facing" : "Orientation unverified"} · ${seat.window ? "Window seat" : "Window position unknown"} · ${seat.verified ? "Verified" : "Not verified"}${seat.source ? " · Source: " + seat.source : ""}`;
    });
    $("seatMap").appendChild(btn);
  });
  if (!seats.length) $("seatMap").innerHTML = `<div class="empty-state"><strong>No seats match these filters</strong><p>Try removing one or more filters.</p></div>`;
  $("seatCount").textContent = `${seats.length} seat records · ${seats.filter(s => s.verified).length} verified`;
}
function exportVisibleSeats() {
  if (!visibleSeats.length) return toast("There is no seat data to export yet.");
  const csv = ["seat,orientation,window,verified,source", ...visibleSeats.map(s => [s.number,s.orientation || "unknown",s.window,s.verified,JSON.stringify(s.source || "")].join(","))].join("\n");
  const blob = new Blob([csv], {type:"text/csv;charset=utf-8;"});
  const url = URL.createObjectURL(blob); const a = document.createElement("a");
  a.href = url; a.download = "railpath-visible-seat-data.csv"; a.click(); URL.revokeObjectURL(url);
}
function renderRoutes() {
  $("routeCards").innerHTML = DATA.routes.map((r,i) => `
    <article class="route-card">
      <div class="route-visual"><span class="route-number">${String(i+1).padStart(2,"0")}</span><span class="route-tag">${safeText(r.tag)}</span></div>
      <div class="route-content"><h3>${safeText(r.from)} <span aria-hidden="true">↔</span> ${safeText(r.to)}</h3>
      <p>${safeText(r.description)}</p><div class="route-meta"><span>${safeText(r.code)}</span><span>${r.trains.length} train record(s)</span></div>
      <button type="button" data-route="${safeText(r.id)}">Use this route ↗</button></div>
    </article>`).join("");
  $("routeCards").querySelectorAll("[data-route]").forEach(btn => btn.addEventListener("click", () => {
    const r = DATA.routes.find(x => x.id === btn.dataset.route);
    if (!r) return;
    const fromId = stationIdFromName(r.from);
    const toId = stationIdFromName(r.to);
    const fromStation = journeyData.stations.find(station => station.id === fromId);
    const toStation = journeyData.stations.find(station => station.id === toId);
    if (!fromStation || !toStation) {
      toast("This route is not present in the station dataset.");
      return;
    }
    setStationSelection("from", fromStation);
    setStationSelection("to", toStation);
    renderJourneyResults(journeyMatches(fromStation.id, toStation.id), fromStation, toStation);
    location.hash = "#train-search";
  }));
}
function renderStations() {
  const q = $("stationSearch").value.trim().toLowerCase();
  const stations = DATA.stations.filter(s => `${s.name} ${s.city} ${s.region}`.toLowerCase().includes(q));
  $("stationCount").textContent = `${stations.length} station record(s)`;
  $("stationGrid").innerHTML = stations.length ? stations.map(s => `<article class="station-card"><div class="station-symbol">⌖</div><h3>${safeText(s.name)}</h3><p>${safeText(s.region)}<br>${safeText(s.note)}</p><span class="station-status">${safeText(s.status)}</span></article>`).join("") : `<div class="empty-message">No stations found. Try a different search.</div>`;
}
function renderGuides() {
  $("guideGrid").innerHTML = DATA.guides.map((g,i) => `<article class="guide-card"><span class="guide-number">${String(i+1).padStart(2,"0")}</span><div class="section-kicker">${safeText(g.category)}</div><h3>${safeText(g.title)}</h3><p>${safeText(g.description)}</p><button type="button" data-guide="${i}">Read guide ↗</button></article>`).join("");
  $("guideGrid").querySelectorAll("[data-guide]").forEach(btn => btn.addEventListener("click", () => {
    const g = DATA.guides[Number(btn.dataset.guide)];
    const overlay = document.createElement("div"); overlay.className = "guide-overlay";
    overlay.innerHTML = `<div class="guide-dialog" role="dialog" aria-modal="true" aria-label="${safeText(g.title)}"><button class="guide-close" aria-label="Close guide">×</button><div class="section-kicker">${safeText(g.category)}</div><h2>${safeText(g.title)}</h2><p>${safeText(g.body)}</p></div>`;
    document.body.appendChild(overlay);
    overlay.querySelector(".guide-close").focus();
    overlay.addEventListener("click", e => { if (e.target === overlay || e.target.closest(".guide-close")) overlay.remove(); });
    document.addEventListener("keydown", function esc(e){ if(e.key==="Escape"){overlay.remove();document.removeEventListener("keydown",esc);} });
  }));
}
function initPlanner() {
  const ids = ["budgetFare","budgetPeople","budgetTransport","budgetFood"];
  function calculate() {
    const fare = Math.max(0, Number($("budgetFare").value) || 0);
    const people = Math.max(1, Number($("budgetPeople").value) || 1);
    const transport = Math.max(0, Number($("budgetTransport").value) || 0);
    const food = Math.max(0, Number($("budgetFood").value) || 0);
    $("budgetTotal").textContent = money(fare * people + transport + food);
  }
  ids.forEach(id => $(id).addEventListener("input", calculate));
  $("saveBudget").addEventListener("click", () => {
    const data = Object.fromEntries(ids.map(id => [id, $(id).value]));
    localStorage.setItem("railpathBudget", JSON.stringify(data));
    $("budgetStatus").textContent = "Estimate saved on this device.";
  });
  try {
    const saved = JSON.parse(localStorage.getItem("railpathBudget") || "null");
    if (saved) ids.forEach(id => { if(saved[id] !== undefined) $(id).value = saved[id]; });
  } catch {}
  calculate();
  const checks = [...document.querySelectorAll("[data-check]")];
  checks.forEach(c => {
    c.checked = localStorage.getItem("railpathCheck_" + c.dataset.check) === "true";
    c.addEventListener("change", () => localStorage.setItem("railpathCheck_" + c.dataset.check, String(c.checked)));
  });
  $("setReminder").addEventListener("click", async () => {
    const val = $("reminderTime").value;
    if (!val) return $("reminderStatus").textContent = "Choose a date and time first.";
    const date = new Date(val);
    if (Number.isNaN(date.getTime()) || date <= new Date()) return $("reminderStatus").textContent = "Choose a future date and time.";
    localStorage.setItem("railpathReminder", date.toISOString());
    if (!("Notification" in window)) return $("reminderStatus").textContent = "Reminder saved locally. This browser does not support notifications.";
    if (Notification.permission === "default") {
      try { await Notification.requestPermission(); } catch {}
    }
    $("reminderStatus").textContent = Notification.permission === "granted"
      ? "Reminder time saved. Browser notifications may require the site to be open; this is not a guaranteed background alarm."
      : "Reminder time saved locally. Notifications were not enabled; add a calendar alarm as a backup.";
  });
}
function initReport() {
  $("reportForm").addEventListener("submit", e => {
    e.preventDefault();
    const type = $("reportType").value, details = $("reportDetails").value.trim(), contact = $("reportContact").value.trim();
    const subject = encodeURIComponent(`[Railo report] ${type}`);
    const body = encodeURIComponent(`Report type: ${type}\nDetails: ${details}\nContact: ${contact || "Not provided"}\n\nPlease verify before changing public data.`);
    // Add a real, monitored contact address here before enabling mailto:
    const configuredEmail = "";
    if (!configuredEmail) {
      toast("Report prepared. Add a real support email in script.js to open an email draft.");
      $("reportDetails").value = "";
      return;
    }
    location.href = `mailto:${configuredEmail}?subject=${subject}&body=${body}`;
  });
}
async function init() {
  await loadJourneyData();
  initNav(); initJourneySearch(); initSeatFinder(); renderRoutes(); renderStations(); renderGuides(); initPlanner(); initReport();
  $("stationSearch").addEventListener("input", renderStations);
}
document.addEventListener("DOMContentLoaded", init);
