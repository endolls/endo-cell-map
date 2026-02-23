import "./globals.css";

export const metadata = {
  title: "Interactive Endometrial Cell Map (Educational)",
  description:
    "A clickable 3D educational model demonstrating pathways relevant to endometrial biology and endometriosis concepts."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="appShell">
          <header className="topBar">
            <div className="brand">
              <div className="brandTitle">Interactive Endometrial Cell Map</div>
              <div className="brandSub">
                Educational simulator (semi-mechanistic, not predictive)
              </div>
            </div>
            <div className="badgeRow">
              <span className="badge">3D Clickable Model</span>
              <span className="badge">Rules Engine</span>
              <span className="badge">Gene + Outcome Readouts</span>
            </div>
          </header>

          <main className="main">{children}</main>

          <footer className="footer">
            <div>
              <strong>Disclaimer:</strong> This is educational content, not medical
              advice. It does not diagnose, predict, or replace clinical care.
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}