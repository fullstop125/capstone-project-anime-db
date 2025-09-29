import {
  getAnime, getComments, postComments, getLikes,
} from './APIsGET&POST.js';

export default class Methods {
  constructor() {
    this.animes = [];
  }

  // stable key for a comment so we can persist locally deleted entries
  static commentKey(index, username, creationDate, comment) {
    return `${index}::${(username||'').toString().trim()}::${(creationDate||'').toString().trim()}::${(comment||'').toString().trim()}`;
  }

  // options: { append: boolean }
  async loadData(movieList, animeAPI, likesAPI, options = {}) {
    const append = options.append === true;
    // reset previous render unless appending
    if (!append) {
      if (movieList && movieList.innerHTML) movieList.innerHTML = '';
      this.animes = [];
    }

    // getAnime should return an array of items; Jikan returns { data: [...] }
    let list = [];
    try {
      list = await getAnime(animeAPI);
      if (list && list.data && Array.isArray(list.data)) list = list.data;
      if (!Array.isArray(list)) list = [];
    } catch (err) {
      console.warn('Failed to fetch anime list', err);
      list = [];
    }

    // Fallback sample data (small) to ensure UI has something to render
    if (!list || list.length === 0) {
      list = [
        {
          title: 'Sample: Skybound Saga',
          images: { jpg: { image_url: './icons&imgs/dynasty-logo.svg' } },
          synopsis: 'A thrilling adventure about sky pirates and ancient machines.',
          genres: [{ name: 'Action' }, { name: 'Adventure' }],
          rank: null,
        },
        {
          title: 'Sample: Night Blossom',
          images: { jpg: { image_url: './icons&imgs/dynasty-logo.svg' } },
          synopsis: 'A quiet story of love and secrets in a coastal town.',
          genres: [{ name: 'Drama' }, { name: 'Romance' }],
          rank: null,
        },
      ];
    }

    let likes = [];
    try {
      likes = await getLikes(likesAPI);
      if (!Array.isArray(likes)) likes = [];
    } catch (err) {
      // likes are optional - continue without them
      console.warn('Failed to fetch likes', err);
      likes = [];
    }
    // create a map for quick likes lookup by numeric item id
    const likeMap = new Map();
    likes.forEach((l) => { const id = Number(l.item_id); if (!Number.isNaN(id)) likeMap.set(id, l.likes); });
    list.forEach((anime, i) => {
      // ensure anime exists
      if (!anime) return;
      const baseIndex = this.animes.length;
      const globalIndex = baseIndex + i;
      // if Jikan style wrapper (item inside .data), already normalized above
      // normalize additional fields for richer UI
      const norm = {
        title: anime.title || (anime.titles && anime.titles[0] && anime.titles[0].title) || 'Untitled',
        // prefer a larger image when available for hero/backdrop use
        image: (anime.images && anime.images.jpg && (anime.images.jpg.image_url || anime.images.jpg.large_image_url)) || anime.image || './icons&imgs/dynasty-logo.svg',
        imageHigh: (anime.images && anime.images.jpg && (anime.images.jpg.large_image_url || anime.images.jpg.image_url)) || anime.image || './icons&imgs/dynasty-logo.svg',
        synopsis: anime.synopsis || anime.background || '',
        genres: (anime.genres && anime.genres.map(g => g.name)) || (anime.genres_list && anime.genres_list.map(g => g.name)) || [],
        ranking: anime.rank || anime.ranking || null,
        mal_id: anime.mal_id || anime.id || null,
        score: anime.score || null,
        episodes: anime.episodes || null,
        trailer: (anime.trailer && (anime.trailer.youtube_id ? `https://www.youtube.com/watch?v=${anime.trailer.youtube_id}` : anime.trailer.url)) || null,
      };
      // Note: normalization for Jikan/API fields is handled above in the "norm" object
      const div = document.createElement('div');
      div.className =
        'movie-card bg-gray-800 rounded-lg shadow-xl overflow-hidden transform hover:-translate-y-2 transition duration-300';
      // if caller requests hidden append (prefetch), mark added cards so they stay hidden until revealed
      if (options && options.hidden) div.classList.add('hidden-by-default');
  div.dataset.id = globalIndex;
      // store title for client-side filtering
  div.dataset.title = (anime.title || '').toLowerCase();

  const liked = likeMap.get(globalIndex) || 0;

      // richer card markup with poster wrap, play overlay and badges
      div.innerHTML = `
        <div class="card-inner">
          <div class="poster-wrap">
            <img loading="lazy" class="poster" src="${norm.image}" alt="${norm.title}">
            <div class="play-overlay" aria-hidden="true"><i class="fas fa-play"></i></div>
            <div class="badge">${norm.ranking ? `#${norm.ranking}` : 'NEW'}</div>
          </div>
          <div class="meta">
            <h3 class="title">${norm.title}</h3>
            <div class="card-meta">
              <div class="sub">${norm.genres ? norm.genres.join(', ').slice(0, 40) : ''}</div>
              <div class="meta-right" style="margin-left:auto; text-align:right; font-weight:700">${norm.score ? `★ ${norm.score}` : ''}${norm.episodes ? ` · ${norm.episodes} ep` : ''}</div>
              <div class="likes"><span id="span-${i}">${liked}</span> <i class="fas fa-heart" style="opacity:0.6;margin-left:6px"></i></div>
            </div>
            <div class="info-strip">${norm.synopsis ? (norm.synopsis.slice(0, 110) + '…') : ''}</div>
            <div class="actions">
              <button class="icon-btn fav-btn" aria-label="favorite"><i class="fas fa-bookmark"></i></button>
              <button class="icon-btn like-btn" aria-label="like"><i class="fas fa-heart"></i></button>
              <button class="icon-btn comment-btn" aria-label="comments"><i class="fas fa-comment"></i></button>
            </div>
          </div>
        </div>`;
      movieList.appendChild(div);
      const cleanSynopsis = Methods.sanitizeSynopsis(norm.synopsis || '');
      const item = {
        id: globalIndex,
        title: norm.title,
        synopsis: cleanSynopsis,
        image: norm.image,
        likes: liked,
        mal_id: norm.mal_id,
        score: norm.score,
        episodes: norm.episodes,
        trailer: norm.trailer,
        comments: 0,
      };
      this.animes.push(item);
      this.itemsCounter();
    });
    // return how many items were processed so callers can decide whether more pages exist
    return list.length;
  }

  // remove typical "written by" attributions and trailing author credit lines
  static sanitizeSynopsis(text) {
    if (!text) return '';
    // remove lines that start with 'Written by' or 'By' or 'Written:' or 'Source:' or '—'
    const lines = text.split(/\r?\n/).map(l => l.trim());
    const filtered = lines.filter((l) => {
      const low = l.toLowerCase();
      if (!l) return false;
      if (low.startsWith('written by')) return false;
      if (low.startsWith('by ')) return false;
      if (low.startsWith('source:')) return false;
      // some APIs include '— Author' or similar
      if (/^—|^\u2014/.test(l)) return false;
      return true;
    });
    // also remove trailing 'Written by' fragments inside the last 100 chars
    let joined = filtered.join(' ');
    joined = joined.replace(/\s*written by[\s\S]*$/i, '');
    return joined.trim();
  }

  increaseLikes(index) {
    const likeSpan = document.getElementById(`span-${index}`);
    this.animes[index].likes += 1;
    likeSpan.innerText = this.animes[index].likes;
  }

  itemsCounter() {
    const animesNum = document.getElementById('animesNum');
    animesNum.innerText = this.animes.length;
  }

  async loadModalInfo(index, commentsAPI) {
    const anime = this.animes[index];
    // don't reset comments prematurely; we'll update after fetching existing comments
    const commentsNumEl = document.getElementById('commentsNumber');
    if (commentsNumEl) commentsNumEl.innerText = this.animes[index].comments || 0;
    const description = document.getElementById('animeDescription');
    const raw = anime.synopsis || 'No description provided.';
    // render with read-more if too long (use instance method)
    if (description) this.renderWithReadMore(description, raw, 400);
    document.getElementById('modal-title').innerText = anime.title;
    document.getElementById('modal-image').setAttribute('src', anime.image);
    // add trailer embed (YouTube iframe) or fallback link if available
    const existingTrailerWrap = document.getElementById('trailer-wrap');
    if (existingTrailerWrap && existingTrailerWrap.parentNode) existingTrailerWrap.parentNode.removeChild(existingTrailerWrap);
    if (anime.trailer) {
      const right = document.querySelector('.modal-inner .right');
      if (right) {
        const trailerWrap = document.createElement('div');
        trailerWrap.id = 'trailer-wrap';
        trailerWrap.className = 'trailer-wrap';

        // try to detect YouTube video id and embed; otherwise provide a safe external link
        let ytId = null;
        try {
          const parsed = new URL(anime.trailer);
          if (parsed.hostname.includes('youtube.com')) ytId = parsed.searchParams.get('v');
          if (parsed.hostname.includes('youtu.be')) ytId = parsed.pathname.replace(/^\//, '');
        } catch (e) {
          // fallback regex
          const m = String(anime.trailer).match(/[?&]v=([^&]+)/);
          if (m) ytId = m[1];
          const m2 = String(anime.trailer).match(/youtu\.be\/(.+)$/);
          if (!ytId && m2) ytId = m2[1];
        }

        if (ytId) {
          const iframe = document.createElement('iframe');
          iframe.setAttribute('src', `https://www.youtube.com/embed/${ytId}?rel=0`);
          iframe.setAttribute('title', `${anime.title} — trailer`);
          iframe.setAttribute('frameborder', '0');
          iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
          iframe.setAttribute('allowfullscreen', '');
          iframe.className = 'trailer-iframe';
          trailerWrap.appendChild(iframe);
        } else {
          const link = document.createElement('a');
          link.id = 'watch-trailer';
          link.className = 'cta';
          link.href = anime.trailer;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          link.innerText = 'Watch trailer';
          trailerWrap.appendChild(link);
        }

        right.insertBefore(trailerWrap, right.querySelector('div'));
      }
    }
    // When modal image loads, add loaded class for sticker animation
    const modalImg = document.getElementById('modal-image');
    if (modalImg) {
      if (modalImg.complete) modalImg.classList.add('loaded');
      else modalImg.addEventListener('load', () => modalImg.classList.add('loaded'));
    }
  const badge = document.getElementById('sticker-badge');
  if (badge) badge.innerText = anime.title.length > 28 ? `${anime.title.slice(0, 25)}…` : anime.title;
    const comments = document.getElementById('comments');
    comments.dataset.id = index;
    comments.innerHTML = '';
    const commentsURL = `${commentsAPI}?item_id=${index}`;
    const commentsArray = await getComments(commentsURL);
    if (Array.isArray(commentsArray)) {
      // load locally-deleted keys from storage
      const deleted = JSON.parse(localStorage.getItem('deletedComments') || '[]');
      // filter out comments that were deleted locally
      const filtered = commentsArray.filter((c) => {
        const key = Methods.commentKey(index, c.username, c.creation_date, c.comment);
        return !deleted.includes(key);
      });
      // reflect filtered count
      this.animes[index].comments = filtered.length;
      if (commentsNumEl) commentsNumEl.innerText = this.animes[index].comments;
      filtered.forEach((comment) => {
        this.addComment(
          index,
          comment.username,
          comment.creation_date,
          comment.comment,
        );
      });
    }
  }

    renderWithReadMore(container, text, maxChars = 300) {
      // clear
      container.innerHTML = '';
      const short = text.slice(0, maxChars);
      const needsToggle = text.length > maxChars;

      const body = document.createElement('div');
      body.className = 'anime-desc-body';
      body.textContent = needsToggle ? short + '…' : text;

      if (!needsToggle) body.classList.add('expanded');

      container.appendChild(body);

      if (needsToggle) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'read-more-btn';
        btn.setAttribute('aria-expanded', 'false');
        btn.textContent = 'Read more';

        btn.addEventListener('click', () => {
          const expanded = btn.getAttribute('aria-expanded') === 'true';
          if (expanded) {
            body.textContent = short + '…';
            body.classList.remove('expanded');
            btn.textContent = 'Read more';
            btn.setAttribute('aria-expanded', 'false');
          } else {
            body.textContent = text;
            body.classList.add('expanded');
            btn.textContent = 'Show less';
            btn.setAttribute('aria-expanded', 'true');
          }
          // announce visually for screen readers via aria-live container if present
          const live = container.querySelector('[aria-live]');
          if (live) live.textContent = btn.textContent + ' description';
        });

        container.appendChild(btn);
      }
    }
  addComment(index, username, creationDate, comment) {
    const div = document.createElement('div');
    const comments = document.getElementById('comments')
      || document.querySelector('.comments')
      || (() => {
        const el = document.createElement('div');
        el.id = 'comments';
        document.body.appendChild(el);
        return el;
      })();
    const commentsNum = document.getElementById('commentsNumber');
    div.className = 'comment';
    // Add a data attribute for identification (optional) and include a close button
    div.setAttribute('data-author', username);
    div.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; gap:12px; margin-bottom:8px">
        <div style="display:flex; gap:12px; align-items:center">
          <div class="avatar">${(username && username[0]) ? username[0].toUpperCase() : 'U'}</div>
          <div>
            <div class="comment-meta"><strong>${username}</strong> <span style="color:var(--muted); font-size:0.85rem; margin-left:8px">${creationDate}</span></div>
          </div>
        </div>
        <button class="comment-close" aria-label="Delete comment" title="Delete comment">&times;</button>
      </div>
      <p>${comment}</p>
    `;
    this.animes[index].comments += 1;
    commentsNum.innerText = this.animes[index].comments;
    comments.appendChild(div);
    // Wire the close button to show a small inline confirm box before deleting
    const closeBtn = div.querySelector('.comment-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        // prevent duplicate confirm boxes
        if (div.querySelector('.confirm-box')) return;
        const confirmBox = document.createElement('div');
        confirmBox.className = 'confirm-box';
        confirmBox.innerHTML = `
          <span>Delete this comment?</span>
          <div class="confirm-actions">
            <button class="confirm-yes">Delete</button>
            <button class="confirm-no">Cancel</button>
          </div>
        `;
        div.appendChild(confirmBox);

        const yes = confirmBox.querySelector('.confirm-yes');
        const no = confirmBox.querySelector('.confirm-no');

        // Focus the confirm button for keyboard users
        if (yes && typeof yes.focus === 'function') yes.focus();

        yes.addEventListener('click', () => {
          // persist deletion locally so it doesn't reappear on reload
          const key = Methods.commentKey(index, username, creationDate, comment);
          const deleted = JSON.parse(localStorage.getItem('deletedComments') || '[]');
          if (!deleted.includes(key)) {
            deleted.push(key);
            localStorage.setItem('deletedComments', JSON.stringify(deleted));
          }
          // animate removal
          div.classList.add('removing');
          setTimeout(() => {
            if (div && div.parentNode) div.parentNode.removeChild(div);
            // update internal count and UI
            if (typeof this.animes[index].comments === 'number' && this.animes[index].comments > 0) {
              this.animes[index].comments -= 1;
              commentsNum.innerText = this.animes[index].comments;
            }
            // cleanup confirm box if still present
            if (confirmBox && confirmBox.parentNode) confirmBox.parentNode.removeChild(confirmBox);
          }, 320);
        });

        no.addEventListener('click', () => {
          if (confirmBox && confirmBox.parentNode) confirmBox.parentNode.removeChild(confirmBox);
          // return focus to close button
          if (closeBtn && typeof closeBtn.focus === 'function') closeBtn.focus();
        });
      });
    }
    // entrance animation for new comment
    requestAnimationFrame(() => {
      div.classList.add('enter');
      requestAnimationFrame(() => div.classList.add('show'));
    });
  }

  async addNewComment(commentsAPI) {
    const username = document.getElementById('InputName');
    const comment = document.getElementById('commentToPost');
    const small = document.getElementById('small');
    if (!username || !comment) return;
    // basic validation
    if (!username.value.trim() || !comment.value.trim()) {
      if (small) small.classList.remove('hidden');
      return;
    }
    if (small) small.classList.add('hidden');
    let container = document.getElementById('comments') || document.querySelector('.comments');
    if (!container) {
      container = document.createElement('div');
      container.id = 'comments';
      container.dataset.id = 0;
      document.body.appendChild(container);
    }
    const index = container.dataset.id;
    const currentDate = new Date();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    const url = `${commentsAPI}`;
    await postComments(index, username.value, comment.value, url);
    this.addComment(
      index,
      username.value,
      `${currentDate.getFullYear()}-${month}-${day}`,
      comment.value,
    );
    username.value = '';
    comment.value = '';
  }
}
