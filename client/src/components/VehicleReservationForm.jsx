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
    fullName: "",
    email: "",
    phone: "",
    birthDate: "",
    comment: "",
    pickupLocationType: "bureau",
    returnLocationType: "bureau",
    privacyPolicyAccepted: false
  };
}

function splitFullName(fullName) {
  const normalized = String(fullName || "").trim().replace(/\s+/g, " ");

  if (!normalized) {
    return {
      firstName: "",
      lastName: ""
    };
  }

  const parts = normalized.split(" ");

  if (parts.length === 1) {
    return {
      firstName: normalized,
      lastName: normalized
    };
  }

  return {
    firstName: parts.slice(0, -1).join(" "),
    lastName: parts[parts.length - 1]
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
  selectedTimeValue = "",
  isDayAvailable,
  onDateSelect,
  isDisabled,
  getTimeOptions,
  onTimeSelect
}) {
  const calendarDays = useMemo(() => createCalendarDays(monthDate), [monthDate]);
  const weekdayLabels = useMemo(
    () => calendarDays.slice(0, 7).map((day) => WEEKDAY_FORMATTER.format(day)),
    [calendarDays]
  );
  const availableTimeOptions = useMemo(() => {
    if (!selectedDateValue || typeof getTimeOptions !== "function") {
      return [];
    }

    return getTimeOptions(selectedDateValue);
  }, [getTimeOptions, selectedDateValue]);

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

      {selectedDateValue && typeof getTimeOptions === "function" ? (
        <div className="reservation-calendar__times">
          {availableTimeOptions.length ? (
            availableTimeOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`reservation-calendar__time${
                  selectedTimeValue === option.value
                    ? " reservation-calendar__time--selected"
                    : ""
                }`}
                onClick={() => onTimeSelect?.(option.value)}
                disabled={isDisabled}
              >
                {option.label}
              </button>
            ))
          ) : (
            <p className="reservation-calendar__times-empty">
              {content.reservationNoAvailabilityLabel}
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}

function VehicleReservationForm({ content, vehicle, hideActionButtons = false, hideIntro = false }) {
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
  const [openDatePanel, setOpenDatePanel] = useState(null);

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
  const drivingLicenseInputId = useMemo(
    () => `driving-license-photo-${vehicle.id}`,
    [vehicle.id]
  );

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
  const pickupSummaryText =
    pickupDate && pickupTime
      ? pickupDate + " " + pickupTime
      : content.reservationPickupDatetimeLabel;
  const returnSummaryText =
    returnDate && returnTime
      ? returnDate + " " + returnTime
      : content.reservationReturnDatetimeLabel;
  const drivingLicenseSelectedLabel =
    drivingLicensePhoto?.name || content.reservationDrivingLicenseEmptyLabel;

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

  const scrollToForm = (event) => {
    event?.currentTarget?.blur();

    const target = sectionRef.current;

    if (!target || typeof window === "undefined") {
      return;
    }

    const stickyHeader = document.querySelector(".vehica-menu__wrapper");
    const headerOffset = Math.ceil(
      stickyHeader?.getBoundingClientRect().height || 100
    );
    const targetTop = Math.max(
      window.scrollY + target.getBoundingClientRect().top - headerOffset - 24,
      0
    );

    window.scrollTo({
      top: targetTop,
      behavior: "smooth"
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

  const getPickupTimeOptions = (dateValue) =>
    TIME_OPTIONS.filter((option) =>
      isPickupSlotAvailable(createDateTime(dateValue, option.value))
    );

  const getReturnTimeOptions = (dateValue) => {
    if (!pickupDateTime) {
      return [];
    }

    return TIME_OPTIONS.filter((option) =>
      isReturnSlotAvailable(createDateTime(dateValue, option.value), pickupDateTime)
    );
  };

  const handlePickupDateSelect = (dateValue) => {
    setPickupDate(dateValue);
    setPickupTime("");
    setSuccessMessage("");
  };

  const handleReturnDateSelect = (dateValue) => {
    if (!pickupDateTime) {
      return;
    }

    setReturnDate(dateValue);
    setReturnTime("");
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

      const parsedFullName = splitFullName(formValues.fullName);
      const commentParts = [formValues.comment];

      if (formValues.birthDate) {
        commentParts.unshift("Date de naissance : " + formValues.birthDate);
      }

      await createVehicleReservation(vehicle.id, {
        firstName: parsedFullName.firstName,
        lastName: parsedFullName.lastName,
        email: formValues.email,
        phone: formValues.phone,
        comment: commentParts.filter(Boolean).join("\n\n"),
        pickupLocationType: formValues.pickupLocationType,
        returnLocationType: formValues.returnLocationType,
        privacyPolicyAccepted: formValues.privacyPolicyAccepted,
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
      {hideActionButtons ? null : (
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
      )}

      <section
        className="reservation-form-section"
        ref={sectionRef}
        id="contact"
        data-vehicle-reservation-form="true"
      >
        {hideIntro ? null : (
          <div className="reservation-form-section__hero">
            <p className="hero-card__eyebrow">{content.reservationSectionEyebrow}</p>
            <h2>{content.reservationSectionTitle}</h2>
            <p className="hero-card__text">{content.reservationSectionDescription}</p>
          </div>
        )}

        {isAvailabilityLoading ? (
          <p className="rentzo-detail-form__status">
            {content.reservationAvailabilityLoadingLabel}
          </p>
        ) : null}

        {!isAvailabilityLoading && availabilityErrorMessage ? (
          <p className="login-form__message login-form__message--error">
            {availabilityErrorMessage}
          </p>
        ) : null}

        <form className="reservation-form vehica-contact-form rentzo-detail-form rentzo-detail-form--source" onSubmit={handleSubmit}>
          <div className="clearfix">
            <div className="rentzo-detail-form__group">
              <div className="vehica-3-fields">
                <p>
                  <label>{content.reservationPickupGroupLabel}</label>
                </p>

                <div className="vehica-3-fields__left">
                  <p>
                    <span className="wpcf7-form-control-wrap">
                      <select
                        name="pickupLocationType"
                        value={formValues.pickupLocationType}
                        onChange={updateField}
                      >
                        {content.reservationPickupLocationOptions.map((option) => (
                          <option key={`pickup-location-${option.value}`} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </span>
                  </p>
                </div>

                <div className="vehica-3-fields__right">
                  <p>
                    <button
                      type="button"
                      className="rentzo-detail-form__datetime-trigger"
                      onClick={() =>
                        setOpenDatePanel((currentPanel) =>
                          currentPanel === "pickup" ? null : "pickup"
                        )
                      }
                      disabled={isAvailabilityLoading}
                    >
                      {pickupSummaryText}
                    </button>
                  </p>
                </div>
              </div>

              {openDatePanel === "pickup" ? (
                <div className="rentzo-detail-form__datetime-panel">
                  <ReservationCalendar
                    content={content}
                    monthDate={pickupMonthDate}
                    onMonthChange={setPickupMonthDate}
                    selectedDateValue={pickupDate}
                    selectedTimeValue={pickupTime}
                    onDateSelect={handlePickupDateSelect}
                    isDayAvailable={hasAvailablePickupSlotForDay}
                    isDisabled={false}
                    getTimeOptions={getPickupTimeOptions}
                    onTimeSelect={(timeValue) => {
                      setPickupTime(timeValue);
                      setOpenDatePanel(null);
                    }}
                  />
                </div>
              ) : null}
            </div>

            <div className="rentzo-detail-form__group">
              <div className="vehica-3-fields">
                <p>
                  <label>{content.reservationReturnGroupLabel}</label>
                </p>

                <div className="vehica-3-fields__left">
                  <p>
                    <span className="wpcf7-form-control-wrap">
                      <select
                        name="returnLocationType"
                        value={formValues.returnLocationType}
                        onChange={updateField}
                      >
                        {content.reservationPickupLocationOptions.map((option) => (
                          <option key={`return-location-${option.value}`} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </span>
                  </p>
                </div>

                <div className="vehica-3-fields__right">
                  <p>
                    <button
                      type="button"
                      className="rentzo-detail-form__datetime-trigger"
                      onClick={() => {
                        if (!pickupDateTime) {
                          return;
                        }

                        setOpenDatePanel((currentPanel) =>
                          currentPanel === "return" ? null : "return"
                        );
                      }}
                      disabled={!pickupDateTime || isAvailabilityLoading}
                    >
                      {returnSummaryText}
                    </button>
                  </p>
                </div>
              </div>

              {openDatePanel === "return" ? (
                <div className="rentzo-detail-form__datetime-panel">
                  {!pickupDateTime ? (
                    <p className="rentzo-detail-form__helper">
                      {content.reservationSelectPickupFirstLabel}
                    </p>
                  ) : null}

                  <ReservationCalendar
                    content={content}
                    monthDate={returnMonthDate}
                    onMonthChange={setReturnMonthDate}
                    selectedDateValue={returnDate}
                    selectedTimeValue={returnTime}
                    onDateSelect={handleReturnDateSelect}
                    isDayAvailable={hasAvailableReturnSlotForDay}
                    isDisabled={!pickupDateTime}
                    getTimeOptions={getReturnTimeOptions}
                    onTimeSelect={(timeValue) => {
                      setReturnTime(timeValue);
                      setOpenDatePanel(null);
                    }}
                  />
                </div>
              ) : null}
            </div>

            <p className="rentzo-detail-form__section-label">
              <label> </label>
              <br />
              <label>{content.reservationCustomerGroupLabel}</label>
            </p>

            <div className="vehica-1-fields rentzo-detail-form__customer-fields">
              <div className="vehica-1-fields__middle">
                <p>
                  <span className="wpcf7-form-control-wrap">
                    <input
                      type="text"
                      name="fullName"
                      value={formValues.fullName}
                      onChange={updateField}
                      placeholder={content.reservationFullNamePlaceholder}
                      required
                    />
                  </span>
                </p>
              </div>

              <div className="vehica-1-fields__middle">
                <p>
                  <span className="wpcf7-form-control-wrap">
                    <input
                      type="email"
                      name="email"
                      value={formValues.email}
                      onChange={updateField}
                      placeholder={content.reservationEmailPlaceholder}
                      required
                    />
                  </span>
                </p>
              </div>

              <div className="vehica-1-fields__middle">
                <p>
                  <span className="wpcf7-form-control-wrap">
                    <input
                      type="tel"
                      name="phone"
                      value={formValues.phone}
                      onChange={updateField}
                      placeholder={content.reservationPhonePlaceholder}
                      required
                    />
                  </span>
                </p>
              </div>

              <div className="vehica-1-fields__middle">
                <p>
                  <span className="wpcf7-form-control-wrap">
                    <input
                      type="text"
                      name="birthDate"
                      value={formValues.birthDate}
                      onChange={updateField}
                      placeholder={content.reservationBirthDatePlaceholder}
                      required
                    />
                  </span>
                </p>
              </div>
            </div>

            <p className="rentzo-detail-form__section-label rentzo-detail-form__section-label--license">
              <label> </label>
              <br />
              <label>{content.reservationLicenseGroupLabel}</label>
              <br />
            </p>

            <div className="vehica-1-fields rentzo-detail-form__license-fields">
              <div className="vehica-1-fields__middle vehica-1-fields__middle--full">
                <div className="rentzo-detail-form__license-upload">
                  <p className="rentzo-detail-form__license-selected">
                    {drivingLicenseSelectedLabel}
                  </p>

                  <input
                    id={drivingLicenseInputId}
                    className="rentzo-detail-form__license-input"
                    type="file"
                    accept="image/*"
                    onChange={handleDrivingLicensePhoto}
                    required
                  />

                  <label
                    className="rentzo-detail-form__license-trigger"
                    htmlFor={drivingLicenseInputId}
                  >
                    <span className="rentzo-detail-form__license-trigger-text">
                      {content.reservationDrivingLicensePlaceholder}
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {previewUrl ? (
              <div className="reservation-form__license-preview">
                <img src={previewUrl} alt={content.reservationDrivingLicenseLabel} />
              </div>
            ) : null}

            <p className="rentzo-detail-form__section-block rentzo-detail-form__section-block--comment">
              <label> </label>
              <br />
              <label>{content.reservationCommentGroupLabel}</label>
              <br />
              <span className="wpcf7-form-control-wrap">
                <textarea
                  name="comment"
                  value={formValues.comment}
                  onChange={updateField}
                  rows="4"
                  placeholder={content.reservationCommentPlaceholder}
                  required
                />
              </span>
            </p>

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

            <div className="detail-reservation-form__actions">
              <div className="detail-reservation-form__policy">
                <p>
                  <span className="wpcf7-form-control-wrap">
                    <span className="wpcf7-form-control wpcf7-acceptance">
                      <span className="wpcf7-list-item">
                        <label>
                          <input
                            type="checkbox"
                            name="privacyPolicyAccepted"
                            checked={formValues.privacyPolicyAccepted}
                            onChange={updateField}
                            required
                          />
                          <span className="wpcf7-list-item-label">
                            {content.reservationPrivacyLabel}
                          </span>
                        </label>
                      </span>
                    </span>
                  </span>
                </p>
              </div>

              <div className="detail-reservation-form__submit-wrap">
                <p>
                  <button
                    type="submit"
                    className="wpcf7-form-control wpcf7-submit detail-reservation-form__submit"
                    disabled={isSubmitting || isAvailabilityLoading}
                  >
                    {content.reservationSubmitLabel}
                  </button>
                </p>
              </div>
            </div>
          </div>
        </form>
      </section>
    </>
  );
}

export default VehicleReservationForm;
