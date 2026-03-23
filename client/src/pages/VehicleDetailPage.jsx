import { useEffect, useMemo, useRef, useState } from "react";
import VehicleReservationForm from "../components/VehicleReservationForm";
import VehicleVideo from "../components/VehicleVideo";
import {
  deleteVehicle,
  getVehicleById,
  listVehicles,
  markVehicleAsAvailable,
  markVehicleAsMaintenance
} from "../services/vehicleService";
import {
  formatVehiclePrice,
  getVehicleCardImageUrl
} from "../utils/vehicleFormatters";

function getVehicleTitle(vehicle) {
  return [vehicle.brand, vehicle.model, vehicle.version].filter(Boolean).join(" ");
}

function getRelatedSlidesPerView(width) {
  if (width >= 1200) {
    return 4;
  }

  if (width >= 900) {
    return 3;
  }

  if (width >= 600) {
    return 2;
  }

  return 1;
}

function formatVehicleRanges(vehicle) {
  if (!Array.isArray(vehicle.vehicleRanges) || vehicle.vehicleRanges.length === 0) {
    return "-";
  }

  return vehicle.vehicleRanges.join(", ");
}

function getAvailabilityLabel(vehicle, content) {
  if (vehicle.availabilityStatus === "maintenance") {
    return content.availabilityMaintenanceLabel;
  }

  if (vehicle.availabilityStatus === "reserved") {
    return content.availabilityReservedLabel;
  }

  return content.availabilityAvailableLabel;
}

function buildDetailAttributes(vehicle, content) {
  return [
    { label: content.brandLabel, value: vehicle.brand || "-" },
    { label: content.modelLabel, value: vehicle.model || "-" },
    { label: content.versionLabel, value: vehicle.version || "-" },
    { label: content.horsepowerLabel, value: vehicle.horsepower || "-" },
    {
      label: content.transmissionDetailLabel || content.transmissionLabel,
      value: vehicle.transmission || "-"
    },
    { label: content.fuelTypeLabel, value: vehicle.fuelType || "-" },
    {
      label: content.seatsDetailLabel || content.seatsLabel,
      value: vehicle.seats ? String(vehicle.seats) + " " + content.seatsSuffix : "-"
    },
    {
      label: content.convertibleLabel,
      value: vehicle.isConvertible ? content.yesLabel : content.noLabel
    }
  ];
}

function buildRelatedVehicles(currentVehicle, vehicles) {
  if (!currentVehicle) {
    return [];
  }

  const currentRanges = Array.isArray(currentVehicle.vehicleRanges)
    ? currentVehicle.vehicleRanges
    : [];

  return vehicles
    .filter((vehicle) => vehicle.id !== currentVehicle.id)
    .map((vehicle) => {
      const nextRanges = Array.isArray(vehicle.vehicleRanges) ? vehicle.vehicleRanges : [];
      let score = 0;

      if (vehicle.brand === currentVehicle.brand) {
        score += 5;
      }

      if (vehicle.model === currentVehicle.model) {
        score += 3;
      }

      if (vehicle.fuelType === currentVehicle.fuelType) {
        score += 1;
      }

      if (vehicle.transmission === currentVehicle.transmission) {
        score += 1;
      }

      if (vehicle.isConvertible === currentVehicle.isConvertible) {
        score += 1;
      }

      currentRanges.forEach((range) => {
        if (nextRanges.includes(range)) {
          score += 2;
        }
      });

      return {
        vehicle,
        score
      };
    })
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return getVehicleTitle(left.vehicle).localeCompare(getVehicleTitle(right.vehicle), "fr", {
        sensitivity: "base"
      });
    })
    .slice(0, 8)
    .map((entry) => entry.vehicle);
}

function DetailFeatureIcon({ icon }) {
  return (
    <div className="vehica-features__icon" aria-hidden="true">
      <i className={icon === "handshake" ? "far fa-handshake" : "far fa-edit"}></i>
    </div>
  );
}

function RelatedVehicleCard({ content, vehicle, onOpen }) {
  const vehicleTitle = getVehicleTitle(vehicle);
  const primaryImage = getVehicleCardImageUrl(
    Array.isArray(vehicle.photoUrls) && vehicle.photoUrls[0]
      ? vehicle.photoUrls[0]
      : "/home/rentzo-catalog-hero.jpg"
  );
  const photoCount = Array.isArray(vehicle.photoUrls) ? vehicle.photoUrls.length : 0;

  return (
    <div data-id={vehicle.id} id={"vehica-car-" + vehicle.id} className="vehica-car-card vehica-car-card-v1">
      <div className="vehica-car-card__inner">
        <button
          type="button"
          className="vehica-car-card-link"
          onClick={onOpen}
          aria-label={vehicleTitle}
        />

        <div className="vehica-car-card__image-bg">
          <div className="vehica-car-card__image" style={{ paddingTop: "84.52380952381%" }}>
            <img
              src={primaryImage || "/home/rentzo-catalog-hero.jpg"}
              alt={vehicleTitle}
              loading="lazy"
              decoding="async"
            />

            <div className="vehica-car-card__image-info">
              <span className="vehica-car-card__image-info__photos">
                <i className="far fa-images" aria-hidden="true"></i>
                <span>{photoCount}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="vehica-car-card__content">
          <div className="vehica-car-card__name" title={vehicleTitle}>
            {vehicleTitle}
          </div>

          <div className="vehica-car-card__price">
            {content.cardDailyPriceLabel} {formatVehiclePrice(vehicle.dailyPrice)}
            {content.pricePerDaySuffix}
          </div>

          <div className="vehica-car-card__separator"></div>

          <div className="vehica-car-card__info">
            <div className="vehica-car-card__info__single">
              {vehicle.seats ? vehicle.seats + " " + content.seatsSuffix : "-"}
            </div>
            <div className="vehica-car-card__info__single">{vehicle.transmission || "-"}</div>
            <div className="vehica-car-card__info__single">{vehicle.fuelType || "-"}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

const HEADLINE_ANIMATION_DURATION_MS = 1200;
const HEADLINE_ITERATION_DELAY_MS = 8000;
const HEADLINE_HIDE_DURATION_MS = 400;
const HEADLINE_MARKER_PATH =
  "M26,78 C20,50 46,29 98,22 C149,16 212,18 275,17 C337,16 401,22 447,33 C474,39 488,56 486,77 C484,98 467,113 436,122 C391,135 336,131 279,133 C212,136 153,140 100,135 C58,131 32,116 26,78 Z";

function AnimatedReservationHeadline({ accentText, startText }) {
  const [cycleKey, setCycleKey] = useState(0);
  const [isHiding, setIsHiding] = useState(false);

  useEffect(() => {
    let hideTimerId = 0;
    let loopTimerId = 0;
    let isCancelled = false;

    const startCycle = () => {
      if (isCancelled) {
        return;
      }

      setIsHiding(false);
      setCycleKey((currentKey) => currentKey + 1);

      hideTimerId = window.setTimeout(() => {
        if (!isCancelled) {
          setIsHiding(true);
        }
      }, HEADLINE_ITERATION_DELAY_MS - HEADLINE_HIDE_DURATION_MS);

      loopTimerId = window.setTimeout(startCycle, HEADLINE_ITERATION_DELAY_MS);
    };

    startCycle();

    return () => {
      isCancelled = true;
      window.clearTimeout(hideTimerId);
      window.clearTimeout(loopTimerId);
    };
  }, []);

  return (
    <div
      className="detail-highlight-headline"
      style={{ "--detail-highlight-duration": `${HEADLINE_ANIMATION_DURATION_MS}ms` }}
    >
      <h3
        className={`detail-highlight-headline__title${
          isHiding ? " is-hiding" : " is-drawing"
        }`}
      >
        <span className="detail-highlight-headline__plain">{startText}</span>{" "}

        <span className="detail-highlight-headline__accent-wrap">
          <span className="detail-highlight-headline__accent">{accentText}</span>

          <svg
            key={cycleKey}
            className="detail-highlight-headline__marker"
            viewBox="0 0 500 150"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path d={HEADLINE_MARKER_PATH}></path>
          </svg>
        </span>
      </h3>
    </div>
  );
}

function VehicleDetailPage({
  content,
  currentAdmin,
  vehicleId,
  onBackClick,
  onDeleted,
  onEditClick,
  onVehicleClick
}) {
  const [vehicle, setVehicle] = useState(null);
  const [relatedVehicles, setRelatedVehicles] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [relatedSlidesPerView, setRelatedSlidesPerView] = useState(() => {
    if (typeof window === "undefined") {
      return 4;
    }

    return getRelatedSlidesPerView(window.innerWidth);
  });
  const [relatedTrackWidth, setRelatedTrackWidth] = useState(0);
  const [relatedActiveIndex, setRelatedActiveIndex] = useState(0);
  const relatedTrackRef = useRef(null);

  useEffect(() => {
    let isActive = true;

    const loadVehicle = async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const [nextVehicle, allVehicles] = await Promise.all([
          getVehicleById(vehicleId, {
            adminView: Boolean(currentAdmin)
          }),
          listVehicles({
            adminView: Boolean(currentAdmin)
          })
        ]);

        if (!isActive) {
          return;
        }

        setVehicle(nextVehicle);
        setRelatedVehicles(buildRelatedVehicles(nextVehicle, allVehicles));
        setActivePhotoIndex(0);
        setRelatedActiveIndex(0);
      } catch (error) {
        if (!isActive) {
          return;
        }

        setVehicle(null);
        setRelatedVehicles([]);
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

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const handleResize = () => {
      setRelatedSlidesPerView(getRelatedSlidesPerView(window.innerWidth));
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !relatedTrackRef.current) {
      return undefined;
    }

    const updateWidth = () => {
      if (!relatedTrackRef.current) {
        return;
      }

      setRelatedTrackWidth(relatedTrackRef.current.clientWidth || 0);
    };

    updateWidth();

    if (!("ResizeObserver" in window)) {
      window.addEventListener("resize", updateWidth);

      return () => {
        window.removeEventListener("resize", updateWidth);
      };
    }

    const observer = new ResizeObserver(() => {
      updateWidth();
    });

    observer.observe(relatedTrackRef.current);

    return () => {
      observer.disconnect();
    };
  }, [relatedVehicles.length]);

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
    const isMaintenance = vehicle && vehicle.availabilityStatus === "maintenance";

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

  const photoUrls = useMemo(() => {
    if (!vehicle || !Array.isArray(vehicle.photoUrls) || vehicle.photoUrls.length === 0) {
      return ["/home/rentzo-hero.jpg"];
    }

    return vehicle.photoUrls;
  }, [vehicle]);

  const galleryIndexLimit = Math.max(0, photoUrls.length - 2);
  const galleryClassName =
    "vehica-gallery-v3 rentzo-single-car__gallery" +
    (photoUrls.length === 1
      ? " vehica-gallery-v3--count-1"
      : photoUrls.length === 2
        ? " vehica-gallery-v3--count-2"
        : "");
  const galleryTrackStyle =
    photoUrls.length > 2
      ? {
          transform: "translate3d(-" + activePhotoIndex * 50 + "%, 0, 0)"
        }
      : undefined;
  const detailAttributes = useMemo(
    () => (vehicle ? buildDetailAttributes(vehicle, content) : []),
    [vehicle, content]
  );
  const vehicleTitle = vehicle ? getVehicleTitle(vehicle) : "";
  const monthlyPriceText = vehicle
    ? content.monthlyPriceLabel +
      ": " +
      formatVehiclePrice(vehicle.monthlyPrice) +
      content.pricePerDaySuffix
    : "";
  const weeklyPriceText = vehicle
    ? content.weeklyPriceLabel +
      ": " +
      formatVehiclePrice(vehicle.weeklyPrice) +
      content.pricePerDaySuffix
    : "";
  const dailyPriceText = vehicle
    ? content.dailyPriceLabel +
      ": " +
      formatVehiclePrice(vehicle.dailyPrice) +
      content.pricePerDaySuffix
    : "";
  const whatsappUrl =
    "https://wa.me/" +
    content.whatsappInternationalNumber +
    "?text=" +
    encodeURIComponent("Bonjour, je souhaite reserver " + vehicleTitle + ".");
  const securityDepositText = vehicle?.securityDeposit
    ? content.detailSecurityDepositPrefix + " " + formatVehiclePrice(vehicle.securityDeposit)
    : "-";
  const includedMileageText = vehicle?.includedKmPerDay
    ? content.detailAllowedMileagePerDayPrefix + " " + vehicle.includedKmPerDay + " km"
    : content.detailAllowedMileagePerDayPrefix + " -";
  const extraMileageText = vehicle?.extraKmPrice
    ? content.detailAllowedMileageExtraPrefix + " " + formatVehiclePrice(vehicle.extraKmPrice) + content.detailAllowedMileageExtraSuffix
    : content.detailAllowedMileageExtraPrefix + " -";
  const relatedMaxIndex = Math.max(0, relatedVehicles.length - relatedSlidesPerView);
  const relatedSlideWidth =
    relatedTrackWidth > 0
      ? (relatedTrackWidth - (relatedSlidesPerView - 1) * 22) / relatedSlidesPerView
      : 0;
  const relatedTrackStyle =
    relatedSlideWidth > 0
      ? {
          transform:
            "translate3d(-" + relatedActiveIndex * (relatedSlideWidth + 22) + "px, 0, 0)"
        }
      : undefined;
  const relatedSlideStyle =
    relatedSlideWidth > 0
      ? {
          width: relatedSlideWidth + "px",
          minWidth: relatedSlideWidth + "px"
        }
      : undefined;

  useEffect(() => {
    setActivePhotoIndex((currentIndex) => Math.min(currentIndex, galleryIndexLimit));
  }, [galleryIndexLimit]);

  useEffect(() => {
    setRelatedActiveIndex((currentIndex) => Math.min(currentIndex, relatedMaxIndex));
  }, [relatedMaxIndex]);

  const goToPreviousPhoto = () => {
    setActivePhotoIndex((currentIndex) => {
      const nextIndex = currentIndex - 1;
      return nextIndex < 0 ? galleryIndexLimit : nextIndex;
    });
  };

  const goToNextPhoto = () => {
    setActivePhotoIndex((currentIndex) => {
      const nextIndex = currentIndex + 1;
      return nextIndex > galleryIndexLimit ? 0 : nextIndex;
    });
  };

  const goToPreviousRelated = () => {
    setRelatedActiveIndex((currentIndex) => {
      const nextIndex = currentIndex - 1;
      return nextIndex < 0 ? relatedMaxIndex : nextIndex;
    });
  };

  const goToNextRelated = () => {
    setRelatedActiveIndex((currentIndex) => {
      const nextIndex = currentIndex + 1;
      return nextIndex > relatedMaxIndex ? 0 : nextIndex;
    });
  };

  const scrollToReservationForm = () => {
    if (typeof window === "undefined") {
      return;
    }

    const target =
      document.getElementById("vehicle-reservation-heading") ||
      document.getElementById("contact");

    if (!target) {
      return;
    }

    const stickyHeader = document.querySelector(".vehica-menu__wrapper");
    const headerOffset = Math.ceil(
      stickyHeader?.getBoundingClientRect().height || 100
    );
    const targetTop = Math.max(
      window.scrollY + target.getBoundingClientRect().top - headerOffset - 12,
      0
    );

    window.scrollTo({
      top: targetTop,
      behavior: "smooth"
    });
  };

  if (isLoading) {
    return (
      <main className="rentzo-single-car-page">
        <section className="vehicles-empty">
          <p className="status-message">Chargement du vehicule...</p>
        </section>
      </main>
    );
  }

  if (!vehicle) {
    return (
      <main className="rentzo-single-car-page">
        <section className="vehicles-empty">
          <div className="vehicles-empty__card">
            <h1>{content.notFoundMessage}</h1>
            <p>{errorMessage || content.detailErrorMessage}</p>
            <button type="button" className="vehicle-detail__back" onClick={onBackClick}>
              {content.backToListLabel}
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="rentzo-single-car-page">
      <section className="rentzo-single-car__top-actions">
        <div className="rentzo-single-car__container">
          <button type="button" className="vehicle-detail__back" onClick={onBackClick}>
            {content.backToListLabel}
          </button>
        </div>
      </section>

      <section className="rentzo-single-car__gallery-section">
        <div className="rentzo-single-car__container">
          <div className={galleryClassName}>
            <div className="vehica-swiper-container">
              <div className="vehica-swiper-wrapper" style={galleryTrackStyle}>
                {photoUrls.map((photoUrl, index) => (
                  <div key={photoUrl + "-" + index} className="vehica-gallery-v3__slide">
                    <div className="vehica-gallery-v3__image-wrapper">
                      <img
                        className="vehica-gallery-v3__image"
                        src={photoUrl}
                        alt={vehicleTitle + " " + (index + 1)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {photoUrls.length > 2 ? (
              <div className="vehica-gallery-v3__arrows">
                <button
                  type="button"
                  className="vehica-gallery-v3__arrow vehica-gallery-v3__arrow--left"
                  onClick={goToPreviousPhoto}
                  aria-label="Photo precedente"
                >
                  <i className="fas fa-chevron-left"></i>
                </button>

                <button
                  type="button"
                  className="vehica-gallery-v3__arrow vehica-gallery-v3__arrow--right"
                  onClick={goToNextPhoto}
                  aria-label="Photo suivante"
                >
                  <i className="fas fa-chevron-right"></i>
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="rentzo-single-car__divider-section">
        <div className="rentzo-single-car__container">
          <div className="elementor-divider">
            <span className="elementor-divider-separator"></span>
          </div>
        </div>
      </section>

      {errorMessage ? (
        <section className="vehicle-detail-page__banner">
          <div className="rentzo-single-car__container">
            <p className="login-form__message login-form__message--error">{errorMessage}</p>
          </div>
        </section>
      ) : null}

      <section className="rentzo-single-car__overview-section">
        <div className="rentzo-single-car__container">
          <div className="rentzo-single-car__columns">
            <div className="rentzo-single-car__main-column">
              <div className="rentzo-single-car__title-box">
                <h1 className="vehica-car-name">{vehicleTitle}</h1>
              </div>

              {currentAdmin && vehicle.availabilityStatus === "maintenance" ? (
                <div className="rentzo-single-car__status rentzo-single-car__status--maintenance">
                  <span className="vehicle-card__badge">{content.maintenanceBadge}</span>
                  <p>{content.maintenanceDescription}</p>
                </div>
              ) : null}

              {currentAdmin && vehicle.availabilityStatus === "reserved" ? (
                <div className="rentzo-single-car__status rentzo-single-car__status--reserved">
                  <span className="vehicle-card__badge">{content.availabilityReservedLabel}</span>
                  <p>
                    Ce vehicule est deja reserve sur certaines dates. Les creneaux indisponibles
                    restent bloques dans le calendrier de reservation.
                  </p>
                </div>
              ) : null}

              <section className="rentzo-single-car__section rentzo-single-car__section--mobile-prices">
                <h2 className="elementor-heading-title elementor-size-default rentzo-single-car__panel-title">
                  {content.detailPriceTitle}
                </h2>
                <div className="elementor-divider">
                  <span className="elementor-divider-separator"></span>
                </div>

                <div className="rentzo-single-car__price-stack">
                  <div className="rentzo-single-car__price-card rentzo-single-car__price-card--dark">
                    <div className="vehica-car-price">{monthlyPriceText}</div>
                  </div>

                  <div className="rentzo-single-car__price-secondary">
                    <div className="rentzo-single-car__price-secondary-item">
                      <div className="vehica-car-price">{weeklyPriceText}</div>
                    </div>

                    <div className="rentzo-single-car__price-secondary-item">
                      <div className="vehica-car-price">{dailyPriceText}</div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="rentzo-single-car__section">
                <h2 className="elementor-heading-title elementor-size-default">
                  {content.detailVehicleDataTitle}
                </h2>
                <div className="elementor-divider">
                  <span className="elementor-divider-separator"></span>
                </div>

                <div className="rentzo-single-car__attributes-panel">
                  <div className="rentzo-single-car__attributes-inner vehica-app vehica-car-attributes">
                    <div className="vehica-car-attributes-grid vehica-grid rentzo-single-car__attributes-grid">
                      {detailAttributes.map((attribute) => (
                        <div
                          key={attribute.label}
                          className="vehica-grid__element vehica-grid__element--1of2 vehica-grid__element--tablet-1of2 vehica-grid__element--mobile-1of1 rentzo-single-car__attribute"
                        >
                          <div className="vehica-grid rentzo-single-car__attribute-inner">
                            <div className="vehica-car-attributes__name vehica-grid__element--1of2">
                              {attribute.label}:
                            </div>
                            <div className="vehica-car-attributes__values vehica-grid__element--1of2">
                              {attribute.value}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              <section className="rentzo-single-car__section rentzo-single-car__section--video">
                <h2 className="elementor-heading-title elementor-size-default">
                  {content.detailVideoTitle}
                </h2>
                <div className="elementor-divider">
                  <span className="elementor-divider-separator"></span>
                </div>

                {vehicle.videoUrl ? (
                  <div className="rentzo-single-car__video-box">
                    <div className="vehica-car-embed-wrapper">
                      <div className="vehica-car-embed">
                        <div className="vehica-car-embed__inner">
                          <VehicleVideo
                            src={vehicle.videoUrl}
                            title={content.detailVideoTitle + " " + vehicleTitle}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rentzo-single-car__video-spacer" aria-hidden="true"></div>
                )}
              </section>

              <section className="rentzo-single-car__section rentzo-single-car__section--quality">
                <div className="vehica-heading">
                  <h3 className="vehica-heading__title">{content.detailQualityTitle}</h3>
                  <div className="vehica-heading__text">
                    {content.detailQualityTextLine1}
                    <br />
                    <span>{content.detailQualityTextHighlight}</span>
                  </div>
                </div>

                <div className="vehica-features rentzo-single-car__features-list">
                  {content.detailFeatureItems.map((item) => (
                    <div key={item.title} className="vehica-features__feature">
                      <DetailFeatureIcon icon={item.icon} />

                      <div className="vehica-features__content">
                        <div className="vehica-features__label">{item.title}</div>
                        <div className="vehica-features__text">{item.text}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="elementor-button-wrapper rentzo-single-car__faq-button-wrapper">
                  <a
                    className="elementor-button elementor-button-link elementor-size-sm"
                    href="/foire-aux-questions"
                  >
                    <span className="elementor-button-content-wrapper">
                      <span className="elementor-button-icon">
                        <i className="fas fa-step-forward"></i>
                      </span>
                      <span className="elementor-button-text">{content.detailFaqButtonLabel}</span>
                    </span>
                  </a>
                </div>
              </section>
            </div>

            <aside className="rentzo-single-car__sidebar-column">
              <div className="rentzo-single-car__sidebar-panel rentzo-single-car__sidebar-panel--price">
                <h2 className="elementor-heading-title elementor-size-default rentzo-single-car__panel-title">
                  {content.detailPriceTitle}
                </h2>
                <div className="elementor-divider">
                  <span className="elementor-divider-separator"></span>
                </div>

                <div className="rentzo-single-car__sidebar-prices">
                  <div className="rentzo-single-car__price-card rentzo-single-car__price-card--dark">
                    <div className="vehica-car-price">{monthlyPriceText}</div>
                  </div>

                  <div className="rentzo-single-car__price-secondary">
                    <div className="rentzo-single-car__price-secondary-item">
                      <div className="vehica-car-price">{weeklyPriceText}</div>
                    </div>

                    <div className="rentzo-single-car__price-secondary-item">
                      <div className="vehica-car-price">{dailyPriceText}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rentzo-single-car__sidebar-panel">
                <h2 className="elementor-heading-title elementor-size-default rentzo-single-car__panel-title">
                  {content.detailConditionsTitle}
                </h2>
                <div className="elementor-divider">
                  <span className="elementor-divider-separator"></span>
                </div>

                <div className="vehica-car-description rentzo-single-car__conditions-copy">
                  <p className="rentzo-single-car__conditions-heading">
                    <strong>{content.detailSecurityDepositHeading}</strong>
                  </p>
                  <ul className="rentzo-single-car__conditions-list">
                    <li>{securityDepositText}</li>
                  </ul>

                  <p className="rentzo-single-car__conditions-spacer" aria-hidden="true"></p>

                  <p className="rentzo-single-car__conditions-heading">
                    <strong>{content.detailAllowedMileageHeading}</strong>
                  </p>
                  <ul className="rentzo-single-car__conditions-list">
                    <li>{includedMileageText}</li>
                    <li>{extraMileageText}</li>
                  </ul>

                  <p className="rentzo-single-car__conditions-spacer" aria-hidden="true"></p>

                  <p className="rentzo-single-car__conditions-note">{content.globalPricingDescription}</p>
                </div>
              </div>

              {!currentAdmin ? (
                <div className="rentzo-single-car__sidebar-panel rentzo-single-car__sidebar-panel--actions">
                  <div className="elementor-button-wrapper rentzo-single-car__reserve-button-wrapper">
                    <button
                      type="button"
                      className="elementor-button elementor-size-sm"
                      onClick={scrollToReservationForm}
                    >
                      <span className="elementor-button-content-wrapper">
                        <span className="elementor-button-icon">
                          <i className="fas fa-comments"></i>
                        </span>
                        <span className="elementor-button-text">{content.reserveFormLabel}</span>
                      </span>
                    </button>
                  </div>

                  <div className="vehica-whats-app-button">
                    <a href={whatsappUrl} target="_blank" rel="noreferrer">
                      <i className="fab fa-whatsapp"></i>
                      {content.reserveWhatsappLabel}
                    </a>
                  </div>
                </div>
              ) : (
                <div className="rentzo-single-car__sidebar-panel rentzo-single-car__sidebar-panel--actions">
                  <div className="rentzo-single-car__admin-actions">
                    <button type="button" className="login-form__submit" onClick={onEditClick}>
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
                </div>
              )}
            </aside>
          </div>
        </div>
      </section>

      {!currentAdmin ? (
        <section className="rentzo-single-car__contact-section">
          <div className="rentzo-single-car__container">
            <div className="rentzo-single-car__columns rentzo-single-car__columns--contact">
              <div className="rentzo-single-car__contact-form-column">
                <h3
                  id="vehicle-reservation-heading"
                  className="elementor-heading-title elementor-size-default"
                >
                  {content.detailReservationFormTitle}
                </h3>
                <VehicleReservationForm
                  content={content}
                  vehicle={vehicle}
                  hideActionButtons={true}
                  hideIntro={true}
                />
              </div>

              <div className="rentzo-single-car__contact-copy-column">
                <AnimatedReservationHeadline
                  startText={content.detailAnimatedHeadlineStart}
                  accentText={content.detailAnimatedHeadlineAccent}
                />
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {relatedVehicles.length > 0 ? (
        <section className="rentzo-single-car__related-section">
          <div className="rentzo-single-car__container">
            <div className="vehica-app">
              <h3 className="vehica-section-label">{content.detailRelatedTitle}</h3>

              <div className={"vehica-car-tabs-carousel rentzo-single-car__related-carousel vehica-carousel-v1--cars-" + relatedVehicles.length}>
                <div className="vehica-carousel-v1">
                  <div className="vehica-carousel__swiper" ref={relatedTrackRef}>
                    <div className="vehica-swiper-container">
                      <div className="vehica-swiper-wrapper" style={relatedTrackStyle}>
                        {relatedVehicles.map((relatedVehicle) => (
                          <div
                            key={relatedVehicle.id}
                            className="vehica-swiper-slide vehica-carousel-v1__slide"
                            style={relatedSlideStyle}
                          >
                            <RelatedVehicleCard
                              content={content}
                              vehicle={relatedVehicle}
                              onOpen={() => onVehicleClick(relatedVehicle.id)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {relatedMaxIndex > 0 ? (
                    <div className="vehica-carousel-v1__arrows">
                      <button
                        type="button"
                        className="vehica-carousel__arrow vehica-carousel__arrow--left"
                        onClick={goToPreviousRelated}
                        aria-label="Vehicule precedent"
                      ></button>
                      <button
                        type="button"
                        className="vehica-carousel__arrow vehica-carousel__arrow--right"
                        onClick={goToNextRelated}
                        aria-label="Vehicule suivant"
                      ></button>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : null}
    </main>
  );
}

export default VehicleDetailPage;
