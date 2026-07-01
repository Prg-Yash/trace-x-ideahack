
# UserOut


## Properties

Name | Type
------------ | -------------
`id` | string
`username` | string
`fullName` | string
`role` | string
`branchId` | number
`branchCode` | string

## Example

```typescript
import type { UserOut } from 'gten-internal'

// TODO: Update the object below with actual values
const example = {
  "id": null,
  "username": null,
  "fullName": null,
  "role": null,
  "branchId": null,
  "branchCode": null,
} satisfies UserOut

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as UserOut
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


