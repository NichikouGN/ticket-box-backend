import { internalService } from "../services/internal.service.js";

export const internalController = {
  async getConcertDetails(req: any, res: any) {
    const { concertId } = req.params as {
      concertId: string;
    };

    try {
      const concertData = await internalService.getConcertDetails(concertId);
      return res.json({
        success: true,
        data: {
          id: concertData?.id,
          title: concertData?.title,
          venue: concertData?.venue,
          event_date: concertData?.event_date,
        },
      });
    } catch (error) {
      console.log("Error fetching concert details:", error);
      return res.status(500).json({ success: false, message: "Failed to fetch concert details" });
    }
  },

  async getTicketTypesByIds(req: any, res: any) {
    const { concertId } = req.params as {
      concertId: string;
    };

    const { ticketTypeIds } = req.body as {
      ticketTypeIds: string[];
    };

    try {
      const ticketTypesData = await internalService.getTicketTypesByIds(concertId, ticketTypeIds);
      return res.json({
        success: true,
        data: ticketTypesData.map((tt) => ({
          ticketTypeId: tt.id,
          name: tt.name,
          price: tt.price,
        })),
      });
    } catch (error) {
      console.log("Error fetching ticket types:", error);
      return res.status(500).json({ success: false, message: "Failed to fetch ticket types" });
    }
  },
};
