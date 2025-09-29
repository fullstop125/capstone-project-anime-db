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

      let like = [];
      like = likes.filter((item) => item.item_id === `${i}`);
      let liked = 0;
      if (like.length > 0) liked = like[0].likes;

      div.innerHTML = `
        <img class="poster" src="${anime.image}" alt="${anime.title}">
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
    div.className = 'bg-gray-700 p-3 rounded-lg';
    div.innerHTML = `
      <div class="flex justify-between items-center mb-2">
        <h5 class="font-bold text-red-500">${username}</h5>
        <span class="text-xs text-gray-400">${creationDate}</span>
      </div>
      <p class="text-gray-300">${comment}</p>
    `;
    this.animes[index].comments += 1;
    commentsNum.innerText = this.animes[index].comments;
    comments.appendChild(div);
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
