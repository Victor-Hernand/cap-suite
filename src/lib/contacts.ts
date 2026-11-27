import type { ContactRow } from './db';

type ContactPhone = Pick<ContactRow, 'phone' | 'extension'>;

export function contactPhoneHref(contact: ContactPhone): string {
  return `tel:+${contact.phone.replace(/\D/g, '')}`;
}

export function contactPhoneLabel(contact: ContactPhone): string {
  return contact.extension ? `${contact.phone} · ext. ${contact.extension}` : contact.phone;
}
