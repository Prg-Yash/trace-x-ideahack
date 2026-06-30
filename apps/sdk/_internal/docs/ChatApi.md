# gten_internal.ChatApi

All URIs are relative to *http://localhost*

Method | HTTP request | Description
------------- | ------------- | -------------
[**handle_chat_api_v1_chat_post**](ChatApi.md#handle_chat_api_v1_chat_post) | **POST** /api/v1/chat/ | Handle Chat


# **handle_chat_api_v1_chat_post**
> ChatResponse handle_chat_api_v1_chat_post(chat_request)

Handle Chat

### Example


```python
import gten_internal
from gten_internal.models.chat_request import ChatRequest
from gten_internal.models.chat_response import ChatResponse
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
    api_instance = gten_internal.ChatApi(api_client)
    chat_request = gten_internal.ChatRequest() # ChatRequest | 

    try:
        # Handle Chat
        api_response = api_instance.handle_chat_api_v1_chat_post(chat_request)
        print("The response of ChatApi->handle_chat_api_v1_chat_post:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ChatApi->handle_chat_api_v1_chat_post: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **chat_request** | [**ChatRequest**](ChatRequest.md)|  | 

### Return type

[**ChatResponse**](ChatResponse.md)

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

