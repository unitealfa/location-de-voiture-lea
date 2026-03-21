import { useEffect, useState } from "react";
import { listAdminReservations } from "../services/reservationService";
import { formatReservationDateTime } from "../utils/reservationFormatters";

function CommencerReservationsPage({ content, onReservationClick }) {
  const [reservations, setReservations] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    const loadReservations = async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const nextReservations = await listAdminReservations({
          scope: "pending"
        });

        if (!isActive) {
          return;
        }

        setReservations(nextReservations);
      } catch (error) {
        if (!isActive) {
          return;
        }

        setErrorMessage(error.message || content.detailErrorMessage);
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    loadReservations();

    return () => {
      isActive = false;
    };
  }, [content.detailErrorMessage]);

  return (
    <main className="reservations-page">
      <section className="reservations-page__hero">
        <p className="hero-card__eyebrow">{content.eyebrow}</p>
        <h1>{content.title}</h1>
        <p className="hero-card__text">{content.description}</p>
      </section>

      {isLoading ? (
        <section className="vehicles-empty">
          <p className="status-message">Chargement des reservations...</p>
        </section>
      ) : errorMessage ? (
        <section className="vehicles-empty">
          <p className="login-form__message login-form__message--error">
            {errorMessage}
          </p>
        </section>
      ) : reservations.length === 0 ? (
        <section className="vehicles-empty">
          <div className="vehicles-empty__card">
            <h2>{content.emptyTitle}</h2>
            <p>{content.emptyDescription}</p>
          </div>
        </section>
      ) : (
        <section className="reservation-grid">
          {reservations.map((reservation) => (
            <button
              key={reservation.id}
              type="button"
              className="reservation-card"
              onClick={() => onReservationClick(reservation.id)}
            >
              <img
                src={reservation.vehiclePhotoUrl}
                alt={reservation.vehicleName}
                loading="lazy"
                decoding="async"
              />
              <div className="reservation-card__body">
                <h2>{reservation.vehicleName}</h2>
                <p>
                  {reservation.firstName} {reservation.lastName}
                </p>
                <p>{reservation.durationLabel}</p>
                <p>{formatReservationDateTime(reservation.pickupDatetime)}</p>
              </div>
            </button>
          ))}
        </section>
      )}
    </main>
  );
}

export default CommencerReservationsPage;
