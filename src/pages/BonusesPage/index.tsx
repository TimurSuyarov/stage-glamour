import { useState, useRef, useEffect, useCallback } from "react";
import { Table, Select, DatePicker, Modal } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { PageHeader } from "@/components/ui/page-header";
import { ModuleCard } from "@/components/ui/stat-card";
import { useTranslation } from "react-i18next";
import {
  useBonusRecordsGrouped,
  useBonusRecordsInfinite,
  useBonusRecordByDoc,
  BONUS_RECORD_TYPE_LABELS,
  BONUS_RECORD_TYPE_VALUES,
  PAGE_SIZE,
  type BonusRecordGroupedItem,
  type BonusRecordItem,
  type BonusRecordsGroupedFilters,
} from "@/entities/BonusRecords/api";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const { RangePicker } = DatePicker;

const DEFAULT_FROM = dayjs().subtract(7, "day").startOf("day");
const DEFAULT_TO = dayjs().endOf("day");
const DEFAULT_FILTERS: BonusRecordsGroupedFilters = {
  From: DEFAULT_FROM.toISOString(),
  To: DEFAULT_TO.toISOString(),
};

// ─── Expanded row with infinite scroll ───────────────────────────────────────
function ExpandedBonusRow({
  employeeId,
  filters,
  onRecordClick,
}: {
  employeeId: number;
  filters: BonusRecordsGroupedFilters;
  onRecordClick: (record: BonusRecordItem) => void;
}) {
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useBonusRecordsInfinite(employeeId, filters);

  const items: BonusRecordItem[] = data?.pages.flat() ?? [];

  // Load more when scrolled near the bottom
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || isFetchingNextPage || !hasNextPage) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    if (nearBottom) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Re-check after new data arrives (in case list is too short to require scrolling)
  useEffect(() => {
    handleScroll();
  }, [handleScroll, data]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const columns: ColumnsType<BonusRecordItem> = [
    {
      title: "#",
      key: "idx",
      width: 50,
      align: "center",
      render: (_: unknown, __: BonusRecordItem, idx: number) => idx + 1,
    },
    {
      title: t("bonuses.type"),
      dataIndex: "type",
      key: "type",
      width: 230,
      render: (val: number) => t(BONUS_RECORD_TYPE_LABELS[val] ?? String(val)),
    },
    {
      title: t("bonuses.amount"),
      dataIndex: "totalPrice",
      key: "totalPrice",
      width: 140,
      align: "right",
      render: (val: number) =>
        val != null ? (
          <span className="text-green-600 font-semibold">
            +{val.toLocaleString()}
          </span>
        ) : (
          "—"
        ),
    },
    {
      title: t("common.createdAt"),
      dataIndex: "createdAt",
      key: "createdAt",
      width: 180,
      render: (val: string) => new Date(val).toLocaleString(),
    },
  ];

  return (
    <div
      ref={scrollRef}
      className="max-h-[320px] overflow-y-auto rounded-md border border-border bg-muted/20"
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
          {t("common.noData")}
        </div>
      ) : (
        <>
          <Table
            columns={columns}
            dataSource={items}
            rowKey="id"
            pagination={false}
            size="small"
            scroll={{ x: "max-content" }}
            onRow={(record) => ({
              onClick: () => onRecordClick(record),
              style: { cursor: "pointer" },
            })}
          />
          {isFetchingNextPage && (
            <div className="flex justify-center py-2 border-t border-border">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          )}
          {!hasNextPage && items.length >= PAGE_SIZE && (
            <p className="text-xs text-center text-muted-foreground py-2 border-t border-border">
              — {t("common.noData")} —
            </p>
          )}
        </>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function BonusesPage() {
  const { t } = useTranslation();

  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    DEFAULT_FROM,
    DEFAULT_TO,
  ]);
  const [type, setType] = useState<number | null>(null);
  const [expandedRowKeys, setExpandedRowKeys] = useState<number[]>([]);
  const [appliedFilters, setAppliedFilters] =
    useState<BonusRecordsGroupedFilters>(DEFAULT_FILTERS);
  const [modalDoc, setModalDoc] = useState<{ type: number; docEntry: number } | null>(null);

  const { data: groupedData = [], isLoading, error } =
    useBonusRecordsGrouped(appliedFilters);
  const { data: modalData, isLoading: modalLoading } = useBonusRecordByDoc(
    modalDoc?.type ?? null,
    modalDoc?.docEntry ?? null
  );

  const typeOptions = Object.entries(BONUS_RECORD_TYPE_VALUES).map(
    ([, val]) => ({
      value: val,
      label: t(BONUS_RECORD_TYPE_LABELS[val]),
    })
  );

  // Auto-apply filters when dateRange or type changes
  useEffect(() => {
    setExpandedRowKeys([]);
    setAppliedFilters({
      From: dateRange[0].toISOString(),
      To: dateRange[1].toISOString(),
      Type: type ?? undefined,
    });
  }, [dateRange, type]);

  const handleClear = () => {
    setDateRange([DEFAULT_FROM, DEFAULT_TO]);
    setType(null);
    setExpandedRowKeys([]);
  };

  const mainColumns: ColumnsType<BonusRecordGroupedItem> = [
    {
      title: "#",
      key: "index",
      width: 60,
      align: "center",
      render: (_: unknown, __: BonusRecordGroupedItem, idx: number) => idx + 1,
    },
    {
      title: t("bonuses.employee"),
      dataIndex: "employeeName",
      key: "employeeName",
      render: (val: string | null) => val ?? "—",
    },
    {
      title: t("bonuses.amount"),
      dataIndex: "totalPrice",
      key: "totalPrice",
      width: 180,
      align: "right",
      render: (val: number) =>
        val != null ? val.toLocaleString() : "—",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={t("nav.bonuses")}
        breadcrumbs={[
          { label: t("nav.masterData") },
          { label: t("nav.bonuses") },
        ]}
      />

      <ModuleCard>
        {/* ── Filter bar ── */}
        <div className="flex flex-wrap items-end gap-3 mb-6">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">
              {t("bonuses.dateRange")}
            </span>
            <RangePicker
              value={dateRange}
              onChange={(vals) => {
                if (vals?.[0] && vals?.[1])
                  setDateRange([vals[0], vals[1]]);
              }}
              className="h-9"
              allowClear={false}
            />
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">
              {t("bonuses.type")}
            </span>
            <Select
              placeholder={t("bonuses.selectType")}
              value={type ?? undefined}
              onChange={(val) => setType(val ?? null)}
              options={typeOptions}
              allowClear
              className="w-[230px] [&_.ant-select-selector]:!h-9"
            />
          </div>

          <div className="ml-auto">
            <Button
              variant="ghost"
              size="sm"
              className="h-9"
              onClick={handleClear}
            >
              {t("common_clear_filters")}
            </Button>
          </div>
        </div>

        {/* ── Main grouped table ── */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">
              {t("common_loading")}
            </span>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-12 text-destructive">
            {error instanceof Error ? error.message : String(error)}
          </div>
        ) : (
          <Table
            columns={mainColumns}
            dataSource={groupedData}
            rowKey="employeeId"
            pagination={false}
            expandable={{
              expandedRowKeys,
              onExpandedRowsChange: (keys) =>
                setExpandedRowKeys(keys as number[]),
              expandedRowRender: (record: BonusRecordGroupedItem) => (
                <ExpandedBonusRow
                  employeeId={record.employeeId}
                  filters={appliedFilters}
                  onRecordClick={(r) => setModalDoc({ type: r.type, docEntry: r.docEntry })}
                />
              ),
              rowExpandable: () => true,
            }}
          />
        )}
      </ModuleCard>

      <Modal
        title={
          modalData
            ? `${modalData.cardName} — №${modalData.docNum}`
            : t("bonuses.detail")
        }
        open={modalDoc != null}
        onCancel={() => setModalDoc(null)}
        footer={null}
        width={1200}
        destroyOnClose
      >
        {modalLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : modalData ? (
          <Table
            size="small"
            pagination={false}
            rowKey={(_, i) => String(i)}
            scroll={{ x: "max-content" }}
            columns={[
              {
                title: t("inventoryCountings.itemCode"),
                dataIndex: "itemCode",
                key: "itemCode",
                width: 120,
              },
              {
                title: t("inventoryCountings.itemDescription"),
                dataIndex: "itemDescription",
                key: "itemDescription",
              },
              {
                title: t("common.quantity"),
                dataIndex: "quantity",
                key: "quantity",
                width: 100,
                align: "right",
              },
            ]}
            dataSource={modalData.documentLines}
          />
        ) : null}
      </Modal>
    </div>
  );
}
