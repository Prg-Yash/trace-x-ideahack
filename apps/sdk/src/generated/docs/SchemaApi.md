# SchemaApi

All URIs are relative to *http://localhost*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**setupSchemaApiV1SchemaSetupPost**](SchemaApi.md#setupschemaapiv1schemasetuppost) | **POST** /api/v1/schema/setup | Setup Schema |



## setupSchemaApiV1SchemaSetupPost

> any setupSchemaApiV1SchemaSetupPost()

Setup Schema

Set up Neo4j schema with constraints and indexes. This endpoint should be called once during initial setup.

### Example

```ts
import {
  Configuration,
  SchemaApi,
} from 'gten-internal';
import type { SetupSchemaApiV1SchemaSetupPostRequest } from 'gten-internal';

async function example() {
  console.log("🚀 Testing gten-internal SDK...");
  const api = new SchemaApi();

  try {
    const data = await api.setupSchemaApiV1SchemaSetupPost();
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

This endpoint does not need any parameter.

### Return type

**any**

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful Response |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

