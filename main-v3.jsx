// src/main.jsx
import { StrictMode, useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import Auth from './Auth.jsx'
import { supabase } from './supabase.js'

function Root() {
  const [session,  setSession]  = useState(undefined)
  const [profile,  setProfile]  = useState(null)
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) loadProfile(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) loadProfile(session.user.id)
      else { setProfile(null); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  const loadProfile = async (userId) => {
    try {
      setLoading(true)
      // Fetch ALL fields including admin_role
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error

      // If profile doesn't exist yet (trigger delay), retry once
      if (!data) {
        await new Promise(r => setTimeout(r, 1500))
        const { data: data2 } = await supabase
          .from('profiles').select('*').eq('id', userId).single()
        setProfile(data2)
      } else {
        setProfile(data)
      }
    } catch (err) {
      console.error('Profile load error:', err.message)
      // Still set session so user isn't stuck
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }

  if (loading || session === undefined) {
    return (
      <div style={{
        minHeight:'100vh', display:'flex', flexDirection:'column',
        alignItems:'center', justifyContent:'center',
        background:'#F0FBF6', fontFamily:"'Nunito',sans-serif"
      }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@800;900&display=swap');
          @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
          @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        `}</style>
        <div style={{fontSize:64, animation:'float 1.5s ease-in-out infinite'}}>🦎</div>
        <div style={{fontWeight:900, fontSize:24, color:'#0D2318', marginTop:12}}>KidQuest</div>
        <div style={{
          width:36, height:36, borderRadius:'50%',
          border:'4px solid #C8EDE0', borderTopColor:'#00C896',
          animation:'spin 0.8s linear infinite', marginTop:20
        }}/>
      </div>
    )
  }

  if (!session) {
    return <Auth onAuth={(session) => setSession(session)} />
  }

  return (
    <App
      userId={session.user.id}
      userEmail={session.user.email}
      initialProfile={profile}
      onSignOut={() => {
        supabase.auth.signOut()
        setSession(null)
        setProfile(null)
      }}
    />
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>
)
