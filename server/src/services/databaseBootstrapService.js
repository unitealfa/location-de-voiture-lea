const { pingDatabase } = require("../db/pool");
const { initializeAdminAuth } = require("./adminAuthService");
const { startReservationLicenseCleanupScheduler } = require("./reservationService");
const {
  setAdminSeed,
  setDatabaseState
} = require("./runtimeStateService");

const DATABASE_RETRY_DELAY_MS = 15000;

let bootstrapPromise = null;
let cleanupSchedulerStarted = false;

async function ensureDatabaseBootstrap() {
  if (bootstrapPromise) {
    return bootstrapPromise;
  }

  setDatabaseState({
    ready: false,
    status: "connecting",
    lastError: "",
    retryDelayMs: DATABASE_RETRY_DELAY_MS
  });

  bootstrapPromise = (async () => {
    try {
      await pingDatabase();
      const seededAdmin = await initializeAdminAuth();

      setAdminSeed(seededAdmin.username);
      setDatabaseState({
        ready: true,
        status: "ready",
        lastError: "",
        lastSuccessAt: new Date().toISOString(),
        retryDelayMs: DATABASE_RETRY_DELAY_MS
      });

      if (!cleanupSchedulerStarted && !process.env.VERCEL) {
        startReservationLicenseCleanupScheduler();
        cleanupSchedulerStarted = true;
      }

      return true;
    } catch (error) {
      setDatabaseState({
        ready: false,
        status: "retrying",
        lastError: `${error.code || "ERROR"}: ${error.message}`,
        retryDelayMs: DATABASE_RETRY_DELAY_MS
      });

      throw error;
    } finally {
      bootstrapPromise = null;
    }
  })();

  return bootstrapPromise;
}

module.exports = {
  DATABASE_RETRY_DELAY_MS,
  ensureDatabaseBootstrap
};
