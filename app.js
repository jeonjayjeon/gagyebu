'use strict';
/* ───────────────────────── 저장소 ───────────────────────── */
const LS = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  del(k) { try { localStorage.removeItem(k); } catch (e) {} }
};
const K = { cfg: 'gb.cfg', cache: 'gb.cache', queue: 'gb.queue', ui: 'gb.ui' };

/* ───────────────────────── 기본 데이터 ───────────────────────── */
const DEFAULT_CATS = [
  ['개인','지출','식비','🍚','#FF8A3D',500000],['개인','지출','카페·간식','☕','#A0704A',100000],['개인','지출','교통','🚇','#3182F6',100000],
  ['개인','지출','생활·마트','🧺','#22B07D',200000],['개인','지출','쇼핑','🛍️','#F04452',200000],['개인','지출','주거·통신','🏠','#6B7684',0],
  ['개인','지출','구독','📺','#8B5CF6',50000],['개인','지출','의료·건강','💊','#00B8D9',0],['개인','지출','문화·여가','🎬','#FFB800',100000],
  ['개인','지출','여행','✈️','#1FB6FF',0],['개인','지출','경조사·선물','🎁','#FF6B9A',0],['개인','지출','반려묘','🐈','#C08B5C',100000],
  ['개인','지출','교육','📚','#4E5968',0],['개인','지출','보험·금융','🛡️','#5B6B8C',0],['개인','지출','뷰티·미용','💇','#E86AA6',0],['개인','지출','기타','📦','#B0B8C1',0],
  ['개인','수입','급여·강의료','💼','#3182F6',0],['개인','수입','이자·환급','🏦','#22B07D',0],['개인','수입','기타수입','💰','#FFB800',0],
  ['사업','수입','디자인 매출','🎨','#3182F6',0],['사업','수입','강연·자문','🎤','#8B5CF6',0],['사업','수입','지원금','🏛️','#22B07D',0],['사업','수입','기타 매출','💰','#FFB800',0],
  ['사업','지출','외주비','🤝','#F04452',0],['사업','지출','장비·소모품','💻','#4E5968',0],['사업','지출','소프트웨어·구독','🧩','#8B5CF6',150000],
  ['사업','지출','교통·출장','🚄','#3182F6',0],['사업','지출','접대·회의','🍽️','#FF8A3D',0],['사업','지출','광고·홍보','📣','#FF6B9A',0],
  ['사업','지출','세금·공과금','🧾','#6B7684',0],['사업','지출','통신·사무','📠','#00B8D9',0],['사업','지출','기타 경비','📦','#B0B8C1',0],
  ['공통','이체','이체','🔁','#8B95A1',0],['공통','이체','카드대금','💳','#8B95A1',0],['공통','이체','저축·투자','🐷','#22B07D',0]
].map(r => ({ book: r[0], type: r[1], name: r[2], icon: r[3], color: r[4], budget: r[5] }));
const DEFAULT_METHODS = [
  { name: '삼성카드', kind: '카드', book: '개인' }, { name: '토스뱅크', kind: '계좌', book: '개인' },
  { name: '사업자 계좌', kind: '계좌', book: '사업' }, { name: '현금', kind: '현금', book: '개인' }, { name: '기타', kind: '기타', book: '개인' }
];

/* 가맹점 → 카테고리 추정 규칙 (기록이 쌓이면 실제 사용 이력이 우선) */
const RULES = [
  [/메리츠|화재|생명|보험/, '보험·금융'],
  [/헤어|미용|네일|올리브영|에이피알/, '뷰티·미용'],
  [/배민클럽|와우\s?멤버십|구글페이먼트|바로알림/, '구독'],
  [/구글클라우드|한글과컴퓨터|유피소프트/, '소프트웨어·구독'],
  [/우아한형제들|쿠팡이츠|KFC|케이에프씨|소바|면옥|회관|도시락|한솥|김선생|뚝배기|어묵|순대|타코|샤브|반찬|푸드|국수|돈부리|부대찌개|맥주|강정|파파존스|파파이스|핵밥/, '식비'],
  [/이비인후과/, '의료·건강'],
  [/아마노|파크|충전소|LPG|대교|블루라인|우버|서울교통공사|철도/, '교통'],
  [/이케아|무인양품|스타필드|더현대|Temu/i, '쇼핑'],
  [/씨유|지에스\(GS\)|생활협동조합|매점|문구|프린트|우체국|우정사업|코리아세븐/, '생활·마트'],
  [/스타벅스|커피|카페|투썸|이디야|메가|빽다방|컴포즈|폴바셋|블루보틀|베이커리|파리바게|뚜레쥬르|빵|디저트|배스킨|설빙/, '카페·간식'],
  [/택시|카카오\s?T|카카오모빌|티머니|코레일|KTX|SRT|지하철|버스|주유|GS칼텍스|SK에너지|S-OIL|오일|주차|하이패스|쏘카|타다/i, '교통'],
  [/쿠팡|무신사|29CM|지그재그|올리브영|다이소|네이버페이|11번가|G마켓|옥션|SSG|오늘의집|에이블리|유니클로|자라|H&M/i, '쇼핑'],
  [/이마트|홈플러스|롯데마트|코스트코|GS25|CU|세븐일레븐|이마트24|마트|편의점|컬리|홈마트|노브랜드/i, '생활·마트'],
  [/넷플릭스|NETFLIX|유튜브|YOUTUBE|스포티파이|SPOTIFY|멜론|웨이브|티빙|왓챠|디즈니|쿠팡플레이|APPLE\.COM|ICLOUD|애플/i, '구독'],
  [/ADOBE|어도비|FIGMA|피그마|OPENAI|CHATGPT|ANTHROPIC|CLAUDE|MIDJOURNEY|NOTION|노션|GOOGLE\s?WORKSPACE|HIGGSFIELD|AICRON|CANVA|FRAMER|WEBFLOW|AWS|GITHUB/i, '소프트웨어·구독'],
  [/병원|의원|약국|치과|한의원|안과|피부과|정형외과|내과/, '의료·건강'],
  [/CGV|메가박스|롯데시네마|영화|공연|티켓|인터파크|예스24|교보|알라딘|전시|미술관|박물관/i, '문화·여가'],
  [/항공|에어|호텔|숙박|에어비앤비|AIRBNB|야놀자|여기어때|아고다|트립닷컴|부킹/i, '여행'],
  [/통신|SKT|KT|LG\s?U|관리비|전기|가스|수도|월세|도시가스/i, '주거·통신'],
  [/동물병원|펫|사료|캣|고양이|모래/, '반려묘'],
  [/꽃|축의|부의|선물/, '경조사·선물'],
  [/학원|클래스|강의|인프런|패스트캠퍼스|유데미|UDEMY|COURSERA/i, '교육'],
  [/식당|반점|분식|김밥|국밥|치킨|피자|버거|맥도날드|롯데리아|맘스터치|배달의민족|배민|요기요|쿠팡이츠|고기|횟집|초밥|스시|라멘|돈까스|족발|보쌈|찜|탕|한식|중식|일식|양식|술집|포차|호프|이자카야|점심|저녁|아침|식사/, '식비'],
  [/월급|급여|강의료|강사료|인건비/, '급여·강의료'],
  [/이자|환급|캐시백/, '이자·환급']
];
const BIZ_MAP = { '구독': '소프트웨어·구독', '소프트웨어·구독': '소프트웨어·구독', '교통': '교통·출장', '여행': '교통·출장', '식비': '접대·회의', '카페·간식': '접대·회의', '쇼핑': '장비·소모품', '생활·마트': '장비·소모품', '주거·통신': '통신·사무' };

/* ───────────────────────── 상태 ───────────────────────── */
const today = () => fmtDate(new Date());
function fmtDate(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
function fmtTime(d) { return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); }
const S = {
  cfg: LS.get(K.cfg, null),
  data: LS.get(K.cache, null),
  queue: LS.get(K.queue, []),
  ui: Object.assign({ book: '전체', tab: 'home' }, LS.get(K.ui, {})),
  ym: today().slice(0, 7),
  filter: { type: '전체', q: '', method: '' },
  syncing: false, syncErr: '', lastSync: null
};
const isDemo = () => S.cfg && S.cfg.demo;

/* ───────────────────────── 유틸 ───────────────────────── */
const $ = s => document.querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const won = n => Math.round(n).toLocaleString('ko-KR');
const wonU = n => won(n) + '원';
function shortWon(n) {
  n = Math.round(n); const a = Math.abs(n);
  if (a >= 100000000) return (n / 100000000).toFixed(a % 100000000 ? 1 : 0).replace(/\.0$/, '') + '억';
  if (a >= 10000) return (n / 10000).toFixed(a >= 1000000 ? 0 : 1).replace(/\.0$/, '') + '만';
  return won(n);
}
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
const DOW = ['일', '월', '화', '수', '목', '금', '토'];
function dayLabel(ds) {
  const t = today(), d = new Date(ds + 'T00:00:00');
  const y = new Date(); y.setDate(y.getDate() - 1);
  if (ds === t) return '오늘';
  if (ds === fmtDate(y)) return '어제';
  return (d.getMonth() + 1) + '월 ' + d.getDate() + '일 ' + DOW[d.getDay()] + '요일';
}
function haptic() { try { navigator.vibrate && navigator.vibrate(8); } catch (e) {} }

function cats() { return (S.data && S.data.categories && S.data.categories.length) ? S.data.categories : DEFAULT_CATS; }
function methods() { return (S.data && S.data.methods && S.data.methods.length) ? S.data.methods : DEFAULT_METHODS; }
function txs() { return (S.data && S.data.txs) || []; }
function settings() { return (S.data && S.data.settings) || {}; }
function catOf(t) {
  const list = cats();
  return list.find(c => c.name === t.category && (c.book === t.book || c.book === '공통')) || list.find(c => c.name === t.category) || { icon: '📦', color: '#B0B8C1', name: t.category || '기타' };
}

/* 월 범위 (설정의 '월 시작일' 반영) */
function monthRange(ym) {
  const sd = Math.min(28, Math.max(1, Number(settings()['월 시작일']) || 1));
  const [y, m] = ym.split('-').map(Number);
  const from = new Date(y, m - 1, sd), to = new Date(y, m, sd);
  if (sd > 1) { from.setMonth(from.getMonth() - 1); to.setMonth(to.getMonth() - 1); }
  return [fmtDate(from), fmtDate(to)];
}
function addMonth(ym, d) { const [y, m] = ym.split('-').map(Number); const x = new Date(y, m - 1 + d, 1); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0'); }
function inMonth(list, ym) { const [a, b] = monthRange(ym); return list.filter(t => t.date >= a && t.date < b); }
function byBook(list, book) { return book === '전체' ? list : list.filter(t => t.book === book || (t.type === '이체' && book === '개인')); }
function sum(list, type, book) { return list.reduce((s, t) => s + ((t.type === type && (!book || t.book === book)) ? Number(t.amount) : 0), 0); }

/* ───────────────────────── API ───────────────────────── */
async function api(action, payload) {
  if (isDemo()) return { ok: true, data: null };
  const res = await fetch(S.cfg.url, { method: 'POST', redirect: 'follow', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(Object.assign({ pin: S.cfg.pin, action }, payload || {})) });
  const j = await res.json();
  if (!j.ok) throw new Error(j.error || 'error');
  return j;
}
function persist() { LS.set(K.cache, S.data); LS.set(K.queue, S.queue); }

async function pull(silent) {
  if (isDemo()) return;
  S.syncing = true; if (!silent) renderSync();
  try {
    await flushQueue();
    const j = await api('bootstrap');
    S.data = j.data; S.syncErr = ''; S.lastSync = new Date();
    persist();
  } catch (e) {
    S.syncErr = e.message === 'unauthorized' ? 'PIN이 맞지 않아요. 설정에서 다시 연결해 주세요.' : '오프라인이에요. 입력은 저장해 두었다가 연결되면 보낼게요.';
  }
  S.syncing = false; render();
}
async function flushQueue() {
  while (S.queue.length) {
    const op = S.queue[0];
    await api(op.action, op.payload);
    S.queue.shift(); persist();
  }
}
async function mutate(action, payload) {
  S.queue.push({ action, payload }); persist();
  if (isDemo()) { S.queue = []; persist(); return; }
  try { await flushQueue(); S.syncErr = ''; S.lastSync = new Date(); }
  catch (e) { S.syncErr = e.message === 'unauthorized' ? 'PIN이 맞지 않아요.' : '연결되면 ' + S.queue.length + '건을 시트에 보낼게요.'; }
  renderSync();
}

/* ───────────────────────── 거래 조작 ───────────────────────── */
function addTx(t, opts) {
  t = Object.assign({ id: uid(), date: today(), time: fmtTime(new Date()), type: '지출', book: '개인', category: '기타', title: '', amount: 0, method: '', memo: '', source: '수동' }, t);
  if (t.type === '이체') t.book = '공통';
  S.data.txs.push(t); persist(); render();
  mutate('add', { tx: t });
  if (!(opts && opts.silent)) toast(`${t.title || t.category} ${wonU(t.amount)} 저장했어요`, () => delTx(t.id, true));
  return t;
}
function updateTx(t) {
  if (t.type === '이체') t.book = '공통';
  const i = S.data.txs.findIndex(x => x.id === t.id);
  if (i > -1) S.data.txs[i] = Object.assign({}, S.data.txs[i], t);
  persist(); render(); mutate('update', { tx: S.data.txs[i] }); toast('수정했어요');
}
function delTx(id, quiet) {
  const i = S.data.txs.findIndex(x => x.id === id); if (i < 0) return;
  const [removed] = S.data.txs.splice(i, 1);
  persist(); render(); mutate('delete', { id });
  if (!quiet) toast('삭제했어요', () => addTx(Object.assign({}, removed), { silent: true }));
}

/* ───────────────────────── 학습형 카테고리 추정 ───────────────────────── */
function lastByTitle(title) {
  if (!title) return null;
  const key = title.trim().toLowerCase();
  const list = txs().filter(t => (t.title || '').trim().toLowerCase() === key);
  return list.length ? list[list.length - 1] : null;
}
/* ───────────────────────── 수입 출처 (대학별 강의 / 프로젝트) ───────────────────────── */
const UNI_ALIAS = { '홍대': '홍익대학교', '홍익대': '홍익대학교', '과기대': '서울과학기술대학교', '서울과기대': '서울과학기술대학교', '서울과학기술대': '서울과학기술대학교', '과학기술대': '서울과학기술대학교' };
function uniOf(title) {
  const t = String(title || '').replace(/\(주\)|㈜|주식회사/g, ' ').replace(/\s+/g, ' ').trim();
  for (const k of Object.keys(UNI_ALIAS).sort((a, b) => b.length - a.length)) if (t.includes(k + '학교') || new RegExp(k + '(?![가-힣])').test(t)) return UNI_ALIAS[k];
  let m = t.match(/([가-힣A-Za-z]{1,10}?)(대학교|대학)/);
  if (!m) m = t.match(/([가-힣A-Za-z]{1,10}?)대(?![가-힣])/);
  if (!m) return '';
  let name = m[1].replace(/^(학교법인|국립|사립)/, '') + '대학교';
  return UNI_ALIAS[m[1] + '대'] || name;
}
const isLectureIncome = t => t.type === '수입' && t.book !== '사업' && (!!uniOf(t.title) || /강의|강사|교원|시간강사|겸임/.test(t.title + ' ' + (t.memo || '')));
const isProjectIncome = t => t.type === '수입' && t.book === '사업';
function clientOf(t) { return String(t.title || '').replace(/\(주\)|㈜|주식회사|유한회사/g, '').trim() || '거래처 미기재'; }
function guessIncomeBook(title) {
  if (uniOf(title) || /강의|강사|월급|급여|이자|환급|캐시백/.test(title)) return '개인';
  if (/\(주\)|㈜|주식회사|유한회사|용역|디자인|프로젝트|계약금|잔금|중도금|정산/.test(title)) return '사업';
  if (/학회|협회|재단|진흥원|문화원|공사|공단/.test(title)) return '사업';
  return '개인';
}

function guessCategory(title, type, book) {
  const h = lastByTitle(title);
  if (h && h.type === type && (h.book === book || type === '이체')) return h.category;
  const valid = cats().filter(c => c.type === type && (c.book === book || c.book === '공통')).map(c => c.name);
  for (const [re, name] of RULES) {
    if (re.test(title)) {
      let n = name;
      if (book === '사업' && BIZ_MAP[n]) n = BIZ_MAP[n];
      if (book === '개인' && n === '소프트웨어·구독') n = '구독';
      if (valid.includes(n)) return n;
    }
  }
  if (type === '수입' && book !== '사업' && (uniOf(title) || /강의|강사|월급|급여/.test(title)) && valid.includes('급여·강의료')) return '급여·강의료';
  if (type === '수입' && book === '사업' && /학회|협회|재단|진흥원|강연|자문|특강|심사/.test(title) && valid.includes('강연·자문')) return '강연·자문';
  if (type === '수입' && book === '사업' && /지원금|보조금/.test(title) && valid.includes('지원금')) return '지원금';
  if (type === '수입') return book === '사업' ? (valid.includes('디자인 매출') ? '디자인 매출' : valid[0]) : (valid.includes('기타수입') ? '기타수입' : valid[0]);
  if (type === '이체') return valid[0] || '이체';
  return book === '사업' ? (valid.includes('기타 경비') ? '기타 경비' : valid[valid.length - 1]) : (valid.includes('기타') ? '기타' : valid[valid.length - 1]);
}

/* ───────────────────────── 한 줄 입력 파서 ─────────────────────────
   예) "점심 12000 삼성", "어제 택시 1.2만", "강의료 50만 수입", "사업 피그마 2만 토스" */
function parseAmountToken(tok) {
  const m = tok.replace(/,/g, '').match(/^(\d+(?:\.\d+)?)(억|천만|백만|만|천)?(원)?$/);
  if (!m) return null;
  const mul = { '억': 1e8, '천만': 1e7, '백만': 1e6, '만': 1e4, '천': 1e3 }[m[2]] || 1;
  return Math.round(parseFloat(m[1]) * mul);
}
function parseQuick(text) {
  const out = { type: '지출', book: S.ui.book === '사업' ? '사업' : '개인', date: today(), time: fmtTime(new Date()), method: '', title: '', amount: 0, category: '' };
  let toks = text.trim().split(/\s+/).filter(Boolean);
  const rest = [];
  const mlist = methods();
  for (const tk of toks) {
    const a = parseAmountToken(tk);
    if (a && !out.amount) { out.amount = a; continue; }
    if (/^(수입|입금|\+)$/.test(tk)) { out.type = '수입'; continue; }
    if (/^(지출|출금|-)$/.test(tk)) { out.type = '지출'; continue; }
    if (/^(이체|송금|저축)$/.test(tk)) { out.type = '이체'; if (tk === '저축') out.category = '저축·투자'; continue; }
    if (/^@?(사업|업무|비즈)$/.test(tk)) { out.book = '사업'; continue; }
    if (/^@?(개인|생활)$/.test(tk)) { out.book = '개인'; continue; }
    if (tk === '오늘') continue;
    if (tk === '어제') { const d = new Date(); d.setDate(d.getDate() - 1); out.date = fmtDate(d); out.time = ''; continue; }
    if (tk === '그제' || tk === '그저께') { const d = new Date(); d.setDate(d.getDate() - 2); out.date = fmtDate(d); out.time = ''; continue; }
    const dm = tk.match(/^(\d{1,2})[\/.](\d{1,2})$/);
    if (dm) { out.date = today().slice(0, 4) + '-' + dm[1].padStart(2, '0') + '-' + dm[2].padStart(2, '0'); out.time = ''; continue; }
    const mm = mlist.find(m => m.name === tk || (tk.length >= 2 && m.name.startsWith(tk)));
    if (mm && !out.method) { out.method = mm.name; continue; }
    if (/^카드$/.test(tk)) { out.method = '삼성카드'; continue; }
    rest.push(tk);
  }
  out.title = rest.join(' ');
  if (out.type !== '수입' && /(월급|급여|강의료|강사료|매출|입금|환급|이자|정산금|잔금|계약금|중도금|용역비|디자인비|자문료)/.test(out.title)) out.type = '수입';
  if (out.type === '수입' && !/(^|\s)@?(개인|사업|업무|비즈)(\s|$)/.test(text)) out.book = guessIncomeBook(out.title);
  if (out.type === '이체') out.book = '공통';
  if (!out.category) out.category = guessCategory(out.title, out.type, out.book);
  const h = lastByTitle(out.title);
  if (!out.method) out.method = (h && h.method) || (out.book === '사업' ? '사업자 계좌' : (lastMethod() || '삼성카드'));
  return out;
}
function lastMethod() { const l = txs(); for (let i = l.length - 1; i >= 0; i--) if (l[i].method && l[i].source === '수동') return l[i].method; return ''; }

/* ───────────────────────── 카드 문자·알림 파서 ───────────────────────── */
function parseMessages(raw) {
  const blocks = raw.replace(/\r/g, '').split(/\n\s*\n|(?=\[Web발신\])/).map(s => s.trim()).filter(Boolean);
  const res = [];
  for (const b of blocks) { const p = parseMessage(b); if (p) res.push(p); }
  return res;
}
function parseMessage(raw) {
  const text = raw.replace(/\[Web발신\]/g, '').trim();
  const flat = text.replace(/\n+/g, ' ');
  const m = flat.match(/([\d,]+)\s*원/);
  if (!m) return null;
  const amount = Number(m[1].replace(/,/g, ''));
  if (!amount || /취소/.test(flat)) return null;
  const method = /삼성/.test(flat) ? '삼성카드' : /토스/.test(flat) ? '토스뱅크' : '기타';
  const type = /(입금|급여|환급|받았|들어왔)/.test(flat) ? '수입' : '지출';
  let date = today(), time = '';
  const dm = flat.match(/(\d{1,2})[\/.-](\d{1,2})\s+(\d{1,2}):(\d{2})/);
  if (dm) { date = today().slice(0, 4) + '-' + dm[1].padStart(2, '0') + '-' + dm[2].padStart(2, '0'); time = dm[3].padStart(2, '0') + ':' + dm[4]; if (date > today()) date = (Number(today().slice(0, 4)) - 1) + date.slice(4); }
  let title = '';
  const lines = text.split('\n').map(s => s.trim()).filter(Boolean);
  const tl = lines.find(l => /\d{1,2}[\/.-]\d{1,2}\s+\d{1,2}:\d{2}\s+\S/.test(l));
  if (tl) title = tl.replace(/.*\d{1,2}[\/.-]\d{1,2}\s+\d{1,2}:\d{2}\s+/, '');
  if (!title) { const bar = flat.split('|'); if (bar.length > 1) title = bar[bar.length - 1]; }
  if (!title) { const after = flat.slice(flat.indexOf(m[0]) + m[0].length).replace(/일시불|할부\s*\d*개월?|승인|결제|출금|입금/g, '').trim(); title = after.split(/\s{2,}|누적|잔액/)[0]; }
  title = (title || '').replace(/누적.*$/, '').replace(/잔액.*$/, '').trim() || '내역';
  const book = '개인';
  return { id: uid(), date, time, type, book, category: guessCategory(title, type, book), title, amount, method, memo: '', source: method === '기타' ? '문자' : method };
}

/* ───────────────────────── 파일 가져오기 (토스뱅크·삼성카드 내보내기) ───────────────────────── */
function parseCSV(text) {
  const rows = []; let row = [], cur = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
    else if (c === '"') q = true;
    else if (c === ',') { row.push(cur); cur = ''; }
    else if (c === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; }
    else if (c !== '\r') cur += c;
  }
  if (cur || row.length) { row.push(cur); rows.push(row); }
  return rows;
}
function toDateStr(v) {
  if (v instanceof Date) return fmtDate(v);
  if (typeof v === 'number' && v > 30000 && v < 80000) { const d = new Date(Math.round((v - 25569) * 864e5)); return fmtDate(new Date(d.getTime() + d.getTimezoneOffset() * 6e4)); }
  const s = String(v || '').trim();
  let m = s.match(/(\d{4})[.\-\/년\s]+(\d{1,2})[.\-\/월\s]+(\d{1,2})/);
  if (m) return m[1] + '-' + m[2].padStart(2, '0') + '-' + m[3].padStart(2, '0');
  m = s.match(/^(\d{2})[.\-\/](\d{1,2})[.\-\/](\d{1,2})/);
  if (m) return '20' + m[1] + '-' + m[2].padStart(2, '0') + '-' + m[3].padStart(2, '0');
  m = s.match(/^(\d{8})/);
  if (m) return m[1].slice(0, 4) + '-' + m[1].slice(4, 6) + '-' + m[1].slice(6, 8);
  return '';
}
function toTimeStr(v) { const m = String(v || '').match(/(\d{1,2}):(\d{2})/); return m ? m[1].padStart(2, '0') + ':' + m[2] : ''; }
function toNum(v) { if (typeof v === 'number') return v; const s = String(v || '').replace(/[,원\s]/g, ''); if (!s || isNaN(Number(s))) return null; return Number(s); }
function analyzeTable(rows) {
  rows = rows.filter(r => r && r.some(c => String(c).trim() !== ''));
  let hi = -1;
  for (let i = 0; i < Math.min(rows.length, 30); i++) {
    const j = rows[i].map(c => String(c).replace(/\s/g, '')).join('|');
    if (/(거래일시|거래일자|이용일|승인일|일자|날짜|거래일)/.test(j) && /(금액|출금|입금)/.test(j)) { hi = i; break; }
  }
  if (hi < 0) return { error: '날짜와 금액 열을 찾지 못했어요. 은행·카드 앱에서 내려받은 원본 파일인지 확인해 주세요.' };
  const H = rows[hi].map(c => String(c).replace(/\s/g, ''));
  const find = (...res) => { for (const re of res) { const i = H.findIndex(h => re.test(h)); if (i > -1) return i; } return -1; };
  const col = {
    date: find(/^(거래일시|거래일자|이용일시|이용일자|승인일시|승인일자|이용일|거래일|일자|날짜)/, /일시|일자/),
    time: find(/^(거래시간|이용시간|승인시간|시간)$/),
    title: find(/^(가맹점명?|이용가맹점|이용하신곳|적요|내용|거래처|받는분|보낸분|상대방|거래내용|기재내용|이용처)/),
    amount: find(/^(거래금액|이용금액|승인금액|결제금액|금액)/),
    out: find(/^(출금액?|출금금액|찾으신금액)/),
    in: find(/^(입금액?|입금금액|맡기신금액)/),
    kind: find(/^(거래유형|구분|입출금구분|거래구분)$/),
    memo: find(/^메모$/),
    cancel: find(/^취소(여부|구분)?$/),
    appr: find(/^승인번호$/),
    inst: find(/^할부개월$/)
  };
  if (col.date < 0 || (col.amount < 0 && col.out < 0 && col.in < 0)) return { error: '날짜와 금액 열을 찾지 못했어요.' };
  const headTxt = H.join('|') + '|' + rows.slice(0, hi).flat().join('|');
  const source = /삼성/.test(headTxt) ? '삼성카드' : /토스/.test(headTxt) ? '토스뱅크' : (col.out > -1 || col.in > -1 || col.kind > -1) ? '토스뱅크' : '삼성카드';
  const items = [];
  for (const r of rows.slice(hi + 1)) {
    const date = toDateStr(r[col.date]); if (!date) continue;
    let amt = 0, type = '지출';
    if (col.out > -1 || col.in > -1) {
      const o = toNum(r[col.out]) || 0, n = toNum(r[col.in]) || 0;
      if (n > 0) { amt = n; type = '수입'; } else { amt = o; }
    } else {
      const v = toNum(r[col.amount]); if (v == null) continue;
      amt = Math.abs(v);
      const kind = col.kind > -1 ? String(r[col.kind]) : '';
      if (/입금|수입/.test(kind)) type = '수입';
      else if (/출금|결제|지출/.test(kind)) type = '지출';
      else if (source === '토스뱅크') type = v > 0 ? '수입' : '지출';
      if (/취소/.test(kind)) continue;
    }
    if (!amt) continue;
    const title = String(r[col.title] ?? '').trim() || '내역';
    if (/카드대금|삼성카드/.test(title) && type === '지출' && source === '토스뱅크') type = '이체';
    const time = col.time > -1 ? toTimeStr(r[col.time]) : toTimeStr(r[col.date]);
    const book = '개인';
    const signed = col.appr > -1 ? (toNum(r[col.amount]) || 0) : amt;
    const inst = col.inst > -1 ? Number(r[col.inst]) || 0 : 0;
    items.push({ id: uid(), date, time, type, book: type === '이체' ? '공통' : book, category: '', title, amount: Math.round(amt), method: source, memo: (col.memo > -1 ? String(r[col.memo] || '') : '') + (inst > 1 ? '할부 ' + inst + '개월' : ''), source: source, _appr: col.appr > -1 ? String(r[col.appr]) : '', _signed: signed, _cancel: col.cancel > -1 && /취소/.test(String(r[col.cancel])) });
  }
  // 카드 내역: 같은 승인번호끼리 합산해 전체·부분취소와 가승인을 정리
  if (col.appr > -1) {
    const g = {};
    items.forEach(t => { const k = t._appr + '|' + t.title; (g[k] = g[k] || []).push(t); });
    const merged = [];
    Object.values(g).forEach(list => {
      const net = list.reduce((s, t) => s + t._signed, 0);
      if (net <= 0 || /가승인|선승인/.test(list[0].title)) return;
      const base = list.reduce((a, b) => (b._signed > a._signed ? b : a));
      base.amount = Math.round(net);
      if (list.some(t => t._cancel)) base.memo = (base.memo + ' 부분취소 반영').trim();
      merged.push(base);
    });
    items.length = 0; merged.forEach(t => items.push(t));
  }
  items.forEach(t => { delete t._appr; delete t._signed; delete t._cancel; });
  items.forEach(t => { if (t.type === '수입') t.book = guessIncomeBook(t.title); });
  items.forEach(t => { t.category = t.type === '이체' ? (/카드/.test(t.title) ? '카드대금' : '이체') : guessCategory(t.title, t.type, t.book); });
  return { items, source };
}

/* ───────────────────────── 렌더링 ───────────────────────── */
const ICON = {
  home: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.3 3.3a1 1 0 0 1 1.4 0l8 7.4a1 1 0 0 1 .3.7V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1v-8.6a1 1 0 0 1 .3-.7z"/></svg>',
  list: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="4" width="18" height="4" rx="2"/><rect x="3" y="10" width="18" height="4" rx="2" opacity=".7"/><rect x="3" y="16" width="12" height="4" rx="2" opacity=".45"/></svg>',
  chart: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="12" width="4.5" height="9" rx="1.5"/><rect x="9.75" y="6" width="4.5" height="15" rx="1.5"/><rect x="16.5" y="3" width="4.5" height="18" rx="1.5" opacity=".6"/></svg>',
  set: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13.9 2.6a1 1 0 0 0-1-.6h-1.8a1 1 0 0 0-1 .6l-.6 2a7.6 7.6 0 0 0-1.8 1l-2-.6a1 1 0 0 0-1.1.4l-.9 1.6a1 1 0 0 0 .1 1.1l1.5 1.5a7.7 7.7 0 0 0 0 2.1L3.8 13a1 1 0 0 0-.1 1.1l.9 1.6a1 1 0 0 0 1.1.4l2-.6c.5.4 1.1.8 1.8 1l.6 2a1 1 0 0 0 1 .6h1.8a1 1 0 0 0 1-.6l.6-2c.7-.2 1.3-.6 1.8-1l2 .6a1 1 0 0 0 1.1-.4l.9-1.6a1 1 0 0 0-.1-1.1l-1.5-1.5a7.7 7.7 0 0 0 0-2.1L20.2 9a1 1 0 0 0 .1-1.1l-.9-1.6a1 1 0 0 0-1.1-.4l-2 .6a7.6 7.6 0 0 0-1.8-1zM12 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  l: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg>',
  r: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>',
  x: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  search: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--sub)" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>'
};

function render() {
  const root = $('#root');
  if (!S.cfg) { root.innerHTML = viewOnboard(); bindOnboard(); return; }
  if (!S.data) S.data = { txs: [], categories: DEFAULT_CATS, methods: DEFAULT_METHODS, settings: { '개인 월예산': 1500000, '사업 월예산': 500000, '월 시작일': 1 } };
  const tab = S.ui.tab;
  const body = tab === 'list' ? viewList() : tab === 'stats' ? viewStats() : tab === 'settings' ? viewSettings() : viewHome();
  const showMonth = tab !== 'settings';
  root.innerHTML = `
  <div class="app">
    <header class="top">
      <div class="top-row">
        ${showMonth ? `<div class="month"><button data-act="prev" aria-label="이전 달">${ICON.l}</button><span class="num">${monthTitle()}</span><button data-act="next" aria-label="다음 달" ${S.ym >= today().slice(0, 7) ? 'disabled style="opacity:.25"' : ''}>${ICON.r}</button></div>` : `<div class="month"><span style="text-align:left">설정</span></div>`}
        ${showMonth ? `<div class="seg" role="group" aria-label="장부">${['전체', '개인', '사업'].map(b => `<button data-book="${b}" aria-pressed="${S.ui.book === b}">${b}</button>`).join('')}</div>` : (isDemo() ? '<span class="demo-badge">둘러보기 모드</span>' : '')}
      </div>
      <div class="sync" id="sync"></div>
    </header>
    <main>${body}</main>
  </div>
  <nav class="tabs" aria-label="메뉴"><div class="tabs-in">
    ${tabBtn('home', '홈', ICON.home)}${tabBtn('list', '내역', ICON.list)}
    <button class="tab-add" data-act="add" aria-label="내역 추가">${ICON.plus}</button>
    ${tabBtn('stats', '분석', ICON.chart)}${tabBtn('settings', '설정', ICON.set)}
  </div></nav>`;
  renderSync();
  bindMain();
}
function tabBtn(id, label, icon) { return `<button class="tab" data-tab="${id}" ${S.ui.tab === id ? 'aria-current="page"' : ''}>${icon}<span>${label}</span></button>`; }
function monthTitle() { const [y, m] = S.ym.split('-').map(Number); return (y !== new Date().getFullYear() ? y + '년 ' : '') + m + '월'; }
function renderSync() {
  const el = $('#sync'); if (!el) return;
  let t = '', warn = false;
  if (isDemo()) t = '둘러보기 모드예요. 입력한 내용은 이 기기에만 남아요.';
  else if (S.syncErr) { t = S.syncErr; warn = true; }
  else if (S.syncing) t = '시트와 맞추는 중…';
  else if (S.queue.length) t = `${S.queue.length}건 보내는 중…`;
  else if (S.lastSync) t = 'Google 시트와 연결됨';
  el.textContent = t; el.className = 'sync' + (warn ? ' warn' : '');
}

/* 홈 */
function viewHome() {
  const all = inMonth(txs(), S.ym), book = S.ui.book, s = settings();
  const isNow = S.ym === today().slice(0, 7);
  const [from, to] = monthRange(S.ym);
  const days = Math.round((new Date(to) - new Date(from)) / 864e5);
  const passed = isNow ? Math.round((new Date(today()) - new Date(from)) / 864e5) + 1 : days;
  let hero = '';
  if (book === '사업') {
    const inc = sum(all, '수입', '사업'), exp = sum(all, '지출', '사업'), budget = Number(s['사업 월예산']) || 0;
    const net = inc - exp;
    hero = `<section class="card">
      <div class="hero-label">${isNow ? '이번 달' : monthTitle()} 사업 순이익</div>
      <div class="hero-amt num ${net < 0 ? '' : ''}">${net < 0 ? '−' : ''}${won(Math.abs(net))}<small>원</small></div>
      <div class="hero-note">매출에서 경비를 뺀 금액이에요</div>
      ${budget ? paceBar(exp, budget, passed, days, '경비') : ''}
      <div class="hero-split"><div class="mini"><span>매출</span><b class="num plus">${wonU(inc)}</b></div><div class="mini"><span>경비</span><b class="num">${wonU(exp)}</b></div></div>
    </section>`;
  } else {
    const exp = sum(all, '지출', '개인'), inc = sum(all, '수입', '개인'), budget = Number(s['개인 월예산']) || 0;
    const left = budget - exp, daysLeft = Math.max(1, days - passed + 1);
    let note = '';
    if (budget) {
      if (left < 0) note = `예산보다 <b class="over num">${wonU(-left)}</b> 더 썼어요`;
      else if (isNow) note = `남은 ${daysLeft}일 동안 하루 <b class="num">${wonU(left / daysLeft)}</b>씩 쓸 수 있어요`;
      else note = `예산에서 <b class="num">${wonU(left)}</b> 남겼어요`;
    } else note = '설정에서 월 예산을 정하면 페이스를 알려 드려요';
    hero = `<section class="card">
      <div class="hero-label">${isNow ? '이번 달' : monthTitle()} ${book === '전체' ? '생활비로' : ''} 쓴 돈</div>
      <div class="hero-amt num">${won(exp)}<small>원</small></div>
      <div class="hero-note">${note}</div>
      ${budget ? paceBar(exp, budget, passed, days, '예산') : ''}
      <div class="hero-split">
        <div class="mini"><span>들어온 돈</span><b class="num plus">${wonU(inc)}</b></div>
        ${book === '전체' ? `<div class="mini"><span>사업 순이익</span><b class="num ${sum(all, '수입', '사업') - sum(all, '지출', '사업') >= 0 ? 'plus' : ''}">${wonU(sum(all, '수입', '사업') - sum(all, '지출', '사업'))}</b></div>` : `<div class="mini"><span>지난달보다</span><b class="num">${diffText(exp, sum(inMonth(txs(), addMonth(S.ym, -1)), '지출', '개인'))}</b></div>`}
      </div>
    </section>`;
  }
  const quick = `<form class="quick" id="quickForm" autocomplete="off"><input id="quickIn" enterkeyhint="done" placeholder="점심 12000 삼성 처럼 적고 엔터" aria-label="한 줄로 빠르게 입력"><button type="submit">추가</button></form><div class="quick-preview" id="quickPrev"></div>`;
  const list = byBook(all, book);
  const expType = '지출';
  const catSums = {};
  list.filter(t => t.type === expType).forEach(t => { const k = t.book + '|' + t.category; catSums[k] = (catSums[k] || 0) + Number(t.amount); });
  const catArr = Object.entries(catSums).sort((a, b) => b[1] - a[1]);
  const total = catArr.reduce((a, b) => a + b[1], 0);
  const catHtml = catArr.length ? catArr.slice(0, 5).map(([k, v]) => {
    const [bk, name] = k.split('|'); const c = catOf({ category: name, book: bk });
    const bud = Number(c.budget) || 0; const over = bud && v > bud;
    return `<button class="catbar" data-cat="${esc(name)}" data-cbook="${esc(bk)}">
      <span class="ico" style="background:${c.color}1F">${c.icon}</span>
      <span class="row-main"><span class="top-line"><span>${esc(name)}${book === '전체' && bk === '사업' ? '<span class="tag">사업</span>' : ''}<em>${Math.round(v / total * 100)}%</em></span><span class="num">${wonU(v)}</span></span>
      <span class="track"><i style="width:${Math.max(3, v / catArr[0][1] * 100)}%;background:${c.color}"></i></span>
      ${bud ? `<span class="${over ? 'budget-flag' : 'row-sub'}">${over ? '예산 ' + wonU(v - bud) + ' 초과' : '예산 ' + wonU(bud - v) + ' 남음'}</span>` : ''}</span></button>`;
  }).join('') : '';
  const recent = [...list].sort(sortTx).slice(0, 6);
  return `${hero}${quick}
    ${catHtml ? `<section class="card"><h2>어디에 썼을까요<button class="more" data-tab="stats">분석 보기</button></h2>${catHtml}</section>` : ''}
    <section class="card"><h2>최근 내역${recent.length ? '<button class="more" data-tab="list">전체 보기</button>' : ''}</h2>
      ${recent.length ? recent.map(rowHtml).join('') : `<div class="empty-state"><div class="big">🧾</div>${isNowMonth() ? '아직 이번 달 내역이 없어요.<br>위 입력창이나 + 버튼으로 첫 내역을 남겨 보세요.' : '이 달에는 내역이 없어요.'}</div>`}
    </section>`;
}
function isNowMonth() { return S.ym === today().slice(0, 7); }
function paceBar(spent, budget, passed, days, word) {
  const pct = Math.min(100, spent / budget * 100), dayPct = Math.min(100, passed / days * 100);
  return `<div class="pace" role="img" aria-label="${word} ${Math.round(spent / budget * 100)}% 사용"><div class="pace-fill ${spent > budget ? 'over' : ''}" style="width:${pct}%"></div>${isNowMonth() ? `<div class="pace-today" style="left:calc(${dayPct}% - 1px)"></div>` : ''}</div>
  <div class="pace-legend"><span>${word} ${wonU(budget)} 중 ${Math.round(spent / budget * 100)}%</span>${isNowMonth() ? `<span>오늘까지 적정 ${wonU(budget * passed / days)}</span>` : ''}</div>`;
}
function diffText(a, b) { if (!b) return '−'; const d = a - b; return (d > 0 ? '+' : d < 0 ? '−' : '') + wonU(Math.abs(d)); }
function sortTx(a, b) { return (b.date + (b.time || '')).localeCompare(a.date + (a.time || '')) || String(b.createdAt || '').localeCompare(String(a.createdAt || '')); }
function rowHtml(t) {
  const c = catOf(t);
  const sub = [t.time, t.category, t.method].filter(Boolean).join('  ');
  const cls = t.type === '수입' ? 'in' : t.type === '이체' ? 'tr' : '';
  const sign = t.type === '수입' ? '+' : t.type === '이체' ? '' : '−';
  return `<button class="row" data-id="${esc(t.id)}"><span class="ico" style="background:${c.color}1F">${c.icon}</span>
    <span class="row-main"><span class="row-title">${esc(t.title || t.category)}${S.ui.book === '전체' && t.book === '사업' ? '<span class="tag">사업</span>' : ''}</span><span class="row-sub">${esc(sub)}</span></span>
    <span class="row-amt num ${cls}">${sign}${wonU(t.amount)}</span></button>`;
}

/* 내역 */
function viewList() {
  const f = S.filter;
  const srcFilter = f.uni || f.client || f.acct;
  const per = S.ui.iperiod || 'year';
  let list = srcFilter && per === 'year' ? txs().filter(t => t.date.slice(0, 4) === S.ym.slice(0, 4) && t.date.slice(0, 7) <= S.ym) : byBook(inMonth(txs(), S.ym), S.ui.book);
  if (f.type !== '전체') list = list.filter(t => t.type === f.type);
  if (f.method) list = list.filter(t => t.method === f.method);
  if (f.cat) list = list.filter(t => t.category === f.cat);
  if (f.uni) list = list.filter(t => isLectureIncome(t) && (uniOf(t.title) || '기타 강의') === f.uni);
  if (f.client) list = list.filter(t => isProjectIncome(t) && clientOf(t) === f.client);
  if (f.acct) list = list.filter(t => t.type === '수입' && (t.method || '미지정') === f.acct);
  if (f.q) { const q = f.q.toLowerCase(); list = list.filter(t => [t.title, t.category, t.memo, t.method].join(' ').toLowerCase().includes(q)); }
  list.sort(sortTx);
  const groups = {};
  list.forEach(t => { (groups[t.date] = groups[t.date] || []).push(t); });
  const usedMethods = [...new Set(byBook(inMonth(txs(), S.ym), S.ui.book).map(t => t.method).filter(Boolean))];
  const exp = list.filter(t => t.type === '지출').reduce((s, t) => s + Number(t.amount), 0), inc = list.filter(t => t.type === '수입').reduce((s, t) => s + Number(t.amount), 0);
  return `<div class="search">${ICON.search}<input id="q" type="search" placeholder="가맹점, 카테고리, 메모 검색" value="${esc(f.q)}"></div>
  <div class="toolbar">${f.uni || f.client || f.acct ? `<button class="chip" data-fcat="" aria-pressed="true">${esc(f.uni || f.client || f.acct)} ✕</button>` : ''}${['전체', '지출', '수입', '이체'].map(x => `<button class="chip" data-ftype="${x}" aria-pressed="${f.type === x}">${x}</button>`).join('')}
    ${usedMethods.map(m => `<button class="chip" data-fmethod="${esc(m)}" aria-pressed="${f.method === m}">${esc(m)}</button>`).join('')}
    ${f.cat ? `<button class="chip" data-fcat="" aria-pressed="true">${esc(f.cat)} ✕</button>` : ''}
</div>
  <div class="list-sum"><span>지출 <b class="num">${wonU(exp)}</b></span><span>수입 <b class="num" style="color:var(--blue)">${wonU(inc)}</b></span><span>${list.length}건</span></div>
  ${list.length ? Object.keys(groups).map(d => {
    const g = groups[d]; const de = g.filter(t => t.type === '지출').reduce((s, t) => s + Number(t.amount), 0);
    return `<div class="day-head"><b>${dayLabel(d)}</b><span class="num">${de ? '−' + wonU(de) : ''}</span></div><div class="day-card">${g.map(rowHtml).join('')}</div>`;
  }).join('') : `<div class="empty-state" style="margin-top:24px"><div class="big">🔍</div>조건에 맞는 내역이 없어요.</div>`}`;
}

/* 분석 */
function viewStats() {
  const book = S.ui.book;
  const months = []; for (let i = 5; i >= 0; i--) months.push(addMonth(S.ym, -i));
  const series = months.map(ym => {
    const l = inMonth(txs(), ym);
    if (book === '사업') return { ym, a: sum(l, '수입', '사업'), b: sum(l, '지출', '사업') };
    if (book === '개인') return { ym, a: sum(l, '수입', '개인'), b: sum(l, '지출', '개인') };
    return { ym, a: sum(l, '수입'), b: sum(l, '지출') };
  });
  const max = Math.max(1, ...series.map(s => Math.max(s.a, s.b)));
  const aLabel = book === '사업' ? '매출' : '수입', bLabel = book === '사업' ? '경비' : '지출';
  const bars = `<div class="bars">${series.map(s => `<div class="bar-col ${s.ym === S.ym ? 'now' : ''}"><div class="bar-pair"><i style="height:${s.b / max * 100}%;background:${s.ym === S.ym ? 'var(--ink)' : 'var(--faint)'}" title="${bLabel} ${wonU(s.b)}"></i><i style="height:${s.a / max * 100}%;background:var(--blue);opacity:${s.ym === S.ym ? 1 : .45}" title="${aLabel} ${wonU(s.a)}"></i></div><span>${Number(s.ym.slice(5))}월</span></div>`).join('')}</div>
    <div class="legend"><span><i style="background:var(--ink)"></i>${bLabel}</span><span><i style="background:var(--blue)"></i>${aLabel}</span></div>`;
  const cur = series[5], prev = series[4];
  const avg3 = (series[2].b + series[3].b + series[4].b) / 3;
  let insight = '';
  if (cur.b || prev.b) {
    insight = `이번 달 ${bLabel}은 <b class="num">${wonU(cur.b)}</b>로 지난달보다 <b class="num">${wonU(Math.abs(cur.b - prev.b))}</b> ${cur.b >= prev.b ? '많아요' : '적어요'}.`;
    if (avg3) insight += ` 최근 3개월 평균은 <b class="num">${wonU(avg3)}</b>이에요.`;
  } else insight = '내역이 쌓이면 지난달과 비교해 알려 드려요.';

  const list = byBook(inMonth(txs(), S.ym), book).filter(t => t.type === '지출');
  const cs = {}; list.forEach(t => { const k = t.book + '|' + t.category; cs[k] = (cs[k] || 0) + Number(t.amount); });
  const arr = Object.entries(cs).sort((a, b) => b[1] - a[1]);
  const tot = arr.reduce((s, x) => s + x[1], 0);
  let donut = '';
  if (tot) {
    let acc = 0; const R = 54, C = 2 * Math.PI * R;
    const segs = arr.map(([k, v]) => { const c = catOf({ category: k.split('|')[1], book: k.split('|')[0] }); const len = v / tot * C; const s = `<circle r="${R}" cx="70" cy="70" fill="none" stroke="${c.color}" stroke-width="20" stroke-dasharray="${Math.max(0, len - 1.5)} ${C}" stroke-dashoffset="${-acc}" transform="rotate(-90 70 70)"/>`; acc += len; return s; }).join('');
    donut = `<div class="donut-wrap"><svg class="donut" width="140" height="140" viewBox="0 0 140 140" role="img" aria-label="카테고리별 지출 비율">${segs}<text x="70" y="64" text-anchor="middle" class="donut-center">총 ${bLabel}</text><text x="70" y="86" text-anchor="middle" class="donut-center-b num">${shortWon(tot)}원</text></svg>
      <div style="flex:1;min-width:0">${arr.slice(0, 6).map(([k, v]) => { const c = catOf({ category: k.split('|')[1], book: k.split('|')[0] }); return `<div style="display:flex;justify-content:space-between;gap:8px;font-size:14px;padding:3px 0"><span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis"><i style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${c.color};margin-right:6px"></i>${esc(k.split('|')[1])}</span><b class="num">${Math.round(v / tot * 100)}%</b></div>`; }).join('')}</div></div>`;
  }
  // 결제수단
  const ms = {}; list.forEach(t => { ms[t.method || '미지정'] = (ms[t.method || '미지정'] || 0) + Number(t.amount); });
  const marr = Object.entries(ms).sort((a, b) => b[1] - a[1]);
  // 사업 손익표
  const pl = book !== '개인' ? `<section class="card"><h2>사업 손익</h2><table class="pl num"><thead><tr><th>월</th><th>매출</th><th>경비</th><th>순이익</th></tr></thead><tbody>${months.slice().reverse().map(ym => { const l = inMonth(txs(), ym); const a = sum(l, '수입', '사업'), b = sum(l, '지출', '사업'); return `<tr><td>${Number(ym.slice(5))}월</td><td>${won(a)}</td><td>${won(b)}</td><td class="${a - b < 0 ? 'neg' : a - b > 0 ? 'pos' : ''}">${won(a - b)}</td></tr>`; }).join('')}</tbody></table>
    <p class="help" style="margin:12px 0 0">종합소득세 신고 때 경비 증빙 정리에 그대로 쓸 수 있도록 시트의 '월별요약' 탭에도 같은 숫자가 계산돼요.</p></section>` : '';
  return `${viewIncome(book)}<section class="card"><h2>최근 6개월</h2>${bars}<p class="insight" style="margin-top:16px">${insight}</p></section>
    ${donut ? `<section class="card"><h2>${monthTitle()} 카테고리</h2>${donut}</section>` : ''}
    ${marr.length ? `<section class="card"><h2>결제수단별</h2>${marr.map(([m, v]) => `<div class="set-row"><b style="font-weight:600">${esc(m)}</b><span class="num" style="color:var(--ink);font-weight:700">${wonU(v)}</span></div>`).join('')}</section>` : ''}
    ${pl}`;
}


/* 수입 분석: 대학별 강의 수입 + 프로젝트(거래처)별 수입 */
function viewIncome(book) {
  const per = S.ui.iperiod || 'year';
  const y = S.ym.slice(0, 4);
  const inPeriod = per === 'month' ? inMonth(txs(), S.ym) : txs().filter(t => t.date.slice(0, 4) === y && t.date.slice(0, 7) <= S.ym);
  const periodLabel = per === 'month' ? monthTitle() : y + '년';
  const lect = inPeriod.filter(isLectureIncome), proj = inPeriod.filter(isProjectIncome);
  const other = inPeriod.filter(t => t.type === '수입' && !isLectureIncome(t) && !isProjectIncome(t));
  const tot = a => a.reduce((s, t) => s + Number(t.amount), 0);
  const group = (arr, keyFn) => { const g = {}; arr.forEach(t => { const k = keyFn(t); (g[k] = g[k] || { sum: 0, n: 0, last: '' }); g[k].sum += Number(t.amount); g[k].n++; if (t.date > g[k].last) g[k].last = t.date; }); return Object.entries(g).sort((a, b) => b[1].sum - a[1].sum); };
  const seg = `<div class="seg" role="group" aria-label="기간" style="margin-bottom:14px">${[['year', y + '년 누적'], ['month', monthTitle()]].map(([k, l]) => `<button data-iperiod="${k}" aria-pressed="${per === k}">${l}</button>`).join('')}</div>`;
  const rowsOf = (arr, attr, icon, color, max) => arr.map(([k, v]) => `<button class="catbar" data-${attr}="${esc(k)}">
      <span class="ico" style="background:${color}1F">${icon}</span>
      <span class="row-main"><span class="top-line"><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(k)}</span><span class="num">${wonU(v.sum)}</span></span>
      <span class="track"><i style="width:${Math.max(3, v.sum / max * 100)}%;background:${color}"></i></span>
      <span class="row-sub">${v.n}회 입금 · 최근 ${Number(v.last.slice(5, 7))}월 ${Number(v.last.slice(8))}일</span></span></button>`).join('');
  const L = tot(lect), P = tot(proj), O = tot(other), T = L + P + O;
  const showL = book !== '사업', showP = book !== '개인';
  const share = (v) => T ? Math.round(v / T * 100) : 0;
  const summary = `<section class="card"><h2>${periodLabel} 들어온 돈</h2>${seg}
    <div class="hero-amt num" style="margin-top:0">${won(book === '사업' ? P : book === '개인' ? L + O : T)}<small>원</small></div>
    ${T ? `<div class="pace" style="margin:14px 0 8px;display:flex;overflow:hidden">${showL && L ? `<i style="display:block;height:100%;width:${share(L)}%;background:var(--blue)"></i>` : ''}${showP && P ? `<i style="display:block;height:100%;width:${share(P)}%;background:#8B5CF6"></i>` : ''}${O && book !== '사업' ? `<i style="display:block;height:100%;width:${share(O)}%;background:var(--faint)"></i>` : ''}</div>` : ''}
    <div class="hero-split">${showL ? `<div class="mini"><span>강의 수입</span><b class="num" style="color:var(--blue)">${wonU(L)}</b></div>` : ''}${showP ? `<div class="mini"><span>프로젝트 수입</span><b class="num" style="color:#8B5CF6">${wonU(P)}</b></div>` : ''}${book !== '사업' && O ? `<div class="mini"><span>기타 수입</span><b class="num">${wonU(O)}</b></div>` : ''}</div></section>`;
  const lg = group(lect, t => uniOf(t.title) || '기타 강의'), pg = group(proj, clientOf);
  const lCard = showL ? `<section class="card"><h2>대학별 강의 수입</h2>${lg.length ? rowsOf(lg, 'uni', '🎓', '#3182F6', lg[0][1].sum) : `<p class="help" style="margin:0">아직 강의 수입이 없어요. 입금자명에 대학 이름이 있으면 자동으로 대학별로 모아요. 직접 입력할 땐 '수원대 강의료 120만'처럼 적어 주세요.</p>`}</section>` : '';
  const pCard = showP ? `<section class="card"><h2>프로젝트 수입</h2>${pg.length ? rowsOf(pg, 'client', '🎨', '#8B5CF6', pg[0][1].sum) : `<p class="help" style="margin:0">사업 장부의 수입이 거래처별로 모여요. '사업 OO브랜딩 잔금 300만'처럼 입력하면 바로 반영돼요.</p>`}</section>` : '';
  // 월별 추이 (올해)
  const months = []; for (let i = 5; i >= 0; i--) months.push(addMonth(S.ym, -i));
  const ser = months.map(ym => { const l = inMonth(txs(), ym); return { ym, L: tot(l.filter(isLectureIncome)), P: tot(l.filter(isProjectIncome)) }; });
  const mx = Math.max(1, ...ser.map(s => (showL ? s.L : 0) + (showP ? s.P : 0)));
  const trend = (L + P) || ser.some(s => s.L || s.P) ? `<section class="card"><h2>월별 수입 흐름</h2><div class="bars">${ser.map(s => `<div class="bar-col ${s.ym === S.ym ? 'now' : ''}"><div class="bar-pair" style="flex-direction:column;justify-content:flex-end;align-items:center;gap:2px">${showP ? `<i style="height:${s.P / mx * 100}%;width:22px;background:#8B5CF6" title="프로젝트 ${wonU(s.P)}"></i>` : ''}${showL ? `<i style="height:${s.L / mx * 100}%;width:22px;background:var(--blue)" title="강의 ${wonU(s.L)}"></i>` : ''}</div><span>${Number(s.ym.slice(5))}월</span></div>`).join('')}</div>
    <div class="legend">${showL ? '<span><i style="background:var(--blue)"></i>강의</span>' : ''}${showP ? '<span><i style="background:#8B5CF6"></i>프로젝트</span>' : ''}</div></section>` : '';
  const incAll = inPeriod.filter(t => t.type === '수입' && (book === '전체' || t.book === book));
  const ag = group(incAll, t => t.method || '미지정');
  const aCard = ag.length > 1 ? `<section class="card"><h2>계좌별 입금</h2>${rowsOf(ag, 'acct', '🏦', '#00A661', ag[0][1].sum)}</section>` : '';
  return summary + lCard + pCard + aCard + trend;
}

/* 설정 */
function viewSettings() {
  const s = settings();
  const sheetUrl = 'https://docs.google.com/spreadsheets/d/1WNGffKjEIVfy0jBfaH6SDOOt6Zch1bKjNBXhOVM9GSw/edit';
  return `<section class="card"><h2>예산</h2>
      <button class="set-row" data-budget="개인"><b style="font-weight:600">개인 월 예산</b><span class="num">${wonU(Number(s['개인 월예산']) || 0)}</span></button>
      <button class="set-row" data-budget="사업"><b style="font-weight:600">사업 경비 월 예산</b><span class="num">${wonU(Number(s['사업 월예산']) || 0)}</span></button>
      <p class="help" style="margin:8px 0 0">카테고리별 예산은 시트의 '카테고리' 탭 월예산 칸에서 바꿀 수 있어요.</p></section>
    <section class="card"><h2>내역 가져오기</h2>
      <p class="help">카드 문자나 토스 알림을 붙여 넣거나, 토스뱅크·삼성카드에서 내려받은 거래내역 파일을 올리면 한 번에 정리해요. 이미 있는 내역은 건너뛰어요.</p>
      <div class="btn-row"><button class="btn ghost" data-act="paste">문자 붙여넣기</button><button class="btn ghost" data-act="file">파일 올리기</button></div></section>
    <section class="card"><h2>연결</h2>
      <a class="set-row" href="${sheetUrl}" target="_blank" rel="noopener" style="color:inherit;text-decoration:none"><b style="font-weight:600">Google 시트 열기</b><span>Jay 가계부</span></a>
      ${isDemo() ? '' : `<button class="set-row" data-act="sync"><b style="font-weight:600">지금 동기화</b><span>${S.lastSync ? fmtTime(S.lastSync) + ' 맞춤' : ''}</span></button>`}
      <button class="set-row" data-act="theme"><b style="font-weight:600">화면 모드</b><span>${{ auto: '시스템 설정', light: '라이트', dark: '다크' }[S.ui.theme || 'auto']}</span></button>
      <button class="set-row" data-act="logout"><b style="font-weight:600;color:var(--red)">${isDemo() ? '둘러보기 끝내고 연결하기' : '이 기기에서 연결 해제'}</b><span></span></button></section>`;
}

/* 연결 화면 */
function viewOnboard() {
  return `<div class="onboard">
    <h1>시트와 연결하면<br>어디서든 가계부를 쓸 수 있어요</h1>
    <p>Apps Script로 배포한 웹앱 주소와 PIN을 입력해 주세요. 이 정보는 지금 쓰는 기기에만 저장돼요.</p>
    <form id="onForm" autocomplete="off">
      <label class="field"><span>웹앱 주소</span><input class="input" id="onUrl" inputmode="url" placeholder="https://script.google.com/macros/s/…/exec" required></label>
      <label class="field"><span>PIN</span><input class="input" id="onPin" type="password" inputmode="numeric" placeholder="숫자 4~8자리" required></label>
      <div class="sync warn" id="onErr" style="margin:-4px 0 12px"></div>
      <button class="btn" id="onBtn">연결하기</button>
    </form>
    <button class="btn ghost" id="demoBtn" style="margin-top:10px">예시 데이터로 둘러보기</button>
  </div>`;
}
function bindOnboard() {
  const p = new URLSearchParams(location.hash.slice(1));
  if (p.get('u')) $('#onUrl').value = p.get('u');
  $('#onForm').onsubmit = async e => {
    e.preventDefault();
    const url = $('#onUrl').value.trim(), pin = $('#onPin').value.trim();
    if (!/^https:\/\/script\.google(usercontent)?\.com\//.test(url)) { $('#onErr').textContent = 'script.google.com으로 시작하는 웹앱 주소를 넣어 주세요.'; return; }
    $('#onBtn').disabled = true; $('#onBtn').textContent = '확인하는 중…';
    S.cfg = { url, pin };
    try { await api('ping'); LS.set(K.cfg, S.cfg); history.replaceState(null, '', location.pathname); S.data = null; S.ui.tab = 'home'; render(); pull(); }
    catch (err) { S.cfg = null; $('#onErr').textContent = err.message === 'unauthorized' ? 'PIN이 맞지 않아요.' : '웹앱에 연결하지 못했어요. 배포 시 액세스 권한을 "모든 사용자"로 했는지 확인해 주세요.'; $('#onBtn').disabled = false; $('#onBtn').textContent = '연결하기'; }
  };
  $('#demoBtn').onclick = () => { S.cfg = { demo: true }; LS.set(K.cfg, S.cfg); S.data = demoData(); persist(); render(); };
}

/* ───────────────────────── 이벤트 ───────────────────────── */
function saveUI() { LS.set(K.ui, S.ui); }
function bindMain() {
  document.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { S.ui.tab = b.dataset.tab; saveUI(); render(); window.scrollTo(0, 0); });
  document.querySelectorAll('[data-book]').forEach(b => b.onclick = () => { S.ui.book = b.dataset.book; saveUI(); render(); });
  document.querySelectorAll('[data-id]').forEach(b => b.onclick = () => openSheet(txs().find(t => t.id === b.dataset.id)));
  document.querySelectorAll('[data-cat]').forEach(b => b.onclick = () => { S.filter = { type: '지출', q: '', method: '', cat: b.dataset.cat }; S.ui.tab = 'list'; render(); });
  const on = (sel, fn) => { const el = document.querySelector(sel); if (el) el.onclick = fn; };
  on('[data-act="prev"]', () => { S.ym = addMonth(S.ym, -1); render(); });
  on('[data-act="next"]', () => { if (S.ym < today().slice(0, 7)) { S.ym = addMonth(S.ym, 1); render(); } });
  on('[data-act="add"]', () => openSheet());
  on('[data-act="paste"]', openPaste);
  on('[data-act="file"]', () => $('#fileIn').click());
  on('[data-act="sync"]', () => pull());
  on('[data-act="theme"]', () => { const order = ['auto', 'light', 'dark']; S.ui.theme = order[(order.indexOf(S.ui.theme || 'auto') + 1) % 3]; saveUI(); applyTheme(); render(); });
  on('[data-act="logout"]', () => { if (!isDemo() && !confirm('이 기기에서 연결을 해제할까요? 시트의 데이터는 그대로 남아요.')) return; S.cfg = null; S.data = null; S.queue = []; LS.del(K.cfg); LS.del(K.cache); LS.del(K.queue); render(); });
  document.querySelectorAll('[data-budget]').forEach(b => b.onclick = () => openBudget(b.dataset.budget));
  document.querySelectorAll('[data-ftype]').forEach(b => b.onclick = () => { S.filter.type = b.dataset.ftype; render(); });
  document.querySelectorAll('[data-fmethod]').forEach(b => b.onclick = () => { S.filter.method = S.filter.method === b.dataset.fmethod ? '' : b.dataset.fmethod; render(); });
  document.querySelectorAll('[data-fcat]').forEach(b => b.onclick = () => { S.filter.cat = ''; S.filter.uni = ''; S.filter.client = ''; S.filter.acct = ''; render(); });
  document.querySelectorAll('[data-uni]').forEach(b => b.onclick = () => { S.filter = { type: '수입', q: '', method: '', uni: b.dataset.uni }; S.ui.tab = 'list'; render(); window.scrollTo(0, 0); });
  document.querySelectorAll('[data-client]').forEach(b => b.onclick = () => { S.filter = { type: '수입', q: '', method: '', client: b.dataset.client }; S.ui.tab = 'list'; render(); window.scrollTo(0, 0); });
  document.querySelectorAll('[data-acct]').forEach(b => b.onclick = () => { S.filter = { type: '수입', q: '', method: '', acct: b.dataset.acct }; S.ui.tab = 'list'; render(); window.scrollTo(0, 0); });
  document.querySelectorAll('[data-iperiod]').forEach(b => b.onclick = () => { S.ui.iperiod = b.dataset.iperiod; saveUI(); render(); });
  const q = $('#q'); if (q) q.oninput = () => { S.filter.q = q.value; const pos = q.selectionStart; render(); const n = $('#q'); n.focus(); n.setSelectionRange(pos, pos); };
  const qf = $('#quickForm');
  if (qf) {
    const qi = $('#quickIn'), qp = $('#quickPrev');
    qi.oninput = () => {
      const v = qi.value.trim(); if (!v) { qp.textContent = ''; return; }
      const p = parseQuick(v);
      qp.textContent = p.amount ? `${p.date === today() ? '오늘' : dayLabel(p.date)}  ${p.type}  ${p.type !== '이체' ? p.book + '  ' : ''}${p.category}  ${p.method}  ${wonU(p.amount)}` : '금액을 함께 적어 주세요';
    };
    qf.onsubmit = e => {
      e.preventDefault(); const v = qi.value.trim(); if (!v) return;
      if (/승인|\[Web발신\]|결제\s*\|/.test(v) || /원/.test(v) && /\d{1,2}\/\d{1,2}\s+\d{1,2}:\d{2}/.test(v)) { const items = parseMessages(v); if (items.length) { items.forEach(t => addTx(t, { silent: true })); toast(items.length + '건 저장했어요'); qi.value = ''; qp.textContent = ''; return; } }
      const p = parseQuick(v);
      if (!p.amount) { qp.textContent = '금액을 함께 적어 주세요. 예) 점심 12000'; return; }
      haptic(); addTx(Object.assign(p, { title: p.title || p.category })); qi.value = ''; qp.textContent = '';
    };
  }
}

/* ───────────────────────── 바텀시트 ───────────────────────── */
let sheetState = null, sheetKeyHandler = null;
function showSheet() { $('#dim').classList.add('on'); $('#sheet').classList.add('on'); document.body.style.overflow = 'hidden'; }
function closeSheet() { $('#dim').classList.remove('on'); $('#sheet').classList.remove('on'); document.body.style.overflow = ''; sheetState = null; if (sheetKeyHandler) { document.removeEventListener('keydown', sheetKeyHandler); sheetKeyHandler = null; } }
$('#dim').onclick = closeSheet;

function openSheet(tx) {
  const editing = !!tx;
  const defBook = S.ui.book === '사업' ? '사업' : '개인';
  sheetState = editing ? Object.assign({}, tx) : { id: uid(), type: '지출', book: defBook, amount: 0, category: '', title: '', method: lastMethod() || (defBook === '사업' ? '사업자 계좌' : '삼성카드'), date: today(), time: fmtTime(new Date()), memo: '', source: '수동' };
  sheetState.amountStr = sheetState.amount ? String(sheetState.amount) : '';
  sheetState.editing = editing;
  if (!sheetState.category) sheetState.category = guessCategory('', sheetState.type, sheetState.book);
  drawSheet();
  showSheet();
  sheetKeyHandler = e => {
    if (!sheetState || sheetState.mode) return;
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea') { if (e.key === 'Enter' && tag === 'input') { e.preventDefault(); saveSheet(); } return; }
    if (/^\d$/.test(e.key)) { padPress(e.key); e.preventDefault(); }
    else if (e.key === 'Backspace') { padPress('del'); e.preventDefault(); }
    else if (e.key === 'Enter') { saveSheet(); e.preventDefault(); }
    else if (e.key === 'Escape') closeSheet();
  };
  document.addEventListener('keydown', sheetKeyHandler);
}
function usage(name, book) { return txs().filter(t => t.category === name && t.book === book).length; }
function drawSheet() {
  const st = sheetState;
  const list = cats().filter(c => c.type === st.type && (st.type === '이체' ? true : c.book === st.book));
  const sorted = [...list].sort((a, b) => usage(b.name, b.book) - usage(a.name, a.book));
  const titles = [...new Set(txs().slice(-300).map(t => t.title).filter(Boolean))].reverse().slice(0, 80);
  const amt = Number(st.amountStr || 0);
  const y = new Date(); y.setDate(y.getDate() - 1);
  $('#sheetBody').innerHTML = `
    <div class="sheet-head"><h3>${st.editing ? '내역 수정' : '새 내역'}</h3><button class="x" data-s="close" aria-label="닫기">${ICON.x}</button></div>
    <div class="seg" role="group" aria-label="구분">${['지출', '수입', '이체'].map(t => `<button data-stype="${t}" aria-pressed="${st.type === t}">${t}</button>`).join('')}</div>
    <div class="amt-display num ${amt ? '' : 'empty'}" id="amtDisp" aria-live="polite">${amt ? won(amt) : '얼마를 ' + (st.type === '수입' ? '받았나요' : st.type === '이체' ? '옮겼나요' : '썼나요')}${amt ? '<span>원</span>' : ''}<span class="caret"></span></div>
    <div class="amt-hint num" id="amtHint">${amt >= 10000 ? korWon(amt) : ''}</div>
    <div class="quick-amts">${[1000, 5000, 10000, 50000, 100000].map(v => `<button data-qa="${v}">+${shortWon(v)}</button>`).join('')}</div>
    <div class="pad num">${['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0', 'del'].map(k => `<button data-k="${k}" aria-label="${k === 'del' ? '지우기' : k}">${k === 'del' ? '⌫' : k}</button>`).join('')}</div>
    ${st.type !== '이체' ? `<div class="label">장부</div><div class="seg" role="group">${['개인', '사업'].map(b => `<button data-sbook="${b}" aria-pressed="${st.book === b}">${b === '사업' ? '사업 (리얼타임웍스)' : '개인'}</button>`).join('')}</div>` : ''}
    <div class="label">카테고리</div>
    <div class="cat-grid">${sorted.map(c => `<button class="cat-btn" data-scat="${esc(c.name)}" aria-pressed="${st.category === c.name}"><span class="e">${c.icon}</span>${esc(c.name)}</button>`).join('')}</div>
    <div class="label">내용</div>
    <input class="input" id="sTitle" list="titleList" placeholder="${st.type === '수입' ? '예) 10월 강의료' : '예) 스타벅스 해운대'}" value="${esc(st.title)}" autocomplete="off">
    <datalist id="titleList">${titles.map(t => `<option value="${esc(t)}">`).join('')}</datalist>
    <div class="label">결제수단</div>
    <div class="chips">${methods().map(m => `<button class="chip" data-smethod="${esc(m.name)}" aria-pressed="${st.method === m.name}">${esc(m.name)}</button>`).join('')}</div>
    <div class="label">날짜</div>
    <div class="chips">
      <button class="chip" data-sdate="${today()}" aria-pressed="${st.date === today()}">오늘</button>
      <button class="chip" data-sdate="${fmtDate(y)}" aria-pressed="${st.date === fmtDate(y)}">어제</button>
      <span class="chip date-in" aria-pressed="${st.date !== today() && st.date !== fmtDate(y)}" style="display:inline-flex;align-items:center">${st.date !== today() && st.date !== fmtDate(y) ? dayLabel(st.date) : '다른 날'}<input type="date" id="sDate" value="${st.date}" max="${today()}" aria-label="날짜 선택"></span>
    </div>
    <div class="label">메모</div>
    <input class="input" id="sMemo" placeholder="필요할 때만 적어 주세요" value="${esc(st.memo)}">`;
  $('#sheetFoot').innerHTML = st.editing
    ? `<div class="btn-row"><button class="btn danger" style="flex:0 0 96px" data-s="del">삭제</button><button class="btn" data-s="save" ${amt ? '' : 'disabled'}>저장</button></div>`
    : `<button class="btn" data-s="save" ${amt ? '' : 'disabled'}>${amt ? wonU(amt) + ' 저장' : '금액을 입력해 주세요'}</button>`;
  bindSheet();
}
function korWon(n) {
  const eok = Math.floor(n / 1e8), man = Math.floor(n % 1e8 / 1e4), rest = n % 1e4;
  return [eok ? eok + '억' : '', man ? won(man) + '만' : '', rest ? won(rest) : ''].filter(Boolean).join(' ') + '원';
}
function refreshAmt() {
  const st = sheetState, amt = Number(st.amountStr || 0);
  const d = $('#amtDisp');
  d.className = 'amt-display num ' + (amt ? '' : 'empty');
  d.innerHTML = (amt ? won(amt) + '<span>원</span>' : '얼마를 ' + (st.type === '수입' ? '받았나요' : st.type === '이체' ? '옮겼나요' : '썼나요')) + '<span class="caret"></span>';
  $('#amtHint').textContent = amt >= 10000 ? korWon(amt) : '';
  const sb = document.querySelector('[data-s="save"]');
  sb.disabled = !amt;
  if (!st.editing) sb.textContent = amt ? wonU(amt) + ' 저장' : '금액을 입력해 주세요';
}
function padPress(k) {
  const st = sheetState; let s = st.amountStr || '';
  if (k === 'del') s = s.slice(0, -1);
  else if (s.length < 11) s = (s + k).replace(/^0+/, '');
  st.amountStr = s; haptic(); refreshAmt();
}
function bindSheet() {
  const st = sheetState;
  const body = $('#sheet');
  body.querySelectorAll('[data-k]').forEach(b => b.onclick = () => padPress(b.dataset.k));
  body.querySelectorAll('[data-qa]').forEach(b => b.onclick = () => { st.amountStr = String(Number(st.amountStr || 0) + Number(b.dataset.qa)); haptic(); refreshAmt(); });
  body.querySelectorAll('[data-stype]').forEach(b => b.onclick = () => { syncInputs(); st.type = b.dataset.stype; if (st.type === '이체') st.book = '공통'; else if (st.book === '공통') st.book = S.ui.book === '사업' ? '사업' : '개인'; st.category = guessCategory(st.title, st.type, st.book); drawSheet(); });
  body.querySelectorAll('[data-sbook]').forEach(b => b.onclick = () => { syncInputs(); st.book = b.dataset.sbook; st.category = guessCategory(st.title, st.type, st.book); if (st.book === '사업' && st.method === '삼성카드' && methods().some(m => m.name === '사업자 계좌')) {} drawSheet(); });
  body.querySelectorAll('[data-scat]').forEach(b => b.onclick = () => { st.category = b.dataset.scat; body.querySelectorAll('[data-scat]').forEach(x => x.setAttribute('aria-pressed', x === b)); haptic(); });
  body.querySelectorAll('[data-smethod]').forEach(b => b.onclick = () => { st.method = b.dataset.smethod; body.querySelectorAll('[data-smethod]').forEach(x => x.setAttribute('aria-pressed', x === b)); });
  body.querySelectorAll('[data-sdate]').forEach(b => b.onclick = () => { syncInputs(); st.date = b.dataset.sdate; if (st.date !== today()) st.time = st.time && st.editing ? st.time : ''; drawSheet(); });
  const sd = $('#sDate'); if (sd) sd.onchange = () => { if (sd.value) { syncInputs(); st.date = sd.value; drawSheet(); } };
  const ti = $('#sTitle');
  ti.onchange = () => {
    st.title = ti.value.trim();
    const h = lastByTitle(st.title);
    if (h) {
      if (h.type === st.type && (h.book === st.book || st.type === '이체')) st.category = h.category;
      if (h.method) st.method = h.method;
      if (!st.amountStr && h.amount) st.amountStr = String(h.amount);
      drawSheet();
    } else {
      const g = guessCategory(st.title, st.type, st.book);
      if (g) { st.category = g; body.querySelectorAll('[data-scat]').forEach(x => x.setAttribute('aria-pressed', x.dataset.scat === g)); }
    }
  };
  $('#amtDisp').onclick = () => { document.activeElement && document.activeElement.blur(); };
  body.querySelector('[data-s="close"]').onclick = closeSheet;
  const del = body.querySelector('[data-s="del"]'); if (del) del.onclick = () => { const id = st.id; closeSheet(); delTx(id); };
  body.querySelector('[data-s="save"]').onclick = saveSheet;
}
function syncInputs() { const st = sheetState; if (!st) return; const ti = $('#sTitle'), me = $('#sMemo'); if (ti) st.title = ti.value.trim(); if (me) st.memo = me.value.trim(); }
function saveSheet() {
  const st = sheetState; if (!st) return;
  syncInputs();
  const amount = Number(st.amountStr || 0); if (!amount) return;
  const t = { id: st.id, date: st.date, time: st.time || '', type: st.type, book: st.type === '이체' ? '공통' : st.book, category: st.category || guessCategory(st.title, st.type, st.book), title: st.title || st.category, amount, method: st.method, memo: st.memo, source: st.source || '수동' };
  const editing = st.editing;
  closeSheet(); haptic();
  if (editing) updateTx(t); else addTx(t);
}

/* 예산 입력 시트 */
function openBudget(book) {
  const key = book + ' 월예산';
  sheetState = { mode: 'budget', amountStr: String(Number(settings()[key]) || ''), editing: true, type: '지출' };
  $('#sheetBody').innerHTML = `<div class="sheet-head"><h3>${book === '사업' ? '사업 경비' : '개인'} 월 예산</h3><button class="x" data-s="close" aria-label="닫기">${ICON.x}</button></div>
    <div class="amt-display num" id="amtDisp"></div><div class="amt-hint num" id="amtHint"></div>
    <div class="quick-amts">${[100000, 500000, 1000000].map(v => `<button data-qa="${v}">+${shortWon(v)}</button>`).join('')}<button data-qa="0">초기화</button></div>
    <div class="pad num">${['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0', 'del'].map(k => `<button data-k="${k}">${k === 'del' ? '⌫' : k}</button>`).join('')}</div>`;
  $('#sheetFoot').innerHTML = `<button class="btn" data-s="save">저장</button>`;
  const st = sheetState;
  const draw = () => { const a = Number(st.amountStr || 0); $('#amtDisp').innerHTML = won(a) + '<span>원</span><span class="caret"></span>'; $('#amtHint').textContent = a >= 10000 ? korWon(a) : ''; };
  draw();
  $('#sheet').querySelectorAll('[data-k]').forEach(b => b.onclick = () => { let s = st.amountStr || ''; s = b.dataset.k === 'del' ? s.slice(0, -1) : (s + b.dataset.k).replace(/^0+/, ''); st.amountStr = s.slice(0, 11); draw(); });
  $('#sheet').querySelectorAll('[data-qa]').forEach(b => b.onclick = () => { st.amountStr = b.dataset.qa === '0' ? '' : String(Number(st.amountStr || 0) + Number(b.dataset.qa)); draw(); });
  $('#sheet').querySelector('[data-s="close"]').onclick = closeSheet;
  $('#sheet').querySelector('[data-s="save"]').onclick = () => {
    const amount = Number(st.amountStr || 0);
    S.data.settings[key] = amount; persist(); closeSheet(); render();
    mutate('setBudget', { book, amount }); toast('예산을 바꿨어요');
  };
  showSheet();
}

/* 가져오기 미리보기 */
function openImport(items, title) {
  sheetState = { mode: 'import', items, book: '개인' };
  const dup = new Set(txs().map(t => [t.date, t.amount, (t.title || '').trim(), t.method].join('|')));
  const st = sheetState;
  const draw = () => {
    const fresh = st.items.filter(t => !dup.has([t.date, t.amount, t.title.trim(), t.method].join('|')));
    const exp = fresh.filter(t => t.type === '지출').reduce((s, t) => s + t.amount, 0);
    $('#sheetBody').innerHTML = `<div class="sheet-head"><h3>${esc(title)}</h3><button class="x" data-s="close" aria-label="닫기">${ICON.x}</button></div>
      <p class="help">${st.items.length}건을 찾았어요. ${st.items.length - fresh.length ? (st.items.length - fresh.length) + '건은 이미 있어서 건너뛰어요. ' : ''}카테고리는 저장한 뒤에도 눌러서 바꿀 수 있어요.</p>
      <div class="label" style="margin-top:0">어느 장부에 넣을까요</div>
      <div class="seg" role="group">${['개인', '사업'].map(b => `<button data-ibook="${b}" aria-pressed="${st.book === b}">${b}</button>`).join('')}</div>
      <div class="label">미리보기</div>
      <div class="import-preview">${fresh.slice(0, 60).map(t => { const c = catOf(t); return `<div class="row" style="pointer-events:none"><span class="ico" style="background:${c.color}1F">${c.icon}</span><span class="row-main"><span class="row-title">${esc(t.title)}</span><span class="row-sub">${esc(t.date.slice(5).replace('-', '.') + '  ' + t.category + '  ' + t.method)}</span></span><span class="row-amt num ${t.type === '수입' ? 'in' : t.type === '이체' ? 'tr' : ''}">${t.type === '수입' ? '+' : t.type === '이체' ? '' : '−'}${wonU(t.amount)}</span></div>`; }).join('')}${fresh.length > 60 ? `<p class="help">외 ${fresh.length - 60}건</p>` : ''}</div>`;
    $('#sheetFoot').innerHTML = `<button class="btn" data-s="save" ${fresh.length ? '' : 'disabled'}>${fresh.length ? fresh.length + '건 저장' + (exp ? ' (지출 ' + shortWon(exp) + '원)' : '') : '새로 저장할 내역이 없어요'}</button>`;
    $('#sheet').querySelector('[data-s="close"]').onclick = closeSheet;
    $('#sheet').querySelectorAll('[data-ibook]').forEach(b => b.onclick = () => {
      st.book = b.dataset.ibook;
      st.items.forEach(t => { if (t.type !== '이체') { t.book = st.book; t.category = guessCategory(t.title, t.type, t.book); } });
      draw();
    });
    $('#sheet').querySelector('[data-s="save"]').onclick = () => {
      fresh.forEach(t => S.data.txs.push(t)); persist(); closeSheet(); render();
      mutate('bulkAdd', { txs: fresh }); toast(fresh.length + '건 저장했어요');
    };
  };
  draw(); showSheet();
}
function openPaste() {
  sheetState = { mode: 'paste' };
  $('#sheetBody').innerHTML = `<div class="sheet-head"><h3>문자 붙여넣기</h3><button class="x" data-s="close" aria-label="닫기">${ICON.x}</button></div>
    <p class="help">삼성카드 승인 문자나 토스 알림을 여러 개 한꺼번에 붙여 넣어도 돼요. 문자 사이는 빈 줄로 구분해 주세요.</p>
    <textarea class="input" id="pasteIn" placeholder="[Web발신]&#10;삼성1234승인 전*재&#10;12,000원 일시불&#10;10/24 12:31 해운대국밥&#10;누적512,300원"></textarea>`;
  $('#sheetFoot').innerHTML = `<button class="btn" data-s="save">내역 찾기</button>`;
  $('#sheet').querySelector('[data-s="close"]').onclick = closeSheet;
  $('#sheet').querySelector('[data-s="save"]').onclick = () => {
    const items = parseMessages($('#pasteIn').value);
    if (!items.length) { toast('금액이 들어 있는 문자를 찾지 못했어요'); return; }
    openImport(items, '문자에서 찾은 내역');
  };
  showSheet();
  setTimeout(() => $('#pasteIn').focus(), 300);
}
$('#fileIn').onchange = async e => {
  const f = e.target.files[0]; e.target.value = '';
  if (!f) return;
  try {
    let rows;
    if (/\.csv$/i.test(f.name)) {
      const buf = await f.arrayBuffer();
      let text = new TextDecoder('utf-8').decode(buf);
      if (text.includes('�')) text = new TextDecoder('euc-kr').decode(buf);
      rows = parseCSV(text.replace(/^﻿/, ''));
    } else {
      if (!window.XLSX) { toast('엑셀 읽기 도구를 불러오는 중이에요. 잠시 후 다시 시도해 주세요'); return; }
      const wb = XLSX.read(await f.arrayBuffer(), { type: 'array', cellDates: true });
      rows = []; wb.SheetNames.forEach(n => { rows = rows.concat(XLSX.utils.sheet_to_json(wb.Sheets[n], { header: 1, raw: true, defval: '' })); });
    }
    const r = analyzeTable(rows);
    if (r.error) { toast(r.error); return; }
    if (!r.items.length) { toast('가져올 거래를 찾지 못했어요'); return; }
    openImport(r.items, r.source + ' 내역 ' + r.items.length + '건');
  } catch (err) { toast('파일을 읽지 못했어요. CSV나 엑셀 파일인지 확인해 주세요'); }
};
function openAutoGuide() {
  sheetState = { mode: 'guide' };
  const body = JSON.stringify({ pin: 'PIN', action: 'ingest', text: '문자 내용' });
  $('#sheetBody').innerHTML = `<div class="sheet-head"><h3>결제 알림 자동 기록</h3><button class="x" data-s="close" aria-label="닫기">${ICON.x}</button></div>
    <div class="label" style="margin-top:0">아이폰 단축어</div>
    <ol class="steps"><li>단축어 앱 → 자동화 → 새로운 자동화 → 메시지</li><li>보낸 사람에 삼성카드(15888900), 메시지 포함 '승인' 지정, 즉시 실행 켜기</li><li>동작 'URL 콘텐츠 가져오기' 추가 → 아래 주소, 방법 POST, 본문 JSON</li><li>본문 항목: <code>pin</code> = 내 PIN, <code>action</code> = ingest, <code>text</code> = 단축어 입력(메시지)</li></ol>
    <div class="label">보낼 주소</div>
    <input class="input" readonly value="${esc(S.cfg.url)}" onclick="this.select()">
    <div class="label">본문 형식</div>
    <input class="input" readonly value='${esc(body)}' onclick="this.select()">
    <p class="help" style="margin-top:14px">토스 앱 알림은 문자로 오지 않아서 자동화가 어려워요. 토스뱅크는 월 1회 거래내역 파일을 받아 '파일 올리기'로 넣는 방법이 가장 정확해요.</p>`;
  $('#sheetFoot').innerHTML = `<button class="btn ghost" data-s="close2">닫기</button>`;
  $('#sheet').querySelector('[data-s="close"]').onclick = closeSheet;
  $('#sheet').querySelector('[data-s="close2"]').onclick = closeSheet;
  showSheet();
}

/* ───────────────────────── 토스트 ───────────────────────── */
let toastTimer;
function toast(msg, undo) {
  const el = $('#toast'), btn = $('#toastBtn');
  $('#toastMsg').textContent = msg;
  btn.hidden = !undo;
  btn.onclick = () => { el.classList.remove('on'); undo && undo(); };
  el.classList.add('on');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('on'), undo ? 4500 : 2200);
}

/* ───────────────────────── 테마 ───────────────────────── */
function applyTheme() { const t = S.ui.theme || 'auto'; if (t === 'auto') document.documentElement.removeAttribute('data-theme'); else document.documentElement.setAttribute('data-theme', t); }

/* ───────────────────────── 둘러보기 데이터 ───────────────────────── */
function demoData() {
  const out = [], now = new Date();
  const P = [['해운대국밥', '식비', 9500, '삼성카드'], ['스타벅스 해운대', '카페·간식', 6300, '삼성카드'], ['카카오T', '교통', 12400, '삼성카드'], ['쿠팡', '쇼핑', 38900, '토스뱅크'], ['이마트 해운대', '생활·마트', 64200, '삼성카드'], ['넷플릭스', '구독', 13500, '삼성카드'], ['동물병원', '반려묘', 45000, '토스뱅크'], ['메가박스', '문화·여가', 15000, '삼성카드'], ['GS25', '생활·마트', 4300, '삼성카드'], ['초밥집 오늘', '식비', 28000, '삼성카드'], ['부산도시가스', '주거·통신', 41200, '토스뱅크']];
  const B = [['Adobe Creative Cloud', '소프트웨어·구독', 77000, '사업자 계좌'], ['Figma', '소프트웨어·구독', 22000, '사업자 계좌'], ['SRT 부산-수서', '교통·출장', 52600, '삼성카드'], ['클라이언트 미팅', '접대·회의', 46000, '삼성카드'], ['모니터 캘리브레이터', '장비·소모품', 189000, '사업자 계좌']];
  let seed = 7; const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  for (let mBack = 5; mBack >= 0; mBack--) {
    const base = new Date(now.getFullYear(), now.getMonth() - mBack, 1);
    const lastDay = mBack === 0 ? now.getDate() : new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
    for (let d = 1; d <= lastDay; d++) {
      const date = fmtDate(new Date(base.getFullYear(), base.getMonth(), d));
      const n = rnd() < .3 ? 0 : rnd() < .6 ? 1 : 2;
      for (let i = 0; i < n; i++) { const p = P[Math.floor(rnd() * P.length)]; out.push({ id: uid(), date, time: String(9 + Math.floor(rnd() * 12)).padStart(2, '0') + ':' + String(Math.floor(rnd() * 60)).padStart(2, '0'), type: '지출', book: '개인', category: p[1], title: p[0], amount: Math.round(p[2] * (0.8 + rnd() * 0.5) / 100) * 100, method: p[3], memo: '', source: '수동' }); }
      if (d === 3) B.slice(0, 2).forEach(b => out.push({ id: uid(), date, time: '09:00', type: '지출', book: '사업', category: b[1], title: b[0], amount: b[2], method: b[3], memo: '', source: '수동' }));
      if (d === 12 && rnd() < .7) { const b = B[2 + Math.floor(rnd() * 3)]; out.push({ id: uid(), date, time: '14:20', type: '지출', book: '사업', category: b[1], title: b[0], amount: b[2], method: b[3], memo: '', source: '수동' }); }
      if (d === 10) out.push({ id: uid(), date, time: '10:00', type: '수입', book: '개인', category: '급여·강의료', title: '강의료', amount: 1850000, method: '토스뱅크', memo: '', source: '수동' });
      if (d === 20 && rnd() < .8) out.push({ id: uid(), date, time: '15:00', type: '수입', book: '사업', category: '디자인 매출', title: '브랜딩 프로젝트 잔금', amount: Math.round((1.5 + rnd() * 3) * 10) * 100000, method: '사업자 계좌', memo: '', source: '수동' });
      if (d === 15) out.push({ id: uid(), date, time: '08:00', type: '이체', book: '공통', category: '카드대금', title: '삼성카드 결제대금', amount: 820000, method: '토스뱅크', memo: '', source: '수동' });
    }
  }
  return { txs: out, categories: DEFAULT_CATS, methods: DEFAULT_METHODS, settings: { '개인 월예산': 1500000, '사업 월예산': 500000, '월 시작일': 1 } };
}

/* ───────────────────────── 시작 ───────────────────────── */
applyTheme();
render();
if (S.cfg && !isDemo()) pull(!!S.data);
window.addEventListener('online', () => { if (S.cfg && !isDemo()) pull(true); });
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && S.cfg && !isDemo() && (!S.lastSync || Date.now() - S.lastSync > 60000)) pull(true); });
