const songList = document.getElementById('songList');
const ratingContainer = document.getElementById('rating');

function addSong(albumCover, songName, artist, genres, link) {
  // Create song item container
  const songItem = document.createElement('div');
  songItem.className = 'song-item';


  // Create album cover element
  const albumCoverImg = document.createElement('img');
  albumCoverImg.src = albumCover;
  albumCoverImg.alt = 'album cover';
  albumCoverImg.className = 'album-cover';
  songItem.appendChild(albumCoverImg);

  // Create song info container
  const songInfo = document.createElement('div');
  songInfo.className = 'song-info';

  // Create song name element
  const songNameDiv = document.createElement('a');
  songNameDiv.className = 'song-name';
  songNameDiv.textContent = songName;
  songNameDiv.href = link;
  songNameDiv.target = '_blank';
  songInfo.appendChild(songNameDiv);

  // Create artist element
  const artistDiv = document.createElement('div');
  artistDiv.className = 'artist';
  artistDiv.textContent = artist;
  songInfo.appendChild(artistDiv);

  // Create genres container
  const genresDiv = document.createElement('div');
  genresDiv.className = 'genres';
  genres.forEach((genre, i) => {
    if (i > 2) return;
      const genreSpan = document.createElement('span');
      genreSpan.className = 'genre';
      genreSpan.textContent = genre;
      genresDiv.appendChild(genreSpan);
  });
  songInfo.appendChild(genresDiv);

  // Append song info to song item
  songItem.appendChild(songInfo);

  // Append song item to song list
  songList.appendChild(songItem);
}

function setRating(rating) {
  ratingContainer.innerHTML = '';
  for (let i = 1; i <= 10; i++) {
      const star = document.createElement('span');
      star.className = 'star';
      star.innerHTML = '&#9733;'; // Unicode for star character
      if (i <= rating) {
          star.classList.add('filled');
      }
      ratingContainer.appendChild(star);
  }
}

function throwErr(e) {
  console.log(e)
  console.error(e.message);
  const msg = document.getElementById("error");
  msg.textContent = `ERROR:\n${e.message}`
  msg.style.fontSize = "16px";
  msg.style.color = "red";
  msg.style.transform = "translate(-50%, 400%)";

  document.getElementById("mainMenu").style.display = "block";
  document.getElementById("loading").style.display = "none";
}
async function getResults() {
    const url = document.getElementById('spotifyurl').value
    document.getElementById("mainMenu").style.display = "none";
    document.getElementById("loading").style.display = "block";

    const regex = /playlist\/([a-zA-Z0-9]+)/;
    const match = url.match(regex);
    console.log(match);
    if (match == null || match.length < 2) return throwErr({message: "Invalid URL"})
    const response = await fetch(`http://localhost:3000/api/${match[1]}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      }).catch(e => throwErr(e));
    response.json().then(data => {

        if (data.songs.error != null || data.songs.error != undefined) return throwErr(data.songs.error);
        Object.keys(data.songs).forEach(song => {
          const songInfo = data.songs[song];
          console.log(songInfo)
          addSong(songInfo.url, song, songInfo.artists.join(", "), songInfo.genres, songInfo.songurl)
        })

        const prompt = data.prompt;

        const pattern = /RATING:\s*(\d+)\/10/;
        const match = prompt.match(pattern);

        setRating(parseInt(match[1]));
        document.getElementById("review").textContent = data.prompt.replace(pattern, "");
        document.getElementById("data").style.display = "block";
        document.getElementById("loading").style.display = "none";
    }).catch(e => {
      throwErr(e)
    })


}