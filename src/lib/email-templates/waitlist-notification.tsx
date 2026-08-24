import React from 'react'
import { Body, Container, Head, Heading, Html, Preview, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  name?: string
  email?: string
  phone?: string
  country?: string
  note?: string
  kind?: string
}

const Row = ({ label, value }: { label: string; value?: string }) => (
  <Text style={row}>
    <strong>{label}:</strong> {value || '—'}
  </Text>
)

const Email = ({ name, email, phone, country, note, kind }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>New KETA waitlist signup</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={heading}>
          New {kind === 'vendor' ? 'liquidity vendor' : 'trader'} signup
        </Heading>
        <Row label="Name" value={name} />
        <Row label="Email" value={email} />
        <Row label="Phone" value={phone} />
        <Row label="Country" value={country} />
        <Row label="Type" value={kind} />
        <Row label="Note" value={note} />
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (data: Record<string, any>) =>
    `New KETA waitlist signup — ${data.kind === 'vendor' ? 'liquidity vendor' : 'trader'}`,
  displayName: 'Waitlist notification (internal)',
  previewData: {
    name: 'Ada Obi',
    email: 'ada@example.com',
    phone: '+2348000000000',
    country: 'Nigeria',
    note: 'USDT to NGN',
    kind: 'trader',
  },
  to: 'KETAEXCHANGE@GMAIL.COM',
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Helvetica, Arial, sans-serif' }
const container = { padding: '28px 24px', maxWidth: '560px' }
const heading = { fontSize: '20px', color: '#0B0F0D', margin: '0 0 16px' }
const row = { fontSize: '14px', lineHeight: '22px', color: '#39433D', margin: '0 0 4px' }
