"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <section className="section">
      <div className="container">
        <h1>Something went wrong</h1>
        <p className="lead">The page could not be loaded. Please try again in a moment.</p>
        <div className="actions">
          <button type="button" className="btn" onClick={reset}>
            Try again
          </button>
        </div>
      </div>
    </section>
  );
}
