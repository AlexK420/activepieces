import { createCustomApiCallAction } from '@activepieces/pieces-common'
import { OAuth2PropertyValue, PieceAuth, createPiece } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'
import { addFollowerAction } from './lib/actions/add-follower'
import { addLabelToPersonAction } from './lib/actions/add-label-to-person'
import { addProductToDealAction } from './lib/actions/add-product-to-deal'
import { attachFileAction } from './lib/actions/attach-file'
import { createActivityAction } from './lib/actions/create-activity'
import { createDealAction } from './lib/actions/create-deal'
import { createLeadAction } from './lib/actions/create-lead'
import { createNoteAction } from './lib/actions/create-note'
import { createOrganizationAction } from './lib/actions/create-organization'
import { createPersonAction } from './lib/actions/create-person'
import { createProductAction } from './lib/actions/create-product'
import { findActivityAction } from './lib/actions/find-activity'
import { findDealAction } from './lib/actions/find-deal'
import { findDealsAssociatedWithPersonAction } from './lib/actions/find-deals-associated-with-person'
import { findNotesAction } from './lib/actions/find-notes'
import { findOrganizationAction } from './lib/actions/find-organization'
import { findPersonAction } from './lib/actions/find-person'
import { findProductAction } from './lib/actions/find-product'
import { findProductsAction } from './lib/actions/find-products'
import { findUserAction } from './lib/actions/find-user'
import { getNoteAction } from './lib/actions/get-note'
import { getProductAction } from './lib/actions/get-product'
import { updateActivityAction } from './lib/actions/update-activity'
import { updateDealAction } from './lib/actions/update-deal'
import { updateLeadAction } from './lib/actions/update-lead'
import { updateOrganizationAction } from './lib/actions/update-organization'
import { updatePersonAction } from './lib/actions/update-person'
import { activityMatchingFilterTrigger } from './lib/trigger/activity-matching-filter'
import { dealMatchingFilterTrigger } from './lib/trigger/deal-matching-filter'
import { newActivity } from './lib/trigger/new-activity'
import { newDeal } from './lib/trigger/new-deal'
import { newLeadTrigger } from './lib/trigger/new-lead'
import { newNoteTrigger } from './lib/trigger/new-note'
import { newOrganizationTrigger } from './lib/trigger/new-organization'
import { newPerson } from './lib/trigger/new-person'
import { organizationMatchingFilterTrigger } from './lib/trigger/organization-matching-filter'
import { personMatchingFilterTrigger } from './lib/trigger/person-matching-filter'
import { updatedDeal } from './lib/trigger/updated-deal'
import { updatedDealStageTrigger } from './lib/trigger/updated-deal-stage'
import { updatedOrganizationTrigger } from './lib/trigger/updated-organization'
import { updatedPerson } from './lib/trigger/updated-person'

export const pipedriveAuth = PieceAuth.OAuth2({
  description: '',
  authUrl: 'https://oauth.pipedrive.com/oauth/authorize',
  tokenUrl: 'https://oauth.pipedrive.com/oauth/token',
  required: true,
  scope: ['admin', 'contacts:full', 'users:read', 'deals:full', 'activities:full', 'leads:full', 'products:full'],
})

export const pipedrive = createPiece({
  displayName: 'Pipedrive',
  description: 'Sales CRM and pipeline management software',

  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/pipedrive.png',
  categories: [PieceCategory.SALES_AND_CRM],
  auth: pipedriveAuth,
  actions: [
    addFollowerAction,
    getNoteAction,
    createNoteAction,
    addLabelToPersonAction,
    addProductToDealAction,
    attachFileAction,
    createActivityAction,
    updateActivityAction,
    createDealAction,
    updateDealAction,
    createLeadAction,
    updateLeadAction,
    createOrganizationAction,
    updateOrganizationAction,
    createPersonAction,
    updatePersonAction,
    createProductAction,
    findDealsAssociatedWithPersonAction,
    findProductAction,
    findProductsAction,
    findNotesAction,
    getProductAction,
    findOrganizationAction,
    findPersonAction,
    findDealAction,
    findActivityAction,
    findUserAction,
    createCustomApiCallAction({
      baseUrl: () => 'https://api.pipedrive.com/v1',
      auth: pipedriveAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
      }),
    }),
  ],
  authors: ['ashrafsamhouri', 'kishanprmr', 'MoShizzle', 'khaledmashaly', 'abuaboud'],
  triggers: [
    newPerson,
    newDeal,
    newActivity,
    newNoteTrigger,
    updatedPerson,
    updatedDeal,
    updatedDealStageTrigger,
    newLeadTrigger,
    newOrganizationTrigger,
    updatedOrganizationTrigger,
    activityMatchingFilterTrigger,
    dealMatchingFilterTrigger,
    personMatchingFilterTrigger,
    organizationMatchingFilterTrigger,
  ],
})
