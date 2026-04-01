/**
 * CompanySelector — Dropdown to select the active legal entity.
 */

import { useAppState } from "@/store/appState";
import { Building2 } from "lucide-react";

export function CompanySelector() {
  const { currentCompany, availableCompanies, setCompany } = useAppState();

  const companies = availableCompanies.length > 0
    ? availableCompanies
    : ["USMF", "USSI", "USRT", "DAT", "DEMF"];

  return (
    <div className="flex items-center gap-2">
      <Building2 className="h-4 w-4 text-muted-foreground" />
      <select
        value={currentCompany}
        onChange={(e) => setCompany(e.target.value)}
        className="h-8 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        aria-label="Select company"
      >
        {companies.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
    </div>
  );
}
