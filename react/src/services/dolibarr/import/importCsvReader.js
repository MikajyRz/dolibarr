import Papa from 'papaparse'
import { cleanText } from './importUtils'

export function parseCsvFile(file) {
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
        if (result.errors?.length > 0) {
          reject(new Error(result.errors[0].message))
          return
        }

        resolve(result.data)
      },
      error: (error) => reject(error),
    })
  })
}
