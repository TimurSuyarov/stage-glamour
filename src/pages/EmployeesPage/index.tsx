import { useState, useMemo } from "react";
import { Table, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import { ClearOutlined } from "@ant-design/icons";
import { PageHeader } from "@/components/ui/page-header";
import { ModuleCard } from "@/components/ui/stat-card";
import { useTranslation } from "react-i18next";
import { useEmployees, type EmployeeItem, type EmployeesFilters } from "@/entities/Employees/api";
import { Loader2, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function EmployeesPage() {
  const { t } = useTranslation();
  
  // Filter state
  const [filterFirstName, setFilterFirstName] = useState("");
  const [filterLastName, setFilterLastName] = useState("");
  const [appliedFilters, setAppliedFilters] = useState<EmployeesFilters>({});
  const [pageIndex, setPageIndex] = useState(0);
  
  const pageSize = 20;
  
  const filters: EmployeesFilters = useMemo(() => {
    const f: EmployeesFilters = { skip: pageIndex * pageSize };
    if (appliedFilters.FirstName) f.FirstName = appliedFilters.FirstName;
    if (appliedFilters.LastName) f.LastName = appliedFilters.LastName;
    return f;
  }, [appliedFilters, pageIndex, pageSize]);
  
  const { data: employees = [], isLoading, error } = useEmployees(filters);
  const hasNextPage = employees.length >= pageSize;
  const hasPrevPage = pageIndex > 0;
  const rangeStart = pageIndex * pageSize + 1;
  const rangeEnd = (pageIndex + 1) * pageSize;

  const handleApplyFilters = () => {
    setPageIndex(0);
    setAppliedFilters({
      FirstName: filterFirstName.trim() || undefined,
      LastName: filterLastName.trim() || undefined,
    });
  };

  const handleClearFilters = () => {
    setFilterFirstName("");
    setFilterLastName("");
    setAppliedFilters({});
    setPageIndex(0);
  };

  const columns: ColumnsType<EmployeeItem> = [
    {
      title: "#",
      key: "index",
      width: 60,
      align: "center" as const,
      render: (_: any, __: EmployeeItem, index: number) => {
        return pageIndex * pageSize + index + 1;
      },
    },
    {
      title: t("employees_employee_id"),
      dataIndex: "EmployeeID",
      key: "EmployeeID",
      width: 120,
    },
    {
      title: t("employees_name"),
      key: "name",
      render: (_: any, record: EmployeeItem) => {
        const fullName = `${record.firstName || ""} ${record.lastName || ""}`.trim();
        return fullName || "—";
      },
    },
    {
      title: t("employees_job_title"),
      dataIndex: "jobTitle",
      key: "jobTitle",
      width: 200,
      render: (jobTitle: string | null) => jobTitle || "—",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={t("nav.employees")}
        breadcrumbs={[{ label: t("nav.masterData") }, { label: t("nav.employees") }]}
        actions={
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            {t("common_create")}
          </Button>
        }
      />

      <ModuleCard>
        {/* Filters */}
        <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div className="space-y-2">
            <Label className="text-xs">{t("employees_filter_first_name")}</Label>
            <Input
              placeholder={t("employees_filter_first_name")}
              value={filterFirstName}
              onChange={(e) => setFilterFirstName(e.target.value)}
              className="h-9"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">{t("employees_filter_last_name")}</Label>
            <Input
              placeholder={t("employees_filter_last_name")}
              value={filterLastName}
              onChange={(e) => setFilterLastName(e.target.value)}
              className="h-9"
            />
          </div>
          <Button onClick={handleApplyFilters} className="h-9">
            {t("common_apply")}
          </Button>
          <Tooltip title={t("common_clear_filters")}>
            <button
              type="button"
              onClick={handleClearFilters}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-accent text-accent-foreground"
              aria-label={t("common_clear_filters")}
            >
              <ClearOutlined className="h-4 w-4" />
            </button>
          </Tooltip>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">{t("common_loading")}</span>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-12 text-destructive">
            {error instanceof Error ? error.message : String(error)}
          </div>
        ) : (
          <>
            <Table
              columns={columns}
              dataSource={employees}
              rowKey="EmployeeID"
              pagination={false}
              scroll={{ x: "max-content" }}
            />

            {/* Custom Pagination */}
            {(employees.length > 0 || pageIndex > 0) && (
              <div className="flex items-center justify-between border-t border-border px-4 py-3 mt-0">
                <div className="text-sm text-muted-foreground">
                  {t("employees_showing_range", {
                    start: rangeStart,
                    end: rangeEnd,
                  })}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setPageIndex((p) => p - 1)}
                    disabled={!hasPrevPage}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="px-3 text-sm font-medium">
                    {hasPrevPage && "< "}
                    {rangeStart} - {rangeEnd}
                    {hasNextPage && " >"}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setPageIndex((p) => p + 1)}
                    disabled={!hasNextPage}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </ModuleCard>
    </div>
  );
}
