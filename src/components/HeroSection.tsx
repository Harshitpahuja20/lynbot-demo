export default function HeroSection() {
  return (
    <section className="s-hero">
      <div className="s-hero_animation JS-video-autoplay">
        <div className="object-cover s-hero_video-desktop">
          <lottie-player 
            autoPlay 
            loop 
            speed="1" 
            mode="normal"
            className="s-ai-decision__item-lottie" 
            src="/assets/Dofinity_CI_hero3.json"
            background="transparent">
          </lottie-player>
        </div>
        <div className="mobile-hero-container">
          <img src="/assets/mobile-hero.png" alt="" />
        </div>
      </div>

      <div className="container-xl">
        <div className="s-hero__content">
          <h1 className="s-hero__title">
            Your information can now talk back
          </h1>
          <p className="s-hero__subtitle">
            Evolve your existing UI into the next era of user interaction: conversation
          </p>
          <p className="s-hero__text">
            DofinityCI turns your website, knowledge base, docs, and any other digital
            sources into a dialog, so users can ask, get a cited answer, and act. No infrastructure changes
            required.
          </p>
          <a href="#contact-form" className="s-hero__link">
            Start the Conversation
            <svg className="" fill="#FFDE66" width="21" height="20" viewBox="0 0 21 20" xmlns="http://www.w3.org/2000/svg">
              <path d="M2.51749 20.0001C2.9037 20.0001 3.28991 19.8621 3.59336 19.5311L18.2141 4.91036L18.1038 10.7311V10.8138C18.1038 11.6414 18.7107 12.2483 19.5658 12.2483C20.3658 12.2483 20.9452 11.6414 20.9452 10.8138V1.54483C20.9452 1.07587 20.8348 0.689657 20.5589 0.413794C20.2279 0.110345 19.8693 0 19.4003 0H10.1589C9.33131 0 8.72441 0.579312 8.72441 1.35173C8.72441 2.2069 9.33131 2.8138 10.1589 2.8138H10.2417L16.1175 2.73104L1.44162 17.407C1.11059 17.738 0.972656 18.069 0.972656 18.4552C0.972656 19.3104 1.71749 20.0001 2.51749 20.0001Z"></path>
            </svg>
          </a>
        </div>
      </div>
    </section>
  )
}