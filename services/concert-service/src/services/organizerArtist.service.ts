import { AppError } from "../types/appError.types.js";
import { ArtistRepository } from "../repository/artist.repository.js";
import { OutboxRepository } from "../repository/outbox.repository.js";
import { ConcertRepository } from "../repository/concert.repository.js";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import db from "../db/knex.js";

const uploadDir = path.join(process.cwd(), "uploads");
await mkdir(uploadDir, { recursive: true });

type ArtistResult = {
  id: string;
  name: string;
};

export const OrganizerArtistService = {
  async createArtists(name: string[]) {
    let result: ArtistResult[] = [];
    let existingArtists: ArtistResult[] = [];

    for (const artistName of name) {
      if (artistName.trim() === "") {
        throw new AppError("Artist names cannot be empty", 400);
      }

      const existingArtist = await ArtistRepository.findArtistByName(artistName);
      if (existingArtist) {
        existingArtists.push(existingArtist);
        continue;
      }
      const artist = await ArtistRepository.createArtist(artistName);
      result.push(artist);
    }

    return { existingArtists: [...existingArtists], newArtists: [...result] };
  },

  async linkArtistsToConcert(concertId: string, artistIds: string[]) {
    try {
      const [concertExists, artists] = await Promise.all([
        ConcertRepository.findConcertById(concertId),
        ArtistRepository.findArtistByIds(artistIds),
      ]);

      if (!concertExists) {
        throw new AppError(`Concert with ID ${concertId} does not exist`, 404);
      }

      if (artists.length !== artistIds.length) {
        const foundArtistIds = artists.map((artist) => artist.id);
        const missingArtistIds = artistIds.filter((id) => !foundArtistIds.includes(id));
        throw new AppError(`The following artist IDs do not exist: ${missingArtistIds.join(", ")}`, 404);
      }

      await ArtistRepository.linkArtistsToConcert(concertId, artistIds);
    } catch (error) {
      throw error;
    }
  },

  async generateArtistBios(
    concertId: string,
    artistIds: string[],
    fileBuffer: Buffer<ArrayBufferLike>,
    mimeType: string,
  ) {
    try {
      const [concertExists, artistExists] = await Promise.all([
        ConcertRepository.findConcertById(concertId),
        ArtistRepository.findArtistByIds(artistIds),
      ]);

      if (!concertExists) {
        throw new AppError(`Concert with ID ${concertId} does not exist`, 404);
      }

      if (!artistExists || artistIds.length !== artistExists.length) {
        const founddArtistIds = new Set(artistExists.map((artist) => artist.id));
        const missingArtistIds = artistIds.filter((id) => !founddArtistIds.has(id));
        throw new AppError(`The following artist IDs do not exist: ${missingArtistIds.join(", ")}`, 404);
      }

      const linkedIds = await ArtistRepository.findArtistAndConcertById(concertId, artistIds);

      if (!linkedIds || linkedIds.length !== artistIds.length) {
        const missingArtists = artistIds.filter((id) => !linkedIds?.includes(id));
        throw new AppError(
          `The following artist IDs are not associated with the concert ${concertId}: ${missingArtists.join(", ")}`,
          404,
        );
      }

      const fileName = `${crypto.randomUUID()}.pdf`;
      const filePath = path.join(uploadDir, fileName);
      await writeFile(filePath, fileBuffer);

      await OutboxRepository.createConcertOutboxEvent(
        db,
        "GENERATE_ARTIST_BIOS",
        {
          concertId: concertId,
          artistIds: artistIds,
          mimeType: mimeType,
          fileName: fileName,
        },
        300,
      );
    } catch (error) {
      throw error;
    }
  },

  async getAwaitingReviewBios(concertId: string) {
    try {
      const concertExists = await ConcertRepository.findConcertById(concertId);
      if (!concertExists) {
        throw new AppError(`Concert with ID ${concertId} does not exist`, 404);
      }

      const awaitingReviewBios = await ArtistRepository.getAwaitingReviewBios(concertId);
      return awaitingReviewBios;
    } catch (error) {
      throw error;
    }
  },

  async updateArtistBioStatus(concertId: string, artistId: string, status: "APPROVED" | "REJECTED") {
    try {
      const [existingConcert, existingArtist] = await Promise.all([
        ConcertRepository.findConcertById(concertId),
        ArtistRepository.findArtistByIds([artistId]),
      ]);

      if (!existingConcert) {
        throw new AppError(`Concert with ID ${concertId} does not exist`, 404);
      }

      if (!existingArtist || existingArtist.length === 0) {
        throw new AppError(`Artist with ID ${artistId} does not exist`, 404);
      }

      const linkedIds = await ArtistRepository.findArtistAndConcertById(concertId, [artistId]);
      if (!linkedIds || linkedIds.length === 0) {
        throw new AppError(`Artist with ID ${artistId} is not associated with concert ${concertId}`, 404);
      }

      await ArtistRepository.updateArtistBioStatus(concertId, artistId, status);

      if (status === "APPROVED") {
        await ArtistRepository.updateArtistApprovedBio(concertId, artistId);
      }
    } catch (error) {
      throw error;
    }
  },
};
