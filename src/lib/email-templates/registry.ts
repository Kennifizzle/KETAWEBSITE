import type { ComponentType } from 'react'
import { template as waitlistConfirmation } from './waitlist-confirmation'
import { template as waitlistNotification } from './waitlist-notification'
import { template as orderConfirmation } from './order-confirmation'
import { template as orderNotification } from './order-notification'

export interface TemplateEntry {
  component: ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  displayName?: string
  previewData?: Record<string, any>
  /** Fixed recipient — overrides caller-provided recipientEmail when set. */
  to?: string
}

/**
 * Template registry — maps template names to their React Email components.
 */
export const TEMPLATES: Record<string, TemplateEntry> = {
  'waitlist-confirmation': waitlistConfirmation,
  'waitlist-notification': waitlistNotification,
  'order-confirmation': orderConfirmation,
  'order-notification': orderNotification,
}
