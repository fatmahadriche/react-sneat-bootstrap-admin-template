const Footer = () => {
    return (
        <footer className="content-footer footer bg-footer-theme">
            <div className="container-xxl d-flex flex-wrap justify-content-between py-2 flex-md-row flex-column">
              <div className="mb-2 mb-md-0">
                ©
                  {(new Date().getFullYear())}
                , made with ❤️ by
                <a aria-label="go to themeselection" href="https://themeselection.com" target="_blank" rel='noreferrer' className="footer-link fw-medium">ThemeSelection</a>
                
              </div>
              
            </div>
          </footer>
      );
}
export default Footer;