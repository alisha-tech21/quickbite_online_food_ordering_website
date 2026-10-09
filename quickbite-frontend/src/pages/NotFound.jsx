import { Link } from "react-router-dom";
import { UtensilsCrossed } from "lucide-react";
import PageShell from "../components/common/PageShell";

const NotFound = () => (
  <PageShell>
    <div className="mx-auto flex max-w-lg flex-col items-center px-6 py-24 text-center">
      <span className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-brand-500">
        <UtensilsCrossed size={28} />
      </span>
      <h1 className="mb-2 text-2xl font-extrabold text-ink">
        404 — Page Not Found
      </h1>
      <p className="mb-6 text-sm text-slate-500">
        The page you're looking for doesn't exist.
      </p>
      <Link to="/" className="font-semibold text-brand-500 hover:underline">
        ← Back to home
      </Link>
    </div>
  </PageShell>
);

export default NotFound;
