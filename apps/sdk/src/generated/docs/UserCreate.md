
# UserCreate


## Properties

Name | Type
------------ | -------------
`username` | string
`password` | string
`fullName` | string
`branchId` | number
`role` | string

## Example

```typescript
import type { UserCreate } from 'gten-internal'

// TODO: Update the object below with actual values
const example = {
  "username": null,
  "password": null,
  "fullName": null,
  "branchId": null,
  "role": null,
} satisfies UserCreate

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as UserCreate
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


