import { useEffect, useState } from "react";
import VehicleCard from "../components/VehicleCard";
import { listVehicles } from "../services/vehicleService";

function LocationVehiclesPage({
  content,
  currentAdmin,
  onCreateClick,
  onVehicleClick
}) {
  const [vehicles, setVehicles] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    const loadVehicles = async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const nextVehicles = await listVehicles({
          adminView: Boolean(currentAdmin)
        });

        if (!isActive) {
          return;
        }

        setVehicles(nextVehicles);
      } catch (error) {
        if (!isActive) {
          return;
        }

        setErrorMessage(error.message || content.loadErrorMessage);
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    loadVehicles();

    return () => {
      isActive = false;
    };
  }, [content.loadErrorMessage, currentAdmin]);

  const hasVehicles = vehicles.length > 0;
  const pageTitle = hasVehicles ? content.title : content.emptyTitle;
  const pageDescription = currentAdmin
    ? content.adminDescription
    : hasVehicles
      ? content.listDescription
      : content.emptyDescription;

  return (
    <main className="vehicles-page">
      <section className="vehicles-page__hero">
        <div>
          <p className="hero-card__eyebrow">{content.eyebrow}</p>
          <h1>{pageTitle}</h1>
          <p className="hero-card__text">{pageDescription}</p>
        </div>

        {currentAdmin ? (
          <button
            type="button"
            className="vehicles-page__create"
            onClick={onCreateClick}
          >
            {content.createLabel}
          </button>
        ) : null}
      </section>

      {isLoading ? (
        <section className="vehicles-empty">
          <p className="status-message">Chargement des vehicules...</p>
        </section>
      ) : errorMessage ? (
        <section className="vehicles-empty">
          <p className="login-form__message login-form__message--error">
            {errorMessage}
          </p>
        </section>
      ) : hasVehicles ? (
        <section className="vehicle-grid">
          {vehicles.map((vehicle) => (
            <VehicleCard
              key={vehicle.id}
              content={content}
              vehicle={vehicle}
              showAdminState={Boolean(currentAdmin)}
              onOpen={() => onVehicleClick(vehicle.id)}
            />
          ))}
        </section>
      ) : (
        <section className="vehicles-empty">
          <div className="vehicles-empty__card">
            <h2>{content.emptyTitle}</h2>
            <p>{content.emptyDescription}</p>
          </div>
        </section>
      )}

    </main>
  );
}

export default LocationVehiclesPage;
