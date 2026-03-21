import { useEffect, useMemo, useRef, useState } from "react";
import {
  createVehicleReservation,
  getVehicleReservationAvailability
} from "../services/reservationService";
import { formatVehicleName } from "../utils/vehicleFormatters";

const SLOT_INTERVAL_MINUTES = 30;
const MIN_RESERVATION_DURATION_MINUTES = 30;
const WEEKDAY_FORMATTER = new Intl.DateTimeFormat("fr-FR", {
  weekday: "short"
});
const MONTH_FORMATTER = new Intl.DateTimeFormat("fr-FR", {
  month: "long",
  year: "numeric"
});
const TIME_OPTIONS = Array.from({ length: 48 }, (_, index) => {
  const totalMinutes = index * SLOT_INTERVAL_MINUTES;
  const hours = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
  const minutes = String(totalMinutes % 60).padStart(2, "0");

  return {
    value: `${hours}:${minutes}`,
    label: `${hours}:${minutes}`
  };
});

function getInitialFormValues() {
  return {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    comment: "",
    pickupLocationType: "bureau",
    returnLocationType: "bureau",
    privacyPolicyAccepted: false
  };
}

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

function parseServerDateTime(value) {
  return new Date(String(value).replace(" ", "T"));
}

function formatDateValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function splitDateTimeValue(value) {
  if (!value) {
    return {
      date: "",
      time: ""
    };
  }

  const [datePart, timePart = ""] = String(value).split("T");

  return {
    date: datePart,
    time: timePart.slice(0, 5)
  };
}

function combineDateAndTime(dateValue, timeValue) {
  return dateValue && timeValue ? `${dateValue}T${timeValue}` : "";
}

function createDateTime(dateValue, timeValue) {
  if (!dateValue || !timeValue) {
    return null;
  }

  return new Date(`${dateValue}T${timeValue}:00`);
}

function isSameMonth(date, monthDate) {
  return (
    date.getFullYear() === monthDate.getFullYear() &&
    date.getMonth() === monthDate.getMonth()
  );
}

function ReservationCalendar({
  content,
  monthDate,
  onMonthChange,
  selectedDateValue,
  isDayAvailable,
  onDateSelect,
  isDisabled
}) {
  const calendarDays = useMemo(() => createCalendarDays(monthDate), [monthDate]);
  const weekdayLabels = useMemo(
    () => calendarDays.slice(0, 7).map((day) => WEEKDAY_FORMATTER.format(day)),
    [calendarDays]
  );

  return (
    <div className={`reservation-calendar${isDisabled ? " reservation-calendar--disabled" : ""}`}>
      <div className="reservation-calendar__toolbar">
        <button
          type="button"
          className="reservation-calendar__nav"
          onClick={() =>
            onMonthChange(
              new Date(monthDate.getFullYear(), monthDate.getMonth() - 1, 1)
            )
          }
          disabled={isDisabled}
        >
          {content.reservationMonthPreviousLabel}
        </button>

        <strong>{MONTH_FORMATTER.format(monthDate)}</strong>

        <button
          type="button"
          className="reservation-calendar__nav"
          onClick={() =>
            onMonthChange(
              new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1)
            )
          }
          disabled={isDisabled}
        >
          {content.reservationMonthNextLabel}
        </button>
      </div>

      <div className="reservation-calendar__grid">
        {weekdayLabels.map((label) => (
          <span key={label} className="reservation-calendar__weekday">
            {label}
          </span>
        ))}

        {calendarDays.map((day) => {
          const dateValue = formatDateValue(day);
          const isAvailable = !isDisabled && isDayAvailable(day);
          const isSelected = selectedDateValue === dateValue;

          return (
            <button
              key={dateValue}
              type="button"
              className={`reservation-calendar__day${
                isSameMonth(day, monthDate) ? "" : " reservation-calendar__day--muted"
              }${isSelected ? " reservation-calendar__day--selected" : ""}${
                !isAvailable ? " reservation-calendar__day--unavailable" : ""
              }`}
              onClick={() => onDateSelect(dateValue)}
              disabled={!isAvailable}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function VehicleReservationForm({ content, vehicle }) {
  const sectionRef = useRef(null);
  const currentDateRef = useRef(new Date());
  const [formValues, setFormValues] = useState(getInitialFormValues);
  const [drivingLicensePhoto, setDrivingLicensePhoto] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availabilityErrorMessage, setAvailabilityErrorMessage] = useState("");
  const [isAvailabilityLoading, setIsAvailabilityLoading] = useState(true);
  const [reservedSlots, setReservedSlots] = useState([]);
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [returnTime, setReturnTime] = useState("");
  const [pickupMonthDate, setPickupMonthDate] = useState(() =>
    createMonthReference(new Date())
  );
  const [returnMonthDate, setReturnMonthDate] = useState(() =>
    createMonthReference(new Date())
  );

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  useEffect(() => {
    let isActive = true;

    const loadAvailability = async () => {
      setIsAvailabilityLoading(true);
      setAvailabilityErrorMessage("");

      try {
        const reservations = await getVehicleReservationAvailability(vehicle.id);

        if (!isActive) {
          return;
        }

        setReservedSlots(reservations);
      } catch (error) {
        if (!isActive) {
          return;
        }

        setReservedSlots([]);
        setAvailabilityErrorMessage(
          error.message || "Impossible de charger les disponibilites."
        );
      } finally {
        if (isActive) {
          setIsAvailabilityLoading(false);
        }
      }
    };

    loadAvailability();
    setPickupDate("");
    setPickupTime("");
    setReturnDate("");
    setReturnTime("");
    setPickupMonthDate(createMonthReference(new Date()));
    setReturnMonthDate(createMonthReference(new Date()));

    return () => {
      isActive = false;
    };
  }, [vehicle.id]);

  const whatsappUrl = useMemo(() => {
    const message = encodeURIComponent(
      `Bonjour, je souhaite reserver ${formatVehicleName(vehicle)}.`
    );

    return `https://wa.me/${content.whatsappInternationalNumber}?text=${message}`;
  }, [content.whatsappInternationalNumber, vehicle]);

  const reservationRanges = useMemo(
    () =>
      reservedSlots
        .map((reservation) => ({
          start: parseServerDateTime(reservation.pickupDatetime),
          end: parseServerDateTime(reservation.returnDatetime)
        }))
        .sort((left, right) => left.start.getTime() - right.start.getTime()),
    [reservedSlots]
  );

  const pickupDateTime = useMemo(
    () => createDateTime(pickupDate, pickupTime),
    [pickupDate, pickupTime]
  );
  const returnDateTime = useMemo(
    () => createDateTime(returnDate, returnTime),
    [returnDate, returnTime]
  );

  const updateField = (event) => {
    const { name, value, type, checked } = event.target;

    setFormValues((currentValues) => ({
      ...currentValues,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleDrivingLicensePhoto = (event) => {
    const nextFile = event.target.files?.[0] || null;
    setDrivingLicensePhoto(nextFile);
    setSuccessMessage("");

    if (!nextFile) {
      setPreviewUrl("");
      return;
    }

    const objectUrl = URL.createObjectURL(nextFile);
    setPreviewUrl((currentUrl) => {
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }

      return objectUrl;
    });
  };

  const scrollToForm = () => {
    sectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  };

  const isPickupSlotAvailable = (candidateDateTime) => {
    if (!candidateDateTime) {
      return false;
    }

    if (candidateDateTime.getTime() < currentDateRef.current.getTime()) {
      return false;
    }

    const isInsideReservedPeriod = reservationRanges.some(
      (range) =>
        candidateDateTime.getTime() >= range.start.getTime() &&
        candidateDateTime.getTime() < range.end.getTime()
    );

    if (isInsideReservedPeriod) {
      return false;
    }

    const nextReservedRange = reservationRanges.find(
      (range) => range.start.getTime() > candidateDateTime.getTime()
    );

    if (!nextReservedRange) {
      return true;
    }

    return (
      nextReservedRange.start.getTime() - candidateDateTime.getTime() >=
      MIN_RESERVATION_DURATION_MINUTES * 60 * 1000
    );
  };

  const isReturnSlotAvailable = (candidateDateTime, selectedPickupDateTime) => {
    if (!candidateDateTime || !selectedPickupDateTime) {
      return false;
    }

    if (candidateDateTime.getTime() <= selectedPickupDateTime.getTime()) {
      return false;
    }

    return !reservationRanges.some(
      (range) =>
        range.start.getTime() < candidateDateTime.getTime() &&
        range.end.getTime() > selectedPickupDateTime.getTime()
    );
  };

  const hasAvailablePickupSlotForDay = (day) =>
    TIME_OPTIONS.some((option) =>
      isPickupSlotAvailable(createDateTime(formatDateValue(day), option.value))
    );

  const hasAvailableReturnSlotForDay = (day) =>
    TIME_OPTIONS.some((option) =>
      isReturnSlotAvailable(
        createDateTime(formatDateValue(day), option.value),
        pickupDateTime
      )
    );

  useEffect(() => {
    if (pickupDateTime && !isPickupSlotAvailable(pickupDateTime)) {
      setPickupTime("");
    }
  }, [pickupDateTime, reservationRanges]);

  useEffect(() => {
    if (!pickupDateTime) {
      if (returnDate || returnTime) {
        setReturnDate("");
        setReturnTime("");
      }
      return;
    }

    if (returnDate && !hasAvailableReturnSlotForDay(new Date(`${returnDate}T00:00:00`))) {
      setReturnDate("");
      setReturnTime("");
      return;
    }

    if (returnDateTime && !isReturnSlotAvailable(returnDateTime, pickupDateTime)) {
      setReturnTime("");
    }
  }, [pickupDateTime, reservationRanges, returnDate, returnDateTime, returnTime]);

  useEffect(() => {
    if (!pickupDate) {
      return;
    }

    const nextMonth = createMonthReference(new Date(`${pickupDate}T00:00:00`));

    if (returnMonthDate.getTime() < nextMonth.getTime()) {
      setReturnMonthDate(nextMonth);
    }
  }, [pickupDate, returnMonthDate]);

  const handlePickupDateSelect = (dateValue) => {
    setPickupDate(dateValue);
    setSuccessMessage("");
  };

  const handleReturnDateSelect = (dateValue) => {
    if (!pickupDateTime) {
      return;
    }

    setReturnDate(dateValue);
    setSuccessMessage("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsSubmitting(true);

    try {
      const pickupDatetime = combineDateAndTime(pickupDate, pickupTime);
      const returnDatetime = combineDateAndTime(returnDate, returnTime);

      if (!pickupDatetime || !returnDatetime) {
        throw new Error("Selectionnez une date et une heure disponibles.");
      }

      await createVehicleReservation(vehicle.id, {
        ...formValues,
        pickupDatetime,
        returnDatetime,
        drivingLicensePhoto
      });

      setFormValues(getInitialFormValues());
      setDrivingLicensePhoto(null);
      setPickupDate("");
      setPickupTime("");
      setReturnDate("");
      setReturnTime("");
      setPreviewUrl((currentUrl) => {
        if (currentUrl) {
          URL.revokeObjectURL(currentUrl);
        }

        return "";
      });
      setSuccessMessage(content.reservationSuccessMessage);
    } catch (error) {
      setErrorMessage(error.message || content.reservationErrorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="vehicle-reservation-actions">
        <button
          type="button"
          className="login-form__submit"
          onClick={scrollToForm}
        >
          {content.reserveFormLabel}
        </button>

        <a
          className="vehicle-detail__secondary-action vehicle-detail__secondary-action--link"
          href={whatsappUrl}
          target="_blank"
          rel="noreferrer"
        >
          {content.reserveWhatsappLabel}
        </a>
      </div>

      <section className="reservation-form-section" ref={sectionRef}>
        <div className="reservation-form-section__hero">
          <p className="hero-card__eyebrow">{content.reservationSectionEyebrow}</p>
          <h2>{content.reservationSectionTitle}</h2>
          <p className="hero-card__text">{content.reservationSectionDescription}</p>
        </div>

        <div className="reservation-availability">
          <div className="reservation-availability__header">
            <div>
              <h3>{content.reservationAvailabilityTitle}</h3>
              <p>{content.reservationAvailabilityDescription}</p>
            </div>

            <div className="reservation-availability__legend">
              <span className="reservation-availability__legend-item">
                <i className="reservation-availability__dot reservation-availability__dot--available" />
                {content.reservationAvailableLegendLabel}
              </span>
              <span className="reservation-availability__legend-item">
                <i className="reservation-availability__dot reservation-availability__dot--selected" />
                {content.reservationSelectedLegendLabel}
              </span>
              <span className="reservation-availability__legend-item">
                <i className="reservation-availability__dot reservation-availability__dot--unavailable" />
                {content.reservationUnavailableLegendLabel}
              </span>
            </div>
          </div>

          {isAvailabilityLoading ? (
            <p className="status-message">
              {content.reservationAvailabilityLoadingLabel}
            </p>
          ) : availabilityErrorMessage ? (
            <p className="login-form__message login-form__message--error">
              {availabilityErrorMessage}
            </p>
          ) : (
            <div className="reservation-availability__grid">
              <div className="reservation-availability__panel">
                <label className="login-form__field">
                  <span>{content.reservationPickupDateLabel}</span>
                </label>

                <ReservationCalendar
                  content={content}
                  monthDate={pickupMonthDate}
                  onMonthChange={setPickupMonthDate}
                  selectedDateValue={pickupDate}
                  onDateSelect={handlePickupDateSelect}
                  isDayAvailable={hasAvailablePickupSlotForDay}
                  isDisabled={false}
                />

                <label className="login-form__field">
                  <span>{content.reservationPickupTimeLabel}</span>
                  <select
                    value={pickupTime}
                    onChange={(event) => setPickupTime(event.target.value)}
                    disabled={!pickupDate || isAvailabilityLoading}
                  >
                    <option value="">Selectionner</option>
                    {TIME_OPTIONS.map((option) => {
                      const candidateDateTime = createDateTime(
                        pickupDate,
                        option.value
                      );

                      return (
                        <option
                          key={`pickup-${option.value}`}
                          value={option.value}
                          disabled={!isPickupSlotAvailable(candidateDateTime)}
                        >
                          {option.label}
                        </option>
                      );
                    })}
                  </select>
                </label>
              </div>

              <div className="reservation-availability__panel">
                <label className="login-form__field">
                  <span>{content.reservationReturnDateLabel}</span>
                </label>

                {!pickupDateTime ? (
                  <p className="reservation-availability__helper">
                    {content.reservationSelectPickupFirstLabel}
                  </p>
                ) : null}

                <ReservationCalendar
                  content={content}
                  monthDate={returnMonthDate}
                  onMonthChange={setReturnMonthDate}
                  selectedDateValue={returnDate}
                  onDateSelect={handleReturnDateSelect}
                  isDayAvailable={hasAvailableReturnSlotForDay}
                  isDisabled={!pickupDateTime}
                />

                <label className="login-form__field">
                  <span>{content.reservationReturnTimeLabel}</span>
                  <select
                    value={returnTime}
                    onChange={(event) => setReturnTime(event.target.value)}
                    disabled={!returnDate || !pickupDateTime || isAvailabilityLoading}
                  >
                    <option value="">Selectionner</option>
                    {TIME_OPTIONS.map((option) => {
                      const candidateDateTime = createDateTime(
                        returnDate,
                        option.value
                      );

                      return (
                        <option
                          key={`return-${option.value}`}
                          value={option.value}
                          disabled={
                            !isReturnSlotAvailable(candidateDateTime, pickupDateTime)
                          }
                        >
                          {option.label}
                        </option>
                      );
                    })}
                  </select>
                </label>
              </div>
            </div>
          )}
        </div>

        <form className="reservation-form" onSubmit={handleSubmit}>
          <div className="reservation-form__grid">
            <label className="login-form__field">
              <span>{content.reservationLastNameLabel}</span>
              <input
                type="text"
                name="lastName"
                value={formValues.lastName}
                onChange={updateField}
                required
              />
            </label>

            <label className="login-form__field">
              <span>{content.reservationFirstNameLabel}</span>
              <input
                type="text"
                name="firstName"
                value={formValues.firstName}
                onChange={updateField}
                required
              />
            </label>

            <label className="login-form__field">
              <span>{content.reservationEmailLabel}</span>
              <input
                type="email"
                name="email"
                value={formValues.email}
                onChange={updateField}
              />
            </label>

            <label className="login-form__field">
              <span>{content.reservationPhoneLabel}</span>
              <input
                type="tel"
                name="phone"
                value={formValues.phone}
                onChange={updateField}
                required
              />
            </label>

            <label className="login-form__field">
              <span>{content.reservationPickupLocationLabel}</span>
              <select
                name="pickupLocationType"
                value={formValues.pickupLocationType}
                onChange={updateField}
              >
                {content.reservationPickupLocationOptions.map((option) => (
                  <option key={`pickup-${option.value}`} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="login-form__field">
              <span>{content.reservationReturnLocationLabel}</span>
              <select
                name="returnLocationType"
                value={formValues.returnLocationType}
                onChange={updateField}
              >
                {content.reservationPickupLocationOptions.map((option) => (
                  <option key={`return-${option.value}`} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="login-form__field">
            <span>{content.reservationDrivingLicenseLabel}</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleDrivingLicensePhoto}
              required
            />
          </label>

          {previewUrl ? (
            <div className="reservation-form__license-preview">
              <img src={previewUrl} alt={content.reservationDrivingLicenseLabel} />
            </div>
          ) : null}

          <label className="login-form__field">
            <span>{content.reservationCommentLabel}</span>
            <textarea
              name="comment"
              value={formValues.comment}
              onChange={updateField}
              rows="4"
              required
            />
          </label>

          <label className="reservation-form__checkbox">
            <input
              type="checkbox"
              name="privacyPolicyAccepted"
              checked={formValues.privacyPolicyAccepted}
              onChange={updateField}
              required
            />
            <span>{content.reservationPrivacyLabel}</span>
          </label>

          {errorMessage ? (
            <p className="login-form__message login-form__message--error">
              {errorMessage}
            </p>
          ) : null}

          {successMessage ? (
            <p className="login-form__message login-form__message--success">
              {successMessage}
            </p>
          ) : null}

          <button
            type="submit"
            className="login-form__submit"
            disabled={isSubmitting || isAvailabilityLoading}
          >
            {content.reservationSubmitLabel}
          </button>
        </form>
      </section>
    </>
  );
}

export default VehicleReservationForm;
