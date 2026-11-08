/* 가족 서버(Supabase) 연결 — 설정이 비어 있으면 아무것도 하지 않음 */
(function(){
'use strict';
var C = window.FAMILY_CONFIG || {}, sb = null, BUCKET = 'photos';
function loadScript(src){
  return new Promise(function(ok){ var t = document.createElement('script'); t.src = src; t.onload = ok; t.onerror = ok; document.head.appendChild(t); });
}
var Cloud = {
  on: false, user: null,
  init: async function(){
    if(!C.url || !C.anonKey) return false;
    if(!window.supabase) await loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js');
    if(!window.supabase) return false;
    sb = window.supabase.createClient(C.url, C.anonKey);
    Cloud.on = true;
    var s = (await sb.auth.getSession()).data.session;
    Cloud.user = s ? s.user : null;
    return true;
  },
  login: async function(email, pw){
    var r = await sb.auth.signInWithPassword({email: email, password: pw});
    if(r.error) throw r.error;
    Cloud.user = r.data.user;
  },
  logout: async function(){ await sb.auth.signOut(); Cloud.user = null; },
  fetchAll: async function(){
    var all = [], from = 0;
    for(;;){
      var r = await sb.from('family_kv').select('k,v').range(from, from+999);
      if(r.error) throw r.error;
      all = all.concat(r.data);
      if(r.data.length < 1000) return all;
      from += 1000;
    }
  },
  upsert: async function(rows){
    if(!rows.length) return;
    var now = new Date().toISOString();
    var r = await sb.from('family_kv').upsert(rows.map(function(x){ return {k:x.k, v:x.v, updated_at:now}; }));
    if(r.error) throw r.error;
  },
  remove: async function(keys){
    if(!keys.length) return;
    var r = await sb.from('family_kv').delete().in('k', keys);
    if(r.error) throw r.error;
  },
  listen: function(cb){
    sb.channel('family_kv').on('postgres_changes', {event:'*', schema:'public', table:'family_kv'}, cb).subscribe();
  },
  photos: async function(){
    var r = await sb.storage.from(BUCKET).list('', {limit:500, sortBy:{column:'name', order:'asc'}});
    if(r.error) throw r.error;
    var names = r.data.map(function(x){ return x.name; }).filter(function(n){ return /\.jpe?g$/i.test(n); });
    if(!names.length) return [];
    var s = await sb.storage.from(BUCKET).createSignedUrls(names, 60*60*24);
    if(s.error) throw s.error;
    return s.data.map(function(x, i){ return {name:names[i], url:x.signedUrl}; });
  },
  upload: async function(name, blob){
    var r = await sb.storage.from(BUCKET).upload(name, blob, {contentType:'image/jpeg', upsert:true});
    if(r.error) throw r.error;
  },
  signed: async function(name){
    var r = await sb.storage.from(BUCKET).createSignedUrl(name, 60*60*24);
    if(r.error) throw r.error;
    return r.data.signedUrl;
  },
  removePhoto: async function(name){
    var r = await sb.storage.from(BUCKET).remove([name]);
    if(r.error) throw r.error;
  }
};
window.Cloud = Cloud;
})();
