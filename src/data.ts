export type Point = { x: number; y: number }
export type Rect = Point & { w: number; h: number }
export type ItchSpec = Point & { hidden?: FleaSpec }
export type FleaSpec = {
  kind: 'normal' | 'captain' | 'king'
  route: Point[]
  warning: number
  jump: number
  land: number
  start?: number
  addAfter?: number
  addedItches?: Point[]
  hideAt?: Point & { firstLanding: number }
}
export type Line = { speaker: string; text: string }
export type ClaspSpec = Point & { flea: FleaSpec }
export type TownPerson = {
  id: string
  name: string
  district: string
  at: Point
  entry: Line[]
  rescued: string
  locked?: string
  shirt: [string, string, string]
  hair: string
  xp: number
  targets: { gold: number; silver: number; silverMisses: number }
  itches: ItchSpec[]
  fleas: FleaSpec[]
  clasps?: ClaspSpec[]
}

export const opening = [
  '俺はつまらない所で命を落としてしまった勇者。',
  '気が付いたら、',
  'え、孫の手に転生してるじゃん！',
  '誰か、背中ぁー！',
]

export const finale: Line[] = [
  {speaker:'王様', text:'そなたに伝説の勇者の称号を授けよう！'},
  {speaker:'勇者', text:'で、人間には戻れるんですか？'},
  {speaker:'王様', text:'それは無理じゃ。'},
  {speaker:'勇者', text:'おい！！'},
]

export const combo = {
  windup: .42,
  catchTime: 1.55,
  timeBonus: 10,
  tip: 'こすると、ノミが出てくるぞ！',
}

export const captain = {
  retreatTime: 1.7,
  retreatLine: 'そ、その背中はわしの城だぞ！',
  exitLine: '背中は返す！ 王座は返さぬ！',
}

export const cityY = 576
const city = (x: number, y: number) => ({x,y:y+cityY})
export const world = { w: 1056, h: 864+cityY, start: city(206,625) }
export const districts = [
  { name: '村の広場', ...city(255,608), color: '#f6cc87' },
  { name: '商店街', ...city(772,499), color: '#abdfaf' },
  { name: '公園', ...city(627,317), color: '#c3df96' },
  { name: '城門', ...city(524,231), color: '#b9dbe9' },
  { name: '城の中庭', x: 524, y: 566, color: '#f6deb0' },
  { name: '玉座の間', x: 524, y: 241, color: '#fff0ac' },
]

const cityBuildings = [
  { x: 66, y: 470, w: 132, h: 102, style: 'bakery' },
  { x: 340, y: 499, w: 115, h: 92, style: 'house' },
  { x: 90, y: 690, w: 115, h: 101, style: 'house' },
  { x: 350, y: 717, w: 135, h: 95, style: 'house' },
  { x: 110, y: 205, w: 146, h: 125, style: 'house' },
  { x: 295, y: 220, w: 105, h: 101, style: 'house' },
  { x: 725, y: 317, w: 126, h: 111, style: 'market' },
  { x: 876, y: 360, w: 96, h: 100, style: 'house' },
  { x: 790, y: 630, w: 118, h: 110, style: 'house' },
  { x: 550, y: 679, w: 121, h: 106, style: 'house' },
  { x: 683, y: 113, w: 115, h: 98, style: 'house' },
]
export const buildings = cityBuildings.map(b=>({...b,y:b.y+cityY}))
export const gate = {...city(430,88),w:182,h:109,style:'gate'}
export const gateBarrier: Rect = {x:487,y:gate.y+14,w:68,h:gate.h-14}

const cityRailings: Rect[] = [
  { x: 66, y: 433, w: 111, h: 10 }, { x: 266, y: 714, w: 61, h: 10 },
  { x: 695, y: 564, w: 81, h: 10 }, { x: 855, y: 564, w: 95, h: 10 },
  { x: 310, y: 159, w: 94, h: 10 }, { x: 640, y: 159, w: 35, h: 10 },
]
export const railings = cityRailings.map(r=>({...r,y:r.y+cityY}))

const cityTrees: Point[] = [
  {x:60,y:378},{x:103,y:365},{x:322,y:453},{x:369,y:420},{x:67,y:638},
  {x:55,y:764},{x:247,y:797},{x:925,y:692},{x:960,y:747},{x:725,y:784},
  {x:677,y:288},{x:890,y:237},{x:945,y:253},{x:74,y:155},{x:208,y:133},
  {x:258,y:126},{x:340,y:94},{x:702,y:77},{x:824,y:94},{x:937,y:104},
  {x:562,y:323},{x:659,y:334},{x:695,y:407},{x:560,y:410},
]
export const treeSpots = cityTrees.map(t=>city(t.x,t.y))

export const obstacles: Rect[] = [
  ...buildings.map(({x, y, w, h}) => ({ x: x + 4, y: y + 12, w: w - 8, h: h - 12 })),
  ...railings,
  ...treeSpots.map(({x, y}) => ({x: x - 7, y: y - 6, w: 14, h: 12})),
  {...city(249,657),w:54,h:36},
  {...city(944,20),w:112,h:147},
  {x:0,y:gate.y+17,w:473,h:25}, {x:569,y:gate.y+17,w:487,h:25},
  {x:430,y:gate.y,w:52,h:gate.h}, {x:561,y:gate.y,w:51,h:gate.h},
  {x:0,y:288,w:483,h:39}, {x:568,y:288,w:488,h:39},
  {x:0,y:20,w:319,h:268}, {x:736,y:20,w:320,h:268},
  {x:362,y:435,w:76,h:56}, {x:616,y:435,w:76,h:56},
  {x:484,y:70,w:84,h:52},
]

const heroLine = (text: string): Line => ({speaker:'勇者',text})
const say = (speaker: string, text: string): Line => ({speaker,text})
export const scout = (route: Point[], start=0): FleaSpec => ({kind:'normal',route,start,warning:.52,jump:.4,land:1.43})

export const people: TownPerson[] = [
  {
    id: 'baker', name: 'パン屋', district: '村の広場', at: city(270,575),
    entry: [say('パン屋','背中がかゆくて、パンを焼いてる場合じゃない！'),heroLine('勇者の最初の仕事が背中かきかよ！')],
    rescued: 'ありがとう！ 今ならパンも背中も、焼きたてだ！',
    shirt: ['#b87149','#eaa66a','#733a39'], hair: '#7d4134', xp: 100,
    targets: {gold: 28, silver: 50, silverMisses: 3},
    itches: [{x: 229, y: 229}],
    fleas: [{
      kind: 'normal', route: [{x: 157, y: 169},{x: 111, y: 213},{x: 246, y: 145},{x: 274, y: 200}],
      warning: 0.7, jump: 0.49, land: 2.95, start: 0.45,
    }],
  },
  {
    id: 'grocer', name: '八百屋', district: '商店街', at: city(783,461),
    entry: [say('八百屋','大根の葉じゃ、背中に届かないよ！'),heroLine('よし、今度はちゃんと道具がいるな。……俺か。')],
    rescued: '孫の手なのに、手際がいいな！ ノミの魔族、お城にまで入りこんだらしいよ。',
    locked: '広場でパン屋さんが叫んでたよ。先に見てきてくれる？',
    shirt: ['#4e896e','#84ba88','#2a554f'], hair: '#343747', xp: 100,
    targets: {gold: 47, silver: 84, silverMisses: 4},
    itches: [
      {x: 117, y: 184}, {x: 247, y: 189},
      {x: 190, y: 256, hidden: {
        kind: 'normal', route: [{x: 218, y: 220},{x: 141, y: 213},{x: 263, y: 159},{x: 184, y: 172}],
        warning: .57, jump: .51, land: 1.23,
      }},
    ],
    fleas: [
      {kind: 'normal', route: [{x: 135, y: 234},{x: 230, y: 151},{x: 176, y: 170},{x: 253, y: 235}],
        warning: 0.56, jump: 0.39, land: 1.2, start: 0.9, addAfter: 6, addedItches: [{x: 208, y: 208},{x: 145, y: 145}]},
      {kind: 'normal', route: [{x: 254, y: 223},{x: 124, y: 151},{x: 217, y: 251},{x: 158, y: 197}],
        warning: 0.58, jump: 0.43, land: 1.27, start: -0.6, addAfter: 8, addedItches: [{x: 109, y: 243}]},
    ],
  },
  {
    id: 'dog', name: '犬', district: '公園', at: city(620,393), xp:100,
    entry: [say('犬','わんわん！（かゆい！）'),heroLine('お前もか！！'),say('犬','わおーん！'),heroLine('異世界でも犬語は分からんぞ！')],
    rescued: 'わんっ！（ありがとう！）',
    locked: 'くぅん……（商店街の方を見ている）',
    shirt:['#ad7752','#e7ac69','#734c48'], hair:'#85534c',
    targets:{gold:42,silver:78,silverMisses:4},
    itches:[{x:174,y:162},{x:216,y:225},{x:169,y:260}],
    fleas:[scout([{x:212,y:178},{x:163,y:206},{x:207,y:250}]),scout([{x:181,y:235},{x:217,y:203},{x:175,y:147}],-.7)],
  },
  {
    id: 'guard', name: '門番', district: '城門', at: city(526,263),
    entry: [say('門番','この先は王城だ！ 何者だ！'),heroLine('勇者だ！'),say('門番','……孫の手じゃないか。')],
    rescued: '背中よし、門よし！ 開門！ 中庭の兵士も頼んだぞ。',
    locked: '公園で犬が鳴いている。先に見てきてくれるか？',
    shirt: ['#627e9c','#8fb1c7','#3b4f65'], hair: '#4d4a65', xp: 100,
    targets: {gold: 60, silver: 100, silverMisses: 5},
    itches: [{x: 107, y: 170},{x: 266, y: 159},{x: 217, y: 244},{x: 153, y: 218}],
    fleas: [
      {kind: 'captain', route: [{x: 264, y: 211},{x: 163, y: 159},{x: 228, y: 196},{x: 119, y: 239},{x: 216, y: 145},{x: 173, y: 251}],
        warning: 0.66, jump: 0.38, land: 1.83, start: 0.2, hideAt: {x: 193, y: 192, firstLanding: 2},
        addAfter: 7, addedItches: [{x: 270, y: 250}]},
      {kind: 'normal', route: [{x: 154, y: 205},{x: 252, y: 232},{x: 127, y: 140},{x: 205, y: 224}],
        warning: 0.53, jump: 0.38, land: 1.03, start: 1.2, addAfter: 8, addedItches: [{x: 110, y: 208}]},
      {kind: 'normal', route: [{x: 225, y: 224},{x: 116, y: 195},{x: 249, y: 169},{x: 137, y: 248}],
        warning: 0.52, jump: 0.34, land: 1.15, start: -0.5, addAfter: 10, addedItches: [{x: 243, y: 264}]},
    ],
  },
  {
    id:'soldier',name:'城の兵士',district:'城の中庭',at:{x:525,y:519},xp:100,
    entry:[say('兵士','この鎧、魔王の攻撃にも耐えられるのだが……'),heroLine('かゆみには弱いんだな。')],
    rescued:'肩が軽い！ 王様はまっすぐ先の玉座の間におられる。',
    locked:'街の門番が持ち場に戻るのを待っている。',
    shirt:['#526a82','#a0bdcb','#33415c'],hair:'#453c51',
    targets:{gold:55,silver:95,silverMisses:5},
    itches:[{x:191,y:223},{x:138,y:250},{x:247,y:248}],
    fleas:[scout([{x:191,y:141},{x:221,y:226},{x:154,y:212}])],
    clasps:[
      {x:119,y:166,flea:scout([{x:152,y:185},{x:134,y:215},{x:222,y:159}])},
      {x:266,y:183,flea:scout([{x:236,y:186},{x:250,y:218},{x:174,y:163}])},
    ],
  },
  {
    id:'royal',name:'王様',district:'玉座の間',at:{x:524,y:184},xp:100,
    entry:[say('ノミ魔王','この世界の背中はすべて我がものだ！'),heroLine('スケールが小さすぎるだろ！')],
    rescued:'伝説の勇者よ、次は肩こりも頼めるかの？',
    locked:'兵士がまだ中庭で困っているようじゃ。',
    shirt:['#963c59','#d9817b','#542b55'],hair:'#bca6b5',
    targets:{gold:72,silver:118,silverMisses:6},
    itches:[{x:128,y:210},{x:251,y:218},{x:172,y:250}],
    clasps:[{x:264,y:157,flea:scout([{x:236,y:160},{x:144,y:195},{x:230,y:253}])}],
    fleas:[{
      kind:'king',route:[{x:183,y:180},{x:244,y:203},{x:132,y:174},{x:211,y:248}],
      start:0,warning:.86,jump:.74,land:1.93,hideAt:{x:190,y:211,firstLanding:3},
    }],
  },
]

export const levels = [
  {xp:0,radius:23,hit:0,speed:104,fever:false,notice:''},
  {xp:100,radius:28,hit:0,speed:104,fever:false,notice:'かく範囲アップ！'},
  {xp:200,radius:28,hit:6,speed:104,fever:false,notice:'ノミをたたく範囲アップ！'},
  {xp:300,radius:28,hit:6,speed:127,fever:false,notice:'移動速度アップ！'},
  {xp:400,radius:28,hit:6,speed:127,fever:true,notice:'必殺技 かきかきフィーバー解放！'},
  {xp:600,radius:31,hit:8,speed:136,fever:true,notice:'伝説の孫の手になった！'},
]

