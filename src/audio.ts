type Volumes = { music: number; effects: number }
type Effect = 'hit' | 'scratch' | 'miss' | 'step' | 'select' | 'win' | 'pop' | 'combo' | 'retreat' | 'level' | 'fever'
const scores: Record<string, number[]> = {
  town: [67,0,71,74,72,0,71,69,67,0,64,67,62,0,64,66,67,0,71,76,74,0,72,71,69,0,72,69,67,0,62,66],
  battle: [57,0,60,57,64,60,0,67,59,0,62,59,65,62,0,69],
  boss: [48,55,60,55,50,57,62,57,51,58,63,58,50,53,62,65],
  challenge: [62,66,69,74,64,67,71,76,66,69,73,78,69,71,74,81],
  title: [60,0,64,67,69,0,67,64,62,0,65,69,67,0,64,62],
}
const effects: Record<Effect, number[]> = {
  hit: [73,44], scratch: [72,76,81], miss: [54,46], step: [43], select: [67,72], win: [67,71,74,79],
  pop: [59,78,84], combo: [69,88,93], retreat: [77,64,51], level: [72,76,79,84,88],
  fever: [64,71,76,83,88,95],
}
export class Audio {
  private ctx?: AudioContext
  private music?: GainNode
  private fx?: GainNode
  private last=0
  private note=0
  private theme=''
  private volumes: Volumes={music:.32,effects:.65}

  setup(volumes: Volumes) {
    this.volumes=volumes
    if(this.ctx&&this.music&&this.fx) {
      this.music.gain.setTargetAtTime(volumes.music*.19,this.ctx.currentTime,.03)
      this.fx.gain.setTargetAtTime(volumes.effects*.28,this.ctx.currentTime,.03)
    }
  }

  unlock() {
    try {
      if(!this.ctx) {
        const AudioClass=window.AudioContext ??
          (window as Window & {webkitAudioContext?: typeof AudioContext}).webkitAudioContext
        if(!AudioClass) return
        this.ctx=new AudioClass()
        this.music=this.ctx.createGain()
        this.fx=this.ctx.createGain()
        this.music.connect(this.ctx.destination)
        this.fx.connect(this.ctx.destination)
        this.setup(this.volumes)
      }
      if(this.ctx.state!=='running') void this.ctx.resume().catch(()=>{})
    } catch {
      // The stage also communicates every cue visually.
    }
  }

  private tone(note: number,start: number,length: number,volume: number,type: OscillatorType,out: GainNode) {
    if(!this.ctx) return
    const osc=this.ctx.createOscillator()
    const amp=this.ctx.createGain()
    osc.type=type
    osc.frequency.value=440*2**((note-69)/12)
    amp.gain.setValueAtTime(.0001,start)
    amp.gain.exponentialRampToValueAtTime(volume,start+.008)
    amp.gain.exponentialRampToValueAtTime(.0001,start+length)
    osc.connect(amp).connect(out)
    osc.start(start)
    osc.stop(start+length)
  }

  play(effect: Effect) {
    if(!this.ctx||this.ctx.state!=='running'||!this.fx||this.volumes.effects===0) return
    const now=this.ctx.currentTime+.012
    const jingle=effect==='win'||effect==='level'||effect==='fever'
    effects[effect].forEach((note,i)=>{
      const impact=effect==='hit'||i===0&&(effect==='combo'||effect==='retreat')
      this.tone(note,now+i*(jingle?.075:.055),jingle?.18:.095,.34,impact?'square':'triangle',this.fx!)
    })
  }

  tick(theme: string,paused: boolean) {
    if(!this.ctx||this.ctx.state!=='running'||!this.music||paused) return
    const now=this.ctx.currentTime
    const score=scores[theme]??scores.title
    if(theme!==this.theme) {
      this.theme=theme
      this.note=0
      this.last=now
    }
    if(this.last<now-.3) this.last=now
    if(this.last>now+.06) return
    const start=Math.max(this.last,now+.01)
    const note=score[this.note%score.length]
    if(note && this.volumes.music>0) this.tone(note,start,.22,.30,'triangle',this.music)
    if(this.note%4===0 && this.volumes.music>0) this.tone((note||60)-24,start,.3,.17,'triangle',this.music)
    this.note++
    this.last=start+(theme==='challenge'?.15:theme==='battle'||theme==='boss'?.185:.24)
  }
}
