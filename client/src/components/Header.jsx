import { useEffect, useRef } from "react";

function Header({
  brand,
  header,
  currentAdmin,
  currentPath,
  isProfilePage,
  isMenuOpen,
  onMenuClose,
  onMenuToggle,
  onNavigate,
  onLoginClick,
  onLogoutClick,
  onProfileClick,
  onClientsClick
}) {
  const accountMenuRef = useRef(null);
  const navigationItems = currentAdmin
    ? [
        ...header.navigationItems,
        {
          label: header.clientsLabel,
          path: "/clients"
        }
      ]
    : header.navigationItems;

  const isNavItemActive = (itemPath) =>
    currentPath === itemPath || currentPath.startsWith(`${itemPath}/`);

  useEffect(() => {
    if (!isMenuOpen) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (!accountMenuRef.current?.contains(event.target)) {
        onMenuClose();
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        onMenuClose();
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isMenuOpen, onMenuClose]);

  return (
    <header className="top-bar">
      <div className="brand-row">
        <div className="brand-block" aria-label={brand.name}>
          <span className="brand-block__logo">{brand.logoText}</span>
          <span className="brand-block__name">{brand.name}</span>
        </div>
      </div>

      <nav className="site-nav" aria-label="Navigation principale">
        {navigationItems.map((item) => (
          <button
            key={item.path}
            type="button"
            className={`site-nav__link${isNavItemActive(item.path) ? " site-nav__link--active" : ""}`}
            onClick={() =>
              item.path === "/clients" ? onClientsClick() : onNavigate(item.path)
            }
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="account-menu" ref={accountMenuRef}>
        <button
          type="button"
          className={`account-menu__trigger${isMenuOpen ? " account-menu__trigger--active" : ""}`}
          aria-expanded={isMenuOpen}
          aria-label={currentAdmin ? header.accountLabel : header.loginLabel}
          onClick={onMenuToggle}
        >
          {currentAdmin ? header.accountLabel : header.loginLabel}
        </button>

        {isMenuOpen ? (
          <div
            className="account-menu__popup"
            role="dialog"
            aria-modal="false"
            aria-label={header.accountLabel}
          >
            {currentAdmin ? (
              <>
                <div className="account-menu__identity">
                  <span className="account-menu__name">{currentAdmin.username}</span>
                  <span className="account-menu__role">{currentAdmin.role}</span>
                </div>

                <button
                  type="button"
                  className={`account-menu__action${isProfilePage ? " account-menu__action--active" : ""}`}
                  onClick={onProfileClick}
                >
                  {header.profileLabel}
                </button>

                <button
                  type="button"
                  className="account-menu__action"
                  onClick={onLogoutClick}
                >
                  {header.logoutLabel}
                </button>
              </>
            ) : (
              <button
                type="button"
                className="account-menu__action"
                onClick={onLoginClick}
              >
                {header.loginLabel}
              </button>
            )}
          </div>
        ) : null}
      </div>
    </header>
  );
}

export default Header;
