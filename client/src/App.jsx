import { useEffect, useState } from "react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Aceulle from "./pages/Aceulle";
import AdminLogin from "./pages/AdminLogin";
import AdminAceulle from "./pages/AdminAceulle";
import AdminProfile from "./pages/AdminProfile";
import PublicPage from "./pages/PublicPage";
import LocationVehiclesPage from "./pages/LocationVehiclesPage";
import VehicleDetailPage from "./pages/VehicleDetailPage";
import AdminVehicleFormPage from "./pages/AdminVehicleFormPage";
import { getHomePageContent } from "./services/contentService";
import {
  getAdminSession,
  logoutAdmin
} from "./services/adminAuthService";
import { clearLegacyAdminClientState } from "./services/clientSecurityService";

function getCurrentPath() {
  return window.location.pathname;
}

function isAdminOnlyPath(path) {
  return (
    path === "/admin/profile" ||
    path === "/location-de-voitures/creer" ||
    /^\/location-de-voitures\/\d+\/modifier$/.test(path)
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

function App() {
  const [content, setContent] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [currentPath, setCurrentPath] = useState(getCurrentPath);
  const [currentAdmin, setCurrentAdmin] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

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

  const navigateTo = (path) => {
    if (window.location.pathname === path) {
      setIsMenuOpen(false);
      return;
    }

    window.history.pushState({}, "", path);
    window.scrollTo(0, 0);
    setCurrentPath(path);
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

  const vehicleDetailId = getVehicleDetailId(currentPath);
  const vehicleEditId = getVehicleEditId(currentPath);

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
    <div className="page-shell">
      <Header
        brand={content.brand}
        header={content.header}
        currentAdmin={currentAdmin}
        currentPath={currentPath}
        isProfilePage={currentPath === "/admin/profile"}
        isMenuOpen={isMenuOpen}
        onMenuClose={() => setIsMenuOpen(false)}
        onMenuToggle={() => setIsMenuOpen((currentValue) => !currentValue)}
        onNavigate={navigateTo}
        onLoginClick={() => navigateTo("/admin/login")}
        onLogoutClick={handleAdminLogout}
        onProfileClick={() => navigateTo("/admin/profile")}
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
        />
      ) : currentPath === "/location-de-voitures" ? (
        <LocationVehiclesPage
          content={content.vehicles}
          currentAdmin={currentAdmin}
          onCreateClick={() => navigateTo("/location-de-voitures/creer")}
          onVehicleClick={(vehicleId) => navigateTo(`/location-de-voitures/${vehicleId}`)}
        />
      ) : currentPath === "/contact" ? (
        <PublicPage title={content.publicPages.contact.title} />
      ) : currentPath === "/foire-aux-questions" ? (
        <PublicPage title={content.publicPages.foireAuxQuestions.title} />
      ) : currentPath === "/admin" && currentAdmin ? (
        <AdminAceulle content={content.adminAceulle} admin={currentAdmin} />
      ) : (
        <Aceulle content={content.aceulle} />
      )}
      <Footer content={content.footer} />
    </div>
  );
}

export default App;
