# VAL-Metrics: Next-Generation Tactical Performance Companion

## Detailed Description & Purpose
VAL-Metrics is an advanced tactical performance analytics suite and ultra-low-latency companion overlay designed for VALORANT players seeking tournament-grade self-improvement without sacrificing PC performance or gameplay stability. Traditional gaming companion apps rely on resource-heavy web wrappers that degrade frames-per-second (FPS) and induce latency in high-stakes competitive shooters. VAL-Metrics solves this entirely through an architecture built from the ground up using modern, highly efficient technologies (Golang, Rust, Tauri, and SolidJS).

Currently, a fully functional web dashboard and an accompanying transparent overlay client have been developed and deployed to our live cloud infrastructure.

**Live Project Links for Review:**
* **Main Analytical Dashboard:** [https://valmetrics.netlify.app](https://valmetrics.netlify.app)
* **Live In-Game HUD Overlay Simulation:** [https://valmetrics.netlify.app/?mode=overlay](https://valmetrics.netlify.app/?mode=overlay)

## How We Will Use the Riot APIs
To deliver our analytics and match histories, VAL-Metrics strictly interacts with the following official endpoints:
* **account-v1:** Used to securely resolve player Riot IDs and Taglines into PUUIDs for our Universal Database.
* **val-match-v1:** Used extensively to fetch player match histories and retrieve detailed post-match telemetry (kills, deaths, rounds won, weapon usage, and combat scores). This data feeds our proprietary performance algorithm and encounter log.
* **val-content-v1:** Used to synchronize live game assets (Agents, Maps, Game Modes, and Weapons) so our frontend UI correctly displays localized names and icons for the current patch.

## Current Development Status
### What We Have Completed
* **Live Cloud Infrastructure:** Successfully deployed the Golang microservice backend to an AWS EC2 instance, utilizing a fully automated CI/CD pipeline via GitHub Actions.
* **Universal Database Index:** Built a highly robust caching layer (the "Universal DB") that actively manages rate limits, reduces redundant external API calls, and archives sub-kilobyte telemetry footprints for lightning-fast frontend resolution.
* **Interactive UI & Overlay Client:** Developed and styled a premium, glassmorphic UI using TailwindCSS and SolidJS. The system successfully serves both a standard browser analytical dashboard and a specialized tactical HUD overlay.
* **Match Encounter Log & Aggregation Analytics:** Designed the UI and logic structure to showcase match histories, K/D ratios, combat scores, and specialized metrics (like our VMS rating) across different queue types and acts.

### What Is Left to Complete (Pending Production API Access)
* **Full Production Data Sync:** While the infrastructure is fully complete, advanced sections like the *Performance Gunplay Overview*, *Top Agents*, *Top Maps*, and *Weapon Armory* currently display disclaimers. We are awaiting a production API key to securely ingest the heavy historical datasets (`val-match-v1`) required to accurately populate these deeper analytics for our global userbase without hitting development rate limits.
* **Live Client API (LCU) Integration:** Finalizing the local loopback integration to allow the overlay to automatically detect active match states and sync telemetry in real-time.

## Key Analytical Features & Proprietary Capabilities
* **VAL-Index Performance Algorithm (Combat Efficiency Metric, NOT an MMR Alternative):** A proprietary combat rating efficiency model that weights multi-kill frequency, trading efficiency, first-blood conversion rates, objective execution, and Damage Delta per Round (DDΔ/R).
  * **Policy Disclaimer:** VAL-Index is strictly a real-time combat efficiency metric for historical self-evaluation (similar to ACS or Tracker Score). It is explicitly **not** an ELO calculator, skill rank estimator, or alternative to Riot's official Ranked Leagues and MMR system.
* **Nemesis & Historical Encounter Log (Anti-Shaming & Sportsmanship Compliant):** A persistent historical matchup tracker that automatically checks lobby participant rosters against previous ranked encounters, highlighting competitive head-to-head duel statistics and rival history.
  * **Policy Disclaimer:** In strict accordance with Riot's anti-shaming and player protection policies, the Nemesis feature operates solely as a sportsmanlike duel journal. It never generates derogatory labels, warning flags, or negative assumptions (such as "thrower," "loss streak," or "bad teammate") in order to promote a positive player experience.

## Riot Developer Compliance & Competitive Integrity Assurance
VAL-Metrics has been designed to rigorously comply with Riot Games' Terms of Service, Vanguard guidelines, and Fair Play standards.
* **Absolute Competitive Integrity:** The tactical overlay functions strictly as a personalized statistical journal and historical match reference. It provides no unfair gameplay assistance, exposes no hidden timers, discloses no enemy economy or utility information, and remains fully compliant with Riot's competitive integrity guidelines.
* **Strict RSO Opt-in & Data Privacy:** In strict accordance with Riot's Player Data policies, VAL-Metrics requires all users to authenticate via Riot Sign On (RSO). The application includes explicit disclaimers that account linking makes gameplay data public within the ecosystem. We do NOT display historical match telemetry for any player who has not explicitly opted into our service through RSO.
* **GDPR & Data Subject Request (DSR) Database Compliance:** As VAL-Metrics scales through a Go backend, we have incorporated an automated GDPR Data Subject Request (DSR) purge handler into the architecture. When Riot broadcasts player deletion requests ("Right to be Forgotten") through developer channels, the service performs immediate cascade deletions to permanently erase and anonymize all historical records associated with the requested Account ID or PUUID across every database table.
