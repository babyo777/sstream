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
    "VISITOR_PRIVACY_METADATA=CgJJThIEGgAgHA%3D%3D;__Secure-3PSID=g.a000qgjsn-byJwIRO095QIry-iNhzKdXfT4BPn8Hhpc1e0xw3_twuwD7y9EooqXLgsAd8YGDXAACgYKARoSARQSFQHGX2MimtQuPBUCc5O2tzDVfvppGhoVAUF8yKpF4AHw9YRVVeg7Xu3PdyUk0076;__Secure-1PSIDTS=sidts-CjEB7wV3sdWLH7j9SCbpDQcJHkp4KTMQ3c5InoPxZ978VCKO4XS1EZFSCZcznohSvEX1EAA;SAPISID=M2HNMi7D73GyVPv3/Ad4WGUBrJhw_yh6gy;__Secure-1PSIDCC=AKEyXzVLdRlq7LnRr8UEiP0MGbQFj9_nCdi2CEc2ThtgmlLVsa2DD13ViZBQhaXI8HajWBNBu1M;SSID=A7Fm2uiKlttoecgPT;OTZ=7829246_34_34__34_;__Secure-1PAPISID=M2HNMi7D73GyVPv3/Ad4WGUBrJhw_yh6gy;__Secure-1PSID=g.a000qgjsn-byJwIRO095QIry-iNhzKdXfT4BPn8Hhpc1e0xw3_twShjMYAOwmjn0hnIact9PDQACgYKAR8SARQSFQHGX2MiKJ9DfxNfA1FeiUS4cvWdVxoVAUF8yKqnfr0ynml3wdvJpwivRVMk0076;__Secure-3PAPISID=M2HNMi7D73GyVPv3/Ad4WGUBrJhw_yh6gy;__Secure-3PSIDCC=AKEyXzVN3NR54sg5EJhLGXTuNWH6avNgNo2oK504jF6Cgc3lRhcrjdULfQimEZcpJI7jGHTDqZiz;__Secure-3PSIDTS=sidts-CjEB7wV3sdWLH7j9SCbpDQcJHkp4KTMQ3c5InoPxZ978VCKO4XS1EZFSCZcznohSvEX1EAA;LOGIN_INFO=AFmmF2swRQIhAODvLAJY6OmGRcqn-otqjLncT0D4EHl_qW0c5RDGMPvqAiBFKqpDvsqPboGP5PPyfW8BTKpevNv1UKcoqrH2T3NhFw:QUQ3MjNmeHdSOFFGN1VnazVGam9LQ0pEU0taN0szMGlxamduZ0pEb2gwUGVDY2ZGZFYtNjB3RWtsR0V2bzJiRlJGeWE0S3R6NkFlTUhEcTVQYlFtU0ZIZkJmUjdtOHVxQjRnLTEwWW1RNkJkWS1FSkhJSkpDZjlGYjd5SWZMcDR0ZTJzNW5YZVF1V1dwb2c5TlRRMzRJTjNNQm1CTnlvYU53;NID=519=WrPsMsmmnucPyfdI-tPzgWM6IaPqXpA6XouK8jgnlCuufQsPMaXbITezxKdlSloQlR0U_ojQRuzhllx_2Be1ekWYoUn0Hq79fL0mP4HNw0LpwSUMJm1hg1KvzPKwV5bdfZ4d_dqfrrMtw7JTGk-mWCXpJ2dj0izPo4eBQlcDkZemJ27Ty5TcmRko2oLzbe3W-Il-V-E9SNQhkH6YgMkoCtfa_sQ_vNLzUd5JYxbTR87JX2U_DeMukRrn5me04KZT0Kvimwc;PREF=volume=25&f7=100&tz=Asia.Calcutta&repeat=NONE&guide_collapsed=false&f4=4000000&f5=20000&autoplay=true&f6=40000000;VISITOR_INFO1_LIVE=FLQzx3YWlOY",
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
