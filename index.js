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
    "_gcl_au=1.1.1502659297.1728791448;VISITOR_INFO1_LIVE=NvNH48Rg2dE;VISITOR_PRIVACY_METADATA=CgJJThIEGgAgJA%3D%3D;SID=g.a000pQjgpIAdhHy_0dGSfDWxKjvrLwzqoM5Uawu72JJedcBUyo_5niw0mGJMnwo-4Ulrq1pG7wACgYKAbsSARESFQHGX2MiR29K2ot14z4vO7srGe3PeBoVAUF8yKpJ90VV7hWAGXYgwQVg4kCs0076;__Secure-1PSIDTS=sidts-CjEBQlrA-LTU0R2M5JOF6m6Se-a5Yvm4x_US09hp_XX80xVr7HaLm1KEW8NU7z3XFdGEEAA;__Secure-3PSIDTS=sidts-CjEBQlrA-LTU0R2M5JOF6m6Se-a5Yvm4x_US09hp_XX80xVr7HaLm1KEW8NU7z3XFdGEEAA;__Secure-1PSID=g.a000pQjgpIAdhHy_0dGSfDWxKjvrLwzqoM5Uawu72JJedcBUyo_5A2i8D33_rw5Onny5aoSzWgACgYKAeASARESFQHGX2MiqQ4Difx2cCQHaJXQTyQEWBoVAUF8yKpZ-IlJD19ZeYd-V1L_mlmF0076;__Secure-3PSID=g.a000pQjgpIAdhHy_0dGSfDWxKjvrLwzqoM5Uawu72JJedcBUyo_59gp3p4VBdS8DQGOGZscEAwACgYKAdwSARESFQHGX2Migt1B69WLlDH3Y3YB-ylnQBoVAUF8yKqfKW2PnTPgs8V7-QuNegJn0076;HSID=A3vZdGr5WdtBtLQ3L;SSID=AQd1F9p4HQ0RnRkbz;APISID=rSUhHKZtqUschgEw/ApQDuIP6JJP_zPETE;SAPISID=FHycINayOxipiMbp/AIbxev72Exj6U-BDH;__Secure-1PAPISID=FHycINayOxipiMbp/AIbxev72Exj6U-BDH;__Secure-3PAPISID=FHycINayOxipiMbp/AIbxev72Exj6U-BDH;PREF=repeat=NONE&volume=0;LOGIN_INFO=AFmmF2swRAIgR7wXGG7WVm1REyUDo9r4uOHTCkpDZ1Zbqn_vbrBGTqYCIBnDTYcEiZyKNpF-irI2rD5KJRxGQUrb8rMl0TZUbl7Z:QUQ3MjNmdzFaVkVjNVBXOE90emc1VW82blFPcGl3U0h6Rko4Vl8xOWc5ampyUFdrb01Uc2F6elQxVlVQU0NpMmtfMVJxOGNjUmJRZFRyVmlfZXYtV1N3Z0daRmpBQjkwbjZGQ0hfNUlIcXkwTk1lNWdPaXgyS1dMeXAxQUx4clBwQlM4ZnlfUXZ0R1MyaUs0U3ItZ0dObWNPQ2JSdHAwMHpR;YSC=yi8-mJO5wYQ;SIDCC=AKEyXzUl3aHSou3s0nTVxd0l8mdN3iRMUPVCZxrEni-l7Ru6tuCRXU6F6BzdA1OzPtbTJR4Nemc;__Secure-1PSIDCC=AKEyXzUOymYr9Om2wrssAvJQ5s4eIT4vHzkKFU8fB8j52CK1NoCbdhQb7_1Jq9oTxOCHl2-YZzQ;__Secure-3PSIDCC=AKEyXzV4udKsVvrRjyYYLsTVTxgwkdYpmZ41-yODbH1kVSAoxRnqbC1vLMdzYZeERRcgjV-DUA",
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
          video: true,
          addedByUser: {
            username: "@Vibe",
            name: "Vibe",
            imageUrl:
              "https://lh3.googleusercontent.com/a/ACg8ocKRfJKmVUAzGWPJP-hY3sOBKOXRfG4Z3vKIQku_puUDrIoYaZw=s96-c",
          },
          suggestedOrder: i,
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

  console.info(`Streaming song with ID: ${songId} after buffering`);

  audioStream.pipe(res);
}
