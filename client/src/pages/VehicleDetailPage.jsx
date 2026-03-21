import { useEffect, useState } from "react";
import {
  deleteVehicle,
  getVehicleById,
  markVehicleAsAvailable,
  markVehicleAsMaintenance
} from "../services/vehicleService";
import VehicleVideo from "../components/VehicleVideo";
import {
  formatVehicleName,
  formatVehiclePrice
} from "../utils/vehicleFormatters";

function DetailRow({ label, value }) {
  return (
    <div className="vehicle-info-list__row">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function VehicleDetailPage({
  content,
  currentAdmin,
  vehicleId,
  onBackClick,
  onDeleted,
  onEditClick
}) {
  const [vehicle, setVehicle] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);

  useEffect(() => {
    let isActive = true;

    const loadVehicle = async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const nextVehicle = await getVehicleById(vehicleId, {
          adminView: Boolean(currentAdmin)
        });

        if (!isActive) {
          return;
        }

        setVehicle(nextVehicle);
      } catch (error) {
        if (!isActive) {
          return;
        }

        setVehicle(null);
        setErrorMessage(error.message || content.detailErrorMessage);
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    loadVehicle();

    return () => {
      isActive = false;
    };
  }, [content.detailErrorMessage, currentAdmin, vehicleId]);

  const handleDelete = async () => {
    if (!window.confirm(content.deleteConfirmMessage)) {
      return;
    }

    setIsActionLoading(true);

    try {
      await deleteVehicle(vehicleId);
      onDeleted();
    } catch (error) {
      setErrorMessage(error.message || content.deleteErrorMessage);
      setIsActionLoading(false);
    }
  };

  const handleMaintenance = async () => {
    const isMaintenance = vehicle?.availabilityStatus === "maintenance";

    if (!isMaintenance && !window.confirm(content.maintenanceConfirmMessage)) {
      return;
    }

    setIsActionLoading(true);

    try {
      const response = isMaintenance
        ? await markVehicleAsAvailable(vehicleId)
        : await markVehicleAsMaintenance(vehicleId);
      setVehicle(response.vehicle);
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(
        error.message ||
          (isMaintenance
            ? content.availableErrorMessage
            : content.maintenanceErrorMessage)
      );
    } finally {
      setIsActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <main className="vehicle-detail-page">
        <section className="vehicles-empty">
          <p className="status-message">Chargement du vehicule...</p>
        </section>
      </main>
    );
  }

  if (!vehicle) {
    return (
      <main className="vehicle-detail-page">
        <section className="vehicles-empty">
          <div className="vehicles-empty__card">
            <h1>{content.notFoundMessage}</h1>
            <p>{errorMessage || content.detailErrorMessage}</p>
            <button
              type="button"
              className="vehicle-detail__back"
              onClick={onBackClick}
            >
              {content.backToListLabel}
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="vehicle-detail-page">
      <section className="vehicle-detail-page__hero">
        <button
          type="button"
          className="vehicle-detail__back"
          onClick={onBackClick}
        >
          {content.backToListLabel}
        </button>
      </section>

      {errorMessage ? (
        <section className="vehicle-detail-page__banner">
          <p className="login-form__message login-form__message--error">
            {errorMessage}
          </p>
        </section>
      ) : null}

      <section className="vehicle-detail">
        <div className="vehicle-detail__media">
          <h2 className="vehicle-detail__media-title">{content.photosSectionTitle}</h2>

          <img
            className="vehicle-detail__primary-image"
            src={vehicle.photoUrls[0]}
            alt={formatVehicleName(vehicle)}
          />

          {vehicle.photoUrls.length > 1 ? (
            <>
              <div className="vehicle-detail__gallery">
                {vehicle.photoUrls.slice(1).map((photoUrl, index) => (
                  <img
                    key={`${photoUrl}-${index}`}
                    src={photoUrl}
                    alt={`${formatVehicleName(vehicle)} ${index + 2}`}
                    loading="lazy"
                    decoding="async"
                  />
                ))}
              </div>
            </>
          ) : null}

          {vehicle.videoUrl ? (
            <>
              <h2 className="vehicle-detail__media-title">
                {content.videoSectionTitle}
              </h2>

              <VehicleVideo
                src={vehicle.videoUrl}
                title={`${content.videoSectionTitle} ${formatVehicleName(vehicle)}`}
              />
            </>
          ) : null}
        </div>

        <div className="vehicle-detail__summary">
          <p className="hero-card__eyebrow">{content.eyebrow}</p>
          <h1>{formatVehicleName(vehicle)}</h1>
          <p className="vehicle-detail__subtitle">
            {vehicle.version} | {vehicle.model}
          </p>

          {vehicle.availabilityStatus === "maintenance" ? (
            <div className="vehicle-detail__maintenance">
              <span className="vehicle-card__badge">{content.maintenanceBadge}</span>
              <p>{content.maintenanceDescription}</p>
            </div>
          ) : null}

          <div className="vehicle-price-grid">
            <article className="vehicle-price-card">
              <span>{content.dailyPriceLabel}</span>
              <strong>{formatVehiclePrice(vehicle.dailyPrice)}</strong>
            </article>
            <article className="vehicle-price-card">
              <span>{content.weeklyPriceLabel}</span>
              <strong>{formatVehiclePrice(vehicle.weeklyPrice)}</strong>
            </article>
            <article className="vehicle-price-card">
              <span>{content.monthlyPriceLabel}</span>
              <strong>{formatVehiclePrice(vehicle.monthlyPrice)}</strong>
            </article>
          </div>

          {currentAdmin ? (
            <div className="vehicle-detail__actions">
              <button
                type="button"
                className="login-form__submit"
                onClick={onEditClick}
              >
                {content.adminEditLabel}
              </button>
              <button
                type="button"
                className="vehicle-detail__secondary-action"
                disabled={isActionLoading}
                onClick={handleMaintenance}
              >
                {vehicle.availabilityStatus === "maintenance"
                  ? content.adminMaintenanceDoneLabel
                  : content.adminMaintenanceLabel}
              </button>
              <button
                type="button"
                className="vehicle-detail__danger-action"
                disabled={isActionLoading}
                onClick={handleDelete}
              >
                {content.adminDeleteLabel}
              </button>
            </div>
          ) : null}
        </div>
      </section>

      <section className="vehicle-detail__sections">
        <article className="vehicle-section-card">
          <h2>{content.informationSectionTitle}</h2>
          <dl className="vehicle-info-list">
            <DetailRow label={content.brandLabel} value={vehicle.brand} />
            <DetailRow label={content.modelLabel} value={vehicle.model} />
            <DetailRow label={content.versionLabel} value={vehicle.version} />
            <DetailRow label={content.fuelTypeLabel} value={vehicle.fuelType} />
            <DetailRow
              label={content.transmissionLabel}
              value={vehicle.transmission}
            />
            <DetailRow label={content.seatsLabel} value={vehicle.seats} />
            <DetailRow
              label={content.convertibleLabel}
              value={vehicle.isConvertible ? content.yesLabel : content.noLabel}
            />
            <DetailRow
              label={content.horsepowerLabel}
              value={vehicle.horsepower}
            />
            <DetailRow
              label={content.securityDepositLabel}
              value={formatVehiclePrice(vehicle.securityDeposit)}
            />
            <DetailRow
              label={content.includedKmPerDayLabel}
              value={vehicle.includedKmPerDay}
            />
            <DetailRow
              label={content.extraKmPriceLabel}
              value={formatVehiclePrice(vehicle.extraKmPrice)}
            />
            <DetailRow
              label={content.adminAvailabilityLabel}
              value={
                vehicle.availabilityStatus === "maintenance"
                  ? content.availabilityMaintenanceLabel
                  : content.availabilityAvailableLabel
              }
            />
          </dl>
        </article>
      </section>

      <section className="vehicle-detail__sections">
        <article className="vehicle-section-card">
          <h2>{content.globalPricingTitle}</h2>
          <p>{content.globalPricingDescription}</p>
        </article>

        <article className="vehicle-section-card">
          <h2>{content.globalConditionsTitle}</h2>
          <p>{content.globalConditionsDescription}</p>
        </article>
      </section>
    </main>
  );
}

export default VehicleDetailPage;
