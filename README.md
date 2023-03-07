# rum-torrent
RUM Private Torrent

`⚠️ Warning: This project is under active development and refactoring. Everything will change soon.`

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

## Integrate into your app

### Install

```bash
$ npm install -s rum-torrent
```


