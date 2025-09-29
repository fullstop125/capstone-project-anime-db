import './style.css';
// tailwind.css was removed; keep import commented if present
// import './tailwind.css';
import Methods from './modules/methods.js';
import { postLikes, checkAPI } from './modules/APIsGET&POST.js';

const methods = new Methods();
// Use Jikan API for current season (latest animes)
const animesAPI = 'https://api.jikan.moe/v4/seasons/now';
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

// pagination state for load-more
let currentPage = 1;
let currentQuery = null;
let loadMoreBtn = undefined;

// enable creative theme by default for demo
document.documentElement.classList.add('theme-creative');

// brand click -> home/scroll top
const brandLink = document.querySelector('.brand');
if (brandLink) brandLink.addEventListener('click', (ev) => { ev.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); });

// create modal scroll-to-top button (kept outside modal markup)
const modalScrollTop = document.createElement('button');
modalScrollTop.id = 'modal-scroll-top';
modalScrollTop.setAttribute('aria-label', 'Scroll to top');
modalScrollTop.innerHTML = '<i class="fas fa-arrow-up"></i>';
document.body.appendChild(modalScrollTop);

// ARIA live region for announcements
const ariaLive = document.createElement('div');
ariaLive.setAttribute('aria-live', 'polite');
ariaLive.className = 'sr-only aria-live';
document.body.appendChild(ariaLive);

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
  if (!theme) return;
  if (theme === 'light') {
    root.classList.remove('dark');
    if (themeToggle) themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
  } else {
    root.classList.add('dark');
    if (themeToggle) themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
  }
  try { localStorage.setItem('theme', theme); } catch (e) { /* ignore */ }
}

// Initialize theme on load
const savedTheme = localStorage.getItem('theme') || 'dark';
applyTheme(savedTheme);

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const root = document.documentElement;
    const isDark = root.classList.contains('dark');
    const newTheme = isDark ? 'light' : 'dark';
    applyTheme(newTheme);
    // pulse the toggle briefly
    themeToggle.classList.add('pulse');
    setTimeout(() => themeToggle.classList.remove('pulse'), 520);
  });
}

// initialize app and wire post-load interactions
(async function initApp() {
  // quick health-check for the public API (Jikan). If it fails, we'll show a toast and fall back to local samples.
  try {
    const ok = await checkAPI(animesAPI, 2500);
    if (!ok) showToast('Public anime API is unavailable — showing sample data', 4800);
  } catch (e) {
    showToast('Public anime API is unavailable — showing sample data', 4800);
  }

  await methods.loadData(container, animesAPI, likesAPI);
  // show a focused initial set (12) to concentrate the layout and appearance
  const initialVisible = 12;
  setTimeout(() => {
    const cards = Array.from(document.querySelectorAll('.movie-card'));
    cards.forEach((c, idx) => {
      if (idx >= initialVisible) c.classList.add('hidden-by-default');
    });
  }, 120);
  // load-more button (initially hidden until we know there are more)
  const loadMoreWrap = document.createElement('div');
  loadMoreWrap.className = 'load-more-wrap container';
  loadMoreWrap.style.display = 'flex';
  loadMoreWrap.style.justifyContent = 'center';
  loadMoreWrap.style.margin = '28px 0';
  const loadMoreBtn = document.createElement('button');
  loadMoreBtn.className = 'cta load-more';
  loadMoreBtn.innerText = 'Load more';
  loadMoreWrap.appendChild(loadMoreBtn);
  document.querySelector('section.container[aria-label="anime gallery"]').appendChild(loadMoreWrap);

  // paging state (module-scoped variables used)
    // prefetch next page in background to make load feel instant
    let prefetching = false;
    async function prefetchNext() {
      if (prefetching) return false;
      prefetching = true;
      const nextPage = currentPage + 1;
      try {
        let url;
        if (currentQuery && currentQuery.length > 2) url = `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(currentQuery)}&limit=24&page=${nextPage}`;
        else if (animesAPI && animesAPI.includes('/seasons/now')) url = `https://api.jikan.moe/v4/top/anime?page=${nextPage}&limit=24`;
        else url = `${animesAPI}?page=${nextPage}`;
        // add temporary skeletons while prefetching
        const skeletons = [];
        for (let i = 0; i < 6; i += 1) {
          const sk = document.createElement('div');
          sk.className = 'movie-card skeleton';
          sk.style.minHeight = '360px';
          container.appendChild(sk);
          skeletons.push(sk);
        }
        // append actual data as hidden so we can reveal instantly later
        const added = await methods.loadData(container, url, likesAPI, { append: true, hidden: true });
        // remove skeletons
        skeletons.forEach(s => { if (s.parentNode) s.parentNode.removeChild(s); });
        prefetching = false;
        return added;
      } catch (err) {
        prefetching = false;
        return 0;
      }
    }

    // Prefetch immediately after initial load
    setTimeout(() => { prefetchNext(); }, 800);

    loadMoreBtn.addEventListener('click', async () => {
    // determine next page URL depending on whether user is searching
    currentPage += 1;
    loadMoreBtn.disabled = true;
    loadMoreBtn.innerText = 'Loading...';
    try {
      let url;
      if (currentQuery && currentQuery.length > 2) {
        // search pagination
        url = `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(currentQuery)}&limit=24&page=${currentPage}`;
      } else {
        // seasons/now is not paginated; for 'load more' switch to top anime endpoint which is paginated
        if (animesAPI && animesAPI.includes('/seasons/now')) {
          url = `https://api.jikan.moe/v4/top/anime?page=${currentPage}&limit=24`;
        } else {
          url = `${animesAPI}?page=${currentPage}`;
        }
      }
      // If there are hidden prefetched cards, just reveal them and bump page
      const hiddenPrefetched = Array.from(document.querySelectorAll('.hidden-by-default'));
      if (hiddenPrefetched.length > 0) {
        hiddenPrefetched.slice(0, 12).forEach((el) => { el.classList.remove('hidden-by-default'); el.classList.add('revealed'); });
        currentPage += 1;
        // start prefetch for next page
        setTimeout(() => prefetchNext(), 240);
        added = hiddenPrefetched.length;
      } else {
        const added = await methods.loadData(container, url, likesAPI, { append: true });
      }
      // reveal next batch of previously hidden cards (12 more)
      const hidden = Array.from(document.querySelectorAll('.hidden-by-default'));
      const revealCount = 12;
      hidden.slice(0, revealCount).forEach((el, i) => {
        el.classList.remove('hidden-by-default');
        el.classList.add('revealed');
      });
      // if fewer items returned than expected, hide load more
      if (!added || added < 24) {
        loadMoreBtn.style.display = 'none';
      }
    } catch (err) {
      console.warn('Load more failed', err);
      showToast('Failed to load more items');
    }
    loadMoreBtn.disabled = false;
    loadMoreBtn.innerText = 'Load more';
  });
  // After data is loaded, wire featured poster to the latest anime (first item) if present
  try {
    const featured = document.getElementById('featured-poster');
    const featuredTitle = document.querySelector('.spotlight-title');
    const playBtn = document.querySelector('.play-btn');
    const favBtn = document.getElementById('featured-fav');
    // Create a small featured carousel rotating through the first 5 animes (or less)
    const featuredItems = (methods.animes && methods.animes.length) ? methods.animes.slice(0, 5) : [];
    let currentIndex = 0;
    const dotsWrap = document.getElementById('carousel-dots');
    const prevBtn = document.getElementById('carousel-prev');
    const nextBtn = document.getElementById('carousel-next');

    function renderFeatured(idx) {
      const item = featuredItems[idx];
      if (!item) return;
      const spotlight = document.querySelector('.spotlight-card');
      // apply hero background to the spotlight card for a cinematic feel
      if (spotlight && item.image) {
        spotlight.classList.add('bg-hero');
        spotlight.style.backgroundImage = `linear-gradient(180deg, rgba(2,6,18,0.48), rgba(2,6,18,0.18)), url('${item.image}')`;
        spotlight.style.backgroundSize = 'cover';
        spotlight.style.backgroundPosition = 'center';
      }
      // keep small poster for small screens (we hide it on large screens via CSS)
      if (featured && item.image) featured.setAttribute('src', item.image);
      if (featuredTitle) featuredTitle.innerText = item.title || 'Featured Anime';
      // update dots
      if (dotsWrap) {
        dotsWrap.querySelectorAll('button').forEach((b, i) => b.classList.toggle('active', i === idx));
      }
      // announce the featured change for accessibility
      ariaLive.textContent = (item && item.title) ? `Now featuring ${item.title}` : '';
    }

    // Build dots
    if (dotsWrap) {
      dotsWrap.innerHTML = '';
      featuredItems.forEach((it, i) => {
        const b = document.createElement('button');
        b.className = 'dot';
        b.title = it.title || `Featured ${i+1}`;
        b.addEventListener('click', () => { currentIndex = i; renderFeatured(currentIndex); });
        dotsWrap.appendChild(b);
      });
    }

    // prev/next handlers
    if (prevBtn) prevBtn.addEventListener('click', () => { currentIndex = (currentIndex - 1 + featuredItems.length) % featuredItems.length; renderFeatured(currentIndex); });
    if (nextBtn) nextBtn.addEventListener('click', () => { currentIndex = (currentIndex + 1) % featuredItems.length; renderFeatured(currentIndex); });

    // play button for current item
    if (playBtn) playBtn.addEventListener('click', () => {
      methods.loadModalInfo(currentIndex, commentsAPI);
      lastFocused = document.activeElement;
      document.documentElement.classList.add('modal-open');
      setTimeout(() => closeModal.focus(), 0);
    });

    // open modal when clicking the featured poster itself
    const featuredPoster = document.getElementById('featured-poster');
    if (featuredPoster) {
      featuredPoster.style.cursor = 'pointer';
      featuredPoster.addEventListener('click', () => {
        // ensure we reference the correct global index of the featured item
        const globalIndex = (methods.animes && methods.animes.length) ? methods.animes.indexOf(featuredItems[currentIndex]) : currentIndex;
        methods.loadModalInfo(globalIndex, commentsAPI);
        lastFocused = document.activeElement;
        document.documentElement.classList.add('modal-open');
        setTimeout(() => closeModal.focus(), 0);
      });
    }

    // favorite button toggles the featured item id in local favs
    if (favBtn) favBtn.addEventListener('click', () => {
      const favs = JSON.parse(localStorage.getItem('favs') || '[]');
      const globalIndex = (methods.animes && methods.animes.length) ? methods.animes.indexOf(featuredItems[currentIndex]) : -1;
      if (globalIndex === -1) return;
      const existing = favs.indexOf(globalIndex);
      if (existing === -1) { favs.push(globalIndex); favBtn.classList.add('active'); showToast('Added to favorites'); }
      else { favs.splice(existing, 1); favBtn.classList.remove('active'); showToast('Removed from favorites'); }
      localStorage.setItem('favs', JSON.stringify(favs));
    });

    // start auto-rotate
    if (featuredItems.length > 1) {
      renderFeatured(currentIndex);
      setInterval(() => { currentIndex = (currentIndex + 1) % featuredItems.length; renderFeatured(currentIndex); }, 6000);
    } else if (featuredItems.length === 1) renderFeatured(0);
  } catch (err) {
    // silent fallback
    console.warn('Featured wiring failed', err);
  }
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

// Server-side search: when user types more than 2 chars, query Jikan search endpoint and re-render list
const serverSearch = debounce(async (e) => {
  const q = e.target.value.trim();
  // reset paging for new queries
  currentPage = 1;
  currentQuery = q;
  if (q.length <= 2) {
    // restore season list
    await methods.loadData(container, animesAPI, likesAPI);
    // show load more for season (assume more pages)
    if (typeof loadMoreBtn !== 'undefined') loadMoreBtn.style.display = '';
    return;
  }
  const url = `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(q)}&limit=24&page=1`;
  const added = await methods.loadData(container, url, likesAPI);
  // if fewer than limit returned, hide load more
  if (typeof loadMoreBtn !== 'undefined') loadMoreBtn.style.display = (added && added >= 24) ? '' : 'none';
}, 450);
if (searchInput) searchInput.addEventListener('keyup', serverSearch);

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
  ariaLive.textContent = 'Closed details dialog';
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
    ariaLive.textContent = 'Closed details dialog';
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
  }
});

// Close on Escape
document.addEventListener('keydown', (ev) => {
  if (ev.key === 'Escape' && document.documentElement.classList.contains('modal-open')) {
    document.documentElement.classList.remove('modal-open');
    ariaLive.textContent = 'Closed details dialog';
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
  }
});

// Basic focus trap: keep focus within modal when open
document.addEventListener('focusin', (e) => {
  if (!document.documentElement.classList.contains('modal-open')) return;
  const modalEl = document.getElementById('modal');
  if (!modalEl) return;
  if (!modalEl.contains(e.target)) {
    // move focus back to close button
    const closeBtn = document.getElementById('close-modal');
    if (closeBtn) closeBtn.focus();
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
