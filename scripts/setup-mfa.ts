import { generateSecret, generateURI } from 'otplib'
import QRCode from 'qrcode'

const secret = generateSecret()
const accountName = 'Notes App - bnor'
const issuer = 'Notes App'

const otpauth = generateURI({ secret, accountName, issuer })

console.log('\n=== MFA Setup ===\n')
console.log('TOTP Secret:')
console.log(secret)
console.log('\nAdd this to your .env file:')
console.log(`TOTP_SECRET=${secret}`)
console.log('\n--- QR Code ---')

QRCode.toString(otpauth, { type: 'terminal' }, (err, qr) => {
  if (err) {
    console.error('Error generating QR code:', err)
    process.exit(1)
  }
  console.log(qr)
  console.log('\nManual Entry Key (if QR scanning fails):')
  console.log(`Account: ${accountName}`)
  console.log(`Secret: ${secret}`)
  console.log(`Type: Time-based`)
  console.log('\nScan the QR code with your authenticator app (Google Authenticator, Authy, etc.)')
})
