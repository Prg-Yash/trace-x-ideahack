# gten_internal.BranchesApi

All URIs are relative to *http://localhost*

Method | HTTP request | Description
------------- | ------------- | -------------
[**create_branch_api_v1_branches_post**](BranchesApi.md#create_branch_api_v1_branches_post) | **POST** /api/v1/branches | Create Branch
[**delete_branch_api_v1_branches_branch_id_delete**](BranchesApi.md#delete_branch_api_v1_branches_branch_id_delete) | **DELETE** /api/v1/branches/{branch_id} | Delete Branch
[**get_branches_api_v1_branches_get**](BranchesApi.md#get_branches_api_v1_branches_get) | **GET** /api/v1/branches | Get Branches
[**update_branch_api_v1_branches_branch_id_patch**](BranchesApi.md#update_branch_api_v1_branches_branch_id_patch) | **PATCH** /api/v1/branches/{branch_id} | Update Branch


# **create_branch_api_v1_branches_post**
> object create_branch_api_v1_branches_post(branch_create)

Create Branch

### Example

* OAuth Authentication (OAuth2PasswordBearer):

```python
import gten_internal
from gten_internal.models.branch_create import BranchCreate
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
    api_instance = gten_internal.BranchesApi(api_client)
    branch_create = gten_internal.BranchCreate() # BranchCreate | 

    try:
        # Create Branch
        api_response = api_instance.create_branch_api_v1_branches_post(branch_create)
        print("The response of BranchesApi->create_branch_api_v1_branches_post:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling BranchesApi->create_branch_api_v1_branches_post: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **branch_create** | [**BranchCreate**](BranchCreate.md)|  | 

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

# **delete_branch_api_v1_branches_branch_id_delete**
> object delete_branch_api_v1_branches_branch_id_delete(branch_id)

Delete Branch

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
    api_instance = gten_internal.BranchesApi(api_client)
    branch_id = 56 # int | 

    try:
        # Delete Branch
        api_response = api_instance.delete_branch_api_v1_branches_branch_id_delete(branch_id)
        print("The response of BranchesApi->delete_branch_api_v1_branches_branch_id_delete:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling BranchesApi->delete_branch_api_v1_branches_branch_id_delete: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **branch_id** | **int**|  | 

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

# **get_branches_api_v1_branches_get**
> object get_branches_api_v1_branches_get()

Get Branches

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
    api_instance = gten_internal.BranchesApi(api_client)

    try:
        # Get Branches
        api_response = api_instance.get_branches_api_v1_branches_get()
        print("The response of BranchesApi->get_branches_api_v1_branches_get:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling BranchesApi->get_branches_api_v1_branches_get: %s\n" % e)
```



### Parameters

This endpoint does not need any parameter.

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

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **update_branch_api_v1_branches_branch_id_patch**
> object update_branch_api_v1_branches_branch_id_patch(branch_id, branch_update)

Update Branch

### Example

* OAuth Authentication (OAuth2PasswordBearer):

```python
import gten_internal
from gten_internal.models.branch_update import BranchUpdate
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
    api_instance = gten_internal.BranchesApi(api_client)
    branch_id = 56 # int | 
    branch_update = gten_internal.BranchUpdate() # BranchUpdate | 

    try:
        # Update Branch
        api_response = api_instance.update_branch_api_v1_branches_branch_id_patch(branch_id, branch_update)
        print("The response of BranchesApi->update_branch_api_v1_branches_branch_id_patch:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling BranchesApi->update_branch_api_v1_branches_branch_id_patch: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **branch_id** | **int**|  | 
 **branch_update** | [**BranchUpdate**](BranchUpdate.md)|  | 

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

