/* 우리 가족 하루 — 자녀는 보고하고, 부모님은 확인(수락)하는 가족 앱
   자료는 이 기기 브라우저(localStorage)에만 저장 */
(function(){
'use strict';
var KEY = 'uri-gajok-v1';

/* 실제 이름은 코드에 넣지 않음(기기·서버에만 저장). 처음 기기는 아래 이름으로 시작 → 설정에서 바꿈 */
var DEFAULT_MEMBERS = [
  {id:'dad',  name:'아빠',        role:'아빠',   emoji:'🐻', color:'#4f8cff', kid:false, grade:''},
  {id:'mom',  name:'엄마',        role:'엄마',   emoji:'🐰', color:'#ff6fa5', kid:false, grade:''},
  {id:'girl', name:'딸',          role:'딸',     emoji:'🐱', color:'#b06bff', kid:true,  grade:'초등 4학년'},
  {id:'boy1', name:'쌍둥이 형',   role:'쌍둥이', emoji:'🐯', color:'#ff9a2e', kid:true,  grade:'초등 3학년'},
  {id:'boy2', name:'쌍둥이 동생', role:'쌍둥이', emoji:'🐶', color:'#22b573', kid:true,  grade:'초등 3학년'}
];
/* 동물 친구: 레벨이 오를수록 자람 */
var PETS = [
  {ic:'🥚', nm:'신비한 알'}, {ic:'🐣', nm:'아기 병아리'}, {ic:'🐥', nm:'꼬꼬 병아리'}, {ic:'🐤', nm:'씩씩한 병아리'},
  {ic:'🦆', nm:'꽥꽥 오리'}, {ic:'🦢', nm:'우아한 백조'}, {ic:'🦚', nm:'멋쟁이 공작'}, {ic:'🦄', nm:'반짝 유니콘'},
  {ic:'🐲', nm:'아기 용'}, {ic:'🐉', nm:'하늘 용'}
];
var PET_TALK = ['오늘도 힘내!','미션 다 하면 같이 놀자!','너랑 있으면 좋아 💛','숙제 먼저 하자~','칭찬받으면 나도 쑥쑥 자라!','간지러워 히히','방 정리 같이 할까?','최고야! 👍'];
/* 보상 상점 기본 목록 (부모님이 설정에서 바꿀 수 있음) */
var DEFAULT_REWARDS = [
  {id:'free10', ic:'🎮', nm:'자유시간 10분 더',   cost:30},
  {id:'snack',  ic:'🍦', nm:'간식 고르기',        cost:50},
  {id:'movie',  ic:'📺', nm:'주말 영화 고르기',   cost:80},
  {id:'dinner', ic:'🍗', nm:'저녁 메뉴 고르기',   cost:100},
  {id:'late',   ic:'🛏️', nm:'30분 늦게 자기',     cost:150},
  {id:'gift',   ic:'🎁', nm:'작은 선물',          cost:300}
];
var EMOJIS = ['🐻','🐰','🐱','🐯','🐶','🦊','🐼','🐨','🐸','🐵','🦁','🐧','🐹','🦄','🐳','🐥'];
var LEVELS = ['새싹','떡잎','꽃봉오리','활짝 꽃','튼튼 나무','숲 지킴이','반짝 별','둥근 달','빛나는 해','우주 대장'];
var PER_LEVEL = 100;

/* 하루 미션: 이 4개를 부모님이 모두 수락하면 자유시간이 열림 */
var MISSIONS = [
  {k:'academy', ic:'🏫', nm:'학원 다녀오기', say:'학원 다녀왔습니다!',  pts:10, na:'오늘은 학원 없는 날'},
  {k:'hw',      ic:'✏️', nm:'숙제 끝내기',   say:'숙제 다 했어요!',     pts:20},
  {k:'wash',    ic:'🛁', nm:'씻기',          say:'깨끗이 씻었어요!',    pts:10},
  {k:'room',    ic:'🧹', nm:'방 정리',       say:'방 정리 다 했어요!',  pts:10}
];
var ALL_BONUS = 20;

var LOCAL_PHOTOS = [
  {f:'p10', cap:'호랑이 굴 앞에서 찰칵!'},
  {f:'p04', cap:'노란 유채꽃 나들이'},
  {f:'p07', cap:'과자 먹는 삼총사'},
  {f:'p03', cap:'신나는 소파 콘서트'},
  {f:'p12', cap:'아빠랑 꽃밭에서'},
  {f:'p01', cap:'선글라스 멋쟁이'},
  {f:'p02', cap:'아빠의 장난'},
  {f:'p08', cap:'모자 쓴 꼬마 신사'},
  {f:'p09', cap:'뾰로통 볼빵빵'},
  {f:'p11', cap:'공부도 놀이처럼'},
  {f:'p06', cap:'똘망똘망 눈빛'},
  {f:'p05', cap:'아빠 무릎 위에서'},
  {f:'p13', cap:'양에게 풀 주기'},
  {f:'p14', cap:'리본 공주님'},
  {f:'p15', cap:'셋이 나란히 찰칵'},
  {f:'p16', cap:'맛있는 한 상'},
  {f:'p17', cap:'아빠랑 셀카 나들이'},
  {f:'p18', cap:'하얀 카페 나들이'},
  {f:'p19', cap:'노란 벽 운동왕'},
  {f:'p20', cap:'침대 위 삼총사'},
  {f:'p21', cap:'개구쟁이 얼굴 콕'},
  {f:'p22', cap:'노란 티 멋쟁이'},
  {f:'p23', cap:'정원의 꽃공주'},
  {f:'p24', cap:'캡틴 출동!'},
  {f:'p25', cap:'마녀와 거미맨'},
  {f:'p26', cap:'아빠랑 쌍둥이'},
  {f:'p27', cap:'활짝 웃는 얼굴'},
  {f:'p28', cap:'겨울 멋쟁이'},
  {f:'p29', cap:'잠옷 파티'},
  {f:'p30', cap:'아빠와 딸 셀카'},
  {f:'p31', cap:'곰돌이 벽 앞에서'}
];
var FACES = {};
var PHOTOS = LOCAL_PHOTOS.slice();   // 서버 연결 시 서버 사진으로 바뀜
var BADGES = [
  {id:'m1',     ic:'🎯', nm:'첫 미션',     how:'미션을 처음 수락받았어요'},
  {id:'mall',   ic:'🏆', nm:'미션 완료',   how:'하루 미션 4개를 모두 끝냈어요'},
  {id:'mall5',  ic:'📚', nm:'성실왕',      how:'미션 모두 완료 5일'},
  {id:'ontime', ic:'⏰', nm:'약속 지킴이', how:'외출 후 제때 돌아오기 3번'},
  {id:'free5',  ic:'⌛', nm:'시간 관리왕', how:'자유시간 약속 지키기 5번'},
  {id:'rep1',   ic:'🌙', nm:'하루 마무리', how:'첫 마감 보고 수락'},
  {id:'st3',    ic:'🔥', nm:'3일 연속',    how:'마감 보고 3일 연속'},
  {id:'st7',    ic:'🌈', nm:'일주일 연속', how:'마감 보고 7일 연속'},
  {id:'praise', ic:'💌', nm:'칭찬 받음',   how:'부모님께 칭찬을 받았어요'},
  {id:'lv5',    ic:'⭐', nm:'레벨 5',      how:'레벨 5에 올랐어요'}
];
var PLACES = ['학원','학교','놀이터','친구 집','도서관','마트','태권도','운동'];
var HW_QUICK = ['수학 익힘책','국어','영어','독서 30분','일기 쓰기','학습지','받아쓰기','악기 연습'];
var MOODS = [['😆','최고'],['😊','좋음'],['😐','보통'],['😢','속상'],['😠','화남']];
var PRAISES = [
  {ic:'👍', tx:'참 잘했어요', pt:10},
  {ic:'🤝', tx:'도와줘서 고마워', pt:10},
  {ic:'🫶', tx:'사랑해', pt:5},
  {ic:'💪', tx:'힘내', pt:5}
];
var NO_LABEL = {mission:'↩ 다시 해요', outgo:'✋ 이야기하자', outback:'✋ 이야기하자', freeend:'↩ 다시 확인', report:'↩ 다시 써요', shop:'🙅 다음에'};

/* ---------- 자료 ---------- */
var S;
function blankStat(){ return {points:0, coins:0, badges:[], streak:0, lastReport:'', allDays:0, onTime:0, freeKeep:0, log:[]}; }
function fixUp(){
  if(!S.members || !S.members.length) S.members = JSON.parse(JSON.stringify(DEFAULT_MEMBERS));
  if(!S.m) S.m = {};
  if(!S.days) S.days = {};
  if(!S.reqs) S.reqs = [];
  if(!S.rewards) S.rewards = JSON.parse(JSON.stringify(DEFAULT_REWARDS));
  if(!S.caps) S.caps = {};
  if(!S.msgs) S.msgs = [];
  S.members.forEach(function(mb){
    var def = DEFAULT_MEMBERS.filter(function(d){ return d.id===mb.id; })[0];
    if(def){ if(!mb.role) mb.role = def.role; mb.kid = def.kid; }
    if(!S.m[mb.id]) S.m[mb.id] = blankStat();
    if(S.m[mb.id].coins == null) S.m[mb.id].coins = S.m[mb.id].points;   // 예전 기록은 점수만큼 코인
  });
}
function load(){
  try{ S = JSON.parse(localStorage.getItem(KEY)); }catch(e){ S = null; }
  if(!S || !S.members) S = {members: JSON.parse(JSON.stringify(DEFAULT_MEMBERS)), m:{}, days:{}};
  if(S.ver !== 2){ S.days = {}; S.reqs = []; S.ver = 2; S.m = {}; }
  fixUp();
  saveLocal();
}
function saveLocal(){ try{ localStorage.setItem(KEY, JSON.stringify(S)); }catch(e){} }
function save(){ saveLocal(); if(window.Cloud && Cloud.on && Cloud.user && synced) schedulePush(); }

/* ---------- 서버 동기화 (설정이 있을 때만) ---------- */
/* 자료를 작은 조각(행)으로 나눠 바뀐 조각만 올림 → 두 휴대폰이 동시에 써도 덜 겹침 */
var synced = false, lastSent = {}, pushT = null, pushing = false;
function rowsOf(){
  var rows = {meta:{members:S.members, pin:S.pin||'', rec:S.rec||{}, rewards:S.rewards, caps:S.caps, ver:S.ver}};
  Object.keys(S.m).forEach(function(id){ rows['m:'+id] = S.m[id]; });
  Object.keys(S.days).forEach(function(ds){ Object.keys(S.days[ds]).forEach(function(id){ rows['d:'+ds+':'+id] = S.days[ds][id]; }); });
  S.reqs.forEach(function(r){ rows['r:'+r.id] = r; });
  S.msgs.forEach(function(g){ rows['g:'+g.id] = g; });
  return rows;
}
function applyRow(k, v){
  var p = k.split(':');
  if(k==='meta'){ if(v){ S.members = v.members; S.pin = v.pin; S.rec = v.rec; S.rewards = v.rewards; S.caps = v.caps || {}; S.ver = v.ver || 2; } }
  else if(p[0]==='m'){ if(v) S.m[p[1]] = v; }
  else if(p[0]==='d'){ if(!S.days[p[1]]) S.days[p[1]] = {}; if(v) S.days[p[1]][p[2]] = v; else delete S.days[p[1]][p[2]]; }
  else if(p[0]==='g'){
    S.msgs = (S.msgs||[]).filter(function(g){ return g.id!==p[1]; });
    if(v){ S.msgs.push(v); S.msgs.sort(function(a,b){ return a.t-b.t; }); }
  }
  else if(p[0]==='r'){
    S.reqs = S.reqs.filter(function(r){ return r.id!==p[1]; });
    if(v){ S.reqs.push(v); S.reqs.sort(function(a,b){ return a.t-b.t; }); }
  }
}
function schedulePush(){ clearTimeout(pushT); pushT = setTimeout(pushNow, 300); }
async function pushNow(){
  if(pushing){ schedulePush(); return; }
  pushing = true;
  var rows = rowsOf(), up = [], del = [];
  Object.keys(rows).forEach(function(k){ var s = JSON.stringify(rows[k]); if(lastSent[k]!==s){ up.push({k:k, v:rows[k]}); lastSent[k] = s; } });
  Object.keys(lastSent).forEach(function(k){ if(!(k in rows)){ del.push(k); delete lastSent[k]; } });
  try{ await Cloud.upsert(up); await Cloud.remove(del); setNet(true); }
  catch(e){ up.forEach(function(x){ delete lastSent[x.k]; }); setNet(false); setTimeout(schedulePush, 5000); }
  pushing = false;
}
var netOk = true;
function setNet(ok){ if(ok!==netOk){ netOk = ok; toast(ok ? '☁️ 다시 연결됐어요' : '📶 인터넷 연결을 확인해요 (다시 시도할게요)'); } }
var remoteT, staleNote = false;
function onRemote(p){
  var k = (p.new && p.new.k) || (p.old && p.old.k); if(!k) return;
  var v = p.eventType==='DELETE' ? null : p.new.v, s = v==null ? undefined : JSON.stringify(v);
  if(lastSent[k]===s) return;                    // 내가 올린 것이 되돌아온 것
  if(s===undefined) delete lastSent[k]; else lastSent[k] = s;
  var isNewMsg = k.indexOf('g:')===0 && v && !byId(S.msgs||[], v.id);
  var oldReq = k.indexOf('r:')===0 && v ? byId(S.reqs, v.id) : null, oldSt = oldReq ? oldReq.st : null;
  applyRow(k, v); fixUp(); saveLocal();
  if(isNewMsg) msgAlert(v);
  if(k.indexOf('r:')===0 && v) reqAlert(v, oldReq ? oldSt : null);
  clearTimeout(remoteT); remoteT = setTimeout(refreshSoft, 250);
}
function refreshSoft(){
  var a = document.activeElement, typing = a && /INPUT|TEXTAREA|SELECT/.test(a.tagName);
  if(V.screen==='chat'){ var ci = document.getElementById('cin'), cv = ci ? ci.value : '', cf = a && a.id==='cin'; render(); var n2 = document.getElementById('cin'); if(n2){ n2.value = cv; if(cf) n2.focus(); } return; }
  if(typing || V.screen==='play'){ if(!staleNote){ staleNote = true; toast('🔔 새 소식이 왔어요'); } return; }
  staleNote = false; render();
}
async function cloudStart(){
  var rows = await Cloud.fetchAll();
  if(rows.length){
    var keepPin = S.pin;
    S = {members:[], m:{}, days:{}, reqs:[], ver:2};
    rows.forEach(function(r){ applyRow(r.k, r.v); lastSent[r.k] = JSON.stringify(r.v); });
    if(S.pin==null) S.pin = keepPin;
    fixUp(); saveLocal();
  }
  synced = true;
  if(!rows.length) await pushNow();               // 서버가 비어 있으면 이 기기 기록으로 시작
  Cloud.listen(onRemote);
  await loadCloudPhotos();
}
async function loadCloudPhotos(){
  try{
    var list = await Cloud.photos();
    FACES = {};
    list.filter(function(x){ return /^face_/.test(x.name); }).forEach(function(x){ FACES[x.name.replace(/\.jpe?g$/i,'')] = x.url; });
    list = list.filter(function(x){ return !/^(proof|face)_/.test(x.name); });
    PHOTOS = list.map(function(x){
      var f = x.name.replace(/\.jpe?g$/i,''), local = LOCAL_PHOTOS.filter(function(p){ return p.f===f; })[0];
      return {f:f, url:x.url, cap:S.caps[f] || (local && local.cap) || '우리 가족'};
    });
  }catch(e){ PHOTOS = []; }
}

function pad(n){ return (n<10?'0':'')+n; }
function dstr(d){ return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate()); }
function today(){ return dstr(new Date()); }
function dayBefore(ds){ var p = ds.split('-'), d = new Date(+p[0], +p[1]-1, +p[2]); d.setDate(d.getDate()-1); return dstr(d); }
function hm(t){ var d=new Date(t); return pad(d.getHours())+':'+pad(d.getMinutes()); }
function koDate(){ var d=new Date(); return (d.getMonth()+1)+'월 '+d.getDate()+'일 '+'일월화수목금토'.charAt(d.getDay())+'요일'; }
function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
function uid(){ return Date.now().toString(36)+Math.random().toString(36).slice(2,6); }
function mem(id){ for(var i=0;i<S.members.length;i++) if(S.members[i].id===id) return S.members[i]; return null; }
function kids(){ return S.members.filter(function(m){ return m.kid; }); }
function parents(){ return S.members.filter(function(m){ return !m.kid; }); }
function day(id, ds){
  ds = ds||today();
  if(!S.days[ds]) S.days[ds] = {};
  if(!S.days[ds][id]) S.days[ds][id] = {hw:[], miss:{}, outs:[], free:[], report:null};
  return S.days[ds][id];
}
function peekDay(id, ds){ return (S.days[ds||today()]||{})[id] || {hw:[], miss:{}, outs:[], free:[], report:null}; }
function byId(list, id){ for(var i=0;i<list.length;i++) if(list[i].id===id) return list[i]; return null; }
function level(p){ return Math.floor(p/PER_LEVEL)+1; }
function levelName(lv){ return LEVELS[Math.min(lv,LEVELS.length)-1]; }
function photoSrc(f){ if(FACES[f]) return FACES[f]; var p = byId2(PHOTOS, f); return p && p.url ? p.url : 'photos/'+f+'.jpg'; }
function byId2(list, f){ for(var i=0;i<list.length;i++) if(list[i].f===f) return list[i]; return null; }
function hasPhoto(f){ return !!FACES[f] || !!byId2(PHOTOS, f); }
/* 얼굴 사진: 설정에서 고른 사진이 없으면 서버의 face_아이디 사진을 씀 */
function facePic(mb){ return mb.photo && hasPhoto(mb.photo) ? mb.photo : (FACES['face_'+mb.id] ? 'face_'+mb.id : null); }
function randPhoto(){ return PHOTOS.length ? PHOTOS[Math.floor(Math.random()*PHOTOS.length)] : null; }
function bigFace(mb){ var f = facePic(mb); return f ? '<img src="'+photoSrc(f)+'" alt="">' : mb.emoji; }
function pet(id){ var lv = level(S.m[id].points); return PETS[Math.min(lv, PETS.length)-1]; }
function face(mb, cls){ var f = facePic(mb); return f ?'<img class="face '+(cls||'')+'" src="'+photoSrc(f)+'" alt="'+esc(mb.name)+'">' : mb.emoji; }
function mini(mb){ var f = facePic(mb); return f ?'<img class="mini" src="'+photoSrc(f)+'" alt="">' : '<span class="mini">'+mb.emoji+'</span>'; }

function missState(id, k, ds){ var m = peekDay(id, ds).miss[k]; return m ? m.st : ''; }
function missOkCount(id, ds){ return MISSIONS.filter(function(m){ return missState(id,m.k,ds)==='ok'; }).length; }
function freeOpen(id){ return missOkCount(id) === MISSIONS.length; }
function stars(id, ds){
  var d = peekDay(id, ds);
  return {
    miss: missOkCount(id, ds) === MISSIONS.length,
    out:  d.outs.some(function(o){ return o.backSt==='ok' && o.ontime; }),
    free: d.free.some(function(f){ return f.endSt==='ok' && f.kept; }),
    rep:  !!(d.report && d.report.st==='ok')
  };
}
function starCount(id){ var s=stars(id); return (s.miss?1:0)+(s.out?1:0)+(s.free?1:0)+(s.rep?1:0); }
function waiting(kid){ return S.reqs.filter(function(r){ return r.st==='wait' && (!kid || r.kid===kid); }); }

/* ---------- 점수·배지 ---------- */
function addPts(id, n, why){
  var st = S.m[id], before = level(st.points), who = mem(id);
  st.points = Math.max(0, st.points + n);
  st.coins = Math.max(0, (st.coins||0) + n);
  st.log.unshift({t:Date.now(), n:n, why:why});
  if(st.log.length>80) st.log.length = 80;
  var after = level(st.points);
  save();
  toast(who.name+' '+(n>=0?'+'+n:n)+'점 🪙'+(n>=0?'! ':' · ')+why, {kind: n>=0 ? 'ok' : 'no'});
  if(n>0){ confetti(n>=15?24:12); sfx('coin'); }
  if(after>before) setTimeout(function(){ var pt = pet(id); popup(pt.ic, who.name+' 레벨 '+after+'!', '동물 친구가 「'+pt.nm+'」(으)로 자랐어요!'); confetti(40); }, 700);
  checkBadges(id);
}
function giveBadge(id, bid){
  var st = S.m[id];
  if(st.badges.indexOf(bid)>=0) return;
  st.badges.push(bid); save();
  var b = BADGES.filter(function(x){return x.id===bid;})[0];
  setTimeout(function(){ popup(b.ic, mem(id).name+' 새 배지: '+b.nm, b.how); confetti(30); }, 1300);
}
function checkBadges(id){
  var st = S.m[id];
  if(missOkCount(id)>0) giveBadge(id,'m1');
  if(stars(id).miss) giveBadge(id,'mall');
  if(st.allDays>=5) giveBadge(id,'mall5');
  if(st.onTime>=3) giveBadge(id,'ontime');
  if(st.freeKeep>=5) giveBadge(id,'free5');
  if(st.lastReport) giveBadge(id,'rep1');
  if(st.streak>=3) giveBadge(id,'st3');
  if(st.streak>=7) giveBadge(id,'st7');
  if(level(st.points)>=5) giveBadge(id,'lv5');
}

/* ---------- 보고(자녀) → 확인(부모님) ---------- */
function addReq(kid, type, ref, text, extra){
  var r = {id:uid(), kid:kid, type:type, ds:today(), ref:ref, text:text, st:'wait', t:Date.now()};
  if(extra) Object.keys(extra).forEach(function(k){ r[k] = extra[k]; });
  S.reqs.push(r); sfx('pop');
  if(S.reqs.length>400) S.reqs = S.reqs.slice(-400);
  save();
  toast('📤 「'+text+'」 보고를 보냈어요! 부모님 확인을 기다려요', {title:'보고 완료', kind:'send'});
}
function cancelReq(kid, type, ref){
  S.reqs = S.reqs.filter(function(r){ return !(r.kid===kid && r.type===type && r.ref===ref && r.st==='wait'); });
  save();
}
// 수락하면 받을 점수 미리 계산
function previewPts(r){
  var d = peekDay(r.kid, r.ds), st = S.m[r.kid];
  if(r.type==='mission'){
    var m = MISSIONS.filter(function(x){ return x.k===r.ref; })[0];
    var others = MISSIONS.every(function(x){ return x.k===r.ref || (d.miss[x.k] && d.miss[x.k].st==='ok'); });
    return m.pts + (others && !d.allBonus ? ALL_BONUS : 0);
  }
  if(r.type==='outgo') return d.outs.filter(function(o){ return o.goSt==='ok'; }).length < 3 ? 5 : 0;
  if(r.type==='outback'){ var o = byId(d.outs, r.ref); if(!o) return 0; return o.ontime ? (d.outs.filter(function(x){ return x.backSt==='ok' && x.ontime; }).length<3 ? 15 : 0) : 3; }
  if(r.type==='freeend'){ var f = byId(d.free, r.ref); return f && f.kept && d.free.filter(function(x){ return x.endSt==='ok' && x.kept; }).length<2 ? 10 : 0; }
  if(r.type==='shop') return 0;
  if(r.type==='report'){
    var s = st.lastReport===dayBefore(r.ds) ? st.streak+1 : (st.lastReport===r.ds ? st.streak : 1);
    return d.repPt ? 0 : 20 + (s>=2 ? Math.min(s,7)*2 : 0);
  }
  return 0;
}
function decide(reqId, ok, note, parent){
  var r = byId(S.reqs, reqId); if(!r || r.st!=='wait') return;
  var d = day(r.kid, r.ds), st = S.m[r.kid], pts = ok ? previewPts(r) : 0, kidName = mem(r.kid).name;
  r.st = ok ? 'ok' : 'no'; r.by = parent.role || parent.name; r.note = note; r.at = Date.now(); r.seen = false; r.pts = pts;
  if(r.type==='mission'){
    var ms = d.miss[r.ref] || (d.miss[r.ref] = {});
    ms.st = r.st; ms.note = note;
    if(ok){
      var m = MISSIONS.filter(function(x){ return x.k===r.ref; })[0];
      addPts(r.kid, m.pts, m.nm+' 수락 ('+r.by+')');
      if(pts > m.pts){ d.allBonus = true; st.allDays++; addPts(r.kid, ALL_BONUS, '오늘 미션 모두 완료! 자유시간이 열렸어요 🎮'); }
    }
  } else if(r.type==='outgo'){
    var o = byId(d.outs, r.ref); if(o) o.goSt = r.st;
    if(ok && pts) addPts(r.kid, pts, '외출 보고 확인 ('+r.by+')');
  } else if(r.type==='outback'){
    var o2 = byId(d.outs, r.ref); if(o2) o2.backSt = r.st;
    if(ok && o2 && o2.ontime) st.onTime++;
    if(ok && pts) addPts(r.kid, pts, o2 && o2.ontime ? '약속 시간에 귀가 ⭐' : '무사히 귀가');
  } else if(r.type==='freeend'){
    var f = byId(d.free, r.ref); if(f) f.endSt = r.st;
    if(ok && f && f.kept) st.freeKeep++;
    if(ok && pts) addPts(r.kid, pts, '자유시간 약속 지킴 ⭐');
  } else if(r.type==='shop'){
    if(ok){
      if((st.coins||0) < r.cost){ r.st = 'no'; r.note = '코인이 모자라요'; toast('코인이 모자라서 수락할 수 없어요'); }
      else {
        st.coins -= r.cost;
        st.log.unshift({t:Date.now(), n:-r.cost, why:'🛍️ '+r.rname+' ('+r.by+' 수락)', coin:true});
        if(r.ref2==='free10') d.freeBonus = (d.freeBonus||0) + 10;
        toast(kidName+'의 「'+r.rname+'」 수락! 🎁'); confetti(20); sfx('fan');
      }
    }
  } else if(r.type==='report'){
    if(d.report){ d.report.st = r.st; d.report.note = note; d.report.by = r.by; }
    if(ok && !d.repPt){
      d.repPt = true;
      if(st.lastReport === dayBefore(r.ds)) st.streak++; else if(st.lastReport !== r.ds) st.streak = 1;
      st.lastReport = r.ds;
      addPts(r.kid, pts, '마감 보고 수락'+(st.streak>=2?' (🔥'+st.streak+'일 연속)':''));
    }
  }
  save();
  if(!ok) toast('↩️ '+kidName+'에게 「'+(NO_LABEL[r.type]||'다시 해요').replace(/^\S+ /,'')+'」를 보냈어요', {kind:'no'});
  else if(r.type!=='shop') toast('👍 '+kidName+'의 「'+r.text+'」 수락'+(pts ? ' — '+pts+'점을 줬어요' : '했어요'), {title:'수락 완료', kind:'ok'});
  if(!ok) sfx('no');
}

/* 이미 수락한 미션도 부모님이 「다시 하세요」로 돌려보낼 수 있어요 (받은 점수는 돌려받음) */
function redoMission(kidId, k, parent, note){
  var d = day(kidId), ms = d.miss[k], st = S.m[kidId], kid = mem(kidId);
  if(!ms || ms.st!=='ok' || !kid) return;
  var m = MISSIONS.filter(function(x){ return x.k===k; })[0], by = parent.role || parent.name;
  note = note || '다시 해 주세요';
  addPts(kidId, -m.pts, m.nm+' 다시 하기 ('+by+')');
  if(d.allBonus){ d.allBonus = false; st.allDays = Math.max(0, (st.allDays||0)-1); addPts(kidId, -ALL_BONUS, '미션 다시 하기 — 모두 완료 보너스 취소'); }
  ms.st = 'no'; ms.note = note;
  var r = S.reqs.filter(function(x){ return x.kid===kidId && x.type==='mission' && x.ref===k && x.ds===today() && x.st==='ok'; }).pop();
  if(r){ r.st = 'no'; r.note = note; r.by = by; r.at = Date.now(); r.seen = false; r.pts = 0; }
  save(); sfx('no');
  toast('↩️ '+kid.name+'에게 「'+m.nm+'」 다시 하세요를 보냈어요', {kind:'no'});
}

/* ---------- 알림·축하 효과 ---------- */
var toastT;
/* 알림창: 화면 위에 크게 뜨고, 음성으로도 읽어 줌 */
function toast(msg, opt){
  opt = opt || {};
  var el = document.getElementById('toast');
  var m = String(msg).match(/^(\p{Extended_Pictographic}(?:\uFE0F|\u200D\p{Extended_Pictographic})*)\s*/u);
  var ic = opt.ic || (m ? m[1] : '🔔'), body = m ? String(msg).slice(m[0].length) : String(msg);
  el.innerHTML = (opt.face ? '<span class="tface">'+opt.face+'</span>' : '<span class="tic">'+ic+'</span>')+
    '<span class="tbody">'+(opt.title ? '<b>'+esc(opt.title)+'</b>' : '')+'<span>'+esc(body)+'</span></span>';
  el.className = 'show' + (opt.kind ? ' k-'+opt.kind : '');
  clearTimeout(toastT); toastT = setTimeout(function(){ el.classList.remove('show'); }, opt.long ? 6000 : 3600);
  if(opt.say !== false) say(opt.say || ((opt.title ? opt.title+'. ' : '') + body));
  if(opt.sys) sysNotify((opt.title || body), opt.title ? body : '');
}
document.getElementById('toast').addEventListener('click', function(){ this.classList.remove('show'); });
function voiceOn(){ try{ return localStorage.getItem('fam-voice')!=='off'; }catch(e){ return true; } }
var koVoice = null;
function pickVoice(){ try{ var vs = speechSynthesis.getVoices(); koVoice = vs.filter(function(v){ return /^ko/i.test(v.lang); })[0] || null; }catch(e){} }
try{ pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }catch(e){}
function say(text, queue){
  if(!voiceOn() || !window.speechSynthesis) return;
  var t = String(text||'').replace(/\p{Extended_Pictographic}|\uFE0F|\u200D/gu, '').replace(/[()「」『』→·]/g, ' ').replace(/\+(\d+)점/g, '$1점 더').replace(/\s+/g, ' ').trim();
  if(!t) return;
  try{
    if(!queue) speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(t); u.lang = 'ko-KR'; u.rate = 1.05; u.pitch = 1.1;
    if(koVoice) u.voice = koVoice;
    speechSynthesis.speak(u);
  }catch(e){}
}
/* 휴대폰 알림 (앱이 뒤에 있을 때) */
var swReg = null;
try{ if('serviceWorker' in navigator && location.protocol!=='file:') navigator.serviceWorker.register('sw.js').then(function(r){ swReg = r; }).catch(function(){}); }catch(e){}
function sysNotify(title, body){
  try{
    if(!document.hidden || !window.Notification || Notification.permission!=='granted' || !swReg) return;
    swReg.showNotification(title.replace(/^\p{Extended_Pictographic}\s*/u,''), {body:body, icon:'icon-192.png', badge:'icon-192.png', tag:'fam-'+Date.now(), vibrate:[150,80,150]});
  }catch(e){}
}
async function askNotify(){
  if(!window.Notification){ toast('📵 이 휴대폰(브라우저)은 알림을 지원하지 않아요. 홈 화면에 설치한 앱에서 다시 눌러 주세요'); return; }
  var p = await Notification.requestPermission();
  toast(p==='granted' ? '📢 휴대폰 알림을 켰어요! 앱이 뒤에 있어도 알려 줄게요' : '🔕 알림이 허용되지 않았어요. 휴대폰 설정에서 허용할 수 있어요');
  render();
}
function confetti(n){
  var fx = document.getElementById('fx'), items = ['⭐','🌟','✨','🎉','💛','🍬','🎈'];
  for(var i=0;i<n;i++){
    var s = document.createElement('span');
    s.textContent = items[Math.floor(Math.random()*items.length)];
    s.style.left = (Math.random()*100)+'vw';
    s.style.animationDuration = (1.6+Math.random()*1.6)+'s';
    s.style.animationDelay = (Math.random()*0.4)+'s';
    fx.appendChild(s);
    (function(x){ setTimeout(function(){ x.remove(); }, 3800); })(s);
  }
}
function popup(ic, title, msg){
  var p = document.createElement('div'), ph = randPhoto();
  p.className = 'pop';
  p.innerHTML = '<div class="box">'+(ph?'<img class="photo" src="'+photoSrc(ph.f)+'" alt="">':'<div class="photo nophoto">'+ic+'</div>')+'<div class="badge-ic">'+ic+'</div><h2>'+esc(title)+'</h2><p>'+esc(msg)+'</p>'+
    '<button class="big" style="background:#ff9a2e">좋아요!</button></div>';
  p.addEventListener('click', function(e){ if(e.target===p || e.target.tagName==='BUTTON') p.remove(); });
  document.body.appendChild(p); sfx('fan');
}
function lightbox(src){
  var p = document.createElement('div'); p.className = 'lightbox';
  p.innerHTML = '<img src="'+src+'" alt="">';
  p.addEventListener('click', function(){ p.remove(); });
  document.body.appendChild(p);
}

/* ---------- 화면 공통 ---------- */
var V = {screen:'home', id:null, kid:null, tmp:{}};
var app = document.getElementById('app');
function go(screen, id){ var from = V.screen; V.screen = screen; if(id!==undefined) V.id = id; V.tmp = {}; render(); window.scrollTo(0,0); guide(from); }
function guide(from){
  var me = V.id ? mem(V.id) : null, sc = V.screen, t = '';
  if(sc==='me' && me && from==='home'){
    if(me.kid){ var left = MISSIONS.length - missOkCount(me.id), un = unread(me.id);
      t = me.name+', 안녕! '+(left ? '오늘 미션이 '+left+'개 남았어요.' : '오늘 미션을 다 했어요! 자유시간이 열렸어요.')+(un ? ' 새 쪽지가 '+un+'개 있어요.' : ''); }
    else { var w = waiting().length, un2 = unread(me.id);
      t = me.role+' 화면이에요. '+(w ? '확인할 보고가 '+w+'개 있어요.' : '지금은 확인할 보고가 없어요.')+(un2 ? ' 새 쪽지가 '+un2+'개 있어요.' : ''); }
  }
  else if(sc==='hw') t = '숙제 화면이에요. 숙제를 적고, 다 하면 체크한 뒤 보고하기를 눌러요.';
  else if(sc==='out') t = '외출 보고예요. 어디에 가는지, 몇 시에 올지 골라서 보고해요.';
  else if(sc==='free') t = me && (freeOpen(me.id) || peekDay(me.id).free.some(function(f){ return !f.end; })) ? '자유시간이에요. 몇 분 놀지 고르고 시작을 눌러요.' : '미션 4개를 다 하면 자유시간이 열려요.';
  else if(sc==='report') t = '마감 보고예요. 오늘 기분과 잘한 일을 적어서 보내요.';
  else if(sc==='shop') t = '보상 상점이에요. 모은 코인으로 갖고 싶은 걸 골라요.';
  else if(sc==='chat') t = '가족 대화방이에요. 받는 사람을 고르고 쪽지를 보내요.';
  else if(sc==='games') t = '게임방이에요. 하고 싶은 게임을 골라요.';
  else if(sc==='praise') t = '칭찬 보내기예요. 아이와 칭찬을 골라서 보내요.';
  if(t) say(t, true);
}
function navBar(me){
  var nav = document.getElementById('nav');
  if(!nav){ nav = document.createElement('nav'); nav.id = 'nav'; document.body.appendChild(nav); }
  var show = me && ['home','who','login','play','settings'].indexOf(V.screen)<0;
  document.body.classList.toggle('hasnav', !!show);
  if(!show){ nav.innerHTML = ''; return; }
  var un = unread(me.id), sc = V.screen;
  function it(act, ic, nm, on, extra){ return '<button data-act="'+act+'" class="'+(on?'on':'')+'"><span class="ni">'+ic+'</span>'+nm+(extra||'')+'</button>'; }
  nav.innerHTML = it('home', '🏠', '처음으로', false) +
    it('me', '🙂', '내 화면', sc==='me') +
    it('chat', '💬', '대화', sc==='chat', un ? '<i class="nbd">'+un+'</i>' : '') +
    it('games', me.kid && !freeOpen(me.id) ? '🔒' : '🕹️', '게임', sc==='games') +
    it('urgent', '🚨', '긴급', false);
}
document.addEventListener('click', function(e){
  var b = e.target.closest && e.target.closest('#nav button'); if(!b) return;
  var a = b.getAttribute('data-act'), me = V.id ? mem(V.id) : null; if(!me) return;
  sfx('tap');
  if(a==='urgent'){ go('chat'); V.tmp.urgent = true; render(); say('긴급 공지예요. 가족 모두에게 크게 알릴 내용을 쓰거나 골라요.'); }
  else go(a);
});
function render(){
  var me = V.id ? mem(V.id) : null;
  if(me) document.documentElement.style.setProperty('--me', me.color);
  if(window.Games) Games.stop();
  var f = {who:vWho, login:vLogin, shop:vShop, home:vHome, me:(me && !me.kid ? vParent : vKid), hw:vHw, out:vOut, free:vFree, report:vReport,
           praise:vPraise, kid:vKidView, settings:vSettings, games:vGames, play:vPlay, chat:vChat}[V.screen] || vHome;
  app.innerHTML = f(me);
  navBar(me);
  fillProofs();
  if(V.screen==='chat' && me){ markRead(me); window.scrollTo(0, document.body.scrollHeight); }
  if(V.screen==='free') tick();
  if(V.screen==='play') startGame(me);
  startAlbum();
}

/* ---------- 게임방 ---------- */
function canPlay(me){ return !me.kid || freeOpen(me.id); }
function rec(k){ if(!S.rec) S.rec = {}; return S.rec[k] || (S.rec[k] = {}); }
function vGames(me){
  var h = backBar() + pageHd('🕹️', '게임방', me.kid ? '미션을 다 끝낸 날, 자유시간에 놀아요!' : '아이들과 기록 겨루기!', 'linear-gradient(135deg,#00b4d8,#7bdff2)');
  if(!canPlay(me)){
    return h + '<div class="lockbox"><div style="font-size:64px">🔒</div><h3>게임방이 잠겨 있어요</h3><p>오늘의 미션 4개를 부모님이 모두 확인해 주면 열려요 ('+missOkCount(me.id)+'/'+MISSIONS.length+')</p></div>'+
      '<button class="big" data-act="me">🎯 미션 하러 가기</button>';
  }
  Games.list.forEach(function(g){
    var r = rec(g.k), mine = r[me.id];
    var best = Object.keys(r).filter(function(id){ return mem(id); }).sort(function(a,b){ return g.high ? r[b]-r[a] : r[a]-r[b]; })[0];
    h += '<button class="gcard" data-act="play" data-v="'+g.k+'"><span class="gic">'+g.ic+'</span><span class="ginfo"><b>'+g.nm+'</b><small>'+g.how+'</small>'+
      '<small>내 최고: '+(mine!=null?mine+g.unit:'아직 없음')+(best?' · 👑 '+esc(mem(best).name)+' '+r[best]+g.unit:'')+'</small></span><span class="arrow">▶</span></button>';
  });
  return h;
}
function vPlay(me){
  var g = Games.list.filter(function(x){ return x.k===V.tmp.g; })[0];
  return '<div class="top"><button class="back" data-act="games">← 게임방</button><div style="flex:1"></div></div><div id="gamearea" class="gamearea"></div>';
}
function startGame(me){
  var el = document.getElementById('gamearea'), k = V.tmp.g;
  if(!canPlay(me)){ go('games'); return; }
  Games.start(k, el, {
    photos: PHOTOS, photoSrc: photoSrc, confetti: confetti, toast: toast, sfx: sfx,
    best: function(name){ return rec(name)[me.id]; },
    done: function(name, score, high, msg){
      var r = rec(name), old = r[me.id], better = old==null || (high ? score>old : score<old);
      if(better){ r[me.id] = score; save(); confetti(30); }
      var unit = Games.list.filter(function(x){ return x.k===name; })[0].unit;
      el.innerHTML = '<div class="gresult"><div style="font-size:64px">'+(better?'🏆':'👏')+'</div><h2>'+esc(msg)+'</h2>'+
        '<p>'+(better?'새 최고 기록이에요!':'내 최고 기록: '+old+unit)+'</p>'+
        '<button class="big" data-act="play" data-v="'+name+'">🔁 다시 하기</button><button class="big ghost" data-act="games">🕹️ 게임방으로</button></div>';
    }
  });
}
var albumT, albumI = 0;
function albumHtml(){
  if(!PHOTOS.length) return '';
  if(albumI>=PHOTOS.length) albumI = 0;
  var h = '<div class="album" id="album">';
  PHOTOS.forEach(function(p,i){ h += '<img src="'+photoSrc(p.f)+'" alt="'+esc(p.cap)+'" class="'+(i===albumI?'on':'')+'"'+(i===albumI?'':' loading="lazy"')+'>'; });
  return h + '<div class="cap" id="albumcap">📸 '+esc(PHOTOS[albumI].cap)+'</div></div>';
}
function startAlbum(){
  clearInterval(albumT);
  if(!document.getElementById('album')) return;
  albumT = setInterval(function(){
    var el = document.getElementById('album'); if(!el){ clearInterval(albumT); return; }
    var imgs = el.querySelectorAll('img');
    imgs[albumI].classList.remove('on'); albumI = (albumI+1) % PHOTOS.length; imgs[albumI].classList.add('on');
    document.getElementById('albumcap').textContent = '📸 '+PHOTOS[albumI].cap;
  }, 4000);
}
function backBar(to){ return '<div class="top"><button class="back" data-act="'+(to||'me')+'">← '+(to==='home'?'처음으로':'내 화면')+'</button><div style="flex:1"></div></div>'; }
var HD_PHOTO = {'숙제 끝내기':'p11','외출 보고':'p12','자유시간':'p03','마감 보고':'p07','칭찬 보내기':'p02','가족 설정':'p10'};
function pageHd(ic, title, sub, bg){
  var ph = HD_PHOTO[title]; if(ph && !hasPhoto(ph)) ph = PHOTOS.length ? PHOTOS[title.length % PHOTOS.length].f : null;
  return '<div class="page-hd" style="background:'+bg+'"><span class="ic">'+ic+'</span><div><h2>'+title+'</h2><p>'+sub+'</p></div>'+
    (ph?'<div class="polaroid"><img src="'+photoSrc(ph)+'" alt=""></div>':'')+'</div>';
}
function stIcon(s){ return s==='ok'?'✅':s==='wait'?'⏳':s==='no'?'↩️':'⬜'; }
function memoryHtml(){
  var mp = V.tmp.mem || (V.tmp.mem = randPhoto());
  if(!mp) return '';
  return '<div class="memory"><h2>💛 오늘의 추억 한 장</h2><img src="'+photoSrc(mp.f)+'" alt="'+esc(mp.cap)+'" data-act="zoom" data-v="'+photoSrc(mp.f)+'">'+
    '<div style="margin-top:8px;font-size:18px">'+esc(mp.cap)+'</div><button data-act="memnext">🔄 다른 사진 보기</button></div>';
}

/* ---------- 누구예요? (이 휴대폰 주인 고르기) ---------- */
function vWho(){
  var h = '<div class="who"><div class="whohd"><div class="whoic">👋</div><h1>누구예요?</h1><p>이 휴대폰을 쓰는 사람을 눌러 주세요.<br>다음부터는 앱을 켜면 <b>바로 내 화면</b>이 열려요.</p></div>';
  h += '<div class="whosec">🧒 아이들</div><div class="whogrid">';
  kids().forEach(function(mb){ h += '<button class="whob" data-act="whopick" data-id="'+mb.id+'" style="border-color:'+mb.color+'"><span class="whof">'+bigFace(mb)+'</span><b>'+esc(mb.name)+'</b></button>'; });
  h += '</div><div class="whosec">👨‍👩‍👧‍👦 부모님</div><div class="whogrid two">';
  parents().forEach(function(mb){ h += '<button class="whob" data-act="whopick" data-id="'+mb.id+'" style="border-color:'+mb.color+'"><span class="whof">'+bigFace(mb)+'</span><b>'+esc(mb.name)+'</b><small>'+esc(mb.role)+'</small></button>'; });
  h += '</div><button class="whoskip" data-act="whoskip">👨‍👩‍👧‍👦 여러 명이 같이 써요 (처음 화면으로)</button></div>';
  return h;
}

/* ---------- 처음 화면 ---------- */
function vHome(){
  var wait = waiting().length;
  var h = '<div class="top"><h1>🏠 우리 가족 하루</h1><button class="gear" data-act="voice" aria-label="음성 안내 켜고 끄기">'+(voiceOn()?'🗣️':'🤐')+'</button><button class="gear" data-act="snd" aria-label="소리 켜고 끄기">'+(soundOn()?'🔊':'🔇')+'</button><button class="gear" data-act="settings" aria-label="가족 설정">⚙️</button></div>'+
    urgentHtml(null) + '<div class="date">'+koDate()+'</div>';
  var lastMe = null; try{ lastMe = mem(localStorage.getItem('fam-last')); }catch(e){}
  if(lastMe) h += '<button class="quickme" data-act="pick" data-id="'+lastMe.id+'">'+mini(lastMe)+' <b>'+esc(lastMe.name)+'</b> 화면으로 바로 가기'+(unread(lastMe.id)?' <span class="nb">💬 '+unread(lastMe.id)+'</span>':'')+' ›</button>';
  h += '<button class="whoagain" data-act="who">👋 나는 누구? 이 휴대폰 주인 고르기</button>';
  if(wait) h += '<div class="alarm">📥 부모님 확인을 기다리는 보고가 <b>'+wait+'개</b> 있어요</div>';
  h += '<div class="hello">👨‍👩‍👧‍👦 부모님</div><div class="members">';
  parents().forEach(function(mb){
    h += '<button class="mcard" data-act="pick" data-id="'+mb.id+'" style="border-color:'+mb.color+'55">'+
      '<div class="ava">'+face(mb)+'</div><div class="nm">'+esc(mb.name)+'</div><div class="lv">'+esc(mb.role)+' · 확인 담당</div>'+
      '<div class="pt" style="background:'+(wait?'#ffd84d':'#eee')+'">📥 확인할 것 '+wait+'개</div>'+nbadge(mb.id)+'</button>';
  });
  h += '</div><div class="hello" style="margin-top:16px">🧒 아이들 — 내 얼굴을 눌러요!</div><div class="members kids3">';
  kids().forEach(function(mb){
    var st = S.m[mb.id], lv = level(st.points), sc = starCount(mb.id), mc = missOkCount(mb.id);
    h += '<button class="mcard" data-act="pick" data-id="'+mb.id+'" style="border-color:'+mb.color+'55">'+
      '<div class="ava">'+face(mb)+'</div><div class="nm">'+esc(mb.name)+'</div>'+
      '<div class="lv">레벨 '+lv+' · '+pet(mb.id).ic+' '+pet(mb.id).nm+'</div>'+
      '<div class="lv">미션 '+mc+'/'+MISSIONS.length+(freeOpen(mb.id)?' · 🎮 자유시간':'')+'</div>'+
      '<div class="stars">'+'⭐'.repeat(sc)+'<span style="opacity:.25">'+'⭐'.repeat(4-sc)+'</span></div>'+
      '<div class="pt">'+st.points+'점'+(st.streak>1?' · 🔥'+st.streak+'일':'')+'</div>'+nbadge(mb.id)+'</button>';
  });
  h += '</div>' + albumHtml();

  var arr = kids().map(function(mb){ return {mb:mb, sc:starCount(mb.id), p:S.m[mb.id].points}; })
    .sort(function(a,b){ return b.sc-a.sc || b.p-a.p; });
  h += '<div class="board"><h2>🏅 오늘의 별 모으기</h2>';
  arr.forEach(function(r,i){
    h += '<div class="rank"><div class="no">'+['🥇','🥈','🥉'][i]+'</div><div class="who">'+mini(r.mb)+' '+esc(r.mb.name)+'</div><div class="sc">⭐ '+r.sc+'개 · '+r.p+'점</div></div>';
  });
  h += '</div>';

  var reps = kids().filter(function(mb){ var r = peekDay(mb.id).report; return r && r.st==='ok'; });
  h += '<div class="board"><h2>🌙 오늘 마감 보고</h2>';
  if(!reps.length) h += '<div class="empty">아직 수락된 마감 보고가 없어요</div>';
  reps.forEach(function(mb){
    var r = peekDay(mb.id).report;
    h += '<div class="fam-rep"><div class="a">'+r.mood+'</div><div class="t"><div class="n">'+esc(mb.name)+'</div>'+
      (r.good?'잘한 일: '+esc(r.good)+'<br>':'')+(r.tomorrow?'내일 다짐: '+esc(r.tomorrow)+'<br>':'')+
      (r.note?'<span class="pnote">💬 '+esc(r.by||'부모님')+': '+esc(r.note)+'</span>':'')+'</div></div>';
  });
  h += '</div>'; if(!PHOTOS.length) return h;
  h += '<div class="board"><h2>📷 우리 가족 추억 사진첩</h2><div class="gallery">';
  PHOTOS.forEach(function(p){ h += '<img src="'+photoSrc(p.f)+'" alt="'+esc(p.cap)+'" loading="lazy" data-act="zoom" data-v="'+photoSrc(p.f)+'">'; });
  return h + '</div></div>';
}

/* ---------- 자녀 화면 ---------- */
function vKid(me){
  var st = S.m[me.id], lv = level(st.points), into = st.points % PER_LEVEL, s = stars(me.id), d = peekDay(me.id);
  var mc = missOkCount(me.id), open = freeOpen(me.id), myWait = waiting(me.id).length;
  var outNow = d.outs.filter(function(o){return !o.end;})[0];
  var freeNow = d.free.filter(function(f){return !f.end;})[0];
  var h = backBar('home')+
    '<div class="hero"><div class="row"><div class="ava">'+bigFace(me)+'</div><div><div class="nm">'+esc(me.name)+'</div>'+
    '<div class="ttl">레벨 '+lv+' · '+levelName(lv)+(me.grade?' · '+esc(me.grade):'')+'</div></div></div>'+
    '<div class="bar"><i style="width:'+into+'%"></i></div>'+
    '<div class="nums"><span>모은 점수 '+st.points+'점</span><span>다음 레벨까지 '+(PER_LEVEL-into)+'점</span></div>'+
    '<div class="chips"><span class="chip">🪙 코인 '+(st.coins||0)+'</span><span class="chip">🔥 연속 '+st.streak+'일</span><span class="chip">🎖️ 배지 '+st.badges.length+'개</span>'+
    (myWait?'<span class="chip">⏳ 확인 기다리는 중 '+myWait+'개</span>':'')+'</div></div>';

  h = h.replace('<div class="hero">', urgentHtml(me)+'<div class="hero">');
  h += nextHtml(me, d, open, freeNow) + msgNotice(me) + petHtml(me.id);
  // 부모님 답장
  var notes = S.reqs.filter(function(r){ return r.kid===me.id && r.st!=='wait' && !r.seen; }).slice(-5).reverse();
  if(notes.length){
    h += '<div class="notice"><h3>💬 부모님 답장</h3>';
    notes.forEach(function(r){
      h += '<div class="nrow '+(r.st==='ok'?'ok':'no')+'">'+(r.st==='ok'?'👍 ':'↩️ ')+'<b>'+esc(r.by)+'</b>: '+esc(r.text)+' → '+
        (r.st==='ok'?'수락'+(r.pts?' (+'+r.pts+'점)':''):'다시 해요')+(r.note?'<div class="pnote">「'+esc(r.note)+'」</div>':'')+'</div>';
    });
    h += '<button class="seen" data-act="seen">확인했어요</button></div>';
  }

  // 오늘의 미션
  h += '<div class="mission"><div class="mhd"><h2>🎯 오늘의 미션</h2><span>'+mc+' / '+MISSIONS.length+'</span></div>'+
    '<div class="bar mbar"><i style="width:'+(mc*100/MISSIONS.length)+'%"></i></div>'+
    '<p class="msub">미션을 끝내면 <b>보고하기</b>를 눌러요. 📷 사진은 보내고 싶을 때만! 4개를 부모님이 모두 확인해 주면 <b>🎮 자유시간</b>이 열려요!</p>';
  MISSIONS.forEach(function(m){
    var ms = d.miss[m.k] || {}, s2 = ms.st || '';
    h += '<div class="mrow s-'+(s2||'none')+'"><span class="mic">'+m.ic+'</span><div class="mtx"><b>'+m.nm+'</b><small>'+
      (s2==='ok'?'부모님 확인 완료 ✅':s2==='wait'?'부모님 확인 기다리는 중 ⏳':s2==='no'?'다시 해 봐요'+(ms.note?' — '+esc(ms.note):''):'+'+m.pts+'점')+'</small></div>';
    if(s2==='ok') h += '<span class="mdone">✅</span>';
    else if(s2==='wait') h += '<button class="mbtn ghost" data-act="mcancel" data-v="'+m.k+'">취소</button>';
    else if(m.k==='hw') h += '<button class="mbtn" data-act="hw">숙제 보기</button>';
    else h += '<span class="mbtns"><button class="mbtn" data-act="mquick" data-v="'+m.k+'">보고하기</button><button class="mbtn ghost mcam" data-act="mreport" data-v="'+m.k+'" aria-label="사진도 함께 보내기">📷</button></span>';
    h += '</div>';
    if(m.na && !s2) h += '<button class="mna" data-act="mna" data-v="'+m.k+'">'+m.na+'</button>';
  });
  h += '</div>';

  // 자유시간·외출·마감
  h += '<div class="tiles">'+
    '<button class="tile t-free wide2'+(open||freeNow?'':' locked')+'" data-act="free"><span class="ic">'+(open||freeNow?'🎮':'🔒')+'</span><span><div class="tt">자유시간</div><div class="st">'+
      (freeNow?'지금 자유시간 중!':open?'열렸어요! 눌러서 시작':'미션을 다 하면 열려요 ('+mc+'/'+MISSIONS.length+')')+'</div></span></button>'+
    '<button class="tile t-out" data-act="out"><span class="ic">🚶</span><span><div class="tt">외출 보고</div><div class="st">'+(outNow?esc(outNow.place)+'에 가 있어요':'어디 가요?')+'</div></span></button>'+
    '<button class="tile t-rep" data-act="report"><span class="ic">🌙</span><span><div class="tt">마감 보고</div><div class="st">'+
      (d.report?(d.report.st==='ok'?'수락 완료 '+d.report.mood:d.report.st==='wait'?'확인 기다리는 중 ⏳':'다시 써요 ↩️'):'잠자기 전에 정리')+'</div></span></button>'+
    '<button class="tile t-shop" data-act="shop"><span class="ic">🛍️</span><span><div class="tt">보상 상점</div><div class="st">🪙 '+(st.coins||0)+'코인</div></span></button>'+
    '<button class="tile t-pet" data-act="pet"><span class="ic petic">'+pet(me.id).ic+'</span><span><div class="tt">동물 친구</div><div class="st">'+pet(me.id).nm+'</div></span></button>'+
    '<button class="tile t-urgent wide2" data-act="urgent"><span class="ic">🚨</span><span><div class="tt">긴급 공지 올리기</div><div class="st">가족 모두에게 바로 크게 알려요</div></span></button>'+
    '<button class="tile t-chat wide2" data-act="chat"><span class="ic">💬</span><span><div class="tt">가족 대화방'+(unread(me.id)?' <span class="nb">새 쪽지 '+unread(me.id)+'</span>':'')+'</div><div class="st">엄마·아빠·형제에게 쪽지 보내기</div></span></button>'+
    '<button class="tile t-game wide2'+(open?'':' locked')+'" data-act="games"><span class="ic">'+(open?'🕹️':'🔒')+'</span><span><div class="tt">게임방</div><div class="st">'+
      (open?'짝 맞추기 · 틀린 그림 · 노래 퀴즈 · 구구단':'미션을 다 하면 열려요')+'</div></span></button>'+
    '</div>';

  h += '<div class="today"><h3>오늘 모은 별</h3><div class="starrow">'+
    '<div class="'+(s.miss?'on':'')+'"><b>⭐</b>미션 완료</div><div class="'+(s.out?'on':'')+'"><b>⭐</b>외출 약속</div>'+
    '<div class="'+(s.free?'on':'')+'"><b>⭐</b>자유시간</div><div class="'+(s.rep?'on':'')+'"><b>⭐</b>마감 보고</div></div></div>';

  h += calHtml(me.id);
  h += '<div class="section"><h2>🎖️ 내 배지</h2><div class="badges">';
  BADGES.forEach(function(b){ var on = st.badges.indexOf(b.id)>=0; h += '<div class="bdg'+(on?' on':'')+'" title="'+esc(b.how)+'"><b>'+b.ic+'</b>'+b.nm+'</div>'; });
  h += '</div></div>' + memoryHtml() + logHtml(me.id) + '<button class="ownerbtn" data-act="owner">'+(isOwner(me)?'📱 이 휴대폰은 <b>'+esc(me.name)+'</b> 것 ✅ <small>(누르면 해제)</small>':'📱 이 휴대폰은 내 것으로 정하기 <small>(앱을 켜면 바로 내 화면)</small>')+'</button>';
  return h;
}
function isOwner(me){ try{ return !!me && localStorage.getItem('fam-owner')===me.id; }catch(e){ return false; } }
function nextHtml(me, d, open, freeNow){
  var nx = MISSIONS.filter(function(m){ var st = (d.miss[m.k]||{}).st; return st!=='ok' && st!=='wait'; })[0];
  var h = '<div class="nextbox">';
  if(freeNow) h += '<div class="nxl">🎮 지금은 자유시간!</div><button class="nxb" data-act="free">⏱️ 남은 시간 보기</button>';
  else if(nx){
    var re = (d.miss[nx.k]||{}).st==='no';
    h += '<div class="nxl">'+(re?'↩️ 다시 해야 할 일':'👉 지금 할 일')+'</div><div class="nxm"><span>'+nx.ic+'</span><b>'+nx.nm+'</b></div>'+
      (re && d.miss[nx.k].note ? '<div class="nxn">부모님: 「'+esc(d.miss[nx.k].note)+'」</div>' : '')+
      (nx.k==='hw' ? '<button class="nxb" data-act="hw">✏️ 숙제 보러 가기</button>' : '<button class="nxb" data-act="mquick" data-v="'+nx.k+'">✅ 다 했어요! 보고하기</button><button class="nxs" data-act="mreport" data-v="'+nx.k+'">📷 사진도 함께 보내기</button>')+
      (nx.na ? '<button class="nxs" data-act="mna" data-v="'+nx.k+'">'+nx.na+'</button>' : '');
  }
  else if(!open) h += '<div class="nxl">⏳ 부모님 확인을 기다려요</div><div class="nxn">미션을 다 보고했어요. 확인해 주시면 자유시간이 열려요!</div>';
  else h += '<div class="nxl">🎉 오늘 미션 끝!</div><button class="nxb" data-act="free">🎮 자유시간 시작하기</button>';
  return h + '</div>';
}
function logHtml(id){
  var st = S.m[id], h = '<div class="section"><h2>📒 점수·코인 기록</h2><ul class="log">';
  if(!st.log.length) h += '<li class="empty" style="display:block">아직 기록이 없어요. 첫 점수를 모아 봐요!</li>';
  st.log.slice(0,10).forEach(function(l){
    var dt = new Date(l.t);
    h += '<li><span>'+esc(l.why)+' <span class="tm">'+(dt.getMonth()+1)+'/'+dt.getDate()+' '+hm(l.t)+'</span></span>'+(l.coin?'<span class="p" style="color:#e07a00">-'+(-l.n)+'코인</span>':'<span class="p"'+(l.n<0?' style="color:#e03131"':'')+'>'+(l.n<0?l.n:'+'+l.n)+'점</span>')+'</li>';
  });
  return h + '</ul></div>';
}
/* 미션 인증 사진: 보고하기를 누르면 사진부터 찍어요 */
var proofPending = null, proofUrls = {};
function proofStart(me, k){
  proofPending = {id:me.id, k:k};
  var inp = document.getElementById('proofin'); inp.value = '';
  inp.click();
  say('사진을 찍거나 골라 주세요.');
}
async function proofPicked(file){
  var p = proofPending; proofPending = null; if(!p || !file) return;
  var me = mem(p.id); if(!me) return;
  toast('📷 사진 올리는 중… 잠깐만요', {say:false});
  var extra = {};
  try{
    var url = URL.createObjectURL(file), blob = await resizeToBlob(url, 1000); URL.revokeObjectURL(url);
    if(window.Cloud && Cloud.on && Cloud.user){
      var name = 'proof_'+uid()+'.jpg';
      await Cloud.upload(name, blob); extra.photo = name;
    } else {
      extra.photoData = await new Promise(function(ok){ var fr = new FileReader(); fr.onload = function(){ ok(fr.result); }; fr.readAsDataURL(blob); });
    }
  }catch(e){ toast('😢 사진을 올리지 못했어요. 인터넷을 확인하고 다시 눌러 주세요', {kind:'no'}); return; }
  missReport(me, p.k, extra);
  if(V.screen==='hw') go('me');
}
function proofImg(r, cls){
  if(r.photoData) return '<img class="'+cls+'" src="'+r.photoData+'" alt="인증 사진" data-act="zoom" data-v="'+r.photoData+'">';
  if(!r.photo) return '';
  var u = proofUrls[r.photo];
  return '<img class="'+cls+'" data-proof="'+esc(r.photo)+'"'+(u ? ' src="'+u+'" data-act="zoom" data-v="'+u+'"' : '')+' alt="인증 사진">';
}
async function fillProofs(){
  if(!(window.Cloud && Cloud.on && Cloud.user)) return;
  var imgs = document.querySelectorAll('img[data-proof]:not([src])');
  for(var i=0;i<imgs.length;i++){
    var n = imgs[i].getAttribute('data-proof');
    try{ if(!proofUrls[n]) proofUrls[n] = await Cloud.signed(n); }catch(e){ continue; }
    imgs[i].src = proofUrls[n]; imgs[i].setAttribute('data-act','zoom'); imgs[i].setAttribute('data-v', proofUrls[n]);
  }
}
function missReport(me, k, extra){
  var m = MISSIONS.filter(function(x){ return x.k===k; })[0], d = day(me.id);
  d.miss[k] = {st:'wait', t:Date.now()};
  if(extra && extra.photo) d.miss[k].photo = extra.photo;
  var text = m.ic+' '+m.say;
  if(k==='hw'){
    var done = d.hw.filter(function(x){ return x.done; }).map(function(x){ return x.t; });
    if(done.length) text += ' ('+done.join(', ')+')';
  }
  addReq(me.id, 'mission', k, text, extra);
  render();
}

/* 숙제 */
function vHw(me){
  var d = day(me.id), done = d.hw.filter(function(x){return x.done;}).length, ms = d.miss.hw || {};
  var h = backBar() + pageHd('✏️', '숙제 끝내기', '숙제를 하나씩 체크하고, 다 하면 부모님께 보고해요', 'linear-gradient(135deg,#4f8cff,#6fb2ff)');
  if(ms.st==='ok') h += '<div class="okbox">✅ 부모님이 숙제를 확인해 주셨어요! 수고했어요</div>';
  else if(ms.st==='wait') h += '<div class="waitbox">⏳ 부모님 확인을 기다리고 있어요</div>';
  else if(ms.st==='no') h += '<div class="nobox">↩️ 다시 해 봐요'+(ms.note?' — 「'+esc(ms.note)+'」':'')+'</div>';
  if(d.hw.length) h += '<div class="prog">'+done+' / '+d.hw.length+' 끝냈어요 '+(done===d.hw.length?'🎉':'💪')+'<div class="bar"><i style="width:'+Math.round(done*100/d.hw.length)+'%"></i></div></div>';
  var lock = ms.st==='ok' || ms.st==='wait';
  h += '<ul class="hwlist">';
  d.hw.forEach(function(x){
    h += '<li class="hw'+(x.done?' done':'')+'"><button class="ck" data-act="hwck" data-v="'+x.id+'"'+(lock?' disabled':'')+' aria-label="끝냈어요">'+(x.done?'✔':'')+'</button>'+
      '<span class="tx">'+esc(x.t)+'</span>'+(lock?'':'<button class="del" data-act="hwdel" data-v="'+x.id+'" aria-label="지우기">✕</button>')+'</li>';
  });
  h += '</ul>';
  if(!lock){
    if(!d.hw.length) h += '<div class="empty">오늘 숙제를 적어 봐요 👇</div>';
    h += '<label class="lb">숙제 넣기</label><div class="addrow"><input class="inp" id="hwin" placeholder="예) 수학 익힘책 12쪽" maxlength="40"><button data-act="hwadd">넣기</button></div>'+
      '<label class="lb">눌러서 바로 넣기</label><div class="pick">';
    HW_QUICK.forEach(function(q){ h += '<button data-act="hwq" data-v="'+esc(q)+'">+ '+esc(q)+'</button>'; });
    h += '</div>';
    var y = peekDay(me.id, dayBefore(today()));
    if(y.hw.length && !d.hw.length) h += '<button class="big ghost" data-act="hwcopy">📋 어제 목록 그대로 가져오기</button>';
    var all = d.hw.length===0 || done===d.hw.length;
    h += '<button class="big" data-act="mquick" data-v="hw"'+(all?'':' disabled')+'>✅ 숙제 다 했어요! 보고하기</button>'+
      '<button class="big ghost addphoto" data-act="mreport" data-v="hw"'+(all?'':' disabled')+'>📷 사진도 함께 보내기</button>';
    if(!all) h += '<div class="empty">모든 숙제에 체크하면 보고할 수 있어요</div>';
  }
  return h;
}

/* 외출 */
function vOut(me){
  var d = day(me.id), now = d.outs.filter(function(o){return !o.end;})[0];
  var h = backBar() + pageHd('🚶', '외출 보고', '나갈 때·돌아올 때 부모님께 보고해요. 약속 시간에 오면 +15점!', 'linear-gradient(135deg,#22b573,#5fd39a)');
  if(now){
    var late = Date.now() > now.back;
    h += '<div class="now"><div style="font-size:48px">'+(late?'⏰':'🗺️')+'</div><div class="where">'+esc(now.place)+'에 가 있어요</div>'+
      '<div class="when">'+hm(now.start)+' 출발'+(now.who?' · '+esc(now.who)+'와(과) 함께':'')+'<br>돌아올 약속 <b style="color:'+(late?'#ff6fa5':'#22b573')+'">'+hm(now.back)+'</b>'+(late?' (시간이 지났어요!)':'')+
      '<br><small>부모님 확인: '+stIcon(now.goSt)+'</small></div></div>'+
      '<button class="big" data-act="outback">🏠 다녀왔습니다! 보고하기</button>';
  } else {
    var t = V.tmp, def = new Date(Date.now()+60*60000);
    h += '<label class="lb">어디에 가요?</label><div class="pick">';
    PLACES.forEach(function(p){ h += '<button data-act="outplace" data-v="'+esc(p)+'" class="'+(t.place===p?'sel':'')+'">'+esc(p)+'</button>'; });
    h += '</div><input class="inp" id="outplace" style="margin-top:8px" placeholder="직접 쓰기" value="'+esc(t.place||'')+'" maxlength="30">'+
      '<label class="lb">누구랑 가요? (안 써도 돼요)</label><input class="inp" id="outwho" placeholder="예) 친구 민수" value="'+esc(t.who||'')+'" maxlength="30">'+
      '<label class="lb">몇 시에 돌아와요?</label><input class="inp" id="outback" type="time" value="'+(t.back||pad(def.getHours())+':'+pad(def.getMinutes()))+'">'+
      '<button class="big" data-act="outgo">🚀 다녀오겠습니다! 보고하기</button>';
  }
  h += '<div class="section"><h2>오늘 외출 기록</h2><ul class="log">';
  var past = d.outs.filter(function(o){return o.end;});
  if(!past.length) h += '<li class="empty" style="display:block">아직 없어요</li>';
  past.slice().reverse().forEach(function(o){
    h += '<li><span>'+esc(o.place)+' · '+hm(o.start)+' → '+hm(o.end)+' '+stIcon(o.backSt)+'</span><span class="p" style="color:'+(o.ontime?'#22b573':'#ff6fa5')+'">'+(o.ontime?'약속 지킴':'늦었어요')+'</span></li>';
  });
  return h + '</ul></div>';
}
function outGo(me){
  var place = (document.getElementById('outplace').value||'').trim();
  var who = (document.getElementById('outwho').value||'').trim();
  var bt = document.getElementById('outback').value;
  if(!place){ toast('어디에 가는지 골라 주세요'); return; }
  var back = new Date(), p = (bt||'').split(':');
  if(p.length===2) back.setHours(+p[0], +p[1], 0, 0); else back = new Date(Date.now()+3600000);
  if(back.getTime() < Date.now()) back.setDate(back.getDate()+1);
  var o = {id:uid(), place:place, who:who, start:Date.now(), back:back.getTime(), end:null, goSt:'wait'};
  day(me.id).outs.push(o);
  addReq(me.id, 'outgo', o.id, '🚶 '+place+'에 다녀올게요'+(who?' ('+who+'와 함께)':'')+' · '+hm(o.back)+'까지 올게요');
  render();
}
function outBack(me){
  var d = day(me.id), o = d.outs.filter(function(x){return !x.end;})[0]; if(!o) return;
  o.end = Date.now(); o.ontime = o.end <= o.back + 5*60000; o.backSt = 'wait';
  addReq(me.id, 'outback', o.id, '🏠 '+o.place+' 다녀왔어요 · 약속 '+hm(o.back)+' / 도착 '+hm(o.end)+(o.ontime?' (약속 지킴)':' (늦었어요)'));
  render();
}

/* 자유시간 */
function vFree(me){
  var d = day(me.id), now = d.free.filter(function(f){return !f.end;})[0], open = freeOpen(me.id), mc = missOkCount(me.id);
  var h = backBar() + pageHd('🎮', '자유시간', '정한 시간 안에 스스로 끝내고 보고하면 +10점!', 'linear-gradient(135deg,#ff9a2e,#ffc04d)');
  if(now){
    h += '<div class="timer" id="timer"><div style="font-size:18px">'+esc(now.what||'자유시간')+' · '+now.min+'분</div>'+
      '<div class="ring"><svg width="200" height="200"><circle cx="100" cy="100" r="88" stroke="#ffe8c7" stroke-width="16" fill="none"/>'+
      '<circle id="ringfg" cx="100" cy="100" r="88" stroke="#ff9a2e" stroke-width="16" fill="none" stroke-linecap="round" stroke-dasharray="553" stroke-dashoffset="0"/></svg>'+
      '<div class="clock" id="clock">--:--</div></div><div id="tmsg" style="font-size:18px;color:#8a7a70">재미있게 놀아요!</div></div>'+
      '<button class="big" style="background:#00b4d8" data-act="games">🕹️ 게임방 가기</button>'+
      '<button class="big" data-act="freeend">✋ 자유시간 끝! 보고하기</button>';
  } else if(!open){
    h += '<div class="lockbox"><div style="font-size:64px">🔒</div><h3>아직 잠겨 있어요</h3><p>오늘의 미션 4개를 부모님이 모두 확인해 주면 열려요</p><div class="lockmiss">';
    MISSIONS.forEach(function(m){ h += '<div>'+stIcon(missState(me.id,m.k))+' '+m.ic+' '+m.nm+'</div>'; });
    h += '</div><b>'+mc+' / '+MISSIONS.length+'</b></div><button class="big" data-act="me">🎯 미션 하러 가기</button>';
  } else {
    var t = V.tmp; if(!t.min) t.min = 30;
    h += '<div class="okbox">🎉 미션 완료! 자유시간이 열렸어요</div>'+(d.freeBonus?'<div class="waitbox">🎁 상점 보너스 <b>+'+d.freeBonus+'분</b>이 더해져요!</div>':'')+'<label class="lb">얼마나 놀까요?</label><div class="dur">';
    [15,30,45,60].forEach(function(m){ h += '<button data-act="freemin" data-v="'+m+'" class="'+(t.min===m?'sel':'')+'">'+m+'분</button>'; });
    h += '</div><label class="lb">무엇을 하고 놀아요? (안 써도 돼요)</label><div class="pick">';
    ['게임','만화','유튜브','블록 놀이','그림 그리기','밖에서 놀기'].forEach(function(w){ h += '<button data-act="freewhat" data-v="'+w+'" class="'+(t.what===w?'sel':'')+'">'+w+'</button>'; });
    h += '</div><button class="big" data-act="freego">▶ 자유시간 시작!</button>';
  }
  var past = d.free.filter(function(f){return f.end;});
  var used = past.reduce(function(a,f){ return a + Math.round((f.end-f.start)/60000); }, 0);
  h += '<div class="section"><h2>오늘 자유시간 '+used+'분</h2><ul class="log">';
  if(!past.length) h += '<li class="empty" style="display:block">아직 없어요</li>';
  past.slice().reverse().forEach(function(f){
    h += '<li><span>'+esc(f.what||'자유시간')+' · '+hm(f.start)+' → '+hm(f.end)+' '+stIcon(f.endSt)+'</span><span class="p" style="color:'+(f.kept?'#22b573':'#ff6fa5')+'">'+(f.kept?'약속 지킴':'시간 넘김')+'</span></li>';
  });
  return h + '</ul></div>';
}
function freeGo(me){
  if(!freeOpen(me.id)) return;
  var t = V.tmp, d = day(me.id), bonus = d.freeBonus||0, min = (t.min||30) + bonus;
  d.freeBonus = 0;
  d.free.push({id:uid(), start:Date.now(), min:min, what:t.what||'', end:null});
  save(); sfx('ok'); toast('자유시간 시작! '+min+'분 동안 재미있게 놀아요'); render();
}
function freeEnd(me){
  var f = day(me.id).free.filter(function(x){return !x.end;})[0]; if(!f) return;
  f.end = Date.now(); f.kept = f.end <= f.start + f.min*60000 + 60000; f.endSt = 'wait';
  var used = Math.round((f.end-f.start)/60000);
  addReq(me.id, 'freeend', f.id, '⌛ 자유시간 끝났어요 · '+(f.what||'자유시간')+' '+used+'분 / 약속 '+f.min+'분'+(f.kept?' (약속 지킴)':' (시간 넘김)'));
  render();
}
var tickT;
function tick(){
  clearInterval(tickT);
  var me = mem(V.id); if(!me || V.screen!=='free') return;
  var f = day(me.id).free.filter(function(x){return !x.end;})[0]; if(!f) return;
  function up(){
    var el = document.getElementById('clock'); if(!el){ clearInterval(tickT); return; }
    var total = f.min*60000, left = f.start + total - Date.now();
    var over = left < 0, a = Math.abs(left), m = Math.floor(a/60000), s = Math.floor(a/1000)%60;
    el.textContent = (over?'+':'') + pad(m)+':'+pad(s);
    document.getElementById('ringfg').setAttribute('stroke-dashoffset', over ? 553 : String(553*(1-left/total)));
    document.getElementById('timer').classList.toggle('over', over);
    document.getElementById('tmsg').textContent = over ? '시간이 끝났어요! 1분 안에 끝내면 약속 지킴이에요' : (left<5*60000 ? '곧 끝나요. 마무리 준비!' : '재미있게 놀아요!');
  }
  up(); tickT = setInterval(up, 1000);
}

/* 마감 보고 */
function vReport(me){
  var d = day(me.id), mc = missOkCount(me.id);
  var freeMin = d.free.filter(function(f){return f.end;}).reduce(function(a,f){ return a+Math.round((f.end-f.start)/60000); },0);
  var h = backBar() + pageHd('🌙', '마감 보고', '잠자기 전 하루 정리! 부모님이 확인하면 +20점, 매일 하면 연속 보너스', 'linear-gradient(135deg,#8a5cff,#b98bff)');
  h += '<div class="section" style="margin-top:0"><h2>오늘 한 일 (자동 정리)</h2><div class="sum">'+
    '<div><b>'+mc+'/'+MISSIONS.length+'</b>미션</div><div><b>'+d.outs.length+'번</b>외출</div><div><b>'+freeMin+'분</b>자유시간</div></div>'+
    '<div style="text-align:center;margin-top:10px;font-size:20px">오늘 별 '+('⭐'.repeat(starCount(me.id))||'아직 없어요')+'</div></div>';
  var r = d.report;
  if(r && r.st!=='no' && !V.tmp.editing){
    h += '<div class="card-rep" style="margin-top:14px"><div class="mood">'+r.mood+'</div>'+
      (r.good?'<div>👍 잘한 일: '+esc(r.good)+'</div>':'')+(r.sorry?'<div>😅 아쉬운 일: '+esc(r.sorry)+'</div>':'')+
      (r.tomorrow?'<div>🎯 내일 다짐: '+esc(r.tomorrow)+'</div>':'')+
      '<div class="'+(r.st==='ok'?'okbox':'waitbox')+'" style="margin-top:10px">'+(r.st==='ok'?'✅ '+esc(r.by||'부모님')+' 확인 완료'+(r.note?'<br>💬 「'+esc(r.note)+'」':''):'⏳ 부모님 확인을 기다리고 있어요')+'</div></div>';
    if(r.st==='wait') h += '<button class="big ghost" data-act="repedit">✏️ 고치기</button>';
    return h;
  }
  if(r && r.st==='no') h += '<div class="nobox" style="margin-top:14px">↩️ 다시 써 봐요'+(r.note?' — 「'+esc(r.note)+'」':'')+'</div>';
  var t = V.tmp;
  if(r && !t.loaded){ t.loaded = true; t.mood = r.mood; t.good = r.good; t.sorry = r.sorry; t.tomorrow = r.tomorrow; }
  h += '<label class="lb">오늘 기분은 어땠어요?</label><div class="moods">';
  MOODS.forEach(function(m){ h += '<button data-act="mood" data-v="'+m[0]+'" class="'+(t.mood===m[0]?'sel':'')+'">'+m[0]+'<small>'+m[1]+'</small></button>'; });
  h += '</div>'+
    '<label class="lb">👍 오늘 잘한 일</label><textarea class="inp" id="rgood" maxlength="200" placeholder="예) 동생이랑 사이좋게 놀았어요">'+esc(t.good||'')+'</textarea>'+
    '<label class="lb">😅 아쉬운 일 (안 써도 돼요)</label><textarea class="inp" id="rsorry" maxlength="200">'+esc(t.sorry||'')+'</textarea>'+
    '<label class="lb">🎯 내일 다짐</label><input class="inp" id="rtom" maxlength="60" placeholder="예) 일찍 일어나기" value="'+esc(t.tomorrow||'')+'">'+
    '<button class="big" data-act="repsend">🌙 마감 보고 보내기</button>';
  return h;
}
function keepReportInputs(){
  var g = document.getElementById('rgood'); if(!g) return;
  V.tmp.good = g.value; V.tmp.sorry = document.getElementById('rsorry').value; V.tmp.tomorrow = document.getElementById('rtom').value;
}
function repSend(me){
  keepReportInputs();
  var t = V.tmp;
  if(!t.mood){ toast('오늘 기분을 먼저 골라 주세요'); return; }
  var d = day(me.id);
  cancelReq(me.id, 'report', 'r');
  d.report = {mood:t.mood, good:(t.good||'').trim(), sorry:(t.sorry||'').trim(), tomorrow:(t.tomorrow||'').trim(), t:Date.now(), st:'wait'};
  addReq(me.id, 'report', 'r', '🌙 마감 보고 '+t.mood+(d.report.good?' · 잘한 일: '+d.report.good:'')+(d.report.tomorrow?' · 내일 다짐: '+d.report.tomorrow:''));
  go('report');
}

/* ---------- 부모님 화면 ---------- */
function vParent(me){
  var list = waiting();
  var h = backBar('home')+
    '<div class="hero"><div class="row"><div class="ava">'+bigFace(me)+'</div><div><div class="nm">'+esc(me.name)+'</div>'+
    '<div class="ttl">'+esc(me.role)+' · 보고 확인 담당</div></div></div>'+
    '<div class="chips"><span class="chip">📥 확인할 것 '+list.length+'개</span>'+(unread(me.id)?'<span class="chip">💬 새 쪽지 '+unread(me.id)+'개</span>':'')+'</div></div>' + urgentHtml(me) + msgNotice(me) +
    '<button class="wide urgentbtn" data-act="urgent">🚨 긴급 공지 올리기</button>'+
    '<button class="wide chatbtn" data-act="chat">💬 가족 대화방'+(unread(me.id)?' <span class="nb">'+unread(me.id)+'</span>':'')+'</button>';

  h += '<div class="section"><h2>📥 확인할 보고</h2>';
  if(!list.length) h += '<div class="empty">지금은 확인할 보고가 없어요 😊</div>';
  list.slice().sort(function(a,b){ return a.t-b.t; }).forEach(function(r){
    var k = mem(r.kid), pts = previewPts(r);
    h += '<div class="req"><div class="rwho">'+mini(k)+' <b>'+esc(k.name)+'</b> <span class="tm">'+hm(r.t)+(r.ds!==today()?' ('+r.ds.slice(5)+')':'')+'</span></div>'+
      '<div class="rwhat">'+esc(r.text)+'</div>'+ proofImg(r, 'rphoto') +
      '<input class="inp rnote" id="note_'+r.id+'" placeholder="한마디 (안 써도 돼요)" maxlength="60">'+
      '<div class="rbtns"><button class="rok" data-act="rok" data-v="'+r.id+'">👍 수락'+(pts?' (+'+pts+'점)':'')+'</button>'+
      '<button class="rno" data-act="rno" data-v="'+r.id+'">'+(NO_LABEL[r.type]||'↩ 다시 해요')+'</button></div></div>';
  });
  if(list.length>1) h += '<button class="big" style="background:#22b573" data-act="rokall">👍 모두 수락하기</button>';
  h += '</div>';

  h += '<div class="section"><h2>🧒 아이들 오늘 현황</h2>';
  kids().forEach(function(k){
    var d = peekDay(k.id), outNow = d.outs.filter(function(o){return !o.end;})[0], freeNow = d.free.filter(function(f){return !f.end;})[0];
    h += '<button class="kidrow" data-act="kidview" data-v="'+k.id+'"><div class="kface">'+face(k)+'</div><div class="kinfo"><b>'+esc(k.name)+'</b> <span class="tm">'+S.m[k.id].points+'점 · ⭐'+starCount(k.id)+'</span><div class="kmiss">';
    MISSIONS.forEach(function(m){ h += '<span title="'+m.nm+'">'+m.ic+stIcon(missState(k.id,m.k))+'</span>'; });
    h += '</div><div class="tm">'+(outNow?'🚶 '+esc(outNow.place)+'에 외출 중 · ':'')+(freeNow?'🎮 자유시간 중 · ':freeOpen(k.id)?'🎮 자유시간 열림 · ':'')+
      '🌙 '+(d.report?(d.report.st==='ok'?'마감 완료':d.report.st==='wait'?'마감 확인 대기':'마감 다시 쓰는 중'):'마감 전')+'</div></div><span class="arrow">›</span></button>';
  });
  h += '</div>' + askHtml() + '<button class="wide" data-act="praise">💌 아이에게 칭찬 보내기</button>'+
    '<button class="wide" data-act="games">🕹️ 게임방 (아이들과 기록 겨루기)</button>' + memoryHtml() + '<button class="ownerbtn" data-act="owner">'+(isOwner(me)?'📱 이 휴대폰은 <b>'+esc(me.name)+'</b> 것 ✅ <small>(누르면 해제)</small>':'📱 이 휴대폰은 내 것으로 정하기 <small>(앱을 켜면 바로 내 화면)</small>')+'</button>';
  return h;
}
function vKidView(me){
  var k = mem(V.kid), d = peekDay(k.id);
  var h = backBar() + '<div class="hero" style="background:'+k.color+'"><div class="row"><div class="ava">'+bigFace(k)+'</div><div><div class="nm">'+esc(k.name)+'</div>'+
    '<div class="ttl">레벨 '+level(S.m[k.id].points)+' · '+S.m[k.id].points+'점 · 🔥 연속 '+S.m[k.id].streak+'일</div></div></div></div>';
  h += '<div class="section"><h2>🎯 오늘의 미션</h2>';
  MISSIONS.forEach(function(m){ var ms = d.miss[m.k]||{}; h += '<div class="vrow">'+stIcon(ms.st)+' '+m.ic+' '+m.nm+(ms.note?' <span class="tm">「'+esc(ms.note)+'」</span>':'')+(ms.photo?proofImg({photo:ms.photo}, 'vphoto'):'')+(ms.st==='ok' && !(me && me.kid) ? '<button class="redo" data-act="redo" data-v="'+m.k+'">↩ 다시 하세요</button>' : '')+'</div>'; });
  h += '</div><div class="section"><h2>✏️ 숙제 목록</h2>';
  if(!d.hw.length) h += '<div class="empty">적은 숙제가 없어요</div>';
  d.hw.forEach(function(x){ h += '<div class="vrow">'+(x.done?'✔️':'⬜')+' '+esc(x.t)+'</div>'; });
  h += '</div><div class="section"><h2>🚶 외출</h2>';
  if(!d.outs.length) h += '<div class="empty">오늘 외출 없음</div>';
  d.outs.forEach(function(o){ h += '<div class="vrow">'+esc(o.place)+' · '+hm(o.start)+' → '+(o.end?hm(o.end)+(o.ontime?' 약속 지킴':' 늦음'):'아직 밖 (약속 '+hm(o.back)+')')+'</div>'; });
  h += '</div><div class="section"><h2>🎮 자유시간</h2>';
  if(!d.free.length) h += '<div class="empty">아직 없어요</div>';
  d.free.forEach(function(f){ h += '<div class="vrow">'+esc(f.what||'자유시간')+' '+hm(f.start)+' → '+(f.end?hm(f.end)+(f.kept?' 약속 지킴':' 시간 넘김'):'지금 노는 중 ('+f.min+'분)')+'</div>'; });
  h += '</div>';
  if(d.report){
    var r = d.report;
    h += '<div class="section"><h2>🌙 마감 보고 '+r.mood+'</h2>'+(r.good?'<div class="vrow">👍 '+esc(r.good)+'</div>':'')+(r.sorry?'<div class="vrow">😅 '+esc(r.sorry)+'</div>':'')+(r.tomorrow?'<div class="vrow">🎯 '+esc(r.tomorrow)+'</div>':'')+'</div>';
  }
  h += calHtml(k.id);
  h += '<button class="wide" data-act="praiseto" data-v="'+k.id+'">💌 '+esc(k.name)+'에게 칭찬 보내기</button>'+
    '<button class="wide" data-act="chatto" data-v="'+k.id+'">📨 '+esc(k.name)+'에게 쪽지 보내기</button>' + logHtml(k.id);
  return h;
}

/* ---------- 챗GPT에게 물어보기 (부모님 화면) ---------- */
function askHtml(){
  return '<div class="section askbox"><h2>🤖 챗GPT에게 물어보기</h2>'+
    '<p class="msub">궁금한 걸 쓰고 누르면 챗GPT 화면이 열려요. (챗GPT 로그인은 각자)</p>'+
    '<div class="crow"><input class="inp" id="askin" maxlength="300" enterkeyhint="search" placeholder="예) 초3 수학 분수 쉽게 설명해 줘"><button class="csend" style="background:#10a37f" data-act="ask">물어보기</button></div>'+
    '<div class="qrow" style="margin-top:8px">'+['초등 숙제 쉽게 설명해 줘','오늘 저녁 메뉴 추천','주말 아이랑 갈 곳 추천','영어 동요 가사 뜻 알려 줘'].map(function(q){ return '<button data-act="askq" data-v="'+q+'">'+q+'</button>'; }).join('')+'</div></div>';
}
function askGo(q){
  q = String(q||'').trim(); if(!q){ toast('🤖 물어볼 내용을 써 주세요'); return; }
  say('챗GPT에게 물어볼게요.');
  window.open('https://chatgpt.com/?q='+encodeURIComponent(q), '_blank', 'noopener');
}

/* ---------- 가족 대화방 (서로 쪽지) ---------- */
var QUICK_KID = ['학원 끝났어요 🏫','집에 도착했어요 🏠','데리러 와 주세요 🙏','배고파요 🍚','숙제 다 했어요 ✏️','사랑해요 💛'];
var QUICK_PARENT = ['잘했어 👍','간식 식탁에 있어 🍪','곧 도착해 🚗','7시까지 들어와요 ⏰','숙제 먼저 하자 ✏️','사랑해 💛'];
var STICKERS = ['👍','💛','😂','🎉','😢','🙏','😴','🍗'];
function forMe(g, id){ return g.from!==id && (g.to==='all' || g.to===id); }
function canSee(g, me){ return !me.kid || g.to==='all' || g.to===me.id || g.from===me.id; }
function unread(id){ return (S.msgs||[]).filter(function(g){ return forMe(g, id) && !(g.read||{})[id]; }).length; }
function nbadge(id){ var n = unread(id); return n ? '<span class="nbadge">💬 '+n+'</span>' : ''; }
function urgentList(){ var since = Date.now() - 24*3600*1000; return (S.msgs||[]).filter(function(g){ return g.urgent && g.t > since; }); }
function urgentHtml(me){
  var list = urgentList(); if(!list.length) return '';
  if(me) list = list.filter(function(g){ return g.from===me.id || !(g.read||{})[me.id]; });
  if(!list.length) return '';
  var h = '';
  list.slice(-2).reverse().forEach(function(g){
    var f = mem(g.from) || {name:'누군가', emoji:'🙂'};
    var ok = S.members.filter(function(m){ return m.id!==g.from && (g.read||{})[m.id]; }).map(function(m){ return m.name; });
    var no = S.members.filter(function(m){ return m.id!==g.from && !(g.read||{})[m.id]; }).map(function(m){ return m.name; });
    h += '<div class="urgent"><div class="uhd">🚨 긴급 공지 <span>'+mini(f)+' '+esc(f.name)+' · '+dayLabel(g.t)+' '+hm(g.t)+'</span></div>'+
      '<div class="utx">'+esc(g.text)+'</div>'+
      '<div class="ust">✅ 확인: '+(ok.length ? esc(ok.join(', ')) : '아직 없음')+(no.length ? '<br>⏳ 아직: '+esc(no.join(', ')) : '<br>🎉 모두 확인했어요')+'</div>'+
      (me && g.from!==me.id ? '<button class="uok" data-act="uack" data-v="'+g.id+'">✅ 확인했어요</button>' : '')+'</div>';
  });
  return h;
}
function msgNotice(me){
  var list = S.msgs.filter(function(g){ return forMe(g, me.id) && !(g.read||{})[me.id] && !g.urgent; });
  if(!list.length) return '';
  var h = '<div class="notice msgnote"><h3>📨 새 쪽지가 '+list.length+'개 왔어요!</h3>';
  list.slice(-3).forEach(function(g){ var f = mem(g.from); if(!f) return;
    h += '<div class="nrow">'+mini(f)+' <b>'+esc(f.name)+'</b>: '+esc(g.text)+'</div>'; });
  return h + '<button class="seen" data-act="chat">💬 대화방에서 보기 · 답장하기</button></div>';
}
function markRead(me){
  var ch = false, now = Date.now();
  S.msgs.forEach(function(g){ if(forMe(g, me.id) && !(g.read||{})[me.id]){ g.read = g.read || {}; g.read[me.id] = now; ch = true; } });
  if(ch) save();
}
function cSend(me, text, stk){
  text = String(text||'').trim();
  if(!text){ toast('보낼 말을 써 주세요'); return; }
  var g = {id:uid(), from:me.id, to:V.tmp.urgent ? 'all' : (V.tmp.to||'all'), text:text.slice(0,200), t:Date.now(), read:{}};
  if(stk) g.stk = true;
  if(V.tmp.urgent && !stk){ g.urgent = true; V.tmp.urgent = false; }
  S.msgs.push(g);
  if(S.msgs.length > 300) S.msgs = S.msgs.slice(-300);
  save(); sfx('pop'); render();
  if(g.urgent) toast('🚨 가족 모두에게 긴급 공지를 올렸어요', {kind:'no', say:'긴급 공지를 올렸어요. 가족 모두에게 알렸어요.'});
  else toast('📨 '+(g.to==='all' ? '가족 모두' : (mem(g.to)||{}).name)+'에게 쪽지를 보냈어요', {kind:'msg', say: g.stk ? '스티커를 보냈어요' : '쪽지를 보냈어요'});
}
function reqAlert(r, oldSt){
  var kid = mem(r.kid); if(!kid) return;
  var me = V.id ? mem(V.id) : null;
  if(r.st==='wait' && oldSt===null){
    if(me && me.kid) return;                                   // 아이 화면에서는 다른 아이 보고 알림 안 함
    sfx('pop'); try{ if(navigator.vibrate) navigator.vibrate(150); }catch(e){}
    toast('📥 '+kid.name+': '+r.text, {title:'새 보고가 왔어요', face:face(kid), kind:'send', sys:true, long:true,
      say: kid.name+'이 '+r.text+' 보고를 보냈어요. 확인해 주세요.'});
  } else if(oldSt && oldSt!==r.st && r.st!=='wait'){
    if(me && me.kid && me.id!==r.kid) return;
    if(me && !me.kid) return;                                   // 다른 부모님이 처리한 것은 조용히
    var ok = r.st==='ok';
    sfx(ok ? 'coin' : 'no'); if(ok) confetti(14);
    toast((ok?'👍 ':'↩️ ')+r.text+(ok ? (r.pts ? ' — '+r.pts+'점!' : ' 수락!') : ' — 다시 해 봐요')+(r.note ? ' 「'+r.note+'」' : ''),
      {title: r.by+(ok ? '가 수락했어요' : '가 돌려보냈어요'), kind: ok?'ok':'no', sys:true, long:true,
       say: kid.name+', '+r.by+(ok ? '가 '+r.text+' 보고를 수락했어요.'+(r.pts ? ' '+r.pts+'점 받았어요!' : '') : '가 '+r.text+'를 다시 해 보래요.')+(r.note ? ' '+r.note : '')});
  }
}
function msgAlert(g){
  var f = mem(g.from); if(!f) return;
  if(V.id && g.from===V.id) return;
  if(V.id && g.to!=='all' && g.to!==V.id && mem(V.id) && mem(V.id).kid) return;
  if(g.urgent){
    sfx('alarm'); setTimeout(function(){ sfx('alarm'); }, 700);
    try{ if(navigator.vibrate) navigator.vibrate([400,150,400,150,400]); }catch(e){}
    toast('🚨 '+g.text, {title:'긴급 공지 — '+f.name, face:face(f), kind:'urgent', sys:true, long:true,
      say:'긴급 공지예요! '+f.name+'의 공지. '+g.text});
    setTimeout(function(){ say(g.text, true); }, 300);
    return;
  }
  sfx('fan'); try{ if(navigator.vibrate) navigator.vibrate([120,60,120]); }catch(e){}
  toast('📨 '+g.text, {title: f.name+(g.to!=='all' && mem(g.to) ? ' → '+mem(g.to).name : '')+'의 쪽지', face:face(f), kind:'msg', sys:true, long:true,
    say: f.name+'의 쪽지예요. '+g.text});
}
function dayLabel(t){ var d = new Date(t), ds = dstr(d); return ds===today() ? '오늘' : ds===dayBefore(today()) ? '어제' : (d.getMonth()+1)+'월 '+d.getDate()+'일'; }
function vChat(me){
  var to = V.tmp.to || 'all';
  var h = backBar() + pageHd('💬', '가족 대화방', '서로 쪽지를 주고받아요', 'linear-gradient(135deg,#4f8cff,#7bdff2)');
  var list = S.msgs.filter(function(g){ return canSee(g, me); }).slice(-80);
  h += '<div class="chatlist">';
  if(!list.length) h += '<div class="empty" style="text-align:center;padding:30px 0">아직 쪽지가 없어요.<br>첫 쪽지를 보내 볼까요? 😊</div>';
  var lastDay = '';
  list.forEach(function(g){
    var f = mem(g.from) || {name:'누군가', emoji:'🙂', color:'#ccc'}, mine = g.from===me.id, dl = dayLabel(g.t);
    if(dl!==lastDay){ h += '<div class="dsep"><span>'+dl+'</span></div>'; lastDay = dl; }
    var tgt = g.to==='all' ? '' : (mem(g.to) ? '→ '+esc(mem(g.to).name) : '');
    if(g.urgent){ h += '<div class="bub urg"><div class="bbox" style="max-width:100%;width:100%"><div class="bwho">🚨 긴급 공지 · '+esc(f.name)+'</div><div class="btx">'+esc(g.text)+'</div><div class="bmeta">'+hm(g.t)+(mine?' <button class="bdel" data-act="cdel" data-v="'+g.id+'">지우기</button>':'')+'</div></div></div>'; return; }
    var readers = Object.keys(g.read||{}).map(function(id){ var m = mem(id); return m ? m.name : ''; }).filter(Boolean);
    var rd = mine ? (readers.length ? '읽음 ✓ '+esc(readers.join('·')) : '아직 안 읽음') : '';
    h += '<div class="bub'+(mine?' mine':'')+(g.stk?' stk':'')+'">'+(mine?'':'<div class="bface">'+mini(f)+'</div>')+
      '<div class="bbox"><div class="bwho">'+(mine?'나':esc(f.name))+' '+tgt+'</div>'+
      '<div class="btx" style="'+(mine?'background:'+esc(me.color):'')+'">'+esc(g.text)+'</div>'+
      '<div class="bmeta">'+hm(g.t)+(rd?' · '+rd:'')+(mine?' <button class="bdel" data-act="cdel" data-v="'+g.id+'" aria-label="지우기">지우기</button>':'')+'</div></div></div>';
  });
  h += '<div id="chatend"></div></div>';
  if(V.tmp.urgent){
    h += '<div class="composer urgentmode"><div class="uhint">🚨 <b>긴급 공지</b> — 가족 <b>모두</b>에게 소리·진동과 함께 크게 알려요'+
      '<button class="mbtn ghost" data-act="uoff">취소</button></div><div class="qrow">';
    ['지금 바로 집으로 와요','전화 받아 주세요','데리러 와 주세요','늦어요, 먼저 밥 먹어요','오늘 학원 쉬어요','문 꼭 잠가요'].forEach(function(q){ h += '<button data-act="cq" data-v="'+esc(q)+'">'+esc(q)+'</button>'; });
    h += '</div><div class="crow"><input class="inp" id="cin" maxlength="200" enterkeyhint="send" placeholder="긴급 공지 내용 쓰기"><button class="csend" style="background:#e03131" data-act="csend">🚨 올리기</button></div></div>';
    return h;
  }
  h += '<div class="composer"><div class="cto"><span>받는 사람</span>'+
    '<button data-act="cto" data-v="all" class="'+(to==='all'?'sel':'')+'">👨‍👩‍👧‍👦 모두</button>';
  S.members.forEach(function(m){ if(m.id===me.id) return;
    h += '<button data-act="cto" data-v="'+m.id+'" class="'+(to===m.id?'sel':'')+'">'+mini(m)+' '+esc(m.name)+'</button>'; });
  h += '</div><div class="qrow">';
  (me.kid ? QUICK_KID : QUICK_PARENT).forEach(function(q){ h += '<button data-act="cq" data-v="'+esc(q)+'">'+esc(q)+'</button>'; });
  h += '</div><div class="qrow stks">';
  STICKERS.forEach(function(s){ h += '<button data-act="cst" data-v="'+s+'">'+s+'</button>'; });
  h += '</div><div class="crow"><input class="inp" id="cin" maxlength="200" enterkeyhint="send" placeholder="'+(to==='all'?'가족 모두에게':esc((mem(to)||{}).name||'')+'에게')+' 쪽지 쓰기"><button class="csend" data-act="csend">보내기</button></div></div>';
  return h;
}

/* 칭찬 (부모님 → 아이) */
function vPraise(me){
  var t = V.tmp;
  var h = backBar() + pageHd('💌', '칭찬 보내기', '칭찬 받은 아이에게 점수가 들어가요', 'linear-gradient(135deg,#ff6fa5,#ff9ac3)');
  h += '<label class="lb">누구에게 보낼까요?</label><div class="pick">';
  kids().forEach(function(mb){ h += '<button data-act="pto" data-v="'+mb.id+'" class="'+(t.to===mb.id?'sel':'')+'">'+mini(mb)+' '+esc(mb.name)+'</button>'; });
  h += '</div><label class="lb">어떤 칭찬이에요?</label><div class="pick">';
  PRAISES.forEach(function(p,i){ h += '<button data-act="pkind" data-v="'+i+'" class="'+(t.kind===i?'sel':'')+'">'+p.ic+' '+p.tx+' (+'+p.pt+')</button>'; });
  h += '</div><label class="lb">한마디 (안 써도 돼요)</label><input class="inp" id="pmsg" maxlength="60" placeholder="예) 방 정리 최고!" value="'+esc(t.msg||'')+'">'+
    '<button class="big" data-act="psend">💌 칭찬 보내기</button>';
  return h;
}
function pSend(me){
  var t = V.tmp; t.msg = (document.getElementById('pmsg').value||'').trim();
  if(!t.to){ toast('누구에게 보낼지 골라 주세요'); return; }
  if(t.kind===undefined){ toast('칭찬 종류를 골라 주세요'); return; }
  var p = PRAISES[t.kind];
  addPts(t.to, p.pt, (me.role||me.name)+'의 칭찬 '+p.ic+' '+p.tx+(t.msg?' — '+t.msg:''));
  giveBadge(t.to, 'praise');
  go('me');
}

/* 설정 */
function vSettings(){
  var h = backBar('home') + pageHd('⚙️','가족 설정','이름·얼굴 사진·부모님 잠금 번호','linear-gradient(135deg,#8a7a70,#b5a597)');
  S.members.forEach(function(mb){
    var cur = V.tmp['ph_'+mb.id]; if(cur===undefined) cur = V.tmp['ph_'+mb.id] = (mb.photo||'');
    h += '<div style="font-size:16px;color:#8a7a70;margin-top:8px">'+esc(mb.role)+' '+esc(mb.name)+' — 얼굴 사진 고르기</div><div class="photopick">'+
      '<button data-act="setph" data-id="'+mb.id+'" data-v="" class="'+(cur===''?'sel':'')+'"><span>'+mb.emoji+'</span></button>';
    PHOTOS.forEach(function(p){ h += '<button data-act="setph" data-id="'+mb.id+'" data-v="'+p.f+'" class="'+(cur===p.f?'sel':'')+'"><img src="'+photoSrc(p.f)+'" alt="" loading="lazy"></button>'; });
    h += '</div><div class="setrow"><select data-id="'+mb.id+'" class="semo">';
    EMOJIS.forEach(function(e){ h += '<option'+(e===mb.emoji?' selected':'')+'>'+e+'</option>'; });
    h += '</select><input class="inp sname" data-id="'+mb.id+'" value="'+esc(mb.name)+'" maxlength="12">'+
      (mb.kid?'<input class="inp sgrade" data-id="'+mb.id+'" value="'+esc(mb.grade||'')+'" placeholder="학년" maxlength="10" style="flex:.7">':'')+'</div>';
  });
  var np = window.Notification ? Notification.permission : 'none';
  h += '<label class="lb">📢 알림·음성 안내</label><div class="cloudbox">'+
    '🗣️ 음성 안내: <b>'+(voiceOn()?'켜짐':'꺼짐')+'</b> <button class="mbtn" data-act="voice">'+(voiceOn()?'끄기':'켜기')+'</button><br>'+
    '📢 휴대폰 알림: <b>'+(np==='granted'?'켜짐':np==='denied'?'막힘 (휴대폰 설정에서 허용)':np==='none'?'지원 안 함':'꺼짐')+'</b> '+(np==='default'?'<button class="mbtn" data-act="notify">켜기</button>':'')+
    '<br><small>앱이 열려 있으면 화면 위 알림창과 목소리로, 뒤에 있으면 휴대폰 알림으로 알려 줘요.</small></div>';
  h += '<label class="lb">☁️ 가족 서버</label>' + cloudSettingsHtml();
  var rws = V.tmp.rw || (V.tmp.rw = JSON.parse(JSON.stringify(S.rewards)));
  h += '<label class="lb">🛍️ 보상 상점 목록 (그림 · 이름 · 코인)</label>';
  rws.forEach(function(rw, i){
    h += '<div class="setrow"><input class="inp rwic" value="'+esc(rw.ic)+'" maxlength="4" style="width:64px;flex:none;text-align:center"><input class="inp rwnm" value="'+esc(rw.nm)+'" maxlength="20" placeholder="보상 이름">'+
      '<input class="inp rwcost" type="number" inputmode="numeric" min="1" value="'+rw.cost+'" style="width:86px;flex:none"><button class="del" data-act="rwdel" data-v="'+i+'" aria-label="빼기">✕</button></div>';
  });
  h += '<button class="big ghost" data-act="rwadd">+ 보상 추가</button>';
  h += '<label class="lb">🔐 부모님 잠금 번호 (아이들이 부모님 화면에 못 들어가게)</label>'+
    '<input class="inp" id="pin" inputmode="numeric" maxlength="6" placeholder="비워 두면 잠금 없음" value="'+esc(S.pin||'')+'">'+
    '<button class="big" style="background:#22b573" data-act="setsave">💾 저장하기</button>'+
    '<button class="danger" data-act="reset">🗑️ 모든 기록 지우기 (처음 상태로)</button>'+
    '<div class="empty" style="margin-top:10px">기록은 이 기기(브라우저)에만 저장돼요.</div>';
  return h;
}

/* ---------- 버튼 처리 ---------- */
app.addEventListener('click', function(e){
  var b = e.target.closest('[data-act]'); if(!b || b.disabled) return;
  var a = b.getAttribute('data-act'), v = b.getAttribute('data-v'), me = V.id ? mem(V.id) : null, d;
  switch(a){
    case 'home': go('home'); break;
    case 'who': go('who'); break;
    case 'whopick':
      var wh = mem(b.getAttribute('data-id')); if(!wh) break;
      if(!wh.kid && S.pin && prompt(wh.role+' 잠금 번호를 넣어 주세요')!==S.pin){ toast('번호가 맞지 않아요'); return; }
      try{ localStorage.setItem('fam-owner', wh.id); localStorage.setItem('fam-asked', '1'); localStorage.setItem('fam-last', wh.id); }catch(e){}
      toast('📱 이 휴대폰은 '+wh.name+' 것으로 정했어요', {kind:'ok', say:false});
      go('me', wh.id); break;
    case 'whoskip':
      try{ localStorage.setItem('fam-asked', '1'); localStorage.removeItem('fam-owner'); }catch(e){}
      go('home'); break;
    case 'owner':
      if(!me) break;
      var cur = null; try{ cur = localStorage.getItem('fam-owner'); }catch(e){}
      try{ if(cur===me.id) localStorage.removeItem('fam-owner'); else localStorage.setItem('fam-owner', me.id); }catch(e){}
      toast(cur===me.id ? '📱 이제 앱을 켜면 처음 화면이 나와요' : '📱 이제 앱을 켜면 바로 '+me.name+' 화면이 열려요', {kind:'ok'});
      render(); break;
    case 'settings':
      if(S.pin && prompt('부모님 잠금 번호를 넣어 주세요')!==S.pin){ toast('번호가 맞지 않아요'); return; }
      go('settings'); break;
    case 'pick':
      var who = mem(b.getAttribute('data-id'));
      if(!who.kid && S.pin && prompt(who.role+' 잠금 번호를 넣어 주세요')!==S.pin){ toast('번호가 맞지 않아요'); return; }
      try{ localStorage.setItem('fam-last', who.id); }catch(err){}
      go('me', who.id); break;
    case 'me': case 'hw': case 'out': case 'free': case 'report': case 'praise': case 'games': go(a); break;
    case 'play': V.screen = 'play'; V.tmp = {g:v}; render(); window.scrollTo(0,0); break;
    case 'praiseto': go('praise'); V.tmp.to = v; render(); break;
    case 'chat': go('chat'); break;
    case 'ask': askGo(document.getElementById('askin').value); break;
    case 'askq': document.getElementById('askin').value = v; askGo(v); break;
    case 'urgent': go('chat'); V.tmp.urgent = true; render(); say('긴급 공지예요. 가족 모두에게 크게 알릴 내용을 쓰거나 골라요.'); var ui = document.getElementById('cin'); if(ui) ui.focus(); break;
    case 'uoff': V.tmp.urgent = false; render(); break;
    case 'uack': var ug = byId(S.msgs, v); if(ug && me){ ug.read = ug.read || {}; ug.read[me.id] = Date.now(); save(); render(); toast('✅ 긴급 공지를 확인했어요', {kind:'ok'}); } break;
    case 'chatto': go('chat'); V.tmp.to = v; render(); break;
    case 'cto': V.tmp.to = v; var ci2 = document.getElementById('cin'), cv2 = ci2 ? ci2.value : ''; render(); document.getElementById('cin').value = cv2; break;
    case 'csend': cSend(me, document.getElementById('cin').value); break;
    case 'cq': cSend(me, v); break;
    case 'cst': cSend(me, v, true); break;
    case 'cdel': var gm = byId(S.msgs, v); if(gm && gm.from===me.id && confirm('이 쪽지를 지울까요?')){ S.msgs = S.msgs.filter(function(g){ return g.id!==v; }); save(); render(); } break;
    case 'kidview': V.kid = v; go('kid'); break;
    case 'redo':
      if(me && !me.kid && V.kid){
        var rm = MISSIONS.filter(function(x){ return x.k===v; })[0];
        var rn = prompt('「'+rm.nm+'」을(를) 다시 하라고 보낼까요? 받은 '+rm.pts+'점은 돌려받아요. 아이에게 한마디 (안 써도 돼요)', '');
        if(rn!==null){ redoMission(V.kid, v, me, rn.trim()); render(); }
      }
      break;
    case 'seen': S.reqs.forEach(function(r){ if(r.kid===me.id && r.st!=='wait') r.seen = true; }); save(); render(); break;
    case 'mreport': proofStart(me, v); break;
    case 'mquick': missReport(me, v); if(V.screen==='hw') go('me'); break;
    case 'mna':
      var mm = MISSIONS.filter(function(x){ return x.k===v; })[0];
      day(me.id).miss[v] = {st:'wait', t:Date.now()};
      addReq(me.id, 'mission', v, mm.ic+' '+mm.na+'이에요'); render(); break;
    case 'mcancel':
      d = day(me.id); delete d.miss[v]; cancelReq(me.id, 'mission', v); toast('보고를 취소했어요'); render(); break;
    case 'hwadd': hwAdd(me, document.getElementById('hwin').value); break;
    case 'hwq': hwAdd(me, v); break;
    case 'hwck': d = day(me.id); var x = byId(d.hw, v); if(x){ x.done = !x.done; if(x.done) confetti(6); save(); render(); } break;
    case 'hwdel':
      d = day(me.id); var y = byId(d.hw, v);
      if(y && confirm('「'+y.t+'」을(를) 지울까요?')){ d.hw = d.hw.filter(function(z){ return z.id!==v; }); save(); render(); }
      break;
    case 'hwcopy':
      day(me.id).hw = peekDay(me.id, dayBefore(today())).hw.map(function(z){ return {id:uid(), t:z.t, done:false}; }); save(); render(); break;
    case 'outplace': V.tmp.place = v; V.tmp.who = document.getElementById('outwho').value; V.tmp.back = document.getElementById('outback').value; render(); break;
    case 'outgo': outGo(me); break;
    case 'outback': outBack(me); break;
    case 'freemin': V.tmp.min = +v; render(); break;
    case 'freewhat': V.tmp.what = (V.tmp.what===v?'':v); render(); break;
    case 'freego': freeGo(me); break;
    case 'freeend': freeEnd(me); break;
    case 'mood': keepReportInputs(); V.tmp.mood = v; render(); break;
    case 'repsend': repSend(me); break;
    case 'repedit': V.tmp.editing = true; render(); break;
    case 'rok': case 'rno':
      var n = document.getElementById('note_'+v);
      decide(v, a==='rok', n ? n.value.trim() : '', me); render(); break;
    case 'rokall':
      if(confirm('기다리는 보고를 모두 수락할까요?')){ waiting().slice().sort(function(p,q){ return p.t-q.t; }).forEach(function(r){ decide(r.id, true, '', me); }); render(); }
      break;
    case 'pto': V.tmp.msg = document.getElementById('pmsg').value; V.tmp.to = v; render(); break;
    case 'pkind': V.tmp.msg = document.getElementById('pmsg').value; V.tmp.kind = +v; render(); break;
    case 'psend': pSend(me); break;
    case 'login': doLogin(); break;
    case 'shop': go('shop'); break;
    case 'buy': buy(me, v); break;
    case 'pet': petTap(); break;
    case 'voice': try{ localStorage.setItem('fam-voice', voiceOn()?'off':'on'); }catch(err){} render(); toast(voiceOn() ? '🗣️ 음성 안내를 켰어요' : '🤐 음성 안내를 껐어요', {say: voiceOn() ? undefined : false}); break;
    case 'notify': askNotify(); break;
    case 'snd': try{ localStorage.setItem('fam-sound', soundOn()?'off':'on'); }catch(err){} sfx('ok'); render(); break;
    case 'rwadd': keepRw(); V.tmp.rw.push({id:uid(), ic:'🎁', nm:'', cost:50}); render(); break;
    case 'rwdel': keepRw(); V.tmp.rw.splice(+v, 1); render(); break;
    case 'tologin': go('login'); break;
    case 'offline': try{ sessionStorage.setItem('fam-offline','1'); }catch(err){} go('home'); break;
    case 'logout': if(confirm('이 기기에서 로그아웃할까요?')){ Cloud.logout().then(function(){ synced = false; go('login'); }); } break;
    case 'uplocal': uploadLocalPhotos(); break;
    case 'zoom': lightbox(v); break;
    case 'memnext': V.tmp.mem = randPhoto(); render(); break;
    case 'setph':
      V.tmp['ph_'+b.getAttribute('data-id')] = v;
      b.parentNode.querySelectorAll('button').forEach(function(z){ z.classList.toggle('sel', z===b); });
      break;
    case 'setsave':
      document.querySelectorAll('.sname').forEach(function(i){ var m = mem(i.getAttribute('data-id')); if(i.value.trim()) m.name = i.value.trim(); });
      document.querySelectorAll('.sgrade').forEach(function(i){ mem(i.getAttribute('data-id')).grade = i.value.trim(); });
      document.querySelectorAll('.semo').forEach(function(s){ mem(s.getAttribute('data-id')).emoji = s.value; });
      S.members.forEach(function(mb){ var p = V.tmp['ph_'+mb.id]; if(p!==undefined) mb.photo = p; });
      S.pin = (document.getElementById('pin').value||'').trim();
      keepRw(); S.rewards = V.tmp.rw.filter(function(rw){ return rw.nm.trim(); }).map(function(rw){ return {id:rw.id, ic:rw.ic||'🎁', nm:rw.nm.trim(), cost:Math.max(1, +rw.cost||1)}; });
      save(); toast('저장했어요!'); go('home'); break;
    case 'reset':
      if(confirm('정말 모든 점수와 기록을 지울까요? 되돌릴 수 없어요.')){ var keep = S.members, pin = S.pin; localStorage.removeItem(KEY); load(); S.members = keep; S.pin = pin; save(); go('home'); toast('처음 상태로 돌아갔어요'); }
      break;
  }
});
function keepRw(){
  var ics = document.querySelectorAll('.rwic'), nms = document.querySelectorAll('.rwnm'), cs = document.querySelectorAll('.rwcost');
  if(!V.tmp.rw) V.tmp.rw = JSON.parse(JSON.stringify(S.rewards));
  for(var i=0;i<nms.length;i++){ V.tmp.rw[i].ic = ics[i].value; V.tmp.rw[i].nm = nms[i].value; V.tmp.rw[i].cost = +cs[i].value || 1; }
}
function hwAdd(me, t){
  t = (t||'').trim(); if(!t) return;
  day(me.id).hw.push({id:uid(), t:t, done:false}); save(); render();
}
app.addEventListener('keydown', function(e){ if(e.key==='Enter' && e.target.id==='hwin') hwAdd(mem(V.id), e.target.value); });

/* ---------- 보상 상점 ---------- */
function pendingCost(kid){ return waiting(kid).filter(function(r){ return r.type==='shop'; }).reduce(function(a,r){ return a + (r.cost||0); }, 0); }
function vShop(me){
  var st = S.m[me.id], hold = pendingCost(me.id), free = (st.coins||0) - hold;
  var h = backBar() + '<div class="page-hd" style="background:linear-gradient(135deg,#f7b733,#fc4a1a)"><span class="ic">🛍️</span><div><h2>보상 상점</h2><p>모은 코인으로 갖고 싶은 걸 골라요. 부모님이 수락하면 받아요!</p></div></div>';
  h += '<div class="coinbig">🪙 <b>'+free+'</b> 코인'+(hold?'<small> (부모님 확인 중 '+hold+'코인)</small>':'')+'</div>';
  S.rewards.forEach(function(rw){
    var can = free >= rw.cost, need = rw.cost - free;
    h += '<div class="rw'+(can?'':' dim')+'"><span class="rwic">'+esc(rw.ic)+'</span><div class="rwtx"><b>'+esc(rw.nm)+'</b><small>🪙 '+rw.cost+'코인</small>'+
      (can?'':'<div class="rwbar"><i style="width:'+Math.min(100, Math.round(free*100/rw.cost))+'%"></i></div><small>'+need+'코인 더 모으면 돼요</small>')+'</div>'+
      '<button class="mbtn" data-act="buy" data-v="'+esc(rw.id)+'"'+(can?'':' disabled')+'>사고 싶어요</button></div>';
  });
  var mine = S.reqs.filter(function(r){ return r.kid===me.id && r.type==='shop'; }).slice(-6).reverse();
  if(mine.length){
    h += '<div class="section"><h2>🧾 내가 고른 것</h2><ul class="log">';
    mine.forEach(function(r){ h += '<li><span>'+esc(r.rname)+' <span class="tm">'+hm(r.t)+'</span></span><span class="p">'+(r.st==='ok'?'✅ 받았어요':r.st==='wait'?'⏳ 확인 중':'🙅 다음에')+'</span></li>'; });
    h += '</ul></div>';
  }
  return h;
}
function buy(me, rid){
  var rw = S.rewards.filter(function(x){ return x.id===rid; })[0]; if(!rw) return;
  var free = (S.m[me.id].coins||0) - pendingCost(me.id);
  if(free < rw.cost){ toast('코인이 모자라요'); return; }
  if(!confirm(rw.ic+' '+rw.nm+'을(를) '+rw.cost+'코인으로 살까요?')) return;
  addReq(me.id, 'shop', uid(), '🛍️ '+rw.ic+' '+rw.nm+' 갖고 싶어요 ('+rw.cost+'코인)', {cost:rw.cost, rname:rw.ic+' '+rw.nm, ref2:rw.id});
  render();
}

/* ---------- 동물 친구 ---------- */
function petHtml(id){
  var st = S.m[id], lv = level(st.points), p = pet(id), next = PETS[Math.min(lv, PETS.length-1)];
  var left = lv >= PETS.length ? 0 : PER_LEVEL - st.points % PER_LEVEL;
  return '<div class="petcard"><button class="pet" data-act="pet" aria-label="동물 친구 쓰다듬기">'+p.ic+'</button><div class="pettx"><b>'+p.nm+'</b>'+
    '<small>'+(left?'다음 모습 '+next.ic+'까지 '+left+'점':'최고로 자랐어요! 🌟')+'</small>'+
    '<div class="bubble" id="petbubble">'+PET_TALK[(new Date().getDate()+lv)%PET_TALK.length]+'</div></div></div>';
}
function petTap(){
  var b = document.getElementById('petbubble'), p = document.querySelector('.pet');
  sfx('tap');
  if(b) b.textContent = PET_TALK[Math.floor(Math.random()*PET_TALK.length)];
  if(p){
    p.classList.remove('jump'); void p.offsetWidth; p.classList.add('jump');
    for(var i=0;i<5;i++){ var hrt = document.createElement('span'); hrt.className = 'heart'; hrt.textContent = ['💛','💖','✨'][i%3];
      hrt.style.left = (20+Math.random()*60)+'%'; hrt.style.animationDelay = (i*0.08)+'s'; p.appendChild(hrt); setTimeout(function(x){ return function(){ x.remove(); }; }(hrt), 1200); }
  } else { var card = document.querySelector('.petcard'); if(card) card.scrollIntoView({behavior:'smooth', block:'center'}); }
}

/* ---------- 효과음 (끄고 켤 수 있음) ---------- */
var AC = null;
function soundOn(){ try{ return localStorage.getItem('fam-sound')!=='off'; }catch(e){ return true; } }
function sfx(kind){
  if(!soundOn()) return;
  try{
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    var seq = {coin:[988,1319], pop:[660,880], fan:[523,659,784,1047], no:[392,311], tap:[880,1175], t0:[330], t1:[392], t2:[494], t3:[587], ok:[784], alarm:[880,660,880,660,880,660]}[kind] || [660];
    seq.forEach(function(f, i){
      var t = AC.currentTime + i*0.09, o = AC.createOscillator(), g = AC.createGain();
      o.type = kind==='no' ? 'square' : 'triangle'; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.18, t+0.01); g.gain.exponentialRampToValueAtTime(0.0001, t+(kind.charAt(0)==='t'&&kind!=='tap'?0.35:0.18));
      o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t+0.4);
    });
  }catch(e){}
}

/* ---------- 이번 달 도장판 ---------- */
function calHtml(id){
  var now = new Date(), y = now.getFullYear(), m = now.getMonth(), first = new Date(y, m, 1).getDay(), last = new Date(y, m+1, 0).getDate(), td = today(), cnt = 0;
  var h = '<div class="grid7">'+'일월화수목금토'.split('').map(function(w){ return '<span class="wd">'+w+'</span>'; }).join('');
  for(var i=0;i<first;i++) h += '<span></span>';
  for(var dd=1; dd<=last; dd++){
    var ds = y+'-'+pad(m+1)+'-'+pad(dd), sc = 0;
    if(ds <= td){ var s = stars(id, ds); sc = (s.miss?1:0)+(s.out?1:0)+(s.free?1:0)+(s.rep?1:0); }
    if(sc) cnt++;
    var stamp = sc>=4 ? '🏆' : sc===3 ? '🌟' : sc ? '⭐' : '';
    h += '<span class="cday'+(ds===td?' today':'')+(ds>td?' future':'')+'"><i>'+dd+'</i>'+stamp+'</span>';
  }
  return '<div class="section"><h2>📅 '+(m+1)+'월 도장판 <small class="tm">별 모은 날 '+cnt+'일</small></h2>'+h+'</div>'+
    '<div class="callegend">⭐ 별 1~2개 · 🌟 3개 · 🏆 4개 모두!</div></div>';
}

/* ---------- 서버 로그인·사진 올리기 ---------- */
function vLogin(){
  return '<div class="top"><h1>🏠 우리 가족 하루</h1></div>'+
    '<div class="section" style="text-align:center"><div style="font-size:72px">☁️</div><h2>가족 계정으로 들어가요</h2>'+
    '<p style="color:#8a7a70">이 휴대폰에서 한 번만 하면 계속 기억해요.<br>가족 모두 같은 계정을 써요.</p>'+
    '<input class="inp" id="lemail" type="email" autocomplete="username" placeholder="가족 계정 이메일" style="margin-top:8px">'+
    '<input class="inp" id="lpw" type="password" autocomplete="current-password" placeholder="비밀번호" style="margin-top:8px">'+
    '<button class="big" style="background:#4f8cff" data-act="login">들어가기</button>'+
    '<button class="big ghost" data-act="offline">인터넷 없이 이 기기만 쓰기</button></div>';
}
async function doLogin(){
  var em = document.getElementById('lemail').value.trim(), pw = document.getElementById('lpw').value;
  if(!em || !pw){ toast('이메일과 비밀번호를 넣어 주세요'); return; }
  try{ await Cloud.login(em, pw); }catch(e){ toast('들어가지 못했어요. 이메일·비밀번호를 확인해 주세요'); return; }
  app.innerHTML = '<div class="loading">☁️ 가족 소식 불러오는 중…</div>';
  try{ await cloudStart(); }catch(e){ toast('서버 자료를 불러오지 못했어요'); }
  go('home');
}
function resizeToBlob(src, max){
  return new Promise(function(ok, fail){
    var img = new Image();
    img.onload = function(){
      var s = Math.min(1, (max||900)/Math.max(img.width, img.height)), c = document.createElement('canvas');
      c.width = Math.round(img.width*s); c.height = Math.round(img.height*s);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      c.toBlob(function(b){ b ? ok(b) : fail(); }, 'image/jpeg', 0.82);
    };
    img.onerror = fail; img.src = src;
  });
}
async function uploadLocalPhotos(){
  var n = 0;
  toast('📤 사진 올리는 중…');
  for(var i=0;i<LOCAL_PHOTOS.length;i++){
    try{ var r = await fetch('photos/'+LOCAL_PHOTOS[i].f+'.jpg'); if(!r.ok) continue; await Cloud.upload(LOCAL_PHOTOS[i].f+'.jpg', await r.blob()); n++; }catch(e){}
  }
  await loadCloudPhotos(); render();
  toast(n ? '📷 사진 '+n+'장을 올렸어요' : '이 기기에는 올릴 사진 파일이 없어요');
}
async function uploadPicked(files){
  var n = 0;
  for(var i=0;i<files.length;i++){
    try{
      var url = URL.createObjectURL(files[i]), blob = await resizeToBlob(url); URL.revokeObjectURL(url);
      var name = 'u'+Date.now().toString(36)+i;
      if(Cloud.on && Cloud.user) await Cloud.upload(name+'.jpg', blob);
      n++;
    }catch(e){}
  }
  if(Cloud.on && Cloud.user){ await loadCloudPhotos(); render(); toast('📷 사진 '+n+'장을 올렸어요'); }
}
function cloudSettingsHtml(){
  if(!(window.Cloud && Cloud.on)) return '<div class="cloudbox">📱 지금은 <b>이 기기에만</b> 저장돼요.<br><small>가족 휴대폰끼리 주고받으려면 「휴대폰연결_안내」대로 서버를 연결해요.</small></div>';
  if(!Cloud.user) return '<div class="cloudbox">☁️ 서버 설정은 있지만 로그인하지 않았어요. <button class="mbtn" data-act="tologin">로그인</button></div>';
  return '<div class="cloudbox">☁️ <b>가족 서버에 연결됨</b> — 다른 휴대폰과 실시간으로 주고받아요.<br><small>'+esc(Cloud.user.email||'')+'</small>'+
    '<div class="cbtns"><label class="mbtn">📷 사진 올리기<input type="file" id="photofile" accept="image/*" multiple hidden></label>'+
    '<button class="mbtn" data-act="uplocal">📤 이 컴퓨터 가족 사진 올리기</button>'+
    '<button class="mbtn ghost" data-act="logout">로그아웃</button></div></div>';
}

async function boot(){
  load();
  var cloudOk = false;
  try{ cloudOk = !!(window.Cloud && await Cloud.init()); }catch(e){ cloudOk = false; }
  if(cloudOk && !Cloud.user && !sessionStorage.getItem('fam-offline')){ V.screen = 'login'; render(); return; }
  if(cloudOk && Cloud.user){
    app.innerHTML = '<div class="loading">☁️ 가족 소식 불러오는 중…</div>';
    try{ await cloudStart(); }catch(e){ toast('서버에 연결하지 못했어요. 이 기기 기록으로 보여 줄게요'); }
  }
  var owner = null; try{ owner = mem(localStorage.getItem('fam-owner')); }catch(e){}
  var asked = null; try{ asked = localStorage.getItem('fam-asked'); }catch(e){}
  if(owner && V.screen==='home'){ V.screen = 'me'; V.id = owner.id; }
  else if(!asked && V.screen==='home' && S.members.length){ V.screen = 'who'; render(); say('누구예요? 이 휴대폰을 쓰는 사람을 눌러 주세요.'); return; }
  render();
  if(owner) guide('home');
}
app.addEventListener('keydown', function(e){
  if(e.key==='Enter' && e.target.id==='askin' && !e.isComposing && e.keyCode!==229){ e.preventDefault(); askGo(e.target.value); return; }
  if(e.key==='Enter' && e.target.id==='cin' && !e.isComposing && e.keyCode!==229){ e.preventDefault(); var me = V.id ? mem(V.id) : null; if(me) cSend(me, e.target.value); }
});
document.getElementById('proofin').addEventListener('change', function(e){ if(e.target.files.length) proofPicked(e.target.files[0]); else proofPending = null; });
app.addEventListener('change', function(e){ if(e.target.id==='photofile' && e.target.files.length) uploadPicked(e.target.files); });
boot();
document.addEventListener('visibilitychange', function(){ if(!document.hidden && ['home','me','free','kid'].indexOf(V.screen)>=0) render(); });
})();
