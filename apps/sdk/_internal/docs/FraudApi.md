# gten_internal.FraudApi

All URIs are relative to *http://localhost*

Method | HTTP request | Description
------------- | ------------- | -------------
[**create_account_api_v1_accounts_post**](FraudApi.md#create_account_api_v1_accounts_post) | **POST** /api/v1/accounts | Create Account
[**create_transaction_api_v1_transactions_post**](FraudApi.md#create_transaction_api_v1_transactions_post) | **POST** /api/v1/transactions | Create Transaction
[**get_alert_details_api_v1_alerts_alert_id_get**](FraudApi.md#get_alert_details_api_v1_alerts_alert_id_get) | **GET** /api/v1/alerts/{alert_id} | Get Alert Details
[**get_alerts_quick_api_v1_alerts_quick_get**](FraudApi.md#get_alerts_quick_api_v1_alerts_quick_get) | **GET** /api/v1/alerts/quick | Get Alerts Quick
[**get_branch_channel_analytics_api_v1_analytics_branch_channel_get**](FraudApi.md#get_branch_channel_analytics_api_v1_analytics_branch_channel_get) | **GET** /api/v1/analytics/branch-channel | Get Branch Channel Analytics
[**get_dormant_explanation_api_v1_explain_account_id_dormant_get**](FraudApi.md#get_dormant_explanation_api_v1_explain_account_id_dormant_get) | **GET** /api/v1/explain/{account_id}/dormant | Get Dormant Explanation
[**get_dormant_explanation_api_v1_explain_dormant_account_id_get**](FraudApi.md#get_dormant_explanation_api_v1_explain_dormant_account_id_get) | **GET** /api/v1/explain/dormant/{account_id} | Get Dormant Explanation
[**get_full_explanation_api_v1_explain_account_id_get**](FraudApi.md#get_full_explanation_api_v1_explain_account_id_get) | **GET** /api/v1/explain/{account_id} | Get Full Explanation
[**get_kyc_explanation_api_v1_explain_account_id_kyc_get**](FraudApi.md#get_kyc_explanation_api_v1_explain_account_id_kyc_get) | **GET** /api/v1/explain/{account_id}/kyc | Get Kyc Explanation
[**get_kyc_mismatch_explanation_api_v1_explain_kyc_mismatch_account_id_get**](FraudApi.md#get_kyc_mismatch_explanation_api_v1_explain_kyc_mismatch_account_id_get) | **GET** /api/v1/explain/kyc_mismatch/{account_id} | Get Kyc Mismatch Explanation
[**get_live_feed_api_v1_feed_get**](FraudApi.md#get_live_feed_api_v1_feed_get) | **GET** /api/v1/feed | Get Live Feed
[**get_narrative_api_v1_narrative_account_id_post**](FraudApi.md#get_narrative_api_v1_narrative_account_id_post) | **POST** /api/v1/narrative/{account_id} | Get Narrative
[**get_report_api_v1_report_account_id_get**](FraudApi.md#get_report_api_v1_report_account_id_get) | **GET** /api/v1/report/{account_id} | Get Report
[**get_score_api_v1_score_account_id_get**](FraudApi.md#get_score_api_v1_score_account_id_get) | **GET** /api/v1/score/{account_id} | Get Score
[**get_smurfing_explanation_api_v1_explain_account_id_smurfing_get**](FraudApi.md#get_smurfing_explanation_api_v1_explain_account_id_smurfing_get) | **GET** /api/v1/explain/{account_id}/smurfing | Get Smurfing Explanation
[**get_smurfing_explanation_api_v1_explain_smurfing_account_id_get**](FraudApi.md#get_smurfing_explanation_api_v1_explain_smurfing_account_id_get) | **GET** /api/v1/explain/smurfing/{account_id} | Get Smurfing Explanation
[**get_stats_api_v1_stats_get**](FraudApi.md#get_stats_api_v1_stats_get) | **GET** /api/v1/stats | Get Stats
[**get_trace_api_v1_trace_account_id_get**](FraudApi.md#get_trace_api_v1_trace_account_id_get) | **GET** /api/v1/trace/{account_id} | Get Trace
[**update_alert_status_api_v1_alerts_alert_id_status_patch**](FraudApi.md#update_alert_status_api_v1_alerts_alert_id_status_patch) | **PATCH** /api/v1/alerts/{alert_id}/status | Update Alert Status


# **create_account_api_v1_accounts_post**
> object create_account_api_v1_accounts_post(account)

Create Account

### Example


```python
import gten_internal
from gten_internal.models.account import Account
from gten_internal.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to http://localhost
# See configuration.py for a list of all supported configuration parameters.
configuration = gten_internal.Configuration(
    host = "http://localhost"
)


# Enter a context with an instance of the API client
with gten_internal.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = gten_internal.FraudApi(api_client)
    account = gten_internal.Account() # Account | 

    try:
        # Create Account
        api_response = api_instance.create_account_api_v1_accounts_post(account)
        print("The response of FraudApi->create_account_api_v1_accounts_post:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling FraudApi->create_account_api_v1_accounts_post: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **account** | [**Account**](Account.md)|  | 

### Return type

**object**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **create_transaction_api_v1_transactions_post**
> object create_transaction_api_v1_transactions_post(transaction)

Create Transaction

### Example


```python
import gten_internal
from gten_internal.models.transaction import Transaction
from gten_internal.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to http://localhost
# See configuration.py for a list of all supported configuration parameters.
configuration = gten_internal.Configuration(
    host = "http://localhost"
)


# Enter a context with an instance of the API client
with gten_internal.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = gten_internal.FraudApi(api_client)
    transaction = gten_internal.Transaction() # Transaction | 

    try:
        # Create Transaction
        api_response = api_instance.create_transaction_api_v1_transactions_post(transaction)
        print("The response of FraudApi->create_transaction_api_v1_transactions_post:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling FraudApi->create_transaction_api_v1_transactions_post: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **transaction** | [**Transaction**](Transaction.md)|  | 

### Return type

**object**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **get_alert_details_api_v1_alerts_alert_id_get**
> object get_alert_details_api_v1_alerts_alert_id_get(alert_id)

Get Alert Details

### Example


```python
import gten_internal
from gten_internal.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to http://localhost
# See configuration.py for a list of all supported configuration parameters.
configuration = gten_internal.Configuration(
    host = "http://localhost"
)


# Enter a context with an instance of the API client
with gten_internal.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = gten_internal.FraudApi(api_client)
    alert_id = 'alert_id_example' # str | 

    try:
        # Get Alert Details
        api_response = api_instance.get_alert_details_api_v1_alerts_alert_id_get(alert_id)
        print("The response of FraudApi->get_alert_details_api_v1_alerts_alert_id_get:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling FraudApi->get_alert_details_api_v1_alerts_alert_id_get: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **alert_id** | **str**|  | 

### Return type

**object**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **get_alerts_quick_api_v1_alerts_quick_get**
> object get_alerts_quick_api_v1_alerts_quick_get(limit=limit, branch_code=branch_code)

Get Alerts Quick

Read pre-generated Alert nodes from Neo4j. Instant — no ML inference.

### Example

* OAuth Authentication (OAuth2PasswordBearer):

```python
import gten_internal
from gten_internal.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to http://localhost
# See configuration.py for a list of all supported configuration parameters.
configuration = gten_internal.Configuration(
    host = "http://localhost"
)

# The client must configure the authentication and authorization parameters
# in accordance with the API server security policy.
# Examples for each auth method are provided below, use the example that
# satisfies your auth use case.

configuration.access_token = os.environ["ACCESS_TOKEN"]

# Enter a context with an instance of the API client
with gten_internal.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = gten_internal.FraudApi(api_client)
    limit = 200 # int |  (optional) (default to 200)
    branch_code = 'branch_code_example' # str |  (optional)

    try:
        # Get Alerts Quick
        api_response = api_instance.get_alerts_quick_api_v1_alerts_quick_get(limit=limit, branch_code=branch_code)
        print("The response of FraudApi->get_alerts_quick_api_v1_alerts_quick_get:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling FraudApi->get_alerts_quick_api_v1_alerts_quick_get: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **limit** | **int**|  | [optional] [default to 200]
 **branch_code** | **str**|  | [optional] 

### Return type

**object**

### Authorization

[OAuth2PasswordBearer](../README.md#OAuth2PasswordBearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **get_branch_channel_analytics_api_v1_analytics_branch_channel_get**
> object get_branch_channel_analytics_api_v1_analytics_branch_channel_get()

Get Branch Channel Analytics

Aggregate branch risk and channel abuse metrics from PostgreSQL.

### Example


```python
import gten_internal
from gten_internal.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to http://localhost
# See configuration.py for a list of all supported configuration parameters.
configuration = gten_internal.Configuration(
    host = "http://localhost"
)


# Enter a context with an instance of the API client
with gten_internal.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = gten_internal.FraudApi(api_client)

    try:
        # Get Branch Channel Analytics
        api_response = api_instance.get_branch_channel_analytics_api_v1_analytics_branch_channel_get()
        print("The response of FraudApi->get_branch_channel_analytics_api_v1_analytics_branch_channel_get:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling FraudApi->get_branch_channel_analytics_api_v1_analytics_branch_channel_get: %s\n" % e)
```



### Parameters

This endpoint does not need any parameter.

### Return type

**object**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **get_dormant_explanation_api_v1_explain_account_id_dormant_get**
> object get_dormant_explanation_api_v1_explain_account_id_dormant_get(account_id)

Get Dormant Explanation

### Example


```python
import gten_internal
from gten_internal.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to http://localhost
# See configuration.py for a list of all supported configuration parameters.
configuration = gten_internal.Configuration(
    host = "http://localhost"
)


# Enter a context with an instance of the API client
with gten_internal.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = gten_internal.FraudApi(api_client)
    account_id = 'account_id_example' # str | 

    try:
        # Get Dormant Explanation
        api_response = api_instance.get_dormant_explanation_api_v1_explain_account_id_dormant_get(account_id)
        print("The response of FraudApi->get_dormant_explanation_api_v1_explain_account_id_dormant_get:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling FraudApi->get_dormant_explanation_api_v1_explain_account_id_dormant_get: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **account_id** | **str**|  | 

### Return type

**object**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **get_dormant_explanation_api_v1_explain_dormant_account_id_get**
> object get_dormant_explanation_api_v1_explain_dormant_account_id_get(account_id)

Get Dormant Explanation

### Example


```python
import gten_internal
from gten_internal.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to http://localhost
# See configuration.py for a list of all supported configuration parameters.
configuration = gten_internal.Configuration(
    host = "http://localhost"
)


# Enter a context with an instance of the API client
with gten_internal.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = gten_internal.FraudApi(api_client)
    account_id = 'account_id_example' # str | 

    try:
        # Get Dormant Explanation
        api_response = api_instance.get_dormant_explanation_api_v1_explain_dormant_account_id_get(account_id)
        print("The response of FraudApi->get_dormant_explanation_api_v1_explain_dormant_account_id_get:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling FraudApi->get_dormant_explanation_api_v1_explain_dormant_account_id_get: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **account_id** | **str**|  | 

### Return type

**object**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **get_full_explanation_api_v1_explain_account_id_get**
> object get_full_explanation_api_v1_explain_account_id_get(account_id)

Get Full Explanation

### Example


```python
import gten_internal
from gten_internal.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to http://localhost
# See configuration.py for a list of all supported configuration parameters.
configuration = gten_internal.Configuration(
    host = "http://localhost"
)


# Enter a context with an instance of the API client
with gten_internal.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = gten_internal.FraudApi(api_client)
    account_id = 'account_id_example' # str | 

    try:
        # Get Full Explanation
        api_response = api_instance.get_full_explanation_api_v1_explain_account_id_get(account_id)
        print("The response of FraudApi->get_full_explanation_api_v1_explain_account_id_get:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling FraudApi->get_full_explanation_api_v1_explain_account_id_get: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **account_id** | **str**|  | 

### Return type

**object**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **get_kyc_explanation_api_v1_explain_account_id_kyc_get**
> object get_kyc_explanation_api_v1_explain_account_id_kyc_get(account_id)

Get Kyc Explanation

### Example


```python
import gten_internal
from gten_internal.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to http://localhost
# See configuration.py for a list of all supported configuration parameters.
configuration = gten_internal.Configuration(
    host = "http://localhost"
)


# Enter a context with an instance of the API client
with gten_internal.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = gten_internal.FraudApi(api_client)
    account_id = 'account_id_example' # str | 

    try:
        # Get Kyc Explanation
        api_response = api_instance.get_kyc_explanation_api_v1_explain_account_id_kyc_get(account_id)
        print("The response of FraudApi->get_kyc_explanation_api_v1_explain_account_id_kyc_get:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling FraudApi->get_kyc_explanation_api_v1_explain_account_id_kyc_get: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **account_id** | **str**|  | 

### Return type

**object**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **get_kyc_mismatch_explanation_api_v1_explain_kyc_mismatch_account_id_get**
> object get_kyc_mismatch_explanation_api_v1_explain_kyc_mismatch_account_id_get(account_id)

Get Kyc Mismatch Explanation

### Example


```python
import gten_internal
from gten_internal.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to http://localhost
# See configuration.py for a list of all supported configuration parameters.
configuration = gten_internal.Configuration(
    host = "http://localhost"
)


# Enter a context with an instance of the API client
with gten_internal.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = gten_internal.FraudApi(api_client)
    account_id = 'account_id_example' # str | 

    try:
        # Get Kyc Mismatch Explanation
        api_response = api_instance.get_kyc_mismatch_explanation_api_v1_explain_kyc_mismatch_account_id_get(account_id)
        print("The response of FraudApi->get_kyc_mismatch_explanation_api_v1_explain_kyc_mismatch_account_id_get:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling FraudApi->get_kyc_mismatch_explanation_api_v1_explain_kyc_mismatch_account_id_get: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **account_id** | **str**|  | 

### Return type

**object**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **get_live_feed_api_v1_feed_get**
> object get_live_feed_api_v1_feed_get(limit=limit)

Get Live Feed

### Example


```python
import gten_internal
from gten_internal.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to http://localhost
# See configuration.py for a list of all supported configuration parameters.
configuration = gten_internal.Configuration(
    host = "http://localhost"
)


# Enter a context with an instance of the API client
with gten_internal.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = gten_internal.FraudApi(api_client)
    limit = 30 # int |  (optional) (default to 30)

    try:
        # Get Live Feed
        api_response = api_instance.get_live_feed_api_v1_feed_get(limit=limit)
        print("The response of FraudApi->get_live_feed_api_v1_feed_get:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling FraudApi->get_live_feed_api_v1_feed_get: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **limit** | **int**|  | [optional] [default to 30]

### Return type

**object**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **get_narrative_api_v1_narrative_account_id_post**
> object get_narrative_api_v1_narrative_account_id_post(account_id, narrative_request)

Get Narrative

### Example


```python
import gten_internal
from gten_internal.models.narrative_request import NarrativeRequest
from gten_internal.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to http://localhost
# See configuration.py for a list of all supported configuration parameters.
configuration = gten_internal.Configuration(
    host = "http://localhost"
)


# Enter a context with an instance of the API client
with gten_internal.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = gten_internal.FraudApi(api_client)
    account_id = 'account_id_example' # str | 
    narrative_request = gten_internal.NarrativeRequest() # NarrativeRequest | 

    try:
        # Get Narrative
        api_response = api_instance.get_narrative_api_v1_narrative_account_id_post(account_id, narrative_request)
        print("The response of FraudApi->get_narrative_api_v1_narrative_account_id_post:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling FraudApi->get_narrative_api_v1_narrative_account_id_post: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **account_id** | **str**|  | 
 **narrative_request** | [**NarrativeRequest**](NarrativeRequest.md)|  | 

### Return type

**object**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **get_report_api_v1_report_account_id_get**
> object get_report_api_v1_report_account_id_get(account_id)

Get Report

### Example


```python
import gten_internal
from gten_internal.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to http://localhost
# See configuration.py for a list of all supported configuration parameters.
configuration = gten_internal.Configuration(
    host = "http://localhost"
)


# Enter a context with an instance of the API client
with gten_internal.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = gten_internal.FraudApi(api_client)
    account_id = 'account_id_example' # str | 

    try:
        # Get Report
        api_response = api_instance.get_report_api_v1_report_account_id_get(account_id)
        print("The response of FraudApi->get_report_api_v1_report_account_id_get:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling FraudApi->get_report_api_v1_report_account_id_get: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **account_id** | **str**|  | 

### Return type

**object**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **get_score_api_v1_score_account_id_get**
> object get_score_api_v1_score_account_id_get(account_id)

Get Score

### Example


```python
import gten_internal
from gten_internal.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to http://localhost
# See configuration.py for a list of all supported configuration parameters.
configuration = gten_internal.Configuration(
    host = "http://localhost"
)


# Enter a context with an instance of the API client
with gten_internal.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = gten_internal.FraudApi(api_client)
    account_id = 'account_id_example' # str | 

    try:
        # Get Score
        api_response = api_instance.get_score_api_v1_score_account_id_get(account_id)
        print("The response of FraudApi->get_score_api_v1_score_account_id_get:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling FraudApi->get_score_api_v1_score_account_id_get: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **account_id** | **str**|  | 

### Return type

**object**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **get_smurfing_explanation_api_v1_explain_account_id_smurfing_get**
> object get_smurfing_explanation_api_v1_explain_account_id_smurfing_get(account_id)

Get Smurfing Explanation

### Example


```python
import gten_internal
from gten_internal.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to http://localhost
# See configuration.py for a list of all supported configuration parameters.
configuration = gten_internal.Configuration(
    host = "http://localhost"
)


# Enter a context with an instance of the API client
with gten_internal.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = gten_internal.FraudApi(api_client)
    account_id = 'account_id_example' # str | 

    try:
        # Get Smurfing Explanation
        api_response = api_instance.get_smurfing_explanation_api_v1_explain_account_id_smurfing_get(account_id)
        print("The response of FraudApi->get_smurfing_explanation_api_v1_explain_account_id_smurfing_get:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling FraudApi->get_smurfing_explanation_api_v1_explain_account_id_smurfing_get: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **account_id** | **str**|  | 

### Return type

**object**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **get_smurfing_explanation_api_v1_explain_smurfing_account_id_get**
> object get_smurfing_explanation_api_v1_explain_smurfing_account_id_get(account_id)

Get Smurfing Explanation

### Example


```python
import gten_internal
from gten_internal.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to http://localhost
# See configuration.py for a list of all supported configuration parameters.
configuration = gten_internal.Configuration(
    host = "http://localhost"
)


# Enter a context with an instance of the API client
with gten_internal.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = gten_internal.FraudApi(api_client)
    account_id = 'account_id_example' # str | 

    try:
        # Get Smurfing Explanation
        api_response = api_instance.get_smurfing_explanation_api_v1_explain_smurfing_account_id_get(account_id)
        print("The response of FraudApi->get_smurfing_explanation_api_v1_explain_smurfing_account_id_get:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling FraudApi->get_smurfing_explanation_api_v1_explain_smurfing_account_id_get: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **account_id** | **str**|  | 

### Return type

**object**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **get_stats_api_v1_stats_get**
> object get_stats_api_v1_stats_get(branch_code=branch_code)

Get Stats

### Example

* OAuth Authentication (OAuth2PasswordBearer):

```python
import gten_internal
from gten_internal.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to http://localhost
# See configuration.py for a list of all supported configuration parameters.
configuration = gten_internal.Configuration(
    host = "http://localhost"
)

# The client must configure the authentication and authorization parameters
# in accordance with the API server security policy.
# Examples for each auth method are provided below, use the example that
# satisfies your auth use case.

configuration.access_token = os.environ["ACCESS_TOKEN"]

# Enter a context with an instance of the API client
with gten_internal.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = gten_internal.FraudApi(api_client)
    branch_code = 'branch_code_example' # str |  (optional)

    try:
        # Get Stats
        api_response = api_instance.get_stats_api_v1_stats_get(branch_code=branch_code)
        print("The response of FraudApi->get_stats_api_v1_stats_get:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling FraudApi->get_stats_api_v1_stats_get: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **branch_code** | **str**|  | [optional] 

### Return type

**object**

### Authorization

[OAuth2PasswordBearer](../README.md#OAuth2PasswordBearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **get_trace_api_v1_trace_account_id_get**
> object get_trace_api_v1_trace_account_id_get(account_id, hint=hint)

Get Trace

### Example


```python
import gten_internal
from gten_internal.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to http://localhost
# See configuration.py for a list of all supported configuration parameters.
configuration = gten_internal.Configuration(
    host = "http://localhost"
)


# Enter a context with an instance of the API client
with gten_internal.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = gten_internal.FraudApi(api_client)
    account_id = 'account_id_example' # str | 
    hint = '' # str |  (optional) (default to '')

    try:
        # Get Trace
        api_response = api_instance.get_trace_api_v1_trace_account_id_get(account_id, hint=hint)
        print("The response of FraudApi->get_trace_api_v1_trace_account_id_get:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling FraudApi->get_trace_api_v1_trace_account_id_get: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **account_id** | **str**|  | 
 **hint** | **str**|  | [optional] [default to &#39;&#39;]

### Return type

**object**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **update_alert_status_api_v1_alerts_alert_id_status_patch**
> object update_alert_status_api_v1_alerts_alert_id_status_patch(alert_id, alert_status_update)

Update Alert Status

### Example

* OAuth Authentication (OAuth2PasswordBearer):

```python
import gten_internal
from gten_internal.models.alert_status_update import AlertStatusUpdate
from gten_internal.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to http://localhost
# See configuration.py for a list of all supported configuration parameters.
configuration = gten_internal.Configuration(
    host = "http://localhost"
)

# The client must configure the authentication and authorization parameters
# in accordance with the API server security policy.
# Examples for each auth method are provided below, use the example that
# satisfies your auth use case.

configuration.access_token = os.environ["ACCESS_TOKEN"]

# Enter a context with an instance of the API client
with gten_internal.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = gten_internal.FraudApi(api_client)
    alert_id = 'alert_id_example' # str | 
    alert_status_update = gten_internal.AlertStatusUpdate() # AlertStatusUpdate | 

    try:
        # Update Alert Status
        api_response = api_instance.update_alert_status_api_v1_alerts_alert_id_status_patch(alert_id, alert_status_update)
        print("The response of FraudApi->update_alert_status_api_v1_alerts_alert_id_status_patch:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling FraudApi->update_alert_status_api_v1_alerts_alert_id_status_patch: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **alert_id** | **str**|  | 
 **alert_status_update** | [**AlertStatusUpdate**](AlertStatusUpdate.md)|  | 

### Return type

**object**

### Authorization

[OAuth2PasswordBearer](../README.md#OAuth2PasswordBearer)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

