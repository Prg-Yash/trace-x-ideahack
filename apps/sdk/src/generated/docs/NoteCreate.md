
# NoteCreate


## Properties

Name | Type
------------ | -------------
`author` | string
`content` | string

## Example

```typescript
import type { NoteCreate } from 'gten-internal'

// TODO: Update the object below with actual values
const example = {
  "author": null,
  "content": null,
} satisfies NoteCreate

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as NoteCreate
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


