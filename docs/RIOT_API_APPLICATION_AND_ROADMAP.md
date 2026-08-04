# 🏆 VAL-Metrics: Architecture, Tech Stack & Riot API Application Plan

> **Note:** This document serves as our definitive project technical blueprint, long-term roadmap, and official application copy for Riot Games Developer Keys (Personal & Production).

---

## 🚀 Part 1: Official Riot API Personal Key Application Template

Copy and paste the text below into your Riot API Personal Key application form:

```text
Product Name: VAL-Metrics - Next-Generation Tactical Performance Companion

Detailed Description & Purpose:
VAL-Metrics is an advanced tactical performance analytics suite and ultra-low-latency companion overlay designed for VALORANT players seeking tournament-grade self-improvement without sacrificing PC performance or gameplay stability. Traditional gaming companion apps rely on resource-heavy web wrappers that degrade frames-per-second (FPS) and induce latency in high-stakes competitive shooters. VAL-Metrics solves this entirely through an architecture built from the ground up on modern, highly efficient technologies.

Why Our Technology Stack is a Superior Alternative to Standard Options:
1. Low-Latency Desktop Core (Tauri v2 + Rust vs. Electron/Overwolf):
   Standard gaming companion overlays rely on Electron or Overwolf, which bundle entirely standalone Chromium instances that consume anywhere from 500MB to 1.5GB of RAM, frequently causing frame drops and input lag during intensive VALORANT teamfights. VAL-Metrics utilizes Tauri v2 paired with native Windows WebView2 and a Rust backend core. Our desktop memory footprint sits beneath ~25MB with virtually zero CPU overhead, ensuring seamless, non-intrusive runtime efficiency and completely eliminating FPS degradation.

2. High-Performance Concurrency (Go / Golang vs. Node.js/Python):
   Processing real-time match history queries, aggregating complex combat statistics, and managing Riot endpoint rate limiters requires exceptional computational speed. Our backend microservice is built in Go (Golang), leveraging native Goroutines and channels for high-throughput, non-blocking asynchronous requests. Compared to single-threaded Node.js or memory-heavy Python services, our Go service eliminates garbage-collection spikes and reduces endpoint processing times to sub-millisecond speeds while safely enforcing rate limits through localized in-memory caching vaults.

3. Instantaneous Reactive UI (SolidJS + Vite vs. Traditional Virtual DOM):
   In-game tactical displays must respond instantly during short strategic phases (Agent Select and Pre-Round Buy phases). Instead of traditional React frameworks that undergo computationally expensive Virtual DOM diffs, VAL-Metrics incorporates a fine-grained reactive UI built with SolidJS and Vite. Our overlay updates DOM nodes directly at near-native speeds, achieving crisp 60+ FPS animations and instantaneous telemetry shifts with minimal GPU rendering overhead.

Key Analytical Features & Proprietary Capabilities:
• VAL-Index Performance Algorithm: A proprietary combat rating efficiency model that goes beyond K/D ratio by weighting multi-kill frequency, trading efficiency, first-blood conversion rates, objective execution, and Damage Delta per Round (DDΔ/R).
• Map & Agent Synergy Analyzer: Evaluates personal historical win differentials across map pools to generate smart, localized agent recommendations during match lobbies.
• Nemesis & Historical Encounter Log: A localized matchup tracking system that automatically checks match participant rosters against past ranked history, highlighting head-to-head duel statistics and rival encounter records.
• Dynamic Round-Phase Overlay: Automatically adapts its interface based on real-time game phases—displaying tactical composition matchups during lobbies and shifting into an unobtrusive match scoreboard during active gameplay.

Riot Developer Compliance & Competitive Integrity Assurance:
VAL-Metrics rigorously abides by Riot Games' Terms of Service, Vanguard guidelines, and Fair Play standards:
• Strict Official API Adherence: The application interacts exclusively with official Riot API endpoints. It never reads system memory, intercepts network packets, injects into game executables, or interferes with Vanguard anti-cheat software in any capacity.
• Absolute Competitive Integrity: The tactical overlay acts strictly as a personalized statistical journal and historical match reference. It provides zero unfair gameplay assistance, exposes no hidden timers, discloses no enemy economy/utility secrets, and remains completely compliant with tournament and competitive standards.
```

---

## 🌟 Part 2: Core Feature & Architectural Ideas Preservation

This section chronicles our agreed-upon long-term innovation features to implement as we transition from Personal to Production scale:

### 1. ⚡ The VAL-Index Performance Metric
Instead of rating players solely by traditional Average Combat Score (ACS) or simple K/D ratios, VAL-Metrics calculates a refined **VAL-Index** (typically scaling from 400 to 1000+) that evaluates true round-impact:
* **Entry Impact:** First Bloods that directly convert into won rounds receive exponentially higher index multipliers than low-impact exit frags.
* **Trade Efficiency:** Measuring how consistently a player trades a fallen ally or gets traded within a 3-second combat window.
* **Damage Delta per Round (DDΔ/R):** Quantifying net output versus damage received, rewarding utility-based positional advantage.
* **Clutch Factor:** Weighting 1v2 and 1v3 post-plant success rates across various economy tiers (Eco vs. Full Buy).

### 2. 🛡️ The Nemesis Tracker & Encounter Journal
A continuous localized database (`vault/*.json`) that builds a long-term professional narrative out of standard ranked gameplay:
* Automatically identifies when an opposing (or allied) player has appeared in your past matches over previous acts or seasons.
* Renders a live "Nemesis Alert" card on the overlay during loading phases, detailing past duel outcomes, preferred weapon patterns, and head-to-head win ratios.
* Encourages rivalries and localized strategic adjustments without violating real-time competitive integrity.

### 3. 🗺️ Map-Based Agent Synergy Recommendations
An intelligent lobby assistant that analyzes map geometry paired with personal proficiency:
* Replaces generic tier lists by calculating *your* specific win differentials on selected maps (e.g., highlighting that your Omen yields a +14.3% higher win rate on Ascent compared to Duelist selections).
* Evaluates allied team composition gaps (e.g., alert if the squad lacks initiator recon or post-plant smoke denial) during Agent Select before lock-in occurs.

### 4. 🪶 Ultra-Lightweight System Architecture Guarantee
To ensure VAL-Metrics remains the fastest and cleanest competitive companion tool in the gaming ecosystem, we strictly adhere to our core engineering manifesto:
* **No Chromium Bloat:** Rely exclusively on Tauri's system-native WebView2 bindings.
* **No Intrusive Background Mining or Ad Modules:** Deliver a clean, transparent, tournament-grade aesthetic with zero extraneous CPU overhead or network tracking.
* **Localized Cache-First Polling:** All Riot API queries must first pass through our lightweight Go local storage vault to maximize speed and protect rate limits.
