import './style.css';
// tailwind.css was removed; keep import commented if present
// import './tailwind.css';
import Methods from './modules/methods.js';
import { postLikes } from './modules/APIsGET&POST.js';

const methods = new Methods();
const animesAPI = 'https://anime-db.p.rapidapi.com/anime?page=1&size=20&genres=Award%20Winning%2CAction%2CHorror%2CSports%2CSupernatural%2CFantasy%2CDrama%2CComedy%2CAdventure%2CRomance%2CSci-Fi&sortBy=ranking&sortOrder=asc';
const likesAPI = 'https://us-central1-involvement-api.cloudfunctions.net/capstoneApi/apps/qvRewcmh88OIPOPoLZPA/likes/';
const commentsAPI = 'https://us-central1-involvement-api.cloudfunctions.net/capstoneApi/apps/qvRewcmh88OIPOPoLZPA/comments';
const container = document.getElementById('movie-list');
const modal = document.getElementById('modal');
const closeModal = document.getElementById('close-modal');
let lastFocused = null;
const submit = document.getElementById('submitComment');
const username = document.getElementById('InputName');
const comment = document.getElementById('commentToPost');
const small = document.getElementById('small');
const themeToggle = document.getElementById('theme-toggle');

// brand click -> home/scroll top
const brandLink = document.querySelector('.brand');
if (brandLink) brandLink.addEventListener('click', (ev) => { ev.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); });

// create modal scroll-to-top button (kept outside modal markup)
const modalScrollTop = document.createElement('button');
modalScrollTop.id = 'modal-scroll-top';
modalScrollTop.setAttribute('aria-label', 'Scroll to top');
modalScrollTop.innerHTML = '<i class="fas fa-arrow-up"></i>';
document.body.appendChild(modalScrollTop);

/* Toast system */
const toastWrap = document.createElement('div');
toastWrap.className = 'toast-wrap';
document.body.appendChild(toastWrap);
function showToast(text, timeout = 2200) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.innerText = text;
  toastWrap.appendChild(t);
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => {
    t.classList.remove('show');
    setTimeout(() => { if (t && t.parentNode) t.parentNode.removeChild(t); }, 260);
  }, timeout);
}

// favorites handling
function toggleFav(card, index) {
  const btn = card.querySelector('.fav-btn');
  if (!btn) return;
  const active = btn.classList.toggle('active');
  // store simple list in localStorage
  const favs = JSON.parse(localStorage.getItem('favs') || '[]');
  if (active) {
    favs.push(index);
    showToast('Added to favorites');
  } else {
    const idx = favs.indexOf(Number(index)); if (idx > -1) favs.splice(idx, 1);
    showToast('Removed from favorites');
  }
  localStorage.setItem('favs', JSON.stringify(favs));
}

// keyboard shortcuts
document.addEventListener('keydown', (ev) => {
  if (ev.key === '/') { ev.preventDefault(); const s = document.getElementById('search'); if (s) s.focus(); }
  if (document.documentElement.classList.contains('modal-open')) return; // avoid conflicts when modal open
  const focused = document.activeElement;
  const card = focused && focused.closest ? focused.closest('.movie-card') : null;
  if (ev.key === 'l' && card) { // like
    const idx = card.dataset.id; methods.increaseLikes(idx); showToast('Liked'); postLikes(idx, likesAPI);
  }
  if (ev.key === 'f' && card) { toggleFav(card, card.dataset.id); }
  if (ev.key === 'o' && card) { // open details
    const idx = card.dataset.id; methods.loadModalInfo(idx, commentsAPI); document.documentElement.classList.add('modal-open'); setTimeout(()=>closeModal.focus(),0);
  }
});


// Theme toggle: read from localStorage, apply to root, update icon
function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === 'light') {
    root.classList.remove('dark');
    themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
  } else {
    root.classList.add('dark');
    themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
  }
  localStorage.setItem('theme', theme);
}

// Initialize theme on load
const savedTheme = localStorage.getItem('theme') || 'dark';
applyTheme(savedTheme);

themeToggle.addEventListener('click', () => {
  const root = document.documentElement;
  const isDark = root.classList.contains('dark');
  applyTheme(isDark ? 'light' : 'dark');
  // pulse the toggle briefly
  themeToggle.classList.add('pulse');
  setTimeout(() => themeToggle.classList.remove('pulse'), 520);
});

// initialize app and wire post-load interactions
(async function initApp() {
  await methods.loadData(container, animesAPI, likesAPI);
  // poster fade-in wiring
  const posters = Array.from(document.querySelectorAll('.poster'));
  posters.forEach((img) => {
    if (img.complete) img.classList.add('loaded');
    else img.addEventListener('load', () => img.classList.add('loaded'));
  });
  // staggered card reveal
  const cards = Array.from(document.querySelectorAll('.movie-card'));
  cards.forEach((card, i) => {
    setTimeout(() => card.classList.add('show'), i * 80);
    // add pointer tilt handlers
    const inner = card.querySelector('.card-inner');
    const posterWrap = card.querySelector('.poster-wrap');
    if (inner) {
      card.addEventListener('pointermove', (ev) => {
        const rect = card.getBoundingClientRect();
        const x = (ev.clientX - rect.left) / rect.width - 0.5;
        const y = (ev.clientY - rect.top) / rect.height - 0.5;
        const rotX = (-y * 6).toFixed(2);
        const rotY = (x * 8).toFixed(2);
        inner.style.transform = `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(0)`;
        if (posterWrap) posterWrap.style.setProperty('--shine-x', `${(x + 0.5) * 100}%`);
      });
      card.addEventListener('pointerleave', () => {
        inner.style.transform = '';
        if (posterWrap) posterWrap.style.setProperty('--shine-x', `50%`);
      });
    }
  });
})();

// Live search with debounce
const searchInput = document.getElementById('search');
function debounce(fn, wait) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

function filterCards(query) {
  const q = query.trim().toLowerCase();
  const cards = Array.from(document.querySelectorAll('.movie-card'));
  cards.forEach((card) => {
    const title = card.dataset.title || '';
    if (title.includes(q)) {
      card.style.display = '';
    } else {
      card.style.display = 'none';
    }
  });
}

const debouncedFilter = debounce((e) => filterCards(e.target.value), 250);
if (searchInput) searchInput.addEventListener('input', debouncedFilter);

container.addEventListener('click', (e) => {
  const card = e.target.closest('.movie-card');
  if (!card) return;
  const index = card.dataset.id;

  // If a control button was clicked (fav/like/comment), let their handlers deal with it
  if (e.target.closest('.comment-btn')) {
    const commentsList = commentsAPI;
    methods.loadModalInfo(index, commentsList);
    // open modal and manage focus
    lastFocused = document.activeElement;
    document.documentElement.classList.add('modal-open');
    setTimeout(() => closeModal.focus(), 0);
    return;
  }

  // If click wasn't on a control, open modal for details
  if (!e.target.closest('.icon-btn') && !e.target.closest('.overlay')) {
    methods.loadModalInfo(index, commentsAPI);
    lastFocused = document.activeElement;
    document.documentElement.classList.add('modal-open');
    setTimeout(() => closeModal.focus(), 0);
    return;
  }

  const favBtn = e.target.closest('.fav-btn');
  if (favBtn) {
    // ensure card is focused for keyboard shortcuts
    card.setAttribute('tabindex', '-1');
    card.focus();
    toggleFav(card, index);
    return;
  }

  const likeBtn = e.target.closest('.like-btn');
  if (likeBtn) {
    methods.increaseLikes(index);
    postLikes(index, likesAPI);

    // animate the likes counter
    const likeSpan = document.getElementById(`span-${index}`);
    if (likeSpan) {
      try {
        likeSpan.animate([
          { transform: 'scale(1)' },
          { transform: 'scale(1.28)' },
          { transform: 'scale(1)' }
        ], { duration: 320, easing: 'cubic-bezier(.2,.9,.3,1)' });
      } catch (err) {
        likeSpan.classList.add('pop');
        setTimeout(() => likeSpan.classList.remove('pop'), 320);
      }
    }

    // small heart burst
    const burst = document.createElement('div');
    burst.className = 'heart-burst burst-anim';
    const btnRect = likeBtn.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    burst.style.left = `${btnRect.left - cardRect.left + btnRect.width / 2 - 6}px`;
    burst.style.top = `${btnRect.top - cardRect.top - 6}px`;
    card.appendChild(burst);
    setTimeout(() => { if (burst.parentNode) burst.parentNode.removeChild(burst); }, 800);
  }
});

// Poster image fade-in: add .loaded when poster images finish loading
document.addEventListener('load', (e) => {
  const t = e.target;
  if (t && t.matches && t.matches('img.poster')) {
    t.classList.add('loaded');
  }
}, true);

// For images that are already cached/complete, apply loaded class shortly after render
setTimeout(() => {
  document.querySelectorAll('img.poster').forEach((img) => {
    if (img.complete) img.classList.add('loaded');
  });
}, 350);

closeModal.addEventListener('click', () => {
  document.documentElement.classList.remove('modal-open');
  if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
});

// Show modal scroll-to-top when modal content is scrolled
const modalInner = document.querySelector('.modal-inner');
if (modalInner) {
  modalInner.addEventListener('scroll', () => {
    if (modalInner.scrollTop > 120) modalScrollTop.classList.add('show');
    else modalScrollTop.classList.remove('show');
  });
}

modalScrollTop.addEventListener('click', () => {
  if (modalInner) modalInner.scrollTo({ top: 0, behavior: 'smooth' });
});

// Close modal on overlay click
modal.addEventListener('click', (ev) => {
  if (ev.target === modal) {
    document.documentElement.classList.remove('modal-open');
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
  }
});

// Close on Escape
document.addEventListener('keydown', (ev) => {
  if (ev.key === 'Escape' && document.documentElement.classList.contains('modal-open')) {
    document.documentElement.classList.remove('modal-open');
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
  }
});

submit.addEventListener('click', (e) => {
  e.preventDefault();
  // const comments = document.querySelector('.comments');
  // const index = comments.id.substring(6, comments.id.length);
  if (username.value.length !== 0 && comment.value.length !== 0) {
    methods.addNewComment(commentsAPI);
  } else {
    small.classList.add('show');
  }
});

// form submit (enter key / accessibility)
const commentForm = document.getElementById('comment-form');
if (commentForm) {
  commentForm.addEventListener('submit', (ev) => {
    ev.preventDefault();
    methods.addNewComment(commentsAPI);
  });
}

// Theme picker swatches (apply a theme class to documentElement and persist)
function applyThemeClass(themeClass) {
  const root = document.documentElement;
  // remove previous theme-* classes
  Array.from(root.classList).forEach(cls => { if (cls.startsWith('theme-')) root.classList.remove(cls); });
  if (themeClass) root.classList.add(themeClass);
  localStorage.setItem('themeClass', themeClass || '');
}

// Initialize theme class from storage
const savedThemeClass = localStorage.getItem('themeClass');
if (savedThemeClass) applyThemeClass(savedThemeClass);

// wire up swatches
document.querySelectorAll('.theme-swatch').forEach((btn) => {
  btn.addEventListener('click', () => {
    const t = btn.dataset.theme;
    applyThemeClass(t);
    showToast('Theme applied', 1200);
  });
});
