const { getRuntimeState } = require("../services/runtimeStateService");

function requireDatabaseReady(request, response, next) {
  const runtimeState = getRuntimeState();

  if (runtimeState.database.ready) {
    return next();
  }

  return response.status(503).json({
    message: "Le service admin est temporairement indisponible.",
    databaseStatus: runtimeState.database.status,
    retryDelayMs: runtimeState.database.retryDelayMs
  });
}

module.exports = {
  requireDatabaseReady
};
