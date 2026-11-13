const synth = window.speechSynthesis;

const $ = (id) => document.getElementById(id);
const textInput = $('textInput');
const reader = $('reader');
const langSelect = $('languageSelect');
const rateRange = $('rateRange');
const rateOut = $('rateOut');
const playBtn = $('playBtn');
const pauseBtn = $('pauseBtn');
const stopBtn = $('stopBtn');
const clearBtn = $('clearBtn');
const statusEl = $('status');
const wave = $('wave');
const themeBtn = $('themeBtn');
const shareBtn = $('shareBtn');

let words = []; // { el, start, end }
let current = -1;

/* ---------- Idiomas da interface ---------- */
const I18N = {
  pt: {
    docTitle: 'TextVoz – leitor de texto para estudar idiomas',
    title: 'Ouça cada palavra do seu texto.',
    intro: 'Cole um texto, escolha o idioma e acompanhe a leitura palavra por palavra para treinar a escuta e a pronúncia.',
    voiceLang: 'Idioma da voz', 
    speed: 'Velocidade',
    placeholder: 'Digite ou cole o texto aqui…', 
    textLabel: 'Texto para ler',
    play: 'Ouvir', 
    resume: 'Continuar', 
    pause: 'Pausar', 
    stop: 'Parar', 
    clear: 'Limpar',
    word1: '1 palavra', 
    words: '{n} palavras', 
    reading: 'Lendo…', 
    paused: 'Pausado',
    empty: 'Escreva ou cole um texto para ouvir.',
    unsupported: 'Seu navegador não suporta leitura de texto.',
    themeLabel: 'Alternar tema claro e escuro', 
    langSwitch: 'Idioma da interface',
    stageLabel: 'Leitor de texto', 
    credit: 'Desenvolvido com', 
    creditBy: 'por Julio Gonzales', 
    shareLabel: 'Compartilhar aplicativo',
    navPlay: 'Ouvir', 
    navPause: 'Pausar', 
    navStop: 'Parar', 
    navClear: 'Limpar'
  },
  es: {
    docTitle: 'TextVoz – lector de texto para estudiar idiomas',
    title: 'Escucha cada palabra de tu texto.',
    intro: 'Pega un texto, elige el idioma y sigue la lectura palabra por palabra para practicar la comprensión auditiva y la pronunciación.',
    voiceLang: 'Idioma de la voz', 
    speed: 'Velocidad',
    placeholder: 'Escribe o pega el texto aquí…', 
    textLabel: 'Texto para leer',
    play: 'Escuchar', 
    resume: 'Continuar', 
    pause: 'Pausar', 
    stop: 'Detener', 
    clear: 'Borrar',
    word1: '1 palabra', 
    words: '{n} palabras', 
    reading: 'Leyendo…', 
    paused: 'En pausa',
    empty: 'Escribe o pega un texto para escuchar.',
    unsupported: 'Tu navegador no admite la lectura de texto.',
    themeLabel: 'Cambiar entre tema claro y oscuro', 
    langSwitch: 'Idioma de la interfaz',
    stageLabel: 'Lector de texto', 
    credit: 'Desarrollado con', 
    creditBy: 'por Julio Gonzales',
    shareLabel: 'Compartir aplicación',
    navPlay: 'Escuchar', 
    navPause: 'Pausar', 
    navStop: 'Parar', 
    navClear: 'Borrar'
  },
  en: {
    docTitle: 'TextVoz – text reader for language learners',
    title: 'Hear every word of your text.',
    intro: 'Paste a text, pick a language and follow along word by word to practice listening and pronunciation.',
    voiceLang: 'Voice language', 
    speed: 'Speed',
    placeholder: 'Type or paste your text here…', 
    textLabel: 'Text to read',
    play: 'Listen', 
    resume: 'Resume', 
    pause: 'Pause', 
    stop: 'Stop', 
    clear: 'Clear',
    word1: '1 word', 
    words: '{n} words', 
    reading: 'Reading…', 
    paused: 'Paused',
    empty: 'Type or paste a text to listen.',
    unsupported: 'Your browser does not support text-to-speech.',
    themeLabel: 'Switch between light and dark theme', 
    langSwitch: 'Interface language',
    stageLabel: 'Text reader', 
    credit: 'Developed with', 
    creditBy: 'by Julio Gonzales',
    shareLabel: 'Share app',
    navPlay: 'Listen', 
    navPause: 'Pause', 
    navStop: 'Stop', 
    navClear: 'Clear'
  }
};

let uiLang = 'pt';
let currentState = 'idle';
const t = (key, n) => (I18N[uiLang][key] || '').replace('{n}', n);

function applyLang(lang) {
  uiLang = I18N[lang] ? lang : 'pt';
  document.documentElement.lang = uiLang;
  document.title = t('docTitle');
  document.querySelectorAll('[data-i18n]').forEach((el) => { 
    el.textContent = t(el.dataset.i18n); 
  });
  document.querySelectorAll('[data-i18n-ph]').forEach((el) => { 
    el.placeholder = t(el.dataset.i18nPh); 
  });
  document.querySelectorAll('[data-i18n-aria]').forEach((el) => { 
    el.setAttribute('aria-label', t(el.dataset.i18nAria)); 
  });
  document.querySelectorAll('.flag').forEach((b) => { 
    b.setAttribute('aria-pressed', String(b.dataset.lang === uiLang)); 
  });
  try { localStorage.setItem('textvoz-lang', uiLang); } catch (e) {}
  setState(currentState);
}
document.querySelectorAll('.flag').forEach((b) => b.addEventListener('click', () => applyLang(b.dataset.lang)));

/* ---------- Ondas ---------- */
for (let i = 0; i < 28; i++) {
  const bar = document.createElement('i');
  bar.style.setProperty('--i', i);
  bar.style.setProperty('--h', (0.3 + 0.7 * Math.abs(Math.sin(i * 1.7))).toFixed(2));
  wave.appendChild(bar);
}

/* ---------- Contagem de palavras ---------- */
function countWords(text) {
  const m = text.trim().match(/\S+/g);
  return m ? m.length : 0;
}

function updateCount() {
  const n = countWords(textInput.value);
  statusEl.textContent = n === 1 ? t('word1') : t('words', n);
}
textInput.addEventListener('input', updateCount);

rateRange.addEventListener('input', () => {
  rateOut.textContent = Number(rateRange.value).toString().replace('.', ',') + 'x';
});

/* ---------- Estado da interface ---------- */
function setState(state) {
  currentState = state;
  const active = state === 'speaking' || state === 'paused';
  
  wave.classList.toggle('live', active);
  wave.classList.toggle('paused', state === 'paused');
  
  playBtn.disabled = state === 'speaking';
  pauseBtn.disabled = !active;
  stopBtn.disabled = !active;
  
  playBtn.innerHTML = '<i class="fas fa-play"></i> ' + (state === 'paused' ? t('resume') : t('play'));
  pauseBtn.innerHTML = '<i class="fas fa-pause"></i> ' + t('pause');
  
  reader.hidden = !active;
  textInput.hidden = active;
  
  if (state === 'speaking') statusEl.textContent = t('reading');
  if (state === 'paused') statusEl.textContent = t('paused');
  if (state === 'idle') updateCount();

  // Sincronização dos botões da barra inferior
  const navPlay = $('navPlay');
  const navPause = $('navPause');
  const navStop = $('navStop');
  
  if (navPlay) navPlay.disabled = state === 'speaking';
  if (navPause) navPause.disabled = !active;
  if (navStop) navStop.disabled = !active;
}

/* ---------- Leitor com destaque ---------- */
function buildReader(text) {
  reader.textContent = '';
  words = [];
  current = -1;
  let last = 0;
  
  for (const m of text.matchAll(/\S+/g)) {
    if (m.index > last) {
      reader.appendChild(document.createTextNode(text.slice(last, m.index)));
    }
    const span = document.createElement('span');
    span.className = 'w';
    span.textContent = m[0];
    reader.appendChild(span);
    words.push({ el: span, start: m.index, end: m.index + m[0].length });
    last = m.index + m[0].length;
  }
  
  if (last < text.length) {
    reader.appendChild(document.createTextNode(text.slice(last)));
  }
}

function highlight(charIndex) {
  const i = words.findIndex((w) => charIndex >= w.start && charIndex < w.end);
  if (i === -1 || i === current) return;
  
  if (current >= 0) words[current].el.classList.remove('on');
  current = i;
  const el = words[i].el;
  el.classList.add('on');
  
  const top = el.offsetTop - reader.offsetTop;
  if (top < reader.scrollTop + 20 || top > reader.scrollTop + reader.clientHeight - 60) {
    reader.scrollTo({ top: Math.max(0, top - 60), behavior: 'smooth' });
  }
}

/* ---------- Ações ---------- */
function speakText() {
  if (!synth) {
    statusEl.textContent = t('unsupported');
    return;
  }
  
  if (synth.paused) {
    synth.resume();
    setState('speaking');
    return;
  }
  
  const text = textInput.value;
  if (!text.trim()) {
    statusEl.textContent = t('empty');
    textInput.focus();
    return;
  }
  
  synth.cancel();
  buildReader(text);

  const u = new SpeechSynthesisUtterance(text);
  u.lang = langSelect.value;
  u.rate = Number(rateRange.value);
  u.onboundary = (e) => { 
    if (e.name === 'word' || e.name === undefined) highlight(e.charIndex); 
  };
  u.onend = () => setState('idle');
  u.onerror = () => setState('idle');

  setState('speaking');
  synth.speak(u);
}

function togglePause() {
  if (!synth.speaking) return;
  
  if (synth.paused) {
    synth.resume();
    setState('speaking');
  } else {
    synth.pause();
    setState('paused');
  }
}

function stopSpeech() {
  synth.cancel();
  setState('idle');
}

function clearText() {
  synth.cancel();
  textInput.value = '';
  setState('idle');
  textInput.focus();
}

/* ---------- Listeners Principais ---------- */
playBtn.addEventListener('click', speakText);
pauseBtn.addEventListener('click', togglePause);
stopBtn.addEventListener('click', stopSpeech);
clearBtn.addEventListener('click', clearText);

/* ---------- Bottom nav ---------- */
$('navPlay').addEventListener('click', speakText);
$('navPause').addEventListener('click', togglePause);
$('navStop').addEventListener('click', stopSpeech);
$('navClear').addEventListener('click', clearText);

/* ---------- Tema ---------- */
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const icon = theme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
  themeBtn.innerHTML = icon;
  document.querySelector('meta[name="theme-color"]').content = theme === 'dark' ? '#0f1020' : '#5b3df5';
}

let savedTheme = null;
try { savedTheme = localStorage.getItem('textvoz-theme'); } catch (e) {}
applyTheme(savedTheme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));

themeBtn.addEventListener('click', () => {
  const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  try { localStorage.setItem('textvoz-theme', next); } catch (e) {}
});

/* ---------- Compartilhar ---------- */
if (shareBtn) {
  shareBtn.addEventListener('click', async () => {
    const shareData = {
      title: 'TextVoz',
      text: 'Aprenda idiomas ouvindo seus próprios textos com o TextVoz!',
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if (err.name !== 'AbortError') console.error('Erro ao compartilhar:', err);
      }
    } else {
      const url = encodeURIComponent(window.location.href);
      const text = encodeURIComponent(shareData.text);
      window.open(`https://api.whatsapp.com/send?text=${text}%20${url}`, '_blank');
    }
  });
}

/* ---------- Init ---------- */
window.addEventListener('beforeunload', () => synth && synth.cancel());

let savedLang = null;
try { savedLang = localStorage.getItem('textvoz-lang'); } catch (e) {}
const browserLang = (navigator.language || 'pt').slice(0, 2).toLowerCase();
applyLang(savedLang || (I18N[browserLang] ? browserLang : 'pt'));
