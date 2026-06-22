import { ConcertRepository } from "../repository/concert.repository.js";

export const internalService = {
  async getConcertDetails(concertId: string) {
    const concertData = await ConcertRepository.getConcertDetail(concertId);
    return concertData;
  },

  async getTicketTypesByIds(concertId: string, ticketTypeIds: string[]) {
    const ticketTypesData = await ConcertRepository.getTicketTypesByIds(concertId, ticketTypeIds);
    return ticketTypesData;
  },
};
