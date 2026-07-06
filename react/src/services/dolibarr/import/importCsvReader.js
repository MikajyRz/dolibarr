import Papa from 'papaparse'
import { cleanText } from './importUtils'

export function parseCsvFile(file, options = {}) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve([])
      return
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => cleanText(header),
      complete: (result) => {
        const blockingErrors = (result.errors || []).filter((error) => {
          return options.allowFieldMismatch !== true || error.type !== 'FieldMismatch'
        })

        if (blockingErrors.length > 0) {
          reject(new Error(blockingErrors[0].message))
          return
        }

        resolve(result.data)
      },
      error: (error) => reject(error),
    })
  })
}
