# HealthApi

All URIs are relative to *http://localhost*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**healthCheckApiV1HealthGet**](HealthApi.md#healthcheckapiv1healthget) | **GET** /api/v1/health | Health Check |



## healthCheckApiV1HealthGet

> any healthCheckApiV1HealthGet()

Health Check

Health check endpoint to ensure the API is running.

### Example

```ts
import {
  Configuration,
  HealthApi,
} from 'gten-internal';
import type { HealthCheckApiV1HealthGetRequest } from 'gten-internal';

async function example() {
  console.log("🚀 Testing gten-internal SDK...");
  const api = new HealthApi();

  try {
    const data = await api.healthCheckApiV1HealthGet();
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

