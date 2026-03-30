// src/Auth.jsx — KidQuest Auth v3
// Age verification, biometric, email verify, invite system
import { useState } from 'react'
import { supabase } from './supabase.js'

const C = {
  mint:"#00C896", mintDk:"#00A07A", mintLt:"#E0FBF2",
  gold:"#FFB300", goldLt:"#FFF5D6", goldDk:"#CC8C00",
  coral:"#FF5252", coralLt:"#FFF5F5",
  purple:"#7C4DFF", purpleLt:"#EDE7FF",
  sky:"#2196F3", skyLt:"#E8F4FD",
  text:"#0D2318", textMed:"#3D6055", textLt:"#8FB5AA",
  card:"#FFFFFF", border:"#C8EDE0", bg:"#F0FBF6",
}

function calcAge(bd) {
  if(!bd) return 0
  const t=new Date(), b=new Date(bd)
  let a=t.getFullYear()-b.getFullYear()
  if(t.getMonth()<b.getMonth()||(t.getMonth()===b.getMonth()&&t.getDate()<b.getDate())) a--
  return a
}

async function tryBiometric(userId) {
  try {
    if(!window.PublicKeyCredential) return false
    const ok = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
    if(!ok) return false
    const ch = new Uint8Array(32); crypto.getRandomValues(ch)
    await navigator.credentials.create({
      publicKey:{
        challenge:ch,
        rp:{name:"KidQuest",id:window.location.hostname},
        user:{id:new TextEncoder().encode(userId),name:userId,displayName:"KidQuest"},
        pubKeyCredParams:[{alg:-7,type:"public-key"}],
        authenticatorSelection:{authenticatorAttachment:"platform",userVerification:"required"},
        timeout:60000,
      }
    })
    return true
  } catch { return false }
}

const ROLES = [
  {id:"student", l:"Soy Estudiante",    d:"Completo misiones y aprendo economía", icon:"🎮", color:"#00C896"},
  {id:"parent",  l:"Soy Padre / Tutor", d:"Verifico tareas y gestiono la mesada",  icon:"👨‍👩‍👦", color:"#FFB300"},
  {id:"teacher", l:"Soy Profesor",       d:"Gestiono mi clase y asigno desafíos",   icon:"🏫", color:"#2196F3"},
]

const inp = (extra={}) => ({
  width:"100%", padding:"12px 16px", borderRadius:14,
  border:`1.5px solid ${C.border}`, fontSize:15,
  fontFamily:"'Nunito',sans-serif", color:C.text,
  background:C.card, outline:"none", marginBottom:12,
  boxSizing:"border-box", ...extra,
})

const btn = (bg, extra={}) => ({
  width:"100%", padding:"13px", borderRadius:15, border:"none",
  background:bg, color:"white", fontSize:15, fontWeight:800,
  cursor:"pointer", fontFamily:"'Nunito',sans-serif",
  boxShadow:`0 4px 16px ${bg}55`, marginBottom:10, ...extra,
})

export default function Auth({ onAuth }) {
  const [mode,     setMode]     = useState("login")
  // login | register | forgot | verify_email | pending_tutor | invite
  const [step,     setStep]     = useState(1) // register steps 1-4
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState("")
  const [success,  setSuccess]  = useState("")

  // Form fields
  const [name,      setName]      = useState("")
  const [email,     setEmail]     = useState("")
  const [password,  setPassword]  = useState("")
  const [confirm,   setConfirm]   = useState("")
  const [role,      setRole]      = useState("")
  const [birthDate, setBirthDate] = useState("")
  const [tutorEmail,setTutorEmail]= useState("")
  const [inviteCode,setInviteCode]= useState("")

  // Computed
  const age = birthDate ? calcAge(birthDate) : null
  const isMinor = age !== null && age < 18
  const selectedRole = ROLES.find(r=>r.id===role)

  const err = (msg) => { setError(msg); setLoading(false) }
  const ok  = (msg) => { setSuccess(msg); setError("") }
  const go  = (m,s=1) => { setMode(m); setStep(s); setError(""); setSuccess("") }

  // ── LOGIN ──────────────────────────────────────────────────
  const handleLogin = async(e) => {
    e.preventDefault(); setError(""); setLoading(true)
    try {
      const {data, error:er} = await supabase.auth.signInWithPassword({email, password})
      if(er) return err(er.message==="Invalid login credentials"?"Email o contraseña incorrectos":er.message)
      // Check account status
      const {data:prof} = await supabase.from("profiles").select("account_status,admin_role,name,username").eq("id",data.user.id).single()
      if(prof?.account_status==="suspended") return err("Tu cuenta está suspendida. Contacta soporte.")
      if(prof?.account_status==="banned")    return err("Tu cuenta ha sido inhabilitada.")
      if(prof?.account_status==="pending_tutor") { setLoading(false); return go("pending_tutor") }
      onAuth(data.session, prof)
    } catch(e){ err(e.message) }
    setLoading(false)
  }

  // ── REGISTER STEP 1: Role ──────────────────────────────────
  // ── REGISTER STEP 2: Age verification ─────────────────────
  // ── REGISTER STEP 3: Form data ────────────────────────────
  // ── REGISTER STEP 4: Biometric (optional) ─────────────────

  const handleRegister = async(e) => {
    e.preventDefault(); setError(""); setLoading(true)
    if(!role)              return err("Elige tu rol")
    if(!name.trim())       return err("Escribe tu nombre")
    if(!birthDate)         return err("Ingresa tu fecha de nacimiento")
    if(age < 6 && role==="student") return err("Los estudiantes deben tener al menos 6 años")
    if(!isMinor && role==="student") return err("Los estudiantes deben ser menores de 18 años")
    if(isMinor && role!=="student") return err("Padres y profesores deben ser mayores de 18 años")
    if(password.length < 8) return err("La contraseña debe tener al menos 8 caracteres")
    if(password !== confirm) return err("Las contraseñas no coinciden")

    try {
      const {data, error:er} = await supabase.auth.signUp({
        email, password,
        options:{ data:{ name, role, birth_date: birthDate } }
      })
      if(er) return err(er.message.includes("already registered")?"Este email ya está registrado":er.message)

      // Try biometric registration (optional, device support varies)
      if(data.user) {
        const bioOk = await tryBiometric(data.user.id)
        if(bioOk) {
          await supabase.from("profiles").update({biometric_verified:true}).eq("id",data.user.id)
        }
      }

      setLoading(false)
      if(isMinor) {
        // Minor needs tutor
        go("verify_email_minor")
      } else {
        go("verify_email")
      }
    } catch(e){ err(e.message) }
  }

  // ── SEND TUTOR REQUEST ─────────────────────────────────────
  const sendTutorRequest = async() => {
    if(!tutorEmail.trim()) return err("Ingresa el email de tu tutor")
    setLoading(true)
    try {
      const {data:{user}, error:uErr} = await supabase.auth.getUser()
      if(uErr || !user) return err("Sesión expirada. Inicia sesión de nuevo.")
      
      const {data:prof} = await supabase.from("profiles").select("name").eq("id",user.id).single()
      
      // Check if tutor exists in the system
      const {data:tutorProfiles} = await supabase
        .from("profiles")
        .select("id,name,role")
        .in("role", ["parent","teacher"])
      
      // Try to find by email (we can't query auth.users from client, so we insert and let tutor approve)
      const token = Math.random().toString(36).slice(2,10).toUpperCase() + 
                    Math.random().toString(36).slice(2,6).toUpperCase()
      
      const {error:er} = await supabase.from("tutor_requests").insert({
        child_id: user.id,
        child_name: prof?.name || name,
        tutor_email: tutorEmail.toLowerCase().trim(),
        token,
      })
      
      if(er) {
        if(er.code === "23505") return err("Ya enviaste una solicitud a este email.")
        return err("Error al enviar: " + er.message)
      }
      
      ok(`✅ Solicitud enviada. Pídele a ${tutorEmail} que entre a KidQuest, vaya a "Validar" y busque tu solicitud pendiente.`)
    } catch(e){ err("Error: " + e.message) }
    setLoading(false)
  }

  // ── VALIDATE INVITE CODE (child uses adult's invite) ───────
  const validateInvite = async() => {
    if(!inviteCode.trim()) return err("Ingresa el código de invitación")
    setLoading(true)
    try {
      // Look up the token
      const {data:tokens, error:tokErr} = await supabase
        .from("invite_tokens")
        .select("*")
        .eq("token", inviteCode.trim().toUpperCase())
        .eq("used", false)
      
      if(tokErr) return err("Error al verificar código: " + tokErr.message)
      
      // Filter valid (not expired)
      const validTokens = (tokens||[]).filter(t => new Date(t.expires_at) > new Date())
      
      if(!validTokens.length) {
        return err("Código inválido o expirado. Pide uno nuevo a tu tutor.")
      }
      
      const token = validTokens[0]
      const {data:{user}, error:uErr} = await supabase.auth.getUser()
      if(uErr || !user) return err("Sesión expirada. Inicia sesión de nuevo.")
      
      // Mark token as used
      await supabase.from("invite_tokens")
        .update({used:true, used_by:user.id})
        .eq("id", token.id)
      
      // Link parent/teacher to child
      const table = token.creator_role==="teacher" ? "teacher_student" : "parent_child"
      const fk1   = token.creator_role==="teacher" ? "teacher_id" : "parent_id"
      const fk2   = token.creator_role==="teacher" ? "student_id" : "child_id"
      
      const {error:linkErr} = await supabase.from(table).insert({
        [fk1]: token.created_by,
        [fk2]: user.id
      })
      
      if(linkErr && linkErr.code !== "23505") {
        console.warn("Link error:", linkErr.message)
      }
      
      // Activate account
      await supabase.from("profiles")
        .update({account_status:"active"})
        .eq("id", user.id)
      
      ok(`✅ ¡Código válido! Vinculado con ${token.creator_name||"tu tutor"}. Tu cuenta está activa.`)
      setTimeout(()=>{
        supabase.auth.getSession().then(({data:{session}})=>{
          if(session) onAuth(session, null)
        })
      }, 2000)
    } catch(e){ err("Error inesperado: " + e.message) }
    setLoading(false)
  }

  // ── FORGOT PASSWORD ─────────────────────────────────────────
  const handleForgot = async(e) => {
    e.preventDefault(); setError(""); setLoading(true)
    try {
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo:`${window.location.origin}`
      })
      ok("📧 Revisa tu email para restablecer tu contraseña")
    } catch(e){ err(e.message) }
    setLoading(false)
  }

  // ── UI ──────────────────────────────────────────────────────
  return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",
      justifyContent:"center",padding:24,fontFamily:"'Nunito',sans-serif",
      background:`radial-gradient(ellipse at 30% 20%,${C.mint}25,transparent 55%),
                  radial-gradient(ellipse at 70% 80%,${C.purple}15,transparent 55%),${C.bg}`}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
        *{box-sizing:border-box}input,select,button{font-family:'Nunito',sans-serif}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        @keyframes popIn{0%{transform:scale(0.8);opacity:0}100%{transform:scale(1);opacity:1}}`}
      </style>

      {/* Logo */}
      <div style={{textAlign:"center",marginBottom:22}}>
        <div style={{width:78,height:78,borderRadius:24,margin:"0 auto 10px",
          background:`linear-gradient(135deg,${C.mint},${C.purple})`,
          display:"flex",alignItems:"center",justifyContent:"center",
          fontSize:38,boxShadow:`0 8px 28px ${C.mint}60`,animation:"float 3s ease-in-out infinite"}}>
          🦎
        </div>
        <div style={{fontWeight:900,fontSize:30,color:C.text,letterSpacing:-1}}>KidQuest</div>
        <div style={{fontSize:12,color:C.textMed,fontWeight:600}}>Aprende · Ahorra · Conquista</div>
      </div>

      {/* Card */}
      <div style={{background:C.card,borderRadius:24,padding:26,width:"100%",maxWidth:390,
        boxShadow:"0 20px 60px rgba(0,0,0,0.12)",animation:"popIn 0.3s ease-out"}}>

        {error&&<div style={{background:C.coralLt,border:`1.5px solid ${C.coral}`,borderRadius:12,
          padding:"9px 14px",marginBottom:14,fontSize:13,color:C.coral,fontWeight:700}}>⚠️ {error}</div>}
        {success&&<div style={{background:C.mintLt,border:`1.5px solid ${C.mint}`,borderRadius:12,
          padding:"9px 14px",marginBottom:14,fontSize:13,color:C.mintDk,fontWeight:700}}>{success}</div>}

        {/* ══ LOGIN ══════════════════════════════════════════ */}
        {mode==="login"&&(
          <form onSubmit={handleLogin}>
            <div style={{fontWeight:900,fontSize:22,color:C.text,marginBottom:4}}>¡Bienvenido!</div>
            <div style={{fontSize:13,color:C.textMed,marginBottom:18}}>Entra a tu cuenta de KidQuest</div>
            <input style={inp()} type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} required/>
            <input style={inp()} type="password" placeholder="Contraseña" value={password} onChange={e=>setPassword(e.target.value)} required/>
            <button type="submit" disabled={loading} style={btn(`linear-gradient(135deg,${C.mint},${C.mintDk})`)}>
              {loading?"Entrando…":"🚀 Entrar"}
            </button>
            <div style={{textAlign:"center",fontSize:13,color:C.textMed,marginBottom:10}}>
              <button type="button" onClick={()=>go("forgot")} style={{background:"none",border:"none",color:C.sky,cursor:"pointer",fontWeight:700}}>
                ¿Olvidaste tu contraseña?
              </button>
            </div>
            <div style={{textAlign:"center",fontSize:13,color:C.textMed}}>
              ¿No tienes cuenta?{" "}
              <button type="button" onClick={()=>go("register",1)} style={{background:"none",border:"none",color:C.mint,cursor:"pointer",fontWeight:800}}>
                Regístrate gratis
              </button>
            </div>
          </form>
        )}

        {/* ══ REGISTER: Step 1 — ROLE ════════════════════════ */}
        {mode==="register"&&step===1&&(
          <div>
            <div style={{fontWeight:900,fontSize:21,color:C.text,marginBottom:4}}>¿Quién eres?</div>
            <div style={{fontSize:13,color:C.textMed,marginBottom:18}}>Esto determina tu experiencia en la app</div>
            {ROLES.map(r=>(
              <button key={r.id} type="button" onClick={()=>setRole(r.id)}
                style={{width:"100%",marginBottom:9,padding:"13px 15px",borderRadius:15,cursor:"pointer",
                  border:`2px solid ${role===r.id?r.color:C.border}`,
                  background:role===r.id?r.color+"18":C.card,
                  display:"flex",alignItems:"center",gap:13,textAlign:"left",transition:"all 0.18s"}}>
                <span style={{fontSize:26,flexShrink:0}}>{r.icon}</span>
                <div style={{flex:1}}>
                  <div style={{fontWeight:800,fontSize:14,color:C.text}}>{r.l}</div>
                  <div style={{fontSize:11,color:C.textMed}}>{r.d}</div>
                </div>
                {role===r.id&&<span style={{color:r.color,fontSize:18,marginLeft:"auto"}}>✓</span>}
              </button>
            ))}
            <button type="button" onClick={()=>{if(!role)return err("Elige un rol");setStep(2)}}
              style={btn(role?`linear-gradient(135deg,${selectedRole?.color},${selectedRole?.color}bb)`:C.border,{marginTop:4})}>
              Continuar →
            </button>
            <div style={{textAlign:"center",fontSize:13,color:C.textMed}}>
              ¿Ya tienes cuenta?{" "}
              <button type="button" onClick={()=>go("login")} style={{background:"none",border:"none",color:C.mint,cursor:"pointer",fontWeight:800}}>Inicia sesión</button>
            </div>
          </div>
        )}

        {/* ══ REGISTER: Step 2 — AGE VERIFY ═════════════════ */}
        {mode==="register"&&step===2&&(
          <div>
            <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:18}}>
              <button type="button" onClick={()=>setStep(1)} style={{background:C.border,border:"none",borderRadius:9,padding:"5px 10px",cursor:"pointer",color:C.textMed,fontWeight:700}}>← Atrás</button>
              <div style={{fontWeight:900,fontSize:18,color:C.text}}>Verificación de edad</div>
            </div>
            <div style={{fontSize:13,color:C.textMed,marginBottom:16,lineHeight:1.6}}>
              Necesitamos verificar tu edad para proteger a los usuarios menores de KidQuest.
            </div>
            <div style={{marginBottom:16}}>
              <label style={{fontSize:12,fontWeight:700,color:C.textMed,display:"block",marginBottom:6}}>Fecha de nacimiento</label>
              <input style={inp()} type="date"
                max={new Date().toISOString().split("T")[0]}
                min="1967-01-01"
                value={birthDate} onChange={e=>setBirthDate(e.target.value)}/>
            </div>
            {birthDate&&age!==null&&(
              <div style={{background:isMinor?C.purpleLt:C.mintLt,border:`1.5px solid ${isMinor?C.purple:C.mint}`,
                borderRadius:12,padding:"10px 14px",marginBottom:14,fontSize:13,fontWeight:700,
                color:isMinor?C.purple:C.mintDk}}>
                {isMinor
                  ?`🔐 Menor de edad (${age} años) — Tu cuenta necesitará aprobación de un adulto`
                  :`✅ Mayor de edad (${age} años) — Puedes continuar normalmente`}
              </div>
            )}
            {birthDate&&age<6&&(
              <div style={{background:C.coralLt,border:`1.5px solid ${C.coral}`,borderRadius:12,padding:"10px 14px",marginBottom:14,fontSize:13,color:C.coral,fontWeight:700}}>
                ⚠️ KidQuest es para niños de 6 años en adelante
              </div>
            )}
            {/* Role-age mismatch warnings */}
            {birthDate&&age>=18&&role==="student"&&(
              <div style={{background:C.coralLt,border:`1.5px solid ${C.coral}`,borderRadius:12,padding:"10px 14px",marginBottom:14,fontSize:13,color:C.coral,fontWeight:700}}>
                ⚠️ Los estudiantes deben ser menores de 18 años. ¿Eres padre o profesor?
                <div style={{display:"flex",gap:7,marginTop:8}}>
                  <button onClick={()=>{setRole("parent");setStep(1)}} style={{flex:1,padding:"7px",borderRadius:10,border:`1.5px solid ${C.gold}`,background:C.goldLt,color:C.goldDk,cursor:"pointer",fontWeight:700,fontSize:12}}>👨‍👩‍👦 Soy Padre</button>
                  <button onClick={()=>{setRole("teacher");setStep(1)}} style={{flex:1,padding:"7px",borderRadius:10,border:`1.5px solid ${C.sky}`,background:C.skyLt,color:C.sky,cursor:"pointer",fontWeight:700,fontSize:12}}>🏫 Soy Profesor</button>
                </div>
              </div>
            )}
            {birthDate&&age<18&&role!=="student"&&(
              <div style={{background:C.coralLt,border:`1.5px solid ${C.coral}`,borderRadius:12,padding:"10px 14px",marginBottom:14,fontSize:13,color:C.coral,fontWeight:700}}>
                ⚠️ Los padres y profesores deben ser mayores de 18 años
              </div>
            )}
            <button type="button" onClick={()=>{
              if(!birthDate) return err("Selecciona tu fecha de nacimiento")
              if(age<6) return err("Debes tener al menos 6 años")
              if(age>=18&&role==="student") return err("Los estudiantes deben ser menores de 18 años")
              if(age<18&&role!=="student") return err("Padres y profesores deben ser mayores de 18 años")
              err(""); setStep(3)
            }} style={btn(`linear-gradient(135deg,${C.mint},${C.mintDk})`)}>
              Continuar →
            </button>
          </div>
        )}

        {/* ══ REGISTER: Step 3 — FORM DATA ═══════════════════ */}
        {mode==="register"&&step===3&&(
          <form onSubmit={handleRegister}>
            <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:18}}>
              <button type="button" onClick={()=>setStep(2)} style={{background:C.border,border:"none",borderRadius:9,padding:"5px 10px",cursor:"pointer",color:C.textMed,fontWeight:700}}>← Atrás</button>
              <div>
                <div style={{fontWeight:900,fontSize:18,color:C.text}}>Crear cuenta</div>
                <div style={{fontSize:11,color:selectedRole?.color,fontWeight:700}}>{selectedRole?.icon} {selectedRole?.l} · {age} años</div>
              </div>
            </div>
            <input style={inp()} type="text" placeholder="Tu nombre completo" value={name} onChange={e=>setName(e.target.value)} required/>
            <input style={inp()} type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} required/>
            <input style={inp()} type="password" placeholder="Contraseña (mín. 8 caracteres)" value={password} onChange={e=>setPassword(e.target.value)} required/>
            <input style={inp({marginBottom:6})} type="password" placeholder="Confirmar contraseña" value={confirm} onChange={e=>setConfirm(e.target.value)} required/>

            {/* Password strength */}
            {password.length>0&&(
              <div style={{marginBottom:14}}>
                <div style={{height:4,borderRadius:4,background:C.border,overflow:"hidden"}}>
                  <div style={{height:"100%",borderRadius:4,transition:"width 0.3s",
                    width:`${Math.min(password.length/12*100,100)}%`,
                    background:password.length<8?C.coral:password.length<10?C.gold:C.mint}}/>
                </div>
                <div style={{fontSize:10,color:C.textLt,marginTop:3}}>
                  {password.length<8?"Muy corta":password.length<10?"Aceptable":"Contraseña segura ✓"}
                </div>
              </div>
            )}

            {isMinor&&(
              <div style={{background:C.purpleLt,border:`1.5px solid ${C.purple}30`,borderRadius:12,padding:"10px 14px",marginBottom:12,fontSize:12,color:C.purple}}>
                🔐 Como menor de edad, después del registro deberás vincular a un tutor adulto para activar tu cuenta completa.
              </div>
            )}

            <button type="submit" disabled={loading} style={btn(`linear-gradient(135deg,${selectedRole?.color||C.mint},${C.mintDk})`)}>
              {loading?"Creando cuenta…":"🎉 Crear mi cuenta"}
            </button>
            <div style={{fontSize:11,color:C.textLt,textAlign:"center"}}>
              Al registrarte aceptas los términos de uso de KidQuest
            </div>
          </form>
        )}

        {/* ══ VERIFY EMAIL (adult) ════════════════════════════ */}
        {mode==="verify_email"&&(
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:56,marginBottom:12}}>📧</div>
            <div style={{fontWeight:900,fontSize:20,color:C.text,marginBottom:8}}>Verifica tu email</div>
            <div style={{fontSize:13,color:C.textMed,marginBottom:18,lineHeight:1.6}}>
              Enviamos un link de confirmación a <b>{email}</b>.<br/>
              Revisa tu bandeja de entrada (y carpeta de spam).
            </div>
            <div style={{background:C.goldLt,borderRadius:12,padding:"10px 14px",marginBottom:16,fontSize:12,color:C.goldDk,fontWeight:600}}>
              ⚠️ Debes verificar tu email antes de poder entrar a la app
            </div>
            <button onClick={()=>go("login")} style={btn(`linear-gradient(135deg,${C.mint},${C.mintDk})`)}>
              Ya verifiqué → Ir al login
            </button>
            <button type="button" onClick={async()=>{
              await supabase.auth.resend({type:"signup",email})
              ok("Email reenviado")
            }} style={{background:"none",border:"none",color:C.sky,cursor:"pointer",fontWeight:700,fontSize:13}}>
              Reenviar email
            </button>
          </div>
        )}

        {/* ══ VERIFY EMAIL MINOR (needs tutor too) ═══════════ */}
        {mode==="verify_email_minor"&&(
          <div>
            <div style={{textAlign:"center",marginBottom:16}}>
              <div style={{fontSize:48,marginBottom:8}}>📧</div>
              <div style={{fontWeight:900,fontSize:20,color:C.text,marginBottom:6}}>Cuenta creada</div>
              <div style={{fontSize:13,color:C.textMed,lineHeight:1.6}}>
                Verifica tu email en <b>{email}</b> y luego vincula a tu tutor.
              </div>
            </div>
            <div style={{background:C.purpleLt,border:`1.5px solid ${C.purple}40`,borderRadius:14,padding:14,marginBottom:14}}>
              <div style={{fontWeight:800,fontSize:14,color:C.purple,marginBottom:10}}>🔗 Vincular tutor</div>
              <div style={{fontSize:12,color:C.textMed,marginBottom:10,lineHeight:1.5}}>
                Tienes dos opciones para activar tu cuenta:
              </div>
              <div style={{background:C.card,borderRadius:11,padding:11,marginBottom:8}}>
                <div style={{fontWeight:700,fontSize:12,color:C.text,marginBottom:6}}>Opción 1 — Tu tutor ya está en la app</div>
                <div style={{fontSize:11,color:C.textMed,marginBottom:7}}>Escribe el email de tu padre, madre o tutor:</div>
                <input style={{...inp(),marginBottom:7,fontSize:13}} type="email" placeholder="email.de.mi.tutor@gmail.com"
                  value={tutorEmail} onChange={e=>setTutorEmail(e.target.value)}/>
                <button onClick={sendTutorRequest} disabled={loading}
                  style={btn(`linear-gradient(135deg,${C.purple},#5A35CC)`,{fontSize:13,padding:"10px"})}>
                  {loading?"Enviando…":"📨 Enviar solicitud"}
                </button>
              </div>
              <div style={{background:C.card,borderRadius:11,padding:11}}>
                <div style={{fontWeight:700,fontSize:12,color:C.text,marginBottom:6}}>Opción 2 — Código de invitación</div>
                <div style={{fontSize:11,color:C.textMed,marginBottom:7}}>Pídele a tu tutor que te genere un código desde su cuenta:</div>
                <input style={{...inp(),marginBottom:7,fontSize:13,letterSpacing:3,textTransform:"uppercase"}}
                  placeholder="ABC123DEFG" value={inviteCode} onChange={e=>setInviteCode(e.target.value)}/>
                <button onClick={validateInvite} disabled={loading}
                  style={btn(`linear-gradient(135deg,${C.gold},${C.goldDk})`,{fontSize:13,padding:"10px"})}>
                  {loading?"Validando…":"✅ Usar código"}
                </button>
              </div>
            </div>
            <button onClick={()=>go("login")} style={{...btn(C.border,{color:C.textMed,boxShadow:"none"})}}>
              Hacer esto después
            </button>
          </div>
        )}

        {/* ══ PENDING TUTOR (logged in but no tutor) ═════════ */}
        {mode==="pending_tutor"&&(
          <div>
            <div style={{textAlign:"center",marginBottom:16}}>
              <div style={{fontSize:48,marginBottom:8}}>🔐</div>
              <div style={{fontWeight:900,fontSize:20,color:C.text,marginBottom:6}}>Cuenta pendiente</div>
              <div style={{fontSize:13,color:C.textMed,lineHeight:1.6}}>
                Tu cuenta necesita la aprobación de un adulto tutor para activarse completamente.
              </div>
            </div>
            <div style={{background:C.purpleLt,border:`1.5px solid ${C.purple}40`,borderRadius:14,padding:14,marginBottom:14}}>
              <div style={{fontWeight:700,fontSize:13,color:C.purple,marginBottom:10}}>Vincular tutor</div>
              <input style={{...inp(),fontSize:13}} type="email" placeholder="email.de.mi.tutor@gmail.com"
                value={tutorEmail} onChange={e=>setTutorEmail(e.target.value)}/>
              <button onClick={sendTutorRequest} disabled={loading}
                style={btn(`linear-gradient(135deg,${C.purple},#5A35CC)`,{fontSize:13})}>
                {loading?"Enviando…":"📨 Enviar solicitud al tutor"}
              </button>
              <div style={{textAlign:"center",color:C.textMed,fontSize:12,margin:"8px 0"}}>— o usa un código —</div>
              <input style={{...inp({letterSpacing:3,textTransform:"uppercase"}),fontSize:13}}
                placeholder="CÓDIGO DE INVITACIÓN" value={inviteCode} onChange={e=>setInviteCode(e.target.value)}/>
              <button onClick={validateInvite} disabled={loading}
                style={btn(`linear-gradient(135deg,${C.gold},${C.goldDk})`,{fontSize:13})}>
                {loading?"Validando…":"✅ Activar con código"}
              </button>
            </div>
            <button onClick={async()=>{await supabase.auth.signOut();go("login")}}
              style={{...btn(C.border,{color:C.textMed,boxShadow:"none"})}}>
              Cerrar sesión
            </button>
          </div>
        )}

        {/* ══ FORGOT PASSWORD ════════════════════════════════ */}
        {mode==="forgot"&&(
          <form onSubmit={handleForgot}>
            <div style={{fontWeight:900,fontSize:21,color:C.text,marginBottom:4}}>Recuperar contraseña</div>
            <div style={{fontSize:13,color:C.textMed,marginBottom:16}}>Te enviaremos un link para crear una nueva contraseña</div>
            <input style={inp()} type="email" placeholder="tu@email.com" value={email} onChange={e=>setEmail(e.target.value)} required/>
            <button type="submit" disabled={loading} style={btn(`linear-gradient(135deg,${C.sky},#1565C0)`)}>
              {loading?"Enviando…":"📧 Enviar link de recuperación"}
            </button>
            <div style={{textAlign:"center"}}>
              <button type="button" onClick={()=>go("login")}
                style={{background:"none",border:"none",color:C.mint,cursor:"pointer",fontWeight:700,fontSize:13}}>
                ← Volver al login
              </button>
            </div>
          </form>
        )}
      </div>

      <div style={{marginTop:18,fontSize:11,color:C.textLt,textAlign:"center"}}>
        KidQuest v1.0 · Educación financiera para niños y adolescentes<br/>
        🔒 Plataforma segura · Protección de datos infantiles
      </div>
    </div>
  )
}
