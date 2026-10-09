import { UtensilsCrossed } from "lucide-react";
import PageShell from "./PageShell";

const ComingSoon = ({ title, description }) => (
  <PageShell>
    <div className="mx-auto flex max-w-lg flex-col items-center px-6 py-24 text-center">
      <span className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-brand-500">
        <UtensilsCrossed size={28} />
      </span>
      <h1 className="mb-2 text-2xl font-extrabold text-ink">{title}</h1>
      <p className="text-sm text-slate-500">{description}</p>
    </div>
  </PageShell>
);

export default ComingSoon;
