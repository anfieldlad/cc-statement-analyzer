const PATTERNS: Array<{ regex: RegExp; replacement: string }> = [
  // 16-digit card numbers (allow spaces or dashes)
  {
    regex: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
    replacement: "[CARD_REDACTED]",
  },
  // Amex 15-digit
  {
    regex: /\b\d{4}[\s-]?\d{6}[\s-]?\d{5}\b/g,
    replacement: "[CARD_REDACTED]",
  },
  // US SSN
  {
    regex: /\b\d{3}-\d{2}-\d{4}\b/g,
    replacement: "[SSN_REDACTED]",
  },
  // Generic long digit run (16+)
  {
    regex: /\b\d{16,}\b/g,
    replacement: "[NUM_REDACTED]",
  },
  // Account numbers near "account"/"acct"
  {
    regex: /\b(account|acct|a\/c)[\s#:]*([\d-]{6,})\b/gi,
    replacement: "$1: [ACCT_REDACTED]",
  },
  // Cardholder names near "name"/"holder"
  {
    regex: /\b(name|cardholder|holder)[\s:]+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)+)/g,
    replacement: "$1: [NAME_REDACTED]",
  },
];

export function sanitize(text: string): string {
  let out = text;
  for (const { regex, replacement } of PATTERNS) {
    out = out.replace(regex, replacement);
  }
  return out;
}

const STRING_FIELD_PATTERNS: RegExp[] = [
  /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
  /\b\d{4}[\s-]?\d{6}[\s-]?\d{5}\b/g,
  /\b\d{3}-\d{2}-\d{4}\b/g,
  /\b\d{16,}\b/g,
];

export function scrubField(value: string): string {
  let out = value;
  for (const regex of STRING_FIELD_PATTERNS) {
    out = out.replace(regex, "[REDACTED]");
  }
  return out;
}
