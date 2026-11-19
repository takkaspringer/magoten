import { scout } from './data'
import type { FleaSpec, ItchSpec, Line, Point, Rect, TownPerson } from './data'

export type Cover = Point & { direction: -1 | 1; itch: ItchSpec }
export type VeiledFlea = FleaSpec & { veil?: 'leaf' | 'stitch'; emperor?: boolean }
export type Board = {
  itches: ItchSpec[]
  fleas: VeiledFlea[]
  clasps?: TownPerson['clasps']
  covers?: Cover[]
}
export type Act = { order: string; seconds: number; board: Board }
export type DemonPerson = TownPerson & Board & { acts?: Act[] }
export type Realm = 'kingdom' | 'demon'

export const kingdomPortal: Point = {x:650,y:179}
export const demonPortal: Point = {x:159,y:1019}
export const demonWorld = { w:1056,h:1152,start:{x:196,y:1002} }
export const bridgeLock: Rect = {x:323,y:802,w:106,h:58}
export const smallDoorLock: Rect = {x:515,y:216,w:62,h:35}
export const demonObstacles: Rect[] = [
  {x:0,y:802,w:323,h:58}, {x:429,y:802,w:627,h:58},
  {x:55,y:875,w:155,h:68}, {x:410,y:884,w:133,h:80},
  {x:0,y:216,w:515,h:35}, {x:577,y:216,w:479,h:35},
  {x:0,y:20,w:292,h:196}, {x:765,y:20,w:291,h:196},
  {x:484,y:42,w:94,h:44},
  {x:333,y:258,w:29,h:100}, {x:736,y:258,w:29,h:100},
  {x:78,y:672,w:78,h:67}, {x:875,y:591,w:90,h:100},
  {x:771,y:455,w:71,h:38}, {x:353,y:495,w:91,h:27},
]

const line = (speaker: string, text: string): Line => ({speaker,text})
export const arrival: Line[] = [
  line('王様','表彰式が終わったばかりじゃぞ！　今度は魔族の侵略か！？'),
  line('使者','降参です！　……できれば、そこの孫の手様に！'),
  line('王様','わしを通り越して、孫の手に降参するな！'),
  line('使者','魔界じゅう、こんな有様で……。'),
  line('使者','魔王さまは玉座でずっと、かゆいのをがまんしておられます。'),
  line('勇者','勇者だったころは、魔王を倒しに行くのが夢だった。'),
  line('勇者','……背中をかきに行くとはな。'),
  line('勇者','お前、もうかゆくないだろ！'),
]

export const demonFinale: Line[] = [
  line('ルルカ','ありがとう。これで、みんなの前でちゃんと魔王ができる。'),
  line('勇者','どういたしまして。'),
  line('ルルカ','では勇者よ。そなたを、わらわ専属の孫の手に任命する！'),
  line('王様','待てい！　その孫の手、うちでも予約が取れんのじゃぞ！'),
  line('勇者','勇者だったころより、予定が埋まってる……'),
  line('勇者','お前、字ぃ書けたの！？'),
]

const emperor = (veil?: VeiledFlea['veil']): VeiledFlea => ({
  ...scout([{x:198,y:169},{x:123,y:225},{x:263,y:220},{x:184,y:258}]),
  warning:1.38,jump:.59,land:1.85,veil,emperor:true,
})

export const demonPeople: DemonPerson[] = [
  {
    id:'maki',name:'マキさん',district:'魔界村',at:{x:318,y:939},xp:100,
    entry:[line('マキさん','包帯屋なのに、自分までぐるぐるに……。'),line('マキさん','手はあるんです。出すのに三十分ほど……'),line('勇者','じゃあ、その前に背中を済ませよう。')],
    rescued:'手が出た！ お礼に小川に包帯橋を架けておきましたよ。',
    shirt:['#9c7458','#ddbc92','#4b4357'],hair:'#c6a47a',
    targets:{gold:46,silver:100,silverMisses:4},
    covers:[
      {x:126,y:173,direction:1,itch:{x:145,y:174}},
      {x:257,y:218,direction:-1,itch:{x:241,y:222}},
    ],
    itches:[],fleas:[scout([{x:199,y:258},{x:261,y:155},{x:155,y:236}],-.8)],
  },
  {
    id:'kasane',name:'カサネ',district:'魔界の森',at:{x:427,y:702},xp:100,
    entry:[line('カサネ','この森の生き物はすべて把握している！'),line('勇者','その背中にいるやつは？'),line('カサネ','……観測できない唯一の死角だ。')],
    rescued:'灯るキノコをたどれば街道だよ。背中の新種は……調査終了！',
    shirt:['#477b72','#8bc3a0','#36485a'],hair:'#6c658b',
    targets:{gold:55,silver:100,silverMisses:5},
    itches:[{x:198,y:216},{x:128,y:254},{x:262,y:241}],
    fleas:[
      {...scout([{x:110,y:158},{x:260,y:161},{x:164,y:244}]),veil:'leaf',warning:1.65,land:2.05},
      {...scout([{x:238,y:190},{x:133,y:192},{x:217,y:257}],-.65),veil:'leaf',warning:1.26,land:1.57},
    ],
  },
  {
    id:'kerberos',name:'ケル・ベ・ロス',district:'魔界道路',at:{x:653,y:505},xp:100,
    entry:[line('ケル','そこ！'),line('ベ','ちがう！'),line('ロス','もうちょい右！'),line('犬','わん！（そこ！）'),line('勇者','お前の一声で、初めて全員そろったぞ。')],
    rescued:'三つの頭と犬が、同じ角度で首をかしげた。そろった！',
    shirt:['#865d75','#ca8a8c','#4b3d60'],hair:'#885a69',
    targets:{gold:58,silver:100,silverMisses:5},
    itches:[{x:123,y:197},{x:192,y:233},{x:265,y:204}],
    fleas:[scout([{x:213,y:171},{x:144,y:252},{x:251,y:244}])],
  },
  {
    id:'knight',name:'ガチガチ団長',district:'魔王城・大広間',at:{x:546,y:315},xp:100,
    entry:[line('ガチガチ団長','魔王さまを守るため、一歩も動かぬ！'),line('勇者','さっきから柱で背中をかいてるぞ。'),line('ガチガチ団長','……柱が動いておる！')],
    rescued:'魔王さまのお部屋は小さい扉の先だ。でかい扉？ 衣装部屋だ。',
    shirt:['#3f455f','#798490','#2b2844'],hair:'#33334e',
    targets:{gold:60,silver:110,silverMisses:5},
    itches:[{x:192,y:204},{x:159,y:248},{x:234,y:248}],
    fleas:[scout([{x:188,y:148},{x:144,y:213},{x:249,y:239}])],
    clasps:[
      {x:118,y:160,flea:scout([{x:147,y:185},{x:217,y:207},{x:159,y:248}])},
      {x:270,y:160,flea:scout([{x:238,y:190},{x:255,y:247},{x:180,y:161}])},
    ],
  },
  {
    id:'luruka',name:'ルルカ',district:'魔王城・玉座の間',at:{x:546,y:131},xp:100,
    entry:[line('ルルカ','よくぞ参った！ わらわが、この魔界を治める……'),line('ルルカ','……かゆい。'),line('勇者','王冠の下だ。あいつ、ここに巣を作ってる！'),line('ルルカ','ノミ皇帝め。勇者よ、マントの折り返しから頼む！')],
    rescued:'ありがとう。これで、みんなの前でちゃんと魔王ができる。',
    shirt:['#893e73','#e0a5b6','#4d325d'],hair:'#a566a0',
    targets:{gold:94,silver:170,silverMisses:7}, itches:[],fleas:[],
    acts:[
      {order:'第一幕　マントをめくって かゆみをこすろう',seconds:75,
        board:{covers:[{x:252,y:217,direction:-1,itch:{x:224,y:219}}],itches:[],fleas:[]}},
      {order:'第二幕　刺しゅうが揺れた先で 皇帝をねらおう',seconds:65,
        board:{itches:[],fleas:[emperor('stitch')]}},
      {order:'第三幕　皇帝をたたいて 最後のかゆみをこすろう',seconds:60,
        board:{itches:[],fleas:[emperor()]}},
    ],
  },
]

export const knightExit: Line[] = [
  line('ガチガチ団長','魔王さまのお部屋だ。'),
  line('勇者','そっち！？　でかい扉は！？'),
  line('ガチガチ団長','衣装部屋だ。'),
]

export const playableDemons=demonPeople.slice(0,1)
