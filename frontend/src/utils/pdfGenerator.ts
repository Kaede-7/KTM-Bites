import { type OrderData } from "../api/orders";
import mascotIcon from "../assets/ktm-bites-transparent-notext.png";

/**
 * Generates and downloads a beautifully structured, premium PDF order report for a KTM Bites order.
 * Uses native high-fidelity printing to allow "Save as PDF" with perfect vector layouts.
 */
export const downloadOrderPDF = (order: OrderData) => {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow popups to download your order report PDF.");
    return;
  }

  const formattedDate = new Date(order.created_at).toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const itemsHtml = order.items
    .map(
      (item) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #ebdcd0; text-align: left;">
        <span style="font-weight: 600; color: #2a2420;">${item.name}</span>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #ebdcd0; text-align: center; color: #7a7067;">
        Rs. ${item.price}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #ebdcd0; text-align: center; color: #7a7067;">
        ${item.quantity}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #ebdcd0; text-align: right; font-weight: 700; color: #2a2420;">
        Rs. ${item.subtotal}
      </td>
    </tr>
  `
    )
    .join("");

  // Clean branding block matching KTM-Bites navbar using local mascotIcon asset and classes
  const logoHtml = `
    <div class="navbar-logo">
      <img src="${mascotIcon}" alt="KTM Bites Logo" class="navbar-logo-icon" />
      <span class="navbar-logo-wordmark">KTM<em>Bites</em></span>
    </div>
  `;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>KTM Bites Order Report - ${order.order_id}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700;800&display=swap');
        
        body {
          font-family: 'Plus Jakarta Sans', 'Segoe UI', -apple-system, sans-serif;
          color: #2a2420;
          margin: 0;
          padding: 40px;
          line-height: 1.5;
          background-color: #fff;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        .invoice-card {
          max-width: 800px;
          margin: 0 auto;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #f28b46;
          padding-bottom: 20px;
          margin-bottom: 35px;
        }

        /* ── Navbar Logo Styling Replica ────────────────── */
        .navbar-logo {
          display: flex;
          align-items: flex-end;
          gap: 0;
          text-decoration: none;
        }

        .navbar-logo-icon {
          height: 60px;
          width: auto;
          object-fit: contain;
          margin: 0 -12px -16px -20px;
          flex-shrink: 0;
        }

        .navbar-logo-wordmark {
          font-family: 'Inter', -apple-system, sans-serif;
          font-size: 23px;
          font-weight: 800;
          color: #f28b46;
          background: linear-gradient(135deg, #f28b46 0%, #d95e14 100%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          letter-spacing: -0.04em;
          line-height: 1;
          user-select: none;
          padding-left: 4px;
          padding-right: 6px;
          margin-bottom: 3px;
        }

        .navbar-logo-wordmark em {
          font-style: italic;
        }

        .invoice-title {
          text-align: right;
        }

        .invoice-title h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 800;
          color: #e06c22;
          letter-spacing: -0.03em;
        }

        .invoice-title p {
          margin: 6px 0 0 0;
          color: #7a7067;
          font-size: 14px;
          font-weight: 600;
        }

        .meta-grid {
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          gap: 40px;
          margin-bottom: 40px;
        }

        .meta-section h3 {
          margin: 0 0 12px 0;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #e06c22;
          font-weight: 800;
        }

        .meta-section p {
          margin: 6px 0;
          font-size: 14px;
          color: #4b5563;
        }

        .meta-section strong {
          color: #2a2420;
          font-weight: 700;
        }

        .table-container {
          margin-bottom: 35px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th {
          background-color: #faf8f5;
          color: #e06c22;
          font-weight: 800;
          text-transform: uppercase;
          font-size: 11px;
          letter-spacing: 0.08em;
          padding: 12px;
          border-bottom: 2px solid #ebdcd0;
        }

        .totals-container {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 40px;
        }

        .totals-table {
          width: 320px;
        }

        .totals-table td {
          padding: 8px 12px;
          font-size: 14px;
        }

        .totals-table tr.grand-total td {
          border-top: 2px dashed #f28b46;
          font-size: 18px;
          font-weight: 800;
          color: #e06c22;
          padding-top: 14px;
        }

        .notes-card {
          background-color: #faf8f5;
          border-left: 4px solid #f28b46;
          padding: 16px;
          border-radius: 12px;
          margin-top: 24px;
        }

        .notes-card h4 {
          margin: 0 0 6px 0;
          font-size: 12px;
          text-transform: uppercase;
          color: #e06c22;
          letter-spacing: 0.06em;
          font-weight: 800;
        }

        .notes-card p {
          margin: 0;
          font-size: 13px;
          color: #57534e;
          font-style: italic;
        }

        .footer {
          text-align: center;
          border-top: 1px solid #ebdcd0;
          padding-top: 25px;
          margin-top: 60px;
          font-size: 12px;
          color: #8b7d72;
        }

        .footer p {
          margin: 4px 0;
        }

        @page {
          size: portrait;
          margin: 0; /* completely hides browser header & footer like 'about:blank' */
        }
        @media print {
          body {
            padding: 2cm;
            background-color: #fff;
          }
        }
      </style>
    </head>
    <body>
      <div class="invoice-card">
        <div class="header">
          <div class="logo">
            ${logoHtml}
          </div>
          <div class="invoice-title">
            <h1>ORDER REPORT</h1>
            <p>Order Code: <strong style="color: #e06c22;">${order.order_id}</strong></p>
          </div>
        </div>

        <div class="meta-grid">
          <div class="meta-section">
            <h3>Delivery Info</h3>
            <p><strong>Customer Name:</strong> ${order.full_name}</p>
            <p><strong>Contact Number:</strong> ${order.phone}</p>
            <p><strong>Address:</strong> ${order.address}, ${order.city}</p>
            ${order.landmark ? `<p><strong>Landmark:</strong> ${order.landmark}</p>` : ""}
          </div>
          <div class="meta-section" style="text-align: right;">
            <h3>Report Details</h3>
            <p>Report Date: <strong>${formattedDate}</strong></p>
            <p>Payment Mode: <strong>${order.payment_method.toUpperCase()}</strong></p>
            <p>Payment Status: <strong style="color: #10b981;">${(order.payment_status || "completed").toUpperCase()}</strong></p>
          </div>
        </div>

        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th style="text-align: left; width: 45%;">Item Name</th>
                <th style="text-align: center; width: 20%;">Price</th>
                <th style="text-align: center; width: 15%;">Quantity</th>
                <th style="text-align: right; width: 20%;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
        </div>

        <div class="totals-container">
          <table class="totals-table">
            <tr>
              <td style="color: #8b7d72; font-weight: 500;">Cart Subtotal</td>
              <td style="text-align: right; font-weight: 700; color: #2a2420;">Rs. ${order.subtotal}</td>
            </tr>
            <tr>
              <td style="color: #8b7d72; font-weight: 500;">Standard Delivery</td>
              <td style="text-align: right; font-weight: 700; color: #2a2420;">Rs. ${order.delivery_fee}</td>
            </tr>
            <tr class="grand-total">
              <td>Grand Total</td>
              <td style="text-align: right;">Rs. ${order.total}</td>
            </tr>
          </table>
        </div>

        ${
          order.notes
            ? `
          <div class="notes-card">
            <h4>Cooking & Delivery Notes</h4>
            <p>"${order.notes}"</p>
          </div>
        `
            : ""
        }

        <div class="footer">
          <p style="font-weight: 700; color: #e06c22; font-size: 13px; margin-bottom: 6px;">Thank you for your order!</p>
          <p><strong>KTM Bites Pvt. Ltd.</strong> — Kathmandu, Nepal</p>
        </div>
      </div>

      <script>
        window.onload = function() {
          window.print();
          // Gracefully close tab once printed or cancelled
          setTimeout(function() {
            window.close();
          }, 300);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
};
