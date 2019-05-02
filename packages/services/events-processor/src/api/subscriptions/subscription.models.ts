import { EventConditions } from '../events/event.models';

/*-------------------------------------------------------------------------------
# Copyright (c) 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
#
# This source code is subject to the terms found in the AWS Enterprise Customer Agreement.
#-------------------------------------------------------------------------------*/

export interface SubscriptionResource {
    id: string;

    principalValue?: string;
    ruleParameterValues?: { [key: string] : string};
    event?: {
        id: string;
        name?: string;
        conditions?: EventConditions;
    };
    user?: {
        id: string;
    };

    targets?: {
        email?: EmailSubscriptionConfig;
        sms?: SMSSubscriptionConfig;
        mqtt?: MQTTSubscriptionConfig;
    };

    enabled?: boolean;
    alerted?: boolean;
}

export type SubscriptionTargets = {
    email?: EmailSubscriptionConfig;
    sms?: SMSSubscriptionConfig;
    mqtt?: MQTTSubscriptionConfig;
};

export type EmailSubscriptionConfig = {
    address:string
};

export type SMSSubscriptionConfig = {
    phoneNumber:string
};

export type MQTTSubscriptionConfig = {
    topic:string
};

export interface SubscriptionResourceList {
    results: SubscriptionResource[];
    pagination?: {
        offset: {
            eventId: string,
            subscriptionId: string
        }
    };
}

export class SubscriptionItem {
    id: string;

    principalValue?: string;
    ruleParameterValues?: { [key: string] : string};
    event?: {
        id: string;
        name: string;
        conditions: EventConditions;
    };
    eventSource?: {
        id: string;
        principal: string;
    };
    user?: {
        id: string;
    };

    sns?: {
        topicArn:string;
    };

    targets?: {
        email?: EmailSubscriptionConfig;
        sms?: SMSSubscriptionConfig;
        mqtt?: MQTTSubscriptionConfig;
    };

    enabled?: boolean;
    alerted?: boolean;

}
