// Creates (or updates) the admin user from ADMIN_EMAIL / ADMIN_PASSWORD in .env.local.
// This user skips the signup/activation flow entirely — it's active immediately.
// Run with: node --env-file=.env.local scripts/seed-admin.js
const { MongoClient } = require('mongodb')
const { randomUUID } = require('crypto')
const bcrypt = require('bcryptjs')

async function main() {
  const uri = process.env.MONGO_URL
  const dbName = process.env.DB_NAME
  const adminEmail = process.env.ADMIN_EMAIL
  const adminPassword = process.env.ADMIN_PASSWORD

  if (!uri || !dbName || !adminEmail || !adminPassword) {
    console.error(
      'MONGO_URL, DB_NAME, ADMIN_EMAIL and ADMIN_PASSWORD must be set. Run with: node --env-file=.env.local scripts/seed-admin.js'
    )
    process.exit(1)
  }

  const client = new MongoClient(uri)
  await client.connect()
  const db = client.db(dbName)

  const passwordHash = await bcrypt.hash(adminPassword, 10)
  const now = new Date().toISOString()
  const email = adminEmail.toLowerCase()

  const existing = await db.collection('users').findOne({ email })
  if (existing) {
    await db.collection('users').updateOne(
      { _id: existing._id },
      { $set: { password_hash: passwordHash, is_admin: true, is_active: true, updated_at: now } }
    )
    console.log(`Updated existing user ${email} to admin.`)
  } else {
    await db.collection('users').insertOne({
      _id: randomUUID(),
      name: 'Repeat Calories Admin',
      email,
      mobile: '',
      password_hash: passwordHash,
      auth_provider: 'credentials',
      is_active: true,
      is_admin: true,
      activation_token: null,
      activation_token_expires: null,
      reset_token: null,
      reset_token_expires: null,
      fcmTokens: [],
      addresses: [],
      created_at: now,
      updated_at: now,
    })
    console.log(`Created admin user ${email}.`)
  }

  await client.close()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
