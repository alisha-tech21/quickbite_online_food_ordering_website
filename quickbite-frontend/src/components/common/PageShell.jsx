import Navbar from "./Navbar";
import Footer from "./Footer";

const PageShell = ({ children }) => (
  <div className="flex min-h-screen flex-col bg-[#f8f8fb]">
    <Navbar />
    <main className="flex-1 pt-20">{children}</main>
    <Footer />
  </div>
);

export default PageShell;
