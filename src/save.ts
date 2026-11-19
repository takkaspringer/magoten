import { people } from './data'
import type { Point } from './data'
import { demonPeople } from './demon'
import type { Realm } from './demon'

export const cast=[...people,...demonPeople]

export type Score = {
  seconds: number
  stars: number
  hits: number
  misses: number
  combos: number
  points: number
  chain: number
  defeated: number
}

type StageRecord = { fastest: number; points: number; chain: number; defeated: number }
export type ChallengeRecord = { points: number; chain: number; defeated: number }
export type Save = {
  started: boolean
  rescued: string[]
  xp: number
  ended: boolean
  demonGate: boolean
  enteredDemon: boolean
  demonEnded: boolean
  location?: Point & { realm: Realm }
  subdued: boolean
  best: Record<string, Score>
  records: Record<string, StageRecord>
  challenge?: ChallengeRecord
  defeated: number
  music: number
  effects: number
  seenComboTip: boolean
}

const key='magoten-save-v1'
const count=(n: unknown, fallback=0)=>typeof n==='number'&&Number.isSafeInteger(n)&&n>=0?n:fallback
const validTime=(n: unknown): n is number=>typeof n==='number'&&Number.isFinite(n)&&n>=0

export const defaults=(): Save=>({
  started:false,rescued:[],xp:0,ended:false,demonGate:false,enteredDemon:false,demonEnded:false,subdued:false,
  best:{},records:{},defeated:0,music:.32,effects:.65,seenComboTip:false,
})

export function load(): Save {
  const clean=defaults()
  try {
    const value=JSON.parse(localStorage.getItem(key)??'null') as Partial<Save> | null
    if(!value||typeof value!=='object') return clean
    for(const name of ['music','effects'] as const) {
      const volume=value[name]
      if(typeof volume==='number'&&Number.isFinite(volume)) clean[name]=Math.min(1,Math.max(0,volume))
    }
    clean.subdued=value.subdued===true
    if(value.started!==true) return clean
    clean.started=true
    clean.seenComboTip=value.seenComboTip===true
    const rescued=Array.isArray(value.rescued)?value.rescued:[]
    clean.rescued=cast.filter(p=>rescued.includes(p.id)).map(p=>p.id)
    clean.xp=cast.reduce((xp,p)=>xp+(clean.rescued.includes(p.id)?p.xp:0),0)
    const kingdomReady=people.every(p=>clean.rescued.includes(p.id))
    clean.ended=kingdomReady&&value.ended===true
    clean.demonGate=clean.ended&&value.demonGate===true
    clean.enteredDemon=clean.demonGate&&value.enteredDemon===true
    clean.demonEnded=clean.ended&&demonPeople.every(p=>clean.rescued.includes(p.id))&&value.demonEnded===true
    const place=value.location
    if(place&&(place.realm==='kingdom'||(place.realm==='demon'&&clean.demonGate))&&validTime(place.x)&&validTime(place.y)) clean.location=place
    for(const p of cast) {
      const score=value.best?.[p.id]
      if(!score||!validTime(score.seconds)||count(score.stars)<1||score.stars>3||count(score.hits,-1)<0||count(score.misses,-1)<0) continue
      const combos=Math.min(score.hits,count(score.combos))
      const defeated=count(score.defeated,Math.max(0,score.hits-(p.id==='guard'?1:0)))
      clean.best[p.id]={...score,combos,defeated,points:count(score.points),chain:count(score.chain)}
      const record=value.records?.[p.id]
      clean.records[p.id]={
        fastest:validTime(record?.fastest)?Math.min(record.fastest,score.seconds):score.seconds,
        points:Math.max(count(record?.points),count(score.points)),
        chain:Math.max(count(record?.chain),count(score.chain)),
        defeated:count(record?.defeated,defeated),
      }
    }
    const previousKills=Object.values(clean.records).reduce((n,record)=>n+record.defeated,0)
    clean.defeated=count(value.defeated,previousKills)
    if(value.challenge&&kingdomReady) {
      clean.challenge={points:count(value.challenge.points),chain:count(value.challenge.chain),defeated:count(value.challenge.defeated)}
    }
  } catch {
    return clean
  }
  return clean
}

export function persist(save: Save) {
  try {
    localStorage.setItem(key,JSON.stringify(save))
  } catch {
    // Keep the in-memory game playable when storage is unavailable.
  }
}

export function recordRescue(save: Save,id: string,score: Score) {
  const before=save.records[id]
  save.defeated+=score.defeated
  save.records[id]={
    fastest:Math.min(before?.fastest??Infinity,score.seconds),
    points:Math.max(before?.points??0,score.points),
    chain:Math.max(before?.chain??0,score.chain),
    defeated:(before?.defeated??0)+score.defeated,
  }
}
