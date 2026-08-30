// A small set of regex-based detectors for common sensitive patterns.
// This is a best-effort filter, not a guarantee — it catches the
// obvious cases (emails, phone numbers, card-like numbers, common
// API-key/token shapes) before content ever gets embedded or stored.

interface RedactionRule {
  label: string;
  pattern: RegExp;
}

const RULES: RedactionRule[] = [
  {
    label: "EMAIL",
    pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  },
  {
    label: "PHONE",
    // Matches things like +91 98765 43210, (123) 456-7890, 123-456-7890
    pattern: /(\+?\d{1,3}[\s-]?)?(\(?\d{3,4}\)?[\s-]?)\d{3,4}[\s-]?\d{3,4}\b/g,
  },
  {
    label: "CARD_NUMBER",
    // 13–19 digits, optionally grouped with spaces or dashes
    pattern: /\b(?:\d[ -]?){13,19}\b/g,
  },
  {
    label: "API_KEY_OR_TOKEN",
    // Common token shapes: sk-..., ghp_..., long base64-ish strings after "key"/"token"
    pattern: /\b(sk|pk|ghp|gho|ghu|ghs)_[A-Za-z0-9]{16,}\b/g,
  },
];

export interface PrivacyFilterResult {
  cleaned: string;
  redactionCounts: Record<string, number>;
}

export function filterSensitiveContent(text: string): PrivacyFilterResult {
  let cleaned = text;
  const redactionCounts: Record<string, number> = {};

  for (const rule of RULES) {
    const matches = cleaned.match(rule.pattern);
    if (matches) {
      redactionCounts[rule.label] = matches.length;
      cleaned = cleaned.replace(rule.pattern, `[REDACTED_${rule.label}]`);
    }
  }

  return { cleaned, redactionCounts };
}