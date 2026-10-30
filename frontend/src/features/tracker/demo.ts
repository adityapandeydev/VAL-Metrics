import { Encounter, PlayerView, summarize } from './model';
import type { AdvancedPlayerMetrics } from '../../types/analytics';

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
  const summary = summarize(matches);
  const kills = matches.reduce((n,m)=>n+m.k,0), deaths=matches.reduce((n,m)=>n+m.d,0), assists=matches.reduce((n,m)=>n+m.a,0);
  const rounds=matches.reduce((n,m)=>n+m.rounds!,0);
  const hits=matches.reduce((n,m)=>n+m.k*6,0), headshots=Math.round(hits*summary.hs/100), legshots=Math.round(hits*.06), bodyshots=hits-headshots-legshots;
  const weapons=[{name:'Vandal',kills:Math.round(kills*.55),hs:34},{name:'Phantom',kills:Math.round(kills*.25),hs:23},{name:'Ghost',kills:Math.round(kills*.12),hs:38}];
  weapons.push({name:'Sheriff',kills:kills-weapons.reduce((n,w)=>n+w.kills,0),hs:45});
  const agents=group('agent'), maps=group('map');
  const details: AdvancedPlayerMetrics = {
    riotId:'Ghost#PLAY',puuid:'demo',dataSource:'Synthetic sample',selectedAct:'Sample history',selectedQueue:'Competitive',playtimeHours:matches.reduce((n,m)=>n+parseInt(m.time),0)/60,
    totalMatches:matches.length,wins:summary.wins,losses:matches.length-summary.wins,winRate:summary.wins/Math.max(1,matches.length)*100,
    kills,deaths,assists,kdRatio:summary.kd,kadRatio:(kills+assists)/Math.max(1,deaths),killsPerRound:kills/rounds,damagePerRound:summary.adr,damageDeltaPerRound:18,averageCombatScore:summary.acs,kastPercent:summary.kast,
    firstBloods:matches.reduce((n,m)=>n+m.openingWins!,0),flawlessRounds:matches.length,aces:0,clutches:Math.floor(matches.length/3),valIndexScore:0,valIndexGrade:'',roundWinRate:matches.reduce((n,m)=>n+Number(m.score.split(':')[0]),0)/rounds*100,
    totalHits:hits,headshots,bodyshots,legshots,headshotPercent:headshots/hits*100,bodyshotPercent:bodyshots/hits*100,legshotPercent:legshots/hits*100,
    roleMastery:Object.fromEntries(agents.map(a=>{const role=a.name==='Omen'?'Controller':a.name==='Sova'?'Initiator':'Sentinel';const ms=matches.filter(m=>m.agent===a.name);return [role,{roleName:role,matches:a.matches,winRate:a.winRate,kdRatio:a.kd,adr:summarize(ms).adr}];})),
    agentLeaderboard:agents.map(a=>{const ms=matches.filter(m=>m.agent===a.name),s=summarize(ms);const best=[...new Set(ms.map(m=>m.map))].map(name=>{const played=ms.filter(m=>m.map===name);return {name,winRate:played.filter(m=>m.win).length/played.length*100};}).sort((a,b)=>b.winRate-a.winRate)[0];return {agentName:a.name,agentIconUrl:'',role:a.name==='Omen'?'Controller':a.name==='Sova'?'Initiator':'Sentinel',matchesPlayed:a.matches,playtimeHours:ms.reduce((n,m)=>n+parseInt(m.time),0)/60,winRate:a.winRate,kdRatio:a.kd,adr:s.adr,acs:s.acs,damageDelta:18,bestMapName:best?.name||'',bestMapWinRate:best?.winRate||0};}),
    mapDomination:maps.map(m=>({mapName:m.name,matchesPlayed:m.matches,winRate:m.winRate,recordString:`${Math.round(m.matches*m.winRate/100)}W · ${m.matches-Math.round(m.matches*m.winRate/100)}L`})),
    weaponArmory:weapons.map(w=>({weaponName:w.name,category:w.name==='Vandal'||w.name==='Phantom'?'Rifle':'Sidearm',totalKills:w.kills,headshotPercent:w.hs,bodyshotPercent:100-w.hs-5,legshotPercent:5})),recentEncounters:[],
  };
  return { name:'Ghost#PLAY', source:'Sample data', matches, summary, agents, maps, weapons, details };
}
