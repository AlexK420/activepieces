import { t } from 'i18next';
import { SquareFunction } from 'lucide-react';
import { ControllerRenderProps, useFormContext } from 'react-hook-form';

import { FormItem, FormLabel } from '@/components/ui/form';
import { ReadMoreDescription } from '@/components/ui/read-more-description';
import { Toggle } from '@/components/ui/toggle';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { PieceProperty } from '@activepieces/pieces-framework';
import { Action, Trigger } from '@activepieces/shared';

import { TextInputWithMentions } from './text-input-with-mentions';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ApMarkdown } from '@/components/custom/markdown';

type AutoFormFieldWrapperProps = {
  children: React.ReactNode;
  allowDynamicValues: boolean;
  propertyName: string;
  property: PieceProperty;
  hideDescription?: boolean;
  placeBeforeLabelText?: boolean;
  disabled: boolean;
  field: ControllerRenderProps<Record<string, any>, string>;
};

const AutoFormFieldWrapper = ({
  placeBeforeLabelText = false,
  children,
  hideDescription,
  allowDynamicValues,
  propertyName,
  property,
  disabled,
  field,
}: AutoFormFieldWrapperProps) => {
  const form = useFormContext<Action | Trigger>();
  const toggled =
    form.getValues().settings?.inputUiInfo?.customizedInputs?.[propertyName];

  function handleChange(pressed: boolean) {
    form.setValue(
      `settings.inputUiInfo.customizedInputs.${propertyName}` as const,
      pressed,
      {
        shouldValidate: true,
      },
    );
    form.setValue(
      `settings.input.${propertyName}` as const,
      property.defaultValue,
      {
        shouldValidate: true,
      },
    );
  }

  return (
    <FormItem className="flex flex-col gap-1">
      <FormLabel className="flex items-center gap-1">
        {placeBeforeLabelText && !toggled && children}
        {property.description && !hideDescription ? (
          <Popover>
            <PopoverTrigger>
              <span className="border-b border-dashed border-foreground">{t(property.displayName)}</span>
            </PopoverTrigger>
            <PopoverContent side="top" align='start' className='mb-1 bg-foreground/85 text-background'>
              <div className='text-xs'>
                <ApMarkdown markdown={property.description} withBorder={false} />
              </div>
            </PopoverContent>
          </Popover>
        ) : (
          <span>{t(property.displayName)}</span>
        )}

        {property.required && <span className="text-destructive">*</span>}
        <span className="grow"></span>
        {allowDynamicValues && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                pressed={toggled}
                onPressedChange={(e) => handleChange(e)}
                disabled={disabled}
              >
                <SquareFunction className="stroke-foreground" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent side="bottom">{t('Dynamic value')}</TooltipContent>
          </Tooltip>
        )}
      </FormLabel>

      {allowDynamicValues && toggled && (
        <TextInputWithMentions
          disabled={disabled}
          onChange={field.onChange}
          initialValue={property.defaultValue}
        ></TextInputWithMentions>
      )}
      {!placeBeforeLabelText && !toggled && <div>{children}</div>}

    </FormItem>
  );
};

AutoFormFieldWrapper.displayName = 'AutoFormFieldWrapper';

export { AutoFormFieldWrapper };
