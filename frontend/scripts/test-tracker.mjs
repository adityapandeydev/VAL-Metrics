import { strict as assert } from 'node:assert';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

// Exercise production model code with no browser or new test dependencies.
const temp = await mkdtemp(join(tmpdir(), 'val-metrics-model-'));
try {
  for (const file of ['model', 'demo']) {
    const source = await readFile(new URL(`../src/features/tracker/${file}.ts`, import.meta.url), 'utf8');
    const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText.replace("'./model'", "'./model.mjs'");
    await writeFile(join(temp, `${file}.mjs`), compiled);
  }
  const { impactScore, impactParts } = await import(pathToFileURL(join(temp, 'model.mjs')));
  const { demoMatches, demoPlayer } = await import(pathToFileURL(join(temp, 'demo.mjs')));
  assert.equal(impactParts(demoMatches[0]).total.toFixed(1), '82.3');
  assert.equal(impactScore(demoMatches).toFixed(1), '72.4');
  assert.equal(impactScore(demoMatches.slice(0,6)).toFixed(1), '74.9');
  assert.equal(impactScore([]), null);
  assert.equal(impactScore([{ ...demoMatches[0], adr: undefined }]), null);
  assert.equal(impactParts({ ...demoMatches[0], openingAttempts: 0 }), null);
  assert.equal(impactParts({ ...demoMatches[0], adr: NaN }), null);
  assert.equal(impactScore([{ ...demoMatches[0], rounds: -1 }]), null);
  assert.equal(impactParts({ ...demoMatches[0], adr: 900, kast: 120, openingWins: 9, openingAttempts: 1 }).total, 100);
  const six = demoPlayer(6);
  assert.equal(six.summary.wins, 4);
  assert.equal(six.summary.total, 6);
  assert.equal(six.agents.reduce((sum,a) => sum+a.matches,0),6);
  assert.equal(six.maps.reduce((sum,m) => sum+m.matches,0),6);
  const details = six.details;
  assert.equal(details.weaponArmory.reduce((n,w)=>n+w.totalKills,0), details.kills);
  assert.equal(details.headshots+details.bodyshots+details.legshots,details.totalHits);
  assert.equal(details.agentLeaderboard.reduce((n,a)=>n+a.matchesPlayed,0),6);
  assert.equal(Object.values(details.roleMastery).reduce((n,r)=>n+r.matches,0),6);
  assert.ok(Math.abs(details.headshotPercent+details.bodyshotPercent+details.legshotPercent-100)<.001);
  console.log('Tracker model: scoring, missing inputs, bounds, and sample aggregates passed.');
} finally { await rm(temp, { recursive:true, force:true }); }
