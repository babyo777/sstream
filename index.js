import express from "express";
import { Innertube, UniversalCache } from "youtubei.js";
import { Readable } from "stream";
import { decrypt, encrypt } from "tanmayo7lock";
import { VibeCache } from "./cache/cache.js";
import dotenv from "dotenv";
dotenv.config();
const app = express();
const PORT = process.env.PORT || 8000;
import useCors from "cors";
app.use(
  useCors({
    origin: true,
    credentials: true,
  })
);
const yt = await Innertube.create({
  device_category: "desktop",
  cache: new UniversalCache(false),
  generate_session_locally: true,
  cookie:"_gcl_au=1.1.1502659297.1728791448;VISITOR_INFO1_LIVE=NvNH48Rg2dE;VISITOR_PRIVACY_METADATA=CgJJThIEGgAgJA%3D%3D;PREF=repeat=NONE&volume=100&guide_collapsed=false;SID=g.a000rQjsn32GTZix0H63r-03LdqfckVowcTJ8U6_JUT1fYHlxRXizf8YjdglJfdDyAUTld-bNwACgYKAY4SARQSFQHGX2Mi04b-rfj4nxoOMKhqXSruPBoVAUF8yKq091uA0aDNjSCrhqgSMvtq0076;__Secure-1PSIDTS=sidts-CjIB7wV3saV3hV8wjb6dGFtm_sPA85jqqygakc5JiaOhtUVOpOdvui_cbgfIVYxsEbhmSxAA;__Secure-3PSIDTS=sidts-CjIB7wV3saV3hV8wjb6dGFtm_sPA85jqqygakc5JiaOhtUVOpOdvui_cbgfIVYxsEbhmSxAA;__Secure-1PSID=g.a000rQjsn32GTZix0H63r-03LdqfckVowcTJ8U6_JUT1fYHlxRXiyJOGSjKAKUAPlwa-5yxzFwACgYKAdMSARQSFQHGX2MiiLAM-eCFGhMjZCd6mf3ZTRoVAUF8yKrZTZKjZ6SvQUq3brqb8F_-0076;__Secure-3PSID=g.a000rQjsn32GTZix0H63r-03LdqfckVowcTJ8U6_JUT1fYHlxRXi9gr2LJ-XkecjMGQfkr1DMwACgYKAeESARQSFQHGX2Mi4bADnPUkY7QDktGYjUj9txoVAUF8yKoUzentZ7aq0L28UaRG-sFP0076;HSID=AIsq6F_cOn1uoKNo-;SSID=AyxtcsCkqv-IiNqrZ;APISID=F2gPTuMK4uOoKqXg/AG6QVTAohJVvz6SI-;SAPISID=Hitzejtt91qjDkZ5/AOXwVhVtreBkZZgZa;__Secure-1PAPISID=Hitzejtt91qjDkZ5/AOXwVhVtreBkZZgZa;__Secure-3PAPISID=Hitzejtt91qjDkZ5/AOXwVhVtreBkZZgZa;LOGIN_INFO=AFmmF2swRQIgZZIQT8hUOn6VG_iTbGFVgEANCB0Pb9Wx1VdWXeKIywYCIQDa8jGmv1wLKTqo4JkuC-Xs5g6oX04IBsr9m3u-FXqZow:QUQ3MjNmd1hVNzc2UUtXM3NOdXd6YUhUNExmaHRoNG9saFB4Z1ZvaElxZVptNnFFUkRVZncwWXBGN056eU5aNnJOSms3M0tacXFNaFpKRUlETlpvY0NSanZGck9NZjk1eGljSnNJMnJxRDFvMnhPVDQ3OENlRVpLNHhwMkFmbXU4eWVRN0xUQTF3Qjh1MWl1OF9VNk5GcUl1ZjZiNHlCMXpB;YSC=scIdQOU9Yn8;SIDCC=AKEyXzWWnknJ-jyHYOzK9JvVlYR0YDeZF_DaYb-tfE6VP21M40SV8R0iZEBYhlR9cYeqLiOrww;__Secure-1PSIDCC=AKEyXzXkogrxf2rCC-QNR9uj7La_IifQ-W19LcsqMwdVouJOw-MRa0ByHVVu6s0DNlBNfBG4aw;__Secure-3PSIDCC=AKEyXzXbS5OSsrL7imtonZquLNnMKu9NN6wBjt8u0GETsIMXucvwUAIJ_QXlTcajxwvJ4b1yTg"
});
(async () => {
  app.get("/stream/:songId", async (req, res) => {
    let songId = req.params.songId;
    const video = req.query.v;
    const userAgent = req.headers["user-agent"];
    const isIPhone = /iPhone/i.test(userAgent);
    try {
      songId = songId.length == 11 ? songId : decrypt(req.params.songId);

      await stream(yt, songId, video, isIPhone, res);
      return;
    } catch (error) {
      console.error(`Error streaming song: ${songId}`, error);
      if (isIPhone) {
        try {
          return await stream(yt, songId, false, false, res);
        } catch (error) {
          if (!res.headersSent) {
            res.status(500).send(error?.message);
          }
        }
      }
      if (!res.headersSent) {
        res.status(500).send(error?.message);
      }
    }
  });
  app.get("/vibe/:songId", async (req, res) => {
    let songId = req.params.songId;
    const all = req.query.all;
    try {
      songId = songId.length == 11 ? songId : decrypt(req.params.songId);
      if (VibeCache.has(songId)) {
        return res.json(VibeCache.get(songId));
      }
      const d = await yt.music.getUpNext(songId);
      const playload = d.contents
        .map((s, i) => ({
          id: s.video_id,
          name: s.title.text,
          artists: {
            primary: [
              {
                name: s.artists[0]?.name || "Uknown",
              },
            ],
          },
          addedByUser: {
            username: "@Vibe",
            name: "Vibe",
            imageUrl:
              "https://lh3.googleusercontent.com/a/ACg8ocKRfJKmVUAzGWPJP-hY3sOBKOXRfG4Z3vKIQku_puUDrIoYaZw=s96-c",
          },
          suggestedOrder: i,
          video: !s.thumbnail[0].url.includes(
            "https://lh3.googleusercontent.com"
          )
            ? true
            : false,
          image: [
            {
              quality: "500x500",
              url: `https://wsrv.nl/?url=${s.thumbnail[0].url
                .replace(/w\\d+-h\\d+/, "w500-h500")
                .replace("w120-h120", "w500-h500")}`,
            },
          ],
          source: "youtube",
          downloadUrl: [
            {
              quality: "320kbps",
              url: `${encrypt(s.video_id)}`,
            },
          ],
        }))
        .slice(!all ? 1 : 0, 20);
      VibeCache.set(songId, playload);
      res.json(playload || []);
    } catch (error) {
      console.error(`Error getting suggestion for song: ${songId}`, error);
      if (!res.headersSent) {
        res.status(500).send(error?.message);
      }
    }
  });
  // Start the Express server
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
})();

async function stream(yt, songId, video, isIPhone, res) {
  const stream = await yt.download(songId, {
    type: video || isIPhone ? "video+audio" : "audio",
    quality: "best",
    format: "any",
    client: "YTMUSIC",
  });

  console.info(`Loaded audio stream for song with ID: ${songId}`);

  const chunks = [];
  const reader = stream.getReader();

  let done, value;
  while ((({ done, value } = await reader.read()), !done)) {
    chunks.push(value);
  }

  const buffer = Buffer.concat(chunks);

  res.writeHead(200, {
    "Content-Type": "video/mp4",
    "Cache-Control": "no-cache",
    "Content-Disposition": 'inline; filename="stream.mp4"',
    "Accept-Ranges": "bytes",
    "Content-Length": buffer.length,
  });

  const audioStream = new Readable({
    read() {
      this.push(buffer);
      this.push(null);
    },
  });

  console.info(`Streaming video with ID: ${songId} after buffering`);

  audioStream.pipe(res);
}
