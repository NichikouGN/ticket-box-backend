import { OrderRepository } from "../repository/order.repository.js";
import db from "../db/knex.js";
import { redis } from "../clients/redis.client.js";
import { handleTicketPreparation } from "./handleTicketPreparation.job.js";
import { OutboxRepository } from "../repository/outbox.repository.js";
import { concertClient } from "../clients/concert.client.js";
import { userClient } from "../clients/user.client.js";

export const handlePaymentSuccessJob = async (job: any) => {
  const { orderId } = job.data as {
    orderId: string;
  };

  try {
    const items = await handleTicketPreparation(orderId);

    const userId = items[0]?.userId;
    const concertId = items[0]?.concertId;

    const userData = (await userClient.get(`/users/${userId}`)).data as {
      success: boolean;
      data: {
        id: string;
        email: string;
        fullName: string;
        role: string;
        status: string;
      };
    };

    const concertData = (await concertClient.get(`/concerts/${concertId}`)).data as {
      success: boolean;
      data: {
        id: string;
        title: string;
        venue: string;
        eventDate: string;
      };
    };

    const ticketTypes = (await concertClient.get(`/concerts/${concertId}/ticket-types`)).data as {
      success: boolean;
      data: {
        id: string;
        name: string;
        price: number;
      }[];
    };

    const quantityMap = new Map<string, number>(items.map((item) => [item.ticketTypeId, item.quantity]));

    const enrichedTicketTypes = ticketTypes.data
      .filter((tt) => (quantityMap.get(tt.id) || 0) > 0)
      .map((tt) => {
        return {
          ticketTypeId: tt.id,
          name: tt.name,
          price: tt.price,
          quantity: quantityMap.get(tt.id),
        };
      });

    await db.transaction(async (trx) => {
      await OrderRepository.updateOrderStatus(trx, orderId, "COMPLETED");
      await OutboxRepository.createOrderOutboxEvent(
        trx,
        "GENERATE_TICKETS",
        {
          items: items,
          orderId: orderId,
        },
        `order-${orderId}-generate_tickets`,
        30,
      );
      await OutboxRepository.createOrderOutboxEvent(
        trx,
        "NOTIFY_USER",
        {
          orderId: orderId,
          userInfo: userData.data,
          concertData: concertData.data,
          ticketTypes: enrichedTicketTypes,
        },
        `order-${orderId}-notify_user`,
        30,
      );
    });

    const redisPublisher = redis.duplicate();
    await redisPublisher.publish(
      "order_confirm_updates",
      JSON.stringify({
        orderId: orderId,
        status: "COMPLETED",
      }),
    );
    await redisPublisher.quit();
  } catch (error) {
    // console.log("Error in handlePaymentSuccessJob:", error);
    throw error;
  }
};
