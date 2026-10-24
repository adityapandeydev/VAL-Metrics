import { Encounter, PlayerView, summarize } from './model';

const rows = [
  ['Haven','Omen',13,9,21,14,9,166,264,31,83,4,5,'38 min'],
  ['Ascent','Sova',13,7,18,11,12,151,238,29,85,3,4,'32 min'],
  ['Lotus','Omen',10,13,16,18,7,142,209,24,70,2,4,'37 min'],
  ['Bind','Cypher',13,11,19,16,6,158,241,28,79,3,5,'40 min'],
  ['Haven','Omen',8,13,14,17,10,137,198,22,71,1,3,'34 min'],
  ['Ascent','Sova',13,8,20,13,8,170,272,30,86,4,4,'35 min'],
  ['Lotus','Omen',11,13,17,18,7,143,215,25,71,2,4,'39 min'],
  ['Haven','Cypher',13,10,19,15,6,153,232,26,78,4,5,'37 min'],
  ['Bind','Omen',7,13,12,18,11,128,181,20,65,2,4,'30 min'],
  ['Ascent','Sova',13,9,18,14,10,142,224,25,77,4,7,'36 min'],
] as const;
export const demoMatches: Encounter[] = rows.map((r, i) => ({
  id: `demo-${10-i}`, map:r[0], agent:r[1], win:r[2]>r[3], score:`${r[2]} : ${r[3]}`,
  k:r[4], d:r[5], a:r[6], adr:r[7], acs:r[8], hs:r[9], kast:r[10], openingWins:r[11], openingAttempts:r[12], rounds:r[2]+r[3], time:r[13],
}));
export function demoPlayer(count: number): PlayerView {
  const matches = demoMatches.slice(0, count);
  const group = (key: 'agent'|'map') => [...new Set(matches.map(m => m[key]))].map(name => {
    const subset = matches.filter(m => m[key] === name);
    return { name, matches: subset.length, winRate: subset.filter(m => m.win).length / subset.length * 100, kd: summarize(subset).kd };
  });
  return { name:'Ghost#PLAY', source:'Sample data', matches, summary:summarize(matches), agents:group('agent'), maps:group('map'), weapons:[] };
}
