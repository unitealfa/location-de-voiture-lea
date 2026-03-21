function Footer({ content }) {
  return (
    <footer className="site-footer">
      <div className="footer-item">
        <span className="footer-item__label">{content.phoneLabel}</span>
        <span>{content.phoneValue}</span>
      </div>

      <div className="footer-item">
        <span className="footer-item__label">{content.locationLabel}</span>
        <span>{content.locationValue}</span>
      </div>

      <div className="footer-item">
        <span className="footer-item__label">{content.brandLabel}</span>
        <span>{content.brandValue}</span>
      </div>
    </footer>
  );
}

export default Footer;
