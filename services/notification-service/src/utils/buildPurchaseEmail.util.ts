import type { NotificationPayload } from "../types/notification.types.js";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatEventDate(dateString: string) {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return dateString; // fallback if parsing fails
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(date);
}

export function buildPurchaseEmail(data: NotificationPayload) {
  const subject = "Your purchase was successful";

  const eventDate = formatEventDate(data.concertData.event_date);

  const ticketsHtml =
    data.ticketTypes.length > 0
      ? data.ticketTypes
          .map(
            (ticket) => `
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                  <div style="font-weight: 600; color: #111827;">
                    ${escapeHtml(ticket.name)} <span style="color: #6b7280;"> x ${ticket.quantity}</span>
                  </div>
                </td>
              </tr>
            `,
          )
          .join("")
      : `
        <tr>
          <td style="padding: 12px 0; color: #6b7280;">
            No ticket details available.
          </td>
        </tr>
      `;

  const html = `
    <div style="margin:0;padding:0;background:#f9fafb;font-family:Arial,Helvetica,sans-serif;">
      <div style="max-width:640px;margin:0 auto;padding:32px 16px;">
        <div style="background:#ffffff;border-radius:16px;padding:32px;border:1px solid #e5e7eb;">
          <h1 style="margin:0 0 16px;font-size:28px;line-height:1.2;color:#111827;">
            Your purchase was successful
          </h1>

          <p style="margin:0 0 24px;color:#374151;font-size:16px;line-height:1.6;">
            Dear ${escapeHtml(data.userInfo.full_name)}, your order has been successfully processed. Below are the details of your purchase:  
          </p>

          <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin-bottom:24px;">
            <p style="margin:0 0 10px;color:#111827;font-size:15px;">
              <strong>Order ID:</strong> ${escapeHtml(data.orderId)}
            </p>
            <p style="margin:0 0 10px;color:#111827;font-size:15px;">
              <strong>Event:</strong> ${escapeHtml(data.concertData.title)}
            </p>
            <p style="margin:0 0 10px;color:#111827;font-size:15px;">
              <strong>Date & Time:</strong> ${escapeHtml(eventDate)}
            </p>
            <p style="margin:0;color:#111827;font-size:15px;">
              <strong>Venue:</strong> ${escapeHtml(data.concertData.venue)}
            </p>
          </div>

          <h2 style="margin:0 0 12px;font-size:20px;color:#111827;">
            Tickets
          </h2>

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
            ${ticketsHtml}
          </table>

          <p style="margin:24px 0 0;color:#6b7280;font-size:14px;line-height:1.6;">
            If you have any questions about your order, please contact support.
          </p>
        </div>
      </div>
    </div>
  `;

  return { subject, html };
}
