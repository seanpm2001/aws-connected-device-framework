/*-------------------------------------------------------------------------------
# Copyright (c) 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
#
# This source code is subject to the terms found in the AWS Enterprise Customer Agreement.
#-------------------------------------------------------------------------------*/
const PK_DELIMITER = ':';

export function createDelimitedAttribute(type:PkType, ...items:(string|number|boolean)[]) : string {
    const escapedItems = items.map(i=> {
        if (typeof i === 'string') {
            return escape(i);
        } else {
            return i;
        }
    });
    return  `${delimitedAttributePrefix(type)}${escapedItems.join(PK_DELIMITER)}`;
}

export function createDelimitedAttributePrefix(type:PkType, ...items:(string|number|boolean)[]) : string {
    return `${createDelimitedAttribute(type, ...items)}`;
}

export function expandDelimitedAttribute(value:string) : string[] {
    if (value===null || value===undefined) {
        return undefined;
    }
    const expanded = value.split(PK_DELIMITER);
    return expanded.map(i=> {
        if (typeof i === 'string') {
            return unescape(i);
        } else {
            return i;
        }
    });
}

export function delimitedAttributePrefix(type:PkType) : string {
    return `${type}${PK_DELIMITER}`;
}

export function isPkType(value:string, type:PkType) : boolean {
    return value.startsWith(delimitedAttributePrefix(type));
}

export enum PkType {
    Template='T',
    DeploymentTemplate='DT',
    DeploymentTemplateVersion='DTV',
    TemplateVersion='TV',
    GreengrassGroup='G',
    GreengrassGroupId='GID',
    GreengrassGroupVersion='GV',
    GreengrassDevice='GD',
    GreengrassDeviceTask='GDT',
    Artifact='A',
    Deployment='D',
    BulkDeployment='BD',
    DeviceDeployment='DD',
    DeviceActivation='DA',
    DeviceDeploymentAssociation='DDA',
    DeploymentAssociation='DA'
}
