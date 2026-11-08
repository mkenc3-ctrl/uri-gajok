/* 우리 가족 게임방
   Games.start(이름, 담을 칸, 도우미) / 도우미: {photos, photoSrc, best(이름), done(이름, 점수, 높을수록좋음, 말), confetti, toast, sfx} */
(function(){
'use strict';
var timers = [];
function later(fn, ms){ var t = setTimeout(fn, ms); timers.push(t); return t; }
function every(fn, ms){ var t = setInterval(fn, ms); timers.push(t); return t; }
var runTok = null;
function stopAll(){ runTok = null; timers.forEach(function(t){ clearTimeout(t); clearInterval(t); }); timers = []; try{ speechSynthesis.cancel(); }catch(e){} }
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
/* 인기 팝송: 가사는 저작권이 있어 넣지 않고, 제목(뜻 맞히기)과 유튜브 원곡 연결만 씀 */
var HITS = [
  ['Count on Me', '나를 믿고 기대도 돼', '브루노 마스', 'Bruno Mars'],
  ['Just the Way You Are', '있는 그대로의 너', '브루노 마스', 'Bruno Mars'],
  ['APT.', '아파트', '로제·브루노 마스', 'ROSE Bruno Mars'],
  ['Perfect', '완벽해', '에드 시런', 'Ed Sheeran'],
  ['Happy', '행복해', '퍼렐 윌리엄스', 'Pharrell Williams'],
  ["Can't Stop the Feeling!", '이 기분을 멈출 수 없어', '저스틴 팀버레이크', 'Justin Timberlake'],
  ['Let It Go', '다 놓아 버려', '겨울왕국', 'Frozen'],
  ["How Far I'll Go", '내가 얼마나 멀리 갈 수 있을까', '모아나', 'Moana'],
  ["We Don't Talk About Bruno", '브루노 얘기는 하지 않아', '엔칸토', 'Encanto'],
  ['Golden', '황금빛', '케이팝 데몬 헌터스', 'KPop Demon Hunters'],
  ['Dance Monkey', '춤추는 원숭이', '톤스 앤 아이', 'Tones And I'],
  ['Permission to Dance', '춤춰도 된다는 허락', '방탄소년단', 'BTS'],
  ['A Sky Full of Stars', '별이 가득한 하늘', '콜드플레이', 'Coldplay'],
  ['Firework', '불꽃놀이', '케이티 페리', 'Katy Perry'],
  ['Roar', '크게 울부짖어', '케이티 페리', 'Katy Perry'],
  ['Shake It Off', '훌훌 털어 버려', '테일러 스위프트', 'Taylor Swift'],
  ['Love Story', '사랑 이야기', '테일러 스위프트', 'Taylor Swift'],
  ['Someone You Loved', '네가 사랑했던 사람', '루이스 카팔디', 'Lewis Capaldi'],
  ['Memories', '추억들', '마룬 5', 'Maroon 5'],
  ['Stay', '곁에 있어 줘', '키드 라로이·저스틴 비버', 'The Kid LAROI Justin Bieber'],
  ['As It Was', '예전 그대로', '해리 스타일스', 'Harry Styles'],
  ['Flowers', '꽃들', '마일리 사이러스', 'Miley Cyrus'],
  ['Levitating', '둥둥 떠오르는', '두아 리파', 'Dua Lipa'],
  ['Believer', '믿는 사람', '이매진 드래곤스', 'Imagine Dragons'],
  ['Thunder', '천둥', '이매진 드래곤스', 'Imagine Dragons'],
  ['Counting Stars', '별 세기', '원리퍼블릭', 'OneRepublic'],
  ['See You Again', '다시 만나', '위즈 칼리파', 'Wiz Khalifa'],
  ['Hall of Fame', '명예의 전당', '더 스크립트', 'The Script'],
  ['2002', '2002년', '앤마리', 'Anne-Marie'],
  ['Friends', '친구', '앤마리·마시멜로', 'Marshmello Anne-Marie'],
  ['Happier', '더 행복한', '마시멜로', 'Marshmello'],
  ['Sorry', '미안해', '저스틴 비버', 'Justin Bieber'],
  ['Viva la Vida', '인생 만세', '콜드플레이', 'Coldplay']
];
var SONGS = HITS.map(function(x){ return {s:x[2], ic:'🎤', yt:x[3]+' '+x[0]+' official', l:[[x[0], x[1]]]}; });
/* 팝송 수준: 요즘 팝송 가사는 저작권이 있어 그대로 못 넣음 →
   팝송에 자주 나오는 표현으로 직접 지은 문장 + 저작권이 끝난 옛 노래 */
var POP = [
  /* 2002(앤마리): 실제 가사는 저작권이 있어 넣지 않고, 노래 분위기(어린 시절 추억)에 맞춰 직접 지은 문장 + 원곡은 유튜브로 */
  {s:'2002 — 앤마리 (추억 표현)', ic:'💿', yt:'Anne-Marie 2002 official', l:[
    ['Those old songs take me back to my childhood', '그 옛날 노래들이 나를 어린 시절로 데려가'],
    ['We knew every word of our favorite tunes', '우리는 좋아하는 노래 가사를 다 외웠어'],
    ['Best friends forever, that was our promise', '영원한 단짝, 그게 우리 약속이었어'],
    ['Growing up went by way too fast', '어른이 되는 건 너무 빨리 지나갔어'],
    ['Whenever I hear that beat, I feel young again', '그 박자를 들을 때마다 다시 어려지는 기분이야']]},
  {s:'꿈을 향해 (팝송 표현)', ic:'🌟', l:[
    ["Don't let anybody tell you that you can't fly", '누구도 네가 날 수 없다고 말하게 두지 마'],
    ["I'm chasing every dream I've ever had", '나는 꿈꿔 온 모든 꿈을 쫓고 있어'],
    ["We're just getting started, so turn it up", '이제 막 시작이야, 그러니 소리를 키워'],
    ["Even when the lights go down, I'll keep on shining", '불이 꺼져도 나는 계속 빛날 거야'],
    ["Nothing's gonna stop us now", '이제 아무것도 우리를 막을 수 없어']]},
  {s:'우정 (팝송 표현)', ic:'🤝', l:[
    ["You've got my back and I've got yours", '너는 내 편이고 나도 네 편이야'],
    ["No matter how far, I'll always be around", '아무리 멀어도 난 항상 곁에 있을게'],
    ["We laughed until the sun came up", '우리는 해가 뜰 때까지 웃었어'],
    ["Call me when you're feeling down", '기분이 우울할 때 나한테 전화해'],
    ["Side by side, we'll make it through", '나란히 함께라면 우린 이겨 낼 거야']]},
  {s:'여름밤 (팝송 표현)', ic:'🌃', l:[
    ["The city lights are calling out my name", '도시의 불빛이 내 이름을 부르고 있어'],
    ["Let's dance like nobody's watching", '아무도 안 보는 것처럼 춤추자'],
    ["Tonight feels like it could last forever", '오늘 밤은 영원히 계속될 것 같아'],
    ["Roll the windows down and sing along", '창문을 내리고 같이 따라 불러'],
    ["I can't get this song out of my head", '이 노래가 머릿속에서 떠나질 않아']]},
  {s:'용기 (팝송 표현)', ic:'🦁', l:[
    ["I'm not afraid to fall anymore", '나는 이제 넘어지는 게 두렵지 않아'],
    ["Every scar tells a story", '모든 상처에는 이야기가 있어'],
    ["I'll get back up and try again", '나는 다시 일어나서 또 해 볼 거야'],
    ["You're stronger than you think", '너는 생각보다 강해'],
    ["Hold your head up high", '고개를 높이 들어']]},
  {s:'야구장에 데려가 줘 (1908년 노래)', ic:'⚾', l:[
    ['Take me out to the ball game', '나를 야구장에 데려가 줘'],
    ['Buy me some peanuts and Cracker Jack', '땅콩이랑 과자 좀 사 줘'],
    ["I don't care if I never get back", '다시 못 돌아와도 상관없어']]},
  {s:'오! 수재너 (1848년 노래)', ic:'🪕', l:[
    ["Oh! Susanna, oh don't you cry for me", '오 수재너, 나 때문에 울지 마'],
    ["I come from Alabama with a banjo on my knee", '무릎에 밴조를 얹고 앨라배마에서 왔어요']]},
  {s:'징글벨 (1857년 노래)', ic:'🔔', l:[
    ['Dashing through the snow in a one-horse open sleigh', '말 한 마리가 끄는 썰매를 타고 눈 속을 달려요'],
    ['Laughing all the way', '가는 내내 웃으면서'],
    ['Oh what fun it is to ride', '타는 건 정말 신나요']]},
  {s:'나의 보니 (옛 노래)', ic:'🌊', l:[
    ['My Bonnie lies over the ocean', '나의 보니는 바다 건너에 있어요'],
    ['Oh bring back my Bonnie to me', '오, 나의 보니를 내게 돌려줘요']]},
  {s:'놀라운 은혜 (1779년 노래)', ic:'🕊️', l:[
    ['I once was lost, but now am found', '나는 한때 길을 잃었지만 이제 찾았어요'],
    ['Was blind, but now I see', '눈이 멀었지만 이제는 보여요']]}
];
/* 귀멸의 칼날: 노래 가사는 저작권이 있어 넣지 않고, 노래 제목 뜻·작품 속 짧은 말·쉬운 일본어만 씀 [일본어, 뜻, 읽는 법] */
var KIMETSU_SONGS = [
  ['紅蓮華', '붉은 연꽃', '구렌게', 'LiSA', '1기 여는 노래'],
  ['炎', '불꽃', '호무라', 'LiSA', '무한열차편 노래'],
  ['残響散歌', '흩어지는 메아리의 노래', '잔쿄산카', 'Aimer', '유곽편 여는 노래'],
  ['朝が来る', '아침이 온다', '아사가 쿠루', 'Aimer', '유곽편 닫는 노래'],
  ['絆ノ奇跡', '인연의 기적', '키즈나노 키세키', 'MAN WITH A MISSION milet', '대장장이 마을편 여는 노래'],
  ['コイコガレ', '애타게 그리워해', '코이코가레', 'milet MAN WITH A MISSION', '대장장이 마을편 닫는 노래'],
  ['夢幻', '꿈과 환상', '무겐', 'MAN WITH A MISSION milet', '합동 강화 훈련편 여는 노래'],
  ['明け星', '새벽별', '아케보시', 'LiSA', '노래'],
  ['白銀', '은빛', '시로가네', 'LiSA', '노래'],
  ['竈門炭治郎のうた', '카마도 탄지로의 노래', '카마도 탄지로노 우타', '鬼滅の刃', '1기 19화 노래'],
  ['鬼滅の刃', '귀신을 멸하는 칼날', '키메츠노 야이바', '鬼滅の刃', '작품 제목']
];
var KIMETSU = KIMETSU_SONGS.map(function(x){ return {s:x[4], ic:'⚔️', yt:x[3]+' '+x[0], l:[[x[0], x[1], x[2]]]}; }).concat([
  {s:'호흡과 기술', ic:'🌊', l:[
    ['全集中の呼吸', '전집중 호흡', '젠슈추노 코큐'],
    ['水の呼吸', '물의 호흡', '미즈노 코큐'],
    ['炎の呼吸', '불꽃의 호흡', '호노오노 코큐'],
    ['雷の呼吸', '번개의 호흡', '카미나리노 코큐'],
    ['獣の呼吸', '짐승의 호흡', '케다모노노 코큐'],
    ['日の呼吸', '해의 호흡', '히노 코큐']]},
  {s:'작품 속 말', ic:'👹', l:[
    ['鬼', '도깨비(오니)', '오니'],
    ['鬼殺隊', '귀살대', '키사츠타이'],
    ['柱', '주(가장 강한 검사)', '하시라'],
    ['日輪刀', '일륜도(해의 칼)', '니치린토'],
    ['心を燃やせ', '마음을 불태워라', '코코로오 모야세'],
    ['妹', '여동생', '이모우토'],
    ['お兄ちゃん', '오빠·형', '오니이짱']]},
  {s:'쉬운 일본어', ic:'🗾', l:[
    ['頑張れ', '힘내', '간바레'],
    ['ありがとう', '고마워', '아리가토우'],
    ['諦めない', '포기하지 않아', '아키라메나이'],
    ['強くなりたい', '강해지고 싶어', '츠요쿠 나리타이'],
    ['家族を守る', '가족을 지킨다', '카조쿠오 마모루'],
    ['友達', '친구', '토모다치'],
    ['大丈夫', '괜찮아', '다이조부'],
    ['行くぞ', '가자', '이쿠조']]}
]);
var songSet = 'hit';
function song(el, h){
  var best = h.best('song'), SET = songSet==='pop' ? POP : songSet==='jp' ? KIMETSU : SONGS, LANG = songSet==='jp' ? 'ja-JP' : 'en-US', LNM = songSet==='jp' ? '일본어' : '영어';  // hit: 인기 팝송 제목 / pop: 팝송 표현 / jp: 귀멸의 칼날
  el.innerHTML = '<div class="gintro"><div class="gbig">🎵</div><h2>노래 번역 퀴즈</h2>'+
    '<div class="sset"><button class="'+(songSet==='hit'?'on':'')+'" data-set="hit">🎤 인기 팝송 제목</button><button class="'+(songSet==='pop'?'on':'')+'" data-set="pop">💬 팝송 표현</button><button class="'+(songSet==='jp'?'on':'')+'" data-set="jp">⚔️ 귀멸의 칼날</button></div>'+
    '<p>'+(songSet==='jp' ? '귀멸의 칼날 노래 제목과 <b>일본어</b>를 듣고' : songSet==='pop' ? '팝송에 자주 나오는 영어 표현을 듣고' : '인기 팝송 <b>제목</b>을 듣고')+'<br><b>우리말 뜻</b>을 골라요! (10문제)</p>'+
    '<div class="lvls two2"><button class="lvl" data-m="see"><span>📖</span><b>보고 맞히기</b><small>'+LNM+' 글자가 보여요</small></button>'+
    '<button class="lvl" data-m="ear"><span>👂</span><b>듣고 맞히기</b><small>소리만 들어요 · 점수 2배</small></button></div>'+
    '<button class="lvl lall" data-m="all"><span>🎧</span><b>노래 전체 듣기</b><small>'+LNM+'와 우리말 뜻을 차례로 듣고, 원곡은 유튜브로</small></button>'+
    (best!=null ? '<div class="ghint">내 최고 점수: <b>'+best+'점</b></div>' : '')+'</div>';
  el.querySelectorAll('.lvl').forEach(function(b){ b.onclick = function(){ h.sfx('tap'); if(b.dataset.m==='all') listenAll(); else start(b.dataset.m); }; });
  el.querySelectorAll('.sset button').forEach(function(b){ b.onclick = function(){ h.sfx('tap'); songSet = b.dataset.set; song(el, h); }; });

  /* 노래 전체 듣기: 영어 한 줄 → 우리말 뜻 한 줄씩 차례로 읽어 줌 */
  function listenAll(){
    var html = '<div class="gbar"><span>🎧 노래 전체 듣기</span></div>'+
      '<button class="big lplay" id="lpall">▶ 모든 노래 연달아 듣기</button><button class="big ghost lplay" id="lpstop">⏹ 멈추기</button><div class="llist">';
    SET.forEach(function(sg, i){
      html += '<div class="lsong" id="ls'+i+'"><button class="lshd" data-i="'+i+'">'+sg.ic+' <b>'+esc(sg.s)+'</b><span>▶ 듣기</span></button>'+
        (sg.yt ? '<a class="lyt" href="https://www.youtube.com/results?search_query='+encodeURIComponent(sg.yt)+'" target="_blank" rel="noopener">▶ 원곡은 유튜브에서 듣기</a>' : '');
      sg.l.forEach(function(x, j){ html += '<div class="lline" id="ll'+i+'_'+j+'"><div class="len">'+esc(x[0])+(x[2]?' <small class="lrd">['+esc(x[2])+']</small>':'')+'</div><div class="lko">'+esc(x[1])+'</div></div>'; });
      html += '</div>';
    });
    el.innerHTML = html + '</div>';
    var run = 0;
    function mark(id){ el.querySelectorAll('.lline.on').forEach(function(x){ x.classList.remove('on'); }); var n = id && el.querySelector('#'+id); if(n){ n.classList.add('on'); n.scrollIntoView({block:'center', behavior:'smooth'}); } }
    function play(list){
      var my = ++run; try{ speechSynthesis.cancel(); }catch(e){}
      var steps = [];
      list.forEach(function(i){ SET[i].l.forEach(function(x, j){ steps.push({id:'ll'+i+'_'+j, t:x[0], lang:LANG, rate:0.8}); steps.push({id:'ll'+i+'_'+j, t:x[1], lang:'ko-KR', rate:1}); }); });
      var k = 0;
      (function next(){
        if(my!==run) return;
        if(k>=steps.length){ mark(null); h.toast && h.toast('🎵 다 들었어요!'); return; }
        var s = steps[k++]; mark(s.id);
        try{
          var u = new SpeechSynthesisUtterance(s.t); u.lang = s.lang; u.rate = s.rate;
          var v = speechSynthesis.getVoices().filter(function(x){ return x.lang.replace('_','-').indexOf(s.lang)===0; })[0]; if(v) u.voice = v;
          var gone = false; function go(){ if(gone) return; gone = true; later(next, 250); }
          u.onend = go; u.onerror = go; later(go, 9000);
          speechSynthesis.speak(u);
        }catch(e){ later(next, 1500); }
      })();
    }
    el.querySelector('#lpall').onclick = function(){ play(SET.map(function(_, i){ return i; })); };
    el.querySelector('#lpstop').onclick = function(){ run++; try{ speechSynthesis.cancel(); }catch(e){} mark(null); };
    el.querySelectorAll('.lshd').forEach(function(b){ b.onclick = function(){ play([+b.dataset.i]); }; });
  }

  function start(mode){
    var all = [];
    SET.forEach(function(sg){ sg.l.forEach(function(x){ all.push({en:x[0], ko:x[1], rd:x[2], s:sg.s, ic:sg.ic}); }); });
    var qs = shuffle(all.slice()).slice(0, 10), qi = 0, right = 0, combo = 0, score = 0, lock = false;
    el.innerHTML = '<div class="gbar"><span>🎵 '+(mode==='ear'?'👂 듣고':'📖 보고')+' 맞히기</span><span id="sq">1 / 10</span><span id="ss">0점</span></div>'+
      '<div class="mprog"><i id="spb"></i></div><div class="songbox"><div class="stitle" id="st"></div>'+
      '<div class="sline" id="sl"></div><button class="slisten" id="sbtn">🔊 다시 듣기</button></div>'+
      '<div class="schoices" id="sc"></div><div class="qmsg" id="sm">&nbsp;</div>';
    el.querySelector('#sbtn').onclick = function(){ speak(qs[qi].en, LANG); };
    show();
    function show(){
      var q = qs[qi]; lock = false;
      el.querySelector('#sq').textContent = (qi+1)+' / 10';
      el.querySelector('#spb').style.width = (qi*10)+'%';
      el.querySelector('#st').textContent = q.ic+' '+q.s;
      el.querySelector('#sl').innerHTML = mode==='ear' ? '<span class="hidden">❓ ❓ ❓</span>' : esc(q.en)+(q.rd?'<div class="srd">['+esc(q.rd)+']</div>':'');
      el.querySelector('#sm').innerHTML = '&nbsp;';
      var wrong = shuffle(all.filter(function(x){ return x.ko!==q.ko; })).slice(0, 3).map(function(x){ return x.ko; });
      var c = el.querySelector('#sc'); c.innerHTML = '';
      shuffle(wrong.concat([q.ko])).forEach(function(o){
        var b = document.createElement('button'); b.textContent = o;
        b.onclick = function(){ answer(b, o); };
        c.appendChild(b);
      });
      later(function(){ speak(q.en, LANG); }, 350);
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
      if(mode==='ear') el.querySelector('#sl').innerHTML = esc(q.en)+(q.rd?'<div class="srd">['+esc(q.rd)+']</div>':'');
      later(function(){ speak(q.en, LANG, 0.9); }, 250);
      later(function(){ qi++; if(qi>=qs.length) end(); else show(); }, ok ? 1900 : 2800);
    }
    function end(){
      stopAll();
      h.done('song', score, true, (right>=9?'🏆':right>=6?'🎉':'👏')+' 10문제 중 '+right+'개! '+score+'점');
    }
  }
}

/* ④ 가족 사진 틀린 그림 찾기 — 아래 사진에서 바뀐 곳을 찾아 눌러요 */
var SPOT_LV = [
  // kinds: stk 그림 붙이기(잘 보임) · tint 색 바꾸기 · flip 좌우 뒤집기 · copy 다른 조각 덮기(잘 안 보임)
  {ic:'🐣', nm:'쉬움',      n:3, r:0.12,  sec:90,  kinds:['stk'],                       tint:0.35, sub:'큰 그림 3개 · 90초'},
  {ic:'🐥', nm:'보통',      n:5, r:0.09,  sec:100, kinds:['stk','tint','stk','flip'],   tint:0.25, sub:'5군데 · 100초'},
  {ic:'🦅', nm:'어려움',    n:7, r:0.07,  sec:110, kinds:['tint','flip','copy','stk'],  tint:0.15, sub:'작게 7군데 · 110초'},
  {ic:'🐉', nm:'아주 어려움', n:9, r:0.055, sec:120, kinds:['flip','copy','tint'],       tint:0.08, sub:'은근하게 9군데 · 120초'}
];
function spot(el, h){
  var best = h.best('spot');
  el.innerHTML = '<div class="gintro"><div class="gbig">🔎</div><h2>가족 사진 틀린 그림 찾기</h2>'+
    '<p>위아래 두 사진에서 <b>다른 곳</b>을 찾아 눌러요!<br><small>빨리 찾을수록 점수가 높아요 · 막히면 💡 힌트</small></p>'+
    '<div class="lvls four">'+SPOT_LV.map(function(L, i){ return '<button class="lvl" data-i="'+i+'"><span>'+L.ic+'</span><b>'+L.nm+'</b><small>'+L.sub+'</small></button>'; }).join('')+'</div>'+
    (best!=null ? '<div class="ghint">내 최고 점수: <b>'+best+'점</b></div>' : '')+'</div>';
  el.querySelectorAll('.lvl').forEach(function(b){ b.onclick = function(){ h.sfx('tap'); load(SPOT_LV[+b.dataset.i]); }; });

  function load(L){
    var list = shuffle((h.photos||[]).slice());
    if(!list.length){ el.innerHTML = '<div class="gintro"><p>사진이 아직 없어요 😢</p></div>'; return; }
    el.innerHTML = '<div class="gintro"><p>사진 고르는 중…</p></div>';
    var p = list[0], img = new Image();
    img.onload = function(){ play(L, img, p); };
    img.onerror = function(){ list.shift(); if(list.length){ p = list[0]; img.src = h.photoSrc(p.f); } else el.innerHTML = '<div class="gintro"><p>사진을 못 불러왔어요 😢</p></div>'; };
    img.src = h.photoSrc(p.f);
  }

  function play(L, img, p){
    var W = 600, H = Math.round(W * Math.min(0.85, Math.max(0.6, img.height/img.width)));
    // 사진 가운데를 잘라 W×H에 맞춤
    var sr = Math.max(W/img.width, H/img.height), sw = W/sr, sh = H/sr, sx = (img.width-sw)/2, sy = (img.height-sh)/2;
    el.innerHTML = '<div class="gbar"><span>'+L.ic+' '+L.nm+'</span><span id="pt">⏱️ '+L.sec+'초</span><span id="pf">0 / '+L.n+'</span></div>'+
      '<div class="mprog"><i id="ppb"></i></div><div class="spotwrap"><canvas id="ca" width="'+W+'" height="'+H+'"></canvas>'+
      '<div class="spotmid">⬆️ 원래 사진 · 바뀐 사진 ⬇️</div><canvas id="cb" width="'+W+'" height="'+H+'"></canvas></div>'+
      '<div class="qmsg" id="pm">다른 곳을 찾아 눌러요 🔍</div><button class="big ghost" id="phint">💡 힌트 (−50점)</button>';
    var ca = el.querySelector('#ca'), cb = el.querySelector('#cb'), xa = ca.getContext('2d'), xb = cb.getContext('2d');
    xa.drawImage(img, sx, sy, sw, sh, 0, 0, W, H);
    xb.drawImage(img, sx, sy, sw, sh, 0, 0, W, H);
    // 바꿀 곳 고르기 (서로 겹치지 않게, 가장자리 빼고)
    var R = Math.round(W * L.r), diffs = [], tries = 0;
    while(diffs.length < L.n && tries < 500){
      tries++;
      var d = {x: R + Math.random()*(W-2*R), y: R + Math.random()*(H-2*R)};
      if(diffs.every(function(o){ return Math.hypot(o.x-d.x, o.y-d.y) > R*2.3; })) diffs.push(d);
    }
    var STK = ['⭐','🎈','🌸','🍎','🦋','🍀','🐞','🎀','🍩','🐥'], kinds = [];
    while(kinds.length < L.n) kinds = kinds.concat(shuffle(L.kinds.slice()));
    diffs.forEach(function(d, i){
      var k = kinds[i % kinds.length], x0 = d.x-R, y0 = d.y-R, s = R*2;
      xb.save(); xb.beginPath(); xb.arc(d.x, d.y, R, 0, Math.PI*2); xb.clip();
      if(k==='stk'){
        xb.font = Math.round(R*1.3)+'px sans-serif'; xb.textAlign = 'center'; xb.textBaseline = 'middle';
        xb.fillText(STK[Math.floor(Math.random()*STK.length)], d.x, d.y);
      } else if(k==='flip'){
        xb.translate(d.x*2, 0); xb.scale(-1, 1);
        xb.drawImage(ca, x0, y0, s, s, x0, y0, s, s);
      } else if(k==='tint'){
        xb.globalCompositeOperation = 'hue'; xb.globalAlpha = Math.min(1, L.tint*3);
        xb.fillStyle = ['#ff0040','#00c853','#2962ff','#ffab00'][i%4]; xb.fillRect(x0, y0, s, s);
        xb.globalCompositeOperation = 'source-over'; xb.globalAlpha = L.tint; xb.fillRect(x0, y0, s, s);
      } else {
        // 다른 곳의 조각을 덮어씌움
        var ox = Math.random()*(W-s), oy = Math.random()*(H-s);
        xb.drawImage(ca, ox, oy, s, s, x0, y0, s, s);
      }
      xb.restore();
    });
    var found = 0, miss = 0, hints = 0, left = L.sec, over = false, t0 = Date.now();
    function ring(ctx, d, col){ ctx.save(); ctx.lineWidth = 6; ctx.strokeStyle = col; ctx.beginPath(); ctx.arc(d.x, d.y, R*1.05, 0, Math.PI*2); ctx.stroke(); ctx.restore(); }
    function tap(e){
      if(over) return;
      var c = e.currentTarget, rc = c.getBoundingClientRect();
      var x = (e.clientX - rc.left) * W / rc.width, y = (e.clientY - rc.top) * H / rc.height;
      var hit = diffs.filter(function(d){ return !d.ok && Math.hypot(d.x-x, d.y-y) < R*1.25; })[0];
      var m = el.querySelector('#pm');
      if(hit){
        hit.ok = true; found++; ring(xa, hit, '#ff3b5c'); ring(xb, hit, '#ff3b5c'); h.sfx('ok');
        el.querySelector('#pf').textContent = found+' / '+L.n;
        el.querySelector('#ppb').style.width = (found/L.n*100)+'%';
        m.textContent = ['⭕ 찾았다!','👍 좋아요!','🎯 정확해요!','✨ 대단해요!'][found%4];
        if(found===L.n) end(true);
      } else {
        miss++; h.sfx('no'); m.textContent = '❌ 거기는 아니에요';
        try{ if(navigator.vibrate) navigator.vibrate(80); }catch(e2){}
      }
    }
    ca.addEventListener('pointerdown', tap); cb.addEventListener('pointerdown', tap);
    el.querySelector('#phint').onclick = function(){
      if(over) return;
      var d = diffs.filter(function(o){ return !o.ok; })[0]; if(!d) return;
      hints++; h.sfx('tap');
      var n = 0, iv = every(function(){
        n++; xb.save(); xb.globalAlpha = 0.6; ring(xb, d, n%2 ? '#ffd84d' : '#ffffff'); xb.restore();
        if(n>=4){ clearInterval(iv); }
      }, 250);
      el.querySelector('#pm').textContent = '💡 노란 동그라미 근처를 봐요!';
    };
    every(function(){
      if(over) return;
      left = L.sec - Math.floor((Date.now()-t0)/1000);
      el.querySelector('#pt').textContent = '⏱️ '+Math.max(0, left)+'초';
      if(left<=0) end(false);
    }, 500);
    function end(win){
      over = true;
      diffs.forEach(function(d){ if(!d.ok){ ring(xa, d, '#2f9e44'); ring(xb, d, '#2f9e44'); } });
      var sec = Math.floor((Date.now()-t0)/1000);
      var score = Math.max(0, found*100 + (win ? Math.max(0, L.sec-sec)*3 : 0) - miss*15 - hints*50);
      if(win) h.confetti(30);
      later(function(){
        stopAll();
        h.done('spot', score, true, (win ? '🏆 '+L.n+'군데 모두 찾았어요! ' : '⏰ 시간이 다 됐어요. '+found+'군데 찾았어요. ')+score+'점');
      }, win ? 1600 : 2600);
    }
  }
}

/* ⑤ 얼굴 두더지 잡기 — 구멍에서 가족 얼굴이 쏙! 빨리 눌러요 */
function mole(el, h){
  var best = h.best('mole');
  el.innerHTML = '<div class="gintro"><div class="gbig">🔨</div><h2>얼굴 두더지 잡기</h2>'+
    '<p>구멍에서 <b>가족 얼굴</b>이 쏙 나오면 빨리 눌러요!<br>⭐ 황금별은 +30점, 💣 폭탄은 누르면 −20점!</p>'+
    '<div class="lvls"><button class="lvl" data-i="0"><span>🐢</span><b>천천히</b><small>40초</small></button><button class="lvl" data-i="1"><span>🐇</span><b>빠르게</b><small>40초</small></button><button class="lvl" data-i="2"><span>⚡</span><b>번개</b><small>40초</small></button></div>'+
    (best!=null ? '<div class="ghint">내 최고 점수: <b>'+best+'점</b></div>' : '')+'</div>';
  el.querySelectorAll('.lvl').forEach(function(b){ b.onclick = function(){ h.sfx('tap'); play(+b.dataset.i); }; });
  function play(lv){
    var faces = (h.faces||[]).filter(function(f){ return f.src || f.emo; });
    if(!faces.length) faces = [{emo:'🐹'}];
    var speed = [1.0, 0.75, 0.55][lv], score = 0, combo = 0, left = 40, hits = 0, over = false;
    el.innerHTML = '<div class="gbar"><span>🔨 얼굴 두더지</span><span id="mt">⏱️ 40초</span><span id="ms">0점</span></div><div class="mprog"><i id="mpb" style="width:100%"></i></div>'+
      '<div class="mhint" id="mh">준비… 시작!</div><div class="moles" id="mg"></div>';
    var g = el.querySelector('#mg'), holes = [];
    for(var i=0;i<9;i++){
      var d = document.createElement('div'); d.className = 'hole';
      d.innerHTML = '<button class="mup"></button><span class="dirt"></span>';
      g.appendChild(d); holes.push({el:d, btn:d.querySelector('.mup'), busy:false});
    }
    holes.forEach(function(ho){
      ho.btn.addEventListener('pointerdown', function(e){
        e.preventDefault(); if(over || !ho.busy || ho.hit) return;
        ho.hit = true; var k = ho.kind, pts = 0, m = el.querySelector('#mh');
        if(k==='bomb'){ pts = -20; combo = 0; h.sfx('no'); try{ if(navigator.vibrate) navigator.vibrate(200); }catch(e2){} m.textContent = '💥 앗, 폭탄! −20'; ho.el.classList.add('boom'); }
        else { combo++; hits++; pts = (k==='star' ? 30 : 10) + (combo>=5 ? 5 : 0); h.sfx(k==='star' ? 'coin' : 'ok'); m.textContent = k==='star' ? '⭐ 황금별! +'+pts : (combo>=5 ? '🔥 '+combo+'연속! +'+pts : '👍 +'+pts); ho.el.classList.add('bonk'); if(combo%10===0) h.confetti(10); }
        score = Math.max(0, score + pts); el.querySelector('#ms').textContent = score+'점';
        var pop = document.createElement('span'); pop.className = 'mpop '+(pts<0?'neg':''); pop.textContent = (pts>0?'+':'')+pts; ho.el.appendChild(pop);
        later(function(){ pop.remove(); }, 700);
        later(function(){ down(ho); }, 160);
      });
    });
    function down(ho){ ho.el.classList.remove('up','bonk','boom'); later(function(){ ho.busy = false; ho.hit = false; }, 180); }
    function popUp(){
      if(over) return;
      var free = holes.filter(function(x){ return !x.busy; }); if(!free.length) return;
      var ho = free[Math.floor(Math.random()*free.length)], r = Math.random(), f = faces[Math.floor(Math.random()*faces.length)];
      ho.kind = r < 0.12 ? 'bomb' : r < 0.22 ? 'star' : 'face'; ho.busy = true; ho.hit = false;
      ho.btn.innerHTML = ho.kind==='bomb' ? '<span class="memo">💣</span>' : ho.kind==='star' ? '<span class="memo">⭐</span>' : (f.src ? '<img src="'+f.src+'" alt="" draggable="false">' : '<span class="memo">'+f.emo+'</span>');
      ho.el.classList.add('up');
      var stay = (700 + Math.random()*600) * speed * (left<15 ? 0.8 : 1);
      later(function(){ if(ho.busy && !ho.hit){ if(ho.kind!=='bomb') combo = 0; down(ho); } }, stay);
    }
    var t0 = Date.now();
    function loop(){
      if(over) return;
      popUp(); if(left<25 && Math.random()<0.5) popUp(); if(left<10 && Math.random()<0.4) popUp();
      later(loop, (520 + Math.random()*380) * speed);
    }
    later(loop, 700);
    every(function(){
      if(over) return;
      left = 40 - Math.floor((Date.now()-t0)/1000);
      el.querySelector('#mt').textContent = '⏱️ '+Math.max(0,left)+'초';
      el.querySelector('#mpb').style.width = Math.max(0, left/40*100)+'%';
      if(left===10) el.querySelector('#mh').textContent = '⚡ 10초 남았어요! 더 빨라져요';
      if(left<=0){ over = true; h.confetti(20); later(function(){ stopAll(); h.done('mole', score, true, '🔨 '+hits+'번 잡았어요! '+score+'점'); }, 600); }
    }, 250);
  }
}

/* ⑥ 점프 달리기 — 내 얼굴이 달려요! 눌러서 뛰고, 별을 모아요 */
function runner(el, h){
  var best = h.best('run');
  el.innerHTML = '<div class="gintro"><div class="gbig">🏃</div><h2>점프 달리기</h2>'+
    '<p><b>내 얼굴</b>이 달려요! 화면을 누르면 점프,<br>공중에서 한 번 더 누르면 <b>2단 점프</b>!<br>📦 상자와 🐝 벌을 피하고 ⭐ 별을 모아요</p>'+
    '<button class="big" id="rgo">▶ 달리기 시작</button>'+
    (best!=null ? '<div class="ghint">내 최고 점수: <b>'+best+'점</b></div>' : '')+'</div>';
  el.querySelector('#rgo').onclick = function(){ h.sfx('tap'); play(); };
  function play(){
    var W = 640, H = 360, GY = 300;
    el.innerHTML = '<div class="gbar"><span>🏃 점프 달리기</span><span id="rd">0m</span><span id="rs">⭐ 0</span></div>'+
      '<canvas id="rc" class="runcv" width="'+W+'" height="'+H+'"></canvas><div class="qmsg" id="rm">화면을 눌러서 점프!</div>';
    var cv = el.querySelector('#rc'), x = cv.getContext('2d');
    var meF = (h.faces||[]).filter(function(f){ return f.me; })[0] || (h.faces||[])[0] || {emo:'😀'};
    var img = null; if(meF.src){ img = new Image(); img.src = meF.src; }
    var p = {x:110, y:GY, vy:0, r:30, jumps:0}, obs = [], stars = [], clouds = [], parts = [];
    var spd = 5.2, dist = 0, got = 0, tok = {}, last = performance.now(), spawn = 60, sSpawn = 90, dead = false, t = 0;
    for(var i=0;i<4;i++) clouds.push({x:Math.random()*W, y:30+Math.random()*90, s:0.4+Math.random()*0.5});
    runTok = tok;
    function jump(e){
      if(e) e.preventDefault(); if(dead) return;
      if(p.jumps<2){ p.vy = p.jumps ? -11.5 : -13.5; p.jumps++; h.sfx('tap'); for(var k=0;k<6;k++) parts.push({x:p.x, y:p.y+p.r, vx:-Math.random()*3, vy:-Math.random()*2, l:20}); }
    }
    cv.addEventListener('pointerdown', jump);
    var keyH = function(e){ if(e.code==='Space' || e.key===' ' || e.key==='ArrowUp'){ jump(e); } };
    document.addEventListener('keydown', keyH);
    function emoji(ch, cx, cy, size){ x.font = size+'px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(ch, cx, cy); }
    function frame(now){
      if(runTok!==tok){ document.removeEventListener('keydown', keyH); return; }
      var dt = Math.min(2, (now-last)/16.67); last = now; t += dt;
      if(!dead){
        spd += 0.0025*dt; dist += spd*dt/10;
        p.vy += 0.62*dt; p.y += p.vy*dt;
        if(p.y >= GY){ p.y = GY; p.vy = 0; p.jumps = 0; }
        spawn -= dt;
        if(spawn<=0){
          var fly = dist>60 && Math.random()<0.3;
          obs.push(fly ? {x:W+30, y:GY-10-Math.random()*80, w:32, h:28, ch:'🐝', fly:true} : {x:W+30, w:34, h:34, ch:Math.random()<0.5?'📦':'🪨', two:dist>120 && Math.random()<0.25});
          spawn = (55 + Math.random()*55) * (5.2/spd) + 18;
        }
        sSpawn -= dt;
        if(sSpawn<=0){ stars.push({x:W+20, y:GY-40-Math.random()*130}); sSpawn = 50 + Math.random()*70; }
        obs.forEach(function(o){ o.x -= spd*dt; if(o.fly) o.y += Math.sin(t/8)*0.8; });
        stars.forEach(function(s2){ s2.x -= spd*dt; });
        obs = obs.filter(function(o){ return o.x > -60; }); stars = stars.filter(function(s2){ return s2.x > -30 && !s2.got; });
        // 부딪힘
        obs.forEach(function(o){
          var GL = GY + p.r, x0 = o.x - o.w/2, x1 = o.x + o.w/2 + (o.two ? o.w : 0);
          var top = o.fly ? o.y - o.h/2 : GL - o.h, bot = o.fly ? o.y + o.h/2 : GL;
          var cx = Math.max(x0, Math.min(p.x, x1)), cy = Math.max(top, Math.min(p.y, bot)), dx = p.x-cx, dy = p.y-cy;
          if(dx*dx + dy*dy < (p.r-6)*(p.r-6)) die();
        });
        stars.forEach(function(s2){ var dx = p.x-s2.x, dy = p.y-s2.y; if(dx*dx+dy*dy < 40*40){ s2.got = true; got++; h.sfx('coin'); el.querySelector('#rs').textContent = '⭐ '+got; for(var k=0;k<8;k++) parts.push({x:s2.x, y:s2.y, vx:(Math.random()-0.5)*5, vy:(Math.random()-0.5)*5, l:24, c:'#ffd84d'}); } });
        el.querySelector('#rd').textContent = Math.floor(dist)+'m';
        if(Math.floor(dist)%100===0 && Math.floor(dist)>0 && !frame['m'+Math.floor(dist)]){ frame['m'+Math.floor(dist)] = 1; el.querySelector('#rm').textContent = '🎉 '+Math.floor(dist)+'m 돌파! 더 빨라져요'; h.sfx('fan'); }
      }
      // 그리기
      var sky = x.createLinearGradient(0,0,0,H); sky.addColorStop(0,'#bfe7ff'); sky.addColorStop(1,'#fff6d6'); x.fillStyle = sky; x.fillRect(0,0,W,H);
      clouds.forEach(function(c){ c.x -= c.s*dt*(dead?0:1); if(c.x<-80) c.x = W+40; emoji('☁️', c.x, c.y, 46); });
      x.fillStyle = '#7bc96f'; x.fillRect(0, GY+p.r-2, W, H-GY); x.fillStyle = '#5aa64f';
      for(var gx = -((dist*10)%40); gx < W; gx += 40) x.fillRect(gx, GY+p.r-2, 20, 6);
      stars.forEach(function(s2){ emoji('⭐', s2.x, s2.y + Math.sin((t+s2.x)/10)*4, 30); });
      obs.forEach(function(o){ var cy2 = o.fly ? o.y : GY + p.r - o.h/2; emoji(o.ch, o.x, cy2, o.fly?34:38); if(o.two) emoji(o.ch, o.x+o.w, cy2, 38); });
      parts.forEach(function(q){ q.x += q.vx*dt; q.y += q.vy*dt; q.l -= dt; x.globalAlpha = Math.max(0, q.l/24); x.fillStyle = q.c || '#c8a26a'; x.beginPath(); x.arc(q.x, q.y, 4, 0, 7); x.fill(); x.globalAlpha = 1; });
      parts = parts.filter(function(q){ return q.l>0; });
      // 나(얼굴)
      var sq = p.y<GY ? 1 : 1 + Math.sin(t/3)*0.04;
      x.save(); x.translate(p.x, p.y); x.rotate(p.y<GY ? Math.max(-0.4, p.vy*0.03) : 0); x.scale(1/sq, sq);
      x.beginPath(); x.arc(0, 0, p.r, 0, 7); x.fillStyle = '#fff'; x.fill(); x.lineWidth = 4; x.strokeStyle = dead ? '#e03131' : '#ff9a2e'; x.stroke();
      x.save(); x.beginPath(); x.arc(0, 0, p.r-3, 0, 7); x.clip();
      if(img && img.complete && img.naturalWidth) x.drawImage(img, -p.r, -p.r, p.r*2, p.r*2); else emoji(meF.emo||'😀', 0, 2, 40);
      x.restore(); x.restore();
      if(p.y>=GY && !dead){ x.font = '20px sans-serif'; x.fillText(Math.floor(t/6)%2 ? '👟' : '🦶', p.x-4, p.y+p.r+2); }
      if(dead){ x.fillStyle = 'rgba(0,0,0,.35)'; x.fillRect(0,0,W,H); x.fillStyle = '#fff'; x.font = '40px sans-serif'; x.textAlign = 'center'; x.fillText('쿵! 💫', W/2, H/2); }
      requestAnimationFrame(frame);
    }
    function die(){
      if(dead) return; dead = true; h.sfx('no'); try{ if(navigator.vibrate) navigator.vibrate([150,60,150]); }catch(e){}
      var score = Math.floor(dist) + got*10;
      el.querySelector('#rm').textContent = '💫 '+Math.floor(dist)+'m · ⭐ '+got+'개';
      later(function(){ stopAll(); document.removeEventListener('keydown', keyH); h.done('run', score, true, '🏃 '+Math.floor(dist)+'m 달리고 ⭐ '+got+'개! '+score+'점'); }, 1300);
    }
    requestAnimationFrame(frame);
  }
}

window.Games = {
  list: [
    {k:'run',    ic:'🏃', nm:'점프 달리기',           how:'내 얼굴이 달려요 · 2단 점프 · 별 모으기', unit:'점', high:true},
    {k:'mole',   ic:'🔨', nm:'얼굴 두더지 잡기',      how:'가족 얼굴을 빨리 눌러요 · 폭탄 조심!',   unit:'점', high:true},
    {k:'pmatch', ic:'🧠', nm:'가족 사진 짝 맞추기', how:'쉬움·보통·어려움 · 처음에 잠깐 보여 줘요', unit:'점', high:true},
    {k:'spot',   ic:'🔎', nm:'가족 사진 틀린 그림 찾기', how:'두 사진에서 다른 곳 찾기 · 4단계', unit:'점', high:true},
    {k:'song',   ic:'🎤', nm:'노래 번역 퀴즈', how:'인기 팝송 · 귀멸의 칼날 일본어 · 전체 듣기',       unit:'점', high:true},
    {k:'gugu',   ic:'✖️', nm:'구구단 퀴즈',         how:'60초 동안 몇 개 맞힐까?',               unit:'개', high:true}
  ],
  start: function(name, el, h){ stopAll(); if(!h.sfx) h.sfx = function(){};
    ({run:runner, mole:mole, pmatch:memory, spot:spot, song:song, gugu:gugu})[name](el, h); },
  stop: stopAll
};
})();
