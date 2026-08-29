# Real-Time Public Transport Tracker for Small Cities — Project Plan

**Smart India Hackathon project**

---

## 1. Problem & Goal

Small-city bus commuters have no reliable way to know when the next bus is coming or how crowded it is. Large-city systems solve this with dedicated GPS hardware on every bus, which is expensive to roll out. This project solves the same problem using infrastructure that already exists in Punjab buses: the **Android ticketing machine** every conductor already carries (PUNBUS / Punjab Roadways).

**Goal:** show commuters live bus locations, ETAs to their stop, and estimated crowding — without requiring any new hardware on the bus.

---

## 2. Data Source

All live data originates from the ticketing machine (`busAPI()` in our design), which exposes two capabilities:

| Function | What it gives us | How |
|---|---|---|
| `location()` | Real-time GPS coordinates | Read directly from the Android device's GPS |
| `passengers()` | Current headcount on the bus | Derived — see passenger counting logic below |

We won't have access to the real government API during the hackathon, so **we simulate it** (see Section 6) with a generator that mimics its exact shape, so swapping in the real feed later is a one-line change, not a rewrite.

---

## 3. System Architecture

```
Ticketing machine (Android)
        |  GPS + ticket issuance
        v
busAPI() ingestion layer  (MQTT / WebSocket)
        |
        +-------------------+
        v                   v
Location engine      Passenger counter
(map-match GPS        (boarding/alighting
 to route)             from ticket events)
        |                   |
        +-------------------+
                v
        Data store
   (Redis: live state
    MongoDB: history)
                v
        Public API & apps
   (ETA, occupancy for commuters)
```

- **Ingestion**: buses publish to topics like `bus/<bus_id>/location` and `bus/<bus_id>/ticket`.
- **Location engine**: snaps noisy GPS points onto the known route polyline, and tracks how far along the route the bus has progressed.
- **Passenger counter**: maintains live headcount per bus from ticket events (details in Section 5).
- **Data store**: Redis for current state (fast reads for the live map), MongoDB for routes/stops/ticket history.
- **Public API**: REST for static data, WebSocket/SSE for live pushes to the frontend.

---

## 4. Data Models

**Route**
```json
{
  "route_id": "R1",
  "name": "Amritsar Junction - Sri Harmandir Sahib",
  "stops": [
    { "stop_id": "s101", "name": "Amritsar Railway Junction", "lat": 31.6335, "lng": 74.8655, "sequence": 0 }
  ],
  "polyline": [[31.6335, 74.8655], [31.6200, 74.8765]]
}
```

**Bus — live state (Redis)**
```json
{
  "bus_id": "PB-02-CC-1024",
  "route_id": "R1",
  "lat": 31.6318,
  "lng": 74.8755,
  "last_updated": "2026-08-26T10:15:00Z",
  "passenger_count": 32,
  "matched_stop_index": 1,
  "speed_kmph": 22
}
```

**Ticket event — append-only log (MongoDB)**
```json
{
  "ticket_id": "t_9231",
  "bus_id": "PB-02-CC-1024",
  "route_id": "A",
  "boarding_stop_id": "s1",
  "destination_stop_id": "s3",
  "issued_at": "2026-08-26T10:05:00Z",
  "status": "active"
}
```

---

## 5. Core Logic

### 5.1 Location & map-matching
Raw GPS is noisy — a bus can appear off-road. Snap each point to the nearest position on the route's polyline. This gives:
- A cleaner marker position on the map.
- **Progress along the route** (0–100%), which both ETA and passenger-count logic depend on.
- `matched_stop_index` — the last stop the bus has passed, updated whenever progress crosses a stop's position.

### 5.2 Passenger counting
This is the core novel piece of the project — turn ticketing behavior into a live headcount without new hardware.

1. **Ticket issued** → `passenger_count += 1` (or `+= group_size` if the ticket format supports group tickets). Record the ticket's `destination_stop_id`, status `active`.
2. **Bus reaches a stop** (detected via the location engine's `matched_stop_index` advancing) → query all `active` tickets on this bus with `destination_stop_id` equal to the stop just reached → mark them `alighted` → `passenger_count -= (count of those tickets)`.
3. Passenger count is always: *(tickets issued so far on this trip) − (tickets whose destination has been passed)*.

**Known limitations to state explicitly in your pitch** (judges will ask):
- **Pass holders / no-ticket riders** aren't captured — common on TN buses. Treat the count as an estimate, and mention this as a known gap with a possible future fix (e.g. reconciling against manual counts, or partnering with the pass-validation system).
- **Wrong-stop alighting** — a passenger might get off earlier or later than their ticketed stop. The count will still self-correct over time as new tickets are issued, but instantaneous accuracy has a margin of error.
- **Group tickets** — check whether the actual TN e-ticketing format encodes party size per ticket; if not, treat every ticket as 1 passenger and note it as an estimate.

### 5.3 ETA calculation
For each upcoming stop: `distance remaining along polyline / rolling average speed for this bus (or this route + time-of-day)`. Start with a simple average; a stretch goal is weighting by historical speed at that time of day.

---

## 6. Simulating the Data (for now)

Since the real ticketing machine feed isn't available during the hackathon, build a **real-time simulator**, not static mock data — it should behave like the real feed, publishing continuously on a timer rather than returning a fixed JSON blob. This matters because:
- It exercises your ingestion pipeline exactly as the real feed would.
- It makes for a far more convincing live demo — buses visibly moving, counts visibly changing.
- Swapping it for the real `busAPI()` later is a one-line change (same topics, same payload shape) — not a rewrite.

**Simulator behavior:**
- N buses assigned to a small number of predefined routes, each moving along the route's stop sequence (bounce back and forth, or loop).
- On a fixed tick (e.g. every 1s), publish a location update per bus with slight GPS jitter for realism.
- On stop-crossing, randomly generate ticket "issued" and "alighted" events within a plausible range, so the passenger-count pipeline has real events to process — don't fake the passenger_count number directly, generate the underlying ticket events and let your real counting logic (Section 5.2) compute it. This proves the logic actually works, which matters for judging.

A working version of this (Leaflet-based, client-side) already exists as `bus-tracker-simulator.html` from earlier in this build — it can be evolved into the real simulator service, or kept as a frontend-only fallback if the backend demo breaks live.

---

## 7. Maps

**Decision: use Leaflet + OpenStreetMap for the hackathon**, not Google Maps.

| | Leaflet + OSM | Google Maps JS API |
|---|---|---|
| Setup | No API key, works immediately | Needs Cloud project + billing-enabled key |
| Cost | Free | Free tier (~$200/mo credit), then billed |
| India road data | Good, community-mapped | Good, sometimes better for POIs |
| Risk at demo time | None (no key/quota issues) | Key leaks or quota limits can break a live demo |
| When to switch | — | If you need Directions API to snap bus paths to real roads, or Places autocomplete |

If you do switch later: get a key from Google Cloud Console, restrict it to your domain, keep it in an environment variable (never commit it to a public repo), and swap `L.tileLayer` / `L.circleMarker` for `google.maps.Map` / `google.maps.Marker`.

---

## 8. Tech Stack

- **Ingestion**: MQTT (Mosquitto/EMQX) — lightweight, pub/sub, tolerant of the intermittent connectivity real buses will have.
- **Backend**: Node.js (Express/Fastify) or FastAPI — pick based on team familiarity.
- **Live state**: Redis — current location + passenger count per bus, low-latency reads for the map.
- **Persistent store**: MongoDB — routes, stops, ticket event log, historical trips. Chosen over Postgres/PostGIS for hackathon velocity (flexible schema, faster to iterate); the tradeoff is weaker geospatial querying and no multi-document transaction guarantees, both acceptable at this scale. Revisit if you productionize.
- **Frontend**: React + Leaflet.
- **Simulator**: Node/Python script or the browser-based demo, publishing to the same MQTT topics/WebSocket the real feed would use.

---

## 9. API Design

- `GET /routes` — all routes with stops.
- `GET /buses/live?route_id=` — current location + occupancy for all buses, optionally filtered.
- `WS /buses/stream` — push live updates.
- `GET /routes/:id/eta` — ETA to each stop for buses currently on the route.

---

## 10. MVP Scope

Build in this order — each is demoable on its own:

1. Simulator generating realistic movement + ticket events for 5–10 buses on 2–3 routes.
2. Ingestion → Redis/MongoDB pipeline, end to end.
3. Live map showing bus positions updating in real time.
4. Passenger-count pipeline running off real ticket events (not faked directly).
5. Occupancy indicator per bus (color-coded).
6. Basic ETA to next stop.

**Stretch goals** (only after MVP is solid): historical ridership analytics, ML-based ETA using historical speed patterns, offline-buffering simulation for buses with intermittent connectivity, admin panel for the transit authority.

---

## 11. Build Plan

| Phase | What | Notes |
|---|---|---|
| 1 | Lock data contracts | Agree on the exact JSON shapes in Section 4 before anyone codes, so frontend/backend can build in parallel |
| 2 | Build the simulator | Becomes your stand-in "government API" for the whole project |
| 3 | Ingestion + live store | Smallest backend that can answer "where are the buses right now" |
| 4 | Passenger-count logic | Test against the simulator's ticket stream before touching the frontend |
| 5 | Public API | Thin — just reads from Redis/MongoDB, no business logic |
| 6 | Wire frontend to real backend | Same map UI, now driven by your API instead of local simulation |
| 7 | ETA + polish | Occupancy legend, route filtering, offline-bus handling |
| 8 | Demo prep | README, role assignment, rehearsed fallback if live demo breaks (e.g. a recorded run) |

**Parallelization tip:** steps 2 and 6 can overlap heavily — have the frontend person build against the simulator's WebSocket directly from day one, then repoint to the real backend once it exists.

**If you're short on time:** protect steps 1–3 and 6 (a demo floor of buses moving on a map from a real backend). Passenger counting and ETA (steps 4 and 7) are what differentiate this from "a map with dots" — worth protecting time for over pure polish. Explicitly block time for step 8; it's the phase that gets skipped under pressure.

---

## 12. Team Roles

Three natural lanes once Phase 1 is locked:
- **Simulator + ingestion/backend** — owns Sections 6, 8, 9.
- **Passenger-count + ETA logic** — owns Section 5.
- **Frontend/map** — owns Section 7, the live UI.

---

## 13. Things to Say Out Loud to Judges

Be upfront about these rather than letting a judge "catch" them — it reads as engineering maturity, not weakness:
- Passenger counts are **estimates** derived from ticketing behavior, not a hardware sensor — explain the tradeoff (zero new hardware cost vs. imperfect accuracy).
- Bus paths in the demo are simulated, not the real government feed — but the pipeline they run through (ingestion → counting → API → map) is exactly what would run in production.
- Note the specific real-world integration point: replacing the simulator with actual `busAPI()` calls to the Tamil Nadu ticketing infrastructure is the only change needed to go live.
