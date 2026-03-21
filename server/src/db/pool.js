const mysql = require("mysql2/promise");
const {
  getTargetDatabaseName,
  resolveAdminConnectionConfig,
  resolveDatabaseConfig
} = require("../config/databaseConfig");

let pool;

function escapeIdentifier(identifier) {
  return `\`${String(identifier).replace(/`/g, "``")}\``;
}

function getPool() {
  if (!pool) {
    pool = mysql.createPool(resolveDatabaseConfig());
  }

  return pool;
}

async function ensureDatabaseExists() {
  const connection = await mysql.createConnection(resolveAdminConnectionConfig());

  try {
    const databaseName = escapeIdentifier(getTargetDatabaseName());
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS ${databaseName} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
  } finally {
    await connection.end();
  }
}

async function pingDatabase() {
  await ensureDatabaseExists();

  const connection = await getPool().getConnection();

  try {
    await connection.ping();
  } finally {
    connection.release();
  }
}

async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

module.exports = {
  closePool,
  ensureDatabaseExists,
  getPool,
  pingDatabase
};
