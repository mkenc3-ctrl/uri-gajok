/* 가족 서버 연결 설정
   비어 있으면 이 기기에만 저장(지금처럼).
   Supabase 가족 전용 프로젝트를 만든 뒤 「설정 → API」의 주소와 공개 키(anon)를 넣으면
   가족 휴대폰끼리 보고·수락이 실시간으로 오갑니다. (공개 키는 원래 공개용이라 넣어도 괜찮아요.
   service_role 키는 절대 넣지 마세요.) */
window.FAMILY_CONFIG = {
  pushKey: '',   // 휴대폰 알림 공개 키 (db/알림-설정안내.md 순서대로 만든 뒤 넣음. 비밀 키는 절대 넣지 않음)
  url: 'https://wfnfjpqqtyfalxybydbb.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndmbmZqcHFxdHlmYWx4eWJ5ZGJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQwNzA1MzgsImV4cCI6MjEwOTY0NjUzOH0.mcoj2QjLvPQek1JbkI0657mz2JcwCmWBGgb_GgQk7uY'
};
