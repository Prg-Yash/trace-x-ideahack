# BranchesApi

All URIs are relative to *http://localhost*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**createBranchApiV1BranchesPost**](BranchesApi.md#createbranchapiv1branchespost) | **POST** /api/v1/branches | Create Branch |
| [**deleteBranchApiV1BranchesBranchIdDelete**](BranchesApi.md#deletebranchapiv1branchesbranchiddelete) | **DELETE** /api/v1/branches/{branch_id} | Delete Branch |
| [**getBranchesApiV1BranchesGet**](BranchesApi.md#getbranchesapiv1branchesget) | **GET** /api/v1/branches | Get Branches |
| [**updateBranchApiV1BranchesBranchIdPatch**](BranchesApi.md#updatebranchapiv1branchesbranchidpatch) | **PATCH** /api/v1/branches/{branch_id} | Update Branch |



## createBranchApiV1BranchesPost

> any createBranchApiV1BranchesPost(branchCreate)

Create Branch

### Example

```ts
import {
  Configuration,
  BranchesApi,
} from 'gten-internal';
import type { CreateBranchApiV1BranchesPostRequest } from 'gten-internal';

async function example() {
  console.log("🚀 Testing gten-internal SDK...");
  const config = new Configuration({ 
    // To configure OAuth2 access token for authorization: OAuth2PasswordBearer password
    accessToken: "YOUR ACCESS TOKEN",
  });
  const api = new BranchesApi(config);

  const body = {
    // BranchCreate
    branchCreate: ...,
  } satisfies CreateBranchApiV1BranchesPostRequest;

  try {
    const data = await api.createBranchApiV1BranchesPost(body);
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
| **branchCreate** | [BranchCreate](BranchCreate.md) |  | |

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


## deleteBranchApiV1BranchesBranchIdDelete

> any deleteBranchApiV1BranchesBranchIdDelete(branchId)

Delete Branch

### Example

```ts
import {
  Configuration,
  BranchesApi,
} from 'gten-internal';
import type { DeleteBranchApiV1BranchesBranchIdDeleteRequest } from 'gten-internal';

async function example() {
  console.log("🚀 Testing gten-internal SDK...");
  const config = new Configuration({ 
    // To configure OAuth2 access token for authorization: OAuth2PasswordBearer password
    accessToken: "YOUR ACCESS TOKEN",
  });
  const api = new BranchesApi(config);

  const body = {
    // number
    branchId: 56,
  } satisfies DeleteBranchApiV1BranchesBranchIdDeleteRequest;

  try {
    const data = await api.deleteBranchApiV1BranchesBranchIdDelete(body);
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
| **branchId** | `number` |  | [Defaults to `undefined`] |

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


## getBranchesApiV1BranchesGet

> any getBranchesApiV1BranchesGet()

Get Branches

### Example

```ts
import {
  Configuration,
  BranchesApi,
} from 'gten-internal';
import type { GetBranchesApiV1BranchesGetRequest } from 'gten-internal';

async function example() {
  console.log("🚀 Testing gten-internal SDK...");
  const config = new Configuration({ 
    // To configure OAuth2 access token for authorization: OAuth2PasswordBearer password
    accessToken: "YOUR ACCESS TOKEN",
  });
  const api = new BranchesApi(config);

  try {
    const data = await api.getBranchesApiV1BranchesGet();
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

[OAuth2PasswordBearer password](../README.md#OAuth2PasswordBearer-password)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful Response |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## updateBranchApiV1BranchesBranchIdPatch

> any updateBranchApiV1BranchesBranchIdPatch(branchId, branchUpdate)

Update Branch

### Example

```ts
import {
  Configuration,
  BranchesApi,
} from 'gten-internal';
import type { UpdateBranchApiV1BranchesBranchIdPatchRequest } from 'gten-internal';

async function example() {
  console.log("🚀 Testing gten-internal SDK...");
  const config = new Configuration({ 
    // To configure OAuth2 access token for authorization: OAuth2PasswordBearer password
    accessToken: "YOUR ACCESS TOKEN",
  });
  const api = new BranchesApi(config);

  const body = {
    // number
    branchId: 56,
    // BranchUpdate
    branchUpdate: ...,
  } satisfies UpdateBranchApiV1BranchesBranchIdPatchRequest;

  try {
    const data = await api.updateBranchApiV1BranchesBranchIdPatch(body);
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
| **branchId** | `number` |  | [Defaults to `undefined`] |
| **branchUpdate** | [BranchUpdate](BranchUpdate.md) |  | |

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

