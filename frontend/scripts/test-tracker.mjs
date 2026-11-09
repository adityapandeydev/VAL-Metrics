import { strict as assert } from 'node:assert';
import { mkdtemp, readFile, writeFile, mkdir, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

// Run the active tracker data modules without browser or test-runner dependencies.
const temp = await mkdtemp(join(tmpdir(), 'val-metrics-model-'));
async function compile(relative) {
  const sourceDir = new URL(`../src/${relative}/`, import.meta.url);
  for (const item of await readdir(sourceDir, { withFileTypes: true })) {
    const name = `${relative}/${item.name}`;
    if (item.isDirectory()) { await compile(name); continue; }
    if (!item.name.endsWith('.ts')) continue;
    const source = await readFile(new URL(`../src/${name}`, import.meta.url), 'utf8');
    const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText
      .replace(/from (['"])(\.[^'"]+)\1/g, (_, quote, specifier) => `from ${quote}${specifier.endsWith('/agents') || specifier.endsWith('/maps') || specifier.endsWith('/weapons') ? specifier + '/index' : specifier}.mjs${quote}`);
    const target = join(temp, name.replace(/\.ts$/, '.mjs'));
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, compiled);
  }
}
try {
  await compile('data');
  await compile('features/tracker/data');
  const { sampleProfile, matchDetail } = await import(pathToFileURL(join(temp, 'features/tracker/data/demo.mjs')));
  const { buildStats, impactParts, summarize } = await import(pathToFileURL(join(temp, 'features/tracker/data/stats.mjs')));
  const profile = sampleProfile();
  assert.equal(profile.source, 'sample');
  assert.equal(profile.matches.length, 56);
  assert.equal(new Set(profile.matches.map(m => m.id)).size, profile.matches.length);
  assert.ok(profile.matches.every((m, i, all) => i === 0 || m.startedAt <= all[i - 1].startedAt));
  for (const queue of ['Competitive', 'Unrated', 'Premier', 'All']) {
    const matches = profile.matches.filter(m => queue === 'All' || m.queue === queue);
    const stats = buildStats(matches);
    assert.equal(stats.summary.matches, matches.length);
    assert.equal(stats.summary.wins + stats.summary.losses + stats.summary.draws, matches.length);
    assert.equal(stats.agents.reduce((n, a) => n + a.matches, 0), matches.length);
    assert.equal(stats.maps.reduce((n, m) => n + m.matches, 0), matches.length);
    assert.equal(stats.roles.reduce((n, r) => n + r.matches, 0), matches.length);
    assert.ok(Number.isFinite(stats.summary.acs));
  }
  assert.equal(summarize([]).impact, null);
  assert.equal(impactParts({ adr: NaN, kast: 70, fk: 1, fd: 1 }), null);
  assert.equal(impactParts({ adr: 150, kast: 70, fk: 0, fd: 0 }), null);
  assert.equal(impactParts({ adr: 200, kast: 100, fk: 1, fd: 0 }).total, 100);
  for (const match of profile.matches) {
    const detail = matchDetail(match, profile);
    assert.equal(detail.scoreboard.length, 10);
    assert.equal(detail.scoreboard.filter(p => p.self).length, 1);
    assert.equal(detail.rounds.length, match.rounds);
    assert.equal(detail.rounds.filter(r => r.won).length, match.teamScore);
    assert.equal(detail.rounds.reduce((n, r) => n + r.kills, 0), match.k);
    assert.equal(detail.duels.reduce((n, d) => n + d.kills, 0), match.k);
    assert.equal(detail.duels.reduce((n, d) => n + d.deaths, 0), match.d);
  }
  console.log('Tracker: sample queues, aggregate totals, Impact inputs and match-detail consistency passed.');
} finally {
  await rm(temp, { recursive: true, force: true });
}
