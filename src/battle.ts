import { battleBase, box, dogTail, fleaArt, label, poly, toolArt } from './art'
import { captain, challengeLimit, combo, feverDuration, levels, scout } from './data'
import type { ClaspSpec, ItchSpec, Point, TownPerson } from './data'
import { demonPeople } from './demon'
import type { Board, Cover, DemonPerson, VeiledFlea } from './demon'
import { demonBack, emperorArt, paw, victoryArt } from './demon-art'

type Phase = 'warning' | 'jump' | 'feint' | 'land' | 'retreat' | 'hidden' | 'emerge' | 'gone'
type Flea = {
  spec: VeiledFlea
  phase: Phase
  time: number
  from: number
  to: number
  hop: number
  added: number
  nextAdd: number
  launchFrom?: Point
  emerged: boolean
  comboReady: boolean
  strikes: number
}
type Itch = ItchSpec & { progress: number; fugitive?: Flea }
type Gesture = {
  start: Point
  last: Point
  itch?: Itch
  cover?: Cover & { opened: boolean }
  axis?: Point
  extent: number
  distance: number
  drag: boolean
  started: number
}
type Burst = Point & {
  age: number
  type: 'hit' | 'scratch' | 'miss' | 'combo' | 'escape' | 'pop' | 'retreat'
  quietText?: boolean
  emperor?: boolean
}
type ActCheckpoint = {
  elapsed: number; hits: number; misses: number; points: number; maxChain: number; combos: number;
  defeated: number; charge: number; feverTime: number; streak: number; lastAction: number
}
export type BattleEvent = 'hit' | 'scratch' | 'miss' | 'retreat' | 'pop' | 'combo' | 'fever' | 'peel' | 'link' | 'dog'
export type BattleMode = 'story' | 'replay' | 'trial' | 'challenge'

const distance = (a: Point, b: Point) => Math.hypot(a.x-b.x,a.y-b.y)
const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(value, low))
const waveSpots: Point[] = [
  {x:110,y:159},{x:178,y:147},{x:253,y:158},{x:275,y:208},
  {x:239,y:252},{x:171,y:253},{x:108,y:235},{x:152,y:201},{x:220,y:202},
]

export class Battle {
  elapsed = 0
  hits = 0
  misses = 0
  combos = 0
  defeated = 0
  points = 0
  maxChain = 0
  charge = 0
  feverTime = 0
  private lastAction = -Infinity
  private streak = 0
  private wave = 0
  private nextWave = 0
  private lastInput = 0
  private hintShown = false
  private companionHint?: Point & { until: number }
  private linkCandidate?: Point & { until: number }
  private linkTrail = 0
  private barkCue = -1
  private actIndex = 0
  private actSpent = 0
  private intermission = 0
  private checkpoint?: ActCheckpoint
  retryRequired = false
  private finishTime = 0
  private message?: { text: string; left: number; priority: number }
  private reaction = 0
  private tool: Point = {x: 312, y: 273}
  private gesture?: Gesture
  private bursts: Burst[] = []
  private fleas: Flea[]=[]
  private itches: Itch[]=[]
  private clasps: (ClaspSpec & { opened: boolean })[]=[]
  private covers: (Cover & { opened: boolean })[]=[]
  private demon?: DemonPerson
  private base?: HTMLCanvasElement
  private level: (typeof levels)[number]

  constructor(public person: TownPerson, level: number, public mode: BattleMode,
    private sound: (event: BattleEvent) => void, private showComboTip: boolean, private reduced: ()=>boolean) {
    this.level = levels[level]
    this.demon=demonPeople.find(p=>p.id===person.id)
    if(this.act) this.startAct()
    else this.loadBoard(this.demon??person)
    if(person.id==='royal') this.announce('ノミ魔王が あらわれた！',1.65,2)
    if(this.challenge) this.spawnWave()
  }

  private loadBoard(board: Board) {
    this.itches=board.itches.map(p=>({...p,progress:0}))
    this.clasps=(board.clasps??[]).map(clasp=>({...clasp,opened:false}))
    this.covers=(board.covers??[]).map(cover=>({...cover,opened:false}))
    this.fleas=board.fleas.map(spec=>this.makeFlea(spec))
  }

  private startAct() {
    if(!this.act) return
    const {elapsed,hits,misses,points,maxChain,combos,defeated,charge,feverTime,streak,lastAction}=this
    this.checkpoint={elapsed,hits,misses,points,maxChain,combos,defeated,charge,feverTime,streak,lastAction}
    this.actSpent=0
    this.intermission=0
    this.reaction=0
    this.retryRequired=false
    this.message=undefined
    this.gesture=undefined
    this.linkCandidate=undefined
    this.linkTrail=0
    this.companionHint=undefined
    this.lastInput=this.elapsed
    this.bursts=[]
    this.loadBoard(this.act.board)
    if(this.actIndex===2) {
      this.charge=Math.min(100,this.charge+35)
      this.sound('dog')
    }
  }

  retryAct() {
    if(!this.retryRequired||!this.checkpoint) return
    Object.assign(this,this.checkpoint)
    this.startAct()
  }

  private makeFlea(spec: VeiledFlea): Flea {
    const warns=spec.kind!=='normal'||!!spec.veil||spec.emperor===true
    return {
      spec, phase: warns?'warning':'land', time: spec.start ?? 0,
      from: warns?spec.route.length-1:0, to:0, hop:0, emerged:false, comboReady:false, strikes:0,
      added: 0, nextAdd: spec.addAfter ?? Infinity,
    }
  }

  get remainingFleas() { return this.fleas.filter(f=>f.phase!=='gone').length }
  get remainingItches() { return this.itches.filter(i=>i.progress<3).length }
  get remainingClasps() { return this.clasps.filter(c=>!c.opened).length }
  get remainingCovers() { return this.covers.filter(c=>!c.opened).length }
  get act() { return this.demon?.acts?.[this.actIndex] }
  get actTime() { return this.act?Math.max(0,Math.ceil(this.act.seconds-this.actSpent)):0 }
  private get nextAct() { return !!this.demon?.acts?.[this.actIndex+1] }
  private get boardClear() { return !this.remainingFleas&&!this.remainingItches&&!this.remainingClasps&&!this.remainingCovers }
  private get canPlay() { return !this.retryRequired&&!this.done&&!(this.act&&this.boardClear) }
  get challenge() { return this.mode==='challenge' }
  get timeLeft() { return Math.ceil(Math.max(0,challengeLimit-this.elapsed)) }
  get canUseFever() { return this.level.fever }
  get feverReady() { return this.canUseFever && this.charge>=100 && this.feverTime<=0 && this.canPlay }
  get chain() { return this.elapsed-this.lastAction<=4.8?this.streak:0 }
  get done() {
    if(this.challenge) return this.elapsed>=challengeLimit
    return this.boardClear&&!this.nextAct
  }
  get readyForResult() { return this.finishTime>=(this.demon&&this.mode!=='replay'?1.85:1.06) && !this.message }
  private get dogMotion() { return this.person.id==='dog'?this.elapsed%5:0 }
  private get dogShake() { return !this.reduced()&&this.dogMotion>=3.85?Math.round(Math.sin(this.elapsed*42)*6):0 }
  private get breath() { return this.person.id==='knight'?this.elapsed%3.5:0 }
  private get claspOpen() { return this.person.id!=='knight'||(this.breath>=1.55&&this.breath<2.83) }
  private get cueBeat() { return Math.floor(this.elapsed/3.65) }
  private get cueTarget() {
    if(this.person.id!=='kerberos') return undefined
    const left=this.itches.filter(i=>i.progress<3)
    return left.length?left[this.cueBeat%left.length]:undefined
  }

  private get headsAgree() { return this.cueBeat%2===1&&this.elapsed%3.65<2.25 }

  get hint() {
    if(this.retryRequired) return '時間切れ。この幕からやり直せるよ。'
    if(this.challenge&&this.done) return '時間切れ！'
    if(this.message) return this.message.text
    if(this.done) return '背中、すっきり！'
    if(this.act&&this.boardClear) return '幕をクリア！'
    if (this.person.id==='baker') return this.remainingFleas ? 'ノミは 着地したらタップ！' : '光るところを 左右か上下にこすれ！'
    if(this.fleas.some(f=>f.phase==='land'&&(f.comboReady || (f.spec.hideAt&&f.emerged)))) return 'いま！ 輪のノミをたたけ！'
    if(this.fleas.some(f=>f.phase==='hidden')) return '震えるかゆみをこすって 追い出せ！'
    if(this.remainingCovers) return 'ひらひらの端を 矢印のほうへスワイプ！'
    if(this.fleas.some(f=>f.phase!=='gone'&&f.spec.veil==='leaf')) return 'はっぱが ゆれた先を 見よう！'
    if(this.actIndex===1) return '刺しゅうの揺れを目で追おう！'
    if(this.actIndex===2&&this.remainingFleas) return '犬たちが足を止めた！ 輪が出たら今だ！'
    if(this.person.id==='knight'&&this.remainingClasps) {
      return this.claspOpen?'いま！ 開いた留め具をたたこう！'
        : this.breath>=.78?'肩が上がった…… もうすぐ開く！':'団長の肩を見て、留め具が開くのを待とう'
    }
    if(this.cueTarget) return this.headsAgree?'わん！（そこ！） みんなが向いた所をこすろう！':'ふり返った頭と 肉球の先をこすろう！'
    if(this.remainingClasps) return '金色の留め具をタップして開けよう！'
    if(this.dogMotion>=3.85) return 'ブルブル中！ 止まるとかきやすいよ'
    if(this.dogMotion>=3.15) return '耳が動いた！ もうすぐブルブル'
    if(this.person.id==='dog' && this.remainingItches) return '犬が止まったときに こすろう！'
    if(this.showComboTip && this.elapsed<4.5) return combo.tip
    if(this.fleas.some(f=>f.spec.kind==='captain' && f.phase!=='gone')) return 'ピョン隊長は 二度目の着地をねらえ！'
    if(this.remainingItches && this.remainingFleas) return '着地を待つ間に 光るところをこすれ！'
    return this.remainingItches ? '光るところを こすれ！' : 'ノミは 着地したらタップ！'
  }

  activateFever() {
    if(!this.feverReady) return
    this.charge=0
    this.feverTime=feverDuration
    this.announce('かきかきフィーバー！',1.3,2)
    this.sound('fever')
  }

  private addAction(points: number, charge: number) {
    this.streak=this.chain+1
    this.lastAction=this.elapsed
    this.maxChain=Math.max(this.maxChain,this.streak)
    this.points+=points+Math.min(10,this.streak-1)*25
    if(this.canUseFever && this.feverTime<=0) this.charge=Math.min(100,this.charge+charge)
  }

  private spawnWave() {
    this.fleas=this.fleas.filter(f=>f.phase!=='gone')
    this.itches=this.itches.filter(i=>i.progress<3)
    const wave=this.wave++
    const spots=waveSpots.map((_,i)=>waveSpots[(i+wave*4)%waveSpots.length])
    const count=Math.min(4-this.fleas.length, wave%2===0?2:1)
    for(let i=0;i<count;i++) {
      const route=[spots[i],spots[i+4],spots[i+6]]
      this.fleas.push(this.makeFlea(scout(route,-i*.52)))
    }
    for(const p of spots.slice(2,5)) {
      if(this.itches.length>=5 || this.itches.some(i=>distance(i,p)<31)) continue
      this.itches.push({...p,progress:0,hidden:wave%3===2&&p===spots[2]?scout([spots[0],spots[5],spots[6]]):undefined})
    }
    this.nextWave=this.elapsed+3.8
  }

  private announce(text: string, seconds: number, priority=0) {
    if (!this.message || this.message.priority<=priority) this.message={text,left:seconds,priority}
  }

  update(dt: number) {
    if(this.retryRequired) return
    this.bursts = this.bursts.filter(b=>b.age<1)
    this.bursts.forEach(b=>b.age+=dt)
    this.reaction=Math.max(0,this.reaction-dt)
    this.linkTrail=Math.max(0,this.linkTrail-dt)
    if(this.message) {
      this.message.left-=dt
      if(this.message.left<=0) this.message=undefined
    }
    if(this.done) {
      this.finishTime+=dt
      return
    }
    if(this.act&&this.boardClear) {
      this.intermission+=dt
      if(this.intermission>=(this.mode==='replay'?.52:1.2)) {
        this.actIndex++
        this.startAct()
      }
      return
    }
    if(this.act) {
      this.actSpent+=dt
      if(this.actSpent>=this.act.seconds) {
        this.retryRequired=true
        this.cancel()
        return
      }
    }
    this.elapsed=this.challenge?Math.min(challengeLimit,this.elapsed+dt):this.elapsed+dt
    this.feverTime=Math.max(0,this.feverTime-dt)
    if(this.demon&&!this.hintShown&&!this.gesture&&this.elapsed-this.lastInput>=8) this.pointWithDog()
    if(this.cueTarget&&this.headsAgree&&this.barkCue!==this.cueBeat) {
      this.barkCue=this.cueBeat
      this.sound('dog')
    }
    if(this.challenge) {
      if(this.done) return
      if(this.elapsed>=this.nextWave || (!this.remainingFleas&&!this.remainingItches)) this.spawnWave()
    }
    for(const f of this.fleas) {
      if(f.phase==='gone'||f.phase==='hidden') continue
      f.time+=dt
      if(f.phase==='retreat') {
        if(f.time>=captain.retreatTime) {
          f.phase='hidden'
          const {x,y}=f.spec.hideAt!
          this.itches.push({x,y,progress:0,fugitive:f})
        }
        continue
      }
      if(f.phase==='emerge') {
        if(f.time>=combo.windup) {
          f.time=0
          f.phase='jump'
          this.bursts.push({...f.launchFrom!,age:0,type:'pop'})
          this.announce('バレた！',.48,2)
          this.sound('pop')
        }
        continue
      }
      if(f.phase==='land' && f.time>=(f.comboReady?combo.catchTime:f.spec.land)) {
        f.comboReady=false
        f.from=f.to
        f.to=(f.to+1)%f.spec.route.length
        f.hop=0
        f.launchFrom=undefined
        f.time=0
        f.phase='warning'
      } else if(f.phase==='warning' && f.time>=f.spec.warning) {
        f.phase='jump'
        f.time=0
      } else if(f.phase==='jump' && f.time>=f.spec.jump) {
        f.phase=f.spec.kind==='captain' && f.hop===0?'feint':'land'
        f.time=0
      } else if(f.phase==='feint' && f.time>=.19) {
        f.from=f.to
        f.to=(f.to+1)%f.spec.route.length
        f.hop=1
        f.launchFrom=undefined
        f.time=0
        f.phase='jump'
      }
      if(this.elapsed>=f.nextAdd && f.spec.addedItches && f.added<f.spec.addedItches.length && f.phase==='land') {
        const p=f.spec.addedItches[f.added++]
        this.itches.push({...p,progress:0})
        f.nextAdd+=f.spec.addAfter ?? Infinity
      }
    }
  }

  private pointWithDog() {
    const flea=this.fleas.find(f=>f.phase!=='gone'&&f.phase!=='hidden')
    const target=this.covers.find(c=>!c.opened)??this.clasps.find(c=>!c.opened)??
      this.itches.find(i=>i.progress<3)??(flea?flea.spec.route[flea.to]:undefined)
    if(!target) return
    this.hintShown=true
    this.companionHint={...target,until:this.elapsed+2.2}
    this.announce('わん！ 肉球のそばを見て！',2.2,1)
    this.sound('dog')
  }

  private location(f: Flea) {
    const target=f.spec.route[f.to]
    const from=f.launchFrom ?? f.spec.route[f.from]
    if(f.phase==='warning') return {...from,height:0}
    if(f.phase!=='jump') return {...target,height:0}
    const t=clamp(f.time/f.spec.jump,0,1)
    const height=f.spec.kind==='king'?68:f.spec.emperor?58:f.launchFrom?49:f.hop?44:28
    return {x:from.x+(target.x-from.x)*t,y:from.y+(target.y-from.y)*t,height:Math.sin(t*Math.PI)*height}
  }

  begin(p: Point) {
    if(!this.canPlay) return
    this.lastInput=this.elapsed
    const at={x:p.x-this.dogShake,y:p.y}
    const itch=this.itches.filter(i=>i.progress<3 && distance(i,at)<=this.level.radius)
      .sort((a,b)=>distance(a,p)-distance(b,p))[0]
    const cover=this.covers.find(s=>!s.opened&&Math.abs(s.x-at.x)<35&&Math.abs(s.y-at.y)<23)
    this.gesture={start:p,last:p,itch,cover,extent:0,distance:0,drag:false,started:this.elapsed}
    this.tool=p
  }

  move(p: Point) {
    if(!this.canPlay) return
    this.tool=p
    const g=this.gesture
    if(!g) return
    this.lastInput=this.elapsed
    g.distance+=distance(g.last,p)
    g.last=p
    if(distance(g.start,p)>7 || g.distance>12) g.drag=true
    if(g.cover) {
      if(!g.cover.opened&&(p.x-g.start.x)*g.cover.direction>=22&&Math.abs(p.y-g.start.y)<30) {
        g.cover.opened=true
        this.itches.push({...g.cover.itch,progress:0})
        this.addAction(80,0)
        this.bursts.push({x:g.cover.x,y:g.cover.y,age:0,type:'pop'})
        this.announce('ぺりっ！ 光るところをこすろう',1.25,1)
        this.sound('peel')
      }
      return
    }
    const itch=g.itch
    if(!g.drag || !itch || itch.progress>=3) return
    if(distance(itch,{x:p.x-this.dogShake,y:p.y})>this.level.radius+9) {
      g.axis=undefined
      g.extent=0
      g.start=p
      return
    }
    const dx=p.x-g.start.x, dy=p.y-g.start.y
    const stretch=Math.hypot(dx,dy)
    if(!g.axis) {
      if(stretch>=7) {
        g.axis={x:dx/stretch,y:dy/stretch}
        g.extent=stretch
      }
      return
    }
    const projected=dx*g.axis.x+dy*g.axis.y
    g.extent=Math.max(g.extent,projected)
    if(g.extent-projected<7) return
    g.axis={x:-g.axis.x,y:-g.axis.y}
    g.extent=-projected
    const effect=this.feverTime>0?2.15:1
    const cue=this.cueTarget
    const agreed=cue===itch&&this.headsAgree
    const rhythm=cue?agreed?1.75:cue===itch?1.25:.62:this.dogMotion>=3.85?.4:1
    itch.progress=Math.min(3,itch.progress+effect*rhythm)
    if(itch.progress===3) {
      const link=this.linkCandidate&&this.linkCandidate.until>=this.elapsed&&distance(itch,this.linkCandidate)<104
      this.addAction(link?340:agreed?245:135,link||agreed?35:25)
      if(link) {
        this.linkCandidate=undefined
        this.linkTrail=1.6
      }
      const reveals=!!(itch.hidden||itch.fugitive)
      this.bursts.push({x:itch.x,y:itch.y,age:0,type:'scratch',quietText:reveals})
      this.announce(link?'そこそこ！ 連係':agreed?'四つの頭がそろった！ ボーナス！':'そこそこぉ〜！',1.05,link?2:0)
      this.reaction=1.05
      this.sound(link?'link':'scratch')
      if(itch.hidden||itch.fugitive) this.reveal(itch,itch.fugitive ?? this.makeFlea(itch.hidden!))
    }
  }

  private reveal(origin: Point, f: Flea, comboReady=true) {
    f.phase='emerge'
    f.time=0
    f.hop=0
    f.to=f.spec.hideAt?.firstLanding ?? 0
    f.launchFrom=origin
    f.emerged=true
    f.comboReady=comboReady
    if(!this.fleas.includes(f)) this.fleas.push(f)
  }

  end(p: Point) {
    const g=this.gesture
    if(!g) return
    this.move(p)
    this.gesture=undefined
    if(g.drag || this.done) return
    p={x:p.x-this.dogShake,y:p.y}
    const hit=this.fleas.filter(f=>f.phase==='land'&&f.time>=0&&(!f.emerged||g.started>=this.elapsed-f.time-1e-6))
      .map(f=>({ f, at:this.location(f) }))
      .filter(({f,at})=>distance(p,{x:at.x,y:at.y-4})<=(f.spec.emperor?28:f.spec.kind==='king'?29:f.spec.kind==='captain'?21:18)+this.level.hit)
      .sort((a,b)=>distance(a.at,p)-distance(b.at,p))[0]
    if(hit) {
      const {f,at}=hit
      this.hits++
      f.strikes++
      if(f.spec.emperor&&this.actIndex===1) {
        f.phase='gone'
        this.addAction(160,20)
        this.bursts.push({...at,age:0,type:'retreat'})
        this.announce('皇帝がよろけた！ 仲間が来る！',1.2,3)
        this.sound('retreat')
        return
      }
      if(f.spec.kind==='king' && f.strikes===1) {
        this.addAction(85,0)
        f.from=f.to
        f.to=(f.to+1)%f.spec.route.length
        f.phase='warning'
        f.time=0
        this.fleas.push(
          this.makeFlea(scout([{x:119,y:180},{x:167,y:232},{x:221,y:151}],-.35)),
          this.makeFlea(scout([{x:258,y:247},{x:155,y:161},{x:215,y:227}],-.78)),
        )
        this.bursts.push({...at,age:0,type:'retreat'})
        this.announce('第2形態！ 魔王が手下を呼んだぞ！',2.15,3)
        this.sound('retreat')
        return
      }
      if(f.spec.hideAt && !f.emerged) {
        this.addAction(95,0)
        f.phase='retreat'
        f.time=0
        this.bursts.push({...at,age:0,type:'retreat'})
        this.announce(f.spec.kind==='king'?'最終形態！ 魔王が服の下に逃げた！':captain.retreatLine,captain.retreatTime,3)
        this.sound('retreat')
        return
      }
      f.phase='gone'
      this.defeated++
      if(this.demon&&f.time<=.46) this.linkCandidate={...at,until:this.elapsed+3.2}
      this.addAction(f.comboReady?360:f.spec.hideAt?270:185,36)
      if(f.comboReady) {
        this.combos++
        this.announce('かき出しコンボ！',1.15,2)
        this.sound('combo')
      } else this.sound('hit')
      if(f.spec.emperor) {
        this.itches.push({x:193,y:239,progress:0})
        this.bursts.push({...at,age:0,type:'escape',emperor:true})
        this.announce('皇帝が飛んでいった！ 最後のかゆみをこすろう！',this.mode==='replay'?1.2:2.05,1)
      } else if(f.spec.hideAt) {
        this.bursts.push({...at,age:0,type:'escape'})
        this.announce(f.spec.kind==='king'?'覚えておれ！ 次は足の裏だーっ！':captain.exitLine,2.25,3)
      } else this.bursts.push({...at,age:0,type:f.comboReady?'combo':'hit'})
      return
    }
    const clasp=this.clasps.find(c=>!c.opened&&distance(c,p)<=22)
    if(clasp) {
      if(!this.claspOpen) {
        this.announce('まだ閉じている。肩の合図を待とう！',.68,0)
        return
      }
      clasp.opened=true
      this.addAction(70,0)
      this.reveal(clasp,this.makeFlea(clasp.flea),false)
      this.announce('カチッ！ ノミが飛び出した！',1.25,3)
      this.sound('pop')
    } else if(!g.itch && !g.cover && this.remainingFleas) {
      this.misses++
      this.streak=0
      this.bursts.push({...p,age:0,type:'miss'})
      this.sound('miss')
    }
  }

  cancel() { this.gesture=undefined }

  draw(c: CanvasRenderingContext2D) {
    if(!this.base) {
      this.base=document.createElement('canvas')
      this.base.width=384
      this.base.height=344
      const art=this.base.getContext('2d')!
      if(this.demon) demonBack(art,this.person)
      else battleBase(art,this.person)
    }
    const reduced=this.reduced()
    const breathLift=this.breath>=.8&&this.breath<2.83?Math.round(Math.min(1,(this.breath-.8)*2.2)*5):0
    const ease=reduced?0:this.finishTime>.35?3:this.reaction>0?Math.round(Math.sin(Math.min(1,this.reaction)*Math.PI)*3):-breathLift
    const shake=reduced?0:this.dogShake
    box(c,this.person.id==='dog'?'#374e44':'#253b3d',0,0,384,344)
    c.drawImage(this.base,shake,ease)
    if(this.person.id==='dog') {
      dogTail(c,this.elapsed,shake)
      if(this.dogMotion>=3.15) {
        for(const x of [113,263]) {
          box(c,'#f9de9d',x,59,9,2)
          box(c,'#f9de9d',x+3,53,2,6)
        }
      }
    }
    if(this.feverTime>0) {
      const palette=['#ffd16e','#f28b70','#fff0ab']
      for(let i=0;i<(reduced?0:20);i++) {
        const phase=(feverDuration-this.feverTime)*1.4+i*.314
        const x=192+Math.cos(phase)*(169+Math.sin(phase*3)*12)
        const y=170+Math.sin(phase)*149
        const color=palette[i%palette.length]
        box(c,color,x-4,y,9,2)
        box(c,color,x,y-4,2,9)
      }
      box(c,'#f2a555',0,0,384,4)
      box(c,'#fff0a2',3,3,378,2)
      box(c,'#f2a555',0,340,384,4)
      if(this.demon) {
        paw(c,29,317)
        label(c,'わん！',56,320,'#ffe2a0',10)
      }
    }
    c.save()
    c.translate(shake,0)
    const spot=this.cueTarget
    if(spot) {
      const head=spot.x<153?126:spot.x>232?258:193
      for(const hx of this.headsAgree?[126,193,258]:[head]) {
        const side=spot.x<hx?-1:1
        box(c,'#3c2e47',hx+side*13-8,85,17,12)
        box(c,'#ffe4aa',hx+side*16-6,89,13,4)
        box(c,'#5e4257',hx+side*17,89,4,4)
      }
      paw(c,spot.x,spot.y-27,this.headsAgree?'#ffe7a2':'#f3d9ad')
    }
    for(const cover of this.covers) {
      if(!cover.opened) this.clothEdge(c,cover,reduced)
    }
    for(const clasp of this.clasps) {
      const {x,y,opened}=clasp
      if(!opened) {
        poly(c,'#3d4057',[x-30,y-24,x+21,y-23,x+28,y+7,x+17,y+31,x-27,y+21])
        poly(c,this.person.id==='royal'?'#ba686f':'#849db0',[x-27,y-21,x+17,y-20,x+24,y+6,x+15,y+26,x-24,y+18])
        box(c,'#484457',x-15,y-10,30,22)
        box(c,this.claspOpen?'#e4b568':'#a39085',x-11,y-8,22,17)
        box(c,this.claspOpen?'#ffed9d':'#c9ac95',x-8,y-6,16,3)
        box(c,'#79505a',x-4,y,8,6)
        if(this.person.id==='knight'&&this.breath>=.78&&this.breath<2.83) {
          const rise=this.claspOpen?13:7
          for(const side of [-1,1]) {
            const xx=x+side*22
            poly(c,'#ffe2a8',[xx-5,y-6-rise,xx,y-13-rise,xx+5,y-6-rise,xx+2,y-6-rise,xx+2,y+1-rise,xx-2,y+1-rise,xx-2,y-6-rise])
          }
          if(this.claspOpen) {
            box(c,'#ffecab',x-14,y-13,28,2)
            box(c,'#ffecab',x-14,y+11,28,2)
          }
        } else if(Math.floor(this.elapsed*4)%3===0&&this.claspOpen) box(c,'#fff2a8',x+15,y-13,4,4)
      } else {
        box(c,'#4d4357',x-10,y-6,6,15)
        box(c,'#b89868',x+7,y-5,7,12)
      }
    }
    for(const i of this.itches) {
      if(i.progress>=3) continue
      const pulse=Math.floor(this.elapsed*5)%3
      const engaged=this.gesture?.itch===i && this.gesture.drag
      const size=(engaged?18:15)+pulse
      c.save()
      const hidden=!!(i.hidden||i.fugitive)
      const twitch=hidden?Math.floor(this.elapsed*18)%22:0
      const shake=twitch>=17?(twitch%2===0?-2:2):0
      c.translate(i.x+shake,i.y+ease)
      c.globalAlpha=.22
      poly(c,'#ffe5a0',[0,-size,size,-4,size,4,0,size,-size,4,-size,-4])
      c.globalAlpha=1
      if(hidden) {
        this.cloth(c,0,0,twitch>=17)
        if(twitch>=17) {
          box(c,'#402a4d',-10,-16,7,8)
          box(c,'#402a4d',4,-18,6,9)
          box(c,'#fff2b1',-7,-13,2,2)
          box(c,'#fff2b1',5,-14,2,2)
        }
      }
      for(const offset of [-7,0,7]) {
        box(c,'#85504c',offset-1,-8,5,17)
        box(c,'#fff2ad',offset,-7,2,5)
        box(c,'#ffde88',offset+2,-3,2,5)
        box(c,'#fff2ad',offset,2,2,5)
      }
      box(c,'#f7d783',-1,-15,3,3)
      box(c,'#ffe6a1',-14,-1,2,3)
      box(c,'#ffe6a1',14,-1,2,3)
      box(c,'#4c3a43',-15,20,30,6)
      box(c,'#9a6d59',-14,21,28,4)
      box(c,'#fff2ae',-14,21,Math.floor(28*i.progress/3),4)
      c.restore()
    }
    for(const f of this.fleas) {
      if(f.phase==='hidden'||f.phase==='gone'||f.time<0) continue
      if(f.phase==='retreat') {
        const from=f.spec.route[f.to]
        const hide=f.spec.hideAt!
        const t=Math.min(1,f.time/.5)
        this.cloth(c,hide.x,hide.y+ease,t>=1&&Math.floor(f.time*19)%2===0)
        if(t<1) fleaArt(c,from.x+(hide.x-from.x)*t,from.y+(hide.y-from.y)*t-Math.sin(t*Math.PI)*23+ease,true,(f.spec.kind==='king'?1.7:1)*(1-t*.7),t*1.3)
        continue
      }
      if(f.phase==='emerge') {
        this.cloth(c,f.launchFrom!.x,f.launchFrom!.y+ease,Math.floor(f.time*30)%2===0)
        continue
      }
      const {x,y,height}=this.location(f)
      const captain=f.spec.kind==='captain'
      const king=f.spec.kind==='king'
      const lastLanding=!!(f.spec.hideAt&&f.emerged)
      if(f.spec.veil&&f.phase==='warning') {
        this.veilArt(c,f,ease,reduced)
        continue
      }
      if(f.phase!=='land') {
        const dest=f.spec.route[f.to]
        if(captain && lastLanding && f.hop===0) {
          box(c,'#452d47',dest.x-11,dest.y+ease+4,22,5)
        } else if(!f.spec.veil) {
          this.marker(c,dest.x,dest.y+ease,captain,f.phase==='warning'&&captain?'1':'')
          if(captain && f.hop===0) {
            const next=f.spec.route[(f.to+1)%f.spec.route.length]
            this.marker(c,next.x,next.y+ease,true,'2')
          }
        }
      }
      box(c,'#392a3b99',x-10,y+ease+5,20,4)
      if(f.phase==='land') {
        if(f.comboReady||lastLanding) this.landingRing(c,x,y+ease,f.comboReady?1-f.time/combo.catchTime:0)
        else if(f.spec.veil) this.landingRing(c,x,y+ease,0)
        else if(f.spec.emperor) this.landingRing(c,x,y+ease,0)
        const offset=king||f.spec.emperor?29:14
        box(c,'#ffe1a5',x-offset,y+ease+8,5,2)
        box(c,'#ffe1a5',x+offset-4,y+ease+8,5,2)
      }
      if(king) {
        if(this.elapsed<1.65||f.strikes>0) {
          const orbit=this.elapsed*3
          for(let i=0;i<5;i++) {
            const phase=orbit+i*1.26
            box(c,f.strikes===0?'#e081a0':'#f2b370',x+Math.cos(phase)*33,y+ease-height+Math.sin(phase)*26,3,3)
          }
        }
        for(const offset of [-1,1]) box(c,'#c57c9b',x+offset*22,y+ease-height-6,5,3)
      }
      if(f.spec.emperor) emperorArt(c,x,y+ease-height)
      else fleaArt(c,x,y+ease-height,captain||king,king?1.72:1)
    }
    if(this.companionHint&&this.companionHint.until>this.elapsed) {
      paw(c,clamp(this.companionHint.x-28,18,366),clamp(this.companionHint.y-21,22,321))
    }
    for(const b of this.bursts) {
      if(b.type==='hit'||b.type==='combo') fleaArt(c,b.x+44*b.age,b.y-102*b.age+66*b.age*b.age,false,Math.max(.3,1-b.age),b.age*12)
      if(b.type==='escape') {
        if(b.emperor) emperorArt(c,b.x+415*b.age,b.y-193*b.age)
        else fleaArt(c,b.x+415*b.age,b.y-193*b.age,true,Math.max(.5,1-b.age),b.age*8)
      }
      if(b.type!=='miss'&&!reduced) {
        for(let k=0;k<9;k++) {
          const a=k*Math.PI*2/9
          const spread=6+b.age*45
          const color=k%3===0?'#fff2bb':b.type==='combo'?'#a8efd3':b.type==='scratch'?'#e7bd6f':'#f39581'
          box(c,color,b.x+Math.cos(a)*spread,b.y+Math.sin(a)*spread,3,3)
        }
      }
      if(b.type!=='pop'&&!b.quietText) {
        const text=b.type==='combo'?'コンボ！':b.type==='scratch'?'すっきり！':b.type==='miss'?'スカッ':'ペチッ！'
        label(c,text,b.x,b.y-23-b.age*21,b.type==='combo'?'#c4ffe3':'#fff6c7',14)
      }
    }
    c.restore()
    if(this.actIndex===2&&!this.done&&this.elapsed-(this.checkpoint?.elapsed??0)<2.7) {
      paw(c,40,282)
      paw(c,345,282)
    }
    const linger=this.demon&&this.done&&this.finishTime<.42
    if(!this.done||linger) {
      const {x,y}=this.tool
      const tx=x+(this.demon?41:0),ty=y+(this.demon?25:0)
      if(this.demon&&!reduced&&(this.linkTrail>0||(this.feverTime>0&&this.gesture))) {
        for(let i=1;i<=6;i++) box(c,i%2?'#f9cc7e':'#ffe7a5',tx+i*5,ty+i*4,7-i*.5,3)
      }
      if(this.gesture) {
        box(c,'#fff4b1',x-14,y,5,1)
        box(c,'#fff4b1',x+10,y,5,1)
      }
      c.globalAlpha=this.gesture?1:.73
      toolArt(c,clamp(tx,6,356),clamp(ty,12,305),!!this.gesture)
      c.globalAlpha=1
    } else {
      label(c,'✦',123,75,'#ffd98f',17)
      label(c,'✦',267,91,'#ffd98f',21)
      if(this.demon&&this.finishTime>.15) victoryArt(c,this.person,this.finishTime,reduced)
    }
  }

  private veilArt(c: CanvasRenderingContext2D,f: Flea,ease: number,reduced: boolean) {
    const start=f.spec.route[f.from],end=f.spec.route[f.to]
    const active=Math.min(2,Math.floor(f.time/f.spec.warning*3))
    for(const [i,t] of [.27,.62,1].entries()) {
      const x=Math.round(start.x+(end.x-start.x)*t)
      const y=Math.round(start.y+(end.y-start.y)*t)+ease
      const sway=!reduced&&i===active?Math.round(Math.sin(f.time*35)*4):0
      if(f.spec.veil==='leaf') {
        poly(c,'#1d303e',[x-17,y+6,x-13,y-7,x+8,y-12+sway,x+16,y-3,x+10,y+8,x-7,y+11])
        poly(c,i===active?'#a9d792':'#638f76',[x-14,y+4,x-10,y-6,x+8,y-9+sway,x+13,y-3,x+8,y+5,x-6,y+8])
        box(c,'#446b66',x-9,y+2,19,2)
      } else {
        poly(c,'#412a52',[x-19,y+5,x-10,y-9+sway,x,y-4,x+10,y-10+sway,x+19,y+5,x+10,y+2,x,y+5,x-10,y+1])
        poly(c,i===active?'#ffe1a0':'#ad7d94',[x-15,y+3,x-9,y-6+sway,x,y-1,x+9,y-6+sway,x+15,y+3,x+8,y,x,y+2,x-8,y-1])
      }
      if(i===active) {
        box(c,'#fff1b4',x-1,y-16+sway,3,5)
        box(c,'#fff1b4',x+7,y-14+sway,2,3)
      }
    }
  }

  private clothEdge(c: CanvasRenderingContext2D,cover: Cover,reduced: boolean) {
    const {x,y,direction}=cover
    const move=reduced?0:Math.round(Math.sin(this.elapsed*9)*4)
    c.save()
    c.translate(x,y)
    c.scale(direction,1)
    poly(c,'#4f4255',[-10,-14,49,-14,65,0,61,14,-10,15,-19,6])
    poly(c,'#ddaf91',[-7,-12,49,-12,62,1,58,12,-8,12,-17,4])
    box(c,'#f7dfae',-9,-9,54,4)
    box(c,'#a67a77',7,7,47,3)
    poly(c,'#fff2c1',[-24,-9+move,-8,-10,-7,12,-24,11+move,-29,3+move])
    box(c,'#946875',-23,3+move,12,2)
    poly(c,'#67495e',[-12,-1,8,-1,8,-6,20,1,8,8,8,3,-12,3])
    c.restore()
    if(!this.covers.some(c=>c.opened)&&cover===this.covers[0]) {
      const demo=reduced?4:Math.floor(this.elapsed*22)%32-9
      const px=x+direction*demo,py=y+34
      poly(c,'#513953',[px-6,py+4,px-7,py-7,px-2,py-7,px-2,py-17,px+3,py-17,px+4,py-7,px+10,py-7,px+11,py+6])
      box(c,'#ffe3aa',px-1,py-15,3,19)
      box(c,'#ffe3aa',px+1,py-5,8,9)
    }
  }

  private cloth(c: CanvasRenderingContext2D,x: number,y: number,shake: boolean) {
    const w=shake?22:18
    poly(c,'#5d3b57',[x-w,y+9,x-10,y-8,x-4,y-12,x+5,y-12,x+11,y-7,x+w,y+9,x+11,y+13,x-11,y+13])
    box(c,'#dcb4a2',x-6,y-10,12,2)
    box(c,'#dcb4a2',x-w-3,y+1,3,6)
    box(c,'#dcb4a2',x+w,y+1,3,6)
  }

  private landingRing(c: CanvasRenderingContext2D,x: number,y: number,remaining: number) {
    const rim=remaining>0?'#adf4d5':'#fff0b9'
    const points=[x-22,y-7,x-17,y-17,x+17,y-17,x+22,y-7,x+22,y+7,x+17,y+14,x-17,y+14,x-22,y+7]
    poly(c,'#352b40',points)
    poly(c,rim,[x-20,y-6,x-16,y-15,x+16,y-15,x+20,y-6,x+20,y+6,x+16,y+12,x-16,y+12,x-20,y+6])
    poly(c,'#574155',[x-17,y-5,x-14,y-12,x+14,y-12,x+17,y-5,x+17,y+5,x+14,y+9,x-14,y+9,x-17,y+5])
    if(remaining>0) box(c,rim,x-13,y+23,Math.ceil(26*remaining),2)
    c.font='bold 12px "Yu Gothic", sans-serif'
    c.textAlign='center'
    c.textBaseline='middle'
    c.lineWidth=3
    c.strokeStyle='#352738'
    c.strokeText('いま！',x,y-24)
    label(c,'いま！',x,y-24,rim,12)
  }

  private marker(c: CanvasRenderingContext2D,x: number,y: number,captain: boolean,number: string) {
    const color=captain?'#f6b067':'#ff817e'
    poly(c,'#643c4c',[x,y-14,x+15,y,x,y+14,x-15,y])
    poly(c,color,[x,y-11,x+12,y,x,y+11,x-12,y])
    poly(c,'#643c4c',[x,y-7,x+8,y,x,y+7,x-8,y])
    if(number) label(c,number,x,y,'#fff2c0',11)
    else box(c,color,x-1,y-1,3,3)
  }
}


