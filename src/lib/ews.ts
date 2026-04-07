import type { SalesOrderDocumentLine } from "@/entities/SalesOrders/api";
import type { CreditMemoLine } from "@/entities/CreditMemos/api";
import type { InventoryTransferRequestLine } from "@/entities/InventoryTransferRequests/api";

export interface EwsIssue {
  /** Human-readable label, e.g. "DocNum 110 / 1954126" */
  label: string;
  /** List of UZ-language error messages for this item */
  messages: string[];
}

/**
 * Mirrors MergedOrderItemDescriptionValidator (backend).
 * Returns UZ-language error messages for a single sales order document line.
 */
export function validateOrderLine(line: SalesOrderDocumentLine): string[] {
  const errors: string[] = [];

  if (!line.itemCode?.trim())
    errors.push("Mahsulot kodi mavjud emas. Iltimos, mahsulot ma'lumotlarini tekshiring.");

  if (!line.itemDescription?.trim())
    errors.push("Mahsulot nomi ko'rsatilmagan. Iltimos, mahsulot ma'lumotlarini tekshiring.");

  // if (!line.barCode?.trim())
  //   errors.push("Mahsulotning shtrix-kodi mavjud emas. Iltimos, mahsulot ma'lumotlarini tekshiring.");

  if (!line.warehouseCode?.trim())
    errors.push("Mahsulot omborga biriktirilmagan. Iltimos, mahsulot ma'lumotlarini tekshiring.");

  if (!line.batchNumber?.trim())
    errors.push("Partiya raqami ko'rsatilmagan. Iltimos, partiya ma'lumotlarini tekshiring.");

  if (!line.batchExpiryDate?.trim())
    errors.push("Partiyaning yaroqlilik muddati ko'rsatilmagan. Iltimos, partiya ma'lumotlarini tekshiring.");

  if ((line.quantity ?? 0) < 0)
    errors.push("Mahsulot miqdori noto'g'ri kiritilgan. Miqdor manfiy bo'lishi mumkin emas.");

  if (line.quantityPerPackage == null)
    errors.push("Qutidagi dona soni ko'rsatilmagan.");
  else if (line.quantityPerPackage <= 0)
    errors.push("Qutidagi dona soni noto'g'ri. Qutidagi miqdor 0 dan katta bo'lishi kerak.");

  return errors;
}

/**
 * Mirrors MergedOrderItemDescriptionValidator for inventory transfer request lines.
 * Same rules as validateOrderLine, applied to InventoryTransferRequestLine.
 */
export function validateTransferLine(line: InventoryTransferRequestLine): string[] {
  const errors: string[] = [];

  if (!line.itemCode?.trim())
    errors.push("Mahsulot kodi mavjud emas. Iltimos, mahsulot ma'lumotlarini tekshiring.");

  if (!line.itemDescription?.trim())
    errors.push("Mahsulot nomi ko'rsatilmagan. Iltimos, mahsulot ma'lumotlarini tekshiring.");

  // if (!line.barCode?.trim())
  //   errors.push("Mahsulotning shtrix-kodi mavjud emas. Iltimos, mahsulot ma'lumotlarini tekshiring.");

  const warehouseCode = line.fromWarehouseCode ?? line.warehouseCode;
  if (!warehouseCode?.trim())
    errors.push("Mahsulot omborga biriktirilmagan. Iltimos, mahsulot ma'lumotlarini tekshiring.");

  if (!line.batchNumber?.trim())
    errors.push("Partiya raqami ko'rsatilmagan. Iltimos, partiya ma'lumotlarini tekshiring.");

  if (!line.batchExpiryDate?.trim())
    errors.push("Partiyaning yaroqlilik muddati ko'rsatilmagan. Iltimos, partiya ma'lumotlarini tekshiring.");

  if ((line.quantity ?? 0) < 0)
    errors.push("Mahsulot miqdori noto'g'ri kiritilgan. Miqdor manfiy bo'lishi mumkin emas.");

  if (line.quantityPerPackage == null)
    errors.push("Qutidagi dona soni ko'rsatilmagan.");
  else if (line.quantityPerPackage <= 0)
    errors.push("Qutidagi dona soni noto'g'ri. Qutidagi miqdor 0 dan katta bo'lishi kerak.");

  return errors;
}

/**
 * Mirrors CreditMemoDraftLineResponseValidator (backend).
 * Returns UZ-language error messages for a single credit memo return line.
 */
export function validateReturnLine(line: CreditMemoLine): string[] {
  const errors: string[] = [];

  if ((line.lineNum ?? 0) < 0)
    errors.push("Buyurtma qatori noto'g'ri. Iltimos, buyurtma ma'lumotlarini tekshiring.");

  if (!line.itemCode?.trim())
    errors.push("Mahsulot kodi mavjud emas. Iltimos, mahsulot ma'lumotlarini tekshiring.");

  if (!line.itemDescription?.trim())
    errors.push("Mahsulot nomi ko'rsatilmagan. Iltimos, sahifani yangilab qayta urinib ko'ring.");

  if ((line.quantity ?? 0) < 0)
    errors.push("Mahsulot miqdori noto'g'ri kiritilgan. Miqdor manfiy bo'lishi mumkin emas.");

  // const barCode = line.U_BarCode ?? line.barCode;
  // if (!barCode?.trim())
  //   errors.push("Mahsulotning shtrix-kodi mavjud emas. Iltimos, mahsulot ma'lumotlarini tekshiring.");

  if (!line.warehouseCode?.trim())
    errors.push("Mahsulot omborga biriktirilmagan. Iltimos, mahsulot ma'lumotlarini tekshiring.");

  if (!line.batchNumbers?.length)
    errors.push("Partiya raqami ko'rsatilmagan. Iltimos, partiya ma'lumotlarini tekshiring.");

  const qtyPerPkg = line.U_QuantityPerBoxLine ?? line.quantityPerPackage;
  if (qtyPerPkg == null)
    errors.push("Qutidagi dona soni ko'rsatilmagan.");
  else if (qtyPerPkg <= 0)
    errors.push("Qutidagi miqdor 0 dan katta bo'lishi kerak.");

  return errors;
}
