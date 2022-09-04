import './style.css';
import './style.scss';
import Methods from './modules/methods.js';
import { postLikes } from './modules/APIsGET&POST.js';

const methods = new Methods();
const animesAPI = 'https://anime-db.p.rapidapi.com/anime?page=1&size=1000&genres=Award%20Winning%2CAction%2CHorror%2CSports%2CSupernatural%2CFantasy%2CDrama%2CComedy%2CAdventure%2CRomance%2CSci-Fi&sortBy=ranking&sortOrder=asc';
const likesAPI = 'https://us-central1-involvement-api.cloudfunctions.net/capstoneApi/apps/qvRewcmh88OIPOPoLZPA/likes/';
const commentsAPI = 'https://us-central1-involvement-api.cloudfunctions.net/capstoneApi/apps/qvRewcmh88OIPOPoLZPA/comments';
const container = document.querySelector('.movie-list');
const submit = document.getElementById('submitComment');
const username = document.getElementById('InputName');
const comment = document.getElementById('commentToPost');
const small = document.getElementById('small');

methods.loadData(container, animesAPI, likesAPI);

container.addEventListener('click', (e) => {
  const element = e.target.id.substring(0, 4);
  const index = e.target.id.substring(6, e.target.id.length);
  if (element === 'like') {
    methods.increaseLikes(index);
    postLikes(index, likesAPI);
  } else if (element === 'cmnt') {
    const commentsList = commentsAPI;
    methods.loadModalInfo(index, commentsList);
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
