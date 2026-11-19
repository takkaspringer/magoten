import './style.css'
import { backdrop, fleaArt, hero, personArt, town } from './art'
import type { Camera } from './art'
import { Audio } from './audio'
import { Battle } from './battle'
import { combo, finale, levels, obstacles, opening, people, world } from './data'
import type { Point, TownPerson } from './data'

type Screen = 'title' | 'intro' | 'town' | 'battle' | 'result' | 'ending' | 'summary'
type Panel = 'pause' | 'help' | 'settings'
type Score = { seconds: number; stars: number; hits: number; misses: number; combos: number }
type Save = {
  started: boolean
  rescued: string[]
  xp: number
  ended: boolean
  best: Record<string, Score>
  music: number
  effects: number
  seenComboTip: boolean
}
type Result = { person: TownPerson; score: Score; notice: string; record: boolean; replay: boolean; trial: boolean }
const saveKey = 'magoten-save-v1'
const defaults = (): Save => ({ started:false,rescued:[],xp:0,ended:false,best:{},music:.32,effects:.65,seenComboTip:false })

function load(): Save {
  const clean = defaults()
  try {
    const value = JSON.parse(localStorage.getItem(saveKey) ?? 'null') as Partial<Save> | null
    if(!value || typeof value!=='object') return clean
    for(const key of ['music','effects'] as const) {
      const volume=value[key]
      if(typeof volume==='number' && Number.isFinite(volume)) clean[key]=Math.min(1,Math.max(0,volume))
    }
    if(value.started!==true) return clean
    clean.started=true
    clean.seenComboTip=value.seenComboTip===true
    clean.rescued=people.filter(p=>Array.isArray(value.rescued)&&value.rescued.includes(p.id)).map(p=>p.id)
    clean.xp=people.reduce((xp,p)=>xp+(clean.rescued.includes(p.id)?p.xp:0),0)
    clean.ended=clean.rescued.length===people.length&&value.ended===true
    for(const p of people) {
      const score=value.best?.[p.id]
      if(score && Number.isFinite(score.seconds) && score.seconds>=0 &&
        Number.isInteger(score.stars) && score.stars>=1 && score.stars<=3 &&
        Number.isInteger(score.hits) && score.hits>0 && Number.isInteger(score.misses) && score.misses>=0) {
        const combos=Number.isInteger(score.combos)&&score.combos>=0&&score.combos<=score.hits?score.combos:0
        clean.best[p.id]={...score,combos}
      }
    }
  } catch {
    return clean
  }
  return clean
}

const audio=new Audio()
let save=load()
audio.setup(save)
const persist=()=>{ try { localStorage.setItem(saveKey,JSON.stringify(save)) } catch { /* Play can continue in memory. */ } }
const level=()=>levels.filter(l=>save.xp>=l.xp).length-1
const distance=(a: Point,b: Point)=>Math.hypot(a.x-b.x,a.y-b.y)
const narrow=matchMedia('(max-width: 640px)')
const directTrial=new URLSearchParams(location.search).get('trial')==='grocer'
const grocer=people.find(p=>p.id==='grocer')!
let trialTipSeen=false

let screen: Screen='title'
let panel: Panel | undefined
let panelBack: Panel | undefined
let dialogue: { person: TownPerson; kind: 'entry' | 'talk' | 'locked'; age: number } | undefined
let newConfirm=false
let intro=0
let ending=0
let player={...world.start}
let facing=1
let moving=false
let elapsed=0
let sceneTime=0
let previous=performance.now()
let lastStep=0
let protectedPerson=''
let returnPosition: Point | undefined
let battle: Battle | undefined
let result: Result | undefined
let battleStatus=''
let activePointer: number | undefined
let touchDirection={x:0,y:0}
const keys=new Set<string>()

const app=document.querySelector<HTMLElement>('#app')!
app.innerHTML=`
  <div class="game-shell">
    <header class="masthead">
      <div class="wordmark"><span class="mark" aria-hidden="true"></span><span>マゴテン</span></div>
      <span class="credit">果糖 <span aria-hidden="true">/</span> ShipLab Hackathon</span>
    </header>
    <section id="game" class="game" aria-label="マゴテンのゲーム画面">
      <div class="stage">
        <canvas id="canvas" width="640" height="360"></canvas>
        <div id="overlay"></div>
      </div>
      <aside id="battle-ui" class="battle-ui" hidden></aside>
    </section>
    <footer id="footer" class="footer"></footer>
    <div id="panels"></div>
  </div>`
const game=document.querySelector<HTMLElement>('#game')!
const canvas=document.querySelector<HTMLCanvasElement>('#canvas')!
const c=canvas.getContext('2d',{alpha:false})!
const overlay=document.querySelector<HTMLElement>('#overlay')!
const footer=document.querySelector<HTMLElement>('#footer')!
const panels=document.querySelector<HTMLElement>('#panels')!
const battleUi=document.querySelector<HTMLElement>('#battle-ui')!

const button=(action: string, title: string, style='')=>`<button type="button" class="button ${style}" data-action="${action}">${title}</button>`
const timeText=(s: number)=> Math.floor(s/60)+'分'+String(Math.floor(s%60)).padStart(2,'0')+'秒'
const accuracy=(s: Score)=> Math.round(100*s.hits/(s.hits+s.misses))+'%'
const stars=(n: number)=>'★'.repeat(n)+'☆'.repeat(3-n)

function resetInput() {
  keys.clear()
  moving=false
  touchDirection={x:0,y:0}
  if(activePointer!==undefined && canvas.hasPointerCapture(activePointer)) canvas.releasePointerCapture(activePointer)
  activePointer=undefined
  battle?.cancel()
}

function sizeCanvas() {
  const mobile=narrow.matches
  const townScene=screen==='town'||screen==='ending'||screen==='result'||screen==='summary'
  if(screen==='battle') { canvas.width=384; canvas.height=344 }
  else if(townScene) { canvas.width=mobile?320:520; canvas.height=mobile?400:320 }
  else { canvas.width=mobile?320:640; canvas.height=mobile?460:360 }
  c.imageSmoothingEnabled=false
  game.style.setProperty('--scene-w',String(canvas.width))
  game.style.setProperty('--scene-h',String(canvas.height))
}

function go(next: Screen) {
  resetInput()
  panel=undefined
  panelBack=undefined
  dialogue=undefined
  newConfirm=false
  sceneTime=0
  screen=next
  sizeCanvas()
  render()
}

function startTown() {
  save.started=true
  persist()
  go('town')
}

function startNew() {
  save={...defaults(),music:save.music,effects:save.effects}
  player={...world.start}
  protectedPerson=''
  returnPosition=undefined
  intro=0
  go('intro')
}

function resume() {
  const p=people.find(p=>!save.rescued.includes(p.id))
  player=p ? p.id==='baker' ? {...world.start} : { x:p.at.x-52,y:p.at.y+26 }
    : {x:people[2].at.x-44,y:people[2].at.y+18}
  protectedPerson=''
  if(save.rescued.length===people.length && !save.ended) {
    ending=0
    go('ending')
  } else go('town')
}

function hud() {
  const lv=level()
  const progress=lv===levels.length-1?100:Math.round(100*(save.xp-levels[lv].xp)/(levels[lv+1].xp-levels[lv].xp))
  return `<div class="town-hud">
    <div class="hud-chip">助けた人 <strong>${save.rescued.length}<span> / ${people.length}</span></strong></div>
    <div class="hud-chip xp" aria-label="Lv ${lv+1} 経験値 ${save.xp}"><strong>Lv ${lv+1}</strong><meter value="${progress}" min="0" max="100">${progress}%</meter></div>
    ${button('pause','<span aria-hidden="true">Ⅱ</span><span class="pause-word">ポーズ</span>','quiet pause-button')}
  </div>`
}

function bubble(speaker: string, line: string, action: string, skip=false) {
  return `<div class="dialogue">${skip?button('skip','スキップ','quiet skip'):''}
    <button type="button" class="speech" data-action="${action}">
      <span class="speaker">${speaker}</span><span class="line">${line}</span><span class="next" aria-label="次へ">▼</span>
    </button>
  </div>`
}

function townUi() {
  const p=dialogue?.person
  const ready=people.find(p=>!save.rescued.includes(p.id))
  const objective=ready
    ? `${ready.district}の${ready.name}を助けよう`
    : '村人と話すと再チャレンジできます'
  const dock=`<div class="town-dock">
    <div class="dpad" aria-label="移動">
      <button type="button" data-dir="up" aria-label="上">▲</button>
      <button type="button" data-dir="left" aria-label="左">◀</button>
      <button type="button" data-dir="down" aria-label="下">▼</button>
      <button type="button" data-dir="right" aria-label="右">▶</button>
    </div>
  </div>`
  let talk=''
  if(p && dialogue) {
    if(dialogue.kind==='entry') talk=bubble(p.name,p.entry,'next')
    else if(dialogue.kind==='locked') talk=bubble(p.name,p.locked??'困っている人がいるよ！','next')
    else {
      talk=`<div class="talk-card"><span class="speaker">${p.name}</span><p>${p.rescued}</p>
        <div class="talk-actions">${save.ended?button('replay','もう一度 チャレンジ','primary'):''}${button('next','とじる','quiet')}</div></div>`
    }
  }
  return hud()+`<div id="guide" class="guide" aria-hidden="true" hidden>➤</div>
    <div class="objective"><span class="compass" aria-hidden="true">◆</span>${objective}</div>`+dock+talk
}

function resultUi() {
  if(!result) return ''
  const {score,notice,person,record,replay,trial}=result
  const canCombo=person.itches.some(i=>i.hidden)||person.fleas.some(f=>f.hideAt)
  const tip=canCombo&&!score.combos?'次は 飛び出したノミの着地をねらおう！'
    : score.stars===3?'お見事！ すばやく正確に救出できました。'
    : score.misses? '白い足元が見えたときにたたくと、精度が上がります。'
    : 'ノミの着地を待つ間にこすると、時間を縮められます。'
  return `<div class="scene-shade"><section class="result-card" aria-label="救出結果">
    <div class="speaker">${person.district}の${person.name}</div>
    <h2>救出成功！</h2>
    <div class="stars" aria-label="星 ${score.stars}">${stars(score.stars)}</div>
    <div class="result-stats"><div><span>タイム</span><strong>${timeText(score.seconds)}</strong></div>
    <div><span>たたいた精度</span><strong>${accuracy(score)}</strong></div></div>
    ${canCombo?`<p class="combo-result">かき出しコンボ <strong>${score.combos}回</strong></p>`:''}
    ${notice?`<p class="level-up">Lv ${level()+1} · ${notice}</p>`:''}
    ${record&&replay?'<p class="level-up">自己ベスト更新！</p>':''}
    <p class="tip">${tip}</p>
    ${trial?button('trial','もう一度 試す','primary')+button('title','タイトルへ','quiet')
      :button('result-next',save.rescued.length===people.length&&!save.ended?'街のみんなに会う':'街へもどる','primary')}
  </section></div>`
}

function summaryUi() {
  return `<div class="scene-shade"><section class="result-card summary" aria-label="冒険の結果">
    <div class="speaker">エンディング</div><h2>背中に、平和が戻った。</h2>
    <p>助けた人 <strong>${save.rescued.length} / ${people.length}</strong> <span class="summary-lv">Lv ${level()+1}</span></p>
    <ul class="summary-list">${people.map(p=>{const s=save.best[p.id];return s?`<li><strong>${p.name}</strong><span>${stars(s.stars)}</span><span>${timeText(s.seconds)}</span></li>`:''}).join('')}</ul>
    ${button('back-town','街へもどる','primary')}
    ${button('title','タイトルへ','quiet')}
  </section></div>`
}

function render() {
  game.dataset.screen=screen
  battleUi.hidden=screen!=='battle'
  battleStatus=''
  switch(screen) {
    case 'title':
      overlay.innerHTML=`<div class="title-content"><h1>マゴテン</h1>
        <p>村人を救って、背中の平和を守れ！</p>
        <div class="title-actions">
          ${directTrial?button('trial','八百屋でコンボを試す','primary')+button('story-title','本編のタイトルへ','quiet')
            :`${save.started?button('resume','つづきから','primary'):''}
              ${button('start','はじめる',save.started?'':'primary')}
              <div class="sub-actions">${button('help','あそびかた','quiet')}${button('settings','せってい','quiet')}</div>`}
        </div></div>`
      footer.textContent=''
      break
    case 'intro':
      overlay.innerHTML=bubble(intro===3?'パン屋':'勇者',opening[intro],'next',true)
      footer.textContent='タップ、クリック、Enterで進む'
      break
    case 'town':
      overlay.innerHTML=townUi()
      footer.innerHTML='<span class="keyboard-hint"><kbd>↑</kbd> <kbd>←</kbd> <kbd>↓</kbd> <kbd>→</kbd> / <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> で移動</span>'
      break
    case 'battle':
      overlay.innerHTML=''
      battleUi.innerHTML=`<div class="battle-head"><span class="speaker">${battle!.person.district}</span><h2>${battle!.person.name}の背中</h2>
        ${button('pause','<span aria-hidden="true">Ⅱ</span> ポーズ','quiet pause-button')}</div>
        <div class="battle-counters"><div><span class="flea-key" aria-hidden="true">◆</span><span>ノミ</span><strong id="flea-count"></strong></div>
        <div><span class="itch-key" aria-hidden="true">≋</span><span>かゆみ</span><strong id="itch-count"></strong></div></div>
        <p id="battle-hint" class="battle-hint" aria-live="polite"></p>`
      updateBattleUi()
      footer.textContent=''
      break
    case 'result':
      overlay.innerHTML=resultUi()
      footer.textContent=''
      break
    case 'ending':
      overlay.innerHTML=bubble(ending===0?'街の住人':'勇者',finale[ending],'next')
      footer.textContent='タップ、クリック、Enterで進む'
      break
    case 'summary':
      overlay.innerHTML=summaryUi()
      footer.textContent=''
  }
  renderPanel()
}

function renderPanel() {
  if(!panel&&!newConfirm) {
    panels.replaceChildren()
    game.inert=false
    return
  }
  game.inert=true
  let title=''
  let content=''
  if(newConfirm) {
    title='はじめから遊ぶ？'
    content=`<p>今の救出状況と記録を消して、新しい冒険を始めます。</p>${button('confirm-new','はじめから','primary')}${button('close','もどる','quiet')}`
  } else if(panel==='pause') {
    title='ポーズ'
    content=button('close','つづける','primary')+button('help','あそびかた','quiet')+
      button('settings','せってい','quiet')+button('title','タイトルへ','quiet')
  } else if(panel==='help') {
    title='あそびかた'
    content=`<dl class="instructions">
      <dt>街を歩く</dt><dd>矢印キー、WASD、画面の方向ボタンで移動。かゆい人に近づこう。</dd>
      <dt>ノミをたたく</dt><dd>着地して白い足元が出たら、ノミをタップかクリック。</dd>
      <dt>背中をかく</dt><dd>光るところを押したまま、左右か上下に短く往復。</dd>
      </dl>${button('close','もどる','primary')}`
  } else {
    title='せってい'
    content=`<label class="volume">音楽 <output id="music-value">${Math.round(save.music*100)}%</output>
      <input type="range" name="music" min="0" max="100" value="${Math.round(save.music*100)}"></label>
      <label class="volume">効果音 <output id="effects-value">${Math.round(save.effects*100)}%</output>
      <input type="range" name="effects" min="0" max="100" value="${Math.round(save.effects*100)}"></label>${button('close','もどる','primary')}`
  }
  panels.innerHTML=`<div class="modal"><section class="panel" role="dialog" aria-modal="true" aria-labelledby="panel-title">
    <h2 id="panel-title">${title}</h2>${content}</section></div>`
  panels.querySelector<HTMLElement>('button')?.focus({preventScroll:true})
}

function updateBattleUi() {
  if(!battle) return
  const next=battle.remainingFleas+'|'+battle.remainingItches+'|'+battle.hint
  if(next===battleStatus) return
  battleStatus=next
  document.querySelector('#flea-count')!.textContent=`あと ${battle.remainingFleas}匹`
  document.querySelector('#itch-count')!.textContent=`あと ${battle.remainingItches}か所`
  const hint=document.querySelector<HTMLElement>('#battle-hint')!
  hint.textContent=battle.hint
  hint.classList.toggle('combo-cue',battle.hint.startsWith('いま！')||battle.hint==='かき出しコンボ！')
}

function enterBattle(p: TownPerson,replay: boolean,trial=false) {
  const showTip=p.id==='grocer' && !(trial?trialTipSeen:save.seenComboTip)
  if(showTip) {
    if(trial) trialTipSeen=true
    else { save.seenComboTip=true; persist() }
  }
  battle=new Battle(p,trial?1:level(),replay,trial,e=>audio.play(e),showTip)
  go('battle')
}

function finishBattle() {
  if(!battle) return
  const {person,elapsed,hits,misses,combos,replay,trial}=battle
  const {targets}=person
  const ratedTime=elapsed-combo.timeBonus*combos
  const stars=ratedTime<=targets.gold&&misses<=1?3:ratedTime<=targets.silver&&misses<=targets.silverMisses?2:1
  const score={seconds:elapsed,hits,misses,stars,combos}
  const old=save.best[person.id]
  const rankChange=old ? stars-old.stars || combos-old.combos || old.misses-misses || old.seconds-elapsed : 1
  const record=!trial&&rankChange>0
  const before=level()
  if(record) save.best[person.id]=score
  if(!trial) {
    if(!save.rescued.includes(person.id)) {
      save.rescued.push(person.id)
      save.xp+=person.xp
    }
    persist()
    if(returnPosition) player={...returnPosition}
    protectedPerson=person.id
  }
  const notice=level()>before?levels[level()].notice:''
  result={person,score,notice,record,replay,trial}
  battle=undefined
  go('result')
  audio.play(notice?'level':'win')
}

function closePanel() {
  if(newConfirm) newConfirm=false
  else {
    panel=panelBack
    panelBack=undefined
  }
  resetInput()
  renderPanel()
}

function advance() {
  if(screen==='intro') {
    if(intro===opening.length-1) startTown()
    else { intro++; sceneTime=0; render() }
  } else if(screen==='ending') {
    if(ending===finale.length-1) {
      save.ended=true
      persist()
      go('summary')
    } else { ending++; sceneTime=0; render() }
  } else if(screen==='town'&&dialogue) {
    if(dialogue.kind==='entry') enterBattle(dialogue.person,false)
    else {
      dialogue=undefined
      resetInput()
      render()
    }
  }
}

function action(id: string) {
  audio.unlock()
  audio.play('select')
  switch(id) {
    case 'start':
      if(save.started) { newConfirm=true; renderPanel() }
      else startNew()
      break
    case 'confirm-new': startNew(); break
    case 'resume': resume(); break
    case 'trial': if(directTrial) enterBattle(grocer,false,true); break
    case 'story-title': location.assign(location.pathname); break
    case 'skip': if(screen==='intro') startTown(); break
    case 'next': advance(); break
    case 'pause': resetInput(); panel='pause'; renderPanel(); break
    case 'help':
    case 'settings': panelBack=panel; panel=id; resetInput(); renderPanel(); break
    case 'close': closePanel(); break
    case 'title': battle=undefined; go('title'); break
    case 'replay': if(dialogue&&save.ended) enterBattle(dialogue.person,true); break
    case 'result-next':
      if(save.rescued.length===people.length&&!save.ended) { ending=0; go('ending') }
      else go('town')
      break
    case 'back-town': go('town'); break
  }
}

app.addEventListener('click',e=>{
  const target=(e.target as HTMLElement).closest<HTMLButtonElement>('[data-action]')
  if(target?.dataset.action) action(target.dataset.action)
})

panels.addEventListener('input',e=>{
  const el=e.target as HTMLInputElement
  const key=el.name
  if(key!=='music'&&key!=='effects') return
  save[key]=el.valueAsNumber/100
  audio.unlock()
  audio.setup(save)
  document.querySelector('#'+key+'-value')!.textContent=el.value+'%'
  persist()
})
panels.addEventListener('change',e=>{
  if((e.target as HTMLInputElement).name==='effects') audio.play('hit')
})

const movementCodes=new Set(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyW','KeyA','KeyS','KeyD'])
window.addEventListener('keydown',e=>{
  if(e.code==='Escape') {
    if(e.repeat) return
    if(panel||newConfirm) closePanel()
    else if(screen==='town'||screen==='battle') action('pause')
    return
  }
  if(e.code==='Enter' && !e.repeat && !panel&&!newConfirm &&
    !(e.target instanceof HTMLButtonElement) && (screen==='intro'||screen==='ending'||dialogue)) {
    e.preventDefault()
    action('next')
  }
  if(screen==='town'&&!panel&&!dialogue&&movementCodes.has(e.code)) {
    e.preventDefault()
    if(!e.repeat) keys.add(e.code)
  }
})
window.addEventListener('keyup',e=>keys.delete(e.code))
window.addEventListener('blur',resetInput)

const directions: Record<string,Point>={up:{x:0,y:-1},down:{x:0,y:1},left:{x:-1,y:0},right:{x:1,y:0}}
overlay.addEventListener('pointerdown',e=>{
  const pad=(e.target as HTMLElement).closest<HTMLElement>('.dpad')
  if(!pad||dialogue||panel) return
  pad.setPointerCapture(e.pointerId)
  moveOnPad(pad,e)
  e.preventDefault()
})
overlay.addEventListener('pointermove',e=>{
  if(e.target instanceof HTMLElement&&e.target.matches('.dpad')&&e.target.hasPointerCapture(e.pointerId)) moveOnPad(e.target,e)
})
function moveOnPad(pad: HTMLElement,e: PointerEvent) {
  const hit=document.elementFromPoint(e.clientX,e.clientY)?.closest<HTMLElement>('[data-dir]')
  if(hit&&pad.contains(hit)) touchDirection=directions[hit.dataset.dir!]
  else {
    const bounds=pad.getBoundingClientRect()
    const x=e.clientX-bounds.x-bounds.width/2,y=e.clientY-bounds.y-bounds.height/2
    touchDirection=Math.hypot(x,y)>11&&Math.abs(x)<bounds.width/2+20&&Math.abs(y)<bounds.height/2+20
      ? Math.abs(x)>Math.abs(y)?{x:Math.sign(x),y:0}:{x:0,y:Math.sign(y)} : {x:0,y:0}
  }
  for(const key of pad.querySelectorAll<HTMLButtonElement>('[data-dir]')) {
    const d=directions[key.dataset.dir!]
    key.classList.toggle('pressed',touchDirection.x===d.x&&touchDirection.y===d.y)
  }
}
for(const name of ['pointerup','pointercancel','lostpointercapture']) {
  overlay.addEventListener(name,()=>{
    touchDirection={x:0,y:0}
    overlay.querySelector('.pressed')?.classList.remove('pressed')
  })
}

function inCanvas(e: PointerEvent) {
  const r=canvas.getBoundingClientRect()
  return {x:(e.clientX-r.left)*canvas.width/r.width,y:(e.clientY-r.top)*canvas.height/r.height}
}
canvas.addEventListener('pointerdown',e=>{
  if(screen!=='battle'||panel||activePointer!==undefined||e.button!==0) return
  e.preventDefault()
  audio.unlock()
  activePointer=e.pointerId
  canvas.setPointerCapture(e.pointerId)
  battle?.begin(inCanvas(e))
})
canvas.addEventListener('pointermove',e=>{
  if(screen==='battle'&&!panel&&(e.pointerId===activePointer||activePointer===undefined)) {
    const trajectory=e.getCoalescedEvents?.() ?? []
    for(const sample of trajectory.length?trajectory:[e]) battle?.move(inCanvas(sample))
  }
})
canvas.addEventListener('pointerup',e=>{
  if(activePointer!==e.pointerId) return
  battle?.end(inCanvas(e))
  activePointer=undefined
})
for(const name of ['pointercancel','lostpointercapture']) {
  canvas.addEventListener(name,event=>{
    if((event as PointerEvent).pointerId!==activePointer) return
    activePointer=undefined
    battle?.cancel()
  })
}

function camera(p: Point, w=canvas.width, h=canvas.height): Camera {
  return {
    x:Math.round(Math.max(0,Math.min(world.w-w,p.x-w/2))),
    y:Math.round(Math.max(0,Math.min(world.h-h,p.y-h*.53))),
    w,h,
  }
}

function allowed(x: number,y: number) {
  const r=7
  return x>=22&&x<=world.w-22&&y>=26&&y<=world.h-23&&!obstacles.some(o=>
    x+r>o.x&&x-r<o.x+o.w&&y+r>o.y&&y-r<o.y+o.h)
}

function moveTown(dt: number) {
  const rx=Number(keys.has('ArrowRight')||keys.has('KeyD'))-Number(keys.has('ArrowLeft')||keys.has('KeyA'))
  const ry=Number(keys.has('ArrowDown')||keys.has('KeyS'))-Number(keys.has('ArrowUp')||keys.has('KeyW'))
  const x=rx||touchDirection.x,y=ry||touchDirection.y
  const norm=Math.hypot(x,y)
  moving=false
  if(!norm) return
  const vx=x*104*dt/norm,vy=y*104*dt/norm
  const from={...player}
  if(vx&&allowed(player.x+vx,player.y)) { player.x+=vx; moving=true; facing=Math.sign(x) }
  if(vy&&allowed(player.x,player.y+vy)) { player.y+=vy; moving=true }
  if(moving&&elapsed-lastStep>.27) { lastStep=elapsed; audio.play('step') }
  for(const p of people) {
    const d=distance(player,p.at)
    if(p.id===protectedPerson) {
      if(d>36) protectedPerson=''
      continue
    }
    if(d>=23) continue
    const index=people.indexOf(p)
    const kind=save.rescued.includes(p.id)?'talk':people.slice(0,index).some(s=>!save.rescued.includes(s.id))?'locked':'entry'
    returnPosition=from
    protectedPerson=p.id
    dialogue={person:p,kind,age:0}
    resetInput()
    render()
    break
  }
}

function updateGuide(cam: Camera) {
  const guide=document.querySelector<HTMLElement>('#guide')
  const target=people.find(p=>!save.rescued.includes(p.id))
  if(!guide||!target||dialogue) {
    if(guide) guide.hidden=true
    return
  }
  const dx=target.at.x-cam.x,dy=target.at.y-cam.y-20
  const visible=dx>30&&dx<cam.w-30&&dy>56&&dy<cam.h-55
  guide.hidden=visible
  if(visible) return
  const cx=cam.w/2,cy=cam.h*.52
  const sx=dx-cx,sy=dy-cy
  const factor=Math.min((cx-24)/Math.max(1,Math.abs(sx)),(cy-62)/Math.max(1,Math.abs(sy)))
  guide.style.left=(100*(cx+sx*factor)/cam.w)+'%'
  guide.style.top=(100*(cy+sy*factor)/cam.h)+'%'
  guide.style.rotate=Math.atan2(sy,sx)+'rad'
}

function frame(now: number) {
  const dt=Math.min(.05,(now-previous)/1000)
  previous=now
  if(!panel&&!newConfirm) {
    elapsed+=dt
    sceneTime+=dt
    if(screen==='town') {
      if(dialogue) {
        dialogue.age+=dt
        if(dialogue.kind==='entry'&&dialogue.age>=1.45) advance()
      } else moveTown(dt)
    }
    if(screen==='battle'&&battle) {
      battle.update(dt)
      updateBattleUi()
      if(battle.readyForResult) finishBattle()
    }
  }
  audio.tick(screen==='battle'?'battle':screen==='title'||screen==='intro'?'title':'town',!!panel||newConfirm)
  if(screen==='title'||(screen==='intro'&&intro===0)) {
    backdrop(c,canvas.width,canvas.height,elapsed,screen==='intro')
  } else if(screen==='battle') battle?.draw(c)
  else {
    const focus=screen==='intro' && !narrow.matches
    const townPlayer=screen==='result'&&result?.trial?{x:grocer.at.x-39,y:grocer.at.y+20}:player
    const cam=focus?camera(townPlayer,400,225):camera(townPlayer)
    if(focus) {
      c.save()
      c.scale(canvas.width/cam.w,canvas.height/cam.h)
    }
    town(c,cam,townPlayer,people,save.rescued,elapsed,moving,facing,screen==='ending'||screen==='summary'||(screen==='intro'&&intro===2))
    if(screen==='intro'&&intro===2) {
      hero(c,player.x-cam.x,player.y-cam.y,0,1,2,true)
    }
    if(screen==='intro'&&intro===3) {
      const t=Math.min(1,sceneTime*.88)
      fleaArt(c,player.x-cam.x+15+t*100,player.y-cam.y-8-Math.abs(Math.sin(t*Math.PI*3))*40,false,1.1)
    }
    if(screen==='ending'||screen==='summary') {
      personArt(c,people[0],player.x-cam.x-41,player.y-cam.y+13,0,true)
      personArt(c,people[1],player.x-cam.x+37,player.y-cam.y+16,0,true)
    }
    if(focus) c.restore()
    if(screen==='town') updateGuide(cam)
  }
  requestAnimationFrame(frame)
}
narrow.addEventListener('change',()=>{ resetInput(); sizeCanvas() })
sizeCanvas()
render()
requestAnimationFrame(frame)


