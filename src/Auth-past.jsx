// src/Auth.jsx
// ═══════════════════════════════════════════════════════════
// KIDQUEST — Auth Screen (Login / Register / Reset)
// ═══════════════════════════════════════════════════════════
import { useState } from 'react'
import { signIn, signUp, resetPassword } from './supabase'

const T = {
  mint:"#00C896", mintDk:"#00A07A", mintLt:"#E0FBF2",
  gold:"#FFB300", goldLt:"#FFF5D6", goldDk:"#CC8C00",
  coral:"#FF5252", coralLt:"#FFF0F0",
  purple:"#7C4DFF", purpleLt:"#EDE7FF",
  sky:"#2196F3", skyLt:"#E8F4FD",
  text:"#0D2318", textMed:"#3D6055", textLt:"#8FB5AA",
  card:"#FFFFFF", border:"#C8EDE0",
  bg:"#F0FBF6",
}

const ROLES = [
  { id:'student', label:'Soy Estudiante',    desc:'Completo misiones y aprendo economía', icon:'🎮', color:T.mint },
  { id:'parent',  label:'Soy Padre / Tutor', desc:'Verifico tareas y gestiono la mesada', icon:'👨‍👩‍👦', color:T.gold },
  { id:'teacher', label:'Soy Profesor',       desc:'Gestiono mi clase y asigno desafíos',  icon:'🏫', color:T.sky  },
]

export default function Auth({ onAuth }) {
  const [mode,     setMode]     = useState('login')   // login | register | forgot
  const [step,     setStep]     = useState(1)          // register: 1=role, 2=form
  const [role,     setRole]     = useState('')
  const [name,     setName]     = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [success,  setSuccess]  = useState('')

  const selectedRole = ROLES.find(r => r.id === role)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const { session } = await signIn({ email, password })
      onAuth(session)
    } catch (err) {
      setError(err.message === 'Invalid login credentials'
        ? 'Email o contraseña incorrectos'
        : err.message)
    } finally { setLoading(false) }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    if (!role)            return setError('Elige tu rol primero')
    if (!name.trim())     return setError('Escribe tu nombre')
    if (password.length < 6) return setError('La contraseña debe tener al menos 6 caracteres')
    if (password !== confirm) return setError('Las contraseñas no coinciden')
    setError(''); setLoading(true)
    try {
      await signUp({ email, password, name, role })
      setSuccess('¡Cuenta creada! Revisa tu email para confirmar.')
      setMode('login')
    } catch (err) {
      setError(err.message.includes('already registered')
        ? 'Este email ya está registrado'
        : err.message)
    } finally { setLoading(false) }
  }

  const handleForgot = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      await resetPassword(email)
      setSuccess('Te enviamos un email para restablecer tu contraseña')
    } catch (err) {
      setError(err.message)
    } finally { setLoading(false) }
  }

  const inp = {
    width:'100%', padding:'12px 16px', borderRadius:14,
    border:`1.5px solid ${T.border}`, fontSize:15,
    fontFamily:"'Nunito',sans-serif", color:T.text,
    background:T.card, outline:'none', marginBottom:12,
    boxSizing:'border-box',
  }

  return (
    <div style={{
      minHeight:'100vh', display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center', padding:24,
      background:`radial-gradient(ellipse at 30% 20%,${T.mint}25,transparent 55%),
                  radial-gradient(ellipse at 70% 80%,${T.purple}15,transparent 55%),${T.bg}`,
      fontFamily:"'Nunito',sans-serif"
    }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');*{box-sizing:border-box}`}</style>

      {/* Logo */}
      <div style={{textAlign:'center', marginBottom:28}}>
        <div style={{
          width:80, height:80, borderRadius:24, margin:'0 auto 12px',
          background:`linear-gradient(135deg,${T.mint},${T.purple})`,
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:40, boxShadow:`0 8px 32px ${T.mint}60`
        }}>🦎</div>
        <div style={{fontWeight:900, fontSize:32, color:T.text, letterSpacing:-1}}>KidQuest</div>
        <div style={{fontSize:13, color:T.textMed, fontWeight:600}}>Aprende · Ahorra · Conquista</div>
      </div>

      {/* Card */}
      <div style={{
        background:T.card, borderRadius:24, padding:28, width:'100%',
        maxWidth:380, boxShadow:'0 20px 60px rgba(0,0,0,0.12)'
      }}>

        {/* Success message */}
        {success && (
          <div style={{background:T.mintLt, border:`1.5px solid ${T.mint}`, borderRadius:12,
            padding:'10px 14px', marginBottom:16, fontSize:13, color:T.mintDk, fontWeight:700}}>
            ✅ {success}
          </div>
        )}

        {/* Error message */}
        {error && (
          <div style={{background:T.coralLt, border:`1.5px solid ${T.coral}`, borderRadius:12,
            padding:'10px 14px', marginBottom:16, fontSize:13, color:T.coral, fontWeight:700}}>
            ⚠️ {error}
          </div>
        )}

        {/* ── LOGIN ── */}
        {mode === 'login' && (
          <form onSubmit={handleLogin}>
            <div style={{fontWeight:900, fontSize:22, color:T.text, marginBottom:4}}>¡Bienvenido!</div>
            <div style={{fontSize:13, color:T.textMed, marginBottom:20}}>Entra a tu cuenta de KidQuest</div>
            <input style={inp} type="email" placeholder="tu@email.com"
              value={email} onChange={e=>{setEmail(e.target.value);setError('')}} required/>
            <input style={inp} type="password" placeholder="Contraseña"
              value={password} onChange={e=>{setPassword(e.target.value);setError('')}} required/>
            <button type="submit" disabled={loading} style={{
              width:'100%', padding:'13px', borderRadius:15, border:'none',
              background:`linear-gradient(135deg,${T.mint},${T.mintDk})`,
              color:'white', fontSize:15, fontWeight:800, cursor:'pointer',
              boxShadow:`0 4px 16px ${T.mint}50`, marginBottom:12,
              opacity: loading ? 0.7 : 1
            }}>
              {loading ? 'Entrando…' : '🚀 Entrar'}
            </button>
            <div style={{textAlign:'center', fontSize:13, color:T.textMed}}>
              <button type="button" onClick={()=>{setMode('forgot');setError('');setSuccess('')}}
                style={{background:'none', border:'none', color:T.sky, cursor:'pointer', fontWeight:700}}>
                ¿Olvidaste tu contraseña?
              </button>
            </div>
            <div style={{textAlign:'center', marginTop:14, fontSize:13, color:T.textMed}}>
              ¿No tienes cuenta?{' '}
              <button type="button" onClick={()=>{setMode('register');setStep(1);setError('');setSuccess('')}}
                style={{background:'none', border:'none', color:T.mint, cursor:'pointer', fontWeight:800}}>
                Regístrate gratis
              </button>
            </div>
          </form>
        )}

        {/* ── REGISTER STEP 1: ROLE ── */}
        {mode === 'register' && step === 1 && (
          <div>
            <div style={{fontWeight:900, fontSize:22, color:T.text, marginBottom:4}}>¿Quién eres?</div>
            <div style={{fontSize:13, color:T.textMed, marginBottom:20}}>Elegir tu rol correctamente es importante</div>
            {ROLES.map(r => (
              <button key={r.id} type="button" onClick={()=>setRole(r.id)}
                style={{
                  width:'100%', marginBottom:10, padding:'14px 16px', borderRadius:16, cursor:'pointer',
                  border:`2px solid ${role===r.id ? r.color : T.border}`,
                  background: role===r.id ? r.color+'15' : T.card,
                  display:'flex', alignItems:'center', gap:14, textAlign:'left',
                  transition:'all 0.18s'
                }}>
                <span style={{fontSize:28, flexShrink:0}}>{r.icon}</span>
                <div>
                  <div style={{fontWeight:800, fontSize:15, color:T.text}}>{r.label}</div>
                  <div style={{fontSize:11, color:T.textMed}}>{r.desc}</div>
                </div>
                {role===r.id && <span style={{marginLeft:'auto', color:r.color, fontSize:20}}>✓</span>}
              </button>
            ))}
            <button type="button" onClick={()=>{if(!role){setError('Elige un rol');return;}setError('');setStep(2)}}
              style={{
                width:'100%', padding:'13px', borderRadius:15, border:'none', marginTop:4,
                background: role ? `linear-gradient(135deg,${selectedRole?.color},${selectedRole?.color}cc)` : T.border,
                color:'white', fontSize:15, fontWeight:800, cursor:'pointer'
              }}>
              Continuar →
            </button>
            <div style={{textAlign:'center', marginTop:14, fontSize:13, color:T.textMed}}>
              ¿Ya tienes cuenta?{' '}
              <button type="button" onClick={()=>{setMode('login');setError('');setSuccess('')}}
                style={{background:'none', border:'none', color:T.mint, cursor:'pointer', fontWeight:800}}>
                Inicia sesión
              </button>
            </div>
          </div>
        )}

        {/* ── REGISTER STEP 2: FORM ── */}
        {mode === 'register' && step === 2 && (
          <form onSubmit={handleRegister}>
            <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:20}}>
              <button type="button" onClick={()=>setStep(1)}
                style={{background:T.border, border:'none', borderRadius:9, padding:'5px 10px',
                  cursor:'pointer', color:T.textMed, fontSize:13, fontWeight:700}}>
                ← Atrás
              </button>
              <div>
                <div style={{fontWeight:900, fontSize:18, color:T.text}}>Crear cuenta</div>
                <div style={{fontSize:11, color:selectedRole?.color, fontWeight:700}}>
                  {selectedRole?.icon} {selectedRole?.label}
                </div>
              </div>
            </div>
            <input style={inp} type="text" placeholder="Tu nombre completo"
              value={name} onChange={e=>{setName(e.target.value);setError('')}} required/>
            <input style={inp} type="email" placeholder="tu@email.com"
              value={email} onChange={e=>{setEmail(e.target.value);setError('')}} required/>
            <input style={inp} type="password" placeholder="Contraseña (mín. 6 caracteres)"
              value={password} onChange={e=>{setPassword(e.target.value);setError('')}} required/>
            <input style={{...inp, marginBottom:20}} type="password" placeholder="Confirmar contraseña"
              value={confirm} onChange={e=>{setConfirm(e.target.value);setError('')}} required/>
            <button type="submit" disabled={loading} style={{
              width:'100%', padding:'13px', borderRadius:15, border:'none',
              background:`linear-gradient(135deg,${selectedRole?.color||T.mint},${T.mintDk})`,
              color:'white', fontSize:15, fontWeight:800, cursor:'pointer',
              boxShadow:`0 4px 16px ${T.mint}50`, opacity: loading ? 0.7 : 1
            }}>
              {loading ? 'Creando cuenta…' : '🎉 Crear mi cuenta gratis'}
            </button>
            <div style={{fontSize:11, color:T.textLt, textAlign:'center', marginTop:10}}>
              Al registrarte aceptas los términos de uso de KidQuest
            </div>
          </form>
        )}

        {/* ── FORGOT PASSWORD ── */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgot}>
            <div style={{fontWeight:900, fontSize:22, color:T.text, marginBottom:4}}>Recuperar contraseña</div>
            <div style={{fontSize:13, color:T.textMed, marginBottom:20}}>
              Te enviaremos un link para crear una nueva contraseña
            </div>
            <input style={inp} type="email" placeholder="tu@email.com"
              value={email} onChange={e=>{setEmail(e.target.value);setError('')}} required/>
            <button type="submit" disabled={loading} style={{
              width:'100%', padding:'13px', borderRadius:15, border:'none',
              background:`linear-gradient(135deg,${T.sky},#1565C0)`,
              color:'white', fontSize:15, fontWeight:800, cursor:'pointer',
              boxShadow:`0 4px 16px ${T.sky}40`, marginBottom:12,
              opacity: loading ? 0.7 : 1
            }}>
              {loading ? 'Enviando…' : '📧 Enviar link de recuperación'}
            </button>
            <div style={{textAlign:'center'}}>
              <button type="button" onClick={()=>{setMode('login');setError('');setSuccess('')}}
                style={{background:'none', border:'none', color:T.mint, cursor:'pointer',
                  fontWeight:700, fontSize:13}}>
                ← Volver al login
              </button>
            </div>
          </form>
        )}
      </div>

      <div style={{marginTop:20, fontSize:11, color:T.textLt, textAlign:'center'}}>
        KidQuest v1.0 · Educación financiera para niños y adolescentes
      </div>
    </div>
  )
}
