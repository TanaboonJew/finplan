"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  summarizeMemberCoverage,
  buildCoverageGaps,
} from "@/lib/finance/insurance";
import { useInsuranceStore } from "@/lib/storage/insurance-store";
import { useMounted } from "./use-mounted";
import { InsuranceToolbar } from "./insurance-toolbar";
import { InsuranceStats } from "./insurance-stats";
import { MembersEditor } from "./members-editor";
import { PoliciesEditor } from "./policies-editor";
import { CoverageTable } from "./coverage-table";
import { GapChecklist } from "./gap-checklist";

export function InsuranceTool() {
  const t = useTranslations("insurance");
  const mounted = useMounted();

  const members = useInsuranceStore((state) => state.members);
  const policies = useInsuranceStore((state) => state.policies);

  const coverage = useMemo(
    () => summarizeMemberCoverage(members, policies),
    [members, policies]
  );

  const gaps = useMemo(
    () => buildCoverageGaps(members, policies),
    [members, policies]
  );

  if (!mounted) {
    return (
      <div
        className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-10"
        aria-busy="true"
      >
        <span className="sr-only">{t("loading")}</span>
        <div className="flex animate-pulse flex-col gap-6">
          <div className="h-9 w-64 rounded-md bg-muted" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="h-24 rounded-lg bg-muted" />
            <div className="h-24 rounded-lg bg-muted" />
            <div className="h-24 rounded-lg bg-muted" />
            <div className="h-24 rounded-lg bg-muted" />
          </div>
          <div className="h-48 rounded-lg bg-muted" />
          <div className="h-72 rounded-lg bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:py-10">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {t("title")}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>
        <InsuranceToolbar />
      </header>

      <InsuranceStats policies={policies} membersCount={members.length} />

      <MembersEditor
        members={members}
        onAdd={(member) => useInsuranceStore.getState().addMember(member)}
        onUpdate={(id, patch) =>
          useInsuranceStore.getState().updateMember(id, patch)
        }
        onRemove={(id) => useInsuranceStore.getState().removeMember(id)}
      />

      <PoliciesEditor
        policies={policies}
        members={members}
        onAdd={(policy) => useInsuranceStore.getState().addPolicy(policy)}
        onUpdate={(id, patch) =>
          useInsuranceStore.getState().updatePolicy(id, patch)
        }
        onRemove={(id) => useInsuranceStore.getState().removePolicy(id)}
      />

      <CoverageTable coverage={coverage} />

      <GapChecklist gaps={gaps} />
    </div>
  );
}
