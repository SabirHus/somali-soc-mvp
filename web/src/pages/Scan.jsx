import React,{useEffect,useState} from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { api } from "../lib/api";

export default function Scan(){
  const [result,setResult]=useState(null);

  useEffect(()=>{
    const s=new Html5QrcodeScanner("reader",{fps:10,qrbox:250});
    s.render(async text=>{
      try{
        const code=new URL(text).searchParams.get("code")||text;
        const {data}=await api.post("/admin/checkin", new URLSearchParams({code}));
        setResult(data);
      }catch{ setResult({status:"err",msg:"Invalid QR"}); }
    },()=>{});
    return ()=>s.clear().catch(()=>{});
  },[]);

  return (
    <main>
      <h1>Scanner</h1>
      <div id="reader" style={{width:320}}/>
      {result && <div className="card" style={{background:result.status==="ok"?"#ecfdf5":result.status==="warn"?"#fff7ed":"#fee2e2"}}>
        <strong>{result.msg}</strong>
      </div>}
    </main>
  );
}
