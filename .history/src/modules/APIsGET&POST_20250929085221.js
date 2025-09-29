export const getAnime = async (url) => {
  // If URL contains 'jikan.moe' it's a public API; fetch without special headers
  try {
    const response = await fetch(url, { method: 'GET' });
    return await response.json();
  } catch (err) {
    console.warn('getAnime fetch failed', err);
    throw err;
  }
};

// Lightweight health-check with timeout to confirm public API availability
export async function checkAPI(url, timeout = 3000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { method: 'GET', signal: controller.signal });
    clearTimeout(id);
    return res.ok;
  } catch (err) {
    clearTimeout(id);
    return false;
  }
}

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
