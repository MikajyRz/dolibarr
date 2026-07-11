# SalaryService

Ce document explique les fonctions du fichier :

`react/src/services/dolibarr/SalaryService.js`

`SalaryService` centralise la gestion des salaires Dolibarr cote React :

- recuperation des salaires et paiements ;
- lecture normalisee des champs Dolibarr ;
- validation des formulaires de salaire et de paiement ;
- creation de salaires ;
- paiement de salaires ;
- generation de salaires pour plusieurs employes ;
- generation mensuelle avec jours feries et weekends ;
- paiement automatique par ordre de priorite.

## Configuration utilisee

### `CASH_PAYMENT_TYPE_ID`

ID du mode de paiement en especes.

La valeur est lue depuis :

1. `VITE_DOLIBARR_CASH_PAYMENT_TYPE_ID`
2. `VITE_DOLIBARR_PAYMENT_TYPE_ID`
3. valeur par defaut `4`

Elle est envoyee dans les payloads de paiement Dolibarr.

### `CASH_ACCOUNT_ID`

ID du compte caisse ou compte bancaire utilise pour enregistrer les paiements.

La valeur est lue depuis :

1. `VITE_DOLIBARR_CASH_ACCOUNT_ID`
2. `VITE_DOLIBARR_BANK_ACCOUNT_ID`
3. valeur par defaut `1`

## Fonctions utilitaires internes

Ces fonctions ne sont pas exportees directement, mais elles sont utilisees par les fonctions de `SalaryService`.

### `toNumber(value, fallback = 0)`

Convertit une valeur en nombre.

Si `value` est vide, la fonction utilise `fallback`.

Exemples :

- `toNumber("12")` retourne `12`.
- `toNumber(null)` retourne `0`.
- `toNumber(null, 5)` retourne `5`.

### `toText(value, fallback = '')`

Convertit une valeur en chaine de caracteres.

Si `value` est vide, la fonction utilise `fallback`.

### `validateEmployees(employees)`

Verifie que la liste d'employes n'est pas vide.

Si aucun employe ne correspond au filtre, la fonction lance une erreur.

Elle est utilisee avant les generations en masse.

### `validateMonthYear(month, year)`

Verifie que :

- le mois existe entre `1` et `12` ;
- l'annee est renseignee et superieure ou egale a `2000`.

Elle est utilisee pour les traitements mensuels.

### `validatePositiveNumber(value, message)`

Verifie qu'une valeur numerique est strictement positive.

Si la valeur est vide, egale a `0` ou negative, la fonction lance l'erreur fournie dans `message`.

### `validateNotNegativeNumber(value, message)`

Verifie qu'une valeur numerique n'est pas negative.

La valeur `0` est acceptee.

### `toTimestamp(dateValue)`

Convertit une date en timestamp Unix en secondes, attendu par Dolibarr.

Si aucune date n'est fournie, retourne une chaine vide.

### `getObjectId(item)`

Recupere un identifiant depuis plusieurs noms de champs possibles :

- `id`
- `rowid`
- `fk_user`

Cette fonction sert surtout a faire le lien entre salaires et employes.

### `getDate(dateValue)`

Convertit une date Dolibarr en objet `Date`.

La fonction accepte :

- un timestamp numerique en secondes ;
- une chaine numerique representant un timestamp ;
- une date sous forme de texte.

Elle retourne `null` si la valeur est vide ou egale a `"0"`.

### `getMonthKey(dateValue)`

Transforme une date en cle de mois au format `YYYY-MM`.

Si la date est invalide, retourne `Non renseigne`.

Exemple : `2026-07-10` devient `2026-07`.

### `getDateFromSalaryLabel(salary, index)`

Cherche des dates au format `YYYY-MM-DD` dans le libelle ou la reference d'un salaire.

Elle sert de fallback quand les champs de periode ne sont pas disponibles dans la reponse Dolibarr.

- `index = 0` recupere la premiere date.
- `index = 1` recupere la deuxieme date.

### `isInvalidPaymentEndpointError(error)`

Detecte une erreur Dolibarr indiquant que l'endpoint de paiement utilise n'accepte pas l'identifiant fourni.

Elle aide a choisir un endpoint alternatif.

### `isUnavailableEndpointError(error)`

Detecte les erreurs indiquant qu'un endpoint Dolibarr n'est pas disponible ou pas compatible :

- bad request ;
- not found ;
- unknown api ;
- erreurs `400` ou `404` ;
- erreur d'identifiant detectee par `isInvalidPaymentEndpointError`.

Cette fonction permet de faire un fallback entre plusieurs endpoints.

### `normalizeList(data)`

Normalise une reponse API en tableau.

Elle accepte plusieurs formes de reponse :

- tableau direct ;
- `{ data: [...] }`
- `{ records: [...] }`
- `{ rows: [...] }`

Si aucune liste n'est trouvee, retourne `[]`.

### `padDatePart(value)`

Ajoute un `0` devant le mois ou le jour si necessaire.

Exemple : `7` devient `07`.

### `buildDateValue(year, month, day)`

Construit une date texte au format `YYYY-MM-DD`.

Exemple : `buildDateValue(2026, 7, 5)` retourne `2026-07-05`.

### `toDateValue(dateValue)`

Convertit une date en chaine `YYYY-MM-DD`.

Si la date est invalide, retourne une chaine vide.

### `addDaysToDateValue(dateValue, days)`

Ajoute un nombre de jours a une date `YYYY-MM-DD`.

Elle retourne aussi une date `YYYY-MM-DD`.

### `isDateInInterval(dateValue, startDate, endDate)`

Verifie si une date est comprise entre deux dates incluses.

Les dates sont comparees au format `YYYY-MM-DD`.

### `getDayOfWeek(dateValue)`

Retourne le jour de la semaine pour une date.

La valeur suit le comportement JavaScript :

- `0` = dimanche ;
- `6` = samedi.

### `isSaturdayDate(dateValue)`

Retourne `true` si la date est un samedi.

### `isSundayDate(dateValue)`

Retourne `true` si la date est un dimanche.

### `getDatesInInterval(startDate, endDate)`

Retourne toutes les dates entre `startDate` et `endDate`, bornes incluses.

Exemple : du `2026-07-01` au `2026-07-03`, retourne :

- `2026-07-01`
- `2026-07-02`
- `2026-07-03`

### `getMonthStartDate(month, year)`

Retourne le premier jour du mois au format `YYYY-MM-DD`.

### `getMonthEndDate(month, year)`

Retourne le dernier jour du mois au format `YYYY-MM-DD`.

La fonction tient compte du nombre de jours reel du mois.

### `getMonthDays(month, year)`

Retourne la liste de tous les jours d'un mois au format `YYYY-MM-DD`.

Elle est utilisee pour savoir quels jours doivent encore recevoir un salaire.

### `getDateOverlap(startDateValue, endDateValue, limitStartDate, limitEndDate)`

Calcule l'intersection entre une periode de salaire existante et une periode limite.

Si les deux periodes ne se croisent pas, retourne `null`.

Sinon, retourne :

```js
{
  startDate: 'YYYY-MM-DD',
  endDate: 'YYYY-MM-DD'
}
```

### `groupDatesIntoIntervals(dates)`

Regroupe une liste de dates continues en intervalles.

Exemple :

```js
['2026-07-01', '2026-07-02', '2026-07-04']
```

devient :

```js
[
  { startDate: '2026-07-01', endDate: '2026-07-02' },
  { startDate: '2026-07-04', endDate: '2026-07-04' }
]
```

Cette fonction evite de creer un salaire jour par jour quand plusieurs jours consecutifs peuvent etre regroupes.

### `calculateMonthlySalaryAmount(params)`

Calcule le montant d'un salaire mensuel ou d'une periode.

Parametres principaux :

- `dates` : jours a payer ;
- `dailySalary` : salaire journalier ;
- `holidayDates` : ensemble des dates feriees ;
- `holidayPercent` : majoration des jours feries ;
- `includeSaturday` : indique si le samedi recoit une majoration weekend ;
- `includeSunday` : indique si le dimanche recoit une majoration weekend ;
- `weekendPercent` : majoration weekend.

Pour chaque date, la fonction ajoute :

```txt
dailySalary + majoration
```

Si un jour est ferie et weekend, la fonction prend la plus grande majoration entre ferie et weekend.

La fonction retourne :

- `amount` : montant total arrondi ;
- `holidayCount` : nombre de jours feries ;
- `saturdayCount` : nombre de samedis comptes ;
- `sundayCount` : nombre de dimanches comptes ;
- `weekendCount` : nombre total de jours weekend comptes ;
- `holidayWeekendCount` : nombre de jours qui sont a la fois feries et weekend.

### `getMonthlySalaryContext(params)`

Prepare toutes les informations necessaires pour generer les salaires d'un mois :

- date de debut du mois ;
- date de fin du mois ;
- liste des jours du mois ;
- salaire journalier numerique ;
- pourcentages de majoration ;
- options samedi et dimanche ;
- ensemble des jours feries du mois.

Cette fonction evite de recalculer ces valeurs pour chaque employe.

### `getEmployeeSalaryIntervals(params)`

Recupere les periodes de salaire deja existantes pour un employe donne sur le mois choisi.

Elle :

1. filtre les salaires de l'employe ;
2. calcule le chevauchement avec le mois choisi ;
3. garde uniquement les periodes utiles.

### `getIntervalsToGenerate(params)`

Determine les periodes qu'il faut encore generer.

Elle compare :

- tous les jours du mois ;
- les periodes de salaire deja existantes.

Les jours deja couverts par un salaire sont ignores. Les jours restants sont regroupes en intervalles continus.

### `createMonthlySalaryForInterval(params)`

Cree un salaire Dolibarr pour un employe et une periode precise.

La fonction :

1. liste les dates de l'intervalle ;
2. calcule le montant avec `calculateMonthlySalaryAmount` ;
3. cree le salaire avec `SalaryService.createSalary` ;
4. retourne une ligne de resultat avec les compteurs et le message.

### `buildEmployeeById(employees)`

Construit une `Map` avec :

- cle : ID employe ;
- valeur : objet employe.

Cette structure permet de retrouver rapidement l'employe d'un salaire.

### `addPaidAmount(paidBySalaryId, salaryId, paid)`

Ajoute un montant paye dans une `Map` indexee par ID de salaire.

La fonction ignore les montants vides ou negatifs.

### `buildPaidBySalaryId(payments)`

Calcule le total deja paye pour chaque salaire.

Elle gere deux formats Dolibarr :

- paiement avec objet `amounts`, par exemple `{ "12": 100000 }` ;
- paiement avec champ de montant simple.

Elle retourne une `Map` :

- cle : ID salaire ;
- valeur : total deja paye.

### `buildSalaryToPayItem(params)`

Construit un objet complet pour un salaire a payer.

L'objet contient notamment :

- le salaire original ;
- l'ID du salaire ;
- l'employe associe ;
- le nom de l'employe ;
- le poste ;
- la periode ;
- le montant total ;
- le total deja paye ;
- le reste a payer ;
- un indicateur `isPriority`.

Cette fonction prepare les donnees pour le tri et le paiement automatique.

### `isPayableSalaryInMonth(params)`

Verifie qu'un salaire peut etre paye dans le mois demande.

Conditions :

- le salaire a un ID ;
- l'employe existe dans la liste filtree ;
- la date de debut est dans le mois ;
- le reste a payer est superieur a `0`.

### `sortSalaryToPayItems(a, b)`

Trie les salaires a payer.

Ordre applique :

1. les salaires du poste prioritaire ;
2. les salaires avec la date de debut la plus ancienne ;
3. le nom de l'employe.

### `createPaymentResult(amount)`

Prepare l'objet de resultat de la generation de paiements.

Structure retournee :

```js
{
  budmget: amount,
  totalPaid: 0,
  remainingBudget: amount,
  paid: [],
  skipped: [],
  errors: []
}
```

### `getTodayDateValue()`

Retourne la date du jour au format `YYYY-MM-DD`.

Elle sert de date de paiement pour la generation automatique.

### `paySalaryItem(params)`

Paie un salaire precis avec `SalaryService.paySalary`.

Elle retourne ensuite une ligne de resultat contenant :

- ID du salaire ;
- ID employe ;
- nom de l'employe ;
- poste ;
- periode ;
- montant paye ;
- reste avant paiement ;
- indicateur de paiement partiel.

## Fonctions exportees dans `SalaryService`

### `getSalaries()`

Recupere les salaires depuis Dolibarr avec :

```txt
GET /salaries
```

Parametres envoyes :

- `limit: 10000`
- `sortfield: t.datep`
- `sortorder: DESC`

La reponse est normalisee avec `normalizeList`.

### `getSalaryPayments()`

Recupere les paiements de salaires depuis Dolibarr.

La fonction essaie d'abord :

```txt
GET /salaries/payments
```

Si cet endpoint n'est pas disponible, elle essaie :

```txt
GET /salaries/getAllPayments
```

Si le second endpoint est aussi indisponible, elle retourne `[]`.

Les erreurs autres qu'un endpoint indisponible sont relancees.

### `getSalaryAmount(salary)`

Recupere le montant d'un salaire.

Champs acceptes :

- `amount`
- `salary`
- `total`

Retourne toujours un nombre.

### `getSalaryUserId(salary)`

Recupere l'ID de l'employe associe au salaire.

Champs acceptes :

- `fk_user`
- `user_id`
- `entity`

### `getSalaryId(salary)`

Recupere l'ID du salaire.

Champs acceptes :

- `id`
- `rowid`
- `chid`

### `getSalaryRef(salary)`

Recupere une reference lisible pour le salaire.

Champs acceptes :

- `ref`
- `ref_salary`
- `ref_ext`
- `label`
- `id`

Si rien n'est trouve, retourne `-`.

### `getSalaryStartDate(salary)`

Recupere la date de debut de periode d'un salaire.

Champs acceptes :

- `datesp`
- `date_start`
- `date_debut`
- `period_start`
- `periode_debut`

Si aucun champ n'existe, la fonction tente de lire la premiere date dans le libelle ou la reference.

### `getSalaryEndDate(salary)`

Recupere la date de fin de periode d'un salaire.

Champs acceptes :

- `dateep`
- `date_end`
- `date_fin`
- `period_end`
- `periode_fin`

Si aucun champ n'existe, la fonction tente de lire la deuxieme date dans le libelle ou la reference.

### `getPaymentSalaryId(payment)`

Recupere l'ID du salaire associe a un paiement.

Cas gere en priorite :

- si `payment.amounts` contient un seul salaire, la cle de cet objet est utilisee.

Sinon, champs acceptes :

- `fk_salary`
- `salary_id`
- `fk_salarydet`
- `salaryid`
- `chid`
- `fk_salary_payment`
- `fk_salary_paiement`
- `fk_object`
- `id_salary`

### `formatDate(dateValue)`

Formate une date en format francais avec `toLocaleDateString('fr-FR')`.

Si la date est invalide, retourne `-`.

### `formatSalaryPeriod(startDate, endDate)`

Formate une periode de salaire pour affichage.

Regles :

- aucune date valide : `-` ;
- seulement le debut : date de debut ;
- seulement la fin : date de fin ;
- meme debut et fin : une seule date ;
- debut different de fin : `debut au fin`.

### `getEmployeeSalariesWithPayments(employeeId)`

Recupere l'historique des salaires d'un employe avec leurs paiements.

La fonction :

1. charge tous les salaires ;
2. charge tous les paiements ;
3. filtre les salaires de l'employe ;
4. associe les paiements a chaque salaire ;
5. calcule le total paye et le reste a payer.

Chaque element retourne contient :

- `salary` : salaire original ;
- `payments` : paiements associes ;
- `salaryId` : ID du salaire ;
- `ref` : reference ;
- `startDate` : date de debut ;
- `endDate` : date de fin ;
- `amount` : montant du salaire ;
- `totalPaid` : total paye ;
- `remaining` : reste a payer.

### `getPaymentAmount(payment)`

Recupere le montant d'un paiement.

Champs acceptes :

- `amount`
- `total`
- `payment_amount`

### `getPaymentAmountForSalary(payment, salaryId)`

Recupere le montant paye pour un salaire precis.

Si `payment.amounts` existe, la fonction prend le montant correspondant a `salaryId`.

Sinon, elle utilise `getPaymentAmount(payment)`.

### `getPaymentDate(payment)`

Recupere la date d'un paiement.

Champs acceptes :

- `datepaye`
- `datep`
- `date_payment`
- `datec`
- `date`

### `getSalaryMonth(salary)`

Retourne le mois du salaire au format `YYYY-MM`.

La date utilisee est la date de debut du salaire.

### `getPaymentMonth(payment)`

Retourne le mois du paiement au format `YYYY-MM`.

La date utilisee est la date du paiement.

### `getSalaryAmountByGender(salaries, employees)`

Calcule le total des salaires par genre.

La fonction retourne :

```js
{
  homme: 0,
  femme: 0,
  autre: 0
}
```

Elle relie chaque salaire a son employe, recupere son genre avec `EmployeeService.getEmployeeGender`, puis additionne les montants.

### `getSalaryAmountByMonth(salaries)`

Calcule le total des salaires par mois.

Retourne un objet dont les cles sont des mois `YYYY-MM`.

Exemple :

```js
{
  '2026-07': 1200000,
  '2026-08': 900000
}
```

### `getPaymentAmountByMonth(payments)`

Calcule le total des paiements par mois.

Retourne un objet dont les cles sont des mois `YYYY-MM`.

### `getTotalPaid(payments)`

Additionne les montants `amount` d'une liste de paiements.

Cette fonction est utilisee pour verifier qu'un ensemble de paiements ne depasse pas le salaire ou le reste a payer.

### `getValidPayments(payments)`

Filtre les paiements pour garder uniquement ceux dont `amount` est strictement positif.

### `validateSalaryPayment(salary, payments)`

Valide la creation d'un salaire avec ses paiements.

Verifications :

- un employe est choisi (`fk_user`) ;
- le montant du salaire est positif ;
- la date de debut est renseignee ;
- la date de fin est renseignee ;
- au moins un paiement positif existe ;
- chaque paiement a une date de reglement ;
- le mode de paiement especes est configure ;
- le compte caisse est configure ;
- le total paye ne depasse pas le montant du salaire.

Si une verification echoue, la fonction lance une erreur.

### `validateExistingSalaryPayment(salaryHistory, payments)`

Valide le paiement d'un salaire deja existant.

Verifications :

- un salaire existant est choisi ;
- le salaire a encore un reste a payer ;
- au moins un paiement positif existe ;
- chaque paiement a une date de reglement ;
- le mode de paiement especes est configure ;
- le compte caisse est configure ;
- le total paye ne depasse pas le reste a payer.

### `validateSalaryGeneration({ employees, datesp, dateep, amount })`

Valide une generation simple de salaires pour plusieurs employes.

Verifications :

- la liste d'employes n'est pas vide ;
- la date de debut est renseignee ;
- la date de fin est renseignee ;
- la date de debut ne depasse pas la date de fin ;
- le montant est positif.

### `getCreatedSalaryId(data)`

Recupere l'ID retourne apres creation d'un salaire.

Si la reponse est directement un nombre ou une chaine, elle est retournee telle quelle.

Sinon, la fonction lit :

- `id`
- `rowid`

### `createSalary(salary)`

Cree un salaire dans Dolibarr avec :

```txt
POST /salaries
```

Payload envoye :

- `fk_user` : ID employe ;
- `label` : libelle ;
- `amount` : montant ;
- `datesp` : date de debut en timestamp ;
- `dateep` : date de fin en timestamp.

La fonction retourne l'ID du salaire cree.

### `paySalary(salaryId, payment)`

Ajoute un paiement sur un salaire Dolibarr.

La fonction construit un payload compatible avec plusieurs variantes d'API Dolibarr :

- `chid`
- `fk_salary`
- `datepaye`
- `paiementtype`
- `fk_typepayment`
- `type_payment`
- `paymenttype`
- `accountid`
- `fk_account`
- `num_payment`
- `amounts`

Elle essaie d'abord :

```txt
POST /salaries/{salaryId}/payments
```

Si cet endpoint n'est pas disponible, elle utilise :

```txt
POST /salaries/addPayment/{salaryId}
```

### `payExistingSalary(salaryHistory, payments)`

Paie un salaire deja existant.

La fonction :

1. valide les donnees avec `validateExistingSalaryPayment` ;
2. garde les paiements positifs ;
3. appelle `paySalary` pour chaque paiement ;
4. retourne l'ID du salaire paye.

### `createSalaryWithPayments(salary, payments)`

Cree un nouveau salaire puis ajoute ses paiements.

La fonction :

1. valide les donnees avec `validateSalaryPayment` ;
2. cree le salaire avec `createSalary` ;
3. garde les paiements positifs ;
4. paie le salaire avec `paySalary` ;
5. retourne l'ID du salaire cree.

### `generateSalariesForEmployees({ employees, datesp, dateep, amount })`

Genere le meme salaire pour plusieurs employes.

La fonction :

1. valide les donnees avec `validateSalaryGeneration` ;
2. parcourt les employes ;
3. cree un salaire pour chaque employe ;
4. ajoute les creations reussies dans `result.created` ;
5. ajoute les erreurs dans `result.errors`.

Structure retournee :

```js
{
  created: [],
  errors: []
}
```

### `validateMonthlySalaryGeneration(params)`

Valide la generation mensuelle de salaires.

Verifications :

- la liste d'employes n'est pas vide ;
- le mois et l'annee sont valides ;
- le salaire journalier est positif ;
- la majoration des jours feries n'est pas negative ;
- si samedi ou dimanche est inclus, la majoration weekend n'est pas negative.

### `generateMonthlySalariesForEmployees(params)`

Genere les salaires d'un mois pour plusieurs employes.

Parametres principaux :

- `employees`
- `month`
- `year`
- `dailySalary`
- `holidayPercent`
- `holidays`
- `weekendPercent`
- `includeSaturday`
- `includeSunday`

Deroulement :

1. valide les donnees ;
2. prepare le contexte mensuel ;
3. recupere les salaires existants ;
4. pour chaque employe, detecte les periodes deja couvertes ;
5. calcule les periodes manquantes ;
6. cree un salaire pour chaque periode manquante ;
7. ignore l'employe si tout le mois est deja couvert ;
8. collecte les erreurs par employe.

Structure retournee :

```js
{
  created: [],
  skipped: [],
  errors: []
}
```

### `validateSalaryPaymentGeneration({ employees, month, year, amount, priorityPoste })`

Valide la generation automatique de paiements.

Verifications :

- la liste d'employes n'est pas vide ;
- le mois et l'annee sont valides ;
- un poste prioritaire est choisi ;
- le budget de paiement est positif.

### `getSalariesToPayByOrder({ employees, month, year, priorityPoste })`

Retourne les salaires a payer dans le bon ordre.

La fonction :

1. calcule les bornes du mois ;
2. transforme la liste d'employes en `Map` ;
3. recupere les salaires et paiements existants ;
4. calcule le total deja paye par salaire ;
5. construit les objets de paiement ;
6. garde seulement les salaires payables du mois ;
7. trie les salaires par priorite.

Ordre de tri :

1. poste prioritaire ;
2. date de debut la plus ancienne ;
3. nom de l'employe.

### `generatePaymentsByOrder({ employees, month, year, priorityPoste, amount })`

Genere automatiquement des paiements de salaires selon un budget.

La fonction :

1. valide les donnees ;
2. recupere les salaires a payer avec `getSalariesToPayByOrder` ;
3. verifie qu'il y a au moins un salaire avec reste a payer ;
4. initialise le resultat avec le budget ;
5. utilise la date du jour comme date de paiement ;
6. parcourt les salaires dans l'ordre ;
7. paie completement le salaire si le budget suffit ;
8. fait un paiement partiel si le budget restant est insuffisant ;
9. ignore les salaires restants si le budget est termine ;
10. collecte les erreurs sans arreter toute la generation.

Structure retournee :

```js
{
  budget: 0,
  totalPaid: 0,
  remainingBudget: 0,
  paid: [],
  skipped: [],
  errors: []
}
```

Chaque element de `paid` indique si le paiement est partiel avec `isPartial`.

## Flux principaux

### Creation d'un salaire avec paiements

```txt
createSalaryWithPayments
-> validateSalaryPayment
-> createSalary
-> paySalary pour chaque paiement valide
```

### Paiement d'un salaire existant

```txt
payExistingSalary
-> validateExistingSalaryPayment
-> paySalary pour chaque paiement valide
```

### Generation simple pour plusieurs employes

```txt
generateSalariesForEmployees
-> validateSalaryGeneration
-> createSalary pour chaque employe
```

### Generation mensuelle

```txt
generateMonthlySalariesForEmployees
-> validateMonthlySalaryGeneration
-> getMonthlySalaryContext
-> getSalaries
-> getEmployeeSalaryIntervals
-> getIntervalsToGenerate
-> createMonthlySalaryForInterval
-> createSalary
```

### Paiement automatique par ordre

```txt
generatePaymentsByOrder
-> validateSalaryPaymentGeneration
-> getSalariesToPayByOrder
-> getSalaries + getSalaryPayments
-> buildPaidBySalaryId
-> buildSalaryToPayItem
-> sortSalaryToPayItems
-> paySalaryItem
-> paySalary
```

## Points importants a retenir

- Le service accepte plusieurs noms de champs pour rester compatible avec differentes reponses Dolibarr.
- Les dates Dolibarr peuvent etre des timestamps ou des dates texte.
- Les paiements sont toujours envoyes avec le mode de paiement et le compte caisse configures.
- Les endpoints de paiement ont un fallback si l'API Dolibarr expose une route differente.
- La generation mensuelle ne recree pas les periodes deja couvertes par un salaire existant.
- Le paiement automatique peut faire des paiements partiels si le budget ne suffit pas.
