/**
 * Queue names for Phase 2: Contract-Based Billing
 */
export const QUEUE_NAMES = {
  CONTRACT_BILLING: 'contract-billing',
  EMAIL: 'email',
  PDF_GENERATION: 'pdf-generation',
  TAX_CALCULATION: 'tax-calculation',
  INVOICE_STATUS: 'invoice-status',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

/**
 * Job types for each queue
 */
export const JOB_TYPES = {
  // Contract Billing Queue
  GENERATE_CONTRACT_INVOICE: 'generate-contract-invoice',
  BATCH_CONTRACT_BILLING: 'batch-contract-billing',

  // Email Queue
  SEND_INVOICE_EMAIL: 'send-invoice-email',
  SEND_RENEWAL_ALERT: 'send-renewal-alert',
  SEND_OVERDUE_NOTICE: 'send-overdue-notice',

  // PDF Generation Queue
  GENERATE_INVOICE_PDF: 'generate-invoice-pdf',

  // Tax Calculation Queue
  CALCULATE_INVOICE_TAX: 'calculate-invoice-tax',

  // Invoice Status Queue
  CHECK_OVERDUE_INVOICES: 'check-overdue-invoices',
  AUTO_TRANSITION_STATUS: 'auto-transition-status',
} as const;

export type JobType = (typeof JOB_TYPES)[keyof typeof JOB_TYPES];
