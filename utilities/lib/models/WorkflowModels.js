// const assertAfterCheck = require('@eluvio/elv-js-helpers/ModelAssertion/assertAfterCheck')
const defBasicModel = require('@eluvio/elv-js-helpers/ModelFactory/defBasicModel')
const defObjectModel = require('@eluvio/elv-js-helpers/ModelFactory/defObjectModel')
const defArrayModel = require('@eluvio/elv-js-helpers/ModelFactory/defArrayModel')
const defNonEmptyArrModel = require('@eluvio/elv-js-helpers/ModelFactory/defNonEmptyArrModel')
const NonBlankStrModel = require('@eluvio/elv-js-helpers/Model/NonBlankStrModel')
const NonNegativeIntModel = require('@eluvio/elv-js-helpers/Model/NonNegativeIntModel')
// const passesModelCheck = require('@eluvio/elv-js-helpers/Boolean/passesModelCheck')
// const throwsException = require('@eluvio/elv-js-helpers/Boolean/throwsException')

const WORK_ORDER_TEMPLATE_INITIAL_INGEST = 'Initial ingest'
const WORK_ORDER_TEMPLATE_REVISE_MASTER = 'Revise master'
const WORK_ORDER_TEMPLATE_NAMES = [
  WORK_ORDER_TEMPLATE_INITIAL_INGEST,
  WORK_ORDER_TEMPLATE_REVISE_MASTER
]

const WorkOrderTemplateNameModel = defBasicModel('WorkOrderType', WORK_ORDER_TEMPLATE_NAMES)

const STEP_TYPE_MASTER_CREATE = 'Master - create object'
const STEP_TYPE_MASTER_ADD_FILES_INITIAL = 'Master - add initial files'
const STEP_TYPE_MASTER_SCAN_FILES_INITIAL = 'Master - scan initial files'
const STEP_TYPE_MASTER_CREATE_DEFAULT_VARIANT = 'Master - create default variant'
const STEP_TYPE_MEZ_CREATE = 'Mez - create object'
const STEP_TYPE_MEZ_JOB_CREATE = 'Mez - create job'
const STEP_TYPE_MEZ_JOB_START = 'Mez - start job'
const STEP_TYPE_MEZ_JOB_CHECK_STATUS = 'Mez - check job status'
const STEP_TYPE_MEZ_JOB_CHECK_NOT_STALLED = 'Mez - confirm job not stalled'
const STEP_TYPE_MEZ_JOB_CHECK_PCT_OK = 'Mez - confirm job not bad pct'
const STEP_TYPE_MEZ_JOB_CANCEL = 'Mez - cancel job'
const STEP_TYPE_MEZ_JOB_FINALIZE = 'Mez - finalize'

const STEP_TYPES = [
  STEP_TYPE_MASTER_CREATE,
  STEP_TYPE_MASTER_ADD_FILES_INITIAL,
  STEP_TYPE_MASTER_SCAN_FILES_INITIAL,
  STEP_TYPE_MASTER_CREATE_DEFAULT_VARIANT,
  STEP_TYPE_MEZ_CREATE,
  STEP_TYPE_MEZ_JOB_CREATE,
  STEP_TYPE_MEZ_JOB_START,
  STEP_TYPE_MEZ_JOB_CHECK_STATUS,
  STEP_TYPE_MEZ_JOB_CHECK_NOT_STALLED,
  STEP_TYPE_MEZ_JOB_CHECK_PCT_OK,
  STEP_TYPE_MEZ_JOB_CANCEL,
  STEP_TYPE_MEZ_JOB_FINALIZE
]

const StepTypeNameModel = defBasicModel('StepType', STEP_TYPES)

const WorkOrderTemplateStepChoiceModel = defObjectModel('WorkOrderTemplateStepChoice',
  {
    templateStepUuid: NonBlankStrModel,
    displayOrder: NonNegativeIntModel,
    prompt: NonBlankStrModel
  })

const WorkOrderTemplateStepChoiceListModel = defArrayModel(
  'WorkOrderTemplateStepChoiceList',
  WorkOrderTemplateStepChoiceModel
)

const WorkOrderTemplateStepModel = defObjectModel('WorkOrderTemplateStep',
  {
    uuid: NonBlankStrModel,
    name: StepTypeNameModel,
    displayOrder: NonNegativeIntModel,
    operation: NonBlankStrModel,
    status: NonBlankStrModel,
    statusDesc: String,
    successNextSteps: WorkOrderTemplateStepChoiceListModel,
    errorNextSteps: WorkOrderTemplateStepChoiceListModel,
    cancelNextSteps: WorkOrderTemplateStepChoiceListModel
  })

const WorkOrderTemplateModel = defObjectModel('WorkOrderTemplate', {
  key: WorkOrderTemplateNameModel,
  steps: defNonEmptyArrModel('WorkOrderTemplateSteps', WorkOrderTemplateStepModel)
})

module.exports = {
  STEP_TYPE_MASTER_CREATE,
  STEP_TYPE_MASTER_ADD_FILES_INITIAL,
  STEP_TYPE_MASTER_SCAN_FILES_INITIAL,
  STEP_TYPE_MASTER_CREATE_DEFAULT_VARIANT,
  STEP_TYPE_MEZ_CREATE,
  STEP_TYPE_MEZ_JOB_CREATE,
  STEP_TYPE_MEZ_JOB_START,
  STEP_TYPE_MEZ_JOB_CHECK_STATUS,
  STEP_TYPE_MEZ_JOB_CHECK_NOT_STALLED,
  STEP_TYPE_MEZ_JOB_CHECK_PCT_OK,
  STEP_TYPE_MEZ_JOB_CANCEL,
  STEP_TYPE_MEZ_JOB_FINALIZE,
  STEP_TYPES,
  StepTypeNameModel,
  WORK_ORDER_TEMPLATE_INITIAL_INGEST,
  WORK_ORDER_TEMPLATE_REVISE_MASTER,
  WORK_ORDER_TEMPLATE_NAMES,
  WorkOrderTemplateModel,
  WorkOrderTemplateNameModel,
  WorkOrderTemplateStepModel
}
