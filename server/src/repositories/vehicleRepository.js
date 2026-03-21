const { getPool } = require("../db/pool");

function parsePhotoUrls(value) {
  try {
    const parsedValue = JSON.parse(value);
    return Array.isArray(parsedValue) ? parsedValue : [];
  } catch (error) {
    return [];
  }
}

function mapVehicle(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    brand: row.brand,
    model: row.model,
    version: row.version,
    fuelType: row.fuel_type,
    transmission: row.transmission,
    seats: row.seats,
    isConvertible: Boolean(row.is_convertible),
    horsepower: row.horsepower,
    dailyPrice: Number(row.daily_price),
    weeklyPrice: Number(row.weekly_price),
    monthlyPrice: Number(row.monthly_price),
    securityDeposit: Number(row.security_deposit),
    includedKmPerDay: row.included_km_per_day,
    extraKmPrice: Number(row.extra_km_price),
    pricingDescription: row.pricing_description,
    rentalConditions: row.rental_conditions,
    videoUrl: row.video_url,
    photoUrls: parsePhotoUrls(row.photo_urls),
    availabilityStatus: row.availability_status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function listVehicles({ includeMaintenance }) {
  const pool = getPool();
  const [rows] = await pool.execute(
    `
      SELECT
        id,
        brand,
        model,
        version,
        fuel_type,
        transmission,
        seats,
        is_convertible,
        horsepower,
        daily_price,
        weekly_price,
        monthly_price,
        security_deposit,
        included_km_per_day,
        extra_km_price,
        pricing_description,
        rental_conditions,
        video_url,
        photo_urls,
        availability_status,
        created_at,
        updated_at
      FROM vehicles
      ${
        includeMaintenance
          ? ""
          : "WHERE availability_status IN ('available', 'reserved')"
      }
      ORDER BY updated_at DESC, id DESC
    `
  );

  return rows.map(mapVehicle);
}

async function findVehicleById(id) {
  const pool = getPool();
  const [rows] = await pool.execute(
    `
      SELECT
        id,
        brand,
        model,
        version,
        fuel_type,
        transmission,
        seats,
        is_convertible,
        horsepower,
        daily_price,
        weekly_price,
        monthly_price,
        security_deposit,
        included_km_per_day,
        extra_km_price,
        pricing_description,
        rental_conditions,
        video_url,
        photo_urls,
        availability_status,
        created_at,
        updated_at
      FROM vehicles
      WHERE id = ?
      LIMIT 1
    `,
    [id]
  );

  return mapVehicle(rows[0]);
}

async function createVehicle(vehicle) {
  const pool = getPool();
  const [result] = await pool.execute(
    `
      INSERT INTO vehicles (
        brand,
        model,
        version,
        fuel_type,
        transmission,
        seats,
        is_convertible,
        horsepower,
        daily_price,
        weekly_price,
        monthly_price,
        security_deposit,
        included_km_per_day,
        extra_km_price,
        pricing_description,
        rental_conditions,
        video_url,
        photo_urls,
        availability_status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      vehicle.brand,
      vehicle.model,
      vehicle.version,
      vehicle.fuelType,
      vehicle.transmission,
      vehicle.seats,
      vehicle.isConvertible ? 1 : 0,
      vehicle.horsepower,
      vehicle.dailyPrice,
      vehicle.weeklyPrice,
      vehicle.monthlyPrice,
      vehicle.securityDeposit,
      vehicle.includedKmPerDay,
      vehicle.extraKmPrice,
      vehicle.pricingDescription,
      vehicle.rentalConditions,
      vehicle.videoUrl,
      JSON.stringify(vehicle.photoUrls),
      vehicle.availabilityStatus
    ]
  );

  return findVehicleById(result.insertId);
}

async function updateVehicle(id, vehicle) {
  const pool = getPool();
  await pool.execute(
    `
      UPDATE vehicles
      SET
        brand = ?,
        model = ?,
        version = ?,
        fuel_type = ?,
        transmission = ?,
        seats = ?,
        is_convertible = ?,
        horsepower = ?,
        daily_price = ?,
        weekly_price = ?,
        monthly_price = ?,
        security_deposit = ?,
        included_km_per_day = ?,
        extra_km_price = ?,
        pricing_description = ?,
        rental_conditions = ?,
        video_url = ?,
        photo_urls = ?,
        availability_status = ?
      WHERE id = ?
    `,
    [
      vehicle.brand,
      vehicle.model,
      vehicle.version,
      vehicle.fuelType,
      vehicle.transmission,
      vehicle.seats,
      vehicle.isConvertible ? 1 : 0,
      vehicle.horsepower,
      vehicle.dailyPrice,
      vehicle.weeklyPrice,
      vehicle.monthlyPrice,
      vehicle.securityDeposit,
      vehicle.includedKmPerDay,
      vehicle.extraKmPrice,
      vehicle.pricingDescription,
      vehicle.rentalConditions,
      vehicle.videoUrl,
      JSON.stringify(vehicle.photoUrls),
      vehicle.availabilityStatus,
      id
    ]
  );

  return findVehicleById(id);
}

async function deleteVehicle(id) {
  const pool = getPool();
  await pool.execute(
    `
      DELETE FROM vehicles
      WHERE id = ?
    `,
    [id]
  );
}

async function updateVehicleAvailabilityStatus(id, availabilityStatus) {
  const pool = getPool();
  await pool.execute(
    `
      UPDATE vehicles
      SET availability_status = ?
      WHERE id = ?
    `,
    [availabilityStatus, id]
  );

  return findVehicleById(id);
}

module.exports = {
  createVehicle,
  deleteVehicle,
  findVehicleById,
  listVehicles,
  updateVehicle,
  updateVehicleAvailabilityStatus
};
