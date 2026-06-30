# WorkflowApi

All URIs are relative to *http://localhost*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**approveStrApiV1AlertsAlertIdApproveStrPost**](WorkflowApi.md#approvestrapiv1alertsalertidapprovestrpost) | **POST** /api/v1/alerts/{alert_id}/approve-str | Approve Str |
| [**assignAlertApiV1AlertsAlertIdAssignPost**](WorkflowApi.md#assignalertapiv1alertsalertidassignpost) | **POST** /api/v1/alerts/{alert_id}/assign | Assign Alert |
| [**draftStrApiV1AlertsAlertIdDraftStrPost**](WorkflowApi.md#draftstrapiv1alertsalertiddraftstrpost) | **POST** /api/v1/alerts/{alert_id}/draft-str | Draft Str |
| [**getAuditTrailApiV1AlertsAlertIdAuditGet**](WorkflowApi.md#getaudittrailapiv1alertsalertidauditget) | **GET** /api/v1/alerts/{alert_id}/audit | Get Audit Trail |
| [**rejectStrApiV1AlertsAlertIdRejectStrPost**](WorkflowApi.md#rejectstrapiv1alertsalertidrejectstrpost) | **POST** /api/v1/alerts/{alert_id}/reject-str | Reject Str |



## approveStrApiV1AlertsAlertIdApproveStrPost

> any approveStrApiV1AlertsAlertIdApproveStrPost(alertId)

Approve Str

### Example

```ts
import {
  Configuration,
  WorkflowApi,
} from 'gten-internal';
import type { ApproveStrApiV1AlertsAlertIdApproveStrPostRequest } from 'gten-internal';

async function example() {
  console.log("🚀 Testing gten-internal SDK...");
  const config = new Configuration({ 
    // To configure OAuth2 access token for authorization: OAuth2PasswordBearer password
    accessToken: "YOUR ACCESS TOKEN",
  });
  const api = new WorkflowApi(config);

  const body = {
    // string
    alertId: alertId_example,
  } satisfies ApproveStrApiV1AlertsAlertIdApproveStrPostRequest;

  try {
    const data = await api.approveStrApiV1AlertsAlertIdApproveStrPost(body);
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
| **alertId** | `string` |  | [Defaults to `undefined`] |

### Return type

**any**

### Authorization

[OAuth2PasswordBearer password](../README.md#OAuth2PasswordBearer-password)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful Response |  -  |
| **422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## assignAlertApiV1AlertsAlertIdAssignPost

> any assignAlertApiV1AlertsAlertIdAssignPost(alertId, assignRequest)

Assign Alert

### Example

```ts
import {
  Configuration,
  WorkflowApi,
} from 'gten-internal';
import type { AssignAlertApiV1AlertsAlertIdAssignPostRequest } from 'gten-internal';

async function example() {
  console.log("🚀 Testing gten-internal SDK...");
  const config = new Configuration({ 
    // To configure OAuth2 access token for authorization: OAuth2PasswordBearer password
    accessToken: "YOUR ACCESS TOKEN",
  });
  const api = new WorkflowApi(config);

  const body = {
    // string
    alertId: alertId_example,
    // AssignRequest (optional)
    assignRequest: ...,
  } satisfies AssignAlertApiV1AlertsAlertIdAssignPostRequest;

  try {
    const data = await api.assignAlertApiV1AlertsAlertIdAssignPost(body);
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
| **alertId** | `string` |  | [Defaults to `undefined`] |
| **assignRequest** | [AssignRequest](AssignRequest.md) |  | [Optional] |

### Return type

**any**

### Authorization

[OAuth2PasswordBearer password](../README.md#OAuth2PasswordBearer-password)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful Response |  -  |
| **422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## draftStrApiV1AlertsAlertIdDraftStrPost

> any draftStrApiV1AlertsAlertIdDraftStrPost(alertId)

Draft Str

### Example

```ts
import {
  Configuration,
  WorkflowApi,
} from 'gten-internal';
import type { DraftStrApiV1AlertsAlertIdDraftStrPostRequest } from 'gten-internal';

async function example() {
  console.log("🚀 Testing gten-internal SDK...");
  const config = new Configuration({ 
    // To configure OAuth2 access token for authorization: OAuth2PasswordBearer password
    accessToken: "YOUR ACCESS TOKEN",
  });
  const api = new WorkflowApi(config);

  const body = {
    // string
    alertId: alertId_example,
  } satisfies DraftStrApiV1AlertsAlertIdDraftStrPostRequest;

  try {
    const data = await api.draftStrApiV1AlertsAlertIdDraftStrPost(body);
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
| **alertId** | `string` |  | [Defaults to `undefined`] |

### Return type

**any**

### Authorization

[OAuth2PasswordBearer password](../README.md#OAuth2PasswordBearer-password)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful Response |  -  |
| **422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## getAuditTrailApiV1AlertsAlertIdAuditGet

> any getAuditTrailApiV1AlertsAlertIdAuditGet(alertId)

Get Audit Trail

### Example

```ts
import {
  Configuration,
  WorkflowApi,
} from 'gten-internal';
import type { GetAuditTrailApiV1AlertsAlertIdAuditGetRequest } from 'gten-internal';

async function example() {
  console.log("🚀 Testing gten-internal SDK...");
  const config = new Configuration({ 
    // To configure OAuth2 access token for authorization: OAuth2PasswordBearer password
    accessToken: "YOUR ACCESS TOKEN",
  });
  const api = new WorkflowApi(config);

  const body = {
    // string
    alertId: alertId_example,
  } satisfies GetAuditTrailApiV1AlertsAlertIdAuditGetRequest;

  try {
    const data = await api.getAuditTrailApiV1AlertsAlertIdAuditGet(body);
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
| **alertId** | `string` |  | [Defaults to `undefined`] |

### Return type

**any**

### Authorization

[OAuth2PasswordBearer password](../README.md#OAuth2PasswordBearer-password)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful Response |  -  |
| **422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## rejectStrApiV1AlertsAlertIdRejectStrPost

> any rejectStrApiV1AlertsAlertIdRejectStrPost(alertId)

Reject Str

### Example

```ts
import {
  Configuration,
  WorkflowApi,
} from 'gten-internal';
import type { RejectStrApiV1AlertsAlertIdRejectStrPostRequest } from 'gten-internal';

async function example() {
  console.log("🚀 Testing gten-internal SDK...");
  const config = new Configuration({ 
    // To configure OAuth2 access token for authorization: OAuth2PasswordBearer password
    accessToken: "YOUR ACCESS TOKEN",
  });
  const api = new WorkflowApi(config);

  const body = {
    // string
    alertId: alertId_example,
  } satisfies RejectStrApiV1AlertsAlertIdRejectStrPostRequest;

  try {
    const data = await api.rejectStrApiV1AlertsAlertIdRejectStrPost(body);
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
| **alertId** | `string` |  | [Defaults to `undefined`] |

### Return type

**any**

### Authorization

[OAuth2PasswordBearer password](../README.md#OAuth2PasswordBearer-password)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful Response |  -  |
| **422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

