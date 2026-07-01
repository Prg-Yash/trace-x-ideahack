# gten_internal.DataApi

All URIs are relative to *http://localhost*

Method | HTTP request | Description
------------- | ------------- | -------------
[**add_account_note_api_v1_accounts_account_id_notes_post**](DataApi.md#add_account_note_api_v1_accounts_account_id_notes_post) | **POST** /api/v1/accounts/{account_id}/notes | Add Account Note
[**get_account_api_v1_accounts_account_id_get**](DataApi.md#get_account_api_v1_accounts_account_id_get) | **GET** /api/v1/accounts/{account_id} | Get Account
[**get_account_notes_api_v1_accounts_account_id_notes_get**](DataApi.md#get_account_notes_api_v1_accounts_account_id_notes_get) | **GET** /api/v1/accounts/{account_id}/notes | Get Account Notes
[**get_all_accounts_api_v1_accounts_get**](DataApi.md#get_all_accounts_api_v1_accounts_get) | **GET** /api/v1/accounts | Get All Accounts
[**get_all_transactions_api_v1_transactions_get**](DataApi.md#get_all_transactions_api_v1_transactions_get) | **GET** /api/v1/transactions | Get All Transactions
[**get_transaction_api_v1_transactions_txn_id_get**](DataApi.md#get_transaction_api_v1_transactions_txn_id_get) | **GET** /api/v1/transactions/{txn_id} | Get Transaction


# **add_account_note_api_v1_accounts_account_id_notes_post**
> object add_account_note_api_v1_accounts_account_id_notes_post(account_id, note_create)

Add Account Note

### Example


```python
import gten_internal
from gten_internal.models.note_create import NoteCreate
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
    api_instance = gten_internal.DataApi(api_client)
    account_id = 'account_id_example' # str | 
    note_create = gten_internal.NoteCreate() # NoteCreate | 

    try:
        # Add Account Note
        api_response = api_instance.add_account_note_api_v1_accounts_account_id_notes_post(account_id, note_create)
        print("The response of DataApi->add_account_note_api_v1_accounts_account_id_notes_post:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling DataApi->add_account_note_api_v1_accounts_account_id_notes_post: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **account_id** | **str**|  | 
 **note_create** | [**NoteCreate**](NoteCreate.md)|  | 

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

# **get_account_api_v1_accounts_account_id_get**
> object get_account_api_v1_accounts_account_id_get(account_id)

Get Account

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
    api_instance = gten_internal.DataApi(api_client)
    account_id = 'account_id_example' # str | 

    try:
        # Get Account
        api_response = api_instance.get_account_api_v1_accounts_account_id_get(account_id)
        print("The response of DataApi->get_account_api_v1_accounts_account_id_get:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling DataApi->get_account_api_v1_accounts_account_id_get: %s\n" % e)
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

# **get_account_notes_api_v1_accounts_account_id_notes_get**
> object get_account_notes_api_v1_accounts_account_id_notes_get(account_id)

Get Account Notes

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
    api_instance = gten_internal.DataApi(api_client)
    account_id = 'account_id_example' # str | 

    try:
        # Get Account Notes
        api_response = api_instance.get_account_notes_api_v1_accounts_account_id_notes_get(account_id)
        print("The response of DataApi->get_account_notes_api_v1_accounts_account_id_notes_get:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling DataApi->get_account_notes_api_v1_accounts_account_id_notes_get: %s\n" % e)
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

# **get_all_accounts_api_v1_accounts_get**
> object get_all_accounts_api_v1_accounts_get(skip=skip, limit=limit, branch_code=branch_code)

Get All Accounts

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
    api_instance = gten_internal.DataApi(api_client)
    skip = 0 # int |  (optional) (default to 0)
    limit = 100 # int |  (optional) (default to 100)
    branch_code = 'branch_code_example' # str |  (optional)

    try:
        # Get All Accounts
        api_response = api_instance.get_all_accounts_api_v1_accounts_get(skip=skip, limit=limit, branch_code=branch_code)
        print("The response of DataApi->get_all_accounts_api_v1_accounts_get:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling DataApi->get_all_accounts_api_v1_accounts_get: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **skip** | **int**|  | [optional] [default to 0]
 **limit** | **int**|  | [optional] [default to 100]
 **branch_code** | **str**|  | [optional] 

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

# **get_all_transactions_api_v1_transactions_get**
> object get_all_transactions_api_v1_transactions_get(skip=skip, limit=limit)

Get All Transactions

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
    api_instance = gten_internal.DataApi(api_client)
    skip = 0 # int |  (optional) (default to 0)
    limit = 100 # int |  (optional) (default to 100)

    try:
        # Get All Transactions
        api_response = api_instance.get_all_transactions_api_v1_transactions_get(skip=skip, limit=limit)
        print("The response of DataApi->get_all_transactions_api_v1_transactions_get:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling DataApi->get_all_transactions_api_v1_transactions_get: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **skip** | **int**|  | [optional] [default to 0]
 **limit** | **int**|  | [optional] [default to 100]

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

# **get_transaction_api_v1_transactions_txn_id_get**
> object get_transaction_api_v1_transactions_txn_id_get(txn_id)

Get Transaction

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
    api_instance = gten_internal.DataApi(api_client)
    txn_id = 'txn_id_example' # str | 

    try:
        # Get Transaction
        api_response = api_instance.get_transaction_api_v1_transactions_txn_id_get(txn_id)
        print("The response of DataApi->get_transaction_api_v1_transactions_txn_id_get:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling DataApi->get_transaction_api_v1_transactions_txn_id_get: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **txn_id** | **str**|  | 

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

