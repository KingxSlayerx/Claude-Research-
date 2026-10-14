/**
 * Creates a STAFF_PASSWORD_HASH value for the local file store.
 *   npm run hash-password -- 'a long passphrase'
 */
import { hashPassword } from "../src/lib/server/auth/password";

const pw = process.argv[2];
if (!pw || pw.length < 12) {
  console.error("Usage: npm run hash-password -- '<password of at least 12 characters>'");
  process.exit(1);
}
hashPassword(pw).then((h) => console.log(h));
