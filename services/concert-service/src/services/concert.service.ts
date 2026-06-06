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
  startTime: new Date(String(row.event_date)).toISOString(),
  status: String(row.status).toUpperCase(),
  thumbnailUrl: row.cover_image ? String(row.cover_image) : null,
});

const toDetail = (row: Record<string, unknown>): ConcertDetail => ({
  id: String(row.id),
  title: String(row.title),
  description: row.description ? String(row.description) : null,
  artists: Array.isArray(row.artists) ? row.artists.map(String) : [],
  venue: String(row.venue),
  startTime: new Date(String(row.event_date)).toISOString(),
  thumbnailUrl: row.cover_image ? String(row.cover_image) : null,
  seatMapSvgUrl: row.seat_map_svg_url ? String(row.seat_map_svg_url) : null,
});

export const ConcertService = {
  async getHealth() {
    return { redis: getRedisHealth() };
  },

  async listConcerts(page: number, limit: number) {
    const key = listKey(page, limit);
    const cached = parseCachedValue<{
      data: ConcertListItem[];
      pagination: { current_page: number; total_page: number; total_items: number };
    }>((await safeRedisMGet([key]))?.[0]);

    if (cached) {
      return cached;
    }

    const offset = (page - 1) * limit;
    const [rows, totalItems] = await Promise.all([
      ConcertRepository.getUpcomingConcerts(offset, limit),
      ConcertRepository.countUpcomingConcerts(),
    ]);

    const payload = {
      data: rows.map((row) => toListItem(row as Record<string, unknown>)),
      pagination: {
        current_page: page,
        total_page: Math.max(1, Math.ceil(totalItems / limit)),
        total_items: totalItems,
      },
    };

    await safeRedisSet(key, JSON.stringify(payload), LIST_CACHE_TTL_SECONDS);

    return payload;
  },

  async getConcertDetail(concertId: string) {
    const key = detailKey(concertId);
    const cached = parseCachedValue<ConcertDetail>((await safeRedisMGet([key]))?.[0]);

    if (cached) {
      return cached;
    }

    const concert = await ConcertRepository.getConcertDetail(concertId);
    if (!concert) {
      throw new AppError("Concert not found", 404);
    }

    const payload = toDetail(concert as Record<string, unknown>);
    await safeRedisSet(key, JSON.stringify(payload), DETAIL_CACHE_TTL_SECONDS);
    return payload;
  },

  async getConcertTicketsDetails(concertId: string) {
    const key = ticketsKey(concertId);
    const cached = parseCachedValue<{
      seat_map_svg_url: string | null;
      ticket_types: TicketTypeView[];
    }>((await safeRedisMGet([key]))?.[0]);

    if (cached) {
      return cached;
    }

    const ticketsDetails = await ConcertRepository.getConcertTicketsDetails(concertId);
    if (!ticketsDetails) {
      throw new AppError("Concert not found", 404);
    }

    const payload = {
      seatMapSvgUrl: ticketsDetails.concert.seat_map_svg_url
        ? String(ticketsDetails.concert.seat_map_svg_url)
        : null,
      ticket_types: ticketsDetails.ticketTypes.map((ticketType) => ({
        id: ticketType.id,
        name: ticketType.name,
        price: ticketType.price,
        maxPerUser: ticketType.max_per_user,
      })) satisfies TicketTypeView[],
    };

    await safeRedisSet(key, JSON.stringify(payload), TICKETS_CACHE_TTL_SECONDS);
    return payload;
  },

  async getConcertStock(concertId: string) {
    const key = stockKey(concertId);
    const cached = await safeRedisHGetAll(key);

    if (cached && Object.keys(cached).length > 0) {
      console.log(cached);
      const result = Object.entries(cached).map(([ticketTypeId, stock]) => ({
        id: ticketTypeId,
        stock: Number(stock),
      }));

      return { ticket_types: result };
    }

    const ticketDetails = await ConcertRepository.getConcertTicketsDetails(concertId);
    if (!ticketDetails) {
      throw new AppError("Concert not found", 404);
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

    if (Object.keys(stockMap).length > 0) {
      await safeRedisHSet(key, stockMap, TICKETS_CACHE_TTL_SECONDS);
    }

    return payload;
  },

  // async getConcertTickets(concertId: string) {
  //   const key = ticketsKey(concertId);
  //   const cached = parseCachedValue<{
  //     seat_map_svg_url: string | null;
  //     ticket_types: TicketTypeView[];
  //   }>((await safeRedisMGet([key]))?.[0]);

  //   if (cached) {
  //     return cached;
  //   }

  //   const concertWithStock = await ConcertRepository.getConcertWithStock(concertId);
  //   if (!concertWithStock) {
  //     throw new AppError("Concert not found", 404);
  //   }

  //   // const stockValues =
  //   //   concertWithStock.ticketTypes.length > 0
  //   //     ? await safeRedisMGet(
  //   //         concertWithStock.ticketTypes.map((ticketType) => stockKey(concertId, ticketType.id)),
  //   //       )
  //   //     : null;

  //   const ticketTypes = concertWithStock.ticketTypes.map((ticketType, index) => {
  //     // const redisStock = stockValues?.[index];
  //     // const availableSeats =
  //     //   redisStock !== undefined && redisStock !== null
  //     //     ? Math.max(0, Number(redisStock))
  //     //     : Math.max(0, ticketType.total_quantity - ticketType.sold_quantity);

  //     return {
  //       id: ticketType.id,
  //       name: ticketType.name,
  //       price: ticketType.price,
  //       maxPerUser: ticketType.max_per_user,
  //       // available_seats: availableSeats,
  //     } satisfies TicketTypeView;
  //   });

  //   const payload = {
  //     seatMapSvgUrl: concertWithStock.concert.seat_map_svg_url
  //       ? String(concertWithStock.concert.seat_map_svg_url)
  //       : null,
  //     ticket_types: ticketTypes,
  //   };

  //   await safeRedisSet(key, JSON.stringify(payload), TICKETS_CACHE_TTL_SECONDS);
  //   return payload;
  // },

  // async getConcertStock(concertId: string) {
  //   const concertWithStock = await ConcertRepository.getConcertWithStock(concertId);
  //   if (!concertWithStock) {
  //     throw new AppError("Concert not found", 404);
  //   }

  //   const ticket_types = concertWithStock.ticketTypes.map((ticketType) => ({
  //     id: ticketType.id,
  //     name: ticketType.name,
  //     price: ticketType.price,
  //     totalQuantity: ticketType.total_quantity,
  //     soldQuantity: ticketType.sold_quantity,
  //   })) satisfies StockTicketTypeView[];

  //   return { ticket_types };
  // },

  async createConcert(input: CreateConcertInput, organizerId: string) {
    const result = await ConcertRepository.createConcert(
      {
        concert: input,
        artists: input.artists,
        ticketTypes: input.ticket_types,
      },
      organizerId,
    );

    await Promise.all(
      result.ticketTypes.map((ticketType) =>
        safeRedisHSet(
          stockKey(result.concertId),
          { [ticketType.id]: String(ticketType.total_quantity) },
          24 * 60 * 60,
        ),
      ),
    );

    await deleteKeysByPattern("catalog:concerts:page:*");
    await safeRedisDel([detailKey(result.concertId), ticketsKey(result.concertId)]);

    return { concert_id: result.concertId };
  },

  async updateConcert(concertId: string, input: UpdateConcertInput) {
    const result = await ConcertRepository.updateConcert(concertId, input);
    if (!result) {
      throw new AppError("Concert not found", 404);
    }

    const invalidationKeys = [detailKey(concertId), ticketsKey(concertId), stockKey(concertId)];

    await safeRedisDel(invalidationKeys);
    await deleteKeysByPattern("catalog:concerts:page:*");

    return null;
  },

  async cancelConcert(concertId: string, organizerId: string, reason: string | null) {
    const result = await ConcertRepository.cancelConcert(concertId, organizerId, reason);
    if (!result) {
      throw new AppError("Concert not found", 404);
    }

    if (!result.updated) {
      throw new AppError("Concert must be published before it can be cancelled", 400);
    }

    await safeRedisDel([detailKey(concertId), ticketsKey(concertId), stockKey(concertId)]);
    await deleteKeysByPattern("catalog:concerts:page:*");

    try {
      await notificationQueue.add("concert-cancelled", {
        concertId,
        organizerId,
        reason,
      });
    } catch (error) {
      console.warn("Failed to enqueue cancellation notification job", error);
    }

    return null;
  },
};
