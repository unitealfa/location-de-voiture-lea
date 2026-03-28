import { useEffect, useState } from "react";
import {
  getAdminVisualSettings,
  getCachedVisualSettings,
  saveAdminVisualSettings,
  uploadAdminVisualImage
} from "../services/contentService";
import { useRef } from "react";

const DEFAULT_FORM = {
  faviconImagePath: "",
  headerLogoImagePath: "",
  footerLogoImagePath: "",
  footerShortInfo: "",
  footerPhoneValue: "",
  footerEmailValue: "",
  footerLocationValue: "",
  footerAddressValue: "",
  footerFacebookUrl: "#",
  footerInstagramUrl: "#"
};

function buildInitialForm(settings) {
  return {
    ...DEFAULT_FORM,
    ...(settings || {})
  };
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

  return nextContent;
}

function AdminVisualPage({ content, brand, header, footer, onContentSaved }) {
  const [formValues, setFormValues] = useState(() => buildInitialForm(getCachedVisualSettings()));
  const [isLoading, setIsLoading] = useState(() => !getCachedVisualSettings());
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingSlot, setUploadingSlot] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const hasInitializedRealtimePreviewRef = useRef(false);

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

        setFormValues(buildInitialForm(settings));
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
    if (isLoading) {
      return;
    }

    if (!hasInitializedRealtimePreviewRef.current) {
      hasInitializedRealtimePreviewRef.current = true;
      return;
    }

    onContentSaved?.(buildNextContent(content, formValues));
  }, [content, formValues, isLoading, onContentSaved]);

  const handleChange = (key, value) => {
    setFormValues((current) => ({
      ...current,
      [key]: value
    }));
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
      setFormValues(buildInitialForm(response.settings));
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
  const previewFooterBrand = footer.brandValue || brand.name;
  const previewFooterAddress =
    formValues.footerAddressValue || [formValues.footerLocationValue || footer.locationValue, previewFooterBrand].filter(Boolean).join("\n");
  const previewFooterText =
    formValues.footerShortInfo ||
    footer.shortInfo ||
    `✔︎ ${previewFooterBrand}. Location de voitures de luxe à ${formValues.footerLocationValue || footer.locationValue}.`;

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
