export function cleanText(value) {
  return String(value ?? '').trim()
}

export function parseAmount(value) {
  const cleaned = cleanText(value)
    .replace(/\s/g, '')
    .replace(',', '.')

  const number = Number(cleaned)

  if (Number.isNaN(number)) {
    return 0
  }

  return number
}

export function normalizeGender(value) {
  const gender = cleanText(value).toLowerCase()

  if (gender === 'homme' || gender === 'man' || gender === 'm') {
    return 'man'
  }

  if (gender === 'femme' || gender === 'woman' || gender === 'f') {
    return 'woman'
  }

  return ''
}

export function parseCsvDateToIso(value) {
  const text = cleanText(value)

  if (!text) {
    return ''
  }

  const parts = text.split('/')

  if (parts.length !== 3) {
    return text
  }

  const day = parts[0].padStart(2, '0')
  const month = parts[1].padStart(2, '0')
  let year = parts[2]

  if (year.length === 2) {
    year = `20${year}`
  }

  return `${year}-${month}-${day}`
}

export function isoDateToTimestamp(isoDate) {
  if (!isoDate) {
    return null
  }

  const parts = isoDate.split('-')

  if (parts.length !== 3) {
    return null
  }

  const year = Number(parts[0])
  const month = Number(parts[1])
  const day = Number(parts[2])

  if (!year || !month || !day) {
    return null
  }

  return Math.floor(Date.UTC(year, month - 1, day, 12, 0, 0) / 1000)
}

export function parsePayments(value) {
  const raw = cleanText(value)

  if (!raw) {
    return []
  }

  try {
    let cleaned = raw

    if (cleaned.startsWith('{') && cleaned.endsWith('}')) {
      cleaned = cleaned.slice(1, -1)
    }

    const jsonLike = `[${cleaned}]`
    const parsed = JSON.parse(jsonLike)

    return parsed.map((item) => {
      return {
        date: parseCsvDateToIso(item[0]),
        amount: parseAmount(item[1]),
      }
    })
  } catch {
    return []
  }
}

export function sumPayments(payments = []) {
  return payments.reduce((total, payment) => {
    return total + parseAmount(payment.amount)
  }, 0)
}

export function getDolibarrId(object) {
  if (typeof object === 'number' || typeof object === 'string') {
    return Number(object)
  }

  return Number(object?.id || object?.rowid)
}
