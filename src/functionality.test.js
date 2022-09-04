/**
 * @jest-environment jsdom
 */

import Methods from './modules/methods.js';

document.body.innerHTML = `<nav class="navbar navbar-expand-lg navbar-dark fixed-top ">
  <div class="container-fluid">
    <a class="navbar-brand d-flex justify-content-center align-items-center gap-1 mt-2 mt-lg-2 text-xl-start" href="#">
      <img class="logo" src="#" alt="Logo">
      <h2 class="logo-text">Dynasty Entertainment</h2>
    </a>
    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
      <span class="navbar-toggler-icon"></span>
    </button>
    <div class="collapse navbar-collapse" id="navbarSupportedContent">
      <ul class="navbar-nav ms-auto mb-2 mb-lg-0">
        <li class="nav-item">
          <a class="nav-link text-white active" href="#">Animes(<span id="animesNum">0</span>)</a>
        </li>
        <li class="nav-item">
          <a class="nav-link text-lg-start text-white"  href="#">Newest</a>
        </li>
        <li class="nav-item">
          <a class="nav-link text-white" href="#">Rank</a>
        </li>
      </ul>
    </div>
  </div>
  </nav>
  <div class="movie-list">
  <li>
  <img src="dummyImage"><h2 id="title-0">dummyAnime</h2>
                    <div class="container">
                    <button id="cmntb-0"class="learn-more" data-bs-toggle="modal" data-bs-target="#exampleModal">
                      <span class="circle" aria-hidden="true">
                        <span id="cmnti-0" class="icon arrow"></span>
                      </span>
                      <span id="cmntt-0" class="button-text">Comment</span>
                    </button>
                  </div>
                    <div id="liked-0" class="toggle">
                <input id="likei-0" type="checkbox" class="heart-check">
              
                <label id="likel-0" for="heart-check" class="heart">
                  <svg id="likes-0" viewBox="0 0 24 22" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
                    <path id="likep-0" class="initial" d="M11.8189091,20.3167303 C17.6981818,16.5505143 20.6378182,12.5122542 20.6378182,8.20195014 C20.6378182,5.99719437 18.8550242,4 16.3283829,4 C13.777264,4 12.5417153,6.29330284 11.8189091,6.29330284 C11.0961029,6.29330284 10.1317157,4 7.30943526,4 C4.90236126,4 3,5.64715533 3,8.20195014 C3,12.5122346 5.93963637,16.5504946 11.8189091,20.3167303 Z"></path>
                    <path class="stroke" fill="none" d="M11.8189091,20.3167303 C17.6981818,16.5505143 20.6378182,12.5122542 20.6378182,8.20195014 C20.6378182,5.99719437 18.8550242,4 16.3283829,4 C13.4628072,4 10.284995,6.64162063 10.284995,8.70392731 C10.284995,10.0731789 10.8851209,10.9874447 11.8189091,10.9874447 C12.7526973,10.9874447 13.3528232,10.0731789 13.3528232,8.70392731 C13.3528232,6.64162063 10.1317157,4 7.30943526,4 C4.90236126,4 3,5.64715533 3,8.20195014 C3,12.5122346 5.93963637,16.5504946 11.8189091,20.3167303 Z"></path>
                  </svg>
                </label>
              </div>
              <p class="card-body__likes like-text"> <span id="span-0">0</span> likes</p>
              </li>
  <!-- Modal -->
  <div class="modal fade" id="exampleModal" tabindex="1" aria-hidden="true">
  <div class="modal-dialog">
  <div class="modal-content">
  <div class="modal-header">
    <h5 class="modal-title" id="exampleModalLabel"></h5>
    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
  </div>
  <div class="modal-body d-flex align-items-center flex-column container-fluid">
    <img id="modal-image" class="img-fluid rounded shadow w-50" src="#" alt="anime sticker">
  <h1 id="modal-title" class="text-center"></h1>
  <p id = "animeDescription" class="mx-4"></p>
  <h3>Comments (<span id = "commentsNumber">0</span>)</h3>
    <div class="comments">
  
    </div>
  <form>
    <div class="mb-3">
      <label for="InputName" class="form-label">Name</label>
      <input type="text" class="form-control" id="InputName" aria-describedby="emailHelp">
      
    </div>
    <div class="mb-3">
      <label for="InputText" class="form-label">Comment</label>
      <textarea class="form-control" id="commentToPost"></textarea>
    </div>
    <small class="text-danger">Both fields must be filled</small>
    <button id="submitComment" type="submit" class="btn btn-outline-primary">comment</button>
  </form>
  </div>
  </div>
  </div>
  </div>
  </div>`;

const methods = new Methods();
methods.animes = [
  {
    id: 0,
    title: 'dummyTitle',
    synopsis: 'dummySynopsis',
    image: 'dummyImage',
    likes: 3,
    comments: 0,
  },
  {
    id: 1,
    title: 'dummyTitle',
    synopsis: 'dummySynopsis',
    image: 'dummyImage',
    likes: 2,
    comments: 0,
  },
];

describe('Number of items.', () => {
  test('Retrieve number of items.', () => {
    const itemsNum = document.getElementById('animesNum');
    methods.itemsCounter();
    expect(itemsNum.innerText).toBe(2);
  });
});

describe('Number of likes.', () => {
  test('Increase number of likes.', () => {
    const Num = document.getElementById('span-0');
    methods.increaseLikes(0);
    expect(Num.innerText).toBe(4);
  });
});

describe('Number of comments.', () => {
  test('Retrieve number of items.', () => {
    const Num = document.getElementById('commentsNumber');
    methods.addComment(1, 'dummyName', 'dummyDate', 'dummyComment');
    expect(Num.innerText).toBe(1);
  });
});
