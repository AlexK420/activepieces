import { createCustomApiCallAction } from '@activepieces/pieces-common';
import {
  OAuth2PropertyValue,
  PieceAuth,
  Property,
  createPiece,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { clearSheetAction } from './lib/actions/clear-sheet';
import { deleteRowAction } from './lib/actions/delete-row.action';
import { findRowByNumAction } from './lib/actions/find-row-by-num';
import { findRowsAction } from './lib/actions/find-rows';
import { getRowsAction } from './lib/actions/get-rows';
import { insertRowAction } from './lib/actions/insert-row.action';
import { updateRowAction } from './lib/actions/update-row';
import { googleSheetsCommon } from './lib/common/common';
import { newRowAddedTrigger } from './lib/triggers/new-row-added-webhook';
import { newOrUpdatedRowTrigger } from './lib/triggers/new-or-updated-row.trigger';
import { insertMultipleRowsAction } from './lib/actions/insert-multiple-rows.action';
import { createWorksheetAction } from './lib/actions/create-worksheet';
import { createSpreadsheetAction } from './lib/actions/create-spreadsheet';
import { findSpreadsheets } from './lib/actions/find-spreadsheets';
import { newSpreadsheetTrigger } from './lib/triggers/new-spreadsheet';
import { newWorksheetTrigger } from './lib/triggers/new-worksheet';
import { findWorksheetAction } from './lib/actions/find-worksheet';
import { copyWorksheetAction } from './lib/actions/copy-worksheet';
import { updateMultipleRowsAction } from './lib/actions/update-multiple-rows';
import { createColumnAction } from './lib/actions/create-column';
import { exportSheetAction } from './lib/actions/export-sheet';

export const googleSheetsOAuth2 = PieceAuth.OAuth2({
  displayName:'OAuth2',
  description: 'Use this to authenticate to your own personal Google account',
  authUrl: 'https://accounts.google.com/o/oauth2/auth',
  tokenUrl: 'https://oauth2.googleapis.com/token',
  required: true,
  scope: [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive.readonly',
    'https://www.googleapis.com/auth/drive',
  ],
});

export const googleSheetsServiceAccountAuth = PieceAuth.CustomAuth({
  displayName: 'Service Account',
  description: 'You can connect without signing in with your personal Google account. Use a Google Service Account to provide secure access to the necessary resources on your behalf.',
  required: true,
  props: {
    ServiceKey: Property.ShortText({
      displayName: 'Service Account JSON Key',
      required: true,
    })
  }
})

export const googleSheets = createPiece({
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/google-sheets.png',
  categories: [PieceCategory.PRODUCTIVITY],
  authors: [
    'ShayPunter',
    'Ozak93',
    'Abdallah-Alwarawreh',
    'Salem-Alaa',
    'kishanprmr',
    'MoShizzle',
    'AbdulTheActivePiecer',
    'khaledmashaly',
    'abuaboud',
    'geekyme',
  ],
  auth: [googleSheetsOAuth2, googleSheetsServiceAccountAuth],
  actions: [
    createWorksheetAction,
  ],
  displayName: 'Google Sheets',
  description: 'Create, edit, and collaborate on spreadsheets online',
  triggers: [],
});
