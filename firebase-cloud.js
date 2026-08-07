// Firebase cloud sync for ことばの森 (Spark plan: Firestore + Google Auth)
// Firebase web config is intentionally public; access is protected by Firestore Security Rules.
const firebaseConfig = {
  apiKey: "AIzaSyAuLZhcBXy9zKqZAl-zVH9sAoObF1Q8Bz4",
  authDomain: "kotoba-no-mori.firebaseapp.com",
  projectId: "kotoba-no-mori",
  storageBucket: "kotoba-no-mori.firebasestorage.app",
  messagingSenderId: "309339245152",
  appId: "1:309339245152:web:38a22d4dd1908b6329d105",
  measurementId: "G-539QREX4KZ"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();
const provider = new firebase.auth.GoogleAuthProvider();

const cloud = {
  user: null,
  onEntriesLoaded: null,
  onStatus: null,
  status(message){ if(this.onStatus) this.onStatus(message); },
  async signIn(){
    try { await auth.signInWithPopup(provider); }
    catch(err){
      if(err.code === "auth/unauthorized-domain") alert("Google 登入尚未允許這個網址。請到 Firebase Authentication → 設定 → 已授權網域，加入你的 GitHub Pages 網域。");
      else alert("Google 登入失敗：" + (err.message || err.code));
    }
  },
  async signOut(){ await auth.signOut(); },
  sanitizeEntry(entry){
    const copy = JSON.parse(JSON.stringify(entry));
    if(typeof copy.image === "string" && copy.image.startsWith("data:")){
      copy.image = "";
      copy.imageLocalOnly = true;
    }
    return copy;
  },
  entriesRef(){ return db.collection("users").doc(this.user.uid).collection("entries"); },
  async uploadDataImage(entryId, dataUrl){
    if(!this.user || !dataUrl?.startsWith("data:image/")) return dataUrl;
    this.status("🖼️ 上傳截圖中…");
    const blob=await (await fetch(dataUrl)).blob();
    const ext=(blob.type.split("/")[1]||"jpg").replace("jpeg","jpg");
    const ref=storage.ref().child(`users/${this.user.uid}/anime/${entryId}.${ext}`);
    await ref.put(blob,{contentType:blob.type,customMetadata:{entryId}});
    return await ref.getDownloadURL();
  },
  async prepareEntries(entries){
    const prepared=[];
    for(const original of entries){
      const e=JSON.parse(JSON.stringify(original));
      if(typeof e.image==="string" && e.image.startsWith("data:image/")){
        try{ e.image=await this.uploadDataImage(e.id,e.image); e.imageLocalOnly=false; }
        catch(err){ console.error("Storage upload failed",err); e.image=""; e.imageLocalOnly=true; }
      }
      prepared.push(e);
    }
    return prepared;
  },
  async loadEntries(){
    if(!this.user) return [];
    const snap = await this.entriesRef().get();
    return snap.docs.map(d=>({id:d.id, ...d.data()}));
  },
  async syncEntries(entries){
    if(!this.user) return;
    this.status("☁️ 同步中…");
    try{
      const ref=this.entriesRef();
      const remote=await ref.get();
      const prepared=await this.prepareEntries(entries);
      // 把 Storage URL 回寫本機，讓重新整理後仍使用雲端圖片。
      prepared.forEach(pe=>{ const local=entries.find(e=>e.id===pe.id); if(local && pe.image) local.image=pe.image; });
      localStorage.setItem("customJapaneseEntries",JSON.stringify(entries));
      const localIds=new Set(prepared.map(e=>e.id));
      const ops=[];
      prepared.forEach(e=>ops.push({type:"set", ref:ref.doc(e.id), data:this.sanitizeEntry(e)}));
      remote.docs.forEach(d=>{ if(!localIds.has(d.id)) ops.push({type:"delete",ref:d.ref}); });
      for(let i=0;i<ops.length;i+=400){
        const batch=db.batch();
        ops.slice(i,i+400).forEach(op=>op.type==="set"?batch.set(op.ref,op.data):batch.delete(op.ref));
        await batch.commit();
      }
      this.status("☁️ 已同步");
    }catch(err){ console.error(err); this.status("⚠️ 同步失敗"); }
  }
};

window.KotobaCloud=cloud;
auth.onAuthStateChanged(async user=>{
  cloud.user=user;
  if(!user){ cloud.status("僅儲存在這台裝置"); if(cloud.onEntriesLoaded) cloud.onEntriesLoaded(null,user); return; }
  cloud.status("☁️ 讀取雲端…");
  try{
    const entries=await cloud.loadEntries();
    if(cloud.onEntriesLoaded) await cloud.onEntriesLoaded(entries,user);
    cloud.status("☁️ 已同步");
  }catch(err){ console.error(err); cloud.status("⚠️ 無法讀取雲端"); }
});
