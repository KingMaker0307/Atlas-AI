/**
 * Email Validation and Fake Email Detection Utility
 * Handles syntax checks (RFC 5322 regex), disposable/temporary domain checks, and obvious fake address detection.
 */

// A comprehensive static list of popular temporary and disposable email domains.
const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com",
  "yopmail.com",
  "temp-mail.org",
  "temp-mail.io",
  "temp-mail.net",
  "temp-mail.com",
  "tempmail.cc",
  "tempmail.us",
  "guerrillamail.com",
  "guerrillamailblock.com",
  "guerrillamail.net",
  "guerrillamail.org",
  "guerrillamail.biz",
  "grr.la",
  "sharklasers.com",
  "10minutemail.com",
  "10minutemail.net",
  "10minutemail.co.za",
  "maildrop.cc",
  "dispostable.com",
  "getnada.com",
  "nada.ltd",
  "trashmail.com",
  "trashmail.net",
  "throwawaymail.com",
  "crazymailing.com",
  "mailnesia.com",
  "mailcatch.com",
  "fakeinbox.com",
  "safetymail.info",
  "tempmailaddress.com",
  "tempemail.co",
  "emailondeck.com",
  "mohmal.com",
  "mohmal.in",
  "dropmail.me",
  "mailtogo.org",
  "boun.cr",
  "temporary-address.com",
  "temporarymail.com",
  "temporaryemail.com",
  "mytemp.email",
  "mintemail.com",
  "generator.email",
  "yopmail.fr",
  "yopmail.net",
  "cool.fr.nf",
  "jetable.org",
  "speedmail.org",
  "instantemail.org",
  "instantmail.org",
  "spamgourmet.com",
  "spam4.me",
  "mytrashmail.com",
  "shortmail.com",
  "zillamail.com",
  "mailserv.cf",
  "stopspam.org",
  "nospam.org",
  "mailinator2.com",
  "smailpro.com",
  "temp-mail.pro",
  "duck.com", // DuckDuckGo email forwarding (often used for anonymous/fake signups)
  "anonaddy.com", // Email forwarding
  "anonaddy.me",
  "relay.firefox.com", // Firefox Relay (often blocked in customer signups requiring verification)
]);

// Obvious dummy email prefixes or full addresses
const OBVIOUS_FAKES = new Set([
  "test@test.com",
  "test@example.com",
  "admin@admin.com",
  "admin@test.com",
  "admin@example.com",
  "abc@abc.com",
  "abc@xyz.com",
  "user@user.com",
  "user@test.com",
  "guest@guest.com",
  "nobody@nobody.com",
  "a@a.com",
  "b@b.com",
  "me@me.com",
]);

/**
 * Validates the email address syntax using RFC 5322 regex
 */
export function validateEmailFormat(email: string): boolean {
  // eslint-disable-next-line no-useless-escape
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  if (!email || email.length > 254) return false;
  if (!emailRegex.test(email)) return false;
  
  // Basic domain suffix check (must have a valid TLD extension)
  const parts = email.split("@");
  if (parts.length !== 2) return false;
  
  const domain = parts[1];
  const domainParts = domain.split(".");
  if (domainParts.length < 2) return false;
  
  const tld = domainParts[domainParts.length - 1];
  if (tld.length < 2) return false; // e.g. .c, .m are invalid TLDs
  
  return true;
}

/**
 * Checks if the email domain belongs to a disposable or temporary email provider
 */
export function isDisposableEmail(email: string): boolean {
  const parts = email.toLowerCase().trim().split("@");
  if (parts.length !== 2) return false;
  
  const domain = parts[1];
  
  // Check direct domain match
  if (DISPOSABLE_DOMAINS.has(domain)) return true;
  
  // Check subdomains (e.g. mail.mailinator.com should block mailinator.com)
  for (const disposable of DISPOSABLE_DOMAINS) {
    if (domain.endsWith("." + disposable)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Checks for obvious placeholder, dummy, or fake email addresses
 */
export function isObviousFakeEmail(email: string): boolean {
  const normalized = email.toLowerCase().trim();
  
  // Check list of common fakes
  if (OBVIOUS_FAKES.has(normalized)) return true;
  
  const parts = normalized.split("@");
  if (parts.length !== 2) return false;
  
  const localPart = parts[0];
  const domain = parts[1];
  
  // Obvious placeholder patterns
  if (localPart === domain) return true; // e.g. test@test.com
  if (localPart.startsWith("test") && domain.startsWith("test")) return true; // e.g. test123@testmail.com
  if (/^(abc|123|qwer|asdf)+$/.test(localPart)) return true; // e.g. asdf@gmail.com
  if (localPart.length < 2) return true; // e.g. a@gmail.com is typically fake
  
  return false;
}

/**
 * Main validator method that runs all validation checks on an email
 * @returns { isValid: boolean; error?: string }
 */
export function validateEmail(email: string): { isValid: boolean; error?: string } {
  if (!email || !email.trim()) {
    return { isValid: false, error: "Please enter an email address." };
  }
  
  const trimmed = email.trim();
  
  if (!validateEmailFormat(trimmed)) {
    return { isValid: false, error: "Please enter a valid email address format (e.g. alex@example.com)." };
  }
  
  if (isObviousFakeEmail(trimmed)) {
    return { isValid: false, error: "Please enter a genuine email address. Placeholder or dummy emails are not allowed." };
  }
  
  if (isDisposableEmail(trimmed)) {
    return { isValid: false, error: "Please use a valid personal or work email address. Temporary/disposable email addresses are not allowed." };
  }
  
  return { isValid: true };
}
