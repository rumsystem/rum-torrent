# rum-torrent
RUM Private Torrent

`⚠️ Warning: This project is under active development and refactoring. Everything will change soon.`

This is a private torrent system which based on [WebTorrent](https://github.com/webtorrent/webtorrent) tech stack.

Quick demo:

```
$ rum-torrent --seed='magnet:?xt=urn:btih:D70A26672171D6BE180DE3B01FA11B24F8B67884&dn=The+Last+of+Us+S01E07+1080p+WEB+H264-CAKES&tr=http%3A%2F%2Fp4p.arenabg.com%3A1337%2Fannounce&tr=udp%3A%2F%2F47.ip-51-68-199.eu%3A6969%2Fannounce&tr=udp%3A%2F%2F9.rarbg.me%3A2780%2Fannounce&tr=udp%3A%2F%2F9.rarbg.to%3A2710%2Fannounce&tr=udp%3A%2F%2F9.rarbg.to%3A2730%2Fannounce&tr=udp%3A%2F%2F9.rarbg.to%3A2920%2Fannounce&tr=udp%3A%2F%2Fopen.stealth.si%3A80%2Fannounce&tr=udp%3A%2F%2Fopentracker.i2p.rocks%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.cyberia.is%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.dler.org%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.internetwarriors.net%3A1337%2Fannounce&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.openbittorrent.com%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337&tr=udp%3A%2F%2Ftracker.pirateparty.gr%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.tiny-vps.com%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.torrent.eu.org%3A451%2Fannounce'
```

## Use as CLI

### Install

```bash
$ npm install -g rum-torrent
```

### Run to `download` (and seed at the same time)

Via magnet link:

```bash
$ rum-torrent --seed='magnet:**********'
```

Via .torrent file:

```bash
$ rum-torrent --seed='/x/y/z.torrent'
```

### Run to `seed` you own File

```bash
$ rum-torrent --seed='/a/b/c.mp4'
```

### `Play` the file while downloading or seeding

Get the `files` value from the terminal UI. It should be a http URL. Play it in your media player app or in your browser (if your browser supports this specific format).

### Run as a `tracker`

You DO NOT need to run this. Do this only if you want to run your own tracker.

```bash
$ rum-tracker
```

## Integrate into your app

### Install

```bash
$ npm install -s rum-torrent
```

### Use to `download` or `seed`

```js
// import the module
import { torrent } from 'rum-torrent';
// init
await torrent.init({ callback: async (status) => {
    // do anything you want to handle the network status
    console.info(status);
} });
await torrent.seed(magnetLink_torrentFile_mediaFile);
```

### Use as a `tracker`

```js
// import the module
import { tracker } from 'rum-torrent';
// init
await tracker.init();
```
