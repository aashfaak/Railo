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
  guides: [
    { title: "How to read your train ticket", category: "TRAVEL BASICS", description: "Understand train, coach and seat labels, and keep booking references private.", body: "Check the train name/number, date, origin, destination, class, coach and seat. Keep your PNR and ticket QR code private. Always compare the ticket details with official booking information." },
    { title: "Choosing a forward-facing seat", category: "SEAT GUIDE", description: "What to check before trusting a seat direction label.", body: "A seat's direction depends on its physical orientation and the train's direction of travel for that specific journey. Do not infer it from seat number alone. Use a verified coach diagram or reliable physical evidence. If the information is uncertain, treat the direction as unknown." },
    { title: "Before leaving for the station", category: "CHECKLIST", description: "A practical checklist for a smoother rail journey.", body: "Confirm your travel date, train, departure time, station and coach. Allow enough time to reach the station. Keep ticket details and required ID accessible, pack essentials, and confirm onward transport at your destination." },
    { title: "Understanding coach classes", category: "RAILWAY BASICS", description: "A guide to comparing class names and amenities.", body: "Class names and availability depend on the train and route. Check the class offered for your particular train and date in the official booking system. Do not assume that every train has every class or the same layout." },
    { title: "Plan a train trip budget", category: "JOURNEY PLANNING", description: "Include more than just the ticket price.", body: "Estimate ticket cost for all travellers, local transport, food, luggage needs and onward transport. Use current official fare information and keep a buffer for unexpected expenses." },
    { title: "How we verify railway data", category: "DATA TRANSPARENCY", description: "Why this project distinguishes verified and unknown information.", body: "We aim to list a source and last-verified date for important information. Seat direction should only be labelled verified when evidence supports the specific coach and journey direction. Reports should be reviewed before changing public data." }
  ],
  coaches: [],
  coachPlans: [],
  availabilitySnapshots: []
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
function buildIllustrativeCoachSeats(classCode, templateSeats, seatCount, seatPrefix = "", availableSeats = null) {
  const template = Array.isArray(templateSeats) && templateSeats.length
    ? templateSeats
    : [{ orientation: "unknown", window: null, verified: false }];
  const count = Number.isInteger(seatCount) && seatCount > 0 ? seatCount : 60;
  return Array.from({ length: count }, (_, index) => {
    const sourceSeat = template[index % template.length];
    const number = `${seatPrefix ? `${seatPrefix}-` : ""}${index + 1}`;
    const hasLiveStatus = Array.isArray(availableSeats);
    return {
      ...sourceSeat,
      number,
      orientation: "unknown",
      window: null,
      verified: false,
      status: hasLiveStatus ? (availableSeats.includes(number) ? "available" : "booked") : null,
      source: `Illustrative ${classCode} coach seat; exact train-specific layout is not verified.`
    };
  });
}
async function loadJourneyData() {
  if (location.protocol === "file:") {
    journeyData = normalizeJourneyData(starterJourneyData());
    journeySearchTrains = buildJourneySearchTrains(journeyData);
    $("journeySearchStatus").textContent = "Using the site's preliminary route records; train services and route data are unverified.";
    return;
  }
  try {
    const response = await fetch("data/trains.json");
    if (!response.ok) throw new Error(`Journey data request failed (${response.status}).`);
    journeyData = normalizeJourneyData(await response.json());
    const coachResponse = await fetch("data/coaches.json");
    if (!coachResponse.ok) throw new Error(`Coach data request failed (${coachResponse.status}).`);
    const coachData = await coachResponse.json();
    if (!Array.isArray(coachData.demoLayouts) || !coachData.demoLayouts.length) {
      throw new Error("Coach data does not contain a demo seat layout.");
    }
    DATA.coachPlans = Array.isArray(coachData.coachPlans) ? coachData.coachPlans : [];
    DATA.availabilitySnapshots = Array.isArray(coachData.availabilitySnapshots) ? coachData.availabilitySnapshots : [];
    DATA.coaches = coachData.demoLayouts.flatMap(layout =>
      layout.classes.map(classCode => ({
        trainId: "*",
        coachKey: `generic-${classCode}`,
        class: classCode,
        coach: classCode,
        direction: "Demo only",
        demo: true,
        seatCount: layout.seatCounts?.[classCode] || 60,
        seats: buildIllustrativeCoachSeats(classCode, layout.seats, layout.seatCounts?.[classCode])
      }))
    ).concat(DATA.coachPlans.flatMap(plan => plan.coaches.map(coach => ({
      ...coach,
      trainId: plan.trainIds[0],
      planId: plan.trainIds[0],
      coachKey: coach.id,
      demo: true,
      direction: "Train-specific preview",
      seats: buildIllustrativeCoachSeats(coach.class, [], coach.seatCount, coach.seatPrefix, coach.availableSeats)
        .map(seat => ({ ...seat, source: coach.source }))
    })))).concat(DATA.availabilitySnapshots.flatMap(snapshot => Object.entries(snapshot.classes || {}).map(([classCode, availableCount]) => ({
      trainId: snapshot.trainIds?.[0],
      snapshotId: snapshot.trainIds?.[0],
      coachKey: `availability-${snapshot.trainNumbers?.[0] || snapshot.trainIds?.[0]}-${classCode}`,
      class: classCode,
      name: `${classCode} availability`,
      seatCount: Number(availableCount) || 0,
      availableCount: Number(availableCount) || 0,
      availabilityOnly: true,
      snapshotDate: snapshot.snapshotDate,
      source: snapshot.source,
      demo: true,
      seats: []
    }))));
    $("journeySearchStatus").textContent = `${journeyData.trains.length} train records across ${journeyData.stations.length} stations loaded. Coverage is incomplete; schedule details are attributed to their source.`;
  } catch (error) {
    console.error("Unable to load the journey dataset; using existing preliminary route records.", error);
    journeyData = normalizeJourneyData(starterJourneyData());
    $("journeySearchStatus").textContent = "The route dataset could not be loaded. Showing the site's preliminary starter records.";
  }
  journeySearchTrains = buildJourneySearchTrains(journeyData);
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
  if (value?.verified === false && value.time) return `${safeText(value.time)} (unverified)`;
  if (route?.scheduleVerified === true && typeof value === "string" && value) return safeText(value);
  return "Not available";
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
function buildOrderedEvidenceRoutes(group) {
  const sources = group.trains.flatMap(train => train.routes.map(route => ({
    ...route,
    stops: route.stops.filter(stop => stop.stopping !== false)
  })));
  const stationEvidence = new Map();
  const neighbors = new Map();
  const addStation = stationId => {
    if (!neighbors.has(stationId)) neighbors.set(stationId, new Set());
    if (!stationEvidence.has(stationId)) stationEvidence.set(stationId, []);
  };
  sources.forEach(route => {
    const stops = route.stops.filter((stop, index, all) =>
      stop.stationId && all.findIndex(candidate => candidate.stationId === stop.stationId) === index
    );
    stops.forEach(stop => {
      addStation(stop.stationId);
      stationEvidence.get(stop.stationId).push({ stop, route });
    });
    stops.forEach((stop, index) => {
      stops.slice(index + 1).forEach(laterStop => {
        neighbors.get(stop.stationId).add(laterStop.stationId);
      });
    });
  });
  const remaining = new Set(neighbors.keys());
  const routes = [];
  while (remaining.size) {
    const component = new Set();
    const queue = [remaining.values().next().value];
    while (queue.length) {
      const stationId = queue.pop();
      if (component.has(stationId)) continue;
      component.add(stationId);
      neighbors.forEach((destinations, origin) => {
        if (destinations.has(stationId) && !component.has(origin)) queue.push(origin);
      });
      neighbors.get(stationId).forEach(destination => {
        if (!component.has(destination)) queue.push(destination);
      });
    }
    component.forEach(stationId => remaining.delete(stationId));
    if (component.size < 2) continue;
    const orderedStations = [];
    const visited = new Set();
    let ambiguousOrder = false;
    while (visited.size < component.size) {
      const ready = [...component].filter(stationId =>
        !visited.has(stationId)
        && ![...component].some(origin =>
          !visited.has(origin) && neighbors.get(origin).has(stationId)
        )
      );
      if (ready.length !== 1) {
        ambiguousOrder = true;
        break;
      }
      visited.add(ready[0]);
      orderedStations.push(ready[0]);
    }
    if (ambiguousOrder) continue;
    const readScheduleValue = (stationId, field) => {
      const values = stationEvidence.get(stationId)
        .filter(({ stop }) => stop[field] !== null && stop[field] !== undefined && stop[field] !== "")
        .map(({ stop, route }) => {
          const value = stop[field];
          if (typeof value === "object" && value.time) return value;
          if (typeof value !== "string") return null;
          return { time: value, verified: route.scheduleVerified === true };
        })
        .filter(Boolean);
      const unique = new Map();
      values.forEach(value => {
        const key = String(value.time).trim().toLowerCase();
        const current = unique.get(key);
        if (!current || value.verified === true) unique.set(key, value);
      });
      if (unique.size !== 1) return null;
      return [...unique.values()].sort((a, b) =>
        Number(b.verified === true) - Number(a.verified === true)
      )[0];
    };
    const componentSources = [...component].flatMap(stationId =>
      stationEvidence.get(stationId).map(({ route }) => route)
    );
    const sourceUrls = [...new Set(componentSources.flatMap(route => [
      route.sourceUrl,
      ...(route.sourceUrls || [])
    ]).filter(Boolean))];
    const routeId = `evidence-route-${group.number}-${orderedStations.join("-")}`
      .toLocaleLowerCase().replace(/[^a-z0-9-]+/g, "-");
    routes.push({
      id: routeId,
      verified: false,
      scheduleVerified: false,
      routeCompleteness: "incomplete",
      trainNumber: {
        value: group.number,
        verified: group.trains.every(train =>
          train.trainNumbers?.verified === true && train.trainNumbers.values?.includes(group.number)
        )
      },
      duration: { value: null, verified: false },
      stops: orderedStations.map(stationId => ({
        stationId,
        arrival: readScheduleValue(stationId, "arrival"),
        departure: readScheduleValue(stationId, "departure")
      })),
      inferredIntermediateStops: true,
      sourceType: "assembled-timetable-evidence",
      sourceUrls
    });
  }
  return routes;
}
function buildExpandedJourneyRoute(group, anchor) {
  const anchorStops = anchor.stops.filter(stop => stop.stopping !== false);
  const startId = anchorStops[0].stationId;
  const endId = anchorStops[anchorStops.length - 1].stationId;
  const sources = group.trains.flatMap(train => train.routes.map(route => ({
    train,
    route: {
      ...route,
      stops: route.stops.filter(stop => stop.stopping !== false)
    }
  })));
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
      Number(b.routes.some(route =>
        route.sourceType === "bangladesh-railway-train-details"
        && route.routeCompleteness === "complete"
      )) - Number(a.routes.some(route =>
        route.sourceType === "bangladesh-railway-train-details"
        && route.routeCompleteness === "complete"
      ))
      || Number(Boolean(b.name?.en)) - Number(Boolean(a.name?.en))
      || b.routes.length - a.routes.length
    )[0];
    const routes = trains.flatMap(record => record.routes);
    const anchors = new Map();
    routes.forEach(route => {
      if (!journeyRouteAnchorScore(route)) return;
      const key = `${route.stops[0].stationId}>${route.stops[route.stops.length - 1].stationId}`;
      const current = anchors.get(key);
      if (!current || journeyRouteAnchorScore(route) > journeyRouteAnchorScore(current)) anchors.set(key, route);
    });
    const expandedRoutes = [...anchors.values()]
      .filter(route => route.routeCompleteness !== "complete")
      .map(route => buildExpandedJourneyRoute(group, route));
    const evidenceRoutes = buildOrderedEvidenceRoutes(group);
    return { train, routes: [...routes, ...expandedRoutes, ...evidenceRoutes] };
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
    sourceTrainId: match.train.id,
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
  $("seat-finder").scrollIntoView({ behavior: "smooth", block: "start" });
  $("seatFinderHeading").focus({ preventScroll: true });
}
function journeyMatches(fromId, toId) {
  const results = [];
  journeySearchTrains.forEach(service => {
    let bestMatch = null;
    const completeRoutes = service.routes.filter(route => route.routeCompleteness === "complete");
    const searchableRoutes = completeRoutes.length ? completeRoutes : service.routes;
    searchableRoutes.forEach(route => {
      const originIndex = route.stops.findIndex(stop =>
        stop.stopping !== false && stop.stationId === fromId
      );
      if (originIndex < 0) return;
      const destinationIndex = route.stops.findIndex((stop, index) =>
        index > originIndex && stop.stopping !== false && stop.stationId === toId
      );
      if (destinationIndex < 0) return;
      const match = { train: service.train, route, originIndex, destinationIndex };
      const score = candidate =>
        Number(candidate.route.routeCompleteness === "complete") * 100000
        + Number(candidate.route.verified === true) * 10000
        + candidate.route.stops.length * 2
        + Number(candidate.route.scheduleVerified === true);
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
      const hasPassThroughStations = route.stops.some(stop => stop.stopping === false);
      const duration = originIndex === 0 && destinationIndex === route.stops.length - 1
        && route.duration?.value
        ? `${safeText(route.duration.value)}${route.duration.verified === true ? "" : " (unverified)"}`
        : "Not available";
      const offDay = route.weeklyOffDay || train.weeklyOffDay;
      const weeklyOffDay = offDay?.verified === true && offDay.day
        ? safeText(offDay.day)
        : "Unavailable (not verified)";
      const routeStatus = route.routeCompleteness === "complete"
        ? ""
        : route.routeCompleteness === "unverified"
          ? " · ROUTE UNVERIFIED"
          : " · ROUTE INCOMPLETE";
      const sourceBadge = route.sourceType === "bangladesh-railway-train-details"
        ? `BANGLADESH RAILWAY · OFFICIAL TRAIN DETAILS${routeStatus}`
        : route.sourceType === "user-provided-unverified"
        ? `USER-PROVIDED${routeStatus}`
        : route.sourceType === "gojatra-timetable"
          ? `${route.verified ? "OFFICIAL ENDPOINT · " : ""}PUBLISHED TIMETABLE · GOJATRA${routeStatus}`
          : route.verified
            ? `OFFICIAL ENDPOINT RECORD${routeStatus}`
            : `PUBLISHED ROUTE DATA${routeStatus}`;
      const sourceNote = route.sourceType === "bangladesh-railway-train-details"
        ? `Train details are transcribed from the <a href="${safeText(route.sourceUrl)}" target="_blank" rel="noopener">Bangladesh Railway E-Ticketing Train Details</a> page for ${safeText(route.serviceDate || "30 October 2026")}. ${route.routeCompleteness === "complete" ? "The displayed ordered stop list is included." : "The official details view exposes this segment's timings but not a complete intermediate-stop list; verify omitted stops with Bangladesh Railway."}${route.scheduleNote ? ` ${safeText(route.scheduleNote)}` : ""}`
        : route.sourceType === "user-provided-unverified"
        ? `The ordered stops and schedule were supplied by the user and have not been independently verified against an official Bangladesh Railway timetable. The supplementary Dulahazara stop is listed in <a href="${safeText(route.supplementarySourceUrl)}" target="_blank" rel="noopener">this published station timetable</a>.`
        : route.sourceType === "assembled-timetable-evidence"
        ? `This ordered route is assembled only from same-train directional station-pair records. Contributing sources: ${route.sourceUrls.map((url, sourceIndex) => `<a href="${safeText(url)}" target="_blank" rel="noopener">timetable ${sourceIndex + 1}</a>`).join(", ") || "source attribution unavailable"}. The stop list may be incomplete; confirm with Bangladesh Railway.`
        : route.inferredIntermediateStops
        ? `Known intermediate stops are assembled from directional station timetable records. Sources: ${route.sourceUrls.map((url, sourceIndex) => `<a href="${safeText(url)}" target="_blank" rel="noopener">timetable ${sourceIndex + 1}</a>`).join(", ")}. Gojatra is a secondary source; verify current stopping patterns with Bangladesh Railway.`
        : route.sourceType === "gojatra-timetable"
        ? `Schedule details are transcribed from <a href="${safeText(route.sourceUrl)}" target="_blank" rel="noopener">this Gojatra station timetable</a>. Gojatra says its timetable is compiled from Bangladesh Railway publications; this copy has not been independently checked against the primary document.`
        : route.verified
          ? `Train number and directional endpoints are from the <a href="https://eticket.railway.gov.bd/" target="_blank" rel="noopener">Bangladesh Railway E-Ticketing public information feed</a>.`
          : "This record is preliminary and unverified. Confirm service and details with Bangladesh Railway.";
      const routeDetailsId = `journey-route-details-${index}`;
      const routeDetailsHeading = route.routeCompleteness === "complete"
        ? hasPassThroughStations
          ? "Verified route stops and pass-through stations"
          : "Verified ordered route stops"
        : `Ordered route stops · ${route.routeCompleteness === "unverified" ? "unverified" : "incomplete"}`;
      const routeDetailsNote = (route.routeCompleteness === "complete"
        ? hasPassThroughStations
          ? "This ordered route is verified against the cited source. Stations marked “passes without stopping” are shown in the official route but are not searchable as boarding or destination stops."
          : "This complete stop list is verified against the cited source."
        : route.sourceType === "user-provided-unverified"
          ? "This route list and schedule have not been independently verified; confirm all stops and times with Bangladesh Railway."
          : route.inferredIntermediateStops
            ? "This route combines available station timetable records; the published stop data may be incomplete."
            : "This record covers the selected station pair only; other intermediate stops are not listed here.")
        + (route.scheduleNote ? ` ${route.scheduleNote}` : "");
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
        <div class="journey-route-details" id="${routeDetailsId}" hidden><strong>${safeText(routeDetailsHeading)}</strong><ol>${stopNames.map((name, stopIndex) => `<li${stopIndex === originIndex || stopIndex === destinationIndex ? ' class="journey-leg-stop"' : ""}>${safeText(name)}${route.stops[stopIndex].stopping === false ? " · passes without stopping" : ""}${stopIndex === originIndex ? " · departure" : ""}${stopIndex === destinationIndex ? " · destination" : ""}<span class="journey-stop-schedule">Arrival: ${verifiedScheduleTime(route.stops[stopIndex], "arrival", route)} · Departure: ${verifiedScheduleTime(route.stops[stopIndex], "departure", route)}</span></li>`).join("")}</ol><p>${safeText(routeDetailsNote)}</p></div>
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
  DATA.trains = journeyData.trains.map(train => ({
    ...train,
    name: typeof train.name === "string" ? train.name : train.name?.en || train.name?.bn || `Train ${train.trainNumbers?.values?.join("/") || ""}`,
    routes: (train.routes || []).map(route => typeof route === "string"
      ? route
      : (route.stops || []).map(stop => journeyData.stations.find(station => station.id === stop.stationId)?.name?.en).filter(Boolean).join(" → ")
    ).filter(Boolean)
  }));
  fillSelect($("trainSelect"), DATA.trains, "id", "name", "Choose a train");
  const train = DATA.trains[0];
  fillSelect($("directionSelect"), train.routes, null, null, "Choose direction");
  updateCoachChoices();
  $("trainSelect").addEventListener("change", updateTrainChoices);
  $("directionSelect").addEventListener("change", renderSeatMap);
  $("coachSelect").addEventListener("change", renderSeatMap);
  ["forwardOnly","windowOnly","verifiedOnly"].forEach(id => $(id).addEventListener("change", renderSeatMap));
  $("resetFilters").addEventListener("click", () => {
    ["forwardOnly","windowOnly","verifiedOnly"].forEach(id => $(id).checked = false);
    $("directionSelect").value = ""; $("coachSelect").value = "";
    renderSeatMap();
  });
  $("downloadSeatData").addEventListener("click", exportVisibleSeats);
  renderSeatMap();
}
function updateTrainChoices() {
  const train = selectedFinderTrain();
  fillSelect($("directionSelect"), train?.routes || [], null, null, "Choose direction");
  updateCoachChoices();
  renderSeatMap();
}
function selectedCoachPlan(train) {
  const trainIds = [train?.id, train?.sourceTrainId].filter(Boolean);
  const trainNumbers = train?.trainNumbers?.values || [];
  return DATA.coachPlans.find(plan =>
    trainIds.some(id => plan.trainIds?.includes(id))
    || trainNumbers.some(number => plan.trainNumbers?.includes(number))
  ) || null;
}
function updateCoachChoices() {
  const selectedTrain = selectedFinderTrain();
  const plan = selectedCoachPlan(selectedTrain);
  const planRecords = plan
    ? DATA.coaches.filter(coach => coach.planId === plan.trainIds[0])
    : [];
  const trainNumbers = selectedTrain?.trainNumbers?.values || [];
  const snapshotRecords = DATA.coaches.filter(coach => coach.availabilityOnly && (
    coach.trainId === selectedTrain?.id || trainNumbers.some(number => coach.coachKey.endsWith(`-${number}-${coach.class}`))
  ));
  const coveredClasses = new Set(planRecords.map(coach => coach.class));
  const records = planRecords.concat(snapshotRecords.filter(coach => !coveredClasses.has(coach.class)));
  const fallbackRecords = records.length ? records : DATA.coaches.filter(coach => coach.trainId === "*");
  const select = $("coachSelect");
  select.innerHTML = "";
  select.add(new Option("Choose coach", ""));
  fallbackRecords.forEach(coach => {
    const countLabel = coach.availabilityOnly
      ? `${coach.availableCount} available tickets · snapshot`
      : coach.seatCountVerified === false ? `${coach.seatCount} seats · estimated` : `${coach.seatCount} seats`;
    select.add(new Option(`${coach.name || coach.class} · ${coach.class} · ${countLabel}`, coach.coachKey));
  });
  $("coachSelect").value = fallbackRecords[0]?.coachKey || "";
}
function currentCoach() {
  return DATA.coaches.find(coach => coach.coachKey === $("coachSelect").value);
}
function renderSeatMap() {
  const train = selectedFinderTrain();
  const coach = currentCoach();
  selectedSeat = null; visibleSeats = [];
  $("selectedSeat").textContent = "Select a seat to view its details.";
  $("coachHeading").textContent = coach
    ? coach.availabilityOnly ? `Class · ${coach.class} · ${coach.availableCount} available tickets` : `Coach · ${coach.name || coach.class} · ${coach.seatCount} seats`
    : (train ? train.name : "Choose a train");
  $("mapBadge").textContent = coach?.snapshotDate ? "OFFICIAL SNAPSHOT" : "ILLUSTRATIVE";
  $("coachSubheading").textContent = coach
    ? coach.snapshotDate
      ? `Bangladesh Railway seat snapshot · ${coach.snapshotDate} · availability may change`
      : `Illustrative only · ${train?.name || "Choose a train"} · ${$("directionSelect").value || "Journey direction not selected"}`
    : journeyFinderSelection?.optionValue === $("trainSelect").value
      ? `Journey: ${$("directionSelect").value}. Choose a class code to preview the illustrative seat layout.`
      : "Choose a coach class to preview the illustrative seat layout.";
  $("seatMap").innerHTML = "";
  $("seatMap").classList.toggle("is-demo", Boolean(coach?.demo));
  $("seatMap").classList.toggle("is-cabin", Boolean(coach && ["AC_B", "AC_S", "F_BERTH", "F_SEAT"].includes(coach.class)));
  if (coach?.availabilityOnly) {
    $("seatMap").innerHTML = `<div class="empty-state"><span>▣</span><strong>Coach seat layout not verified</strong><p>${coach.availableCount} ticket(s) were available in the official search result for ${safeText(coach.class)}. No seat numbers are invented because the official seat-layout request was not available for this snapshot.</p></div>`;
    $("seatCount").textContent = `${coach.availableCount} available tickets · snapshot ${coach.snapshotDate}`;
    return;
  }
  if (!train || !$("directionSelect").value || !$("coachSelect").value || !coach) {
    $("seatMap").innerHTML = `<div class="empty-state"><span>▦</span><strong>${coach ? "Choose a journey direction" : "Demo seat map"}</strong><p>${coach ? "Select the direction of travel to preview this illustrative layout." : "Choose a class code from the Coach list. The displayed layout is not an actual verified coach plan."}</p></div>`;
    $("seatCount").textContent = "No demo seats loaded";
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
  const cabinClasses = new Set(["AC_B", "AC_S", "F_BERTH", "F_SEAT"]);
  const isCabinCoach = cabinClasses.has(coach.class);
  const cabinGroupSize = ["AC_B", "F_BERTH"].includes(coach.class) ? 4 : 6;
  const cabinLabels = ["ক", "খ", "গ", "ঘ", "ঙ", "চ", "ছ", "জ", "ঝ", "ট", "ঠ", "ড"];
  let cabinSeats;
  seats.forEach((seat, index) => {
    if (isCabinCoach && index % cabinGroupSize === 0) {
      const cabin = document.createElement("section");
      cabin.className = "cabin-compartment";
      cabin.innerHTML = `<div class="cabin-title"><strong>কেবিন ${cabinLabels[index / cabinGroupSize] || index / cabinGroupSize + 1}</strong><span>${cabinGroupSize} seats</span></div>`;
      cabinSeats = document.createElement("div");
      cabinSeats.className = "cabin-seats";
      cabin.appendChild(cabinSeats);
      $("seatMap").appendChild(cabin);
    }
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "seat" + (seat.window ? " is-window" : "") + (seat.orientation === "forward" ? " is-forward" : seat.orientation === "backward" ? " is-backward" : "") + (seat.verified ? "" : " is-unverified") + (seat.status === "booked" ? " is-unavailable" : "");
    if (seat.status) btn.disabled = seat.status !== "available";
    btn.textContent = seat.number;
    btn.setAttribute("aria-label", `Seat ${seat.number}, ${seat.status || "status unknown"}, ${seat.orientation || "orientation unknown"}${seat.window ? ", window seat" : ""}`);
    btn.addEventListener("click", () => {
      document.querySelectorAll(".seat.is-selected").forEach(s => s.classList.remove("is-selected"));
      btn.classList.add("is-selected"); selectedSeat = seat;
      $("selectedSeat").textContent = `Seat ${seat.number} · ${seat.orientation === "forward" ? "Forward-facing" : seat.orientation === "backward" ? "Backward-facing" : "Orientation unverified"} · ${seat.window ? "Window seat" : "Window position unknown"} · ${seat.verified ? "Verified" : "Not verified"}${seat.source ? " · Source: " + seat.source : ""}`;
    });
    (isCabinCoach ? cabinSeats : $("seatMap")).appendChild(btn);
  });
  if (!seats.length) $("seatMap").innerHTML = `<div class="empty-state"><strong>No seats match these filters</strong><p>Try removing one or more filters.</p></div>`;
  const liveAvailable = seats.filter(seat => seat.status === "available").length;
  $("seatCount").textContent = coach.snapshotDate
    ? `${liveAvailable} available · ${seats.length} total · snapshot ${coach.snapshotDate}`
    : `${seats.length} demo seats · ${seats.filter(s => s.verified).length} verified`;
}
function exportVisibleSeats() {
  if (!visibleSeats.length) return toast("There is no seat data to export yet.");
  const csv = ["seat,orientation,window,verified,source", ...visibleSeats.map(s => [s.number,s.orientation || "unknown",s.window,s.verified,JSON.stringify(s.source || "")].join(","))].join("\n");
  const blob = new Blob([csv], {type:"text/csv;charset=utf-8;"});
  const url = URL.createObjectURL(blob); const a = document.createElement("a");
  a.href = url; a.download = "railpath-visible-seat-data.csv"; a.click(); URL.revokeObjectURL(url);
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
  initNav(); initJourneySearch(); initSeatFinder(); initReport();
}
document.addEventListener("DOMContentLoaded", init);
