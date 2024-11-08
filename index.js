import express from "express";
import { Innertube, UniversalCache } from "youtubei.js";
import { Readable } from "stream";
import { decrypt } from "tanmayo7lock";
import dotenv from "dotenv";
dotenv.config();
const app = express();
const PORT = process.env.PORT || 8000;

(async () => {
  const yt = await Innertube.create({
    cache: new UniversalCache(false),
    generate_session_locally: true,
    cookie:
      "PREF=repeat=NONE;_gcl_au=1.1.1502659297.1728791448;VISITOR_INFO1_LIVE=NvNH48Rg2dE;VISITOR_PRIVACY_METADATA=CgJJThIEGgAgJA%3D%3D;SID=g.a000pQjgpIAdhHy_0dGSfDWxKjvrLwzqoM5Uawu72JJedcBUyo_5niw0mGJMnwo-4Ulrq1pG7wACgYKAbsSARESFQHGX2MiR29K2ot14z4vO7srGe3PeBoVAUF8yKpJ90VV7hWAGXYgwQVg4kCs0076;__Secure-1PSIDTS=sidts-CjEBQlrA-LTU0R2M5JOF6m6Se-a5Yvm4x_US09hp_XX80xVr7HaLm1KEW8NU7z3XFdGEEAA;__Secure-3PSIDTS=sidts-CjEBQlrA-LTU0R2M5JOF6m6Se-a5Yvm4x_US09hp_XX80xVr7HaLm1KEW8NU7z3XFdGEEAA;__Secure-1PSID=g.a000pQjgpIAdhHy_0dGSfDWxKjvrLwzqoM5Uawu72JJedcBUyo_5A2i8D33_rw5Onny5aoSzWgACgYKAeASARESFQHGX2MiqQ4Difx2cCQHaJXQTyQEWBoVAUF8yKpZ-IlJD19ZeYd-V1L_mlmF0076;__Secure-3PSID=g.a000pQjgpIAdhHy_0dGSfDWxKjvrLwzqoM5Uawu72JJedcBUyo_59gp3p4VBdS8DQGOGZscEAwACgYKAdwSARESFQHGX2Migt1B69WLlDH3Y3YB-ylnQBoVAUF8yKqfKW2PnTPgs8V7-QuNegJn0076;HSID=A3vZdGr5WdtBtLQ3L;SSID=AQd1F9p4HQ0RnRkbz;APISID=rSUhHKZtqUschgEw/ApQDuIP6JJP_zPETE;SAPISID=FHycINayOxipiMbp/AIbxev72Exj6U-BDH;__Secure-1PAPISID=FHycINayOxipiMbp/AIbxev72Exj6U-BDH;__Secure-3PAPISID=FHycINayOxipiMbp/AIbxev72Exj6U-BDH;LOGIN_INFO=AFmmF2swRgIhAJARrLLPIPpw7jqWlw7gbikZadDWsOGtDEExmBnAIF-TAiEA9ueAGX8WRNBgzCKvX1pjOk_7Sfkc-YTcHyYEidpPQbM:QUQ3MjNmdzZLWUJhMktkQmRlWXdFd0M2LS1yeGNBS3lvdEZhUGtDc3JWMC1PSlpsUS1tOG5JOUhxUnJGTlI2aUJva2NDT0xISWk3clhTY0hTYVdUeHIzdzdobjJkdzV3Si1RVVNZaWxwSG1IY2ZscURRMG9sdFRVdllKSHdjbmNzcjB1bzJLTm9KZWFwcXFKR19tZmdTVlRVMTZpWlI4bWdn;YSC=MOSR1U_kg4k;SIDCC=AKEyXzXcl2hTBJtaKTPRDkAxVD_OJ4jsJx3N0RnOWUVU_l3i_F_tuhQJkyPBgl6XBZ4W6BLMaw;__Secure-1PSIDCC=AKEyXzWWFcb1pf0DkhbchlkDu_OMrTBAUKsKmvpRrWCDH8jaPDqtrbVkjygg3RgTeoYQQgSQPA;__Secure-3PSIDCC=AKEyXzXScdOpyPtvGSyYd5q_nWdgI0m9HR09pabbSRo7EZDE1413aq8xFa-ejdzMdnnECnJy",
  });

  // Route to stream the song based on its ID

  app.get("/stream/:songId", async (req, res) => {
    let songId = req.params.songId;
    try {
      songId = decrypt(req.params.songId);
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
        "Content-Type": "video/mp4", // Streaming as MP3
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
        res.status(500).send(error?.message);
      }
    }
  });
  // Start the Express server
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
})();
