import {
  getVehicleCardImageUrl,
  formatVehicleMeta,
  formatVehicleName,
  formatVehiclePrice
} from "../utils/vehicleFormatters";

function VehicleCard({ content, vehicle, onOpen, showAdminState }) {
  return (
    <article className="vehicle-card">
      <button
        type="button"
        className="vehicle-card__button"
        onClick={onOpen}
        aria-label={`${content.detailActionLabel}: ${formatVehicleName(vehicle)}`}
      >
        <div className="vehicle-card__media">
          <img
            src={getVehicleCardImageUrl(vehicle.photoUrls[0])}
            alt={formatVehicleName(vehicle)}
            loading="lazy"
            decoding="async"
            sizes="(max-width: 720px) 100vw, 320px"
          />

          {showAdminState && vehicle.availabilityStatus === "maintenance" ? (
            <span className="vehicle-card__badge">{content.maintenanceBadge}</span>
          ) : null}
        </div>

        <div className="vehicle-card__body">
          <h2>{vehicle.brand}</h2>
          <p className="vehicle-card__model">{vehicle.model}</p>
          <p className="vehicle-card__price">
            {formatVehiclePrice(vehicle.dailyPrice)} {content.pricePerDaySuffix}
          </p>
          <p className="vehicle-card__meta">
            {formatVehicleMeta(vehicle, content.seatsSuffix)}
          </p>
        </div>
      </button>
    </article>
  );
}

export default VehicleCard;
