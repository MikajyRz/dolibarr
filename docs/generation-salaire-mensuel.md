# Documentation - Generation salaire mensuel

URL de la page :

```txt
http://localhost:5173/frontoffice/salaries/bulk-create-month
```

Fichier principal :

```txt
react/src/pages/frontoffice/MonthlySalaryGenerationPage.jsx
```

Service principal utilise :

```txt
react/src/services/dolibarr/SalaryService.js
```

## Objectif de la page

Cette page permet de generer automatiquement les salaires d'un mois pour plusieurs employes.

Elle respecte ces regles :

- filtrer les employes comme dans la page de generation bulk classique ;
- choisir un mois et une annee ;
- saisir un salaire par jour ;
- saisir un pourcentage de majoration pour les jours feries ;
- verifier les salaires deja existants ;
- exclure les intervalles deja couverts par un salaire existant ;
- generer uniquement les intervalles manquants ;
- ajouter une majoration si un jour ferie se trouve dans l'intervalle genere.

Exemple :

```txt
Mois choisi : janvier
Salaire existant : 2026-01-01 au 2026-01-10

La page ne regenere pas 2026-01-01 au 2026-01-10.
Elle genere seulement : 2026-01-11 au 2026-01-31.
```

## Route et menu

### Route React

Fichier :

```txt
react/src/routes/AppRouter.jsx
```

Route ajoutee :

```jsx
<Route path="salaries/bulk-create-month" element={<MonthlySalaryGenerationPage />} />
```

Cette route rend la page accessible ici :

```txt
/frontoffice/salaries/bulk-create-month
```

### Lien dans le menu frontoffice

Fichier :

```txt
react/src/components/layouts/FrontofficeLayout.jsx
```

Lien ajoute :

```jsx
<Link to="/frontoffice/salaries/bulk-create-month">Generer salaires alea</Link>
```

Ce lien permet d'ouvrir la nouvelle page depuis le menu lateral.

## Fonctionnement du composant MonthlySalaryGenerationPage

### Imports

```jsx
import { useEffect, useMemo, useState } from 'react'
import { EmployeeService } from '../../services/dolibarr/EmployeeService'
import { SalaryService } from '../../services/dolibarr/SalaryService'
import { JourFerieService } from '../../services/backend/JourFerieService'
import '../../styles/bulk-salary-generation-page.css'
```

Utilite :

- `useState` garde les donnees de la page ;
- `useEffect` charge les donnees au demarrage ;
- `useMemo` evite de recalculer inutilement les listes filtrees ;
- `EmployeeService` recupere et filtre les employes ;
- `SalaryService` genere les salaires ;
- `JourFerieService` recupere les jours feries ;
- le fichier CSS reutilise le style de la page bulk salary.

## Constantes de la page

### currentDate

```jsx
const currentDate = new Date()
```

Utilite :

- connaitre la date actuelle ;
- initialiser automatiquement le mois et l'annee dans le formulaire.

### initialFilters

```jsx
const initialFilters = {
  poste: '',
  genre: '',
  minHours: '',
  maxHours: '',
}
```

Utilite :

- definir les filtres employes au demarrage ;
- une valeur vide signifie "pas de filtre".

Champs :

- `poste` : filtre par poste ;
- `genre` : filtre par genre ;
- `minHours` : heure de travail minimum ;
- `maxHours` : heure de travail maximum.

### initialGeneration

```jsx
const initialGeneration = {
  month: String(currentDate.getMonth() + 1),
  year: String(currentDate.getFullYear()),
  dailySalary: '',
  holidayPercent: '0',
}
```

Utilite :

- definir les valeurs initiales du formulaire de generation.

Champs :

- `month` : mois selectionne ;
- `year` : annee selectionnee ;
- `dailySalary` : salaire par jour ;
- `holidayPercent` : pourcentage de majoration pour un jour ferie.

### months

```jsx
const months = [
  { value: '1', label: 'Janvier' },
  ...
  { value: '12', label: 'Decembre' },
]
```

Utilite :

- alimenter la liste deroulante des mois ;
- convertir un libelle visible en valeur numerique.

## Etats React utilises

### employees

```jsx
const [employees, setEmployees] = useState([])
```

Utilite :

- stocker la liste des employes recuperes depuis Dolibarr.

### holidays

```jsx
const [holidays, setHolidays] = useState([])
```

Utilite :

- stocker la liste des jours feries recuperes depuis le backend.

### filters

```jsx
const [filters, setFilters] = useState(initialFilters)
```

Utilite :

- stocker les valeurs des filtres saisis par l'utilisateur.

### generation

```jsx
const [generation, setGeneration] = useState(initialGeneration)
```

Utilite :

- stocker les parametres de generation :
  - mois ;
  - annee ;
  - salaire par jour ;
  - pourcentage jour ferie.

### loading

```jsx
const [loading, setLoading] = useState(false)
```

Utilite :

- indiquer que la page charge les employes et jours feries.

### generating

```jsx
const [generating, setGenerating] = useState(false)
```

Utilite :

- indiquer que la generation des salaires est en cours ;
- desactiver le bouton pendant le traitement.

### error

```jsx
const [error, setError] = useState('')
```

Utilite :

- afficher une erreur utilisateur.

### result

```jsx
const [result, setResult] = useState(null)
```

Utilite :

- stocker le resultat de la generation ;
- afficher les salaires crees, les employes ignores et les erreurs.

## Chargement initial des donnees

### useEffect

```jsx
useEffect(() => {
  const loadData = async () => {
    ...
  }

  loadData()
}, [])
```

Utilite :

- executer le chargement une seule fois au montage de la page.

### loadData

```jsx
const [employeesData, holidaysData] = await Promise.all([
  EmployeeService.getEmployees(),
  JourFerieService.getAll(),
])
```

Utilite :

- charger les employes et les jours feries en parallele ;
- rendre la page plus rapide qu'un chargement sequentiel.

Resultat :

- `employeesData` est place dans `employees` ;
- `holidaysData` est place dans `holidays`.

En cas d'erreur :

```jsx
setError(err.message)
```

Le message d'erreur est affiche en haut de la page.

## Calculs memoises

### postes

```jsx
const postes = useMemo(() => {
  const values = employees
    .map((employee) => EmployeeService.getEmployeePoste(employee))
    .filter(Boolean)

  return [...new Set(values)].sort()
}, [employees])
```

Utilite :

- recuperer tous les postes existants ;
- supprimer les doublons avec `Set` ;
- trier la liste ;
- remplir le select "Poste".

Exemple :

```txt
Employes :
- Developpeur
- Manager
- Developpeur

Postes affiches :
- Developpeur
- Manager
```

### filteredEmployees

```jsx
const filteredEmployees = useMemo(() => {
  return EmployeeService.filterEmployeesForSalaryGeneration(employees, filters)
}, [employees, filters])
```

Utilite :

- appliquer les filtres de la page ;
- obtenir seulement les employes concernes par la generation.

Filtres appliques :

- poste ;
- genre ;
- heure minimum ;
- heure maximum.

### monthHolidays

```jsx
const monthHolidays = useMemo(() => {
  const monthKey = `${generation.year}-${String(generation.month).padStart(2, '0')}`

  return holidays.filter((holiday) => {
    return String(holiday.date || '').startsWith(monthKey)
  })
}, [holidays, generation.month, generation.year])
```

Utilite :

- garder seulement les jours feries du mois choisi.

Exemple :

```txt
Mois : janvier
Annee : 2026
monthKey : 2026-01

Jour ferie 2026-01-01 : garde
Jour ferie 2026-02-01 : ignore
```

## Fonctions d'evenement de la page

### handleFilterChange

```jsx
const handleFilterChange = (field, value) => {
  setFilters((current) => ({
    ...current,
    [field]: value,
  }))

  setResult(null)
  setError('')
}
```

Utilite :

- mettre a jour un filtre ;
- effacer l'ancien resultat ;
- effacer l'ancienne erreur.

Exemple :

```txt
Utilisateur change le poste.
La liste des employes concernes est recalculee.
Le resultat precedent est cache.
```

### handleGenerationChange

```jsx
const handleGenerationChange = (field, value) => {
  setGeneration((current) => ({
    ...current,
    [field]: value,
  }))

  setResult(null)
  setError('')
}
```

Utilite :

- mettre a jour un parametre de generation ;
- effacer l'ancien resultat ;
- effacer l'ancienne erreur.

Champs modifies :

- mois ;
- annee ;
- salaire par jour ;
- pourcentage jour ferie.

### handleGenerate

```jsx
const handleGenerate = async () => {
  ...
}
```

Utilite :

- verifier que les filtres sont coherents ;
- demander confirmation ;
- appeler le service de generation ;
- afficher le resultat.

Etapes :

1. Effacer les anciennes erreurs et l'ancien resultat.
2. Verifier que `minHours` ne depasse pas `maxHours`.
3. Demander confirmation avec `window.confirm`.
4. Activer l'etat `generating`.
5. Appeler `SalaryService.generateMonthlySalariesForEmployees`.
6. Stocker le resultat avec `setResult`.
7. Afficher une erreur si l'appel echoue.
8. Desactiver l'etat `generating`.

Appel principal :

```jsx
const data = await SalaryService.generateMonthlySalariesForEmployees({
  employees: filteredEmployees,
  month: generation.month,
  year: generation.year,
  dailySalary: generation.dailySalary,
  holidayPercent: generation.holidayPercent,
  holidays,
})
```

## Affichage de la page

### Section filtres employes

Champs affiches :

- poste ;
- genre ;
- heure de travail min ;
- heure de travail max.

Chaque champ appelle `handleFilterChange`.

### Section parametres du salaire

Champs affiches :

- mois ;
- annee ;
- salaire par jour ;
- majoration jour ferie.

Chaque champ appelle `handleGenerationChange`.

### Resume

La page affiche :

```txt
Employes concernes : nombre d'employes apres filtrage
Jours feries du mois : nombre de jours feries dans le mois choisi
```

Si des jours feries existent dans le mois, ils sont listes avec leur date et leur nom.

### Tableau des employes concernes

Colonnes :

- reference ;
- nom ;
- poste ;
- genre ;
- heures par semaine.

Fonctions utilisees :

- `EmployeeService.getEmployeeId`
- `EmployeeService.getEmployeeRef`
- `EmployeeService.getEmployeeName`
- `EmployeeService.getEmployeePoste`
- `EmployeeService.getEmployeeGender`
- `EmployeeService.getEmployeeWeeklyHours`

### Resultat

Apres generation, la page affiche :

- le nombre de salaires crees ;
- la liste des messages de creation ;
- les employes ignores ;
- les erreurs.

## Fonctions EmployeeService utilisees

Fichier :

```txt
react/src/services/dolibarr/EmployeeService.js
```

### getEmployees

Utilite :

- recuperer les employes depuis Dolibarr ;
- exclure les comptes admin/superadmin.

### getEmployeeId

Utilite :

- recuperer l'identifiant Dolibarr de l'employe.

### getEmployeeRef

Utilite :

- recuperer la reference metier de l'employe.

### getEmployeeName

Utilite :

- construire le nom complet de l'employe.

### getEmployeePoste

Utilite :

- recuperer le poste de l'employe.

### getEmployeeGender

Utilite :

- normaliser le genre en `homme`, `femme` ou `autre`.

### getEmployeeWeeklyHours

Utilite :

- recuperer le nombre d'heures de travail par semaine.

### filterEmployeesForSalaryGeneration

Utilite :

- appliquer les filtres de generation sur les employes.

Filtres :

- poste ;
- genre ;
- heure min ;
- heure max.

## Fonctions JourFerieService utilisees

Fichier :

```txt
react/src/services/backend/JourFerieService.js
```

### getAll

Utilite :

- recuperer tous les jours feries depuis le backend local.

Les jours feries servent ensuite a :

- afficher les jours feries du mois selectionne ;
- calculer la majoration dans `SalaryService`.

## Fonctions SalaryService utilisees

Fichier :

```txt
react/src/services/dolibarr/SalaryService.js
```

## Fonctions utilitaires de date

### getDateFromSalaryLabel

```js
const getDateFromSalaryLabel = (salary, index) => {
  const text = String(salary?.label || salary?.ref || salary?.ref_salary || '')
  const dates = text.match(/\d{4}-\d{2}-\d{2}/g)

  if (!dates || !dates[index]) {
    return null
  }

  return dates[index]
}
```

Utilite :

- retrouver une date dans le libelle du salaire si Dolibarr ne renvoie pas clairement `datesp` ou `dateep`.

Exemple :

```txt
Label : Salaire Jean - 2026-01-11 au 2026-01-31

index 0 : 2026-01-11
index 1 : 2026-01-31
```

### padDatePart

```js
const padDatePart = (value) => {
  return String(value).padStart(2, '0')
}
```

Utilite :

- transformer `1` en `01` ;
- produire des dates au format `YYYY-MM-DD`.

### buildDateValue

```js
const buildDateValue = (year, month, day) => {
  return `${year}-${padDatePart(month)}-${padDatePart(day)}`
}
```

Utilite :

- construire une date texte au format ISO simple.

Exemple :

```txt
buildDateValue(2026, 1, 5) => 2026-01-05
```

### toDateValue

```js
const toDateValue = (dateValue) => {
  const date = getDate(dateValue)
  ...
}
```

Utilite :

- convertir une date Dolibarr en format `YYYY-MM-DD`.

Dolibarr peut renvoyer :

- un timestamp ;
- une date texte ;
- une valeur vide.

Cette fonction normalise la date pour comparer facilement les intervalles.

### addDaysToDateValue

```js
const addDaysToDateValue = (dateValue, days) => {
  const date = new Date(`${dateValue}T00:00:00`)
  date.setDate(date.getDate() + days)
  ...
}
```

Utilite :

- ajouter un nombre de jours a une date.

Exemple :

```txt
addDaysToDateValue('2026-01-10', 1) => 2026-01-11
```

### isDateInInterval

```js
const isDateInInterval = (dateValue, startDate, endDate) => {
  return dateValue >= startDate && dateValue <= endDate
}
```

Utilite :

- verifier si une date est incluse dans un intervalle.

Comme les dates sont au format `YYYY-MM-DD`, la comparaison texte fonctionne correctement.

Exemple :

```txt
dateValue : 2026-01-05
startDate : 2026-01-01
endDate : 2026-01-10

Resultat : true
```

### countDaysInInterval

```js
const countDaysInInterval = (startDate, endDate) => {
  let count = 0
  let currentDate = startDate

  while (currentDate <= endDate) {
    count += 1
    currentDate = addDaysToDateValue(currentDate, 1)
  }

  return count
}
```

Utilite :

- compter le nombre de jours entre deux dates incluses.

Exemple :

```txt
2026-01-01 au 2026-01-10 => 10 jours
```

### getMonthStartDate

```js
const getMonthStartDate = (month, year) => {
  return buildDateValue(year, month, 1)
}
```

Utilite :

- obtenir le premier jour du mois.

Exemple :

```txt
getMonthStartDate(1, 2026) => 2026-01-01
```

### getMonthEndDate

```js
const getMonthEndDate = (month, year) => {
  const lastDay = new Date(Number(year), Number(month), 0).getDate()
  return buildDateValue(year, month, lastDay)
}
```

Utilite :

- obtenir le dernier jour du mois.

Exemple :

```txt
getMonthEndDate(2, 2026) => 2026-02-28
```

### getMonthDays

```js
const getMonthDays = (month, year) => {
  const lastDay = new Date(Number(year), Number(month), 0).getDate()
  const days = []

  for (let day = 1; day <= lastDay; day += 1) {
    days.push(buildDateValue(year, month, day))
  }

  return days
}
```

Utilite :

- generer tous les jours du mois.

Exemple :

```txt
Janvier 2026 => 2026-01-01, 2026-01-02, ..., 2026-01-31
```

### getDateOverlap

```js
const getDateOverlap = (startDateValue, endDateValue, limitStartDate, limitEndDate) => {
  ...
}
```

Utilite :

- trouver la partie d'un salaire existant qui chevauche le mois choisi.

Exemple :

```txt
Mois choisi : janvier 2026
Salaire existant : 2025-12-20 au 2026-01-10

Chevauchement retourne : 2026-01-01 au 2026-01-10
```

Autre exemple :

```txt
Mois choisi : janvier 2026
Salaire existant : 2026-02-01 au 2026-02-10

Chevauchement retourne : null
```

### groupDatesIntoIntervals

```js
const groupDatesIntoIntervals = (dates) => {
  ...
}
```

Utilite :

- transformer une liste de jours en intervalles continus.

Exemple :

```txt
Jours a generer :
2026-01-11, 2026-01-12, 2026-01-13

Intervalle :
2026-01-11 au 2026-01-13
```

Exemple avec deux trous :

```txt
Jours a generer :
2026-01-11 au 2026-01-15
2026-01-21 au 2026-01-31

Intervalles :
2026-01-11 au 2026-01-15
2026-01-21 au 2026-01-31
```

## Validation de la generation mensuelle

### validateMonthlySalaryGeneration

```js
validateMonthlySalaryGeneration: ({ employees, month, year, dailySalary, holidayPercent }) => {
  ...
}
```

Utilite :

- verifier les donnees avant de creer les salaires.

Verifications :

- il faut au moins un employe ;
- le mois doit etre entre 1 et 12 ;
- l'annee doit etre superieure ou egale a 2000 ;
- le salaire par jour doit etre superieur a 0 ;
- le pourcentage de majoration ne doit pas etre negatif.

Si une condition n'est pas respectee, la fonction lance une erreur.

## Generation mensuelle des salaires

### generateMonthlySalariesForEmployees

```js
generateMonthlySalariesForEmployees: async ({
  employees,
  month,
  year,
  dailySalary,
  holidayPercent,
  holidays,
}) => {
  ...
}
```

Cette fonction contient la logique principale de la nouvelle fonctionnalite.

Parametres :

- `employees` : employes concernes apres filtrage ;
- `month` : mois choisi ;
- `year` : annee choisie ;
- `dailySalary` : salaire par jour ;
- `holidayPercent` : pourcentage de majoration des jours feries ;
- `holidays` : liste de tous les jours feries.

### Etape 1 - Validation

```js
SalaryService.validateMonthlySalaryGeneration({
  employees,
  month,
  year,
  dailySalary,
  holidayPercent,
})
```

La fonction verifie que les donnees sont correctes avant de continuer.

### Etape 2 - Conversion des valeurs

```js
const monthNumber = Number(month)
const yearNumber = Number(year)
const dailySalaryNumber = Number(dailySalary)
const holidayPercentNumber = Number(holidayPercent || 0)
```

Utilite :

- convertir les valeurs du formulaire en nombres ;
- eviter les calculs avec des chaines de caracteres.

### Etape 3 - Construction du mois

```js
const monthStartDate = getMonthStartDate(monthNumber, yearNumber)
const monthEndDate = getMonthEndDate(monthNumber, yearNumber)
const monthDays = getMonthDays(monthNumber, yearNumber)
```

Resultat pour janvier 2026 :

```txt
monthStartDate = 2026-01-01
monthEndDate = 2026-01-31
monthDays = tous les jours du 1 au 31
```

### Etape 4 - Jours feries du mois

```js
const monthHolidays = holidays.filter((holiday) => {
  return holiday.date >= monthStartDate && holiday.date <= monthEndDate
})
```

Utilite :

- garder seulement les jours feries dans le mois choisi.

### Etape 5 - Recuperation des salaires existants

```js
const salaries = await SalaryService.getSalaries()
```

Utilite :

- recuperer les salaires deja crees dans Dolibarr ;
- eviter de generer deux fois la meme periode.

### Etape 6 - Resultat initial

```js
const result = {
  created: [],
  skipped: [],
  errors: [],
}
```

Utilite :

- `created` : salaires crees ;
- `skipped` : employes ignores ;
- `errors` : erreurs pendant la generation.

### Etape 7 - Boucle par employe

```js
for (const employee of employees) {
  ...
}
```

La generation est faite employe par employe.

Pour chaque employe, on recupere :

```js
const employeeId = EmployeeService.getEmployeeId(employee)
const employeeName = EmployeeService.getEmployeeName(employee) || `Employe ${employeeId}`
```

### Etape 8 - Salaires existants de l'employe

```js
const employeeSalaries = salaries.filter((salary) => {
  return SalaryService.getSalaryUserId(salary) === employeeId
})
```

Utilite :

- garder seulement les salaires deja existants de l'employe courant.

### Etape 9 - Intervalles existants

```js
const existingIntervals = employeeSalaries
  .map((salary) => {
    return getDateOverlap(
      SalaryService.getSalaryStartDate(salary),
      SalaryService.getSalaryEndDate(salary),
      monthStartDate,
      monthEndDate,
    )
  })
  .filter(Boolean)
```

Utilite :

- recuperer les intervalles deja couverts dans le mois choisi ;
- exclure tous les salaires existants, payes ou non payes.

Exemple :

```txt
Mois choisi : janvier
Salaire existant : 2026-01-01 au 2026-01-10

existingIntervals :
2026-01-01 au 2026-01-10
```

### Etape 10 - Jours a generer

```js
const daysToGenerate = monthDays.filter((day) => {
  return !existingIntervals.some((interval) => {
    return isDateInInterval(day, interval.startDate, interval.endDate)
  })
})
```

Utilite :

- prendre tous les jours du mois ;
- retirer les jours deja couverts par un salaire existant.

Exemple :

```txt
Mois : 2026-01-01 au 2026-01-31
Salaire existant : 2026-01-01 au 2026-01-10

daysToGenerate :
2026-01-11 au 2026-01-31
```

### Etape 11 - Regroupement en intervalles

```js
const intervalsToGenerate = groupDatesIntoIntervals(daysToGenerate)
```

Utilite :

- eviter de creer un salaire par jour ;
- creer un salaire par intervalle continu.

Exemple :

```txt
Jours a generer : 2026-01-11 au 2026-01-31
Intervalle cree : 2026-01-11 au 2026-01-31
```

### Etape 12 - Mois deja complet

```js
if (!intervalsToGenerate.length) {
  result.skipped.push(`${employeeName} : tout le mois a deja un salaire.`)
  continue
}
```

Utilite :

- ne rien creer si tout le mois est deja couvert par des salaires existants ;
- ajouter un message dans `skipped`.

### Etape 13 - Calcul du montant par intervalle

```js
const daysCount = countDaysInInterval(interval.startDate, interval.endDate)
```

Compte le nombre de jours dans l'intervalle.

```js
const holidayCount = monthHolidays.filter((holiday) => {
  return isDateInInterval(holiday.date, interval.startDate, interval.endDate)
}).length
```

Compte les jours feries dans l'intervalle.

```js
const baseAmount = daysCount * dailySalaryNumber
const holidayBonus = (holidayCount * dailySalaryNumber * holidayPercentNumber) / 100
const amount = Math.round(baseAmount + holidayBonus)
```

Calcule le montant final.

Formule :

```txt
montant_base = nombre_jours * salaire_par_jour
bonus_jour_ferie = nombre_jours_feries * salaire_par_jour * pourcentage / 100
montant_total = montant_base + bonus_jour_ferie
```

Exemple :

```txt
Intervalle : 2026-01-11 au 2026-01-31
Nombre de jours : 21
Salaire par jour : 10 000
Jours feries : 1
Majoration : 50%

Base = 21 * 10 000 = 210 000
Bonus = 1 * 10 000 * 50 / 100 = 5 000
Total = 215 000
```

### Etape 14 - Creation du salaire

```js
const salaryId = await SalaryService.createSalary({
  fk_user: employeeId,
  label: `Salaire ${employeeName} - ${interval.startDate} au ${interval.endDate}`,
  amount,
  datesp: interval.startDate,
  dateep: interval.endDate,
})
```

Utilite :

- creer le salaire dans Dolibarr.

Donnees envoyees :

- `fk_user` : identifiant de l'employe ;
- `label` : libelle du salaire ;
- `amount` : montant calcule ;
- `datesp` : date debut ;
- `dateep` : date fin.

### Etape 15 - Ajout au resultat

```js
result.created.push({
  employeeId,
  employeeName,
  salaryId,
  startDate: interval.startDate,
  endDate: interval.endDate,
  daysCount,
  holidayCount,
  amount,
  message,
})
```

Utilite :

- memoriser le salaire cree ;
- afficher un message dans l'interface.

### Etape 16 - Gestion des erreurs

```js
catch (error) {
  result.errors.push(`${employeeName} : ${error.message}`)
}
```

Utilite :

- si un employe echoue, la generation continue pour les autres ;
- l'erreur est affichee dans le bloc resultat.

## Fonction createSalary

```js
createSalary: async (salary) => {
  const payload = {
    fk_user: Number(salary.fk_user),
    label: salary.label,
    amount: Number(salary.amount),
    datesp: toTimestamp(salary.datesp),
    dateep: toTimestamp(salary.dateep),
  }

  const data = await dolibarrClient.post('/salaries', payload)

  return SalaryService.getCreatedSalaryId(data)
}
```

Utilite :

- envoyer le salaire a l'API Dolibarr ;
- convertir les dates en timestamp ;
- retourner l'identifiant du salaire cree.

## Fonction getSalaries

```js
getSalaries: async () => {
  const data = await dolibarrClient.get('/salaries', {
    limit: 10000,
    sortfield: 't.datep',
    sortorder: 'DESC',
  })

  return normalizeList(data)
}
```

Utilite :

- recuperer les salaires existants depuis Dolibarr ;
- normaliser la reponse en tableau.

## Fonctions de date de salaire

### getSalaryStartDate

Utilite :

- recuperer la date debut d'un salaire.

Champs verifies :

- `datesp`
- `date_start`
- `date_debut`
- `period_start`
- `periode_debut`
- date trouvee dans le label

### getSalaryEndDate

Utilite :

- recuperer la date fin d'un salaire.

Champs verifies :

- `dateep`
- `date_end`
- `date_fin`
- `period_end`
- `periode_fin`
- date trouvee dans le label

## Scenario complet

Parametres :

```txt
Mois : janvier
Annee : 2026
Salaire par jour : 10 000
Majoration jour ferie : 50%
```

Salaires existants :

```txt
Employe A : 2026-01-01 au 2026-01-10
```

Jour ferie :

```txt
2026-01-15
```

Fonctionnement :

```txt
1. La page construit tous les jours de janvier.
2. Elle recupere les salaires existants.
3. Elle detecte que 2026-01-01 au 2026-01-10 existe deja.
4. Elle exclut ces jours.
5. Elle garde 2026-01-11 au 2026-01-31.
6. Elle detecte 1 jour ferie dans cet intervalle.
7. Elle calcule :
   - 21 jours * 10 000 = 210 000
   - bonus ferie = 1 * 10 000 * 50 / 100 = 5 000
   - total = 215 000
8. Elle cree un salaire Dolibarr du 2026-01-11 au 2026-01-31.
```

## Resume rapide

La page `bulk-create-month` sert a generer des salaires mensuels intelligemment.

Elle ne genere pas tout le mois aveuglement. Elle :

- filtre les employes ;
- lit les jours feries ;
- lit les salaires existants ;
- exclut les periodes deja couvertes ;
- regroupe les jours restants en intervalles ;
- calcule le montant avec majoration jour ferie ;
- cree les salaires manquants dans Dolibarr.
