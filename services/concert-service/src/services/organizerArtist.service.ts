import { AppError } from "../types/appError.types.js";
import { ArtistRepository } from "../repository/artist.repository.js";
import { OutboxRepository } from "../repository/outbox.repository.js";
import db from "../db/knex.js";
import { ConcertRepository } from "../repository/concert.repository.js";

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
      const artists = await ArtistRepository.findArtistByIds(artistIds);
      if (artists.length !== artistIds.length) {
        const foundArtistIds = artists.map((artist) => artist.id);
        const missingArtistIds = artistIds.filter((id) => !foundArtistIds.includes(id));
        throw new AppError(`The following artist IDs do not exist: ${missingArtistIds.join(", ")}`, 404);
      }

      const concertExists = await ConcertRepository.findConcertById(concertId);
      if (!concertExists) {
        throw new AppError(`Concert with ID ${concertId} does not exist`, 404);
      }

      await ArtistRepository.linkArtistsToConcert(concertId, artistIds);
    } catch (error) {
      throw error;
    }
  },

  async generateArtistBios(concertId: string, artistIds: string[], pdfBase64String: string, mimeType: string) {
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

      await OutboxRepository.createOrderOutboxEvent(
        db,
        "GENERATE_ARTIST_BIOS",
        {
          concertId: concertId,
          artistIds: artistIds,
          pdfBase64String: pdfBase64String,
          mimeType: mimeType,
        },
        300,
      );
    } catch (error) {
      throw error;
    }
  },

  async getAwaitingReviewBios(concertId: string) {
    try {
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
    } catch (error) {
      throw error;
    }
  },
};
