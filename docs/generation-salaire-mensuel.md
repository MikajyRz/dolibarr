# Generation de salaire mensuel

Ce document resume le fonctionnement de la generation de salaire par mois dans l'application React.

## Page utilisee

La page principale est :

`react/src/pages/frontoffice/MonthlySalaryGenerationPage.jsx`

Elle est accessible depuis la route :

`/frontoffice/salaries/bulk-create-month`

Cette route est declaree dans :

`react/src/routes/AppRouter.jsx`

Le lien du menu se trouve dans :

`react/src/components/layouts/FrontofficeLayout.jsx`

## Role de la page

La page sert a :

- charger les employes depuis Dolibarr ;
- charger les jours feries depuis le backend ;
- filtrer les employes par poste, genre et heures de travail ;
- choisir le mois, l'annee, le salaire journalier et les majorations ;
- lancer la generation des salaires mensuels ;
- afficher les salaires crees, ignores ou en erreur.

## Services utilises

### EmployeeService

Fichier :

`react/src/services/dolibarr/EmployeeService.js`

Fonctions importantes :

- `getEmployees()` : recupere les employes Dolibarr.
- `filterEmployeesForSalaryGeneration(employees, filters)` : filtre les employes selon les criteres de la page.
- `getEmployeeId(employee)` : recupere l'id de l'employe.
- `getEmployeeName(employee)` : recupere le nom complet.
- `getEmployeePoste(employee)` : recupere le poste.
- `getEmployeeGender(employee)` : recupere le genre.
- `getEmployeeWeeklyHours(employee)` : recupere les heures par semaine.

### JourFerieService

Fichier :

`react/src/services/backend/JourFerieService.js`

Fonction utilisee :

- `getAll()` : recupere tous les jours feries.

### SalaryService

Fichier :

`react/src/services/dolibarr/SalaryService.js`

Fonction principale :

- `generateMonthlySalariesForEmployees(...)`

Elle contient le traitement principal de generation.

## Deroulement complet

1. L'utilisateur ouvre la page `MonthlySalaryGenerationPage`.
2. La page charge les employes avec `EmployeeService.getEmployees()`.
3. La page charge les jours feries avec `JourFerieService.getAll()`.
4. L'utilisateur choisit les filtres et les parametres du salaire.
5. La page filtre les employes avec `filterEmployeesForSalaryGeneration(...)`.
6. Au clic sur le bouton, la page appelle `SalaryService.generateMonthlySalariesForEmployees(...)`.
7. Le service valide les donnees.
8. Le service prepare les dates du mois.
9. Le service verifie les salaires deja existants.
10. Le service calcule les periodes non encore payees.
11. Le service calcule le montant du salaire.
12. Le service cree les salaires dans Dolibarr.
13. La page affiche le resultat.

## Fonctions importantes dans SalaryService

### Validation

- `validateMonthlySalaryGeneration(...)` : valide les parametres principaux.
- `validateEmployees(...)` : verifie qu'il y a au moins un employe.
- `validateMonthYear(...)` : verifie que le mois et l'annee sont valides.
- `validatePositiveNumber(...)` : verifie qu'un nombre est positif.
- `validateNotNegativeNumber(...)` : verifie qu'un nombre n'est pas negatif.

### Preparation du mois

- `getMonthlySalaryContext(...)` : prepare le contexte de calcul du mois.
- `getMonthStartDate(month, year)` : donne la date de debut du mois.
- `getMonthEndDate(month, year)` : donne la date de fin du mois.
- `getMonthDays(month, year)` : liste tous les jours du mois.

### Verification des periodes existantes

- `getEmployeeSalaryIntervals(...)` : recupere les periodes deja payees pour un employe.
- `getDateOverlap(...)` : verifie si un salaire existant chevauche le mois choisi.
- `getIntervalsToGenerate(...)` : calcule les periodes qu'il faut encore generer.
- `groupDatesIntoIntervals(...)` : regroupe les jours libres en periodes continues.

### Calcul et creation

- `calculateMonthlySalaryAmount(...)` : calcule le montant du salaire.
- `createMonthlySalaryForInterval(...)` : cree un salaire pour une periode.
- `createSalary(...)` : envoie la creation du salaire a Dolibarr.

## Regle de calcul

Le montant est calcule avec :

- le salaire journalier ;
- le nombre de jours a payer ;
- la majoration des jours feries ;
- la majoration du samedi si activee ;
- la majoration du dimanche si activee.

Si un salaire existe deja pour une partie du mois, cette periode est ignoree. Le systeme cree seulement les salaires pour les jours restants.

## Resume rapide

```txt
MonthlySalaryGenerationPage
-> EmployeeService + JourFerieService
-> filtres employes
-> SalaryService.generateMonthlySalariesForEmployees
-> validation
-> calcul dates du mois
-> detection periodes deja payees
-> calcul montant
-> creation salaire Dolibarr
-> affichage resultat
```
