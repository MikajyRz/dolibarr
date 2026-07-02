export const ImportValidationService = {
  validateEmployees: (employees) => {
    const errors = []
    const refs = new Set()
    const logins = new Set()

    employees.forEach((employee) => {
      if (!employee.ref_employe) {
        errors.push(`Ligne ${employee.line} employés : ref_employe est obligatoire.`)
      }

      if (!employee.nom) {
        errors.push(`Ligne ${employee.line} employés : nom est obligatoire.`)
      }

      if (!employee.poste) {
        errors.push(`Ligne ${employee.line} employés : poste est obligatoire.`)
      }

      if (!employee.genre) {
        errors.push(`Ligne ${employee.line} employés : genre doit être homme ou femme.`)
      }

      if (!employee.identifiant) {
        errors.push(`Ligne ${employee.line} employés : identifiant est obligatoire.`)
      }

      if (!employee.mdp) {
        errors.push(`Ligne ${employee.line} employés : mdp est obligatoire.`)
      }

      if (!employee.heure_travail_semaine || employee.heure_travail_semaine <= 0) {
        errors.push(
          `Ligne ${employee.line} employés : heure_travail_semaine doit être un nombre positif.`,
        )
      }

      if (employee.ref_employe && refs.has(employee.ref_employe)) {
        errors.push(
          `Ligne ${employee.line} employés : ref_employe ${employee.ref_employe} est dupliqué.`,
        )
      }

      if (employee.identifiant && logins.has(employee.identifiant)) {
        errors.push(
          `Ligne ${employee.line} employés : identifiant ${employee.identifiant} est dupliqué.`,
        )
      }

      refs.add(employee.ref_employe)
      logins.add(employee.identifiant)
    })

    return errors
  },

  validateSalaries: (salaries, employees) => {
    const errors = []
    const employeeRefs = new Set(employees.map((employee) => employee.ref_employe))
    const salaryRefs = new Set()
    const mustCheckEmployeeInCsv = employees.length > 0

    salaries.forEach((salary) => {
      if (!salary.ref_salaire) {
        errors.push(`Ligne ${salary.line} salaires : ref_salaire est obligatoire.`)
      }

      if (!salary.ref_employe) {
        errors.push(`Ligne ${salary.line} salaires : ref_employe est obligatoire.`)
      }

      if (
        mustCheckEmployeeInCsv &&
        salary.ref_employe &&
        !employeeRefs.has(salary.ref_employe)
      ) {
        errors.push(
          `Ligne ${salary.line} salaires : l'employé ${salary.ref_employe} n'existe pas dans le CSV employés.`,
        )
      }

      if (!salary.date_debut) {
        errors.push(`Ligne ${salary.line} salaires : date_debut est obligatoire.`)
      }

      if (!salary.date_fin) {
        errors.push(`Ligne ${salary.line} salaires : date_fin est obligatoire.`)
      }

      if (!salary.montant || salary.montant <= 0) {
        errors.push(`Ligne ${salary.line} salaires : montant doit être un nombre positif.`)
      }

      salary.payments.forEach((payment, index) => {
        if (!payment.date) {
          errors.push(
            `Ligne ${salary.line} salaires : paiement ${index + 1}, date obligatoire.`,
          )
        }

        if (!payment.amount || payment.amount <= 0) {
          errors.push(
            `Ligne ${salary.line} salaires : paiement ${index + 1}, montant invalide.`,
          )
        }
      })

      if (salary.total_paye > salary.montant) {
        errors.push(
          `Ligne ${salary.line} salaires : total payé ${salary.total_paye} dépasse le montant ${salary.montant}.`,
        )
      }

      if (salary.ref_salaire && salaryRefs.has(salary.ref_salaire)) {
        errors.push(
          `Ligne ${salary.line} salaires : ref_salaire ${salary.ref_salaire} est dupliqué.`,
        )
      }

      salaryRefs.add(salary.ref_salaire)
    })

    return errors
  },

  validateImages: (images, employees) => {
    const errors = []
    const imageRefs = new Set()
    const employeeRefs = new Set(employees.map((employee) => employee.ref_employe))

    images.forEach((image) => {
      if (!image.ref_employe) {
        errors.push(`Image ${image.filename} : impossible de lire ref_employe depuis le nom du fichier.`)
      }

      if (image.ref_employe && imageRefs.has(image.ref_employe)) {
        errors.push(`Image ${image.filename} : ref_employe ${image.ref_employe} est dupliqué.`)
      }

      if (employees.length > 0 && image.ref_employe && !employeeRefs.has(image.ref_employe)) {
        errors.push(`Image ${image.filename} : aucun employé avec ref_employe ${image.ref_employe}.`)
      }

      imageRefs.add(image.ref_employe)
    })

    if (images.length > 0 && employees.length > 0) {
      employees.forEach((employee) => {
        if (!imageRefs.has(employee.ref_employe)) {
          errors.push(`Employé ${employee.ref_employe} : aucune image trouvée dans le ZIP.`)
        }
      })
    }

    return errors
  },

  validateAll: ({ employees = [], salaries = [], images = [] }) => {
    return [
      ...ImportValidationService.validateEmployees(employees),
      ...ImportValidationService.validateSalaries(salaries, employees),
      ...ImportValidationService.validateImages(images, employees),
    ]
  },
}
