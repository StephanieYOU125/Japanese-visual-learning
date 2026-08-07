// Anime Screenshot Learning Studio v10
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyAuLZhcBXy9zKqZAl-zVH9sAoObF1Q8Bz4",
  authDomain: "kotoba-no-mori.firebaseapp.com",
  projectId: "kotoba-no-mori",
  storageBucket: "kotoba-no-mori.firebasestorage.app",
  messagingSenderId: "309339245152",
  appId: "1:309339245152:web:38a22d4dd1908b6329d105"
};
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const auth=getAuth(app), db=getFirestore(app), storage=getStorage(app);
const $=s=>document.querySelector(s), $$=s=>document.querySelectorAll(s);
let user=null, sourceImage=null, rawImageData="", analysisTokens=[], tokenizerPromise=null;

onAuthStateChanged(auth,u=>{user=u; const box=$("#animeUploadStatus"); if(box)box.textContent=u?"已登入，可同步到 Firebase Storage":"請先使用網站的 Google 登入，再儲存到雲端";});

function esc(v=""){return String(v).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}
function kataToHira(t=""){return t.replace(/[ァ-ヶ]/g,c=>String.fromCharCode(c.charCodeAt(0)-0x60))}
function hiraToKata(t=""){return t.replace(/[ぁ-ゖ]/g,c=>String.fromCharCode(c.charCodeAt(0)+0x60))}
function tokenizer(){if(tokenizerPromise)return tokenizerPromise;tokenizerPromise=new Promise((resolve,reject)=>{if(!window.kuromoji)return reject(Error("kuromoji 尚未載入"));kuromoji.builder({dicPath:"https://cdn.jsdelivr.net/npm/kuromoji@0.1.2/dict/"}).build((e,t)=>e?reject(e):resolve(t))});return tokenizerPromise}

const vocab={
"学校":"學校","準備":"準備","向かう":"前往、朝向","整う":"齊備、準備完成","皆様":"各位","車":"汽車","すごい":"厲害、驚人","緊張":"緊張","全く":"完全、真是","特別":"特別、特例","懐かしい":"令人懷念","不自由":"不自由、不方便","日々":"那些日子、每日","通行人":"行人","怯える":"害怕","くれぐれも":"務必、千萬要","かしこまる":"恭敬接受、遵命","いちいち":"每次都、逐一","ばらす":"揭露、拆穿"
};
const grammarRules=[
[/ちゃって|じゃって/,"〜ちゃって／〜じゃって","「〜てしまって／〜でしまって」的口語縮約，常帶有不由自主、完成、遺憾或困擾。","朋友間口語、描述不小心發生的事情"],
[/なくていい/,"〜なくていい","不用……、沒有必要……。","允許對方不做某事"],
[/ようです|ようだ|ようですね/,"〜ようです","表示比喻或根據情況推測「好像、看起來像」。","觀察後做較委婉的判斷"],
[/ています|てます/,"〜ています","表示正在進行或狀態持續。","描述目前狀態"],
[/かしこまりました/,"かしこまりました","比「わかりました」更鄭重的「明白了／遵命」。","服務業、接受上位者指示"],
[/くれぐれも/,"くれぐれも","務必、千萬要，帶有再三叮嚀的感覺。","提醒重要事項"],
[/ぬよう/,"〜ぬよう","「ぬ」是較古風／書面的「ない」；表示「注意不要……」。","古風角色、正式提醒"],
[/ばかり/,"〜ばかり","表示盡是、老是。","回顧某類事情很多"],
[/もんね|ものね/,"〜もんね","表示理由或彼此都知道的共同確認感。","熟人閒聊、回應共同經驗"],
[/って/,"〜って","口語提示主題、引用或代替「という」。","日常對話"]
];

function grammarMatches(text){return grammarRules.filter(([r])=>r.test(text)).map(([,title,note,usage])=>({title,note,usage}))}

async function analyzeText(){
  const text=$("#animeJapanese").value.trim(); if(!text)return;
  try{
    const tk=await tokenizer(), raw=tk.tokenize(text.replace(/\n/g,""));
    analysisTokens=raw.filter(t=>t.surface_form.trim()).map(t=>({
      surface:t.surface_form, reading:t.reading||t.pronunciation||t.surface_form,
      hira:kataToHira(t.reading||t.pronunciation||t.surface_form),
      pos:t.pos||"", basic:t.basic_form&&t.basic_form!=="*"?t.basic_form:""
    }));
    $("#animeHiragana").value=analysisTokens.map(t=>t.hira).join("");
    $("#animeKatakana").value=analysisTokens.map(t=>t.reading).join("");
    $("#animeTokens").innerHTML=analysisTokens.map(t=>`<div class="anime-token"><b>${esc(t.surface)}</b><small>${esc(t.hira)}</small><small>${esc(t.pos)}${t.basic?`｜原形 ${esc(t.basic)}`:""}</small><small>${esc(vocab[t.basic]||vocab[t.surface]||"")}</small></div>`).join("");
    const g=grammarMatches(text);
    $("#animeGrammar").innerHTML=g.length?g.map(x=>`<div class="anime-grammar-item"><b>${x.title}</b><br>${x.note}<br><small>情境：${x.usage}</small></div>`).join(""):'<div class="anime-grammar-item">沒有命中內建文法規則；可能是口語省略、專有名詞或複合句型，請自行補充。</div>';
    if(!$("#animeNote").value)$("#animeNote").value=g.map(x=>`${x.title}：${x.note}`).join("\n");
    if(!$("#animeUsage").value&&g.length)$("#animeUsage").value=[...new Set(g.map(x=>x.usage))].join("；");
  }catch(e){alert("日文斷詞工具載入失敗，請確認網路後重試。")}
}

function drawSource(){
  const c=$("#animeShotCanvas"),scale=Math.min(1,1200/sourceImage.naturalWidth);
  c.width=Math.round(sourceImage.naturalWidth*scale);c.height=Math.round(sourceImage.naturalHeight*scale);
  c.getContext("2d").drawImage(sourceImage,0,0,c.width,c.height);
  $("#animeMemoryImage").innerHTML=`<img src="${rawImageData}" alt="動漫截圖">`;
  updateCrop();
}
function updateCrop(){
  let top=+$("#animeCropTop").value,bottom=+$("#animeCropBottom").value;
  if(top>=bottom-5){top=bottom-5;$("#animeCropTop").value=top}
  $("#animeCropOverlay").style.top=top+"%";$("#animeCropOverlay").style.height=(bottom-top)+"%";
}
function croppedCanvas(){
  const src=$("#animeShotCanvas"),top=+$("#animeCropTop").value/100,bottom=+$("#animeCropBottom").value/100;
  const y=Math.round(src.height*top),h=Math.max(1,Math.round(src.height*(bottom-top))),c=document.createElement("canvas"),scale=src.width<1500?2:1;
  c.width=src.width*scale;c.height=h*scale;c.getContext("2d").drawImage(src,0,y,src.width,h,0,0,c.width,c.height);
  return c;
}
async function compressBlob(data,maxWidth=1400,quality=.78){
  return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>{const s=Math.min(1,maxWidth/img.width),c=document.createElement("canvas");c.width=Math.round(img.width*s);c.height=Math.round(img.height*s);c.getContext("2d").drawImage(img,0,0,c.width,c.height);c.toBlob(b=>b?resolve(b):reject(Error("compress failed")),"image/jpeg",quality)};img.onerror=reject;img.src=data});
}

$("#animeQuickPickBtn")?.addEventListener("click",()=>$("#animeShotInput").click());
$("#animeShotInput")?.addEventListener("change",e=>{
  const f=e.target.files[0];if(!f)return;const r=new FileReader();
  r.onload=()=>{rawImageData=r.result;sourceImage=new Image();sourceImage.onload=()=>{drawSource();$("#animeShotWorkspace").classList.remove("anime-hidden")};sourceImage.src=rawImageData};r.readAsDataURL(f);
});
$("#animeCropTop")?.addEventListener("input",updateCrop);$("#animeCropBottom")?.addEventListener("input",updateCrop);
$$("[data-anime-crop]").forEach(b=>b.addEventListener("click",()=>{const p=b.dataset.animeCrop;if(p==="jp"){$("#animeCropTop").value=62;$("#animeCropBottom").value=94}if(p==="middle"){$("#animeCropTop").value=38;$("#animeCropBottom").value=83}if(p==="all"){$("#animeCropTop").value=0;$("#animeCropBottom").value=100}updateCrop()}));

$("#animeRunOcrBtn")?.addEventListener("click",async()=>{
  if(!sourceImage)return alert("請先選擇截圖");
  if(!window.Tesseract)return alert("OCR 程式尚未載入，請重新整理並確認網路");
  $("#animeOcrProgress").classList.remove("anime-hidden");let worker;
  try{
    worker=await Tesseract.createWorker("jpn",1,{logger:m=>{if(typeof m.progress==="number"){$("#animeOcrBar").style.width=Math.round(m.progress*100)+"%";$("#animeOcrStatus").textContent=(m.status||"辨識中")+" "+Math.round(m.progress*100)+"%"}}});
    const result=await worker.recognize(croppedCanvas()),text=(result.data.text||"").replace(/[ |｜]/g,"").replace(/\n{2,}/g,"\n").trim();
    $("#animeJapanese").value=text;$("#animeOcrStatus").textContent="辨識完成，請先檢查日文";await analyzeText();
  }catch(e){console.error(e);alert("OCR 失敗。請把黃色範圍縮到日文字幕，或換較清楚的截圖。")}
  finally{if(worker)await worker.terminate()}
});
$("#animeAnalyzeBtn")?.addEventListener("click",analyzeText);
$("#animeChineseDraftBtn")?.addEventListener("click",()=>{
  const t=$("#animeJapanese").value;let out="";
  if(/かしこまりました/.test(t))out="明白了／遵命。";
  else if(/いたし方ありません/.test(t))out="沒有辦法了。";
  else if(/準備が整いました/.test(t))out="準備已經完成了。";
  else if(/これは特別/.test(t))out="這次是特例／這是特別的。";
  else if(/すごいです/.test(t))out="很厲害。";
  else {const hits=Object.entries(vocab).filter(([j])=>t.includes(j)).map(([j,z])=>`${j}＝${z}`);out=hits.length?"中文草稿（請依場景修正）："+hits.join("；"):"請依動漫情境自行翻譯，或使用 Google 翻譯確認。"}
  $("#animeChinese").value=out;
});
$("#animeTranslateBtn")?.addEventListener("click",()=>window.open("https://translate.google.com/?sl=ja&tl=zh-TW&text="+encodeURIComponent($("#animeJapanese").value),"_blank"));

$("#animeSaveCloudBtn")?.addEventListener("click",async()=>{
  if(!user)return alert("請先使用網站的 Google 登入");
  const jp=$("#animeJapanese").value.trim();if(!jp)return alert("請先輸入或辨識日文");
  if(!rawImageData)return alert("請先選擇動漫截圖");
  const status=$("#animeUploadStatus");status.textContent="正在壓縮並上傳圖片……";
  try{
    const blob=await compressBlob(rawImageData),id=`${Date.now()}-${crypto.randomUUID?.()||Math.random().toString(36).slice(2)}`;
    const storagePath=`users/${user.uid}/anime/${id}.jpg`,storageRef=ref(storage,storagePath);
    await uploadBytes(storageRef,blob,{contentType:"image/jpeg"});
    const imageUrl=await getDownloadURL(storageRef);status.textContent="圖片完成，正在儲存學習資料……";
    const entry={
      jp,hira:$("#animeHiragana").value.trim(),kata:$("#animeKatakana").value.trim(),zh:$("#animeChinese").value.trim(),
      animeTitleZh:$("#animeTitleZh").value.trim(),animeTitleJa:$("#animeTitleJa").value.trim(),character:$("#animeCharacter").value.trim(),
      scene:$("#animeScene").value.trim(),usage:$("#animeUsage").value.trim(),note:$("#animeNote").value.trim(),
      level:$("#animeLevel").value,videoUrl:$("#animeVideoUrl").value.trim(),verified:$("#animeVerified").checked,
      status:$("#animeVerified").checked?"learning":"verify",tokens:analysisTokens,grammar:grammarMatches(jp),
      imageUrl,storagePath,createdAt:serverTimestamp(),createdAtLocal:Date.now()
    };
    await addDoc(collection(db,"users",user.uid,"animeEntries"),entry);
    status.textContent="✅ 已同步：圖片在 Storage，學習資料在 Firestore";
    alert("已加入動漫學習庫！");
  }catch(e){console.error(e);status.textContent="❌ 儲存失敗";alert("儲存失敗："+(e.code||e.message||"unknown error"))}
});
