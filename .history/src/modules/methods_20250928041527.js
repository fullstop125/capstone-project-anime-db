import {
  getAnime, getComments, postComments, getLikes,
} from './APIsGET&POST.js';

export default class Methods {
  constructor() {
    this.animes = [];
  }

  async loadData(movieList, animeAPI, likesAPI) {
    const list = await getAnime(animeAPI);
    const likes = await getLikes(likesAPI);
    list.forEach((anime, i) => {
      const div = document.createElement('div');
      div.className =
        'movie-card bg-gray-800 rounded-lg shadow-xl overflow-hidden transform hover:-translate-y-2 transition duration-300';
      div.dataset.id = i;
      // store title for client-side filtering
      div.dataset.title = (anime.title || '').toLowerCase();

      let like = [];
      like = likes.filter((item) => item.item_id === `${i}`);
      let liked = 0;
      if (like.length > 0) liked = like[0].likes;

      div.innerHTML = `
        <img loading="lazy" class="poster" src="${anime.image}" alt="${anime.title}">
        <div class="overlay">
          <button class="icon-btn like-btn" aria-label="like">
            <i class="fas fa-heart"></i>
          </button>
          <button class="icon-btn comment-btn" aria-label="comments">
            <i class="fas fa-comment"></i>
          </button>
        </div>
        <div class="meta">
          <h3 class="title">${anime.title}</h3>
          <div class="card-meta">
            <div class="sub">${anime.genres ? anime.genres.join(', ').slice(0, 40) : ''}</div>
            <div class="likes"><span id="span-${i}">${liked}</span> <i class="fas fa-heart" style="opacity:0.6;margin-left:6px"></i></div>
          </div>
        </div>`;
      movieList.appendChild(div);
      const item = {
        id: i,
        title: anime.title,
        synopsis: anime.synopsis,
        image: anime.image,
        likes: liked,
        comments: 0,
      };
      this.animes.push(item);
      this.itemsCounter();
    });
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
    this.animes[index].comments = 0;
    document.getElementById('commentsNumber').innerText = this.animes[index].comments;
    document.getElementById('animeDescription').innerText = anime.synopsis;
    document.getElementById('modal-title').innerText = anime.title;
    document.getElementById('modal-image').setAttribute('src', anime.image);
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
      commentsArray.forEach((comment) => {
        this.addComment(
          index,
          comment.username,
          comment.creation_date,
          comment.comment,
        );
      });
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
            <div class="meta"><strong>${username}</strong> <span style="color:var(--muted); font-size:0.85rem; margin-left:8px">${creationDate}</span></div>
          </div>
        </div>
        <button class="comment-close" aria-label="Delete comment" title="Delete comment">&times;</button>
      </div>
      <p>${comment}</p>
    `;
    this.animes[index].comments += 1;
    commentsNum.innerText = this.animes[index].comments;
    comments.appendChild(div);
    // Wire the close button to remove the comment and decrement the counter
    const closeBtn = div.querySelector('.comment-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        // remove from DOM
        if (div && div.parentNode) div.parentNode.removeChild(div);
        // update internal count and UI
        if (typeof this.animes[index].comments === 'number' && this.animes[index].comments > 0) {
          this.animes[index].comments -= 1;
          commentsNum.innerText = this.animes[index].comments;
        }
      });
    }
  }

  async addNewComment(commentsAPI) {
    const username = document.getElementById('InputName');
    const comment = document.getElementById('commentToPost');
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
