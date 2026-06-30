# gten_internal.DefaultApi

All URIs are relative to *http://localhost*

Method | HTTP request | Description
------------- | ------------- | -------------
[**config_stream_api_v1_stream_config_post**](DefaultApi.md#config_stream_api_v1_stream_config_post) | **POST** /api/v1/stream/config | Config Stream
[**inject_fraud_api_v1_stream_inject_post**](DefaultApi.md#inject_fraud_api_v1_stream_inject_post) | **POST** /api/v1/stream/inject | Inject Fraud
[**read_root_get**](DefaultApi.md#read_root_get) | **GET** / | Read Root
[**reset_demo_data_api_v1_stream_reset_delete**](DefaultApi.md#reset_demo_data_api_v1_stream_reset_delete) | **DELETE** /api/v1/stream/reset | Reset Demo Data
[**start_stream_api_v1_stream_start_post**](DefaultApi.md#start_stream_api_v1_stream_start_post) | **POST** /api/v1/stream/start | Start Stream
[**stop_stream_api_v1_stream_stop_post**](DefaultApi.md#stop_stream_api_v1_stream_stop_post) | **POST** /api/v1/stream/stop | Stop Stream
[**stream_status_api_v1_stream_status_get**](DefaultApi.md#stream_status_api_v1_stream_status_get) | **GET** /api/v1/stream/status | Stream Status


# **config_stream_api_v1_stream_config_post**
> object config_stream_api_v1_stream_config_post(stream_config_request)

Config Stream

### Example


```python
import gten_internal
from gten_internal.models.stream_config_request import StreamConfigRequest
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
    api_instance = gten_internal.DefaultApi(api_client)
    stream_config_request = gten_internal.StreamConfigRequest() # StreamConfigRequest | 

    try:
        # Config Stream
        api_response = api_instance.config_stream_api_v1_stream_config_post(stream_config_request)
        print("The response of DefaultApi->config_stream_api_v1_stream_config_post:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling DefaultApi->config_stream_api_v1_stream_config_post: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **stream_config_request** | [**StreamConfigRequest**](StreamConfigRequest.md)|  | 

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

# **inject_fraud_api_v1_stream_inject_post**
> object inject_fraud_api_v1_stream_inject_post(inject_pattern_request)

Inject Fraud

### Example


```python
import gten_internal
from gten_internal.models.inject_pattern_request import InjectPatternRequest
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
    api_instance = gten_internal.DefaultApi(api_client)
    inject_pattern_request = gten_internal.InjectPatternRequest() # InjectPatternRequest | 

    try:
        # Inject Fraud
        api_response = api_instance.inject_fraud_api_v1_stream_inject_post(inject_pattern_request)
        print("The response of DefaultApi->inject_fraud_api_v1_stream_inject_post:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling DefaultApi->inject_fraud_api_v1_stream_inject_post: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **inject_pattern_request** | [**InjectPatternRequest**](InjectPatternRequest.md)|  | 

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

# **read_root_get**
> object read_root_get()

Read Root

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
    api_instance = gten_internal.DefaultApi(api_client)

    try:
        # Read Root
        api_response = api_instance.read_root_get()
        print("The response of DefaultApi->read_root_get:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling DefaultApi->read_root_get: %s\n" % e)
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

# **reset_demo_data_api_v1_stream_reset_delete**
> object reset_demo_data_api_v1_stream_reset_delete()

Reset Demo Data

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
    api_instance = gten_internal.DefaultApi(api_client)

    try:
        # Reset Demo Data
        api_response = api_instance.reset_demo_data_api_v1_stream_reset_delete()
        print("The response of DefaultApi->reset_demo_data_api_v1_stream_reset_delete:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling DefaultApi->reset_demo_data_api_v1_stream_reset_delete: %s\n" % e)
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

# **start_stream_api_v1_stream_start_post**
> object start_stream_api_v1_stream_start_post()

Start Stream

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
    api_instance = gten_internal.DefaultApi(api_client)

    try:
        # Start Stream
        api_response = api_instance.start_stream_api_v1_stream_start_post()
        print("The response of DefaultApi->start_stream_api_v1_stream_start_post:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling DefaultApi->start_stream_api_v1_stream_start_post: %s\n" % e)
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

# **stop_stream_api_v1_stream_stop_post**
> object stop_stream_api_v1_stream_stop_post()

Stop Stream

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
    api_instance = gten_internal.DefaultApi(api_client)

    try:
        # Stop Stream
        api_response = api_instance.stop_stream_api_v1_stream_stop_post()
        print("The response of DefaultApi->stop_stream_api_v1_stream_stop_post:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling DefaultApi->stop_stream_api_v1_stream_stop_post: %s\n" % e)
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

# **stream_status_api_v1_stream_status_get**
> object stream_status_api_v1_stream_status_get()

Stream Status

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
    api_instance = gten_internal.DefaultApi(api_client)

    try:
        # Stream Status
        api_response = api_instance.stream_status_api_v1_stream_status_get()
        print("The response of DefaultApi->stream_status_api_v1_stream_status_get:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling DefaultApi->stream_status_api_v1_stream_status_get: %s\n" % e)
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

