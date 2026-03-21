import { useEffect, useState } from "react";
import {
  acceptAdminReservation,
  deleteAdminReservation,
  getAdminReservationById,
  rejectAdminReservation
} from "../services/reservationService";
import {
  formatReservationDateTime,
  getReservationLocationLabel
} from "../utils/reservationFormatters";

function ReservationDetailPage({
  content,
  vehicleContent,
  reservationId,
  detailScope,
  onAccepted,
  onRejected,
  onEditClick,
  onDeleted,
  onBackClick
}) {
  const [reservation, setReservation] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);

  useEffect(() => {
    let isActive = true;

    const loadReservation = async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const nextReservation = await getAdminReservationById(reservationId);

        if (!isActive) {
          return;
        }

        setReservation(nextReservation);
      } catch (error) {
        if (!isActive) {
          return;
        }

        setReservation(null);
        setErrorMessage(error.message || content.detailErrorMessage);
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    loadReservation();

    return () => {
      isActive = false;
    };
  }, [content.detailErrorMessage, reservationId]);

  const handleAccept = async () => {
    setIsActionLoading(true);
    setErrorMessage("");

    try {
      const updatedReservation = await acceptAdminReservation(reservationId);
      setReservation(updatedReservation);
      onAccepted();
    } catch (error) {
      setErrorMessage(error.message || content.acceptErrorMessage);
      setIsActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!window.confirm(content.rejectConfirmMessage)) {
      return;
    }

    setIsActionLoading(true);
    setErrorMessage("");

    try {
      await rejectAdminReservation(reservationId);
      onRejected();
    } catch (error) {
      setErrorMessage(error.message || content.rejectErrorMessage);
      setIsActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(content.deleteConfirmMessage)) {
      return;
    }

    setIsActionLoading(true);
    setErrorMessage("");

    try {
      await deleteAdminReservation(reservationId);
      onDeleted();
    } catch (error) {
      setErrorMessage(error.message || content.formDeleteErrorMessage);
      setIsActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <main className="reservation-detail-page">
        <section className="vehicles-empty">
          <p className="status-message">Chargement de la reservation...</p>
        </section>
      </main>
    );
  }

  if (!reservation) {
    return (
      <main className="reservation-detail-page">
        <section className="vehicles-empty">
          <div className="vehicles-empty__card">
            <h1>{content.detailTitle}</h1>
            <p>{errorMessage || content.detailErrorMessage}</p>
            <button
              type="button"
              className="vehicle-detail__back"
              onClick={onBackClick}
            >
              {content.backLabel}
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="reservation-detail-page">
      <section className="reservation-detail-page__hero">
        <button
          type="button"
          className="vehicle-detail__back"
          onClick={onBackClick}
        >
          {content.backLabel}
        </button>

        <div>
          <p className="hero-card__eyebrow">{content.eyebrow}</p>
          <h1>{content.detailTitle}</h1>
          <p className="hero-card__text">{content.detailDescription}</p>
        </div>
      </section>

      {errorMessage ? (
        <section className="vehicle-detail-page__banner">
          <p className="login-form__message login-form__message--error">
            {errorMessage}
          </p>
        </section>
      ) : null}

      <section className="reservation-detail">
        <div className="reservation-detail__media">
          <img
            src={reservation.vehiclePhotoUrl}
            alt={reservation.vehicleName}
          />

          <div className="vehicle-section-card">
            <h2>{content.licenseLabel}</h2>
            <img
              src={reservation.drivingLicensePhotoUrl}
              alt={content.licenseLabel}
            />
          </div>
        </div>

        <div className="reservation-detail__info">
          <article className="vehicle-section-card">
            <h2>{content.vehicleLabel}</h2>
            <dl className="vehicle-info-list">
              <div className="vehicle-info-list__row">
                <dt>{content.statusLabel}</dt>
                <dd>
                  <span className={`reservation-status reservation-status--${reservation.status}`}>
                    {reservation.isAccepted
                      ? content.statusAcceptedLabel
                      : content.statusPendingLabel}
                  </span>
                </dd>
              </div>
              <div className="vehicle-info-list__row">
                <dt>{content.vehicleLabel}</dt>
                <dd>{reservation.vehicleName}</dd>
              </div>
              <div className="vehicle-info-list__row">
                <dt>{content.durationLabel}</dt>
                <dd>{reservation.durationLabel}</dd>
              </div>
            </dl>
          </article>

          <article className="vehicle-section-card">
            <h2>{content.customerLabel}</h2>
            <dl className="vehicle-info-list">
              <div className="vehicle-info-list__row">
                <dt>{vehicleContent.reservationLastNameLabel}</dt>
                <dd>{reservation.lastName}</dd>
              </div>
              <div className="vehicle-info-list__row">
                <dt>{vehicleContent.reservationFirstNameLabel}</dt>
                <dd>{reservation.firstName}</dd>
              </div>
              <div className="vehicle-info-list__row">
                <dt>{content.phoneLabel}</dt>
                <dd>{reservation.phone}</dd>
              </div>
              <div className="vehicle-info-list__row">
                <dt>{content.emailLabel}</dt>
                <dd>{reservation.email || "-"}</dd>
              </div>
              <div className="vehicle-info-list__row">
                <dt>{content.commentLabel}</dt>
                <dd>{reservation.comment}</dd>
              </div>
              <div className="vehicle-info-list__row">
                <dt>{content.pickupLabel}</dt>
                <dd>
                  {getReservationLocationLabel(
                    vehicleContent.reservationPickupLocationOptions,
                    reservation.pickupLocationType
                  )}{" "}
                  | {formatReservationDateTime(reservation.pickupDatetime)}
                </dd>
              </div>
              <div className="vehicle-info-list__row">
                <dt>{content.returnLabel}</dt>
                <dd>
                  {getReservationLocationLabel(
                    vehicleContent.reservationPickupLocationOptions,
                    reservation.returnLocationType
                  )}{" "}
                  | {formatReservationDateTime(reservation.returnDatetime)}
                </dd>
              </div>
              <div className="vehicle-info-list__row">
                <dt>{content.createdAtLabel}</dt>
                <dd>{formatReservationDateTime(reservation.createdAt)}</dd>
              </div>
            </dl>
          </article>

          {reservation.isPending ? (
            <div className="reservation-detail__actions">
              <button
                type="button"
                className="login-form__submit"
                disabled={isActionLoading}
                onClick={handleAccept}
              >
                {content.acceptLabel}
              </button>

              <button
                type="button"
                className="vehicle-detail__secondary-action"
                disabled={isActionLoading}
                onClick={onEditClick}
              >
                {content.editLabel}
              </button>

              <button
                type="button"
                className="vehicle-detail__danger-action"
                disabled={isActionLoading}
                onClick={handleReject}
              >
                {content.rejectLabel}
              </button>
            </div>
          ) : detailScope !== "clients" ? (
            <div className="reservation-detail__actions">
              <button
                type="button"
                className="login-form__submit"
                onClick={onAccepted}
              >
                {content.acceptedRedirectLabel}
              </button>
            </div>
          ) : (
            <div className="reservation-detail__actions">
              <button
                type="button"
                className="login-form__submit"
                disabled={isActionLoading}
                onClick={onEditClick}
              >
                {content.editLabel}
              </button>

              <button
                type="button"
                className="vehicle-detail__danger-action"
                disabled={isActionLoading}
                onClick={handleDelete}
              >
                {content.deleteLabel}
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

export default ReservationDetailPage;
