import { useEffect, useMemo, useState } from "react";
import { listVehicles } from "../services/vehicleService";
import {
  createAdminReservation,
  getAdminReservationById,
  listAdminReservations,
  updateAdminReservation
} from "../services/reservationService";
import { formatReservationDateTime } from "../utils/reservationFormatters";
import { formatVehicleName } from "../utils/vehicleFormatters";

function buildInitialFormValues() {
  return {
    vehicleId: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    comment: "",
    pickupLocationType: "bureau",
    returnLocationType: "bureau",
    pickupDatetime: "",
    returnDatetime: "",
    privacyPolicyAccepted: true
  };
}

function toDateTimeLocalValue(value) {
  if (!value) {
    return "";
  }

  return String(value).replace(" ", "T").slice(0, 16);
}

function mapReservationToFormValues(reservation) {
  return {
    vehicleId: String(reservation.vehicleId || ""),
    firstName: reservation.firstName || "",
    lastName: reservation.lastName || "",
    email: reservation.email || "",
    phone: reservation.phone || "",
    comment: reservation.comment || "",
    pickupLocationType: reservation.pickupLocationType || "bureau",
    returnLocationType: reservation.returnLocationType || "bureau",
    pickupDatetime: toDateTimeLocalValue(reservation.pickupDatetime),
    returnDatetime: toDateTimeLocalValue(reservation.returnDatetime),
    privacyPolicyAccepted: Boolean(reservation.privacyPolicyAccepted)
  };
}

function formatDurationLabel(pickupDatetime, returnDatetime) {
  const pickupTime = new Date(pickupDatetime).getTime();
  const returnTime = new Date(returnDatetime).getTime();

  if (Number.isNaN(pickupTime) || Number.isNaN(returnTime) || returnTime <= pickupTime) {
    return "";
  }

  const durationMs = returnTime - pickupTime;
  const totalHours = Math.ceil(durationMs / (1000 * 60 * 60));

  if (totalHours < 24) {
    return `${totalHours} heure${totalHours > 1 ? "s" : ""}`;
  }

  const totalDays = Math.floor(totalHours / 24);
  const remainingHours = totalHours % 24;

  if (remainingHours === 0) {
    return `${totalDays} jour${totalDays > 1 ? "s" : ""}`;
  }

  return `${totalDays} jour${totalDays > 1 ? "s" : ""} ${remainingHours} heure${remainingHours > 1 ? "s" : ""}`;
}

function toDate(value) {
  return new Date(String(value).replace(" ", "T"));
}

function reservationsOverlap(startA, endA, startB, endB) {
  return startA.getTime() < endB.getTime() && endA.getTime() > startB.getTime();
}

function AdminReservationFormPage({
  content,
  vehicleContent,
  mode,
  reservationId,
  onBackClick,
  onSaved
}) {
  const [vehicles, setVehicles] = useState([]);
  const [acceptedReservations, setAcceptedReservations] = useState([]);
  const [currentReservation, setCurrentReservation] = useState(null);
  const [formValues, setFormValues] = useState(buildInitialFormValues);
  const [drivingLicensePhoto, setDrivingLicensePhoto] = useState(null);
  const [licensePreviewUrl, setLicensePreviewUrl] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    return () => {
      if (licensePreviewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(licensePreviewUrl);
      }
    };
  }, [licensePreviewUrl]);

  useEffect(() => {
    let isActive = true;

    const loadFormData = async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const [nextVehicles, nextAcceptedReservations, nextReservation] =
          await Promise.all([
            listVehicles({ adminView: true }),
            listAdminReservations({ scope: "accepted" }),
            mode === "edit" && reservationId
              ? getAdminReservationById(reservationId)
              : Promise.resolve(null)
          ]);

        if (!isActive) {
          return;
        }

        setVehicles(nextVehicles);
        setAcceptedReservations(nextAcceptedReservations);
        setCurrentReservation(nextReservation);
        setDrivingLicensePhoto(null);

        if (nextReservation) {
          setFormValues(mapReservationToFormValues(nextReservation));
          setLicensePreviewUrl(nextReservation.drivingLicensePhotoUrl || "");
        } else {
          setFormValues(buildInitialFormValues());
          setLicensePreviewUrl("");
        }
      } catch (error) {
        if (!isActive) {
          return;
        }

        setErrorMessage(error.message || content.formLoadErrorMessage);
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    loadFormData();

    return () => {
      isActive = false;
    };
  }, [content.formLoadErrorMessage, mode, reservationId]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setFormValues((currentValues) => ({
      ...currentValues,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleDrivingLicensePhotoChange = (event) => {
    const nextFile = event.target.files?.[0] || null;
    setDrivingLicensePhoto(nextFile);

    if (!nextFile) {
      setLicensePreviewUrl(currentReservation?.drivingLicensePhotoUrl || "");
      return;
    }

    const objectUrl = URL.createObjectURL(nextFile);
    setLicensePreviewUrl((currentUrl) => {
      if (currentUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(currentUrl);
      }

      return objectUrl;
    });
  };

  const selectedDurationLabel = useMemo(
    () =>
      formatDurationLabel(
        formValues.pickupDatetime,
        formValues.returnDatetime
      ),
    [formValues.pickupDatetime, formValues.returnDatetime]
  );

  const isVehicleAvailableForSelection = (vehicle) => {
    if (!vehicle) {
      return false;
    }

    if (
      vehicle.availabilityStatus === "maintenance" &&
      String(vehicle.id) !== String(formValues.vehicleId)
    ) {
      return false;
    }

    if (!formValues.pickupDatetime || !formValues.returnDatetime) {
      return vehicle.availabilityStatus !== "maintenance";
    }

    const pickupDatetime = new Date(formValues.pickupDatetime);
    const returnDatetime = new Date(formValues.returnDatetime);

    if (
      Number.isNaN(pickupDatetime.getTime()) ||
      Number.isNaN(returnDatetime.getTime()) ||
      returnDatetime.getTime() <= pickupDatetime.getTime()
    ) {
      return vehicle.availabilityStatus !== "maintenance";
    }

    const hasOverlap = acceptedReservations.some((reservation) => {
      if (reservation.id === currentReservation?.id) {
        return false;
      }

      if (reservation.vehicleId !== vehicle.id) {
        return false;
      }

      return reservationsOverlap(
        pickupDatetime,
        returnDatetime,
        toDate(reservation.pickupDatetime),
        toDate(reservation.returnDatetime)
      );
    });

    return !hasOverlap;
  };

  const selectableVehicles = useMemo(
    () =>
      vehicles.filter(
        (vehicle) =>
          vehicle.availabilityStatus !== "maintenance" ||
          String(vehicle.id) === String(formValues.vehicleId)
      ),
    [formValues.vehicleId, vehicles]
  );

  const selectedVehicle = useMemo(
    () =>
      vehicles.find((vehicle) => String(vehicle.id) === String(formValues.vehicleId)) ||
      null,
    [formValues.vehicleId, vehicles]
  );

  const hasVehicleConflict =
    Boolean(selectedVehicle) &&
    !isVehicleAvailableForSelection(selectedVehicle);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      if (!formValues.vehicleId) {
        throw new Error("Selectionnez un vehicule.");
      }

      const payload = {
        ...formValues,
        drivingLicensePhoto
      };

      const reservation =
        mode === "edit"
          ? await updateAdminReservation(reservationId, payload)
          : await createAdminReservation(payload);

      onSaved(reservation);
    } catch (error) {
      setErrorMessage(error.message || content.formSaveErrorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <main className="vehicle-form-page">
        <section className="vehicles-empty">
          <p className="status-message">Chargement du formulaire...</p>
        </section>
      </main>
    );
  }

  return (
    <main className="vehicle-form-page">
      <section className="vehicle-form-page__hero">
        <button
          type="button"
          className="vehicle-detail__back"
          onClick={onBackClick}
        >
          {content.backLabel}
        </button>

        <div>
          <p className="hero-card__eyebrow">{content.eyebrow}</p>
          <h1>{mode === "edit" ? content.editTitle : content.createTitle}</h1>
          <p className="hero-card__text">
            {mode === "edit" ? content.editDescription : content.createDescription}
          </p>
        </div>
      </section>

      <form className="vehicle-form reservation-admin-form" onSubmit={handleSubmit}>
        <section className="reservation-admin-form__meta">
          <label className="login-form__field">
            <span>{content.formVehicleLabel}</span>
            <select
              name="vehicleId"
              value={formValues.vehicleId}
              onChange={handleChange}
              required
            >
              <option value="">{content.formVehiclePlaceholder}</option>
              {selectableVehicles.map((vehicle) => {
                const isAvailable = isVehicleAvailableForSelection(vehicle);

                return (
                  <option
                    key={vehicle.id}
                    value={vehicle.id}
                    disabled={
                      !isAvailable &&
                      String(vehicle.id) !== String(formValues.vehicleId)
                    }
                  >
                    {formatVehicleName(vehicle)}
                    {!isAvailable ? ` (${content.formVehicleUnavailableSuffix})` : ""}
                  </option>
                );
              })}
            </select>
          </label>

          <div className="vehicle-form__help">
            <strong>{content.formDurationLiveLabel}:</strong>{" "}
            {selectedDurationLabel || "-"}
          </div>
        </section>

        <section className="vehicle-form__grid">
          <label className="login-form__field">
            <span>{vehicleContent.reservationLastNameLabel}</span>
            <input
              type="text"
              name="lastName"
              value={formValues.lastName}
              onChange={handleChange}
              required
            />
          </label>

          <label className="login-form__field">
            <span>{vehicleContent.reservationFirstNameLabel}</span>
            <input
              type="text"
              name="firstName"
              value={formValues.firstName}
              onChange={handleChange}
              required
            />
          </label>

          <label className="login-form__field">
            <span>{content.emailLabel}</span>
            <input
              type="email"
              name="email"
              value={formValues.email}
              onChange={handleChange}
            />
          </label>

          <label className="login-form__field">
            <span>{content.phoneLabel}</span>
            <input
              type="tel"
              name="phone"
              value={formValues.phone}
              onChange={handleChange}
              required
            />
          </label>

          <label className="login-form__field">
            <span>{content.pickupLabel}</span>
            <select
              name="pickupLocationType"
              value={formValues.pickupLocationType}
              onChange={handleChange}
            >
              {vehicleContent.reservationPickupLocationOptions.map((option) => (
                <option key={`pickup-${option.value}`} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="login-form__field">
            <span>{content.returnLabel}</span>
            <select
              name="returnLocationType"
              value={formValues.returnLocationType}
              onChange={handleChange}
            >
              {vehicleContent.reservationPickupLocationOptions.map((option) => (
                <option key={`return-${option.value}`} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="login-form__field">
            <span>{vehicleContent.reservationPickupDatetimeLabel}</span>
            <input
              type="datetime-local"
              name="pickupDatetime"
              value={formValues.pickupDatetime}
              onChange={handleChange}
              required
            />
          </label>

          <label className="login-form__field">
            <span>{vehicleContent.reservationReturnDatetimeLabel}</span>
            <input
              type="datetime-local"
              name="returnDatetime"
              value={formValues.returnDatetime}
              onChange={handleChange}
              required
            />
          </label>
        </section>

        <label className="login-form__field">
          <span>{content.commentLabel}</span>
          <textarea
            name="comment"
            value={formValues.comment}
            onChange={handleChange}
            rows="4"
            required
          />
        </label>

        <label className="reservation-form__checkbox">
          <input
            type="checkbox"
            name="privacyPolicyAccepted"
            checked={formValues.privacyPolicyAccepted}
            onChange={handleChange}
            required
          />
          <span>{vehicleContent.reservationPrivacyLabel}</span>
        </label>

        <label className="login-form__field">
          <span>
            {mode === "edit"
              ? content.formDrivingLicenseReplaceLabel
              : content.licenseLabel}
          </span>
          <input
            type="file"
            accept="image/*"
            onChange={handleDrivingLicensePhotoChange}
            required={mode !== "edit"}
          />
        </label>

        {licensePreviewUrl ? (
          <div className="reservation-admin-form__license">
            <strong>
              {mode === "edit"
                ? content.formCurrentLicenseLabel
                : content.licenseLabel}
            </strong>
            <img
              src={licensePreviewUrl}
              alt={content.licenseLabel}
            />
          </div>
        ) : null}

        {currentReservation ? (
          <div className="vehicle-form__help">
            {content.createdAtLabel}: {formatReservationDateTime(currentReservation.createdAt)}
          </div>
        ) : null}

        {hasVehicleConflict ? (
          <p className="login-form__message login-form__message--error">
            {content.formVehicleConflictMessage}
          </p>
        ) : null}

        {errorMessage ? (
          <p className="login-form__message login-form__message--error">
            {errorMessage}
          </p>
        ) : null}

        <button
          type="submit"
          className="login-form__submit"
          disabled={isSubmitting || hasVehicleConflict}
        >
          {mode === "edit" ? content.saveEditLabel : content.saveCreateLabel}
        </button>
      </form>
    </main>
  );
}

export default AdminReservationFormPage;
