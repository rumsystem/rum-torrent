# rum-torrent
RUM Private Torrent

`⚠️ Warning: This project is under active development and refactoring. Everything will change soon.`

This is a private torrent system which based on [WebTorrent](https://github.com/webtorrent/webtorrent) tech stack.

## Quick demo

```bash
$ npx rum-torrent --seed='magnet:?xt=urn:btih:D70A26672171D6BE180DE3B01FA11B24F8B67884&dn=The+Last+of+Us+S01E07+1080p+WEB+H264-CAKES&tr=http%3A%2F%2Fp4p.arenabg.com%3A1337%2Fannounce&tr=udp%3A%2F%2F47.ip-51-68-199.eu%3A6969%2Fannounce&tr=udp%3A%2F%2F9.rarbg.me%3A2780%2Fannounce&tr=udp%3A%2F%2F9.rarbg.to%3A2710%2Fannounce&tr=udp%3A%2F%2F9.rarbg.to%3A2730%2Fannounce&tr=udp%3A%2F%2F9.rarbg.to%3A2920%2Fannounce&tr=udp%3A%2F%2Fopen.stealth.si%3A80%2Fannounce&tr=udp%3A%2F%2Fopentracker.i2p.rocks%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.cyberia.is%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.dler.org%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.internetwarriors.net%3A1337%2Fannounce&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.openbittorrent.com%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337&tr=udp%3A%2F%2Ftracker.pirateparty.gr%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.tiny-vps.com%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.torrent.eu.org%3A451%2Fannounce'
```

![Screenshot 2023-03-02 at 9 54 29 PM](https://user-images.githubusercontent.com/233022/223571763-1af6c143-fa87-4774-b442-b643d5c72b46.jpg)

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

### Using `Erc721(ETH)` as `PT` verification

Integrate Private Torrent with Ethereum. You can use `Erc721` as `PT` verification. This project in `proof of concept` stage. You can use it as a reference to build your own `PT` system.

#### Run you own `PT tracker`

You need [bistrot](https://github.com/Press-One/bistrot) to support this feature.

```bash
$ npm install -g bistrot
```

Run your own `PT tracker` first.

- Use `--auth` to enable `Erc721` verification.
- Use `--eth` to specify the RPC endpoint of your `Ethereum` node.

```bash
$ rum-tracker --auth --eth=https://prs-bp64.press.one/ethrpc
```

#### Publish files

You need [bistrot](https://github.com/Press-One/bistrot) to support this feature. In the future version, the `bitrot` will not be needed.

```bash
$ npm install -g bistrot
```

It's time to publish files.

- You can publish files via `magnet links`, `torrent files` or `media files`.
- Use `--key` to specify your ethereum private key.
- Use `--eth` to specify the RPC endpoint of your `Ethereum` node.
- use `--tr` to specify your `PT tracker`.

```bash
$ rum-publish --file='magnet:xxxxxxx' --key='1234567890' --eth='https://prs-bp64.press.one/ethrpc' --tr='https://prs-bp89.press.one/announce'
$ rum-publish --file='/a/b/c.torrent' --key='1234567890' --eth='https://prs-bp64.press.one/ethrpc' --tr='https://prs-bp89.press.one/announce'
$ rum-publish --file='/a/b/d/d/e.mp4' --key='1234567890' --eth='https://prs-bp64.press.one/ethrpc' --tr='https://prs-bp89.press.one/announce'
```

If success, you will get the meta data of the file, a `magnet link` (magnet), and a `Erc721` contract address (nftadd) as the result. You can share the `magnet link` to your friends. Send your friend a `Erc721` token so they can download the file.

Result example:

```javascript
{
  chainApi: [ 'https://prs-bp64.press.one/ethrpc' ],
  btih: '79913029e558d7f1321089d06affc1808d505e72',
  nftadd: '0x5DbC625DDED0b815096b6a662997C469638c2cE4',
  symbol: 'RUMPT-79913029e558d7f1321089d06affc1808d505e72',
  baseTokenURI: 'magnet:?xt=urn:btih:79913029e558d7f1321089d06affc1808d505e72&ti=',
  magnet: 'magnet:?xt=urn:btih:79913029e558d7f1321089d06affc1808d505e72&na=0x5DbC625DDED0b815096b6a662997C469638c2cE4&tr=tr=https%3A%2F%2Fprs-bp2.press.one%2Fannounce%2F%7B%7BRUM_PT_TOKEN%7D%7D'
}
```

#### Download files

You can download files via `magnet links` or `torrent files` as usual. But you need to specify your `Ethereum` private key to sign the meta data in order to pass the `PT` verification.

```bash
$ rum-torrent --seed='magnet:?xt=urn:btih:79913029e558d7f1321089d06affc1808d505e72&dn=lego.jurassic.world.the.legend.of.isla.nublar.s01e02.stampede.internal.720p.hdtv.x264-w4f.mkv&tr=http%3A%2F%2F127.0.0.1:8965%2Fannounce%2F{{RUM_PT_TOKEN}}&na=0xBf697e640e21CFe211a46201E0f4e6551667b028' --key=30b3185138df421ea913486c03d0c08a6b62a6adac2f96d1c0a989a05fe427c1
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

### Coding with the `Erc721(ETH) PT Tracker`

- [Publish Files](https://github.com/rumsystem/rum-torrent/blob/main/lib/torrent.mjs#L228)
