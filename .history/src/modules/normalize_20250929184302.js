// Normalization helpers for anime items (Jikan API)
export function normalizeAnime(anime) {
  if (!anime) return null;
  const title = anime.title || (anime.titles && anime.titles[0] && anime.titles[0].title) || 'Untitled';
  const image = (anime.images && anime.images.jpg && (anime.images.jpg.image_url || anime.images.jpg.large_image_url)) || anime.image || './icons&imgs/dynasty-logo.svg';
  const imageHigh = (anime.images && anime.images.jpg && (anime.images.jpg.large_image_url || anime.images.jpg.image_url)) || anime.image || './icons&imgs/dynasty-logo.svg';
  const synopsis = anime.synopsis || anime.background || '';
  const genres = (anime.genres && anime.genres.map(g => g.name)) || (anime.genres_list && anime.genres_list.map(g => g.name)) || [];
  const ranking = anime.rank || anime.ranking || null;
  const mal_id = anime.mal_id || anime.id || null;
  const score = anime.score || null;
  const episodes = anime.episodes || null;
  const trailer = (anime.trailer && (anime.trailer.youtube_id ? `https://www.youtube.com/watch?v=${anime.trailer.youtube_id}` : anime.trailer.url)) || null;
  return { title, image, imageHigh, synopsis, genres, ranking, mal_id, score, episodes, trailer };
}

// Build a conservative srcset string for responsive images
export function buildSrcSet(image, imageHigh) {
  // If both are identical or missing, return single src
  if (!imageHigh || imageHigh === image) return null;
  // simple heuristic: provide two sizes
  return `${image} 400w, ${imageHigh} 1200w`;
}

export default { normalizeAnime, buildSrcSet };
