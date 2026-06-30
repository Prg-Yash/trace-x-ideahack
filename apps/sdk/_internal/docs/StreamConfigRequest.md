# StreamConfigRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**tps** | **int** |  | 

## Example

```python
from gten_internal.models.stream_config_request import StreamConfigRequest

# TODO update the JSON string below
json = "{}"
# create an instance of StreamConfigRequest from a JSON string
stream_config_request_instance = StreamConfigRequest.from_json(json)
# print the JSON string representation of the object
print(StreamConfigRequest.to_json())

# convert the object into a dict
stream_config_request_dict = stream_config_request_instance.to_dict()
# create an instance of StreamConfigRequest from a dict
stream_config_request_from_dict = StreamConfigRequest.from_dict(stream_config_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


