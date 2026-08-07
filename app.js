const state={level:"ALL",query:"",learned:JSON.parse(localStorage.getItem("learnedWords")||"[]"),flashIndex:0};

const $=s=>document.querySelector(s);
const $$=s=>document.querySelectorAll(s);

function filteredWords(){
 return WORDS.filter(w=>(state.level==="ALL"||w.level===state.level)&&
 [w.word,w.kana,w.katakana,w.meaning].join(" ").toLowerCase().includes(state.query.toLowerCase()));
}
function renderWords(){
 const items=filteredWords(),grid=$("#wordGrid");
 grid.innerHTML=items.map(w=>`
 <article class="word-card ${state.learned.includes(w.word)?"learned":""}" data-word="${w.word}">
  <div class="card-head"><span class="pill">${w.level}</span><button class="learn-btn" title="標記為已學會">★</button></div>
  <div class="visual-box"><span>${w.visual}</span><small>${w.visualHint}</small></div>
  <div class="word-main"><h3>${w.word}</h3><span>${w.kana}</span></div>
  <div class="meaning">${w.meaning}</div>
  <div class="mini-sentence">${w.sentence}</div>
  <div class="hint"><span>${w.katakana}</span><span class="arrow">→</span></div>
 </article>`).join("");
 $("#emptyState").classList.toggle("hidden",items.length>0);
 $$(".word-card").forEach(card=>{
   card.addEventListener("click",e=>{
    if(e.target.classList.contains("learn-btn")){
      e.stopPropagation();toggleLearned(card.dataset.word);return;
    }
    openWord(card.dataset.word);
   })
 });
 updateProgress();
}
function toggleLearned(word){
 state.learned=state.learned.includes(word)?state.learned.filter(x=>x!==word):[...state.learned,word];
 localStorage.setItem("learnedWords",JSON.stringify(state.learned));renderWords();
}
function updateProgress(){
 $("#progressText").textContent=`已學會 ${state.learned.length} / ${WORDS.length}`;
 $("#progressBar").style.width=`${state.learned.length/WORDS.length*100}%`;
}
function openWord(word){
 const w=WORDS.find(x=>x.word===word);
 $("#dialogContent").innerHTML=`<div class="dialog-body">
  <div class="dialog-hero"><div class="dialog-visual">${w.visual}</div>
  <div class="dialog-title"><span class="pill">${w.level}</span><h2>${w.word}</h2>
  <div class="kana">${w.kana} ｜ ${w.katakana}</div><p class="meaning">${w.meaning}</p></div></div>
  <section class="info-section"><h4>字形拆解</h4><div class="breakdown">${w.parts.map(p=>`<div class="part"><b>${p[0]}</b>：${p[1]}</div>`).join("")}</div>
  <p class="nuance">${w.memory}</p></section>
  <section class="info-section"><h4>真正能用的日常例句</h4><div class="sentence-box"><p class="jp-line">${w.sentence}</p><p>${w.translation}</p></div></section>
  <section class="info-section"><h4>日文語感</h4><div class="feeling-note">${w.feeling}</div></section>
 </div>`;
 $("#wordDialog").showModal();
}
function renderGrammar(){
 $("#grammarGrid").innerHTML=GRAMMARS.map(g=>`<article class="grammar-card">
 <span class="pill">${g.level}</span><h3>${g.title}</h3><strong>${g.meaning}</strong>
 <div class="pattern">${g.pattern}</div>
 <div class="sentence-box"><p class="jp-line">${g.example}</p><p>${g.translation}</p></div>
 <h4>語感核心</h4><div class="feeling-note">${g.feeling}</div>
 <p class="compare"><b>比較理解：</b>${g.compare}</p></article>`).join("");
}
function renderFlash(){
 const w=WORDS[state.flashIndex%WORDS.length];
 $("#flashLevel").textContent=w.level;$("#flashVisual").textContent=w.visual;
 $("#flashWord").textContent=w.word;$("#flashKana").textContent=`${w.kana} ｜ ${w.katakana}`;
 $("#flashMeaning").textContent=w.meaning;$("#flashSentence").textContent=w.sentence;
 $("#flashTranslation").textContent=w.translation;$("#flashFeeling").textContent=w.feeling;
 $("#flashcard").classList.remove("flipped");
}
function nextFlash(){
 const card=$("#flashcard");
 if(!card.classList.contains("flipped"))card.classList.add("flipped");
 else{state.flashIndex=(state.flashIndex+1)%WORDS.length;renderFlash();}
}

$$(".level").forEach(btn=>btn.addEventListener("click",()=>{
 $$(".level").forEach(x=>x.classList.remove("active"));btn.classList.add("active");
 state.level=btn.dataset.level;renderWords();
}));
$("#searchInput").addEventListener("input",e=>{state.query=e.target.value;renderWords()});
$$(".nav-btn").forEach(btn=>btn.addEventListener("click",()=>{
 $$(".nav-btn").forEach(x=>x.classList.remove("active"));btn.classList.add("active");
 $$(".view").forEach(v=>v.classList.remove("active-view"));
 $(`#${btn.dataset.view}View`).classList.add("active-view");
}));
$("#dialogClose").onclick=()=>$("#wordDialog").close();
$("#wordDialog").addEventListener("click",e=>{if(e.target===$("#wordDialog"))$("#wordDialog").close()});
$("#themeBtn").onclick=()=>{
 document.body.classList.toggle("dark");
 localStorage.setItem("darkMode",document.body.classList.contains("dark"));
 $("#themeBtn").textContent=document.body.classList.contains("dark")?"☀":"☾";
};
if(localStorage.getItem("darkMode")==="true"){document.body.classList.add("dark");$("#themeBtn").textContent="☀"}
$("#flashcard").onclick=nextFlash;
$("#flashcard").addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();nextFlash()}});
$("#shuffleBtn").onclick=()=>{state.flashIndex=Math.floor(Math.random()*WORDS.length);renderFlash()};
renderWords();renderGrammar();renderFlash();


// ===== 個人資料庫與動漫收藏 =====
const customState={
  entries:JSON.parse(localStorage.getItem("customJapaneseEntries")||"[]"),
  type:"ALL",
  query:"",
  animeQuery:"",
  animeSeries:"ALL",
  animeStatus:"ALL",
  editingImage:"",
  reviewItems:[],
  reviewIndex:0
};

let cloudSyncTimer=null;
function saveCustomEntries(){
  localStorage.setItem("customJapaneseEntries",JSON.stringify(customState.entries));
  if(window.KotobaCloud?.user){
    clearTimeout(cloudSyncTimer);
    cloudSyncTimer=setTimeout(()=>window.KotobaCloud.syncEntries(customState.entries),350);
  }
}

function uid(){
  return "entry_"+Date.now()+"_"+Math.random().toString(36).slice(2,8);
}

function escapeHtml(value=""){
  return value.replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]));
}


function statusLabel(status){
  return {new:"新加入",learning:"學習中",mastered:"已熟悉",verify:"待確認"}[status]||"新加入";
}
function speakJapanese(text){
  if(!("speechSynthesis" in window)){alert("此瀏覽器不支援朗讀功能。");return;}
  speechSynthesis.cancel();
  const utterance=new SpeechSynthesisUtterance(text);
  utterance.lang="ja-JP";utterance.rate=.85;
  speechSynthesis.speak(utterance);
}
function compressImage(file,maxWidth=1400,quality=.78){
  return new Promise((resolve,reject)=>{
    const img=new Image(),reader=new FileReader();
    reader.onerror=reject;
    reader.onload=()=>img.src=reader.result;
    img.onerror=reject;
    img.onload=()=>{
      const scale=Math.min(1,maxWidth/img.width);
      const canvas=document.createElement("canvas");
      canvas.width=Math.round(img.width*scale);canvas.height=Math.round(img.height*scale);
      canvas.getContext("2d").drawImage(img,0,0,canvas.width,canvas.height);
      resolve(canvas.toDataURL("image/jpeg",quality));
    };
    reader.readAsDataURL(file);
  });
}

function entryCard(entry){
  const image=entry.image
    ? `<img src="${entry.image}" alt="${escapeHtml(entry.japanese)}">`
    : `<span>${entry.mode==="anime"?"🎬":entry.type==="sentence"?"💬":entry.type==="grammar"?"🧩":"📝"}</span>`;
  return `<article class="custom-entry-card" data-entry-id="${entry.id}">
    <div class="custom-entry-image">${image}</div>
    <div class="custom-entry-body">
      <div class="card-title-row">
        <div class="entry-meta">
          <span class="pill">${escapeHtml(entry.level||"未分類")}</span>
          <span class="pill">${entry.type==="word"?"單字":entry.type==="sentence"?"句子":"文法"}</span>
          <span class="status-badge status-${entry.status||"new"}">${statusLabel(entry.status)}</span>
          ${entry.character?`<span class="pill">${escapeHtml(entry.character)}</span>`:""}
        </div>
        <button class="favorite-btn ${entry.favorite?"active":""}" title="收藏">★</button>
      </div>
      <h3>${escapeHtml(entry.japanese)}</h3>
      <button class="speak-btn" data-speak="${escapeHtml(entry.japanese)}">🔊 朗讀</button>
      <div class="custom-kana">${escapeHtml(entry.hiragana||"")}${entry.katakana?` ｜ ${escapeHtml(entry.katakana)}`:""}</div>
      <div class="custom-chinese">${escapeHtml(entry.chinese)}</div>
      ${entry.example?`<div class="custom-example">${escapeHtml(entry.example)}</div>`:""}
      ${entry.feeling?`<div class="feeling-note" style="margin-top:12px">${escapeHtml(entry.feeling)}</div>`:""}
      ${entry.scene?`<p class="compare"><b>場景：</b>${escapeHtml(entry.scene)}</p>`:""}
      ${(entry.timestamp||entry.sourceUrl)?`<div class="source-meta">${entry.timestamp?`<span class="source-chip">⏱ ${escapeHtml(entry.timestamp)}</span>`:""}${entry.sourceUrl?`<a class="watch-link" href="${escapeHtml(buildWatchUrl(entry.sourceUrl,entry.timestamp))}" target="_blank" rel="noopener">▶ 前往觀看</a>`:""}</div>`:""}
      ${entry.tokens?.length?`<div class="token-analysis">${entry.tokens.map(t=>`<div class="token-chip"><b>${escapeHtml(t.surface)}</b><small>${escapeHtml(t.reading||"")}</small><small>${escapeHtml(t.type||"")}${t.meaning?` · ${escapeHtml(t.meaning)}`:""}</small></div>`).join("")}</div>`:""}
      ${(entry.grammarPoint||entry.grammarNote)?`<div class="grammar-detail"><strong>${escapeHtml(entry.grammarPoint||"文法分析")}</strong>${entry.grammarPattern?`<p class="compare">${escapeHtml(entry.grammarPattern)}</p>`:""}${entry.grammarNote?`<p class="compare">${escapeHtml(entry.grammarNote)}</p>`:""}</div>`:""}
      ${entry.breakdown?`<p class="compare"><b>記憶：</b>${escapeHtml(entry.breakdown)}</p>`:""}
      ${entry.tags?.length?`<div class="tag-list">${entry.tags.map(t=>`<span class="tag-chip">${escapeHtml(t)}</span>`).join("")}</div>`:""}
      ${entry.mode==="anime"&&!entry.verified?`<div class="verification-warning">⚠️ 這筆字幕尚未標記為已對照原片確認，建議先確認日文原句與讀音再背誦。</div>`:""}
      <div class="entry-actions">
        <button class="small-btn edit-entry-btn">編輯</button>
        <button class="small-btn danger delete-entry-btn">刪除</button>
      </div>
    </div>
  </article>`;
}

function bindEntryActions(){
  $$(".speak-btn").forEach(btn=>btn.onclick=e=>{e.stopPropagation();speakJapanese(btn.dataset.speak)});
  $$(".favorite-btn").forEach(btn=>btn.onclick=e=>{
    e.stopPropagation();
    const card=e.target.closest("[data-entry-id]");
    const entry=customState.entries.find(x=>x.id===card.dataset.entryId);
    entry.favorite=!entry.favorite;saveCustomEntries();renderCustomLibrary();renderAnimeLibrary();
  });
  $$(".edit-entry-btn").forEach(btn=>btn.onclick=e=>{
    const card=e.target.closest("[data-entry-id]");
    openEntryForm(customState.entries.find(x=>x.id===card.dataset.entryId));
  });
  $$(".delete-entry-btn").forEach(btn=>btn.onclick=e=>{
    const card=e.target.closest("[data-entry-id]");
    const entry=customState.entries.find(x=>x.id===card.dataset.entryId);
    if(confirm(`確定要刪除「${entry.japanese}」嗎？`)){
      customState.entries=customState.entries.filter(x=>x.id!==entry.id);
      saveCustomEntries();renderCustomLibrary();renderAnimeLibrary();
    }
  });
}

function renderCustomLibrary(){
  const items=customState.entries.filter(e=>e.mode!=="anime")
    .filter(e=>customState.type==="ALL"||e.type===customState.type)
    .filter(e=>[e.japanese,e.hiragana,e.katakana,e.chinese,e.example,e.feeling].join(" ").toLowerCase().includes(customState.query.toLowerCase()));
  $("#customLibraryGrid").innerHTML=items.map(entryCard).join("");
  $("#libraryEmptyState").classList.toggle("hidden",items.length>0);
  const mine=customState.entries.filter(e=>e.mode!=="anime");
  $("#libraryStats").innerHTML=[
    ["全部",mine.length],
    ["單字",mine.filter(e=>e.type==="word").length],
    ["句子",mine.filter(e=>e.type==="sentence").length],
    ["文法",mine.filter(e=>e.type==="grammar").length]
  ].map(([label,count])=>`<div class="stat-card"><strong>${count}</strong><span>${label}</span></div>`).join("");
  bindEntryActions();
}

function renderAnimeLibrary(){
  let items=customState.entries.filter(e=>e.mode==="anime");
  const seriesNames=[...new Set(items.map(e=>e.animeTitleZh).filter(Boolean))].sort();
  const select=$("#animeSeriesFilter");
  const current=customState.animeSeries;
  select.innerHTML=`<option value="ALL">全部作品</option>`+seriesNames.map(name=>`<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`).join("");
  select.value=seriesNames.includes(current)?current:"ALL";
  customState.animeSeries=select.value;

  items=items.filter(e=>customState.animeSeries==="ALL"||e.animeTitleZh===customState.animeSeries)
    .filter(e=>customState.animeStatus==="ALL"||(e.status||"new")===customState.animeStatus)
    .filter(e=>[e.animeTitleZh,e.animeTitleJa,e.character,e.scene,e.japanese,e.hiragana,e.katakana,e.chinese].join(" ").toLowerCase().includes(customState.animeQuery.toLowerCase()));

  const grouped={};
  items.forEach(e=>{
    const key=e.animeTitleZh||"未分類作品";
    if(!grouped[key])grouped[key]=[];
    grouped[key].push(e);
  });

  $("#animeSeriesGrid").innerHTML=Object.entries(grouped).map(([title,entries])=>{
    const ja=entries.find(e=>e.animeTitleJa)?.animeTitleJa||"";
    return `<section class="anime-series-section">
      <div class="anime-series-title">
        <div><h3>${escapeHtml(title)}</h3><p>${escapeHtml(ja)}</p></div>
        <span class="series-count">${entries.length} 則收藏</span>
      </div>
      <div class="anime-entry-grid">${entries.map(entryCard).join("")}</div>
    </section>`;
  }).join("");
  $("#animeEmptyState").classList.toggle("hidden",items.length>0);
  bindEntryActions();
}

function resetEntryForm(){
  $("#entryForm").reset();
  $("#entryId").value="";
  customState.editingImage="";
  $("#entryImagePreview").innerHTML="<span>選擇圖片後會顯示在這裡</span>";
  renderTokenRows([]);
}

function openEntryForm(entry=null,mode="library"){
  resetEntryForm();
  const actualMode=entry?.mode||mode;
  $("#entryMode").value=actualMode;
  $("#animeFields").classList.toggle("hidden",actualMode!=="anime");
  $("#entryFormKicker").textContent=actualMode==="anime"?"ANIME ENTRY":"MY ENTRY";
  $("#entryFormTitle").textContent=entry?"編輯日文內容":actualMode==="anime"?"新增動漫日文":"新增日文內容";

  if(entry){
    $("#entryId").value=entry.id;
    $("#entryType").value=entry.type||"word";
    $("#entryLevel").value=entry.level||"未分類";
    $("#entryStatus").value=entry.status||"new";
    $("#entryDifficulty").value=String(entry.difficulty||3);
    $("#entryTags").value=(entry.tags||[]).join(", ");
    $("#entryJapanese").value=entry.japanese||"";
    $("#entryHiragana").value=entry.hiragana||"";
    $("#entryKatakana").value=entry.katakana||"";
    $("#entryChinese").value=entry.chinese||"";
    $("#entryExample").value=entry.example||"";
    $("#entryFeeling").value=entry.feeling||"";
    $("#entryBreakdown").value=entry.breakdown||"";
    $("#animeTitleZh").value=entry.animeTitleZh||"";
    $("#animeTitleJa").value=entry.animeTitleJa||"";
    $("#animeCharacter").value=entry.character||"";
    $("#animeScene").value=entry.scene||"";
    $("#animeSourceUrl").value=entry.sourceUrl||"";
    $("#animeTimestamp").value=entry.timestamp||"";
    $("#animeVerified").checked=Boolean(entry.verified);
    $("#animeGrammarPoint").value=entry.grammarPoint||"";
    $("#animeGrammarPattern").value=entry.grammarPattern||"";
    $("#animeGrammarNote").value=entry.grammarNote||"";
    renderTokenRows(entry.tokens||[]);
    customState.editingImage=entry.image||"";
    if(entry.image)$("#entryImagePreview").innerHTML=`<img src="${entry.image}" alt="目前圖片">`;
  }
  $("#entryDialog").showModal();
}

$("#openLibraryFormBtn").onclick=()=>openEntryForm(null,"library");
$("#openAnimeFormBtn").onclick=()=>openEntryForm(null,"anime");
$("#entryDialogClose").onclick=()=>$("#entryDialog").close();
$("#cancelEntryBtn").onclick=()=>$("#entryDialog").close();
$("#entryDialog").addEventListener("click",e=>{if(e.target===$("#entryDialog"))$("#entryDialog").close()});

$("#entryImage").addEventListener("change",async e=>{
  const file=e.target.files[0];
  if(!file)return;
  if(file.size>12*1024*1024){alert("原始圖片請控制在 12MB 以內。");e.target.value="";return;}
  try{
    customState.editingImage=await compressImage(file);
    $("#entryImagePreview").innerHTML=`<img src="${customState.editingImage}" alt="圖片預覽"><div class="storage-note">圖片已自動壓縮，減少瀏覽器儲存空間。</div>`;
  }catch{
    alert("圖片讀取失敗，請改用 JPG、PNG 或 WebP。");
  }
});

$("#entryForm").addEventListener("submit",e=>{
  e.preventDefault();
  const mode=$("#entryMode").value;
  const japanese=$("#entryJapanese").value.trim();
  const chinese=$("#entryChinese").value.trim();
  const animeTitleZh=$("#animeTitleZh").value.trim();
  if(!japanese||!chinese){
    alert("請至少填寫日文原文與中文意思。");return;
  }
  if(mode==="anime"&&!animeTitleZh){
    alert("動漫收藏請填寫中文作品名稱。");return;
  }
  const id=$("#entryId").value||uid();
  const existing=customState.entries.find(x=>x.id===id);
  const entry={
    id,mode,
    type:$("#entryType").value,
    level:$("#entryLevel").value,
    status:$("#entryStatus").value,
    difficulty:Number($("#entryDifficulty").value),
    tags:$("#entryTags").value.split(/[,，]/).map(x=>x.trim()).filter(Boolean),
    favorite:existing?.favorite||false,
    japanese,
    hiragana:$("#entryHiragana").value.trim(),
    katakana:$("#entryKatakana").value.trim(),
    chinese,
    example:$("#entryExample").value.trim(),
    feeling:$("#entryFeeling").value.trim(),
    breakdown:$("#entryBreakdown").value.trim(),
    animeTitleZh,
    animeTitleJa:$("#animeTitleJa").value.trim(),
    character:$("#animeCharacter").value.trim(),
    scene:$("#animeScene").value.trim(),
    sourceUrl:$("#animeSourceUrl").value.trim(),
    timestamp:$("#animeTimestamp").value.trim(),
    verified:$("#animeVerified").checked,
    grammarPoint:$("#animeGrammarPoint").value.trim(),
    grammarPattern:$("#animeGrammarPattern").value.trim(),
    grammarNote:$("#animeGrammarNote").value.trim(),
    tokens:collectTokenRows(),
    image:customState.editingImage||"",
    createdAt:existing?.createdAt||new Date().toISOString(),
    updatedAt:new Date().toISOString()
  };
  customState.entries=existing
    ? customState.entries.map(x=>x.id===id?entry:x)
    : [entry,...customState.entries];
  saveCustomEntries();
  $("#entryDialog").close();
  renderCustomLibrary();renderAnimeLibrary();
});

$$("[data-custom-type]").forEach(btn=>btn.onclick=()=>{
  $$("[data-custom-type]").forEach(x=>x.classList.remove("active"));
  btn.classList.add("active");customState.type=btn.dataset.customType;renderCustomLibrary();
});
$("#librarySearchInput").addEventListener("input",e=>{customState.query=e.target.value;renderCustomLibrary()});
$("#animeSearchInput").addEventListener("input",e=>{customState.animeQuery=e.target.value;renderAnimeLibrary()});
$("#animeSeriesFilter").addEventListener("change",e=>{customState.animeSeries=e.target.value;renderAnimeLibrary()});
$("#animeStatusFilter").addEventListener("change",e=>{customState.animeStatus=e.target.value;renderAnimeLibrary()});


function buildWatchUrl(url,timestamp){if(!url)return "#";const m=(timestamp||"").match(/(?:(\d+):)?(\d+):(\d+)/);if(!m)return url;const sec=Number(m[1]||0)*3600+Number(m[2]||0)*60+Number(m[3]||0);try{const u=new URL(url);if(u.hostname.includes("youtu.be")||u.hostname.includes("youtube.com"))u.searchParams.set("t",sec+"s");return u.toString()}catch{return url}}
function renderTokenRows(tokens=[]){const rows=tokens.length?tokens:[{surface:"",reading:"",type:"",meaning:""}];$("#tokenRows").innerHTML=rows.map(t=>`<div class="token-row"><input class="token-surface" type="text" placeholder="單字／文法" value="${escapeHtml(t.surface||"")}"><input class="token-reading" type="text" placeholder="平假名／片假名" value="${escapeHtml(t.reading||"")}"><input class="token-type" type="text" placeholder="詞性" value="${escapeHtml(t.type||"")}"><input class="token-meaning" type="text" placeholder="中文意思" value="${escapeHtml(t.meaning||"")}"><button type="button" class="token-remove">×</button></div>`).join("");$$('.token-remove').forEach(b=>b.onclick=()=>{const r=b.closest('.token-row');if($$('.token-row').length===1)r.querySelectorAll('input').forEach(i=>i.value='');else r.remove()})}
function collectTokenRows(){return [...$$('.token-row')].map(r=>({surface:r.querySelector('.token-surface').value.trim(),reading:r.querySelector('.token-reading').value.trim(),type:r.querySelector('.token-type').value.trim(),meaning:r.querySelector('.token-meaning').value.trim()})).filter(t=>t.surface||t.reading||t.type||t.meaning)}
$("#addTokenBtn").onclick=()=>{const w=document.createElement('div');w.className='token-row';w.innerHTML='<input class="token-surface" type="text" placeholder="單字／文法"><input class="token-reading" type="text" placeholder="平假名／片假名"><input class="token-type" type="text" placeholder="詞性"><input class="token-meaning" type="text" placeholder="中文意思"><button type="button" class="token-remove">×</button>';w.querySelector('.token-remove').onclick=()=>w.remove();$("#tokenRows").appendChild(w)};


function exportBackup(){
  const payload={version:4,exportedAt:new Date().toISOString(),entries:customState.entries};
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob),a=document.createElement("a");
  a.href=url;a.download=`kotoba-no-mori-backup-${new Date().toISOString().slice(0,10)}.json`;
  a.click();URL.revokeObjectURL(url);
}
$("#exportDataBtn").onclick=exportBackup;
$("#importDataInput").addEventListener("change",async e=>{
  const file=e.target.files[0];if(!file)return;
  try{
    const parsed=JSON.parse(await file.text());
    const entries=Array.isArray(parsed)?parsed:parsed.entries;
    if(!Array.isArray(entries))throw new Error();
    const replace=confirm("按「確定」會取代目前資料；按「取消」則合併匯入。");
    if(replace)customState.entries=entries;
    else{
      const map=new Map(customState.entries.map(x=>[x.id,x]));
      entries.forEach(x=>map.set(x.id||uid(),x));
      customState.entries=[...map.values()];
    }
    saveCustomEntries();renderCustomLibrary();renderAnimeLibrary();
    alert("備份匯入完成。");
  }catch{alert("無法讀取這個備份檔，請確認它是本網站匯出的 JSON。");}
  e.target.value="";
});

function openAnimeReview(){
  customState.reviewItems=customState.entries.filter(e=>e.mode==="anime")
    .sort((a,b)=>(a.status==="mastered")-(b.status==="mastered")||(b.difficulty||3)-(a.difficulty||3));
  if(!customState.reviewItems.length){alert("目前沒有動漫句子可以複習。");return;}
  customState.reviewIndex=0;renderAnimeReview();$("#animeReviewDialog").showModal();
}
function renderAnimeReview(){
  const e=customState.reviewItems[customState.reviewIndex];
  $("#animeReviewCounter").textContent=`${customState.reviewIndex+1} / ${customState.reviewItems.length}`;
  $("#animeReviewImage").innerHTML=e.image?`<img src="${e.image}" alt="動漫截圖">`:"🎬";
  $("#animeReviewPrompt").textContent=e.chinese||"請回想這句日文";
  $("#animeReviewAnswer").innerHTML=`<h3>${escapeHtml(e.japanese)}</h3>
    <p>${escapeHtml(e.hiragana||"")}</p><p><b>語感：</b>${escapeHtml(e.feeling||"尚未填寫")}</p>
    ${e.grammarPoint?`<p><b>文法：</b>${escapeHtml(e.grammarPoint)}｜${escapeHtml(e.grammarNote||"")}</p>`:""}`;
  $("#animeReviewAnswer").classList.add("hidden");
  $("#animeReviewActions").classList.add("hidden");
  $("#revealAnimeAnswerBtn").classList.remove("hidden");
}
$("#startAnimeReviewBtn").onclick=openAnimeReview;
$("#animeReviewClose").onclick=()=>$("#animeReviewDialog").close();
$("#revealAnimeAnswerBtn").onclick=()=>{
  $("#animeReviewAnswer").classList.remove("hidden");
  $("#animeReviewActions").classList.remove("hidden");
  $("#revealAnimeAnswerBtn").classList.add("hidden");
  const e=customState.reviewItems[customState.reviewIndex];speakJapanese(e.japanese);
};
$$("[data-rating]").forEach(btn=>btn.onclick=()=>{
  const e=customState.reviewItems[customState.reviewIndex];
  const rating=btn.dataset.rating;
  e.status=rating==="mastered"?"mastered":"learning";
  e.lastReviewedAt=new Date().toISOString();
  e.reviewCount=(e.reviewCount||0)+1;
  saveCustomEntries();
  customState.reviewIndex++;
  if(customState.reviewIndex>=customState.reviewItems.length){
    $("#animeReviewDialog").close();renderAnimeLibrary();alert("本次複習完成！");
  }else renderAnimeReview();
});


customState.entries.forEach(e=>{
  if(e.mode==="anime"){
    if(!e.status)e.status=e.id?.startsWith("demo")?"verify":"new";
    if(e.verified===undefined)e.verified=false;
    if(!e.difficulty)e.difficulty=3;
    if(!Array.isArray(e.tags))e.tags=[];
  }
});
saveCustomEntries();


// ===== iPhone PWA + 動漫截圖 OCR =====
let ocrSourceImage=null;
let ocrImageDataUrl="";
let japaneseTokenizer=null;
let tokenizerPromise=null;
let lastOcrTokens=[];

if("serviceWorker" in navigator){
  window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
}

function initJapaneseTokenizer(){
  if(japaneseTokenizer)return Promise.resolve(japaneseTokenizer);
  if(tokenizerPromise)return tokenizerPromise;
  tokenizerPromise=new Promise((resolve,reject)=>{
    if(typeof kuromoji==="undefined"){reject(new Error("斷詞程式未載入"));return;}
    kuromoji.builder({
      dicPath:"https://cdn.jsdelivr.net/npm/kuromoji@0.1.2/dict/"
    }).build((err,tokenizer)=>{
      if(err){reject(err);return;}
      japaneseTokenizer=tokenizer;resolve(tokenizer);
    });
  });
  return tokenizerPromise;
}
function kataToHira(text=""){
  return text.replace(/[\u30a1-\u30f6]/g,ch=>String.fromCharCode(ch.charCodeAt(0)-0x60));
}
function hiraToKata(text=""){
  return text.replace(/[\u3041-\u3096]/g,ch=>String.fromCharCode(ch.charCodeAt(0)+0x60));
}
const POS_ZH={"名詞":"名詞","動詞":"動詞","形容詞":"形容詞","副詞":"副詞","助詞":"助詞","助動詞":"助動詞","連体詞":"連體詞","接続詞":"接續詞","感動詞":"感動詞","記号":"符號","フィラー":"填充語"};
function cleanOcrJapanese(text){
  return text
    .replace(/[ \t]+/g,"")
    .replace(/\n{2,}/g,"\n")
    .replace(/[|｜]/g,"")
    .replace(/[“”]/g,"")
    .trim();
}
function detectGrammarHints(text){
  const rules=[
    [/ちゃって|じゃって/,"〜ちゃって／〜じゃって","「〜てしまって／〜でしまって」的口語縮約，可能表示完成、意外、後悔或不由自主。"],
    [/なくていい/,"〜なくていい","表示沒有必要做某事，也就是「不用……」。"],
    [/ようです|ようだ/,"〜ようです","表示比喻或根據情況推測「好像、看起來像」。"],
    [/ています|てます/,"〜ています","可表示正在進行，也可表示動作後的狀態持續。"],
    [/ました/,"〜ました","動詞禮貌體的過去式，表示動作已完成。"],
    [/ますよ/,"〜ますよ","禮貌體加終助詞「よ」，用來告知、提醒或輕微催促。"],
    [/もんね|ものね/,"〜もんね","口語表示理由或確認彼此都知道的事實，近似「因為嘛／你也知道嘛」。"],
    [/って/,"〜って","口語中可提示主題、引用內容，或代替「という」。"],
    [/そうです/,"〜そうです","可能表示外觀判斷「看起來……」，也可能表示傳聞，需依接續判斷。"],
    [/なければならない|なくちゃ/,"〜なければならない","表示必須做某事；「〜なくちゃ」是較口語的縮略。"],
    [/てください/,"〜てください","禮貌請求對方做某事。"],
    [/てもいい/,"〜てもいい","表示允許「可以……」。"],
    [/と思います/,"〜と思います","表示說話者的想法或較委婉的判斷。"]
  ];
  return rules.filter(([r])=>r.test(text)).map(([,title,note])=>({title,note}));
}
function drawOcrImage(){
  const canvas=$("#ocrCanvas");
  if(!ocrSourceImage)return;
  const max=1200,scale=Math.min(1,max/ocrSourceImage.naturalWidth);
  canvas.width=Math.round(ocrSourceImage.naturalWidth*scale);
  canvas.height=Math.round(ocrSourceImage.naturalHeight*scale);
  canvas.getContext("2d").drawImage(ocrSourceImage,0,0,canvas.width,canvas.height);
  updateCropOverlay();
}
function updateCropOverlay(){
  const canvas=$("#ocrCanvas"),overlay=$("#cropOverlay");
  const top=Number($("#cropTopRange").value),bottom=Number($("#cropBottomRange").value);
  overlay.style.top=`${top}%`;overlay.style.height=`${Math.max(5,bottom-top)}%`;
}
function autoDetectSubtitleBand(){
  if(!ocrSourceImage)return;
  const canvas=$("#ocrCanvas"),ctx=canvas.getContext("2d");
  const {width:w,height:h}=canvas;
  const data=ctx.getImageData(0,0,w,h).data;
  const scores=new Array(h).fill(0);
  // 動漫字幕常是亮字＋深色描邊；以下以亮像素與鄰近對比估計字幕密度。
  for(let y=Math.floor(h*.22);y<h;y+=2){
    let score=0;
    for(let x=2;x<w-2;x+=3){
      const i=(y*w+x)*4;
      const lum=.299*data[i]+.587*data[i+1]+.114*data[i+2];
      const j=(y*w+x-2)*4;
      const lum2=.299*data[j]+.587*data[j+1]+.114*data[j+2];
      if(lum>185 && Math.abs(lum-lum2)>35) score+=2;
      else if(lum>220) score+=.35;
    }
    scores[y]=score; scores[y+1]=score;
  }
  const band=Math.max(36,Math.floor(h*.16));
  let best=-1,bestY=Math.floor(h*.55);
  for(let y=Math.floor(h*.25);y<h-band;y+=2){
    let sum=0; for(let k=y;k<y+band;k+=2)sum+=scores[k];
    // 稍微偏好中下方，但不強迫字幕一定在最底部。
    sum*=.9+.25*(y/h);
    if(sum>best){best=sum;bestY=y;}
  }
  const pad=Math.floor(h*.035);
  const top=Math.max(0,bestY-pad),bottom=Math.min(h,bestY+band+pad);
  $("#cropTopRange").value=Math.round(top/h*100);
  $("#cropBottomRange").value=Math.round(bottom/h*100);
  updateCropOverlay();
}

function getCroppedCanvas(){
  const source=$("#ocrCanvas"),top=Number($("#cropTopRange").value)/100,bottom=Number($("#cropBottomRange").value)/100;
  const y=Math.round(source.height*top),h=Math.max(1,Math.round(source.height*(bottom-top)));
  const canvas=document.createElement("canvas");
  // Upscale crop for subtitle OCR
  const scale=source.width<1600?2:1;
  canvas.width=source.width*scale;canvas.height=h*scale;
  const ctx=canvas.getContext("2d");
  ctx.drawImage(source,0,y,source.width,h,0,0,canvas.width,canvas.height);
  // Improve contrast lightly
  const imageData=ctx.getImageData(0,0,canvas.width,canvas.height),d=imageData.data;
  for(let i=0;i<d.length;i+=4){
    const gray=.299*d[i]+.587*d[i+1]+.114*d[i+2];
    const value=gray>165?255:gray<65?0:gray;
    d[i]=d[i+1]=d[i+2]=value;
  }
  ctx.putImageData(imageData,0,0);
  return canvas;
}
async function analyzeJapaneseText(text){
  const tokenizer=await initJapaneseTokenizer();
  const raw=tokenizer.tokenize(text.replace(/\n/g,""));
  const tokens=raw.filter(t=>t.surface_form.trim()).map(t=>({
    surface:t.surface_form,
    reading:t.reading||t.pronunciation||t.surface_form,
    hiragana:kataToHira(t.reading||t.pronunciation||t.surface_form),
    type:POS_ZH[t.pos]||t.pos||"",
    meaning:"",
    basic:t.basic_form&&t.basic_form!=="*"?t.basic_form:""
  }));
  const hiragana=tokens.map(t=>t.hiragana).join("");
  const katakana=tokens.map(t=>t.reading).join("");
  return {tokens,hiragana,katakana};
}
function renderOcrAnalysis(tokens,text){
  $("#ocrTokensPreview").innerHTML=tokens.map(t=>`<div class="ocr-auto-token">
    <b>${escapeHtml(t.surface)}</b><small>${escapeHtml(t.hiragana)}</small>
    <small>${escapeHtml(t.type)}${t.basic?`｜原形 ${escapeHtml(t.basic)}`:""}</small></div>`).join("");
  const hints=detectGrammarHints(text);
  $("#ocrGrammarHints").innerHTML=hints.length
    ? `<b>可能的文法：</b>${hints.map(h=>`<div class="ocr-hint"><strong>${h.title}</strong><br>${h.note}</div>`).join("")}`
    : `<div class="ocr-hint">目前沒有偵測到內建文法樣式。這不代表句子沒有文法重點，仍可在表單中自行補充。</div>`;
}
$("#openOcrBtn").onclick=()=>$("#ocrDialog").showModal();
$("#ocrDialogClose").onclick=()=>$("#ocrDialog").close();
$("#retryOcrBtn").onclick=()=>{$("#ocrResultBox").classList.add("hidden");$("#ocrProgressBox").classList.add("hidden")};
$("#ocrImageInput").addEventListener("change",e=>{
  const file=e.target.files[0];if(!file)return;
  const reader=new FileReader();
  reader.onload=()=>{
    ocrImageDataUrl=reader.result;
    const img=new Image();
    img.onload=()=>{ocrSourceImage=img;$("#ocrWorkspace").classList.remove("hidden");drawOcrImage();$("#ocrResultBox").classList.add("hidden")};
    img.src=reader.result;
  };
  reader.readAsDataURL(file);
});
$("#cropTopRange").oninput=()=>{
  if(Number($("#cropTopRange").value)>=Number($("#cropBottomRange").value)-5)
    $("#cropTopRange").value=Number($("#cropBottomRange").value)-5;
  updateCropOverlay();
};
$("#cropBottomRange").oninput=()=>{
  if(Number($("#cropBottomRange").value)<=Number($("#cropTopRange").value)+5)
    $("#cropBottomRange").value=Number($("#cropTopRange").value)+5;
  updateCropOverlay();
};
$("#autoCropBtn").onclick=autoDetectSubtitleBand;
$$("[data-crop]").forEach(btn=>btn.onclick=()=>{
  const p=btn.dataset.crop;
  if(p==="full"){ $("#cropTopRange").value=0;$("#cropBottomRange").value=100; }
  if(p==="middle"){ $("#cropTopRange").value=38;$("#cropBottomRange").value=78; }
  if(p==="bottom"){ $("#cropTopRange").value=62;$("#cropBottomRange").value=96; }
  updateCropOverlay();
});
$("#runOcrBtn").onclick=async()=>{
  if(typeof Tesseract==="undefined"){alert("OCR 程式尚未載入，請確認網路後重新整理。");return;}
  $("#ocrProgressBox").classList.remove("hidden");$("#ocrResultBox").classList.add("hidden");
  $("#ocrProgressBar").style.width="2%";$("#ocrProgressText").textContent="正在載入日文辨識模型……";
  let worker;
  try{
    worker=await Tesseract.createWorker("jpn",1,{
      logger:m=>{
        if(typeof m.progress==="number"){
          const pct=Math.round(m.progress*100);
          $("#ocrProgressBar").style.width=pct+"%";
          const map={"loading tesseract core":"載入辨識核心","initializing tesseract":"初始化辨識程式",
          "loading language traineddata":"下載日文模型","initializing api":"準備日文辨識","recognizing text":"辨識字幕"};
          $("#ocrProgressText").textContent=`${map[m.status]||m.status} ${pct}%`;
        }
      }
    });
    await worker.setParameters({preserve_interword_spaces:"1"});
    const cropped=getCroppedCanvas();
    const result=await worker.recognize(cropped);
    const text=cleanOcrJapanese(result.data.text||"");
    if(!text){throw new Error("沒有辨識到文字，請重新調整字幕範圍。");}
    $("#ocrJapaneseText").value=text;
    $("#ocrProgressText").textContent="正在產生假名與逐詞分析……";
    const analysis=await analyzeJapaneseText(text);
    lastOcrTokens=analysis.tokens;
    $("#ocrHiraganaText").value=analysis.hiragana;
    $("#ocrKatakanaText").value=analysis.katakana;
    renderOcrAnalysis(analysis.tokens,text);
    $("#ocrResultBox").classList.remove("hidden");
    $("#ocrProgressBar").style.width="100%";$("#ocrProgressText").textContent="辨識完成，請先檢查文字。";
  }catch(err){
    alert(err.message||"辨識失敗。請裁切較小的字幕範圍，或改用清晰截圖。");
    $("#ocrProgressText").textContent="辨識失敗";
  }finally{
    if(worker)await worker.terminate();
  }
};
$("#ocrJapaneseText").addEventListener("change",async()=>{
  const text=cleanOcrJapanese($("#ocrJapaneseText").value);
  try{
    const analysis=await analyzeJapaneseText(text);
    lastOcrTokens=analysis.tokens;
    $("#ocrHiraganaText").value=analysis.hiragana;$("#ocrKatakanaText").value=analysis.katakana;
    renderOcrAnalysis(analysis.tokens,text);
  }catch{}
});
$("#useOcrResultBtn").onclick=()=>{
  const text=$("#ocrJapaneseText").value.trim();if(!text)return;
  $("#ocrDialog").close();openEntryForm(null,"anime");
  $("#entryType").value="sentence";$("#entryStatus").value="verify";
  $("#entryJapanese").value=text;$("#entryHiragana").value=$("#ocrHiraganaText").value.trim();
  $("#entryKatakana").value=$("#ocrKatakanaText").value.trim();
  $("#entryFeeling").value="由動漫截圖自動辨識，尚需對照原片確認語感。";
  $("#animeVerified").checked=false;
  const hints=detectGrammarHints(text);
  if(hints.length){
    $("#animeGrammarPoint").value=hints.map(h=>h.title).join("、");
    $("#animeGrammarNote").value=hints.map(h=>`${h.title}：${h.note}`).join("\n");
  }
  renderTokenRows(lastOcrTokens.map(t=>({surface:t.surface,reading:t.hiragana,type:t.type,meaning:""})));
  customState.editingImage=ocrImageDataUrl;
  $("#entryImagePreview").innerHTML=`<img src="${ocrImageDataUrl}" alt="動漫截圖"><div class="storage-note">此圖片來自 OCR 截圖，儲存時會保留。</div>`;
};
$("#installAppBtn").onclick=()=>$("#installHelpDialog").showModal();
$("#installHelpClose").onclick=()=>$("#installHelpDialog").close();

// ===== Firebase Google 登入 + Firestore 跨裝置同步 =====
function mergeEntries(localEntries,cloudEntries){
  const map=new Map();
  [...localEntries,...cloudEntries].forEach(e=>{
    const old=map.get(e.id);
    if(!old){ map.set(e.id,e); return; }
    const oldTime=Date.parse(old.updatedAt||old.createdAt||0)||0;
    const newTime=Date.parse(e.updatedAt||e.createdAt||0)||0;
    // 雲端不儲存 data: 圖片；同一裝置已有圖片時保留本機圖片。
    const winner=newTime>=oldTime?e:old;
    const loser=winner===e?old:e;
    if(!winner.image && loser.image?.startsWith?.("data:")) winner.image=loser.image;
    map.set(e.id,winner);
  });
  return [...map.values()].sort((a,b)=>(Date.parse(b.updatedAt||b.createdAt||0)||0)-(Date.parse(a.updatedAt||a.createdAt||0)||0));
}

if(window.KotobaCloud){
  const cloud=window.KotobaCloud;
  cloud.onStatus=msg=>{ const el=$("#cloudStatus"); if(el)el.textContent=msg; };
  cloud.onEntriesLoaded=async(entries,user)=>{
    $("#googleLoginBtn")?.classList.toggle("hidden",!!user);
    $("#googleLogoutBtn")?.classList.toggle("hidden",!user);
    if(!user){ renderCustomLibrary();renderAnimeLibrary();return; }
    customState.entries=mergeEntries(customState.entries,entries||[]);
    localStorage.setItem("customJapaneseEntries",JSON.stringify(customState.entries));
    renderCustomLibrary();renderAnimeLibrary();
    await cloud.syncEntries(customState.entries);
  };
  $("#googleLoginBtn").onclick=()=>cloud.signIn();
  $("#googleLogoutBtn").onclick=()=>cloud.signOut();
}

renderCustomLibrary();
renderAnimeLibrary();
