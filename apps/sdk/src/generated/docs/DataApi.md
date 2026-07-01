# DataApi

All URIs are relative to *http://localhost*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**addAccountNoteApiV1AccountsAccountIdNotesPost**](DataApi.md#addaccountnoteapiv1accountsaccountidnotespost) | **POST** /api/v1/accounts/{account_id}/notes | Add Account Note |
| [**getAccountApiV1AccountsAccountIdGet**](DataApi.md#getaccountapiv1accountsaccountidget) | **GET** /api/v1/accounts/{account_id} | Get Account |
| [**getAccountNotesApiV1AccountsAccountIdNotesGet**](DataApi.md#getaccountnotesapiv1accountsaccountidnotesget) | **GET** /api/v1/accounts/{account_id}/notes | Get Account Notes |
| [**getAllAccountsApiV1AccountsGet**](DataApi.md#getallaccountsapiv1accountsget) | **GET** /api/v1/accounts | Get All Accounts |
| [**getAllTransactionsApiV1TransactionsGet**](DataApi.md#getalltransactionsapiv1transactionsget) | **GET** /api/v1/transactions | Get All Transactions |
| [**getTransactionApiV1TransactionsTxnIdGet**](DataApi.md#gettransactionapiv1transactionstxnidget) | **GET** /api/v1/transactions/{txn_id} | Get Transaction |



## addAccountNoteApiV1AccountsAccountIdNotesPost

> any addAccountNoteApiV1AccountsAccountIdNotesPost(accountId, noteCreate)

Add Account Note

### Example

```ts
import {
  Configuration,
  DataApi,
} from 'gten-internal';
import type { AddAccountNoteApiV1AccountsAccountIdNotesPostRequest } from 'gten-internal';

async function example() {
  console.log("🚀 Testing gten-internal SDK...");
  const api = new DataApi();

  const body = {
    // string
    accountId: accountId_example,
    // NoteCreate
    noteCreate: ...,
  } satisfies AddAccountNoteApiV1AccountsAccountIdNotesPostRequest;

  try {
    const data = await api.addAccountNoteApiV1AccountsAccountIdNotesPost(body);
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
| **accountId** | `string` |  | [Defaults to `undefined`] |
| **noteCreate** | [NoteCreate](NoteCreate.md) |  | |

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


## getAccountApiV1AccountsAccountIdGet

> any getAccountApiV1AccountsAccountIdGet(accountId)

Get Account

### Example

```ts
import {
  Configuration,
  DataApi,
} from 'gten-internal';
import type { GetAccountApiV1AccountsAccountIdGetRequest } from 'gten-internal';

async function example() {
  console.log("🚀 Testing gten-internal SDK...");
  const api = new DataApi();

  const body = {
    // string
    accountId: accountId_example,
  } satisfies GetAccountApiV1AccountsAccountIdGetRequest;

  try {
    const data = await api.getAccountApiV1AccountsAccountIdGet(body);
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
| **accountId** | `string` |  | [Defaults to `undefined`] |

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
| **422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## getAccountNotesApiV1AccountsAccountIdNotesGet

> any getAccountNotesApiV1AccountsAccountIdNotesGet(accountId)

Get Account Notes

### Example

```ts
import {
  Configuration,
  DataApi,
} from 'gten-internal';
import type { GetAccountNotesApiV1AccountsAccountIdNotesGetRequest } from 'gten-internal';

async function example() {
  console.log("🚀 Testing gten-internal SDK...");
  const api = new DataApi();

  const body = {
    // string
    accountId: accountId_example,
  } satisfies GetAccountNotesApiV1AccountsAccountIdNotesGetRequest;

  try {
    const data = await api.getAccountNotesApiV1AccountsAccountIdNotesGet(body);
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
| **accountId** | `string` |  | [Defaults to `undefined`] |

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
| **422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## getAllAccountsApiV1AccountsGet

> any getAllAccountsApiV1AccountsGet(skip, limit, branchCode)

Get All Accounts

### Example

```ts
import {
  Configuration,
  DataApi,
} from 'gten-internal';
import type { GetAllAccountsApiV1AccountsGetRequest } from 'gten-internal';

async function example() {
  console.log("🚀 Testing gten-internal SDK...");
  const api = new DataApi();

  const body = {
    // number (optional)
    skip: 56,
    // number (optional)
    limit: 56,
    // string (optional)
    branchCode: branchCode_example,
  } satisfies GetAllAccountsApiV1AccountsGetRequest;

  try {
    const data = await api.getAllAccountsApiV1AccountsGet(body);
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
| **skip** | `number` |  | [Optional] [Defaults to `0`] |
| **limit** | `number` |  | [Optional] [Defaults to `100`] |
| **branchCode** | `string` |  | [Optional] [Defaults to `undefined`] |

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
| **422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## getAllTransactionsApiV1TransactionsGet

> any getAllTransactionsApiV1TransactionsGet(skip, limit)

Get All Transactions

### Example

```ts
import {
  Configuration,
  DataApi,
} from 'gten-internal';
import type { GetAllTransactionsApiV1TransactionsGetRequest } from 'gten-internal';

async function example() {
  console.log("🚀 Testing gten-internal SDK...");
  const api = new DataApi();

  const body = {
    // number (optional)
    skip: 56,
    // number (optional)
    limit: 56,
  } satisfies GetAllTransactionsApiV1TransactionsGetRequest;

  try {
    const data = await api.getAllTransactionsApiV1TransactionsGet(body);
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
| **skip** | `number` |  | [Optional] [Defaults to `0`] |
| **limit** | `number` |  | [Optional] [Defaults to `100`] |

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
| **422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## getTransactionApiV1TransactionsTxnIdGet

> any getTransactionApiV1TransactionsTxnIdGet(txnId)

Get Transaction

### Example

```ts
import {
  Configuration,
  DataApi,
} from 'gten-internal';
import type { GetTransactionApiV1TransactionsTxnIdGetRequest } from 'gten-internal';

async function example() {
  console.log("🚀 Testing gten-internal SDK...");
  const api = new DataApi();

  const body = {
    // string
    txnId: txnId_example,
  } satisfies GetTransactionApiV1TransactionsTxnIdGetRequest;

  try {
    const data = await api.getTransactionApiV1TransactionsTxnIdGet(body);
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
| **txnId** | `string` |  | [Defaults to `undefined`] |

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
| **422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

