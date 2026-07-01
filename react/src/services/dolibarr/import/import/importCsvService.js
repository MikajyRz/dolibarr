import { ImportEmployeesCsvService } from './importEmployeesCsvService'
import { ImportSalariesCsvService } from './importSalariesCsvService'

export const ImportCsvService = {
  readEmployeesCsv: ImportEmployeesCsvService.read,
  readSalariesCsv: ImportSalariesCsvService.read,
}
