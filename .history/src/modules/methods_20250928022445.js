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
        <img class="w-full h-64 object-cover" src="${anime.image}" alt="${anime.title}">
        <div class="p-4">
          <h2 class="text-xl font-bold mb-2 truncate">${anime.title}</h2>
          <div class="flex justify-between items-center">
            <button class="comment-btn bg-red-500 text-white font-bold py-2 px-4 rounded-md hover:bg-red-600 transition duration-300">
              Comments
            </button>
            <div class="flex items-center space-x-2">
              <button class="like-btn text-gray-400 hover:text-red-500 transition duration-300">
                <i class="fas fa-heart"></i>
              </button>
              <span id="span-${i}" class="text-gray-400">${liked}</span>
            </div>
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
    document.getElementById('exampleModalLabel').innerText = anime.title;
    const comments = document.querySelector('.comments');
    comments.id = `anime-${index}`;
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
    const card = document.createElement('div');
    const comments = document.querySelector('.comments');
    const commentsNum = document.getElementById('commentsNumber');
    card.className = 'card';
    card.innerHTML = `<div class="card">
                  <div class="comment-head">
                  <h5 class="username">${username}</h5>
                  <span class="date">${creationDate}</span>
                  </div>
                  <p class="comment-block">${comment}</p>
                </div>`;
    this.animes[index].comments += 1;
    commentsNum.innerText = this.animes[index].comments;
    comments.appendChild(card);
  }

  async addNewComment(commentsAPI) {
    const username = document.getElementById('InputName');
    const comment = document.getElementById('commentToPost');
    const container = document.querySelector('.comments');
    const index = container.id.substring(6, container.id.length);
    const currentDate = new Date();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate() + 1).padStart(2, '0');
    const url = `${commentsAPI}?item_id=${index}`;
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
