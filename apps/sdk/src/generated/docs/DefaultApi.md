# DefaultApi

All URIs are relative to *http://localhost*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**configStreamApiV1StreamConfigPost**](DefaultApi.md#configstreamapiv1streamconfigpost) | **POST** /api/v1/stream/config | Config Stream |
| [**injectFraudApiV1StreamInjectPost**](DefaultApi.md#injectfraudapiv1streaminjectpost) | **POST** /api/v1/stream/inject | Inject Fraud |
| [**readRootGet**](DefaultApi.md#readrootget) | **GET** / | Read Root |
| [**resetDemoDataApiV1StreamResetDelete**](DefaultApi.md#resetdemodataapiv1streamresetdelete) | **DELETE** /api/v1/stream/reset | Reset Demo Data |
| [**startStreamApiV1StreamStartPost**](DefaultApi.md#startstreamapiv1streamstartpost) | **POST** /api/v1/stream/start | Start Stream |
| [**stopStreamApiV1StreamStopPost**](DefaultApi.md#stopstreamapiv1streamstoppost) | **POST** /api/v1/stream/stop | Stop Stream |
| [**streamStatusApiV1StreamStatusGet**](DefaultApi.md#streamstatusapiv1streamstatusget) | **GET** /api/v1/stream/status | Stream Status |



## configStreamApiV1StreamConfigPost

> any configStreamApiV1StreamConfigPost(streamConfigRequest)

Config Stream

### Example

```ts
import {
  Configuration,
  DefaultApi,
} from 'gten-internal';
import type { ConfigStreamApiV1StreamConfigPostRequest } from 'gten-internal';

async function example() {
  console.log("🚀 Testing gten-internal SDK...");
  const api = new DefaultApi();

  const body = {
    // StreamConfigRequest
    streamConfigRequest: ...,
  } satisfies ConfigStreamApiV1StreamConfigPostRequest;

  try {
    const data = await api.configStreamApiV1StreamConfigPost(body);
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
| **streamConfigRequest** | [StreamConfigRequest](StreamConfigRequest.md) |  | |

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


## injectFraudApiV1StreamInjectPost

> any injectFraudApiV1StreamInjectPost(injectPatternRequest)

Inject Fraud

### Example

```ts
import {
  Configuration,
  DefaultApi,
} from 'gten-internal';
import type { InjectFraudApiV1StreamInjectPostRequest } from 'gten-internal';

async function example() {
  console.log("🚀 Testing gten-internal SDK...");
  const api = new DefaultApi();

  const body = {
    // InjectPatternRequest
    injectPatternRequest: ...,
  } satisfies InjectFraudApiV1StreamInjectPostRequest;

  try {
    const data = await api.injectFraudApiV1StreamInjectPost(body);
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
| **injectPatternRequest** | [InjectPatternRequest](InjectPatternRequest.md) |  | |

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


## readRootGet

> any readRootGet()

Read Root

### Example

```ts
import {
  Configuration,
  DefaultApi,
} from 'gten-internal';
import type { ReadRootGetRequest } from 'gten-internal';

async function example() {
  console.log("🚀 Testing gten-internal SDK...");
  const api = new DefaultApi();

  try {
    const data = await api.readRootGet();
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


## resetDemoDataApiV1StreamResetDelete

> any resetDemoDataApiV1StreamResetDelete()

Reset Demo Data

### Example

```ts
import {
  Configuration,
  DefaultApi,
} from 'gten-internal';
import type { ResetDemoDataApiV1StreamResetDeleteRequest } from 'gten-internal';

async function example() {
  console.log("🚀 Testing gten-internal SDK...");
  const api = new DefaultApi();

  try {
    const data = await api.resetDemoDataApiV1StreamResetDelete();
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


## startStreamApiV1StreamStartPost

> any startStreamApiV1StreamStartPost()

Start Stream

### Example

```ts
import {
  Configuration,
  DefaultApi,
} from 'gten-internal';
import type { StartStreamApiV1StreamStartPostRequest } from 'gten-internal';

async function example() {
  console.log("🚀 Testing gten-internal SDK...");
  const api = new DefaultApi();

  try {
    const data = await api.startStreamApiV1StreamStartPost();
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


## stopStreamApiV1StreamStopPost

> any stopStreamApiV1StreamStopPost()

Stop Stream

### Example

```ts
import {
  Configuration,
  DefaultApi,
} from 'gten-internal';
import type { StopStreamApiV1StreamStopPostRequest } from 'gten-internal';

async function example() {
  console.log("🚀 Testing gten-internal SDK...");
  const api = new DefaultApi();

  try {
    const data = await api.stopStreamApiV1StreamStopPost();
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


## streamStatusApiV1StreamStatusGet

> any streamStatusApiV1StreamStatusGet()

Stream Status

### Example

```ts
import {
  Configuration,
  DefaultApi,
} from 'gten-internal';
import type { StreamStatusApiV1StreamStatusGetRequest } from 'gten-internal';

async function example() {
  console.log("🚀 Testing gten-internal SDK...");
  const api = new DefaultApi();

  try {
    const data = await api.streamStatusApiV1StreamStatusGet();
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

