import { buildings, cityY, districts, gate, railings, treeSpots, world } from './data'
import type { Point, TownPerson } from './data'

type Ink = CanvasRenderingContext2D
export type Camera = Point & { w: number; h: number }
const deep = '#203035'
const wood = '#e9a961'
const light = '#ffda96'
const darkWood = '#9c5142'
const edge = '#462e38'

export function box(c: Ink, color: string, x: number, y: number, w: number, h: number) {
  c.fillStyle = color
  c.fillRect(Math.round(x), Math.round(y), w, h)
}

export function poly(c: Ink, color: string, points: number[]) {
  const xs = []
  const ys = []
  for (let i = 0; i < points.length; i += 2) {
    xs.push(points[i])
    ys.push(points[i + 1])
  }
  c.fillStyle = color
  for (let y = Math.min(...ys); y < Math.max(...ys); y++) {
    const cuts: number[] = []
    for (let a = 0, b = xs.length - 1; a < xs.length; b = a++) {
      if ((ys[a] > y + .5) !== (ys[b] > y + .5)) {
        cuts.push(xs[a] + (y + .5 - ys[a]) * (xs[b] - xs[a]) / (ys[b] - ys[a]))
      }
    }
    cuts.sort((a, b) => a - b)
    for (let i = 0; i < cuts.length; i += 2) {
      const left = Math.round(cuts[i])
      c.fillRect(left, y, Math.round(cuts[i + 1]) - left, 1)
    }
  }
}

export function label(c: Ink, value: string, x: number, y: number, color = '#fff0c4', size = 13) {
  c.font = 'bold ' + size + 'px "Yu Gothic", "Hiragino Kaku Gothic ProN", sans-serif'
  c.textAlign = 'center'
  c.textBaseline = 'middle'
  c.fillStyle = color
  c.fillText(value, Math.round(x), Math.round(y))
}

const grain = (a: number, b: number) => ((Math.imul(a + 19, 247681) ^ Math.imul(b + 7, 1103515245)) >>> 3) % 101

export function hero(c: Ink, x: number, y: number, frame: number, facing = 1, scale = 1, proud = false) {
  c.save()
  c.translate(Math.round(x), Math.round(y))
  c.scale(facing * scale, scale)
  const step = frame % 2 === 0 ? 0 : 2
  box(c, '#17272680', -13, -3, 26, 5)
  poly(c, '#482c38', [-4,-27,-11,-26,-16,-11,-20,-5,-9,-5,1,-10,3,-23])
  poly(c, '#af4545', [-5,-25,-10,-23,-14,-11,-17,-7,-8,-7,-1,-12,1,-23])
  poly(c, '#e56850', [-8,-23,-10,-16,-13,-10,-9,-10,-3,-24])
  box(c, edge, -7, -10 + step, 6, 10 - step)
  box(c, edge, 3, -10 - step, 6, 10)
  box(c, '#e4a264', -6, -9 + step, 3, 6)
  box(c, '#e4a264', 4, -8 - step, 3, 6)
  box(c, '#79454a', -8, -3, 7, 3)
  box(c, '#79454a', 3, -3 - step, 7, 3)
  box(c, edge, -10, proud ? -30 : -20, 6, 8)
  box(c, wood, -9, proud ? -29 : -19, 3, 6)
  box(c, edge, 7, proud ? -31 : -20, 6, 9)
  box(c, wood, 9, proud ? -30 : -19, 3, 6)
  poly(c, edge, [-7,-13,-7,-37,-9,-39,-9,-46,-5,-46,-5,-41,-3,-41,-3,-49,1,-49,1,-42,3,-42,3,-48,7,-48,7,-42,10,-43,13,-41,11,-34,8,-30,8,-11,-4,-10])
  poly(c, wood, [-5,-13,-5,-37,-7,-40,-7,-44,-6,-44,-6,-39,-1,-39,-1,-47,0,-47,0,-40,5,-40,5,-46,6,-46,6,-40,10,-41,11,-40,8,-34,6,-30,6,-13])
  box(c, light, -4, -36, 2, 20)
  box(c, '#c37850', 4, -31, 2, 16)
  box(c, '#342730', -2, -28, 2, 3)
  box(c, '#342730', 3, -28, 2, 3)
  box(c, '#9a4f47', 0, -23, 4, 2)
  box(c, '#f6bc73', -2, -17, 4, 1)
  c.restore()
}

export function fleaArt(c: Ink, x: number, y: number, captain = false, scale = 1, angle = 0) {
  c.save()
  c.translate(Math.round(x), Math.round(y))
  c.rotate(angle)
  c.scale(scale, scale)
  const shade = captain ? '#633451' : '#573969'
  const hi = captain ? '#ba5883' : '#8c62a2'
  box(c, '#282237', -11, -1, 23, 4)
  box(c, '#30243a', -9, 3, 4, 5)
  box(c, '#30243a', 6, 2, 4, 5)
  poly(c, '#2c2036', [-10,-2,-8,-8,-3,-11,5,-11,10,-7,12,3,7,6,-6,6])
  poly(c, shade, [-8,1,-6,-6,-3,-9,5,-9,9,-6,10,2,6,4,-6,4])
  box(c, hi, -6, -7, 7, 2)
  box(c, '#fff1b6', 1, -5, 3, 4)
  box(c, '#fff1b6', 6, -5, 2, 4)
  box(c, '#ef844f', -7, -10, 2, 3)
  if (captain) {
    poly(c, '#f5c36e', [-9,-10,-9,-17,-5,-14,-1,-19,3,-14,7,-16,7,-10])
    box(c, '#fff1b6', -4, -13, 6, 1)
    box(c, '#f1b46d', -14, -5, 4, 2)
    box(c, '#f1b46d', -15, -3, 3, 5)
  }
  c.restore()
}

function house(c: Ink, b: (typeof buildings)[number], opening=0) {
  const {x,y,w,h,style} = b
  if (style === 'gate') {
    box(c, '#263e42', x + 7, y + 22, w - 4, h - 5)
    box(c, '#506a69', x + 36, y + 34, w - 72, h - 34)
    for (let i = 0; i < 2; i++) {
      const tx = x + i * (w - 42)
      box(c, '#718282', tx, y + 7, 42, h - 7)
      box(c, '#425f64', tx + 33, y + 10, 9, h - 10)
      for (let j = 0; j < 3; j++) box(c, '#9da69a', tx + j * 15, y, 12, 14)
      for (let j = 0; j < 5; j++) {
        box(c, '#8f9a91', tx + (j % 2) * 13 + 3, y + 19 + j * 17, 21, 5)
      }
      box(c, '#2d454c', tx + 15, y + 37, 8, 19)
      box(c, '#e7af69', tx + 17, y + 40, 4, 12)
    }
    poly(c,'#817d77',[x+52,y+h,x+52,y+64,x+70,y+46,x+112,y+46,x+130,y+64,x+130,y+h])
    box(c,'#ae9880',x+66,y+66,50,h-66)
    box(c,'#d1b18d',x+76,y+76,30,2)
    const drop=Math.round((1-opening)*44)
    for(let i=0;i<7;i++) box(c, '#3e454d', x + 64 + i * 8, y + 65, 4, drop)
    if(drop>4) box(c,'#8f775e',x+64,y+61+drop,52,3)
    box(c, '#a6464b', x+48, y+40, 12, 32)
    box(c, '#a6464b', x+w-60, y+40, 12, 32)
    poly(c,'#59465e',[x+63,y+15,x+119,y+15,x+115,y+44,x+91,y+50,x+67,y+44])
    poly(c,'#f0c77d',[x+77,y+31,x+75,y+22,x+84,y+26,x+91,y+18,x+98,y+26,x+107,y+22,x+105,y+32])
    box(c,'#ffea9e',x+78,y+34,27,2)
    return
  }
  box(c, '#1c3434', x+7, y+11, w+3, h-5)
  box(c, '#694c42', x+5, y+37, w-10, h-37)
  box(c, '#b18769', x+8, y+43, w-18, h-47)
  box(c, '#8f6558', x+w-26, y+44, 15, h-49)
  for (let j = 0; j < 4; j++) box(c, '#be9777', x+15, y+55+j*8, 20, 2)
  poly(c, '#173941', [x-5,y+51,x+13,y+3,x+w-16,y+3,x+w+5,y+51])
  poly(c, '#367476', [x,y+46,x+16,y+5,x+w-18,y+5,x+w,y+46])
  poly(c, '#4f9290', [x+7,y+36,x+18,y+5,x+w-18,y+5,x+w-13,y+15,x+17,y+15,x+12,y+36])
  for (let row = 1; row < 5; row++) {
    const offset = (5 - row) * 3
    const yy = y + 5 + row * 8
    box(c, '#26545b', x + offset + 4, yy, w - 2 * offset - 8, 2)
    for (let col = offset + 7 + (row % 2) * 6; col < w-offset-7; col += 13) {
      box(c, '#2b646a', x+col, yy-4, 2, 4)
      if (grain(col, row + x) > 49) box(c, '#69a39a', x+col+3, yy-4, 6, 1)
    }
  }
  box(c, '#5b3d3d', x+w-42, y+9, 12, 23)
  box(c, '#b57864', x+w-43, y+8, 14, 4)
  box(c, '#6a493f', x+w/2-11, y+h-28, 22, 28)
  box(c, '#453a3a', x+w/2-8, y+h-25, 16, 25)
  box(c, '#c48b56', x+w/2+4, y+h-14, 2, 2)
  for (const wx of [x+19,x+w-37]) {
    box(c, '#624544', wx-3, y+56, 24, 19)
    box(c, '#edb16c', wx, y+58, 18, 14)
    box(c, '#ffe2a0', wx+2, y+59, 7, 5)
    box(c, '#8e604d', wx+8, y+57, 2, 17)
    box(c, '#8e604d', wx, y+65, 18, 2)
  }
  if (style === 'house') return
  const sign = style === 'market' ? '#579076' : '#a85c48'
  box(c, '#593b3a', x+w/2-23, y+49, 46, 17)
  box(c, sign, x+w/2-21, y+51, 42, 13)
  label(c, style === 'market' ? 'やさい' : 'パン', x+w/2, y+57, '#fff4cd', 10)
  for(let i=0;i<8;i++) {
    box(c, i%2===0 ? '#f4ce9b' : sign, x+8+i*9,y+h-24,9,8)
    box(c, i%2===0 ? '#c99e7b' : '#613e43', x+8+i*9,y+h-16,9,3)
  }
}

function tree(c: Ink,x: number,y: number) {
  box(c,'#1b3535',x-18,y-4,37,9)
  box(c,'#785748',x-4,y-16,8,19)
  poly(c, '#204744', [x-20,y-9,x-19,y-29,x-13,y-34,x-8,y-45,x+10,y-45,x+17,y-37,x+22,y-26,x+22,y-13,x+12,y-8])
  poly(c, '#34635a', [x-19,y-16,x-16,y-31,x-8,y-34,x-5,y-42,x+10,y-41,x+16,y-33,x+20,y-29,x+15,y-16,x+3,y-13])
  poly(c, '#4b7965', [x-13,y-26,x-9,y-34,x-3,y-37,x+10,y-37,x+14,y-32,x+5,y-29,x+1,y-22,x-9,y-21])
  box(c, '#6b9475', x-4, y-34, 7, 2)
}

function palace(c: Ink) {
  for(let y=24;y<288;y+=24) for(let x=324;x<736;x+=24) {
    box(c,grain(x,y)%2?'#736779':'#685e72',x,y,23,23)
    box(c,'#867784',x+3,y+2,17,1)
  }
  box(c,'#30263f',0,21,320,266)
  box(c,'#30263f',736,21,320,266)
  box(c,'#a58670',320,27,10,263)
  box(c,'#a58670',725,27,11,263)
  box(c,'#b09a7f',330,28,395,14)
  box(c,'#55324e',457,41,134,283)
  box(c,'#eac08a',461,44,4,280)
  box(c,'#eac08a',583,44,4,280)
  box(c,'#853e59',467,44,114,280)
  for(let y=131;y<320;y+=35) {
    poly(c,'#a95164',[522,y-8,532,y,522,y+8,512,y])
  }
  for(const x of [354,659]) {
    for(const y of [67,168,237]) {
      box(c,'#3b3449',x,y,42,22)
      box(c,'#b4a28f',x+3,y,36,15)
      box(c,'#d0b89b',x+4,y-6,34,10)
      box(c,'#edc176',x+10,y-14,7,9)
      box(c,'#ffecae',x+12,y-17,3,7)
    }
  }
  box(c,'#3c2b43',481,73,90,51)
  box(c,'#d8a565',486,69,80,46)
  box(c,'#f1c77b',495,59,62,48)
  box(c,'#8e4160',501,64,50,39)
  box(c,'#ffdf91',522,70,8,20)
  box(c,'#99645d',484,113,84,8)

  for(const [x,w] of [[0,483],[568,488]]) {
    box(c,'#4c435e',x,287,w,41)
    box(c,'#b6a18e',x,289,w,28)
    box(c,'#e3c29c',x,291,w,5)
    for(let tx=x+12;tx<x+w-11;tx+=32) {
      box(c,'#857789',tx,307,28,2)
      box(c,'#c9ae97',tx,300,18,3)
    }
  }
  for(const x of [360,616]) {
    box(c,'#575074',x,226,83,92)
    poly(c,'#59405c',[x-9,241,x+12,201,x+69,201,x+91,241])
    poly(c,'#806280',[x-3,235,x+15,204,x+67,204,x+84,235])
    box(c,'#d4a975',x+9,242,65,5)
    for(const dx of [16,46]) {
      box(c,'#403751',x+dx,256,20,25)
      box(c,'#efc084',x+dx+4,260,12,16)
      box(c,'#9a796d',x+dx+9,259,2,20)
    }
  }
  box(c,'#cfad7d',486,305,79,19)
  box(c,'#927765',486,322,79,4)
  for(const x of [362,616]) {
    box(c,'#525d5c',x+1,436,74,56)
    box(c,'#b6a085',x+4,440,68,49)
    box(c,'#68577a',x+7,446,62,34)
    box(c,'#498489',x+11,449,54,28)
    box(c,'#98c4b4',x+17,454,38,2)
    box(c,'#eacaaa',x+35,442,5,28)
    box(c,'#bae4cc',x+26,449,22,2)
  }
  box(c,'#65616d',0,gate.y+17,474,24)
  box(c,'#65616d',569,gate.y+17,487,24)
  for(let x=17;x<world.w;x+=23) {
    if(x>426&&x<613) continue
    box(c,'#b9a791',x,gate.y+10,13,16)
    box(c,'#a58f81',x,gate.y+29,19,5)
  }
}

let terrain: HTMLCanvasElement | undefined
function mapBase() {
  const out = document.createElement('canvas')
  out.width = world.w
  out.height = world.h
  const c = out.getContext('2d')!
  for (let y=0;y<world.h;y+=24) {
    for(let x=0;x<world.w;x+=24) {
      const rnd = grain(x,y)
      const yy=y-cityY
      if(y<gate.y+32) {
        const paved=(x>=456&&x<600)||(y>360&&y<553&&x>=300&&x<762)
        box(c,paved?['#968b7d','#9f9185','#8d827c'][rnd%3]:['#526a5d','#587160','#56695b'][rnd%3],x,y,24,24)
        box(c,paved?'#766d72':'#748870',x+4,y+3,11,1)
        if(paved) box(c,'#746d70',x+1,y+23,23,1)
        continue
      }
      const park=x>=552&&x<744&&yy>=312&&yy<432
      const path = (x>=168&&x<336&&yy>=472) || (x>=456&&x<600&&yy<680) ||
        (yy>=432&&yy<552&&x>=432) || (yy>=576&&yy<648&&x>=96&&x<600) ||
        (x>=744&&x<864&&yy>=390&&yy<576)
      if(park) {
        box(c,['#57754b','#5a7b50','#527450'][rnd%3],x,y,24,24)
        box(c,'#8fa969',x+7,y+5,2,3)
        if(rnd%3===0) box(c,'#d9b383',x+16,y+14,3,2)
        continue
      }
      box(c, path ? ['#656c64','#686e65','#626a64'][rnd%3] : ['#394f48','#3c514a','#40554c'][rnd%3],x,y,24,24)
      if(path) {
        box(c,'#545e57',x,y+11,24,1)
        box(c,'#535c56',x,y+23,24,1)
        box(c,'#555e59',x+8,y,1,11)
        box(c,'#555e59',x+17,y+12,1,11)
        box(c,'#777a70',x+2+rnd%8,y+2+rnd%5,8,1)
      } else {
        box(c,'#516d57',x+3+rnd%15,y+4+rnd%11,3,1)
        if(rnd%6===1) box(c,'#bf9a72',x+11,y+8,2,2)
      }
    }
  }
  palace(c)
  box(c,'#182d32',0,0,world.w,17)
  box(c,'#213839',0,17,world.w,7)
  box(c,'#263e3d',0,world.h-19,world.w,19)
  box(c,'#22383a',0,0,18,world.h)
  box(c,'#203538',world.w-18,0,18,world.h)
  for(let y=21+cityY;y<167+cityY;y+=8) {
    box(c,'#315f6b',944,y,112,8)
    box(c,'#51818a',948+grain(y,12)%65,y+2,33,1)
    box(c,'#688377',942,y,4,8)
  }
  for(const x of [584,650]) {
    box(c,'#374b45',x,cityY+354,34,11)
    box(c,'#b48f65',x,cityY+350,34,3)
    box(c,'#9c7657',x,cityY+356,34,3)
  }
  for(const r of railings) {
    box(c,'#322f30',r.x,r.y+3,r.w,5)
    box(c,'#9a795b',r.x,r.y,r.w,3)
    for(let dx=0;dx<r.w;dx+=14) box(c,'#c4a076',r.x+dx,r.y-3,3,12)
  }
  for (const d of districts) {
    box(c, '#543c39', d.x - 32, d.y - 8, 64, 17)
    box(c, '#74554b', d.x - 31, d.y - 7, 62, 14)
    label(c,d.name,d.x,d.y,d.color,10)
  }
  return out
}

function fountain(c: Ink) {
  const x=249,y=657+cityY
  poly(c,'#3c4a4c',[x,y+8,x+9,y,x+45,y,x+54,y+10,x+54,y+28,x+45,y+36,x+9,y+36,x,y+28])
  poly(c,'#9b9d8d',[x+2,y+10,x+10,y+2,x+44,y+2,x+52,y+10,x+52,y+25,x+44,y+31,x+10,y+31,x+2,y+25])
  poly(c,'#487f88',[x+6,y+12,x+12,y+5,x+42,y+5,x+48,y+12,x+48,y+23,x+42,y+27,x+12,y+27,x+6,y+23])
  box(c,'#8fc0b6',x+15,y+20,20,1)
  box(c,'#d3dad2',x+25,y-9,5,24)
  box(c,'#82cac0',x+18,y+5,19,2)
}

function dogArt(c: Ink,x: number,y: number,frame: number,well: boolean,facing=1) {
  c.save()
  c.translate(Math.round(x),Math.round(y))
  c.scale(facing,1)
  const step=frame%2===0?0:3
  const wag=well?frame%5*2:3
  box(c,'#263d35',-20,-3,39,5)
  poly(c,'#56394a',[-15,-13,-20,-20,-24,-20-wag,-19,-17-wag,-12,-16])
  poly(c,'#69464a',[-16,-2,-17,-16,-9,-23,10,-22,13,-29,20,-28,22,-23,22,-19,26,-17,26,-11,15,-9,14,-2])
  poly(c,'#c08c58',[-14,-5,-14,-16,-8,-20,5,-20,13,-18,15,-11,10,-5])
  box(c,'#845248',-14,-6,5,6-step)
  box(c,'#a57251',-4,-8,5,5+step)
  box(c,'#845248',9,-9,5,9-step)
  box(c,'#dba774',13,-24,8,12)
  box(c,'#f3d296',18,-17,7,5)
  box(c,'#402d3d',23,-16,4,3)
  box(c,'#392c39',18,-22,2,3)
  box(c,'#734950',11,-25,4,10)
  box(c,well?'#cbebad':'#ea8f6e',9,-15,3,8)
  c.restore()
}

export function personArt(c: Ink, p: TownPerson, x: number, y: number, frame: number, well: boolean, bubble = true) {
  if(p.id==='dog') {
    dogArt(c,x,y,frame,well)
    if(!well) label(c,'わんっ！',x,y-43,'#ffe2a8',11)
    return
  }
  const twist = well ? 0 : [-1,0,2][frame % 3]
  const bob = well ? 0 : frame % 3 === 1 ? -2 : 0
  const waving = well && bubble && p.id==='baker'
  const saluting = well && bubble && p.id==='guard'
  const [base, hi, shade] = p.shirt
  box(c,'#233532',x-11,y-4,22,5)
  box(c,'#283039',x-7,y-10,5,10)
  box(c,'#283039',x+2,y-10,5,10)
  box(c,deep,x-11+twist,y-28+bob,22,21)
  box(c,base,x-8+twist,y-27+bob,16,17)
  box(c,hi,x-5+twist,y-26+bob,10,3)
  box(c,shade,x+4+twist,y-21+bob,4,11)
  box(c,'#e0a778',x-11+twist,y-20+bob,4,7)
  if(!waving&&!saluting) box(c,'#edb48b',x+7+twist,y-20+bob,4,7)
  box(c,'#3d3038',x-9+twist,y-43+bob,18,18)
  box(c,p.hair,x-8+twist,y-42+bob,16,10)
  box(c,'#e8ab82',x-6+twist,y-36+bob,12,9)
  box(c,'#382c33',x-4+twist,y-34+bob,2,2)
  box(c,'#382c33',x+3+twist,y-34+bob,2,2)
  box(c,well?'#774d49':'#9a5350',x-1+twist,y-29+bob,4,well?1:2)
  if(p.id==='baker') {
    box(c,'#e7d3a8',x-9+twist,y-42+bob,18,5)
    box(c,'#f2e8cf',x-7+twist,y-47+bob,13,7)
  } else if(p.id==='guard'||p.id==='soldier') {
    box(c,'#92acb9',x-10+twist,y-41+bob,20,5)
    box(c,'#b9cbd0',x-6+twist,y-46+bob,12,8)
  } else if(p.id==='royal') {
    poly(c,'#f4cf79',[x-11+twist,y-42+bob,x-12+twist,y-51+bob,x-5+twist,y-47+bob,x+1+twist,y-54+bob,x+5+twist,y-47+bob,x+11+twist,y-51+bob,x+10+twist,y-42+bob])
    box(c,'#a14a67',x-1+twist,y-47+bob,3,4)
    box(c,'#f0dfc1',x-5+twist,y-30+bob,10,5)
  } else {
    box(c,'#a8bf77',x-10+twist,y-42+bob,20,3)
  }
  if(waving) {
    const handX=x+(frame%6<3?13:17)
    poly(c,deep,[x+6,y-22,handX-3,y-30,handX-3,y-39,handX+4,y-39,handX+5,y-28,x+10,y-18])
    box(c,'#f2bd8c',handX-2,y-39,6,8)
    box(c,hi,x+8,y-25,5,5)
  }
  if(saluting) {
    poly(c,deep,[x+6,y-24,x+11,y-25,x+13,y-32,x+6,y-36,x+9,y-42,x+20,y-34,x+19,y-27,x+12,y-20])
    poly(c,hi,[x+9,y-24,x+14,y-29,x+15,y-33,x+19,y-32,x+17,y-27,x+12,y-22])
    box(c,'#f2bd8c',x+7,y-39,8,4)
  }
  if (!well && bubble) {
    box(c,'#412f3a',x-25,y-68+bob,50,17)
    box(c,'#fff0c4',x-24,y-67+bob,48,15)
    box(c,'#fff0c4',x+1,y-52+bob,4,4)
    label(c,'かゆい！',x,y-59+bob,'#7a3d43',10)
  }
}

function crate(c: Ink,x: number,y: number,stock: 'empty'|'bread'|'veg',index: number) {
  box(c,'#3a3032',x-1,y-1,18,12)
  box(c,'#8c5a46',x,y,16,10)
  box(c,'#563d37',x+2,y+1,12,5)
  box(c,'#b9865d',x,y+6,16,2)
  box(c,'#bb9265',x+1,y+1,2,8)
  box(c,'#a77757',x+13,y+1,2,8)
  if(stock==='bread') {
    box(c,'#df9f50',x+3,y-4,10,8)
    box(c,'#ffd68d',x+4,y-5,8,5)
    box(c,'#ae6140',x+6,y-4,1,3)
    box(c,'#ae6140',x+9,y-3,1,3)
  } else if(stock==='veg') {
    const color=index%2===0?'#a9c76b':'#f5a066'
    box(c,'#608b56',x+4,y-4,8,8)
    box(c,color,x+2,y-1,12,5)
    box(c,'#d7d880',x+6,y-5,3,3)
  }
}

function bunting(c: Ink,x: number,y: number,clock: number) {
  box(c,'#352c34',x-2,y-2,5,27)
  box(c,'#ac8564',x,y,2,24)
  box(c,'#352c34',x+98,y-2,5,27)
  box(c,'#ac8564',x+99,y,2,24)
  for(let i=0;i<8;i++) {
    const left=x+2+12*i
    const top=y+Math.min(i,7-i)*2
    const sway=Math.floor(clock*5+i)%3-1
    const color=['#ee8a72','#ffe098','#9bd4bb','#87bcd8'][i%4]
    box(c,'#e1c79b',left,top,12,1)
    poly(c,'#4c353e',[left,top+1,left+12,top+1,left+6+sway,top+12])
    poly(c,color,[left+1,top+2,left+11,top+2,left+6+sway,top+10])
  }
}

type TownEffects = { gateOpening: number; follower?: Point & { facing: number }; legendary?: boolean; proud?: boolean }

export function town(c: Ink, camera: Camera, player: Point, villagers: TownPerson[], saved: string[], clock: number, moving: boolean, facing: number, effects: TownEffects) {
  terrain ??= mapBase()
  c.drawImage(terrain, camera.x,camera.y,camera.w,camera.h,0,0,camera.w,camera.h)
  const drawables = [
    ...buildings.map(b=>({y:b.y+b.h,x:b.x+b.w/2,draw:()=>house(c,b)})),
    ...treeSpots.map(p=>({...p,draw:()=>tree(c,p.x,p.y)})),
    ...villagers.filter(p=>p.id!=='dog'||!effects.follower).map(p=>({...p.at,draw:()=>personArt(c,p,p.at.x,p.at.y,Math.floor(clock*7),saved.includes(p.id))})),
    { x: 276, y: 693+cityY, draw: () => fountain(c) },
    { x: gate.x+gate.w/2, y: gate.y+46, draw: () => house(c,gate,effects.gateOpening) },
    {...player,draw:()=>{
      if(effects.legendary) {
        for(let i=0;i<5;i++) {
          const angle=clock*1.7+i*1.26
          box(c,'#fbe18c',player.x+Math.cos(angle)*23,player.y-24+Math.sin(angle)*22,3,3)
        }
      }
      hero(c,player.x,player.y,moving?Math.floor(clock*9):0,facing,1,effects.proud)
    }},
  ]
  const follower=effects.follower
  if(follower) drawables.push({...follower,draw:()=>dogArt(c,follower.x,follower.y,Math.floor(clock*11),true,follower.facing)})
  for(let i=0;i<3;i++) drawables.push({y:579+cityY,x:128+i*20,draw:()=>crate(c,128+i*20,569+cityY,saved.includes('baker')?'bread':'empty',i)})
  for(let i=0;i<5;i++) drawables.push({y:442+cityY,x:735+i*18,draw:()=>crate(c,735+i*18,432+cityY,saved.includes('grocer')?'veg':'empty',i)})
  if(saved.includes('guard')) {
    for(const {x,y} of [{x:472,y:206},{x:214,y:529},{x:809,y:473}]) {
      drawables.push({x:x+50,y:y+cityY+25,draw:()=>bunting(c,x,y+cityY,clock)})
    }
  }
  c.save()
  c.translate(-camera.x,-camera.y)
  if(saved.includes('royal')) {
    bunting(c,395,348,clock)
    bunting(c,555,348,clock)
  }
  drawables.filter(o=>o.x>=camera.x-110&&o.x<=camera.x+camera.w+110&&o.y>=camera.y-20&&o.y<=camera.y+camera.h+134)
    .sort((a,b)=>a.y-b.y).forEach(o=>o.draw())
  c.restore()
}

export function dogTail(c: Ink,t: number,shake: number) {
  const sx=Math.round(31*Math.sin(t*(shake?22:6)))+shake
  poly(c,'#593b4b',[179+shake,260,204+shake,260,199+sx,289,186+sx,312,176+sx,310,186+sx,285])
  poly(c,'#c78d5d',[183+shake,263,198+shake,264,194+sx,287,185+sx,306,179+sx,307,190+sx,282])
  box(c,'#f1bf7f',181+sx,301,7,4)
}

function dogBack(c: Ink) {
  box(c,'#374e44',0,0,384,344)
  for(let y=0;y<344;y+=16) for(let x=0;x<384;x+=16) {
    if(grain(x,y)<27) box(c,'#50664d',x+3,y+5,4,2)
  }
  poly(c,'#283c3a',[125,86,255,84,271,237,242,290,154,300,114,252])
  for(const [x,y] of [[121,146],[235,146],[117,248],[239,248]]) {
    poly(c,'#704b4e',[x-11,y-14,x+25,y-18,x+28,y+21,x+10,y+26,x-14,y+17])
    box(c,'#b38158',x-7,y-7,27,22)
    box(c,'#ead09a',x-6,y+14,24,5)
  }
  poly(c,'#573a4a',[128,123,148,104,234,101,253,127,251,179,244,205,250,251,230,280,154,284,133,258,138,206])
  poly(c,'#ae7554',[134,129,152,110,229,108,247,133,243,178,238,208,243,250,224,275,160,278,139,253,144,208])
  poly(c,'#e4a56d',[144,141,159,115,227,115,238,139,227,161,220,210,229,252,215,264,168,267,153,253,162,205])
  poly(c,'#7f544d',[161,150,182,128,211,134,225,164,217,193,198,193,191,184,165,189])
  poly(c,'#f0bd7c',[154,64,167,42,213,42,231,58,234,96,223,121,160,121,149,100])
  poly(c,'#79494c',[161,62,149,53,127,64,129,112,142,124,156,108])
  poly(c,'#79494c',[221,58,239,52,255,65,251,113,237,125,222,103])
  box(c,'#85514c',178,38,30,12)
  box(c,'#ba5257',157,108,70,11)
  box(c,'#f9dc8e',185,112,14,12)
  for(let i=0;i<62;i++) {
    const x=148+grain(i,31)%90,y=135+grain(i,113)%122
    box(c,i%2?'#d89964':'#eeb67c',x,y,3,1)
  }
}

export function backdrop(c: Ink, w: number, h: number, clock: number, dark = false) {
  const sky = dark ? '#172129' : '#243f48'
  box(c,sky,0,0,w,h)
  for(let i=0;i<6;i++) box(c,dark?'#1d2930':['#2c4950','#365556','#46615e','#59706a','#657a6b','#7a8873'][i],0,h*(.23+i*.069),w,Math.ceil(h*.08))
  const sx=Math.round(w*(w<400?.68:.77)), sy=Math.round(h*(w<400?.39:.30))
  poly(c,dark?'#42414a':'#efc689',[sx-33,sy-40,sx+32,sy-40,sx+43,sy-28,sx+43,sy+25,sx+27,sy+39,sx-28,sy+39,sx-43,sy+24,sx-43,sy-26])
  for (let i=0;i<34;i++) {
    const x=grain(i,13)*w/101,y=grain(i,16)*h*.006
    box(c,i%8===0?'#e7a774':'#b8ba8a',x,y,i%5===0?2:1,1)
  }
  for(let i=0;i<Math.ceil(w/31);i++) {
    const bx=i*31, base=Math.round(h*.79), bh=24+grain(i,3)%69
    const roof=dark?'#253139':i%3===0?'#345653':'#254b4e'
    box(c,dark?'#202c34':'#2d4546',bx,base-bh,30,bh+12)
    poly(c,roof,[bx-4,base-bh+4,bx+13,base-bh-15,bx+33,base-bh+4])
    box(c,dark?'#635557':'#e8b477',bx+8,base-bh+16,6,8)
    box(c,roof,bx+10,base-bh+16,1,8)
  }
  box(c,'#24373b',0,h*.79,w,h*.22)
  for(let y=Math.round(h*.80);y<h;y+=9) for(let x=-17;x<w;x+=24) {
    const shift= y%2===0?12:0
    box(c,'#35494a',x+shift+1,y,22,7)
    if(grain(x,y)>48) box(c,'#435552',x+shift+4,y+1,12,1)
  }
  const px=Math.round(w*(w<400?.52:.75)), py=Math.round(h*(w<400?.69:.87))
  if(dark) {
    const cx=Math.round(w*.5), cy=Math.round(h*.81)
    poly(c,'#0f1720',[cx-32,cy,cx-28,cy-57,cx-19,cy-79,cx-12,cy-81,cx-17,cy-103,cx-8,cy-117,cx+12,cy-117,cx+20,cy-103,cx+17,cy-83,cx+32,cy-68,cx+39,cy,cx+16,cy-9,cx+12,cy-32,cx+1,cy-32,cx-1,cy-9])
    poly(c,'#393442',[cx-28,cy-6,cx-22,cy-61,cx-11,cy-73,cx-9,cy-50,cx-14,cy-17])
    box(c,'#7e6e65',cx-41,cy-62,5,55)
    box(c,'#ae8e6c',cx-49,cy-63,20,4)
  } else {
    box(c,'#17292e',px-62,py-8,123,15)
    hero(c,px,py-4+Math.round(Math.sin(clock*2)*2),0,1,w<400?3:4,true)
    fleaArt(c,px+Math.round(w*.16),py-8-Math.round(Math.abs(Math.sin(clock*1.8))*19),true,1.25)
    for(const [x,y] of [[px-69,py-101],[px+65,py-123],[px+76,py-86]]) {
      box(c,'#ffdf9c',x-4,y,9,1)
      box(c,'#ffdf9c',x,y-4,1,9)
    }
  }
}

export function battleBase(c: Ink, p: TownPerson) {
  if(p.id==='dog') { dogBack(c); return }
  const royal=p.id==='royal'||p.id==='challenge'
  const [base, hi, shade]=p.shirt
  box(c,'#253b3d',0,0,384,344)
  for(let x=0;x<384;x+=24) {
    box(c,'#2c4545',x+1,0,2,273)
    box(c,'#304947',x+3,0,20,2)
  }
  box(c,'#1b3036',0,288,384,56)
  for(let x=-12;x<384;x+=26) box(c,'#294047',x,302,24,1)
  if(royal) {
    box(c,'#3c2c46',0,0,384,344)
    for(const x of [14,339]) {
      box(c,'#683849',x,0,30,282)
      box(c,'#a75562',x+4,0,9,282)
      box(c,'#dfab6e',x,251,30,5)
    }
    box(c,'#827080',45,283,294,5)
  }
  const wide=p.id==='guard'||p.id==='soldier'?15:p.id==='grocer'?-9:0
  const skin=p.id==='grocer'?'#c98770':'#d59672'
  const skinLight=p.id==='grocer'?'#e7ac87':'#f2bc90'
  const skinDark='#935c56'
  poly(c,edge,[57-wide,311,49-wide,289,52-wide,180,63-wide,148,82-wide,128,117,111,149,105,156,87,149,74,146,44,154,29,172,18,208,16,230,26,241,42,241,73,231,92,237,107,266,113,302+wide,129,322+wide,152,336+wide,192,339+wide,290,327+wide,316])
  poly(c,skin,[62-wide,303,55-wide,282,58-wide,180,73-wide,151,111,133,270,129,310+wide,148,329+wide,196,333+wide,281,321+wide,307])
  poly(c,skinDark,[54-wide,267,69-wide,250,85,267,89,304,67-wide,308,55-wide,294])
  poly(c,skinLight,[307+wide,186,320+wide,189,328+wide,228,329+wide,264,317+wide,256])
  poly(c,skin,[161,77,226,75,228,96,236,112,225,125,160,124,150,112,159,96])
  box(c,skinDark,162,91,64,13)
  poly(c,skinLight,[154,49,165,29,212,26,233,44,235,71,227,87,213,94,167,93,155,80])
  box(c,skin,148,62,12,16)
  box(c,skin,230,61,13,16)
  const hair=p.hair
  if(p.id==='baker') {
    poly(c,hair,[153,53,160,39,226,36,236,53,236,71,224,76,223,82,175,83,157,73])
    poly(c,'#e9ddbb',[149,48,148,28,156,20,170,21,177,12,205,12,216,18,231,18,240,29,239,49,225,55,164,55])
    poly(c,'#fff0d1',[152,34,151,27,161,23,174,25,180,16,204,16,213,23,229,22,236,30,235,35])
    box(c,'#bfae96',160,47,69,7)
  } else if(p.id==='grocer') {
    poly(c,hair,[151,47,157,31,171,21,218,20,234,33,239,49,235,72,222,80,166,80,154,71])
    box(c,'#60617a',168,28,49,3)
    box(c,'#9ab879',153,52,83,5)
    poly(c,hair,[180,73,200,73,210,86,208,100,194,105,181,95])
  } else if(royal) {
    poly(c,hair,[153,47,171,27,219,27,238,47,236,75,220,90,169,88,153,72])
    poly(c,'#5b4053',[147,51,144,21,165,31,191,10,216,31,242,21,239,51])
    poly(c,'#e1ae63',[150,47,148,26,167,36,191,15,215,36,238,26,236,47])
    box(c,'#fff1a5',157,43,73,4)
    box(c,'#b84e69',188,28,8,10)
  } else {
    poly(c,hair,[151,49,159,29,175,20,215,19,235,35,241,53,230,79,217,83,170,83,153,70])
    poly(c,'#92aab9',[148,54,148,41,159,27,177,18,209,17,230,24,241,40,244,54])
    poly(c,'#b7c9ce',[153,47,155,39,170,28,194,22,212,24,220,28,184,28,169,36,164,47])
    box(c,'#556e83',149,53,92,7)
    box(c,'#bccbd1',183,15,15,6)
  }
  poly(c,shade,[57-wide,178,67-wide,152,91-wide,130,120,116,150,108,162,119,221,119,237,108,265,115,297+wide,127,319+wide,151,332+wide,178,307+wide,200,298+wide,193,297+wide,312,232,325,141,325,87-wide,313,86-wide,194,77-wide,201])
  poly(c,base,[62-wide,173,74-wide,147,111,125,152,114,166,125,221,125,239,114,271,123,305+wide,141,325+wide,174,308+wide,192,293+wide,184,289+wide,304,232,318,144,318,94-wide,307,91-wide,183,77-wide,193])
  poly(c,hi,[73-wide,157,86-wide,143,119,127,151,118,170,131,213,131,239,118,272,128,300+wide,145,311+wide,158,278,149,246,137,221,144,165,144,142,137,105,149])
  box(c,shade,191,149,2,151)
  box(c,hi,194,156,1,143)
  for(let i=0;i<110;i++) {
    const x=99+grain(i,91)*1.86,y=146+grain(i,61)*1.59
    if(x<110&&y<163) continue
    box(c,'#fce0a119',x,y,i%8===0?6:2,1)
  }
  poly(c,'#212f3828',[95-wide,276,124,292,188,300,250,294,288+wide,277,289+wide,304,232,318,144,318,94-wide,307])
  if(p.id==='baker') {
    poly(c,'#edd3aa',[99,140,105,136,155,201,150,209])
    poly(c,'#edd3aa',[282,140,277,136,223,207,229,211])
    box(c,'#f0d9af',92,281,200,8)
    box(c,'#c9ac8f',92,287,200,2)
    box(c,'#fbebc5',180,278,23,15)
    box(c,'#b79b84',189,280,5,10)
  } else if(p.id==='grocer') {
    for(let j=0;j<4;j++) {
      box(c,'#c1bf7e',96,270+j*5,192,1)
      box(c,'#c1bf7e',106,153+j*5,42-j*7,1)
      box(c,'#c1bf7e',238+j*7,153+j*5,42-j*7,1)
    }
  } else if(royal) {
    poly(c,'#eed7ac',[79,154,132,129,153,117,171,132,215,132,238,118,266,126,301,150,280,151,266,140,215,153,169,153,131,139])
    box(c,'#e7b56e',99,272,187,5)
    box(c,'#e7b56e',92,284,200,5)
    for(const [x,y] of [[174,177],[211,192],[151,236],[207,259],[241,239]]) box(c,'#eab57a',x,y,5,3)
  } else {
    for(let j=0;j<4;j++) {
      box(c,'#abc1c4',76+j*4,161-j*6,27,4)
      box(c,'#abc1c4',281-j*4,143+j*6,27,4)
    }
    box(c,'#40546a',80,286,224,13)
    box(c,'#b4a68e',178,283,28,18)
    box(c,'#445c70',182,286,20,12)
  }
}

export function toolArt(c: Ink,x: number,y: number,active: boolean) {
  c.save()
  c.translate(Math.round(x),Math.round(y))
  const tone=active?light:wood
  poly(c,edge,[-8,4,-10,-3,-8,-11,-5,-11,-5,-5,-3,-5,-3,-14,1,-14,1,-6,4,-6,4,-13,8,-13,8,-5,11,-7,14,-4,10,5,7,7,44,48,44,55,37,58,0,13])
  poly(c,tone,[-6,3,-8,-3,-7,-8,-6,-5,-6,-3,-1,-3,-1,-12,0,-12,0,-4,6,-4,6,-11,7,-11,7,-3,11,-5,12,-4,8,4,4,6,42,49,42,54,38,55,1,11])
  poly(c,darkWood,[3,9,42,51,41,54,38,53,1,12])
  box(c,'#a84946',33,45,4,7)
  c.restore()
}


