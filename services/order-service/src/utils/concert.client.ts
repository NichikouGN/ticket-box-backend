import dotenv from "dotenv";
import { AppError } from "../types/appError.types.js";
import type { TicketTypeCatalogItem } from "../types/order.types.js";

dotenv.config();

const CONCERT_SERVICE_URL = process.env.CONCERT_SERVICE_URL ?? "http://localhost:3003";

type APIResponse<T> = {
  success: boolean;
  data: T;
};

type ConcertStockResponse = {
  ticketTypes: Array<{
    id: string;
    stock: number;
  }>;
};

type ConcertTicketsResponse = {
  seatMapSvgUrl: string | null;
  ticketTypes: Array<{
    id: string;
    name: string;
    price: number;
    maxPerUser: number;
  }>;
};

const toJson = async <T>(response: Response) => {
  if (!response.ok) {
    throw new AppError(`Concert service request failed with status ${response.status}`, 502);
  }

  return (await response.json()) as T;
};

export const ConcertClient = {
  /**
   * Fetches ticket types for a given concert.
   * @param concertId - The ID of the concert to fetch tickets for.
   * @returns An object containing the seat map URL and an array of ticket types.
   * @throws AppError if the request to the concert service fails.
   */
  async getConcertTickets(
    concertId: string,
  ): Promise<{ seatMapSvgUrl: string | null; ticketTypes: TicketTypeCatalogItem[] }> {
    const response = await fetch(`${CONCERT_SERVICE_URL}/${concertId}/tickets`);
    const payload = await toJson<APIResponse<ConcertTicketsResponse>>(response);

    return payload.data;
  },

  /**
   * Fetches stock information for a given concert.
   * @param concertId - The ID of the concert to fetch stock for.
   * @returns An object containing an array of ticket types with their stock levels.
   * @throws AppError if the request to the concert service fails.
   */
  async getConcertStock(concertId: string): Promise<ConcertStockResponse> {
    const response = await fetch(`${CONCERT_SERVICE_URL}/${concertId}/stock`);
    const payload = await toJson<APIResponse<ConcertStockResponse>>(response);

    return payload.data;
  },
};
