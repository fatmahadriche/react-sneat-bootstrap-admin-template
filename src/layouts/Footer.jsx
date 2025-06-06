const Footer = () => {
  return (
    <footer className="content-footer footer bg-footer-theme border-top pt-3">
      <div className="container-xxl d-flex flex-wrap justify-content-between align-items-center py-2 flex-md-row flex-column">
        <div className="text-muted mb-2 mb-md-0">
          © {new Date().getFullYear()} Société Tunisienne de l'Électricité et du Gaz (STEG) — Tous droits réservés.
        </div>

      </div>
    </footer>
  );
};

export default Footer;
