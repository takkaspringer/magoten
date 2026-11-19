export type Point = { x: number; y: number }
export type Rect = Point & { w: number; h: number }
export type ItchSpec = Point & { hidden?: FleaSpec }
export type FleaSpec = {
  kind: 'normal' | 'captain'
  route: Point[]
  warning: number
  jump: number
  land: number
  start?: number
  addAfter?: number
  addedItches?: Point[]
  hideAt?: Point & { firstLanding: number }
}
export type TownPerson = {
  id: string
  name: string
  district: string
  at: Point
  entry: string
  rescued: string
  locked?: string
  shirt: [string, string, string]
  hair: string
  xp: number
  targets: { gold: number; silver: number; silverMisses: number }
  itches: ItchSpec[]
  fleas: FleaSpec[]
}

export const opening = [
  '俺はつまらない所で命を落としてしまった勇者。',
  '気が付いたら、',
  'え、孫の手に転生してるじゃん！',
  '誰か、背中ぁー！',
]

export const finale = [
  '背中の平和を守った勇者だ！',
  'ふふん。これが勇者の腕前ってもんさ。',
  '……俺の背中、誰がかくんだ？',
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

export const world = { w: 1056, h: 864, start: { x: 206, y: 625 } }
export const districts = [
  { name: '広場', x: 255, y: 608, color: '#f6cc87' },
  { name: '市場', x: 772, y: 499, color: '#abdfaf' },
  { name: '見張り門', x: 524, y: 231, color: '#b9dbe9' },
]

export const buildings = [
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
  { x: 430, y: 88, w: 182, h: 109, style: 'gate' },
  { x: 683, y: 113, w: 115, h: 98, style: 'house' },
]

export const railings: Rect[] = [
  { x: 66, y: 433, w: 111, h: 10 }, { x: 266, y: 714, w: 61, h: 10 },
  { x: 695, y: 564, w: 81, h: 10 }, { x: 855, y: 564, w: 95, h: 10 },
  { x: 310, y: 159, w: 94, h: 10 }, { x: 640, y: 159, w: 35, h: 10 },
]

export const treeSpots: Point[] = [
  {x:60,y:378},{x:103,y:365},{x:322,y:453},{x:369,y:420},{x:67,y:638},
  {x:55,y:764},{x:247,y:797},{x:925,y:692},{x:960,y:747},{x:725,y:784},
  {x:677,y:288},{x:890,y:237},{x:945,y:253},{x:74,y:155},{x:208,y:133},
  {x:258,y:126},{x:340,y:94},{x:702,y:77},{x:824,y:94},{x:937,y:104},
]

export const obstacles: Rect[] = [
  ...buildings.map(({x, y, w, h}) => ({ x: x + 4, y: y + 12, w: w - 8, h: h - 12 })),
  ...railings,
  ...treeSpots.map(({x, y}) => ({x: x - 7, y: y - 6, w: 14, h: 12})),
  { x: 249, y: 657, w: 54, h: 36 },
  { x: 944, y: 20, w: 112, h: 147 },
]

export const people: TownPerson[] = [
  {
    id: 'baker', name: 'パン屋', district: '広場', at: {x: 270, y: 575},
    entry: 'た、助けて！ 背中がむずむずするぅ！',
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
    id: 'grocer', name: '八百屋', district: '市場', at: {x: 783, y: 461},
    entry: '大根の葉じゃ、背中に届かないよ！',
    rescued: '孫の手なのに、手際がいいな！',
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
    id: 'guard', name: '門番', district: '見張り門', at: {x: 526, y: 263},
    entry: '異常なし！ ……ただし、私の背中を除く！',
    rescued: '背中よし、門よし！ ピョン隊長は退散したようだ。',
    locked: '市場の方からも悲鳴がしたぞ。街の様子を頼む！',
    shirt: ['#627e9c','#8fb1c7','#3b4f65'], hair: '#4d4a65', xp: 50,
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
]

export const levels = [
  {xp: 0, radius: 23, gain: 1, notice: ''},
  {xp: 100, radius: 28, gain: 1, notice: 'かける範囲アップ！'},
  {xp: 200, radius: 28, gain: 1.3, notice: 'かく速さアップ！'},
]

