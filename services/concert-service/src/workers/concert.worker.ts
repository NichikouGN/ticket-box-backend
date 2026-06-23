import { Worker } from "bullmq";
import { bullredis } from "../clients/redis.client.js";
import logger from "../utils/logger.js";
import { handleGenerateArtistBios } from "../jobs/handleGenerateArtistBios.job.js";

export const createConcertWorker = async () => {
  const worker = new Worker(
    "concert-queue",
    async (job) => {
      switch (job.name) {
        case "GENERATE_ARTIST_BIOS":
          await handleGenerateArtistBios(job.data);
          break;
        default:
          return;
      }
    },
    {
      connection: bullredis.duplicate(),
    },
  );

  worker.on("ready", () => {});
  worker.on("active", (job) => {});

  worker.on("failed", async (job, error) => {
    if (!job) return;
  });

  worker.on("error", (error) => {
    logger.error({ error }, "[Worker - createConcertWorker] Concert worker error");
  });
};

createConcertWorker();
