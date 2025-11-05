export default function ContactSection() {
  return (
    <section id="contact-form" className="contact-container">
      <div className="container">
        <div>
          <div className="c-popup__body">
            <div className="c-popup__body-text">
              <h2 className="c-popup__title js--popup-title">Start the conversation</h2>
            </div>
            <div className="c-form">
              <div className="wpcf7 js" id="wpcf7-f133-o1" lang="en-US" dir="ltr">
                <div className="screen-reader-response">
                  <p role="status" aria-live="polite" aria-atomic="true"></p>
                </div>
                <form className="wpcf7-form init" aria-label="Contact form" noValidate data-status="init">
                  <p>
                    <label>
                      Full Name*<br />
                      <span className="wpcf7-form-control-wrap" data-name="full-name">
                        <input 
                          size={40}
                          maxLength={400}
                          className="wpcf7-form-control wpcf7-text wpcf7-validates-as-required"
                          aria-required="true"
                          aria-invalid="false"
                          placeholder=""
                          defaultValue=""
                          type="text"
                          name="full-name"
                        />
                      </span><br />
                    </label>
                    <label>
                      Phone Number*<br />
                      <span className="wpcf7-form-control-wrap" data-name="number">
                        <input 
                          size={40}
                          maxLength={400}
                          className="wpcf7-form-control wpcf7-tel wpcf7-validates-as-required wpcf7-text wpcf7-validates-as-tel"
                          aria-required="true"
                          aria-invalid="false"
                          placeholder=""
                          defaultValue=""
                          type="tel"
                          name="number"
                        />
                      </span><br />
                    </label>
                  </p>
                  <p>
                    <label>
                      Company Website*<br />
                      <span className="wpcf7-form-control-wrap" data-name="company-website">
                        <input 
                          size={40}
                          maxLength={400}
                          className="wpcf7-form-control wpcf7-url-validates-as-required"
                          aria-required="true"
                          aria-invalid="false"
                          placeholder=""
                          type="url"
                          name="company-website"
                        />
                      </span><br />
                    </label>
                    <label>
                      Email*<br />
                      <span className="wpcf7-form-control-wrap" data-name="email">
                        <input 
                          size={40}
                          maxLength={400}
                          className="wpcf7-form-control wpcf7-email wpcf7-validates-as-required wpcf7-text wpcf7-validates-as-email"
                          aria-required="true"
                          aria-invalid="false"
                          placeholder=""
                          defaultValue=""
                          type="email"
                          name="email"
                        />
                      </span><br />
                    </label>
                  </p>
                  <p></p>
                  <p>
                    <button type="submit" className="wpcf7-form-control has-spinner wpcf7-submit">
                      SEND
                    </button>
                    <span className="wpcf7-spinner"></span>
                  </p>
                  <div className="wpcf7-response-output" aria-hidden="true"></div>
                </form>
              </div>
              <div className="c-form__thanks JS-thanks-content">
                <h3>Thanks - Your message is on its way!</h3>
                <div className="c-form__thanks-action">
                  <button className="JS-thanks-btn">
                    <span className="c-form__thanks-static">Fill another form</span>
                    <span className="c-form__thanks-italic">Fill another form</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}