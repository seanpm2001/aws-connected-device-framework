/*-------------------------------------------------------------------------------
# Copyright (c) 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
#
# This source code is subject to the terms found in the AWS Enterprise Customer Agreement.
#-------------------------------------------------------------------------------*/
import 'reflect-metadata';
import { setDefaultTimeout, When, TableDefinition, Then} from 'cucumber';
import { Device10Resource, DevicesService, BulkDevicesResource } from '@cdf/assetlibrary-client';
import { fail } from 'assert';

import chai_string = require('chai-string');
import {expect, use} from 'chai';
import { AUTHORIZATION_TOKEN } from '../common/common.steps';
import { ASSTLIBRARY_CLIENT_TYPES } from '@cdf/assetlibrary-client/dist';
import { Dictionary } from '@cdf/lambda-invoke';
import { container } from '../../di/inversify.config';
use(chai_string);

/*
    Cucumber describes current scenario context as “World”. It can be used to store the state of the scenario
    context (you can also define helper methods in it). World can be access by using the this keyword inside
    step functions (that’s why it’s not recommended to use arrow functions).
 */
// tslint:disable:no-invalid-this

setDefaultTimeout(10 * 1000);

const deviceService:DevicesService = container.get(ASSTLIBRARY_CLIENT_TYPES.DevicesService);

function getAdditionalHeaders(world:unknown) : Dictionary {
    const authCode= world[AUTHORIZATION_TOKEN];
    const headers =  {
        Authorization: authCode
    };
    return headers;
}

async function bulkRegisterDevice (world:unknown, devicesToCreate:Device10Resource[]) {
    const headers = getAdditionalHeaders(world);
    const bulkDeviceCreateBody: BulkDevicesResource = { devices: devicesToCreate };
    await deviceService.bulkCreateDevice(bulkDeviceCreateBody, undefined, headers);
}

function parseBulkDeviceTable(d:TableDefinition): Device10Resource[] {
    const devices: Device10Resource[] = [];
    const deviceRows = d.rows();
    deviceRows.forEach((dr) => {
        devices.push({
            deviceId: dr[0],
            templateId: dr[1],
            description: dr[2],
            awsIotThingArn: dr[3],
            attributes: JSON.parse(dr[4]),
            groups: JSON.parse(dr[5])
        });
    });
    return devices;
}

When('I bulk create the following devices', async function (data:TableDefinition) {
    const devices = parseBulkDeviceTable(data);
    await bulkRegisterDevice(this, devices);
});

Then('a bulk get of {string} returns the following devices', async function (devicesToGet: string, data:TableDefinition) {
    const devices = parseBulkDeviceTable(data);
    const devicesReceived = await deviceService.getDevicesByID(devicesToGet.split(','));

    if (devices.length === 0) {
        expect(devicesReceived.results).to.be.empty;
    } else {
        expect(devicesReceived.results.length).to.equal(devices.length);
        devices.forEach((d) => {
            const dReceived = devicesReceived.results.filter((dr) => { return dr.deviceId === d.deviceId.toLowerCase() });
    
            if (dReceived.length !== 1) {
                fail(`${d.deviceId} not found in AssetLibrary`);
            }
            expect(dReceived[0].deviceId).to.equal(d.deviceId.toLowerCase());
            expect(dReceived[0].templateId).to.equal(d.templateId.toLowerCase());
            expect(dReceived[0].description).to.equal(d.description);
            expect(dReceived[0].awsIotThingArn).to.equal(d.awsIotThingArn);
            expect(dReceived[0].state).to.equal('unprovisioned');
            expect(dReceived[0].attributes).to.deep.equal(d.attributes);
        });
    }
});