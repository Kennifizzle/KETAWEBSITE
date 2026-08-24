import React from 'react'
import { Body, Container, Head, Heading, Html, Preview, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  name?: string
  reference?: string
  side?: string
  kind?: string
  asset?: string
  network?: string
  amount?: string
}

const Email = ({ name, reference, side, kind, asset, network, amount }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{`Your KETA order ${reference ?? ''} has been received`}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={heading}>We got your order, {name || 'there'} 👋</Heading>
        <Text style={p}>
          Your {side === 'sell' ? 'sell' : 'buy'} order for {asset} is in. A KETA trader is
          confirming the rate now and will email you the {side === 'sell'
            ? 'deposit details and your payout confirmation'
            : 'payment account details'}{' '}
          shortly — usually within minutes during working hours.
        </Text>
        <Text style={row}>
          <strong>Reference:</strong> {reference}
        </Text>
        <Text style={row}>
          <strong>Type:</strong> {side} {kind}
        </Text>
        <Text style={row}>
          <strong>Asset:</strong> {asset}
          {network ? ` (${network})` : ''}
        </Text>
        <Text style={row}>
          <strong>Amount:</strong> {amount}
        </Text>
        <Text style={p}>
          Keep this reference handy — quote it in any reply and we will pick up right where you
          left off. Just reply to this email if anything changes.
        </Text>
        <Text style={muted}>— The KETA desk</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (data: Record<string, any>) => `KETA order ${data.reference} received`,
  displayName: 'Order confirmation (customer)',
  previewData: {
    name: 'Ada Obi',
    reference: 'KETA-3F9A21C4',
    side: 'buy',
    kind: 'crypto',
    asset: 'USDT',
    network: 'TRC20',
    amount: 'NGN 250,000',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Helvetica, Arial, sans-serif' }
const container = { padding: '28px 24px', maxWidth: '560px' }
const heading = { fontSize: '20px', color: '#0B0F0D', margin: '0 0 16px' }
const p = { fontSize: '14px', lineHeight: '22px', color: '#39433D', margin: '0 0 16px' }
const row = { fontSize: '14px', lineHeight: '22px', color: '#39433D', margin: '0 0 4px' }
const muted = { fontSize: '13px', color: '#6B7A72', margin: '24px 0 0' }
