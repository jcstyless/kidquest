import { useState, useEffect, useRef, useCallback } from "react";

// ═══════════════════════════════════════════════════════════
// DESIGN TOKENS
// ═══════════════════════════════════════════════════════════
const T = {
  mint:"#00C896", mintDk:"#00A07A", mintLt:"#E0FBF2",
  gold:"#FFB300", goldLt:"#FFF5D6", goldDk:"#CC8C00",
  coral:"#FF5252", coralLt:"#FFF0F0",
  sky:"#2196F3",  skyLt:"#E8F4FD",
  purple:"#7C4DFF",purpleLt:"#EDE7FF",
  pink:"#FF4081",  pinkLt:"#FFE8F0",
  orange:"#FF6D00",orangeLt:"#FFF3E0",
  bg:"#F0FBF6", card:"#FFFFFF",
  text:"#0D2318", textMed:"#3D6055", textLt:"#8FB5AA",
  border:"#C8EDE0", shadow:"0 3px 18px rgba(0,200,150,0.13)",
  shadowMd:"0 6px 30px rgba(0,200,150,0.20)",
  shadowHero:"0 8px 40px rgba(0,200,150,0.28)",
};
const DARK = {
  mint:"#00C896", mintDk:"#00A07A", mintLt:"#0a2e22",
  gold:"#FFB300", goldLt:"#2a2000", goldDk:"#FFB300",
  coral:"#FF5252", coralLt:"#2d0a0a",
  sky:"#2196F3",  skyLt:"#0a1e35",
  purple:"#7C4DFF",purpleLt:"#180d35",
  pink:"#FF4081",  pinkLt:"#2d0a1a",
  orange:"#FF6D00",orangeLt:"#2d1500",
  bg:"#081810",  card:"#0f2218",
  text:"#E0F8EE", textMed:"#7ABFA8", textLt:"#3A7060",
  border:"#1A3D2E", shadow:"0 3px 18px rgba(0,0,0,0.35)",
  shadowMd:"0 6px 30px rgba(0,0,0,0.45)",
  shadowHero:"0 8px 40px rgba(0,0,0,0.55)",
};

// ═══════════════════════════════════════════════════════════
// DATA
// ═══════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════
// PERSISTENCE — localStorage with versioned schema
// ═══════════════════════════════════════════════════════════
const STORAGE_VERSION = "kq_v1";
function loadState(key, fallback) {
  try {
    const raw = localStorage.getItem(STORAGE_VERSION + "_" + key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}
function saveState(key, val) {
  try { localStorage.setItem(STORAGE_VERSION + "_" + key, JSON.stringify(val)); } catch {}
}
function clearAll() {
  try { Object.keys(localStorage).filter(k=>k.startsWith(STORAGE_VERSION)).forEach(k=>localStorage.removeItem(k)); } catch {}
}

const ROLES = { STUDENT:"student", PARENT:"parent", TEACHER:"teacher" };

const MASCOT_MSGS = {
  welcome:  ["¡Hola! Soy Kiko 🦎 tu guía en KidQuest!", "Voy a enseñarte todo sobre ahorrar y ser responsable 💪", "¡Juntos vamos a subir de nivel y conquistar el mundo!"],
  taskDone: ["¡INCREÍBLE! ¡Lo lograste! 🔥", "¡Eso se llama compromiso! ¡Sigue así! ⭐", "¡El clan te necesita! ¡Gran trabajo! 🏆"],
  rejected: ["No te preocupes 😊 la IA es exigente pero justa", "¡Inténtalo de nuevo! Busca mejor iluminación 💡", "¿Quieres que te ayude a tomar una mejor foto? 📸"],
  savings:  ["¿Sabías que si ahorras $500 por semana en 1 año tendrás $26.000? 🤯", "El dinero que guardas hoy es libertad del mañana 💎", "¡Cada peso cuenta! Los pequeños ahorros se vuelven grandes 🐷"],
  streak:   ["¡7 días seguidos! ¡Eres una leyenda! 🔥🔥🔥", "¡Tu racha es tu superpoder! No la rompas 💪", "¡El clan depende de ti! ¡Sigue adelante! ⚔️"],
};

// ═══════════════════════════════════════════════════════════
// LOOT SYSTEM — Items, rarities, chests
// ═══════════════════════════════════════════════════════════
const RARITIES = {
  common:     { id:"common",     label:"Común",       color:"#8FA8A2", bg:"#F0F5F4", glow:"#8FA8A2", pct:68.5, star:"⬜" },
  uncommon:   { id:"uncommon",   label:"Infrecuente", color:"#4DC9A0", bg:"#E6F9F3", glow:"#4DC9A0", pct:20,   star:"🟩" },
  rare:       { id:"rare",       label:"Raro",        color:"#4AAEE8", bg:"#EDF6FF", glow:"#4AAEE8", pct:10,   star:"🟦" },
  epic:       { id:"epic",       label:"Épico",       color:"#8B6BE8", bg:"#F2EEFF", glow:"#8B6BE8", pct:1,    star:"🟪" },
  legendary:  { id:"legendary",  label:"Legendario",  color:"#F5C518", bg:"#FFF8D6", glow:"#F5C518", pct:0.5,  star:"🌟" },
};

// Item types: frame | sticker | emoji
const LOOT_ITEMS = [
  // ── COMMON frames ──
  { id:"f_leaf",     type:"frame",   rarity:"common",   name:"Hoja Verde",     svgKey:"f_leaf",     desc:"Marco de hojas frescas",         css:{border:"3px solid #4DC9A0",shadow:"none"} },
  { id:"f_circle",   type:"frame",   rarity:"common",   name:"Círculo Simple", svgKey:"f_circle",   desc:"Marco minimalista",              css:{border:"3px dashed #8FA8A2",shadow:"none"} },
  { id:"f_dots",     type:"frame",   rarity:"common",   name:"Puntitos",       svgKey:"f_dots",     desc:"Marco con puntitos suaves",      css:{border:"3px dotted #4DC9A0",shadow:"none"} },
  // ── COMMON stickers ──
  { id:"s_bolt",     type:"sticker", rarity:"common",   name:"Rayo Verde",     svgKey:"s_bolt",     desc:"Sticker rayo KidQuest" },
  { id:"s_coin_kq",  type:"sticker", rarity:"common",   name:"Moneda KQ",      svgKey:"s_coin_kq",  desc:"Moneda exclusiva de KidQuest" },
  { id:"s_check_kq", type:"sticker", rarity:"common",   name:"Check KQ",       svgKey:"s_check_kq", desc:"Sello de misión cumplida" },
  { id:"s_paw",      type:"sticker", rarity:"common",   name:"Huella",         svgKey:"s_paw",      desc:"Huella de guerrero" },
  // ── COMMON avatars ──
  { id:"a_cub",      type:"avatar",  rarity:"common",   name:"Cachorro",       svgKey:"a_cub",      desc:"Cachorro de oso dibujado a mano" },
  { id:"a_sprout",   type:"avatar",  rarity:"common",   name:"Brote",          svgKey:"a_sprout",   desc:"Un brote que crece cada día" },
  { id:"a_buddy",    type:"avatar",  rarity:"common",   name:"Buddy",          svgKey:"a_buddy",    desc:"Personaje amigable redondo" },

  // ── UNCOMMON frames ──
  { id:"f_mint_glow",type:"frame",   rarity:"uncommon", name:"Resplandor Jade",svgKey:"f_mint_glow",desc:"Marco jade con brillo suave",   css:{border:"3px solid #4DC9A0",shadow:"0 0 10px #4DC9A060"} },
  { id:"f_gold_thin",type:"frame",   rarity:"uncommon", name:"Filo Dorado",    svgKey:"f_gold_thin",desc:"Marco dorado elegante",         css:{border:"3px solid #F5C518",shadow:"0 0 8px #F5C51855"} },
  // ── UNCOMMON stickers ──
  { id:"s_shield_kq",type:"sticker", rarity:"uncommon", name:"Escudo KQ",      svgKey:"s_shield_kq",desc:"Escudo oficial de KidQuest" },
  { id:"s_star3",    type:"sticker", rarity:"uncommon", name:"3 Estrellas",    svgKey:"s_star3",    desc:"Trio de estrellas plateadas" },
  { id:"s_flame",    type:"sticker", rarity:"uncommon", name:"Llama Racha",    svgKey:"s_flame",    desc:"Llama de racha activa" },
  { id:"s_piggy",    type:"sticker", rarity:"uncommon", name:"Alcancía",       svgKey:"s_piggy",    desc:"Alcancía del ahorro" },
  // ── UNCOMMON avatars ──
  { id:"a_fox_kq",   type:"avatar",  rarity:"uncommon", name:"Zorro KQ",       svgKey:"a_fox_kq",   desc:"Zorro de KidQuest con bufanda" },
  { id:"a_bot",      type:"avatar",  rarity:"uncommon", name:"Bot Amigo",      svgKey:"a_bot",      desc:"Robotito amistoso" },
  { id:"a_ninja",    type:"avatar",  rarity:"uncommon", name:"Ninja",          svgKey:"a_ninja",    desc:"Ninja del hogar" },

  // ── RARE frames ──
  { id:"f_fire",     type:"frame",   rarity:"rare",     name:"Llamas Vivas",   svgKey:"f_fire",     desc:"Marco de fuego",                css:{border:"3px solid #FF6B6B",shadow:"0 0 14px #FF6B6B90"} },
  { id:"f_ice",      type:"frame",   rarity:"rare",     name:"Cristal Hielo",  svgKey:"f_ice",      desc:"Marco de hielo cristalino",     css:{border:"3px solid #4AAEE8",shadow:"0 0 14px #4AAEE890"} },
  // ── RARE stickers ──
  { id:"s_crown_kq", type:"sticker", rarity:"rare",     name:"Corona KQ",      svgKey:"s_crown_kq", desc:"Corona exclusiva de KidQuest" },
  { id:"s_diamond",  type:"sticker", rarity:"rare",     name:"Cristal Raro",   svgKey:"s_diamond",  desc:"Cristal azul raro" },
  { id:"s_comet",    type:"sticker", rarity:"rare",     name:"Cometa",         svgKey:"s_comet",    desc:"Cometa veloz" },
  // ── RARE avatars ──
  { id:"a_wolf_kq",  type:"avatar",  rarity:"rare",     name:"Lobo Azul",      svgKey:"a_wolf_kq",  desc:"Lobo azul con cicatriz" },
  { id:"a_mage",     type:"avatar",  rarity:"rare",     name:"Mago",           svgKey:"a_mage",     desc:"Mago del ahorro con sombrero" },

  // ── EPIC frames ──
  { id:"f_rainbow",  type:"frame",   rarity:"epic",     name:"Arcoíris Épico", svgKey:"f_rainbow",  desc:"Marco arcoíris animado",        css:{border:"3px solid transparent",shadow:"0 0 24px #8B6BE8aa",gradient:"linear-gradient(white,white) padding-box, linear-gradient(135deg,#FF6B6B,#F5C518,#4DC9A0,#4AAEE8,#8B6BE8) border-box"} },
  { id:"f_galaxy",   type:"frame",   rarity:"epic",     name:"Galaxia",        svgKey:"f_galaxy",   desc:"Marco galaxia oscura",          css:{border:"3px solid #4AAEE8",shadow:"0 0 24px #4AAEE8aa,0 0 48px #8B6BE855"} },
  // ── EPIC stickers ──
  { id:"s_phoenix_s",type:"sticker", rarity:"epic",     name:"Fénix Épico",    svgKey:"s_phoenix_s",desc:"Fénix en llamas épicas" },
  { id:"s_infinity", type:"sticker", rarity:"epic",     name:"Infinito",       svgKey:"s_infinity", desc:"Símbolo del progreso infinito" },
  // ── EPIC avatars ──
  { id:"a_samurai",  type:"avatar",  rarity:"epic",     name:"Samurái",        svgKey:"a_samurai",  desc:"Samurái del orden épico" },
  { id:"a_cyborg",   type:"avatar",  rarity:"epic",     name:"Cyborg",         svgKey:"a_cyborg",   desc:"Mitad humano, mitad código" },

  // ── LEGENDARY frames ──
  { id:"f_legend",   type:"frame",   rarity:"legendary",name:"Corona Eterna",  svgKey:"f_legend",   desc:"Marco dorado legendario con corona", css:{border:"4px solid #F5C518",shadow:"0 0 32px #F5C518cc,0 0 64px #F5C51855"} },
  // ── LEGENDARY stickers ──
  { id:"s_kiko_gold",type:"sticker", rarity:"legendary",name:"Kiko Dorado",    svgKey:"s_kiko_gold",desc:"Kiko en versión legendaria dorada" },
  { id:"s_goat_kq",  type:"sticker", rarity:"legendary",name:"GOAT",           svgKey:"s_goat_kq",  desc:"Greatest Of All Time — exclusivo absoluto" },
  // ── LEGENDARY avatars ──
  { id:"a_phoenix",  type:"avatar",  rarity:"legendary",name:"Fénix",          svgKey:"a_phoenix",  desc:"Avatar legendario de fuego y renacimiento" },
  { id:"a_dios",     type:"avatar",  rarity:"legendary",name:"Dios del Hogar", svgKey:"a_dios",     desc:"El más raro de todos — 0.5% de salida" },
];

// ═══════════════════════════════════════════════════════════
// SVG ICON LIBRARY  — KidQuest exclusive hand-crafted icons
// Each returns a React SVG element. Size prop in px.
// ═══════════════════════════════════════════════════════════
function KQIcon({ id, size = 40, animated = false }) {
  const s = size;
  const icons = {
    // ── STICKERS ──
    s_bolt: (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <defs><linearGradient id="bolt_g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#4DC9A0"/><stop offset="100%" stopColor="#2FA87A"/></linearGradient></defs>
        <polygon points="22,4 10,22 19,22 16,36 30,18 21,18" fill="url(#bolt_g)" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round"/>
        <polygon points="22,4 10,22 19,22 16,36 30,18 21,18" fill="none" stroke="#4DC9A0" strokeWidth="0.5" opacity="0.6"/>
      </svg>
    ),
    s_coin_kq: (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <defs><radialGradient id="coin_g" cx="40%" cy="35%"><stop offset="0%" stopColor="#ffe88a"/><stop offset="100%" stopColor="#D4A800"/></radialGradient></defs>
        <circle cx="20" cy="20" r="16" fill="url(#coin_g)" stroke="#F5C518" strokeWidth="1.5"/>
        <circle cx="20" cy="20" r="12" fill="none" stroke="#fff" strokeWidth="1" opacity="0.4"/>
        <text x="20" y="25" textAnchor="middle" fontSize="13" fontWeight="900" fill="#7a5200" fontFamily="sans-serif">KQ</text>
      </svg>
    ),
    s_check_kq: (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <defs><linearGradient id="chk_g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#4DC9A0"/><stop offset="100%" stopColor="#2FA87A"/></linearGradient></defs>
        <circle cx="20" cy="20" r="17" fill="url(#chk_g)"/>
        <polyline points="10,20 17,27 30,13" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    s_paw: (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <ellipse cx="20" cy="26" rx="10" ry="8" fill="#8B6BE8"/>
        <ellipse cx="20" cy="24" rx="7" ry="5" fill="#c4b5fd"/>
        <circle cx="11" cy="14" r="4" fill="#8B6BE8"/>
        <circle cx="20" cy="11" r="4" fill="#8B6BE8"/>
        <circle cx="29" cy="14" r="4" fill="#8B6BE8"/>
        <circle cx="11" cy="14" r="2.5" fill="#c4b5fd"/>
        <circle cx="20" cy="11" r="2.5" fill="#c4b5fd"/>
        <circle cx="29" cy="14" r="2.5" fill="#c4b5fd"/>
      </svg>
    ),
    s_shield_kq: (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <defs><linearGradient id="sh_g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#4AAEE8"/><stop offset="100%" stopColor="#2d8fd4"/></linearGradient></defs>
        <path d="M20 4 L34 10 L34 22 Q34 33 20 37 Q6 33 6 22 L6 10 Z" fill="url(#sh_g)" stroke="#fff" strokeWidth="1.5"/>
        <path d="M20 10 L28 14 L28 22 Q28 29 20 32 Q12 29 12 22 L12 14 Z" fill="none" stroke="#fff" strokeWidth="1" opacity="0.4"/>
        <text x="20" y="26" textAnchor="middle" fontSize="11" fontWeight="900" fill="#fff" fontFamily="sans-serif">KQ</text>
      </svg>
    ),
    s_star3: (
      <svg width={s} height={s} viewBox="0 0 40 40">
        {[{cx:8,cy:28,r:5},{cx:20,cy:8,r:6},{cx:32,cy:28,r:5}].map((st,i)=>(
          <g key={i}>
            <polygon points={starPoints(st.cx,st.cy,st.r,st.r*0.45,5)} fill={["#8FA8A2","#F5C518","#8FA8A2"][i]} stroke="#fff" strokeWidth="1"/>
          </g>
        ))}
        <polygon points={starPoints(20,20,7,3,5)} fill="#F5C518" stroke="#fff" strokeWidth="1"/>
      </svg>
    ),
    s_flame: (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <defs><linearGradient id="fl_g" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stopColor="#FF6B6B"/><stop offset="60%" stopColor="#F5C518"/><stop offset="100%" stopColor="#fff"/></linearGradient></defs>
        <path d="M20 36 C10 36 6 28 8 20 C10 14 14 12 16 8 C17 12 15 16 18 18 C18 14 20 10 24 8 C22 14 26 18 26 24 C28 20 28 16 26 12 C32 16 34 24 30 30 C28 34 24 36 20 36Z" fill="url(#fl_g)"/>
        <ellipse cx="20" cy="28" rx="5" ry="4" fill="#fff" opacity="0.3"/>
      </svg>
    ),
    s_piggy: (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <ellipse cx="20" cy="23" rx="13" ry="11" fill="#FF9BB5"/>
        <circle cx="20" cy="14" r="8" fill="#FF9BB5"/>
        <circle cx="17" cy="12" r="1.5" fill="#c46080"/>
        <circle cx="23" cy="12" r="1.5" fill="#c46080"/>
        <ellipse cx="20" cy="18" rx="3" ry="2" fill="#c46080"/>
        <rect x="19" y="4" width="3" height="6" rx="1.5" fill="#F5C518"/>
        <ellipse cx="28" cy="22" rx="3" ry="2.5" fill="#FFB3C8"/>
        <path d="M26 32 Q24 36 22 35" stroke="#c46080" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      </svg>
    ),
    s_crown_kq: (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <defs><linearGradient id="cr_g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#ffe88a"/><stop offset="100%" stopColor="#D4A800"/></linearGradient></defs>
        <path d="M6 28 L6 14 L13 22 L20 8 L27 22 L34 14 L34 28 Z" fill="url(#cr_g)" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round"/>
        <rect x="6" y="28" width="28" height="5" rx="2" fill="#D4A800"/>
        <circle cx="20" cy="8" r="3" fill="#FF6B6B"/>
        <circle cx="6" cy="14" r="2.5" fill="#4AAEE8"/>
        <circle cx="34" cy="14" r="2.5" fill="#4DC9A0"/>
      </svg>
    ),
    s_diamond: (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <defs><linearGradient id="dm_g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#a8d8ff"/><stop offset="100%" stopColor="#4AAEE8"/></linearGradient></defs>
        <polygon points="20,4 34,16 20,38 6,16" fill="url(#dm_g)" stroke="#fff" strokeWidth="1.5"/>
        <polygon points="20,4 34,16 20,20 6,16" fill="#c8e9ff" opacity="0.5"/>
        <line x1="6" y1="16" x2="34" y2="16" stroke="#fff" strokeWidth="1" opacity="0.6"/>
        <line x1="20" y1="4" x2="20" y2="38" stroke="#fff" strokeWidth="0.8" opacity="0.4"/>
      </svg>
    ),
    s_comet: (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <defs><linearGradient id="cm_g" x1="1" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#F5C518"/><stop offset="100%" stopColor="#FF6B6B" stopOpacity="0"/></linearGradient></defs>
        <path d="M32 8 Q12 12 6 32" stroke="url(#cm_g)" strokeWidth="5" strokeLinecap="round" fill="none"/>
        <circle cx="32" cy="8" r="6" fill="#F5C518"/>
        <circle cx="32" cy="8" r="3" fill="#fff"/>
      </svg>
    ),
    s_phoenix_s: (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <defs>
          <linearGradient id="ph_g" x1="0" y1="1" x2="1" y2="0"><stop offset="0%" stopColor="#FF6B6B"/><stop offset="50%" stopColor="#F5C518"/><stop offset="100%" stopColor="#FF9BB5"/></linearGradient>
        </defs>
        <path d="M20 32 C20 32 8 28 6 18 C6 12 10 8 14 10 C12 14 14 18 20 20 C26 18 28 14 26 10 C30 8 34 12 34 18 C32 28 20 32 20 32Z" fill="url(#ph_g)"/>
        <path d="M15 10 C16 6 18 4 20 4 C22 4 24 6 25 10" fill="#F5C518" stroke="#FF6B6B" strokeWidth="1"/>
        <circle cx="20" cy="14" r="3" fill="#fff" opacity="0.6"/>
      </svg>
    ),
    s_infinity: (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <defs><linearGradient id="inf_g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#8B6BE8"/><stop offset="100%" stopColor="#4AAEE8"/></linearGradient></defs>
        <path d="M14 20 C14 14 8 10 6 14 C4 18 8 26 14 26 C18 26 22 20 20 20 C18 20 22 14 26 14 C32 14 36 18 34 22 C32 26 28 26 26 26 C22 26 26 20 14 20Z" fill="none" stroke="url(#inf_g)" strokeWidth="4" strokeLinecap="round"/>
      </svg>
    ),
    s_kiko_gold: (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <defs><linearGradient id="kk_g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#ffe88a"/><stop offset="100%" stopColor="#D4A800"/></linearGradient></defs>
        <ellipse cx="20" cy="24" rx="10" ry="8" fill="url(#kk_g)"/>
        <circle cx="20" cy="16" r="9" fill="url(#kk_g)"/>
        <circle cx="16" cy="14" r="2" fill="#7a5200"/>
        <circle cx="24" cy="14" r="2" fill="#7a5200"/>
        <circle cx="16.5" cy="13.5" r="0.8" fill="#fff"/>
        <circle cx="24.5" cy="13.5" r="0.8" fill="#fff"/>
        <path d="M16 19 Q20 22 24 19" fill="none" stroke="#7a5200" strokeWidth="1.5" strokeLinecap="round"/>
        <ellipse cx="20" cy="18" rx="2.5" ry="1.5" fill="#c8902a"/>
        <path d="M10 12 L6 8 M13 9 L11 5" stroke="url(#kk_g)" strokeWidth="2" strokeLinecap="round"/>
        <path d="M30 12 L34 8 M27 9 L29 5" stroke="url(#kk_g)" strokeWidth="2" strokeLinecap="round"/>
        <polygon points="20,2 22,8 28,8 23,12 25,18 20,14 15,18 17,12 12,8 18,8" fill="#F5C518" opacity="0.7" transform="scale(0.5) translate(20,2)"/>
      </svg>
    ),
    s_goat_kq: (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <defs><radialGradient id="gt_g" cx="40%" cy="30%"><stop offset="0%" stopColor="#fff"/><stop offset="100%" stopColor="#d0d0d0"/></radialGradient></defs>
        <ellipse cx="20" cy="26" rx="11" ry="9" fill="url(#gt_g)"/>
        <circle cx="20" cy="16" r="9" fill="url(#gt_g)"/>
        <path d="M13 10 L10 4 L15 8" fill="#e0e0e0" stroke="#b0b0b0" strokeWidth="1"/>
        <path d="M27 10 L30 4 L25 8" fill="#e0e0e0" stroke="#b0b0b0" strokeWidth="1"/>
        <circle cx="17" cy="14" r="1.8" fill="#333"/>
        <circle cx="23" cy="14" r="1.8" fill="#333"/>
        <circle cx="17.5" cy="13.5" r="0.7" fill="#fff"/>
        <circle cx="23.5" cy="13.5" r="0.7" fill="#fff"/>
        <ellipse cx="20" cy="18" rx="3" ry="2" fill="#d0b090"/>
        <path d="M16 20 Q20 23 24 20" fill="none" stroke="#888" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M16 32 L14 38 M24 32 L26 38" stroke="#d0d0d0" strokeWidth="2.5" strokeLinecap="round"/>
        <rect x="14" y="2" width="12" height="4" rx="2" fill="#F5C518"/>
        <text x="20" y="5.5" textAnchor="middle" fontSize="3.5" fontWeight="900" fill="#7a5200" fontFamily="sans-serif">GOAT</text>
      </svg>
    ),
    // ── AVATARS ──
    a_cub: (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <circle cx="20" cy="20" r="18" fill="#c8a882"/>
        <circle cx="12" cy="10" r="5" fill="#c8a882"/>
        <circle cx="28" cy="10" r="5" fill="#c8a882"/>
        <circle cx="12" cy="10" r="3" fill="#e8c8a0"/>
        <circle cx="28" cy="10" r="3" fill="#e8c8a0"/>
        <circle cx="20" cy="22" r="10" fill="#e8c8a0"/>
        <circle cx="16" cy="18" r="2.5" fill="#3d2b1a"/>
        <circle cx="24" cy="18" r="2.5" fill="#3d2b1a"/>
        <circle cx="16.7" cy="17.3" r="1" fill="#fff"/>
        <circle cx="24.7" cy="17.3" r="1" fill="#fff"/>
        <ellipse cx="20" cy="23" rx="3.5" ry="2.5" fill="#c8a882"/>
        <circle cx="19" cy="22.5" r="1" fill="#3d2b1a"/>
        <circle cx="21" cy="22.5" r="1" fill="#3d2b1a"/>
        <path d="M16 26 Q20 29 24 26" fill="none" stroke="#3d2b1a" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    a_sprout: (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <circle cx="20" cy="20" r="18" fill="#E6F9F3"/>
        <circle cx="20" cy="20" r="18" fill="none" stroke="#4DC9A0" strokeWidth="1.5"/>
        <path d="M20 30 L20 18" stroke="#2FA87A" strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M20 22 Q14 18 12 12 Q18 12 20 18" fill="#4DC9A0"/>
        <path d="M20 18 Q26 14 28 8 Q22 10 20 18" fill="#2FA87A"/>
        <circle cx="20" cy="32" r="3" fill="#c8a882"/>
        <ellipse cx="20" cy="34" rx="5" ry="2" fill="#c8a882" opacity="0.5"/>
        <circle cx="20" cy="16" r="2" fill="#F5C518" opacity="0.8"/>
      </svg>
    ),
    a_buddy: (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <circle cx="20" cy="20" r="17" fill="#4AAEE8"/>
        <circle cx="20" cy="18" r="11" fill="#EDF6FF"/>
        <circle cx="16" cy="16" r="3" fill="#1a2e28"/>
        <circle cx="24" cy="16" r="3" fill="#1a2e28"/>
        <circle cx="17" cy="15" r="1.2" fill="#fff"/>
        <circle cx="25" cy="15" r="1.2" fill="#fff"/>
        <path d="M14 22 Q20 26 26 22" fill="none" stroke="#1a2e28" strokeWidth="2" strokeLinecap="round"/>
        <ellipse cx="14" cy="20" rx="2" ry="1.5" fill="#FF9BB5"/>
        <ellipse cx="26" cy="20" rx="2" ry="1.5" fill="#FF9BB5"/>
        <path d="M14 8 Q20 4 26 8" fill="none" stroke="#EDF6FF" strokeWidth="2.5" strokeLinecap="round"/>
      </svg>
    ),
    a_fox_kq: (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <circle cx="20" cy="20" r="18" fill="#FF8C42"/>
        <polygon points="12,10 8,2 16,8" fill="#FF8C42" stroke="#FF6B6B" strokeWidth="1"/>
        <polygon points="28,10 32,2 24,8" fill="#FF8C42" stroke="#FF6B6B" strokeWidth="1"/>
        <polygon points="12,10 8,2 16,8" fill="#ffe0cc" opacity="0.6"/>
        <polygon points="28,10 32,2 24,8" fill="#ffe0cc" opacity="0.6"/>
        <circle cx="20" cy="22" r="11" fill="#ffe0cc"/>
        <circle cx="15" cy="19" r="3" fill="#1a1a1a"/>
        <circle cx="25" cy="19" r="3" fill="#1a1a1a"/>
        <circle cx="16" cy="18" r="1.3" fill="#fff"/>
        <circle cx="26" cy="18" r="1.3" fill="#fff"/>
        <ellipse cx="20" cy="24" rx="3" ry="2" fill="#FF8C42"/>
        <circle cx="19" cy="23.5" r="0.8" fill="#333"/>
        <circle cx="21" cy="23.5" r="0.8" fill="#333"/>
        <path d="M15 27 Q20 30 25 27" fill="none" stroke="#333" strokeWidth="1.5" strokeLinecap="round"/>
        <rect x="14" y="30" width="12" height="4" rx="2" fill="#4AAEE8"/>
        <text x="20" y="33.5" textAnchor="middle" fontSize="3" fontWeight="900" fill="#fff" fontFamily="sans-serif">KQ</text>
      </svg>
    ),
    a_bot: (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x="8" y="12" width="24" height="22" rx="5" fill="#4AAEE8"/>
        <rect x="11" y="15" width="18" height="12" rx="3" fill="#EDF6FF"/>
        <circle cx="16" cy="21" r="3" fill="#4DC9A0"/>
        <circle cx="24" cy="21" r="3" fill="#FF6B6B"/>
        <circle cx="16.5" cy="20.5" r="1.5" fill="#1a2e28"/>
        <circle cx="24.5" cy="20.5" r="1.5" fill="#1a2e28"/>
        <rect x="14" y="30" width="12" height="3" rx="1.5" fill="#2d8fd4"/>
        <circle cx="20" cy="9" r="4" fill="#4AAEE8"/>
        <rect x="19" y="8" width="2" height="5" fill="#2d8fd4"/>
        <circle cx="20" cy="7" r="2" fill="#F5C518"/>
        <rect x="4" y="18" width="5" height="10" rx="2.5" fill="#2d8fd4"/>
        <rect x="31" y="18" width="5" height="10" rx="2.5" fill="#2d8fd4"/>
      </svg>
    ),
    a_ninja: (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <circle cx="20" cy="20" r="18" fill="#1a2e28"/>
        <circle cx="20" cy="19" r="12" fill="#2FA87A"/>
        <rect x="8" y="17" width="24" height="5" rx="2.5" fill="#1a2e28"/>
        <circle cx="16" cy="19" r="2.5" fill="#1a1a1a"/>
        <circle cx="24" cy="19" r="2.5" fill="#1a1a1a"/>
        <circle cx="16.8" cy="18.3" r="1" fill="#4AAEE8"/>
        <circle cx="24.8" cy="18.3" r="1" fill="#4AAEE8"/>
        <path d="M28 8 L36 4 L32 14 Z" fill="#F5C518" opacity="0.8"/>
        <path d="M28 8 L36 4 L32 14 Z" fill="none" stroke="#fff" strokeWidth="0.5"/>
      </svg>
    ),
    a_wolf_kq: (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <circle cx="20" cy="20" r="18" fill="#2d4a7a"/>
        <polygon points="13,12 9,4 17,10" fill="#3d5a8a"/>
        <polygon points="27,12 31,4 23,10" fill="#3d5a8a"/>
        <circle cx="20" cy="22" r="11" fill="#5a7ab0"/>
        <circle cx="15" cy="18" r="3" fill="#fff"/>
        <circle cx="25" cy="18" r="3" fill="#fff"/>
        <circle cx="15.5" cy="18.5" r="2" fill="#1a2e28"/>
        <circle cx="25.5" cy="18.5" r="2" fill="#1a2e28"/>
        <circle cx="15.8" cy="18.2" r="0.8" fill="#4AAEE8"/>
        <circle cx="25.8" cy="18.2" r="0.8" fill="#4AAEE8"/>
        <path d="M14 23 Q16 21 20 22 Q24 21 26 23" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M12 16 Q9 20 11 24" stroke="#FF6B6B" strokeWidth="2" strokeLinecap="round" opacity="0.7"/>
      </svg>
    ),
    a_mage: (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <circle cx="20" cy="24" r="13" fill="#8B6BE8"/>
        <circle cx="20" cy="18" r="9" fill="#c4b5fd"/>
        <circle cx="16" cy="16" r="2.5" fill="#1a1a1a"/>
        <circle cx="24" cy="16" r="2.5" fill="#1a1a1a"/>
        <circle cx="16.8" cy="15.3" r="1" fill="#fff"/>
        <circle cx="24.8" cy="15.3" r="1" fill="#fff"/>
        <path d="M15 21 Q20 24 25 21" fill="none" stroke="#5a3fc0" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M11 10 Q14 2 20 6 Q26 2 29 10 L20 8 Z" fill="#5a3fc0"/>
        <circle cx="20" cy="5" r="3" fill="#F5C518"/>
        <line x1="20" y1="5" x2="20" y2="2" stroke="#F5C518" strokeWidth="1.5"/>
        <circle cx="20" cy="1.5" r="1.5" fill="#FF6B6B"/>
        <path d="M8 28 Q4 32 6 36" stroke="#c4b5fd" strokeWidth="2" strokeLinecap="round"/>
        <circle cx="6" cy="36" r="2" fill="#F5C518"/>
      </svg>
    ),
    a_samurai: (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <circle cx="20" cy="20" r="18" fill="#c0392b"/>
        <rect x="8" y="14" width="24" height="18" rx="4" fill="#2d1a1a"/>
        <circle cx="20" cy="16" r="9" fill="#e8c8a0"/>
        <rect x="6" y="8" width="28" height="10" rx="3" fill="#c0392b"/>
        <rect x="10" y="6" width="20" height="4" rx="2" fill="#8B0000"/>
        <circle cx="16" cy="16" r="2.5" fill="#1a1a1a"/>
        <circle cx="24" cy="16" r="2.5" fill="#1a1a1a"/>
        <circle cx="16.8" cy="15.3" r="1" fill="#fff"/>
        <circle cx="24.8" cy="15.3" r="1" fill="#fff"/>
        <path d="M15 21 Q20 24 25 21" fill="none" stroke="#5a3020" strokeWidth="1.5" strokeLinecap="round"/>
        <rect x="10" y="26" width="20" height="3" rx="1.5" fill="#c0392b"/>
        <rect x="28" y="10" width="3" height="22" rx="1.5" fill="#c8a882" transform="rotate(15,28,10)"/>
      </svg>
    ),
    a_cyborg: (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <circle cx="20" cy="20" r="18" fill="#1a2e28"/>
        <circle cx="20" cy="18" r="10" fill="#2FA87A"/>
        <rect x="10" y="13" width="8" height="10" rx="2" fill="#1a1a1a"/>
        <circle cx="14" cy="18" r="3" fill="#4AAEE8"/>
        <circle cx="14" cy="18" r="1.5" fill="#00d4ff"/>
        <circle cx="24" cy="18" r="3" fill="#e8c8a0"/>
        <circle cx="24.8" cy="17.3" r="1" fill="#fff"/>
        <path d="M16 23 Q20 26 24 23" fill="none" stroke="#4AAEE8" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="18" y1="13" x2="22" y2="13" stroke="#4DC9A0" strokeWidth="1" opacity="0.8"/>
        <line x1="10" y1="18" x2="6" y2="16" stroke="#4AAEE8" strokeWidth="2" strokeLinecap="round"/>
        <circle cx="5" cy="15.5" r="2" fill="#4AAEE8"/>
        <rect x="14" y="28" width="12" height="5" rx="2" fill="#2FA87A"/>
        <line x1="17" y1="30" x2="23" y2="30" stroke="#4DC9A0" strokeWidth="1"/>
        <line x1="17" y1="32" x2="21" y2="32" stroke="#4DC9A0" strokeWidth="1"/>
      </svg>
    ),
    a_phoenix: (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <defs>
          <radialGradient id="fire_bg" cx="50%" cy="60%"><stop offset="0%" stopColor="#FF8C42"/><stop offset="100%" stopColor="#8B0000"/></radialGradient>
          <linearGradient id="wing_g" x1="0" y1="1" x2="1" y2="0"><stop offset="0%" stopColor="#F5C518"/><stop offset="100%" stopColor="#FF6B6B"/></linearGradient>
        </defs>
        <circle cx="20" cy="20" r="18" fill="url(#fire_bg)"/>
        <path d="M20 32 C16 30 6 24 6 14 C6 8 12 6 16 10 C14 14 15 18 20 20 C25 18 26 14 24 10 C28 6 34 8 34 14 C34 24 24 30 20 32Z" fill="url(#wing_g)"/>
        <path d="M14 10 C12 6 14 2 17 4 C16 7 18 9 20 10" fill="#F5C518"/>
        <path d="M26 10 C28 6 26 2 23 4 C24 7 22 9 20 10" fill="#FF6B6B"/>
        <circle cx="17" cy="16" r="2.5" fill="#1a1a1a"/>
        <circle cx="23" cy="16" r="2.5" fill="#1a1a1a"/>
        <circle cx="17.8" cy="15.3" r="1" fill="#F5C518"/>
        <circle cx="23.8" cy="15.3" r="1" fill="#F5C518"/>
        <path d="M16 20 Q20 23 24 20" fill="none" stroke="#F5C518" strokeWidth="1.5" strokeLinecap="round"/>

      </svg>
    ),
    a_dios: (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <defs>
          <radialGradient id="god_bg" cx="50%" cy="40%"><stop offset="0%" stopColor="#ffe88a"/><stop offset="60%" stopColor="#F5C518"/><stop offset="100%" stopColor="#8B6000"/></radialGradient>
          <radialGradient id="halo_g" cx="50%" cy="50%"><stop offset="60%" stopColor="transparent"/><stop offset="100%" stopColor="#F5C518"/></radialGradient>
        </defs>
        <circle cx="20" cy="20" r="18" fill="#1a2e28"/>
        <ellipse cx="20" cy="8" rx="12" ry="4" fill="none" stroke="#F5C518" strokeWidth="2.5" opacity="0.9"/>
        <circle cx="20" cy="22" r="12" fill="url(#god_bg)"/>
        <polygon points="20,6 22,12 28,12 23,16 25,22 20,18 15,22 17,16 12,12 18,12" fill="#fff" opacity="0.9"/>
        <circle cx="16" cy="20" r="2.5" fill="#1a1a1a"/>
        <circle cx="24" cy="20" r="2.5" fill="#1a1a1a"/>
        <circle cx="16.8" cy="19.3" r="1" fill="#fff"/>
        <circle cx="24.8" cy="19.3" r="1" fill="#fff"/>
        <path d="M15 25 Q20 28 25 25" fill="none" stroke="#1a1a1a" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="8" cy="20" r="3" fill="#F5C518" opacity="0.6"/>
        <circle cx="32" cy="20" r="3" fill="#F5C518" opacity="0.6"/>

      </svg>
    ),
  };
  return icons[id] || (
    <svg width={s} height={s} viewBox="0 0 40 40">
      <circle cx="20" cy="20" r="18" fill="#DFF0EA"/>
      <text x="20" y="25" textAnchor="middle" fontSize="16" fill="#4DC9A0">?</text>
    </svg>
  );
}

// Star polygon helper

// ══════════════════════════════════════════════
// UNIQUE SVG NAV & UI ICONS  (zero phone emojis)
// ══════════════════════════════════════════════
const NAV = {
  home:(a,C)=><svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M3 11L12 3L21 11V21C21 21.6 20.6 22 20 22H16V16H8V22H4C3.4 22 3 21.6 3 21V11Z" fill={a?C.mint:"none"} fillOpacity={a?0.15:0} stroke={a?C.mint:C.textLt} strokeWidth="1.8" strokeLinejoin="round"/><rect x="9" y="16" width="6" height="6" rx="1" fill={a?C.mint:C.textLt} opacity="0.6"/></svg>,
  tasks:(a,C)=><svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="3" y="2" width="18" height="20" rx="3" fill={a?C.mint:C.textLt} fillOpacity="0.1" stroke={a?C.mint:C.textLt} strokeWidth="1.8"/><path d="M7 8L10 11L15 6" stroke={a?C.mint:C.textLt} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M7 14L10 17L15 12" stroke={a?C.mint:C.textLt} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/></svg>,
  clan:(a,C)=><svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 2L14.5 8H21L16 12L18 18L12 14L6 18L8 12L3 8H9.5L12 2Z" fill={a?C.mint:C.textLt} fillOpacity={a?0.2:0.1} stroke={a?C.mint:C.textLt} strokeWidth="1.4" strokeLinejoin="round"/><circle cx="12" cy="10" r="2.5" fill={a?C.mint:C.textLt} opacity="0.5"/></svg>,
  shop:(a,C)=><svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="2" y="11" width="20" height="11" rx="2.5" fill={a?C.gold:C.textLt} fillOpacity={a?0.85:0.25}/><rect x="2" y="6" width="20" height="7" rx="2.5" fill={a?C.gold:C.textLt} fillOpacity={a?0.5:0.15}/><rect x="2" y="11" width="20" height="3" fill={a?C.goldDk:C.textLt} opacity="0.4"/><rect x="9" y="10" width="6" height="4" rx="2" fill="white" opacity={a?0.9:0.4}/><circle cx="12" cy="12" r="1.2" fill={a?C.goldDk:C.textLt}/></svg>,
  chat:(a,C)=><svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M4 4H20C20.6 4 21 4.4 21 5V16C21 16.6 20.6 17 20 17H7L3 21V5C3 4.4 3.4 4 4 4Z" fill={a?C.mint:C.textLt} fillOpacity={a?0.12:0.06} stroke={a?C.mint:C.textLt} strokeWidth="1.8" strokeLinejoin="round"/><circle cx="8" cy="10.5" r="1.3" fill={a?C.mint:C.textLt}/><circle cx="12" cy="10.5" r="1.3" fill={a?C.mint:C.textLt}/><circle cx="16" cy="10.5" r="1.3" fill={a?C.mint:C.textLt}/></svg>,
  me:(a,C)=><svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4.5" fill={a?C.mint:C.textLt} fillOpacity={a?0.7:0.25} stroke={a?C.mint:C.textLt} strokeWidth="1.4"/><path d="M3 21C3 16.6 7.1 13 12 13C16.9 13 21 16.6 21 21" stroke={a?C.mint:C.textLt} strokeWidth="2" strokeLinecap="round"/></svg>,
  validate:(a,C)=><svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9.5" fill={a?C.gold:C.textLt} fillOpacity={a?0.12:0.05} stroke={a?C.gold:C.textLt} strokeWidth="1.6"/><path d="M7.5 12L10.5 15L16.5 9" stroke={a?C.gold:C.textLt} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  progress:(a,C)=><svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="2" y="17" width="5" height="6" rx="1.5" fill={a?C.gold:C.textLt} opacity={a?0.4:0.2}/><rect x="9.5" y="11" width="5" height="12" rx="1.5" fill={a?C.gold:C.textLt} opacity={a?0.7:0.35}/><rect x="17" y="5" width="5" height="18" rx="1.5" fill={a?C.gold:C.textLt}/><path d="M2 8L8 5L14 9L22 4" stroke={a?C.gold:C.textLt} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  allowance:(a,C)=><svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="1" y="6" width="22" height="15" rx="3" fill={a?C.gold:C.textLt} fillOpacity={a?0.12:0.06} stroke={a?C.gold:C.textLt} strokeWidth="1.6"/><circle cx="12" cy="13.5" r="3.5" fill={a?C.gold:C.textLt} fillOpacity="0.5" stroke={a?C.gold:C.textLt} strokeWidth="1.3"/><path d="M12 10.5V12.5M12 14.5V16.5M10 13.5H11.5M12.5 13.5H14" stroke={a?C.gold:C.textLt} strokeWidth="1.2" strokeLinecap="round"/></svg>,
  clanchat:(a,C)=><svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M4 4H20C20.6 4 21 4.4 21 5V16C21 16.6 20.6 17 20 17H7L3 21V5C3 4.4 3.4 4 4 4Z" fill={a?C.gold:C.textLt} fillOpacity={a?0.12:0.06} stroke={a?C.gold:C.textLt} strokeWidth="1.8" strokeLinejoin="round"/><circle cx="8" cy="10.5" r="1.3" fill={a?C.gold:C.textLt}/><circle cx="12" cy="10.5" r="1.3" fill={a?C.gold:C.textLt}/><circle cx="16" cy="10.5" r="1.3" fill={a?C.gold:C.textLt}/></svg>,
  qrcode:(a,C)=><svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="2" y="2" width="9" height="9" rx="2" fill={a?C.gold:C.textLt} fillOpacity="0.15" stroke={a?C.gold:C.textLt} strokeWidth="1.4"/><rect x="13" y="2" width="9" height="9" rx="2" fill={a?C.gold:C.textLt} fillOpacity="0.15" stroke={a?C.gold:C.textLt} strokeWidth="1.4"/><rect x="2" y="13" width="9" height="9" rx="2" fill={a?C.gold:C.textLt} fillOpacity="0.15" stroke={a?C.gold:C.textLt} strokeWidth="1.4"/><rect x="4.5" y="4.5" width="4" height="4" rx="1" fill={a?C.gold:C.textLt}/><rect x="15.5" y="4.5" width="4" height="4" rx="1" fill={a?C.gold:C.textLt}/><rect x="4.5" y="15.5" width="4" height="4" rx="1" fill={a?C.gold:C.textLt}/><rect x="14" y="13" width="3" height="3" rx="0.8" fill={a?C.gold:C.textLt}/><rect x="19" y="13" width="3" height="3" rx="0.8" fill={a?C.gold:C.textLt} opacity="0.6"/><rect x="14" y="19" width="3" height="3" rx="0.8" fill={a?C.gold:C.textLt} opacity="0.6"/><rect x="19" y="19" width="3" height="3" rx="0.8" fill={a?C.gold:C.textLt}/></svg>,
  panel:(a,C)=><svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="2" y="2" width="9" height="10" rx="2" fill={a?C.sky:C.textLt} opacity={a?0.6:0.25}/><rect x="13" y="2" width="9" height="5" rx="2" fill={a?C.sky:C.textLt} opacity={a?0.3:0.15}/><rect x="13" y="9" width="9" height="13" rx="2" fill={a?C.sky:C.textLt} opacity={a?0.6:0.25}/><rect x="2" y="14" width="9" height="8" rx="2" fill={a?C.sky:C.textLt} opacity={a?0.3:0.15}/></svg>,
  assign:(a,C)=><svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="3" y="2" width="14" height="18" rx="2.5" fill={a?C.sky:C.textLt} fillOpacity={a?0.12:0.06} stroke={a?C.sky:C.textLt} strokeWidth="1.6"/><path d="M7 8H13M7 12H11" stroke={a?C.sky:C.textLt} strokeWidth="1.8" strokeLinecap="round"/><circle cx="19" cy="18" r="4.5" fill={a?C.sky:C.textLt}/><path d="M16.5 18H21.5M19 15.5V20.5" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>,
  ranking:(a,C)=><svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 2L13.5 7H19L14.5 10.5L16 16L12 13L8 16L9.5 10.5L5 7H10.5L12 2Z" fill={a?C.sky:C.textLt} fillOpacity={a?0.2:0.08} stroke={a?C.sky:C.textLt} strokeWidth="1.3"/><path d="M5 22V19M12 22V15M19 22V19" stroke={a?C.sky:C.textLt} strokeWidth="2.5" strokeLinecap="round"/><circle cx="5" cy="17" r="1.8" fill={a?C.sky:C.textLt} opacity="0.7"/><circle cx="12" cy="13" r="2" fill={a?C.sky:C.textLt}/><circle cx="19" cy="17" r="1.8" fill={a?C.sky:C.textLt} opacity="0.7"/></svg>,
  store:(a,C)=><svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M3 9L5 3H19L21 9V10C21 10.6 20.6 11 20 11H4C3.4 11 3 10.6 3 10V9Z" fill={a?C.gold:C.textLt} fillOpacity={a?0.3:0.1} stroke={a?C.gold:C.textLt} strokeWidth="1.6"/><rect x="3" y="11" width="18" height="10" rx="2" fill={a?C.gold:C.textLt} fillOpacity={a?0.15:0.06} stroke={a?C.gold:C.textLt} strokeWidth="1.6"/><path d="M9 11V21M15 11V21" stroke={a?C.gold:C.textLt} strokeWidth="1.2" opacity="0.5"/></svg>,
  perfil:(a,C)=><svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4.5" fill={a?C.gold:C.textLt} fillOpacity={a?0.7:0.25} stroke={a?C.gold:C.textLt} strokeWidth="1.4"/><path d="M3 21C3 16.6 7.1 13 12 13C16.9 13 21 16.6 21 21" stroke={a?C.gold:C.textLt} strokeWidth="2" strokeLinecap="round"/></svg>,
  admin:(a,C)=><svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 2L14 8H20L15 12L17 18L12 15L7 18L9 12L4 8H10L12 2Z" fill={a?C.purple:C.textLt} fillOpacity={a?0.3:0.1} stroke={a?C.purple:C.textLt} strokeWidth="1.4"/><circle cx="12" cy="10" r="2" fill={a?C.purple:C.textLt}/></svg>,
  tchat:(a,C)=><svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M4 4H20C20.6 4 21 4.4 21 5V16C21 16.6 20.6 17 20 17H7L3 21V5C3 4.4 3.4 4 4 4Z" fill={a?C.sky:C.textLt} fillOpacity={a?0.12:0.06} stroke={a?C.sky:C.textLt} strokeWidth="1.8" strokeLinejoin="round"/><circle cx="8" cy="10.5" r="1.3" fill={a?C.sky:C.textLt}/><circle cx="12" cy="10.5" r="1.3" fill={a?C.sky:C.textLt}/><circle cx="16" cy="10.5" r="1.3" fill={a?C.sky:C.textLt}/></svg>,
};

// Unique chest SVG art
function ChestSVG({id,size:s=56}){
  if(id==="basic") return <svg width={s} height={s} viewBox="0 0 56 56" fill="none"><rect x="6" y="26" width="44" height="24" rx="4" fill="#7A9490"/><rect x="6" y="16" width="44" height="14" rx="4" fill="#96B0AA"/><rect x="6" y="26" width="44" height="6" fill="#638880"/><rect x="20" y="23" width="16" height="7" rx="3.5" fill="#B8CEC8"/><circle cx="28" cy="26.5" r="2.5" fill="#638880"/><rect x="9" y="18" width="38" height="2.5" rx="1.2" fill="white" opacity="0.35"/></svg>;
  if(id==="silver") return <svg width={s} height={s} viewBox="0 0 56 56" fill="none"><defs><linearGradient id="svcs" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#C8E0F0"/><stop offset="1" stopColor="#5890C0"/></linearGradient></defs><rect x="6" y="26" width="44" height="24" rx="4" fill="url(#svcs)"/><rect x="6" y="16" width="44" height="14" rx="4" fill="#90C0E0"/><rect x="6" y="26" width="44" height="6" fill="#4070A0"/><rect x="20" y="23" width="16" height="7" rx="3.5" fill="#D8ECFC"/><circle cx="28" cy="26.5" r="2.5" fill="#4070A0"/><circle cx="13" cy="38" r="2.5" fill="white" opacity="0.3"/><circle cx="43" cy="38" r="2.5" fill="white" opacity="0.3"/></svg>;
  if(id==="golden") return <svg width={s} height={s} viewBox="0 0 56 56" fill="none"><defs><linearGradient id="svcg1" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#FFE97A"/><stop offset="1" stopColor="#C89A00"/></linearGradient><linearGradient id="svcg2" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#F5C518"/><stop offset="1" stopColor="#A07800"/></linearGradient></defs><rect x="6" y="26" width="44" height="24" rx="4" fill="url(#svcg1)"/><rect x="6" y="16" width="44" height="14" rx="4" fill="url(#svcg2)"/><rect x="6" y="26" width="44" height="6" fill="#A07800"/><rect x="20" y="23" width="16" height="7" rx="3.5" fill="#FFE97A"/><circle cx="28" cy="26.5" r="3" fill="#C89A00"/><circle cx="28" cy="26.5" r="1.5" fill="#FFE97A"/><polygon points="28,6 30,12.5 37,12.5 31.5,16.5 33.5,23 28,19.5 22.5,23 24.5,16.5 19,12.5 26,12.5" fill="#FFE97A" opacity="0.9"/></svg>;
  return <svg width={s} height={s} viewBox="0 0 56 56" fill="none"><defs><linearGradient id="svcl1" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#C9B8FF"/><stop offset="0.5" stopColor="#8B6BE8"/><stop offset="1" stopColor="#3A1EB0"/></linearGradient></defs><rect x="6" y="26" width="44" height="24" rx="4" fill="url(#svcl1)"/><rect x="6" y="16" width="44" height="14" rx="4" fill="#A88FFF"/><rect x="6" y="26" width="44" height="6" fill="#3A1EB0"/><rect x="20" y="23" width="16" height="7" rx="3.5" fill="#C9B8FF"/><circle cx="28" cy="26.5" r="3" fill="#5A3FC0"/><circle cx="28" cy="26.5" r="1.5" fill="#C9B8FF"/>{[0,60,120,180,240,300].map(a=><line key={a} x1={28+9*Math.cos(a*Math.PI/180)} y1={16+9*Math.sin(a*Math.PI/180)} x2={28+13*Math.cos(a*Math.PI/180)} y2={16+13*Math.sin(a*Math.PI/180)} stroke="#C9B8FF" strokeWidth="2" strokeLinecap="round"/>)}<circle cx="28" cy="16" r="5" fill="#C9B8FF" opacity="0.95"/><circle cx="28" cy="16" r="2.2" fill="#8B6BE8"/></svg>;
}

function starPoints(cx, cy, outer, inner, points) {
  const pts = [];
  for (let i = 0; i < points * 2; i++) {
    const angle = (i * Math.PI) / points - Math.PI / 2;
    const r = i % 2 === 0 ? outer : inner;
    pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
  }
  return pts.join(" ");
}

// ═══════════════════════════════════════════════════════════
// TUTOR LINKING SYSTEM DATA
// ═══════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════
// AGE PROFILES
// ═══════════════════════════════════════════════════════════
const AGE_PROFILES = {
  kids:  { id:"kids",  label:"6 - 9 años",  icon:"🐣", desc:"Misiones simples, lenguaje visual",
           taskIds:[1,2,3,4,5,7], simMin:50,  simMax:500,  simStep:50,
           lessonIds:["l1","l2"], vocab:{task:"misión",coins:"moneditas",gems:"estrellitas"} },
  tween: { id:"tween", label:"10 - 13 años", icon:"🌱", desc:"Más tareas, economía básica",
           taskIds:[1,2,3,4,5,6,7,8], simMin:100, simMax:2000, simStep:100,
           lessonIds:["l1","l2","l3","l4"], vocab:{task:"tarea",coins:"monedas",gems:"cristales"} },
  teen:  { id:"teen",  label:"14 - 17 años", icon:"🚀", desc:"Todas las misiones, finanzas reales",
           taskIds:[1,2,3,4,5,6,7,8,9,10], simMin:500, simMax:10000, simStep:500,
           lessonIds:["l1","l2","l3","l4","l5","l6"], vocab:{task:"misión",coins:"monedas",gems:"cristales"} },
};

const BOND_REWARD_GEMS = 15;  // gems given to child when tutor accepts

const DEMO_LINKED = [
  { id:"s1", name:"Mateo",     avatar:"a_cub",  level:7, gem_reward_claimed:true },
  { id:"s2", name:"Valentina", avatar:"a_sprout",level:5, gem_reward_claimed:false },
];

const CHESTS = [
  { id:"basic",    name:"Cofre Básico",    emoji:"📦", gems:2,   desc:"Items comunes e infrecuentes",            rates:{common:80,uncommon:20,rare:0,epic:0,legendary:0},      color:"#8FA8A2", gradient:"linear-gradient(135deg,#b0c4bc,#8FA8A2)", glow:"#8FA8A260" },
  { id:"silver",   name:"Cofre Plata",     emoji:"🪙", gems:6,   desc:"Incluye chances de items raros",           rates:{common:55,uncommon:30,rare:15,epic:0,legendary:0},     color:"#4AAEE8", gradient:"linear-gradient(135deg,#7dd0f5,#4AAEE8)", glow:"#4AAEE880" },
  { id:"golden",   name:"Cofre Dorado",    emoji:"📫", gems:18,  desc:"Alta probabilidad de items épicos",        rates:{common:40,uncommon:25,rare:24,epic:10,legendary:1},    color:"#F5C518", gradient:"linear-gradient(135deg,#ffe066,#F5C518,#D4A800)", glow:"#F5C51880" },
  { id:"legendary",name:"Cofre Legendario",emoji:"🏆", gems:50,  desc:"Garantizado épico o mejor · 5% legendario",rates:{common:20,uncommon:20,rare:30,epic:25,legendary:5}, color:"#8B6BE8", gradient:"linear-gradient(135deg,#c9b8ff,#8B6BE8,#5a3fc0)", glow:"#8B6BE8aa" },
];

function rollChest(chestId) {
  const chest = CHESTS.find(c=>c.id===chestId);
  if(!chest) return null;
  const roll = Math.random()*100;
  let cumulative = 0;
  let rarityId = "common";
  for(const [key,pct] of Object.entries(chest.rates)){
    cumulative += pct;
    if(roll < cumulative){ rarityId=key; break; }
  }
  const pool = LOOT_ITEMS.filter(i=>i.rarity===rarityId);
  return pool[Math.floor(Math.random()*pool.length)] || LOOT_ITEMS[0];
}

const VERIFY_LEVELS = {
  easy:   { label:"Fácil",    icon:"📸", desc:"Solo foto",                  pts:80,  methods:["photo"] },
  medium: { label:"Normal",   icon:"📸🔑", desc:"Foto o código tutor",       pts:120, methods:["photo","qr"] },
  hard:   { label:"Especial", icon:"📸🔑📍",desc:"Foto + confirmación",       pts:180, methods:["photo","qr","gps"] },
};

const TASK_TEMPLATES = [
  { id:1,  emoji:"🛏️", title:"Tender la cama",         freq:"diaria",    xp:50,  coins:10, cat:"hogar",    verify:"easy",   hint:"Foto de tu cama ordenada",         diffLabel:"Fácil" },
  { id:2,  emoji:"🍽️", title:"Lavar los platos",       freq:"diaria",    xp:70,  coins:14, cat:"hogar",    verify:"easy",   hint:"Foto del fregadero limpio",         diffLabel:"Fácil" },
  { id:3,  emoji:"📚", title:"Hacer la tarea escolar", freq:"diaria",    xp:120, coins:25, cat:"estudio",  verify:"medium", hint:"Foto de tu cuaderno resuelto",      diffLabel:"Normal" },
  { id:4,  emoji:"🐷", title:"Guardar dinero hoy",     freq:"diaria",    xp:80,  coins:15, cat:"economía", verify:"easy",   hint:"Foto de tu alcancía o libreta",     diffLabel:"Fácil" },
  { id:5,  emoji:"🧹", title:"Limpiar mi cuarto",      freq:"semanal",   xp:180, coins:40, cat:"hogar",    verify:"medium", hint:"Foto del cuarto ordenado",          diffLabel:"Normal" },
  { id:6,  emoji:"📊", title:"Revisar mis gastos",     freq:"semanal",   xp:200, coins:45, cat:"economía", verify:"medium", hint:"Foto de tu registro de gastos",     diffLabel:"Normal" },
  { id:7,  emoji:"👕", title:"Doblar mi ropa",         freq:"semanal",   xp:150, coins:35, cat:"hogar",    verify:"easy",   hint:"Foto de la ropa doblada",           diffLabel:"Fácil" },
  { id:8,  emoji:"💳", title:"Meta de ahorro mensual", freq:"mensual",   xp:500, coins:150,cat:"economía", verify:"hard",   hint:"Foto mostrando tu meta cumplida",   diffLabel:"Especial" },
  { id:9,  emoji:"❤️", title:"Proyecto solidario",     freq:"semestral", xp:800, coins:200,cat:"social",   verify:"hard",   hint:"Foto de tu actividad solidaria",    diffLabel:"Especial" },
  { id:10, emoji:"📈", title:"Plan financiero anual",  freq:"anual",     xp:2000,coins:500,cat:"economía", verify:"hard",   hint:"Foto de tu plan financiero",        diffLabel:"Especial" },
];

const ECONOMY_LESSONS = [
  { id:"l1", emoji:"🐷", title:"¿Por qué ahorrar?",        duration:"2 min", xp:30, done:true,
    content:"Imagina que quieres una bicicleta que vale $50.000. Si guardas $1.000 por semana, ¡en menos de 1 año la tienes! Ahorrar es como tener una máquina del tiempo: el dinero que guardas HOY te da poder MAÑANA.",
    quiz:[
      {q:"¿Por qué es útil ahorrar dinero?",opts:["Para gastarlo todo rápido","Para comprar lo que quieres en el futuro","Porque el dinero da miedo","Para dárselo a otros"],ans:1},
      {q:"Si guardas $1.000 por semana, ¿cuánto tendrás en 4 semanas?",opts:["$1.000","$2.000","$4.000","$10.000"],ans:2},
      {q:"Ahorrar es como...",opts:["Tirar el dinero","Una máquina del tiempo","Un juego de azar","Gastar rápido"],ans:1},
    ]},
  { id:"l2", emoji:"💡", title:"Necesidad vs Deseo",        duration:"2 min", xp:30, done:true,
    content:"Una NECESIDAD es algo que debes tener para vivir bien: comida, ropa, estudios. Un DESEO es algo que quieres pero puedes esperar: videojuegos, dulces, juguetes. Antes de gastar, pregúntate: '¿Lo necesito o lo deseo?'",
    quiz:[
      {q:"¿Cuál de estos es una NECESIDAD?",opts:["Videojuego nuevo","Comida","Dulces","Juguete"],ans:1},
      {q:"¿Cuál de estos es un DESEO?",opts:["Ropa para el frío","Útiles escolares","Consola de videojuegos","Medicamento"],ans:2},
      {q:"Antes de gastar debes preguntarte:",opts:["¿Es barato?","¿Lo vi en un anuncio?","¿Lo necesito o lo deseo?","¿Mis amigos lo tienen?"],ans:2},
    ]},
  { id:"l3", emoji:"📈", title:"El interés compuesto",      duration:"3 min", xp:50, done:false,
    content:"Si guardas $1.000 hoy y gana un 10% al año, el próximo año tendrás $1.100. Al siguiente, $1.210. ¡El dinero trabaja para ti! Einstein llamó al interés compuesto 'la octava maravilla del mundo'.",
    quiz:[
      {q:"¿Qué es el interés compuesto?",opts:["Dinero que se pierde","Dinero que genera más dinero con el tiempo","Un tipo de juego","Una deuda"],ans:1},
      {q:"$1.000 con 10% de interés al año se convierte en:",opts:["$900","$1.000","$1.100","$2.000"],ans:2},
      {q:"Einstein dijo que el interés compuesto es:",opts:["Aburrido","Difícil","La octava maravilla del mundo","Un engaño"],ans:2},
    ]},
  { id:"l4", emoji:"🏦", title:"¿Qué es un banco?",         duration:"2 min", xp:30, done:false,
    content:"Un banco es un lugar seguro donde guardar tu dinero. Pero también PRESTA dinero a quien lo necesita, cobrando un interés. Así el banco gana dinero y tú también puedes ganar si ahorras ahí.",
    quiz:[
      {q:"¿Para qué sirve un banco?",opts:["Solo para cambiar monedas","Guardar dinero de forma segura y ganar interés","Regalar dinero","Jugar con el dinero"],ans:1},
      {q:"Cuando el banco presta dinero, cobra un:",opts:["Regalo","Descuento","Interés","Premio"],ans:2},
      {q:"Si ahorras en un banco, tú:",opts:["Pierdes dinero","Puedes ganar interés","Debes pagar una multa","Nada especial"],ans:1},
    ]},
  { id:"l5", emoji:"💳", title:"Presupuesto 50-30-20",      duration:"3 min", xp:50, done:false,
    content:"Un presupuesto es un plan para tu dinero. Divide en 3: 50% para lo que NECESITAS, 30% para lo que DESEAS, 20% para AHORRAR. ¡Esto se llama la regla 50-30-20!",
    quiz:[
      {q:"¿Qué porcentaje va para ahorrar en la regla 50-30-20?",opts:["50%","30%","20%","10%"],ans:2},
      {q:"¿Qué porcentaje va para necesidades?",opts:["20%","30%","50%","70%"],ans:2},
      {q:"De $10.000 de mesada, ¿cuánto deberías ahorrar?",opts:["$500","$1.000","$2.000","$5.000"],ans:2},
    ]},
  { id:"l6", emoji:"🌍", title:"La inflación",              duration:"2 min", xp:30, done:false,
    content:"La inflación es cuando los precios suben con el tiempo. Si un helado cuesta $1.000 hoy y hay 10% de inflación, el año que viene costará $1.100. Por eso es importante invertir, no solo guardar.",
    quiz:[
      {q:"¿Qué es la inflación?",opts:["Cuando los precios bajan","Cuando los precios suben con el tiempo","Cuando el dinero desaparece","Un tipo de helado"],ans:1},
      {q:"Un helado de $1.000 con 10% de inflación costará:",opts:["$900","$1.000","$1.100","$2.000"],ans:2},
      {q:"Para protegerse de la inflación es mejor:",opts:["Guardar dinero en el colchón","Solo gastar","Invertir el dinero","No hacer nada"],ans:2},
    ]},
];

const SEASONS = [
  { id:"s1", name:"Temporada del Ahorro", emoji:"🌱", color:T.mint,    endDate:"31 Mar", prize:"Avatar Árbol de Dinero 🌳", progress:68 },
  { id:"s2", name:"Copa de Responsables", emoji:"🏆", color:T.gold,    endDate:"30 Abr", prize:"Marco Campeón Dorado 👑",    progress:42 },
];


// ═══════════════════════════════════════════════════════════
// SPENDING TRACKER & MONTHLY HISTORY
// ═══════════════════════════════════════════════════════════
const EXPENSE_CATS = [
  {id:"need",  label:"Necesidad", color:"#4DC9A0", icon:"🏠"},
  {id:"want",  label:"Deseo",     color:"#4AAEE8", icon:"🎮"},
  {id:"save",  label:"Ahorro",    color:"#F5C518", icon:"🐷"},
  {id:"other", label:"Otro",      color:"#8FA8A2", icon:"📦"},
];

// ═══════════════════════════════════════════════════════════
// CHALLENGE ASSIGNMENT SYSTEM
// ═══════════════════════════════════════════════════════════
const CHALLENGE_TEMPLATES = [
  {id:"c1",emoji:"🎯",title:"Semana sin gastar en dulces",       xp:200,coins:50,freq:"semanal", desc:"No compres dulces ni snacks por 7 días. ¡Anota cuánto ahorraste!"},
  {id:"c2",emoji:"🛒",title:"Acompaña a hacer el mercado",       xp:150,coins:35,freq:"semanal", desc:"Ve al supermercado con un adulto y ayuda a comparar precios."},
  {id:"c3",emoji:"💡",title:"Apaga las luces al salir",          xp:100,coins:20,freq:"diaria",  desc:"Cada vez que salgas de una habitación, apaga la luz. Foto del interruptor."},
  {id:"c4",emoji:"📓",title:"Lleva un diario de gastos",        xp:300,coins:80,freq:"semanal", desc:"Anota cada peso que gastes durante la semana con su categoría."},
  {id:"c5",emoji:"🤝",title:"Acto de generosidad",              xp:250,coins:60,freq:"semanal", desc:"Haz algo desinteresado por alguien. Foto o descripción del acto."},
  {id:"c6",emoji:"🎁",title:"Regala algo hecho por ti",         xp:200,coins:50,freq:"mensual", desc:"Crea un regalo casero para alguien especial. Foto del regalo."},
  {id:"c7",emoji:"📊",title:"Presenta tu presupuesto mensual",  xp:400,coins:100,freq:"mensual",desc:"Muéstrale a tu tutor cómo planeas gastar/ahorrar este mes."},
  {id:"c8",emoji:"🌱",title:"Planta algo y cuídalo",            xp:180,coins:45,freq:"mensual", desc:"Siembra una semilla o cuida una planta. Foto del progreso."},
];

const DEMO_STUDENTS = [
  {id:"st1",name:"Mateo",   svgKey:"a_cub",   level:7},
  {id:"st2",name:"Sofía",   svgKey:"a_sprout", level:6},
  {id:"st3",name:"Carlos",  svgKey:"a_ninja",  level:5},
  {id:"st4",name:"Valentina",svgKey:"a_fox_kq",level:5},
  {id:"st5",name:"Diego",   svgKey:"a_bot",    level:4},
];

const MONTH_LABELS = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

// Default monthly history for demo
const DEFAULT_MONTHLY = [
  {month:"Ene",saved:3200,spent:8200,tasks:18},
  {month:"Feb",saved:4100,spent:7400,tasks:22},
  {month:"Mar",saved:3800,spent:9100,tasks:19},
];

const CLAN = {
  name:"Dragones del Norte", level:8, emblem:"🐉", levelXP:68,
  warScore:340, rivalName:"Cóndores del Sur", rivalScore:290, endsIn:"6h 22m",
  members:[
    { name:"Mateo",     avatar:"🦁", trophies:1240, level:7, streak:15, tasks:42, pts:210 },
    { name:"Sofía",     avatar:"🦊", trophies:1180, level:6, streak:12, tasks:38, pts:190 },
    { name:"Carlos",    avatar:"🐯", trophies:1050, level:5, streak:8,  tasks:31, pts:155 },
    { name:"Valentina", avatar:"🦋", trophies:980,  level:5, streak:6,  tasks:27, pts:135 },
    { name:"Diego",     avatar:"🐺", trophies:870,  level:4, streak:4,  tasks:22, pts:110 },
  ],
};

const SCHOOL_RANK = [
  {school:"Colegio San Marcos",  course:"5to B",pts:4820,e:"🏔️"},
  {school:"Instituto Cervantes", course:"6to A",pts:4510,e:"📚"},
  {school:"Col. Simón Bolívar",  course:"5to A",pts:4290,e:"⚡"},
  {school:"Escuela Nacional",    course:"4to B",pts:3980,e:"🌟"},
  {school:"Col. Los Andes",      course:"6to C",pts:3700,e:"🏕️"},
];

const MISSIONS_BANK = [
  {id:"m1",emoji:"♻️",title:"Semana Sin Plástico",  desc:"Registra cada vez que evitas plástico",    xp:400,coins:100,freq:"semanal"},
  {id:"m2",emoji:"💡",title:"Ahorra Energía",        desc:"Documenta 5 acciones de ahorro energético",xp:300,coins:80, freq:"semanal"},
  {id:"m3",emoji:"📖",title:"Lectura Comprensiva",   desc:"Lee 20 min diarios y resume",              xp:150,coins:30, freq:"diaria"},
  {id:"m4",emoji:"🌱",title:"Huerto Escolar",        desc:"Riega las plantas del colegio",            xp:200,coins:50, freq:"semanal"},
  {id:"m5",emoji:"🤝",title:"Acto de Bondad",        desc:"Realiza y documenta un acto de ayuda",     xp:250,coins:60, freq:"semanal"},
  {id:"m6",emoji:"🧮",title:"Presupuesto Familiar",  desc:"Ayuda a armar el presupuesto semanal",     xp:350,coins:90, freq:"mensual"},
];

const WEEK_DATA = [
  {day:"Lun",pts:12},{day:"Mar",pts:18},{day:"Mié",pts:5},
  {day:"Jue",pts:14},{day:"Vie",pts:1},{day:"Sáb",pts:14},{day:"Dom",pts:0},
];

// Mission rewards — fixed & transparent, no gambling mechanic
// Replaced variable-ratio wheel with predictable reward tiers
const MISSION_REWARDS = {
  easy:   { coins:10, xp:50,  gems:1, label:"Recompensa Fácil" },
  medium: { coins:25, xp:120, gems:2, label:"Recompensa Normal" },
  hard:   { coins:50, xp:250, gems:4, label:"Recompensa Especial" },
};
// Kept for backward compatibility but repurposed as daily bonus (not random)
const WHEEL_PRIZES = [
  {emoji:"💰",label:"60 Monedas",   type:"coins", val:60,  rarity:"Común",     rc:"#8FA8A2"},
  {emoji:"💎",label:"2 Gemas",      type:"gems",  val:2,   rarity:"Raro",      rc:T.sky},
  {emoji:"⭐",label:"300 XP",       type:"xp",    val:300, rarity:"Común",     rc:"#8FA8A2"},
  {emoji:"🛡️",label:"Protec. Racha",type:"shield",val:1,   rarity:"Épico",     rc:T.purple},
  {emoji:"🏆",label:"+60 Trofeos",  type:"trophy",val:60,  rarity:"Legendario",rc:T.gold},
  {emoji:"🔥",label:"Racha +3d",    type:"streak",val:3,   rarity:"Épico",     rc:T.purple},
  {emoji:"🌟",label:"150 XP",       type:"xp",    val:150, rarity:"Común",     rc:"#8FA8A2"},
  {emoji:"🎮",label:"4 Fichas",     type:"token", val:4,   rarity:"Raro",      rc:T.sky},
];

const LVLS = [
  {l:1,name:"Recluta",xp:0},{l:2,name:"Guerrero",xp:300},{l:3,name:"Caballero",xp:700},
  {l:4,name:"Paladín",xp:1500},{l:5,name:"Campeón",xp:2500},{l:6,name:"Leyenda",xp:4000},
  {l:7,name:"Maestro",xp:6000},{l:8,name:"Titán",xp:9000},{l:9,name:"Inmortal",xp:13000},{l:10,name:"Dios",xp:18000},
];

const FC = {diaria:T.coral,semanal:T.mint,mensual:T.gold,semestral:T.sky,anual:T.purple};
const FL = {diaria:"Hoy",semanal:"Semana",mensual:"Mes",semestral:"6 Meses",anual:"Año"};

// ═══════════════════════════════════════════════════════════
// AI ENGINE  — flexible verification + appeal
// ═══════════════════════════════════════════════════════════
// ⚠️ TODO: Move to Supabase Edge Function before production launch
// This exposes the API key in the browser bundle
async function callAI(messages, maxTokens=400) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:maxTokens, messages })
  });
  const data = await res.json();
  return data.content?.[0]?.text || "";
}

async function analyzePhoto(b64, taskTitle, taskHint) {
  const prompt = `Eres el verificador de KidQuest, una app educativa para niños.
TAREA: "${taskTitle}" — "${taskHint}"
Analiza la imagen y responde SOLO JSON sin texto extra:
{
  "approved": bool,
  "confidence": 0-100,
  "reason": "max 20 palabras amigables en español",
  "detected": ["cosa1","cosa2"],
  "lightingOk": bool,
  "tips": "consejo específico de max 15 palabras si fue rechazado",
  "alternativeOptions": ["opción si la foto falló, ej: pedir código al tutor","otra opción alternativa"]
}
Si la iluminación es mala (lightingOk:false), sé comprensivo y sugiere alternativas.
Si hay evidencia parcial, approved:true con confidence bajo (40-60).
Sé justo: el objetivo es motivar, no bloquear al niño.`;
  try {
    const raw = await callAI([{role:"user",content:[{type:"image",source:{type:"base64",media_type:"image/jpeg",data:b64}},{type:"text",text:prompt}]}]);
    return JSON.parse(raw.replace(/```json|```/g,"").trim());
  } catch {
    return {approved:false,confidence:0,reason:"No pude analizar la imagen.",detected:[],lightingOk:false,tips:"Intenta con mejor luz.",alternativeOptions:["Usar código de tu tutor","Describir lo que hiciste"]};
  }
}

async function appealDecision(taskTitle, originalReason, childExplanation) {
  const prompt = `Eres el sistema de apelaciones de KidQuest. Un niño apeló una tarea rechazada.
TAREA: "${taskTitle}"
RAZÓN DEL RECHAZO: "${originalReason}"
EXPLICACIÓN DEL NIÑO: "${childExplanation}"

Evalúa si la apelación es válida. Responde SOLO JSON:
{
  "appeal_approved": bool,
  "response": "Respuesta empática al niño, max 30 palabras en español",
  "partial_credit": 0-100,
  "tip_for_next_time": "Consejo constructivo max 20 palabras"
}
Sé empático y generoso si la explicación es razonable. El objetivo es educar, no castigar.`;
  try {
    const raw = await callAI([{role:"user",content:prompt}]);
    return JSON.parse(raw.replace(/```json|```/g,"").trim());
  } catch {
    return {appeal_approved:true,response:"¡Apelación aceptada! Sabemos que lo intentaste 😊",partial_credit:75,tip_for_next_time:"La próxima vez toma la foto con mejor luz."};
  }
}

async function getMascotTip(context) {
  const prompt = `Eres Kiko 🦎, la mascota de KidQuest, app educativa de economía para niños.
Contexto: ${context}
Da UN mensaje corto (max 20 palabras), positivo, en español, para un niño. Solo el texto, sin comillas.`;
  try { return await callAI([{role:"user",content:prompt}], 80); }
  catch { return "¡Tú puedes! Cada tarea te hace más responsable 💪"; }
}

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════
const getLvl  = xp => { let c=LVLS[0]; for(const l of LVLS) if(xp>=l.xp) c=l; return c; };
const getNext = xp => { const i=LVLS.findIndex(l=>xp<l.xp); return i!==-1?LVLS[i]:null; };
const fmtN    = n  => n>=1000?`${(n/1000).toFixed(1)}k`:String(n);
const now_t   = ()=>{ const d=new Date(); return `${d.getHours()}:${String(d.getMinutes()).padStart(2,"0")}`; };
const MAX_BAR = Math.max(...WEEK_DATA.map(d=>d.pts));
const MIN_CLAN = 4;

// ═══════════════════════════════════════════════════════════
// ROOT
// ═══════════════════════════════════════════════════════════
export default function KidQuest({ userId=null, userEmail=null, initialProfile=null, onSignOut=null }) {
  // theming
  const [dark, setDark] = useState(false);
  const C = dark ? DARK : T;

  // navigation — if userId exists, never show splash (user is logged in)
  // If userId exists (logged in), skip splash entirely — go straight to app
  const [screen,    setScreen]    = useState(()=>{
    if(initialProfile?.role) return "app";
    if(userId) return "app";      // logged in but profile delayed → app anyway
    return "splash";              // not logged in → show splash
  });
  const [role,      setRole]      = useState(()=> initialProfile?.role || (userId ? "student" : null));
  const [tab,       setTab]       = useState(()=>{
    if(!initialProfile?.role) return userId ? "home" : "home";
    const ar = initialProfile.admin_role;
    if(ar==="master"||ar==="admin") return "admin";
    if(initialProfile.role==="student") return "home";
    if(initialProfile.role==="parent")  return "validate";
    return "panel";
  });
  const [tutStep,   setTutStep]   = useState(0);
  const [tutDone,   setTutDone]   = useState(()=>{
    if(initialProfile?.role) return initialProfile.role!=="student";
    return userId ? true : false; // if logged in, skip tutorial
  });

  // ── USER STATE — loads from Supabase profile if logged in ──
  const defaultUser = {
    name:"Novo Usuário", avatar:"a_cub", level:1, xp:0, coins:0, gems:30,
    streak:0, trophies:0, streakShields:1, allowance:5000, allowanceSpent:0,
    ageGroup:"tween", username:"",
    savingsGoal:{name:"Mi primera meta",target:50000,saved:0,emoji:"🎯"},
    savingsHistory:[],
  };
  const profileToUser = (p) => {
    if(!p) return defaultUser;
    const adminRole = p.admin_role || "none";
    return {
      name:          p.name        || defaultUser.name,
      username:      p.username    || "",
      avatar:        p.avatar_key  || "a_cub",
      frame:         p.frame       || "none",
      level:         p.level       || 1,
      xp:            p.xp          || 0,
      coins:         p.coins       || 0,
      gems:          p.gems        ?? 30,
      streak:        p.streak      || 0,
      trophies:      p.trophies    || 0,
      streakShields: p.streak_shields || 1,
      allowance:     p.allowance   || 5000,
      allowanceSpent:p.allowance_spent || 0,
      ageGroup:      p.age_group   || "tween",
      isAdmin:       ["master","admin","moderator"].includes(adminRole),
      adminRole,
      isMaster:      adminRole === "master",
      accountStatus: p.account_status || "active",
      savingsGoal:{
        name:   p.savings_goal_name   || "Mi primera meta",
        target: p.savings_goal_target || 50000,
        saved:  p.savings_goal_saved  || 0,
        emoji:  p.savings_goal_emoji  || "🎯",
      },
      savingsHistory:[],
    };
  };

  // Always use fresh Supabase profile when logged in — never stale localStorage
  const [user, setUser] = useState(()=> initialProfile ? profileToUser(initialProfile) : defaultUser);

  // chest / loot system
  const [showChestShop,  setShowChestShop]  = useState(false);
  const [openingChest,   setOpeningChest]   = useState(null);  // chest being opened
  const [chestPhase,     setChestPhase]     = useState("idle"); // idle|shaking|reveal|done
  const [chestWin,       setChestWin]       = useState(null);   // item won
  const [inventory,      setInventory]      = useState([]);     // collected items
  const [showInventory,  setShowInventory]  = useState(false);
  const [showLootTable,  setShowLootTable]  = useState(false);
  const [lootTableChest, setLootTableChest] = useState("golden");

  // tutor linking
  const [showLinkTutor,  setShowLinkTutor]  = useState(false);
  const [linkStep,       setLinkStep]       = useState("scan"); // scan|confirm|done
  const [linkedTutors,   setLinkedTutors]   = useState(["Mamá Laura"]);
  const [linkedStudents, setLinkedStudents] = useState(DEMO_LINKED);
  const [pendingStudent, setPendingStudent] = useState(null);

  // avatar customization
  const [avatarPhoto,   setAvatarPhoto]   = useState(null);   // base64 photo
  const [avatarFrame,   setAvatarFrame]   = useState("none"); // frame id
  const [avatarBg,      setAvatarBg]      = useState("mint"); // bg gradient key
  const [avatarEmoji,   setAvatarEmoji]   = useState("🦁");   // emoji fallback
  const [showAvatarEditor, setShowAvatarEditor] = useState(false);
  const [editTab,       setEditTab]       = useState("photo"); // photo|emoji|frame|color

  // tasks
  const [tasks,      setTasks]      = useState(TASK_TEMPLATES.map(t=>({...t,status:"idle",pendingHours:0})));
  const [filterFreq, setFilterFreq] = useState("todas");
  const [customTasks,setCustomTasks]= useState(()=>loadState("customTasks",[]));

  // ── AGE & ONBOARDING ──
  const [ageGroup,    setAgeGroup]    = useState(()=>loadState("ageGroup","tween"));
  const [showAgePick, setShowAgePick] = useState(false);

  // ── LESSON QUIZ ──
  const [quizLesson,  setQuizLesson]  = useState(null);  // lesson being quizzed
  const [quizStep,    setQuizStep]    = useState(0);      // current question
  const [quizAnswers, setQuizAnswers] = useState([]);     // selected answers
  const [quizDone,    setQuizDone]    = useState(false);

  // ── SPENDING TRACKER ──
  const [spendLog,    setSpendLog]    = useState(()=>loadState("spendLog",[]));
  const [showSpend,   setShowSpend]   = useState(false);  // add expense modal
  const [spendAmt,    setSpendAmt]    = useState("");
  const [spendCat,    setSpendCat]    = useState("need");
  const [spendNote,   setSpendNote]   = useState("");

  // ── MONTHLY HISTORY ──
  const [monthlyHist, setMonthlyHist] = useState(()=>loadState("monthlyHist", DEFAULT_MONTHLY));

  // ── CUSTOM TASK CREATOR (parent/teacher) ──
  const [showTaskCreator, setShowTaskCreator] = useState(false);
  const [newTaskTitle,    setNewTaskTitle]    = useState("");
  const [newTaskFreq,     setNewTaskFreq]     = useState("diaria");
  const [newTaskXp,       setNewTaskXp]       = useState(80);
  const [newTaskHint,     setNewTaskHint]     = useState("");
  const [newTaskEmoji,    setNewTaskEmoji]    = useState("⭐");

  // ── PARENTAL CONTROLS ──
  const [parentControls, setParentControls] = useState(()=>loadState("parentControls",{
    maxChestsPerDay: 3,
    chatLockHour: 22,
    requireApproval: true,
    allowWheel: false,
  }));
  const [showControls, setShowControls] = useState(false);

  // ── DAILY LOGIN BONUS ──
  const [showLoginBonus, setShowLoginBonus] = useState(false);
  const [loginBonusAmt]  = useState(3); // gems per daily login

  // ── SAVINGS GOAL EDITOR ──
  const [showGoalEditor, setShowGoalEditor] = useState(false);

  // ── PROFILE EDITOR ──
  const [showProfileEdit,  setShowProfileEdit]  = useState(false);
  const [editDisplayName,  setEditDisplayName]  = useState("");
  const [editUsername,     setEditUsername]     = useState("");
  const [savingProfile,    setSavingProfile]    = useState(false);

  // ── REPORT SYSTEM ──
  const [showReport,    setShowReport]    = useState(false);
  const [reportType,    setReportType]    = useState("bullying");
  const [reportDesc,    setReportDesc]    = useState("");
  const [reportUser,    setReportUser]    = useState("");
  const [reportSending, setReportSending] = useState(false);

  // ── PENDING TASKS FOR PARENT ──
  const [pendingTasks,    setPendingTasks]    = useState([]);
  const [loadingPending,  setLoadingPending]  = useState(false);
  const [pendingLoaded,   setPendingLoaded]   = useState(false);

  // ── ADMIN PANEL ──
  const [adminView,     setAdminView]     = useState("admin"); // admin|student|parent|teacher
  const [adminUsers,    setAdminUsers]    = useState([]);
  const [adminReports,  setAdminReports]  = useState([]);
  const [adminTab,      setAdminTab]      = useState("users"); // users|reports|gifts|ranking
  const [adminLoading,  setAdminLoading]  = useState(false);
  const [giftUser,      setGiftUser]      = useState(null);
  const [giftType,      setGiftType]      = useState("gems");
  const [giftAmount,    setGiftAmount]    = useState(100);
  const [giftMsg,       setGiftMsg]       = useState("");
  const [adminSearch,   setAdminSearch]   = useState("");

  // ── INVITE TOKENS ──
  const [myInviteTokens,  setMyInviteTokens]  = useState([]);
  const [generatingToken, setGeneratingToken] = useState(false);

  const generateInviteToken = async () => {
    if(!userId) return;
    setGeneratingToken(true);
    try {
      const {supabase} = await import("./supabase.js");
      const token = Math.random().toString(36).slice(2,8).toUpperCase() +
                    Math.random().toString(36).slice(2,6).toUpperCase();
      const {data,error} = await supabase.from("invite_tokens").insert({
        token,
        created_by: userId,
        creator_name: user.name,
        creator_role: role,
        expires_at: new Date(Date.now()+7*24*60*60*1000).toISOString(),
      }).select().single();
      if(error) { notify("Error: "+error.message,"⚠️"); setGeneratingToken(false); return; }
      setMyInviteTokens(p=>[data,...p]);
      notify(`Código generado: ${token}`,"🔗");
    } catch(e){ notify("Error generando código","⚠️"); }
    setGeneratingToken(false);
  };

  // ── CHALLENGE ASSIGNMENT (parent/teacher) ──
  const [showChallengeAssign, setShowChallengeAssign] = useState(false);
  const [assignStep,          setAssignStep]          = useState("pick"); // pick|targets|done
  const [selectedChallenge,   setSelectedChallenge]   = useState(null);
  const [selectedStudents,    setSelectedStudents]    = useState([]);     // student ids
  const [assignedChallenges,  setAssignedChallenges]  = useState(()=>loadState("assignedChallenges",[]));
  const [activeStudentChalls, setActiveStudentChalls] = useState(()=>loadState("activeStudentChalls",[]));
  const [goalName,       setGoalName]       = useState("");
  const [goalTarget,     setGoalTarget]     = useState("");
  const [goalEmoji,      setGoalEmoji]      = useState("🎯");

  // verify modal
  const [verifyTask,  setVerifyTask]  = useState(null);
  const [photoThumb,  setPhotoThumb]  = useState(null);
  const [photoB64,    setPhotoB64]    = useState(null);
  const [aiResult,    setAiResult]    = useState(null);
  const [aiLoading,   setAiLoading]   = useState(false);
  const [gpsOk,       setGpsOk]       = useState(false);
  const [qrOk,        setQrOk]        = useState(false);
  const [qrTimer,     setQrTimer]     = useState(0);
  const [selfDesc,    setSelfDesc]     = useState("");
  const [verifyMode,  setVerifyMode]  = useState("photo"); // photo|qr|self|appeal
  const [appealText,  setAppealText]  = useState("");
  const [appealRes,   setAppealRes]   = useState(null);
  const [appealLoading,setAppealLoading]=useState(false);

  // wheel
  const [showWheel,  setShowWheel]  = useState(false);
  const [wheelAngle, setWheelAngle] = useState(0);
  const [wheelRes,   setWheelRes]   = useState(null);
  const [isSpinning, setIsSpinning] = useState(false);

  // mascot
  const [mascotMsg,    setMascotMsg]    = useState(MASCOT_MSGS.welcome[0]);
  const [mascotLoading,setMascotLoading]= useState(false);
  const [showMascot,   setShowMascot]   = useState(false);

  // lesson modal
  const [activeLesson, setActiveLesson] = useState(null);
  const [lessons,      setLessons]      = useState(ECONOMY_LESSONS);

  // savings simulator
  const [simWeekly,   setSimWeekly]   = useState(500);
  const [simMonths,   setSimMonths]   = useState(12);
  const simTotal = simWeekly * 4 * simMonths;
  const simInterest = Math.round(simTotal * 1.06);

  // chat
  const [chatInput, setChatInput] = useState("");
  // ── CHAT (Supabase Realtime) ──
  const [kMsgs,     setKMsgs]     = useState([]);
  const [aMsgs,     setAMsgs]     = useState([]);
  const [chatRoom,  setChatRoom]  = useState("clan");   // clan | adult
  const [chatInited,setChatInited]= useState(false);
  const chatEndRef = useRef(null);
  const [assignedM, setAssignedM] = useState([]);

  // feedback
  const [notif,     setNotif]     = useState(null);
  const [particles, setParticles] = useState([]);

  // dark mode effect
  // ── AUTO-SAVE to localStorage on every change ──
  // Only save to localStorage when NOT logged in (demo mode)
  useEffect(()=>{ if(!userId) saveState("user", user); }, [user, userId]);
  useEffect(()=>{ saveState("customTasks", customTasks); }, [customTasks]);
  useEffect(()=>{ saveState("ageGroup", ageGroup); }, [ageGroup]);
  useEffect(()=>{ saveState("spendLog", spendLog); }, [spendLog]);
  useEffect(()=>{ saveState("monthlyHist", monthlyHist); }, [monthlyHist]);
  useEffect(()=>{ saveState("parentControls", parentControls); }, [parentControls]);
  useEffect(()=>{ saveState("assignedChallenges", assignedChallenges); }, [assignedChallenges]);
  useEffect(()=>{ saveState("activeStudentChalls", activeStudentChalls); }, [activeStudentChalls]);
  useEffect(()=>{ document.documentElement.style.background = dark?"#081810":"#F0FBF6"; },[dark]);

  // ── LOAD REAL DATA FROM SUPABASE ──
  useEffect(()=>{
    if(!userId||!initialProfile) return;
    try{ localStorage.removeItem("kq_v1_user"); localStorage.removeItem("kq_v1_tasks"); }catch(e){}
    if(initialProfile.age_group) setAgeGroup(initialProfile.age_group);
    // Sync navigation from profile
    if(initialProfile.role) {
      setRole(initialProfile.role);
      const adminRole = initialProfile.admin_role;
      const initTab = (adminRole==="master"||adminRole==="admin") ? "admin"
        : initialProfile.role==="student" ? "home"
        : initialProfile.role==="parent"  ? "validate"
        : "panel";
      setTab(initTab);
      setTutDone(initialProfile.role!=="student");
      setScreen("app");
    }
    const load = async()=>{
      try{
        const {supabase} = await import("./supabase.js");
        // Task progress
        const {data:tp} = await supabase.from("task_progress").select("*").eq("user_id",userId);
        if(tp?.length) setTasks(prev=>prev.map(t=>{
          const s=tp.find(p=>p.task_id===t.id); return s?{...t,status:s.status}:t;
        }));
        // Custom tasks assigned to me
        const {data:ct} = await supabase.from("custom_tasks").select("*").eq("assigned_to",userId);
        if(ct?.length) setCustomTasks(ct.map(t=>({...t,isCustom:true,status:t.status||"idle"})));
        // Challenges
        const {data:ch} = await supabase.from("challenges").select("*").eq("assigned_to",userId).eq("status","pending");
        if(ch?.length) setActiveStudentChalls(ch.map(c=>({
          id:c.id,challengeId:c.template_id,status:c.status,assignedBy:c.assigned_by,
          challenge:{id:c.template_id,title:c.title,desc:c.description,emoji:c.emoji||"🎯",xp:c.xp,coins:c.coins,freq:c.freq},
        })));
        // Spend log
        const {data:sl} = await supabase.from("spend_log").select("*").eq("user_id",userId).order("created_at",{ascending:false}).limit(50);
        if(sl?.length) setSpendLog(sl.map(e=>({id:e.id,amt:e.amount,cat:e.category,note:e.note,ts:new Date(e.created_at).getTime()})));
        // Linked children/students (for parent/teacher)
        if(initialProfile.role==="parent"||initialProfile.role==="teacher"){
          const tbl = initialProfile.role==="parent"?"parent_child":"teacher_student";
          const fk  = initialProfile.role==="parent"?"parent_id":"teacher_id";
          const fk2 = initialProfile.role==="parent"?"child_id":"student_id";
          const {data:links} = await supabase.from(tbl).select(`${fk2},profiles!${fk2}(*)`).eq(fk,userId);
          if(links?.length){
            const students=links.map(l=>l.profiles).filter(Boolean);
            setLinkedStudents(students.map(s=>({id:s.id,name:s.name,avatar:s.avatar_key||"a_cub",level:s.level||1,gem_reward_claimed:true})));
          }
        }
      }catch(e){ console.warn("Load data:",e.message); }
    };
    load();
  },[userId]);

  // ── SAVE USER CHANGES BACK TO SUPABASE ──
  const syncToSupabase = async(updates) => {
    if(!userId) return;
    try {
      const { supabase } = await import("./supabase.js");
      await supabase.from("profiles").update({
        gems:   updates.gems   ?? user.gems,
        coins:  updates.coins  ?? user.coins,
        xp:     updates.xp    ?? user.xp,
        level:  updates.level  ?? user.level,
        streak: updates.streak ?? user.streak,
        trophies: updates.trophies ?? user.trophies,
        streak_shields: updates.streakShields ?? user.streakShields,
        allowance_spent: updates.allowanceSpent ?? user.allowanceSpent,
        savings_goal_saved: updates.savingsGoal?.saved ?? user.savingsGoal.saved,
        last_seen: new Date().toISOString(),
      }).eq("id", userId);
    } catch(e){ console.warn("Supabase sync:", e.message); }
  };

  // ── LOAD PENDING TASKS WHEN PARENT OPENS VALIDATE TAB ──
  useEffect(()=>{
    if(role!=="parent" && role!=="teacher") return;
    if(tab!=="validate") return;
    if(pendingLoaded || loadingPending) return;
    if(!userId || linkedStudents.length===0) return;
    setLoadingPending(true);
    import("./supabase.js").then(async({supabase})=>{
      try {
        const childIds = linkedStudents.map(s=>s.id);
        // Get pending task progress from all linked children
        const {data} = await supabase
          .from("task_progress")
          .select("*, profiles!user_id(name,avatar_key,level)")
          .in("user_id", childIds)
          .eq("status","pending")
          .order("created_at",{ascending:false});
        setPendingTasks(data||[]);
        setPendingLoaded(true);
      } catch(e){ console.warn("Load pending tasks:", e.message); }
      setLoadingPending(false);
    });
  },[tab, role, linkedStudents.length, userId]);

  // ── AUTO-LOAD ADMIN DATA WHEN TAB CHANGES TO ADMIN ──
  useEffect(()=>{
    if(tab==="admin" && user.isAdmin && userId && adminUsers.length===0) {
      setAdminLoading(true);
      import("./supabase.js").then(async({supabase})=>{
        try {
          const {data} = await supabase
            .from("profiles")
            .select("id,name,username,role,age_years,is_minor,gems,coins,xp,level,streak,account_status,admin_role,created_at,avatar_key,email_verified")
            .order("created_at",{ascending:false})
            .limit(200);
          setAdminUsers(data||[]);
        } catch(e){ notify("Error cargando usuarios","⚠️"); }
        setAdminLoading(false);
      });
    }
  },[tab, user.isAdmin]);

  // ── DAILY LOGIN BONUS CHECK ──
  useEffect(()=>{
    if(role===ROLES.STUDENT){
      const today = new Date().toDateString();
      const lastLogin = loadState("lastLoginDate","");
      if(lastLogin !== today){
        saveState("lastLoginDate", today);
        setTimeout(()=>setShowLoginBonus(true), 800);
      }
    }
  },[role]);
  useEffect(()=>{ chatEndRef.current?.scrollIntoView({behavior:"smooth"}); },[kMsgs,aMsgs,tab]);

  // ── REALTIME CHAT INIT ──
  useEffect(()=>{
    if(!userId || chatInited) return;
    setChatInited(true);
    let clanChannel, adultChannel;

    import("./supabase.js").then(async({supabase})=>{
      // Load last 50 messages for clan chat
      const {data:clanMsgs} = await supabase
        .from("chat_messages")
        .select("*")
        .eq("room","clan")
        .order("created_at",{ascending:true})
        .limit(50);
      if(clanMsgs?.length) setKMsgs(clanMsgs.map(m=>({
        id:m.id, author:m.author_name, avatar:m.avatar_key||"a_cub",
        role:m.author_role, text:m.text, time:new Date(m.created_at).toLocaleTimeString("es",{hour:"2-digit",minute:"2-digit"}),
        system:m.is_system,
      })));

      // Load adult chat
      const {data:adultMsgs} = await supabase
        .from("chat_messages")
        .select("*")
        .eq("room","adult")
        .order("created_at",{ascending:true})
        .limit(50);
      if(adultMsgs?.length) setAMsgs(adultMsgs.map(m=>({
        id:m.id, author:m.author_name, avatar:m.avatar_key||"a_buddy",
        role:m.author_role, text:m.text, time:new Date(m.created_at).toLocaleTimeString("es",{hour:"2-digit",minute:"2-digit"}),
        system:m.is_system,
      })));

      // Subscribe to real-time clan chat
      clanChannel = supabase
        .channel("clan-chat")
        .on("postgres_changes",{event:"INSERT",schema:"public",table:"chat_messages",filter:"room=eq.clan"},
          payload=>{
            const m = payload.new;
            setKMsgs(p=>[...p,{
              id:m.id, author:m.author_name, avatar:m.avatar_key||"a_cub",
              role:m.author_role, text:m.text,
              time:new Date(m.created_at).toLocaleTimeString("es",{hour:"2-digit",minute:"2-digit"}),
              system:m.is_system,
            }]);
          })
        .subscribe();

      // Subscribe to real-time adult chat
      adultChannel = supabase
        .channel("adult-chat")
        .on("postgres_changes",{event:"INSERT",schema:"public",table:"chat_messages",filter:"room=eq.adult"},
          payload=>{
            const m = payload.new;
            setAMsgs(p=>[...p,{
              id:m.id, author:m.author_name, avatar:m.avatar_key||"a_buddy",
              role:m.author_role, text:m.text,
              time:new Date(m.created_at).toLocaleTimeString("es",{hour:"2-digit",minute:"2-digit"}),
              system:m.is_system,
            }]);
          })
        .subscribe();
    });

    return ()=>{
      import("./supabase.js").then(({supabase})=>{
        if(clanChannel)  supabase.removeChannel(clanChannel);
        if(adultChannel) supabase.removeChannel(adultChannel);
      });
    };
  },[userId]);

  // ── SEND CHAT MESSAGE ──
  const sendChatMsg = async(text, room="clan") => {
    if(!text.trim()||!userId) return;
    try {
      const {supabase} = await import("./supabase.js");
      await supabase.from("chat_messages").insert({
        room,
        author_id: userId,
        author_name: user.name,
        author_role: role,
        avatar_key: user.avatar,
        text: text.trim(),
        is_system: false,
      });
    } catch(e){ notify("Error enviando mensaje","⚠️"); }
  };

  const canClan = user.level >= MIN_CLAN;
  const curLvl  = getLvl(user.xp);
  const nextLvl = getNext(user.xp);
  const xpPct   = nextLvl?((user.xp-curLvl.xp)/(nextLvl.xp-curLvl.xp))*100:100;

  const notify = (msg,emoji="✅") => { setNotif({msg,emoji}); setTimeout(()=>setNotif(null),3000); };
  const boom = () => {
    setParticles(Array.from({length:22},(_,i)=>({id:i,x:10+Math.random()*80,y:10+Math.random()*60,e:["⭐","💰","🎉","✨","🌟","🏆"][Math.floor(Math.random()*6)],d:Math.random()*0.5})));
    setTimeout(()=>setParticles([]),2200);
  };

  const triggerMascot = async (context) => {
    setShowMascot(true); setMascotLoading(true);
    try { setMascotMsg(await getMascotTip(context)); } catch {}
    setMascotLoading(false);
    setTimeout(()=>setShowMascot(false),5000);
  };

  const openVerify = (task) => {
    setVerifyTask(task); setPhotoThumb(null); setPhotoB64(null);
    setAiResult(null); setAiLoading(false); setGpsOk(false); setQrOk(false);
    setQrTimer(0); setSelfDesc(""); setVerifyMode("photo"); setAppealText(""); setAppealRes(null);
  };

  const handleFile = async (e) => {
    const file=e.target.files?.[0]; if(!file) return;
    const reader=new FileReader();
    reader.onload=async(ev)=>{
      const full=ev.target.result; const b64=full.split(",")[1];
      setPhotoThumb(full); setPhotoB64(b64); setAiResult(null); setAiLoading(true);
      try {
        const res = await analyzePhoto(b64, verifyTask.title, verifyTask.hint);
        setAiResult(res);
        if(!res.approved && !res.lightingOk) {
          notify("Foto con poca luz — prueba una alternativa 💡","⚠️");
        }
      } catch { setAiResult({approved:false,confidence:0,reason:"Error al analizar.",detected:[],lightingOk:false,tips:"Intenta otra vez.",alternativeOptions:["Usar código de tutor","Describir lo que hiciste"]}); }
      finally { setAiLoading(false); }
    };
    reader.readAsDataURL(file);
  };

  const activateGPS = () => {
    notify("Obteniendo ubicación…","📍");
    setTimeout(()=>{ setGpsOk(true); notify("Ubicación verificada ✓","📍"); },1400);
  };

  const showQR = () => {
    setQrTimer(8);
    const iv=setInterval(()=>setQrTimer(c=>{ if(c<=1){clearInterval(iv);setQrOk(true);notify("QR validado por el tutor ✓","🔑");return 0;} return c-1; }),1000);
  };

  const submitTask = async (partial=false) => {
    const t=verifyTask; if(!t) return;
    const bonusPts   = partial ? 50 : t.xp;
    const bonusCoins = partial ? Math.floor(t.coins*0.5) : t.coins;
    const newXp      = user.xp + bonusPts;
    const newCoins   = user.coins + bonusCoins;
    const newTrophies= user.trophies + Math.floor(bonusPts/10);
    setTasks(p=>p.map(tk=>tk.id===t.id?{...tk,status:"approved"}:tk));
    setUser(p=>({...p,xp:newXp,coins:newCoins,trophies:newTrophies}));
    setVerifyTask(null); boom();
    triggerMascot(`El niño completó la tarea: ${t.title}`);
    setTimeout(()=>{ setWheelRes(null); setShowWheel(true); },800);
    // Persist to Supabase
    if(userId) {
      try {
        const {supabase} = await import("./supabase.js");
        await supabase.from("task_progress").upsert({
          user_id:userId, task_id:t.id, task_title:t.title,
          status:"approved", completed_at:new Date().toISOString(),
        },{onConflict:"user_id,task_id"});
        const newLevel = getLvl(newXp)?.l || user.level;
        await supabase.from("profiles").update({
          xp:newXp, coins:newCoins, trophies:newTrophies,
          level:newLevel,
          total_tasks_done:(user.total_tasks_done||0)+1,
          last_seen:new Date().toISOString(),
        }).eq("id",userId);
        if(newLevel > user.level) setUser(p=>({...p,level:newLevel}));
      } catch(e){ console.warn("Task save:",e.message); }
    }
  };

  const submitAppeal = async () => {
    if(!appealText.trim()) return;
    setAppealLoading(true);
    try {
      const res = await appealDecision(verifyTask.title, aiResult?.reason||"Foto rechazada", appealText);
      setAppealRes(res);
    } catch { setAppealRes({appeal_approved:true,response:"¡Apelación aceptada! Sabemos que lo intentaste 😊",partial_credit:75,tip_for_next_time:"La próxima vez toma la foto con mejor luz."}); }
    setAppealLoading(false);
  };

  const selfValidate = () => {
    if(selfDesc.trim().length < 20) { notify("Describe con más detalle lo que hiciste (mín 20 caracteres)","⚠️"); return; }
    notify("Descripción guardada — tu tutor revisará en 24h","📋");
    setTasks(p=>p.map(t=>t.id===verifyTask.id?{...t,status:"pending",pendingHours:24}:t));
    setVerifyTask(null);
  };

  const spinWheel = () => {
    if(isSpinning) return; setIsSpinning(true);
    const idx=Math.floor(Math.random()*WHEEL_PRIZES.length);
    const deg=wheelAngle+(5+Math.floor(Math.random()*5))*360+(idx/WHEEL_PRIZES.length)*360;
    setWheelAngle(deg);
    setTimeout(()=>{
      const r=WHEEL_PRIZES[idx]; setWheelRes(r); setIsSpinning(false); boom();
      if(r.type==="coins")  { setUser(p=>({...p,coins:p.coins+r.val})); if(userId) import("./supabase.js").then(({supabase})=>supabase.from("profiles").update({coins:user.coins+r.val}).eq("id",userId)).catch(()=>{}); }
      if(r.type==="gems")   { setUser(p=>({...p,gems:p.gems+r.val}));   if(userId) import("./supabase.js").then(({supabase})=>supabase.from("profiles").update({gems:user.gems+r.val}).eq("id",userId)).catch(()=>{}); }
      if(r.type==="xp")     { setUser(p=>({...p,xp:p.xp+r.val}));      if(userId) import("./supabase.js").then(({supabase})=>supabase.from("profiles").update({xp:user.xp+r.val}).eq("id",userId)).catch(()=>{}); }
      if(r.type==="shield") { setUser(p=>({...p,streakShields:p.streakShields+1})); if(userId) import("./supabase.js").then(({supabase})=>supabase.from("profiles").update({streak_shields:user.streakShields+1}).eq("id",userId)).catch(()=>{}); }
    },3800);
  };

  const canPhotoSubmit = aiResult?.approved===true;
  const canAnySubmit = canPhotoSubmit || qrOk || gpsOk;

  // allowance spend %
  const allowancePct = Math.round((user.allowanceSpent/user.allowance)*100);
  const savingsPct   = Math.round((user.savingsGoal.saved/user.savingsGoal.target)*100);

  const ageProfile   = AGE_PROFILES[ageGroup] || AGE_PROFILES.tween;
  const ageTasks     = tasks.filter(t => ageProfile.taskIds.includes(t.id));
  const allTasks     = [...ageTasks, ...customTasks];
  const dailyDone    = allTasks.filter(t=>t.freq==="diaria"&&t.status==="approved").length;
  const dailyTotal   = allTasks.filter(t=>t.freq==="diaria").length;
  const filtered     = filterFreq==="todas" ? allTasks : allTasks.filter(t=>t.freq===filterFreq);
  const todaySpend   = spendLog.filter(e=>{const d=new Date(e.ts);const n=new Date();return d.toDateString()===n.toDateString();});
  const monthSpend   = spendLog.reduce((s,e)=>s+e.amt,0);
  const chestsToday  = 0; // would track from chest open log
  const savingsWeekly = Math.round((user.savingsGoal.target - user.savingsGoal.saved) / 52);

  const tabsStudent = [
    {id:"home",l:"Inicio"},{id:"tasks",l:"Tareas"},{id:"clan",l:"Clan"},
    {id:"shop",l:"Cofres"},{id:"store",l:"Tienda"},{id:"chat",l:"Chat"},{id:"me",l:"Yo"},
    ...(user.isAdmin?[{id:"admin",l:"Admin"}]:[]),
  ];
  const tabsParent  = [{id:"validate",l:"Validar"},{id:"progress",l:"Progreso"},{id:"allowance",l:"Mesada"},{id:"clanchat",l:"Chat"},{id:"qrcode",l:"Mi QR"},{id:"perfil",l:"Perfil"},...(user.isAdmin?[{id:"admin",l:"Admin"}]:[]),];
  const tabsTeacher = [{id:"panel",l:"Panel"},{id:"assign",l:"Misiones"},{id:"ranking",l:"Ranking"},{id:"tchat",l:"Chat"},{id:"perfil",l:"Perfil"},...(user.isAdmin?[{id:"admin",l:"Admin"}]:[]),];
  const currentTabs = role===ROLES.STUDENT?tabsStudent:role===ROLES.PARENT?tabsParent:tabsTeacher;

  // css with current theme
  const css = buildCSS(C);

  // ════════════════════════════════════════
  // SPLASH
  // ════════════════════════════════════════
  if(screen==="splash") return (
    <Shell C={C}>
      <style>{css}</style>
      <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:28,background:`radial-gradient(ellipse at 30% 20%,${C.mint}20,transparent 60%),radial-gradient(ellipse at 70% 80%,${C.purple}15,transparent 60%),${C.bg}`}}>
        <div className="float" style={{width:96,height:96,borderRadius:28,background:`linear-gradient(135deg,${C.mint},${C.gold})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:52,boxShadow:`0 8px 32px ${C.mint}60`,marginBottom:18}}>🏆</div>
        <div style={{fontWeight:900,fontSize:40,color:C.text,letterSpacing:-1,fontFamily:"'Nunito',sans-serif"}}>KidQuest</div>
        <div style={{fontSize:14,color:C.textMed,marginTop:4,marginBottom:12,fontWeight:600}}>Aprende · Ahorra · Conquista</div>
        {/* mascot intro */}
        <div style={{background:C.card,borderRadius:20,padding:"14px 18px",marginBottom:32,maxWidth:280,border:`1.5px solid ${C.border}`,boxShadow:C.shadow,display:"flex",gap:12,alignItems:"center"}}>
          <div style={{fontSize:36,flexShrink:0}}>🦎</div>
          <div style={{fontSize:13,color:C.textMed,fontWeight:600,lineHeight:1.4}}>¡Hola! Soy <b style={{color:C.mint}}>Kiko</b>, tu guía. Te enseñaré a ahorrar y ser responsable 💚</div>
        </div>
        <BtnMain onClick={()=>setScreen("roleSelect")} bg={`linear-gradient(135deg,${C.mint},${C.mintDk})`} style={{width:"100%",maxWidth:300}}>¡Empezar! →</BtnMain>
        <div style={{marginTop:16,fontSize:12,color:C.textLt}}>Demo — explora todos los roles</div>
      </div>
    </Shell>
  );

  // ════════════════════════════════════════
  // ROLE SELECT
  // ════════════════════════════════════════
  if(screen==="roleSelect") return (
    <Shell C={C}>
      <style>{css}</style>
      <div style={{padding:"40px 20px 24px",background:`radial-gradient(ellipse at 50% 0%,${C.mint}18,transparent 60%),${C.bg}`,minHeight:"100vh"}}>
        <div style={{fontWeight:900,fontSize:26,color:C.text,marginBottom:4}}>¿Quién eres?</div>
        <div style={{fontSize:14,color:C.textMed,marginBottom:28}}>Cada rol tiene su propio espacio</div>
        {[
          {r:ROLES.STUDENT,nk:"me",       l:"Soy Estudiante",   s:"Completa misiones y sube de nivel",  bg:C.mintLt,  bc:C.mint,   ac:C.mint},
          {r:ROLES.PARENT, nk:"validate", l:"Soy Padre / Tutor",s:"Verifica y gestiona la mesada",       bg:C.goldLt,  bc:C.gold,   ac:C.goldDk},
          {r:ROLES.TEACHER,nk:"panel",    l:"Soy Profesor",     s:"Gestiona tu clase y rankings",        bg:C.skyLt,   bc:C.sky,    ac:C.sky},
        ].map(opt=>(
          <button key={opt.r} onClick={()=>{setRole(opt.r);setTab(opt.r===ROLES.STUDENT?"home":opt.r===ROLES.PARENT?"validate":"panel");setTutDone(opt.r!==ROLES.STUDENT);setScreen("app");}}
            style={{width:"100%",marginBottom:14,padding:"18px 20px",borderRadius:20,border:`2px solid ${opt.bc}`,background:opt.bg,cursor:"pointer",display:"flex",alignItems:"center",gap:16,transition:"all 0.18s"}}>
            <div style={{width:52,height:52,borderRadius:16,background:opt.bc+"22",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{NAV[opt.nk]?.(true,{...C,mint:opt.bc,gold:opt.bc,sky:opt.bc})}</div>
            <div style={{flex:1,textAlign:"left"}}>
              <div style={{fontWeight:800,fontSize:17,color:C.text}}>{opt.l}</div>
              <div style={{fontSize:12,color:C.textMed,marginTop:2}}>{opt.s}</div>
            </div>
            <div style={{color:opt.ac,fontSize:22,fontWeight:700}}>›</div>
          </button>
        ))}
      </div>
    </Shell>
  );

  // ════════════════════════════════════════
  // APP
  // ════════════════════════════════════════
  return (
    <Shell C={C}>
      <style>{css}</style>

      {/* PARTICLES */}
      {particles.map(p=>(
        <div key={p.id} style={{position:"fixed",left:`${p.x}%`,top:`${p.y}%`,fontSize:20,zIndex:9999,animation:`particleFly 1.8s ease-out ${p.d}s forwards`,pointerEvents:"none"}}>{p.e}</div>
      ))}

      {/* NOTIF */}
      {notif&&<div className="notif slide-in">{notif.emoji} {notif.msg}</div>}

      {/* MASCOT BUBBLE */}
      {showMascot&&(
        <div className="pop-in" style={{position:"fixed",bottom:90,left:16,right:16,zIndex:500,background:C.card,borderRadius:20,padding:"12px 16px",border:`2px solid ${C.mint}`,boxShadow:C.shadowMd,display:"flex",gap:10,alignItems:"center",maxWidth:398,margin:"0 auto"}}>
          <div style={{fontSize:32,flexShrink:0}} className="float">🦎</div>
          <div style={{flex:1}}>
            {mascotLoading
              ?<div style={{display:"flex",gap:6,alignItems:"center"}}><div className="spin-icon" style={{fontSize:16}}>🦎</div><span style={{fontSize:12,color:C.textMed}}>Kiko está pensando…</span></div>
              :<div style={{fontSize:13,color:C.textMed,fontWeight:600,lineHeight:1.4}}>{mascotMsg}</div>
            }
          </div>
          <button onClick={()=>setShowMascot(false)} style={{background:"none",border:"none",color:C.textLt,cursor:"pointer",fontSize:16,flexShrink:0}}>✕</button>
        </div>
      )}

      {/* LESSON MODAL */}
      {activeLesson&&(
        <div className="overlay">
          <div className="modal pop-in" style={{textAlign:"center"}}>
            <div style={{fontSize:52,marginBottom:12}}>{activeLesson.emoji}</div>
            <div style={{fontWeight:900,fontSize:20,color:C.text,marginBottom:8}}>{activeLesson.title}</div>
            <div style={{background:C.mintLt,borderRadius:16,padding:16,fontSize:14,color:C.textMed,lineHeight:1.7,textAlign:"left",marginBottom:16}}>{activeLesson.content}</div>
            <div style={{background:C.goldLt,borderRadius:14,padding:"10px 14px",fontSize:13,color:C.goldDk,fontWeight:700,marginBottom:16}}>
              🎯 Misión: Reflexiona — ¿Cómo puedes aplicar esto hoy?
            </div>
            <BtnMain onClick={()=>{
              setActiveLesson(null);
              if(activeLesson.quiz&&activeLesson.quiz.length>0){
                setQuizLesson(activeLesson);setQuizStep(0);setQuizAnswers([]);setQuizDone(false);
                notify("¡Quiz de la lección! 3 preguntas rápidas 🧠","🎯");
              } else {
                setLessons(p=>p.map(l=>l.id===activeLesson.id?{...l,done:true}:l));
                setUser(p=>({...p,xp:p.xp+activeLesson.xp,coins:p.coins+10}));
                boom(); notify(`+${activeLesson.xp} XP por aprender!`,"🧠");
              }
            }} bg={`linear-gradient(135deg,${C.mint},${C.mintDk})`} style={{width:"100%"}}>
              {activeLesson.quiz?"🧠 ¡Hacer quiz! →":"✓ Lección completada +"+activeLesson.xp+" XP"}
            </BtnMain>
          </div>
        </div>
      )}

      {/* ════ ADMIN ROLE SWITCHER ════ */}
      {user.isAdmin&&(
        <div style={{background:`linear-gradient(90deg,${C.purple}18,${C.sky}08)`,borderBottom:`1.5px solid ${C.purple}25`,padding:"7px 14px",display:"flex",gap:6,alignItems:"center",overflowX:"auto",flexShrink:0}}>
          <span style={{fontSize:10,fontWeight:800,color:C.purple,flexShrink:0}}>⚙️</span>
          {[
            {id:"admin",   l:"Admin",    color:C.purple},
            {id:"student", l:"Alumno",   color:C.mint},
            {id:"parent",  l:"Padre",    color:C.gold},
            {id:"teacher", l:"Profe",    color:C.sky},
          ].map(v=>(
            <button key={v.id} onClick={()=>{
              setAdminView(v.id);
              if(v.id==="admin")   setTab("admin");
              if(v.id==="student") { setRole("student"); setTab("home"); }
              if(v.id==="parent")  { setRole("parent");  setTab("validate"); }
              if(v.id==="teacher") { setRole("teacher"); setTab("panel"); }
            }} style={{flexShrink:0,padding:"5px 12px",borderRadius:11,border:`1.5px solid ${adminView===v.id?v.color:C.border}`,background:adminView===v.id?v.color+"22":C.card,color:adminView===v.id?v.color:C.textMed,fontSize:11,fontWeight:800,cursor:"pointer",whiteSpace:"nowrap",transition:"all 0.15s"}}>
              {v.l}
            </button>
          ))}
          <span style={{fontSize:10,color:C.textLt,marginLeft:"auto",flexShrink:0}}>Vista de administrador</span>
        </div>
      )}

      {/* TUTORIAL OVERLAY */}
      {!tutDone&&role===ROLES.STUDENT&&(
        <div className="overlay" style={{zIndex:8000}}>
          <div className="modal pop-in">
            {tutStep===0&&(
              <div style={{textAlign:"center"}}>
                <div style={{fontSize:56,marginBottom:10}} className="float">🦎</div>
                <div style={{fontWeight:900,fontSize:22,color:C.text,marginBottom:6}}>¡Hola! Soy Kiko</div>
                <div style={{fontSize:14,color:C.textMed,lineHeight:1.6,marginBottom:20}}>Soy tu guía en KidQuest. Te voy a enseñar cómo funciona todo en 3 pasos rápidos 😊</div>
                <BtnMain onClick={()=>setTutStep(1)} bg={`linear-gradient(135deg,${C.mint},${C.mintDk})`} style={{width:"100%"}}>¡Vamos! →</BtnMain>
              </div>
            )}
            {tutStep===1&&(
              <div style={{textAlign:"center"}}>
                <div style={{fontSize:52,marginBottom:10}}>✅</div>
                <div style={{fontWeight:900,fontSize:20,color:C.text,marginBottom:6}}>¿Cómo completo tareas?</div>
                <div style={{textAlign:"left",marginBottom:16}}>
                  {[
                    {i:"📸",t:"Toma una foto de lo que hiciste"},
                    {i:"🤖",t:"La IA revisa si está bien hecho"},
                    {i:"💡",t:"Si la foto falla, hay otras opciones"},
                    {i:"🎡",t:"¡Gana recompensas y sube de nivel!"},
                  ].map((x,i)=>(
                    <div key={i} style={{display:"flex",gap:10,alignItems:"center",marginBottom:10,background:C.mintLt,borderRadius:12,padding:"10px 12px"}}>
                      <span style={{fontSize:24}}>{x.i}</span>
                      <span style={{fontSize:13,color:C.textMed,fontWeight:600}}>{x.t}</span>
                    </div>
                  ))}
                </div>
                <BtnMain onClick={()=>setTutStep(2)} bg={`linear-gradient(135deg,${C.mint},${C.mintDk})`} style={{width:"100%"}}>Siguiente →</BtnMain>
              </div>
            )}
            {tutStep===2&&(
              <div style={{textAlign:"center"}}>
                <div style={{fontSize:52,marginBottom:10}}>🐷</div>
                <div style={{fontWeight:900,fontSize:20,color:C.text,marginBottom:6}}>¿Por qué ahorrar?</div>
                <div style={{background:C.goldLt,borderRadius:16,padding:14,fontSize:13,color:C.goldDk,lineHeight:1.6,marginBottom:16,textAlign:"left"}}>
                  Si guardas <b>$500 por semana</b>, en 1 año tendrás <b>$26.000</b>. ¡Con eso puedes comprar una bicicleta o lo que siempre quisiste! 🚲<br/><br/>
                  KidQuest te ayuda a crear ese hábito jugando. ¡Cada tarea que completas es un paso más hacia tus metas!
                </div>
                <BtnMain onClick={()=>setTutDone(true)} bg={`linear-gradient(135deg,${C.gold},${C.goldDk})`} style={{width:"100%"}}>¡Entendido! Empezar →</BtnMain>
              </div>
            )}
            <div style={{display:"flex",justifyContent:"center",gap:6,marginTop:16}}>
              {[0,1,2].map(i=><div key={i} style={{width:8,height:8,borderRadius:"50%",background:tutStep===i?C.mint:C.border}}/>)}
            </div>
          </div>
        </div>
      )}

      {/* VERIFY MODAL */}
      {verifyTask&&(
        <div className="overlay">
          <div className="modal pop-in" style={{maxHeight:"90vh",overflowY:"auto"}}>
            {/* header */}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
              <div style={{display:"flex",gap:12,alignItems:"center"}}>
                <div style={{width:50,height:50,borderRadius:14,background:C.mintLt,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,flexShrink:0}}>{verifyTask.emoji}</div>
                <div>
                  <div style={{fontWeight:800,fontSize:16,color:C.text}}>{verifyTask.title}</div>
                  <div style={{fontSize:11,color:C.textMed}}>{verifyTask.hint}</div>
                  <Chip label={`⏳ 24h para completar`} bg={C.goldLt} color={C.goldDk}/>
                </div>
              </div>
              <button onClick={()=>setVerifyTask(null)} style={{background:C.border,border:"none",borderRadius:10,padding:"5px 9px",color:C.textMed,cursor:"pointer",fontSize:15,lineHeight:1,flexShrink:0}}>✕</button>
            </div>

            {/* reward */}
            <div style={{background:C.goldLt,border:`1px solid ${C.gold}60`,borderRadius:14,padding:"9px 14px",marginBottom:16,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:12,color:C.textMed,fontWeight:600}}>Al aprobar:</span>
              <span style={{fontWeight:800,color:C.goldDk,fontSize:12}}>+{verifyTask.xp} XP · +{verifyTask.coins}💰 · 🎡</span>
            </div>

            {/* METHOD TABS */}
            <div style={{display:"flex",gap:6,marginBottom:16,overflowX:"auto",paddingBottom:4}}>
              {[
                {id:"photo",label:"Foto"},
                {id:"qr",   label:"Código"},
                {id:"gps",  label:"GPS"},
                {id:"self", label:"Texto"},
              ].map(m=>(
                <button key={m.id} onClick={()=>setVerifyMode(m.id)}
                  style={{padding:"6px 12px",borderRadius:20,border:`1.5px solid ${verifyMode===m.id?C.mint:C.border}`,background:verifyMode===m.id?C.mint:"white",color:verifyMode===m.id?"white":C.textMed,fontWeight:700,fontSize:11,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0,transition:"all 0.15s"}}>
                  {m.label}
                </button>
              ))}
            </div>

            {/* PHOTO MODE */}
            {verifyMode==="photo"&&(
              <div>
                {!photoThumb?(
                  <label style={{display:"block",cursor:"pointer"}}>
                    <div className="upload-zone">
                      <div style={{fontSize:36,marginBottom:6}}>📷</div>
                      <div style={{fontWeight:700,fontSize:14,color:C.text}}>Subir foto de evidencia</div>
                      <div style={{fontSize:12,color:C.textMed,marginTop:3}}>La IA analiza si está bien hecho • Flexible con mala luz</div>
                    </div>
                    <input type="file" accept="image/*" capture="environment" onChange={handleFile} style={{display:"none"}}/>
                  </label>
                ):(
                  <div>
                    <div style={{position:"relative",borderRadius:14,overflow:"hidden",marginBottom:10,border:`2px solid ${C.border}`}}>
                      <img src={photoThumb} alt="ev" style={{width:"100%",height:160,objectFit:"cover",display:"block"}}/>
                      {aiLoading&&(
                        <div style={{position:"absolute",inset:0,background:dark?"rgba(15,26,22,0.85)":"rgba(255,255,255,0.88)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:8}}>
                          <div className="spin-icon" style={{fontSize:36}}>🤖</div>
                          <div style={{fontWeight:700,fontSize:13,color:C.mint}}>Kiko analiza tu foto…</div>
                          <div style={{fontSize:11,color:C.textMed}}>Siendo flexible con la iluminación</div>
                        </div>
                      )}
                    </div>

                    {aiResult&&!aiLoading&&(
                      <div>
                        <div style={{background:aiResult.approved?C.mintLt:C.coralLt,border:`1.5px solid ${aiResult.approved?C.mint:C.coral}`,borderRadius:14,padding:14,marginBottom:10}}>
                          <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:6}}>
                            <span style={{fontSize:22}}>{aiResult.approved?"✅":"⚠️"}</span>
                            <div style={{flex:1}}>
                              <div style={{fontWeight:800,color:aiResult.approved?C.mintDk:C.coral,fontSize:14}}>
                                {aiResult.approved?"¡Foto aprobada!":"Foto con observaciones"}
                              </div>
                              <div style={{fontSize:11,color:C.textMed}}>Confianza IA: {aiResult.confidence}%</div>
                            </div>
                            <div style={{background:aiResult.approved?C.mint:C.coral,color:"white",borderRadius:20,padding:"3px 10px",fontSize:11,fontWeight:800}}>{aiResult.confidence}%</div>
                          </div>
                          <div style={{fontSize:13,color:C.text,marginBottom:6}}>{aiResult.reason}</div>
                          {aiResult.detected?.length>0&&<div style={{fontSize:11,color:C.textMed}}>🔍 {aiResult.detected.join(", ")}</div>}

                          {/* Lighting warning + alternatives */}
                          {!aiResult.lightingOk&&(
                            <div style={{marginTop:8,background:C.goldLt,border:`1px solid ${C.gold}60`,borderRadius:10,padding:"8px 10px"}}>
                              <div style={{fontSize:12,color:C.goldDk,fontWeight:700,marginBottom:4}}>💡 Iluminación baja detectada</div>
                              <div style={{fontSize:11,color:C.goldDk}}>{aiResult.tips}</div>
                            </div>
                          )}

                          {!aiResult.approved&&(
                            <div style={{marginTop:10}}>
                              <div style={{fontSize:12,color:C.textMed,fontWeight:700,marginBottom:6}}>¿Qué puedo hacer?</div>
                              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                                {(aiResult.alternativeOptions||[]).map((opt,i)=>(
                                  <button key={i} onClick={()=>setVerifyMode(i===0?"qr":"self")}
                                    style={{padding:"5px 10px",borderRadius:12,border:`1.5px solid ${C.sky}`,background:C.skyLt,color:C.sky,fontSize:11,fontWeight:700,cursor:"pointer"}}>
                                    {opt}
                                  </button>
                                ))}
                                <button onClick={()=>setVerifyMode("appeal")}
                                  style={{padding:"5px 10px",borderRadius:12,border:`1.5px solid ${C.purple}`,background:C.purpleLt,color:C.purple,fontSize:11,fontWeight:700,cursor:"pointer"}}>
                                  ⚖️ Apelar decisión
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <label style={{cursor:"pointer"}}>
                      <div style={{textAlign:"center",fontSize:12,color:C.textMed,padding:"4px 0"}}>🔄 Cambiar foto</div>
                      <input type="file" accept="image/*" capture="environment" onChange={handleFile} style={{display:"none"}}/>
                    </label>
                  </div>
                )}
              </div>
            )}

            {/* QR MODE */}
            {verifyMode==="qr"&&(
              <div>
                <div style={{fontSize:13,color:C.textMed,marginBottom:12,lineHeight:1.5}}>Muéstrale este QR a tu papá, mamá o tutor para que confirme que hiciste la tarea:</div>
                {!qrOk?(
                  qrTimer>0?(
                    <div style={{background:C.goldLt,border:`1.5px solid ${C.gold}`,borderRadius:16,padding:16,textAlign:"center"}}>
                      <div style={{background:"white",borderRadius:12,padding:14,width:90,margin:"0 auto 10px",boxShadow:C.shadow}}><div style={{fontSize:50}}>🔲</div></div>
                      <div style={{fontWeight:900,fontSize:28,color:C.goldDk}}>{qrTimer}</div>
                      <div style={{fontSize:12,color:C.textMed}}>Esperando que tu tutor escanee…</div>
                    </div>
                  ):(
                    <button className="vstep-btn" onClick={()=>showQR()} style={{borderColor:C.gold,color:C.goldDk}}>Mostrar QR al tutor</button>
                  )
                ):(
                  <div className="verify-ok" style={{background:C.mintLt,borderColor:C.mint,color:C.mintDk}}>QR validado ✓</div>
                )}
              </div>
            )}

            {/* GPS MODE */}
            {verifyMode==="gps"&&(
              <div>
                <div style={{fontSize:13,color:C.textMed,marginBottom:12}}>Confirma que estás en el lugar correcto para realizar la tarea:</div>
                {!gpsOk
                  ?<button className="vstep-btn" onClick={activateGPS} style={{borderColor:C.mint,color:C.mintDk}}>📍 Verificar mi ubicación</button>
                  :<div className="verify-ok" style={{background:C.mintLt,borderColor:C.mint,color:C.mintDk}}>✅ GPS: Casa familiar · {new Date().toLocaleTimeString()}</div>
                }
              </div>
            )}

            {/* SELF DESCRIPTION MODE */}
            {verifyMode==="self"&&(
              <div>
                <div style={{fontSize:13,color:C.textMed,marginBottom:10,lineHeight:1.5}}>Describe con tus palabras qué hiciste exactamente. Tu tutor lo revisará en las próximas 24 horas:</div>
                <textarea value={selfDesc} onChange={e=>setSelfDesc(e.target.value.slice(0,300))}
                  placeholder="Ejemplo: Tendí mi cama, acomodé las almohadas y doblé la frazada. La hice sola sin que me lo pidieran..."
                  style={{width:"100%",height:100,borderRadius:14,border:`1.5px solid ${C.border}`,padding:"10px 14px",fontSize:13,color:C.text,background:C.card,fontFamily:"'Nunito',sans-serif",resize:"none",outline:"none",marginBottom:10,lineHeight:1.5}}/>
                <div style={{fontSize:11,color:C.textLt,marginBottom:12,textAlign:"right"}}>{selfDesc.length}/300 — mín 20 caracteres</div>
                <div style={{background:C.skyLt,border:`1px solid ${C.sky}30`,borderRadius:12,padding:"8px 12px",fontSize:11,color:C.sky,marginBottom:12}}>
                  ℹ️ Con este método recibirás <b>50% de los puntos</b> de forma inmediata. El resto al confirmar tu tutor.
                </div>
              </div>
            )}

            {/* APPEAL MODE */}
            {verifyMode==="appeal"&&(
              <div>
                <div style={{fontWeight:800,fontSize:15,color:C.text,marginBottom:8}}>⚖️ Apelar decisión de la IA</div>
                <div style={{fontSize:13,color:C.textMed,marginBottom:10,lineHeight:1.5}}>¿La IA fue injusta? Explica por qué crees que deberías ser aprobado:</div>
                {!appealRes?(
                  <>
                    <textarea value={appealText} onChange={e=>setAppealText(e.target.value.slice(0,250))}
                      placeholder="Ejemplo: Sí tendí mi cama pero la foto salió oscura porque era de noche. La cama está bien hecha, puedo mostrársela a mi mamá..."
                      style={{width:"100%",height:90,borderRadius:14,border:`1.5px solid ${C.border}`,padding:"10px 14px",fontSize:13,color:C.text,background:C.card,fontFamily:"'Nunito',sans-serif",resize:"none",outline:"none",marginBottom:10,lineHeight:1.5}}/>
                    <BtnMain onClick={submitAppeal} bg={`linear-gradient(135deg,${C.purple},#6d53c4)`} style={{width:"100%"}} disabled={appealLoading||appealText.trim().length<15}>
                      {appealLoading?<span><span className="spin-icon">⚖️</span> Revisando apelación…</span>:"⚖️ Enviar apelación"}
                    </BtnMain>
                  </>
                ):(
                  <div style={{background:appealRes.appeal_approved?C.mintLt:C.coralLt,border:`1.5px solid ${appealRes.appeal_approved?C.mint:C.coral}`,borderRadius:14,padding:14}}>
                    <div style={{fontWeight:800,fontSize:15,color:appealRes.appeal_approved?C.mintDk:C.coral,marginBottom:6}}>
                      {appealRes.appeal_approved?"✅ Apelación aceptada":"❌ Apelación rechazada"}
                    </div>
                    <div style={{fontSize:13,color:C.text,marginBottom:8}}>{appealRes.response}</div>
                    {appealRes.appeal_approved&&<div style={{background:C.goldLt,borderRadius:10,padding:"6px 10px",fontSize:12,color:C.goldDk,fontWeight:700,marginBottom:8}}>🎁 Crédito parcial: {appealRes.partial_credit}% de los puntos</div>}
                    <div style={{fontSize:11,color:C.textMed}}>💡 {appealRes.tip_for_next_time}</div>
                  </div>
                )}
              </div>
            )}

            {/* SUBMIT BUTTONS */}
            <div style={{marginTop:16,display:"flex",flexDirection:"column",gap:8}}>
              {verifyMode==="photo"&&canPhotoSubmit&&(
                <BtnMain onClick={()=>submitTask(false)} bg={`linear-gradient(135deg,${C.mint},${C.mintDk})`} style={{width:"100%"}}>✓ Entregar misión completa</BtnMain>
              )}
              {verifyMode==="qr"&&qrOk&&(
                <BtnMain onClick={()=>submitTask(false)} bg={`linear-gradient(135deg,${C.mint},${C.mintDk})`} style={{width:"100%"}}>✓ Validar con código tutor</BtnMain>
              )}
              {verifyMode==="gps"&&gpsOk&&(
                <BtnMain onClick={()=>submitTask(false)} bg={`linear-gradient(135deg,${C.mint},${C.mintDk})`} style={{width:"100%"}}>✓ Confirmar con ubicación</BtnMain>
              )}
              {verifyMode==="self"&&selfDesc.trim().length>=20&&(
                <BtnMain onClick={selfValidate} bg={`linear-gradient(135deg,${C.sky},#2d8fd4)`} style={{width:"100%"}}>📝 Enviar descripción — 50% ahora</BtnMain>
              )}
              {verifyMode==="appeal"&&appealRes?.appeal_approved&&(
                <BtnMain onClick={()=>submitTask(true)} bg={`linear-gradient(135deg,${C.purple},#6d53c4)`} style={{width:"100%"}}>⚖️ Aceptar crédito parcial ({appealRes.partial_credit}%)</BtnMain>
              )}
            </div>
          </div>
        </div>
      )}

      {/* WHEEL MODAL */}
      {showWheel&&(
        <div className="overlay">
          <div className="modal pop-in" style={{textAlign:"center"}}>
            <div style={{fontWeight:900,fontSize:26,color:C.text,marginBottom:2}}>🎡 ¡Ruleta!</div>
            <div style={{fontSize:13,color:C.textMed,marginBottom:18}}>Misión completada — gira tu recompensa</div>
            <div style={{position:"relative",width:230,height:230,margin:"0 auto 18px"}}>
              <svg viewBox="0 0 220 220" style={{transform:`rotate(${wheelAngle}deg)`,transition:isSpinning?"transform 3.8s cubic-bezier(0.17,0.67,0.1,0.99)":"none",filter:isSpinning?`drop-shadow(0 0 16px ${C.mint}80)`:"none"}}>
                {WHEEL_PRIZES.map((r,i)=>{
                  const seg=360/WHEEL_PRIZES.length;
                  const a1=(seg*i-90)*Math.PI/180,a2=(seg*(i+1)-90)*Math.PI/180,R=100;
                  const x1=110+R*Math.cos(a1),y1=110+R*Math.sin(a1),x2=110+R*Math.cos(a2),y2=110+R*Math.sin(a2);
                  const mx=110+65*Math.cos((a1+a2)/2),my=110+65*Math.sin((a1+a2)/2);
                  const cls=[C.mint,C.gold,C.sky,C.coral,C.purple,C.mint,C.gold,C.sky];
                  return (
                    <g key={i}>
                      <path d={`M 110 110 L ${x1} ${y1} A ${R} ${R} 0 0 1 ${x2} ${y2} Z`} fill={cls[i]} stroke="white" strokeWidth="2"/>
                      <text x={mx} y={my} textAnchor="middle" dominantBaseline="middle" fontSize="16">{r.emoji}</text>
                    </g>
                  );
                })}
                <circle cx="110" cy="110" r="18" fill="white" stroke={C.mint} strokeWidth="3"/>
                <polygon points="110,2 117,22 103,22" fill={C.mint}/>
              </svg>
            </div>
            {wheelRes?(
              <div className="pop-in" style={{marginBottom:16}}>
                <div style={{fontSize:52}}>{wheelRes.emoji}</div>
                <div style={{fontWeight:900,fontSize:22,color:C.text}}>{wheelRes.label}</div>
                <Chip label={wheelRes.rarity} bg={wheelRes.rc+"20"} color={wheelRes.rc}/>
              </div>
            ):<div style={{height:80}}/>}
            <BtnMain onClick={wheelRes?()=>{setShowWheel(false);setWheelRes(null);}:spinWheel} disabled={isSpinning}
              bg={isSpinning?"#E0E0E0":wheelRes?`linear-gradient(135deg,${C.mint},${C.mintDk})`:`linear-gradient(135deg,${C.gold},${C.goldDk})`}
              style={{width:"100%",color:isSpinning?C.textLt:"white",cursor:isSpinning?"not-allowed":"pointer"}}>
              {isSpinning?"Girando…":wheelRes?"¡Genial! Continuar":"⚡ Girar"}
            </BtnMain>
          </div>
        </div>
      )}

      {/* ════ TUTOR LINK MODAL ════ */}
      {showLinkTutor&&(
        <div className="overlay" style={{zIndex:9992}}>
          <div className="modal pop-in">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <div style={{fontWeight:800,fontSize:17,color:C.text}}>
                {role===ROLES.STUDENT?"🔗 Vincular Tutor":"👨‍👩‍👦 Vincular Estudiante"}
              </div>
              <button onClick={()=>{setShowLinkTutor(false);setLinkStep("scan");}} style={{background:C.border,border:"none",borderRadius:10,padding:"5px 9px",color:C.textMed,cursor:"pointer",fontSize:15}}>✕</button>
            </div>

            {/* STUDENT FLOW */}
            {role===ROLES.STUDENT&&(
              <>
                {linkStep==="scan"&&(
                  <div style={{textAlign:"center"}}>
                    <div style={{fontSize:48,marginBottom:10}}>📱</div>
                    <div style={{fontWeight:800,fontSize:16,color:C.text,marginBottom:6}}>Muestra este código a tu tutor</div>
                    <div style={{fontSize:13,color:C.textMed,marginBottom:20,lineHeight:1.5}}>
                      Tu papá, mamá o tutor debe abrir KidQuest, ir a <b>Vincular Estudiante</b> y escanear este código.
                    </div>
                    {/* Big QR code */}
                    <div style={{background:"white",borderRadius:20,padding:20,width:170,margin:"0 auto 16px",boxShadow:C.shadowMd,border:`2px solid ${C.mint}40`}}>
                      <svg width="130" height="130" viewBox="0 0 130 130">
                        {/* Simulated QR pattern */}
                        {[...Array(7)].map((_,r)=>[...Array(7)].map((_,c)=>{
                          const corner=(r<3&&c<3)||(r<3&&c>3)||(r>3&&c<3);
                          return corner&&!(r===1&&c===1&&r<3&&c<3)&&!(r===1&&c===5)&&!(r===5&&c===1)
                            ?<rect key={`${r}${c}`} x={10+c*16} y={10+r*16} width={14} height={14} rx={2} fill="#1a2e28"/>:null;
                        }))}
                        {/* center pattern */}
                        {[...Array(4)].map((_,r)=>[...Array(4)].map((_,c)=>(
                          Math.random()>0.5&&<rect key={`c${r}${c}`} x={36+c*14} y={36+r*14} width={12} height={12} rx={1} fill="#1a2e28"/>
                        )))}
                        <rect x="10" y="10" width="48" height="48" rx="4" fill="none" stroke="#1a2e28" strokeWidth="4"/>
                        <rect x="72" y="10" width="48" height="48" rx="4" fill="none" stroke="#1a2e28" strokeWidth="4"/>
                        <rect x="10" y="72" width="48" height="48" rx="4" fill="none" stroke="#1a2e28" strokeWidth="4"/>
                        <rect x="22" y="22" width="24" height="24" rx="2" fill="#1a2e28"/>
                        <rect x="84" y="22" width="24" height="24" rx="2" fill="#1a2e28"/>
                        <rect x="22" y="84" width="24" height="24" rx="2" fill="#1a2e28"/>
                      </svg>
                      <div style={{fontSize:10,color:C.textMed,fontWeight:700,marginTop:6}}>MATEO-{Math.random().toString(36).slice(2,6).toUpperCase()}</div>
                    </div>
                    <div style={{background:C.goldLt,border:`1.5px solid ${C.gold}60`,borderRadius:14,padding:"10px 16px",marginBottom:16,display:"flex",gap:10,alignItems:"center"}}>
                      <span style={{fontSize:24}}>💎</span>
                      <div style={{textAlign:"left"}}>
                        <div style={{fontWeight:800,fontSize:13,color:C.goldDk}}>¡Gana {BOND_REWARD_GEMS} cristales!</div>
                        <div style={{fontSize:11,color:C.textMed}}>Cuando tu tutor acepte la vinculación</div>
                      </div>
                    </div>
                    {linkedTutors.length>0&&(
                      <div style={{background:C.mintLt,borderRadius:14,padding:"10px 14px",marginBottom:12}}>
                        <div style={{fontSize:12,fontWeight:700,color:C.mintDk,marginBottom:6}}>✅ Tutores vinculados ({linkedTutors.length})</div>
                        {linkedTutors.map((t,i)=>(
                          <div key={i} style={{fontSize:12,color:C.textMed}}>👩 {t}</div>
                        ))}
                      </div>
                    )}
                    {/* Simulate scan accepted */}
                    <BtnMain onClick={()=>setLinkStep("confirm")} bg={`linear-gradient(135deg,${C.mint},${C.mintDk})`} style={{width:"100%"}}>
                      ✓ Simular: tutor escaneó el código
                    </BtnMain>
                  </div>
                )}
                {linkStep==="confirm"&&(
                  <div style={{textAlign:"center"}}>
                    <div style={{fontSize:56,marginBottom:10}} className="float">🎉</div>
                    <div style={{fontWeight:900,fontSize:20,color:C.text,marginBottom:6}}>¡Vinculación exitosa!</div>
                    <div style={{fontSize:13,color:C.textMed,marginBottom:16}}>Mamá Laura ahora es tu tutora en KidQuest</div>
                    <div style={{background:`linear-gradient(135deg,${C.gold},${C.goldDk})`,borderRadius:16,padding:"16px",marginBottom:16,color:"white"}}>
                      <div style={{fontWeight:900,fontSize:28}}>+{BOND_REWARD_GEMS} 💎</div>
                      <div style={{fontSize:13,opacity:0.9}}>¡Cristales añadidos a tu cuenta!</div>
                    </div>
                    <BtnMain onClick={()=>{
                      setLinkedTutors(p=>[...p,"Papá Carlos"]);
                      setUser(p=>({...p,gems:p.gems+BOND_REWARD_GEMS}));
                      boom();
                      setLinkStep("scan");
                      setShowLinkTutor(false);
                      notify(`+${BOND_REWARD_GEMS} 💎 por vincular tutor!`,"🔗");
                    }} bg={`linear-gradient(135deg,${C.gold},${C.goldDk})`} style={{width:"100%"}}>
                      🎁 Reclamar {BOND_REWARD_GEMS} cristales
                    </BtnMain>
                  </div>
                )}
              </>
            )}

            {/* PARENT/TEACHER FLOW */}
            {(role===ROLES.PARENT||role===ROLES.TEACHER)&&(
              <>
                {linkStep==="scan"&&(
                  <div>
                    <div style={{fontSize:13,color:C.textMed,marginBottom:16,lineHeight:1.5}}>
                      Pídele a tu {role===ROLES.PARENT?"hijo/a":"alumno/a"} que abra KidQuest → <b>Vincular Tutor</b> y muestre su código QR.
                    </div>
                    {/* Simulated camera view */}
                    <div style={{background:"#1a1a1a",borderRadius:16,height:170,marginBottom:14,display:"flex",alignItems:"center",justifyContent:"center",position:"relative",overflow:"hidden",border:`2px solid ${C.mint}`}}>
                      <div style={{position:"absolute",inset:0,background:"linear-gradient(135deg,#1a2e28,#0d1a16)",opacity:0.9}}/>
                      <div style={{position:"relative",textAlign:"center"}}>
                        <div style={{fontSize:36,marginBottom:6}}>📷</div>
                        <div style={{fontSize:12,color:"rgba(255,255,255,0.7)"}}>Apunta la cámara al QR del estudiante</div>
                        <div style={{width:100,height:100,border:"2px solid #4DC9A0",borderRadius:8,margin:"10px auto 0",position:"relative"}}>
                          <div style={{position:"absolute",top:0,left:0,width:16,height:16,borderTop:`3px solid ${C.mint}`,borderLeft:`3px solid ${C.mint}`}}/>
                          <div style={{position:"absolute",top:0,right:0,width:16,height:16,borderTop:`3px solid ${C.mint}`,borderRight:`3px solid ${C.mint}`}}/>
                          <div style={{position:"absolute",bottom:0,left:0,width:16,height:16,borderBottom:`3px solid ${C.mint}`,borderLeft:`3px solid ${C.mint}`}}/>
                          <div style={{position:"absolute",bottom:0,right:0,width:16,height:16,borderBottom:`3px solid ${C.mint}`,borderRight:`3px solid ${C.mint}`}}/>
                        </div>
                      </div>
                    </div>
                    {/* Linked students list */}
                    <div style={{background:C.mintLt,borderRadius:14,padding:"10px 14px",marginBottom:14}}>
                      <div style={{fontSize:12,fontWeight:700,color:C.mintDk,marginBottom:8}}>
                        {role===ROLES.PARENT?"👨‍👩‍👦":"👦"} {role===ROLES.PARENT?"Hijos/as vinculados":"Alumnos vinculados"} ({linkedStudents.length})
                      </div>
                      {linkedStudents.map((s,i)=>(
                        <div key={i} style={{display:"flex",alignItems:"center",gap:10,marginBottom:6,padding:"6px 8px",background:C.card,borderRadius:10}}>
                          <div style={{width:30,height:30,borderRadius:"50%",background:C.border,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden"}}>
                            <KQIcon id={s.avatar} size={26}/>
                          </div>
                          <div style={{flex:1}}>
                            <div style={{fontWeight:700,fontSize:12,color:C.text}}>{s.name}</div>
                            <div style={{fontSize:10,color:C.textMed}}>Nv.{s.level}</div>
                          </div>
                          {!s.gem_reward_claimed&&<Chip label="💎 Pendiente" bg={C.goldLt} color={C.goldDk}/>}
                          {s.gem_reward_claimed&&<Chip label="✓ Activo" bg={C.mintLt} color={C.mintDk}/>}
                        </div>
                      ))}
                    </div>
                    <BtnMain onClick={()=>{setPendingStudent({name:"Sofía",avatar:"a_sprout",level:4});setLinkStep("confirm");}} bg={`linear-gradient(135deg,${C.mint},${C.mintDk})`} style={{width:"100%"}}>
                      📷 Simular: escanear QR de Sofía
                    </BtnMain>
                  </div>
                )}
                {linkStep==="confirm"&&pendingStudent&&(
                  <div style={{textAlign:"center"}}>
                    <div style={{marginBottom:10,display:"flex",justifyContent:"center"}}>
                      <div style={{width:70,height:70,borderRadius:"50%",background:C.mintLt,border:`3px solid ${C.mint}`,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden"}}>
                        <KQIcon id={pendingStudent.avatar} size={62}/>
                      </div>
                    </div>
                    <div style={{fontWeight:800,fontSize:16,color:C.text,marginBottom:4}}>¿Vincular a {pendingStudent.name}?</div>
                    <div style={{fontSize:12,color:C.textMed,marginBottom:16}}>Podrás validar sus tareas y ver su progreso</div>
                    <div style={{background:C.goldLt,border:`1.5px solid ${C.gold}60`,borderRadius:14,padding:"10px 14px",marginBottom:16,fontSize:12,color:C.goldDk,fontWeight:600}}>
                      💎 {pendingStudent.name} recibirá {BOND_REWARD_GEMS} cristales al aceptar
                    </div>
                    <div style={{display:"flex",gap:10}}>
                      <button onClick={()=>setLinkStep("scan")} style={{flex:1,padding:"12px",borderRadius:14,border:`1.5px solid ${C.border}`,background:C.card,color:C.textMed,cursor:"pointer",fontWeight:800,fontSize:13}}>Cancelar</button>
                      <BtnMain onClick={()=>{
                        setLinkedStudents(p=>[...p,{...pendingStudent,gem_reward_claimed:false}]);
                        setLinkStep("scan");
                        setShowLinkTutor(false);
                        boom();
                        notify(`¡${pendingStudent.name} vinculado/a!`,"🔗");
                      }} bg={`linear-gradient(135deg,${C.mint},${C.mintDk})`} style={{flex:2}}>
                        ✓ Aceptar vinculación
                      </BtnMain>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}


      {/* ════ AGE PICKER MODAL ════ */}
      {showAgePick&&(
        <div className="overlay">
          <div className="modal pop-in">
            <div style={{textAlign:"center",marginBottom:16}}>
              <div style={{fontSize:48,marginBottom:8}}>🎂</div>
              <div style={{fontWeight:900,fontSize:20,color:C.text,marginBottom:4}}>¿Cuántos años tienes?</div>
              <div style={{fontSize:13,color:C.textMed}}>Adaptamos la app a tu edad</div>
            </div>
            {Object.values(AGE_PROFILES).map(ap=>(
              <button key={ap.id} onClick={()=>{setAgeGroup(ap.id);setUser(p=>({...p,ageGroup:ap.id}));setShowAgePick(false);notify(`Perfil ${ap.label} activado`,ap.icon);}}
                style={{width:"100%",marginBottom:10,padding:"16px 18px",borderRadius:16,border:`2px solid ${ageGroup===ap.id?C.mint:C.border}`,background:ageGroup===ap.id?C.mintLt:C.card,cursor:"pointer",display:"flex",gap:14,alignItems:"center",textAlign:"left"}}>
                <div style={{fontSize:32,flexShrink:0}}>{ap.icon}</div>
                <div>
                  <div style={{fontWeight:800,fontSize:16,color:C.text}}>{ap.label}</div>
                  <div style={{fontSize:12,color:C.textMed}}>{ap.desc}</div>
                </div>
                {ageGroup===ap.id&&<div style={{marginLeft:"auto",color:C.mint,fontSize:18}}>✓</div>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ════ LESSON QUIZ MODAL ════ */}
      {quizLesson&&(
        <div className="overlay">
          <div className="modal pop-in">
            {!quizDone?(()=>{
              const q=quizLesson.quiz[quizStep];
              return(
                <div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                    <div style={{fontWeight:800,fontSize:15,color:C.text}}>{quizLesson.title}</div>
                    <div style={{fontSize:12,color:C.textMed}}>{quizStep+1}/{quizLesson.quiz.length}</div>
                  </div>
                  <div style={{height:4,borderRadius:4,background:C.border,marginBottom:16,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${((quizStep+1)/quizLesson.quiz.length)*100}%`,background:`linear-gradient(90deg,${C.mint},${C.gold})`,transition:"width 0.4s"}}/>
                  </div>
                  <div style={{background:C.mintLt,borderRadius:14,padding:"14px 16px",marginBottom:18}}>
                    <div style={{fontWeight:700,fontSize:14,color:C.text,lineHeight:1.5}}>{q.q}</div>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:9}}>
                    {q.opts.map((opt,i)=>{
                      const selected=quizAnswers[quizStep]===i;
                      return(
                        <button key={i} onClick={()=>{
                          const na=[...quizAnswers]; na[quizStep]=i; setQuizAnswers(na);
                          if(quizStep<quizLesson.quiz.length-1){
                            setTimeout(()=>setQuizStep(s=>s+1),400);
                          } else {
                            setTimeout(()=>setQuizDone(true),400);
                          }
                        }} style={{padding:"12px 16px",borderRadius:13,border:`2px solid ${selected?C.mint:C.border}`,background:selected?C.mintLt:C.card,cursor:"pointer",textAlign:"left",fontSize:14,fontWeight:600,color:C.text,transition:"all 0.18s"}}>
                          <span style={{color:C.textMed,marginRight:8}}>{["A","B","C","D"][i]}.</span>{opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })():(()=>{
              const correct=quizLesson.quiz.filter((q,i)=>quizAnswers[i]===q.ans).length;
              const pct=Math.round((correct/quizLesson.quiz.length)*100);
              const perfect=correct===quizLesson.quiz.length;
              return(
                <div style={{textAlign:"center"}}>
                  <div style={{fontSize:64,marginBottom:12}}>{perfect?"🏆":correct>0?"⭐":"💪"}</div>
                  <div style={{fontWeight:900,fontSize:22,color:C.text,marginBottom:4}}>
                    {perfect?"¡Perfecto!":correct>0?"¡Bien hecho!":"¡Sigue practicando!"}
                  </div>
                  <div style={{fontSize:14,color:C.textMed,marginBottom:16}}>{correct} de {quizLesson.quiz.length} respuestas correctas</div>
                  <div style={{background:`linear-gradient(135deg,${C.mint},${C.mintDk})`,borderRadius:16,padding:14,marginBottom:16,color:"white"}}>
                    <div style={{fontWeight:900,fontSize:24}}>+{perfect?quizLesson.xp*2:Math.round(quizLesson.xp*(pct/100))} XP</div>
                    <div style={{fontSize:12,opacity:0.85}}>{perfect?"¡Bonus por quiz perfecto!":"Por completar el quiz"}</div>
                  </div>
                  {quizLesson.quiz.map((q,i)=>(
                    <div key={i} style={{display:"flex",gap:8,alignItems:"flex-start",marginBottom:8,textAlign:"left",background:quizAnswers[i]===q.ans?C.mintLt:C.coralLt,borderRadius:10,padding:"8px 12px"}}>
                      <span style={{fontSize:14,flexShrink:0}}>{quizAnswers[i]===q.ans?"✅":"❌"}</span>
                      <div style={{fontSize:11,color:C.text}}><b>{q.q}</b><br/>Correcta: {q.opts[q.ans]}</div>
                    </div>
                  ))}
                  <BtnMain onClick={()=>{
                    const bonus=perfect?quizLesson.xp*2:Math.round(quizLesson.xp*(pct/100));
                    const newXpQ = user.xp + bonus;
                    setUser(p=>({...p,xp:newXpQ}));
                    setLessons(prev=>prev.map(l=>l.id===quizLesson.id?{...l,done:true}:l));
                    if(userId){ import("./supabase.js").then(({supabase})=>supabase.from("profiles").update({xp:newXpQ}).eq("id",userId)).catch(()=>{}); }
                    setQuizLesson(null);setQuizStep(0);setQuizAnswers([]);setQuizDone(false);
                    notify(`Quiz completado · +${bonus} XP`,"🏆");
                  }} bg={`linear-gradient(135deg,${C.mint},${C.mintDk})`} style={{width:"100%",marginTop:8}}>
                    ¡Reclamar XP!
                  </BtnMain>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ════ SPENDING TRACKER MODAL ════ */}
      {showSpend&&(
        <div className="overlay">
          <div className="modal pop-in">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <div style={{fontWeight:800,fontSize:17,color:C.text}}>Registrar gasto</div>
              <button onClick={()=>setShowSpend(false)} style={{background:C.border,border:"none",borderRadius:9,padding:"5px 10px",cursor:"pointer",color:C.textMed}}>✕</button>
            </div>
            <div style={{marginBottom:12}}>
              <div style={{fontSize:12,fontWeight:700,color:C.textMed,marginBottom:6}}>¿Cuánto gastaste?</div>
              <input type="number" value={spendAmt} onChange={e=>setSpendAmt(e.target.value)} placeholder="Ej: 2500"
                style={{width:"100%",padding:"12px 14px",borderRadius:12,border:`1.5px solid ${C.border}`,fontSize:16,fontWeight:700,color:C.text,background:C.card,outline:"none"}}/>
            </div>
            <div style={{marginBottom:12}}>
              <div style={{fontSize:12,fontWeight:700,color:C.textMed,marginBottom:6}}>¿Era una necesidad o deseo?</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                {EXPENSE_CATS.map(cat=>(
                  <button key={cat.id} onClick={()=>setSpendCat(cat.id)}
                    style={{padding:"10px 8px",borderRadius:12,border:`2px solid ${spendCat===cat.id?cat.color:C.border}`,background:spendCat===cat.id?cat.color+"18":C.card,cursor:"pointer",fontWeight:700,fontSize:12,color:spendCat===cat.id?cat.color:C.textMed,display:"flex",gap:6,alignItems:"center",justifyContent:"center"}}>
                    <span>{cat.icon}</span>{cat.label}
                  </button>
                ))}
              </div>
            </div>
            <div style={{marginBottom:16}}>
              <div style={{fontSize:12,fontWeight:700,color:C.textMed,marginBottom:6}}>¿En qué lo gastaste? (opcional)</div>
              <input value={spendNote} onChange={e=>setSpendNote(e.target.value)} placeholder="Ej: Helado, chips, útiles..."
                style={{width:"100%",padding:"11px 14px",borderRadius:12,border:`1.5px solid ${C.border}`,fontSize:13,color:C.text,background:C.card,outline:"none"}}/>
            </div>
            <BtnMain onClick={()=>{
              if(!spendAmt||isNaN(Number(spendAmt)))return;
              const entry={id:Date.now(),amt:Number(spendAmt),cat:spendCat,note:spendNote,ts:Date.now()};
              setSpendLog(p=>[entry,...p]);
              if(spendCat==="need") notify("Gasto necesario registrado ✓","🏠");
              else if(spendCat==="want") notify("Deseo registrado — ¿era realmente necesario?","💡");
              else if(spendCat==="save") {
                const newSaved = user.savingsGoal.saved+Number(spendAmt);
                setUser(p=>({...p,savingsGoal:{...p.savingsGoal,saved:newSaved}}));
                notify(`+$${Number(spendAmt).toLocaleString()} a tu meta de ahorro 🐷`,"💰");
                if(userId){ import("./supabase.js").then(({supabase})=>supabase.from("profiles").update({savings_goal_saved:newSaved}).eq("id",userId)).catch(()=>{}); }
              }
              // Persist to Supabase
              if(userId){ import("./supabase.js").then(({supabase})=>supabase.from("spend_log").insert({user_id:userId,amount:Number(spendAmt),category:spendCat,note:spendNote||null})).catch(()=>{}); }
              setSpendAmt("");setSpendNote("");setShowSpend(false);
            }} bg={`linear-gradient(135deg,${C.mint},${C.mintDk})`} style={{width:"100%"}}>
              Guardar registro
            </BtnMain>
          </div>
        </div>
      )}

      {/* ════ SAVINGS GOAL EDITOR ════ */}
      {showGoalEditor&&(
        <div className="overlay">
          <div className="modal pop-in">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <div style={{fontWeight:800,fontSize:17,color:C.text}}>Mi meta de ahorro</div>
              <button onClick={()=>setShowGoalEditor(false)} style={{background:C.border,border:"none",borderRadius:9,padding:"5px 10px",cursor:"pointer",color:C.textMed}}>✕</button>
            </div>
            <div style={{marginBottom:12}}>
              <div style={{fontSize:12,fontWeight:700,color:C.textMed,marginBottom:6}}>¿Para qué estás ahorrando?</div>
              <input value={goalName} onChange={e=>setGoalName(e.target.value)} placeholder="Ej: Bicicleta, zapatillas, videojuego..."
                style={{width:"100%",padding:"12px 14px",borderRadius:12,border:`1.5px solid ${C.border}`,fontSize:14,color:C.text,background:C.card,outline:"none"}}/>
            </div>
            <div style={{marginBottom:12}}>
              <div style={{fontSize:12,fontWeight:700,color:C.textMed,marginBottom:6}}>¿Cuánto cuesta?</div>
              <input type="number" value={goalTarget} onChange={e=>setGoalTarget(e.target.value)} placeholder="Ej: 50000"
                style={{width:"100%",padding:"12px 14px",borderRadius:12,border:`1.5px solid ${C.border}`,fontSize:16,fontWeight:700,color:C.text,background:C.card,outline:"none"}}/>
            </div>
            <div style={{marginBottom:16}}>
              <div style={{fontSize:12,fontWeight:700,color:C.textMed,marginBottom:6}}>Elige un emoji</div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {["🚲","👟","🎮","📱","🎒","✈️","🎸","📚","🏋️","🎯"].map(e=>(
                  <button key={e} onClick={()=>setGoalEmoji(e)} style={{fontSize:24,background:goalEmoji===e?C.mintLt:"none",border:`2px solid ${goalEmoji===e?C.mint:"transparent"}`,borderRadius:10,padding:6,cursor:"pointer"}}>{e}</button>
                ))}
              </div>
            </div>
            {goalName&&goalTarget&&(
              <div style={{background:C.goldLt,borderRadius:12,padding:"10px 14px",marginBottom:14,fontSize:12,color:C.goldDk}}>
                💡 Para alcanzar tu meta en <b>12 semanas</b> deberías ahorrar <b>${Math.ceil(Number(goalTarget)/12).toLocaleString()}/semana</b>
              </div>
            )}
            <BtnMain onClick={()=>{
              if(!goalName||!goalTarget)return;
              setUser(p=>({...p,savingsGoal:{name:goalName,target:Number(goalTarget),saved:p.savingsGoal.saved,emoji:goalEmoji}}));
              setShowGoalEditor(false);notify(`Meta "${goalName}" guardada`,"🎯");
            }} bg={`linear-gradient(135deg,${C.gold},${C.goldDk})`} style={{width:"100%"}}>
              Guardar meta
            </BtnMain>
          </div>
        </div>
      )}

      {/* ════ TASK CREATOR (parent/teacher) ════ */}
      {showTaskCreator&&(
        <div className="overlay">
          <div className="modal pop-in">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <div style={{fontWeight:800,fontSize:17,color:C.text}}>Nueva misión personalizada</div>
              <button onClick={()=>setShowTaskCreator(false)} style={{background:C.border,border:"none",borderRadius:9,padding:"5px 10px",cursor:"pointer",color:C.textMed}}>✕</button>
            </div>
            <div style={{marginBottom:11}}>
              <div style={{fontSize:12,fontWeight:700,color:C.textMed,marginBottom:5}}>Título de la misión</div>
              <input value={newTaskTitle} onChange={e=>setNewTaskTitle(e.target.value)} placeholder="Ej: Cortar el pasto, Hacer el mercado..."
                style={{width:"100%",padding:"11px 14px",borderRadius:12,border:`1.5px solid ${C.border}`,fontSize:13,color:C.text,background:C.card,outline:"none"}}/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:11}}>
              <div>
                <div style={{fontSize:12,fontWeight:700,color:C.textMed,marginBottom:5}}>Frecuencia</div>
                <select value={newTaskFreq} onChange={e=>setNewTaskFreq(e.target.value)}
                  style={{width:"100%",padding:"10px 12px",borderRadius:12,border:`1.5px solid ${C.border}`,fontSize:13,color:C.text,background:C.card,outline:"none"}}>
                  <option value="diaria">Diaria</option>
                  <option value="semanal">Semanal</option>
                  <option value="mensual">Mensual</option>
                </select>
              </div>
              <div>
                <div style={{fontSize:12,fontWeight:700,color:C.textMed,marginBottom:5}}>XP a dar</div>
                <input type="number" value={newTaskXp} onChange={e=>setNewTaskXp(Number(e.target.value))} min="10" max="500"
                  style={{width:"100%",padding:"10px 12px",borderRadius:12,border:`1.5px solid ${C.border}`,fontSize:13,color:C.text,background:C.card,outline:"none"}}/>
              </div>
            </div>
            <div style={{marginBottom:11}}>
              <div style={{fontSize:12,fontWeight:700,color:C.textMed,marginBottom:5}}>Pista para el niño (¿qué debe fotografiar?)</div>
              <input value={newTaskHint} onChange={e=>setNewTaskHint(e.target.value)} placeholder="Ej: Foto del pasto cortado, foto del recibo..."
                style={{width:"100%",padding:"11px 14px",borderRadius:12,border:`1.5px solid ${C.border}`,fontSize:13,color:C.text,background:C.card,outline:"none"}}/>
            </div>
            <div style={{marginBottom:16}}>
              <div style={{fontSize:12,fontWeight:700,color:C.textMed,marginBottom:6}}>Ícono</div>
              <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
                {["⭐","🌱","🔧","🧺","🍳","🏡","📐","🌿","💡","🤝","🛒","🐾"].map(e=>(
                  <button key={e} onClick={()=>setNewTaskEmoji(e)} style={{fontSize:22,background:newTaskEmoji===e?C.mintLt:"none",border:`2px solid ${newTaskEmoji===e?C.mint:"transparent"}`,borderRadius:9,padding:5,cursor:"pointer"}}>{e}</button>
                ))}
              </div>
            </div>
            <BtnMain onClick={()=>{
              if(!newTaskTitle.trim())return;
              const newTask={id:Date.now(),emoji:newTaskEmoji,title:newTaskTitle,freq:newTaskFreq,
                xp:newTaskXp,coins:Math.round(newTaskXp/5),cat:"personalizada",verify:"easy",
                hint:newTaskHint||"Foto de evidencia",diffLabel:"Personalizada",status:"idle",isCustom:true};
              setCustomTasks(p=>[...p,newTask]);
              setShowTaskCreator(false);setNewTaskTitle("");setNewTaskHint("");
              notify(`Misión "${newTaskTitle}" creada`,"✅");
            }} bg={`linear-gradient(135deg,${C.mint},${C.mintDk})`} style={{width:"100%"}}>
              Crear misión
            </BtnMain>
          </div>
        </div>
      )}

      {/* ════ PARENTAL CONTROLS ════ */}
      {showControls&&(
        <div className="overlay">
          <div className="modal pop-in">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <div style={{fontWeight:800,fontSize:17,color:C.text}}>🔒 Control parental</div>
              <button onClick={()=>setShowControls(false)} style={{background:C.border,border:"none",borderRadius:9,padding:"5px 10px",cursor:"pointer",color:C.textMed}}>✕</button>
            </div>
            {[
              {label:"Máx. cofres por día",key:"maxChestsPerDay",type:"range",min:0,max:10,step:1},
              {label:"Chat se bloquea a las (hora)",key:"chatLockHour",type:"range",min:18,max:24,step:1},
            ].map(ctrl=>(
              <div key={ctrl.key} style={{marginBottom:16}}>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:13,fontWeight:700,color:C.text,marginBottom:6}}>
                  <span>{ctrl.label}</span>
                  <span style={{color:C.mint}}>{parentControls[ctrl.key]}{ctrl.key==="chatLockHour"?"h":""}</span>
                </div>
                <input type="range" min={ctrl.min} max={ctrl.max} step={ctrl.step}
                  value={parentControls[ctrl.key]}
                  onChange={e=>setParentControls(p=>({...p,[ctrl.key]:Number(e.target.value)}))}
                  style={{width:"100%",accentColor:C.mint}}/>
              </div>
            ))}
            {[
              {label:"Requerir mi aprobación para tareas",key:"requireApproval"},
              {label:"Permitir ruleta de premios",key:"allowWheel"},
            ].map(ctrl=>(
              <div key={ctrl.key} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,padding:"10px 14px",background:C.card,borderRadius:12,border:`1.5px solid ${C.border}`}}>
                <span style={{fontSize:13,fontWeight:600,color:C.text}}>{ctrl.label}</span>
                <button onClick={()=>setParentControls(p=>({...p,[ctrl.key]:!p[ctrl.key]}))}
                  style={{width:44,height:24,borderRadius:12,border:"none",cursor:"pointer",
                    background:parentControls[ctrl.key]?C.mint:C.border,
                    position:"relative",transition:"background 0.2s"}}>
                  <div style={{width:18,height:18,borderRadius:"50%",background:"white",position:"absolute",top:3,
                    left:parentControls[ctrl.key]?23:3,transition:"left 0.2s",boxShadow:"0 1px 4px rgba(0,0,0,0.2)"}}/>
                </button>
              </div>
            ))}
            <button onClick={()=>{clearAll();window.location.reload();}}
              style={{width:"100%",padding:11,borderRadius:12,border:`1.5px solid ${C.coral}`,background:C.coralLt,color:C.coral,fontWeight:700,fontSize:13,cursor:"pointer"}}>
              🗑️ Reiniciar todos los datos
            </button>
          </div>
        </div>
      )}


      {/* ════ DAILY LOGIN BONUS ════ */}
      {showLoginBonus&&(
        <div className="overlay" style={{zIndex:10000}}>
          <div className="modal login-pop" style={{textAlign:"center",background:`linear-gradient(160deg,${C.card} 60%,${C.mintLt})`,border:`2px solid ${C.mint}50`}}>
            {/* Confetti-like decoration */}
            <div style={{position:"absolute",inset:0,borderRadius:26,overflow:"hidden",pointerEvents:"none"}}>
              {["🌟","💫","✨","🎉","⭐","💎"].map((e,i)=>(
                <div key={i} style={{position:"absolute",fontSize:20,opacity:0.25,
                  top:`${10+i*14}%`,left:`${5+i*15}%`,transform:`rotate(${i*45}deg)`}}>{e}</div>
              ))}
            </div>
            <div style={{position:"relative"}}>
              <div style={{fontSize:72,marginBottom:6,lineHeight:1}} className="bounce">💎</div>
              <div style={{fontWeight:900,fontSize:26,color:C.text,marginBottom:4}}>¡Bienvenido!</div>
              <div style={{fontSize:14,color:C.textMed,marginBottom:20}}>Entraste hoy — aquí tu recompensa diaria</div>
              <div style={{background:`linear-gradient(135deg,${C.sky},${C.purple})`,borderRadius:20,padding:"18px 24px",marginBottom:20,color:"white",boxShadow:`0 8px 24px ${C.purple}50`}}>
                <div style={{fontWeight:900,fontSize:48,lineHeight:1}}>+{loginBonusAmt}</div>
                <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,marginTop:4}}>
                  <svg width="22" height="22" viewBox="0 0 18 18" fill="none">
                    <defs><linearGradient id="gem_login" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#7CE0FF"/><stop offset="1" stopColor="#3BA8E8"/></linearGradient></defs>
                    <polygon points="9,1 15,6.5 9,17 3,6.5" fill="url(#gem_login)"/>
                    <polygon points="9,1 15,6.5 9,9.5 3,6.5" fill="#B8F0FF" opacity="0.5"/>
                  </svg>
                  <span style={{fontWeight:800,fontSize:18}}>cristales de bienvenida</span>
                </div>
              </div>
              <div style={{fontSize:12,color:C.textMed,marginBottom:18,background:C.goldLt,borderRadius:12,padding:"8px 14px"}}>
                🔄 Vuelve mañana para ganar <b>{loginBonusAmt} más</b>
              </div>
              <BtnMain onClick={()=>{
                const newGems = user.gems + loginBonusAmt;
                setUser(p=>({...p,gems:newGems}));
                setShowLoginBonus(false);
                notify(`+${loginBonusAmt} 💎 ¡Bienvenido de vuelta!`,"💎");
                if(userId){ import("./supabase.js").then(({supabase})=>supabase.from("profiles").update({gems:newGems,last_seen:new Date().toISOString()}).eq("id",userId)).catch(()=>{}); }
              }} bg={`linear-gradient(135deg,${C.gold},${C.goldDk})`} style={{width:"100%",fontSize:16,padding:"14px"}}>
                🎁 ¡Reclamar mis cristales!
              </BtnMain>
            </div>
          </div>
        </div>
      )}

      {/* ════ CHALLENGE ASSIGNMENT ════ */}
      {showChallengeAssign&&(
        <div className="overlay" style={{zIndex:9988}}>
          <div className="modal pop-in" style={{maxHeight:"90vh",overflowY:"auto"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <div style={{fontWeight:900,fontSize:18,color:C.text}}>
                {assignStep==="pick"?"🎯 Asignar desafío":assignStep==="targets"?(role===ROLES.TEACHER?"👥 Seleccionar alumnos":"👦 Seleccionar hijo"):"✅ ¡Desafío asignado!"}
              </div>
              <button onClick={()=>{setShowChallengeAssign(false);setAssignStep("pick");setSelectedChallenge(null);setSelectedStudents([]);}} style={{background:C.border,border:"none",borderRadius:9,padding:"5px 10px",cursor:"pointer",color:C.textMed,fontSize:14}}>✕</button>
            </div>

            {/* Step 1: Pick challenge */}
            {assignStep==="pick"&&(
              <div>
                <div style={{fontSize:13,color:C.textMed,marginBottom:12}}>
                  {role===ROLES.TEACHER?"Elige un desafío para asignar a tu clase:":"Elige un desafío para tu hijo/a:"}
                </div>
                {CHALLENGE_TEMPLATES.map(ch=>(
                  <button key={ch.id} onClick={()=>{setSelectedChallenge(ch);setAssignStep("targets");}}
                    style={{width:"100%",marginBottom:9,padding:"12px 14px",borderRadius:15,border:`2px solid ${selectedChallenge?.id===ch.id?C.mint:C.border}`,background:selectedChallenge?.id===ch.id?C.mintLt:C.card,cursor:"pointer",textAlign:"left",transition:"all 0.15s"}}>
                    <div style={{display:"flex",gap:10,alignItems:"center"}}>
                      <span style={{fontSize:26,flexShrink:0}}>{ch.emoji}</span>
                      <div style={{flex:1}}>
                        <div style={{fontWeight:800,fontSize:13,color:C.text}}>{ch.title}</div>
                        <div style={{fontSize:11,color:C.textMed,marginTop:2}}>{ch.desc}</div>
                        <div style={{display:"flex",gap:6,marginTop:5}}>
                          <span style={{background:C.goldLt,color:C.goldDk,borderRadius:8,padding:"2px 7px",fontSize:10,fontWeight:700}}>⭐ {ch.xp} XP</span>
                          <span style={{background:C.mintLt,color:C.mintDk,borderRadius:8,padding:"2px 7px",fontSize:10,fontWeight:700}}>{ch.freq}</span>
                        </div>
                      </div>
                      <div style={{color:C.textLt,fontSize:18}}>›</div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Step 2: Pick targets */}
            {assignStep==="targets"&&selectedChallenge&&(
              <div>
                {/* Selected challenge summary */}
                <div style={{background:C.mintLt,border:`1.5px solid ${C.mint}40`,borderRadius:13,padding:"10px 13px",marginBottom:14,display:"flex",gap:10,alignItems:"center"}}>
                  <span style={{fontSize:24}}>{selectedChallenge.emoji}</span>
                  <div>
                    <div style={{fontWeight:800,fontSize:13,color:C.text}}>{selectedChallenge.title}</div>
                    <div style={{fontSize:11,color:C.textMed}}>⭐ {selectedChallenge.xp} XP · {selectedChallenge.freq}</div>
                  </div>
                  <button onClick={()=>setAssignStep("pick")} style={{marginLeft:"auto",background:"none",border:"none",color:C.sky,cursor:"pointer",fontSize:11,fontWeight:700}}>Cambiar</button>
                </div>

                {role===ROLES.TEACHER?(
                  <div>
                    <div style={{fontSize:13,color:C.textMed,marginBottom:10}}>
                      Selecciona alumnos (o <b>todos</b>):
                    </div>
                    <button onClick={()=>{
                      const allIds=DEMO_STUDENTS.map(s=>s.id);
                      setSelectedStudents(selectedStudents.length===allIds.length?[]:allIds);
                    }} style={{width:"100%",marginBottom:8,padding:"10px",borderRadius:12,border:`2px solid ${selectedStudents.length===DEMO_STUDENTS.length?C.mint:C.border}`,background:selectedStudents.length===DEMO_STUDENTS.length?C.mintLt:C.card,cursor:"pointer",fontWeight:800,fontSize:13,color:C.text}}>
                      {selectedStudents.length===DEMO_STUDENTS.length?"✓ Toda la clase seleccionada":"Seleccionar toda la clase"}
                    </button>
                    {DEMO_STUDENTS.map(s=>{
                      const sel=selectedStudents.includes(s.id);
                      return(
                        <button key={s.id} onClick={()=>setSelectedStudents(p=>sel?p.filter(x=>x!==s.id):[...p,s.id])}
                          style={{width:"100%",marginBottom:7,padding:"10px 13px",borderRadius:13,border:`2px solid ${sel?C.mint:C.border}`,background:sel?C.mintLt:C.card,cursor:"pointer",display:"flex",alignItems:"center",gap:10,transition:"all 0.15s"}}>
                          <div style={{width:34,height:34,borderRadius:"50%",background:sel?C.mint:C.border,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",flexShrink:0}}>
                            <KQIcon id={s.svgKey} size={30}/>
                          </div>
                          <div style={{flex:1,textAlign:"left"}}>
                            <div style={{fontWeight:800,fontSize:13,color:C.text}}>{s.name}</div>
                            <div style={{fontSize:10,color:C.textMed}}>Nv. {s.level}</div>
                          </div>
                          <div style={{width:20,height:20,borderRadius:"50%",border:`2px solid ${sel?C.mint:C.border}`,background:sel?C.mint:"none",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                            {sel&&<span style={{color:"white",fontSize:12,lineHeight:1}}>✓</span>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ):(
                  <div>
                    <div style={{fontSize:13,color:C.textMed,marginBottom:10}}>Asignar a:</div>
                    {linkedStudents.length===0?(
                      <div style={{textAlign:"center",padding:"20px 0",color:C.textMed,fontSize:13}}>
                        No tienes hijos vinculados aún.<br/>
                        <button onClick={()=>{setShowChallengeAssign(false);setShowLinkTutor(true);}} style={{marginTop:8,color:C.mint,fontWeight:700,border:"none",background:"none",cursor:"pointer",fontSize:13}}>
                          Vincular hijo/a →
                        </button>
                      </div>
                    ):linkedStudents.map(s=>{
                      const sel=selectedStudents.includes(s.id);
                      return(
                        <button key={s.id} onClick={()=>setSelectedStudents(p=>sel?p.filter(x=>x!==s.id):[...p,s.id])}
                          style={{width:"100%",marginBottom:8,padding:"11px 13px",borderRadius:13,border:`2px solid ${sel?C.mint:C.border}`,background:sel?C.mintLt:C.card,cursor:"pointer",display:"flex",alignItems:"center",gap:10,transition:"all 0.15s"}}>
                          <div style={{width:36,height:36,borderRadius:"50%",background:C.mintLt,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",flexShrink:0,border:`2px solid ${sel?C.mint:C.border}`}}>
                            <KQIcon id={s.avatar||"a_cub"} size={30}/>
                          </div>
                          <div style={{flex:1,textAlign:"left"}}>
                            <div style={{fontWeight:800,fontSize:13,color:C.text}}>{s.name}</div>
                            <div style={{fontSize:10,color:C.textMed}}>Nivel {s.level}</div>
                          </div>
                          <div style={{width:20,height:20,borderRadius:"50%",border:`2px solid ${sel?C.mint:C.border}`,background:sel?C.mint:"none",display:"flex",alignItems:"center",justifyContent:"center"}}>
                            {sel&&<span style={{color:"white",fontSize:12}}>✓</span>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                <BtnMain
                  onClick={()=>{
                    if(selectedStudents.length===0)return;
                    const targets=role===ROLES.TEACHER
                      ?DEMO_STUDENTS.filter(s=>selectedStudents.includes(s.id))
                      :linkedStudents.filter(s=>selectedStudents.includes(s.id));
                    const newAssignments=targets.map(s=>({
                      id:Date.now()+Math.random(),
                      challengeId:selectedChallenge.id,
                      challenge:selectedChallenge,
                      studentId:s.id,
                      studentName:s.name,
                      assignedBy:role===ROLES.TEACHER?"Prof. García":"Tutor",
                      assignedAt:Date.now(),
                      status:"pending",
                    }));
                    setAssignedChallenges(p=>[...p,...newAssignments]);
                    setActiveStudentChalls(p=>[...p,...newAssignments]);
                    // Persist to Supabase
                    if(userId){ import("./supabase.js").then(({supabase})=>{
                      const rows = targets.map(s=>({
                        template_id: selectedChallenge.id,
                        title: selectedChallenge.title,
                        description: selectedChallenge.desc,
                        emoji: selectedChallenge.emoji,
                        xp: selectedChallenge.xp,
                        coins: selectedChallenge.coins,
                        freq: selectedChallenge.freq,
                        assigned_by: userId,
                        assigned_to: s.id,
                      }));
                      return supabase.from("challenges").insert(rows);
                    }).catch(()=>{}); }
                    setAssignStep("done");
                  }}
                  bg={selectedStudents.length>0?`linear-gradient(135deg,${C.mint},${C.mintDk})`:C.border}
                  style={{width:"100%",marginTop:12,opacity:selectedStudents.length>0?1:0.5}}>
                  Asignar desafío{selectedStudents.length>1?` a ${selectedStudents.length} alumnos`:""}
                </BtnMain>
              </div>
            )}

            {/* Step 3: Done */}
            {assignStep==="done"&&(
              <div style={{textAlign:"center",paddingTop:8}}>
                <div style={{fontSize:68,marginBottom:10}} className="bounce">{selectedChallenge?.emoji}</div>
                <div style={{fontWeight:900,fontSize:22,color:C.text,marginBottom:6}}>¡Desafío asignado!</div>
                <div style={{fontSize:13,color:C.textMed,marginBottom:16}}>
                  <b>{selectedChallenge?.title}</b><br/>
                  asignado a <b>{selectedStudents.length} {selectedStudents.length===1?"alumno":"alumnos"}</b>
                </div>
                <div style={{background:C.goldLt,borderRadius:13,padding:"10px 14px",marginBottom:18,fontSize:12,color:C.goldDk,fontWeight:600}}>
                  📲 Los alumnos verán el desafío en su pantalla de Tareas
                </div>
                <BtnMain onClick={()=>{setShowChallengeAssign(false);setAssignStep("pick");setSelectedChallenge(null);setSelectedStudents([]);notify(`Desafío asignado a ${selectedStudents.length} alumno(s)`,"🎯");}}
                  bg={`linear-gradient(135deg,${C.mint},${C.mintDk})`} style={{width:"100%"}}>
                  ¡Listo!
                </BtnMain>
              </div>
            )}
          </div>
        </div>
      )}


      {/* ════ REPORT MODAL ════ */}
      {showReport&&(
        <div className="overlay">
          <div className="modal pop-in">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <div style={{fontWeight:900,fontSize:18,color:C.text}}>🚨 Reportar conducta</div>
              <button onClick={()=>setShowReport(false)} style={{background:C.border,border:"none",borderRadius:9,padding:"5px 10px",cursor:"pointer",color:C.textMed}}>✕</button>
            </div>
            <div style={{background:C.coralLt,border:`1.5px solid ${C.coral}30`,borderRadius:12,padding:"10px 14px",marginBottom:14,fontSize:12,color:C.coral}}>
              🔒 Tu reporte es anónimo. El equipo de KidQuest lo revisará en menos de 24 horas.
            </div>
            <div style={{marginBottom:11}}>
              <div style={{fontSize:12,fontWeight:700,color:C.textMed,marginBottom:6}}>Nombre de usuario reportado</div>
              <input value={reportUser} onChange={e=>setReportUser(e.target.value)} placeholder="@usuario o nombre del usuario"
                style={{width:"100%",padding:"11px 14px",borderRadius:12,border:`1.5px solid ${C.border}`,fontSize:13,color:C.text,background:C.card,outline:"none"}}/>
            </div>
            <div style={{marginBottom:11}}>
              <div style={{fontSize:12,fontWeight:700,color:C.textMed,marginBottom:6}}>Tipo de conducta</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7}}>
                {[
                  {id:"bullying",      l:"Acoso / Bullying",    icon:"😡"},
                  {id:"inappropriate_content", l:"Contenido inapropiado", icon:"🚫"},
                  {id:"spam",          l:"Spam",                icon:"📢"},
                  {id:"hate_speech",   l:"Lenguaje ofensivo",   icon:"💢"},
                  {id:"fake_account",  l:"Cuenta falsa",        icon:"🎭"},
                  {id:"grooming",      l:"Comportamiento peligroso", icon:"⚠️"},
                ].map(t=>(
                  <button key={t.id} onClick={()=>setReportType(t.id)}
                    style={{padding:"9px 8px",borderRadius:11,border:`2px solid ${reportType===t.id?C.coral:C.border}`,
                      background:reportType===t.id?C.coralLt:C.card,cursor:"pointer",fontSize:11,fontWeight:700,
                      color:reportType===t.id?C.coral:C.textMed,textAlign:"center"}}>
                    <div style={{fontSize:18,marginBottom:3}}>{t.icon}</div>{t.l}
                  </button>
                ))}
              </div>
            </div>
            <div style={{marginBottom:16}}>
              <div style={{fontSize:12,fontWeight:700,color:C.textMed,marginBottom:6}}>Descripción (opcional)</div>
              <textarea value={reportDesc} onChange={e=>setReportDesc(e.target.value)}
                placeholder="Describe lo que pasó con el mayor detalle posible..."
                style={{width:"100%",padding:"11px 14px",borderRadius:12,border:`1.5px solid ${C.border}`,
                  fontSize:13,color:C.text,background:C.card,outline:"none",minHeight:80,resize:"vertical",fontFamily:"'Nunito',sans-serif"}}/>
            </div>
            <BtnMain onClick={async()=>{
              if(!reportUser.trim()) return notify("Indica el nombre del usuario","⚠️");
              setReportSending(true);
              try {
                const {supabase} = await import("./supabase.js");
                await supabase.from("reports").insert({
                  reporter_id: userId,
                  report_type: reportType,
                  description: `Usuario: ${reportUser}. ${reportDesc}`,
                });
                setShowReport(false); setReportDesc(""); setReportUser("");
                notify("Reporte enviado. Lo revisaremos pronto.","🔒");
              } catch(e){ notify("Error al enviar reporte","⚠️"); }
              setReportSending(false);
            }} bg={`linear-gradient(135deg,${C.coral},#C40000)`} style={{width:"100%"}}>
              {reportSending?"Enviando…":"🚨 Enviar reporte"}
            </BtnMain>
          </div>
        </div>
      )}


      {/* ════ PROFILE EDITOR MODAL ════ */}
      {showProfileEdit&&(
        <div className="overlay">
          <div className="modal pop-in">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
              <div style={{fontWeight:900,fontSize:18,color:C.text}}>✏️ Editar perfil</div>
              <button onClick={()=>setShowProfileEdit(false)} style={{background:C.border,border:"none",borderRadius:9,padding:"5px 10px",cursor:"pointer",color:C.textMed}}>✕</button>
            </div>
            <div style={{marginBottom:12}}>
              <div style={{fontSize:12,fontWeight:700,color:C.textMed,marginBottom:6}}>Nombre para mostrar</div>
              <input value={editDisplayName} onChange={e=>setEditDisplayName(e.target.value)}
                placeholder="Tu nombre real o apodo"
                style={{width:"100%",padding:"12px 14px",borderRadius:13,border:`1.5px solid ${C.border}`,fontSize:15,fontWeight:600,color:C.text,background:C.card,outline:"none"}}/>
              <div style={{fontSize:11,color:C.textMed,marginTop:4}}>Este nombre aparece en el chat y el ranking</div>
            </div>
            <div style={{marginBottom:20}}>
              <div style={{fontSize:12,fontWeight:700,color:C.textMed,marginBottom:6}}>Nombre de usuario</div>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <span style={{fontSize:16,color:C.textMed}}>@</span>
                <input value={editUsername} onChange={e=>setEditUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g,""))}
                  placeholder="tu_usuario"
                  style={{flex:1,padding:"12px 14px",borderRadius:13,border:`1.5px solid ${C.border}`,fontSize:15,fontWeight:600,color:C.text,background:C.card,outline:"none",letterSpacing:1}}/>
              </div>
              <div style={{fontSize:11,color:C.textMed,marginTop:4}}>Solo letras, números y guión bajo. Sin espacios.</div>
            </div>
            <BtnMain onClick={async()=>{
              if(!editDisplayName.trim()) return notify("Escribe tu nombre","⚠️");
              setSavingProfile(true);
              try {
                const updates = {name:editDisplayName.trim()};
                if(editUsername.trim().length>=3) updates.username = editUsername.trim();
                setUser(p=>({...p,name:editDisplayName.trim(),username:editUsername.trim()||p.username}));
                if(userId){
                  const {supabase} = await import("./supabase.js");
                  const {error} = await supabase.from("profiles").update(updates).eq("id",userId);
                  if(error) return notify("Error: "+error.message,"⚠️");
                }
                setShowProfileEdit(false);
                notify("✅ Perfil actualizado","👤");
              } catch(e){ notify("Error: "+e.message,"⚠️"); }
              setSavingProfile(false);
            }} disabled={savingProfile} bg={`linear-gradient(135deg,${C.mint},${C.mintDk})`} style={{width:"100%"}}>
              {savingProfile?"Guardando…":"💾 Guardar cambios"}
            </BtnMain>
          </div>
        </div>
      )}

      {/* ════ HEADER ════ */}
      <div style={{background:C.card,borderBottom:`2px solid ${C.border}`,padding:"12px 16px 10px",position:"sticky",top:0,zIndex:100,boxShadow:`0 2px 10px ${C.mint}10`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <button onClick={()=>{setScreen("roleSelect");setRole(null);}} style={{background:"none",border:"none",color:C.textLt,cursor:"pointer",fontSize:18,lineHeight:1}}>←</button>
            {role===ROLES.STUDENT&&(
              <>
                <div className="float" style={{flexShrink:0}}><AvatarDisplay photo={avatarPhoto} emoji={avatarEmoji} frame={avatarFrame} bg={avatarBg} size={38} C={C} white/></div>
                <div>
                  <div style={{fontWeight:800,fontSize:15,color:C.text,lineHeight:1.2}}>{user.name}</div>
                  <div style={{display:"flex",gap:5,alignItems:"center",marginTop:2,flexWrap:"wrap"}}>
                    <Chip label={`Nv.${user.level} ${curLvl.name}`} bg={C.mintLt} color={C.mintDk}/>
                    <span style={{fontSize:11,color:C.coral,fontWeight:700}}>🔥{user.streak}</span>
                    {user.streakShields>0&&<span style={{fontSize:11,color:C.purple,fontWeight:700}}>🛡️{user.streakShields}</span>}
                  </div>
                </div>
              </>
            )}
            {role===ROLES.PARENT&&<div style={{fontWeight:800,fontSize:16,color:C.text}}>Panel del Tutor</div>}
            {role===ROLES.TEACHER&&<div style={{fontWeight:800,fontSize:16,color:C.text}}>Prof. García — 5to B</div>}
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            {role===ROLES.STUDENT&&(
              <>
                <CoinPill icon="💰" val={user.coins} color={C.goldDk} bg={C.goldLt}/>
                <CoinPill icon="💎" val={user.gems}  color={C.sky}    bg={C.skyLt}/>
              </>
            )}
            <button onClick={()=>setDark(d=>!d)} style={{background:C.border,border:"none",borderRadius:10,padding:"5px 8px",cursor:"pointer",fontSize:14}}>{dark?"☀️":"🌙"}</button>
          </div>
        </div>
        {role===ROLES.STUDENT&&(
          <div style={{marginTop:8}}>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:C.textLt,marginBottom:3}}>
              <span>{fmtN(user.xp)} XP</span><span>{nextLvl?`→ ${nextLvl.name}`:"¡Nivel máximo!"}</span>
            </div>
            <div style={{height:5,borderRadius:5,background:C.border,overflow:"hidden"}}>
              <div style={{height:"100%",borderRadius:5,width:`${xpPct}%`,background:`linear-gradient(90deg,${C.mint},${C.gold})`,transition:"width 0.6s"}}/>
            </div>
          </div>
        )}
      </div>

      {/* ════ CONTENT ════ */}
      <div style={{overflowY:"auto",maxHeight:"calc(100vh - 130px)",paddingBottom:85,background:C.bg}}>

        {/* ── STUDENT: HOME ── */}
        {role===ROLES.STUDENT&&tab==="home"&&(
          <div style={{padding:"16px 14px 0"}}>
            {/* season banner */}
            <div style={{background:`linear-gradient(135deg,${C.mint},${C.purple})`,borderRadius:20,padding:"14px 16px",marginBottom:14,color:"white",position:"relative",overflow:"hidden",boxShadow:`0 6px 22px ${C.mint}45`}}>
              <div style={{position:"absolute",right:-8,top:-8,fontSize:70,opacity:0.15}}>🌱</div>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                <span style={{fontSize:22}}>🌱</span>
                <div>
                  <div style={{fontWeight:800,fontSize:14}}>Temporada del Ahorro · Termina {SEASONS[0].endDate}</div>
                  <div style={{fontSize:11,opacity:0.8}}>Premio: {SEASONS[0].prize}</div>
                </div>
              </div>
              <div style={{height:7,borderRadius:7,background:"rgba(255,255,255,0.25)",overflow:"hidden"}}>
                <div style={{height:"100%",borderRadius:7,width:`${SEASONS[0].progress}%`,background:"white"}}/>
              </div>
              <div style={{fontSize:10,opacity:0.7,marginTop:4,textAlign:"right"}}>{SEASONS[0].progress}% completado</div>
            </div>

            {/* active challenges from tutor/teacher */}
            {activeStudentChalls.filter(c=>c.status==="pending").slice(0,2).map(ch=>(
              <div key={ch.id} style={{background:`linear-gradient(135deg,${C.gold}15,${C.coral}08)`,border:`2px solid ${C.gold}50`,borderRadius:18,padding:"12px 15px",marginBottom:12,display:"flex",gap:12,alignItems:"center",position:"relative",overflow:"hidden"}}>
                <div style={{position:"absolute",right:-4,top:-4,fontSize:48,opacity:0.07}}>🎯</div>
                <span style={{fontSize:30,flexShrink:0}}>{ch.challenge.emoji}</span>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:10,fontWeight:700,color:C.gold,textTransform:"uppercase",letterSpacing:0.8,marginBottom:2}}>⚡ Desafío de {ch.assignedBy}</div>
                  <div style={{fontWeight:800,fontSize:13,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ch.challenge.title}</div>
                  <div style={{display:"flex",gap:5,marginTop:4}}>
                    <span style={{background:C.goldLt,color:C.goldDk,borderRadius:8,padding:"2px 7px",fontSize:10,fontWeight:700}}>+{ch.challenge.xp} XP</span>
                    <span style={{background:C.mintLt,color:C.mintDk,borderRadius:8,padding:"2px 7px",fontSize:10,fontWeight:700}}>{ch.challenge.freq}</span>
                  </div>
                </div>
                <button onClick={()=>{
                  setActiveStudentChalls(p=>p.map(c=>c.id===ch.id?{...c,status:"completed"}:c));
                  setUser(p=>({...p,xp:p.xp+ch.challenge.xp,coins:p.coins+ch.challenge.coins}));
                  notify(`¡Desafío completado! +${ch.challenge.xp} XP`,"🎯");
                  if(userId){ import("./supabase.js").then(({supabase})=>supabase.from("challenges").update({status:"completed",completed_at:new Date().toISOString()}).eq("id",ch.id)).catch(()=>{}); }
                }} style={{background:`linear-gradient(135deg,${C.gold},${C.goldDk})`,border:"none",borderRadius:11,padding:"8px 11px",color:"white",fontSize:10,fontWeight:800,cursor:"pointer",flexShrink:0}}>
                  ¡Hecho!
                </button>
              </div>
            ))}

            {/* link tutor nudge */}
            {linkedTutors.length===0&&(
              <button onClick={()=>setShowLinkTutor(true)} style={{width:"100%",background:`linear-gradient(135deg,${C.gold},${C.goldDk})`,border:"none",borderRadius:16,padding:"12px 16px",marginBottom:12,color:"white",display:"flex",gap:10,alignItems:"center",cursor:"pointer"}}>
                <span style={{fontSize:24}}>🔗</span>
                <div style={{textAlign:"left",flex:1}}>
                  <div style={{fontWeight:800,fontSize:14}}>Vincular tutor → gana {BOND_REWARD_GEMS} 💎</div>
                  <div style={{fontSize:11,opacity:0.85}}>Conecta a tu papá o mamá para validar tareas</div>
                </div>
                <span style={{fontSize:18}}>›</span>
              </button>
            )}
            {linkedTutors.length>0&&(
              <button onClick={()=>setShowLinkTutor(true)} style={{width:"100%",background:C.card,border:`1.5px solid ${C.mint}`,borderRadius:14,padding:"9px 14px",marginBottom:12,display:"flex",gap:8,alignItems:"center",cursor:"pointer",boxShadow:C.shadow}}>
                <span style={{fontSize:18}}>🔗</span>
                <span style={{fontSize:12,color:C.mintDk,fontWeight:700}}>Tutores: {linkedTutors.join(", ")}</span>
                <span style={{marginLeft:"auto",fontSize:11,color:C.textLt}}>+ Agregar</span>
              </button>
            )}

            {/* greet + ring */}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <div>
                <div style={{fontWeight:900,fontSize:22,color:C.text}}>¡Hola, {user.name.split(" ")[0]}! 👋</div>
                <div style={{fontSize:12,color:C.textMed}}>{new Date().toLocaleDateString("es",{weekday:"long",day:"numeric",month:"long"})}</div>
              </div>
              <MiniRing pct={(dailyDone/Math.max(dailyTotal,1))*100} color={C.mint} size={56}/>
            </div>

            {/* savings goal card */}
            <div style={{background:C.card,borderRadius:18,padding:16,marginBottom:14,boxShadow:C.shadow}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <div style={{display:"flex",gap:10,alignItems:"center"}}>
                  <div style={{fontSize:28}}>{user.savingsGoal.emoji}</div>
                  <div>
                    <div style={{fontWeight:800,fontSize:14,color:C.text}}>{user.savingsGoal.name}</div>
                    <div style={{fontSize:11,color:C.textMed}}>Meta de ahorro</div>
                  </div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontWeight:900,fontSize:16,color:C.mintDk}}>${fmtN(user.savingsGoal.saved)}</div>
                  <div style={{fontSize:10,color:C.textMed}}>de ${fmtN(user.savingsGoal.target)}</div>
                </div>
              </div>
              <div style={{height:8,borderRadius:8,background:C.border,overflow:"hidden",marginBottom:6}}>
                <div style={{height:"100%",borderRadius:8,width:`${savingsPct}%`,background:`linear-gradient(90deg,${C.mint},${C.gold})`,transition:"width 0.6s"}}/>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:11}}>
                <span style={{color:C.textMed}}>Llevas el {savingsPct}%</span>
                <button onClick={()=>{setGoalName(user.savingsGoal.name);setGoalTarget(String(user.savingsGoal.target));setGoalEmoji(user.savingsGoal.emoji);setShowGoalEditor(true);}} style={{background:"none",border:"none",color:C.mint,fontWeight:700,fontSize:11,cursor:"pointer",textDecoration:"underline"}}>Faltan ${fmtN(user.savingsGoal.target-user.savingsGoal.saved)} · editar</button>
              </div>
            </div>

            {/* weekly bar chart */}
            <div style={{background:C.card,borderRadius:18,padding:16,marginBottom:14,boxShadow:C.shadow}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                <div style={{fontWeight:800,fontSize:14,color:C.text}}>Puntos esta semana</div>
                <Chip label="7 días" bg={C.mintLt} color={C.mintDk}/>
              </div>
              <div style={{display:"flex",alignItems:"flex-end",gap:6,height:75}}>
                {WEEK_DATA.map((d,i)=>{
                  const pct=d.pts/Math.max(MAX_BAR,1), isToday=i===1;
                  return (
                    <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                      {d.pts>0&&<div style={{fontSize:9,fontWeight:800,color:isToday?C.mint:C.textLt}}>{d.pts}</div>}
                      <div style={{width:"100%",height:Math.max(pct*62,4),background:isToday?`linear-gradient(to top,${C.mintDk},${C.mint})`:`${C.gold}70`,borderRadius:"5px 5px 0 0",transition:"height 0.5s"}}/>
                      <div style={{fontSize:9,color:isToday?C.mint:C.textMed,fontWeight:isToday?800:600}}>{d.day}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* economy lesson nudge */}
            {lessons.find(l=>!l.done)&&(
              <div style={{background:`linear-gradient(135deg,${C.goldLt},${C.skyLt})`,border:`1.5px solid ${C.gold}60`,borderRadius:18,padding:14,marginBottom:14,cursor:"pointer"}} onClick={()=>setActiveLesson(lessons.find(l=>!l.done))}>
                <div style={{display:"flex",gap:12,alignItems:"center"}}>
                  <div style={{fontSize:30}}>{lessons.find(l=>!l.done)?.emoji}</div>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:800,fontSize:13,color:C.text}}>Lección nueva disponible 🧠</div>
                    <div style={{fontSize:12,color:C.textMed}}>{lessons.find(l=>!l.done)?.title} · {lessons.find(l=>!l.done)?.duration}</div>
                  </div>
                  <div style={{background:C.gold,color:"white",borderRadius:10,padding:"4px 10px",fontSize:12,fontWeight:800}}>+{lessons.find(l=>!l.done)?.xp} XP</div>
                </div>
              </div>
            )}

            {/* quick actions */}
            <div style={{display:"flex",gap:8,marginBottom:14}}>
              {[
                {icon:"📝",label:"Gasto",action:()=>setShowSpend(true)},
                {icon:"🎯",label:"Meta",  action:()=>{setGoalName(user.savingsGoal.name);setGoalTarget(String(user.savingsGoal.target));setGoalEmoji(user.savingsGoal.emoji||"🎯");setShowGoalEditor(true);}},
                {icon:AGE_PROFILES[ageGroup]?.icon||"🌱",label:AGE_PROFILES[ageGroup]?.label.split(" ")[0]||"Edad",action:()=>setShowAgePick(true)},
              ].map((q,i)=>(
                <button key={i} onClick={q.action} style={{flex:1,background:C.card,border:`1.5px solid ${C.border}`,borderRadius:13,padding:"10px 6px",display:"flex",flexDirection:"column",alignItems:"center",gap:4,cursor:"pointer",boxShadow:C.shadow}}>
                  <span style={{fontSize:20}}>{q.icon}</span>
                  <span style={{fontSize:9,fontWeight:700,color:C.textMed}}>{q.label}</span>
                </button>
              ))}
            </div>

            {/* daily tasks */}
            <div style={{fontWeight:800,fontSize:16,color:C.text,marginBottom:10}}>Tareas de hoy</div>
            {tasks.filter(t=>t.freq==="diaria").map(t=><TCard key={t.id} task={t} C={C} onVerify={()=>openVerify(t)}/>)}
          </div>
        )}

        {/* ── STUDENT: TASKS ── */}
        {role===ROLES.STUDENT&&tab==="tasks"&&(
          <div style={{padding:"16px 14px 0"}}>
            <div style={{fontWeight:800,fontSize:20,color:C.text,marginBottom:14}}>Mis Misiones</div>
            <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:8,marginBottom:8}}>
              {["todas","diaria","semanal","mensual","semestral","anual"].map(f=>(
                <button key={f} onClick={()=>setFilterFreq(f)} style={{padding:"6px 14px",borderRadius:20,border:`1.5px solid ${filterFreq===f?C.mint:C.border}`,background:filterFreq===f?C.mint:C.card,color:filterFreq===f?"white":C.textMed,fontWeight:700,fontSize:12,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0,transition:"all 0.15s"}}>
                  {f.charAt(0).toUpperCase()+f.slice(1)}
                </button>
              ))}
            </div>
            {/* Verification system explainer */}
            <div style={{background:C.purpleLt,border:`1.5px solid ${C.purple}30`,borderRadius:14,padding:"10px 14px",marginBottom:14}}>
              <div style={{fontWeight:700,fontSize:12,color:C.purple,marginBottom:4}}>🛡️ Verificación flexible — ¡sin bloqueos!</div>
              <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                {[{i:"📸",t:"Foto (IA)"},{i:"🔑",t:"QR tutor"},{i:"📍",t:"GPS"},{i:"📝",t:"Texto"},{i:"⚖️",t:"Apelación"}].map((x,i)=>(
                  <div key={i} style={{display:"flex",gap:4,alignItems:"center",fontSize:11,color:C.purple}}><span>{x.i}</span><span>{x.t}</span></div>
                ))}
              </div>
            </div>
            {filtered.map(t=>(
              <div key={t.id} style={{position:"relative"}}>
                <TCard task={t} C={C} full onVerify={()=>openVerify(t)}/>
                {t.isCustom&&<button onClick={()=>setCustomTasks(p=>p.filter(x=>x.id!==t.id))} title="Eliminar misión"
                  style={{position:"absolute",top:10,right:10,background:C.coralLt,border:`1px solid ${C.coral}30`,borderRadius:8,padding:"3px 7px",fontSize:10,color:C.coral,cursor:"pointer",fontWeight:700}}>✕</button>}
              </div>
            ))}
          </div>
        )}

        {/* ── STUDENT: SHOP ── */}
        {role===ROLES.STUDENT&&tab==="shop"&&(
          <div style={{padding:"16px 14px 0"}}>

            {/* ── CHEST OPENING MODAL ── */}
            {openingChest&&(
              <div className="overlay" style={{zIndex:9995}}>
                <div className="modal pop-in" style={{textAlign:"center",overflow:"hidden"}}>
                  {chestPhase==="idle"&&(
                    <>
                      <div style={{fontSize:14,color:C.textMed,marginBottom:8}}>Abriendo...</div>
                      <div style={{marginBottom:16,display:"flex",justifyContent:"center"}} className="float"><ChestSVG id={openingChest.id} size={84}/></div>
                      <div style={{fontWeight:900,fontSize:22,color:C.text,marginBottom:6}}>{openingChest.name}</div>
                      <div style={{fontSize:13,color:C.textMed,marginBottom:20}}>{openingChest.desc}</div>
                      <BtnMain onClick={()=>{
                        setChestPhase("shaking");
                        setTimeout(()=>{
                          const item = rollChest(openingChest.id);
                          setChestWin(item);
                          setInventory(p=>[...p, item]);
                          setChestPhase("reveal");
                          boom();
                        }, 1200);
                      }} bg={openingChest.gradient} style={{width:"100%"}}>
                        🎲 ¡Abrir cofre!
                      </BtnMain>
                    </>
                  )}
                  {chestPhase==="shaking"&&(
                    <div style={{padding:"40px 0"}}>
                      <div className="chest-shake" style={{display:"flex",justifyContent:"center"}}><ChestSVG id={openingChest.id} size={84}/></div>
                      <div style={{fontWeight:800,fontSize:16,color:C.text,marginTop:16}}>Abriendo...</div>
                      <div style={{display:"flex",justifyContent:"center",gap:6,marginTop:12}}>
                        {[0,1,2].map(i=><div key={i} style={{width:8,height:8,borderRadius:"50%",background:openingChest.color,animation:`dotPulse 0.6s ${i*0.2}s ease-in-out infinite`}}/>)}
                      </div>
                    </div>
                  )}
                  {chestPhase==="reveal"&&chestWin&&(()=>{
                    const r = RARITIES[chestWin.rarity];
                    return (
                      <div>
                        <div style={{fontSize:13,fontWeight:700,color:r.color,marginBottom:8,textTransform:"uppercase",letterSpacing:1}}>
                          {r.star} {r.label} {r.star}
                        </div>
                        {/* Glow container */}
                        <div style={{position:"relative",margin:"0 auto 16px",width:120,height:120,display:"flex",alignItems:"center",justifyContent:"center"}}>
                          <div style={{position:"absolute",inset:-10,borderRadius:"50%",background:r.glow,filter:"blur(20px)",opacity:0.6,animation:"glowPulse 1.5s ease-in-out infinite"}}/>
                          <div style={{position:"relative",width:100,height:100,borderRadius:"50%",background:r.bg,border:`3px solid ${r.color}`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 20px ${r.glow}`,zIndex:1,overflow:"hidden"}}>
                            {chestWin.type==="frame"
                              ? <FramePreview id={chestWin.id} size={80} emoji="🦁"/>
                              : chestWin.svgKey
                              ? <KQIcon id={chestWin.svgKey} size={72} animated={chestWin.rarity==="legendary"}/>
                              : <span style={{fontSize:52}}>{chestWin.preview||"?"}</span>
                            }
                          </div>
                        </div>
                        <div style={{fontWeight:900,fontSize:22,color:C.text,marginBottom:4}}>{chestWin.name}</div>
                        <div style={{fontSize:12,color:C.textMed,marginBottom:4}}>{chestWin.desc}</div>
                        <div style={{marginBottom:6}}>
                          <Chip label={{frame:"Marco",sticker:"Sticker",avatar:"Avatar"}[chestWin.type]||""} bg={r.bg} color={r.color}/>
                        </div>
                        {/* Rarity bar */}
                        <div style={{background:C.border,borderRadius:20,padding:"6px 14px",marginBottom:16,fontSize:11,color:r.color,fontWeight:700}}>
                          Probabilidad de salida: {RARITIES[chestWin.rarity].pct}%
                        </div>
                        <BtnMain onClick={()=>{
                          setOpeningChest(null);setChestPhase("idle");setChestWin(null);
                          notify(`¡${chestWin.name} añadido a tu colección!`,chestWin.preview);
                        }} bg={`linear-gradient(135deg,${C.mint},${C.mintDk})`} style={{width:"100%"}}>
                          ¡Genial! Añadir a colección
                        </BtnMain>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* ── LOOT TABLE MODAL ── */}
            {showLootTable&&(
              <div className="overlay" style={{zIndex:9994}}>
                <div className="modal pop-in" style={{maxHeight:"90vh",overflowY:"auto"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                    <div style={{fontWeight:800,fontSize:17,color:C.text}}>📋 Tabla de premios</div>
                    <button onClick={()=>setShowLootTable(false)} style={{background:C.border,border:"none",borderRadius:10,padding:"5px 9px",color:C.textMed,cursor:"pointer",fontSize:15}}>✕</button>
                  </div>
                  {/* chest selector */}
                  <div style={{display:"flex",gap:6,marginBottom:16,overflowX:"auto",paddingBottom:4}}>
                    {CHESTS.map(ch=>(
                      <button key={ch.id} onClick={()=>setLootTableChest(ch.id)} style={{padding:"6px 12px",borderRadius:20,border:`1.5px solid ${lootTableChest===ch.id?ch.color:C.border}`,background:lootTableChest===ch.id?ch.color:"transparent",color:lootTableChest===ch.id?"white":C.textMed,fontWeight:700,fontSize:11,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0,transition:"all 0.15s"}}>
                        <span style={{display:'inline-flex',alignItems:'center',gap:4}}><ChestSVG id={ch.id} size={18}/>{ch.name.replace('Cofre ','')}</span>
                      </button>
                    ))}
                  </div>
                  {/* rates overview */}
                  {(()=>{
                    const ch = CHESTS.find(c=>c.id===lootTableChest);
                    return (
                      <div>
                        <div style={{background:ch.gradient,borderRadius:14,padding:"12px 16px",marginBottom:14,color:"white"}}>
                          <div style={{fontWeight:800,fontSize:15,marginBottom:6,display:"flex",gap:8,alignItems:"center"}}><ChestSVG id={ch.id} size={26}/>{ch.name}</div>
                          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                            {Object.entries(ch.rates).filter(([,v])=>v>0).map(([k,v])=>{
                              const r=RARITIES[k];
                              return <div key={k} style={{background:"rgba(255,255,255,0.2)",borderRadius:10,padding:"3px 9px",fontSize:11,fontWeight:700}}>{r.label} {v}%</div>;
                            })}
                          </div>
                        </div>
                        {/* items by rarity */}
                        {Object.keys(RARITIES).map(rarityId=>{
                          const ch2 = CHESTS.find(c=>c.id===lootTableChest);
                          if(!ch2.rates[rarityId]) return null;
                          const r = RARITIES[rarityId];
                          const items = LOOT_ITEMS.filter(i=>i.rarity===rarityId);
                          return (
                            <div key={rarityId} style={{marginBottom:14}}>
                              {/* rarity header */}
                              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8,padding:"8px 12px",borderRadius:12,background:r.bg,border:`1.5px solid ${r.color}30`}}>
                                <span style={{fontSize:18}}>{r.star}</span>
                                <div style={{flex:1}}>
                                  <span style={{fontWeight:800,fontSize:13,color:r.color}}>{r.label}</span>
                                  <span style={{fontSize:11,color:C.textMed,marginLeft:6}}>{ch2.rates[rarityId]}% de probabilidad</span>
                                </div>
                                <div style={{fontWeight:900,fontSize:16,color:r.color}}>{items.length} items</div>
                              </div>
                              {/* item grid */}
                              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7}}>
                                {items.map(item=>(
                                  <div key={item.id} style={{background:C.card,borderRadius:12,padding:"10px 10px",border:`1.5px solid ${r.color}30`,display:"flex",gap:8,alignItems:"center",boxShadow:rarityId==="legendary"||rarityId==="epic"?`0 2px 12px ${r.glow}40`:C.shadow}}>
                                    <div style={{width:36,height:36,borderRadius:10,background:r.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0,boxShadow:rarityId==="legendary"?`0 0 8px ${r.glow}`:"none",overflow:"visible"}}>
                                      {item.type==="frame"
                                        ? <FramePreview id={item.id} size={30} emoji="🦁"/>
                                        : item.svgKey
                                        ? <KQIcon id={item.svgKey} size={26}/>
                                        : (item.preview||"?")}
                                    </div>
                                    <div style={{minWidth:0}}>
                                      <div style={{fontWeight:700,fontSize:11,color:C.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{item.name}</div>
                                      <div style={{fontSize:9,color:r.color,fontWeight:700,textTransform:"uppercase"}}>{({frame:"Marco",sticker:"Sticker",emoji:"Emoji"})[item.type]}</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* ── INVENTORY MODAL ── */}
            {showInventory&&(
              <div className="overlay" style={{zIndex:9993}}>
                <div className="modal pop-in" style={{maxHeight:"90vh",overflowY:"auto"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                    <div style={{fontWeight:800,fontSize:17,color:C.text}}>🎒 Mi colección</div>
                    <button onClick={()=>setShowInventory(false)} style={{background:C.border,border:"none",borderRadius:10,padding:"5px 9px",color:C.textMed,cursor:"pointer",fontSize:15}}>✕</button>
                  </div>
                  {inventory.length===0?(
                    <div style={{textAlign:"center",padding:"32px 0"}}>
                      <div style={{fontSize:48,marginBottom:10}}>📦</div>
                      <div style={{fontWeight:700,fontSize:15,color:C.text}}>Aún no tienes items</div>
                      <div style={{fontSize:12,color:C.textMed,marginTop:4}}>¡Abre cofres para coleccionar!</div>
                    </div>
                  ):(
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                      {inventory.map((item,i)=>{
                        const r=RARITIES[item.rarity];
                        return (
                          <div key={i} style={{background:r.bg,borderRadius:14,padding:"10px 8px",textAlign:"center",border:`1.5px solid ${r.color}40`,position:"relative",boxShadow:item.rarity==="legendary"?`0 0 12px ${r.glow}`:item.rarity==="epic"?`0 0 8px ${r.glow}40`:"none"}}>
                            <div style={{marginBottom:4,display:"flex",justifyContent:"center",alignItems:"center",height:36}}>
                              {item.type==="frame"
                                ? <FramePreview id={item.id} size={34} emoji="🦁"/>
                                : <span style={{fontSize:26}}>{item.preview}</span>}
                            </div>
                            <div style={{fontSize:9,fontWeight:800,color:r.color,textTransform:"uppercase",lineHeight:1.3}}>{item.name}</div>
                            <div style={{position:"absolute",top:4,right:4,fontSize:8}}><RarDot r={item.rarity}/></div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── PAGE HEADER ── */}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
              <div>
                <div style={{fontWeight:900,fontSize:22,color:C.text}}>Cofres de Premio</div>
                <div style={{fontSize:12,color:C.textMed}}>Gasta cristales 💎 y obtén items exclusivos</div>
              </div>
              <div style={{display:"flex",gap:6}}>
                <button onClick={()=>setShowInventory(true)} style={{background:C.purpleLt,border:`1.5px solid ${C.purple}40`,borderRadius:12,padding:"7px 10px",fontSize:12,color:C.purple,fontWeight:700,cursor:"pointer"}}>🎒 {inventory.length}</button>
                <button onClick={()=>setShowLootTable(true)} style={{background:C.goldLt,border:`1.5px solid ${C.gold}40`,borderRadius:12,padding:"7px 10px",fontSize:12,color:C.goldDk,fontWeight:700,cursor:"pointer"}}>📋 Tabla</button>
              </div>
            </div>

            {/* Crystal balance */}
            <div style={{background:`linear-gradient(135deg,${C.sky},#2d8fd4)`,borderRadius:16,padding:"11px 16px",marginBottom:16,display:"flex",alignItems:"center",gap:12,color:"white"}}>
              <span style={{fontSize:28}}>💎</span>
              <div style={{flex:1}}>
                <div style={{fontWeight:900,fontSize:20}}>{user.gems} cristales</div>
                <div style={{fontSize:11,opacity:0.8}}>Gana cristales completando tareas y subiendo de nivel</div>
              </div>
            </div>

            {/* Rarity legend */}
            <div style={{background:C.card,borderRadius:16,padding:"12px 14px",marginBottom:14,boxShadow:C.shadow}}>
              <div style={{fontWeight:700,fontSize:12,color:C.textMed,marginBottom:8}}>Rarezas disponibles</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {Object.values(RARITIES).map(r=>(
                  <div key={r.id} style={{display:"flex",alignItems:"center",gap:4,background:r.bg,borderRadius:20,padding:"3px 8px",border:`1px solid ${r.color}40`}}>
                    <span style={{fontSize:10}}>{r.star}</span>
                    <span style={{fontSize:10,fontWeight:700,color:r.color}}>{r.label}</span>
                    <span style={{fontSize:9,color:C.textMed}}>{r.pct}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Chest cards */}
            {CHESTS.map(ch=>(
              <div key={ch.id} style={{background:C.card,borderRadius:20,marginBottom:14,boxShadow:ch.id==="legendary"?`0 4px 24px ${ch.glow}`:C.shadow,border:`2px solid ${ch.color}30`,overflow:"hidden"}}>
                {/* chest header gradient */}
                <div style={{background:ch.gradient,padding:"18px 18px 14px",color:"white",position:"relative",overflow:"hidden"}}>
                  <div style={{position:"absolute",right:-8,top:-8,opacity:0.1}}><ChestSVG id={ch.id} size={80}/></div>
                  <div style={{display:"flex",alignItems:"center",gap:14}}>
                    <div style={{flexShrink:0,filter:`drop-shadow(0 4px 14px ${ch.glow})`}} className={ch.id==="legendary"?"float":""}><ChestSVG id={ch.id} size={58}/></div>
                    <div>
                      <div style={{fontWeight:900,fontSize:20}}>{ch.name}</div>
                      <div style={{fontSize:12,opacity:0.85,marginTop:2}}>{ch.desc}</div>
                    </div>
                  </div>
                  {/* rate pills */}
                  <div style={{display:"flex",gap:5,marginTop:10,flexWrap:"wrap"}}>
                    {Object.entries(ch.rates).filter(([,v])=>v>0).map(([k,v])=>{
                      const r=RARITIES[k];
                      return (
                        <div key={k} style={{background:"rgba(255,255,255,0.22)",borderRadius:20,padding:"3px 9px",fontSize:10,fontWeight:700,backdropFilter:"blur(4px)"}}>
                          {r.label} {v}%
                        </div>
                      );
                    })}
                  </div>
                </div>
                {/* chest footer */}
                <div style={{padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <div>
                    <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                      {/* item type icons */}
                      {["frame","sticker","emoji"].map(t=>{
                        const cnt = LOOT_ITEMS.filter(i=>Object.entries(ch.rates).some(([k,v])=>v>0&&i.rarity===k) && i.type===t).length;
                        return cnt>0&&(
                          <div key={t} style={{fontSize:11,color:C.textMed,background:C.bg,borderRadius:10,padding:"2px 7px"}}>
                            {{frame:"Marcos",sticker:"Stickers",avatar:"Avatares"}[t]||t}: {cnt}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <button onClick={()=>{
                    if(user.gems<ch.gems){ notify(`Necesitas ${ch.gems} 💎 · tienes ${user.gems}`,"💎"); return; }
                    setUser(p=>({...p,gems:p.gems-ch.gems}));
                    setOpeningChest(ch); setChestPhase("idle"); setChestWin(null);
                  }} style={{background:ch.gradient,border:"none",borderRadius:14,padding:"10px 18px",color:"white",fontWeight:800,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",gap:6,flexShrink:0,boxShadow:`0 4px 12px ${ch.glow}`}}>
                    💎 {ch.gems}
                  </button>
                </div>
              </div>
            ))}

            {/* How to earn gems */}
            <div style={{background:C.skyLt,border:`1.5px solid ${C.sky}40`,borderRadius:16,padding:"12px 16px",marginBottom:8}}>
              <div style={{fontWeight:700,fontSize:13,color:C.sky,marginBottom:8}}>💎 ¿Cómo ganar cristales?</div>
              {[
                {e:"✅",t:"Completar tareas verificadas",v:"+1-3 💎"},
                {e:"🔥",t:"Mantener racha de 7 días",      v:"+5 💎"},
                {e:"⬆️",t:"Subir de nivel",               v:"+10 💎"},
                {e:"🎡",t:"Ruleta de recompensas",         v:"Posible 💎"},
              ].map((x,i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6,fontSize:12}}>
                  <div style={{display:"flex",gap:6,alignItems:"center",color:C.textMed}}><span>{x.e}</span>{x.t}</div>
                  <span style={{fontWeight:700,color:C.sky}}>{x.v}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── STUDENT: CLAN ── */}
        {role===ROLES.STUDENT&&tab==="clan"&&(
          <div style={{padding:"16px 14px 0"}}>
            {!canClan?(
              <div style={{background:C.card,borderRadius:20,padding:28,textAlign:"center",boxShadow:C.shadow}}>
                <div style={{fontSize:48,marginBottom:10}}>🔒</div>
                <div style={{fontWeight:800,fontSize:18,color:C.text}}>Clan bloqueado</div>
                <div style={{fontSize:13,color:C.textMed,marginTop:6}}>Necesitas <b style={{color:C.mint}}>Nivel {MIN_CLAN}</b> para unirte</div>
              </div>
            ):(
              <>
                <div style={{background:`linear-gradient(135deg,${C.mint},${C.mintDk})`,borderRadius:22,padding:20,marginBottom:14,color:"white",position:"relative",overflow:"hidden"}}>
                  <div style={{position:"absolute",right:-10,top:-10,fontSize:90,opacity:0.1}}>🐉</div>
                  <div style={{display:"flex",gap:14,alignItems:"center",marginBottom:12}}>
                    <div style={{fontSize:46}} className="float">🐉</div>
                    <div><div style={{fontWeight:900,fontSize:22}}>{CLAN.name}</div><div style={{fontSize:12,opacity:0.8}}>Nivel {CLAN.level} · {CLAN.members.length} miembros</div></div>
                  </div>
                  <div style={{height:7,borderRadius:7,background:"rgba(255,255,255,0.25)",overflow:"hidden",marginBottom:4}}>
                    <div style={{height:"100%",borderRadius:7,width:`${CLAN.levelXP}%`,background:"white"}}/>
                  </div>
                  <div style={{fontSize:10,opacity:0.7,textAlign:"right"}}>Nivel {CLAN.level+1} en {100-CLAN.levelXP}% más · ¡Completa tareas!</div>
                </div>
                {/* clan mission */}
                <div style={{background:C.card,borderRadius:16,padding:14,marginBottom:14,boxShadow:C.shadow}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                    <div style={{fontWeight:800,fontSize:13,color:C.text}}>🎯 Misión semanal del clan</div>
                    <span style={{fontWeight:900,color:C.purple}}>12/20</span>
                  </div>
                  <div style={{height:7,borderRadius:7,background:C.border,overflow:"hidden",marginBottom:6}}>
                    <div style={{height:"100%",borderRadius:7,width:"60%",background:`linear-gradient(90deg,${C.purple},#b39dfc)`}}/>
                  </div>
                  <div style={{fontSize:11,color:C.textMed}}>Completar 20 tareas · Recompensa: +200 XP clan</div>
                </div>
                {/* ranking */}
                <div style={{fontWeight:800,fontSize:16,color:C.text,marginBottom:10}}>🏆 Ranking</div>
                {CLAN.members.map((m,i)=>(
                  <div key={i} style={{background:C.card,borderRadius:16,padding:"12px 14px",marginBottom:8,display:"flex",alignItems:"center",gap:10,boxShadow:i===0?C.shadowMd:C.shadow,border:`1.5px solid ${i===0?C.gold+"60":C.border}`}}>
                    <div style={{fontWeight:900,fontSize:18,color:["#F5C518","#B0B0B0","#CD7F32","#CBD5E0","#CBD5E0"][i],minWidth:22}}>{["🥇","🥈","🥉",`#4`,`#5`][i]}</div>
                    <div style={{width:34,height:34,borderRadius:"50%",background:C.mintLt,border:`2px solid ${C.mint}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>{m.avatar}</div>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:800,fontSize:13,color:C.text}}>{m.name}</div>
                      <div style={{fontSize:11,color:C.textMed}}>Nv.{m.level} · 🔥{m.streak}d · {m.tasks} tareas</div>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontWeight:800,color:C.goldDk,fontSize:13}}>🏆{m.trophies}</div>
                      <div style={{fontSize:10,color:C.mint}}>+{m.pts} XP</div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* ── STUDENT: CHAT ── */}
        {role===ROLES.STUDENT&&tab==="chat"&&(
          <ChatView msgs={kMsgs} setMsgs={setKMsgs} isMe={m=>m.author===user.name} myAuthor={user.name} myAvatar={user.avatar} myRole="student" onSend={t=>sendChatMsg(t,"clan")}
            input={chatInput} setInput={setChatInput} chatEndRef={chatEndRef} C={C}
            header={{title:"Chat del clan",sub:"Solo miembros · Moderado por adultos",gradient:`linear-gradient(135deg,${C.mint},${C.mintDk})`}}
            quickReplies={["🔥 ¡Vamos!","✅ ¡Lo hice!","💪 ¡A por ello!","😎 ¡Fácil!"]}
            locked={!canClan} lockMsg={`Necesitas Nivel ${MIN_CLAN}`}/>
        )}

        {/* ── STUDENT: ME ── */}
        {role===ROLES.STUDENT&&tab==="me"&&(
          <div style={{padding:"16px 14px 0"}}>

            {/* ── AVATAR EDITOR MODAL ── */}
            {showAvatarEditor&&(
              <div className="overlay" style={{zIndex:9995}}>
                <div className="modal pop-in" style={{maxHeight:"90vh",overflowY:"auto"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                    <div style={{fontWeight:800,fontSize:17,color:C.text}}>✏️ Editar Perfil</div>
                    <button onClick={()=>setShowAvatarEditor(false)} style={{background:C.border,border:"none",borderRadius:10,padding:"5px 9px",color:C.textMed,cursor:"pointer",fontSize:15}}>✕</button>
                  </div>

                  {/* live preview */}
                  <div style={{textAlign:"center",marginBottom:16}}>
                    <AvatarDisplay photo={avatarPhoto} emoji={avatarEmoji} frame={avatarFrame} bg={avatarBg} size={90} C={C}/>
                    <div style={{fontWeight:800,fontSize:15,color:C.text,marginTop:8}}>{user.name}</div>
                    <div style={{fontSize:12,color:C.textMed}}>Nv.{user.level} {curLvl.name}</div>
                  </div>

                  {/* edit tabs */}
                  <div style={{display:"flex",gap:6,marginBottom:14,overflowX:"auto",paddingBottom:4}}>
                    {[{id:"photo",l:"📸 Foto"},{id:"emoji",l:"😀 Emoji"},{id:"frame",l:"🖼️ Marco"},{id:"color",l:"🎨 Color"}].map(t=>(
                      <button key={t.id} onClick={()=>setEditTab(t.id)} style={{padding:"6px 12px",borderRadius:20,border:`1.5px solid ${editTab===t.id?C.mint:C.border}`,background:editTab===t.id?C.mint:C.card,color:editTab===t.id?"white":C.textMed,fontWeight:700,fontSize:11,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0,transition:"all 0.15s"}}>
                        {t.l}
                      </button>
                    ))}
                  </div>

                  {/* PHOTO TAB */}
                  {editTab==="photo"&&(
                    <div>
                      <div style={{fontSize:13,color:C.textMed,marginBottom:10,lineHeight:1.5}}>Sube una foto tuya para tu avatar. Solo tú y tu clan la verán.</div>
                      {avatarPhoto?(
                        <div style={{textAlign:"center",marginBottom:12}}>
                          <img src={avatarPhoto} alt="avatar" style={{width:100,height:100,borderRadius:"50%",objectFit:"cover",border:`3px solid ${C.mint}`,boxShadow:C.shadowMd}}/>
                          <div style={{marginTop:8,display:"flex",gap:8,justifyContent:"center"}}>
                            <label style={{cursor:"pointer"}}>
                              <div style={{padding:"7px 14px",borderRadius:12,border:`1.5px solid ${C.mint}`,background:C.mintLt,color:C.mintDk,fontSize:12,fontWeight:700}}>🔄 Cambiar</div>
                              <input type="file" accept="image/*" capture="user" onChange={e=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=ev=>setAvatarPhoto(ev.target.result);r.readAsDataURL(f);}} style={{display:"none"}}/>
                            </label>
                            <button onClick={()=>setAvatarPhoto(null)} style={{padding:"7px 14px",borderRadius:12,border:`1.5px solid ${C.coral}`,background:C.coralLt,color:C.coral,fontSize:12,fontWeight:700,cursor:"pointer"}}>🗑️ Quitar</button>
                          </div>
                        </div>
                      ):(
                        <label style={{display:"block",cursor:"pointer"}}>
                          <div className="upload-zone" style={{padding:24}}>
                            <div style={{fontSize:40,marginBottom:8}}>🤳</div>
                            <div style={{fontWeight:700,fontSize:14,color:C.text}}>Subir foto de perfil</div>
                            <div style={{fontSize:12,color:C.textMed,marginTop:4}}>Selfie, foto escolar, lo que quieras 😊</div>
                          </div>
                          <input type="file" accept="image/*" capture="user" onChange={e=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=ev=>setAvatarPhoto(ev.target.result);r.readAsDataURL(f);}} style={{display:"none"}}/>
                        </label>
                      )}
                      <div style={{background:C.skyLt,border:`1px solid ${C.sky}30`,borderRadius:12,padding:"8px 12px",marginTop:10,fontSize:11,color:C.sky}}>
                        🔒 Tu foto solo la ven los miembros de tu clan y tus tutores
                      </div>
                    </div>
                  )}

                  {/* EMOJI TAB */}
                  {editTab==="emoji"&&(
                    <div>
                      <div style={{fontSize:13,color:C.textMed,marginBottom:10}}>Elige un emoji como avatar (si no tienes foto):</div>
                      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8,marginBottom:10}}>
                        {["🦁","🦊","🐯","🦋","🐺","🦅","🐲","🦄","🐸","🦈","🐻","🦉","🐺","🐼","🦋","🦎","🚀","⚡","🔥","💎"].map(e=>(
                          <button key={e} onClick={()=>setAvatarEmoji(e)} style={{height:48,borderRadius:14,border:`2px solid ${avatarEmoji===e?C.mint:C.border}`,background:avatarEmoji===e?C.mintLt:C.card,fontSize:24,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.15s"}}>
                            {e}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* FRAME TAB */}
                  {editTab==="frame"&&(
                    <div>
                      {/* ── NATIVE FRAMES (always free) ── */}
                      <div style={{fontSize:12,fontWeight:700,color:C.textMed,marginBottom:8,display:"flex",alignItems:"center",gap:6}}>
                        <span>🎁</span> Marcos gratuitos
                      </div>
                      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:16}}>
                        {NATIVE_FRAMES.map(fr=>{
                          const sel = avatarFrame===fr.id;
                          return (
                            <button key={fr.id} onClick={()=>setAvatarFrame(fr.id)}
                              style={{padding:"10px 8px",borderRadius:14,border:`2px solid ${sel?C.mint:C.border}`,background:sel?C.mintLt:C.card,cursor:"pointer",textAlign:"center",transition:"all 0.15s",boxShadow:sel?C.shadowMd:"none"}}>
                              <FramePreview id={fr.id} size={38} emoji={avatarEmoji}/>
                              <div style={{fontSize:10,fontWeight:700,color:sel?C.mintDk:C.text,marginTop:5}}>{fr.label}</div>
                              <div style={{fontSize:9,color:C.textLt,marginTop:1}}>{fr.desc}</div>
                            </button>
                          );
                        })}
                      </div>

                      {/* ── LOOT FRAMES (from chests) ── */}
                      {(()=>{
                        const unlockedLootFrames = inventory.filter(i=>i.type==="frame");
                        return (
                          <>
                            <div style={{fontSize:12,fontWeight:700,color:C.textMed,marginBottom:8,display:"flex",alignItems:"center",gap:6}}>
                              Marcos de cofre ({unlockedLootFrames.length})
                            </div>
                            {unlockedLootFrames.length===0?(
                              <div style={{background:C.border,borderRadius:14,padding:"14px",textAlign:"center"}}>
                                <div style={{fontSize:28,marginBottom:6}}>📦</div>
                                <div style={{fontSize:12,color:C.textMed,fontWeight:600}}>Aún no tienes marcos de cofre</div>
                                <div style={{fontSize:11,color:C.textLt,marginTop:3}}>¡Abre cofres en la tienda para desbloquearlos!</div>
                              </div>
                            ):(
                              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
                                {unlockedLootFrames.map((fr,i)=>{
                                  const r=RARITIES[fr.rarity];
                                  const sel=avatarFrame===fr.id;
                                  return (
                                    <button key={i} onClick={()=>setAvatarFrame(fr.id)}
                                      style={{padding:"10px 8px",borderRadius:14,border:`2px solid ${sel?r.color:r.color+"40"}`,background:sel?r.bg:C.card,cursor:"pointer",textAlign:"center",transition:"all 0.15s",position:"relative",boxShadow:sel?`0 0 12px ${r.glow}`:"none"}}>
                                      <div style={{position:"absolute",top:3,left:3,fontSize:8}}><RarDot r={item.rarity}/></div>
                                      <FramePreview id={fr.id} size={38} emoji={avatarEmoji}/>
                                      <div style={{fontSize:10,fontWeight:700,color:sel?r.color:C.text,marginTop:5}}>{fr.name}</div>
                                      <div style={{fontSize:9,color:r.color,fontWeight:700}}>{r.label}</div>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  )}

                  {/* COLOR TAB */}
                  {editTab==="color"&&(
                    <div>
                      <div style={{fontSize:13,color:C.textMed,marginBottom:10}}>Elige el fondo de tu tarjeta de perfil:</div>
                      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
                        {[
                          {id:"mint",    label:"Verde Jade",  g:`linear-gradient(135deg,#4DC9A0,#2FA87A)`},
                          {id:"gold",    label:"Dorado",      g:`linear-gradient(135deg,#F5C518,#D4A800)`},
                          {id:"sky",     label:"Cielo",       g:`linear-gradient(135deg,#4AAEE8,#2d8fd4)`},
                          {id:"coral",   label:"Coral",       g:`linear-gradient(135deg,#FF6B6B,#e84040)`},
                          {id:"purple",  label:"Violeta",     g:`linear-gradient(135deg,#8B6BE8,#6d53c4)`},
                          {id:"night",   label:"Noche",       g:`linear-gradient(135deg,#1a2e28,#0d1a16)`},
                          {id:"sunrise", label:"Amanecer",    g:`linear-gradient(135deg,#FF6B6B,#F5C518)`},
                          {id:"ocean",   label:"Océano",      g:`linear-gradient(135deg,#4AAEE8,#4DC9A0)`},
                          {id:"candy",   label:"Dulce",       g:`linear-gradient(135deg,#FF6B9D,#8B6BE8)`},
                        ].map(bg=>(
                          <button key={bg.id} onClick={()=>setAvatarBg(bg.id)} style={{height:60,borderRadius:14,border:`3px solid ${avatarBg===bg.id?"white":"transparent"}`,background:bg.g,cursor:"pointer",display:"flex",alignItems:"flex-end",justifyContent:"center",paddingBottom:6,boxShadow:avatarBg===bg.id?`0 0 0 2px ${C.mint}`:"none",transition:"all 0.15s"}}>
                            <span style={{fontSize:10,fontWeight:800,color:"white",textShadow:"0 1px 3px rgba(0,0,0,0.4)"}}>{bg.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <BtnMain onClick={()=>setShowAvatarEditor(false)} bg={`linear-gradient(135deg,${C.mint},${C.mintDk})`} style={{width:"100%",marginTop:16}}>
                    ✓ Guardar perfil
                  </BtnMain>
                </div>
              </div>
            )}

            {/* profile hero */}
            {(()=>{
              const BG_MAP = {
                mint:`linear-gradient(135deg,${C.mint},${C.mintDk})`,
                gold:`linear-gradient(135deg,${C.gold},${C.goldDk})`,
                sky:`linear-gradient(135deg,${C.sky},#2d8fd4)`,
                coral:`linear-gradient(135deg,${C.coral},#e84040)`,
                purple:`linear-gradient(135deg,${C.purple},#6d53c4)`,
                night:`linear-gradient(135deg,#1a2e28,#0d1a16)`,
                sunrise:`linear-gradient(135deg,#FF6B6B,#F5C518)`,
                ocean:`linear-gradient(135deg,#4AAEE8,#4DC9A0)`,
                candy:`linear-gradient(135deg,#FF6B9D,#8B6BE8)`,
              };
              return (
                <div style={{background:BG_MAP[avatarBg]||BG_MAP.mint,borderRadius:22,padding:22,textAlign:"center",color:"white",marginBottom:14,position:"relative",overflow:"hidden"}}>
                  <div style={{position:"absolute",right:-10,bottom:-10,fontSize:80,opacity:0.08}}>🏆</div>
                  {/* avatar with frame */}
                  <div style={{position:"relative",width:80,height:80,margin:"0 auto 10px"}}>
                    <AvatarDisplay photo={avatarPhoto} emoji={avatarEmoji} frame={avatarFrame} bg={avatarBg} size={80} C={C} white/>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:8,justifyContent:"center"}}>
                    <div style={{fontWeight:900,fontSize:22,color:"white"}}>{user.name||"Sin nombre"}</div>
                    <button onClick={()=>{setEditDisplayName(user.name||"");setEditUsername(user.username||"");setShowProfileEdit(true);}}
                      style={{background:"rgba(255,255,255,0.2)",border:"1.5px solid rgba(255,255,255,0.4)",borderRadius:8,padding:"3px 8px",fontSize:10,fontWeight:700,color:"white",cursor:"pointer"}}>✏️</button>
                  </div>
                  {user.username&&<div style={{fontSize:11,opacity:0.65,marginTop:1,color:"white"}}>@{user.username}</div>}
                  <div style={{fontSize:12,opacity:0.8,marginTop:2}}>Nv.{user.level} {curLvl.name}</div>
                  <div style={{display:"flex",justifyContent:"center",gap:20,marginTop:12}}>
                    {[{l:"Trofeos",v:`🏆 ${fmtN(user.trophies)}`,c:C.gold,bg:"rgba(255,179,0,0.2)"},{l:"Racha",v:`🔥 ${user.streak}d`,c:C.coral,bg:"rgba(255,82,82,0.2)"},{l:"Escudos",v:`🛡️ ${user.streakShields}`,c:C.purple,bg:"rgba(124,77,255,0.2)"}].map((s,i)=>(
                      <div key={i} style={{textAlign:"center"}}><div style={{fontWeight:900,fontSize:14}}>{s.v}</div><div style={{fontSize:10,opacity:0.75}}>{s.l}</div></div>
                    ))}
                  </div>
                  {/* edit button */}
                  <button onClick={()=>setShowAvatarEditor(true)} style={{marginTop:12,padding:"7px 18px",borderRadius:20,border:"2px solid rgba(255,255,255,0.5)",background:"rgba(255,255,255,0.15)",color:"white",fontSize:12,fontWeight:700,cursor:"pointer",backdropFilter:"blur(4px)"}}>
                    ✏️ Editar perfil
                  </button>
                </div>
              );
            })()}

            {/* sign out */}
            {onSignOut&&(
              <button onClick={()=>onSignOut()}
                style={{width:"100%",background:C.coralLt,border:`1.5px solid ${C.coral}30`,borderRadius:14,padding:"11px 16px",marginBottom:10,display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer"}}>
                <div style={{display:"flex",gap:10,alignItems:"center"}}>
                  <span style={{fontSize:20}}>🚪</span>
                  <div style={{fontWeight:700,fontSize:13,color:C.coral}}>Cerrar sesión</div>
                </div>
              </button>
            )}

            {/* report button */}
            <button onClick={()=>setShowReport(true)}
              style={{width:"100%",background:C.card,border:`1.5px solid ${C.border}`,borderRadius:14,padding:"11px 16px",marginBottom:10,display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer",boxShadow:C.shadow}}>
              <div style={{display:"flex",gap:10,alignItems:"center"}}>
                <span style={{fontSize:20}}>🚨</span>
                <div style={{textAlign:"left"}}>
                  <div style={{fontWeight:700,fontSize:13,color:C.text}}>Reportar conducta inapropiada</div>
                  <div style={{fontSize:11,color:C.textMed}}>Ayúdanos a mantener KidQuest seguro</div>
                </div>
              </div>
              <span style={{color:C.textLt,fontSize:16}}>›</span>
            </button>

            {/* admin panel access */}
            {user.isAdmin&&(
              <button onClick={()=>setTab("admin")}
                style={{width:"100%",background:`linear-gradient(135deg,${C.purple}15,${C.sky}10)`,border:`2px solid ${C.purple}50`,borderRadius:14,padding:"11px 16px",marginBottom:10,display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer",boxShadow:C.shadow}}>
                <div style={{display:"flex",gap:10,alignItems:"center"}}>
                  <span style={{fontSize:20}}>⚙️</span>
                  <div style={{textAlign:"left"}}>
                    <div style={{fontWeight:800,fontSize:13,color:C.purple}}>Panel de Administración</div>
                    <div style={{fontSize:11,color:C.textMed}}>{user.isMaster?"Maestro":"Admin"} · Control total</div>
                  </div>
                </div>
                <span style={{color:C.purple,fontSize:16}}>›</span>
              </button>
            )}

            {/* age profile picker */}
            <button onClick={()=>setShowAgePick(true)} style={{width:"100%",background:C.card,border:`1.5px solid ${C.border}`,borderRadius:14,padding:"11px 16px",marginBottom:10,display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer",boxShadow:C.shadow}}>
              <div style={{display:"flex",gap:10,alignItems:"center"}}>
                <span style={{fontSize:22}}>{AGE_PROFILES[ageGroup]?.icon||"🌱"}</span>
                <div style={{textAlign:"left"}}>
                  <div style={{fontWeight:700,fontSize:13,color:C.text}}>Perfil de edad activo</div>
                  <div style={{fontSize:11,color:C.textMed}}>{AGE_PROFILES[ageGroup]?.label} · {AGE_PROFILES[ageGroup]?.desc}</div>
                </div>
              </div>
              <span style={{color:C.textLt,fontSize:16}}>›</span>
            </button>

            {/* share button */}
            <button onClick={()=>notify("¡Logro copiado! Comparte en WhatsApp 📱","📤")}
              style={{width:"100%",background:C.goldLt,border:`1.5px solid ${C.gold}`,borderRadius:14,padding:"11px",color:C.goldDk,fontWeight:800,fontSize:13,cursor:"pointer",marginBottom:14}}>
              📤 Compartir logro en WhatsApp / Instagram
            </button>

            {/* savings simulator */}
            <div style={{background:C.card,borderRadius:18,padding:16,marginBottom:14,boxShadow:C.shadow}}>
              <div style={{fontWeight:800,fontSize:15,color:C.text,marginBottom:12}}>🐷 Simulador de Ahorro</div>
              <div style={{marginBottom:12}}>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:C.textMed,marginBottom:6}}>
                  <span>Ahorro semanal</span><span style={{fontWeight:800,color:C.mint}}>${simWeekly.toLocaleString()}</span>
                </div>
                <input type="range" min={ageProfile.simMin} max={ageProfile.simMax} step={ageProfile.simStep} value={simWeekly} onChange={e=>setSimWeekly(Number(e.target.value))}
                  style={{width:"100%",accentColor:C.mint}}/>
              </div>
              <div style={{marginBottom:14}}>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:C.textMed,marginBottom:6}}>
                  <span>Período</span><span style={{fontWeight:800,color:C.mint}}>{simMonths} meses</span>
                </div>
                <input type="range" min="1" max="36" step="1" value={simMonths} onChange={e=>setSimMonths(Number(e.target.value))}
                  style={{width:"100%",accentColor:C.mint}}/>
              </div>
              <div style={{background:`linear-gradient(135deg,${C.mintLt},${C.goldLt})`,borderRadius:14,padding:"12px 16px",textAlign:"center"}}>
                <div style={{fontSize:11,color:C.textMed,marginBottom:4}}>En {simMonths} meses ahorrarás</div>
                <div style={{fontWeight:900,fontSize:28,color:C.mintDk}}>${simTotal.toLocaleString()}</div>
                <div style={{fontSize:12,color:C.goldDk,marginTop:4}}>Con interés del 6% anual: <b>${simInterest.toLocaleString()}</b> 🚀</div>
              </div>
            </div>

            {/* spending tracker */}
            <div style={{background:C.card,borderRadius:18,padding:16,marginBottom:14,boxShadow:C.shadow}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                <div style={{fontWeight:800,fontSize:15,color:C.text}}>Registro de gastos</div>
                <BtnMain onClick={()=>setShowSpend(true)} bg={`linear-gradient(135deg,${C.mint},${C.mintDk})`} style={{padding:"7px 14px",fontSize:12}}>
                  + Registrar
                </BtnMain>
              </div>
              {spendLog.length===0?(
                <div style={{textAlign:"center",padding:"16px 0",color:C.textMed,fontSize:13}}>
                  Aún no registraste gastos.<br/>
                  <span style={{fontSize:11}}>Registrar te ayuda a entender tus hábitos de consumo</span>
                </div>
              ):(
                <>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
                    {EXPENSE_CATS.map(cat=>{
                      const total=spendLog.filter(e=>e.cat===cat.id).reduce((s,e)=>s+e.amt,0);
                      return total>0&&(
                        <div key={cat.id} style={{background:cat.color+"18",borderRadius:11,padding:"9px 12px",border:`1.5px solid ${cat.color}30`}}>
                          <div style={{fontSize:11,color:cat.color,fontWeight:700}}>{cat.icon} {cat.label}</div>
                          <div style={{fontWeight:900,fontSize:16,color:C.text}}>${fmtN(total)}</div>
                        </div>
                      );
                    })}
                  </div>
                  {spendLog.slice(0,5).map(e=>{
                    const cat=EXPENSE_CATS.find(c=>c.id===e.cat)||EXPENSE_CATS[3];
                    return(
                      <div key={e.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:`1px solid ${C.border}`}}>
                        <div style={{display:"flex",gap:8,alignItems:"center"}}>
                          <span style={{fontSize:16}}>{cat.icon}</span>
                          <div>
                            <div style={{fontSize:12,fontWeight:600,color:C.text}}>{e.note||cat.label}</div>
                            <div style={{fontSize:10,color:C.textMed}}>{new Date(e.ts).toLocaleDateString("es")}</div>
                          </div>
                        </div>
                        <div style={{display:"flex",gap:6,alignItems:"center"}}>
                          <span style={{fontWeight:800,color:cat.color,fontSize:13}}>${e.amt.toLocaleString()}</span>
                          <button onClick={()=>setSpendLog(p=>p.filter(x=>x.id!==e.id))} style={{background:"none",border:"none",color:C.textLt,cursor:"pointer",fontSize:14}}>✕</button>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>

            {/* monthly history */}
            <div style={{background:C.card,borderRadius:18,padding:16,marginBottom:14,boxShadow:C.shadow}}>
              <div style={{fontWeight:800,fontSize:15,color:C.text,marginBottom:12}}>Historial mensual</div>
              <div style={{display:"flex",gap:3,alignItems:"flex-end",height:80,marginBottom:8}}>
                {monthlyHist.map((m,i)=>{
                  const max=Math.max(...monthlyHist.map(x=>x.saved),1);
                  return(
                    <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                      <div style={{fontSize:8,fontWeight:700,color:C.mint}}>${fmtN(m.saved)}</div>
                      <div style={{width:"100%",height:Math.round((m.saved/max)*68)+4,background:`linear-gradient(to top,${C.mintDk},${C.mint})`,borderRadius:"4px 4px 0 0",transition:"height 0.5s"}}/>
                      <div style={{fontSize:9,color:C.textMed}}>{m.month}</div>
                    </div>
                  );
                })}
              </div>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:C.textMed}}>
                <span>Total ahorrado: <b style={{color:C.mintDk}}>${monthlyHist.reduce((s,m)=>s+m.saved,0).toLocaleString()}</b></span>
                <span>Tareas completadas: <b style={{color:C.mint}}>{monthlyHist.reduce((s,m)=>s+m.tasks,0)}</b></span>
              </div>
            </div>

            {/* economy lessons */}
            <div style={{fontWeight:800,fontSize:15,color:C.text,marginBottom:10}}>🧠 Lecciones de Economía</div>
            {lessons.map((l,i)=>(
              <div key={i} onClick={()=>!l.done&&setActiveLesson(l)} style={{background:C.card,borderRadius:14,padding:"12px 14px",marginBottom:8,display:"flex",gap:12,alignItems:"center",boxShadow:l.done?"none":C.shadow,border:`2px solid ${l.done?C.mint+"50":C.border}`,cursor:l.done?"default":"pointer",opacity:l.done?0.75:1,position:"relative",transition:"all 0.18s"}}>
                <div style={{width:42,height:42,borderRadius:13,background:l.done?`linear-gradient(135deg,${C.mint},${C.mintDk})`:`linear-gradient(135deg,${C.gold},${C.goldDk})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,boxShadow:l.done?`0 3px 10px ${C.mint}40`:`0 3px 10px ${C.gold}40`}}>{l.emoji}</div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:800,fontSize:13,color:l.done?C.mintDk:C.text}}>{l.done?"✅ ":""}{l.title}</div>
                  <div style={{fontSize:11,color:C.textMed}}>{l.duration} · +{l.xp} XP</div>
                </div>
                {!l.done&&<div style={{color:C.mint,fontSize:18}}>›</div>}
              </div>
            ))}

            {/* achievements */}
            <div style={{fontWeight:800,fontSize:15,color:C.text,margin:"14px 0 10px"}}>🏆 Logros</div>
            {[
              {e:"🔥",t:"Guerrero Constante",d:"15 días de racha",     done:true, c:C.coral},
              {e:"💰",t:"Primer Ahorro",     d:"Guardaste tu 1ª moneda",done:true, c:C.goldDk},
              {e:"🏠",t:"Héroe del Hogar",   d:"50 tareas del hogar",  done:false,c:C.mint,p:32},
              {e:"🤖",t:"IA Aprobó ×20",     d:"20 fotos al 1er intento",done:false,c:C.purple,p:14},
              {e:"🌍",t:"Corazón Solidario", d:"Proyecto social",      done:false,c:C.sky,p:0},
            ].map((a,i)=>(
              <div key={i} style={{background:C.card,borderRadius:14,padding:"11px 13px",marginBottom:7,display:"flex",gap:11,alignItems:"center",boxShadow:C.shadow,border:`1.5px solid ${a.done?a.c+"40":C.border}`,opacity:a.done?1:0.65}}>
                <div style={{width:40,height:40,borderRadius:12,background:a.c+"18",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,filter:a.done?"none":"grayscale(1)"}}>{a.e}</div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:800,fontSize:13,color:a.done?a.c:C.text}}>{a.t}</div>
                  <div style={{fontSize:11,color:C.textMed}}>{a.d}</div>
                  {!a.done&&a.p!==undefined&&<div style={{marginTop:4,height:4,borderRadius:4,background:C.border,overflow:"hidden"}}><div style={{height:"100%",borderRadius:4,width:`${a.p}%`,background:a.c}}/></div>}
                </div>
                {a.done&&<span className="pop-in">⭐</span>}
              </div>
            ))}
          </div>
        )}

        {/* ── PARENT: VALIDATE ── */}
        {role===ROLES.PARENT&&tab==="validate"&&(
          <div style={{padding:"16px 14px 0"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
              <div style={{fontWeight:800,fontSize:20,color:C.text}}>Validar tareas</div>
              <div style={{display:"flex",gap:6}}>
                <button onClick={()=>setShowTaskCreator(true)} style={{background:C.mintLt,border:`1.5px solid ${C.mint}`,borderRadius:11,padding:"6px 10px",color:C.mintDk,fontSize:11,fontWeight:700,cursor:"pointer"}}>+ Misión</button>
                <button onClick={()=>{setAssignStep("pick");setSelectedStudents([]);setShowChallengeAssign(true);}} style={{background:C.goldLt,border:`1.5px solid ${C.gold}`,borderRadius:11,padding:"6px 10px",color:C.goldDk,fontSize:11,fontWeight:700,cursor:"pointer"}}>🎯 Desafío</button>
                <button onClick={()=>setShowControls(true)} style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:11,padding:"6px 10px",color:C.textMed,fontSize:11,fontWeight:700,cursor:"pointer"}}>⚙️</button>
                <button onClick={()=>setShowLinkTutor(true)} style={{background:`linear-gradient(135deg,${C.mint},${C.mintDk})`,border:"none",borderRadius:11,padding:"6px 10px",color:"white",fontSize:11,fontWeight:700,cursor:"pointer"}}>🔗</button>
              </div>
            </div>
            <div style={{background:C.purpleLt,border:`1.5px solid ${C.purple}30`,borderRadius:14,padding:"10px 14px",marginBottom:14,fontSize:12,color:C.purple,fontWeight:600}}>
              🤖 IA pre-analizó las fotos · Las apelaciones también son revisadas automáticamente
            </div>

            {/* Pending tutor requests */}
            <TutorRequestsPanel userId={userId} C={C} notify={notify} onApprove={(childId,childName)=>{
              setLinkedStudents(p=>[...p,{id:childId,name:childName,avatar:"a_cub",level:1,gem_reward_claimed:false}]);
            }}/>
            {/* Real pending tasks from Supabase */}
            {loadingPending&&(
              <div style={{textAlign:"center",padding:24,color:C.textMed}}>
                <div style={{fontSize:32,marginBottom:8}} className="float">⏳</div>
                Cargando tareas pendientes…
              </div>
            )}
            {!loadingPending&&linkedStudents.length===0&&(
              <div style={{background:C.goldLt,border:`1.5px solid ${C.gold}30`,borderRadius:16,padding:18,textAlign:"center"}}>
                <div style={{fontSize:32,marginBottom:8}}>👦</div>
                <div style={{fontWeight:700,fontSize:14,color:C.goldDk,marginBottom:6}}>No tienes hijos vinculados aún</div>
                <div style={{fontSize:12,color:C.textMed,marginBottom:12}}>Ve a la pestaña "Mi QR" y genera un código para que tu hijo se una</div>
                <BtnMain onClick={()=>setTab("qrcode")} bg={`linear-gradient(135deg,${C.gold},${C.goldDk})`} style={{display:"inline-block",padding:"8px 20px",fontSize:13}}>
                  Ir a Mi QR →
                </BtnMain>
              </div>
            )}
            {!loadingPending&&linkedStudents.length>0&&pendingTasks.length===0&&pendingLoaded&&(
              <div style={{background:C.mintLt,border:`1.5px solid ${C.mint}30`,borderRadius:16,padding:18,textAlign:"center"}}>
                <div style={{fontSize:32,marginBottom:8}}>✅</div>
                <div style={{fontWeight:700,fontSize:14,color:C.mintDk}}>¡Todo al día!</div>
                <div style={{fontSize:12,color:C.textMed,marginTop:4}}>No hay tareas pendientes de revisión</div>
              </div>
            )}
            {pendingTasks.map(v=>{
              const child = linkedStudents.find(s=>s.id===v.user_id)||{name:"Estudiante",avatar:"a_cub"};
              const timeAgo = v.completed_at ? new Date(v.completed_at).toLocaleString("es",{hour:"2-digit",minute:"2-digit",day:"numeric",month:"short"}) : "Pendiente";
              return(
                <div key={v.id} style={{background:C.card,borderRadius:18,padding:16,marginBottom:12,boxShadow:C.shadow}}>
                  <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:10}}>
                    <div style={{width:38,height:38,borderRadius:"50%",background:C.mintLt,border:`2px solid ${C.mint}`,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",flexShrink:0}}>
                      <KQIcon id={child.avatar||"a_cub"} size={34}/>
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:800,fontSize:14,color:C.text}}>{child.name}</div>
                      <div style={{fontSize:12,color:C.mint,fontWeight:700}}>{v.task_title}</div>
                      <div style={{fontSize:11,color:C.textLt}}>{timeAgo}</div>
                    </div>
                    {v.ai_score>0&&<Chip label={`🤖 ${v.ai_score}%`} bg={v.ai_score>=70?C.mintLt:C.goldLt} color={v.ai_score>=70?C.mintDk:C.goldDk}/>}
                  </div>
                  {v.self_desc&&(
                    <div style={{background:C.skyLt,border:`1.5px solid ${C.sky}30`,borderRadius:12,padding:10,marginBottom:10}}>
                      <div style={{fontSize:11,fontWeight:700,color:C.sky,marginBottom:4}}>📝 Descripción del niño</div>
                      <div style={{fontSize:12,color:C.textMed,fontStyle:"italic"}}>"{v.self_desc}"</div>
                    </div>
                  )}
                  {v.evidence_url&&(
                    <div style={{background:C.mintLt,borderRadius:12,padding:10,marginBottom:10,fontSize:12,color:C.mintDk,fontWeight:600}}>
                      📸 Foto enviada como evidencia
                    </div>
                  )}
                  <div style={{display:"flex",gap:8}}>
                    <button onClick={async()=>{
                      const {supabase}=await import("./supabase.js");
                      await supabase.from("task_progress").update({status:"rejected"}).eq("id",v.id);
                      setPendingTasks(p=>p.filter(t=>t.id!==v.id));
                      notify(`Tarea rechazada — ${child.name} puede apelar`,"❌");
                    }} style={{flex:1,padding:"10px",borderRadius:12,border:`1.5px solid ${C.coral}60`,background:C.coralLt,color:C.coral,cursor:"pointer",fontWeight:800,fontSize:12}}>❌ Rechazar</button>
                    <button onClick={async()=>{
                      const {supabase}=await import("./supabase.js");
                      await supabase.from("task_progress").update({status:"approved"}).eq("id",v.id);
                      // Give XP/coins to child
                      const {data:childProf}=await supabase.from("profiles").select("xp,coins,trophies").eq("id",v.user_id).single();
                      if(childProf){
                        await supabase.from("profiles").update({
                          xp:(childProf.xp||0)+100,
                          coins:(childProf.coins||0)+25,
                          trophies:(childProf.trophies||0)+10,
                        }).eq("id",v.user_id);
                      }
                      setPendingTasks(p=>p.filter(t=>t.id!==v.id));
                      boom();
                      notify(`¡Aprobada! ${child.name} ganó sus recompensas 🎉`,"✅");
                    }} style={{flex:2,padding:"10px",borderRadius:12,border:"none",background:`linear-gradient(135deg,${C.mint},${C.mintDk})`,color:"white",cursor:"pointer",fontWeight:800,fontSize:13}}>✅ Aprobar</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── PARENT: PROGRESS ── */}
        {role===ROLES.PARENT&&tab==="progress"&&(
          <div style={{padding:"16px 14px 0"}}>
            <div style={{fontWeight:800,fontSize:20,color:C.text,marginBottom:14}}>Progreso de {linkedStudents[0]?.name||"tu hijo"}</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
              {[{e:"✅",l:"Aprobadas",v:"12",c:C.mint},{e:"🤖",l:"IA aprobó",v:"9",c:C.purple},{e:"⚖️",l:"Apelaciones",v:"2",c:C.sky},{e:"🔥",l:"Racha",v:"15d",c:C.coral}].map((s,i)=>(
                <div key={i} style={{background:C.card,borderRadius:14,padding:"12px 10px",textAlign:"center",boxShadow:C.shadow}}>
                  <div style={{fontSize:24}}>{s.e}</div>
                  <div style={{fontWeight:900,fontSize:20,color:s.c}}>{s.v}</div>
                  <div style={{fontSize:10,color:C.textMed}}>{s.l}</div>
                </div>
              ))}
            </div>
            <div style={{background:C.card,borderRadius:18,padding:16,marginBottom:14,boxShadow:C.shadow}}>
              <div style={{fontWeight:800,fontSize:14,color:C.text,marginBottom:12}}>📅 Esta semana</div>
              <div style={{display:"flex",alignItems:"flex-end",gap:6,height:72}}>
                {WEEK_DATA.map((d,i)=>(
                  <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                    {d.pts>0&&<div style={{fontSize:9,fontWeight:800,color:C.mint}}>{d.pts}</div>}
                    <div style={{width:"100%",height:Math.max((d.pts/MAX_BAR)*60,4),background:d.pts?`linear-gradient(to top,${C.mintDk},${C.mint})`:C.border,borderRadius:"5px 5px 0 0"}}/>
                    <div style={{fontSize:9,color:C.textMed}}>{d.day}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{background:C.card,borderRadius:18,padding:16,boxShadow:C.shadow}}>
              <div style={{fontWeight:800,fontSize:14,color:C.text,marginBottom:8}}>🐷 {user.savingsGoal.emoji} Meta: {user.savingsGoal.name}</div>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                <span style={{fontSize:12,color:C.textMed}}>Meta: ${fmtN(user.savingsGoal.target)}</span>
                <span style={{fontSize:13,fontWeight:800,color:C.goldDk}}>${fmtN(user.savingsGoal.saved)} ({savingsPct}%)</span>
              </div>
              <div style={{height:8,borderRadius:8,background:C.border,overflow:"hidden"}}>
                <div style={{height:"100%",borderRadius:8,width:`${savingsPct}%`,background:`linear-gradient(90deg,${C.gold},${C.goldDk})`}}/>
              </div>
            </div>
            {/* monthly history */}
            <div style={{background:C.card,borderRadius:16,padding:14,marginTop:12,marginBottom:12,boxShadow:C.shadow}}>
              <div style={{fontWeight:800,fontSize:14,color:C.text,marginBottom:11}}>Historial mensual de ahorro</div>
              <div style={{display:"flex",gap:3,alignItems:"flex-end",height:72,marginBottom:8}}>
                {monthlyHist.map((m,i)=>{
                  const max=Math.max(...monthlyHist.map(x=>x.saved),1);
                  return(
                    <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
                      <div style={{fontSize:8,fontWeight:700,color:C.mint}}>${fmtN(m.saved)}</div>
                      <div style={{width:"100%",height:Math.round((m.saved/max)*56)+4,background:`linear-gradient(to top,${C.mintDk},${C.mint})`,borderRadius:"4px 4px 0 0"}}/>
                      <div style={{fontSize:8,color:C.textMed}}>{m.month}</div>
                    </div>
                  );
                })}
              </div>
              <div style={{background:C.mintLt,borderRadius:10,padding:"8px 12px",fontSize:11,color:C.mintDk}}>
                💡 Pregúntale a {linkedStudents[0]?.name||"tu hijo"}: "¿En qué mes ahorraste más y por qué?"
              </div>
            </div>

            <button onClick={()=>notify("Reporte enviado a tu correo 📧","📊")} style={{width:"100%",marginTop:4,padding:"12px",borderRadius:14,border:`1.5px solid ${C.border}`,background:C.card,color:C.textMed,cursor:"pointer",fontWeight:700,fontSize:13}}>
              Exportar reporte semanal
            </button>
          </div>
        )}

        {/* ── PARENT: ALLOWANCE ── */}
        {role===ROLES.PARENT&&tab==="allowance"&&(
          <div style={{padding:"16px 14px 0"}}>
            <div style={{fontWeight:800,fontSize:20,color:C.text,marginBottom:4}}>Mesada de {linkedStudents[0]?.name||"tu hijo"}</div>
            <div style={{fontSize:13,color:C.textMed,marginBottom:14}}>Gestiona la mesada y enseña economía real</div>
            <div style={{background:`linear-gradient(135deg,${C.gold},${C.goldDk})`,borderRadius:20,padding:20,color:"white",marginBottom:14,position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",right:-10,top:-10,fontSize:80,opacity:0.15}}>💰</div>
              <div style={{fontSize:12,opacity:0.85,marginBottom:4}}>Mesada mensual</div>
              <div style={{fontWeight:900,fontSize:36}}>${fmtN(user.allowance)}</div>
              <div style={{display:"flex",justifyContent:"space-between",marginTop:14}}>
                <div><div style={{fontWeight:700,fontSize:14}}>${fmtN(user.allowanceSpent)}</div><div style={{fontSize:11,opacity:0.8}}>Gastado</div></div>
                <div style={{textAlign:"right"}}><div style={{fontWeight:700,fontSize:14}}>${fmtN(user.allowance-user.allowanceSpent)}</div><div style={{fontSize:11,opacity:0.8}}>Disponible</div></div>
              </div>
              <div style={{height:7,borderRadius:7,background:"rgba(255,255,255,0.3)",overflow:"hidden",marginTop:10}}>
                <div style={{height:"100%",borderRadius:7,width:`${allowancePct}%`,background:"white"}}/>
              </div>
            </div>
            {/* 50/30/20 rule */}
            <div style={{background:C.card,borderRadius:18,padding:16,marginBottom:14,boxShadow:C.shadow}}>
              <div style={{fontWeight:800,fontSize:14,color:C.text,marginBottom:12}}>📐 Regla 50-30-20 aplicada</div>
              {[
                {l:"50% Necesidades",  val:Math.round(user.allowance*0.5), color:C.mint,  pct:50},
                {l:"30% Gustos",       val:Math.round(user.allowance*0.3), color:C.sky,   pct:30},
                {l:"20% Ahorro",       val:Math.round(user.allowance*0.2), color:C.gold,  pct:20},
              ].map((r,i)=>(
                <div key={i} style={{marginBottom:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:C.textMed,marginBottom:4}}>
                    <span style={{fontWeight:700}}>{r.l}</span><span style={{color:r.color,fontWeight:800}}>${fmtN(r.val)}</span>
                  </div>
                  <div style={{height:6,borderRadius:6,background:C.border,overflow:"hidden"}}>
                    <div style={{height:"100%",borderRadius:6,width:`${r.pct}%`,background:r.color}}/>
                  </div>
                </div>
              ))}
            </div>
            <div style={{background:C.mintLt,borderRadius:14,padding:14,fontSize:13,color:C.mintDk,fontWeight:600,lineHeight:1.5}}>
              💡 <b>Tip para conversar con {linkedStudents[0]?.name||"tu hijo"}:</b> "Si ahorras $1.000 de tu mesada cada mes, en 1 año tendrás $12.000. ¿Qué te gustaría comprar con eso?"
            </div>
          </div>
        )}

        {/* ── PARENT: CLAN CHAT ── */}
        {role===ROLES.PARENT&&tab==="clanchat"&&(
          <ChatView msgs={aMsgs} setMsgs={setAMsgs} isMe={m=>m.author===user.name} myAuthor={user.name} myAvatar={user.avatar} myRole="parent" onSend={t=>sendChatMsg(t,"adult")}
            input={chatInput} setInput={setChatInput} chatEndRef={chatEndRef} C={C}
            header={{title:"Chat adultos — Dragones del Norte",sub:"Solo padres y profesores",gradient:`linear-gradient(135deg,${C.gold},${C.goldDk})`}}
            locked={false}/>
        )}

        {/* ── PARENT: QR ── */}
        {role===ROLES.PARENT&&tab==="qrcode"&&(
          <div style={{padding:"16px 14px 100px"}}>
            <div style={{fontWeight:900,fontSize:22,color:C.text,marginBottom:4}}>Vincular hijos</div>
            <div style={{fontSize:13,color:C.textMed,marginBottom:18}}>Genera un código para que tu hijo se una a KidQuest bajo tu supervisión</div>

            {/* Generate new code */}
            <div style={{background:C.card,borderRadius:18,padding:18,marginBottom:14,boxShadow:C.shadow}}>
              <div style={{fontWeight:800,fontSize:15,color:C.text,marginBottom:6}}>Código de invitación</div>
              <div style={{fontSize:12,color:C.textMed,marginBottom:14,lineHeight:1.6}}>
                El código es válido por 7 días. Compártelo con tu hijo por WhatsApp o como prefieras. Solo funciona una vez.
              </div>
              <BtnMain onClick={generateInviteToken} disabled={generatingToken}
                bg={`linear-gradient(135deg,${C.mint},${C.mintDk})`} style={{width:"100%"}}>
                {generatingToken?"Generando…":"🔗 Generar código nuevo"}
              </BtnMain>
            </div>

            {/* Active codes */}
            {myInviteTokens.length>0&&(
              <div style={{background:C.card,borderRadius:18,padding:16,marginBottom:14,boxShadow:C.shadow}}>
                <div style={{fontWeight:800,fontSize:14,color:C.text,marginBottom:12}}>Códigos activos</div>
                {myInviteTokens.filter(t=>!t.used).slice(0,5).map(t=>(
                  <div key={t.id} style={{background:C.mintLt,borderRadius:14,padding:14,marginBottom:8}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                      <div style={{fontWeight:900,fontSize:24,letterSpacing:4,color:C.mintDk}}>{t.token}</div>
                      <button onClick={()=>{
                        navigator.clipboard?.writeText(t.token);
                        notify(`Código ${t.token} copiado`,"📋");
                      }} style={{background:C.mint,border:"none",borderRadius:9,padding:"6px 12px",color:"white",fontWeight:700,fontSize:12,cursor:"pointer"}}>
                        Copiar
                      </button>
                    </div>
                    <div style={{fontSize:11,color:C.textMed}}>
                      Vence: {new Date(t.expires_at).toLocaleDateString("es")} · {t.used?"Usado ✓":"Sin usar"}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Share via WhatsApp */}
            {myInviteTokens.filter(t=>!t.used)[0]&&(
              <a href={`https://wa.me/?text=¡Hola! Te invito a unirte a KidQuest 🦎. Descarga la app en kidquest-lime.vercel.app, regístrate como Estudiante y usa el código: ${myInviteTokens.filter(t=>!t.used)[0]?.token}`}
                target="_blank" rel="noopener noreferrer"
                style={{display:"block",width:"100%",padding:"13px",borderRadius:15,
                  background:"linear-gradient(135deg,#25D366,#128C7E)",
                  color:"white",fontWeight:800,fontSize:14,textAlign:"center",
                  textDecoration:"none",boxShadow:"0 4px 16px #25D36640"}}>
                📲 Compartir por WhatsApp
              </a>
            )}

            {/* Linked children */}
            {linkedStudents.length>0&&(
              <div style={{background:C.card,borderRadius:18,padding:16,marginTop:14,boxShadow:C.shadow}}>
                <div style={{fontWeight:800,fontSize:14,color:C.text,marginBottom:12}}>✅ Hijos vinculados ({linkedStudents.length})</div>
                {linkedStudents.map(s=>(
                  <div key={s.id} style={{display:"flex",gap:10,alignItems:"center",padding:"8px 0",borderBottom:`1px solid ${C.border}`}}>
                    <div style={{width:36,height:36,borderRadius:"50%",background:C.mintLt,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",flexShrink:0}}>
                      <KQIcon id={s.avatar||"a_cub"} size={32}/>
                    </div>
                    <div>
                      <div style={{fontWeight:700,fontSize:13,color:C.text}}>{s.name}</div>
                      <div style={{fontSize:11,color:C.textMed}}>Nivel {s.level}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TEACHER: PANEL ── */}
        {role===ROLES.TEACHER&&tab==="panel"&&(
          <div style={{padding:"16px 14px 0"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <div style={{fontWeight:800,fontSize:20,color:C.text}}>Panel docente</div>
              <div style={{display:"flex",gap:6}}>
                <button onClick={()=>setShowTaskCreator(true)} style={{background:C.mintLt,border:`1.5px solid ${C.mint}`,borderRadius:11,padding:"6px 10px",color:C.mintDk,fontSize:11,fontWeight:700,cursor:"pointer"}}>+ Misión</button>
                <button onClick={()=>{setAssignStep("pick");setSelectedStudents([]);setShowChallengeAssign(true);}} style={{background:C.goldLt,border:`1.5px solid ${C.gold}`,borderRadius:11,padding:"6px 10px",color:C.goldDk,fontSize:11,fontWeight:700,cursor:"pointer"}}>🎯 Desafío</button>
                <button onClick={()=>notify("Reporte PDF listo para compartir","📊")} style={{background:C.skyLt,border:`1.5px solid ${C.sky}`,borderRadius:11,padding:"6px 10px",color:C.sky,fontSize:11,fontWeight:700,cursor:"pointer"}}>📊 PDF</button>
                <button onClick={()=>setShowLinkTutor(true)} style={{background:`linear-gradient(135deg,${C.mint},${C.mintDk})`,border:"none",borderRadius:11,padding:"6px 10px",color:"white",fontSize:11,fontWeight:700,cursor:"pointer"}}>🔗</button>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:14}}>
              {[{e:"👦",l:"Alumnos",v:28,c:C.mint},{e:"✅",l:"Activos hoy",v:21,c:C.mintDk},{e:"⚖️",l:"Apelaciones",v:4,c:C.purple}].map((s,i)=>(
                <div key={i} style={{background:C.card,borderRadius:14,padding:"12px 8px",textAlign:"center",boxShadow:C.shadow}}>
                  <div style={{fontSize:24}}>{s.e}</div>
                  <div style={{fontWeight:900,fontSize:20,color:s.c}}>{s.v}</div>
                  <div style={{fontSize:9,color:C.textMed}}>{s.l}</div>
                </div>
              ))}
            </div>

            {/* analytics */}
            <div style={{background:C.card,borderRadius:16,padding:14,marginBottom:12,boxShadow:C.shadow}}>
              <div style={{fontWeight:800,fontSize:14,color:C.text,marginBottom:11}}>📊 Analytics del curso</div>
              {[
                {label:"Completitud de tareas",val:"74%",color:C.mint,pct:74},
                {label:"Intentos prom. de verificación",val:"1.4",color:C.sky,pct:40},
                {label:"Alumnos con racha activa",val:"18/28",color:C.gold,pct:64},
                {label:"Lecciones completadas (prom.)",val:"2.3/6",color:C.purple,pct:38},
              ].map((s,i)=>(
                <div key={i} style={{marginBottom:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}>
                    <span style={{color:C.textMed}}>{s.label}</span>
                    <span style={{fontWeight:800,color:s.color}}>{s.val}</span>
                  </div>
                  <div style={{height:5,borderRadius:5,background:C.border,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${s.pct}%`,background:s.color,borderRadius:5}}/>
                  </div>
                </div>
              ))}
              <div style={{marginTop:8,background:C.coralLt,border:`1.5px solid ${C.coral}30`,borderRadius:11,padding:"9px 12px",fontSize:12,color:C.coral}}>
                ⚠️ <b>Mayor dificultad:</b> "Interés compuesto" — 68% quiz incorrecto
              </div>
            </div>

            <div style={{background:C.card,borderRadius:18,padding:16,marginBottom:12,boxShadow:C.shadow}}>
              <div style={{fontWeight:800,fontSize:14,color:C.text,marginBottom:12}}>🏆 Ranking 5to B</div>
              {CLAN.members.map((m,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:i<4?`1px solid ${C.border}`:"none"}}>
                  <div style={{fontWeight:900,fontSize:16,color:["#F5C518","#B0B0B0","#CD7F32","#CBD5E0","#CBD5E0"][i],minWidth:22}}>{"🥇🥈🥉".split("")[i]||`#${i+1}`}</div>
                  <div style={{width:30,height:30,borderRadius:"50%",background:C.mintLt,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17}}>{m.avatar}</div>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700,fontSize:13,color:C.text}}>{m.name}</div>
                    <div style={{fontSize:11,color:C.textMed}}>{m.tasks} tareas · 🔥{m.streak}d</div>
                  </div>
                  <div style={{fontWeight:800,color:C.goldDk,fontSize:12}}>🏆{m.trophies}</div>
                </div>
              ))}
            </div>
            <button onClick={()=>notify("Reporte exportado como Excel 📊","📤")} style={{width:"100%",padding:"12px",borderRadius:14,border:`1.5px solid ${C.border}`,background:C.card,color:C.textMed,cursor:"pointer",fontWeight:700,fontSize:13}}>
              📊 Exportar informe del curso (Excel/PDF)
            </button>
          </div>
        )}

        {/* ── TEACHER: ASSIGN ── */}
        {role===ROLES.TEACHER&&tab==="assign"&&(
          <div style={{padding:"16px 14px 0"}}>
            <div style={{fontWeight:800,fontSize:20,color:C.text,marginBottom:14}}>Asignar misiones</div>
            {assignedM.length>0&&(
              <div style={{background:C.mintLt,border:`1.5px solid ${C.mint}`,borderRadius:14,padding:"12px 14px",marginBottom:14}}>
                <div style={{fontWeight:700,color:C.mintDk,fontSize:13,marginBottom:5}}>✅ Asignadas al 5to B ({assignedM.length})</div>
                {assignedM.map(id=>{const m=MISSIONS_BANK.find(x=>x.id===id);return m&&<div key={id} style={{fontSize:12,color:C.textMed}}>{m.emoji} {m.title}</div>;})}
              </div>
            )}
            {MISSIONS_BANK.map(m=>{
              const on=assignedM.includes(m.id);
              return (
                <div key={m.id} style={{background:C.card,borderRadius:16,padding:"13px 14px",marginBottom:10,boxShadow:C.shadow,border:`1.5px solid ${on?C.mint:C.border}`}}>
                  <div style={{display:"flex",alignItems:"center",gap:11}}>
                    <div style={{width:42,height:42,borderRadius:12,background:C.mintLt,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{m.emoji}</div>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:800,fontSize:14,color:C.text}}>{m.title}</div>
                      <div style={{fontSize:11,color:C.textMed,marginBottom:5}}>{m.desc}</div>
                      <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                        <Chip label={FL[m.freq]} bg={FC[m.freq]+"18"} color={FC[m.freq]}/>
                        <Chip label={`⭐${m.xp}`} bg={C.goldLt} color={C.goldDk}/>
                      </div>
                    </div>
                    <button onClick={()=>{on?setAssignedM(p=>p.filter(x=>x!==m.id)):setAssignedM(p=>[...p,m.id]); notify(on?"Misión removida":"¡Misión asignada!",on?"🗑️":"✅");}}
                      style={{padding:"8px 11px",borderRadius:12,border:`1.5px solid ${on?C.mint:C.border}`,background:on?C.mintLt:C.card,color:on?C.mintDk:C.textMed,cursor:"pointer",fontWeight:800,fontSize:12,whiteSpace:"nowrap"}}>
                      {on?"✓ Asignada":"+ Asignar"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── TEACHER: RANKING ── */}
        {role===ROLES.TEACHER&&tab==="ranking"&&(
          <div style={{padding:"16px 14px 0"}}>
            <div style={{fontWeight:800,fontSize:20,color:C.text,marginBottom:14}}>Ranking interescolar</div>
            <div style={{background:C.mintLt,borderRadius:14,padding:"10px 14px",marginBottom:14,fontSize:12,color:C.mintDk,fontWeight:600}}>
              🤖 Solo cuentan tareas verificadas · Sistema anti-trampa activo
            </div>
            {SCHOOL_RANK.map((s,i)=>(
              <div key={i} style={{background:C.card,borderRadius:16,padding:"13px 14px",marginBottom:10,display:"flex",alignItems:"center",gap:11,boxShadow:i===0?C.shadowMd:C.shadow,border:`1.5px solid ${i===0?C.gold+"60":C.border}`}}>
                <div style={{fontWeight:900,fontSize:20,color:["#F5C518","#B0B0B0","#CD7F32","#CBD5E0","#CBD5E0"][i],minWidth:24}}>{"🥇🥈🥉".split("")[i]||`#${i+1}`}</div>
                <div style={{fontSize:24}}>{s.e}</div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:800,fontSize:14,color:i===0?C.goldDk:C.text}}>{s.school}</div>
                  <div style={{fontSize:11,color:C.textMed}}>{s.course}</div>
                </div>
                <div style={{fontWeight:800,color:C.mint,fontSize:14}}>{fmtN(s.pts)}</div>
              </div>
            ))}
          </div>
        )}

        {/* ── TEACHER: CHAT ── */}
        {role===ROLES.TEACHER&&tab==="tchat"&&(
          <ChatView msgs={aMsgs} setMsgs={setAMsgs} isMe={m=>m.author===user.name} myAuthor={user.name} myAvatar={user.avatar} myRole="teacher" onSend={t=>sendChatMsg(t,"adult")}
            input={chatInput} setInput={setChatInput} chatEndRef={chatEndRef} C={C}
            header={{title:"Chat adultos del clan",sub:"Padres y profesores · 5to B",gradient:`linear-gradient(135deg,${C.sky},#2d8fd4)`}}
            quickReplies={["📢 Recordatorio","✅ ¡Bien hecho!","📊 Reporte","🎯 Nueva misión"]}
            onQuick={txt=>{setAMsgs(p=>[...p,{id:Date.now(),author:user.name,avatar:user.avatar,role:"teacher",text:txt.split(" ").slice(1).join(" ")||txt,time:now_t(),system:false}]);}}
            locked={false}/>
        )}
      </div>


      {/* ════ STORE TAB ════ */}
      {tab==="store"&&(
        <div style={{padding:"16px 14px 100px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <div style={{fontWeight:900,fontSize:22,color:C.text}}>Tienda</div>
            <div className="gem-badge">💎 {user.gems}</div>
          </div>

          {/* Coming soon banner */}
          <div style={{background:`linear-gradient(135deg,${C.purple},${C.sky})`,borderRadius:22,padding:28,textAlign:"center",marginBottom:18,position:"relative",overflow:"hidden",boxShadow:`0 8px 32px ${C.purple}40`}}>
            <div style={{position:"absolute",inset:0,background:"rgba(255,255,255,0.05)",backdropFilter:"blur(1px)"}}/>
            <div style={{position:"relative"}}>
              <div style={{fontSize:56,marginBottom:10}} className="float">🏗️</div>
              <div style={{fontWeight:900,fontSize:22,color:"white",marginBottom:6}}>¡Pronto estará habilitada esta zona!</div>
              <div style={{fontSize:14,color:"rgba(255,255,255,0.85)",lineHeight:1.6,marginBottom:16}}>
                Estamos construyendo la tienda de cristales de KidQuest.<br/>
                Muy pronto podrás comprar paquetes especiales para acelerar tu progreso.
              </div>
              <div style={{display:"inline-flex",alignItems:"center",gap:8,background:"rgba(255,255,255,0.2)",borderRadius:20,padding:"8px 18px"}}>
                <span style={{fontSize:14}}>🔔</span>
                <span style={{fontSize:13,color:"white",fontWeight:700}}>Te avisaremos cuando esté lista</span>
              </div>
            </div>
          </div>

          {/* Preview packages */}
          <div style={{fontWeight:800,fontSize:15,color:C.text,marginBottom:12}}>Vista previa — Paquetes de cristales</div>
          {[
            {name:"Bolsita",     gems:100,  price:"$0.99",  icon:"💎", color:C.sky},
            {name:"Cofre",       gems:550,  price:"$4.99",  icon:"📦", color:C.mint,  bonus:"+ 50 💎 gratis"},
            {name:"Saco",        gems:1200, price:"$9.99",  icon:"🎒", color:C.purple, bonus:"+ 200 💎 gratis"},
            {name:"Legendario",  gems:2500, price:"$19.99", icon:"🏆", color:C.gold,   bonus:"+ 500 💎 gratis", best:true},
          ].map((p,i)=>(
            <div key={i} style={{background:C.card,borderRadius:18,padding:16,marginBottom:10,
              boxShadow:p.best?`0 4px 20px ${C.gold}40`:C.shadow,
              border:`2px solid ${p.best?C.gold:C.border}`,position:"relative",overflow:"hidden"}}>
              {p.best&&<div style={{position:"absolute",top:0,right:0,background:C.gold,color:"white",fontSize:10,fontWeight:800,padding:"4px 12px",borderRadius:"0 18px 0 12px"}}>⭐ MEJOR VALOR</div>}
              <div style={{display:"flex",alignItems:"center",gap:14}}>
                <div style={{width:52,height:52,borderRadius:14,background:p.color+"20",border:`2px solid ${p.color}40`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,flexShrink:0}}>{p.icon}</div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:800,fontSize:15,color:C.text}}>{p.name}</div>
                  <div style={{fontWeight:900,fontSize:18,color:p.color}}>{p.gems.toLocaleString()} 💎</div>
                  {p.bonus&&<div style={{fontSize:11,color:C.mint,fontWeight:700}}>{p.bonus}</div>}
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontWeight:900,fontSize:18,color:C.text}}>{p.price}</div>
                  <div style={{background:C.border,borderRadius:10,padding:"6px 14px",fontSize:12,color:C.textMed,fontWeight:700,marginTop:4,cursor:"not-allowed"}}>Pronto</div>
                </div>
              </div>
            </div>
          ))}
          <div style={{background:C.goldLt,borderRadius:14,padding:"12px 16px",fontSize:12,color:C.goldDk,fontWeight:600,textAlign:"center"}}>
            💡 Los cristales gratis se ganan completando misiones y subiendo de nivel. ¡Nunca necesitas comprar para disfrutar KidQuest!
          </div>
        </div>
      )}

      {/* ════ ADMIN PANEL ════ */}
      {tab==="admin"&&user.isAdmin&&(
        <div style={{padding:"16px 14px 100px"}}>
          {/* Header */}
          <div style={{background:`linear-gradient(135deg,${C.purple},${C.sky})`,borderRadius:20,padding:16,marginBottom:16,color:"white",position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",right:-10,top:-10,fontSize:60,opacity:0.1}}>⚙️</div>
            <div style={{fontWeight:900,fontSize:20}}>Panel de Administración</div>
            <div style={{fontSize:12,opacity:0.85,marginTop:2}}>{user.isMaster?"👑 Maestro":"⚙️ Admin"} · {user.name} · @{user.username}</div>
          </div>

          {/* Admin sub-tabs */}
          <div style={{display:"flex",gap:7,marginBottom:16,overflowX:"auto",paddingBottom:4}}>
            {[
              {id:"users",   l:"Usuarios",  icon:"👥"},
              {id:"reports", l:"Reportes",  icon:"🚨"},
              {id:"gifts",   l:"Regalos",   icon:"🎁"},
              {id:"ranking", l:"Ranking",   icon:"🏆"},
              ...(user.isMaster?[{id:"admins",l:"Admins",icon:"⭐"}]:[]),
            ].map(t=>(
              <button key={t.id} onClick={async()=>{
                setAdminTab(t.id);
                setAdminLoading(true);
                try {
                  const {supabase} = await import("./supabase.js");
                  if(t.id==="users"||t.id==="ranking"||t.id==="admins"||t.id==="gifts") {
                    const {data} = await supabase
                      .from("profiles")
                      .select("id,name,username,role,age_years,is_minor,gems,coins,xp,level,streak,account_status,admin_role,created_at,avatar_key,email_verified")
                      .order(t.id==="ranking"?"xp":"created_at",{ascending:false})
                      .limit(200);
                    setAdminUsers(data||[]);
                  }
                  if(t.id==="reports") {
                    const {data} = await supabase.from("reports").select("*").order("created_at",{ascending:false}).limit(50);
                    setAdminReports(data||[]);
                  }
                } catch(e){ notify("Error cargando datos","⚠️"); }
                setAdminLoading(false);
              }} style={{flexShrink:0,padding:"8px 14px",borderRadius:13,border:`2px solid ${adminTab===t.id?C.purple:C.border}`,background:adminTab===t.id?C.purpleLt:C.card,cursor:"pointer",fontWeight:700,fontSize:12,color:adminTab===t.id?C.purple:C.textMed,display:"flex",gap:5,alignItems:"center"}}>
                <span>{t.icon}</span>{t.l}
              </button>
            ))}
          </div>

          {adminLoading&&<div style={{textAlign:"center",padding:20,color:C.textMed}}>Cargando…</div>}

          {/* USERS tab */}
          {adminTab==="users"&&!adminLoading&&(
            <div>
              <input value={adminSearch} onChange={e=>setAdminSearch(e.target.value)}
                placeholder="Buscar por nombre o email…"
                style={{width:"100%",padding:"11px 14px",borderRadius:12,border:`1.5px solid ${C.border}`,fontSize:13,color:C.text,background:C.card,outline:"none",marginBottom:12}}/>
              {(adminUsers.filter(u=>!adminSearch||u.name?.toLowerCase().includes(adminSearch.toLowerCase())||u.username?.includes(adminSearch))).map(u=>(
                <div key={u.id} style={{background:C.card,borderRadius:14,padding:"12px 14px",marginBottom:8,boxShadow:C.shadow,border:`1.5px solid ${u.account_status==="banned"?C.coral:u.admin_role!=="none"?C.purple:C.border}`}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div style={{display:"flex",gap:9,alignItems:"center"}}>
                      <div style={{width:40,height:40,borderRadius:"50%",background:u.is_minor?`linear-gradient(135deg,${C.purple}80,${C.purpleLt})`:`linear-gradient(135deg,${C.mint},${C.mintDk})`,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",flexShrink:0}}>
                        <KQIcon id={u.avatar_key||"a_cub"} size={36}/>
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontWeight:800,fontSize:13,color:C.text}}>{u.name||"Sin nombre"}</div>
                        <div style={{fontSize:10,color:C.textMed}}>@{u.username||"—"} · {u.age_years||"?"}a · Nv.{u.level||1}</div>
                        <div style={{display:"flex",gap:3,marginTop:3,flexWrap:"wrap"}}>
                          <span style={{background:u.role==="student"?C.mintLt:u.role==="parent"?C.goldLt:C.skyLt,color:u.role==="student"?C.mintDk:u.role==="parent"?C.goldDk:C.sky,fontSize:9,fontWeight:800,borderRadius:6,padding:"2px 5px"}}>{u.role==="student"?"🎮 Niño":u.role==="parent"?"👨‍👩‍👦 Padre":"🏫 Profe"}</span>
                          <span style={{background:u.is_minor?C.purpleLt:C.mintLt,color:u.is_minor?C.purple:C.mintDk,fontSize:9,fontWeight:700,borderRadius:6,padding:"2px 5px"}}>{u.is_minor?"Menor":"Adulto"}</span>
                          {u.admin_role&&u.admin_role!=="none"&&<span style={{background:C.purpleLt,color:C.purple,fontSize:9,fontWeight:700,borderRadius:6,padding:"2px 5px"}}>⭐{u.admin_role}</span>}
                          <span style={{background:u.account_status==="active"?C.mintLt:u.account_status==="banned"?C.coralLt:C.goldLt,color:u.account_status==="active"?C.mintDk:u.account_status==="banned"?C.coral:C.goldDk,fontSize:9,fontWeight:700,borderRadius:6,padding:"2px 5px"}}>{u.account_status==="active"?"✅ Activo":u.account_status==="suspended"?"⏸ Suspendido":"🚫 "+u.account_status}</span>
                        </div>
                      </div>
                    </div>
                    <div style={{display:"flex",gap:5,flexWrap:"wrap",justifyContent:"flex-end"}}>
                      <button onClick={()=>{setGiftUser(u);setAdminTab("gifts")}}
                        style={{padding:"5px 9px",borderRadius:9,border:`1.5px solid ${C.gold}`,background:C.goldLt,color:C.goldDk,fontSize:10,fontWeight:700,cursor:"pointer"}}>🎁</button>
                      {user.isMaster&&u.id!==userId&&(
                        <>
                          <button onClick={async()=>{
                            const newStatus = u.account_status==="active"?"suspended":"active";
                            const {supabase}=await import("./supabase.js");
                            await supabase.from("profiles").update({account_status:newStatus}).eq("id",u.id);
                            setAdminUsers(p=>p.map(x=>x.id===u.id?{...x,account_status:newStatus}:x));
                            notify(`Usuario ${newStatus==="active"?"activado":"suspendido"}`,"⚙️");
                          }} style={{padding:"5px 9px",borderRadius:9,border:`1.5px solid ${C.coral}`,background:C.coralLt,color:C.coral,fontSize:10,fontWeight:700,cursor:"pointer"}}>
                            {u.account_status==="active"?"🚫 Susp.":"✅ Activ."}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <div style={{display:"flex",gap:10,marginTop:8,fontSize:11,color:C.textMed}}>
                    <span>💎 {u.gems||0}</span>
                    <span>⭐ {u.xp||0} XP</span>
                    <span>🔥 {u.streak||0}d</span>
                    <span>📅 {u.created_at?new Date(u.created_at).toLocaleDateString("es"):"—"}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* REPORTS tab */}
          {adminTab==="reports"&&!adminLoading&&(
            <div>
              {adminReports.length===0&&<div style={{textAlign:"center",padding:24,color:C.textMed}}>No hay reportes pendientes ✓</div>}
              {adminReports.map(r=>(
                <div key={r.id} style={{background:C.card,borderRadius:14,padding:14,marginBottom:10,boxShadow:C.shadow,border:`2px solid ${r.status==="pending"?C.coral:C.border}`}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                    <div style={{fontWeight:800,fontSize:13,color:C.text}}>{r.report_type?.replace(/_/g," ")}</div>
                    <span style={{background:r.status==="pending"?C.coralLt:C.mintLt,color:r.status==="pending"?C.coral:C.mintDk,fontSize:10,fontWeight:700,borderRadius:8,padding:"2px 8px"}}>{r.status}</span>
                  </div>
                  <div style={{fontSize:12,color:C.textMed,marginBottom:10,lineHeight:1.5}}>{r.description}</div>
                  <div style={{fontSize:10,color:C.textLt,marginBottom:10}}>📅 {new Date(r.created_at).toLocaleDateString("es")}</div>
                  {r.status==="pending"&&(
                    <div style={{display:"flex",gap:7}}>
                      <button onClick={async()=>{
                        const {supabase}=await import("./supabase.js");
                        await supabase.from("reports").update({status:"resolved",admin_notes:"Revisado y resuelto",resolved_by:userId,resolved_at:new Date().toISOString()}).eq("id",r.id);
                        setAdminReports(p=>p.map(x=>x.id===r.id?{...x,status:"resolved"}:x));
                        notify("Reporte resuelto","✅");
                      }} style={{flex:1,padding:"8px",borderRadius:10,border:`1.5px solid ${C.mint}`,background:C.mintLt,color:C.mintDk,fontWeight:700,fontSize:12,cursor:"pointer"}}>✅ Resolver</button>
                      <button onClick={async()=>{
                        const {supabase}=await import("./supabase.js");
                        await supabase.from("reports").update({status:"dismissed",resolved_by:userId}).eq("id",r.id);
                        setAdminReports(p=>p.map(x=>x.id===r.id?{...x,status:"dismissed"}:x));
                        notify("Reporte descartado","🗑️");
                      }} style={{flex:1,padding:"8px",borderRadius:10,border:`1.5px solid ${C.border}`,background:C.card,color:C.textMed,fontWeight:700,fontSize:12,cursor:"pointer"}}>🗑️ Descartar</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* GIFTS tab */}
          {adminTab==="gifts"&&!adminLoading&&(
            <div>
              <div style={{fontWeight:800,fontSize:15,color:C.text,marginBottom:12}}>🎁 Regalar a usuario</div>
              {!giftUser?(
                <div>
                  <div style={{fontSize:13,color:C.textMed,marginBottom:10}}>Selecciona un usuario para regalar:</div>
                  {adminUsers.map(u=>(
                    <button key={u.id} onClick={()=>setGiftUser(u)}
                      style={{width:"100%",padding:"11px 14px",marginBottom:7,borderRadius:13,border:`1.5px solid ${C.border}`,background:C.card,display:"flex",gap:10,alignItems:"center",cursor:"pointer",textAlign:"left"}}>
                      <div style={{width:32,height:32,borderRadius:"50%",background:C.mintLt,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",flexShrink:0}}>
                        <KQIcon id={u.avatar_key||"a_cub"} size={28}/>
                      </div>
                      <div>
                        <div style={{fontWeight:700,fontSize:13,color:C.text}}>{u.name}</div>
                        <div style={{fontSize:10,color:C.textMed}}>@{u.username} · 💎{u.gems||0}</div>
                      </div>
                    </button>
                  ))}
                </div>
              ):(
                <div>
                  <div style={{background:C.purpleLt,borderRadius:13,padding:12,marginBottom:14,display:"flex",gap:10,alignItems:"center"}}>
                    <div style={{width:36,height:36,borderRadius:"50%",background:C.mintLt,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",flexShrink:0}}>
                      <KQIcon id={giftUser.avatar_key||"a_cub"} size={32}/>
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:800,fontSize:14,color:C.text}}>{giftUser.name}</div>
                      <div style={{fontSize:11,color:C.textMed}}>@{giftUser.username}</div>
                    </div>
                    <button onClick={()=>setGiftUser(null)} style={{background:"none",border:"none",color:C.textMed,cursor:"pointer",fontSize:18}}>✕</button>
                  </div>
                  <div style={{marginBottom:11}}>
                    <div style={{fontSize:12,fontWeight:700,color:C.textMed,marginBottom:6}}>Tipo de regalo</div>
                    <div style={{display:"flex",gap:7}}>
                      {[{id:"gems",l:"💎 Cristales"},{id:"coins",l:"💰 Monedas"},{id:"xp",l:"⭐ XP"}].map(t=>(
                        <button key={t.id} onClick={()=>setGiftType(t.id)}
                          style={{flex:1,padding:"9px 6px",borderRadius:11,border:`2px solid ${giftType===t.id?C.purple:C.border}`,background:giftType===t.id?C.purpleLt:C.card,cursor:"pointer",fontWeight:700,fontSize:12,color:giftType===t.id?C.purple:C.textMed}}>
                          {t.l}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={{marginBottom:11}}>
                    <div style={{fontSize:12,fontWeight:700,color:C.textMed,marginBottom:6}}>Cantidad</div>
                    <input type="number" value={giftAmount} onChange={e=>setGiftAmount(Number(e.target.value))} min="1" max="99999"
                      style={{width:"100%",padding:"11px 14px",borderRadius:12,border:`1.5px solid ${C.border}`,fontSize:16,fontWeight:700,color:C.text,background:C.card,outline:"none"}}/>
                  </div>
                  <div style={{marginBottom:16}}>
                    <div style={{fontSize:12,fontWeight:700,color:C.textMed,marginBottom:6}}>Mensaje (opcional)</div>
                    <input value={giftMsg} onChange={e=>setGiftMsg(e.target.value)} placeholder="¡Sigue así campeón!"
                      style={{width:"100%",padding:"11px 14px",borderRadius:12,border:`1.5px solid ${C.border}`,fontSize:13,color:C.text,background:C.card,outline:"none"}}/>
                  </div>
                  <BtnMain onClick={async()=>{
                    try {
                      const {supabase}=await import("./supabase.js");
                      const updates={};
                      if(giftType==="gems")  updates.gems  =(giftUser.gems||0)+giftAmount;
                      if(giftType==="coins") updates.coins =(giftUser.coins||0)+giftAmount;
                      if(giftType==="xp")    updates.xp    =(giftUser.xp||0)+giftAmount;
                      await supabase.from("profiles").update(updates).eq("id",giftUser.id);
                      await supabase.from("gifts").insert({from_admin:userId,to_user:giftUser.id,gift_type:giftType,amount:giftAmount,message:giftMsg});
                      setAdminUsers(p=>p.map(u=>u.id===giftUser.id?{...u,...updates}:u));
                      notify(`🎁 Regalo enviado a ${giftUser.name}`,"✅");
                      setGiftUser(null); setGiftAmount(100); setGiftMsg("");
                    } catch(e){ notify("Error al enviar regalo","⚠️"); }
                  }} bg={`linear-gradient(135deg,${C.gold},${C.goldDk})`} style={{width:"100%"}}>
                    🎁 Enviar regalo
                  </BtnMain>
                </div>
              )}
            </div>
          )}

          {/* RANKING tab */}
          {adminTab==="ranking"&&!adminLoading&&(
            <div>
              <div style={{fontWeight:800,fontSize:15,color:C.text,marginBottom:12}}>🏆 Ranking global</div>
              {adminUsers.slice(0,20).map((u,i)=>(
                <div key={u.id} style={{background:i<3?`linear-gradient(135deg,${[C.gold,C.textLt,"#CD7F32"][i]}18,${C.card})`:C.card,borderRadius:13,padding:"11px 14px",marginBottom:7,boxShadow:C.shadow,display:"flex",gap:10,alignItems:"center",border:`1.5px solid ${i<3?[C.gold,C.textLt,"#CD7F32"][i]:C.border}30`}}>
                  <div style={{width:28,height:28,borderRadius:"50%",background:i<3?[C.gold,C.textLt,"#CD7F32"][i]:C.border,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:13,color:"white",flexShrink:0}}>
                    {i<3?["🥇","🥈","🥉"][i]:i+1}
                  </div>
                  <div style={{width:30,height:30,borderRadius:"50%",background:C.mintLt,overflow:"hidden",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <KQIcon id={u.avatar_key||"a_cub"} size={26}/>
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:800,fontSize:13,color:C.text}}>{u.name}</div>
                    <div style={{fontSize:10,color:C.textMed}}>@{u.username} · {u.role}</div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontWeight:900,fontSize:15,color:C.gold}}>{(u.xp||0).toLocaleString()} XP</div>
                    <div style={{fontSize:10,color:C.textMed}}>Nv.{u.level||1}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ADMINS tab (master only) */}
          {adminTab==="admins"&&user.isMaster&&!adminLoading&&(
            <div>
              <div style={{fontWeight:800,fontSize:15,color:C.text,marginBottom:12}}>⭐ Gestión de administradores</div>
              <div style={{background:C.goldLt,border:`1.5px solid ${C.gold}30`,borderRadius:12,padding:"10px 14px",marginBottom:14,fontSize:12,color:C.goldDk}}>
                💡 Solo el usuario Maestro puede asignar o revocar roles de administración
              </div>
              {adminUsers.map(u=>(
                <div key={u.id} style={{background:C.card,borderRadius:13,padding:"12px 14px",marginBottom:7,boxShadow:C.shadow,border:`1.5px solid ${u.admin_role!=="none"?C.purple:C.border}`}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div>
                      <div style={{fontWeight:800,fontSize:13,color:C.text}}>{u.name}</div>
                      <div style={{fontSize:10,color:C.textMed}}>@{u.username} · {u.role}</div>
                    </div>
                    {u.id!==userId&&(
                      <select value={u.admin_role||"none"} onChange={async(e)=>{
                        const newRole=e.target.value;
                        const {supabase}=await import("./supabase.js");
                        await supabase.from("profiles").update({admin_role:newRole}).eq("id",u.id);
                        setAdminUsers(p=>p.map(x=>x.id===u.id?{...x,admin_role:newRole}:x));
                        notify(`Rol de ${u.name} actualizado a ${newRole}`,"⭐");
                      }} style={{padding:"7px 10px",borderRadius:10,border:`1.5px solid ${C.purple}`,background:C.purpleLt,color:C.purple,fontWeight:700,fontSize:12,cursor:"pointer",outline:"none"}}>
                        <option value="none">Sin rol</option>
                        <option value="moderator">Moderador</option>
                        <option value="admin">Admin</option>
                        {u.admin_role==="master"&&<option value="master">Maestro</option>}
                      </select>
                    )}
                    {u.id===userId&&<span style={{fontSize:11,color:C.purple,fontWeight:700}}>👑 Tú</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}


      {/* ════ PERFIL TAB (parent + teacher) ════ */}
      {(role===ROLES.PARENT||role===ROLES.TEACHER)&&tab==="perfil"&&(
        <div style={{padding:"16px 14px 100px"}}>

          {/* Profile hero */}
          <div style={{background:`linear-gradient(135deg,${role===ROLES.PARENT?C.gold:C.sky},${role===ROLES.PARENT?C.goldDk:C.mintDk})`,borderRadius:22,padding:22,marginBottom:16,textAlign:"center",color:"white",position:"relative",overflow:"hidden",boxShadow:`0 6px 24px ${role===ROLES.PARENT?C.gold:C.sky}50`}}>
            <div style={{position:"absolute",right:-10,top:-10,fontSize:80,opacity:0.08}}>{role===ROLES.PARENT?"👨‍👩‍👦":"🏫"}</div>
            <div style={{width:80,height:80,borderRadius:"50%",background:"rgba(255,255,255,0.25)",margin:"0 auto 12px",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",border:"3px solid rgba(255,255,255,0.5)"}}>
              <KQIcon id={user.avatar||"a_buddy"} size={72}/>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8,justifyContent:"center",marginBottom:4}}>
              <div style={{fontWeight:900,fontSize:22}}>{user.name||"Sin nombre"}</div>
              <button onClick={()=>{setEditDisplayName(user.name||"");setEditUsername(user.username||"");setShowProfileEdit(true);}}
                style={{background:"rgba(255,255,255,0.25)",border:"1.5px solid rgba(255,255,255,0.4)",borderRadius:8,padding:"3px 8px",fontSize:10,fontWeight:700,color:"white",cursor:"pointer"}}>✏️</button>
            </div>
            {user.username&&<div style={{fontSize:12,opacity:0.8,marginBottom:4}}>@{user.username}</div>}
            <div style={{fontSize:12,opacity:0.85}}>{role===ROLES.PARENT?"Padre / Tutor":"Profesor"}</div>
          </div>

          {/* Stats */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:16}}>
            {[
              {l:"Cristales",v:`💎 ${user.gems}`,   c:C.sky},
              {l:"Monedas",  v:`💰 ${user.coins}`,  c:C.gold},
              {l:"Vinculados",v:`👦 ${linkedStudents.length}`, c:C.mint},
            ].map((s,i)=>(
              <div key={i} style={{background:C.card,borderRadius:14,padding:"12px 8px",textAlign:"center",boxShadow:C.shadow}}>
                <div style={{fontWeight:900,fontSize:16,color:s.c}}>{s.v}</div>
                <div style={{fontSize:10,color:C.textMed,marginTop:2}}>{s.l}</div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div style={{background:C.card,borderRadius:18,overflow:"hidden",boxShadow:C.shadow,marginBottom:12}}>
            {[
              {icon:"✏️", label:"Editar nombre y usuario", action:()=>{setEditDisplayName(user.name||"");setEditUsername(user.username||"");setShowProfileEdit(true);}},
              {icon:"🎨", label:"Cambiar avatar", action:()=>setShowAvatarEditor(true)},
              {icon:"🔗", label:"Generar código de invitación", action:()=>setTab("qrcode")},
              {icon:"🔔", label:"Solicitudes de vinculación", action:()=>setTab("validate")},
              {icon:"🌙", label:dark?"Modo claro":"Modo oscuro", action:()=>setDark(d=>!d)},
            ].map((item,i)=>(
              <button key={i} onClick={item.action} style={{width:"100%",padding:"14px 18px",border:"none",borderBottom:`1px solid ${C.border}`,background:"none",display:"flex",alignItems:"center",gap:14,cursor:"pointer",textAlign:"left",fontFamily:"'Nunito',sans-serif"}}>
                <span style={{fontSize:20,flexShrink:0}}>{item.icon}</span>
                <span style={{fontSize:14,fontWeight:600,color:C.text,flex:1}}>{item.label}</span>
                <span style={{color:C.textLt}}>›</span>
              </button>
            ))}
          </div>

          {/* Admin access */}
          {user.isAdmin&&(
            <button onClick={()=>setTab("admin")} style={{width:"100%",background:`linear-gradient(135deg,${C.purple}15,${C.sky}10)`,border:`2px solid ${C.purple}40`,borderRadius:16,padding:"13px 18px",marginBottom:12,display:"flex",alignItems:"center",gap:12,cursor:"pointer",boxShadow:C.shadow}}>
              <span style={{fontSize:22}}>⚙️</span>
              <div style={{flex:1,textAlign:"left"}}>
                <div style={{fontWeight:800,fontSize:14,color:C.purple}}>Panel de Administración</div>
                <div style={{fontSize:11,color:C.textMed}}>{user.isMaster?"👑 Maestro":"Admin"} · Control total</div>
              </div>
              <span style={{color:C.purple}}>›</span>
            </button>
          )}

          {/* Report + Sign out */}
          <button onClick={()=>setShowReport(true)} style={{width:"100%",background:C.card,border:`1.5px solid ${C.border}`,borderRadius:14,padding:"12px 18px",marginBottom:8,display:"flex",alignItems:"center",gap:12,cursor:"pointer",boxShadow:C.shadow}}>
            <span style={{fontSize:20}}>🚨</span>
            <span style={{fontSize:13,fontWeight:600,color:C.text,flex:1}}>Reportar conducta inapropiada</span>
            <span style={{color:C.textLt}}>›</span>
          </button>
          {onSignOut&&(
            <button onClick={()=>onSignOut()} style={{width:"100%",background:C.coralLt,border:`1.5px solid ${C.coral}30`,borderRadius:14,padding:"12px 18px",display:"flex",alignItems:"center",gap:12,cursor:"pointer"}}>
              <span style={{fontSize:20}}>🚪</span>
              <span style={{fontSize:13,fontWeight:700,color:C.coral,flex:1}}>Cerrar sesión</span>
            </button>
          )}
        </div>
      )}

      {/* ════ BOTTOM NAV ════ */}
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,background:C.card,borderTop:`1.5px solid ${C.border}`,display:"flex",justifyContent:"space-around",padding:"10px 0 16px",zIndex:200,boxShadow:`0 -4px 24px ${C.mint}18`}}>
        {currentTabs.map(t=>{
          const a=tab===t.id;
          const fn=NAV[t.id];
          return(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2,padding:"3px 8px",transition:"all 0.18s"}}>
              <div style={{transform:a?"scale(1.18)":"scale(1)",transition:"all 0.22s cubic-bezier(0.34,1.56,0.64,1)"}}>
                {fn?fn(a,C):null}
              </div>
              <div style={{fontSize:9,fontWeight:700,color:a?C.mint:C.textLt,transition:"color 0.15s"}}>{t.l}</div>
              {a&&<div style={{width:4,height:4,borderRadius:"50%",background:C.mint,boxShadow:`0 0 5px ${C.mint}`}}/>}
            </button>
          );
        })}
      </div>
    </Shell>
  );
}

// ═══════════════════════════════════════════════════════════
// SHARED COMPONENTS
// ═══════════════════════════════════════════════════════════


function RarDot({r}){
  const cols={common:"#8FA8A2",uncommon:"#4DC9A0",rare:"#4AAEE8",epic:"#8B6BE8",legendary:"#F5C518"};
  const c=cols[r]||"#8FA8A2";
  if(r==="common")    return <svg width="10" height="10" viewBox="0 0 10 10"><circle cx="5" cy="5" r="4" fill={c} opacity="0.35" stroke={c} strokeWidth="1"/></svg>;
  if(r==="uncommon")  return <svg width="10" height="10" viewBox="0 0 10 10"><polygon points="5,1 6.2,3.8 9,3.8 6.9,5.7 7.6,8.5 5,7 2.4,8.5 3.1,5.7 1,3.8 3.8,3.8" fill={c} opacity="0.5" stroke={c} strokeWidth="0.5"/></svg>;
  if(r==="rare")      return <svg width="10" height="10" viewBox="0 0 10 10"><polygon points="5,1 6.2,3.8 9,3.8 6.9,5.7 7.6,8.5 5,7 2.4,8.5 3.1,5.7 1,3.8 3.8,3.8" fill={c} opacity="0.75" stroke={c} strokeWidth="0.5"/></svg>;
  if(r==="epic")      return <svg width="10" height="10" viewBox="0 0 10 10"><polygon points="5,1 6.2,3.8 9,3.8 6.9,5.7 7.6,8.5 5,7 2.4,8.5 3.1,5.7 1,3.8 3.8,3.8" fill={c} stroke="white" strokeWidth="0.6"/></svg>;
  return <svg width="12" height="12" viewBox="0 0 12 12"><defs><radialGradient id="rd_g"><stop stopColor="#FFE97A"/><stop offset="1" stopColor="#C89A00"/></radialGradient></defs><polygon points="6,1 7.2,4.3 10.8,4.3 7.9,6.5 9,10 6,8 3,10 4.1,6.5 1.2,4.3 4.8,4.3" fill="url(#rd_g)" stroke="white" strokeWidth="0.5"/></svg>;
}


// ═══════════════════════════════════════════════════════════
// TUTOR REQUESTS PANEL — parents see pending child requests
// ═══════════════════════════════════════════════════════════
function TutorRequestsPanel({userId, C, notify, onApprove}) {
  const [requests, setRequests] = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [loaded,   setLoaded]   = useState(false);

  useEffect(()=>{
    if(!userId) return;
    setLoading(true);
    import("./supabase.js").then(async({supabase})=>{
      try {
        // Get this parent's email
        const {data:{user}} = await supabase.auth.getUser();
        if(!user) return;
        // Get pending requests sent to this email
        const {data} = await supabase
          .from("tutor_requests")
          .select("*")
          .eq("tutor_email", user.email)
          .eq("status","pending");
        setRequests(data||[]);
        setLoaded(true);
      } catch(e){ console.warn("Tutor requests:", e.message); }
      setLoading(false);
    });
  },[userId]);

  if(loading) return <div style={{textAlign:"center",padding:"10px 0",fontSize:12,color:C.textMed}}>Cargando solicitudes…</div>;
  if(!requests.length) return null;

  const approve = async(req) => {
    import("./supabase.js").then(async({supabase})=>{
      try {
        // Link parent to child
        await supabase.from("parent_child").insert({parent_id:userId, child_id:req.child_id});
        // Activate child account
        await supabase.from("profiles").update({account_status:"active"}).eq("id",req.child_id);
        // Mark request as approved
        await supabase.from("tutor_requests").update({status:"approved",tutor_id:userId,resolved_at:new Date().toISOString()}).eq("id",req.id);
        setRequests(p=>p.filter(r=>r.id!==req.id));
        onApprove(req.child_id, req.child_name);
        notify(`✅ Vinculado con ${req.child_name}`,"🔗");
      } catch(e){ notify("Error: "+e.message,"⚠️"); }
    });
  };

  const reject = async(req) => {
    import("./supabase.js").then(async({supabase})=>{
      await supabase.from("tutor_requests").update({status:"rejected",resolved_at:new Date().toISOString()}).eq("id",req.id);
      setRequests(p=>p.filter(r=>r.id!==req.id));
      notify("Solicitud rechazada","❌");
    });
  };

  return (
    <div style={{background:C.goldLt,border:`2px solid ${C.gold}50`,borderRadius:16,padding:14,marginBottom:14}}>
      <div style={{fontWeight:800,fontSize:14,color:C.goldDk,marginBottom:10}}>
        🔔 Solicitudes de vinculación ({requests.length})
      </div>
      {requests.map(req=>(
        <div key={req.id} style={{background:C.card,borderRadius:12,padding:12,marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"center",gap:10}}>
          <div>
            <div style={{fontWeight:700,fontSize:13,color:C.text}}>{req.child_name}</div>
            <div style={{fontSize:11,color:C.textMed}}>Quiere vincularte como tutor</div>
            <div style={{fontSize:10,color:C.textLt}}>{new Date(req.created_at).toLocaleDateString("es")}</div>
          </div>
          <div style={{display:"flex",gap:6,flexShrink:0}}>
            <button onClick={()=>reject(req)} style={{padding:"6px 10px",borderRadius:9,border:`1.5px solid ${C.coral}`,background:C.coralLt,color:C.coral,fontSize:11,fontWeight:700,cursor:"pointer"}}>✗</button>
            <button onClick={()=>approve(req)} style={{padding:"6px 12px",borderRadius:9,border:"none",background:`linear-gradient(135deg,${C.mint},${C.mintDk})`,color:"white",fontSize:11,fontWeight:800,cursor:"pointer"}}>✅ Aceptar</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function Shell({C,children}){
  return <div style={{minHeight:"100vh",maxWidth:430,margin:"0 auto",fontFamily:"'Nunito',sans-serif",color:C.text,background:C.bg,position:"relative",overflow:"hidden"}}>{children}</div>;
}

function BtnMain({onClick,bg,style={},disabled=false,children}){
  return <button onClick={onClick} disabled={disabled}
    style={{padding:"13px 22px",borderRadius:16,border:"none",color:"white",fontFamily:"'Nunito',sans-serif",
      fontSize:15,fontWeight:800,cursor:disabled?"not-allowed":"pointer",
      transition:"all 0.2s cubic-bezier(0.34,1.56,0.64,1)",
      background:disabled?"#C0CCC8":bg,opacity:disabled?0.7:1,
      boxShadow:disabled?"none":"0 4px 16px rgba(0,0,0,0.18)",...style}}
    onMouseDown={e=>{if(!disabled)e.currentTarget.style.transform="scale(0.97)";}}
    onMouseUp={e=>{if(!disabled)e.currentTarget.style.transform="scale(1)";}}
    onMouseLeave={e=>{if(!disabled)e.currentTarget.style.transform="scale(1)";}}>
    {children}
  </button>;
}

function TCard({task,full,onVerify,C}){
  const fc=FC[task.freq]||C.textLt;
  const ss={idle:{bg:C.card,bo:C.border},approved:{bg:C.mintLt,bo:C.mint+"60"},pending:{bg:C.goldLt,bo:C.gold+"60"}}[task.status]||{bg:C.card,bo:C.border};
  const vl=VERIFY_LEVELS[task.verify]||VERIFY_LEVELS.easy;
  return (
    <div className={task.status==="idle"?"task-card":""} style={{background:ss.bg,border:`2px solid ${ss.bo}`,borderRadius:18,padding:15,marginBottom:10,boxShadow:task.status==="approved"?`0 3px 16px ${C.mint}30`:C.shadow}}>
      <div style={{display:"flex",alignItems:"center",gap:11}}>
        <div style={{width:46,height:46,borderRadius:13,background:fc+"16",display:"flex",alignItems:"center",justifyContent:"center",fontSize:25,flexShrink:0}}>{task.emoji}</div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap",marginBottom:2}}>
            <span style={{fontWeight:800,fontSize:13,color:C.text}}>{task.title}</span>
            <Chip label={FL[task.freq]} bg={fc+"18"} color={fc}/>
          </div>
          {full&&<div style={{fontSize:11,color:C.textMed,marginBottom:4}}>{task.hint}</div>}
          <div style={{display:"flex",gap:7,alignItems:"center",flexWrap:"wrap"}}>
            <span style={{fontSize:11,color:C.goldDk,fontWeight:700}}>⭐{task.xp}</span>
            <span style={{fontSize:11,color:C.mintDk,fontWeight:700}}>💰{task.coins}</span>
            <Chip label={vl.label} bg={C.purpleLt} color={C.purple}/>
          </div>
        </div>
        {task.status==="idle"&&<button onClick={onVerify} style={{padding:"8px 13px",borderRadius:13,border:"none",background:`linear-gradient(135deg,${C.mint},${C.mintDk})`,color:"white",fontWeight:800,fontSize:12,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}}>Ir →</button>}
        {task.status==="approved"&&<span style={{fontSize:22}}>✅</span>}
        {task.status==="pending" &&<span style={{fontSize:22}}>⏳</span>}
      </div>
    </div>
  );
}

function ChatView({msgs,setMsgs,isMe,myAuthor,myAvatar,myRole,input,setInput,chatEndRef,C,header,quickReplies=[],onQuick,locked,lockMsg,onSend}){
  const send=()=>{ if(!input.trim()) return; if(onSend){ onSend(input.trim()); } else { setMsgs(p=>[...p,{id:Date.now(),author:myAuthor,avatar:myAvatar,role:myRole,text:input.trim(),time:now_t(),system:false}]); } setInput(""); };
  if(locked) return (
    <div style={{padding:28,textAlign:"center"}}>
      <div style={{fontSize:48,marginBottom:12}}>🔒</div>
      <div style={{fontWeight:800,fontSize:18,color:C.text}}>Chat bloqueado</div>
      <div style={{fontSize:13,color:C.textMed,marginTop:6}}>{lockMsg}</div>
    </div>
  );
  return (
    <div style={{display:"flex",flexDirection:"column",height:"calc(100vh - 130px)"}}>
      <div style={{padding:"12px 14px 0",flexShrink:0}}>
        <div style={{background:header.gradient,borderRadius:16,padding:"11px 14px",marginBottom:8,display:"flex",alignItems:"center",gap:10,color:"white"}}>
          <span style={{fontSize:24}}>🐉</span>
          <div style={{flex:1}}><div style={{fontWeight:800,fontSize:14}}>{header.title}</div><div style={{fontSize:11,opacity:0.8}}>{header.sub}</div></div>
        </div>
        <div style={{background:C.skyLt,border:`1px solid ${C.sky}25`,borderRadius:12,padding:"6px 11px",marginBottom:8,fontSize:11,color:C.sky,fontWeight:600}}>
          🔒 Canal seguro · Solo miembros del clan
        </div>
        {quickReplies.length>0&&(
          <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:8}}>
            {quickReplies.map((r,i)=>(
              <button key={i} onClick={()=>onQuick?onQuick(r):setMsgs(p=>[...p,{id:Date.now(),author:myAuthor,avatar:myAvatar,role:myRole,text:r,time:now_t(),system:false}])}
                style={{padding:"5px 11px",borderRadius:20,border:`1.5px solid ${C.border}`,background:C.card,color:C.textMed,fontSize:11,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}}>
                {r}
              </button>
            ))}
          </div>
        )}
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"0 14px 8px"}}>
        {msgs.map(m=><Bubble key={m.id} msg={m} isMe={isMe(m)} C={C}/>)}
        <div ref={chatEndRef}/>
      </div>
      <div style={{padding:"7px 14px 14px",display:"flex",gap:8,flexShrink:0}}>
        <input value={input} onChange={e=>setInput(e.target.value.slice(0,120))} onKeyDown={e=>{if(e.key==="Enter")send();}}
          placeholder="Escribe un mensaje…"
          style={{flex:1,background:C.card,border:`1.5px solid ${C.border}`,borderRadius:14,padding:"10px 13px",color:C.text,fontSize:13,outline:"none",fontFamily:"'Nunito',sans-serif"}}/>
        <button onClick={send} style={{width:40,height:40,borderRadius:13,border:"none",background:`linear-gradient(135deg,${C.mint},${C.mintDk})`,color:"white",fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>➤</button>
      </div>
    </div>
  );
}

function Bubble({msg,isMe,C}){
  if(msg.system) return (
    <div style={{textAlign:"center",margin:"8px 0"}}>
      <div style={{display:"inline-block",background:C.mintLt,border:`1px solid ${C.mint}30`,borderRadius:20,padding:"4px 12px",fontSize:11,color:C.mintDk,fontWeight:700}}>{msg.text}</div>
    </div>
  );
  const rc={student:C.mint,parent:C.goldDk,teacher:C.sky}[msg.role]||C.textLt;
  const rl={student:"Miembro",parent:"Tutor",teacher:"Profe"}[msg.role]||"";
  return (
    <div style={{display:"flex",flexDirection:isMe?"row-reverse":"row",gap:7,marginBottom:10,alignItems:"flex-end"}}>
      <div style={{width:30,height:30,borderRadius:"50%",background:`${rc}18`,border:`2px solid ${rc}50`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{msg.avatar}</div>
      <div style={{maxWidth:"72%",display:"flex",flexDirection:"column",alignItems:isMe?"flex-end":"flex-start",gap:2}}>
        {!isMe&&<div style={{display:"flex",gap:5,alignItems:"center"}}><span style={{fontSize:11,fontWeight:800,color:rc}}>{msg.author}</span><Chip label={rl} bg={`${rc}15`} color={rc}/></div>}
        <div style={{background:isMe?`linear-gradient(135deg,${C.mint},${C.gold})`:C.card,borderRadius:isMe?"17px 17px 4px 17px":"17px 17px 17px 4px",padding:"9px 12px",fontSize:13,lineHeight:1.4,color:isMe?"white":C.text,border:isMe?"none":`1px solid ${C.border}`,boxShadow:isMe?"none":C.shadow}}>
          {msg.text}
        </div>
        <div style={{fontSize:9,color:C.textLt}}>{msg.time}</div>
      </div>
    </div>
  );
}

function MiniRing({pct,color,size=56}){
  const r=size*.38,circ=2*Math.PI*r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{flexShrink:0}}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#DFF0EA" strokeWidth={size*.1}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={size*.1} strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={circ-(pct/100)*circ} transform={`rotate(-90 ${size/2} ${size/2})`} style={{transition:"stroke-dashoffset 0.6s"}}/>
      <text x={size/2} y={size/2+4} textAnchor="middle" fontSize={size*.2} fontWeight={900} fill={color}>{Math.round(pct)}%</text>
    </svg>
  );
}

function Chip({label,bg,color,style={}}){ return <span style={{display:"inline-flex",alignItems:"center",background:bg,color,padding:"3px 9px",borderRadius:20,fontSize:10,fontWeight:800,lineHeight:1.5,whiteSpace:"nowrap",...style}}>{label}</span>; }
function CoinPill({icon,val,color,bg}){ return <div style={{background:bg,borderRadius:12,padding:"4px 10px",display:"flex",alignItems:"center",gap:4,boxShadow:`0 2px 8px ${bg}80`}}><span style={{fontSize:14}}>{icon}</span><span style={{fontWeight:900,fontSize:13,color}}>{val}</span></div>; }

// ── Frames nativos (3 gratuitos, siempre disponibles) ──
const NATIVE_FRAMES = [
  { id:"none", label:"Sin marco",     desc:"Clásico sin borde" },
  { id:"mint", label:"Verde Jade",    desc:"Borde suave verde" },
  { id:"gold", label:"Dorado",        desc:"Borde dorado elegante" },
];

// ── Todos los estilos visuales (nativos + cofres) ──
const FRAME_STYLES = {
  // nativos
  none:       { border:"none",                       shadow:"none",                        extra:null },
  mint:       { border:"3px solid #4DC9A0",          shadow:"0 0 0 2px #E6F9F3",           extra:null },
  gold:       { border:"3px solid #F5C518",          shadow:"0 0 0 2px #FFF8D6",           extra:null },
  // loot — common
  f_leaf:     { border:"3px solid #4DC9A0",          shadow:"none",                        extra:"🌿" },
  f_circle:   { border:"3px dashed #8FA8A2",         shadow:"none",                        extra:null },
  f_dots:     { border:"3px dotted #4DC9A0",         shadow:"none",                        extra:null },
  // loot — uncommon
  f_mint_glow:{ border:"3px solid #4DC9A0",          shadow:"0 0 10px #4DC9A060",          extra:null },
  f_gold_thin:{ border:"3px solid #F5C518",          shadow:"0 0 8px #F5C51855",           extra:null },
  // loot — rare
  f_fire:     { border:"3px solid #FF6B6B",          shadow:"0 0 14px #FF6B6B90",          extra:"🔥" },
  f_ice:      { border:"3px solid #4AAEE8",          shadow:"0 0 14px #4AAEE890",          extra:"❄️" },
  // loot — epic
  f_rainbow:  { border:"3px solid transparent",      shadow:"0 0 24px #8B6BE8aa",          extra:"🌈", gradient:"linear-gradient(white,white) padding-box, linear-gradient(135deg,#FF6B6B,#F5C518,#4DC9A0,#4AAEE8,#8B6BE8) border-box" },
  f_galaxy:   { border:"3px solid #4AAEE8",          shadow:"0 0 24px #4AAEE8aa,0 0 48px #8B6BE855", extra:"🌌" },
  // loot — legendary
  f_legend:   { border:"4px solid #F5C518",          shadow:"0 0 32px #F5C518cc,0 0 64px #F5C51855", extra:"👑" },
};

function AvatarDisplay({ photo, emoji, svgAvatar, frame, bg, size=68, C, white=false }) {
  const f = FRAME_STYLES[frame] || FRAME_STYLES.none;
  return (
    <div style={{position:"relative",width:size,height:size,margin:"0 auto"}}>
      <div style={{
        width:size, height:size, borderRadius:"50%",
        border: f.gradient ? "3px solid transparent" : f.border,
        background: f.gradient || (white?"rgba(255,255,255,0.25)":"#E6F9F3"),
        boxShadow: f.shadow,
        display:"flex", alignItems:"center", justifyContent:"center",
        overflow:"hidden", position:"relative",
        backgroundImage: f.gradient,
        backgroundOrigin: f.gradient?"border-box":undefined,
        backgroundClip: f.gradient?"padding-box, border-box":undefined,
      }}>
        {photo
          ? <img src={photo} alt="avatar" style={{width:"100%",height:"100%",objectFit:"cover",borderRadius:"50%",display:"block"}}/>
          : svgAvatar
          ? <KQIcon id={svgAvatar} size={Math.round(size*0.88)}/>
          : <span style={{fontSize:size*0.45}}>{emoji||"🦁"}</span>
        }
      </div>
      {f.extra&&(
        <div style={{position:"absolute",bottom:-2,right:-2,fontSize:size*0.28,lineHeight:1,filter:"drop-shadow(0 1px 2px rgba(0,0,0,0.3))"}}>
          {f.extra}
        </div>
      )}
    </div>
  );
}

function FramePreview({ id, size=36, emoji="🦁" }) {
  const f = FRAME_STYLES[id] || FRAME_STYLES.none;
  return (
    <div style={{position:"relative",width:size,height:size,margin:"0 auto"}}>
      <div style={{width:size,height:size,borderRadius:"50%",border:f.gradient?"3px solid transparent":f.border||"2px solid #DFF0EA",background:f.gradient||"#E6F9F3",display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.46,boxShadow:f.shadow,backgroundImage:f.gradient,backgroundOrigin:f.gradient?"border-box":undefined,backgroundClip:f.gradient?"padding-box, border-box":undefined,overflow:"hidden"}}>
        <span>{emoji}</span>
      </div>
      {f.extra&&<div style={{position:"absolute",bottom:-2,right:-2,fontSize:size*0.28,lineHeight:1}}>{f.extra}</div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// CSS
// ═══════════════════════════════════════════════════════════
function buildCSS(C){ return `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900;950&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  ::-webkit-scrollbar{width:3px}
  ::-webkit-scrollbar-thumb{background:${C.mint}50;border-radius:3px}
  input::placeholder,textarea::placeholder{color:${C.textLt}}
  input[type=range]{height:5px;border-radius:5px;cursor:pointer}

  @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
  @keyframes floatSlow{0%,100%{transform:translateY(0) rotate(-2deg)}50%{transform:translateY(-5px) rotate(2deg)}}
  @keyframes chestShake{0%,100%{transform:rotate(0) scale(1)}20%{transform:rotate(-10deg) scale(1.05)}40%{transform:rotate(10deg) scale(1.05)}60%{transform:rotate(-7deg)}80%{transform:rotate(7deg)}}
  @keyframes glowPulse{0%,100%{opacity:0.35;transform:scale(1)}50%{opacity:0.8;transform:scale(1.2)}}
  @keyframes dotPulse{0%,100%{transform:scale(1);opacity:0.4}50%{transform:scale(1.5);opacity:1}}
  @keyframes particleFly{0%{transform:translateY(0) scale(1) rotate(0deg);opacity:1}100%{transform:translateY(-120px) scale(0) rotate(360deg);opacity:0}}
  @keyframes slideIn{from{transform:translateY(-28px) translateX(-50%);opacity:0}to{transform:translateY(0) translateX(-50%);opacity:1}}
  @keyframes slideUp{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}
  @keyframes popIn{0%{transform:scale(0.5) rotate(-5deg);opacity:0}70%{transform:scale(1.08) rotate(2deg)}100%{transform:scale(1) rotate(0deg);opacity:1}}
  @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
  @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
  @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.04)}}
  @keyframes rainbowBg{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
  @keyframes gemSpin{0%{transform:rotateY(0deg)}100%{transform:rotateY(360deg)}}
  @keyframes bounce{0%,100%{transform:translateY(0)}40%{transform:translateY(-10px)}60%{transform:translateY(-5px)}}
  @keyframes loginPop{0%{transform:scale(0) translateY(30px);opacity:0}60%{transform:scale(1.15) translateY(-5px)}100%{transform:scale(1) translateY(0);opacity:1}}

  .float{animation:float 3.2s ease-in-out infinite}
  .float-slow{animation:floatSlow 4s ease-in-out infinite}
  .slide-in{animation:slideIn 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards}
  .slide-up{animation:slideUp 0.3s ease-out forwards}
  .pop-in{animation:popIn 0.45s cubic-bezier(0.34,1.56,0.64,1)}
  .spin-icon{animation:spin 1s linear infinite;display:inline-block}
  .bounce{animation:bounce 0.6s ease-in-out}
  .pulse{animation:pulse 2s ease-in-out infinite}
  .chest-shake{animation:chestShake 0.7s ease-in-out infinite}
  .login-pop{animation:loginPop 0.6s cubic-bezier(0.34,1.56,0.64,1)}
  .shimmer{background:linear-gradient(90deg,${C.mint},${C.gold},${C.purple},${C.mint});background-size:300%;animation:shimmer 3s linear infinite}

  .overlay{position:fixed;inset:0;z-index:9990;background:rgba(8,24,16,0.65);display:flex;align-items:center;justify-content:center;padding:16px;backdrop-filter:blur(8px)}
  .modal{background:${C.card};border-radius:26px;padding:22px;width:100%;max-width:360px;box-shadow:0 24px 64px rgba(0,0,0,0.25);max-height:90vh;overflow-y:auto}

  .notif{position:fixed;top:16px;left:50%;transform:translateX(-50%);z-index:9998;background:${C.card};border:2px solid ${C.mint};border-radius:22px;padding:10px 20px;display:flex;align-items:center;gap:8px;box-shadow:0 6px 24px ${C.mint}40;font-size:13px;font-weight:800;white-space:nowrap;color:${C.text}}

  .hero-card{background:linear-gradient(135deg,${C.mint},${C.mintDk});border-radius:22px;overflow:hidden;position:relative}
  .hero-card::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,0.18) 0%,transparent 60%);pointer-events:none}

  .task-card{background:${C.card};border-radius:18px;padding:14px;margin-bottom:10px;box-shadow:${C.shadow};border:1.5px solid ${C.border};transition:transform 0.15s,box-shadow 0.15s;position:relative;overflow:hidden}
  .task-card:active{transform:scale(0.98)}
  .task-card::after{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,${C.mint},${C.gold});border-radius:18px 18px 0 0}

  .gem-badge{background:linear-gradient(135deg,#60CFFF,${C.sky});border-radius:10px;padding:3px 8px;display:inline-flex;align-items:center;gap:3px;font-weight:800;font-size:12px;color:white;box-shadow:0 2px 8px ${C.sky}50}
  .coin-badge{background:linear-gradient(135deg,#FFE066,${C.gold});border-radius:10px;padding:3px 8px;display:inline-flex;align-items:center;gap:3px;font-weight:800;font-size:12px;color:#7A5000;box-shadow:0 2px 8px ${C.gold}50}
  .xp-badge{background:linear-gradient(135deg,${C.mint},${C.purple});border-radius:10px;padding:3px 8px;display:inline-flex;align-items:center;gap:3px;font-weight:800;font-size:12px;color:white;box-shadow:0 2px 8px ${C.purple}40}

  .level-ring{filter:drop-shadow(0 0 6px ${C.mint}80)}
  .legendary-glow{box-shadow:0 0 20px ${C.gold}80,0 0 40px ${C.gold}40 !important}

  .upload-zone{background:${C.mintLt};border:2px dashed ${C.mint};border-radius:18px;padding:24px;text-align:center;cursor:pointer;transition:all 0.2s}
  .upload-zone:hover{background:${C.mint}20;border-color:${C.mintDk};transform:scale(1.01)}
  .vstep-btn{width:100%;padding:13px;border-radius:15px;border:2px solid;background:${C.card};font-weight:800;font-size:14px;cursor:pointer;transition:all 0.18s;font-family:'Nunito',sans-serif;color:${C.text}}
  .vstep-btn:active{transform:scale(0.97)}
  .verify-ok{padding:10px 14px;border-radius:13px;font-size:12px;font-weight:800;display:flex;align-items:center;gap:6px;border:2px solid}
`;}
