
# Transaction


## Properties

Name | Type
------------ | -------------
`txnId` | string
`senderId` | string
`receiverId` | string
`amount` | number
`channel` | string
`txnTs` | Date
`status` | string
`narration` | string

## Example

```typescript
import type { Transaction } from 'gten-internal'

// TODO: Update the object below with actual values
const example = {
  "txnId": null,
  "senderId": null,
  "receiverId": null,
  "amount": null,
  "channel": null,
  "txnTs": null,
  "status": null,
  "narration": null,
} satisfies Transaction

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as Transaction
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


