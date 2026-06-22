export type NotificationPayload = {
  orderId: string;
  userInfo: {
    id: string;
    email: string;
    full_name: string;
    role: string;
    status: string;
  };
  concertData: {
    id: string;
    title: string;
    venue: string;
    event_date: string;
  };
  ticketTypes: {
    ticketTypeId: string;
    name: string;
    price: number;
    quantity: number;
  }[];
};
