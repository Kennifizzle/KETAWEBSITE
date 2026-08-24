import React from 'react'
import { Body, Container, Head, Heading, Html, Preview, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  reference?: string
  side?: string
  kind?: string
  asset?: string
  network?: string
  amount?: string
  name?: string
  email?: string
  phone?: string
  walletAddress?: string
  bankName?: string
  accountNumber?: string
  accountName?: string
  note?: string
}

const Row = ({ label, value }: { label: string; value?: string }) => (
  <Text style={row}>
    <strong>{label}:</strong> {value || '—'}
  </Text>
)

const Email = (p: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{`New KETA ${p.side ?? ''} order ${p.reference ?? ''}`}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={heading}>
          New {p.side} order — {p.asset}
        </Heading>
        <Row label="Reference" value={p.reference} />
        <Row label="Side" value={p.side} />
        <Row label="Category" value={p.kind} />
        <Row label="Asset" value={p.asset} />
        <Row label="Network" value={p.network} />
        <Row label="Amount" value={p.amount} />
        <Row label="Name" value={p.name} />
        <Row label="Email" value={p.email} />
        <Row label="Phone" value={p.phone} />
        <Row label="Wallet address" value={p.walletAddress} />
        <Row label="Bank" value={p.bankName} />
        <Row label="Account number" value={p.accountNumber} />
        <Row label="Account name" value={p.accountName} />
        <Row label="Note" value={p.note} />
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (data: Record<string, any>) =>
    `New KETA ${data.side} order — ${data.asset} (${data.reference})`,
  displayName: 'Order notification (internal)',
  previewData: {
    reference: 'KETA-3F9A21C4',
    side: 'buy',
    kind: 'crypto',
    asset: 'USDT',
    network: 'TRC20',
    amount: 'NGN 250,000',
    name: 'Ada Obi',
    email: 'ada@example.com',
    phone: '+2348000000000',
    walletAddress: 'TXk...9ab',
    bankName: '',
    accountNumber: '',
    accountName: '',
    note: 'Urgent please',
  },
  to: 'KETAEXCHANGE@GMAIL.COM',
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Helvetica, Arial, sans-serif' }
const container = { padding: '28px 24px', maxWidth: '560px' }
const heading = { fontSize: '20px', color: '#0B0F0D', margin: '0 0 16px' }
const row = { fontSize: '14px', lineHeight: '22px', color: '#39433D', margin: '0 0 4px' }
