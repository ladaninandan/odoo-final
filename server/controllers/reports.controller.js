import Order from '../models/Order.js';
import { generatePDF, generateXLS } from '../utils/reportExport.js';

export const getDashboard = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalSales, totalOrders, todaySales, todayOrders, topProducts] = await Promise.all([
      Order.aggregate([
        { $match: { status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      Order.countDocuments({ status: 'paid' }),
      Order.aggregate([
        { $match: { status: 'paid', createdAt: { $gte: today } } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      Order.countDocuments({ status: 'paid', createdAt: { $gte: today } }),
      Order.aggregate([
        { $match: { status: 'paid' } },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.name',
            totalQty: { $sum: '$items.quantity' },
            totalRevenue: { $sum: '$items.subtotal' },
          },
        },
        { $sort: { totalQty: -1 } },
        { $limit: 10 },
        { $project: { name: '$_id', totalQty: 1, totalRevenue: 1, _id: 0 } },
      ]),
    ]);

    res.json({
      totalSales: totalSales[0]?.total || 0,
      totalOrders,
      todaySales: todaySales[0]?.total || 0,
      todayOrders,
      topProducts,
      averageOrderValue: totalOrders ? (totalSales[0]?.total || 0) / totalOrders : 0,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch dashboard', error: err.message });
  }
};

export const getSalesReport = async (req, res) => {
  try {
    const { period = 'today', startDate, endDate, sessionId, responsibleId, productId } = req.query;
    const filter = { status: 'paid' };

    // Date filter
    const now = new Date();
    if (period === 'today') {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      filter.createdAt = { $gte: start };
    } else if (period === 'week') {
      const start = new Date(now);
      start.setDate(start.getDate() - 7);
      filter.createdAt = { $gte: start };
    } else if (period === 'month') {
      const start = new Date(now);
      start.setMonth(start.getMonth() - 1);
      filter.createdAt = { $gte: start };
    } else if (period === 'custom' && startDate && endDate) {
      filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    if (sessionId) filter.session = sessionId;
    if (responsibleId) filter.createdBy = responsibleId;

    let orders = await Order.find(filter)
      .populate('table', 'tableNumber')
      .populate('createdBy', 'first_name last_name')
      .sort({ createdAt: -1 });

    // Filter by product if specified
    if (productId) {
      orders = orders.filter((o) =>
        o.items.some((item) => item.product?.toString() === productId)
      );
    }

    const totalSales = orders.reduce((sum, o) => sum + o.total, 0);

    res.json({
      orders,
      summary: {
        totalSales,
        totalOrders: orders.length,
        averageOrderValue: orders.length ? totalSales / orders.length : 0,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch sales report', error: err.message });
  }
};

export const exportPDF = async (req, res) => {
  try {
    // Reuse sales report logic
    const reportData = await buildReportData(req.query);
    const pdfBuffer = await generatePDF(reportData);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=sales-report.pdf');
    res.send(pdfBuffer);
  } catch (err) {
    res.status(500).json({ message: 'Failed to export PDF', error: err.message });
  }
};

export const exportXLS = async (req, res) => {
  try {
    const reportData = await buildReportData(req.query);
    const xlsBuffer = await generateXLS(reportData);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=sales-report.xlsx');
    res.send(xlsBuffer);
  } catch (err) {
    res.status(500).json({ message: 'Failed to export XLS', error: err.message });
  }
};

// Helper to build report data for exports
async function buildReportData(query) {
  const { period = 'today', startDate, endDate, sessionId } = query;
  const filter = { status: 'paid' };

  const now = new Date();
  if (period === 'today') {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    filter.createdAt = { $gte: start };
  } else if (period === 'week') {
    const start = new Date(now);
    start.setDate(start.getDate() - 7);
    filter.createdAt = { $gte: start };
  } else if (period === 'custom' && startDate && endDate) {
    filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }

  if (sessionId) filter.session = sessionId;

  const orders = await Order.find(filter)
    .populate('table', 'tableNumber')
    .sort({ createdAt: -1 });

  const totalSales = orders.reduce((sum, o) => sum + o.total, 0);

  // Top products
  const productMap = {};
  orders.forEach((o) => {
    o.items.forEach((item) => {
      if (!productMap[item.name]) productMap[item.name] = { name: item.name, totalQty: 0, totalRevenue: 0 };
      productMap[item.name].totalQty += item.quantity;
      productMap[item.name].totalRevenue += item.subtotal;
    });
  });
  const topProducts = Object.values(productMap).sort((a, b) => b.totalQty - a.totalQty).slice(0, 10);

  return {
    summary: {
      totalSales,
      totalOrders: orders.length,
      averageOrderValue: orders.length ? totalSales / orders.length : 0,
    },
    orders,
    topProducts,
    filters: { period, startDate, endDate, sessionId },
  };
}
