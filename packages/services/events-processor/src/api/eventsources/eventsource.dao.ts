/*-------------------------------------------------------------------------------
# Copyright (c) 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
#
# This source code is subject to the terms found in the AWS Enterprise Customer Agreement.
#-------------------------------------------------------------------------------*/
import { injectable, inject } from 'inversify';
import {logger} from '../../utils/logger';
import { TYPES } from '../../di/types';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { EventSourceItem } from './eventsource.models';
import { PkType, createDelimitedAttribute, expandDelimitedAttribute } from '../../utils/pkUtils';

@injectable()
export class EventSourceDao {

    private _dc: AWS.DynamoDB.DocumentClient;
    private _cachedDc: AWS.DynamoDB.DocumentClient;

    public constructor(
        @inject('aws.dynamoDb.tables.eventConfig.name') private eventConfigTable:string,
        @inject('aws.dynamoDb.tables.eventConfig.gsi1') private eventConfigGSI1:string,
	    @inject(TYPES.DocumentClientFactory) documentClientFactory: () => AWS.DynamoDB.DocumentClient,
	    @inject(TYPES.CachableDocumentClientFactory) cachableDocumentClientFactory: () => AWS.DynamoDB.DocumentClient
    ) {
        this._dc = documentClientFactory();
        this._cachedDc = cachableDocumentClientFactory();
    }

    /**
     * Creates the EventSource DynamoDB items (pk='ES-$(eventSourceId}, sk='ES-$(eventSourceId}' and sk='type').
     * @param es
     */
    public async create(es:EventSourceItem,): Promise<void> {
        logger.debug(`eventsource.dao create: in: es:${JSON.stringify(es)}`);

        const params:DocumentClient.BatchWriteItemInput = {
            RequestItems: {
            }
        };

        const eventSourceDbId = createDelimitedAttribute(PkType.EventSource, es.id);

        const eventSourceCreate = {
            PutRequest: {
                Item: {
                    pk: eventSourceDbId,
                    sk: eventSourceDbId,
                    sourceType: es.sourceType,
                    principal: es.principal,
                    enabled: es.enabled,
                    tableName: es.tableName
                }
            }
        };

        const typeCreate = {
            PutRequest: {
                Item: {
                    pk: eventSourceDbId,
                    sk: createDelimitedAttribute(PkType.Type, PkType.EventSource),
                    gsi1Sort: createDelimitedAttribute(PkType.EventSource, es.enabled, es.id),
                }
            }
        };

        params.RequestItems[this.eventConfigTable]=[eventSourceCreate, typeCreate];

        logger.debug(`eventsource.dao create: params:${JSON.stringify(params)}`);
        await this._dc.batchWrite(params).promise();

        logger.debug(`events.dao create: exit:`);
    }

    public async list(): Promise<EventSourceItem[]> {
        logger.debug('eventsource.dao get: list:');

        const params:DocumentClient.QueryInput = {
            TableName: this.eventConfigTable,
            IndexName: this.eventConfigGSI1,
            KeyConditionExpression: `#sk = :sk`,
            ExpressionAttributeNames: {
                '#sk': 'sk'
            },
            ExpressionAttributeValues: {
                ':sk': createDelimitedAttribute(PkType.Type, PkType.EventSource)
            }

        };

        logger.debug(`eventsource.dao list: QueryInput: ${JSON.stringify(params)}`);

        const results = await this._cachedDc.query(params).promise();
        if (results.Items===undefined) {
            logger.debug('eventsource.dao list: exit: undefined');
            return undefined;
        }

        logger.debug(`query result: ${JSON.stringify(results)}`);

        const response:EventSourceItem[]=[];
        for(const i of results.Items) {
            response.push( this.assembleItem(i));
        }

        logger.debug(`eventsource.dao list: exit: response:${JSON.stringify(response)}`);
        return response;
    }

    private assembleItem(attrs:DocumentClient.AttributeMap) {
        const r:EventSourceItem = {
            id: expandDelimitedAttribute(attrs['pk'])[1],
            sourceType: attrs['sourceType'],
            principal: attrs['principal'],
            enabled: attrs['enabled'],
            tableName: attrs['tableName']
        } ;
        return r;
    }

    public async get(eventSourceId:string): Promise<EventSourceItem> {
        logger.debug(`eventsource.dao get: in: eventSourceId:${eventSourceId}`);

        const params:DocumentClient.QueryInput = {
            TableName: this.eventConfigTable,
            KeyConditionExpression: `#pk = :id AND #sk = :id`,
            ExpressionAttributeNames: {
                '#pk': 'pk',
                '#sk': 'sk'
            },
            ExpressionAttributeValues: {
                ':id': createDelimitedAttribute(PkType.EventSource, eventSourceId)
            }

        };

        logger.debug(`eventsource.dao get: QueryInput: ${JSON.stringify(params)}`);

        const results = await this._cachedDc.query(params).promise();
        if (results.Items===undefined || results.Items.length===0) {
            logger.debug('eventsource.dao get: exit: undefined');
            return undefined;
        }

        logger.debug(`query result: ${JSON.stringify(results)}`);

        const response:EventSourceItem = this.assembleItem(results.Items[0]);

        logger.debug(`eventsource.dao get: exit: response:${JSON.stringify(response)}`);
        return response;
    }

    public async delete(eventSourceId:string): Promise<void> {
        logger.debug(`eventsource.dao delete: in: eventSourceId:${eventSourceId}`);

        // start to build up delete requests
        const deleteParams:DocumentClient.BatchWriteItemInput = {
            RequestItems: {}
        };
        deleteParams.RequestItems[this.eventConfigTable]=[];

        // find the event source record to be deleted
        const queryParams:DocumentClient.QueryInput = {
            TableName: this.eventConfigTable,
            KeyConditionExpression: `#hash=:hash`,
            ExpressionAttributeNames: {
                '#hash': 'pk'
            },
            ExpressionAttributeValues: {
                ':hash': createDelimitedAttribute(PkType.EventSource, eventSourceId)
            }
        };

        const results = await this._cachedDc.query(queryParams).promise();

        // if found, add to the list to be deleted
        if (results.Items!==undefined && results.Items.length>0) {
            for (const item of results.Items) {
                deleteParams.RequestItems[this.eventConfigTable].push({
                    DeleteRequest: {
                        Key: {
                            pk: item.pk,
                            sk: item.sk
                        }
                    }
                });
            }
        }

        await this._dc.batchWrite(deleteParams).promise();

        logger.debug(`eventsource.dao delete: exit:`);
    }
}
