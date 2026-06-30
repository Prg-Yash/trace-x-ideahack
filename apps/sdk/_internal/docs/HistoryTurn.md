# HistoryTurn


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**role** | **str** |  | 
**content** | **str** |  | 

## Example

```python
from gten_internal.models.history_turn import HistoryTurn

# TODO update the JSON string below
json = "{}"
# create an instance of HistoryTurn from a JSON string
history_turn_instance = HistoryTurn.from_json(json)
# print the JSON string representation of the object
print(HistoryTurn.to_json())

# convert the object into a dict
history_turn_dict = history_turn_instance.to_dict()
# create an instance of HistoryTurn from a dict
history_turn_from_dict = HistoryTurn.from_dict(history_turn_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


