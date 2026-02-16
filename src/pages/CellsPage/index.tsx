import { useState, useMemo } from "react";
import { Table, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import { ClearOutlined } from "@ant-design/icons";
import { PageHeader } from "@/components/ui/page-header";
import { ModuleCard } from "@/components/ui/stat-card";
import { useTranslation } from "react-i18next";
import { useBinLocations, type BinLocationItem, type BinLocationsFilters } from "@/entities/BinLocations/api";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const CellsPage = () => {
  const { t } = useTranslation();
  
  // Filter state
  const [filterBinCode, setFilterBinCode] = useState("");
  const [appliedFilters, setAppliedFilters] = useState<BinLocationsFilters>({});
  const [pageIndex, setPageIndex] = useState(0);
  
  const filters: BinLocationsFilters = useMemo(() => {
    const f: BinLocationsFilters = { skip: pageIndex };
    if (appliedFilters.BinCode) f.BinCode = appliedFilters.BinCode;
    return f;
  }, [appliedFilters, pageIndex]);
  
  const { data: binLocations = [], isLoading, error } = useBinLocations(filters);
  const pageSize = 20;
  const hasNextPage = binLocations.length >= pageSize;
  const hasPrevPage = pageIndex > 0;
  
  const handleApplyFilters = () => {
    setPageIndex(0);
    setAppliedFilters({
      BinCode: filterBinCode.trim() || undefined,
    });
  };

  const handleClearFilters = () => {
    setFilterBinCode("");
    setAppliedFilters({});
    setPageIndex(0);
  };

  const columns: ColumnsType<BinLocationItem> = [
    {
      title: "#",
      key: "index",
      width: 60,
      align: "center" as const,
      render: (_: any, __: BinLocationItem, index: number) => {
        return pageIndex * pageSize + index + 1;
      },
    },
    {
      title: t("cells_abs_entry"),
      dataIndex: "absEntry",
      key: "absEntry",
      width: 120,
    },
    {
      title: t("cells_warehouse"),
      dataIndex: "warehouse",
      key: "warehouse",
      width: 150,
    },
    {
      title: t("cells_sublevel1"),
      dataIndex: "sublevel1",
      key: "sublevel1",
      width: 150,
    },
    {
      title: t("cells_bin_code"),
      dataIndex: "binCode",
      key: "binCode",
      width: 150,
    },
    {
      title: t("cells_bar_code"),
      dataIndex: "barCode",
      key: "barCode",
      width: 150,
      render: (barCode: string | null) => barCode || "—",
    },
    {
      title: t("cells_minimum_qty"),
      dataIndex: "minimumQty",
      key: "minimumQty",
      width: 120,
      align: "right" as const,
    },
    {
      title: t("cells_maximum_qty"),
      dataIndex: "maximumQty",
      key: "maximumQty",
      width: 120,
      align: "right" as const,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={t("nav.cells")}
        breadcrumbs={[{ label: t("nav.masterData") }, { label: t("nav.cells") }]}
      />

      <ModuleCard>
        {/* Filters */}
        <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div className="space-y-2">
            <Label className="text-xs">{t("cells_filter_bin_code")}</Label>
            <Input
              placeholder={t("cells_filter_bin_code")}
              value={filterBinCode}
              onChange={(e) => setFilterBinCode(e.target.value)}
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
          <Table
            columns={columns}
            dataSource={binLocations}
            rowKey="id"
            pagination={{
              current: pageIndex + 1,
              pageSize: pageSize,
              total: undefined,
              showSizeChanger: false,
              showTotal: (total, range) =>
                t("cells_showing_range", {
                  start: range[0],
                  end: range[1],
                }),
              onChange: (page) => {
                setPageIndex(page - 1);
              },
              showPrevNextJumpers: false,
              hideOnSinglePage: false,
            }}
            scroll={{ x: "max-content" }}
          />
        )}
      </ModuleCard>
    </div>
  );
};

export default CellsPage;
