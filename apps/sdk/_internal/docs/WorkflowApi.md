# gten_internal.WorkflowApi

All URIs are relative to *http://localhost*

Method | HTTP request | Description
------------- | ------------- | -------------
[**approve_str_api_v1_alerts_alert_id_approve_str_post**](WorkflowApi.md#approve_str_api_v1_alerts_alert_id_approve_str_post) | **POST** /api/v1/alerts/{alert_id}/approve-str | Approve Str
[**assign_alert_api_v1_alerts_alert_id_assign_post**](WorkflowApi.md#assign_alert_api_v1_alerts_alert_id_assign_post) | **POST** /api/v1/alerts/{alert_id}/assign | Assign Alert
[**draft_str_api_v1_alerts_alert_id_draft_str_post**](WorkflowApi.md#draft_str_api_v1_alerts_alert_id_draft_str_post) | **POST** /api/v1/alerts/{alert_id}/draft-str | Draft Str
[**get_audit_trail_api_v1_alerts_alert_id_audit_get**](WorkflowApi.md#get_audit_trail_api_v1_alerts_alert_id_audit_get) | **GET** /api/v1/alerts/{alert_id}/audit | Get Audit Trail
[**reject_str_api_v1_alerts_alert_id_reject_str_post**](WorkflowApi.md#reject_str_api_v1_alerts_alert_id_reject_str_post) | **POST** /api/v1/alerts/{alert_id}/reject-str | Reject Str


# **approve_str_api_v1_alerts_alert_id_approve_str_post**
> object approve_str_api_v1_alerts_alert_id_approve_str_post(alert_id)

Approve Str

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
    api_instance = gten_internal.WorkflowApi(api_client)
    alert_id = 'alert_id_example' # str | 

    try:
        # Approve Str
        api_response = api_instance.approve_str_api_v1_alerts_alert_id_approve_str_post(alert_id)
        print("The response of WorkflowApi->approve_str_api_v1_alerts_alert_id_approve_str_post:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling WorkflowApi->approve_str_api_v1_alerts_alert_id_approve_str_post: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **alert_id** | **str**|  | 

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

# **assign_alert_api_v1_alerts_alert_id_assign_post**
> object assign_alert_api_v1_alerts_alert_id_assign_post(alert_id, assign_request=assign_request)

Assign Alert

### Example

* OAuth Authentication (OAuth2PasswordBearer):

```python
import gten_internal
from gten_internal.models.assign_request import AssignRequest
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
    api_instance = gten_internal.WorkflowApi(api_client)
    alert_id = 'alert_id_example' # str | 
    assign_request = gten_internal.AssignRequest() # AssignRequest |  (optional)

    try:
        # Assign Alert
        api_response = api_instance.assign_alert_api_v1_alerts_alert_id_assign_post(alert_id, assign_request=assign_request)
        print("The response of WorkflowApi->assign_alert_api_v1_alerts_alert_id_assign_post:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling WorkflowApi->assign_alert_api_v1_alerts_alert_id_assign_post: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **alert_id** | **str**|  | 
 **assign_request** | [**AssignRequest**](AssignRequest.md)|  | [optional] 

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

# **draft_str_api_v1_alerts_alert_id_draft_str_post**
> object draft_str_api_v1_alerts_alert_id_draft_str_post(alert_id)

Draft Str

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
    api_instance = gten_internal.WorkflowApi(api_client)
    alert_id = 'alert_id_example' # str | 

    try:
        # Draft Str
        api_response = api_instance.draft_str_api_v1_alerts_alert_id_draft_str_post(alert_id)
        print("The response of WorkflowApi->draft_str_api_v1_alerts_alert_id_draft_str_post:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling WorkflowApi->draft_str_api_v1_alerts_alert_id_draft_str_post: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **alert_id** | **str**|  | 

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

# **get_audit_trail_api_v1_alerts_alert_id_audit_get**
> object get_audit_trail_api_v1_alerts_alert_id_audit_get(alert_id)

Get Audit Trail

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
    api_instance = gten_internal.WorkflowApi(api_client)
    alert_id = 'alert_id_example' # str | 

    try:
        # Get Audit Trail
        api_response = api_instance.get_audit_trail_api_v1_alerts_alert_id_audit_get(alert_id)
        print("The response of WorkflowApi->get_audit_trail_api_v1_alerts_alert_id_audit_get:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling WorkflowApi->get_audit_trail_api_v1_alerts_alert_id_audit_get: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **alert_id** | **str**|  | 

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

# **reject_str_api_v1_alerts_alert_id_reject_str_post**
> object reject_str_api_v1_alerts_alert_id_reject_str_post(alert_id)

Reject Str

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
    api_instance = gten_internal.WorkflowApi(api_client)
    alert_id = 'alert_id_example' # str | 

    try:
        # Reject Str
        api_response = api_instance.reject_str_api_v1_alerts_alert_id_reject_str_post(alert_id)
        print("The response of WorkflowApi->reject_str_api_v1_alerts_alert_id_reject_str_post:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling WorkflowApi->reject_str_api_v1_alerts_alert_id_reject_str_post: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **alert_id** | **str**|  | 

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

