# FraudApi

All URIs are relative to *http://localhost*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**createAccountApiV1AccountsPost**](FraudApi.md#createaccountapiv1accountspost) | **POST** /api/v1/accounts | Create Account |
| [**createTransactionApiV1TransactionsPost**](FraudApi.md#createtransactionapiv1transactionspost) | **POST** /api/v1/transactions | Create Transaction |
| [**getAlertDetailsApiV1AlertsAlertIdGet**](FraudApi.md#getalertdetailsapiv1alertsalertidget) | **GET** /api/v1/alerts/{alert_id} | Get Alert Details |
| [**getAlertsQuickApiV1AlertsQuickGet**](FraudApi.md#getalertsquickapiv1alertsquickget) | **GET** /api/v1/alerts/quick | Get Alerts Quick |
| [**getBranchChannelAnalyticsApiV1AnalyticsBranchChannelGet**](FraudApi.md#getbranchchannelanalyticsapiv1analyticsbranchchannelget) | **GET** /api/v1/analytics/branch-channel | Get Branch Channel Analytics |
| [**getDormantExplanationApiV1ExplainAccountIdDormantGet**](FraudApi.md#getdormantexplanationapiv1explainaccountiddormantget) | **GET** /api/v1/explain/{account_id}/dormant | Get Dormant Explanation |
| [**getDormantExplanationApiV1ExplainDormantAccountIdGet**](FraudApi.md#getdormantexplanationapiv1explaindormantaccountidget) | **GET** /api/v1/explain/dormant/{account_id} | Get Dormant Explanation |
| [**getFullExplanationApiV1ExplainAccountIdGet**](FraudApi.md#getfullexplanationapiv1explainaccountidget) | **GET** /api/v1/explain/{account_id} | Get Full Explanation |
| [**getKycExplanationApiV1ExplainAccountIdKycGet**](FraudApi.md#getkycexplanationapiv1explainaccountidkycget) | **GET** /api/v1/explain/{account_id}/kyc | Get Kyc Explanation |
| [**getKycMismatchExplanationApiV1ExplainKycMismatchAccountIdGet**](FraudApi.md#getkycmismatchexplanationapiv1explainkycmismatchaccountidget) | **GET** /api/v1/explain/kyc_mismatch/{account_id} | Get Kyc Mismatch Explanation |
| [**getLiveFeedApiV1FeedGet**](FraudApi.md#getlivefeedapiv1feedget) | **GET** /api/v1/feed | Get Live Feed |
| [**getNarrativeApiV1NarrativeAccountIdPost**](FraudApi.md#getnarrativeapiv1narrativeaccountidpost) | **POST** /api/v1/narrative/{account_id} | Get Narrative |
| [**getReportApiV1ReportAccountIdGet**](FraudApi.md#getreportapiv1reportaccountidget) | **GET** /api/v1/report/{account_id} | Get Report |
| [**getScoreApiV1ScoreAccountIdGet**](FraudApi.md#getscoreapiv1scoreaccountidget) | **GET** /api/v1/score/{account_id} | Get Score |
| [**getSmurfingExplanationApiV1ExplainAccountIdSmurfingGet**](FraudApi.md#getsmurfingexplanationapiv1explainaccountidsmurfingget) | **GET** /api/v1/explain/{account_id}/smurfing | Get Smurfing Explanation |
| [**getSmurfingExplanationApiV1ExplainSmurfingAccountIdGet**](FraudApi.md#getsmurfingexplanationapiv1explainsmurfingaccountidget) | **GET** /api/v1/explain/smurfing/{account_id} | Get Smurfing Explanation |
| [**getStatsApiV1StatsGet**](FraudApi.md#getstatsapiv1statsget) | **GET** /api/v1/stats | Get Stats |
| [**getTraceApiV1TraceAccountIdGet**](FraudApi.md#gettraceapiv1traceaccountidget) | **GET** /api/v1/trace/{account_id} | Get Trace |
| [**updateAlertStatusApiV1AlertsAlertIdStatusPatch**](FraudApi.md#updatealertstatusapiv1alertsalertidstatuspatch) | **PATCH** /api/v1/alerts/{alert_id}/status | Update Alert Status |



## createAccountApiV1AccountsPost

> any createAccountApiV1AccountsPost(account)

Create Account

### Example

```ts
import {
  Configuration,
  FraudApi,
} from 'gten-internal';
import type { CreateAccountApiV1AccountsPostRequest } from 'gten-internal';

async function example() {
  console.log("🚀 Testing gten-internal SDK...");
  const api = new FraudApi();

  const body = {
    // Account
    account: ...,
  } satisfies CreateAccountApiV1AccountsPostRequest;

  try {
    const data = await api.createAccountApiV1AccountsPost(body);
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
| **account** | [Account](Account.md) |  | |

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


## createTransactionApiV1TransactionsPost

> any createTransactionApiV1TransactionsPost(transaction)

Create Transaction

### Example

```ts
import {
  Configuration,
  FraudApi,
} from 'gten-internal';
import type { CreateTransactionApiV1TransactionsPostRequest } from 'gten-internal';

async function example() {
  console.log("🚀 Testing gten-internal SDK...");
  const api = new FraudApi();

  const body = {
    // Transaction
    transaction: ...,
  } satisfies CreateTransactionApiV1TransactionsPostRequest;

  try {
    const data = await api.createTransactionApiV1TransactionsPost(body);
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
| **transaction** | [Transaction](Transaction.md) |  | |

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


## getAlertDetailsApiV1AlertsAlertIdGet

> any getAlertDetailsApiV1AlertsAlertIdGet(alertId)

Get Alert Details

### Example

```ts
import {
  Configuration,
  FraudApi,
} from 'gten-internal';
import type { GetAlertDetailsApiV1AlertsAlertIdGetRequest } from 'gten-internal';

async function example() {
  console.log("🚀 Testing gten-internal SDK...");
  const api = new FraudApi();

  const body = {
    // string
    alertId: alertId_example,
  } satisfies GetAlertDetailsApiV1AlertsAlertIdGetRequest;

  try {
    const data = await api.getAlertDetailsApiV1AlertsAlertIdGet(body);
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


## getAlertsQuickApiV1AlertsQuickGet

> any getAlertsQuickApiV1AlertsQuickGet(limit, branchCode)

Get Alerts Quick

Read pre-generated Alert nodes from Neo4j. Instant — no ML inference.

### Example

```ts
import {
  Configuration,
  FraudApi,
} from 'gten-internal';
import type { GetAlertsQuickApiV1AlertsQuickGetRequest } from 'gten-internal';

async function example() {
  console.log("🚀 Testing gten-internal SDK...");
  const config = new Configuration({ 
    // To configure OAuth2 access token for authorization: OAuth2PasswordBearer password
    accessToken: "YOUR ACCESS TOKEN",
  });
  const api = new FraudApi(config);

  const body = {
    // number (optional)
    limit: 56,
    // string (optional)
    branchCode: branchCode_example,
  } satisfies GetAlertsQuickApiV1AlertsQuickGetRequest;

  try {
    const data = await api.getAlertsQuickApiV1AlertsQuickGet(body);
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
| **limit** | `number` |  | [Optional] [Defaults to `200`] |
| **branchCode** | `string` |  | [Optional] [Defaults to `undefined`] |

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


## getBranchChannelAnalyticsApiV1AnalyticsBranchChannelGet

> any getBranchChannelAnalyticsApiV1AnalyticsBranchChannelGet()

Get Branch Channel Analytics

Aggregate branch risk and channel abuse metrics from PostgreSQL.

### Example

```ts
import {
  Configuration,
  FraudApi,
} from 'gten-internal';
import type { GetBranchChannelAnalyticsApiV1AnalyticsBranchChannelGetRequest } from 'gten-internal';

async function example() {
  console.log("🚀 Testing gten-internal SDK...");
  const api = new FraudApi();

  try {
    const data = await api.getBranchChannelAnalyticsApiV1AnalyticsBranchChannelGet();
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


## getDormantExplanationApiV1ExplainAccountIdDormantGet

> any getDormantExplanationApiV1ExplainAccountIdDormantGet(accountId)

Get Dormant Explanation

### Example

```ts
import {
  Configuration,
  FraudApi,
} from 'gten-internal';
import type { GetDormantExplanationApiV1ExplainAccountIdDormantGetRequest } from 'gten-internal';

async function example() {
  console.log("🚀 Testing gten-internal SDK...");
  const api = new FraudApi();

  const body = {
    // string
    accountId: accountId_example,
  } satisfies GetDormantExplanationApiV1ExplainAccountIdDormantGetRequest;

  try {
    const data = await api.getDormantExplanationApiV1ExplainAccountIdDormantGet(body);
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


## getDormantExplanationApiV1ExplainDormantAccountIdGet

> any getDormantExplanationApiV1ExplainDormantAccountIdGet(accountId)

Get Dormant Explanation

### Example

```ts
import {
  Configuration,
  FraudApi,
} from 'gten-internal';
import type { GetDormantExplanationApiV1ExplainDormantAccountIdGetRequest } from 'gten-internal';

async function example() {
  console.log("🚀 Testing gten-internal SDK...");
  const api = new FraudApi();

  const body = {
    // string
    accountId: accountId_example,
  } satisfies GetDormantExplanationApiV1ExplainDormantAccountIdGetRequest;

  try {
    const data = await api.getDormantExplanationApiV1ExplainDormantAccountIdGet(body);
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


## getFullExplanationApiV1ExplainAccountIdGet

> any getFullExplanationApiV1ExplainAccountIdGet(accountId)

Get Full Explanation

### Example

```ts
import {
  Configuration,
  FraudApi,
} from 'gten-internal';
import type { GetFullExplanationApiV1ExplainAccountIdGetRequest } from 'gten-internal';

async function example() {
  console.log("🚀 Testing gten-internal SDK...");
  const api = new FraudApi();

  const body = {
    // string
    accountId: accountId_example,
  } satisfies GetFullExplanationApiV1ExplainAccountIdGetRequest;

  try {
    const data = await api.getFullExplanationApiV1ExplainAccountIdGet(body);
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


## getKycExplanationApiV1ExplainAccountIdKycGet

> any getKycExplanationApiV1ExplainAccountIdKycGet(accountId)

Get Kyc Explanation

### Example

```ts
import {
  Configuration,
  FraudApi,
} from 'gten-internal';
import type { GetKycExplanationApiV1ExplainAccountIdKycGetRequest } from 'gten-internal';

async function example() {
  console.log("🚀 Testing gten-internal SDK...");
  const api = new FraudApi();

  const body = {
    // string
    accountId: accountId_example,
  } satisfies GetKycExplanationApiV1ExplainAccountIdKycGetRequest;

  try {
    const data = await api.getKycExplanationApiV1ExplainAccountIdKycGet(body);
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


## getKycMismatchExplanationApiV1ExplainKycMismatchAccountIdGet

> any getKycMismatchExplanationApiV1ExplainKycMismatchAccountIdGet(accountId)

Get Kyc Mismatch Explanation

### Example

```ts
import {
  Configuration,
  FraudApi,
} from 'gten-internal';
import type { GetKycMismatchExplanationApiV1ExplainKycMismatchAccountIdGetRequest } from 'gten-internal';

async function example() {
  console.log("🚀 Testing gten-internal SDK...");
  const api = new FraudApi();

  const body = {
    // string
    accountId: accountId_example,
  } satisfies GetKycMismatchExplanationApiV1ExplainKycMismatchAccountIdGetRequest;

  try {
    const data = await api.getKycMismatchExplanationApiV1ExplainKycMismatchAccountIdGet(body);
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


## getLiveFeedApiV1FeedGet

> any getLiveFeedApiV1FeedGet(limit)

Get Live Feed

### Example

```ts
import {
  Configuration,
  FraudApi,
} from 'gten-internal';
import type { GetLiveFeedApiV1FeedGetRequest } from 'gten-internal';

async function example() {
  console.log("🚀 Testing gten-internal SDK...");
  const api = new FraudApi();

  const body = {
    // number (optional)
    limit: 56,
  } satisfies GetLiveFeedApiV1FeedGetRequest;

  try {
    const data = await api.getLiveFeedApiV1FeedGet(body);
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
| **limit** | `number` |  | [Optional] [Defaults to `30`] |

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


## getNarrativeApiV1NarrativeAccountIdPost

> any getNarrativeApiV1NarrativeAccountIdPost(accountId, narrativeRequest)

Get Narrative

### Example

```ts
import {
  Configuration,
  FraudApi,
} from 'gten-internal';
import type { GetNarrativeApiV1NarrativeAccountIdPostRequest } from 'gten-internal';

async function example() {
  console.log("🚀 Testing gten-internal SDK...");
  const api = new FraudApi();

  const body = {
    // string
    accountId: accountId_example,
    // NarrativeRequest
    narrativeRequest: ...,
  } satisfies GetNarrativeApiV1NarrativeAccountIdPostRequest;

  try {
    const data = await api.getNarrativeApiV1NarrativeAccountIdPost(body);
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
| **narrativeRequest** | [NarrativeRequest](NarrativeRequest.md) |  | |

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


## getReportApiV1ReportAccountIdGet

> any getReportApiV1ReportAccountIdGet(accountId)

Get Report

### Example

```ts
import {
  Configuration,
  FraudApi,
} from 'gten-internal';
import type { GetReportApiV1ReportAccountIdGetRequest } from 'gten-internal';

async function example() {
  console.log("🚀 Testing gten-internal SDK...");
  const api = new FraudApi();

  const body = {
    // string
    accountId: accountId_example,
  } satisfies GetReportApiV1ReportAccountIdGetRequest;

  try {
    const data = await api.getReportApiV1ReportAccountIdGet(body);
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


## getScoreApiV1ScoreAccountIdGet

> any getScoreApiV1ScoreAccountIdGet(accountId)

Get Score

### Example

```ts
import {
  Configuration,
  FraudApi,
} from 'gten-internal';
import type { GetScoreApiV1ScoreAccountIdGetRequest } from 'gten-internal';

async function example() {
  console.log("🚀 Testing gten-internal SDK...");
  const api = new FraudApi();

  const body = {
    // string
    accountId: accountId_example,
  } satisfies GetScoreApiV1ScoreAccountIdGetRequest;

  try {
    const data = await api.getScoreApiV1ScoreAccountIdGet(body);
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


## getSmurfingExplanationApiV1ExplainAccountIdSmurfingGet

> any getSmurfingExplanationApiV1ExplainAccountIdSmurfingGet(accountId)

Get Smurfing Explanation

### Example

```ts
import {
  Configuration,
  FraudApi,
} from 'gten-internal';
import type { GetSmurfingExplanationApiV1ExplainAccountIdSmurfingGetRequest } from 'gten-internal';

async function example() {
  console.log("🚀 Testing gten-internal SDK...");
  const api = new FraudApi();

  const body = {
    // string
    accountId: accountId_example,
  } satisfies GetSmurfingExplanationApiV1ExplainAccountIdSmurfingGetRequest;

  try {
    const data = await api.getSmurfingExplanationApiV1ExplainAccountIdSmurfingGet(body);
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


## getSmurfingExplanationApiV1ExplainSmurfingAccountIdGet

> any getSmurfingExplanationApiV1ExplainSmurfingAccountIdGet(accountId)

Get Smurfing Explanation

### Example

```ts
import {
  Configuration,
  FraudApi,
} from 'gten-internal';
import type { GetSmurfingExplanationApiV1ExplainSmurfingAccountIdGetRequest } from 'gten-internal';

async function example() {
  console.log("🚀 Testing gten-internal SDK...");
  const api = new FraudApi();

  const body = {
    // string
    accountId: accountId_example,
  } satisfies GetSmurfingExplanationApiV1ExplainSmurfingAccountIdGetRequest;

  try {
    const data = await api.getSmurfingExplanationApiV1ExplainSmurfingAccountIdGet(body);
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


## getStatsApiV1StatsGet

> any getStatsApiV1StatsGet(branchCode)

Get Stats

### Example

```ts
import {
  Configuration,
  FraudApi,
} from 'gten-internal';
import type { GetStatsApiV1StatsGetRequest } from 'gten-internal';

async function example() {
  console.log("🚀 Testing gten-internal SDK...");
  const config = new Configuration({ 
    // To configure OAuth2 access token for authorization: OAuth2PasswordBearer password
    accessToken: "YOUR ACCESS TOKEN",
  });
  const api = new FraudApi(config);

  const body = {
    // string (optional)
    branchCode: branchCode_example,
  } satisfies GetStatsApiV1StatsGetRequest;

  try {
    const data = await api.getStatsApiV1StatsGet(body);
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
| **branchCode** | `string` |  | [Optional] [Defaults to `undefined`] |

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


## getTraceApiV1TraceAccountIdGet

> any getTraceApiV1TraceAccountIdGet(accountId, hint)

Get Trace

### Example

```ts
import {
  Configuration,
  FraudApi,
} from 'gten-internal';
import type { GetTraceApiV1TraceAccountIdGetRequest } from 'gten-internal';

async function example() {
  console.log("🚀 Testing gten-internal SDK...");
  const api = new FraudApi();

  const body = {
    // string
    accountId: accountId_example,
    // string (optional)
    hint: hint_example,
  } satisfies GetTraceApiV1TraceAccountIdGetRequest;

  try {
    const data = await api.getTraceApiV1TraceAccountIdGet(body);
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
| **hint** | `string` |  | [Optional] [Defaults to `&#39;&#39;`] |

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


## updateAlertStatusApiV1AlertsAlertIdStatusPatch

> any updateAlertStatusApiV1AlertsAlertIdStatusPatch(alertId, alertStatusUpdate)

Update Alert Status

### Example

```ts
import {
  Configuration,
  FraudApi,
} from 'gten-internal';
import type { UpdateAlertStatusApiV1AlertsAlertIdStatusPatchRequest } from 'gten-internal';

async function example() {
  console.log("🚀 Testing gten-internal SDK...");
  const config = new Configuration({ 
    // To configure OAuth2 access token for authorization: OAuth2PasswordBearer password
    accessToken: "YOUR ACCESS TOKEN",
  });
  const api = new FraudApi(config);

  const body = {
    // string
    alertId: alertId_example,
    // AlertStatusUpdate
    alertStatusUpdate: ...,
  } satisfies UpdateAlertStatusApiV1AlertsAlertIdStatusPatchRequest;

  try {
    const data = await api.updateAlertStatusApiV1AlertsAlertIdStatusPatch(body);
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
| **alertStatusUpdate** | [AlertStatusUpdate](AlertStatusUpdate.md) |  | |

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

