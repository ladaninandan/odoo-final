import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';

/**
 * Generates a PDF sales report from order data.
 * @param {Object} data - { summary, orders, filters }
 * @returns {Buffer} PDF buffer
 */
export const generatePDF = async (data) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // Header
      doc.fontSize(20).text('Odoo POS Cafe — Sales Report', { align: 'center' });
      doc.moveDown();
      doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
      doc.moveDown();

      // Filters applied
      if (data.filters) {
        doc.fontSize(12).text('Filters Applied:', { underline: true });
        Object.entries(data.filters).forEach(([key, val]) => {
          if (val) doc.fontSize(10).text(`  ${key}: ${val}`);
        });
        doc.moveDown();
      }

      // Summary
      if (data.summary) {
        doc.fontSize(14).text('Summary', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(11)
          .text(`Total Sales: ₹${data.summary.totalSales?.toFixed(2) || 0}`)
          .text(`Total Orders: ${data.summary.totalOrders || 0}`)
          .text(`Average Order Value: ₹${data.summary.averageOrderValue?.toFixed(2) || 0}`);
        doc.moveDown();
      }

      // Orders table
      if (data.orders?.length) {
        doc.fontSize(14).text('Orders', { underline: true });
        doc.moveDown(0.5);

        const tableTop = doc.y;
        const headers = ['#', 'Order', 'Table', 'Items', 'Total', 'Status', 'Date'];
        const colWidths = [30, 80, 50, 50, 60, 70, 100];
        let x = 50;

        // Table headers
        doc.fontSize(9).font('Helvetica-Bold');
        headers.forEach((h, i) => {
          doc.text(h, x, tableTop, { width: colWidths[i] });
          x += colWidths[i];
        });
        doc.moveDown();

        // Table rows
        doc.font('Helvetica').fontSize(8);
        data.orders.forEach((order, idx) => {
          if (doc.y > 700) {
            doc.addPage();
          }
          x = 50;
          const row = [
            idx + 1,
            order.orderNumber || '-',
            order.table?.tableNumber || '-',
            order.items?.length || 0,
            `₹${order.total?.toFixed(2) || 0}`,
            order.status || '-',
            new Date(order.createdAt).toLocaleDateString(),
          ];
          row.forEach((cell, i) => {
            doc.text(String(cell), x, doc.y, { width: colWidths[i] });
            x += colWidths[i];
          });
          doc.moveDown(0.3);
        });
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Generates an Excel workbook from order data.
 * @param {Object} data - { summary, orders, topProducts }
 * @returns {Buffer} XLSX buffer
 */
export const generateXLS = async (data) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Odoo POS Cafe';
  workbook.created = new Date();

  // Summary sheet
  const summarySheet = workbook.addWorksheet('Summary');
  summarySheet.columns = [
    { header: 'Metric', key: 'metric', width: 25 },
    { header: 'Value', key: 'value', width: 20 },
  ];
  if (data.summary) {
    summarySheet.addRow({ metric: 'Total Sales', value: data.summary.totalSales || 0 });
    summarySheet.addRow({ metric: 'Total Orders', value: data.summary.totalOrders || 0 });
    summarySheet.addRow({ metric: 'Average Order Value', value: data.summary.averageOrderValue || 0 });
  }

  // Orders sheet
  const ordersSheet = workbook.addWorksheet('Orders');
  ordersSheet.columns = [
    { header: 'Order #', key: 'orderNumber', width: 20 },
    { header: 'Table', key: 'table', width: 10 },
    { header: 'Items', key: 'items', width: 10 },
    { header: 'Subtotal', key: 'subtotal', width: 15 },
    { header: 'Tax', key: 'tax', width: 12 },
    { header: 'Total', key: 'total', width: 15 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Source', key: 'source', width: 12 },
    { header: 'Date', key: 'date', width: 20 },
  ];
  if (data.orders?.length) {
    data.orders.forEach((order) => {
      ordersSheet.addRow({
        orderNumber: order.orderNumber,
        table: order.table?.tableNumber || '-',
        items: order.items?.length || 0,
        subtotal: order.subtotal,
        tax: order.tax,
        total: order.total,
        status: order.status,
        source: order.source,
        date: new Date(order.createdAt).toLocaleString(),
      });
    });
  }

  // Top Products sheet
  if (data.topProducts?.length) {
    const productsSheet = workbook.addWorksheet('Top Products');
    productsSheet.columns = [
      { header: 'Product', key: 'name', width: 25 },
      { header: 'Quantity Sold', key: 'totalQty', width: 15 },
      { header: 'Revenue', key: 'totalRevenue', width: 15 },
    ];
    data.topProducts.forEach((p) => {
      productsSheet.addRow(p);
    });
  }

  // Style headers
  [summarySheet, ordersSheet].forEach((sheet) => {
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F46E5' },
    };
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};
