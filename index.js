import express from "express";
import { Innertube, UniversalCache } from "youtubei.js";
import { Readable } from "stream";
import { decrypt, encrypt } from "tanmayo7lock";
import { VibeCache } from "./cache/cache.js";
import { OAuth2Client } from "google-auth-library";
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

let innertube;
let oAuth2Client;
const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const redirectUri = process.env.REDIRECT_URI;

let authorizationUrl;

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true, limit: "3mb" }));

const cache = new UniversalCache(true);

console.info("Cache dir:", cache.cache_dir);

(async () => {
  app.get("/", async (_req, res) => {
    if (!innertube) {
      console.info("Creating innertube instance.");
      innertube = await Innertube.create({ cache });

      innertube.session.on("update-credentials", async (_credentials) => {
        console.info("Credentials updated.");
        await innertube?.session.oauth.cacheCredentials();
      });
    }

    if (await cache.get("youtubei_oauth_credentials"))
      await innertube.session.signIn();

    if (innertube.session.logged_in) {
      console.info("Innertube instance is logged in.");

      const userInfo = await innertube.account.getInfo();

      console.log(await innertube.getBasicInfo("R8vgwMYSQi8", "YTMUSIC"));

      return res.send({ live:true });
    }

    if (!oAuth2Client) {
      console.info("Creating OAuth2 client.");

      oAuth2Client = new OAuth2Client(clientId, clientSecret, redirectUri);

      authorizationUrl = oAuth2Client.generateAuthUrl({
        access_type: "offline",
        scope: [
          "http://gdata.youtube.com",
          "https://www.googleapis.com/auth/youtube",
          "https://www.googleapis.com/auth/youtube.force-ssl",
          "https://www.googleapis.com/auth/youtube-paid-content",
        ],
        include_granted_scopes: true,
        prompt: "consent",
      });

      console.info("Redirecting to authorization URL...");

      res.redirect(authorizationUrl);
    } else if (authorizationUrl) {
      console.info(
        "OAuth2 client already exists. Redirecting to authorization URL..."
      );
      res.redirect(authorizationUrl);
    }
  });

  app.get("/login", async (req, res) => {
    const { code } = req.query;

    if (!code) {
      return res.send("No code provided.");
    }

    if (!oAuth2Client || !innertube) {
      return res.send(
        "OAuth2 client or innertube instance is not initialized."
      );
    }

    const { tokens } = await oAuth2Client.getToken(code);

    if (tokens.access_token && tokens.refresh_token && tokens.expiry_date) {
      await innertube.session.signIn({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expiry_date: new Date(tokens.expiry_date).toISOString(),
        client: {
          client_id: clientId,
          client_secret: clientSecret,
        },
      });

      console.log({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expiry_date: new Date(tokens.expiry_date).toISOString(),
        client: {
          client_id: clientId,
          client_secret: clientSecret,
        },
      });

      await innertube.session.oauth.cacheCredentials();

      console.log("Logged in successfully. Redirecting to home page...");

      res.redirect("/");
    }
  });

  app.get("/logout", async (_req, res) => {
    if (!innertube) {
      return res.send("Innertube instance is not initialized.");
    }

    await innertube.session.signOut();

    console.log("Logged out successfully. Redirecting to home page...");

    res.redirect("/");
  });
  app.get("/stream/:songId", async (req, res) => {
    let songId = req.params.songId;
    const video = req.query.v;
    const userAgent = req.headers["user-agent"];
    const isIPhone = /iPhone/i.test(userAgent);
    try {
      songId = songId.length == 11 ? songId : decrypt(req.params.songId);

      await stream(innertube, songId, video, isIPhone, res);
      return;
    } catch (error) {
      console.error(`Error streaming song: ${songId}`, error);
      if (isIPhone) {
        try {
          return await stream(innertube, songId, false, false, res);
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
      const d = await innertube.music.getUpNext(songId);
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
