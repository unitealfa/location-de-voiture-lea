import { useEffect, useState } from "react";
import VehicleVideo from "../components/VehicleVideo";
import {
  createVehicle,
  getVehicleById,
  updateVehicle
} from "../services/vehicleService";

function buildInitialFormValues() {
  return {
    brand: "",
    model: "",
    version: "",
    fuelType: "",
    transmission: "",
    seats: "",
    isConvertible: false,
    horsepower: "",
    dailyPrice: "",
    weeklyPrice: "",
    monthlyPrice: "",
    securityDeposit: "",
    includedKmPerDay: "",
    extraKmPrice: "",
    availabilityStatus: "available"
  };
}

function mapVehicleToFormValues(vehicle) {
  return {
    brand: vehicle.brand,
    model: vehicle.model,
    version: vehicle.version,
    fuelType: vehicle.fuelType,
    transmission: vehicle.transmission,
    seats: String(vehicle.seats),
    isConvertible: Boolean(vehicle.isConvertible),
    horsepower: String(vehicle.horsepower),
    dailyPrice: String(vehicle.dailyPrice),
    weeklyPrice: String(vehicle.weeklyPrice),
    monthlyPrice: String(vehicle.monthlyPrice),
    securityDeposit: String(vehicle.securityDeposit),
    includedKmPerDay: String(vehicle.includedKmPerDay),
    extraKmPrice: String(vehicle.extraKmPrice),
    availabilityStatus: vehicle.availabilityStatus
  };
}

function AdminVehicleFormPage({
  content,
  mode,
  vehicleId,
  onBackClick,
  onSaved
}) {
  const [formValues, setFormValues] = useState(buildInitialFormValues);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(mode === "edit");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoFiles, setPhotoFiles] = useState([]);
  const [videoFile, setVideoFile] = useState(null);
  const [existingPhotoUrls, setExistingPhotoUrls] = useState([]);
  const [existingVideoUrl, setExistingVideoUrl] = useState("");
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState([]);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState("");

  useEffect(() => {
    if (mode !== "edit" || !vehicleId) {
      setFormValues(buildInitialFormValues());
      setPhotoFiles([]);
      setVideoFile(null);
      setExistingPhotoUrls([]);
      setExistingVideoUrl("");
      setIsLoading(false);
      return;
    }

    let isActive = true;

    const loadVehicle = async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const vehicle = await getVehicleById(vehicleId, {
          adminView: true
        });

        if (!isActive) {
          return;
        }

        setFormValues(mapVehicleToFormValues(vehicle));
        setPhotoFiles([]);
        setVideoFile(null);
        setExistingPhotoUrls(vehicle.photoUrls || []);
        setExistingVideoUrl(vehicle.videoUrl || "");
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

    loadVehicle();

    return () => {
      isActive = false;
    };
  }, [content.detailErrorMessage, mode, vehicleId]);

  useEffect(() => {
    if (photoFiles.length === 0) {
      setPhotoPreviewUrls([]);
      return undefined;
    }

    const objectUrls = photoFiles.map((file) => URL.createObjectURL(file));
    setPhotoPreviewUrls(objectUrls);

    return () => {
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [existingPhotoUrls, photoFiles]);

  useEffect(() => {
    if (!videoFile) {
      setVideoPreviewUrl(existingVideoUrl);
      return undefined;
    }

    const objectUrl = URL.createObjectURL(videoFile);
    setVideoPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [existingVideoUrl, videoFile]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setFormValues((currentValues) => ({
      ...currentValues,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleExistingPhotoRemove = (photoUrlToRemove) => {
    setExistingPhotoUrls((currentPhotoUrls) =>
      currentPhotoUrls.filter((photoUrl) => photoUrl !== photoUrlToRemove)
    );
  };

  const handlePhotoSelection = (event) => {
    setPhotoFiles(Array.from(event.target.files || []));
  };

  const handleNewPhotoRemove = (photoIndexToRemove) => {
    setPhotoFiles((currentPhotoFiles) =>
      currentPhotoFiles.filter((photoFile, photoIndex) => photoIndex !== photoIndexToRemove)
    );
  };

  const handleVideoSelection = (event) => {
    setVideoFile(event.target.files?.[0] || null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const payload = {
        ...formValues
      };

      payload.photoFiles = photoFiles;
      payload.videoFile = videoFile;
      payload.retainedPhotoUrls = existingPhotoUrls;

      const response =
        mode === "edit"
          ? await updateVehicle(vehicleId, payload)
          : await createVehicle(payload);

      onSaved(response.vehicle);
    } catch (error) {
      setErrorMessage(
        error.message ||
          (mode === "edit"
            ? content.updateErrorMessage
            : content.createErrorMessage)
      );
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
          {mode === "edit" ? content.backToVehicleLabel : content.backToListLabel}
        </button>

        <div>
          <p className="hero-card__eyebrow">{content.eyebrow}</p>
          <h1>{mode === "edit" ? content.editTitle : content.createTitle}</h1>
          <p className="hero-card__text">
            {mode === "edit" ? content.editDescription : content.createDescription}
          </p>
        </div>
      </section>

      <form className="vehicle-form" onSubmit={handleSubmit}>
        <section className="vehicle-form__grid">
          <label className="login-form__field">
            <span>{content.brandLabel}</span>
            <input
              type="text"
              name="brand"
              value={formValues.brand}
              onChange={handleChange}
            />
          </label>

          <label className="login-form__field">
            <span>{content.modelLabel}</span>
            <input
              type="text"
              name="model"
              value={formValues.model}
              onChange={handleChange}
            />
          </label>

          <label className="login-form__field">
            <span>{content.versionLabel}</span>
            <input
              type="text"
              name="version"
              value={formValues.version}
              onChange={handleChange}
            />
          </label>

          <label className="login-form__field">
            <span>{content.fuelTypeLabel}</span>
            <select
              name="fuelType"
              value={formValues.fuelType}
              onChange={handleChange}
            >
              <option value="">Selectionner</option>
              {content.fuelTypeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="login-form__field">
            <span>{content.transmissionLabel}</span>
            <select
              name="transmission"
              value={formValues.transmission}
              onChange={handleChange}
            >
              <option value="">Selectionner</option>
              {content.transmissionOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="login-form__field">
            <span>{content.seatsLabel}</span>
            <input
              type="number"
              min="1"
              name="seats"
              value={formValues.seats}
              onChange={handleChange}
            />
          </label>

          <label className="login-form__field">
            <span>{content.horsepowerLabel}</span>
            <input
              type="number"
              min="0"
              name="horsepower"
              value={formValues.horsepower}
              onChange={handleChange}
            />
          </label>

          <label className="login-form__field">
            <span>{content.dailyPriceLabel}</span>
            <input
              type="number"
              min="0"
              step="0.01"
              name="dailyPrice"
              value={formValues.dailyPrice}
              onChange={handleChange}
            />
          </label>

          <label className="login-form__field">
            <span>{content.weeklyPriceLabel}</span>
            <input
              type="number"
              min="0"
              step="0.01"
              name="weeklyPrice"
              value={formValues.weeklyPrice}
              onChange={handleChange}
            />
          </label>

          <label className="login-form__field">
            <span>{content.monthlyPriceLabel}</span>
            <input
              type="number"
              min="0"
              step="0.01"
              name="monthlyPrice"
              value={formValues.monthlyPrice}
              onChange={handleChange}
            />
          </label>

          <label className="login-form__field">
            <span>{content.securityDepositLabel}</span>
            <input
              type="number"
              min="0"
              step="0.01"
              name="securityDeposit"
              value={formValues.securityDeposit}
              onChange={handleChange}
            />
          </label>

          <label className="login-form__field">
            <span>{content.includedKmPerDayLabel}</span>
            <input
              type="number"
              min="0"
              name="includedKmPerDay"
              value={formValues.includedKmPerDay}
              onChange={handleChange}
            />
          </label>

          <label className="login-form__field">
            <span>{content.extraKmPriceLabel}</span>
            <input
              type="number"
              min="0"
              step="0.01"
              name="extraKmPrice"
              value={formValues.extraKmPrice}
              onChange={handleChange}
            />
          </label>

          <label className="vehicle-form__checkbox">
            <input
              type="checkbox"
              name="isConvertible"
              checked={formValues.isConvertible}
              onChange={handleChange}
            />
            <span>{content.convertibleLabel}</span>
          </label>

          {mode === "edit" ? (
            <label className="login-form__field">
              <span>{content.adminAvailabilityLabel}</span>
              <select
                name="availabilityStatus"
                value={formValues.availabilityStatus}
                onChange={handleChange}
              >
                <option value="available">
                  {content.availabilityAvailableLabel}
                </option>
                <option value="reserved">
                  {content.availabilityReservedLabel}
                </option>
                <option value="maintenance">
                  {content.availabilityMaintenanceLabel}
                </option>
              </select>
            </label>
          ) : null}
        </section>

        <label className="login-form__field">
          <span>{content.videoUrlLabel}</span>
          <input
            type="file"
            accept="video/*"
            onChange={handleVideoSelection}
          />
        </label>

        {videoPreviewUrl ? (
          <div className="vehicle-form__media">
            <VehicleVideo src={videoPreviewUrl} title={content.videoSectionTitle} />
          </div>
        ) : null}

        <label className="login-form__field">
          <span>{content.photoUrlsLabel}</span>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handlePhotoSelection}
          />
        </label>

        {existingPhotoUrls.length > 0 || photoPreviewUrls.length > 0 ? (
          <div className="vehicle-form__gallery">
            {existingPhotoUrls.map((photoUrl, index) => (
              <div key={`${photoUrl}-${index}`} className="vehicle-form__gallery-item">
                <button
                  type="button"
                  className="vehicle-form__remove-media"
                  aria-label={`Supprimer l'image ${index + 1}`}
                  onClick={() => handleExistingPhotoRemove(photoUrl)}
                >
                  x
                </button>

                <img
                  src={photoUrl}
                  alt={`${content.photoUrlsLabel} ${index + 1}`}
                />
              </div>
            ))}

            {photoPreviewUrls.map((photoUrl, index) => (
              <div
                key={`${photoUrl}-${index}`}
                className="vehicle-form__gallery-item"
              >
                <button
                  type="button"
                  className="vehicle-form__remove-media"
                  aria-label={`Supprimer la nouvelle image ${index + 1}`}
                  onClick={() => handleNewPhotoRemove(index)}
                >
                  x
                </button>

                <img
                  src={photoUrl}
                  alt={`${content.photoUrlsLabel} ${existingPhotoUrls.length + index + 1}`}
                />
              </div>
            ))}
          </div>
        ) : null}

        {errorMessage ? (
          <p className="login-form__message login-form__message--error">
            {errorMessage}
          </p>
        ) : null}

        <button
          type="submit"
          className="login-form__submit"
          disabled={isSubmitting}
        >
          {mode === "edit" ? content.editSubmitLabel : content.createSubmitLabel}
        </button>
      </form>
    </main>
  );
}

export default AdminVehicleFormPage;
