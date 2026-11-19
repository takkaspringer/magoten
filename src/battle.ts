import { battleBase, box, fleaArt, label, poly, toolArt } from './art'
import { captain, combo, levels } from './data'
import type { FleaSpec, ItchSpec, Point, TownPerson } from './data'

type Phase = 'warning' | 'jump' | 'feint' | 'land' | 'retreat' | 'hidden' | 'emerge' | 'gone'
type Flea = {
  spec: FleaSpec
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
}
type Itch = ItchSpec & { progress: number; fugitive?: Flea }
type Gesture = {
  start: Point
  last: Point
  itch?: Itch
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
}
export type BattleEvent = 'hit' | 'scratch' | 'miss' | 'retreat' | 'pop' | 'combo'

const distance = (a: Point, b: Point) => Math.hypot(a.x-b.x,a.y-b.y)
const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(value, low))

export class Battle {
  elapsed = 0
  hits = 0
  misses = 0
  combos = 0
  private finishTime = 0
  private message?: { text: string; left: number; priority: number }
  private reaction = 0
  private tool: Point = {x: 312, y: 273}
  private gesture?: Gesture
  private bursts: Burst[] = []
  private fleas: Flea[]
  private itches: Itch[]
  private base?: HTMLCanvasElement
  private level: (typeof levels)[number]

  constructor(public person: TownPerson, level: number, public replay: boolean, public trial: boolean,
    private sound: (event: BattleEvent) => void, private showComboTip: boolean) {
    this.level = levels[level]
    this.itches = person.itches.map(p=>({...p,progress:0}))
    this.fleas = person.fleas.map(spec=>({
      spec, phase: spec.kind==='captain'?'warning':'land', time: spec.start ?? 0,
      from: spec.kind==='captain'?spec.route.length-1:0, to: 0, hop: 0, emerged:false, comboReady:false,
      added: 0, nextAdd: spec.addAfter ?? Infinity,
    }))
  }

  get remainingFleas() { return this.fleas.filter(f=>f.phase!=='gone').length }
  get remainingItches() { return this.itches.filter(i=>i.progress<3).length }
  get done() { return this.remainingFleas===0 && this.remainingItches===0 }
  get readyForResult() { return this.finishTime>=1.06 && !this.message }

  get hint() {
    if(this.message) return this.message.text
    if(this.done) return '背中、すっきり！'
    if (this.person.id==='baker') return this.remainingFleas ? 'ノミは 着地したらタップ！' : '光るところを 左右か上下にこすれ！'
    if(this.fleas.some(f=>f.phase==='land'&&(f.comboReady || (f.spec.hideAt&&f.emerged)))) return 'いま！ 輪のノミをたたけ！'
    if(this.fleas.some(f=>f.phase==='hidden')) return '震えるかゆみをこすって 隊長を追い出せ！'
    if(this.showComboTip && this.elapsed<4.5) return combo.tip
    if(this.fleas.some(f=>f.spec.kind==='captain' && f.phase!=='gone')) return 'ピョン隊長は 二度目の着地をねらえ！'
    if(this.remainingItches && this.remainingFleas) return '着地を待つ間に 光るところをこすれ！'
    return this.remainingItches ? '光るところを こすれ！' : 'ノミは 着地したらタップ！'
  }

  private announce(text: string, seconds: number, priority=0) {
    if (!this.message || this.message.priority<=priority) this.message={text,left:seconds,priority}
  }

  update(dt: number) {
    this.bursts = this.bursts.filter(b=>b.age<1)
    this.bursts.forEach(b=>b.age+=dt)
    this.reaction=Math.max(0,this.reaction-dt)
    if(this.message) {
      this.message.left-=dt
      if(this.message.left<=0) this.message=undefined
    }
    if(this.done) {
      this.finishTime+=dt
      return
    }
    this.elapsed+=dt
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

  private location(f: Flea) {
    const target=f.spec.route[f.to]
    const from=f.launchFrom ?? f.spec.route[f.from]
    if(f.phase==='warning') return {...from,height:0}
    if(f.phase!=='jump') return {...target,height:0}
    const t=clamp(f.time/f.spec.jump,0,1)
    const height=f.launchFrom?49:f.hop?44:28
    return {x:from.x+(target.x-from.x)*t,y:from.y+(target.y-from.y)*t,height:Math.sin(t*Math.PI)*height}
  }

  begin(p: Point) {
    if(this.done) return
    const itch=this.itches.filter(i=>i.progress<3 && distance(i,p)<=this.level.radius)
      .sort((a,b)=>distance(a,p)-distance(b,p))[0]
    this.gesture={start:p,last:p,itch,extent:0,distance:0,drag:false,started:this.elapsed}
    this.tool=p
  }

  move(p: Point) {
    if(this.done) return
    this.tool=p
    const g=this.gesture
    if(!g) return
    g.distance+=distance(g.last,p)
    g.last=p
    if(distance(g.start,p)>7 || g.distance>12) g.drag=true
    const itch=g.itch
    if(!g.drag || !itch || itch.progress>=3) return
    if(distance(itch,p)>this.level.radius+9) {
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
    itch.progress=Math.min(3,itch.progress+this.level.gain)
    if(itch.progress===3) {
      const reveals=!!(itch.hidden||itch.fugitive)
      this.bursts.push({x:itch.x,y:itch.y,age:0,type:'scratch',quietText:reveals})
      this.announce('そこそこぉ〜！',1.05)
      this.reaction=1.05
      this.sound('scratch')
      if(reveals) this.reveal(itch)
    }
  }

  private reveal(itch: Itch) {
    const f: Flea = itch.fugitive ?? {
      spec:itch.hidden!, phase:'emerge', time:0, from:0, to:0, hop:0,
      added:0, nextAdd:Infinity, emerged:true, comboReady:true,
    }
    f.phase='emerge'
    f.time=0
    f.hop=0
    f.to=f.spec.hideAt?.firstLanding ?? 0
    f.launchFrom=itch
    f.emerged=true
    f.comboReady=true
    if(!itch.fugitive) this.fleas.push(f)
  }

  end(p: Point) {
    const g=this.gesture
    if(!g) return
    this.move(p)
    this.gesture=undefined
    if(g.drag || this.done) return
    const hit=this.fleas.filter(f=>f.phase==='land'&&f.time>=0&&(!f.emerged||g.started>=this.elapsed-f.time-1e-6))
      .map(f=>({ f, at:this.location(f) }))
      .filter(({f,at})=>distance(p,{x:at.x,y:at.y-4})<=(f.spec.kind==='captain'?21:18))
      .sort((a,b)=>distance(a.at,p)-distance(b.at,p))[0]
    if(hit) {
      const {f,at}=hit
      this.hits++
      if(f.spec.hideAt && !f.emerged) {
        f.phase='retreat'
        f.time=0
        this.bursts.push({...at,age:0,type:'retreat'})
        this.announce(captain.retreatLine,captain.retreatTime,3)
        this.sound('retreat')
        return
      }
      f.phase='gone'
      if(f.comboReady) {
        this.combos++
        this.announce('かき出しコンボ！',1.15,2)
        this.sound('combo')
      } else this.sound('hit')
      if(f.spec.hideAt) {
        this.bursts.push({...at,age:0,type:'escape'})
        this.announce(captain.exitLine,2.25,3)
      } else this.bursts.push({...at,age:0,type:f.comboReady?'combo':'hit'})
    } else if(!g.itch && this.remainingFleas) {
      this.misses++
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
      battleBase(this.base.getContext('2d')!,this.person)
    }
    const ease=this.reaction>0 ? Math.round(Math.sin(Math.min(1,this.reaction)*Math.PI)*3) : 0
    box(c,'#253b3d',0,0,384,344)
    c.drawImage(this.base,0,ease)
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
        if(t<1) fleaArt(c,from.x+(hide.x-from.x)*t,from.y+(hide.y-from.y)*t-Math.sin(t*Math.PI)*23+ease,true,1-t*.7,t*1.3)
        continue
      }
      if(f.phase==='emerge') {
        this.cloth(c,f.launchFrom!.x,f.launchFrom!.y+ease,Math.floor(f.time*30)%2===0)
        continue
      }
      const {x,y,height}=this.location(f)
      const captain=f.spec.kind==='captain'
      const lastLanding=!!(f.spec.hideAt&&f.emerged)
      if(f.phase!=='land') {
        const dest=f.spec.route[f.to]
        if(lastLanding && f.hop===0) {
          box(c,'#452d47',dest.x-11,dest.y+ease+4,22,5)
        } else {
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
        box(c,'#ffe1a5',x-14,y+ease+8,5,2)
        box(c,'#ffe1a5',x+10,y+ease+8,5,2)
      }
      fleaArt(c,x,y+ease-height,captain)
    }
    for(const b of this.bursts) {
      if(b.type==='hit'||b.type==='combo') fleaArt(c,b.x+44*b.age,b.y-102*b.age+66*b.age*b.age,false,Math.max(.3,1-b.age),b.age*12)
      if(b.type==='escape') fleaArt(c,b.x+415*b.age,b.y-193*b.age,true,Math.max(.5,1-b.age),b.age*8)
      if(b.type!=='miss') {
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
    if(!this.done) {
      const {x,y}=this.tool
      if(this.gesture) {
        box(c,'#fff4b1',x-14,y,5,1)
        box(c,'#fff4b1',x+10,y,5,1)
      }
      c.globalAlpha=this.gesture?1:.73
      toolArt(c,clamp(x,6,356),clamp(y,12,305),!!this.gesture)
      c.globalAlpha=1
    } else {
      label(c,'✦',123,75,'#ffd98f',17)
      label(c,'✦',267,91,'#ffd98f',21)
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


