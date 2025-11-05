export default function Footer() {
  return (
    <footer>
      <div className="c-popup__footer">
        <div className="c-popup__footer-left">
          <a href="https://www.dofinity.com/" className="c-popup__footer-logo">
            <svg className="" viewBox="0 0 440 212" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M334.038 211.812C394.194 211.812 439.958 166.279 439.958 105.762C439.958 45.2441 394.194 0 334.038 0C273.019 0 228.118 45.2441 228.118 105.762C228.118 166.279 273.019 211.812 334.038 211.812ZM294.894 105.762C294.894 83.2837 311.3 66.8575 334.038 66.8575C356.776 66.8575 373.182 83.2837 373.182 105.762C373.182 128.528 356.776 144.954 334.038 144.954C311.3 144.954 294.894 128.528 294.894 105.762Z"></path>
              <path d="M0 202.975C0 205.356 1.93006 207.286 4.3109 207.286H174.74C194.576 207.286 208.088 193.741 208.088 173.857V37.5444C208.088 17.6595 194.576 4.11473 174.74 4.11473H4.3109C1.93005 4.11473 0 6.04478 0 8.42563V202.975ZM66.1207 143.021V68.3803C66.1207 60.0229 71.5828 54.5474 79.9198 54.5474C88.2567 54.5474 93.7189 60.0229 93.7189 68.3803V143.021C93.7189 151.378 88.2567 156.854 79.9198 156.854C71.5828 156.854 66.1207 151.378 66.1207 143.021Z"></path>
            </svg>
          </a>
          <div>
            <p className="c-popup__nav-title">OUR OFFICES</p>
            <div className="c-popup__nav-map">
              <p>HaTa&apos;asiya St 9, Tel Aviv-Yafo, Israel</p>
              <a className="c-popup__footer-map-link" href="https://goo.gl/maps/F5xVhVtzGoNauwSv6" target="_blank" rel="noopener noreferrer">
                Show on map
              </a>
            </div>
          </div>
        </div>

        <div className="c-popup__footer-right">
          <div>
            <p className="c-popup__nav-title">CONTACT NUMBER</p>
            <a className="c-popup__footer-tel-link" href="tel:+972 (7) 239-52528">+972 (7) 239-52528</a>
          </div>
          <div>
            <p className="c-popup__nav-title">FOLLOW US ON</p>
            <div className="c-popup__footer-social">
              <a href="https://www.facebook.com/dofinity" target="_blank" rel="noopener noreferrer">
                <svg className="" width="24" height="25" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" clipRule="evenodd" d="M24 12.8845C24 6.21729 18.6269 0.811523 12 0.811523C5.37309 0.811523 0 6.21729 0 12.8845C0 18.9099 4.38761 23.9048 10.1252 24.8115V16.3752H7.07748V12.8845H10.1252V10.224C10.1252 7.19855 11.9173 5.52623 14.6578 5.52623C15.9707 5.52623 17.3444 5.76221 17.3444 5.76221V8.73339H15.8306C14.3406 8.73339 13.8748 9.66378 13.8748 10.6196V12.8844H17.2026L16.671 16.3751H13.8747V24.8114C19.6123 23.9064 23.9999 18.9115 23.9999 12.8844L24 12.8845Z"></path>
                </svg>
              </a>
              <a href="https://www.linkedin.com/company/dofinity/" target="_blank" rel="noopener noreferrer">
                <svg className="" width="24" height="25" viewBox="0 0 24 25" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 0.811523H5C2.239 0.811523 0 3.05052 0 5.81152V19.8115C0 22.5725 2.239 24.8115 5 24.8115H19C21.762 24.8115 24 22.5725 24 19.8115V5.81152C24 3.05052 21.762 0.811523 19 0.811523ZM8 19.8115H5V8.81152H8V19.8115ZM6.5 7.54352C5.534 7.54352 4.75 6.75352 4.75 5.77952C4.75 4.80552 5.534 4.01552 6.5 4.01552C7.466 4.01552 8.25 4.80552 8.25 5.77952C8.25 6.75352 7.467 7.54352 6.5 7.54352ZM20 19.8115H17V14.2075C17 10.8395 13 11.0945 13 14.2075V19.8115H10V8.81152H13V10.5765C14.396 7.99052 20 7.79952 20 13.0525V19.8115Z"></path>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}