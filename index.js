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
    "VISITOR_PRIVACY_METADATA=CgJJThIEGgAgQA%3D%3D;_gcl_au=1.1.1235145706.1737034245;__Secure-3PSID=g.a000sQjsn4siWp8WB1mE4FlOnFOj_ZKZ_W7420DCHme2TE9M2NASenfYn7U9XaLOUkMeWxt4pAACgYKAaoSARQSFQHGX2MiUyvRJ3MMJT4XlTQQcZovKRoVAUF8yKpt2LcOzea2YJos99jdQoqe0076;SIDCC=AKEyXzUi1ydbr_iVvVLtZKkIACRIb4185Vgypx1IYZvUZoz4QQK4IyHvuGXMap4yEnxWF67jIGQ;SID=g.a000sQjsn4siWp8WB1mE4FlOnFOj_ZKZ_W7420DCHme2TE9M2NASNPYFH_vEevFbzC7p8IacyQACgYKAVESARQSFQHGX2MinOhIDnKnZHz7yU8ZNFhArxoVAUF8yKo0GWCCpSkba0C8Vps0Ohgj0076;__Secure-1PSIDTS=sidts-CjIBmiPuTTrVSWV1Zize99dCSRDl30Bj4shTYzL4RTwViDqfEBRFQoEDwsL9DaiNdLjSEhAA;SAPISID=lgjusQOmhK9BrVVK/A12iSiCJGEly6xIKZ;__Secure-1PSIDCC=AKEyXzXcOr9lcR1Smm7HDZ4_KLHFH0RV_Z-P8tUorpN-UUIc7uc-TLSe4_aDkOtLHkOfBUXa8HA;SSID=A-RSM4jMdxYcIloZb;__Secure-1PAPISID=lgjusQOmhK9BrVVK/A12iSiCJGEly6xIKZ;__Secure-1PSID=g.a000sQjsn4siWp8WB1mE4FlOnFOj_ZKZ_W7420DCHme2TE9M2NASr8EtOU8vb9ihOjuVF1vT7QACgYKAYwSARQSFQHGX2MidenNHhuz7gfKB_--0oIIyhoVAUF8yKqK_HGGtIULvEItsjhAKDgq0076;__Secure-3PAPISID=lgjusQOmhK9BrVVK/A12iSiCJGEly6xIKZ;__Secure-3PSIDCC=AKEyXzVFXMOKGEJQgpHhGkpI21XoRxAQWfT3wdeY1dQ_YcZcz643F4V9YnAfGJFZWnTzX6F9kQOA;__Secure-3PSIDTS=sidts-CjIBmiPuTTrVSWV1Zize99dCSRDl30Bj4shTYzL4RTwViDqfEBRFQoEDwsL9DaiNdLjSEhAA;APISID=TD6txRjdVdHBh0R5/AxcPTg-Jig0xE_trZ;HSID=AX5qwVVbV2RhkPrB9;LOGIN_INFO=AFmmF2swRQIgM_W3oCxNRqteP1WXNqWAJ53uE2A3Mbv4nc3MkJ0lfmwCIQC5n7Vg-v4AosG5idBqzP9NIOgXXwGD7sdtLVoMbtUuVw:QUQ3MjNmd1VYMlVnZ1BIN1hJV2x6TkMzRVRKTndodlEwMVBHWlF5eE1lX0VLbDJTRl9GZmJZQUNEa1plU1hTNW00R2ZDQW92bDZ3aGRPUXI2NV9Ta1pSTVJXaE9rTlZqcDBPNTFtdmpuYU5IRTlxUGJCdzhGY0dMWElnMVlmREhnWHJiUHJ4aDJGOHI1Zk9seEFab2ZiUmNHbmJzSzd2MHpR;NID=520=mcFhaBETQqi2BRo1S7zKCNG_uniB8rqkoRaT_JyJVbzyUXv2u1me0CD7eaQJBEff9RSwX4LuoScjitmwMQsQ5KrjgIk2-eOHkvnSFtEXZypl4ViyWjZXrDBJbNrgcI-MAzxjZJyqQT86z4u-_M2qo8wyiX9yQwg758fotG1DnXm5oBPcdfhs8rix9UP5srp0-M2hZSlv4I2w1LAyHZfAjrOuQiaNwKMsMcKMn-dtDzn3m1CAbFBXw8rCmT3XI9cjnTEhmUE;PREF=volume=82&f7=100&tz=Asia.Calcutta&repeat=NONE&guide_collapsed=false&f4=4000000&f5=20000&autoplay=true;VISITOR_INFO1_LIVE=bUg6zzh047Y",
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
    client: "WEB",
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
