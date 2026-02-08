import { Order, OrderItem, ValidationTask, Good, Employee, AuditLogEntry } from '@/types/wms';

// Mock Orders
export const mockOrders: Order[] = [
  {
    id: '1',
    sapOrderId: 'SAP-2025-001234',
    customerId: 'CUST-001',
    customerName: 'Beauty Store Tashkent',
    status: 'created',
    items: [
      { id: '1-1', sku: 'GLM-LIP-001', barcode: '4820000001234', name: 'Glamour Lipstick Red Velvet', sapQty: 24, cellLocation: 'A-01-001' },
      { id: '1-2', sku: 'GLM-MSC-002', barcode: '4820000001235', name: 'Glamour Mascara Volume', sapQty: 12, cellLocation: 'A-01-002' },
      { id: '1-3', sku: 'GLM-FND-003', barcode: '4820000001236', name: 'Glamour Foundation Natural', sapQty: 8, cellLocation: 'A-02-001' },
    ],
    createdAt: '2025-02-08T09:00:00Z',
    updatedAt: '2025-02-08T09:00:00Z',
    syncInfo: { synced: true, lastSyncAt: '2025-02-08T09:00:00Z', sapId: 'SAP-2025-001234' },
  },
  {
    id: '2',
    sapOrderId: 'SAP-2025-001235',
    customerId: 'CUST-002',
    customerName: 'Cosmetics Plus Samarkand',
    status: 'validated',
    items: [
      { id: '2-1', sku: 'GLM-EYE-004', barcode: '4820000001237', name: 'Glamour Eyeshadow Palette', sapQty: 15, tsdQty: 15, cellLocation: 'B-01-001' },
      { id: '2-2', sku: 'GLM-BLS-005', barcode: '4820000001238', name: 'Glamour Blush Rose', sapQty: 20, tsdQty: 20, cellLocation: 'B-01-002' },
    ],
    createdAt: '2025-02-08T08:30:00Z',
    updatedAt: '2025-02-08T10:15:00Z',
    syncInfo: { synced: true, lastSyncAt: '2025-02-08T10:15:00Z', sapId: 'SAP-2025-001235' },
    assignedTsdId: 'TSD-003',
    validatedBy: 'EMP-002',
    validatedAt: '2025-02-08T10:15:00Z',
  },
  {
    id: '3',
    sapOrderId: 'SAP-2025-001236',
    customerId: 'CUST-003',
    customerName: 'Luxury Beauty Bukhara',
    status: 'collected',
    items: [
      { id: '3-1', sku: 'GLM-PFM-006', barcode: '4820000001239', name: 'Glamour Perfume Elegance', sapQty: 6, tsdQty: 6, cellLocation: 'C-01-001' },
      { id: '3-2', sku: 'GLM-CRM-007', barcode: '4820000001240', name: 'Glamour Face Cream Anti-Age', sapQty: 10, tsdQty: 8, cellLocation: 'C-01-002' },
    ],
    createdAt: '2025-02-08T07:45:00Z',
    updatedAt: '2025-02-08T11:30:00Z',
    syncInfo: { synced: true, lastSyncAt: '2025-02-08T11:30:00Z', sapId: 'SAP-2025-001236' },
    assignedTsdId: 'TSD-001',
  },
  {
    id: '4',
    sapOrderId: 'SAP-2025-001237',
    customerId: 'CUST-004',
    customerName: 'Fashion Cosmetics Fergana',
    status: 'shipped',
    items: [
      { id: '4-1', sku: 'GLM-NLP-008', barcode: '4820000001241', name: 'Glamour Nail Polish Set', sapQty: 30, tsdQty: 30, cellLocation: 'D-01-001' },
    ],
    createdAt: '2025-02-07T14:00:00Z',
    updatedAt: '2025-02-08T08:00:00Z',
    syncInfo: { synced: true, lastSyncAt: '2025-02-08T08:00:00Z', sapId: 'SAP-2025-001237' },
    assignedTsdId: 'TSD-002',
    validatedBy: 'EMP-002',
    validatedAt: '2025-02-07T16:30:00Z',
  },
  {
    id: '5',
    sapOrderId: 'SAP-2025-001238',
    customerId: 'CUST-005',
    customerName: 'Beauty World Namangan',
    status: 'created',
    items: [
      { id: '5-1', sku: 'GLM-SRM-009', barcode: '4820000001242', name: 'Glamour Serum Vitamin C', sapQty: 18, cellLocation: 'A-03-001' },
      { id: '5-2', sku: 'GLM-MKR-010', barcode: '4820000001243', name: 'Glamour Makeup Remover', sapQty: 25, cellLocation: 'A-03-002' },
    ],
    createdAt: '2025-02-08T10:30:00Z',
    updatedAt: '2025-02-08T10:30:00Z',
    syncInfo: { synced: false, lastSyncAt: '2025-02-08T10:25:00Z', sapId: 'SAP-2025-001238' },
  },
];

// Mock Validation Tasks
export const mockValidationTasks: ValidationTask[] = [
  {
    id: 'VAL-001',
    orderId: '3',
    order: mockOrders[2],
    status: 'pending',
    discrepancies: [
      {
        itemId: '3-2',
        sku: 'GLM-CRM-007',
        name: 'Glamour Face Cream Anti-Age',
        sapQty: 10,
        tsdQty: 8,
        difference: -2,
      },
    ],
  },
  {
    id: 'VAL-002',
    orderId: '2',
    order: mockOrders[1],
    status: 'approved',
    discrepancies: [],
    validatorId: 'EMP-002',
    validatedAt: '2025-02-08T10:15:00Z',
  },
];

// Mock Employees
export const mockEmployees: Employee[] = [
  { id: 'EMP-001', uniqueId: 'E001', name: 'Aziz Karimov', role: 'executor', isActive: true, performanceScore: 94, assignedTsdId: 'TSD-001' },
  { id: 'EMP-002', uniqueId: 'E002', name: 'Dilnoza Rahimova', role: 'validator', isActive: true, performanceScore: 98 },
  { id: 'EMP-003', uniqueId: 'E003', name: 'Bobur Aliyev', role: 'executor', isActive: true, performanceScore: 87, assignedTsdId: 'TSD-002' },
  { id: 'EMP-004', uniqueId: 'E004', name: 'Malika Usmanova', role: 'returner', isActive: true, performanceScore: 91 },
  { id: 'EMP-005', uniqueId: 'E005', name: 'Jahongir Toshev', role: 'executor', isActive: false, performanceScore: 72 },
];

// Mock Goods
export const mockGoods: Good[] = [
  { id: 'G001', sku: 'GLM-LIP-001', barcode: '4820000001234', name: 'Glamour Lipstick Red Velvet', category: 'Lips', isActive: true, syncInfo: { synced: true, lastSyncAt: '2025-02-08T08:00:00Z', sapId: 'MAT-001' } },
  { id: 'G002', sku: 'GLM-MSC-002', barcode: '4820000001235', name: 'Glamour Mascara Volume', category: 'Eyes', isActive: true, syncInfo: { synced: true, lastSyncAt: '2025-02-08T08:00:00Z', sapId: 'MAT-002' } },
  { id: 'G003', sku: 'GLM-FND-003', barcode: '4820000001236', name: 'Glamour Foundation Natural', category: 'Face', isActive: true, syncInfo: { synced: true, lastSyncAt: '2025-02-08T08:00:00Z', sapId: 'MAT-003' } },
  { id: 'G004', sku: 'GLM-EYE-004', barcode: '4820000001237', name: 'Glamour Eyeshadow Palette', category: 'Eyes', isActive: true, syncInfo: { synced: true, lastSyncAt: '2025-02-08T08:00:00Z', sapId: 'MAT-004' } },
  { id: 'G005', sku: 'GLM-BLS-005', barcode: '4820000001238', name: 'Glamour Blush Rose', category: 'Face', isActive: true, syncInfo: { synced: true, lastSyncAt: '2025-02-08T08:00:00Z', sapId: 'MAT-005' } },
  { id: 'G006', sku: 'GLM-OLD-099', barcode: '4820000009999', name: 'Glamour Legacy Product', category: 'Discontinued', isActive: false, syncInfo: { synced: true, lastSyncAt: '2024-12-01T08:00:00Z', sapId: 'MAT-099' } },
];

// Mock Audit Logs
export const mockAuditLogs: AuditLogEntry[] = [
  { id: 'LOG-001', timestamp: '2025-02-08T11:30:00.123Z', actorId: 'EMP-001', actorName: 'Aziz Karimov', actionType: 'status_change', module: 'order', documentId: '3', sapId: 'SAP-2025-001236', description: 'Order status changed', previousValue: 'validated', newValue: 'collected' },
  { id: 'LOG-002', timestamp: '2025-02-08T10:15:00.456Z', actorId: 'EMP-002', actorName: 'Dilnoza Rahimova', actionType: 'approve', module: 'order', documentId: '2', sapId: 'SAP-2025-001235', description: 'Order validated and approved' },
  { id: 'LOG-003', timestamp: '2025-02-08T09:00:00.789Z', actorId: 'SYSTEM', actorName: 'SAP Sync', actionType: 'create', module: 'order', documentId: '1', sapId: 'SAP-2025-001234', description: 'Order created from SAP Sales Order' },
  { id: 'LOG-004', timestamp: '2025-02-08T08:00:00.012Z', actorId: 'EMP-003', actorName: 'Bobur Aliyev', actionType: 'status_change', module: 'order', documentId: '4', sapId: 'SAP-2025-001237', description: 'Order shipped', previousValue: 'collected', newValue: 'shipped' },
];

// Dashboard Stats
export const dashboardStats = {
  totalOrders: 156,
  pendingCollection: 23,
  inValidation: 8,
  shippedToday: 42,
  ordersChange: 12,
  collectionChange: -5,
  validationChange: 3,
  shippedChange: 18,
};
