function Aceulle({ content }) {
  return (
    <main className="home-hero">
      <section className="hero-card">
        <p className="hero-card__eyebrow">{content.eyebrow}</p>
        <h1>{content.title}</h1>
        <p className="hero-card__text">{content.description}</p>
      </section>
    </main>
  );
}

export default Aceulle;
