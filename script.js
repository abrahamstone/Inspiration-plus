let QUOTES = [];
let CATEGORIES = ["Toutes"];

let currentCategory = "Toutes";
let currentQuote = null;
let poolIndex = -1;

const chipsEl = document.getElementById('chips');
const quoteTextEl = document.getElementById('quoteText');
const quoteAuthorEl = document.getElementById('quoteAuthor');
const quoteCategoryEl = document.getElementById('quoteCategory');
const heartBtn = document.getElementById('heartBtn');
const heartIcon = document.getElementById('heartIcon');
const heartLabel = document.getElementById('heartLabel');
const favListEl = document.getElementById('favList');
const favCountEl = document.getElementById('favCount');
const toastEl = document.getElementById('toast');
const cardEl = document.getElementById('card');
const tabCitations = document.getElementById('tabCitations');
const tabFavoris = document.getElementById('tabFavoris');
const viewCitations = document.getElementById('viewCitations');
const viewFavoris = document.getElementById('viewFavoris');

function loadFavorites() {
  try {
    const raw = localStorage.getItem('etincelle_favs');
    return raw ? JSON.parse(raw) : [];
  } catch (e) { return []; }
}

function saveFavorites(favs) {
  try { localStorage.setItem('etincelle_favs', JSON.stringify(favs)); } catch (e) {}
}

function isFavorite(q) {
  return loadFavorites().some(f => f.t === q.t);
}

function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  setTimeout(() => toastEl.classList.remove('show'), 1600);
}

function renderChips() {
  chipsEl.innerHTML = '';
  CATEGORIES.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'chip' + (cat === currentCategory ? ' active' : '');
    btn.textContent = cat;
    btn.onclick = () => {
      currentCategory = cat;
      poolIndex = -1;
      renderChips();
      pickQuote();
    };
    chipsEl.appendChild(btn);
  });
}

function pool() {
  if (currentCategory === "Toutes") return QUOTES;
  return QUOTES.filter(q => q.c === currentCategory);
}

function pickQuote() {
  const p = pool();
  if (p.length === 0) return;
  poolIndex = (poolIndex + 1) % p.length;
  currentQuote = p[poolIndex];
  renderQuote();
}

function renderQuote() {
  cardEl.style.opacity = '0';
  setTimeout(() => {
    quoteTextEl.textContent = currentQuote.t;
    quoteAuthorEl.textContent = "— " + currentQuote.a;
    quoteCategoryEl.textContent = currentQuote.c;
    heartIcon.textContent = isFavorite(currentQuote) ? '♥' : '♡';
    heartLabel.textContent = isFavorite(currentQuote) ? 'Ajouté' : "J'aime";
    heartBtn.classList.toggle('active', isFavorite(currentQuote));
    cardEl.style.opacity = '1';
  }, 120);
}

function renderFavorites() {
  const favs = loadFavorites();
  favCountEl.textContent = favs.length > 0 ? `(${favs.length})` : '';
  favListEl.innerHTML = '';
  if (favs.length === 0) {
    favListEl.innerHTML = `<div class="empty-fav">Aucun favori pour l'instant — appuie sur le cœur d'une citation qui te plaît.</div>`;
    return;
  }
  favs.slice().reverse().forEach(f => {
    const item = document.createElement('div');
    item.className = 'fav-item';
    item.innerHTML = `<div class="fav-text">${escapeHtml(f.t)}<div class="fav-author">— ${escapeHtml(f.a)}</div></div>`;
    const rm = document.createElement('button');
    rm.className = 'fav-remove';
    rm.textContent = '✕';
    rm.onclick = () => {
      const updated = loadFavorites().filter(x => x.t !== f.t);
      saveFavorites(updated);
      renderFavorites();
      if (currentQuote && currentQuote.t === f.t) renderQuote();
    };
    item.appendChild(rm);
    favListEl.appendChild(item);
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

heartBtn.onclick = () => {
  if (!currentQuote) return;
  let favs = loadFavorites();
  if (isFavorite(currentQuote)) {
    favs = favs.filter(f => f.t !== currentQuote.t);
    showToast('Retiré des favoris');
  } else {
    favs.push(currentQuote);
    showToast('Ajouté aux favoris');
  }
  saveFavorites(favs);
  renderQuote();
  renderFavorites();
};

document.getElementById('newBtn').onclick = () => pickQuote();

tabCitations.onclick = () => {
  tabCitations.classList.add('active');
  tabFavoris.classList.remove('active');
  viewCitations.classList.remove('hidden');
  viewFavoris.classList.add('hidden');
};

tabFavoris.onclick = () => {
  tabFavoris.classList.add('active');
  tabCitations.classList.remove('active');
  viewFavoris.classList.remove('hidden');
  viewCitations.classList.add('hidden');
  renderFavorites();
};

function fallbackCopy(text) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  let ok = false;
  try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
  document.body.removeChild(textarea);
  return ok;
}

document.getElementById('copyBtn').onclick = async () => {
  if (!currentQuote) return;
  const text = `"${currentQuote.t}" — ${currentQuote.a}`;
  let success = false;
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      success = true;
    } catch (e) { success = false; }
  }
  if (!success) {
    success = fallbackCopy(text);
  }
  showToast(success ? 'Copié !' : 'Impossible de copier');
};

async function init() {
  try {
    const res = await fetch('citations.json');
    if (!res.ok) throw new Error('citations.json introuvable');
    QUOTES = await res.json();
  } catch (e) {
    console.error('Erreur de chargement des citations :', e);
    QUOTES = [];
  }

  const cats = new Set();
  QUOTES.forEach(q => cats.add(q.c));
  CATEGORIES = ["Toutes", ...Array.from(cats).sort((a, b) => a.localeCompare(b, 'fr'))];

  renderChips();
  pickQuote();
  renderFavorites();
}

init();
