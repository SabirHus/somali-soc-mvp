import React,{useEffect,useState} from "react";
import { api } from "../lib/api";
import { Link } from "react-router-dom";

export default function Admin(){
  const [authed,setAuthed]=useState(false);
  const [pw,setPw]=useState("");
  const [list,setList]=useState([]);
  const [q,setQ]=useState(""); const [status,setStatus]=useState("");

  async function login(e){
    e.preventDefault();
    try{ await api.post("/admin/login",{password:pw}); setAuthed(true); load(); }
    catch{ alert("Wrong password"); }
  }
  async function logout(){ await api.post("/admin/logout"); setAuthed(false); setList([]); }
  async function load(){ const {data}=await api.get("/admin/attendees",{params:{q,status}}); setList(data); }
  async function toggle(code){ const {data}=await api.post("/admin/checkin", new URLSearchParams({code})); alert(data.msg); load(); }
  useEffect(()=>{ if(authed) load(); },[authed]);

  if(!authed) return (
    <main>
      <h1>Admin Login</h1>
      <form onSubmit={login} className="card">
        <input placeholder="Passphrase" value={pw} onChange={e=>setPw(e.target.value)} type="password"/>
        <button>Login</button>
      </form>
    </main>
  );

  return (
    <main>
      <h1>Admin Dashboard</h1>
      <div className="card">
        <input placeholder="Search name/email/code" value={q} onChange={e=>setQ(e.target.value)}/>
        <select value={status} onChange={e=>setStatus(e.target.value)}>
          <option value="">All</option><option value="pending">Pending</option>
          <option value="paid">Paid</option><option value="checked_in">Checked-in</option>
        </select>
        <button onClick={load}>Filter</button>
        <Link to="/admin/scan"><button style={{marginLeft:8}}>Open Scanner</button></Link>
        <button onClick={logout} style={{marginLeft:8}}>Logout</button>
      </div>
      <div className="card">
        <table width="100%">
          <thead><tr><th>Created</th><th>Name</th><th>Email</th><th>Qty</th><th>Status</th><th>Code</th><th>Action</th></tr></thead>
          <tbody>{list.map(a=>(
            <tr key={a.id}>
              <td>{new Date(a.createdAt).toISOString().slice(0,16).replace("T"," ")}</td>
              <td>{a.name}</td><td>{a.email}</td><td>{a.quantity}</td>
              <td>{a.status}</td><td><code>{a.code}</code></td>
              <td><button onClick={()=>toggle(a.code)}>Toggle Check-in</button></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </main>
  );
}
