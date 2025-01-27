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
  cache: new UniversalCache(false),
  generate_session_locally: true,
  cookie:
    "VISITOR_INFO1_LIVE=NvNH48Rg2dE;VISITOR_PRIVACY_METADATA=CgJJThIEGgAgJA%3D%3D;PREF=repeat=NONE&volume=100&guide_collapsed=false;_gcl_au=1.1.2095395988.1737710414;__Secure-ROLLOUT_TOKEN=CP6r4q21_9m6rwEQkeus3YOOiwMY7I6z2f2TiwM%3D;SID=g.a000swjgpJo4eD4ls-FEe_aak9J18P_pdu3rEkOo5Um3MZntHzQSsO4GK4MtIBSBdaK5JBtr0wACgYKAf4SARESFQHGX2Mi4muNCyWm9Ak1OdBoL_-cQhoVAUF8yKr8OdZ05nJbhRHBNzAP5MdN0076;__Secure-1PSIDTS=sidts-CjIBmiPuTeoaStj4x5HDouwOHGICaNFxlWLpTNeNbXtUpY2F71KNoxmZOFIMTndaZmtiBBAA;__Secure-3PSIDTS=sidts-CjIBmiPuTeoaStj4x5HDouwOHGICaNFxlWLpTNeNbXtUpY2F71KNoxmZOFIMTndaZmtiBBAA;__Secure-1PSID=g.a000swjgpJo4eD4ls-FEe_aak9J18P_pdu3rEkOo5Um3MZntHzQS0GvXGTPJXhXXdxWqT5L6yAACgYKARcSARESFQHGX2MiCveDQiZdANTbsg1Uqrer9hoVAUF8yKoXC0ebdLNpuxWIBLUuasiv0076;__Secure-3PSID=g.a000swjgpJo4eD4ls-FEe_aak9J18P_pdu3rEkOo5Um3MZntHzQSKjBGq3TyngIHFJz6EQzV6QACgYKAS8SARESFQHGX2MiC4zNK-f8bg4jhU4PVbFGQhoVAUF8yKo0sqxneoMDSV0naZC4cMCd0076;HSID=AcNV1VNIqhZ1Mjyj7;SSID=AhWc8qnK8Jo7vTGKO;APISID=b9bn6WM6_ywh2wfi/ADcDMJIFMr0ie3nyA;SAPISID=3l9E2Jer-Fex0DaS/A9rJYm0ztQd7tEaTq;__Secure-1PAPISID=3l9E2Jer-Fex0DaS/A9rJYm0ztQd7tEaTq;__Secure-3PAPISID=3l9E2Jer-Fex0DaS/A9rJYm0ztQd7tEaTq;LOGIN_INFO=AFmmF2swRQIgSF3t8oc6mzzhHryx8zTxXBq2yyrypZE0jDousgKlvEUCIQDGVOPISVQWd_vTbfNxTjJsNz8DFyuhYicPcQz8QMyqsg:QUQ3MjNmeVBNYkJMUmFxY290NFRaZGxxZW9vREIyZXFyMGRzQVVReXdLZDZHY0p5NmdlWkktVWVnS1RFcFRqc18yRHd5VlRGdnpOTl8zMWl5YXVsVTBXMzBGSXMxanZyRjNLblY4X1pYQnVIZHhGZzZzbVNjRTVnd0dQS3FKc2NVbVRxZXVDY2VPTnVMOGI5UERjNnBCOExWYXNnMGNDYk93;YSC=cv6Sr6O8qCY;SIDCC=AKEyXzUDg-v54v76gi86ZNhvu8M3-WypgDo67OhD2SrUE-MxWxkuYrNJiXEej0qcbGa4Ig8yyA;__Secure-1PSIDCC=AKEyXzX8LjNu8s6zwGlMDVPxpZTtSNHDyydKBFlxGcLzwDZxWdroN4DEsVvtIKWdQptpvn8b;__Secure-3PSIDCC=AKEyXzUvKZcu0v7X5g_Nm4nEOgW9Y3KNycgnFzfZXQwnsi4RGq8fDYAo725p9TMNOIagOPdbzQ",
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
            res.status(500).json(error);
          }
        }
      }
      if (!res.headersSent) {
        res.status(500).json(error);
      }
    }
  });
  app.get("/vibe/:songId", async (req, res) => {
    let songId = req.params.songId;
    const all = req.query.all;
    try {
      songId = songId.length == 11 ? songId : decrypt(req.params.songId);
      if (VibeCache.has(songId + all ? "all" : "notall")) {
        return res.json(VibeCache.get(songId + all ? "all" : "notall"));
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
              "https://i.pinimg.com/736x/b3/c2/97/b3c297f0aad88b4ad336a45cf34071d6.jpg",
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
      VibeCache.set(songId, playload + all ? "all" : "notall");
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
    "Cache-Control": "public, max-age=31536000",
    "Content-Type": "video/mp4",
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
