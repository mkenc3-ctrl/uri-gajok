/* 우리 가족 게임방
   Games.start(이름, 담을 칸, 도우미) / 도우미: {photos, photoSrc, best(이름), done(이름, 점수, 높을수록좋음, 말), confetti, toast, sfx} */
(function(){
'use strict';
var timers = [];
function later(fn, ms){ var t = setTimeout(fn, ms); timers.push(t); return t; }
function every(fn, ms){ var t = setInterval(fn, ms); timers.push(t); return t; }
function stopAll(){ timers.forEach(function(t){ clearTimeout(t); clearInterval(t); }); timers = []; try{ speechSynthesis.cancel(); }catch(e){} }
function shuffle(a){ for(var i=a.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)), t=a[i]; a[i]=a[j]; a[j]=t; } return a; }
function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
function speak(text, lang, rate){
  try{
    speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(text); u.lang = lang || 'en-US'; u.rate = rate || 0.85;
    var v = speechSynthesis.getVoices().filter(function(x){ return x.lang.replace('_','-').indexOf(u.lang)===0; })[0]; if(v) u.voice = v;
    speechSynthesis.speak(u);
  }catch(e){}
}

/* ① 가족 사진 짝 맞추기 — 난이도 3단계, 미리 보기, 연속 보너스, 점수·별 */
var LEVELS = [
  {k:'easy', ic:'🐣', nm:'쉬움',   pairs:6,  cols:3, peek:2500},
  {k:'mid',  ic:'🐥', nm:'보통',   pairs:8,  cols:4, peek:2500},
  {k:'hard', ic:'🦅', nm:'어려움', pairs:10, cols:4, peek:2000}
];
var EMO = ['🐻','🐰','🐱','🐯','🐶','🦊','🐼','🐸','🐵','🦁','🐧','🦄'];
function memory(el, h){
  var best = h.best('pmatch');
  el.innerHTML = '<div class="gintro"><div class="gbig">🧠</div><h2>가족 사진 짝 맞추기</h2>'+
    '<p>같은 사진 두 장을 찾아요. 처음에 잠깐 다 보여 줄 테니 잘 기억해요!<br><small>적게 뒤집고 빨리 찾을수록 점수가 높아요 · 연속으로 찾으면 보너스!</small></p>'+
    '<div class="lvls">'+LEVELS.map(function(L, i){ return '<button class="lvl" data-i="'+i+'"><span>'+L.ic+'</span><b>'+L.nm+'</b><small>'+L.pairs+'쌍</small></button>'; }).join('')+'</div>'+
    (best!=null ? '<div class="ghint">내 최고 점수: <b>'+best+'점</b></div>' : '')+'</div>';
  el.querySelectorAll('.lvl').forEach(function(b){ b.onclick = function(){ h.sfx('tap'); play(LEVELS[+b.dataset.i]); }; });

  function play(L){
    var photos = shuffle(h.photos.slice()).slice(0, L.pairs);
    var faces = photos.map(function(p){ return {f:p.f, cap:p.cap, src:h.photoSrc(p.f)}; });
    shuffle(EMO.slice()).slice(0, L.pairs - faces.length).forEach(function(e){ faces.push({f:'e'+e, cap:e+' 친구', emo:e}); });
    var cards = shuffle(faces.concat(faces).map(function(p, i){ return {p:p, i:i}; }));
    var open = [], found = 0, tries = 0, combo = 0, bonus = 0, busy = true, t0 = 0, sec = 0;
    el.innerHTML = '<div class="gbar"><span>'+L.ic+' '+L.nm+'</span><span id="mt">⏱️ 0초</span><span id="mtr">뒤집기 0번</span></div>'+
      '<div class="mprog"><i id="mpb"></i></div><div class="mcap" id="mcap">👀 잘 봐 두세요!</div>'+
      '<div class="mgrid3" id="mg" style="grid-template-columns:repeat('+L.cols+',1fr)"></div>';
    var g = el.querySelector('#mg'), btns = [];
    cards.forEach(function(c){
      var b = document.createElement('button');
      b.className = 'mc3 flip';
      b.innerHTML = '<span class="mc3in"><span class="mc3back">🏠</span><span class="mc3front">'+(c.p.emo ? '<span class="mc3emo">'+c.p.emo+'</span>' : '<img src="'+c.p.src+'" alt="" draggable="false">')+'</span></span>';
      b.onclick = function(){ pick(b, c); };
      g.appendChild(b); btns.push(b);
    });
    // 미리 보기 → 뒤집기 → 시작
    var cnt = Math.ceil(L.peek/1000);
    el.querySelector('#mcap').textContent = '👀 잘 봐 두세요! '+cnt;
    var cd = every(function(){ cnt--; if(cnt>0) el.querySelector('#mcap').textContent = '👀 잘 봐 두세요! '+cnt; }, 1000);
    later(function(){
      clearInterval(cd);
      btns.forEach(function(b, i){ later(function(){ b.classList.remove('flip'); }, i*25); });
      later(function(){ busy = false; t0 = Date.now(); el.querySelector('#mcap').textContent = '시작! 같은 사진을 찾아요 🔍'; h.sfx('ok');
        every(function(){ sec = Math.floor((Date.now()-t0)/1000); el.querySelector('#mt').textContent = '⏱️ '+sec+'초'; }, 500); }, btns.length*25 + 300);
    }, L.peek);

    function pick(b, c){
      if(busy || b.classList.contains('flip')) return;
      b.classList.add('flip'); h.sfx('tap'); open.push({b:b, c:c});
      if(open.length < 2) return;
      tries++; el.querySelector('#mtr').textContent = '뒤집기 '+tries+'번';
      var a = open[0], z = open[1]; open = [];
      if(a.c.p.f === z.c.p.f){
        combo++; found++;
        if(combo>=2) bonus += combo*10;
        [a.b, z.b].forEach(function(x){ x.classList.add('got'); });
        h.sfx('coin'); h.confetti(combo>=2 ? 10 : 5);
        el.querySelector('#mcap').innerHTML = (combo>=2 ? '🔥 '+combo+'연속! +'+(combo*10)+' · ' : '⭕ ')+'「'+esc(a.c.p.cap||'우리 가족')+'」';
        el.querySelector('#mpb').style.width = (found*100/L.pairs)+'%';
        if(found===L.pairs) later(finish, 700);
      } else {
        combo = 0; busy = true; h.sfx('no');
        [a.b, z.b].forEach(function(x){ x.classList.add('miss'); });
        el.querySelector('#mcap').textContent = '앗, 달라요! 다시 기억해 봐요 🤔';
        later(function(){ [a.b, z.b].forEach(function(x){ x.classList.remove('flip','miss'); }); busy = false; }, 850);
      }
    }
    function finish(){
      stopAll();
      var extra = Math.max(0, tries - L.pairs);
      var score = Math.max(10, L.pairs*100 - extra*15 - sec*2 + bonus);
      var starN = extra <= L.pairs*0.5 ? 3 : extra <= L.pairs*1.2 ? 2 : 1;
      h.done('pmatch', score, true, '⭐'.repeat(starN)+' '+L.nm+' '+score+'점! ('+tries+'번 · '+sec+'초)');
    }
  }
}

/* ② 구구단 퀴즈 — 60초 동안 몇 개 맞힐까요 */
function gugu(el, h){
  var score = 0, left = 60, combo = 0, ans;
  el.innerHTML = '<div class="gbar"><span>✖️ 구구단</span><span id="qs">0개</span><span id="qt">60초</span></div>'+
    '<div class="qbox"><div class="qq" id="qq"></div><div class="qc" id="qc"></div><div class="qmsg" id="qmsg">&nbsp;</div></div>';
  function next(){
    var a = 2+Math.floor(Math.random()*8), b = 1+Math.floor(Math.random()*9); ans = a*b;
    var opts = [ans];
    while(opts.length<4){ var w = ans + (Math.floor(Math.random()*9)-4) * (Math.random()<0.5?1:a); if(w>0 && opts.indexOf(w)<0) opts.push(w); }
    el.querySelector('#qq').textContent = a+' × '+b+' = ?';
    var c = el.querySelector('#qc'); c.innerHTML = '';
    shuffle(opts).forEach(function(o){
      var btn = document.createElement('button'); btn.textContent = o;
      btn.onclick = function(){
        var m = el.querySelector('#qmsg');
        if(o===ans){ h.sfx('ok'); score++; combo++; m.textContent = combo>=3 ? '🔥 '+combo+'연속 정답!' : '⭕ 정답!'; if(combo%5===0) h.confetti(10); }
        else { h.sfx('no'); combo = 0; m.textContent = '❌ '+ans+'이 정답이에요'; }
        el.querySelector('#qs').textContent = score+'개';
        next();
      };
      c.appendChild(btn);
    });
  }
  next();
  every(function(){
    left--; el.querySelector('#qt').textContent = left+'초';
    if(left<=0){ stopAll(); h.done('gugu', score, true, '✖️ '+score+'개 맞혔어요!'); }
  }, 1000);
}

/* ③ 영어 동요 번역 퀴즈 — 옛날부터 전해 오는 영어 동요(저작권 걱정 없는 노래)만 씀 */
var SONGS = [
  {s:'반짝반짝 작은 별', ic:'⭐', l:[
    ['Twinkle, twinkle, little star', '반짝반짝 작은 별'],
    ['How I wonder what you are', '네가 무엇인지 정말 궁금해'],
    ['Up above the world so high', '세상 위 저 높은 곳에'],
    ['Like a diamond in the sky', '하늘에 뜬 다이아몬드처럼']]},
  {s:'노를 저어라', ic:'🚣', l:[
    ['Row, row, row your boat', '노를 저어라, 네 배를'],
    ['Gently down the stream', '시냇물을 따라 살살'],
    ['Life is but a dream', '인생은 꿈일 뿐이야']]},
  {s:'맥도날드 할아버지 농장', ic:'🐄', l:[
    ['Old MacDonald had a farm', '맥도날드 할아버지는 농장이 있었어요'],
    ['And on his farm he had a cow', '그 농장에는 소가 있었어요'],
    ['With a moo moo here', '여기서도 음매 음매']]},
  {s:'매애 매애 검은 양', ic:'🐑', l:[
    ['Baa, baa, black sheep, have you any wool?', '매애 매애 검은 양아, 털 좀 있니?'],
    ['Yes sir, yes sir, three bags full', '네, 네, 세 자루 가득 있어요']]},
  {s:'머리 어깨 무릎 발', ic:'🙆', l:[
    ['Head, shoulders, knees and toes', '머리, 어깨, 무릎, 발가락'],
    ['Eyes and ears and mouth and nose', '눈이랑 귀랑 입이랑 코']]},
  {s:'행복하면 손뼉을', ic:'👏', l:[
    ["If you're happy and you know it, clap your hands", '행복하면 손뼉을 쳐요'],
    ["If you're happy and you know it, stomp your feet", '행복하면 발을 쿵쿵 굴러요']]},
  {s:'메리의 아기 양', ic:'🐏', l:[
    ['Mary had a little lamb', '메리에게는 아기 양이 있었어요'],
    ['Its fleece was white as snow', '그 털은 눈처럼 하얬어요']]},
  {s:'런던 다리', ic:'🌉', l:[
    ['London Bridge is falling down', '런던 다리가 무너지고 있어요'],
    ['My fair lady', '나의 아름다운 아가씨']]},
  {s:'비야 비야 저리 가', ic:'☔', l:[
    ['Rain, rain, go away', '비야, 비야, 저리 가'],
    ['Come again another day', '다른 날 다시 와'],
    ['Little Johnny wants to play', '꼬마 조니가 놀고 싶대요']]},
  {s:'존 형, 자고 있어요?', ic:'🔔', l:[
    ['Are you sleeping, Brother John?', '존 형, 자고 있어요?'],
    ['Morning bells are ringing', '아침 종이 울리고 있어요']]},
  {s:'생쥐와 시계', ic:'🐭', l:[
    ['The mouse ran up the clock', '생쥐가 시계 위로 올라갔어요'],
    ['The clock struck one', '시계가 한 시를 쳤어요']]},
  {s:'험프티 덤프티', ic:'🥚', l:[
    ['Humpty Dumpty sat on a wall', '험프티 덤프티가 담 위에 앉았어요'],
    ['Humpty Dumpty had a great fall', '험프티 덤프티가 쿵 떨어졌어요']]},
  {s:'조그만 거미', ic:'🕷️', l:[
    ['The itsy bitsy spider climbed up the water spout', '조그만 거미가 물받이를 기어 올라갔어요'],
    ['Down came the rain and washed the spider out', '비가 내려서 거미를 씻어 내렸어요'],
    ['Out came the sun and dried up all the rain', '해가 나와서 빗물을 다 말렸어요']]},
  {s:'아기 원숭이 다섯 마리', ic:'🐒', l:[
    ['Five little monkeys jumping on the bed', '아기 원숭이 다섯 마리가 침대에서 뛰어요'],
    ['One fell off and bumped his head', '한 마리가 떨어져서 머리를 쿵 했어요'],
    ['No more monkeys jumping on the bed!', '이제 침대에서 뛰면 안 돼!']]},
  {s:'버스 바퀴', ic:'🚌', l:[
    ['The wheels on the bus go round and round', '버스 바퀴가 빙글빙글 돌아요'],
    ['All through the town', '온 동네를 돌아요']]}
];
function song(el, h){
  var best = h.best('song');
  el.innerHTML = '<div class="gintro"><div class="gbig">🎵</div><h2>영어 동요 번역 퀴즈</h2>'+
    '<p>유명한 영어 동요 가사를 듣고<br><b>우리말 뜻</b>을 골라요! (10문제)</p>'+
    '<div class="lvls two2"><button class="lvl" data-m="see"><span>📖</span><b>보고 맞히기</b><small>영어 글자가 보여요</small></button>'+
    '<button class="lvl" data-m="ear"><span>👂</span><b>듣고 맞히기</b><small>소리만 들어요 · 점수 2배</small></button></div>'+
    (best!=null ? '<div class="ghint">내 최고 점수: <b>'+best+'점</b></div>' : '')+'</div>';
  el.querySelectorAll('.lvl').forEach(function(b){ b.onclick = function(){ h.sfx('tap'); start(b.dataset.m); }; });

  function start(mode){
    var all = [];
    SONGS.forEach(function(sg){ sg.l.forEach(function(x){ all.push({en:x[0], ko:x[1], s:sg.s, ic:sg.ic}); }); });
    var qs = shuffle(all.slice()).slice(0, 10), qi = 0, right = 0, combo = 0, score = 0, lock = false;
    el.innerHTML = '<div class="gbar"><span>🎵 '+(mode==='ear'?'👂 듣고':'📖 보고')+' 맞히기</span><span id="sq">1 / 10</span><span id="ss">0점</span></div>'+
      '<div class="mprog"><i id="spb"></i></div><div class="songbox"><div class="stitle" id="st"></div>'+
      '<div class="sline" id="sl"></div><button class="slisten" id="sbtn">🔊 다시 듣기</button></div>'+
      '<div class="schoices" id="sc"></div><div class="qmsg" id="sm">&nbsp;</div>';
    el.querySelector('#sbtn').onclick = function(){ speak(qs[qi].en); };
    show();
    function show(){
      var q = qs[qi]; lock = false;
      el.querySelector('#sq').textContent = (qi+1)+' / 10';
      el.querySelector('#spb').style.width = (qi*10)+'%';
      el.querySelector('#st').textContent = q.ic+' '+q.s;
      el.querySelector('#sl').innerHTML = mode==='ear' ? '<span class="hidden">❓ ❓ ❓</span>' : esc(q.en);
      el.querySelector('#sm').innerHTML = '&nbsp;';
      var wrong = shuffle(all.filter(function(x){ return x.ko!==q.ko; })).slice(0, 3).map(function(x){ return x.ko; });
      var c = el.querySelector('#sc'); c.innerHTML = '';
      shuffle(wrong.concat([q.ko])).forEach(function(o){
        var b = document.createElement('button'); b.textContent = o;
        b.onclick = function(){ answer(b, o); };
        c.appendChild(b);
      });
      later(function(){ speak(q.en); }, 350);
    }
    function answer(b, o){
      if(lock) return; lock = true;
      var q = qs[qi], ok = o===q.ko, m = el.querySelector('#sm');
      el.querySelectorAll('#sc button').forEach(function(x){ if(x.textContent===q.ko) x.classList.add('right'); });
      if(ok){
        right++; combo++; var p = (mode==='ear'?20:10) + (combo>=3 ? 5 : 0); score += p;
        h.sfx('ok'); if(combo>=3) h.confetti(8);
        m.textContent = combo>=3 ? '🔥 '+combo+'연속 정답! +'+p : '⭕ 정답! +'+p;
      } else {
        combo = 0; b.classList.add('wrong'); h.sfx('no');
        m.textContent = '❌ 정답은 「'+q.ko+'」';
      }
      el.querySelector('#ss').textContent = score+'점';
      if(mode==='ear') el.querySelector('#sl').textContent = q.en;
      later(function(){ speak(q.en, 'en-US', 0.9); }, 250);
      later(function(){ qi++; if(qi>=qs.length) end(); else show(); }, ok ? 1900 : 2800);
    }
    function end(){
      stopAll();
      h.done('song', score, true, (right>=9?'🏆':right>=6?'🎉':'👏')+' 10문제 중 '+right+'개! '+score+'점');
    }
  }
}

window.Games = {
  list: [
    {k:'pmatch', ic:'🧠', nm:'가족 사진 짝 맞추기', how:'쉬움·보통·어려움 · 처음에 잠깐 보여 줘요', unit:'점', high:true},
    {k:'song',   ic:'🎵', nm:'영어 동요 번역 퀴즈', how:'영어 동요 가사를 듣고 뜻 맞히기',       unit:'점', high:true},
    {k:'gugu',   ic:'✖️', nm:'구구단 퀴즈',         how:'60초 동안 몇 개 맞힐까?',               unit:'개', high:true}
  ],
  start: function(name, el, h){ stopAll(); if(!h.sfx) h.sfx = function(){};
    ({pmatch:memory, song:song, gugu:gugu})[name](el, h); },
  stop: stopAll
};
})();
