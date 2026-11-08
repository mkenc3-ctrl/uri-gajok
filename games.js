/* 우리 가족 게임방 — 간단한 게임 3가지
   Games.start(이름, 담을 칸, 도우미) / 도우미: {photos, photoSrc, best(이름), done(이름, 점수, 높을수록좋음), confetti, toast} */
(function(){
'use strict';
var timers = [];
function later(fn, ms){ var t = setTimeout(fn, ms); timers.push(t); return t; }
function every(fn, ms){ var t = setInterval(fn, ms); timers.push(t); return t; }
function stopAll(){ timers.forEach(function(t){ clearTimeout(t); clearInterval(t); }); timers = []; }
function shuffle(a){ for(var i=a.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)), t=a[i]; a[i]=a[j]; a[j]=t; } return a; }

/* ① 가족 사진 짝 맞추기 — 적은 횟수일수록 좋음 */
function memory(el, h){
  var EMO = ['🐻','🐰','🐱','🐯','🐶','🦊','🐼','🐸'];
  var usePhoto = h.photos.length >= 6;
  var pics = usePhoto ? shuffle(h.photos.slice()).slice(0,6) : shuffle(EMO.map(function(e){ return {f:e}; })).slice(0,6), cards = shuffle(pics.concat(pics).map(function(p,i){ return {f:p.f, i:i}; }));
  var open = [], found = 0, tries = 0, busy = false;
  el.innerHTML = '<div class="gbar"><span>🧠 짝 맞추기</span><span id="gm">시도 0번</span><span>최고 '+(h.best('memory')||'-')+'번</span></div><div class="mgrid" id="mg"></div>';
  var g = el.querySelector('#mg');
  cards.forEach(function(c, idx){
    var b = document.createElement('button');
    b.className = 'mcard2'; b.innerHTML = '<span class="back">❓</span>'+(usePhoto ? '<img src="'+h.photoSrc(c.f)+'" alt="">' : '<img class="emo" alt="" src="data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#fff8e7"/><text x="50" y="68" font-size="60" text-anchor="middle">'+c.f+'</text></svg>')+'">');
    b.onclick = function(){
      if(busy || b.classList.contains('flip')) return;
      b.classList.add('flip'); h.sfx('tap'); open.push({b:b, c:c});
      if(open.length===2){
        tries++; el.querySelector('#gm').textContent = '시도 '+tries+'번';
        if(open[0].c.f===open[1].c.f){
          open.forEach(function(o){ o.b.classList.add('got'); }); open = []; found++; h.confetti(6); h.sfx('coin');
          if(found===6) later(function(){ finish('memory', tries, false, '🎉 '+tries+'번 만에 다 찾았어요!'); }, 500);
        } else {
          busy = true;
          later(function(){ open.forEach(function(o){ o.b.classList.remove('flip'); }); open = []; busy = false; }, 800);
        }
      }
    };
    g.appendChild(b);
  });
  function finish(name, score, high, msg){ h.done(name, score, high, msg); }
}

/* ② 별 잡기 — 30초 동안 별을 눌러요 (벌레는 -2점) */
function stars(el, h){
  var score = 0, left = 30;
  el.innerHTML = '<div class="gbar"><span>⭐ 별 잡기</span><span id="gs">0점</span><span id="gt">30초</span></div>'+
    '<div class="sky" id="sky"><div class="ready">준비~<br>시작!</div></div><div class="ghint">⭐는 +1점, 🌟는 +3점, 🐛는 -2점!</div>';
  var sky = el.querySelector('#sky');
  later(function(){
    sky.innerHTML = '';
    every(function(){
      left--; el.querySelector('#gt').textContent = left+'초';
      if(left<=0){ stopAll(); sky.innerHTML = '<div class="ready">끝!</div>'; later(function(){ h.done('stars', score, true, '⭐ '+score+'점을 모았어요!'); }, 600); }
    }, 1000);
    every(spawn, 550);
  }, 900);
  function spawn(){
    var r = Math.random(), kind = r<0.12 ? '🐛' : r<0.25 ? '🌟' : '⭐';
    var s = document.createElement('button');
    s.className = 'sitem'; s.textContent = kind;
    s.style.left = (5+Math.random()*80)+'%'; s.style.top = (5+Math.random()*78)+'%';
    s.onclick = function(){
      if(s.dataset.hit) return; s.dataset.hit = 1;
      score += kind==='🐛' ? -2 : kind==='🌟' ? 3 : 1; if(score<0) score = 0;
      el.querySelector('#gs').textContent = score+'점';
      s.classList.add('hit'); s.textContent = kind==='🐛' ? '💥' : '✨'; h.sfx(kind==='🐛' ? 'no' : 'coin');
      setTimeout(function(){ s.remove(); }, 250);
    };
    sky.appendChild(s);
    setTimeout(function(){ if(s.parentNode) s.remove(); }, 1300);
  }
}

/* ③ 구구단 퀴즈 — 60초 동안 몇 개 맞힐까요 */
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

/* ④ 따라 누르기 — 동물 친구들이 반짝인 순서를 기억해서 똑같이 눌러요 */
function simon(el, h){
  var PADS = [{ic:'🐻', c:'#ff6b6b'}, {ic:'🐰', c:'#ffd84d'}, {ic:'🐸', c:'#22b573'}, {ic:'🐳', c:'#4f8cff'}];
  var seq = [], pos = 0, lock = true, round = 0;
  el.innerHTML = '<div class="gbar"><span>🎵 따라 누르기</span><span id="sr">0단계</span><span>최고 '+(h.best('simon')||0)+'단계</span></div>'+
    '<div class="smsg" id="smsg">잘 보고 기억해요!</div><div class="sgrid" id="sg"></div>';
  var g = el.querySelector('#sg'), btns = [];
  PADS.forEach(function(p, i){
    var b = document.createElement('button'); b.className = 'spad'; b.style.background = p.c; b.textContent = p.ic;
    b.onclick = function(){ if(lock) return; flash(i); press(i); };
    g.appendChild(b); btns.push(b);
  });
  function flash(i){ btns[i].classList.add('lit'); h.sfx('t'+i); later(function(){ btns[i].classList.remove('lit'); }, 320); }
  function msg(t){ el.querySelector('#smsg').textContent = t; }
  function next(){
    seq.push(Math.floor(Math.random()*4)); pos = 0; lock = true; msg('👀 잘 봐요… ('+seq.length+'개)');
    seq.forEach(function(x, k){ later(function(){ flash(x); }, 700 + k*Math.max(320, 600 - seq.length*25)); });
    later(function(){ lock = false; msg('👆 이제 똑같이 눌러요!'); }, 700 + seq.length*Math.max(320, 600 - seq.length*25));
  }
  function press(i){
    if(i !== seq[pos]){ lock = true; h.sfx('no'); msg('앗! 틀렸어요'); later(function(){ h.done('simon', round, true, '🎵 '+round+'단계까지 기억했어요!'); }, 900); return; }
    pos++;
    if(pos === seq.length){ round++; el.querySelector('#sr').textContent = round+'단계'; lock = true; msg('⭕ 잘했어요!'); if(round%3===0) h.confetti(10); later(next, 800); }
  }
  later(next, 400);
}

window.Games = {
  list: [
    {k:'memory', ic:'🧠', nm:'가족 사진 짝 맞추기', how:'같은 사진 두 장을 찾아요', unit:'번', high:false},
    {k:'stars',  ic:'⭐', nm:'별 잡기',            how:'30초 동안 별을 콕콕!',   unit:'점', high:true},
    {k:'gugu',   ic:'✖️', nm:'구구단 퀴즈',        how:'60초 동안 몇 개 맞힐까?', unit:'개', high:true},
    {k:'simon',  ic:'🎵', nm:'따라 누르기',        how:'반짝인 순서를 기억해요',   unit:'단계', high:true}
  ],
  start: function(name, el, h){ stopAll(); if(!h.sfx) h.sfx = function(){};
    ({memory:memory, stars:stars, gugu:gugu, simon:simon})[name](el, h); },
  stop: stopAll
};
})();
