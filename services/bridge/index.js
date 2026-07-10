const http = require('http');
const url = require('url');

const PORT = 5173;

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  if (pathname === '/payment-success') {
    const orderId = parsedUrl.query.orderId || '';
    const redirectUrl = `ticketboxmobileapp://payment-success?orderId=${orderId}`;
    
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Payment Success</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              background-color: #f5f5f7;
              color: #1d1d1f;
              text-align: center;
              padding: 20px;
            }
            .card {
              background: white;
              padding: 40px;
              border-radius: 20px;
              box-shadow: 0 4px 20px rgba(0,0,0,0.05);
              max-width: 400px;
              width: 100%;
            }
            h1 { color: #34c759; margin-bottom: 10px; }
            p { color: #86868b; line-height: 1.5; margin-bottom: 30px; }
            .btn {
              display: inline-block;
              background: #0071e3;
              color: white;
              text-decoration: none;
              padding: 12px 24px;
              border-radius: 10px;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Thanh toán thành công!</h1>
            <p>Đang chuyển hướng bạn quay lại ứng dụng TicketBox...</p>
            <a class="btn" href="${redirectUrl}">Bấm vào đây nếu không tự động chuyển hướng</a>
          </div>
          <script>
            setTimeout(() => {
              window.location.href = "${redirectUrl}";
            }, 1000);
          </script>
        </body>
      </html>
    `);
  } else if (pathname === '/payment-cancelled') {
    const redirectUrl = `ticketboxmobileapp://payment-cancelled`;
    
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Payment Cancelled</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              background-color: #f5f5f7;
              color: #1d1d1f;
              text-align: center;
              padding: 20px;
            }
            .card {
              background: white;
              padding: 40px;
              border-radius: 20px;
              box-shadow: 0 4px 20px rgba(0,0,0,0.05);
              max-width: 400px;
              width: 100%;
            }
            h1 { color: #ff3b30; margin-bottom: 10px; }
            p { color: #86868b; line-height: 1.5; margin-bottom: 30px; }
            .btn {
              display: inline-block;
              background: #0071e3;
              color: white;
              text-decoration: none;
              padding: 12px 24px;
              border-radius: 10px;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Thanh toán đã hủy</h1>
            <p>Đang chuyển hướng bạn quay lại ứng dụng TicketBox...</p>
            <a class="btn" href="${redirectUrl}">Bấm vào đây nếu không tự động chuyển hướng</a>
          </div>
          <script>
            setTimeout(() => {
              window.location.href = "${redirectUrl}";
            }, 1000);
          </script>
        </body>
      </html>
    `);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Bridge server listening on port ${PORT}`);
});
