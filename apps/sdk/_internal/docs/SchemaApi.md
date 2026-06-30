# gten_internal.SchemaApi

All URIs are relative to *http://localhost*

Method | HTTP request | Description
------------- | ------------- | -------------
[**setup_schema_api_v1_schema_setup_post**](SchemaApi.md#setup_schema_api_v1_schema_setup_post) | **POST** /api/v1/schema/setup | Setup Schema


# **setup_schema_api_v1_schema_setup_post**
> object setup_schema_api_v1_schema_setup_post()

Setup Schema

Set up Neo4j schema with constraints and indexes.
This endpoint should be called once during initial setup.

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
    api_instance = gten_internal.SchemaApi(api_client)

    try:
        # Setup Schema
        api_response = api_instance.setup_schema_api_v1_schema_setup_post()
        print("The response of SchemaApi->setup_schema_api_v1_schema_setup_post:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling SchemaApi->setup_schema_api_v1_schema_setup_post: %s\n" % e)
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

