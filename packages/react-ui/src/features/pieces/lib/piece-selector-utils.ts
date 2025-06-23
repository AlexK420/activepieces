import { useRef } from 'react';

import { PieceSelectorItem, PieceSelectorPieceItem } from '@/lib/types';
import { PiecePropertyMap, PropertyType } from '@activepieces/pieces-framework';
import {
  Action,
  ActionType,
  BranchOperator,
  CodeAction,
  PieceAction,
  PieceTrigger,
  Trigger,
  TriggerType,
  deepMergeAndCast,
  BranchExecutionType,
  RouterExecutionType,
  spreadIfDefined,
  isNil,
  flowStructureUtil,
} from '@activepieces/shared';

import { formUtils } from './form-utils';
const defaultCode = `export const code = async (inputs) => {
  return true;
};`;

const isPieceActionOrTrigger = (
  pieceSelectorItem: PieceSelectorItem,
): pieceSelectorItem is PieceSelectorPieceItem => {
  return (
    pieceSelectorItem.type === ActionType.PIECE ||
    (flowStructureUtil.isTrigger(pieceSelectorItem.type) &&
      pieceSelectorItem.type === TriggerType.PIECE)
  );
};

const isStepInitiallyValid = (pieceSelectorItem: PieceSelectorItem) => {
  switch (pieceSelectorItem.type) {
    case ActionType.CODE:
      return true;
    case ActionType.PIECE:
    case TriggerType.PIECE: {
      const inputValidity = checkPieceInputValidity(
        getInitalStepInput(pieceSelectorItem),
        pieceSelectorItem.actionOrTrigger.props,
      );
      return inputValidity && !pieceSelectorItem.actionOrTrigger.requireAuth;
    }
    case ActionType.LOOP_ON_ITEMS:
    case ActionType.ROUTER:
    case TriggerType.EMPTY:
      return false;
  }
};

const getInitalStepInput = (pieceSelectorItem: PieceSelectorItem) => {
  if (!isPieceActionOrTrigger(pieceSelectorItem)) {
    return {};
  }
  return formUtils.getDefaultValueForStep(
    {
      ...spreadIfDefined('auth', pieceSelectorItem.pieceMetadata.auth),
      ...pieceSelectorItem.actionOrTrigger.props,
    },
    {},
  );
};

const getDefaultStepValues = ({
  stepName,
  pieceSelectorItem,
  settings,
}: {
  stepName: string;
  pieceSelectorItem: PieceSelectorItem;
  settings?: Record<string, unknown>;
}): Action | Trigger => {
  const errorHandlingOptions: CodeAction['settings']['errorHandlingOptions'] = {
    continueOnFailure: {
      value: false,
    },
    retryOnFailure: {
      value: false,
    },
  };

  const input = getInitalStepInput(pieceSelectorItem);
  const isValid = isStepInitiallyValid(pieceSelectorItem);
  const common = {
    name: stepName,
    valid: isValid,
    displayName: isPieceActionOrTrigger(pieceSelectorItem)
      ? pieceSelectorItem.actionOrTrigger.displayName
      : pieceSelectorItem.displayName,
    skip: false,
    settings: {
      inputUiInfo: {
        customizedInputs: {},
      },
    },
  };

  switch (pieceSelectorItem.type) {
    case ActionType.CODE:
      return deepMergeAndCast<CodeAction>(
        {
          type: ActionType.CODE,
          settings: settings ?? {
            sourceCode: {
              code: defaultCode,
              packageJson: '{}',
            },
            input,
            inputUiInfo: {
              customizedInputs: {},
            },
            errorHandlingOptions,
          },
        },
        common,
      );
    case ActionType.LOOP_ON_ITEMS:
      return deepMergeAndCast<Action>(
        {
          type: ActionType.LOOP_ON_ITEMS,
          settings: settings ?? {
            items: '',
            inputUiInfo: {
              customizedInputs: {},
            },
          },
        },
        common,
      );
    case ActionType.ROUTER:
      return deepMergeAndCast<Action>(
        {
          type: ActionType.ROUTER,
          settings: settings ?? {
            executionType: RouterExecutionType.EXECUTE_FIRST_MATCH,
            branches: [
              {
                conditions: [
                  [
                    {
                      operator: BranchOperator.TEXT_EXACTLY_MATCHES,
                      firstValue: '',
                      secondValue: '',
                      caseSensitive: false,
                    },
                  ],
                ],
                branchType: BranchExecutionType.CONDITION,
                branchName: 'Branch 1',
              },
              {
                branchType: BranchExecutionType.FALLBACK,
                branchName: 'Otherwise',
              },
            ],
            inputUiInfo: {
              customizedInputs: {},
            },
          },
          children: [null, null],
        },
        common,
      );
    case ActionType.PIECE: {
      if (!isPieceActionOrTrigger(pieceSelectorItem)) {
        throw new Error(
          `Invalid piece selector item ${JSON.stringify(pieceSelectorItem)}`,
        );
      }
      return deepMergeAndCast<PieceAction>(
        {
          type: ActionType.PIECE,
          settings: settings ?? {
            pieceName: pieceSelectorItem.pieceMetadata.pieceName,
            pieceType: pieceSelectorItem.pieceMetadata.pieceType,
            packageType: pieceSelectorItem.pieceMetadata.packageType,
            actionName: pieceSelectorItem.actionOrTrigger.name,
            pieceVersion: pieceSelectorItem.pieceMetadata.pieceVersion,
            input,
            errorHandlingOptions,
          },
        },
        common,
      );
    }
    case TriggerType.PIECE: {
      if (!isPieceActionOrTrigger(pieceSelectorItem)) {
        throw new Error(
          `Invalid piece selector item ${JSON.stringify(pieceSelectorItem)}`,
        );
      }
      return deepMergeAndCast<PieceTrigger>(
        {
          type: TriggerType.PIECE,
          settings: settings ?? {
            pieceName: pieceSelectorItem.pieceMetadata.pieceName,
            pieceType: pieceSelectorItem.pieceMetadata.pieceType,
            packageType: pieceSelectorItem.pieceMetadata.packageType,
            triggerName: pieceSelectorItem.actionOrTrigger.name,
            pieceVersion: pieceSelectorItem.pieceMetadata.pieceVersion,
            input,
          },
        },
        common,
      );
    }
    default:
      throw new Error('Unsupported type: ' + pieceSelectorItem.type);
  }
};

const checkPieceInputValidity = (
  input: Record<string, unknown>,
  props: PiecePropertyMap,
) => {
  return Object.entries(props).reduce((acc, [key, property]) => {
    if (
      property.required &&
      property.type !== PropertyType.DYNAMIC &&
      isNil(input[key])
    ) {
      return false;
    }
    return acc;
  }, true);
};

const maxListHeight = 300;
const minListHeight = 100;
const searchInputDivHeight = 48;

// Adjusts piece list height to prevent overflow on short screens
const useAdjustPieceListHeightToAvailableSpace = () => {
  const listHeightRef = useRef<number>(maxListHeight);
  const popoverTriggerRef = useRef<HTMLButtonElement | null>(null);

  if (!popoverTriggerRef.current) {
    return {
      listHeightRef,
      popoverTriggerRef,
      searchInputDivHeight,
    };
  }

  const popOverTriggerRect = popoverTriggerRef.current.getBoundingClientRect();
  const viewportHeight =
    window.innerHeight || document.documentElement.clientHeight;
  const shouldRenderBelowPopoverTrigger =
    popOverTriggerRect.top < viewportHeight - popOverTriggerRect.bottom;

  if (shouldRenderBelowPopoverTrigger) {
    const availableSpaceBelow =
      viewportHeight - popOverTriggerRect.bottom - searchInputDivHeight;
    listHeightRef.current = Math.max(minListHeight, availableSpaceBelow);
  } else {
    const availableSpaceAbove = popOverTriggerRect.top - searchInputDivHeight;
    listHeightRef.current = Math.max(minListHeight, availableSpaceAbove);
  }

  return {
    listHeightRef,
    popoverTriggerRef,
    searchInputDivHeight,
  };
};

export const pieceSelectorUtils = {
  getDefaultStepValues,
  useAdjustPieceListHeightToAvailableSpace,
};
