Connected Device Framework: Asset Library
=========================================
The Asset Library service is a device registry that allows you to manage your fleet of devices within multiple hierarchical groups.  Each one of the branches of the hierarchy can represent something meaningful to your business such as supplier, location, customer, vehicle, etc.

The hierarchies within Asset Library are represented as `Groups`.  Each Group has a single parent, but can comprise of many groups and/or devices as its members.

`Devices` can be associated with one or more `Groups`, each with a named relationship to its group to give context.

`Devices` themselves can be associated with other `Devices`, representing a composition type of relationship.  Examples being a mote that comprises of a number of differnet sensors, or a car engine that is comprised of a number of different components.

Different `Group Templates` can be created to align with your business, with each Group Template having its own attributes.  An example Group Template could be a _Site_, with its _address_ being an example of an attribute.

Likewise, `Device Templates` can be created to represent the different types of devices within your fleet, each with their own attributes.

`Profiles` can be created and applied to device and groups to populate with default attirbutes and/or relations.

`Policies` represent a document that can be attached to one or more groups within a hierarchy, and are automatically inherited by the devices and groups.


**Version:** 1.0.0

### /templates/devices/{templateId}
---
##### ***POST***
**Summary:** Registers a new device template within the system, using the JSON Schema standard to define the device template attributes and constraints.


**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| templateId | path | ID of device template to publish | Yes | string |
| body | body |  | Yes | [TemplateDefinition](#templatedefinition) |

**Responses**

| Code | Description |
| ---- | ----------- |
| 201 |  |
| 400 |  |

##### ***GET***
**Summary:** Find device template by ID

**Description:** Returns a single device template definition

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| templateId | path | ID of device template to publish | Yes | string |
| status | query | Status of device template to return | Yes | string |

**Responses**

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 200 | OK | [TemplateInfo](#templateinfo) |
| 400 |  |  |
| 404 |  |  |

##### ***PATCH***
**Summary:** Update an existing device template.

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| templateId | path | ID of device template to publish | Yes | string |
| body | body |  | Yes | [TemplateDefinition](#templatedefinition) |

**Responses**

| Code | Description |
| ---- | ----------- |
| 204 | OK |
| 400 |  |
| 404 |  |

##### ***DELETE***
**Summary:** Deletes an existing device template.

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| templateId | path | ID of device template to publish | Yes | string |

**Responses**

| Code | Description |
| ---- | ----------- |
| 204 | OK |
| 400 |  |
| 404 |  |

### /templates/devices/{templateId}/publish
---
##### ***PUT***
**Summary:** Publishes an existing device template.

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| templateId | path | ID of device template to publish | Yes | string |

**Responses**

| Code | Description |
| ---- | ----------- |
| 204 | OK |
| 400 |  |
| 404 |  |

### /templates/groups/{templateId}
---
##### ***POST***
**Summary:** Registers a new group template within the system, using the JSON Schema standard to define the group template attributes and constraints.


**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| templateId | path | ID of group template to return | Yes | string |
| body | body |  | Yes | [TemplateDefinition](#templatedefinition) |

**Responses**

| Code | Description |
| ---- | ----------- |
| 201 |  |
| 400 |  |

##### ***GET***
**Summary:** Find group template by ID

**Description:** Returns a single group template definition

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| templateId | path | ID of group template to return | Yes | string |
| status | query | Status of group template to return | Yes | string |

**Responses**

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 200 | OK | [TemplateInfo](#templateinfo) |
| 400 |  |  |
| 404 |  |  |

##### ***PATCH***
**Summary:** Update an existing group template.

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| templateId | path | ID of group template to return | Yes | string |
| body | body |  | Yes | [TemplateDefinition](#templatedefinition) |

**Responses**

| Code | Description |
| ---- | ----------- |
| 204 | OK |
| 400 |  |
| 404 |  |

##### ***DELETE***
**Summary:** Deletes an existing group template.

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| templateId | path | ID of group template to return | Yes | string |

**Responses**

| Code | Description |
| ---- | ----------- |
| 204 | OK |
| 400 |  |
| 404 |  |

### /templates/groups/{templateId}/publish
---
##### ***PUT***
**Summary:** Publishes an existing group template.

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| templateId | path | ID of group template to publish | Yes | string |

**Responses**

| Code | Description |
| ---- | ----------- |
| 204 | OK |
| 400 |  |
| 404 |  |

### /devices
---
##### ***POST***
**Summary:** Add a new device to the asset library, adding it to the `/unprovisioned` group if no group is specified.

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| body | body | Device to add to the asset library | Yes | [Device](#device) |
| applyProfile | query | Optionally apply a profile to the device to update unset attributes with attributes from the profile. | No | string |

**Responses**

| Code | Description |
| ---- | ----------- |
| 201 |  |
| 400 |  |

### /bulkdevices
---
##### ***POST***
**Summary:** Adds a batch of devices in bulk to the asset library, adding them to the `/unprovisioned` group if no groups are specified.

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| body | body | List of devices to add to the asset library | Yes | [BulkDevices](#bulkdevices) |
| applyProfile | query | Optionally apply a profile to the device to update unset attributes with attributes from the profile. | No | string |

**Responses**

| Code | Description |
| ---- | ----------- |
| 201 |  |
| 400 |  |

##### ***PATCH***
**Summary:** Update a batch of existing devices

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| body | body | List of devices and their attributes to update | Yes | [BulkDevices](#bulkdevices) |
| applyProfile | query | Optionally apply a profile to the device to update unset attributes with attributes from the profile. | No | string |

**Responses**

| Code | Description |
| ---- | ----------- |
| 204 | successful operation |
| 400 |  |
| 404 |  |

### /devices/{deviceId}
---
##### ***GET***
**Summary:** Find device by ID

**Description:** Returns a single device

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| deviceId | path | ID of device to return | Yes | string |
| includeComponents | query | By default, components of a device are not returned. Passing `true` will return and expand a devices components. | No | boolean |
| attributes | query | Optionally only return these specific attributes.  By default returns all attributes. | No | [ string ] |
| includeGroups | query | Optionally only return these specific related groups.  By default returns all related groups. | No | [ string ] |

**Responses**

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 200 | successful operation | [Device](#device) |
| 400 |  |  |
| 404 |  |  |

##### ***DELETE***
**Summary:** Delete device of specified ID

**Description:** Deletes a single device

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| deviceId | path | ID of device to return | Yes | string |

**Responses**

| Code | Description |
| ---- | ----------- |
| 204 | successful operation |
| 404 |  |

##### ***PATCH***
**Summary:** Update an existing device attributes

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| deviceId | path | ID of device to return | Yes | string |
| body | body | Device object that needs to be updated in device store | Yes | [Device](#device) |
| applyProfile | query | Optionally apply a profile to the device to update unset attributes with attributes from the profile. | No | string |

**Responses**

| Code | Description |
| ---- | ----------- |
| 204 | successful operation |
| 400 |  |
| 404 |  |

### /devices/{deviceId}/{relationship}/groups/{groupPath}
---
##### ***PUT***
**Summary:** Associates a device to a group, giving context to its relationship.

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| deviceId | path | Id of device to attach to the group | Yes | string |
| relationship | path | The relationship between the device and group. For example, this may reflect `locatedAt` or `manufacturedAt` relations. | Yes | string |
| groupPath | path | Path of group. | Yes | string |

**Responses**

| Code | Description |
| ---- | ----------- |
| 204 | successful operation |
| 400 |  |
| 404 |  |

##### ***DELETE***
**Summary:** Removes a device from an associated group

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| deviceId | path | Id of device to attach to the group | Yes | string |
| relationship | path | The relationship between the device and group. For example, this may reflect `locatedAt` or `manufacturedAt` relations. | Yes | string |
| groupPath | path | Path of group. | Yes | string |

**Responses**

| Code | Description |
| ---- | ----------- |
| 204 | successful operation |
| 400 |  |
| 404 |  |

### /devices/{deviceId}/{relationship}/devices/{otherDeviceId}
---
##### ***PUT***
**Summary:** Associates a device to another device, giving context to its relationship.

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| deviceId | path | Id of device to attach to the group | Yes | string |
| relationship | path | The relationship between the device and group. For example, this may reflect `locatedAt` or `manufacturedAt` relations. | Yes | string |
| otherDeviceId | path | ID of device to create relationship to. | Yes | string |

**Responses**

| Code | Description |
| ---- | ----------- |
| 204 | successful operation |
| 400 |  |
| 404 |  |

##### ***DELETE***
**Summary:** Removes a device from an associated device

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| deviceId | path | Id of device to attach to the group | Yes | string |
| relationship | path | The relationship between the device and group. For example, this may reflect `locatedAt` or `manufacturedAt` relations. | Yes | string |
| otherDeviceId | path | ID of device to create relationship to. | Yes | string |

**Responses**

| Code | Description |
| ---- | ----------- |
| 204 | successful operation |
| 400 |  |
| 404 |  |

### /devices/{deviceId}/components
---
##### ***POST***
**Summary:** Createa a new component and adds to the device.

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| deviceId | path | Id of parent device | Yes | string |
| body | body | Device to add as a component | Yes | [Device](#device) |

**Responses**

| Code | Description |
| ---- | ----------- |
| 201 |  |
| 400 |  |

### /devices/{deviceId}/components/{componentId}
---
##### ***PATCH***
**Summary:** Updates the component of a device.

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| deviceId | path | Id of parent device | Yes | string |
| componentId | path | ID of child component | Yes | string |

**Responses**

| Code | Description |
| ---- | ----------- |
| 204 | successful operation |
| 400 |  |
| 404 |  |

##### ***DELETE***
**Summary:** Deletes a component of a devoce.

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| deviceId | path | Id of parent device | Yes | string |
| componentId | path | ID of child component | Yes | string |

**Responses**

| Code | Description |
| ---- | ----------- |
| 204 | successful operation |
| 400 |  |
| 404 |  |

### /groups
---
##### ***POST***
**Summary:** Adds a new group to the device library as a child of the `parentPath` as specified in the request body.

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| body | body | Group to add to the asset library | Yes | [Group](#group) |
| applyProfile | query | Optionally apply a profile to the device to update unset attributes with attributes from the profile. | No | string |

**Responses**

| Code | Description |
| ---- | ----------- |
| 201 |  |
| 400 |  |

### /bulkgroups
---
##### ***POST***
**Summary:** Adds a batch of new group to the asset library as a child of the `parentPath` as specified in the request body.

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| body | body | Group to add to the asset library | Yes | [ [BulkGroups](#bulkgroups) ] |
| applyProfile | query | Optionally apply a profile to the device to update unset attributes with attributes from the profile. | No | string |

**Responses**

| Code | Description |
| ---- | ----------- |
| 201 |  |
| 400 |  |

### /groups/{groupPath}
---
##### ***GET***
**Summary:** Find group by Group's path

**Description:** Returns a single group

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| groupPath | path | Path of group to return | Yes | string |

**Responses**

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 200 | successful operation | [Group](#group) |
| 404 |  |  |

##### ***DELETE***
**Summary:** Delete group with supplied path

**Description:** Deletes a single group

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| groupPath | path | Path of group to return | Yes | string |

**Responses**

| Code | Description |
| ---- | ----------- |
| 204 | successful operation |
| 404 |  |

##### ***PATCH***
**Summary:** Update an existing group attributes, including changing its parent group.

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| groupPath | path | Path of group to return | Yes | string |
| body | body | Group object that needs to be updated | Yes | [Group](#group) |
| applyProfile | query | Optionally apply a profile to the device to update unset attributes with attributes from the profile. | No | string |

**Responses**

| Code | Description |
| ---- | ----------- |
| 204 | successful operation |
| 400 |  |
| 404 |  |

### /groups/{groupPath}/members/devices
---
##### ***GET***
**Summary:** List device members of group for supplied Group name

**Description:** Returns device members of group

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| groupPath | path | Path of group to return its device members. A path of '/' can be passed as id to return top level device members | Yes | string |
| template | query | Optional filter to return a specific device sub-type | No | string |
| state | query | Return devices of a specific state | No | string |
| offset | query | The index to start paginated results from | No | integer |
| count | query | The maximum number of results to return | No | integer |

**Responses**

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 200 | successful operation | object |
| 400 |  |  |
| 404 |  |  |

### /groups/{groupPath}/members/groups
---
##### ***GET***
**Summary:** List group members of group for supplied Group name

**Description:** Returns group members of group

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| groupPath | path | Path of group to return its group members. A path of '/' can be passed as id to return top level group members | Yes | string |
| template | query | Optional filter to return a specific group sub-type | No | string |
| offset | query | The index to start paginated results from | No | integer |
| count | query | The maximum number of results to return | No | integer |

**Responses**

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 200 | successful operation | object |
| 400 |  |  |
| 404 |  |  |

### /groups/{groupPath}/memberships
---
##### ***GET***
**Summary:** List all ancestor groups of a specific group.

**Description:** List all ancestor groups of a specific group.

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| groupPath | path | Path of group for fetching the membership | Yes | string |
| offset | query | The index to start paginated results from | No | integer |
| count | query | The maximum number of results to return | No | integer |

**Responses**

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 200 | successful operation | [ [Group](#group) ] |
| 400 |  |  |
| 404 |  |  |

### /groups/{sourceGroupPath}/{relationship}/groups/{targetGroupPath}
---
##### ***PUT***
**Summary:** Associates a group with another group, giving context to its relationship.

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| sourceGroupPath | path | Path of source group | Yes | string |
| relationship | path | The relationship between the groups. For example, this may reflect `locatedAt` or `manufacturedAt` relations. | Yes | string |
| targetGroupPath | path | Path of target group | Yes | string |

**Responses**

| Code | Description |
| ---- | ----------- |
| 204 | successful operation |
| 400 |  |
| 404 |  |

##### ***DELETE***
**Summary:** Removes a group from an associated group

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| sourceGroupPath | path | Path of source group | Yes | string |
| relationship | path | The relationship between the groups. For example, this may reflect `locatedAt` or `manufacturedAt` relations. | Yes | string |
| targetGroupPath | path | Path of target group | Yes | string |

**Responses**

| Code | Description |
| ---- | ----------- |
| 204 | successful operation |
| 400 |  |
| 404 |  |

### /profiles/device/{templateId}
---
##### ***POST***
**Summary:** Adds a new device profile for a specific template.

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| templateId | path | ID of the device template | Yes | string |
| body | body | Device Profile to add to the asset library | Yes | [DeviceProfile](#deviceprofile) |

**Responses**

| Code | Description |
| ---- | ----------- |
| 201 |  |
| 400 |  |

##### ***GET***
**Summary:** Return all device profiles for a specific template

**Description:** ReturnsReturn all device profiles for a specific template

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| templateId | path | ID of the device template | Yes | string |

**Responses**

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 200 | successful operation | [DeviceProfileList](#deviceprofilelist) |
| 404 |  |  |

### /profiles/device/{templateId}/{profileId}
---
##### ***GET***
**Summary:** Retrieve a device profile

**Description:** Returns a single device profile

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| templateId | path | ID of the device template | Yes | string |
| profileId | path | ID of the profile | Yes | string |

**Responses**

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 200 | successful operation | [DeviceProfile](#deviceprofile) |
| 404 |  |  |

##### ***DELETE***
**Summary:** Delete a specific device profile

**Description:** Delete a specific device profile

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| templateId | path | ID of the device template | Yes | string |
| profileId | path | ID of the profile | Yes | string |

**Responses**

| Code | Description |
| ---- | ----------- |
| 204 | successful operation |
| 404 |  |

##### ***PATCH***
**Summary:** Update an existing device profile.

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| templateId | path | ID of the device template | Yes | string |
| profileId | path | ID of the profile | Yes | string |
| body | body | Profile that needs to be updated | Yes | [DeviceProfile](#deviceprofile) |

**Responses**

| Code | Description |
| ---- | ----------- |
| 204 | successful operation |
| 400 |  |
| 404 |  |

### /profiles/group/{templateId}
---
##### ***POST***
**Summary:** Adds a new group profile for a specific template.

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| templateId | path | ID of the group template | Yes | string |
| body | body | Group Profile to add to the asset library | Yes | [GroupProfile](#groupprofile) |

**Responses**

| Code | Description |
| ---- | ----------- |
| 201 |  |
| 400 |  |

##### ***GET***
**Summary:** Return all group profiles for a specific template

**Description:** Return all group profiles for a specific template

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| templateId | path | ID of the group template | Yes | string |

**Responses**

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 200 | successful operation | [GroupProfileList](#groupprofilelist) |
| 404 |  |  |

### /profiles/group/{templateId}/{profileId}
---
##### ***GET***
**Summary:** Retrieve a group profile

**Description:** Returns a single group profile

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| templateId | path | ID of the group template | Yes | string |
| profileId | path | ID of the profile | Yes | string |

**Responses**

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 200 | successful operation | [GroupProfile](#groupprofile) |
| 404 |  |  |

##### ***DELETE***
**Summary:** Delete a specific group profile

**Description:** Delete a specific group profile

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| templateId | path | ID of the group template | Yes | string |
| profileId | path | ID of the profile | Yes | string |

**Responses**

| Code | Description |
| ---- | ----------- |
| 204 | successful operation |
| 404 |  |

##### ***PATCH***
**Summary:** Update an existing group profile.

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| templateId | path | ID of the group template | Yes | string |
| profileId | path | ID of the profile | Yes | string |
| body | body | Profile that needs to be updated | Yes | [GroupProfile](#groupprofile) |

**Responses**

| Code | Description |
| ---- | ----------- |
| 204 | successful operation |
| 400 |  |
| 404 |  |

### /search
---
##### ***GET***
**Summary:** Search for groups and devices.

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| type | query | Type of group/device to filter.  This can be the high level `group` or `device`, as well as any custom group or device template that may have been registered. | No | [ string ] |
| ancestorGroupPath | query | The path of a common ancestor group to filter results by. | No | string |
| eq | query | Filter an attribute based on an exact match. E.g. `?eq=attributes.firmwareVersion:ABC123` | No | [ string ] |
| neq | query | Filter by an attribute based on not matching. E.g. `?neq=attributes.firmwareVersion:ABC123` | No | [ string ] |
| lt | query | Filter an attribute based on having a value less than. E.g. `?lt=attributes.deploymentId:3` | No | [ number ] |
| lte | query | Filter an attribute based on having a value less than or equal to. E.g. `?lte=attributes.deploymentId:3` | No | [ number ] |
| gt | query | Filter an attribute based on having a value greater than. E.g. `?gt=attributes.deploymentId:3` | No | [ number ] |
| gte | query | Filter an attribute based on having a value greater than or equal to. E.g. `?gte=attributes.deploymentId:3` | No | [ number ] |
| startsWith | query | Filter by an attribute based on starting with specific text. E.g. `?startsWith=attributes.model:MOD123` | No | [ string ] |
| endsWith | query | NOT IMPLEMENTED!  Filter by an attribute based on ending with specific text. E.g. `?endsWith=attributes.model:MOD123` | No | [ string ] |
| contains | query | NOT IMPLEMENTED!  Filter by an attribute based on containing specific text. E.g. `?contains=attributes.model:MOD123` | No | [ string ] |
| summarize | query | Summarize the search results by providing a total, instead of returning the results themselves. | No | boolean |
| offset | query | The index to start paginated results from | No | integer |
| count | query | The maximum number of results to return | No | integer |

**Responses**

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 200 | successful operation | [ [SearchResults](#searchresults) ] |
| 400 |  |  |
| 404 |  |  |

### /policies
---
##### ***POST***
**Summary:** Creates a new `Policy`, and applies it to the provided `Groups`.

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| body | body | Policy to create. | Yes | [Policy](#policy) |

**Responses**

| Code | Description |
| ---- | ----------- |
| 201 |  |
| 400 |  |

##### ***GET***
**Summary:** List policies, optionally filtered by policy type.

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| type | query | Policy type to refilterturn | Yes | string |

**Responses**

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 200 | successful operation | [ [PolicyList](#policylist) ] |
| 400 |  |  |
| 404 |  |  |

### /policies/inherited
---
##### ***GET***
**Summary:** Returns all inherited `Policies` for a `Device` or set of `Groups` where the `Device`/`Groups` are associated with all the hierarchies that the `Policy` applies to.  Either `deviceId` or `groupPath` must be provided.

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| deviceId | query | ID of device to list policies | No | string |
| groupPath | query | Path of groups to list policies | No | [ string ] |
| type | query | Policy type to return | Yes | string |

**Responses**

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 200 | successful operation | [ [PolicyList](#policylist) ] |
| 400 |  |  |
| 404 |  |  |

### /policies/{policyId}
---
##### ***PATCH***
**Summary:** Update the attributes of an existing policy.

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| policyId | path | ID of policy | Yes | string |
| body | body | Policy that needs to be updated | Yes | [Policy](#policy) |

**Responses**

| Code | Description |
| ---- | ----------- |
| 204 | successful operation |
| 400 |  |
| 404 |  |

##### ***DELETE***
**Summary:** Delete an existing policy.

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| policyId | path | ID of policy | Yes | string |

**Responses**

| Code | Description |
| ---- | ----------- |
| 204 | successful operation |
| 400 |  |
| 404 |  |

##### ***GET***
**Summary:** Retrieve a specific policy.

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| policyId | path | ID of policy | Yes | string |

**Responses**

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 200 | successful operation | [ [Policy](#policy) ] |
| 400 |  |  |
| 404 |  |  |

### Models
---

### Entity  

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| category | string | Category of entity. | No |

### Device  

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| Device |  |  |  |

### DeviceProfile  

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| DeviceProfile |  |  |  |

### Group  

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| Group |  |  |  |

### GroupProfile  

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| GroupProfile |  |  |  |

### BulkDevices  

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| devices | [ [Device](#device) ] |  | No |

### BulkGroups  

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| groups | [ [Group](#group) ] |  | No |

### GroupList  

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| results | [ [Group](#group) ] |  | No |
| pagination | object |  | No |
| total | number | Total number of search results.  Only returned by the search API's when `summarize` is set to true. | No |

### DeviceList  

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| results | [ [Device](#device) ] |  | No |
| pagination | object |  | No |
| total | number | Total number of search results.  Only returned by the search API's when `summarize` is set to true. | No |

### DeviceProfileList  

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| results | [ [DeviceProfile](#deviceprofile) ] |  | No |
| pagination | object |  | No |

### GroupProfileList  

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| results | [ [GroupProfile](#groupprofile) ] |  | No |
| pagination | object |  | No |

### SearchResults  

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| results | [ [Entity](#entity) ] |  | No |

### TemplateInfo  

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| templateId | string | Unique ID of template | No |
| category | string | Category of template | No |
| schema | object |  | No |

### TemplateDefinition  

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| properties | object | Map of allowed properties (string, number, boolean and datetime types allowed only) | No |
| required | [ string ] | List of required properties | No |
| relations | object |  | No |
| messagePayload | [MessagePayloadDefinition](#messagepayloaddefinition) | Message payload definition | No |

### Policy  

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| policyId | string | unique ID of policy | No |
| type | string | type of policy | No |
| description | string | description of policy | No |
| appliesTo | [ string ] | the paths of the group that this policy applies to | No |
| document | string | the policy document (e.g. a provisioning template) | No |

### PolicyList  

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| policies | [ [Policy](#policy) ] | a list of policies | No |
| pagination | object |  | No |

### MessagePayloadDefinition  

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| timeStampAttributeName | string | Name of time stamp attribute in message payload | No |
| properties | object | Map of defined message payload properties, where the key represents the attribtue name, and the value reprents the attribute display name and type. | No |
| required | [ string ] | List of required properties | No |
| periodicFrequency | number | No. seconds that a telemtry should be broadcast from the device | No |

### Error  

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| message | string |  | No |