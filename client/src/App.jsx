import { useEffect, useState } from "react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Aceulle from "./pages/Aceulle";
import AdminLogin from "./pages/AdminLogin";
import AdminAceulle from "./pages/AdminAceulle";
import AdminProfile from "./pages/AdminProfile";
import AdminVisualPage from "./pages/AdminVisualPage";
import PublicPage from "./pages/PublicPage";
import ContactPage from "./pages/ContactPage";
import FaqPage from "./pages/FaqPage";
import LocationVehiclesPage from "./pages/LocationVehiclesPage";
import ComparePage from "./pages/ComparePage";
import VehicleDetailPage from "./pages/VehicleDetailPage";
import AdminVehicleFormPage from "./pages/AdminVehicleFormPage";
import CommencerReservationsPage from "./pages/CommencerReservationsPage";
import ReservationDetailPage from "./pages/ReservationDetailPage";
import ClientsCalendarPage from "./pages/ClientsCalendarPage";
import AdminReservationFormPage from "./pages/AdminReservationFormPage";
import {
  getCachedHomePageContent,
  getHomePageContent
} from "./services/contentService";
import {
  getVehicleById,
  listVehicles
} from "./services/vehicleService";
import {
  getAdminDashboardStats,
  getCachedAdminDashboardStats
} from "./services/adminDashboardService";
import {
  getAdminReservationById,
  getCachedAdminReservationById,
  getCachedAdminReservations,
  getCachedVehicleReservationAvailability,
  getVehicleReservationAvailability,
  listAdminReservations
} from "./services/reservationService";
import {
  getAdminSession,
  logoutAdmin
} from "./services/adminAuthService";
import { clearLegacyAdminClientState } from "./services/clientSecurityService";
import {
  getStoredCompareVehicleIds,
  persistCompareVehicleIds,
  toggleCompareVehicleId
} from "./services/compareService";

function normalizePath(path) {
  if (path === "/Accueil" || path === "/accueil" || path === "/aceulle") {
    return "/";
  }

  if (path === "/clients") {
    return "/reservations";
  }

  if (path === "/clients/reservations/creer") {
    return "/reservations/creer";
  }

  const clientReservationEditMatch = path.match(/^\/clients\/reservations\/(\d+)\/modifier$/);

  if (clientReservationEditMatch) {
    return `/reservations/${clientReservationEditMatch[1]}/modifier`;
  }

  const clientReservationDetailMatch = path.match(/^\/clients\/reservations\/(\d+)$/);

  if (clientReservationDetailMatch) {
    return `/reservations/${clientReservationDetailMatch[1]}`;
  }

  return path;
}

function getCurrentPath() {
  return normalizePath(window.location.pathname);
}

function isAdminOnlyPath(path) {
  return (
    path === "/admin/profile" ||
    path === "/admin/visuelle" ||
    path === "/reservations" ||
    path === "/reservations/creer" ||
    path === "/location-de-voitures/creer" ||
    /^\/location-de-voitures\/\d+\/reserver$/.test(path) ||
    /^\/location-de-voitures\/\d+\/modifier$/.test(path) ||
    /^\/commencer\/reservations\/\d+$/.test(path) ||
    /^\/reservations\/\d+$/.test(path) ||
    /^\/commencer\/reservations\/\d+\/modifier$/.test(path) ||
    /^\/reservations\/\d+\/modifier$/.test(path)
  );
}

function getVehicleDetailId(path) {
  const match = path.match(/^\/location-de-voitures\/(\d+)$/);
  return match ? Number(match[1]) : null;
}

function getVehicleEditId(path) {
  const match = path.match(/^\/location-de-voitures\/(\d+)\/modifier$/);
  return match ? Number(match[1]) : null;
}

function getVehicleReserveId(path) {
  const match = path.match(/^\/location-de-voitures\/(\d+)\/reserver$/);
  return match ? Number(match[1]) : null;
}

function getReservationDetailId(path) {
  let match = path.match(/^\/commencer\/reservations\/(\d+)$/);

  if (match) {
    return Number(match[1]);
  }

  match = path.match(/^\/reservations\/(\d+)$/);
  return match ? Number(match[1]) : null;
}

function getReservationDetailScope(path) {
  if (/^\/commencer\/reservations\/\d+$/.test(path)) {
    return "commencer";
  }

  if (/^\/reservations\/\d+$/.test(path)) {
    return "reservations";
  }

  return null;
}

function getReservationEditId(path) {
  let match = path.match(/^\/commencer\/reservations\/(\d+)\/modifier$/);

  if (match) {
    return Number(match[1]);
  }

  match = path.match(/^\/reservations\/(\d+)\/modifier$/);
  return match ? Number(match[1]) : null;
}

function getReservationEditScope(path) {
  if (/^\/commencer\/reservations\/\d+\/modifier$/.test(path)) {
    return "commencer";
  }

  if (/^\/reservations\/\d+\/modifier$/.test(path)) {
    return "reservations";
  }

  return null;
}

function isReservationDetailPath(path) {
  return /^\/commencer\/reservations\/\d+$/.test(path) || /^\/reservations\/\d+$/.test(path);
}

function isReservationEditPath(path) {
  return /^\/commencer\/reservations\/\d+\/modifier$/.test(path) || /^\/reservations\/\d+\/modifier$/.test(path);
}

function getReservationListPath(path) {
  const scope = getReservationDetailScope(path);
  return scope === "reservations" ? "/reservations" : "/commencer";
}

function getReservationDetailDestination(scopePath, reservationId) {
  if (scopePath === "/reservations") {
    return `/reservations/${reservationId}`;
  }

  return `/commencer/reservations/${reservationId}`;
}

function BootLoader({ progress, isExiting }) {
  const paddedProgress = String(Math.max(0, Math.min(100, Math.round(progress)))).padStart(2, "0");

  return (
    <div className={"boot-loader" + (isExiting ? " boot-loader--exit" : "") } aria-hidden="true">
      <div className="boot-loader__simple">
        <strong className="boot-loader__counter">{paddedProgress}</strong>
      </div>
    </div>
  );
}

function App() {
  const [content, setContent] = useState(() => getCachedHomePageContent());
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isContentLoading, setIsContentLoading] = useState(
    () => !getCachedHomePageContent()
  );
  const [currentPath, setCurrentPath] = useState(getCurrentPath);
  const [currentAdmin, setCurrentAdmin] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [compareVehicleIds, setCompareVehicleIds] = useState(getStoredCompareVehicleIds);
  const [bootProgress, setBootProgress] = useState(0);
  const [isBootVisible, setIsBootVisible] = useState(true);
  const [isBootExiting, setIsBootExiting] = useState(false);
  const [isBootDataReady, setIsBootDataReady] = useState(() => Boolean(getCachedHomePageContent()));

  useEffect(() => {
    let isActive = true;

    const loadContent = async () => {
      setIsContentLoading((currentValue) => (content ? false : currentValue));

      try {
        const response = await getHomePageContent();

        if (!isActive) {
          return;
        }

        setContent(response);
        setErrorMessage("");
      } catch (error) {
        if (!isActive) {
          return;
        }

        if (!content) {
          setErrorMessage("Le contenu n'a pas pu etre charge depuis le serveur.");
        }
      } finally {
        if (isActive) {
          setIsContentLoading(false);
        }
      }
    };

    loadContent();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (!isBootVisible) {
      return undefined;
    }

    let animationFrameId = 0;
    let exitTimerId = 0;
    let hideTimerId = 0;
    let hasWindowLoaded = document.readyState === "complete";

    const handleWindowLoad = () => {
      hasWindowLoaded = true;
    };

    const getTargetProgress = () => {
      let value = 12;

      if (content) {
        value += 38;
      }

      if (!isAuthLoading) {
        value += 15;
      }

      if (isBootDataReady) {
        value += 35;
      }

      if (hasWindowLoaded) {
        value += 25;
      }

      return Math.min(100, value);
    };

    const isReadyToReveal = () => Boolean(content) && !isAuthLoading && isBootDataReady && hasWindowLoaded;

    const tick = () => {
      setBootProgress((currentValue) => {
        const targetValue = getTargetProgress();
        const nextValue = currentValue + Math.max(1, Math.ceil((targetValue - currentValue) * 0.12));
        return nextValue >= targetValue ? targetValue : nextValue;
      });

      if (isReadyToReveal()) {
        setBootProgress(100);
        setIsBootExiting(true);
        exitTimerId = window.setTimeout(() => {
          setIsBootVisible(false);
        }, 1150);
        return;
      }

      animationFrameId = window.setTimeout(tick, 32);
    };

    window.addEventListener("load", handleWindowLoad, { once: true });
    hideTimerId = window.setTimeout(tick, 120);

    return () => {
      window.removeEventListener("load", handleWindowLoad);
      window.clearTimeout(animationFrameId);
      window.clearTimeout(exitTimerId);
      window.clearTimeout(hideTimerId);
    };
  }, [content, isAuthLoading, isBootDataReady, isBootVisible]);

  useEffect(() => {
    if (!content || isAuthLoading) {
      return undefined;
    }

    let isActive = true;

    const preloadSiteData = async () => {
      const preloadTasks = [listVehicles().catch(() => null)];
      const normalizedPath = currentPath;
      const vehicleDetailId = getVehicleDetailId(normalizedPath);
      const reservationDetailId = getReservationDetailId(normalizedPath);

      if (vehicleDetailId) {
        preloadTasks.push(getVehicleById(vehicleDetailId, { adminView: Boolean(currentAdmin) }).catch(() => null));

        if (!getCachedVehicleReservationAvailability(vehicleDetailId).length) {
          preloadTasks.push(getVehicleReservationAvailability(vehicleDetailId).catch(() => null));
        }
      }

      if (currentAdmin) {
        const today = new Date();
        const defaultDashboardFilters = {
          view: "month",
          year: today.getFullYear(),
          month: today.getMonth() + 1
        };

        if (!getCachedAdminDashboardStats(defaultDashboardFilters)) {
          preloadTasks.push(getAdminDashboardStats(defaultDashboardFilters).catch(() => null));
        }

        if (!getCachedAdminReservations("pending").length) {
          preloadTasks.push(listAdminReservations({ scope: "pending" }).catch(() => null));
        }

        if (!getCachedAdminReservations("accepted").length) {
          preloadTasks.push(listAdminReservations({ scope: "accepted" }).catch(() => null));
        }

        if (reservationDetailId && !getCachedAdminReservationById(reservationDetailId)) {
          preloadTasks.push(getAdminReservationById(reservationDetailId).catch(() => null));
        }
      }

      await Promise.allSettled(preloadTasks);

      if (isActive) {
        setIsBootDataReady(true);
      }
    };

    setIsBootDataReady(false);
    preloadSiteData();

    return () => {
      isActive = false;
    };
  }, [content, currentAdmin, currentPath, isAuthLoading]);

  useEffect(() => {
    const loadAdminSession = async () => {
      try {
        clearLegacyAdminClientState();
        const admin = await getAdminSession();
        setCurrentAdmin(admin);
      } catch (error) {
        setCurrentAdmin(null);
      } finally {
        setIsAuthLoading(false);
      }
    };

    loadAdminSession();
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(getCurrentPath());
      setIsMenuOpen(false);
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  useEffect(() => {
    const normalizedPath = normalizePath(window.location.pathname);

    if (normalizedPath !== window.location.pathname) {
      window.history.replaceState({}, "", normalizedPath);
      setCurrentPath(normalizedPath);
    }
  }, []);

  const navigateTo = (path) => {
    const normalizedPath = normalizePath(path);
    const currentBrowserPath = normalizePath(window.location.pathname);

    if (currentBrowserPath === normalizedPath) {
      setIsMenuOpen(false);
      return;
    }

    window.history.pushState({}, "", normalizedPath);
    window.scrollTo(0, 0);
    setCurrentPath(normalizedPath);
    setIsMenuOpen(false);
  };

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }

    if (
      (currentPath.startsWith("/admin") && currentPath !== "/admin/login") ||
      isAdminOnlyPath(currentPath)
    ) {
      if (currentAdmin) {
        return;
      }

      window.history.replaceState({}, "", "/admin/login");
      setCurrentPath("/admin/login");
    }
  }, [currentAdmin, currentPath, isAuthLoading]);

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }

    if (currentPath === "/admin/login" && currentAdmin) {
      window.history.replaceState({}, "", "/admin");
      setCurrentPath("/admin");
    }
  }, [currentAdmin, currentPath, isAuthLoading]);

  const handleAdminLoginSuccess = (admin) => {
    setCurrentAdmin(admin);
    window.history.pushState({}, "", "/admin");
    window.scrollTo(0, 0);
    setCurrentPath("/admin");
    setIsMenuOpen(false);
  };

  const handleAdminUpdated = (admin) => {
    setCurrentAdmin(admin);
  };

  const persistCompareIds = (nextVehicleIds) => {
    const persistedVehicleIds = persistCompareVehicleIds(nextVehicleIds);
    setCompareVehicleIds(persistedVehicleIds);
    return persistedVehicleIds;
  };

  const handleCompareToggle = (vehicleId) => {
    setCompareVehicleIds((currentValue) => {
      const nextValue = toggleCompareVehicleId(currentValue, vehicleId);
      return persistCompareVehicleIds(nextValue);
    });
  };

  const handleCompareRemove = (vehicleId) => {
    setCompareVehicleIds((currentValue) => {
      const nextValue = currentValue.filter((entry) => entry !== vehicleId);
      return persistCompareVehicleIds(nextValue);
    });
  };

  const handleCompareClear = () => {
    persistCompareIds([]);
  };

  const vehicleDetailId = getVehicleDetailId(currentPath);
  const vehicleEditId = getVehicleEditId(currentPath);
  const vehicleReserveId = getVehicleReserveId(currentPath);
  const reservationDetailId = getReservationDetailId(currentPath);
  const reservationDetailScope = getReservationDetailScope(currentPath);
  const reservationEditId = getReservationEditId(currentPath);
  const reservationEditScope = getReservationEditScope(currentPath);
  const isHomePage = currentPath === "/";

  const handleAdminLogout = async () => {
    try {
      await logoutAdmin();
    } catch (error) {
    } finally {
      clearLegacyAdminClientState();
      setCurrentAdmin(null);
      setIsMenuOpen(false);
      window.history.replaceState({}, "", "/");
      window.location.replace("/");
    }
  };

  const isProtectedPath =
    ((currentPath.startsWith("/admin") && currentPath !== "/admin/login") ||
      isAdminOnlyPath(currentPath));

  const shouldRenderApp = Boolean(content) && (!isProtectedPath || !isAuthLoading || Boolean(currentAdmin));

  return (
    <>
      {isBootVisible ? <BootLoader progress={bootProgress} isExiting={isBootExiting} /> : null}
      {errorMessage && !content ? (
        <main className="page-shell page-shell--centered">
          <p className="status-message">{errorMessage}</p>
        </main>
      ) : shouldRenderApp ? (
        <div className={isHomePage ? "page-shell home" : "page-shell"}>
      <Header
        brand={content.brand}
        header={content.header}
        footerContent={content.footer}
        currentAdmin={currentAdmin}
        currentPath={currentPath}
        isProfilePage={currentPath === "/admin/profile"}
        isMenuOpen={isMenuOpen}
        isHomePage={isHomePage}
        onMenuClose={() => setIsMenuOpen(false)}
        onMenuToggle={() => setIsMenuOpen((currentValue) => !currentValue)}
        onNavigate={navigateTo}
        onLoginClick={() => navigateTo("/admin/login")}
        onLogoutClick={handleAdminLogout}
        onProfileClick={() => navigateTo("/admin/profile")}
        onClientsClick={() => navigateTo("/reservations")}
      />
      {currentPath === "/admin/login" ? (
        <AdminLogin
          content={content.adminLogin}
          onBackClick={() => navigateTo("/")}
          onLoginSuccess={handleAdminLoginSuccess}
        />
      ) : currentPath === "/admin/profile" && currentAdmin ? (
        <AdminProfile
          content={content.adminProfile}
          admin={currentAdmin}
          onAdminUpdated={handleAdminUpdated}
          onBackClick={() => navigateTo("/admin")}
        />
      ) : currentPath === "/admin/visuelle" && currentAdmin ? (
        <AdminVisualPage />
      ) : currentPath === "/reservations/creer" && currentAdmin ? (
        <AdminReservationFormPage
          content={content.reservations}
          vehicleContent={content.vehicles}
          mode="create"
          onBackClick={() => navigateTo("/reservations")}
          onSaved={(reservation) =>
            navigateTo(`/reservations/${reservation.id}`)
          }
        />
      ) : reservationEditId && currentAdmin && isReservationEditPath(currentPath) ? (
        <AdminReservationFormPage
          content={content.reservations}
          vehicleContent={content.vehicles}
          mode="edit"
          reservationId={reservationEditId}
          onBackClick={() =>
            navigateTo(
              reservationEditScope === "reservations"
                ? `/reservations/${reservationEditId}`
                : `/commencer/reservations/${reservationEditId}`
            )
          }
          onSaved={(reservation) =>
            navigateTo(
              reservation.status === "accepted"
                ? `/reservations/${reservation.id}`
                : `/commencer/reservations/${reservation.id}`
            )
          }
        />
      ) : reservationDetailId && currentAdmin && isReservationDetailPath(currentPath) ? (
        <ReservationDetailPage
          content={content.reservations}
          vehicleContent={content.vehicles}
          reservationId={reservationDetailId}
          detailScope={reservationDetailScope}
          onAccepted={() => navigateTo("/reservations")}
          onRejected={() => navigateTo("/commencer")}
          onEditClick={() =>
            navigateTo(
              reservationDetailScope === "reservations"
                ? `/reservations/${reservationDetailId}/modifier`
                : `/commencer/reservations/${reservationDetailId}/modifier`
            )
          }
          onDeleted={() =>
            navigateTo(reservationDetailScope === "reservations" ? "/reservations" : "/commencer")
          }
          onBackClick={() => navigateTo(getReservationListPath(currentPath))}
        />
      ) : currentPath === "/commencer" && currentAdmin ? (
        <CommencerReservationsPage
          content={content.reservations}
          onReservationClick={(reservationId) =>
            navigateTo(getReservationDetailDestination("/commencer", reservationId))
          }
        />
      ) : currentPath === "/reservations" && currentAdmin ? (
        <ClientsCalendarPage
          content={content.reservations}
          onCreateClick={() => navigateTo("/reservations/creer")}
          onReservationClick={(reservationId) =>
            navigateTo(getReservationDetailDestination("/reservations", reservationId))
          }
        />
      ) : currentPath === "/commencer" ? (
        <PublicPage title={content.publicPages.commencer.title} />
      ) : currentPath === "/location-de-voitures/creer" && currentAdmin ? (
        <AdminVehicleFormPage
          content={content.vehicles}
          mode="create"
          onBackClick={() => navigateTo("/location-de-voitures")}
          onSaved={() => navigateTo("/location-de-voitures")}
        />
      ) : vehicleReserveId && currentAdmin ? (
        <AdminReservationFormPage
          content={content.reservations}
          vehicleContent={content.vehicles}
          mode="create"
          initialVehicleId={vehicleReserveId}
          onBackClick={() => navigateTo(`/location-de-voitures/${vehicleReserveId}`)}
          onSaved={(reservation) => navigateTo(`/reservations/${reservation.id}`)}
        />
      ) : vehicleEditId && currentAdmin ? (
        <AdminVehicleFormPage
          content={content.vehicles}
          mode="edit"
          vehicleId={vehicleEditId}
          onBackClick={() => navigateTo(`/location-de-voitures/${vehicleEditId}`)}
          onSaved={(vehicle) => navigateTo(`/location-de-voitures/${vehicle.id}`)}
        />
      ) : vehicleDetailId ? (
        <VehicleDetailPage
          content={content.vehicles}
          currentAdmin={currentAdmin}
          vehicleId={vehicleDetailId}
          onBackClick={() => navigateTo("/location-de-voitures")}
          onDeleted={() => navigateTo("/location-de-voitures")}
          onEditClick={() => navigateTo(`/location-de-voitures/${vehicleDetailId}/modifier`)}
          onReserveClick={() => navigateTo(`/location-de-voitures/${vehicleDetailId}/reserver`)}
          onVehicleClick={(nextVehicleId) => navigateTo(`/location-de-voitures/${nextVehicleId}`)}
        />
      ) : currentPath === "/location-de-voitures" ? (
        <LocationVehiclesPage
          content={content.vehicles}
          currentAdmin={currentAdmin}
          compareVehicleIds={compareVehicleIds}
          onCompareToggle={handleCompareToggle}
          onCompareRemove={handleCompareRemove}
          onCompareClear={handleCompareClear}
          onComparePageOpen={() => navigateTo("/compare")}
          onCreateClick={() => navigateTo("/location-de-voitures/creer")}
          onVehicleClick={(vehicleId) => navigateTo(`/location-de-voitures/${vehicleId}`)}
        />
      ) : currentPath === "/compare" ? (
        <ComparePage
          content={content.vehicles}
          compareVehicleIds={compareVehicleIds}
          onBackClick={() => navigateTo("/location-de-voitures")}
          onRemove={handleCompareRemove}
          onVehicleOpen={(vehicleId) => navigateTo(`/location-de-voitures/${vehicleId}`)}
        />
      ) : currentPath === "/contact" ? (
        <ContactPage
          content={content.contactPage}
          footerContent={content.footer}
          brand={content.brand}
        />
      ) : currentPath === "/foire-aux-questions" ? (
        <FaqPage
          content={content.faqPage}
          onContactClick={() => navigateTo("/contact")}
        />
      ) : currentPath === "/admin" && currentAdmin ? (
        <AdminAceulle content={content.adminAceulle} admin={currentAdmin} />
      ) : (
        <Aceulle content={content.aceulle} onNavigate={navigateTo} />
      )}
      <Footer
        brand={content.brand}
        content={content.footer}
        header={content.header}
        onNavigate={navigateTo}
      />
        </div>
      ) : (
        <main className="page-shell page-shell--centered page-shell--preload" />
      )}
    </>
  );
}

export default App;
