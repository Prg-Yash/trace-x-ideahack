# NarrativeRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**focused_pattern** | **str** |  | [optional] 
**all_patterns** | **List[object]** |  | [optional] [default to []]
**shap_features** | **List[object]** |  | [optional] [default to []]

## Example

```python
from gten_internal.models.narrative_request import NarrativeRequest

# TODO update the JSON string below
json = "{}"
# create an instance of NarrativeRequest from a JSON string
narrative_request_instance = NarrativeRequest.from_json(json)
# print the JSON string representation of the object
print(NarrativeRequest.to_json())

# convert the object into a dict
narrative_request_dict = narrative_request_instance.to_dict()
# create an instance of NarrativeRequest from a dict
narrative_request_from_dict = NarrativeRequest.from_dict(narrative_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


