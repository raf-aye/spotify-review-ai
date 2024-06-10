require('dotenv').config();

let songs = {}
let allArtists = {}



module.exports = async function(playlistID) {
    const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'post',
        body: `grant_type=client_credentials&client_id=${process.env.SPOTIFY_CLIENT_ID}&client_secret=${process.env.SPOTIFY_CLIENT_SECRET}`,
        headers: {'Content-Type': 'application/x-www-form-urlencoded'}
    });

    const data = await response.json();
   return getPlaylist(playlistID, data.access_token)
}

async function getPlaylist(playlistID, token) {
    songs = {}
    allArtists = {};
    const response = await fetch("https://api.spotify.com/v1/playlists/" + playlistID, {
        method: 'get',
        headers: {'Authorization': `Bearer ${token}`}
    }).catch(e => {return {error: e.message}});

    const data = await response.json().catch(e => {return {error: {message: e.message}}});

    if (data.error != null || data.error != undefined) return {error: data.error};
    for (let i = 0; i < data.tracks.items.length; i++) {
        let song = data.tracks.items[i].track;

        let image = song.album.images;
        if (image == null || image.length == 0) image = null;
        else image = image[0].url

        const info = { "popularity": song.popularity, "explicit": song.explicit, "length": song.duration_ms, "url": image, "songurl": song.external_urls.spotify}
        const artist = await getArtistInfo(song.artists[0].id, token)
        if (artist.error != null || artist.error != undefined) return artist;
        info.genres = artist.genres
        info["artists"] = song.artists.map(x => x.name)
        songs[song.name] = info;
    }
    /*
    data.tracks.items.forEach(async entry => {
        let song = entry.track;
        
        const info = { "popularity": song.popularity, "explicit": song.explicit, "length": song.duration_ms, "url": song.album.images[0].url}
        const artist = await getArtistInfo(song.artists[0].id, token)

        info.genres = artist.genres
        info["artists"] = song.artists.map(x => x.name)
        songs[song.name] = info;
    })
    */

    return songs;
}

async function getArtistInfo(artistID, token) {
    if (allArtists[artistID] != undefined) {
        allArtists[artistID].count += 1
        return allArtists[artistID]
    }

    const response = await fetch("https://api.spotify.com/v1/artists/" + artistID, {
        method: 'get',
        headers: {'Authorization': `Bearer ${token}`}
    }).catch(e => {return {error: e.message}});

    const data = await response.json().catch(e => {return {error: {message: e.message}}});

    data.count = 1;
    allArtists[artistID] = data;
    return data;
}