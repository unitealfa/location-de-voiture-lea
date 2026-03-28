const fs = require("fs");
const path = require("path");
const defaultContent = require("../config/defaultContent");
const {
  listSiteSettings,
  upsertSiteSettings
} = require("../repositories/siteSettingsRepository");

const LEGACY_CONTENT_STORAGE_PATH = path.resolve(__dirname, "../data/site-content.json");
const MUTABLE_DEFAULT_CONTENT = {
  brand: {
    logoImagePath: "/home/rentzo-logo.jpg",
    faviconImagePath: "/home/rentzo-logo.jpg"
  },
  footer: {
    phoneValue: "0779 10 74 46",
    emailValue: "lea@gmail.com",
    locationValue: "Alger",
    addressValue: "Alger\nLea Location",
    logoImagePath: "/home/rentzo-logo.jpg",
    shortInfo: "✔︎ Lea Location. Location de voitures de luxe à ALGER.",
    facebookUrl: "#",
    instagramUrl: "#"
  }
};

const VISUAL_SETTING_KEYS = {
  faviconImagePath: "brand.faviconImagePath",
  headerLogoImagePath: "brand.logoImagePath",
  footerLogoImagePath: "footer.logoImagePath",
  footerShortInfo: "footer.shortInfo",
  footerPhoneValue: "footer.phoneValue",
  footerEmailValue: "footer.emailValue",
  footerLocationValue: "footer.locationValue",
  footerAddressValue: "footer.addressValue",
  footerFacebookUrl: "footer.facebookUrl",
  footerInstagramUrl: "footer.instagramUrl"
};

let siteContentCache = null;
let hasLoadedFromDatabase = false;

function cloneValue(value) {
  return JSON.parse(JSON.stringify(value));
}

function setPathValue(target, pathKey, value) {
  const pathParts = pathKey.split(".");
  const lastKey = pathParts.pop();
  let currentTarget = target;

  for (const part of pathParts) {
    if (!currentTarget[part] || typeof currentTarget[part] !== "object") {
      currentTarget[part] = {};
    }

    currentTarget = currentTarget[part];
  }

  currentTarget[lastKey] = value;
}

function getPathValue(target, pathKey) {
  return pathKey.split(".").reduce((currentValue, key) => currentValue?.[key], target);
}

function getBaseContent() {
  return {
    ...cloneValue(defaultContent),
    brand: {
      ...cloneValue(defaultContent.brand),
      ...cloneValue(MUTABLE_DEFAULT_CONTENT.brand)
    },
    footer: {
      ...cloneValue(defaultContent.footer),
      ...cloneValue(MUTABLE_DEFAULT_CONTENT.footer)
    }
  };
}

function applyVisualSettings(baseContent, settingsMap) {
  const nextContent = cloneValue(baseContent);

  Object.entries(VISUAL_SETTING_KEYS).forEach(([formKey, contentPath]) => {
    const value = settingsMap[formKey];

    if (typeof value === "string" && value.trim() !== "") {
      setPathValue(nextContent, contentPath, value.trim());
    }
  });

  return nextContent;
}

function buildVisualSettingsFromContent(content) {
  return Object.fromEntries(
    Object.entries(VISUAL_SETTING_KEYS).map(([formKey, contentPath]) => [
      formKey,
      String(getPathValue(content, contentPath) || "").trim()
    ])
  );
}

function loadLegacyVisualSettings() {
  try {
    if (!fs.existsSync(LEGACY_CONTENT_STORAGE_PATH)) {
      return null;
    }

    const rawValue = fs.readFileSync(LEGACY_CONTENT_STORAGE_PATH, "utf8");
    const parsedValue = JSON.parse(rawValue);
    return buildVisualSettingsFromContent({
      ...getBaseContent(),
      ...parsedValue,
      brand: {
        ...getBaseContent().brand,
        ...(parsedValue.brand || {})
      },
      footer: {
        ...getBaseContent().footer,
        ...(parsedValue.footer || {})
      }
    });
  } catch (error) {
    return null;
  }
}

async function readVisualSettingsMapFromDatabase() {
  try {
    const rows = await listSiteSettings();

    if (rows.length === 0) {
      const legacySettings = loadLegacyVisualSettings();

      if (legacySettings) {
        await upsertVisualSettings(legacySettings);
        return legacySettings;
      }
    }

    return rows.reduce((settingsMap, row) => {
      const matchingEntry = Object.entries(VISUAL_SETTING_KEYS).find(([, contentPath]) => contentPath === row.key);

      if (matchingEntry) {
        settingsMap[matchingEntry[0]] = String(row.value || "").trim();
      }

      return settingsMap;
    }, {});
  } catch (error) {
    return {};
  }
}

async function upsertVisualSettings(settings) {
  const entries = Object.entries(VISUAL_SETTING_KEYS).map(([formKey, contentPath]) => ({
    key: contentPath,
    value: String(settings[formKey] || "").trim()
  }));

  await upsertSiteSettings(entries);
}

async function hydrateSiteContent(forceRefresh = false) {
  if (siteContentCache && !forceRefresh) {
    return cloneValue(siteContentCache);
  }

  const settingsMap = forceRefresh || !hasLoadedFromDatabase
    ? await readVisualSettingsMapFromDatabase()
    : {};

  const nextContent = applyVisualSettings(getBaseContent(), settingsMap);
  siteContentCache = nextContent;
  hasLoadedFromDatabase = true;
  return cloneValue(siteContentCache);
}

async function getHomePageContent() {
  return hydrateSiteContent();
}

async function getCurrentSiteContent() {
  return hydrateSiteContent();
}

async function replaceHomePageContent(nextContent) {
  siteContentCache = cloneValue(nextContent);
  await upsertVisualSettings(buildVisualSettingsFromContent(siteContentCache));
  return cloneValue(siteContentCache);
}

async function getVisualSettings() {
  const currentContent = await hydrateSiteContent();
  return buildVisualSettingsFromContent(currentContent);
}

async function updateVisualSettings(payload = {}) {
  const currentContent = await hydrateSiteContent();
  const nextVisualSettings = {
    faviconImagePath: String(payload.faviconImagePath || currentContent.brand?.faviconImagePath || currentContent.brand?.logoImagePath || "").trim(),
    headerLogoImagePath: String(payload.headerLogoImagePath || currentContent.brand?.logoImagePath || "").trim(),
    footerLogoImagePath: String(payload.footerLogoImagePath || currentContent.footer?.logoImagePath || currentContent.brand?.logoImagePath || "").trim(),
    footerShortInfo: String(payload.footerShortInfo || currentContent.footer?.shortInfo || "").trim(),
    footerPhoneValue: String(payload.footerPhoneValue || currentContent.footer?.phoneValue || "").trim(),
    footerEmailValue: String(payload.footerEmailValue || currentContent.footer?.emailValue || "").trim(),
    footerLocationValue: String(payload.footerLocationValue || currentContent.footer?.locationValue || "").trim(),
    footerAddressValue: String(payload.footerAddressValue || currentContent.footer?.addressValue || "").trim(),
    footerFacebookUrl: String(payload.footerFacebookUrl || currentContent.footer?.facebookUrl || "#").trim() || "#",
    footerInstagramUrl: String(payload.footerInstagramUrl || currentContent.footer?.instagramUrl || "#").trim() || "#"
  };

  await upsertVisualSettings(nextVisualSettings);
  siteContentCache = applyVisualSettings(getBaseContent(), nextVisualSettings);

  return {
    content: cloneValue(siteContentCache),
    visualSettings: nextVisualSettings
  };
}

module.exports = {
  getHomePageContent,
  getCurrentSiteContent,
  replaceHomePageContent,
  getVisualSettings,
  updateVisualSettings
};
