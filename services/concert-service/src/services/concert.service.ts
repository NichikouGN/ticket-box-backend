import { AppError } from "../types/appError.types.js";
import { ConcertRepository } from "../repository/concert.repository.js";
import { getRedisHealth } from "../infrastructure/redis.client.js";
import type {
  ConcertDetail,
  ConcertListItem,
  TicketTypeView,
  CreateConcertInput,
  UpdateConcertInput,
} from "../types/concert.types.js";
import { notificationQueue } from "../queues/notification.queue.js";
import {
  safeRedisDel,
  safeRedisMGet,
  safeRedisSet,
  listKey,
  detailKey,
  ticketsKey,
  stockKey,
  safeRedisHSet,
  safeRedisHGetAll,
  deleteKeysByPattern,
} from "../utils/redis.utils.js";

const LIST_CACHE_TTL_SECONDS = 30 * 60;
const DETAIL_CACHE_TTL_SECONDS = 30 * 60;
const TICKETS_CACHE_TTL_SECONDS = 5 * 60; // Testing with 30 mins, can be adjusted based on real-world usage patterns

const parseCachedValue = <T>(value: string | null | undefined) => {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

const toListItem = (row: Record<string, unknown>): ConcertListItem => ({
  id: String(row.id),
  title: String(row.title),
  artists: Array.isArray(row.artists) ? row.artists.map(String) : [],
  venue: String(row.venue),
  eventDate: new Date(String(row.event_date)).toISOString(),
  status: String(row.status).toUpperCase(),
  thumbnailUrl: row.cover_image ? String(row.cover_image) : null,
});

const toDetail = (row: Record<string, unknown>): ConcertDetail => ({
  id: String(row.id),
  title: String(row.title),
  description: row.description ? String(row.description) : null,
  artists: Array.isArray(row.artists) ? row.artists.map(String) : [],
  venue: String(row.venue),
  eventDate: new Date(String(row.event_date)).toISOString(),
  thumbnailUrl: row.cover_image ? String(row.cover_image) : null,
  seatMapSvgUrl: row.seat_map_svg_url ? String(row.seat_map_svg_url) : null,
});

export const ConcertService = {
  async getHealth() {
    return { redis: getRedisHealth() };
  },

  /**
   * Lists concerts with pagination and optional filtering by organizer
   * @param page Page number for pagination
   * @param limit Number of items per page
   * @param organizerId Optional ID of the organizer to filter by
   * @returns Promise resolving to the list of concerts and pagination information
   * @throws AppError with status 500 for any unexpected errors during retrieval
   * @throws AppError with status 400 for invalid pagination parameters
   * @throws AppError with status 404 if no concerts are found for the given page and limit
   */
  async listConcerts(page: number, limit: number, organizerId?: string) {
    const key = listKey(page, limit);
    const useCache = !organizerId; // Only use cache for non-organizer requests

    if (useCache) {
      const cached = parseCachedValue<{
        data: ConcertListItem[];
        pagination: { currentPage: number; totalPages: number; totalItems: number };
      }>((await safeRedisMGet([key]))?.[0]);

      if (cached) {
        return cached;
      }
    }

    const offset = (page - 1) * limit;

    let [rows, totalItems] = [<Record<string, unknown>[]>[], 0];
    if (useCache) {
      [rows, totalItems] = await Promise.all([
        ConcertRepository.getPublishedConcerts(offset, limit),
        ConcertRepository.countPublishedConcerts(),
      ]);
    } else {
      [rows, totalItems] = await Promise.all([
        ConcertRepository.getAllConcerts(offset, limit),
        ConcertRepository.countAllConcerts(),
      ]);
    }

    const payload = {
      data: rows.map((row) => toListItem(row as Record<string, unknown>)),
      pagination: {
        currentPage: page,
        totalPage: Math.max(1, Math.ceil(totalItems / limit)),
        totalItems: totalItems,
      },
    };

    if (useCache) {
      await safeRedisSet(key, JSON.stringify(payload), LIST_CACHE_TTL_SECONDS);
    }

    return payload;
  },

  /**
   * Retrieves the detail of a specific concert
   * @param concertId ID of the concert to retrieve
   * @param organizerId Optional ID of the organizer to filter by
   * @returns Promise resolving to the concert detail or an error if not found or not published (for non-organizer requests)
   * @throws AppError with status 404 if concert is not found or not published (for non-organizer requests)
   * @throws AppError with status 500 for any unexpected errors during retrieval
   */
  async getConcertDetail(concertId: string, organizerId?: string) {
    const key = detailKey(concertId);

    const useCache = !organizerId; // Only use cache for non-organizer requests

    if (useCache) {
      const cached = parseCachedValue<ConcertDetail>((await safeRedisMGet([key]))?.[0]);

      if (cached) {
        return cached;
      }
    }

    const concert = await ConcertRepository.getConcertDetail(concertId);
    if (!concert) {
      throw new AppError("Concert not found", 404);
    }

    console.log("Concert status:", concert.status);
    console.log("!Use cache:", organizerId);

    if (useCache && String(concert.status) !== "PUBLISHED") {
      throw new AppError("Concert not found", 404);
    }

    const payload = toDetail(concert as Record<string, unknown>);

    if (useCache) {
      await safeRedisSet(key, JSON.stringify(payload), DETAIL_CACHE_TTL_SECONDS);
    }
    return payload;
  },

  /**
   * Retrieves the ticket details of a specific concert
   * @param concertId ID of the concert to retrieve ticket details for
   * @param organizerId Optional ID of the organizer to filter by
   * @returns Promise resolving to the ticket details of the concert or an error if not found or not published (for non-organizer requests)
   * @throws AppError with status 404 if ticket details are not found or concert is not published (for non-organizer requests)
   * @throws AppError with status 500 for any unexpected errors during retrieval
   */
  async getConcertTicketsDetails(concertId: string, organizerId?: string) {
    const key = ticketsKey(concertId);

    const useCache = !organizerId; // Only use cache for non-organizer requests
    if (useCache) {
      const cached = parseCachedValue<{
        seatMapSvgUrl: string | null;
        ticketTypes: TicketTypeView[];
      }>((await safeRedisMGet([key]))?.[0]);

      if (cached) {
        return cached;
      }
    }

    const ticketsDetails = await ConcertRepository.getConcertTicketsDetails(concertId);
    if (!ticketsDetails) {
      throw new AppError("Tickets details not found", 404);
    }

    if (useCache && String(ticketsDetails.concert.status) !== "PUBLISHED") {
      throw new AppError("Tickets details not found", 404);
    }

    const payload = {
      seatMapSvgUrl: ticketsDetails.concert.seat_map_svg_url
        ? String(ticketsDetails.concert.seat_map_svg_url)
        : null,
      ticketTypes: ticketsDetails.ticketTypes.map((ticketType) => ({
        id: ticketType.id,
        name: ticketType.name,
        price: ticketType.price,
        maxPerUser: ticketType.max_per_user,
      })) satisfies TicketTypeView[],
    };

    if (useCache) {
      await safeRedisSet(key, JSON.stringify(payload), TICKETS_CACHE_TTL_SECONDS);
    }
    return payload;
  },

  /**
   * Retrieves the stock details of a specific concert
   * @param concertId ID of the concert to retrieve stock details for
   * @param organizerId Optional ID of the organizer to filter by
   * @returns Promise resolving to the stock details of the concert or an error if not found or not published (for non-organizer requests)
   * @throws AppError with status 404 if stock details are not found or concert is not published (for non-organizer requests)
   * @throws AppError with status 500 for any unexpected errors during retrieval
   */
  async getConcertStock(concertId: string, organizerId?: string) {
    const key = stockKey(concertId);
    const useCache = !organizerId; // Only use cache for non-organizer requests

    if (useCache) {
      const cached = await safeRedisHGetAll(key);

      if (cached && Object.keys(cached).length > 0) {
        console.log(cached);
        const result = Object.entries(cached).map(([ticketTypeId, stock]) => ({
          id: ticketTypeId,
          stock: Number(stock),
        }));

        return { ticketTypes: result };
      }
    }

    const ticketDetails = await ConcertRepository.getConcertTicketsDetails(concertId);
    if (!ticketDetails) {
      throw new AppError("Tickets details not found", 404);
    }

    if (useCache && String(ticketDetails.concert.status) !== "PUBLISHED") {
      throw new AppError("Tickets details not found", 404);
    }

    const stockMap: Record<string, number> = {};

    const payload = ticketDetails.ticketTypes.map((ticketType) => {
      const availableStock = Math.max(0, ticketType.total_quantity - ticketType.sold_quantity);
      stockMap[ticketType.id] = availableStock;

      return {
        id: ticketType.id,
        stock: availableStock,
      };
    });

    if (Object.keys(stockMap).length > 0 && useCache) {
      await safeRedisHSet(key, stockMap, TICKETS_CACHE_TTL_SECONDS);
    }

    return payload;
  },
};
