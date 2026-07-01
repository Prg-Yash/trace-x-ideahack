# gten_internal.DemoApi

All URIs are relative to *http://localhost*

Method | HTTP request | Description
------------- | ------------- | -------------
[**cleanup_demo_api_v1_demo_cleanup_delete**](DemoApi.md#cleanup_demo_api_v1_demo_cleanup_delete) | **DELETE** /api/v1/demo/cleanup | Cleanup Demo
[**inject_demo_api_v1_demo_inject_post**](DemoApi.md#inject_demo_api_v1_demo_inject_post) | **POST** /api/v1/demo/inject | Inject Demo


# **cleanup_demo_api_v1_demo_cleanup_delete**
> object cleanup_demo_api_v1_demo_cleanup_delete()

Cleanup Demo

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
    api_instance = gten_internal.DemoApi(api_client)

    try:
        # Cleanup Demo
        api_response = api_instance.cleanup_demo_api_v1_demo_cleanup_delete()
        print("The response of DemoApi->cleanup_demo_api_v1_demo_cleanup_delete:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling DemoApi->cleanup_demo_api_v1_demo_cleanup_delete: %s\n" % e)
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

# **inject_demo_api_v1_demo_inject_post**
> object inject_demo_api_v1_demo_inject_post(request_body)

Inject Demo

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
    api_instance = gten_internal.DemoApi(api_client)
    request_body = None # Dict[str, object] | 

    try:
        # Inject Demo
        api_response = api_instance.inject_demo_api_v1_demo_inject_post(request_body)
        print("The response of DemoApi->inject_demo_api_v1_demo_inject_post:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling DemoApi->inject_demo_api_v1_demo_inject_post: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **request_body** | [**Dict[str, object]**](object.md)|  | 

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

