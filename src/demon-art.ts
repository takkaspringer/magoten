import { box, fleaArt, hero, label, personArt, poly } from './art'
import type { Camera } from './art'
import { people } from './data'
import type { Point, TownPerson } from './data'
import { bridgeLock, demonPeople, demonPortal, demonWorld, kingdomPortal, smallDoorLock } from './demon'

type Ink = CanvasRenderingContext2D
const ink='#27273e'
const dog=people.find(p=>p.id==='dog')!
const king=people.find(p=>p.id==='royal')!
const luruka=demonPeople[4]
const seed=(x: number,y: number)=>((Math.imul(x+7,1103515245)^Math.imul(y+5,26717))>>>4)%97

function star(c: Ink,x: number,y: number,r: number,color: string) {
  poly(c,color,[x,y-r,x+2,y-2,x+r,y,x+2,y+2,x,y+r,x-2,y+2,x-r,y,x-2,y-2])
}

export function portalArt(c: Ink,p: Point,time: number) {
  const {x,y}=p
  box(c,'#261d37',x-32,y-4,64,8)
  poly(c,'#332546',[x-30,y,x-30,y-30,x-19,y-52,x,y-63,x+20,y-52,x+30,y-30,x+30,y])
  poly(c,'#ad6cd1',[x-26,y-3,x-26,y-29,x-16,y-49,x,y-57,x+16,y-49,x+26,y-29,x+26,y-3])
  poly(c,'#553766',[x-19,y-3,x-19,y-27,x-11,y-44,x,y-50,x+11,y-44,x+19,y-27,x+19,y-3])
  box(c,'#241e44',x-14,y-27,28,23)
  for(let i=0;i<7;i++) {
    const at=(time*1.2+i*.29)%1
    const px=x+(i%4-1.5)*9
    const py=y-4-at*44
    star(c,Math.round(px+3*Math.sin(time+i)),Math.round(py),i%3===0?4:2,i%2===0?'#e5a9f0':'#8dd6ca')
  }
  box(c,'#efd49c',x-17,y-2,34,2)
}

function hut(c: Ink,x: number,y: number,w: number,h: number) {
  box(c,ink,x-5,y+12,w+10,h-9)
  box(c,'#b78679',x,y+32,w,h-33)
  poly(c,'#4d455f',[x-9,y+39,x+9,y-9,x+w-13,y-9,x+w+9,y+39])
  poly(c,'#7a5575',[x-4,y+34,x+13,y-5,x+w-16,y-5,x+w+4,y+34])
  for(let dy=4;dy<35;dy+=8) {
    box(c,'#594464',x+12-dy*.26,y+dy,w-20+dy*.53,2)
    for(let dx=16;dx<w-14;dx+=15) box(c,'#96647e',x+dx,y+dy-4,7,2)
  }
  box(c,'#62475b',x+w*.44,y+h-24,22,24)
  box(c,'#d7a288',x+w*.44+3,y+h-21,3,19)
  for(const px of [x+15,x+w-33]) {
    box(c,'#5d4054',px,y+43,20,14)
    box(c,'#f5ca87',px+3,y+46,14,9)
    box(c,'#a56165',px+9,y+45,2,11)
  }
}

function mushroom(c: Ink,x: number,y: number,r: number,lit: boolean) {
  box(c,'#313a46',x-4,y-15,9,16)
  box(c,lit?'#b8cf9d':'#648773',x-3,y-15,6,14)
  poly(c,'#304553',[x-r-2,y-12,x-r+3,y-r-13,x+r-3,y-r-13,x+r+2,y-12])
  poly(c,lit?'#a5e4b9':'#497e76',[x-r,y-14,x-r+4,y-r-11,x+r-4,y-r-11,x+r,y-14])
  box(c,lit?'#f4e1a5':'#729c86',x-5,y-r-8,6,3)
  if(lit) star(c,x+r+5,y-r-10,4,'#a5edcf')
}

function cart(c: Ink,x: number,y: number) {
  box(c,'#4c3d5c',x,y+3,62,25)
  box(c,'#9c6d79',x+3,y,56,19)
  for(let dx=3;dx<60;dx+=11) box(c,'#b6847e',x+dx,y+5,7,3)
  for(const dx of [9,47]) {
    box(c,'#312f48',x+dx,y+16,13,16)
    box(c,'#c49381',x+dx+4,y+20,5,6)
  }
  box(c,'#bf8a80',x+64,y+10,17,3)
}

function sign(c: Ink,x: number,y: number,text: string) {
  box(c,'#44354a',x-33,y-9,66,18)
  box(c,'#79586a',x-31,y-7,62,14)
  label(c,text,x,y,'#ffdcad',10)
}

let terrain: HTMLCanvasElement|undefined
function map() {
  const out=document.createElement('canvas')
  out.width=demonWorld.w
  out.height=demonWorld.h
  const c=out.getContext('2d')!
  for(let y=0;y<out.height;y+=24) for(let x=0;x<out.width;x+=24) {
    const n=seed(x,y)
    const palette=y<252?['#52516e','#4c4b64','#5b536c']:y<432?['#544458','#564a61','#483e55']:
      y<603?['#625378','#6b587e','#5c5075']:y<802?['#335657','#385b58','#3e655e']:['#795768','#795469','#825d6e']
    box(c,palette[n%3],x,y,24,24)
    box(c,'#e5c7a421',x+n%13,y+5+n%11,7,1)
    if(y<432) box(c,'#3c344a',x,y+23,24,1)
  }
  box(c,'#392d49',0,0,out.width,22)
  box(c,'#3b2e4c',0,0,20,out.height)
  box(c,'#3b2e4c',out.width-20,0,20,out.height)
  box(c,'#3b2e4c',0,out.height-20,out.width,20)
  for(let y=802;y<858;y+=7) {
    box(c,'#36566d',0,y,out.width,7)
    for(let x=12;x<out.width;x+=45) box(c,'#648c91',x+seed(x,y)%15,y+2,22,1)
  }
  for(const y of [800,856]) box(c,'#4b425c',20,y,out.width-40,5)
  hut(c,55,875,155,68)
  hut(c,410,884,133,80)
  sign(c,130,923,'薬屋')
  sign(c,473,944,'包帯屋')
  for(const x of [226,369]) box(c,'#55415a',x,889,4,49)
  box(c,'#d8ae9a',229,898,142,2)
  for(let x=236;x<366;x+=24) {
    box(c,'#d1af9d',x,900,15,20+(x%3)*3)
    box(c,'#edccac',x+1,900,11,3)
  }
  cart(c,771,455)
  cart(c,357,493)
  sign(c,696,543,'魔界道路')
  sign(c,444,760,'魔界の森')
  sign(c,287,996,'魔界村')
  box(c,'#382c46',0,216,515,35)
  box(c,'#382c46',577,216,479,35)
  box(c,'#95777d',0,216,515,7)
  box(c,'#95777d',577,216,479,7)
  box(c,'#3e334e',0,20,292,196)
  box(c,'#3e334e',765,20,291,196)
  box(c,'#61425d',472,86,148,128)
  box(c,'#b86c7c',480,91,132,126)
  box(c,'#efc089',485,93,4,123)
  box(c,'#efc089',602,93,4,123)
  box(c,'#a46b82',484,38,94,50)
  box(c,'#4d3657',492,46,79,34)
  star(c,531,60,12,'#f9d994')
  box(c,'#774557',480,253,135,146)
  box(c,'#c28987',485,257,4,138)
  box(c,'#c28987',604,257,4,138)
  box(c,'#312d45',394,241,91,71)
  poly(c,'#403047',[394,294,394,263,416,238,461,238,485,263,485,294])
  box(c,'#927284',434,259,5,33)
  for(const x of [333,736]) {
    box(c,'#302e4b',x,258,29,100)
    box(c,'#827689',x+4,264,19,82)
    box(c,'#b28c8f',x+3,325,23,7)
  }
  sign(c,656,368,'大広間')
  return out
}

function creature(c: Ink,p: TownPerson,x: number,y: number,t: number,well: boolean) {
  const bob=well?Math.round(Math.sin(t*5)):Math.round(Math.sin(t*17)*2)
  const headY=y-29+bob
  const [base,hi,dark]=p.shirt
  box(c,ink,x-15,y-4,31,5)
  box(c,dark,x-12,y-8,8,8)
  box(c,dark,x+4,y-8,8,8)
  box(c,dark,x-16,y-23+bob,32,16)
  box(c,base,x-12,y-25+bob,24,19)
  box(c,hi,x-9,y-24+bob,18,3)
  if(p.id==='kerberos') {
    for(let i=-1;i<=1;i++) {
      const xx=x+i*16
      const yy=headY+(well?2:Math.round(Math.sin(t*7+i)*3))
      box(c,dark,xx-7,yy-5,14,16)
      box(c,base,xx-5,yy-3,10,12)
      box(c,hi,xx-3,yy+3,8,5)
      box(c,'#f2d694',xx-3,yy,2,2)
      box(c,ink,xx+3,yy+4,3,2)
    }
  } else {
    box(c,ink,x-13,headY-13,26,22)
    box(c,p.hair,x-11,headY-11,22,18)
    box(c,'#f4dab1',x-7,headY-4,14,9)
    box(c,'#533a53',x-5,headY-2,2,3)
    box(c,'#533a53',x+3,headY-2,2,3)
    box(c,well?'#a94f65':'#75516b',x-2,headY+3,5,2)
    if(p.id==='maki') {
      for(let i=0;i<3;i++) box(c,'#ebd5b1',x-12+(i%2)*3,headY-10+i*6,20,2)
      if(well) {
        const hand=x+15+Math.round(Math.sin(t*9)*3)
        box(c,'#ebe0b2',hand-2,y-33,5,15)
      }
    } else if(p.id==='kasane') {
      poly(c,'#8cc5a2',[x-18,headY-7,x-13,headY-19,x+12,headY-19,x+18,headY-7])
      box(c,'#d7e0ad',x-7,headY-17,5,4)
      box(c,'#d7e0ad',x+5,headY-13,4,3)
    } else if(p.id==='luruka') {
      poly(c,'#f0dab1',[x-14,headY-8,x-19,headY-19,x-10,headY-14,x-7,headY-8])
      poly(c,'#f0dab1',[x+14,headY-8,x+19,headY-19,x+10,headY-14,x+7,headY-8])
      poly(c,'#efc482',[x-10,headY-9,x-13,headY-21,x-5,headY-17,x,headY-24,x+5,headY-17,x+13,headY-21,x+10,headY-9])
      star(c,x,headY-14,4,'#fff1bf')
      star(c,x+4,y-20,4,'#f7cd8d')
    } else box(c,'#a0a4ac',x-12,headY-10,24,5)
  }
  if(!well) label(c,'…かゆい！',x,y-62,'#ffd6a6',11)
}

export function demonTown(c: Ink,cam: Camera,player: Point,saved: string[],clock: number,moving: boolean,facing: number,
  companion?: Point,subdued=false) {
  terrain ??= map()
  c.drawImage(terrain,cam.x,cam.y,cam.w,cam.h,0,0,cam.w,cam.h)
  c.save()
  c.translate(-cam.x,-cam.y)
  const artTime=subdued?0:clock
  portalArt(c,demonPortal,artTime)
  if(saved.includes('maki')) {
    const {x,y,w,h}=bridgeLock
    box(c,'#49445a',x,y,w,h)
    box(c,'#c6a998',x+3,y+1,w-6,h-2)
    for(let dy=4;dy<h;dy+=6) {
      box(c,'#eed2aa',x+5,y+dy,w-10,3)
      box(c,'#ad8e84',x+16,y+dy+3,w-32,1)
    }
  }
  if(saved.includes('knight')) {
    box(c,'#6d5068',smallDoorLock.x,smallDoorLock.y,smallDoorLock.w,smallDoorLock.h)
    box(c,'#d6a481',smallDoorLock.x+5,smallDoorLock.y+2,smallDoorLock.w-10,3)
    box(c,'#ead0a0',smallDoorLock.x+8,smallDoorLock.y+11,smallDoorLock.w-16,2)
    sign(c,617,237,'こちら')
  } else {
    box(c,'#54465f',smallDoorLock.x,smallDoorLock.y,smallDoorLock.w,smallDoorLock.h)
    box(c,'#463b51',smallDoorLock.x,smallDoorLock.y+7,smallDoorLock.w,4)
  }
  const forestSaved=saved.includes('kasane')
  for(let i=0;i<22;i++) {
    const px=133+i*36,py=756-((i*39)%133)
    const lights=forestSaved?(artTime*4+i)%12<6:seed(i,20)<28&&Math.sin(artTime+i)>.32
    mushroom(c,px,py,10+i%3*4,lights)
  }
  const actors=[
    ...demonPeople.map(p=>({y:p.at.y,draw:()=>creature(c,p,p.at.x,p.at.y,artTime,saved.includes(p.id))})),
    {y:player.y,draw:()=>hero(c,player.x,player.y,moving?Math.floor(clock*9):0,facing)},
  ]
  if(companion) actors.push({y:companion.y,draw:()=>personArt(c,dog,companion.x,companion.y,Math.floor(artTime*11),true)})
  if(saved.includes('kerberos')) {
    const a=demonPeople[2].at
    actors.push({y:a.y+2,draw:()=>personArt(c,dog,a.x+42+Math.round(Math.sin(artTime*5)*2),a.y+4,Math.floor(artTime*6),true)})
  }
  actors.sort((a,b)=>a.y-b.y).forEach(a=>a.draw())
  c.restore()
}

export function kingdomArrival(c: Ink,cam: Camera,line: number,time: number,subdued: boolean) {
  c.save()
  c.translate(-cam.x,-cam.y)
  const px=kingdomPortal.x
  const py=kingdomPortal.y
  const t=subdued?0:time
  portalArt(c,kingdomPortal,t)
  if(line>=0) {
    const slide=line===0&&!subdued?Math.max(0,1-t*2.1)*43:0
    const x=px-43+slide
    const y=py+22+Math.round(Math.sin(slide*.12)*4)
    poly(c,'#eee1c7',[x-21,y-44,x-41,y-45,x-39,y-29,x-32,y-34,x-28,y-28,x-21,y-31])
    box(c,'#b18c75',x-22,y-45,3,39)
    const messenger={...demonPeople[4],name:'使者',shirt:['#716184','#a5a0bf','#433552'] as TownPerson['shirt']}
    creature(c,messenger,x,y,t,true)
    if(line<3) box(c,'#6d6883',x-11,y-46,22,7)
    if(line>=3&&line<7) {
      const hop=subdued?12:Math.abs(Math.sin(t*4))*21
      fleaArt(c,x+15+t%1*29,y-52-hop)
      for(const [gx,gy] of [[x+51,y+35],[x+76,y+17]]) {
        creature(c,demonPeople[3],gx,gy,t,false)
        box(c,'#f2cf9b',gx+8+Math.round(Math.sin(t*13)*4),gy-21,5,5)
      }
    }
  }
  if(line===7) {
    const jump=subdued?1:Math.min(1,time*1.65)
    if(jump<.94) personArt(c,dog,px-90+jump*90,py+54-jump*54-Math.sin(jump*Math.PI)*22,Math.floor(t*10),true)
  }
  c.restore()
}

export function demonEndingArt(c: Ink,cam: Camera,line: number,time: number) {
  c.save()
  c.translate(-cam.x,-cam.y)
  if(line===3) {
    portalArt(c,{x:651,y:158},time)
    personArt(c,king,651,161,0,true,false)
  }
  if(line===5) {
    box(c,'#a36c72',604,180,51,15)
    box(c,'#f1dcaf',615,176,31,12)
    personArt(c,dog,622+Math.round(Math.sin(time*3)*3),184,Math.floor(time*8),true)
    star(c,641,176,4,'#ffc488')
  }
  c.restore()
}

export function waitingScene(c: Ink,w: number,h: number,time: number) {
  box(c,'#39354d',0,0,w,h)
  for(let y=0;y<h;y+=17) for(let x=0;x<w;x+=18) {
    box(c,seed(x,y)%2?'#51455c':'#584861',x+1,y+1,17,16)
  }
  portalArt(c,{x:Math.round(w*.19),y:Math.round(h*.32)},time)
  const y=Math.round(h*.52)
  const left=Math.round(w*.08)
  const width=Math.round(w*.84)
  box(c,'#322c49',left-3,y+8,width+6,19)
  box(c,'#9f6c77',left,y,width,13)
  box(c,'#c69384',left+2,y+1,width-4,3)
  for(const f of [0.19,0.36,0.55,0.72,0.85]) box(c,'#6f556b',Math.round(w*f),y+13,6,12)
  const xx=[.21,.32,.46,.60,.73,.85].map(f=>Math.round(w*f))
  personArt(c,people[0],xx[0],y+6,0,true,false)
  personArt(c,king,xx[1],y+6,0,true,false)
  creature(c,luruka,xx[2],y+6,time,true)
  creature(c,demonPeople[0],xx[3],y+6,time,true)
  creature(c,demonPeople[1],xx[4],y+6,time,true)
  personArt(c,dog,xx[5],y+10,Math.floor(time*7),true)
  for(const [i,n] of [[1,'2'],[2,'3']] as const) {
    box(c,'#fff1d0',xx[i]+7,y-21,10,9)
    label(c,n,xx[i]+12,y-16,'#543858',8)
  }
  hero(c,Math.round(w*.52),y+50,0)
}

export function demonBack(c: Ink,p: TownPerson) {
  const [base,highlight,shade]=p.shirt
  const scene=p.id==='maki'?'#654855':p.id==='kasane'?'#24454d':p.id==='kerberos'?'#493e60':'#362f4b'
  box(c,scene,0,0,384,344)
  for(let y=18;y<344;y+=18) {
    for(let x=10;x<384;x+=23) if(seed(x,y)>80) box(c,'#ead5ac26',x,y,6,2)
  }
  if(p.id==='kasane') {
    for(const [x,y,r] of [[28,308,15],[349,309,18],[367,139,13],[28,141,22]]) mushroom(c,x,y,r,true)
  } else if(p.id==='maki') {
    for(const x of [17,338]) {
      box(c,'#4f384f',x,0,27,310)
      box(c,'#9c6d72',x+3,23,3,275)
      box(c,'#d3a47f',x+9,32,6,83)
    }
  } else {
    for(const x of [22,323]) {
      box(c,'#52334f',x,0,38,286)
      box(c,'#a3607b',x+5,0,6,286)
      box(c,'#d9aa87',x,253,38,4)
    }
  }
  const outline=[64,307,54,248,62,178,76,147,110,122,151,105,160,82,225,82,231,104,276,122,311,145,325,177,333,250,319,311,279,326,106,326]
  poly(c,ink,outline)
  poly(c,shade,[65,294,61,244,69,181,86,151,118,131,152,111,176,101,208,101,236,112,267,130,301,153,318,183,326,245,313,303,274,320,109,319])
  poly(c,base,[77,292,73,239,84,173,101,150,134,129,156,121,180,114,206,114,226,122,254,129,285,151,305,174,314,243,306,294,270,312,112,310])
  poly(c,highlight,[81,185,91,160,111,145,144,128,163,122,188,128,223,121,255,133,287,157,303,181,281,174,253,154,221,143,197,151,162,143,133,154,109,172])
  poly(c,'#332a421f',[83,236,104,250,122,271,272,270,300,249,307,240,304,291,269,310,112,309,80,288])
  poly(c,shade,[66,201,77,169,95,177,90,234,88,271,66,282,61,256])
  poly(c,shade,[285,180,303,170,321,202,327,253,318,280,296,271,294,224])
  box(c,'#efc99b36',82,219,5,51)
  box(c,'#efc99b36',300,219,5,51)
  if(p.id==='kerberos') {
    for(const x of [126,193,258]) {
      poly(c,'#392e49',[x-27,110,x-28,62,x-16,48,x+15,47,x+28,61,x+28,104,x+14,124,x-15,124])
      poly(c,'#ae7882',[x-22,104,x-22,64,x-13,53,x+13,53,x+22,64,x+22,103,x+10,115,x-11,115])
      box(c,'#5c415e',x-28,67,11,32)
      box(c,'#7b526c',x+16,68,10,27)
      box(c,'#e6aa96',x-11,61,22,3)
    }
    for(const x of [140,190,242]) poly(c,shade,[x-7,292,x+6,291,x+22,319,x+16,332,x+7,328,x+7,315])
  } else {
    poly(c,ink,[151,99,142,65,151,37,172,25,213,24,233,36,243,63,234,100,219,116,168,116])
    poly(c,p.hair,[156,94,149,66,157,41,176,31,211,30,229,42,236,65,229,94,216,108,171,108])
  }
  if(p.id==='maki') {
    for(let i=0;i<6;i++) {
      const y=47+i*10
      box(c,'#d9baa1',151+(i%3)*4,y,77-(i%3)*6,5)
      box(c,'#eed5ad',154+(i%3)*4,y,66-(i%3)*6,2)
    }
    for(let i=0;i<6;i++) {
      const y=137+i*29
      poly(c,'#e7c9a382',[93,y+11,288,y,292,y+7,94,y+19])
    }
  } else if(p.id==='kasane') {
    poly(c,'#8abe9f',[125,77,136,54,164,33,225,30,249,44,260,76,236,90,153,91])
    box(c,'#adc9a2',149,68,88,8)
    for(const [x,y] of [[163,56],[181,48],[207,51],[231,60]]) box(c,'#d6dfa9',x,y,8,5)
    for(const x of [113,269]) box(c,'#5f9a85',x,185,16,91)
  } else if(p.id==='knight') {
    poly(c,'#42475e',[137,75,143,44,165,28,220,27,241,43,248,75,232,94,152,94])
    box(c,'#a0a1aa',149,60,87,5)
    box(c,'#23293f',148,70,88,9)
    for(const dy of [173,202,233,262]) {
      box(c,'#2c3045',91,dy,202,6)
      box(c,'#a1a0a9',111,dy+1,162,2)
    }
  } else if(p.id==='luruka') {
    poly(c,'#edcfa9',[164,64,144,58,132,37,147,42,170,52])
    poly(c,'#edcfa9',[219,64,239,58,251,37,236,42,213,52])
    poly(c,'#b7759f',[155,81,162,59,222,58,230,81,225,110,209,137,193,144,177,134,158,110])
    box(c,'#e4a2bc',172,80,12,38)
    poly(c,'#f4ce85',[149,59,145,28,167,38,192,13,217,38,239,28,235,59])
    box(c,'#ffe7aa',152,55,81,4)
    star(c,192,39,10,'#fff0b7')
    poly(c,'#713f6b',[102,157,140,143,170,153,214,153,244,143,282,157,274,172,240,161,217,172,167,172,143,161,110,173])
    star(c,192,163,12,'#ffe08c')
    for(const [x,y] of [[105,287],[141,300],[239,300],[275,287]]) star(c,x,y,7,'#dc969d')
    box(c,'#cd859d',107,307,171,4)
  }
}

export function paw(c: Ink,x: number,y: number,color='#ffe3a1') {
  box(c,'#382d4a',x-12,y-10,24,20)
  box(c,color,x-5,y+1,10,6)
  for(const [dx,dy] of [[-7,-3],[0,-7],[7,-3]]) box(c,color,x+dx-2,y+dy-2,5,5)
}

export function victoryArt(c: Ink,p: TownPerson,t: number,subdued: boolean) {
  const kind=p.id
  const y=322-Math.min(1,t*.9)*20
  if(!subdued&&t>.63) {
    for(let i=0;i<22;i++) {
      const phase=t*1.12+i*.47
      const x=192+Math.sin(phase*1.3)*(77+i*3.1)
      const py=165+Math.cos(phase)*(65+i*2)
      if(kind==='maki') box(c,i%2===0?'#ffe6b3':'#dbb896',x,py,9,2)
      else if(kind==='kerberos') {
        if(i%5===0) paw(c,x,py)
      } else star(c,Math.round(x),Math.round(py),i%4===0?5:2,kind==='kasane'?'#a6f0c9':'#ffc393')
    }
  }
  if(t>.45) {
    box(c,'#31283f',144,y-41,96,47)
    box(c,'#564360',146,y-39,92,42)
    creature(c,p,192,y,subdued?0:t,true)
  }
}
