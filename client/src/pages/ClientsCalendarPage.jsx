import { useEffect, useMemo, useState } from "react";
import { listAdminReservations } from "../services/reservationService";
import { formatReservationDateTime } from "../utils/reservationFormatters";

const weekdayFormatter = new Intl.DateTimeFormat("fr-FR", {
  weekday: "short"
});
const monthFormatter = new Intl.DateTimeFormat("fr-FR", {
  month: "long",
  year: "numeric"
});

function createMonthReference(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function createCalendarDays(monthDate) {
  const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const startDate = new Date(firstDay);
  startDate.setDate(firstDay.getDate() - startOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);
    return date;
  });
}

function toDate(value) {
  return new Date(String(value).replace(" ", "T"));
}

function isSameMonth(day, monthDate) {
  return (
    day.getFullYear() === monthDate.getFullYear() &&
    day.getMonth() === monthDate.getMonth()
  );
}

function reservationTouchesDay(reservation, day) {
  const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, 0, 0, 0);
  const dayEnd = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1, 0, 0, 0, 0);
  const pickupDate = toDate(reservation.pickupDatetime);
  const returnDate = toDate(reservation.returnDatetime);

  return pickupDate < dayEnd && returnDate > dayStart;
}

function buildDayLabels(calendarDays) {
  return calendarDays.slice(0, 7).map((day) => weekdayFormatter.format(day));
}

function ClientsCalendarPage({ content, onCreateClick, onReservationClick }) {
  const [reservations, setReservations] = useState([]);
  const [monthDate, setMonthDate] = useState(() => createMonthReference(new Date()));
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    const loadReservations = async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const nextReservations = await listAdminReservations({
          scope: "accepted"
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

  const calendarDays = useMemo(() => createCalendarDays(monthDate), [monthDate]);
  const weekdayLabels = useMemo(() => buildDayLabels(calendarDays), [calendarDays]);
  const visibleReservations = useMemo(
    () =>
      reservations.filter((reservation) =>
        calendarDays.some((day) => reservationTouchesDay(reservation, day))
      ),
    [calendarDays, reservations]
  );

  return (
    <main className="clients-page">
      <section className="reservations-page__hero">
        <div>
          <p className="hero-card__eyebrow">{content.eyebrow}</p>
          <h1>{content.clientsTitle}</h1>
          <p className="hero-card__text">{content.clientsDescription}</p>
        </div>

        <button
          type="button"
          className="vehicles-page__create"
          onClick={onCreateClick}
        >
          {content.createLabel}
        </button>
      </section>

      {isLoading ? (
        <section className="vehicles-empty">
          <p className="status-message">Chargement des reservations acceptees...</p>
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
            <h2>{content.clientsEmptyTitle}</h2>
            <p>{content.clientsEmptyDescription}</p>
          </div>
        </section>
      ) : (
        <section className="clients-calendar">
          <div className="clients-calendar__toolbar">
            <button
              type="button"
              className="vehicle-detail__secondary-action"
              onClick={() =>
                setMonthDate(
                  (currentMonthDate) =>
                    new Date(
                      currentMonthDate.getFullYear(),
                      currentMonthDate.getMonth() - 1,
                      1
                    )
                )
              }
            >
              {content.clientsMonthPreviousLabel}
            </button>

            <h2>{monthFormatter.format(monthDate)}</h2>

            <button
              type="button"
              className="vehicle-detail__secondary-action"
              onClick={() =>
                setMonthDate(
                  (currentMonthDate) =>
                    new Date(
                      currentMonthDate.getFullYear(),
                      currentMonthDate.getMonth() + 1,
                      1
                    )
                )
              }
            >
              {content.clientsMonthNextLabel}
            </button>
          </div>

          <div className="clients-calendar__grid" role="grid">
            {weekdayLabels.map((label) => (
              <div key={label} className="clients-calendar__weekday">
                {label}
              </div>
            ))}

            {calendarDays.map((day) => {
              const dayReservations = visibleReservations.filter((reservation) =>
                reservationTouchesDay(reservation, day)
              );

              return (
                <div
                  key={day.toISOString()}
                  className={`clients-calendar__day${isSameMonth(day, monthDate) ? "" : " clients-calendar__day--muted"}`}
                >
                  <span className="clients-calendar__day-number">
                    {day.getDate()}
                  </span>

                  <div className="clients-calendar__events">
                    {dayReservations.map((reservation) => (
                      <button
                        key={`${reservation.id}-${day.toISOString()}`}
                        type="button"
                        className="clients-calendar__event"
                        onClick={() => onReservationClick(reservation.id)}
                      >
                        <strong>
                          {reservation.firstName} {reservation.lastName}
                        </strong>
                        <span>{reservation.vehicleName}</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="clients-calendar__list">
            {visibleReservations.map((reservation) => (
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
                  <p>
                    {content.calendarPickupLabel}:{" "}
                    {formatReservationDateTime(reservation.pickupDatetime)}
                  </p>
                  <p>
                    {content.calendarReturnLabel}:{" "}
                    {formatReservationDateTime(reservation.returnDatetime)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

export default ClientsCalendarPage;
