"use client";

import { useTranslations } from "next-intl";
import type { MemberCoverage } from "@/lib/finance/insurance";
import { useMoney } from "./insurance-format";

interface CoverageTableProps {
  coverage: MemberCoverage[];
}

export function CoverageTable({ coverage }: CoverageTableProps) {
  const t = useTranslations("insurance.coverage");
  const money = useMoney();

  if (coverage.length === 0) {
    return (
      <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <h3 className="text-sm font-semibold">{t("title")}</h3>
        <p className="mt-3 text-sm text-muted-foreground">{t("noPolicies")}</p>
      </section>
    );
  }

  const totalSumInsured = coverage.reduce(
    (sum, c) => sum + c.totalSumInsured,
    0
  );
  const totalAnnualPremium = coverage.reduce(
    (sum, c) => sum + c.totalAnnualPremium,
    0
  );
  const totalPolicies = coverage.reduce(
    (sum, c) => sum + c.policies.length,
    0
  );

  return (
    <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <h3 className="text-sm font-semibold">{t("title")}</h3>
      <p className="mt-1 text-xs text-muted-foreground">{t("subtitle")}</p>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="pb-2 pr-4 font-medium">{t("colMember")}</th>
              <th className="pb-2 pr-4 font-medium">{t("colRelationship")}</th>
              <th className="pb-2 pr-4 text-right font-medium">
                {t("colPolicies")}
              </th>
              <th className="pb-2 pr-4 text-right font-medium">
                {t("colSumInsured")}
              </th>
              <th className="pb-2 text-right font-medium">
                {t("colAnnualPremium")}
              </th>
            </tr>
          </thead>
          <tbody>
            {coverage.map((row) => (
              <tr
                key={row.memberId}
                className="border-b border-border last:border-b-0"
              >
                <td className="py-2 pr-4 font-medium">{row.memberName}</td>
                <td className="py-2 pr-4 text-muted-foreground">
                  {row.relationship}
                </td>
                <td className="py-2 pr-4 text-right tabular-nums">
                  {row.policies.length}
                </td>
                <td className="py-2 pr-4 text-right tabular-nums">
                  {row.totalSumInsured > 0
                    ? money.currency(row.totalSumInsured)
                    : "—"}
                </td>
                <td className="py-2 text-right tabular-nums">
                  {row.totalAnnualPremium > 0
                    ? money.currency(row.totalAnnualPremium)
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-border font-medium">
              <td className="pt-2 pr-4" colSpan={2}>
                {t("totalRow")}
              </td>
              <td className="pt-2 pr-4 text-right tabular-nums">
                {totalPolicies}
              </td>
              <td className="pt-2 pr-4 text-right tabular-nums">
                {totalSumInsured > 0 ? money.currency(totalSumInsured) : "—"}
              </td>
              <td className="pt-2 text-right tabular-nums">
                {totalAnnualPremium > 0
                  ? money.currency(totalAnnualPremium)
                  : "—"}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}
