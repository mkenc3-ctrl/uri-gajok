/* 우리 가족 하루 — 휴대폰 알림을 누르면 앱으로 돌아가기 (저장·캐시는 하지 않음) */
self.addEventListener('install', function(){ self.skipWaiting(); });
self.addEventListener('activate', function(e){ e.waitUntil(self.clients.claim()); });
self.addEventListener('notificationclick', function(e){
  e.notification.close();
  e.waitUntil(self.clients.matchAll({type:'window', includeUncontrolled:true}).then(function(list){
    for(var i=0;i<list.length;i++){ if('focus' in list[i]) return list[i].focus(); }
    if(self.clients.openWindow) return self.clients.openWindow('./');
  }));
});
/* 앱이 꺼져 있어도 오는 알림(웹 푸시) */
self.addEventListener('push', function(e){
  var d = {}; try{ d = e.data ? e.data.json() : {}; }catch(x){ d = {title:'우리 가족 하루', body: e.data ? e.data.text() : ''}; }
  e.waitUntil(self.registration.showNotification(d.title || '우리 가족 하루', {body:d.body || '', icon:'icon-192.png', badge:'icon-192.png', tag:d.tag || 'fam', renotify:true, requireInteraction:true, vibrate:[300,100,300,100,300]}));
});
