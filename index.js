import express from "express";
import { Innertube, UniversalCache } from "youtubei.js";
import { Readable } from "stream";
const app = express();
const PORT = process.env.PORT || 3000;

(async () => {
  const yt = await Innertube.create({
    cache: new UniversalCache(false),
    generate_session_locally: true,
    cookie:
      "VISITOR_PRIVACY_METADATA=CgJJThIEGgAgWQ%3D%3D;__Secure-3PSID=g.a000pAjsn3YQFx-Zj-JiLzefMT195oQEYoIaMEjbHHy2BDdBNABfxxzAkYgxd8-5YZbsRzU6xgACgYKAaISARQSFQHGX2Mif23Gh6ppjzTUyUte5Ew5oxoVAUF8yKpALWPblyPCRNoVRS7nwSF00076;__Secure-1PSIDTS=sidts-CjEBQlrA-AJPrS7Ips9reSJILvLl9351ydyQxIfv5MXt8T90U9OG1PV6P44FbCfBdc4sEAA;SAPISID=U9-38pMyuDxO85w1/AcebiUEAueUPcyhvy;__Secure-1PSIDCC=AKEyXzVmCUF7blCTyLPVY90awfMcee3eXYESN9Jx4iUtxfEKrWMTRgTrhu9CJWOwxcechEoNPg;SSID=AHub5L_WayTM8Pu6g;__Secure-1PAPISID=U9-38pMyuDxO85w1/AcebiUEAueUPcyhvy;__Secure-1PSID=g.a000pAjsn3YQFx-Zj-JiLzefMT195oQEYoIaMEjbHHy2BDdBNABfitSl-S-9lmHXLdbZQBVyiAACgYKAV8SARQSFQHGX2Mi0lRBkBPgOTtyJAFVbUgOIBoVAUF8yKr0kxJ89u6IHgHlDiXAfRk80076;__Secure-3PAPISID=U9-38pMyuDxO85w1/AcebiUEAueUPcyhvy;__Secure-3PSIDCC=AKEyXzXY9byt5o2DQVlBIX7bGf37XcwlcnFz_HFHbPOcBCzE40mn0V6U4gBVOSaLHJObDr9Xry3W;__Secure-3PSIDTS=sidts-CjEBQlrA-AJPrS7Ips9reSJILvLl9351ydyQxIfv5MXt8T90U9OG1PV6P44FbCfBdc4sEAA;LOGIN_INFO=AFmmF2swRgIhAJ2SzTWUvqgZW_5bqd9PWbpotFQ79GZ2CIj9OSwBh13LAiEAnuDp8heNyRpji2bxAHTXqeOnM3wqeJOnM_bHmpmDbQE:QUQ3MjNmdzdiV2Q1ek5NS3Qyd0dkNzhia2p3SFR5cUM5dmxaaWdVVktwYXdCUVJqWXQ5V2wyNVFUbHVEWFJRVzZhUmRfaG93WEliV3pmU2FhcTktWGt5NkMtYk56SHcza2cyQXJyaXRkUWk0S3hTUEZ0WWxmWDVmbDloekJsejhzVVA1TzlyMjRRNExJQXJra1loaFpHczhfWHFuRVdleEx3;NID=516=ao_2040Kw7M2C5U5LOOeYtUsKGoi_dSKXQE1KNoNIryR4YfmGLBQaSQ3CdSdHMEDJBg85eoSndyjV_7EkkfSMMuugfpMNvBisEHq94XmPifVhscRUIQTRrTHxeYH6GrLbmNOkz4hoylmUtTSoo4WIUMFdebqnaFkaRfxp3YmrKauPH8P0lHC8l3OLWouDxOTzrdziS_OqqUrfe1-EnqCrtJyUzY-c_NHpSSqLGm08u-MJ4MCsFyo;PREF=volume=63&f7=100&tz=Asia.Calcutta&repeat=NONE&guide_collapsed=false&f4=4000000&f5=20000&autoplay=true&f6=40000000",
  });

  // Route to stream the song based on its ID

  app.get("/stream/:songId", async (req, res) => {
    const songId = req.params.songId;

    try {
      // Get the audio stream from YouTube Music
      const stream = await yt.download(songId, {
        type: "video+audio",
        quality: "best",
        format: "mp4",
        client: "YTMUSIC",
      });

      console.info(`Loaded audio stream for song with ID: ${songId}`);

      // Buffer the stream into memory
      const chunks = [];
      const reader = stream.getReader();

      // Read the stream until it's done
      let done, value;
      while ((({ done, value } = await reader.read()), !done)) {
        chunks.push(value);
      }

      // Create a buffer from the collected chunks
      const buffer = Buffer.concat(chunks);

      // Set headers for real-time streaming
      res.writeHead(200, {
        "Content-Type": "audio/mpeg", // Streaming as MP3
        "Cache-Control": "no-cache",
        "Content-Disposition": 'inline; filename="stream.mp3"',
        "Accept-Ranges": "bytes",
        "Content-Length": buffer.length,
      });

      // Create a readable stream from the buffered data
      const audioStream = new Readable({
        read() {
          this.push(buffer); // Push the buffered data
          this.push(null); // Signal the end of the stream
        },
      });

      console.info(`Streaming song with ID: ${songId} after buffering`);

      // Use fluent-ffmpeg to convert the audio stream to MP3 in real-time
      // Use fluent-ffmpeg to convert and stream the audio
      audioStream.pipe(res);
    } catch (error) {
      console.error(`Error streaming song: ${songId}`, error);
      if (!res.headersSent) {
        res.status(500).send("Error streaming the song.");
      }
    }
  });
  // Start the Express server
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
})();
