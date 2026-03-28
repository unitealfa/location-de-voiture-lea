import { useEffect, useState } from "react";
import {
  getAdminVisualSettings,
  getCachedVisualSettings,
  saveAdminVisualSettings,
  uploadAdminVisualImage
} from "../services/contentService";
import { listVehicles, readCachedVehicleList } from "../services/vehicleService";
import { useRef } from "react";

const DEFAULT_FORM = {
  faviconImagePath: "",
  headerLogoImagePath: "",
  footerLogoImagePath: "",
  homeHeroImagePath: "",
  homeEyebrow: "",
  homeTitle: "",
  homeFeatureRentalLabel: "",
  homeFeatureRentalText: "",
  homeFeatureContactLabel: "",
  homeFeatureContactText: "",
  homeFleetTitle: "",
  homeCarHotelImagePath: "",
  homeCarHotelTitle: "",
  homeCarHotelDescription: "",
  homeCarHotelServicesTitle: "",
  homeCarHotelService1: "",
  homeCarHotelService2: "",
  homeCarHotelService3: "",
  homeCarHotelService4: "",
  homeTestimonialsTitle: "",
  homeTestimonialsHighlight: "",
  homeTestimonialsTextLine1: "",
  homeTestimonialsTextLine2: "",
  homeTestimonial1Text: "",
  homeTestimonial1Name: "",
  homeTestimonial1Role: "",
  homeTestimonial2Text: "",
  homeTestimonial2Name: "",
  homeTestimonial2Role: "",
  homeTestimonial3Text: "",
  homeTestimonial3Name: "",
  homeTestimonial3Role: "",
  homeTestimonial4Text: "",
  homeTestimonial4Name: "",
  homeTestimonial4Role: "",
  homeTestimonial5Text: "",
  homeTestimonial5Name: "",
  homeTestimonial5Role: "",
  homeConvertiblesTitle: "",
  homeConvertibleVehicleIds: [],
  faqHeroImagePath: "",
  faqHeroTitleStart: "",
  faqHeroTitleAccent: "",
  faqHeroSubtitle: "",
  faqPageTitle: "",
  faqContactButtonLabel: "",
  faqLeftQuestion1: "",
  faqLeftAnswer1: "",
  faqLeftQuestion2: "",
  faqLeftAnswer2: "",
  faqLeftQuestion3: "",
  faqLeftAnswer3: "",
  faqLeftQuestion4: "",
  faqLeftAnswer4: "",
  faqLeftQuestion5: "",
  faqLeftAnswer5: "",
  faqLeftQuestion6: "",
  faqLeftAnswer6: "",
  faqRightQuestion1: "",
  faqRightAnswer1: "",
  faqRightQuestion2: "",
  faqRightAnswer2: "",
  faqRightQuestion3: "",
  faqRightAnswer3: "",
  faqRightQuestion4: "",
  faqRightAnswer4: "",
  faqRightQuestion5: "",
  faqRightAnswer5: "",
  faqRightQuestion6: "",
  faqRightAnswer6: "",
  contactHoursTitle: "",
  contactHoursSubtitle: "",
  contactHoursDay1: "",
  contactHoursValue1: "",
  contactHoursDay2: "",
  contactHoursValue2: "",
  contactHoursDay3: "",
  contactHoursValue3: "",
  contactHoursDay4: "",
  contactHoursValue4: "",
  contactHoursDay5: "",
  contactHoursValue5: "",
  contactHoursDay6: "",
  contactHoursValue6: "",
  contactHoursDay7: "",
  contactHoursValue7: "",
  contactMapQuery: "",
  contactMapLinkUrl: "",
  contactMapLatitude: "",
  contactMapLongitude: "",
  contactHeroImagePath: "",
  contactHeroTitleStart: "",
  contactHeroTitleAccent: "",
  contactHeroSubtitle: "",
  footerShortInfo: "",
  footerPhoneValue: "",
  footerEmailValue: "",
  footerLocationValue: "",
  footerAddressValue: "",
  footerFacebookUrl: "#",
  footerInstagramUrl: "#"
};

function buildInitialForm(settings, content) {
  const aceulle = content?.aceulle || {};
  const brand = content?.brand || {};
  const footer = content?.footer || {};
  const faqPage = content?.faqPage || {};
  const contactPage = content?.contactPage || {};

  return {
    ...DEFAULT_FORM,
    faviconImagePath: brand.faviconImagePath || brand.logoImagePath || "",
    headerLogoImagePath: brand.logoImagePath || "",
    footerLogoImagePath: footer.logoImagePath || brand.logoImagePath || "",
    homeHeroImagePath: aceulle.heroImagePath || "",
    homeEyebrow: aceulle.eyebrow || "",
    homeTitle: aceulle.title || "",
    homeFeatureRentalLabel: aceulle.featureRentalLabel || "",
    homeFeatureRentalText: aceulle.featureRentalText || "",
    homeFeatureContactLabel: aceulle.featureContactLabel || "",
    homeFeatureContactText: aceulle.featureContactText || "",
    homeFleetTitle: aceulle.fleetTitle || "",
    homeCarHotelImagePath: aceulle.carHotelImagePath || "",
    homeCarHotelTitle: aceulle.carHotelTitle || "",
    homeCarHotelDescription: aceulle.carHotelDescription || "",
    homeCarHotelServicesTitle: aceulle.carHotelServicesTitle || "",
    homeCarHotelService1: aceulle.carHotelServices?.[0] || "",
    homeCarHotelService2: aceulle.carHotelServices?.[1] || "",
    homeCarHotelService3: aceulle.carHotelServices?.[2] || "",
    homeCarHotelService4: aceulle.carHotelServices?.[3] || "",
    homeTestimonialsTitle: aceulle.testimonialsTitle || "",
    homeTestimonialsHighlight: aceulle.testimonialsHighlight || "",
    homeTestimonialsTextLine1: aceulle.testimonialsTextLine1 || "",
    homeTestimonialsTextLine2: aceulle.testimonialsTextLine2 || "",
    homeTestimonial1Text: aceulle.testimonialsItems?.[0]?.text || "",
    homeTestimonial1Name: aceulle.testimonialsItems?.[0]?.name || "",
    homeTestimonial1Role: aceulle.testimonialsItems?.[0]?.title || "",
    homeTestimonial2Text: aceulle.testimonialsItems?.[1]?.text || "",
    homeTestimonial2Name: aceulle.testimonialsItems?.[1]?.name || "",
    homeTestimonial2Role: aceulle.testimonialsItems?.[1]?.title || "",
    homeTestimonial3Text: aceulle.testimonialsItems?.[2]?.text || "",
    homeTestimonial3Name: aceulle.testimonialsItems?.[2]?.name || "",
    homeTestimonial3Role: aceulle.testimonialsItems?.[2]?.title || "",
    homeTestimonial4Text: aceulle.testimonialsItems?.[3]?.text || "",
    homeTestimonial4Name: aceulle.testimonialsItems?.[3]?.name || "",
    homeTestimonial4Role: aceulle.testimonialsItems?.[3]?.title || "",
    homeTestimonial5Text: aceulle.testimonialsItems?.[4]?.text || "",
    homeTestimonial5Name: aceulle.testimonialsItems?.[4]?.name || "",
    homeTestimonial5Role: aceulle.testimonialsItems?.[4]?.title || "",
    homeConvertiblesTitle: aceulle.convertiblesTitle || "",
    homeConvertibleVehicleIds: Array.isArray(aceulle.convertibleVehicleIds)
      ? aceulle.convertibleVehicleIds.map((id) => Number(id)).filter((id) => Number.isInteger(id))
      : [],
    faqHeroImagePath: faqPage.heroImagePath || "",
    faqHeroTitleStart: faqPage.heroTitleStart || "",
    faqHeroTitleAccent: faqPage.heroTitleAccent || "",
    faqHeroSubtitle: faqPage.heroSubtitle || "",
    faqPageTitle: faqPage.pageTitle || "",
    faqContactButtonLabel: faqPage.contactButtonLabel || "",
    faqLeftQuestion1: faqPage.leftItems?.[0]?.question || "",
    faqLeftAnswer1: faqPage.leftItems?.[0]?.answer || "",
    faqLeftQuestion2: faqPage.leftItems?.[1]?.question || "",
    faqLeftAnswer2: faqPage.leftItems?.[1]?.answer || "",
    faqLeftQuestion3: faqPage.leftItems?.[2]?.question || "",
    faqLeftAnswer3: faqPage.leftItems?.[2]?.answer || "",
    faqLeftQuestion4: faqPage.leftItems?.[3]?.question || "",
    faqLeftAnswer4: faqPage.leftItems?.[3]?.answer || "",
    faqLeftQuestion5: faqPage.leftItems?.[4]?.question || "",
    faqLeftAnswer5: faqPage.leftItems?.[4]?.answer || "",
    faqLeftQuestion6: faqPage.leftItems?.[5]?.question || "",
    faqLeftAnswer6: faqPage.leftItems?.[5]?.answer || "",
    faqRightQuestion1: faqPage.rightItems?.[0]?.question || "",
    faqRightAnswer1: faqPage.rightItems?.[0]?.answer || "",
    faqRightQuestion2: faqPage.rightItems?.[1]?.question || "",
    faqRightAnswer2: faqPage.rightItems?.[1]?.answer || "",
    faqRightQuestion3: faqPage.rightItems?.[2]?.question || "",
    faqRightAnswer3: faqPage.rightItems?.[2]?.answer || "",
    faqRightQuestion4: faqPage.rightItems?.[3]?.question || "",
    faqRightAnswer4: faqPage.rightItems?.[3]?.answer || "",
    faqRightQuestion5: faqPage.rightItems?.[4]?.question || "",
    faqRightAnswer5: faqPage.rightItems?.[4]?.answer || "",
    faqRightQuestion6: faqPage.rightItems?.[5]?.question || "",
    faqRightAnswer6: faqPage.rightItems?.[5]?.answer || "",
    contactHoursTitle: contactPage.hoursTitle || "",
    contactHoursSubtitle: contactPage.hoursSubtitle || "",
    contactHoursDay1: contactPage.hoursItems?.[0]?.day || "",
    contactHoursValue1: contactPage.hoursItems?.[0]?.value || "",
    contactHoursDay2: contactPage.hoursItems?.[1]?.day || "",
    contactHoursValue2: contactPage.hoursItems?.[1]?.value || "",
    contactHoursDay3: contactPage.hoursItems?.[2]?.day || "",
    contactHoursValue3: contactPage.hoursItems?.[2]?.value || "",
    contactHoursDay4: contactPage.hoursItems?.[3]?.day || "",
    contactHoursValue4: contactPage.hoursItems?.[3]?.value || "",
    contactHoursDay5: contactPage.hoursItems?.[4]?.day || "",
    contactHoursValue5: contactPage.hoursItems?.[4]?.value || "",
    contactHoursDay6: contactPage.hoursItems?.[5]?.day || "",
    contactHoursValue6: contactPage.hoursItems?.[5]?.value || "",
    contactHoursDay7: contactPage.hoursItems?.[6]?.day || "",
    contactHoursValue7: contactPage.hoursItems?.[6]?.value || "",
    contactMapQuery: contactPage.mapQuery || "",
    contactMapLinkUrl: contactPage.mapLinkUrl || "",
    contactMapLatitude: String(contactPage.mapLatitude || ""),
    contactMapLongitude: String(contactPage.mapLongitude || ""),
    contactHeroImagePath: contactPage.heroImagePath || "",
    contactHeroTitleStart: contactPage.heroTitleStart || "",
    contactHeroTitleAccent: contactPage.heroTitleAccent || "",
    contactHeroSubtitle: contactPage.heroSubtitle || "",
    footerShortInfo: footer.shortInfo || "",
    footerPhoneValue: footer.phoneValue || "",
    footerEmailValue: footer.emailValue || "",
    footerLocationValue: footer.locationValue || "",
    footerAddressValue: footer.addressValue || "",
    footerFacebookUrl: footer.facebookUrl || "#",
    footerInstagramUrl: footer.instagramUrl || "#",
    ...(settings || {})
  };
}

function normalizeFormValues(formValues, content) {
  const baseValues = buildInitialForm({}, content);
  const nextValues = {
    ...baseValues,
    ...(formValues || {})
  };

  if (typeof nextValues.homeConvertibleVehicleIds === "string") {
    try {
      const parsedValue = JSON.parse(nextValues.homeConvertibleVehicleIds);
      nextValues.homeConvertibleVehicleIds = Array.isArray(parsedValue)
        ? parsedValue.map((id) => Number(id)).filter((id) => Number.isInteger(id))
        : [];
    } catch (error) {
      nextValues.homeConvertibleVehicleIds = [];
    }
  }

  if (!Array.isArray(nextValues.homeConvertibleVehicleIds)) {
    nextValues.homeConvertibleVehicleIds = [];
  }

  return nextValues;
}

function PreviewCard({ title, children }) {
  return (
    <section className="admin-visual-page__preview-card">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function ImageDropField({
  label,
  value,
  previewSrc,
  slot,
  isUploading,
  onUpload
}) {
  const inputRef = useRef(null);

  const handleFiles = async (files) => {
    const file = files?.[0];

    if (!file) {
      return;
    }

    await onUpload(file, slot, value);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div className="admin-visual-page__media-field">
      <div className="admin-visual-page__media-label">{label}</div>

      <div
        className={"admin-visual-page__upload-dropzone" + (isUploading ? " admin-visual-page__upload-dropzone--busy" : "")}
        onDragOver={(event) => {
          event.preventDefault();
        }}
        onDrop={(event) => {
          event.preventDefault();
          handleFiles(event.dataTransfer.files);
        }}
      >
        <div className="admin-visual-page__upload-preview">
          <img src={previewSrc} alt={label} />
        </div>

        <div className="admin-visual-page__upload-content">
          <strong>{isUploading ? "Envoi en cours..." : "Selectionner ou glisser une image"}</strong>
          <span>PNG, JPG, WEBP ou autre image compatible.</span>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="admin-visual-page__upload-input"
          onChange={(event) => handleFiles(event.target.files)}
        />

        <button
          type="button"
          className="admin-visual-page__upload-button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
        >
          Selectionner
        </button>
      </div>
    </div>
  );
}

function buildNextContent(currentContent, formValues) {
  const nextContent = JSON.parse(JSON.stringify(currentContent || {}));
  const nextBrandLogo = formValues.headerLogoImagePath || nextContent.brand?.logoImagePath || "";
  const nextFooterLogo = formValues.footerLogoImagePath || nextContent.footer?.logoImagePath || nextBrandLogo;

  nextContent.brand = {
    ...(nextContent.brand || {}),
    logoImagePath: nextBrandLogo,
    faviconImagePath: formValues.faviconImagePath || nextBrandLogo
  };

  nextContent.aceulle = {
    ...(nextContent.aceulle || {}),
    heroImagePath: formValues.homeHeroImagePath || nextContent.aceulle?.heroImagePath || "",
    eyebrow: formValues.homeEyebrow,
    title: formValues.homeTitle,
    featureRentalLabel: formValues.homeFeatureRentalLabel,
    featureRentalText: formValues.homeFeatureRentalText,
    featureContactLabel: formValues.homeFeatureContactLabel,
    featureContactText: formValues.homeFeatureContactText,
    fleetTitle: formValues.homeFleetTitle,
    carHotelImagePath: formValues.homeCarHotelImagePath || nextContent.aceulle?.carHotelImagePath || "",
    carHotelTitle: formValues.homeCarHotelTitle,
    carHotelDescription: formValues.homeCarHotelDescription,
    carHotelServicesTitle: formValues.homeCarHotelServicesTitle,
    carHotelServices: [
      formValues.homeCarHotelService1,
      formValues.homeCarHotelService2,
      formValues.homeCarHotelService3,
      formValues.homeCarHotelService4
    ].filter(Boolean),
    testimonialsTitle: formValues.homeTestimonialsTitle,
    testimonialsHighlight: formValues.homeTestimonialsHighlight,
    testimonialsTextLine1: formValues.homeTestimonialsTextLine1,
    testimonialsTextLine2: formValues.homeTestimonialsTextLine2,
    testimonialsItems: [
      {
        text: formValues.homeTestimonial1Text,
        name: formValues.homeTestimonial1Name,
        title: formValues.homeTestimonial1Role
      },
      {
        text: formValues.homeTestimonial2Text,
        name: formValues.homeTestimonial2Name,
        title: formValues.homeTestimonial2Role
      },
      {
        text: formValues.homeTestimonial3Text,
        name: formValues.homeTestimonial3Name,
        title: formValues.homeTestimonial3Role
      },
      {
        text: formValues.homeTestimonial4Text,
        name: formValues.homeTestimonial4Name,
        title: formValues.homeTestimonial4Role
      },
      {
        text: formValues.homeTestimonial5Text,
        name: formValues.homeTestimonial5Name,
        title: formValues.homeTestimonial5Role
      }
    ].filter((item) => item.text || item.name || item.title),
    convertiblesTitle: formValues.homeConvertiblesTitle,
    convertibleVehicleIds: Array.isArray(formValues.homeConvertibleVehicleIds)
      ? formValues.homeConvertibleVehicleIds.map((id) => Number(id)).filter((id) => Number.isInteger(id))
      : []
  };

  nextContent.footer = {
    ...(nextContent.footer || {}),
    logoImagePath: nextFooterLogo,
    shortInfo: formValues.footerShortInfo,
    phoneValue: formValues.footerPhoneValue,
    emailValue: formValues.footerEmailValue,
    locationValue: formValues.footerLocationValue,
    addressValue: formValues.footerAddressValue,
    facebookUrl: formValues.footerFacebookUrl,
    instagramUrl: formValues.footerInstagramUrl
  };

  nextContent.faqPage = {
    ...(nextContent.faqPage || {}),
    heroImagePath: formValues.faqHeroImagePath || nextContent.faqPage?.heroImagePath || "",
    heroTitleStart: formValues.faqHeroTitleStart,
    heroTitleAccent: formValues.faqHeroTitleAccent,
    heroSubtitle: formValues.faqHeroSubtitle,
    pageTitle: formValues.faqPageTitle,
    contactButtonLabel: formValues.faqContactButtonLabel,
    leftItems: [
      { question: formValues.faqLeftQuestion1, answer: formValues.faqLeftAnswer1 },
      { question: formValues.faqLeftQuestion2, answer: formValues.faqLeftAnswer2 },
      { question: formValues.faqLeftQuestion3, answer: formValues.faqLeftAnswer3 },
      { question: formValues.faqLeftQuestion4, answer: formValues.faqLeftAnswer4 },
      { question: formValues.faqLeftQuestion5, answer: formValues.faqLeftAnswer5 },
      { question: formValues.faqLeftQuestion6, answer: formValues.faqLeftAnswer6 }
    ],
    rightItems: [
      { question: formValues.faqRightQuestion1, answer: formValues.faqRightAnswer1 },
      { question: formValues.faqRightQuestion2, answer: formValues.faqRightAnswer2 },
      { question: formValues.faqRightQuestion3, answer: formValues.faqRightAnswer3 },
      { question: formValues.faqRightQuestion4, answer: formValues.faqRightAnswer4 },
      { question: formValues.faqRightQuestion5, answer: formValues.faqRightAnswer5 },
      { question: formValues.faqRightQuestion6, answer: formValues.faqRightAnswer6 }
    ]
  };

  nextContent.contactPage = {
    ...(nextContent.contactPage || {}),
    heroImagePath: formValues.contactHeroImagePath || nextContent.contactPage?.heroImagePath || "",
    heroTitleStart: formValues.contactHeroTitleStart,
    heroTitleAccent: formValues.contactHeroTitleAccent,
    heroSubtitle: formValues.contactHeroSubtitle,
    hoursTitle: formValues.contactHoursTitle,
    hoursSubtitle: formValues.contactHoursSubtitle,
    hoursItems: [
      { day: formValues.contactHoursDay1, value: formValues.contactHoursValue1 },
      { day: formValues.contactHoursDay2, value: formValues.contactHoursValue2 },
      { day: formValues.contactHoursDay3, value: formValues.contactHoursValue3 },
      { day: formValues.contactHoursDay4, value: formValues.contactHoursValue4 },
      { day: formValues.contactHoursDay5, value: formValues.contactHoursValue5 },
      { day: formValues.contactHoursDay6, value: formValues.contactHoursValue6 },
      { day: formValues.contactHoursDay7, value: formValues.contactHoursValue7 }
    ],
    mapQuery: formValues.contactMapQuery,
    mapLinkUrl: formValues.contactMapLinkUrl,
    mapLatitude: formValues.contactMapLatitude,
    mapLongitude: formValues.contactMapLongitude
  };

  return nextContent;
}

function AdminVisualPage({ content, brand, header, footer, onContentSaved }) {
  const [formValues, setFormValues] = useState(() => normalizeFormValues(getCachedVisualSettings(), content));
  const [isLoading, setIsLoading] = useState(() => !getCachedVisualSettings() && !content);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingSlot, setUploadingSlot] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [vehicles, setVehicles] = useState(() => readCachedVehicleList({ adminView: true }));

  useEffect(() => {
    let isActive = true;

    const loadSettings = async () => {
      setIsLoading((currentValue) => (getCachedVisualSettings() ? false : currentValue));
      setErrorMessage("");

      try {
        const settings = await getAdminVisualSettings();

        if (!isActive) {
          return;
        }

        setFormValues(normalizeFormValues(settings, content));
      } catch (error) {
        if (!isActive) {
          return;
        }

        setErrorMessage(error.message || "Impossible de charger les reglages visuels.");
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    loadSettings();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    let isActive = true;

    const loadVehicles = async () => {
      try {
        const nextVehicles = await listVehicles({ adminView: true });

        if (!isActive) {
          return;
        }

        setVehicles(Array.isArray(nextVehicles) ? nextVehicles : []);
      } catch (error) {
        if (!isActive) {
          return;
        }

        setVehicles(readCachedVehicleList({ adminView: true }));
      }
    };

    loadVehicles();

    return () => {
      isActive = false;
    };
  }, []);

  const syncRealtimeContent = (nextFormValues) => {
    onContentSaved?.(buildNextContent(content, nextFormValues));
  };

  const handleChange = (key, value) => {
    setFormValues((current) => {
      const nextFormValues = {
        ...current,
        [key]: value
      };

      syncRealtimeContent(nextFormValues);
      return nextFormValues;
    });
  };

  const handleConvertibleVehicleToggle = (vehicleId) => {
    setFormValues((current) => {
      const currentIds = Array.isArray(current.homeConvertibleVehicleIds)
        ? current.homeConvertibleVehicleIds
        : [];
      const numericId = Number(vehicleId);
      const isSelected = currentIds.includes(numericId);
      const nextIds = isSelected
        ? currentIds.filter((id) => id !== numericId)
        : [...currentIds, numericId];
      const nextFormValues = {
        ...current,
        homeConvertibleVehicleIds: nextIds
      };

      syncRealtimeContent(nextFormValues);
      return nextFormValues;
    });
  };

  const handleUpload = async (file, slot, previousUrl) => {
    setUploadingSlot(slot);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await uploadAdminVisualImage({
        file,
        slot,
        previousUrl
      });

      const nextUrl = response.url || "";

      if (slot === "favicon") {
        handleChange("faviconImagePath", nextUrl);
      }

      if (slot === "header-logo") {
        handleChange("headerLogoImagePath", nextUrl);
      }

      if (slot === "footer-logo") {
        handleChange("footerLogoImagePath", nextUrl);
      }

      if (slot === "home-hero") {
        handleChange("homeHeroImagePath", nextUrl);
      }

      if (slot === "home-car-hotel") {
        handleChange("homeCarHotelImagePath", nextUrl);
      }

      if (slot === "faq-hero") {
        handleChange("faqHeroImagePath", nextUrl);
      }

      if (slot === "contact-hero") {
        handleChange("contactHeroImagePath", nextUrl);
      }
    } catch (error) {
      setErrorMessage(error.message || "Impossible d'envoyer l'image.");
    } finally {
      setUploadingSlot("");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await saveAdminVisualSettings(formValues);
      setFormValues(normalizeFormValues(response.settings, response.content || content));
      onContentSaved?.(response.content || buildNextContent(content, formValues));
      setSuccessMessage("Modifications enregistrees et appliquees directement sur le site.");
    } catch (error) {
      setErrorMessage(error.message || "Impossible d'enregistrer les reglages visuels.");
    } finally {
      setIsSaving(false);
    }
  };

  const previewHeaderLogo = formValues.headerLogoImagePath || brand.logoImagePath;
  const previewFooterLogo = formValues.footerLogoImagePath || footer.logoImagePath || previewHeaderLogo;
  const previewFavicon = formValues.faviconImagePath || previewHeaderLogo;
  const previewHomeHero = formValues.homeHeroImagePath || content.aceulle?.heroImagePath || "/home/rentzo-hero.jpg";
  const previewCarHotelImage = formValues.homeCarHotelImagePath || content.aceulle?.carHotelImagePath || "/home/rentzo-car-hotel.jpg";
  const previewFaqHero = formValues.faqHeroImagePath || content.faqPage?.heroImagePath || "/home/rentzo-contact-hero.jpg";
  const previewContactHero = formValues.contactHeroImagePath || content.contactPage?.heroImagePath || "/home/rentzo-contact-hero.jpg";
  const contactHoursPreview = [
    { day: formValues.contactHoursDay1, value: formValues.contactHoursValue1 },
    { day: formValues.contactHoursDay2, value: formValues.contactHoursValue2 },
    { day: formValues.contactHoursDay3, value: formValues.contactHoursValue3 },
    { day: formValues.contactHoursDay4, value: formValues.contactHoursValue4 },
    { day: formValues.contactHoursDay5, value: formValues.contactHoursValue5 },
    { day: formValues.contactHoursDay6, value: formValues.contactHoursValue6 },
    { day: formValues.contactHoursDay7, value: formValues.contactHoursValue7 }
  ].filter((item) => item.day || item.value);
  const previewFooterBrand = footer.brandValue || brand.name;
  const previewFooterAddress =
    formValues.footerAddressValue || [formValues.footerLocationValue || footer.locationValue, previewFooterBrand].filter(Boolean).join("\n");
  const previewFooterText =
    formValues.footerShortInfo ||
    footer.shortInfo ||
    `✔︎ ${previewFooterBrand}. Location de voitures de luxe à ${formValues.footerLocationValue || footer.locationValue}.`;
  const selectedConvertibleVehicles = (Array.isArray(formValues.homeConvertibleVehicleIds)
    ? formValues.homeConvertibleVehicleIds
    : []
  )
    .map((selectedId) => vehicles.find((vehicle) => Number(vehicle.id) === Number(selectedId)))
    .filter(Boolean);
  const testimonialPreviewItems = [
    {
      text: formValues.homeTestimonial1Text,
      name: formValues.homeTestimonial1Name,
      title: formValues.homeTestimonial1Role
    },
    {
      text: formValues.homeTestimonial2Text,
      name: formValues.homeTestimonial2Name,
      title: formValues.homeTestimonial2Role
    },
    {
      text: formValues.homeTestimonial3Text,
      name: formValues.homeTestimonial3Name,
      title: formValues.homeTestimonial3Role
    },
    {
      text: formValues.homeTestimonial4Text,
      name: formValues.homeTestimonial4Name,
      title: formValues.homeTestimonial4Role
    },
    {
      text: formValues.homeTestimonial5Text,
      name: formValues.homeTestimonial5Name,
      title: formValues.homeTestimonial5Role
    }
  ].filter((item) => item.text || item.name || item.title);

  if (isLoading) {
    return (
      <main className="admin-visual-page admin-visual-page--centered">
        <p className="status-message">Chargement de la page visuelle...</p>
      </main>
    );
  }

  return (
    <main className="admin-visual-page">
      <section className="admin-visual-page__hero">
        <p className="hero-card__eyebrow">Visuelle</p>
        <h1>Modifier le text</h1>
        <p className="hero-card__text">
          Modifiez ici le favicon, le logo du header, le logo du footer, les coordonnees et les liens sociaux, puis enregistrez pour les afficher sur le site.
        </p>
      </section>

      <div className="admin-visual-page__layout">
        <div className="admin-visual-page__preview-grid">
          <PreviewCard title="Favicon">
            <div className="admin-visual-page__favicon-preview">
              <img src={previewFavicon} alt="Favicon" />
            </div>
          </PreviewCard>

          <PreviewCard title="Header">
            <div className="admin-visual-page__header-preview">
              <img src={previewHeaderLogo} alt={brand.name} />
              <div className="admin-visual-page__header-links">
                {header.navigationItems.map((item) => (
                  <span key={item.path}>{item.label}</span>
                ))}
              </div>
            </div>
          </PreviewCard>

          <PreviewCard title="Accueil">
            <div className="admin-visual-page__home-preview">
              <div
                className="admin-visual-page__home-preview-media"
                style={{ backgroundImage: "url('" + previewHomeHero + "')" }}
              ></div>
              <div className="admin-visual-page__home-preview-copy">
                <strong>{formValues.homeEyebrow || content.aceulle?.eyebrow}</strong>
                <h3>{formValues.homeTitle || content.aceulle?.title}</h3>
                <div className="admin-visual-page__home-preview-feature">
                  <p>{formValues.homeFeatureRentalLabel || content.aceulle?.featureRentalLabel}</p>
                  <span>{formValues.homeFeatureRentalText || content.aceulle?.featureRentalText}</span>
                </div>
                <div className="admin-visual-page__home-preview-feature">
                  <p>{formValues.homeFeatureContactLabel || content.aceulle?.featureContactLabel}</p>
                  <span>{formValues.homeFeatureContactText || content.aceulle?.featureContactText}</span>
                </div>
                <em>{formValues.homeFleetTitle || content.aceulle?.fleetTitle}</em>
              </div>
            </div>
          </PreviewCard>

          <PreviewCard title="Hotel de voitures">
            <div className="admin-visual-page__home-preview">
              <div
                className="admin-visual-page__home-preview-media"
                style={{ backgroundImage: "url('" + previewCarHotelImage + "')" }}
              ></div>
              <div className="admin-visual-page__home-preview-copy">
                <strong>{formValues.homeCarHotelTitle || content.aceulle?.carHotelTitle}</strong>
                <span>{formValues.homeCarHotelDescription || content.aceulle?.carHotelDescription}</span>
                <p>{formValues.homeCarHotelServicesTitle || content.aceulle?.carHotelServicesTitle}</p>
                <div className="admin-visual-page__home-preview-feature">
                  <span>{formValues.homeCarHotelService1 || content.aceulle?.carHotelServices?.[0]}</span>
                  <span>{formValues.homeCarHotelService2 || content.aceulle?.carHotelServices?.[1]}</span>
                  <span>{formValues.homeCarHotelService3 || content.aceulle?.carHotelServices?.[2]}</span>
                  <span>{formValues.homeCarHotelService4 || content.aceulle?.carHotelServices?.[3]}</span>
                </div>
              </div>
            </div>
          </PreviewCard>

          <PreviewCard title="Avis clients">
            <div className="admin-visual-page__home-preview">
              <div className="admin-visual-page__home-preview-copy">
                <strong>{formValues.homeTestimonialsTitle || content.aceulle?.testimonialsTitle}</strong>
                <h3>
                  {formValues.homeTestimonialsHighlight || content.aceulle?.testimonialsHighlight}{" "}
                  {formValues.homeTestimonialsTextLine1 || content.aceulle?.testimonialsTextLine1}
                </h3>
                <span>{formValues.homeTestimonialsTextLine2 || content.aceulle?.testimonialsTextLine2}</span>
                <div className="admin-visual-page__testimonial-preview-list">
                  {testimonialPreviewItems.map((item, index) => (
                    <div key={item.name + "-" + index} className="admin-visual-page__testimonial-preview-item">
                      <p>{item.text}</p>
                      <strong>{item.name}</strong>
                      <span>{item.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </PreviewCard>

          <PreviewCard title="Cabriolets a louer">
            <div className="admin-visual-page__home-preview">
              <div className="admin-visual-page__home-preview-copy">
                <strong>{formValues.homeConvertiblesTitle || content.aceulle?.convertiblesTitle}</strong>
                <div className="admin-visual-page__vehicle-pill-list">
                  {selectedConvertibleVehicles.length > 0 ? (
                    selectedConvertibleVehicles.map((vehicle) => (
                      <span key={vehicle.id} className="admin-visual-page__vehicle-pill">
                        {vehicle.brand} {vehicle.model}
                      </span>
                    ))
                  ) : (
                    <span className="admin-visual-page__preview-empty">Aucun vehicule selectionne.</span>
                  )}
                </div>
              </div>
            </div>
          </PreviewCard>

          <PreviewCard title="Foire aux questions">
            <div className="admin-visual-page__home-preview">
              <div
                className="admin-visual-page__home-preview-media"
                style={{ backgroundImage: "url('" + previewFaqHero + "')" }}
              ></div>
              <div className="admin-visual-page__home-preview-copy">
                <strong>{formValues.faqHeroTitleStart || content.faqPage?.heroTitleStart}</strong>
                <h3>{formValues.faqHeroSubtitle || content.faqPage?.heroSubtitle}</h3>
                <p>{formValues.faqPageTitle || content.faqPage?.pageTitle}</p>
                <div className="admin-visual-page__testimonial-preview-list">
                  {[1, 2, 3].map((index) => (
                    <div key={"faq-preview-" + index} className="admin-visual-page__testimonial-preview-item">
                      <strong>{formValues["faqLeftQuestion" + index] || content.faqPage?.leftItems?.[index - 1]?.question}</strong>
                      <span>{formValues["faqLeftAnswer" + index] || content.faqPage?.leftItems?.[index - 1]?.answer}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </PreviewCard>

          <PreviewCard title="Contact - horaires et map">
            <div className="admin-visual-page__home-preview">
              <div
                className="admin-visual-page__home-preview-media"
                style={{ backgroundImage: "url('" + previewContactHero + "')" }}
              ></div>
              <div className="admin-visual-page__home-preview-copy">
                <strong>
                  {formValues.contactHeroTitleStart || content.contactPage?.heroTitleStart}{" "}
                  {formValues.contactHeroTitleAccent || content.contactPage?.heroTitleAccent}
                </strong>
                <h3>{formValues.contactHeroSubtitle || content.contactPage?.heroSubtitle}</h3>
                <strong>{formValues.contactHoursTitle || content.contactPage?.hoursTitle}</strong>
                <span>{formValues.contactHoursSubtitle || content.contactPage?.hoursSubtitle}</span>
                <div className="admin-visual-page__testimonial-preview-list">
                  {contactHoursPreview.map((item, index) => (
                    <div key={"contact-hours-preview-" + index} className="admin-visual-page__testimonial-preview-item">
                      <strong>{item.day}</strong>
                      <span>{item.value}</span>
                    </div>
                  ))}
                </div>
                <p>{formValues.contactMapLinkUrl || formValues.contactMapQuery || content.contactPage?.mapQuery}</p>
                {formValues.contactMapLatitude || formValues.contactMapLongitude ? (
                  <span>
                    {formValues.contactMapLatitude || "?"}, {formValues.contactMapLongitude || "?"}
                  </span>
                ) : null}
              </div>
            </div>
          </PreviewCard>

          <PreviewCard title="Footer">
            <div className="admin-visual-page__footer-preview">
              <img src={previewFooterLogo} alt={brand.name} />
              <p>{previewFooterText}</p>
              <div className="admin-visual-page__footer-meta">
                <span>{formValues.footerPhoneValue || footer.phoneValue}</span>
                <span>{formValues.footerEmailValue || footer.emailValue}</span>
                <span>{formValues.footerLocationValue || footer.locationValue}</span>
                <span>{previewFooterAddress}</span>
              </div>
              <div className="admin-visual-page__footer-socials">
                <span>Facebook</span>
                <span>Instagram</span>
              </div>
            </div>
          </PreviewCard>
        </div>

        <form className="admin-visual-page__form-card" onSubmit={handleSubmit}>
          <h2>Elements modifiables</h2>

          <ImageDropField
            label="Logo de l'onglet navigateur"
            value={formValues.faviconImagePath}
            previewSrc={previewFavicon}
            slot="favicon"
            isUploading={uploadingSlot === "favicon"}
            onUpload={handleUpload}
          />

          <ImageDropField
            label="Logo du header"
            value={formValues.headerLogoImagePath}
            previewSrc={previewHeaderLogo}
            slot="header-logo"
            isUploading={uploadingSlot === "header-logo"}
            onUpload={handleUpload}
          />

          <ImageDropField
            label="Logo du footer"
            value={formValues.footerLogoImagePath}
            previewSrc={previewFooterLogo}
            slot="footer-logo"
            isUploading={uploadingSlot === "footer-logo"}
            onUpload={handleUpload}
          />

          <ImageDropField
            label="Image d'accueil"
            value={formValues.homeHeroImagePath}
            previewSrc={previewHomeHero}
            slot="home-hero"
            isUploading={uploadingSlot === "home-hero"}
            onUpload={handleUpload}
          />

          <label className="login-form__field">
            <span>Texte haut d'accueil</span>
            <input
              type="text"
              value={formValues.homeEyebrow}
              onChange={(event) => handleChange("homeEyebrow", event.target.value)}
            />
          </label>

          <label className="login-form__field">
            <span>Titre d'accueil</span>
            <textarea
              rows="3"
              value={formValues.homeTitle}
              onChange={(event) => handleChange("homeTitle", event.target.value)}
            />
          </label>

          <label className="login-form__field">
            <span>Titre bloc location</span>
            <textarea
              rows="2"
              value={formValues.homeFeatureRentalLabel}
              onChange={(event) => handleChange("homeFeatureRentalLabel", event.target.value)}
            />
          </label>

          <label className="login-form__field">
            <span>Texte bloc location</span>
            <textarea
              rows="3"
              value={formValues.homeFeatureRentalText}
              onChange={(event) => handleChange("homeFeatureRentalText", event.target.value)}
            />
          </label>

          <label className="login-form__field">
            <span>Titre bloc contact</span>
            <textarea
              rows="2"
              value={formValues.homeFeatureContactLabel}
              onChange={(event) => handleChange("homeFeatureContactLabel", event.target.value)}
            />
          </label>

          <label className="login-form__field">
            <span>Texte bloc contact</span>
            <textarea
              rows="3"
              value={formValues.homeFeatureContactText}
              onChange={(event) => handleChange("homeFeatureContactText", event.target.value)}
            />
          </label>

          <label className="login-form__field">
            <span>Titre flotte accueil</span>
            <textarea
              rows="2"
              value={formValues.homeFleetTitle}
              onChange={(event) => handleChange("homeFleetTitle", event.target.value)}
            />
          </label>

          <label className="login-form__field">
            <span>Titre avis clients</span>
            <input
              type="text"
              value={formValues.homeTestimonialsTitle}
              onChange={(event) => handleChange("homeTestimonialsTitle", event.target.value)}
            />
          </label>

          <label className="login-form__field">
            <span>Texte mis en avant avis</span>
            <input
              type="text"
              value={formValues.homeTestimonialsHighlight}
              onChange={(event) => handleChange("homeTestimonialsHighlight", event.target.value)}
            />
          </label>

          <label className="login-form__field">
            <span>Ligne 1 avis</span>
            <input
              type="text"
              value={formValues.homeTestimonialsTextLine1}
              onChange={(event) => handleChange("homeTestimonialsTextLine1", event.target.value)}
            />
          </label>

          <label className="login-form__field">
            <span>Ligne 2 avis</span>
            <input
              type="text"
              value={formValues.homeTestimonialsTextLine2}
              onChange={(event) => handleChange("homeTestimonialsTextLine2", event.target.value)}
            />
          </label>

          {[1, 2, 3, 4, 5].map((index) => (
            <div key={"testimonial-editor-" + index} className="admin-visual-page__subsection">
              <h3>Avis client {index}</h3>

              <label className="login-form__field">
                <span>Texte avis {index}</span>
                <textarea
                  rows="4"
                  value={formValues["homeTestimonial" + index + "Text"]}
                  onChange={(event) => handleChange("homeTestimonial" + index + "Text", event.target.value)}
                />
              </label>

              <label className="login-form__field">
                <span>Nom client {index}</span>
                <input
                  type="text"
                  value={formValues["homeTestimonial" + index + "Name"]}
                  onChange={(event) => handleChange("homeTestimonial" + index + "Name", event.target.value)}
                />
              </label>

              <label className="login-form__field">
                <span>Role client {index}</span>
                <input
                  type="text"
                  value={formValues["homeTestimonial" + index + "Role"]}
                  onChange={(event) => handleChange("homeTestimonial" + index + "Role", event.target.value)}
                />
              </label>
            </div>
          ))}

          <label className="login-form__field">
            <span>Titre section cabriolets</span>
            <input
              type="text"
              value={formValues.homeConvertiblesTitle}
              onChange={(event) => handleChange("homeConvertiblesTitle", event.target.value)}
            />
          </label>

          <div className="admin-visual-page__subsection">
            <h3>Vehicules affiches sous les cabriolets</h3>
            <div className="admin-visual-page__vehicle-selector">
              {vehicles.map((vehicle) => {
                const isSelected = formValues.homeConvertibleVehicleIds.includes(Number(vehicle.id));

                return (
                  <label
                    key={vehicle.id}
                    className={
                      "admin-visual-page__vehicle-option" +
                      (isSelected ? " admin-visual-page__vehicle-option--selected" : "")
                    }
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleConvertibleVehicleToggle(vehicle.id)}
                    />
                    <span>{vehicle.brand} {vehicle.model} {vehicle.version}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <ImageDropField
            label="Image hotel de voitures"
            value={formValues.homeCarHotelImagePath}
            previewSrc={previewCarHotelImage}
            slot="home-car-hotel"
            isUploading={uploadingSlot === "home-car-hotel"}
            onUpload={handleUpload}
          />

          <ImageDropField
            label="Image hero FAQ"
            value={formValues.faqHeroImagePath}
            previewSrc={previewFaqHero}
            slot="faq-hero"
            isUploading={uploadingSlot === "faq-hero"}
            onUpload={handleUpload}
          />

          <label className="login-form__field">
            <span>Titre hero FAQ</span>
            <input
              type="text"
              value={formValues.faqHeroTitleStart}
              onChange={(event) => handleChange("faqHeroTitleStart", event.target.value)}
            />
          </label>

          <label className="login-form__field">
            <span>Accent titre hero FAQ</span>
            <input
              type="text"
              value={formValues.faqHeroTitleAccent}
              onChange={(event) => handleChange("faqHeroTitleAccent", event.target.value)}
            />
          </label>

          <label className="login-form__field">
            <span>Sous-titre hero FAQ</span>
            <textarea
              rows="2"
              value={formValues.faqHeroSubtitle}
              onChange={(event) => handleChange("faqHeroSubtitle", event.target.value)}
            />
          </label>

          <label className="login-form__field">
            <span>Titre page FAQ</span>
            <input
              type="text"
              value={formValues.faqPageTitle}
              onChange={(event) => handleChange("faqPageTitle", event.target.value)}
            />
          </label>

          <label className="login-form__field">
            <span>Texte bouton contact FAQ</span>
            <input
              type="text"
              value={formValues.faqContactButtonLabel}
              onChange={(event) => handleChange("faqContactButtonLabel", event.target.value)}
            />
          </label>

          <div className="admin-visual-page__subsection">
            <h3>Questions gauche FAQ</h3>
            {[1, 2, 3, 4, 5, 6].map((index) => (
              <div key={"faq-left-" + index} className="admin-visual-page__faq-editor">
                <label className="login-form__field">
                  <span>Question gauche {index}</span>
                  <textarea
                    rows="2"
                    value={formValues["faqLeftQuestion" + index]}
                    onChange={(event) => handleChange("faqLeftQuestion" + index, event.target.value)}
                  />
                </label>

                <label className="login-form__field">
                  <span>Reponse gauche {index}</span>
                  <textarea
                    rows="3"
                    value={formValues["faqLeftAnswer" + index]}
                    onChange={(event) => handleChange("faqLeftAnswer" + index, event.target.value)}
                  />
                </label>
              </div>
            ))}
          </div>

          <div className="admin-visual-page__subsection">
            <h3>Questions droite FAQ</h3>
            {[1, 2, 3, 4, 5, 6].map((index) => (
              <div key={"faq-right-" + index} className="admin-visual-page__faq-editor">
                <label className="login-form__field">
                  <span>Question droite {index}</span>
                  <textarea
                    rows="2"
                    value={formValues["faqRightQuestion" + index]}
                    onChange={(event) => handleChange("faqRightQuestion" + index, event.target.value)}
                  />
                </label>

                <label className="login-form__field">
                  <span>Reponse droite {index}</span>
                  <textarea
                    rows="3"
                    value={formValues["faqRightAnswer" + index]}
                    onChange={(event) => handleChange("faqRightAnswer" + index, event.target.value)}
                  />
                </label>
              </div>
            ))}
          </div>

          <div className="admin-visual-page__subsection">
            <h3>Contact - horaires et map</h3>

            <ImageDropField
              label="Image hero contact"
              value={formValues.contactHeroImagePath}
              previewSrc={previewContactHero}
              slot="contact-hero"
              isUploading={uploadingSlot === "contact-hero"}
              onUpload={handleUpload}
            />

            <label className="login-form__field">
              <span>Titre hero contact</span>
              <input
                type="text"
                value={formValues.contactHeroTitleStart}
                onChange={(event) => handleChange("contactHeroTitleStart", event.target.value)}
              />
            </label>

            <label className="login-form__field">
              <span>Accent titre hero contact</span>
              <input
                type="text"
                value={formValues.contactHeroTitleAccent}
                onChange={(event) => handleChange("contactHeroTitleAccent", event.target.value)}
              />
            </label>

            <label className="login-form__field">
              <span>Sous-titre hero contact</span>
              <textarea
                rows="2"
                value={formValues.contactHeroSubtitle}
                onChange={(event) => handleChange("contactHeroSubtitle", event.target.value)}
              />
            </label>

            <label className="login-form__field">
              <span>Titre horaires</span>
              <input
                type="text"
                value={formValues.contactHoursTitle}
                onChange={(event) => handleChange("contactHoursTitle", event.target.value)}
              />
            </label>

            <label className="login-form__field">
              <span>Sous-titre horaires</span>
              <textarea
                rows="2"
                value={formValues.contactHoursSubtitle}
                onChange={(event) => handleChange("contactHoursSubtitle", event.target.value)}
              />
            </label>

            {[1, 2, 3, 4, 5, 6, 7].map((index) => (
              <div key={"contact-hours-" + index} className="admin-visual-page__faq-editor">
                <label className="login-form__field">
                  <span>Jour {index}</span>
                  <input
                    type="text"
                    value={formValues["contactHoursDay" + index]}
                    onChange={(event) => handleChange("contactHoursDay" + index, event.target.value)}
                  />
                </label>

                <label className="login-form__field">
                  <span>Horaire {index}</span>
                  <input
                    type="text"
                    value={formValues["contactHoursValue" + index]}
                    onChange={(event) => handleChange("contactHoursValue" + index, event.target.value)}
                  />
                </label>
              </div>
            ))}

            <label className="login-form__field">
              <span>Lien Google Maps exact</span>
              <input
                type="text"
                value={formValues.contactMapLinkUrl}
                onChange={(event) => handleChange("contactMapLinkUrl", event.target.value)}
                placeholder="https://share.google/..."
              />
            </label>
          </div>

          <label className="login-form__field">
            <span>Titre hotel de voitures</span>
            <textarea
              rows="2"
              value={formValues.homeCarHotelTitle}
              onChange={(event) => handleChange("homeCarHotelTitle", event.target.value)}
            />
          </label>

          <label className="login-form__field">
            <span>Description hotel de voitures</span>
            <textarea
              rows="4"
              value={formValues.homeCarHotelDescription}
              onChange={(event) => handleChange("homeCarHotelDescription", event.target.value)}
            />
          </label>

          <label className="login-form__field">
            <span>Titre services hotel</span>
            <input
              type="text"
              value={formValues.homeCarHotelServicesTitle}
              onChange={(event) => handleChange("homeCarHotelServicesTitle", event.target.value)}
            />
          </label>

          <label className="login-form__field">
            <span>Service hotel 1</span>
            <input
              type="text"
              value={formValues.homeCarHotelService1}
              onChange={(event) => handleChange("homeCarHotelService1", event.target.value)}
            />
          </label>

          <label className="login-form__field">
            <span>Service hotel 2</span>
            <input
              type="text"
              value={formValues.homeCarHotelService2}
              onChange={(event) => handleChange("homeCarHotelService2", event.target.value)}
            />
          </label>

          <label className="login-form__field">
            <span>Service hotel 3</span>
            <input
              type="text"
              value={formValues.homeCarHotelService3}
              onChange={(event) => handleChange("homeCarHotelService3", event.target.value)}
            />
          </label>

          <label className="login-form__field">
            <span>Service hotel 4</span>
            <input
              type="text"
              value={formValues.homeCarHotelService4}
              onChange={(event) => handleChange("homeCarHotelService4", event.target.value)}
            />
          </label>

          <label className="login-form__field">
            <span>Texte footer</span>
            <textarea
              rows="4"
              value={formValues.footerShortInfo}
              onChange={(event) => handleChange("footerShortInfo", event.target.value)}
            />
          </label>

          <label className="login-form__field">
            <span>Telephone</span>
            <input
              type="text"
              value={formValues.footerPhoneValue}
              onChange={(event) => handleChange("footerPhoneValue", event.target.value)}
            />
          </label>

          <label className="login-form__field">
            <span>Email</span>
            <input
              type="text"
              value={formValues.footerEmailValue}
              onChange={(event) => handleChange("footerEmailValue", event.target.value)}
            />
          </label>

          <label className="login-form__field">
            <span>Adresse / bloc bas</span>
            <textarea
              rows="3"
              value={formValues.footerAddressValue}
              onChange={(event) => handleChange("footerAddressValue", event.target.value)}
            />
          </label>

          <label className="login-form__field">
            <span>URL Facebook</span>
            <input
              type="text"
              value={formValues.footerFacebookUrl}
              onChange={(event) => handleChange("footerFacebookUrl", event.target.value)}
            />
          </label>

          <label className="login-form__field">
            <span>URL Instagram</span>
            <input
              type="text"
              value={formValues.footerInstagramUrl}
              onChange={(event) => handleChange("footerInstagramUrl", event.target.value)}
            />
          </label>

          {errorMessage ? <p className="login-form__message login-form__message--error">{errorMessage}</p> : null}
          {successMessage ? <p className="login-form__message login-form__message--success">{successMessage}</p> : null}

          <button type="submit" className="login-form__submit" disabled={isSaving}>
            {isSaving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </form>
      </div>
    </main>
  );
}

export default AdminVisualPage;
