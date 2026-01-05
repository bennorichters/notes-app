import { hash } from 'bcrypt'

const password = process.argv[2]

if (!password) {
  console.error('Usage: npm run hash-password <password>')
  process.exit(1)
}

hash(password, 10).then(hashed => {
  console.log('\nPassword hash:')
  console.log(hashed)
  console.log('\nAdd this to your .env file:')
  console.log(`PASSWORD_HASH=${hashed}`)
})
