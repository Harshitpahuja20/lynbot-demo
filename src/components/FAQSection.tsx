export default function FAQSection() {
  return (
    <section className="s-archive-cases">
      <div className="container">
        <h2 className="s-clients_content-title">FAQ&apos;S</h2>
        <div className="s-archive-cases__grid JS-slide-cards">
          <div className="c-card-case JS-card-case JS-slide c-card-case--small JS-slide-in">
            <div className="c-card__question">
              How long does it take to implement DofinityCI and have it fully conversational?
            </div>
            <div className="c-card__answer">Up to 24 hours.</div>
          </div>
          <div className="c-card-case JS-card-case JS-slide c-card-case--small JS-slide-in">
            <div className="c-card__question">
              To add DofinityCI to my website, do I need to grant code or database access?
            </div>
            <div className="c-card__answer">
              No. DofinityCI sits on top of your existing UI. No code, database,
              or additional integrations required.
            </div>
          </div>
          <div className="c-card-case JS-card-case JS-slide c-card-case--small JS-slide-in">
            <div className="c-card__question">
              Can I use a conversational interface on my internal applications?
            </div>
            <div className="c-card__answer">Yes. DofinityCI can run on any internal application.</div>
          </div>
          <div className="c-card-case JS-card-case JS-slide c-card-case--medium JS-slide-in">
            <div className="c-card__question">Which languages does DofinityCI support?</div>
            <div className="c-card__answer">
              DofinityCI supports most modern languages, both for ingesting
              content and for the user-facing conversation.
            </div>
          </div>
          <div className="c-card-case JS-card-case JS-slide c-card-case--medium JS-slide-in">
            <div className="c-card__question">Can I see a demo on my own data before purchase?</div>
            <div className="c-card__answer">
              Yes. We can provide a fully working demo on your data for evaluation
              before purchasing (Demo cost will be quoted per scope).
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}