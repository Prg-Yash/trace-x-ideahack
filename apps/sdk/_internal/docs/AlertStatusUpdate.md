# AlertStatusUpdate


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**status** | **str** |  | 

## Example

```python
from gten_internal.models.alert_status_update import AlertStatusUpdate

# TODO update the JSON string below
json = "{}"
# create an instance of AlertStatusUpdate from a JSON string
alert_status_update_instance = AlertStatusUpdate.from_json(json)
# print the JSON string representation of the object
print(AlertStatusUpdate.to_json())

# convert the object into a dict
alert_status_update_dict = alert_status_update_instance.to_dict()
# create an instance of AlertStatusUpdate from a dict
alert_status_update_from_dict = AlertStatusUpdate.from_dict(alert_status_update_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


