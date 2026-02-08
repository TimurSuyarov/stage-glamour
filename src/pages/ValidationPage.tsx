import { useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { ModuleCard } from '@/components/ui/stat-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { mockValidationTasks, mockOrders } from '@/data/mockData';
import { ValidationTask } from '@/types/wms';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Package,
  ArrowRight,
} from 'lucide-react';

export default function ValidationPage() {
  const { t } = useLanguage();
  const { hasPermission } = useAuth();
  const [selectedTask, setSelectedTask] = useState<ValidationTask | null>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectNotes, setRejectNotes] = useState('');

  const canValidate = hasPermission('validation', 'approve');

  const pendingTasks = mockValidationTasks.filter(t => t.status === 'pending');
  const completedTasks = mockValidationTasks.filter(t => t.status !== 'pending');

  const handleApprove = () => {
    console.log('Approving task:', selectedTask?.id);
    setShowApproveDialog(false);
    setSelectedTask(null);
  };

  const handleReject = () => {
    console.log('Rejecting task:', selectedTask?.id, 'Notes:', rejectNotes);
    setShowRejectDialog(false);
    setSelectedTask(null);
    setRejectNotes('');
  };

  // Check if approval is allowed (no discrepancies)
  const canApprove = selectedTask ? selectedTask.discrepancies.length === 0 : false;

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={t('validation.title')}
        breadcrumbs={[{ label: t('nav.operational') }, { label: t('validation.title') }]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task Queue */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
            Pending ({pendingTasks.length})
          </h3>
          
          {pendingTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center bg-card rounded-lg border border-border">
              <div className="w-16 h-16 rounded-full bg-status-success-bg flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-status-success" />
              </div>
              <p className="font-medium text-foreground">Queue is empty</p>
              <p className="text-sm text-muted-foreground">All validations completed</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingTasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => setSelectedTask(task)}
                  className={cn(
                    'w-full p-4 rounded-lg border text-left transition-all',
                    selectedTask?.id === task.id
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'border-border bg-card hover:border-primary/50'
                  )}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="font-medium">{task.order.sapOrderId}</span>
                    {task.discrepancies.length > 0 && (
                      <span className="flex items-center gap-1 text-xs text-status-error font-medium">
                        <AlertTriangle className="w-3 h-3" />
                        {task.discrepancies.length}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{task.order.customerName}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <Package className="w-3 h-3" />
                    {task.order.items.length} items
                  </div>
                </button>
              ))}
            </div>
          )}

          {completedTasks.length > 0 && (
            <>
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mt-6">
                Completed ({completedTasks.length})
              </h3>
              <div className="space-y-2">
                {completedTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-3 rounded-lg border border-border bg-muted/30 opacity-60"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{task.order.sapOrderId}</span>
                      <StatusBadge status={task.status} size="sm" />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Validation Detail */}
        <div className="lg:col-span-2">
          {selectedTask ? (
            <ModuleCard>
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold">{selectedTask.order.sapOrderId}</h2>
                  <p className="text-muted-foreground">{selectedTask.order.customerName}</p>
                </div>
                <StatusBadge status={selectedTask.order.status} />
              </div>

              {/* Discrepancy Alert */}
              {selectedTask.discrepancies.length > 0 && (
                <div className="mb-6 p-4 rounded-lg bg-status-error-bg border border-status-error/30">
                  <div className="flex items-center gap-2 text-status-error font-medium mb-2">
                    <AlertTriangle className="w-5 h-5" />
                    {t('validation.mismatchError')}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {selectedTask.discrepancies.length} items have quantity mismatches. 
                    Review the items below before rejecting.
                  </p>
                </div>
              )}

              {/* Items Comparison Table */}
              <div className="border rounded-lg overflow-hidden mb-6">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Product</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">{t('validation.sapQty')}</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider w-8">
                        <ArrowRight className="w-4 h-4 mx-auto" />
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">{t('validation.tsdQty')}</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">Diff</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedTask.order.items.map((item) => {
                      const discrepancy = selectedTask.discrepancies.find(d => d.itemId === item.id);
                      const hasIssue = !!discrepancy;
                      
                      return (
                        <tr 
                          key={item.id} 
                          className={cn(
                            'border-t',
                            hasIssue && 'bg-status-error-bg/50'
                          )}
                        >
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium">{item.name}</p>
                              <p className="text-xs text-muted-foreground font-mono">{item.sku}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center font-medium">{item.sapQty}</td>
                          <td className="px-4 py-3 text-center">
                            {hasIssue ? (
                              <XCircle className="w-4 h-4 text-status-error mx-auto" />
                            ) : (
                              <CheckCircle className="w-4 h-4 text-status-success mx-auto" />
                            )}
                          </td>
                          <td className="px-4 py-3 text-center font-medium">
                            {item.tsdQty ?? '—'}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {discrepancy ? (
                              <span className="text-status-error font-bold">
                                {discrepancy.difference > 0 ? '+' : ''}{discrepancy.difference}
                              </span>
                            ) : (
                              <span className="text-status-success">0</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Summary */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 mb-6">
                <div>
                  {selectedTask.discrepancies.length === 0 ? (
                    <div className="flex items-center gap-2 text-status-success">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">{t('validation.allMatched')}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-status-error">
                      <XCircle className="w-5 h-5" />
                      <span className="font-medium">
                        {selectedTask.discrepancies.length} mismatches detected
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              {canValidate && (
                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => setShowRejectDialog(true)}
                  >
                    <XCircle className="w-4 h-4" />
                    {t('validation.reject')}
                  </Button>
                  <Button
                    className="gap-2"
                    disabled={!canApprove}
                    onClick={() => setShowApproveDialog(true)}
                  >
                    <CheckCircle className="w-4 h-4" />
                    {t('validation.approve')}
                  </Button>
                </div>
              )}

              {!canApprove && canValidate && (
                <p className="text-sm text-muted-foreground text-right mt-2">
                  Cannot approve: resolve all discrepancies first
                </p>
              )}
            </ModuleCard>
          ) : (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] bg-card rounded-lg border border-border">
              <Package className="w-12 h-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">Select a task from the queue</p>
            </div>
          )}
        </div>
      </div>

      {/* Approve Confirmation Dialog */}
      <ConfirmDialog
        open={showApproveDialog}
        onOpenChange={setShowApproveDialog}
        title={t('dialog.confirmApprove')}
        description="This will mark the order as validated and ready for shipping."
        variant="success"
        confirmLabel={t('validation.approve')}
        onConfirm={handleApprove}
      />

      {/* Reject Dialog */}
      <ConfirmDialog
        open={showRejectDialog}
        onOpenChange={setShowRejectDialog}
        title="Reject Validation"
        description="This order will be sent back for re-picking. Add notes for the picker."
        variant="destructive"
        confirmLabel={t('validation.reject')}
        onConfirm={handleReject}
      />
    </div>
  );
}
