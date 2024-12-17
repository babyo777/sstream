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
  cookie:
    "_gcl_au=1.1.1502659297.1728791448;VISITOR_INFO1_LIVE=NvNH48Rg2dE;VISITOR_PRIVACY_METADATA=CgJJThIEGgAgJA%3D%3D;__Secure-1PSIDTS=sidts-CjEBQlrA-LTU0R2M5JOF6m6Se-a5Yvm4x_US09hp_XX80xVr7HaLm1KEW8NU7z3XFdGEEAA;__Secure-3PSIDTS=sidts-CjEBQlrA-LTU0R2M5JOF6m6Se-a5Yvm4x_US09hp_XX80xVr7HaLm1KEW8NU7z3XFdGEEAA;HSID=A3vZdGr5WdtBtLQ3L;SSID=AQd1F9p4HQ0RnRkbz;APISID=rSUhHKZtqUschgEw/ApQDuIP6JJP_zPETE;SAPISID=FHycINayOxipiMbp/AIbxev72Exj6U-BDH;__Secure-1PAPISID=FHycINayOxipiMbp/AIbxev72Exj6U-BDH;__Secure-3PAPISID=FHycINayOxipiMbp/AIbxev72Exj6U-BDH;SID=g.a000qwjgpP-i5Dq7VJdlbP9GGYgA54dCfoD6uUrkJVqb5vzo-Y2_alN91_fnMUZaQFkZTX0agwACgYKAY0SARESFQHGX2MiJR9JexHug6oD3vdlNK1xnxoVAUF8yKoKhEpyO1QPX2PugdN_f-9A0076;__Secure-1PSID=g.a000qwjgpP-i5Dq7VJdlbP9GGYgA54dCfoD6uUrkJVqb5vzo-Y2_U6a_d4SSHrd_p8lRk3iVkwACgYKAX8SARESFQHGX2MiNEjGAyWwrBMhhGBIiJIlJBoVAUF8yKoUzHQxpwSftS4eUxkO0j2N0076;__Secure-3PSID=g.a000qwjgpP-i5Dq7VJdlbP9GGYgA54dCfoD6uUrkJVqb5vzo-Y2_FnovJd2CBfpE5OoOtoWFHAACgYKAaISARESFQHGX2Mi0QlsfY-fzWrPUlTXqXv2LRoVAUF8yKqIntznDj3u_FMtzhDK4v2r0076;LOGIN_INFO=AFmmF2swRAIgASsAkZxguENa43rMieDB_4Ntq5udlQREwbqX-Afz6aECIHzXtrg6nf2kZqw0ENHQHQzuxPoS5oJ1sBQzHu6Ws2YM:QUQ3MjNmd1NrczJfQ3o2ZkxKT1hYdVc3ZjhRR1B0aHF6bXNHZXBRNnp4akhDUXpVSDZsSXBBZ080a2hRNnpPd0tYRnVPeE93Ukh5MzkxRTVhZzk1RmV1b0dINk5BTzY1THJsdUFnQVNLX0ZCaVlpRXFmM0NiaEJYLVY3RENBQXR2ajY5NHJkSGlRQURMMEdoa3liZE5hZ0VVVXNFMmtpWFpB;PREF=repeat=NONE&volume=100;YSC=zwTmXMqRkUI;SIDCC=AKEyXzUb4aoX-SiehV_F3vMGuO-EdDIyyim561vxQ1j7go5jjrkwsAKNgfHm1O12DfqwXuWTohI;__Secure-1PSIDCC=AKEyXzUMIK_APSN2c_ZQxIK1ztT-aFCcY5z8YY3QMiL6Fg6IMeXVRYEHSBPcvVtXGoT3LuuAHJs;__Secure-3PSIDCC=AKEyXzXdgvOZcBBtwTYYKwTfM-pcPwZBSZkmLxuQbO8e6hq7a3l20aLBncS5aVNQUUI5gboXvQ",
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

    try {
      songId = songId.length == 11 ? songId : decrypt(req.params.songId);
      if (VibeCache.has(songId)) {
        return res.json(VibeCache.get(songId));
      }
      const d = await yt.music.getUpNext(songId);
      console.log("req");
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
        .slice(1, 20);
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
