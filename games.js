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
/* ⑦ 그림 보고 영어 단어 맞히기 */
var WORDS = [['🍎','apple','사과'],['🐶','dog','개'],['🐱','cat','고양이'],['🚗','car','자동차'],['🏠','house','집'],['🌞','sun','해'],['🌙','moon','달'],['⭐','star','별'],['🐟','fish','물고기'],['🐦','bird','새'],
  ['🍌','banana','바나나'],['🥛','milk','우유'],['📚','book','책'],['✏️','pencil','연필'],['🎒','bag','가방'],['🌳','tree','나무'],['🌸','flower','꽃'],['🐘','elephant','코끼리'],['🦁','lion','사자'],['🐵','monkey','원숭이'],
  ['🍞','bread','빵'],['🥚','egg','달걀'],['⚽','ball','공'],['🚌','bus','버스'],['✈️','airplane','비행기'],['🚲','bike','자전거'],['⏰','clock','시계'],['🪑','chair','의자'],['🛏️','bed','침대'],['🚪','door','문'],
  ['👟','shoes','신발'],['🧢','cap','모자'],['🍦','ice cream','아이스크림'],['🍰','cake','케이크'],['🐻','bear','곰'],['🐰','rabbit','토끼'],['🐸','frog','개구리'],['🐢','turtle','거북'],['🌈','rainbow','무지개'],['☔','umbrella','우산'],
  ['🍓','strawberry','딸기'],['🍉','watermelon','수박'],['🐷','pig','돼지'],['🐮','cow','소'],['🐴','horse','말'],['🦆','duck','오리'],['🍕','pizza','피자'],['🐝','bee','벌'],['🦋','butterfly','나비'],['🔑','key','열쇠']];
var WORDS2 = [['🦒','giraffe','기린'],['🐘','elephant','코끼리'],['🦋','butterfly','나비'],['🐢','turtle','거북'],['🦁','lion','사자'],['🐧','penguin','펭귄'],['🦓','zebra','얼룩말'],['🐊','crocodile','악어'],['🦉','owl','부엉이'],['🐬','dolphin','돌고래'],['🐙','octopus','문어'],['🦀','crab','게'],['🐌','snail','달팽이'],['🦔','hedgehog','고슴도치'],['🐿️','squirrel','다람쥐'],['🦘','kangaroo','캥거루'],['🦩','flamingo','플라밍고'],['🦈','shark','상어'],['🍓','strawberry','딸기'],['🍉','watermelon','수박'],['🍍','pineapple','파인애플'],['🥕','carrot','당근'],['🥦','broccoli','브로콜리'],['🍄','mushroom','버섯'],['🌽','corn','옥수수'],['🍑','peach','복숭아'],['🍇','grape','포도'],['🥒','cucumber','오이'],['🧅','onion','양파'],['🥔','potato','감자'],['🚁','helicopter','헬리콥터'],['🚀','rocket','로켓'],['🚒','fire truck','소방차'],['🚑','ambulance','구급차'],['🚲','bicycle','자전거'],['🚂','train','기차'],['⛵','sailboat','돛단배'],['🚜','tractor','트랙터'],['☂️','umbrella','우산'],['🔭','telescope','망원경'],['🎹','piano','피아노'],['🥁','drum','북'],['🎻','violin','바이올린'],['🪜','ladder','사다리'],['🧲','magnet','자석'],['🕯️','candle','양초'],['⏰','alarm clock','자명종'],['🧸','teddy bear','곰 인형'],['🎈','balloon','풍선'],['📚','library','도서관'],['🌈','rainbow','무지개'],['⚡','lightning','번개'],['🌋','volcano','화산'],['🏔️','mountain','산'],['🏝️','island','섬'],['❄️','snowflake','눈송이'],['🌪️','tornado','회오리바람'],['🌊','wave','파도'],['🧑‍🚒','firefighter','소방관'],['👩‍⚕️','doctor','의사'],['👨‍🍳','chef','요리사'],['👮','police officer','경찰관'],['🧑‍🏫','teacher','선생님'],['🧑‍🚀','astronaut','우주비행사'],['🏥','hospital','병원'],['🏫','school','학교'],['🦷','tooth','이'],['👂','ear','귀']];
function eng2(el, h){ eng(el, h, true); }
function eng(el, h, hard){
  var LIST = hard ? WORDS2 : WORDS, KEY = hard ? 'eng2' : 'eng';
  var score = 0, left = 60, combo = 0, ans, pool = shuffle(LIST.slice()), qi = 0;
  el.innerHTML = '<div class="gbar"><span>'+(hard?'🎓 어려운 영어':'🔤 영어 단어')+'</span><span id="qs">0개</span><span id="qt">60초</span></div>'+
    '<div class="qbox"><div class="qq" id="qq" style="font-size:84px;line-height:1.1"></div><div class="tm" id="qko"></div><div class="qc eng" id="qc"></div><div class="qmsg" id="qmsg">&nbsp;</div></div>';
  function speak(w){ try{ var u = new SpeechSynthesisUtterance(w); u.lang = 'en-US'; u.rate = 0.85; speechSynthesis.cancel(); speechSynthesis.speak(u); }catch(e){} }
  function next(){
    if(qi>=pool.length){ pool = shuffle(LIST.slice()); qi = 0; }
    var w = pool[qi++]; ans = w[1];
    var opts = [w[1]]; while(opts.length<4){ var o = LIST[Math.floor(Math.random()*LIST.length)][1]; if(opts.indexOf(o)<0) opts.push(o); }
    el.querySelector('#qq').textContent = w[0];
    el.querySelector('#qko').textContent = (hard || score>=10) ? '' : '('+w[2]+')';
    var c = el.querySelector('#qc'); c.innerHTML = '';
    shuffle(opts).forEach(function(o){
      var btn = document.createElement('button'); btn.textContent = o;
      btn.onclick = function(){
        var m = el.querySelector('#qmsg');
        if(o===ans){ h.sfx('ok'); speak(ans); score++; combo++; m.textContent = combo>=3 ? '🔥 '+combo+'연속 정답!' : '⭕ 정답! '+ans; if(combo%5===0) h.confetti(10); }
        else { h.sfx('no'); combo = 0; m.textContent = '❌ 정답은 '+ans+(hard?' ('+w[2]+')':''); speak(ans); }
        el.querySelector('#qs').textContent = score+'개';
        next();
      };
      c.appendChild(btn);
    });
  }
  next();
  every(function(){
    left--; el.querySelector('#qt').textContent = left+'초';
    if(left<=0){ stopAll(); h.done(KEY, score, true, (hard?'🎓 어려운 영어 단어 ':'🔤 영어 단어 ')+score+'개 맞혔어요!'); }
  }, 1000);
}

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
  // kinds: stk 그림 붙이기 · color 색 바꾸기 · erase 지우기 · grow 크게 · shift 옮기기 · flip 뒤집기 · bright 밝기 · copy 다른 조각
  // need: 바뀐 정도(0~255) 이 밑이면 다른 방법으로 다시 바꿈 — 너무 안 보이는 곳 막기
  {ic:'🐣', nm:'쉬움',      n:3, r:0.12,  sec:90,  kinds:['stk','color','stk','erase'],               amt:1.0,  need:38, sub:'큰 그림 3개 · 90초'},
  {ic:'🐥', nm:'보통',      n:5, r:0.09,  sec:100, kinds:['stk','color','erase','grow','flip'],        amt:0.8,  need:28, sub:'5군데 · 100초'},
  {ic:'🦅', nm:'어려움',    n:7, r:0.07,  sec:110, kinds:['color','erase','grow','shift','flip','bright'], amt:0.6, need:20, sub:'작게 7군데 · 110초'},
  {ic:'🐉', nm:'아주 어려움', n:9, r:0.055, sec:120, kinds:['color','erase','grow','shift','bright','copy'],  amt:0.45, need:14, sub:'은근하게 9군데 · 120초'}
];
function spot(el, h){
  var best = h.best('spot');
  el.innerHTML = '<div class="gintro"><div class="gbig">🔎</div><h2>가족 사진 틀린 그림 찾기</h2>'+
    '<p>두 사진에서 <b>다른 곳</b>을 찾아 눌러요!<br><small>색이 바뀌거나, 없어지거나, 커지거나, 옮겨진 곳이 있어요<br>빨리 찾을수록 점수가 높아요 · 막히면 💡 힌트</small></p>'+
    '<div class="lvls four">'+SPOT_LV.map(function(L, i){ return '<button class="lvl" data-i="'+i+'"><span>'+L.ic+'</span><b>'+L.nm+'</b><small>'+L.sub+'</small></button>'; }).join('')+'</div>'+
    (best!=null ? '<div class="ghint">내 최고 점수: <b>'+best+'점</b></div>' : '')+'</div>';
  el.querySelectorAll('.lvl').forEach(function(b){ b.onclick = function(){ h.sfx('tap'); load(SPOT_LV[+b.dataset.i]); }; });

  function load(L){
    var list = shuffle((h.photos||[]).slice());
    if(!list.length){ el.innerHTML = '<div class="gintro"><p>사진이 아직 없어요 😢</p></div>'; return; }
    el.innerHTML = '<div class="gintro"><p>사진 고르는 중…</p></div>';
    function one(i, cors){
      if(i >= list.length){ el.innerHTML = "<div class=\"gintro\"><p>사진을 못 불러왔어요 😢</p></div>"; return; }
      var img = new Image(); if(cors) img.crossOrigin = "anonymous";
      img.onload = function(){ play(L, img, list[i]); };
      img.onerror = function(){ if(cors) one(i, false); else one(i+1, true); };
      img.src = h.photoSrc(list[i].f);
    }
    one(0, true);
  }

  function play(L, img, p){
    var W = 800, H = Math.round(W * Math.min(0.85, Math.max(0.6, img.height/img.width)));
    var sr = Math.max(W/img.width, H/img.height), sw = W/sr, sh = H/sr, sx = (img.width-sw)/2, sy = (img.height-sh)/2;
    el.innerHTML = '<div class="gbar"><span>'+L.ic+' '+L.nm+'</span><span id="pt">⏱️ '+L.sec+'초</span><span id="pf">0 / '+L.n+'</span></div>'+
      '<div class="mprog"><i id="ppb"></i></div><div class="spotwrap">'+
      '<div class="spc"><canvas id="ca" width="'+W+'" height="'+H+'"></canvas><div class="spo" id="oa"></div><b class="sptag">원래</b></div>'+
      '<div class="spotmid">⬆️ 원래 사진 · 바뀐 사진 ⬇️</div>'+
      '<div class="spc"><canvas id="cb" width="'+W+'" height="'+H+'"></canvas><div class="spo" id="ob"></div><b class="sptag">바뀐 곳 찾기</b></div></div>'+
      '<div class="spotbot"><div class="qmsg" id="pm">다른 곳을 찾아 눌러요 🔍</div><button class="big ghost" id="phint">💡 힌트<br><small>−50점</small></button></div>';
    var ca = el.querySelector('#ca'), cb = el.querySelector('#cb'), xa = ca.getContext('2d'), xb = cb.getContext('2d');
    xa.imageSmoothingQuality = 'high'; xb.imageSmoothingQuality = 'high';
    xa.drawImage(img, sx, sy, sw, sh, 0, 0, W, H);
    xb.drawImage(img, sx, sy, sw, sh, 0, 0, W, H);
    var R = Math.round(W * L.r), S = R*2;

    // ── 사진에서 무늬가 많은 곳(눈에 띄는 곳) 찾기 ──
    var px = null; try { px = xa.getImageData(0, 0, W, H).data; } catch(e){ px = null; }
    function gray(x, y){ var i = (Math.min(H-1, Math.max(0, y|0))*W + Math.min(W-1, Math.max(0, x|0)))*4; return px[i]*0.3 + px[i+1]*0.59 + px[i+2]*0.11; }
    function detail(cx, cy, rr){
      if(!px) return 1;
      var e = 0, n = 0, st = Math.max(3, Math.round(rr/6));
      for(var y = cy-rr; y < cy+rr; y += st) for(var x = cx-rr; x < cx+rr; x += st){
        if((x-cx)*(x-cx)+(y-cy)*(y-cy) > rr*rr) continue;
        e += Math.abs(gray(x+st, y)-gray(x, y)) + Math.abs(gray(x, y+st)-gray(x, y)); n++;
      }
      return n ? e/n : 0;
    }
    // 얼굴·손(살색)이 많은 곳은 바꾸지 않음 — 가족 얼굴이 지워지거나 번져 보이지 않게
    function skin(cx, cy, rr){
      if(!px) return 0;
      var s1 = 0, n = 0, st = Math.max(3, Math.round(rr/7));
      for(var y = cy-rr*1.3; y < cy+rr*1.3; y += st) for(var x = cx-rr*1.3; x < cx+rr*1.3; x += st){
        var i = (Math.min(H-1, Math.max(0, y|0))*W + Math.min(W-1, Math.max(0, x|0)))*4, r = px[i], gg = px[i+1], b = px[i+2], mx = Math.max(r, gg, b), mn = Math.min(r, gg, b);
        if(r > 95 && gg > 40 && b > 20 && r > gg && r > b && r-gg > 15 && mx-mn > 15 && r-b < 140) s1++; n++;
      }
      return n ? s1/n : 0;
    }
    var cand = [];
    for(var t = 0; t < 260; t++){ var c = {x: R*1.1 + Math.random()*(W-2.2*R), y: R*1.1 + Math.random()*(H-2.2*R)}; c.e = detail(c.x, c.y, R); if(skin(c.x, c.y, R) < 0.18) cand.push(c); }
    if(cand.length < L.n*3) for(var t3 = 0; t3 < 200; t3++){ var c3 = {x: R*1.1 + Math.random()*(W-2.2*R), y: R*1.1 + Math.random()*(H-2.2*R)}; c3.e = detail(c3.x, c3.y, R) * (1 - skin(c3.x, c3.y, R)); cand.push(c3); }
    cand.sort(function(a, b){ return b.e - a.e; });
    var diffs = [];
    function far(d, gap){ return diffs.every(function(o){ return Math.hypot(o.x-d.x, o.y-d.y) > R*gap; }); }
    // 무늬 많은 곳 위주로, 그래도 사진 여기저기 흩어지게
    [2.6, 2.3].forEach(function(gap){ for(var i = 0; i < cand.length && diffs.length < L.n; i++){ if(i < cand.length*0.6 && far(cand[i], gap)) diffs.push(cand[i]); } });
    for(var i2 = 0; i2 < cand.length && diffs.length < L.n; i2++) if(far(cand[i2], 2.1)) diffs.push(cand[i2]);

    // ── 바꾸기 ──
    var canF = (function(){ try{ var t = document.createElement('canvas').getContext('2d'); t.filter = 'blur(1px)'; return t.filter === 'blur(1px)'; }catch(e){ return false; } })();
    var STK = ['⭐','🎈','🌸','🍎','🦋','🍀','🐞','🎀','🍩','🐥','🍓','🌻','🧁','🐠'];
    function patch(fn, feather){
      var pc = document.createElement('canvas'); pc.width = S; pc.height = S; var g = pc.getContext('2d');
      fn(g);
      g.globalCompositeOperation = 'destination-in';
      var gr = g.createRadialGradient(R, R, R*(feather ? 0.55 : 0.95), R, R, R);
      gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.fillRect(0, 0, S, S);
      return pc;
    }
    function src(g, x, y, w, hh){ g.drawImage(ca, x, y, w || S, hh || S, 0, 0, S, S); }
    function apply(d, k, i){
      var x0 = d.x-R, y0 = d.y-R, a = L.amt, pc;
      if(k === 'stk'){
        xb.save(); xb.font = Math.round(R*1.25)+'px sans-serif'; xb.textAlign = 'center'; xb.textBaseline = 'middle';
        xb.shadowColor = 'rgba(0,0,0,.35)'; xb.shadowBlur = R*0.15; xb.shadowOffsetY = R*0.06;
        xb.fillText(STK[Math.floor(Math.random()*STK.length)], d.x, d.y); xb.restore(); return;
      }
      if(k === 'color'){
        pc = patch(function(g){
          if(canF){ g.filter = 'hue-rotate('+Math.round(90 + 90*a + Math.random()*40)+'deg) saturate('+(1.2+0.6*a)+')'; src(g, x0, y0); g.filter = 'none'; }
          else { src(g, x0, y0); g.globalCompositeOperation = 'hue'; g.fillStyle = ['#ff0040','#00c853','#2962ff','#ffab00'][i%4]; g.fillRect(0, 0, S, S); }
        }, true);
      } else if(k === 'bright'){
        var up = Math.random() < 0.5;
        pc = patch(function(g){
          if(canF){ g.filter = 'brightness('+(up ? 1.22 + 0.3*a : 0.78 - 0.22*a)+')'; src(g, x0, y0); g.filter = 'none'; }
          else { src(g, x0, y0); g.fillStyle = up ? 'rgba(255,255,255,.4)' : 'rgba(0,0,0,.4)'; g.fillRect(0, 0, S, S); }
        }, true);
      } else if(k === 'erase'){
        // 옆의 밋밋한 곳으로 덮어 「없어진 것처럼」
        var nb = [[-S,0],[S,0],[0,-S],[0,S],[-S,-S],[S,S],[-S,S],[S,-S]].map(function(o){ return {x: d.x+o[0], y: d.y+o[1]}; })
          .filter(function(o){ return o.x-R >= 0 && o.y-R >= 0 && o.x+R <= W && o.y+R <= H && skin(o.x, o.y, R*0.8) < 0.12; });
        nb.forEach(function(o){ o.e = detail(o.x, o.y, R); }); nb.sort(function(p1, p2){ return p1.e - p2.e; });
        var b = nb[0] || {x: d.x, y: d.y < H/2 ? d.y+S : d.y-S};
        pc = patch(function(g){ src(g, b.x-R, b.y-R); }, true);
      } else if(k === 'grow'){
        var z = 1.2 + 0.25*a, q = S/z;
        pc = patch(function(g){ src(g, d.x-q/2, d.y-q/2, q, q); }, true);
      } else if(k === 'shift'){
        var an = Math.random()*Math.PI*2, m = R*(0.3 + 0.25*a);
        pc = patch(function(g){ src(g, x0+Math.cos(an)*m, y0+Math.sin(an)*m); }, true);
      } else if(k === 'flip'){
        pc = patch(function(g){ g.translate(S, 0); g.scale(-1, 1); src(g, x0, y0); }, true);
      } else {
        var ox = 0, oy = 0;
        for(var tt = 0; tt < 30; tt++){ ox = Math.random()*(W-S); oy = Math.random()*(H-S); if(skin(ox+R, oy+R, R*0.8) < 0.12 && Math.hypot(ox+R-d.x, oy+R-d.y) > S) break; }
        pc = patch(function(g){ src(g, ox, oy); }, true);
      }
      xb.drawImage(pc, x0, y0);
    }
    function restore(d){ xb.save(); xb.beginPath(); xb.arc(d.x, d.y, R+1, 0, Math.PI*2); xb.clip(); xb.drawImage(ca, d.x-R-1, d.y-R-1, S+2, S+2, d.x-R-1, d.y-R-1, S+2, S+2); xb.restore(); }
    function changed(d){
      if(!px) return 999;
      var q; try{ q = xb.getImageData(d.x-R, d.y-R, S, S).data; }catch(e){ return 999; }
      var sum = 0, n = 0, st = 3;
      for(var y = 0; y < S; y += st) for(var x = 0; x < S; x += st){
        if((x-R)*(x-R)+(y-R)*(y-R) > R*R*0.5) continue;
        var j = (y*S+x)*4, gx = Math.round(d.x-R+x), gy = Math.round(d.y-R+y), k2 = (gy*W+gx)*4;
        sum += (Math.abs(q[j]-px[k2]) + Math.abs(q[j+1]-px[k2+1]) + Math.abs(q[j+2]-px[k2+2]))/3; n++;
      }
      return n ? sum/n : 0;
    }
    var kinds = [];
    while(kinds.length < L.n) kinds = kinds.concat(shuffle(L.kinds.slice()));
    diffs.forEach(function(d, i){
      var order = [kinds[i]].concat(shuffle(L.kinds.filter(function(k){ return k !== kinds[i]; }))).concat(['color','stk']);
      for(var j = 0; j < order.length; j++){
        apply(d, order[j], i); d.k = order[j];
        if(changed(d) >= L.need || order[j] === 'stk') break;
        restore(d);
      }
    });

    // ── 놀이 ──
    var found = 0, miss = 0, hints = 0, left = L.sec, over = false, t0 = Date.now(), rapid = [], lockTo = 0;
    var oa = el.querySelector('#oa'), ob = el.querySelector('#ob');
    function mark(ov, d, cls, r){
      var s2 = document.createElement('i'); s2.className = cls;
      var rr = (r || R*1.15);
      s2.style.left = ((d.x-rr)/W*100)+'%'; s2.style.top = ((d.y-rr)/H*100)+'%'; s2.style.width = (rr*2/W*100)+'%'; s2.style.height = (rr*2/H*100)+'%';
      ov.appendChild(s2); return s2;
    }
    function both(d, cls, r){ return [mark(oa, d, cls, r), mark(ob, d, cls, r)]; }
    function tap(e){
      if(over) return;
      var m = el.querySelector('#pm');
      if(Date.now() < lockTo){ m.textContent = '✋ 잠깐! 천천히 살펴봐요'; return; }
      var c = e.currentTarget, rc = c.getBoundingClientRect();
      var x = (e.clientX - rc.left) * W / rc.width, y = (e.clientY - rc.top) * H / rc.height;
      var tol = Math.max(R*1.3, 34*W/rc.width);
      var hit = diffs.filter(function(d){ return !d.ok && Math.hypot(d.x-x, d.y-y) < tol; })[0];
      if(hit){
        hit.ok = true; found++; h.sfx('ok');
        el.querySelectorAll('.sph').forEach(function(n){ n.remove(); });
        both(hit, 'spr');
        el.querySelector('#pf').textContent = found+' / '+L.n;
        el.querySelector('#ppb').style.width = (found/L.n*100)+'%';
        m.textContent = found===L.n ? '🎉 다 찾았어요!' : ['⭕ 찾았다!','👍 좋아요!','🎯 정확해요!','✨ 대단해요!'][found%4]+' 앞으로 '+(L.n-found)+'군데';
        if(found===L.n) end(true);
      } else {
        miss++; h.sfx('no'); m.textContent = '❌ 거기는 아니에요';
        var xm = both({x: x, y: y}, 'spx', R*0.5); later(function(){ xm.forEach(function(n){ n.remove(); }); }, 700);
        try{ if(navigator.vibrate) navigator.vibrate(80); }catch(e2){}
        var now = Date.now(); rapid = rapid.filter(function(t2){ return now - t2 < 2500; }); rapid.push(now);
        if(rapid.length >= 4){ rapid = []; lockTo = now + 2000; m.textContent = '✋ 마구 누르면 2초 쉬어요'; }
      }
    }
    ca.addEventListener('pointerdown', tap); cb.addEventListener('pointerdown', tap);
    el.querySelector('#phint').onclick = function(){
      if(over) return;
      var d = diffs.filter(function(o){ return !o.ok; })[0]; if(!d) return;
      hints++; h.sfx('tap');
      el.querySelectorAll('.sph').forEach(function(n){ n.remove(); });
      // 바로 알려 주지 않고 근처를 크게 보여 줌
      var off = R*0.6, hd = {x: d.x + (Math.random()-0.5)*off, y: d.y + (Math.random()-0.5)*off};
      var hs = both(hd, 'sph', R*2.2); later(function(){ hs.forEach(function(n){ n.remove(); }); }, 4000);
      el.querySelector('#pm').textContent = '💡 노란 동그라미 안을 잘 봐요!';
    };
    every(function(){
      if(over) return;
      left = L.sec - Math.floor((Date.now()-t0)/1000);
      var pt = el.querySelector('#pt'); pt.textContent = '⏱️ '+Math.max(0, left)+'초'; pt.classList.toggle('low', left <= 15);
      if(left<=0) end(false);
    }, 500);
    function end(win){
      over = true;
      el.querySelectorAll('.sph').forEach(function(n){ n.remove(); });
      diffs.forEach(function(d){ if(!d.ok) both(d, 'spm'); });
      var sec = Math.floor((Date.now()-t0)/1000);
      var score = Math.max(0, found*100 + (win ? Math.max(0, L.sec-sec)*3 : 0) - miss*15 - hints*50 + (win && !hints && !miss ? 100 : 0));
      if(win) h.confetti(30);
      el.querySelector('#pm').textContent = win ? (!hints && !miss ? '🌟 실수 없이 다 찾았어요! +100' : '🎉 다 찾았어요!') : '⏰ 초록 동그라미가 못 찾은 곳이에요';
      later(function(){
        stopAll();
        h.done('spot', score, true, (win ? '🏆 '+L.n+'군데 모두 찾았어요! ' : '⏰ 시간이 다 됐어요. '+found+'군데 찾았어요. ')+score+'점');
      }, win ? 2000 : 3500);
    }
  }
}

/* ⑤ 얼굴 두더지 잡기 — 구멍에서 가족 얼굴이 쏙! 빨리 눌러요 */
function mole(el, h){
  var best = h.best('mole');
  el.innerHTML = '<div class="gintro"><div class="gbig">🔨</div><h2>얼굴 두더지 잡기</h2>'+
    '<p>구멍에서 <b>가족 얼굴</b>이 쏙 나오면 빨리 눌러요!<br>⭐ 황금별 +30 · ⏰ 시계 +3초 · 💣 폭탄 −20<br>🔥 8번 연속 잡으면 <b>피버 타임</b> (점수 2배)!</p>'+
    '<div class="lvls"><button class="lvl" data-i="0"><span>🐢</span><b>천천히</b><small>40초</small></button><button class="lvl" data-i="1"><span>🐇</span><b>빠르게</b><small>40초</small></button><button class="lvl" data-i="2"><span>⚡</span><b>번개</b><small>40초</small></button></div>'+
    (best!=null ? '<div class="ghint">내 최고 점수: <b>'+best+'점</b></div>' : '')+'</div>';
  el.querySelectorAll('.lvl').forEach(function(b){ b.onclick = function(){ h.sfx('tap'); play(+b.dataset.i); }; });
  function play(lv){
    var faces = (h.faces||[]).filter(function(f){ return f.src || f.emo; });
    if(!faces.length) faces = [{emo:'🐹'}];
    var speed = [1.0, 0.75, 0.55][lv], score = 0, combo = 0, maxCombo = 0, total = 40, hits = 0, over = true, fever = 0, beatBest = false, t0 = 0, paused = 0;
    el.innerHTML = '<div class="mwrap" id="mw"><div class="gbar"><span>🔨 얼굴 두더지</span><span id="mt">⏱️ 40초</span><span id="ms">0점</span></div><div class="mprog"><i id="mpb" style="width:100%"></i></div>'+
      '<div class="mcombo"><div class="mcb"><i id="mcf"></i></div><b id="mcn"></b></div>'+
      '<div class="mhint" id="mh">준비!</div><div class="mfield"><div class="moles" id="mg"></div><div class="mcount" id="mcd"></div></div></div>';
    var g = el.querySelector('#mg'), wrap = el.querySelector('#mw'), holes = [];
    for(var i=0;i<9;i++){
      var d = document.createElement('div'); d.className = 'hole';
      d.innerHTML = '<span class="hback"></span><button class="mup"></button><span class="dirt"></span>';
      g.appendChild(d); holes.push({el:d, btn:d.querySelector('.mup'), busy:false});
    }
    function msg(t){ el.querySelector('#mh').textContent = t; }
    function setScore(pts, ho){
      score = Math.max(0, score + pts); var sEl = el.querySelector('#ms'); sEl.textContent = score+'점';
      sEl.classList.remove('bump'); void sEl.offsetWidth; sEl.classList.add('bump');
      if(best!=null && !beatBest && score > best){ beatBest = true; msg('🏆 내 최고 기록 돌파!'); h.sfx('fan'); }
      if(ho){ var pop = document.createElement('span'); pop.className = 'mpop '+(pts<0?'neg':pts>=30?'gold':''); pop.textContent = (pts>0?'+':'')+pts; ho.el.appendChild(pop); later(function(){ pop.remove(); }, 800); }
    }
    function comboUi(){
      el.querySelector('#mcf').style.width = (fever ? 100 : Math.min(100, combo/8*100))+'%';
      el.querySelector('#mcn').textContent = fever ? '🔥 피버!' : combo>=2 ? combo+'연속' : '';
    }
    function dust(ho, color){
      for(var k=0;k<7;k++){
        var s = document.createElement('i'); s.className = 'mdust'; var a = Math.random()*Math.PI*2, r = 30+Math.random()*30;
        s.style.background = color; s.style.setProperty('--dx', Math.cos(a)*r+'px'); s.style.setProperty('--dy', (Math.sin(a)*r-20)+'px');
        ho.el.appendChild(s); (function(s){ later(function(){ s.remove(); }, 600); })(s);
      }
      var hm = document.createElement('span'); hm.className = 'mhammer'; hm.textContent = '🔨'; ho.el.appendChild(hm); later(function(){ hm.remove(); }, 350);
    }
    function startFever(){
      fever = Date.now() + 6000; wrap.classList.add('fever'); h.sfx('fan'); h.confetti(12); msg('🔥 피버 타임! 6초 동안 점수 2배');
      later(function(){ if(Date.now()>=fever){ fever = 0; combo = 0; wrap.classList.remove('fever'); comboUi(); if(!over) msg('계속 잡아요!'); } }, 6050);
      comboUi();
    }
    holes.forEach(function(ho){
      ho.btn.addEventListener('pointerdown', function(e){
        e.preventDefault(); if(over || !ho.busy || ho.hit) return;
        ho.hit = true; var k = ho.kind, pts = 0;
        if(k==='bomb'){
          pts = -20; combo = 0; h.sfx('boom'); try{ if(navigator.vibrate) navigator.vibrate(200); }catch(e2){}
          msg('💥 앗, 폭탄! −20'); ho.el.classList.add('boom'); dust(ho, '#555');
          wrap.classList.remove('shake'); void wrap.offsetWidth; wrap.classList.add('shake');
          if(fever){ fever = 0; wrap.classList.remove('fever'); }
        } else if(k==='clock'){
          total += 3; h.sfx('power'); msg('⏰ 시간 +3초!'); ho.el.classList.add('bonk'); dust(ho, '#4dabf7');
          var tp = document.createElement('span'); tp.className = 'mpop gold'; tp.textContent = '+3초'; ho.el.appendChild(tp); later(function(){ tp.remove(); }, 800);
        } else {
          combo++; hits++; maxCombo = Math.max(maxCombo, combo);
          pts = (k==='star' ? 30 : 10) * (fever ? 2 : 1);
          h.sfx(k==='star' ? 'coin' : 'ok'); ho.el.classList.add('bonk'); dust(ho, k==='star' ? '#ffd84d' : '#c8a26a');
          msg(k==='star' ? '⭐ 황금별! +'+pts : fever ? '🔥 2배! +'+pts : combo>=3 ? '👏 '+combo+'연속! +'+pts : '👍 +'+pts);
          if(!fever && combo>=8) startFever();
        }
        if(pts) setScore(pts, ho);
        comboUi();
        later(function(){ down(ho); }, 170);
      });
    });
    function down(ho){ ho.el.classList.remove('up','bonk','boom','gold'); later(function(){ ho.busy = false; ho.hit = false; }, 180); }
    function left(){ return total - (Date.now()-t0)/1000; }
    function popUp(){
      if(over) return;
      var free = holes.filter(function(x){ return !x.busy; }); if(!free.length) return;
      var ho = free[Math.floor(Math.random()*free.length)], r = Math.random(), f = faces[Math.floor(Math.random()*faces.length)];
      ho.kind = r < (fever ? 0.04 : 0.12) ? 'bomb' : r < 0.22 ? 'star' : r < 0.25 ? 'clock' : 'face'; ho.busy = true; ho.hit = false;
      ho.btn.innerHTML = ho.kind==='bomb' ? '<span class="memo">💣</span>' : ho.kind==='star' ? '<span class="memo">⭐</span>' : ho.kind==='clock' ? '<span class="memo">⏰</span>' :
        (f.src ? '<img src="'+f.src+'" alt="" draggable="false">' : '<span class="memo">'+f.emo+'</span>');
      ho.el.classList.toggle('gold', ho.kind==='star');
      ho.el.classList.add('up');
      var stay = (700 + Math.random()*600) * speed * (left()<12 ? 0.8 : 1);
      later(function(){ if(ho.busy && !ho.hit){ if(ho.kind!=='bomb' && ho.kind!=='clock' && !fever){ combo = 0; comboUi(); } down(ho); } }, stay);
    }
    function loop(){
      if(over) return;
      popUp(); if(fever || (left()<25 && Math.random()<0.5)) popUp(); if(left()<10 && Math.random()<0.4) popUp();
      later(loop, (520 + Math.random()*380) * speed * (fever ? 0.7 : 1));
    }
    // 3, 2, 1 출발
    var cd = el.querySelector('#mcd'), n = 3;
    (function count(){
      if(n>0){ cd.textContent = n; cd.classList.remove('go'); void cd.offsetWidth; cd.classList.add('go'); h.sfx('t'+(4-n)); n--; later(count, 700); return; }
      cd.textContent = '시작!'; cd.classList.remove('go'); void cd.offsetWidth; cd.classList.add('go'); h.sfx('t3'); msg('얼굴이 나오면 콕!');
      later(function(){ cd.remove(); }, 600);
      over = false; t0 = Date.now(); loop();
    })();
    var warned = false;
    every(function(){
      if(over || !t0) return;
      var l = left();
      el.querySelector('#mt').textContent = '⏱️ '+Math.max(0, Math.ceil(l))+'초';
      el.querySelector('#mpb').style.width = Math.max(0, Math.min(100, l/40*100))+'%';
      el.querySelector('#mpb').classList.toggle('low', l<10);
      if(l<10 && !warned){ warned = true; msg('⚡ 10초 남았어요! 더 빨라져요'); }
      if(l<=0){
        over = true; wrap.classList.remove('fever'); h.confetti(20);
        later(function(){ stopAll(); h.done('mole', score, true, '🔨 '+hits+'번 잡고 최고 '+maxCombo+'연속! '+score+'점'); }, 700);
      }
    }, 200);
  }
}

/* ⑥ 점프 달리기 — 내 얼굴이 달려요! 눌러서 뛰고, 동전을 모아요 */
function runner(el, h){
  var best = h.best('run');
  el.innerHTML = '<div class="gintro"><div class="gbig">🏃</div><h2>점프 달리기</h2>'+
    '<p><b>내 얼굴</b>이 달려요! 화면을 누르면 점프,<br>공중에서 한 번 더 누르면 <b>2단 점프</b>!<br>상자·바위·벌을 피하고 💰 동전을 모아요</p>'+
    '<div class="ritems"><span>🧲<small>동전 끌어오기</small></span><span>🛡️<small>한 번 지켜 줘요</small></span><span>✖️2<small>점수 2배</small></span></div>'+
    '<p class="rsmall">달릴수록 낮 → 노을 → 밤으로 바뀌어요 🌅🌙</p>'+
    '<button class="big" id="rgo">▶ 달리기 시작</button>'+
    (best!=null ? '<div class="ghint">내 최고 점수: <b>'+best+'점</b></div>' : '')+'</div>';
  el.querySelector('#rgo').onclick = function(){ h.sfx('tap'); play(); };
  function play(){
    var W = 640, H = 360, GY = 290, dpr = Math.min(2, window.devicePixelRatio||1);
    el.innerHTML = '<div class="gbar"><span>🏃 점프 달리기</span><span id="rd">0m</span><span id="rs">💰 0</span></div>'+
      '<canvas id="rc" class="runcv" width="'+(W*dpr)+'" height="'+(H*dpr)+'"></canvas><div class="qmsg" id="rm">화면을 눌러서 점프!</div>';
    var cv = el.querySelector('#rc'), x = cv.getContext('2d'); x.scale(dpr, dpr);
    var meF = (h.faces||[]).filter(function(f){ return f.me; })[0] || (h.faces||[])[0] || {emo:'😀'};
    var img = null; if(meF.src){ img = new Image(); img.src = meF.src; }
    var R = 26, FL = GY + R;                       // 얼굴 반지름, 땅 높이
    var p = {x:120, y:GY, vy:0, jumps:0, land:0}, obs = [], coins = [], items = [], parts = [], texts = [], skyStars = [];
    var spd = 5.4, dist = 0, got = 0, bonus = 0, tok = {}, last = performance.now(), spawn = 80, cSpawn = 60, iSpawn = 500, dead = false, t = 0, shake = 0;
    var shield = false, magnet = 0, dbl = 0, started = false, count = 3.2, beat = false;
    for(var i=0;i<60;i++) skyStars.push({x:Math.random()*W, y:Math.random()*GY*0.7, r:Math.random()*1.4+0.4, tw:Math.random()*6});
    runTok = tok;
    function jump(e){
      if(e) e.preventDefault(); if(dead || !started) return;
      if(p.jumps<2){ p.vy = p.jumps ? -11 : -13.2; p.jumps++; h.sfx('jump'); puff(p.x, p.y+R, 6, '#e8d9b5'); }
    }
    cv.addEventListener('pointerdown', jump);
    var keyH = function(e){ if(e.code==='Space' || e.key===' ' || e.key==='ArrowUp'){ jump(e); } };
    document.addEventListener('keydown', keyH);
    function puff(px, py, n, c, sp){ for(var k=0;k<n;k++) parts.push({x:px, y:py, vx:(Math.random()-0.5)*(sp||3) - (sp?0:1.5), vy:-Math.random()*(sp||2.5), l:22+Math.random()*10, c:c, r:3+Math.random()*3}); }
    function float(txt, px, py, c){ texts.push({t:txt, x:px, y:py, l:45, c:c||'#fff'}); }
    function emoji(ch, cx, cy, size){ x.font = size+'px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(ch, cx, cy); }
    function lerp(a, b, k){ return a + (b-a)*k; }
    function mix(c1, c2, k){ return 'rgb('+[0,1,2].map(function(j){ return Math.round(lerp(c1[j], c2[j], k)); }).join(',')+')'; }
    function rr(px, py, w, hh, r){ x.beginPath(); x.moveTo(px+r, py); x.arcTo(px+w, py, px+w, py+hh, r); x.arcTo(px+w, py+hh, px, py+hh, r); x.arcTo(px, py+hh, px, py, r); x.arcTo(px, py, px+w, py, r); x.closePath(); }
    // 낮 → 노을 → 밤 (250m마다)
    var SKY = [ [[120,196,255],[214,240,255]], [[255,140,90],[255,214,150]], [[24,32,74],[70,62,120]] ];
    var HILL = [ [[150,205,140],[110,180,110]], [[190,140,120],[150,110,100]], [[40,60,90],[30,45,70]] ];
    function phase(){ var v = (dist/250) % 3, a = Math.floor(v), f = v - a; var k = f<0.75 ? 0 : (f-0.75)/0.25; return {a:a, b:(a+1)%3, k:k}; }
    function hillLayer(off, base, amp, freq, col){
      x.fillStyle = col; x.beginPath(); x.moveTo(0, H);
      for(var hx = 0; hx <= W; hx += 16){ var wx = hx + off; x.lineTo(hx, base - (Math.sin(wx*freq)*0.6 + Math.sin(wx*freq*2.3+1.7)*0.4) * amp); }
      x.lineTo(W, H); x.closePath(); x.fill();
    }
    function tree(tx, ty, s, night){
      x.fillStyle = night ? '#3b2f2a' : '#8a5a34'; x.fillRect(tx-3*s, ty-18*s, 6*s, 18*s);
      x.fillStyle = night ? '#22412f' : '#3f9b52'; x.beginPath(); x.arc(tx, ty-26*s, 15*s, 0, 7); x.arc(tx-9*s, ty-18*s, 11*s, 0, 7); x.arc(tx+9*s, ty-18*s, 11*s, 0, 7); x.fill();
    }
    function crate(cx, w){
      var top = FL - w; x.fillStyle = '#c98b4a'; rr(cx - w/2, top, w, w, 4); x.fill();
      x.strokeStyle = '#8a5a2b'; x.lineWidth = 3; x.stroke();
      x.beginPath(); x.moveTo(cx - w/2 + 5, top + 5); x.lineTo(cx + w/2 - 5, top + w - 5); x.moveTo(cx + w/2 - 5, top + 5); x.lineTo(cx - w/2 + 5, top + w - 5); x.stroke();
      x.fillStyle = 'rgba(255,255,255,.25)'; x.fillRect(cx - w/2 + 3, top + 3, w - 6, 4);
    }
    function rock(cx, w){
      x.fillStyle = '#8d8f99'; x.beginPath(); x.moveTo(cx - w/2, FL); x.lineTo(cx - w/2 + 4, FL - w*0.55); x.lineTo(cx - 4, FL - w); x.lineTo(cx + w/2 - 3, FL - w*0.7); x.lineTo(cx + w/2, FL); x.closePath(); x.fill();
      x.fillStyle = '#b4b6c0'; x.beginPath(); x.moveTo(cx - w/2 + 6, FL - w*0.55); x.lineTo(cx - 4, FL - w + 4); x.lineTo(cx + 2, FL - w*0.6); x.closePath(); x.fill();
    }
    function bee(bx, by){
      var flap = Math.sin(t*1.5)*6;
      x.fillStyle = 'rgba(220,240,255,.85)'; x.beginPath(); x.ellipse(bx-4, by-12-flap*0.3, 9, 6+flap*0.4, -0.4, 0, 7); x.ellipse(bx+6, by-12-flap*0.3, 9, 6+flap*0.4, 0.4, 0, 7); x.fill();
      x.fillStyle = '#ffcf33'; x.beginPath(); x.ellipse(bx, by, 18, 13, 0, 0, 7); x.fill();
      x.fillStyle = '#2b2b2b'; x.fillRect(bx-6, by-12, 5, 24); x.fillRect(bx+4, by-12, 5, 24);
      x.beginPath(); x.moveTo(bx+17, by); x.lineTo(bx+25, by+3); x.lineTo(bx+17, by+5); x.fill();
      x.fillStyle = '#fff'; x.beginPath(); x.arc(bx-11, by-3, 4, 0, 7); x.fill(); x.fillStyle = '#000'; x.beginPath(); x.arc(bx-12, by-3, 2, 0, 7); x.fill();
    }
    function coin(cx, cy){
      var sx = Math.abs(Math.cos((t + cx)/9));
      x.fillStyle = '#e8a817'; x.beginPath(); x.ellipse(cx, cy, 11*sx + 1.5, 11, 0, 0, 7); x.fill();
      x.fillStyle = '#ffd84d'; x.beginPath(); x.ellipse(cx, cy, 8*sx + 1, 8, 0, 0, 7); x.fill();
      if(sx>0.5){ x.fillStyle = '#fff6c2'; x.fillRect(cx - 2*sx, cy - 5, 2*sx, 6); }
    }
    function spawnObs(){
      var r = Math.random();
      if(dist>50 && r<0.28) obs.push({k:'bee', x:W+40, y:GY - 30 - Math.random()*70, w:40, h:26, base:0});
      else {
        var w = 34 + Math.random()*12, two = dist>150 && Math.random()<0.25;
        obs.push({k:Math.random()<0.5?'crate':'rock', x:W+40, w:w, h:w, two:two});
      }
      spawn = (60 + Math.random()*60) * (5.4/spd) + 16;
    }
    function spawnCoins(){
      var kind = Math.random(), n = 5, baseY = GY - 10;
      for(var k=0;k<n;k++){
        var cy = kind<0.45 ? baseY - Math.sin(k/(n-1)*Math.PI)*90 : kind<0.8 ? baseY - 60 : baseY;
        coins.push({x:W + 30 + k*34, y:cy});
      }
      cSpawn = 110 + Math.random()*90;
    }
    function spawnItem(){
      var ks = ['mag','shield','dbl']; var k = ks[Math.floor(Math.random()*3)];
      items.push({k:k, x:W+30, y:GY - 70 - Math.random()*60});
      iSpawn = 600 + Math.random()*400;
    }
    function hitTest(o){
      var x0, x1, top, bot;
      if(o.k==='bee'){ x0 = o.x - 17; x1 = o.x + 20; top = o.y - 12; bot = o.y + 12; }
      else { x0 = o.x - o.w/2 + 3; x1 = o.x + o.w/2 - 3 + (o.two ? o.w : 0); top = FL - o.h + 4; bot = FL; }
      var cx = Math.max(x0, Math.min(p.x, x1)), cy = Math.max(top, Math.min(p.y, bot)), dx = p.x-cx, dy = p.y-cy;
      return dx*dx + dy*dy < (R-4)*(R-4);
    }
    function frame(now){
      if(runTok!==tok){ document.removeEventListener('keydown', keyH); return; }
      var dt = Math.min(2, (now-last)/16.67); last = now; t += dt;
      if(!started){
        var prev = Math.ceil(count); count -= dt/60;
        if(Math.ceil(count)!==prev && count>0) h.sfx('t'+(4-Math.ceil(count)));
        if(count<=0){ started = true; h.sfx('t3'); }
      }
      if(started && !dead){
        spd += 0.0022*dt; dist += spd*dt/10;
        p.vy += 0.6*dt; p.y += p.vy*dt;
        if(p.y >= GY){ if(p.jumps){ p.land = 8; puff(p.x, FL, 5, '#e8d9b5'); } p.y = GY; p.vy = 0; p.jumps = 0; }
        if(p.land>0) p.land -= dt;
        if(magnet>0) magnet -= dt; if(dbl>0) dbl -= dt;
        spawn -= dt; if(spawn<=0) spawnObs();
        cSpawn -= dt; if(cSpawn<=0) spawnCoins();
        iSpawn -= dt; if(iSpawn<=0 && dist>40) spawnItem();
        obs.forEach(function(o){ o.x -= spd*dt*(o.k==='bee'?1.15:1); if(o.k==='bee') o.y += Math.sin(t/7 + o.x/50)*0.9; });
        coins.forEach(function(c){
          c.x -= spd*dt;
          if(magnet>0){ var dx = p.x - c.x, dy = p.y - c.y, d = Math.sqrt(dx*dx+dy*dy); if(d<200){ c.x += dx/d*9*dt; c.y += dy/d*9*dt; } }
        });
        items.forEach(function(it){ it.x -= spd*dt; });
        obs = obs.filter(function(o){ return o.x > -90; });
        coins = coins.filter(function(c){
          var dx = p.x-c.x, dy = p.y-c.y;
          if(dx*dx+dy*dy < 36*36){ got++; var v = dbl>0 ? 20 : 10; bonus += v; h.sfx('coin'); float('+'+v, c.x, c.y-10, '#ffe066'); puff(c.x, c.y, 6, '#ffd84d', 4); el.querySelector('#rs').textContent = '💰 '+got; return false; }
          return c.x > -20;
        });
        items = items.filter(function(it){
          var dx = p.x-it.x, dy = p.y-it.y;
          if(dx*dx+dy*dy < 44*44){
            h.sfx('power'); puff(it.x, it.y, 12, '#9be7ff', 5);
            if(it.k==='mag'){ magnet = 480; float('🧲 동전 끌어오기!', p.x+60, p.y-50); }
            if(it.k==='shield'){ shield = true; float('🛡️ 보호막!', p.x+60, p.y-50); }
            if(it.k==='dbl'){ dbl = 480; float('✖️2 점수 2배!', p.x+60, p.y-50); }
            return false;
          }
          return it.x > -30;
        });
        for(var oi=0; oi<obs.length; oi++){
          var o = obs[oi];
          if(!o.gone && hitTest(o)){
            if(shield){ shield = false; o.gone = true; shake = 8; h.sfx('boom'); puff(o.x, FL - 20, 14, '#c98b4a', 6); float('🛡️ 휴, 막았다!', p.x+60, p.y-50); }
            else { die(); break; }
          }
        }
        obs = obs.filter(function(o){ return !o.gone; });
        var sc = Math.floor(dist) + bonus;
        el.querySelector('#rd').textContent = Math.floor(dist)+'m';
        if(best!=null && !beat && sc > best && best>0){ beat = true; el.querySelector('#rm').textContent = '🏆 내 최고 기록 돌파!'; h.sfx('fan'); float('🏆 신기록!', W/2, 80, '#ffe066'); }
        var m100 = Math.floor(dist/100);
        if(m100>0 && !frame['m'+m100]){ frame['m'+m100] = 1; if(!beat || m100>1) el.querySelector('#rm').textContent = '🎉 '+m100*100+'m 돌파! 더 빨라져요'; h.sfx('fan'); }
        if(t % 4 < dt && p.y>=GY) parts.push({x:p.x-14, y:FL-2, vx:-1.5-Math.random(), vy:-Math.random()*0.8, l:16, c:'rgba(232,217,181,.9)', r:3});
      }
      draw();
      requestAnimationFrame(frame);
    }
    function draw(){
      var ph = phase(), night = ph.a===2 ? 1 - ph.k : ph.b===2 ? ph.k : 0;
      x.save();
      if(shake>0){ x.translate((Math.random()-0.5)*shake, (Math.random()-0.5)*shake); shake *= 0.85; if(shake<0.4) shake = 0; }
      // 하늘
      var sky = x.createLinearGradient(0, 0, 0, FL);
      sky.addColorStop(0, mix(SKY[ph.a][0], SKY[ph.b][0], ph.k)); sky.addColorStop(1, mix(SKY[ph.a][1], SKY[ph.b][1], ph.k));
      x.fillStyle = sky; x.fillRect(-10, -10, W+20, H+20);
      if(night>0){ skyStars.forEach(function(s){ x.globalAlpha = night * (0.5 + Math.sin(t/10 + s.tw)*0.5); x.fillStyle = '#fff'; x.beginPath(); x.arc(s.x, s.y, s.r, 0, 7); x.fill(); }); x.globalAlpha = 1; }
      // 해·달
      var sunY = 70 + night*10;
      if(night<1){ x.globalAlpha = 1 - night; var sg = x.createRadialGradient(520, sunY, 5, 520, sunY, 60); sg.addColorStop(0, ph.a===1||ph.b===1 ? 'rgba(255,200,120,1)' : 'rgba(255,240,150,1)'); sg.addColorStop(0.45, 'rgba(255,220,120,.6)'); sg.addColorStop(1, 'rgba(255,220,120,0)'); x.fillStyle = sg; x.beginPath(); x.arc(520, sunY, 60, 0, 7); x.fill(); x.globalAlpha = 1; }
      if(night>0){ x.globalAlpha = night; x.fillStyle = '#fdf6d8'; x.beginPath(); x.arc(520, 70, 22, 0, 7); x.fill(); x.fillStyle = mix(SKY[2][0], SKY[2][0], 0); x.beginPath(); x.arc(530, 64, 20, 0, 7); x.fill(); x.globalAlpha = 1; }
      // 구름
      x.fillStyle = night>0.5 ? 'rgba(200,210,255,.25)' : 'rgba(255,255,255,.85)';
      for(var ci=0; ci<4; ci++){ var cx0 = ((ci*190 - dist*1.2) % (W+200) + W+200) % (W+200) - 100, cy0 = 40 + (ci%2)*45; x.beginPath(); x.arc(cx0, cy0, 18, 0, 7); x.arc(cx0+20, cy0-8, 22, 0, 7); x.arc(cx0+44, cy0, 17, 0, 7); x.fill(); }
      // 산 (멀리) · 언덕 (가까이) · 나무
      hillLayer(dist*2, GY - 40, 40, 0.008, mix(HILL[ph.a][1].map(function(v){ return v*0.8+40; }), HILL[ph.b][1].map(function(v){ return v*0.8+40; }), ph.k));
      hillLayer(dist*5, GY + 5, 26, 0.013, mix(HILL[ph.a][0], HILL[ph.b][0], ph.k));
      var toff = (dist*8) % 160;
      for(var tx = -toff; tx < W + 40; tx += 160){ tree(tx + 60, FL - 4, 0.9, night>0.5); }
      // 땅
      var gr = x.createLinearGradient(0, FL, 0, H); gr.addColorStop(0, night>0.5 ? '#3c6b3a' : '#7bc96f'); gr.addColorStop(0.18, night>0.5 ? '#2f5530' : '#5aa64f'); gr.addColorStop(0.2, night>0.5 ? '#5a4632' : '#c9a36b'); gr.addColorStop(1, night>0.5 ? '#3e3024' : '#a5784a');
      x.fillStyle = gr; x.fillRect(-10, FL, W+20, H-FL+10);
      x.fillStyle = 'rgba(0,0,0,.12)'; var goff = (dist*10) % 48;
      for(var gx = -goff; gx < W; gx += 48){ x.fillRect(gx, FL + 18, 22, 4); x.fillRect(gx + 24, FL + 34, 16, 4); }
      // 속도선
      if(spd>8 && started && !dead){ x.strokeStyle = 'rgba(255,255,255,.35)'; x.lineWidth = 2; for(var li=0; li<5; li++){ var ly = 40 + ((li*67 + t*3) % (GY-40)); var lx = W - ((t*25 + li*130) % (W+100)); x.beginPath(); x.moveTo(lx, ly); x.lineTo(lx+50, ly); x.stroke(); } }
      // 동전·아이템·장애물
      coins.forEach(function(c){ coin(c.x, c.y); });
      items.forEach(function(it){
        var by = it.y + Math.sin(t/8 + it.x/40)*5;
        x.fillStyle = 'rgba(155,231,255,.35)'; x.beginPath(); x.arc(it.x, by, 22, 0, 7); x.fill();
        x.strokeStyle = 'rgba(255,255,255,.9)'; x.lineWidth = 2; x.stroke();
        emoji(it.k==='mag' ? '🧲' : it.k==='shield' ? '🛡️' : '✨', it.x, by+1, 24);
        if(it.k==='dbl'){ x.fillStyle = '#e03131'; x.font = 'bold 13px sans-serif'; x.fillText('×2', it.x+14, by+14); }
      });
      obs.forEach(function(o){
        if(o.k==='bee') bee(o.x, o.y);
        else { (o.k==='crate' ? crate : rock)(o.x, o.w); if(o.two) (o.k==='crate' ? crate : rock)(o.x + o.w, o.w); }
        if(o.k!=='bee'){ x.fillStyle = 'rgba(0,0,0,.15)'; x.beginPath(); x.ellipse(o.x + (o.two?o.w/2:0), FL+2, o.w*(o.two?1:0.6), 4, 0, 0, 7); x.fill(); }
      });
      // 먼지·반짝이
      parts.forEach(function(q){ q.x += q.vx; q.y += q.vy; q.vy += 0.08; q.l -= 1; x.globalAlpha = Math.max(0, q.l/28); x.fillStyle = q.c || '#c8a26a'; x.beginPath(); x.arc(q.x, q.y, q.r||3, 0, 7); x.fill(); });
      x.globalAlpha = 1; parts = parts.filter(function(q){ return q.l>0; });
      // 그림자
      var air = Math.max(0, GY - p.y); x.fillStyle = 'rgba(0,0,0,'+(0.22 - Math.min(0.15, air/600))+')'; x.beginPath(); x.ellipse(p.x, FL+2, R*(1 - Math.min(0.5, air/300)), 5, 0, 0, 7); x.fill();
      // 다리 (뛰는 모양)
      if(!dead){
        var run = p.y>=GY ? Math.sin(t/2.5) : 0.6;
        x.strokeStyle = '#3b3b58'; x.lineWidth = 6; x.lineCap = 'round';
        x.beginPath(); x.moveTo(p.x-6, p.y+R-6); x.lineTo(p.x-6 + run*10, p.y+R+10); x.moveTo(p.x+6, p.y+R-6); x.lineTo(p.x+6 - run*10, p.y+R+10); x.stroke();
        x.fillStyle = '#ff6b6b'; x.beginPath(); x.ellipse(p.x-6 + run*10 + 3, p.y+R+11, 6, 4, 0, 0, 7); x.ellipse(p.x+6 - run*10 + 3, p.y+R+11, 6, 4, 0, 0, 7); x.fill();
      }
      // 얼굴 (뛸 때 늘어나고 내릴 때 납작)
      var sy = p.y<GY ? 1 + Math.min(0.12, Math.abs(p.vy)*0.012) : p.land>0 ? 0.85 : 1 + Math.sin(t/2.5)*0.03;
      x.save(); x.translate(p.x, p.y + (p.land>0 ? 4 : 0)); x.rotate(dead ? 0.6 : p.y<GY ? Math.max(-0.35, Math.min(0.35, p.vy*0.025)) : 0); x.scale(1/sy, sy);
      if(magnet>0){ x.strokeStyle = 'rgba(255,80,120,'+(0.4+Math.sin(t/4)*0.2)+')'; x.lineWidth = 3; x.beginPath(); x.arc(0, 0, R+10+Math.sin(t/4)*3, 0, 7); x.stroke(); }
      if(dbl>0){ x.shadowColor = '#ffd84d'; x.shadowBlur = 18; }
      x.beginPath(); x.arc(0, 0, R, 0, 7); x.fillStyle = '#fff'; x.fill(); x.shadowBlur = 0; x.lineWidth = 4; x.strokeStyle = dead ? '#e03131' : '#ff9a2e'; x.stroke();
      x.save(); x.beginPath(); x.arc(0, 0, R-3, 0, 7); x.clip();
      if(img && img.complete && img.naturalWidth) x.drawImage(img, -R, -R, R*2, R*2); else emoji(meF.emo||'😀', 0, 2, 36);
      x.restore();
      if(shield){ x.fillStyle = 'rgba(120,200,255,.18)'; x.strokeStyle = 'rgba(120,200,255,.9)'; x.lineWidth = 3; x.beginPath(); x.arc(0, 0, R+8, 0, 7); x.fill(); x.stroke(); }
      x.restore();
      // 떠오르는 글자
      texts.forEach(function(tt){ tt.y -= 0.8; tt.l -= 1; x.globalAlpha = Math.min(1, tt.l/20); x.font = 'bold 20px sans-serif'; x.textAlign = 'center'; x.lineWidth = 4; x.strokeStyle = 'rgba(0,0,0,.45)'; x.strokeText(tt.t, tt.x, tt.y); x.fillStyle = tt.c; x.fillText(tt.t, tt.x, tt.y); });
      x.globalAlpha = 1; texts = texts.filter(function(tt){ return tt.l>0; });
      // 위쪽 상태 (아이템 남은 시간)
      var hud = []; if(magnet>0) hud.push(['🧲', magnet/480]); if(dbl>0) hud.push(['✖️2', dbl/480]); if(shield) hud.push(['🛡️', 1]);
      hud.forEach(function(hh, i){ var hx = 16 + i*74; x.fillStyle = 'rgba(0,0,0,.35)'; rr(hx, 12, 66, 26, 13); x.fill(); x.fillStyle = '#ffd84d'; rr(hx+30, 21, 30*hh[1], 8, 4); x.fill(); emoji(hh[0], hx+16, 26, 16); });
      x.font = 'bold 18px sans-serif'; x.textAlign = 'right'; x.fillStyle = '#fff'; x.strokeStyle = 'rgba(0,0,0,.4)'; x.lineWidth = 4;
      var scTxt = (Math.floor(dist) + bonus)+'점'; x.strokeText(scTxt, W-16, 28); x.fillText(scTxt, W-16, 28);
      // 3·2·1
      if(!started){ x.fillStyle = 'rgba(0,0,0,.25)'; x.fillRect(0, 0, W, H); var c = Math.ceil(count), k = count - Math.floor(count); x.font = 'bold '+Math.round(60 + k*50)+'px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#fff'; x.lineWidth = 6; x.strokeStyle = 'rgba(0,0,0,.4)'; var ct = c>3 ? '준비' : c>0 ? String(c) : '출발!'; x.strokeText(ct, W/2, H/2 - 10); x.fillText(ct, W/2, H/2 - 10); }
      if(dead){ x.fillStyle = 'rgba(0,0,0,.4)'; x.fillRect(-10, -10, W+20, H+20); x.fillStyle = '#fff'; x.font = 'bold 42px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('쿵! 💫', W/2, H/2 - 20); x.font = '22px sans-serif'; x.fillText(Math.floor(dist)+'m · 💰 '+got+'개 · '+(Math.floor(dist)+bonus)+'점', W/2, H/2 + 24); }
      x.restore();
    }
    function die(){
      if(dead) return; dead = true; shake = 14; h.sfx('boom'); try{ if(navigator.vibrate) navigator.vibrate([150,60,150]); }catch(e){}
      puff(p.x, p.y, 16, '#ffd84d', 6);
      var score = Math.floor(dist) + bonus;
      el.querySelector('#rm').textContent = '💫 '+Math.floor(dist)+'m · 💰 '+got+'개';
      later(function(){ stopAll(); document.removeEventListener('keydown', keyH); h.done('run', score, true, '🏃 '+Math.floor(dist)+'m 달리고 💰 '+got+'개! '+score+'점'); }, 1600);
    }
    requestAnimationFrame(frame);
  }
}

window.Games = {
  list: [
    {k:'run',    ic:'🏃', nm:'점프 달리기',           how:'낮·노을·밤 · 동전·자석·보호막 아이템', unit:'점', high:true},
    {k:'mole',   ic:'🔨', nm:'얼굴 두더지 잡기',      how:'연속으로 잡으면 피버 타임 · 폭탄 조심!',   unit:'점', high:true},
    {k:'pmatch', ic:'🧠', nm:'가족 사진 짝 맞추기', how:'쉬움·보통·어려움 · 처음에 잠깐 보여 줘요', unit:'점', high:true},
    {k:'spot',   ic:'🔎', nm:'가족 사진 틀린 그림 찾기', how:'두 사진에서 다른 곳 찾기 · 4단계', unit:'점', high:true},
    {k:'song',   ic:'🎤', nm:'노래 번역 퀴즈', how:'인기 팝송 · 귀멸의 칼날 일본어 · 전체 듣기',       unit:'점', high:true},
    {k:'eng',    ic:'🔤', nm:'그림 보고 영어 단어', how:'60초 동안 영어 단어 맞히기 · 소리도 나와요', unit:'개', high:true},
    {k:'eng2',   ic:'🎓', nm:'어려운 영어 단어', how:'동물·과일·직업·자연 66개 · 한글 힌트 없이 도전!', unit:'개', high:true},
    {k:'gugu',   ic:'✖️', nm:'구구단 퀴즈',         how:'60초 동안 몇 개 맞힐까?',               unit:'개', high:true}
  ],
  start: function(name, el, h){ stopAll(); if(!h.sfx) h.sfx = function(){};
    ({run:runner, mole:mole, pmatch:memory, spot:spot, song:song, gugu:gugu, eng:eng, eng2:eng2})[name](el, h); },
  stop: stopAll
};
})();
