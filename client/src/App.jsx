import { useEffect, useState } from "react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Aceulle from "./pages/Aceulle";
import AdminLogin from "./pages/AdminLogin";
import AdminAceulle from "./pages/AdminAceulle";
import AdminProfile from "./pages/AdminProfile";
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
import { getHomePageContent } from "./services/contentService";
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

  return path;
}

function getCurrentPath() {
  return normalizePath(window.location.pathname);
}

function isAdminOnlyPath(path) {
  return (
    path === "/admin/profile" ||
    path === "/clients" ||
    path === "/clients/reservations/creer" ||
    path === "/location-de-voitures/creer" ||
    /^\/location-de-voitures\/\d+\/modifier$/.test(path) ||
    /^\/commencer\/reservations\/\d+$/.test(path) ||
    /^\/clients\/reservations\/\d+$/.test(path) ||
    /^\/(commencer|clients)\/reservations\/\d+\/modifier$/.test(path)
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

function getReservationDetailId(path) {
  const match = path.match(/^\/(commencer|clients)\/reservations\/(\d+)$/);
  return match ? Number(match[2]) : null;
}

function getReservationDetailScope(path) {
  const match = path.match(/^\/(commencer|clients)\/reservations\/\d+$/);
  return match ? match[1] : null;
}

function getReservationEditId(path) {
  const match = path.match(/^\/(commencer|clients)\/reservations\/(\d+)\/modifier$/);
  return match ? Number(match[2]) : null;
}

function getReservationEditScope(path) {
  const match = path.match(/^\/(commencer|clients)\/reservations\/\d+\/modifier$/);
  return match ? match[1] : null;
}

function isReservationDetailPath(path) {
  return /^\/(commencer|clients)\/reservations\/\d+$/.test(path);
}

function isReservationEditPath(path) {
  return /^\/(commencer|clients)\/reservations\/\d+\/modifier$/.test(path);
}

function getReservationListPath(path) {
  const scope = getReservationDetailScope(path);
  return scope === "clients" ? "/clients" : "/commencer";
}

function getReservationDetailDestination(scopePath, reservationId) {
  const scope = scopePath === "/clients" ? "clients" : "commencer";
  return `/${scope || "commencer"}/reservations/${reservationId}`;
}

function App() {
  const [content, setContent] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [currentPath, setCurrentPath] = useState(getCurrentPath);
  const [currentAdmin, setCurrentAdmin] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [compareVehicleIds, setCompareVehicleIds] = useState(getStoredCompareVehicleIds);

  useEffect(() => {
    const loadContent = async () => {
      try {
        const response = await getHomePageContent();
        setContent(response);
      } catch (error) {
        setErrorMessage("Le contenu n'a pas pu etre charge depuis le serveur.");
      }
    };

    loadContent();
  }, []);

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

  if ((!content && !errorMessage) || isAuthLoading) {
    return (
      <main className="page-shell page-shell--centered">
        <p className="status-message">Chargement de la page d'accueil...</p>
      </main>
    );
  }

  if (errorMessage) {
    return (
      <main className="page-shell page-shell--centered">
        <p className="status-message">{errorMessage}</p>
      </main>
    );
  }

  return (
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
        onClientsClick={() => navigateTo("/clients")}
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
      ) : currentPath === "/clients/reservations/creer" && currentAdmin ? (
        <AdminReservationFormPage
          content={content.reservations}
          vehicleContent={content.vehicles}
          mode="create"
          onBackClick={() => navigateTo("/clients")}
          onSaved={(reservation) =>
            navigateTo(`/clients/reservations/${reservation.id}`)
          }
        />
      ) : reservationEditId && currentAdmin && isReservationEditPath(currentPath) ? (
        <AdminReservationFormPage
          content={content.reservations}
          vehicleContent={content.vehicles}
          mode="edit"
          reservationId={reservationEditId}
          onBackClick={() =>
            navigateTo(`/${reservationEditScope}/reservations/${reservationEditId}`)
          }
          onSaved={(reservation) =>
            navigateTo(
              reservation.status === "accepted"
                ? `/clients/reservations/${reservation.id}`
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
          onAccepted={() => navigateTo("/clients")}
          onRejected={() => navigateTo("/commencer")}
          onEditClick={() =>
            navigateTo(`/${reservationDetailScope}/reservations/${reservationDetailId}/modifier`)
          }
          onDeleted={() =>
            navigateTo(reservationDetailScope === "clients" ? "/clients" : "/commencer")
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
      ) : currentPath === "/clients" && currentAdmin ? (
        <ClientsCalendarPage
          content={content.reservations}
          onCreateClick={() => navigateTo("/clients/reservations/creer")}
          onReservationClick={(reservationId) =>
            navigateTo(getReservationDetailDestination("/clients", reservationId))
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
  );
}

export default App;
