import { Component, For, Show, createMemo, createSignal } from 'solid-js';
import { store } from '../store';
import { Card, Head, Empty } from '../ui';
import { CountUp } from '../motion';
import { LineChart, Columns, Radar, Ring, Meter } from '../charts';
import { fmt, impactOf, summarize } from '../data/stats';
import type { Match } from '../data/types';

type Metric = 'acs' | 'kd' | 'hs' | 'adr' | 'kast' | 'impact';
const METRICS: { id: Metric; label: string; digits: number; suffix?: string; get: (m: Match) => number }[] = [
  { id: 'acs', label: 'ACS', digits: 0, get: m => m.acs },
  { id: 'kd', label: 'K/D', digits: 2, get: m => m.k / Math.max(1, m.d) },
  { id: 'hs', label: 'HS%', digits: 1, suffix: '%', get: m => m.hs },
  { id: 'adr', label: 'ADR', digits: 0, get: m => m.adr },
  { id: 'kast', label: 'KAST', digits: 0, suffix: '%', get: m => m.kast },
  { id: 'impact', label: 'Impact', digits: 1, get: m => impactOf(m) ?? NaN },
];

export const Performance: Component = () => {
  const [metric, setMetric] = createSignal<Metric>('acs');
  const ms = () => store.matches();
  const chrono = createMemo(() => ms().slice(0, 30).reverse());
  const def = () => METRICS.find(x => x.id === metric())!;
  const points = createMemo(() => chrono().map(m => ({ y: def().get(m), label: `${m.map} · ${m.agent}`, sub: `${m.won ? 'Win' : 'Loss'} ${m.teamScore}–${m.enemyScore} · ${new Date(m.startedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`, tone: (m.won ? 'win' : 'loss') as 'win' | 'loss' })).filter(p => Number.isFinite(p.y)));
  const avg = () => { const v = points().map(p => p.y); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : NaN; };
  const recent = createMemo(() => summarize(ms().slice(0, 10)));
  const prior = createMemo(() => summarize(ms().slice(10, 20)));
  const s = () => store.stats().summary;
  const clamp = (v: number) => Math.max(0, Math.min(100, v));
  const radar = createMemo(() => [
    { label: 'Aim', value: clamp((s().hs / 40) * 100), display: `${fmt(s().hs, 1)}% HS` },
    { label: 'Fragging', value: clamp((s().kpr / 1.2) * 100), display: `${fmt(s().kpr, 2)} KPR` },
    { label: 'Damage', value: clamp((s().adr / 200) * 100), display: `${fmt(s().adr, 0)} ADR` },
    { label: 'Entry', value: clamp(s().fkRate), display: `${fmt(s().fkRate, 0)}% duels` },
    { label: 'Survival', value: clamp(((1 - s().dpr) / 0.5) * 100), display: `${fmt(s().dpr, 2)} DPR` },
    { label: 'Support', value: clamp((s().apr / 0.5) * 100), display: `${fmt(s().apr, 2)} APR` },
    { label: 'Clutch', value: clamp(s().clutchAttempts ? (s().clutches / s().clutchAttempts) * 100 / 0.5 : 0), display: `${s().clutches}/${s().clutchAttempts}` },
  ]);
  const compare = () => [
    ['Win rate', recent().winRate, prior().winRate, 1, '%'], ['K/D', recent().kd, prior().kd, 2, ''], ['ACS', recent().acs, prior().acs, 0, ''],
    ['ADR', recent().adr, prior().adr, 0, ''], ['HS%', recent().hs, prior().hs, 1, '%'], ['KAST', recent().kast, prior().kast, 1, '%'],
    ['Impact', recent().impact ?? NaN, prior().impact ?? NaN, 1, ''],
  ] as const;

  return <Show when={ms().length >= 2 && !ms()[0].partial} fallback={<Card><Empty title="Not enough match telemetry" text="Performance trends need at least two matches with full per-match statistics." /></Card>}>
    <div class="grid perf">
      <Card class="trend" i={0}>
        <Head title="Performance trend" kicker={`Last ${chrono().length} matches · oldest → newest`}>
          <div class="segmented small" role="radiogroup" aria-label="Metric">
            <For each={METRICS}>{x => <button role="radio" aria-checked={metric() === x.id} classList={{ on: metric() === x.id }} onClick={() => setMetric(x.id)}>{x.label}</button>}</For>
          </div>
        </Head>
        <div class="trend-head">
          <div><span class="kicker">Average</span><b class="big"><CountUp value={avg()} digits={def().digits} suffix={def().suffix} /></b></div>
          <div><span class="kicker">Best</span><b class="big up"><CountUp value={Math.max(...points().map(p => p.y))} digits={def().digits} suffix={def().suffix} /></b></div>
          <div><span class="kicker">Worst</span><b class="big down"><CountUp value={Math.min(...points().map(p => p.y))} digits={def().digits} suffix={def().suffix} /></b></div>
        </div>
        <LineChart label={`${def().label} per match`} points={points()} baseline={avg()} format={v => fmt(v, def().digits)} height={260} onPick={i => store.setOpenMatch(chrono()[i])} />
        <p class="muted small">Dashed line = average. Dots: <span class="up">win</span> / <span class="down">loss</span>. Click a point to open the match.</p>
      </Card>

      <Card class="form" i={1}>
        <Head title="Form check" kicker="Last 10 vs previous 10" />
        <div class="compare">
          <For each={compare()}>{([l, a, b, d, suf], i) => {
            const delta = a - b;
            return <div class="cmp-row" style={{ '--i': i() }}>
              <span>{l}</span>
              <b><CountUp value={a} digits={d} suffix={suf} /></b>
              <small>prev {fmt(b, d)}{suf}</small>
              <span class="delta" classList={{ up: delta > 0, down: delta < 0 }}>{Number.isFinite(delta) ? `${delta > 0 ? '▲' : delta < 0 ? '▼' : '■'} ${fmt(Math.abs(delta), d)}` : '—'}</span>
            </div>;
          }}</For>
        </div>
        <p class="muted small">Small samples swing. Use this as a prompt to review, not a verdict.</p>
      </Card>

      <Card class="radar-card" i={2}>
        <Head title="Playstyle profile" kicker="Normalized to fixed anchors" />
        <Radar axes={radar()} />
        <p class="muted small">Each axis is scaled against a fixed reference (e.g. 40% HS = full). It isn't a percentile or a comparison with other players.</p>
      </Card>

      <Card class="acs-cols" i={3}>
        <Head title="Combat score by match" kicker="Last 20" />
        <Columns label="ACS per match" items={ms().slice(0, 20).reverse().map(m => ({ value: m.acs, label: `${m.map} · ${m.agent}`, sub: `${m.won ? 'Win' : 'Loss'} ${m.teamScore}–${m.enemyScore}`, tone: m.won ? 'win' : 'loss' }))}
          avg={summarize(ms().slice(0, 20)).acs} height={210} onPick={i => store.setOpenMatch(ms().slice(0, 20).reverse()[i])} />
      </Card>

      <Card class="sides-card" i={4}>
        <Head title="Side & situation" kicker="Round outcomes" />
        <div class="side-rings">
          <div><Ring value={s().atkWinRate} size={110} color="var(--accent)"><b><CountUp value={s().atkWinRate} digits={1} suffix="%" /></b></Ring><span>Attack rounds won</span></div>
          <div><Ring value={s().defWinRate} size={110} color="var(--info)" delay={150}><b><CountUp value={s().defWinRate} digits={1} suffix="%" /></b></Ring><span>Defense rounds won</span></div>
          <div><Ring value={s().clutchAttempts ? (s().clutches / s().clutchAttempts) * 100 : 0} size={110} color="#FFC857" delay={300}><b><CountUp value={s().clutchAttempts ? (s().clutches / s().clutchAttempts) * 100 : 0} digits={0} suffix="%" /></b></Ring><span>Clutches won · {s().clutches}/{s().clutchAttempts}</span></div>
        </div>
        <div class="duel-split">
          <div class="ds-head"><span>Opening duels</span><b>{s().fk} won · {s().fd} lost</b></div>
          <div class="duel-bar big"><i class="k" style={{ '--w': `${(s().fk / Math.max(1, s().fk + s().fd)) * 100}%` }} /><i class="d" style={{ '--w': `${(s().fd / Math.max(1, s().fk + s().fd)) * 100}%` }} /></div>
        </div>
      </Card>

      <Card class="method" i={5}>
        <Head title="How Impact Rating works" kicker="Transparent · provisional · model 0.1" />
        <div class="method-body">
          <For each={[
            ['Damage', 40, 'Damage per round ÷ 200, capped at 100.'],
            ['Participation', 35, 'KAST — rounds with a kill, assist, survival or trade.'],
            ['Openings', 25, 'Opening duels won ÷ opening duels taken.'],
          ] as const}>{([l, w, d], i) => <div class="method-row"><div><strong>{l}</strong><small>{d}</small></div><Meter value={w} max={40} i={i()} /><b>{w}%</b></div>}</For>
          <p>The profile score is the round-weighted average of every match. Matches missing any input show as unavailable instead of silently re-weighting. It isn't a rank, MMR estimate or percentile, and it doesn't capture every form of utility value.</p>
        </div>
      </Card>
    </div>
  </Show>;
};
