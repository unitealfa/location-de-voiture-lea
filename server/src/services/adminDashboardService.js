const {
  listReservations
} = require("../repositories/reservationRepository");
const { listAdminVehicles } = require("./vehicleService");
const { getSiteVisitDashboardStats } = require("./siteVisitService");

const MONTH_FORMATTER = new Intl.DateTimeFormat("fr-FR", {
  month: "short",
  year: "numeric"
});
const WEEKDAY_LABELS = [
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
  "Dimanche"
];

function toDate(value) {
  return new Date(String(value).replace(" ", "T"));
}

function createMonthReference(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}

function createMonthLabel(date) {
  const rawLabel = MONTH_FORMATTER.format(date);
  return rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1);
}

function getMonthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function reservationTouchesMonth(reservation, monthDate) {
  const monthStart = createMonthReference(monthDate);
  const nextMonthStart = new Date(
    monthStart.getFullYear(),
    monthStart.getMonth() + 1,
    1,
    0,
    0,
    0,
    0
  );
  const pickupDate = toDate(reservation.pickupDatetime);
  const returnDate = toDate(reservation.returnDatetime);

  return pickupDate < nextMonthStart && returnDate > monthStart;
}

function createLastMonths(count) {
  const currentMonth = createMonthReference(new Date());

  return Array.from({ length: count }, (_, index) => {
    const monthDate = new Date(currentMonth);
    monthDate.setMonth(currentMonth.getMonth() - (count - 1 - index));
    return monthDate;
  });
}

function buildTopVehiclesChart(acceptedReservations, limit = 5) {
  const vehicleCounts = new Map();

  acceptedReservations.forEach((reservation) => {
    const label = [reservation.vehicleBrand, reservation.vehicleModel]
      .filter(Boolean)
      .join(" ") || `Vehicule #${reservation.vehicleId || reservation.id}`;
    vehicleCounts.set(label, (vehicleCounts.get(label) || 0) + 1);
  });

  return Array.from(vehicleCounts.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((left, right) => right.value - left.value || left.label.localeCompare(right.label))
    .slice(0, limit);
}

function buildReservationsByMonthChart(acceptedReservations, count = 6) {
  const months = createLastMonths(count);
  const monthCounts = new Map(months.map((monthDate) => [getMonthKey(monthDate), 0]));

  acceptedReservations.forEach((reservation) => {
    const pickupDate = toDate(reservation.pickupDatetime);
    const key = getMonthKey(createMonthReference(pickupDate));

    if (monthCounts.has(key)) {
      monthCounts.set(key, (monthCounts.get(key) || 0) + 1);
    }
  });

  return months.map((monthDate) => ({
    label: createMonthLabel(monthDate),
    value: monthCounts.get(getMonthKey(monthDate)) || 0
  }));
}

function buildReservationsByWeekdayChart(acceptedReservations) {
  const weekdayCounts = Array.from({ length: 7 }, () => 0);

  acceptedReservations.forEach((reservation) => {
    const pickupDate = toDate(reservation.pickupDatetime);
    const weekdayIndex = (pickupDate.getDay() + 6) % 7;
    weekdayCounts[weekdayIndex] += 1;
  });

  return WEEKDAY_LABELS.map((label, index) => ({
    label,
    value: weekdayCounts[index]
  }));
}

function buildFleetStatusChart(vehicles) {
  const counts = {
    available: 0,
    reserved: 0,
    maintenance: 0
  };

  vehicles.forEach((vehicle) => {
    if (vehicle.availabilityStatus === "reserved") {
      counts.reserved += 1;
      return;
    }

    if (vehicle.availabilityStatus === "maintenance") {
      counts.maintenance += 1;
      return;
    }

    counts.available += 1;
  });

  return [
    {
      label: "Disponibles",
      value: counts.available,
      tone: "available"
    },
    {
      label: "Réservés",
      value: counts.reserved,
      tone: "reserved"
    },
    {
      label: "Maintenance",
      value: counts.maintenance,
      tone: "maintenance"
    }
  ];
}

function buildTopVehicleInsight(topVehicles) {
  if (topVehicles.length === 0) {
    return {
      label: "Aucune donnée",
      value: 0,
      helper: "Aucune réservation confirmée pour le moment."
    };
  }

  return {
    label: topVehicles[0].label,
    value: topVehicles[0].value,
    helper: "véhicule le plus loué"
  };
}

function buildBusiestMonthInsight(acceptedReservations) {
  const monthCounts = new Map();

  acceptedReservations.forEach((reservation) => {
    const pickupDate = toDate(reservation.pickupDatetime);
    const monthReference = createMonthReference(pickupDate);
    const key = getMonthKey(monthReference);
    const currentValue = monthCounts.get(key) || {
      label: createMonthLabel(monthReference),
      value: 0
    };

    currentValue.value += 1;
    monthCounts.set(key, currentValue);
  });

  const busiestMonth = Array.from(monthCounts.values()).sort(
    (left, right) => right.value - left.value || left.label.localeCompare(right.label)
  )[0];

  if (!busiestMonth) {
    return {
      label: "Aucune donnée",
      value: 0,
      helper: "Le site n'a pas encore assez d'historique."
    };
  }

  return {
    label: busiestMonth.label,
    value: busiestMonth.value,
    helper: "période la plus demandée"
  };
}

function buildBusiestWeekdayInsight(weekdayChart) {
  const busiestWeekday = [...weekdayChart].sort(
    (left, right) => right.value - left.value || left.label.localeCompare(right.label)
  )[0];

  if (!busiestWeekday || busiestWeekday.value === 0) {
    return {
      label: "Aucune donnée",
      value: 0,
      helper: "Aucune tendance détectée pour le moment."
    };
  }

  return {
    label: busiestWeekday.label,
    value: busiestWeekday.value,
    helper: "jour qui reçoit le plus de départs"
  };
}

async function getAdminDashboardStats() {
  const currentMonth = createMonthReference(new Date());
  const safeSiteVisitStats = getSiteVisitDashboardStats().catch((error) => {
    console.error("Unable to load site visit stats for dashboard.", error);

    return {
      totalVisits: 0,
      totalVisitors: 0,
      monthVisits: 0,
      monthVisitors: 0,
      recentVisits: []
    };
  });
  const [pendingReservations, acceptedReservations, allAcceptedReservations, vehicles, siteVisits] =
    await Promise.all([
      listReservations({ status: "pending" }),
      listReservations({ status: "accepted", futureOnly: true }),
      listReservations({ status: "accepted" }),
      listAdminVehicles(),
      safeSiteVisitStats
    ]);

  const visibleThisMonthCount = acceptedReservations.filter((reservation) =>
    reservationTouchesMonth(reservation, currentMonth)
  ).length;
  const topVehicles = buildTopVehiclesChart(allAcceptedReservations);
  const reservationsByMonth = buildReservationsByMonthChart(allAcceptedReservations);
  const reservationsByWeekday = buildReservationsByWeekdayChart(allAcceptedReservations);
  const fleetStatus = buildFleetStatusChart(vehicles);

  return {
    summary: {
      pendingCount: pendingReservations.length,
      acceptedCount: acceptedReservations.length,
      visibleThisMonthCount,
      totalVisits: siteVisits.totalVisits,
      totalVisitors: siteVisits.totalVisitors,
      monthVisits: siteVisits.monthVisits,
      monthVisitors: siteVisits.monthVisitors,
      vehicleCount: vehicles.length
    },
    insights: {
      topVehicle: buildTopVehicleInsight(topVehicles),
      busiestMonth: buildBusiestMonthInsight(allAcceptedReservations),
      busiestWeekday: buildBusiestWeekdayInsight(reservationsByWeekday)
    },
    charts: {
      reservationsByMonth,
      topVehicles,
      reservationsByWeekday,
      fleetStatus,
      siteVisitsByDay: siteVisits.recentVisits
    }
  };
}

module.exports = {
  getAdminDashboardStats
};
