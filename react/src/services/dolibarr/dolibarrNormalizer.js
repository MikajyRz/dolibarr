export const normalizeListResponse = (data) => {
  if (!data) {
    return []
  }

  if (Array.isArray(data)) {
    return data
  }

  if (Array.isArray(data.data)) {
    return data.data
  }

  return []
}

export const formatValue = (value) => {
  if (value === null || value === undefined || value === '') {
    return '-'
  }

  if (typeof value === 'boolean') {
    return value ? 'Oui' : 'Non'
  }

  if (typeof value === 'object') {
    return value.label || value.ref || value.name || JSON.stringify(value)
  }

  return value
}