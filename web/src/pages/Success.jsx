import React,{useEffect,useState} from "react";
import { api } from "../lib/api";

export default function Success(){
  const [data,setData]=useState(null);
  const session_id=new URLSearchParams(window.location.search).get("session_id");

  useEffect(()=>{
    if(!session_id) return;
    api.get("/checkout/success",{params:{session_id}})
      .then(r=>setData(r.data))
      .catch(()=>alert("Unable to confirm payment"));
  },[session_id]);

  if(!session_id) return <main><h1>Missing session</h1></main>;
  if(!data) return <main><h1>Confirming payment…</h1></main>;
  const a=data.attendee;

  return (
    <main>
      <h1>Payment Success 🎟️</h1>
      <div className="card">
        <p><strong>Name:</strong> {a.name}</p>
        <p><strong>Email:</strong> {a.email}</p>
        <p><strong>Tickets:</strong> {a.quantity}</p>
        <p><strong>Status:</strong> Paid</p>
      </div>
      <div className="card">
        <h3>Your QR Ticket</h3>
        <img src={data.qrDataUrl} width="256" height="256" alt="QR"/>
        <p>Show this at the door. Code: <code>{a.code}</code></p>
        <a download={`ticket-${a.code}.png`} href={data.qrDataUrl}><button>Download QR</button></a>
      </div>
      <div className="card">
        <h3>Add to calendar</h3>
        <a href={data.googleCalendarUrl} target="_blank">Google Calendar</a><br/>
        <a href={`data:text/calendar;base64,${data.icsBase64}`} download="somali-society.ics">Download iCal</a>
      </div>
      <div className="card"><p><strong>Refund policy:</strong> Refunds up to 48h before event.</p></div>
    </main>
  );
}
