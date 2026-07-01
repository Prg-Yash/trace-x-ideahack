# AuthApi

All URIs are relative to *http://localhost*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**createUserApiV1AuthUsersPost**](AuthApi.md#createuserapiv1authuserspost) | **POST** /api/v1/auth/users | Create User |
| [**deleteUserApiV1AuthUsersUserIdDelete**](AuthApi.md#deleteuserapiv1authusersuseriddelete) | **DELETE** /api/v1/auth/users/{user_id} | Delete User |
| [**generate2faApiV1Auth2faGeneratePost**](AuthApi.md#generate2faapiv1auth2fageneratepost) | **POST** /api/v1/auth/2fa/generate | Generate 2Fa |
| [**getInvestigatorsApiV1AuthUsersInvestigatorsGet**](AuthApi.md#getinvestigatorsapiv1authusersinvestigatorsget) | **GET** /api/v1/auth/users/investigators | Get Investigators |
| [**loginForAccessTokenApiV1AuthLoginPost**](AuthApi.md#loginforaccesstokenapiv1authloginpost) | **POST** /api/v1/auth/login | Login For Access Token |
| [**readUsersMeApiV1AuthMeGet**](AuthApi.md#readusersmeapiv1authmeget) | **GET** /api/v1/auth/me | Read Users Me |
| [**updateUserPasswordApiV1AuthUsersUserIdPasswordPatch**](AuthApi.md#updateuserpasswordapiv1authusersuseridpasswordpatch) | **PATCH** /api/v1/auth/users/{user_id}/password | Update User Password |
| [**verify2faApiV1Auth2faVerifyPost**](AuthApi.md#verify2faapiv1auth2faverifypost) | **POST** /api/v1/auth/2fa/verify | Verify 2Fa |



## createUserApiV1AuthUsersPost

> any createUserApiV1AuthUsersPost(userCreate)

Create User

### Example

```ts
import {
  Configuration,
  AuthApi,
} from 'gten-internal';
import type { CreateUserApiV1AuthUsersPostRequest } from 'gten-internal';

async function example() {
  console.log("🚀 Testing gten-internal SDK...");
  const config = new Configuration({ 
    // To configure OAuth2 access token for authorization: OAuth2PasswordBearer password
    accessToken: "YOUR ACCESS TOKEN",
  });
  const api = new AuthApi(config);

  const body = {
    // UserCreate
    userCreate: ...,
  } satisfies CreateUserApiV1AuthUsersPostRequest;

  try {
    const data = await api.createUserApiV1AuthUsersPost(body);
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
| **userCreate** | [UserCreate](UserCreate.md) |  | |

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


## deleteUserApiV1AuthUsersUserIdDelete

> any deleteUserApiV1AuthUsersUserIdDelete(userId)

Delete User

### Example

```ts
import {
  Configuration,
  AuthApi,
} from 'gten-internal';
import type { DeleteUserApiV1AuthUsersUserIdDeleteRequest } from 'gten-internal';

async function example() {
  console.log("🚀 Testing gten-internal SDK...");
  const config = new Configuration({ 
    // To configure OAuth2 access token for authorization: OAuth2PasswordBearer password
    accessToken: "YOUR ACCESS TOKEN",
  });
  const api = new AuthApi(config);

  const body = {
    // string
    userId: userId_example,
  } satisfies DeleteUserApiV1AuthUsersUserIdDeleteRequest;

  try {
    const data = await api.deleteUserApiV1AuthUsersUserIdDelete(body);
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
| **userId** | `string` |  | [Defaults to `undefined`] |

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


## generate2faApiV1Auth2faGeneratePost

> any generate2faApiV1Auth2faGeneratePost()

Generate 2Fa

### Example

```ts
import {
  Configuration,
  AuthApi,
} from 'gten-internal';
import type { Generate2faApiV1Auth2faGeneratePostRequest } from 'gten-internal';

async function example() {
  console.log("🚀 Testing gten-internal SDK...");
  const config = new Configuration({ 
    // To configure OAuth2 access token for authorization: OAuth2PasswordBearer password
    accessToken: "YOUR ACCESS TOKEN",
  });
  const api = new AuthApi(config);

  try {
    const data = await api.generate2faApiV1Auth2faGeneratePost();
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


## getInvestigatorsApiV1AuthUsersInvestigatorsGet

> any getInvestigatorsApiV1AuthUsersInvestigatorsGet()

Get Investigators

### Example

```ts
import {
  Configuration,
  AuthApi,
} from 'gten-internal';
import type { GetInvestigatorsApiV1AuthUsersInvestigatorsGetRequest } from 'gten-internal';

async function example() {
  console.log("🚀 Testing gten-internal SDK...");
  const config = new Configuration({ 
    // To configure OAuth2 access token for authorization: OAuth2PasswordBearer password
    accessToken: "YOUR ACCESS TOKEN",
  });
  const api = new AuthApi(config);

  try {
    const data = await api.getInvestigatorsApiV1AuthUsersInvestigatorsGet();
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


## loginForAccessTokenApiV1AuthLoginPost

> Token loginForAccessTokenApiV1AuthLoginPost(username, password, totpCode, grantType, scope, clientId, clientSecret)

Login For Access Token

### Example

```ts
import {
  Configuration,
  AuthApi,
} from 'gten-internal';
import type { LoginForAccessTokenApiV1AuthLoginPostRequest } from 'gten-internal';

async function example() {
  console.log("🚀 Testing gten-internal SDK...");
  const api = new AuthApi();

  const body = {
    // string
    username: username_example,
    // string
    password: password_example,
    // string (optional)
    totpCode: totpCode_example,
    // string (optional)
    grantType: grantType_example,
    // string (optional)
    scope: scope_example,
    // string (optional)
    clientId: clientId_example,
    // string (optional)
    clientSecret: clientSecret_example,
  } satisfies LoginForAccessTokenApiV1AuthLoginPostRequest;

  try {
    const data = await api.loginForAccessTokenApiV1AuthLoginPost(body);
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
| **username** | `string` |  | [Defaults to `undefined`] |
| **password** | `string` |  | [Defaults to `undefined`] |
| **totpCode** | `string` |  | [Optional] [Defaults to `undefined`] |
| **grantType** | `string` |  | [Optional] [Defaults to `undefined`] |
| **scope** | `string` |  | [Optional] [Defaults to `&#39;&#39;`] |
| **clientId** | `string` |  | [Optional] [Defaults to `undefined`] |
| **clientSecret** | `string` |  | [Optional] [Defaults to `undefined`] |

### Return type

[**Token**](Token.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: `application/x-www-form-urlencoded`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful Response |  -  |
| **422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## readUsersMeApiV1AuthMeGet

> UserOut readUsersMeApiV1AuthMeGet()

Read Users Me

### Example

```ts
import {
  Configuration,
  AuthApi,
} from 'gten-internal';
import type { ReadUsersMeApiV1AuthMeGetRequest } from 'gten-internal';

async function example() {
  console.log("🚀 Testing gten-internal SDK...");
  const config = new Configuration({ 
    // To configure OAuth2 access token for authorization: OAuth2PasswordBearer password
    accessToken: "YOUR ACCESS TOKEN",
  });
  const api = new AuthApi(config);

  try {
    const data = await api.readUsersMeApiV1AuthMeGet();
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

[**UserOut**](UserOut.md)

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


## updateUserPasswordApiV1AuthUsersUserIdPasswordPatch

> any updateUserPasswordApiV1AuthUsersUserIdPasswordPatch(userId, passwordUpdate)

Update User Password

### Example

```ts
import {
  Configuration,
  AuthApi,
} from 'gten-internal';
import type { UpdateUserPasswordApiV1AuthUsersUserIdPasswordPatchRequest } from 'gten-internal';

async function example() {
  console.log("🚀 Testing gten-internal SDK...");
  const config = new Configuration({ 
    // To configure OAuth2 access token for authorization: OAuth2PasswordBearer password
    accessToken: "YOUR ACCESS TOKEN",
  });
  const api = new AuthApi(config);

  const body = {
    // string
    userId: userId_example,
    // PasswordUpdate
    passwordUpdate: ...,
  } satisfies UpdateUserPasswordApiV1AuthUsersUserIdPasswordPatchRequest;

  try {
    const data = await api.updateUserPasswordApiV1AuthUsersUserIdPasswordPatch(body);
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
| **userId** | `string` |  | [Defaults to `undefined`] |
| **passwordUpdate** | [PasswordUpdate](PasswordUpdate.md) |  | |

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


## verify2faApiV1Auth2faVerifyPost

> any verify2faApiV1Auth2faVerifyPost(totpCode)

Verify 2Fa

### Example

```ts
import {
  Configuration,
  AuthApi,
} from 'gten-internal';
import type { Verify2faApiV1Auth2faVerifyPostRequest } from 'gten-internal';

async function example() {
  console.log("🚀 Testing gten-internal SDK...");
  const config = new Configuration({ 
    // To configure OAuth2 access token for authorization: OAuth2PasswordBearer password
    accessToken: "YOUR ACCESS TOKEN",
  });
  const api = new AuthApi(config);

  const body = {
    // string
    totpCode: totpCode_example,
  } satisfies Verify2faApiV1Auth2faVerifyPostRequest;

  try {
    const data = await api.verify2faApiV1Auth2faVerifyPost(body);
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
| **totpCode** | `string` |  | [Defaults to `undefined`] |

### Return type

**any**

### Authorization

[OAuth2PasswordBearer password](../README.md#OAuth2PasswordBearer-password)

### HTTP request headers

- **Content-Type**: `application/x-www-form-urlencoded`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful Response |  -  |
| **422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

