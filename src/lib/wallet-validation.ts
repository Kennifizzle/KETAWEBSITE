// Shared (client + server) wallet address validation per network.

const BASE58 = /^[1-9A-HJ-NP-Za-km-z]+$/

type Rule = { test: (a: string) => boolean; hint: string }

const evm: Rule = {
  test: (a) => /^0x[a-fA-F0-9]{40}$/.test(a),
  hint: 'must start with 0x followed by 40 hex characters',
}

const tron: Rule = {
  test: (a) => a.length === 34 && a.startsWith('T') && BASE58.test(a),
  hint: 'must start with T and be 34 characters',
}

const solana: Rule = {
  test: (a) => a.length >= 32 && a.length <= 44 && BASE58.test(a),
  hint: 'must be a 32–44 character Solana address',
}

const bitcoin: Rule = {
  test: (a) =>
    (/^(1|3)[1-9A-HJ-NP-Za-km-z]{25,34}$/.test(a)) ||
    /^bc1[02-9ac-hj-np-z]{11,71}$/.test(a.toLowerCase()),
  hint: 'must be a valid Bitcoin address (starts with 1, 3 or bc1)',
}

const lightning: Rule = {
  test: (a) =>
    /^ln(bc|tb)[0-9a-z]{20,}$/i.test(a) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a),
  hint: 'must be a Lightning invoice (lnbc…) or a Lightning address (name@domain)',
}

const RULES: Record<string, Rule> = {
  TRC20: tron,
  ERC20: evm,
  BEP20: evm,
  Base: evm,
  Arbitrum: evm,
  Solana: solana,
  Bitcoin: bitcoin,
  Lightning: lightning,
}

/**
 * Returns null when the address looks valid for the network, otherwise a
 * human-readable error message.
 */
export function validateWalletAddress(address: string, network: string): string | null {
  const value = address.trim()
  if (!value) return 'Enter the wallet address that should receive your coins'
  if (/\s/.test(value)) return 'Wallet address cannot contain spaces'

  const rule = RULES[network]
  if (!rule) {
    return value.length >= 20 ? null : 'That wallet address looks too short'
  }
  return rule.test(value) ? null : `That doesn't look like a valid ${network} address — it ${rule.hint}`
}
