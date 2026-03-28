function AdminVisualPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#ffffff",
        color: "#111111",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
        fontFamily: "Arial, sans-serif"
      }}
    >
      <h1
        style={{
          margin: 0,
          fontSize: "clamp(28px, 5vw, 56px)",
          fontWeight: 700,
          textTransform: "none"
        }}
      >
        modifier le text
      </h1>
    </main>
  );
}

export default AdminVisualPage;
