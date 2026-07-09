# Generation des paiements de salaires mensuels

Ce document resume le fonctionnement de la page qui paie les salaires d'un mois selon un ordre de priorite.

## Page utilisee

La page principale est :

`react/src/pages/frontoffice/GenerateSalaryPage.jsx`

Elle est accessible depuis la route :

`/frontoffice/salaries/generate-month`

Cette route est declaree dans :

`react/src/routes/AppRouter.jsx`

Le lien du menu se trouve dans :

`react/src/components/layouts/FrontofficeLayout.jsx`

## Role de la page

La page sert a :

- charger les employes depuis Dolibarr ;
- choisir le mois et l'annee du paiement ;
- choisir le poste prioritaire ;
- saisir le budget disponible ;
- payer les salaires restants selon l'ordre prevu ;
- afficher le budget, le total paye, le reste, les paiements faits et les erreurs.

## Service utilise par la page

### EmployeeService

Fichier :

`react/src/services/dolibarr/EmployeeService.js`

Fonctions importantes :

- `getEmployees()` : recupere les employes Dolibarr.
- `getEmployeeId(employee)` : recupere l'id de l'employe.
- `getEmployeeName(employee)` : recupere le nom complet.
- `getEmployeePoste(employee)` : recupere le poste.
- `getEmployeeGender(employee)` : recupere le genre.
- `getEmployeeWeeklyHours(employee)` : recupere les heures par semaine.

### SalaryService

Fichier :

`react/src/services/dolibarr/SalaryService.js`

Fonction principale appelee par la page :

- `generatePaymentsByOrder(...)`

Cette fonction lance le paiement automatique des salaires.

## Deroulement complet

1. L'utilisateur ouvre la page `GenerateSalaryPage`.
2. La page charge les employes avec `EmployeeService.getEmployees()`.
3. La page liste les postes disponibles.
4. L'utilisateur choisit le mois, l'annee, le poste prioritaire et le budget.
5. Au clic sur `Payer`, la page demande une confirmation.
6. La page appelle `SalaryService.generatePaymentsByOrder(...)`.
7. Le service valide les donnees.
8. Le service recupere les salaires et les paiements existants.
9. Le service calcule le reste a payer pour chaque salaire.
10. Le service trie les salaires : poste prioritaire d'abord, puis salaire le plus ancien.
11. Le service paie les salaires tant qu'il reste du budget.
12. La page affiche le resultat du paiement.

## Fonctions importantes dans SalaryService

### Validation

- `validateSalaryPaymentGeneration(...)` : valide les donnees du formulaire.
- `validateEmployees(...)` : verifie qu'il y a des employes.
- `validateMonthYear(...)` : verifie le mois et l'annee.
- `validatePositiveNumber(...)` : verifie que le budget est positif.

### Recherche des salaires a payer

- `getSalariesToPayByOrder(...)` : retourne les salaires a payer dans le bon ordre.
- `buildEmployeeById(...)` : cree une map des employes par id.
- `buildPaidBySalaryId(...)` : calcule le total deja paye par salaire.
- `buildSalaryToPayItem(...)` : construit un objet contenant le salaire, l'employe, le total paye et le reste.
- `isPayableSalaryInMonth(...)` : garde seulement les salaires du mois choisi avec un reste a payer.
- `sortSalaryToPayItems(...)` : trie les salaires par priorite.

### Paiement

- `generatePaymentsByOrder(...)` : boucle sur les salaires a payer.
- `createPaymentResult(...)` : prepare le resultat initial.
- `getTodayDateValue(...)` : donne la date du paiement.
- `paySalaryItem(...)` : paie un salaire et retourne la ligne de resultat.
- `paySalary(...)` : envoie le paiement a Dolibarr.

## Regle de paiement

Le paiement suit cet ordre :

1. Les salaires du poste prioritaire sont payes en premier.
2. Ensuite, les salaires sont payes selon la date de debut la plus ancienne.
3. Si le budget ne suffit pas pour payer un salaire complet, un paiement partiel est fait.
4. Si le budget est termine, les autres salaires sont marques comme non payes.

## Resultat retourne

La fonction retourne :

- `budget` : montant saisi au depart ;
- `totalPaid` : total reellement paye ;
- `remainingBudget` : budget restant ;
- `paid` : liste des salaires payes ;
- `skipped` : salaires non payes ;
- `errors` : erreurs rencontrees.

## Resume rapide

```txt
GenerateSalaryPage
-> EmployeeService.getEmployees
-> choix mois / annee / poste prioritaire / budget
-> SalaryService.generatePaymentsByOrder
-> validation
-> recuperation salaires + paiements
-> calcul reste a payer
-> tri par poste prioritaire puis date
-> paiement jusqu'a epuisement du budget
-> affichage resultat
```
