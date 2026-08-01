"use client";

import { useFilteredCases } from "@/hooks/useEnrichedData";
import { DataTable } from "@/components/tables/DataTable";
import { DataGate } from "@/components/ui/DataGate";

export default function DataPage() {
  const cases = useFilteredCases();
  return (
    <DataGate hasRows={cases.length > 0}>
      <DataTable
        rows={cases}
        filename="accuracy-raw-data"
        pageSize={50}
        columns={[
          { key: "case_id", header: "Case ID", accessor: (r) => r.case_id },
          { key: "technician_name", header: "Technician", accessor: (r) => r.technician_name },
          { key: "site", header: "Site", accessor: (r) => r.site },
          { key: "supervisor", header: "Supervisor/AM", accessor: (r) => r.supervisor },
          { key: "auditor", header: "Auditor", accessor: (r) => r.auditor },
          { key: "clinical_decision", header: "Tech Decision", accessor: (r) => r.clinical_decision },
          {
            key: "auto_decision_recommendation",
            header: "Auto Decision Recommendation",
            accessor: (r) => r.auto_decision_recommendation,
          },
          {
            key: "auto_insight_decision",
            header: "Auto Insight Decision",
            accessor: (r) => r.auto_insight_decision,
          },
          { key: "auditor_finding", header: "Auditor Finding", accessor: (r) => r.auditor_finding },
          { key: "score", header: "Score", accessor: (r) => r.score },
          { key: "category", header: "Category", accessor: (r) => r.category },
          { key: "subcategory", header: "Subcategory", accessor: (r) => r.subcategory },
          { key: "case_date", header: "Date", accessor: (r) => r.case_date },
        ]}
      />
    </DataGate>
  );
}
