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
});

methods.loadData(container, animesAPI, likesAPI);

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
  if (e.target.closest('.comment-btn')) {
    const commentsList = commentsAPI;
    methods.loadModalInfo(index, commentsList);
    // open modal and manage focus
    lastFocused = document.activeElement;
    modal.classList.remove('hidden');
    // give the close button focus for immediate keyboard accessibility
    setTimeout(() => closeModal.focus(), 0);
  } else if (e.target.closest('.like-btn')) {
    methods.increaseLikes(index);
    postLikes(index, likesAPI);
  }
});

closeModal.addEventListener('click', () => {
  modal.classList.add('hidden');
  if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
});

// Close modal on overlay click
modal.addEventListener('click', (ev) => {
  if (ev.target === modal) {
    modal.classList.add('hidden');
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
  }
});

// Close on Escape
document.addEventListener('keydown', (ev) => {
  if (ev.key === 'Escape' && !modal.classList.contains('hidden')) {
    modal.classList.add('hidden');
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
