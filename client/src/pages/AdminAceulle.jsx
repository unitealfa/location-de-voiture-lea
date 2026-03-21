function AdminAceulle({ content, admin }) {
  return (
    <main className="admin-home">
      <section className="admin-home-card">
        <p className="admin-home-card__eyebrow">{content.eyebrow}</p>
        <h1>
          {content.titlePrefix}, {admin.username}
        </h1>
        <p className="admin-home-card__text">{content.description}</p>
      </section>
    </main>
  );
}

export default AdminAceulle;
