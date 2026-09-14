import React from 'react'
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  name?: string
  kind?: 'trader' | 'vendor'
}

const Email = ({ name, kind = 'trader' }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>You're on the KETA launch waitlist</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>KETA</Text>
        <Heading style={heading}>You&apos;re on the list</Heading>
        <Text style={text}>
          Hi {name || 'there'}, thanks for joining the KETA waitlist
          {kind === 'vendor'
            ? ' as a liquidity vendor. We\u2019ll share rates and settlement terms with you ahead of launch.'
            : ' for P2P currency exchange. You\u2019ll get priority onboarding when the app goes live.'}
        </Text>
        <Section style={panel}>
          <Text style={panelText}>
            In the meantime you can already buy and sell crypto or giftcards on our website:
          </Text>
          <Text style={panelText}>
            Buy crypto:{' '}
            <Link style={link} href="https://www.keta.ltd/buy">
              keta.ltd/buy
            </Link>
          </Text>
          <Text style={panelText}>
            Sell crypto &amp; giftcards:{' '}
            <Link style={link} href="https://www.keta.ltd/sell">
              keta.ltd/sell
            </Link>
          </Text>
        </Section>
        <Text style={muted}>— The KETA team</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: 'You’re on the KETA launch waitlist',
  displayName: 'Waitlist confirmation',
  previewData: { name: 'Ada', kind: 'trader' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Helvetica, Arial, sans-serif' }
const container = { padding: '32px 28px', maxWidth: '560px' }
const brand = {
  fontSize: '14px',
  letterSpacing: '3px',
  fontWeight: 700,
  color: '#009E33',
  margin: '0 0 18px',
}
const heading = { fontSize: '24px', color: '#0B0F0D', margin: '0 0 12px' }
const text = { fontSize: '15px', lineHeight: '24px', color: '#39433D' }
const panel = {
  backgroundColor: '#F2FBF4',
  borderRadius: '12px',
  padding: '16px 18px',
  margin: '20px 0',
}
const panelText = { fontSize: '14px', lineHeight: '22px', color: '#39433D', margin: '0 0 6px' }
const link = { color: '#009E33' }
const muted = { fontSize: '13px', color: '#7A857E', marginTop: '24px' }
