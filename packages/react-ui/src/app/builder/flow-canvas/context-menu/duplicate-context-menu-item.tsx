import { t } from 'i18next';
import { CopyPlus } from 'lucide-react';

import { ContextMenuItem } from '@/components/ui/context-menu';
import { FlowOperationType } from '@activepieces/shared';

import { useBuilderStateContext } from '../../builder-hooks';

export const DuplicateContextMenuItem = () => {
  const [selectedNodes, flowVersion, readonly, applyOperation] =
    useBuilderStateContext((state) => [
      state.selectedNodes,
      state.flowVersion,
      state.readonly,
      state.applyOperation,
    ]);
  const doSelectedNodesIncludeTrigger = selectedNodes.some(
    (node) => node === flowVersion.trigger.name,
  );

  const showDuplicate =
    selectedNodes.length === 1 && !doSelectedNodesIncludeTrigger && !readonly;

  if (!showDuplicate) return null;
  return (
    <ContextMenuItem
      onClick={() => {
        applyOperation({
          type: FlowOperationType.DUPLICATE_ACTION,
          request: {
            stepName: selectedNodes[0],
          },
        });
      }}
      className="flex items-center gap-2"
    >
      <CopyPlus className="w-4 h-4"></CopyPlus> {t('Duplicate')}
    </ContextMenuItem>
  );
};
