const { getPool } = require("../db/pool");

async function createSiteVisitEvent({ visitorHash, requestPath }) {
  const pool = getPool();

  await pool.execute(
    `
      INSERT INTO site_visit_events (
        visitor_hash,
        request_path
      )
      VALUES (?, ?)
    `,
    [visitorHash, requestPath]
  );
}

async function getSiteVisitOverview(monthStart) {
  const pool = getPool();
  const [rows] = await pool.execute(
    `
      SELECT
        COUNT(*) AS total_visits,
        COUNT(DISTINCT visitor_hash) AS total_visitors,
        SUM(CASE WHEN visited_at >= ? THEN 1 ELSE 0 END) AS month_visits,
        COUNT(DISTINCT CASE WHEN visited_at >= ? THEN visitor_hash END) AS month_visitors
      FROM site_visit_events
    `,
    [monthStart, monthStart]
  );

  const row = rows[0] || {};

  return {
    totalVisits: Number(row.total_visits || 0),
    totalVisitors: Number(row.total_visitors || 0),
    monthVisits: Number(row.month_visits || 0),
    monthVisitors: Number(row.month_visitors || 0)
  };
}

async function listDailySiteVisitTotals(startDate) {
  const pool = getPool();
  const [rows] = await pool.execute(
    `
      SELECT
        DATE(visited_at) AS visit_date,
        COUNT(*) AS total_visits,
        COUNT(DISTINCT visitor_hash) AS total_visitors
      FROM site_visit_events
      WHERE visited_at >= ?
      GROUP BY DATE(visited_at)
      ORDER BY visit_date ASC
    `,
    [startDate]
  );

  return rows.map((row) => ({
    visitDate: row.visit_date,
    totalVisits: Number(row.total_visits || 0),
    totalVisitors: Number(row.total_visitors || 0)
  }));
}

module.exports = {
  createSiteVisitEvent,
  getSiteVisitOverview,
  listDailySiteVisitTotals
};
