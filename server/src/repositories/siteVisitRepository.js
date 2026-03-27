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

async function getSiteVisitOverviewInRange(startDate, endDate) {
  const pool = getPool();
  const conditions = [];
  const parameters = [];

  if (startDate) {
    conditions.push("visited_at >= ?");
    parameters.push(startDate);
  }

  if (endDate) {
    conditions.push("visited_at < ?");
    parameters.push(endDate);
  }

  const [rows] = await pool.execute(
    `
      SELECT
        COUNT(*) AS total_visits,
        COUNT(DISTINCT visitor_hash) AS total_visitors
      FROM site_visit_events
      ${conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""}
    `,
    parameters
  );

  const row = rows[0] || {};

  return {
    totalVisits: Number(row.total_visits || 0),
    totalVisitors: Number(row.total_visitors || 0)
  };
}

async function listDailySiteVisitTotalsInRange(startDate, endDate) {
  const pool = getPool();
  const conditions = [];
  const parameters = [];

  if (startDate) {
    conditions.push("visited_at >= ?");
    parameters.push(startDate);
  }

  if (endDate) {
    conditions.push("visited_at < ?");
    parameters.push(endDate);
  }

  const [rows] = await pool.execute(
    `
      SELECT
        DATE(visited_at) AS visit_date,
        COUNT(*) AS total_visits,
        COUNT(DISTINCT visitor_hash) AS total_visitors
      FROM site_visit_events
      ${conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""}
      GROUP BY DATE(visited_at)
      ORDER BY visit_date ASC
    `,
    parameters
  );

  return rows.map((row) => ({
    visitDate: row.visit_date,
    totalVisits: Number(row.total_visits || 0),
    totalVisitors: Number(row.total_visitors || 0)
  }));
}

module.exports = {
  createSiteVisitEvent,
  getSiteVisitOverviewInRange,
  listDailySiteVisitTotalsInRange
};
