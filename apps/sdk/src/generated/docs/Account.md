
# Account


## Properties

Name | Type
------------ | -------------
`accountId` | string
`entityId` | string
`accountType` | string
`kycTier` | number
`status` | string
`openedOn` | Date
`riskCategory` | string
`declaredAnnualIncome` | number
`txnCount7d` | number
`txnCount30d` | number
`volume7d` | number
`volume30d` | number
`avgMonthlyVolume` | number
`avgMonthlyCount` | number
`uniqueCounterparties30d` | number
`lastActiveTs` | Date

## Example

```typescript
import type { Account } from 'gten-internal'

// TODO: Update the object below with actual values
const example = {
  "accountId": null,
  "entityId": null,
  "accountType": null,
  "kycTier": null,
  "status": null,
  "openedOn": null,
  "riskCategory": null,
  "declaredAnnualIncome": null,
  "txnCount7d": null,
  "txnCount30d": null,
  "volume7d": null,
  "volume30d": null,
  "avgMonthlyVolume": null,
  "avgMonthlyCount": null,
  "uniqueCounterparties30d": null,
  "lastActiveTs": null,
} satisfies Account

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as Account
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


