# VAL-Metrics: Next-Generation Tactical Performance Companion

## Detailed Description & Purpose

VAL-Metrics is an advanced tactical performance analytics suite and ultra-low-latency companion overlay designed for VALORANT players seeking tournament-grade self-improvement without sacrificing PC performance or gameplay stability. Traditional gaming companion apps rely on resource-heavy web wrappers that degrade frames-per-second (FPS) and introduce latency in high-stakes competitive shooters. VAL-Metrics addresses these challenges through an architecture built from the ground up using Go, Rust, Tauri, and SolidJS.

A fully functional web dashboard and an accompanying transparent overlay client have been developed and deployed to live cloud infrastructure.

**Live Project Links**
- **Main Analytical Dashboard:** https://valmetrics.netlify.app
- **Live In-Game HUD Overlay Simulation:** https://valmetrics.netlify.app/?mode=overlay

---

## Riot APIs Used

To deliver player analytics and match histories, the app interacts exclusively with Riot's official APIs:

- **account-v1:** Resolves Riot IDs and Taglines into PUUIDs.
- **val-match-v1:** Retrieves match histories and post-match telemetry, including combat statistics, weapon usage, and round data.
- **val-content-v1:** Synchronizes game assets such as Agents, Maps, Weapons, and Game Modes to ensure the interface always reflects the latest patch.
- **val-status-v1:** Monitors Riot service status to display server maintenance and outage notifications.

---

## Current Development Status

### Completed

- **Cloud Infrastructure:** I deployed the Go backend to AWS EC2 with automated CI/CD using GitHub Actions.
- **Universal Database:** Implemented a caching layer that minimizes redundant API requests, manages rate limits, and stores lightweight telemetry for faster data retrieval.
- **Dashboard & Overlay:** Built the analytical dashboard and transparent overlay using SolidJS, Tailwind CSS, Tauri, and Rust.
- **Analytics Engine:** Implemented match history aggregation, encounter tracking, combat statistics, and the VAL-Index performance metric across multiple game modes.

### In Progress (Pending Production API Access)

- **Historical Analytics:** The application infrastructure is complete, but advanced sections such as Performance Overview, Top Agents, Top Maps, and Weapon Statistics currently display placeholder content. A Riot Production API key is required to retrieve large-scale historical datasets through `val-match-v1` without development rate-limit restrictions.
- **Live Client Integration:** Finalizing Local Client (LCU) integration to automatically detect active matches and synchronize overlay data in real time.

---

## Key Features

### VAL-Index Performance Algorithm

A proprietary combat efficiency metric that evaluates player performance using multi-kill frequency, trade efficiency, first-blood conversion, objective participation, and Damage Delta per Round (DDΔ/R).

> **Note:** VAL-Index is designed exclusively for historical self-analysis. It is **not** an ELO calculator, rank predictor, or replacement for Riot's official MMR system.

### Nemesis & Historical Encounter Log

Tracks previous encounters against players to provide historical head-to-head statistics and rivalry insights.

> **Player Protection:** The feature never labels players as "throwers," "bad teammates," or similar negative classifications. It is designed as a historical match journal that complies with Riot's anti-harassment and player protection policies.

---

## Riot Developer Compliance & Competitive Integrity

VAL-Metrics is designed to comply with Riot Games' Terms of Service, Vanguard guidelines, and Fair Play policies.

### Competitive Integrity

The overlay functions strictly as a personal statistics dashboard and historical match journal. It provides no gameplay assistance, hidden information, memory reading, packet interception, or competitive advantage.

### Riot Sign-On (RSO)

I have implemented Riot Sign-On (RSO) as the authentication mechanism. Players must explicitly authorize the application before any gameplay statistics are displayed, ensuring compliance with Riot's Player Data policies.

### GDPR & Data Privacy

The backend includes an automated GDPR Data Subject Request (DSR) workflow. When Riot issues a "Right to be Forgotten" request, all associated player records are permanently removed and anonymized across the database.