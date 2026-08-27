// Seeds menu_items from assets/Meal_Plan_Nutrition-3.xlsx.
// Run with: node --env-file=.env.local scripts/seed-menu.js
//
// The Excel sheet has no price column — every seeded item gets a placeholder
// price (PLACEHOLDER_PRICE below). Update real prices from the admin panel
// (or directly in MongoDB) before going live.
const path = require('path')
const xlsx = require('xlsx')
const { MongoClient } = require('mongodb')
const { randomUUID } = require('crypto')

const PLACEHOLDER_PRICE = 249

function parseNum(val) {
  if (typeof val === 'number') return val
  if (!val) return 0
  const str = String(val).replace(/[~g]/gi, '').trim()
  if (str.includes('–') || str.includes('-')) {
    const [a, b] = str.split(/[–-]/).map((s) => parseFloat(s))
    return Math.round(((a || 0) + ((b ?? a) || 0)) / 2)
  }
  const n = parseFloat(str)
  return Number.isFinite(n) ? Math.round(n) : 0
}

function stripEmoji(name) {
  return name.replace(/^[^\w]+/u, '').trim()
}

async function main() {
  const excelPath = path.join(__dirname, '..', '..', 'assets', 'Meal_Plan_Nutrition-3.xlsx')
  const wb = xlsx.readFile(excelPath)
  const rows = xlsx.utils.sheet_to_json(wb.Sheets['Meal Plan'], { defval: '' })

  const meals = []
  let current = null
  for (const row of rows) {
    if (row.Meal) {
      current = { name: stripEmoji(row.Meal), ingredients: [], nutrition: null }
      meals.push(current)
    }
    if (!current) continue
    if (row.Item === 'TOTAL') {
      current.nutrition = {
        calories: parseNum(row.Calories),
        protein_g: parseNum(row.Protein),
        carbs_g: parseNum(row.Carbs),
        fibre_g: parseNum(row['Fat/Fiber']),
      }
    } else if (row.Item) {
      current.ingredients.push(row.Item)
    }
  }

  const uri = process.env.MONGO_URL
  const dbName = process.env.DB_NAME
  if (!uri || !dbName) {
    console.error('MONGO_URL / DB_NAME not set. Run with: node --env-file=.env.local scripts/seed-menu.js')
    process.exit(1)
  }

  const client = new MongoClient(uri)
  await client.connect()
  const db = client.db(dbName)

  const docs = []
  let sortOrder = 1
  for (const meal of meals) {
    docs.push({
      _id: randomUUID(),
      name: meal.name,
      description: meal.ingredients.join(', '),
      meal_times: ['Lunch', 'Dinner'], // sold at both — one document, not a duplicate per meal time
      price: PLACEHOLDER_PRICE,
      images: ['/meals/placeholder.jpg'],
      nutrition: meal.nutrition ?? { protein_g: 0, carbs_g: 0, fibre_g: 0, calories: 0 },
      is_available: true,
      is_featured: sortOrder <= 2, // first couple of meals featured by default
      sort_order: sortOrder++,
      created_at: new Date().toISOString(),
    })
  }

  if (docs.length === 0) {
    console.log('No meals parsed from the Excel sheet — nothing to seed.')
    await client.close()
    return
  }

  await db.collection('menu_items').insertMany(docs)
  console.log(`Seeded ${docs.length} menu items.`)
  console.log(`All prices set to placeholder ₹${PLACEHOLDER_PRICE} — update real prices via the admin panel.`)

  await client.close()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
