# DemoApi

All URIs are relative to *http://localhost*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**cleanupDemoApiV1DemoCleanupDelete**](DemoApi.md#cleanupdemoapiv1democleanupdelete) | **DELETE** /api/v1/demo/cleanup | Cleanup Demo |
| [**injectDemoApiV1DemoInjectPost**](DemoApi.md#injectdemoapiv1demoinjectpost) | **POST** /api/v1/demo/inject | Inject Demo |



## cleanupDemoApiV1DemoCleanupDelete

> any cleanupDemoApiV1DemoCleanupDelete()

Cleanup Demo

### Example

```ts
import {
  Configuration,
  DemoApi,
} from 'gten-internal';
import type { CleanupDemoApiV1DemoCleanupDeleteRequest } from 'gten-internal';

async function example() {
  console.log("🚀 Testing gten-internal SDK...");
  const api = new DemoApi();

  try {
    const data = await api.cleanupDemoApiV1DemoCleanupDelete();
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


## injectDemoApiV1DemoInjectPost

> any injectDemoApiV1DemoInjectPost(requestBody)

Inject Demo

### Example

```ts
import {
  Configuration,
  DemoApi,
} from 'gten-internal';
import type { InjectDemoApiV1DemoInjectPostRequest } from 'gten-internal';

async function example() {
  console.log("🚀 Testing gten-internal SDK...");
  const api = new DemoApi();

  const body = {
    // { [key: string]: any; }
    requestBody: Object,
  } satisfies InjectDemoApiV1DemoInjectPostRequest;

  try {
    const data = await api.injectDemoApiV1DemoInjectPost(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **requestBody** | `{ [key: string]: any; }` |  | |

### Return type

**any**

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful Response |  -  |
| **422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

