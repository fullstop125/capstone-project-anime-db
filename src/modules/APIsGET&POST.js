export const getAnime = async (url) => {
  const options = {
    method: 'GET',
    headers: {
      'X-RapidAPI-Key': '27a477cbdamsh49c8e3678f442ecp14a4f5jsn0efcece4205d',
      'X-RapidAPI-Host': 'anime-db.p.rapidapi.com',
    },
  };
  const response = await fetch(url, options).then((res) => res.json());
  return response.data;
};

export const getLikes = async (url) => {
  const response = await fetch(url).then((res) => res.json());
  return response;
};

export async function getComments(url) {
  const response = await fetch(url).then((res) => res.json());
  return response;
}

export const postComments = async (id, username, comment, url) => {
  await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      item_id: id,
      username,
      comment,
    }),
  });
};

export const postLikes = async (id, url) => {
  await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      item_id: id,
    }),
  });
};
