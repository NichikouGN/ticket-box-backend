export type handleCompletedType = {
  paymentId: string;
  orderId: string;
  userId: string;
  amount: number;
  paymentRef: string;
  paymentMethod: string;
  idempotencyKey: string;
  status: string;
};
