import { typeboxResolver } from '@hookform/resolvers/typebox';
import { ScrollArea } from '@radix-ui/react-scroll-area';
import { Static, Type } from '@sinclair/typebox';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';

import { formUtils } from '@/app/builder/piece-properties/form-utils';
import { ApMarkdown } from '@/components/custom/markdown';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/seperator';
import { INTERNAL_ERROR_TOAST, toast } from '@/components/ui/use-toast';
import { appConnectionsApi } from '@/features/connections/lib/app-connections-api';
import { api } from '@/lib/api';
import { authenticationSession } from '@/lib/authentication-session';
import {
  BasicAuthProperty,
  CustomAuthProperty,
  OAuth2Property,
  OAuth2Props,
  PieceMetadataModel,
  PieceMetadataModelSummary,
  PropertyType,
  SecretTextProperty,
} from '@activepieces/pieces-framework';
import {
  ApErrorParams,
  AppConnection,
  AppConnectionType,
  AppConnectionWithoutSensitiveData,
  assertNotNullOrUndefined,
  ErrorCode,
  isNil,
  UpsertAppConnectionRequestBody,
} from '@activepieces/shared';

import { appConnectionUtils } from '../../features/connections/lib/app-connections-utils';

import { BasicAuthConnectionSettings } from './basic-secret-connection-settings';
import { CustomAuthConnectionSettings } from './custom-auth-connection-settings';
import { OAuth2ConnectionSettings } from './oauth2-connection-settings';
import { SecretTextConnectionSettings } from './secret-text-connection-settings';

type ConnectionDialogProps = {
  piece: PieceMetadataModelSummary | PieceMetadataModel;
  open: boolean;
  onConnectionCreated: (name: string) => void;
  setOpen: (open: boolean) => void;
  reconnectConnection: AppConnectionWithoutSensitiveData | null;
};

const CreateOrEditConnectionDialog = React.memo(
  ({
    piece,
    open,
    setOpen,
    onConnectionCreated,
    reconnectConnection,
  }: ConnectionDialogProps) => {
    const { auth } = piece;

    const overrideSchema =
      piece.auth?.type === PropertyType.CUSTOM_AUTH
        ? Type.Object({
            request: Type.Object({
              value: formUtils.buildSchema(
                (piece.auth as CustomAuthProperty<any>).props,
              ),
            }),
          })
        : Type.Object({});

    const formSchema = Type.Composite([
      Type.Object({
        request: Type.Intersect([
          UpsertAppConnectionRequestBody,
          Type.Object({
            name: Type.String({
              pattern: '^[A-Za-z0-9_\\-@\\+\\.]*$',
              errorMessage: t(
                ' Name can only contain letters, numbers and underscores',
              ),
            }),
          }),
        ]),
      }),
      overrideSchema,
    ]);

    const form = useForm<Static<typeof formSchema>>({
      defaultValues: {
        request: createDefaultValues(
          piece,
          reconnectConnection
            ? reconnectConnection.name
            : appConnectionUtils.findName(piece.name),
        ),
      },
      resolver: typeboxResolver(formSchema),
    });

    const [errorMessage, setErrorMessage] = useState('');

    const { mutate, isPending } = useMutation<
      AppConnection | null,
      Error,
      void
    >({
      mutationFn: async () => {
        setErrorMessage('');
        const formValues = form.getValues().request;
        return appConnectionsApi.upsert(formValues);
      },
      onSuccess: () => {
        setOpen(false);
        const name = form.getValues().request.name;
        onConnectionCreated(name);
        setErrorMessage('');
      },
      onError: (response) => {
        if (api.isError(response)) {
          const apError = response.response?.data as ApErrorParams;
          console.log(apError);
          if (apError.code === ErrorCode.INVALID_CLOUD_CLAIM) {
            setErrorMessage(
              t(
                'Could not claim the authorization code, make sure you have correct settings and try again.',
              ),
            );
          } else if (apError.code === ErrorCode.INVALID_APP_CONNECTION) {
            setErrorMessage(
              t('Connection failed with error {msg}', {
                msg: apError.params.error,
              }),
            );
          }
        } else {
          toast(INTERNAL_ERROR_TOAST);
          console.error(response);
        }
      },
    });
    return (
      <Dialog
        open={open}
        onOpenChange={(open) => setOpen(open)}
        key={piece.name}
      >
        <DialogContent
          onInteractOutside={(e) => e.preventDefault()}
          className="max-h-[70vh] min-w-[800px] overflow-y-auto"
        >
          <DialogHeader>
            <DialogTitle>
              {reconnectConnection
                ? t('Reconnect {displayName} Connection', {
                    displayName: reconnectConnection.name,
                  })
                : t('Create {displayName} Connection', {
                    displayName: piece.displayName,
                  })}
            </DialogTitle>
            <DialogDescription></DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-full">
            <ApMarkdown markdown={auth?.description}></ApMarkdown>
            {auth?.description && <Separator className="my-4" />}
            <Form {...form}>
              <form
                onSubmit={() => console.log('submitted')}
                className="flex flex-col gap-4"
              >
                <FormField
                  name="request.name"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem className="flex flex-col gap-2">
                      <FormLabel htmlFor="name">
                        {t('Connection Name')}
                      </FormLabel>
                      <Input
                        disabled={!isNil(reconnectConnection)}
                        {...field}
                        required
                        id="name"
                        type="text"
                        placeholder={t('Connection name')}
                      />

                      <FormMessage />
                    </FormItem>
                  )}
                ></FormField>
                {auth?.type === PropertyType.SECRET_TEXT && (
                  <SecretTextConnectionSettings
                    authProperty={piece.auth as SecretTextProperty<boolean>}
                  />
                )}
                {auth?.type === PropertyType.BASIC_AUTH && (
                  <BasicAuthConnectionSettings
                    authProperty={piece.auth as BasicAuthProperty}
                  />
                )}
                {auth?.type === PropertyType.CUSTOM_AUTH && (
                  <CustomAuthConnectionSettings
                    authProperty={piece.auth as CustomAuthProperty<any>}
                  />
                )}
                {auth?.type === PropertyType.OAUTH2 && (
                  <OAuth2ConnectionSettings
                    authProperty={piece.auth as OAuth2Property<OAuth2Props>}
                    piece={piece}
                    reconnectConnection={reconnectConnection}
                  />
                )}

                <DialogFooter>
                  <Button
                    onClick={(e) => form.handleSubmit(() => mutate())(e)}
                    className="w-full"
                    loading={isPending}
                    type="submit"
                    disabled={!form.formState.isValid}
                  >
                    {t('Save')}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </ScrollArea>

          {errorMessage && (
            <div className="text-left text-sm text-destructive text-sm mt-4">
              {errorMessage}
            </div>
          )}
        </DialogContent>
      </Dialog>
    );
  },
);

CreateOrEditConnectionDialog.displayName = 'CreateOrEditConnectionDialog';
export { CreateOrEditConnectionDialog };

function createDefaultValues(
  piece: PieceMetadataModelSummary | PieceMetadataModel,
  suggestedConnectionName: string,
): Partial<UpsertAppConnectionRequestBody> {
  const projectId = authenticationSession.getProjectId();
  assertNotNullOrUndefined(projectId, 'projectId');
  switch (piece.auth?.type) {
    case PropertyType.SECRET_TEXT:
      return {
        name: suggestedConnectionName,
        pieceName: piece.name,
        projectId,
        type: AppConnectionType.SECRET_TEXT,
        value: {
          type: AppConnectionType.SECRET_TEXT,
          secret_text: '',
        },
      };
    case PropertyType.BASIC_AUTH:
      return {
        name: suggestedConnectionName,
        pieceName: piece.name,
        projectId,
        type: AppConnectionType.BASIC_AUTH,
        value: {
          type: AppConnectionType.BASIC_AUTH,
          username: '',
          password: '',
        },
      };
    case PropertyType.CUSTOM_AUTH:
      return {
        name: suggestedConnectionName,
        pieceName: piece.name,
        projectId,
        type: AppConnectionType.CUSTOM_AUTH,
        value: {
          type: AppConnectionType.CUSTOM_AUTH,
          props: {},
        },
      };
    case PropertyType.OAUTH2:
      return {
        name: suggestedConnectionName,
        pieceName: piece.name,
        projectId,
        type: AppConnectionType.CLOUD_OAUTH2,
        value: {
          type: AppConnectionType.CLOUD_OAUTH2,
          scope: piece.auth?.scope.join(' '),
          client_id: '',
          props: {},
          code: '',
        },
      };
    default:
      throw new Error(`Unsupported property type: ${piece.auth}`);
  }
}
