/*-------------------------------------------------------------------------------
# Copyright (c) 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
#
# This source code is subject to the terms found in the AWS Enterprise Customer Agreement.
#-------------------------------------------------------------------------------*/
import { process, structure } from 'gremlin';
import { injectable, inject } from 'inversify';
import {logger} from '../utils/logger';
import {TYPES} from '../di/types';
import {Node} from '../data/node';
import { FullAssembler, NodeDto } from '../data/full.assembler';
import { ModelAttributeValue, DirectionStringToArrayMap } from '../data/model';
import { BaseDaoFull } from '../data/base.full.dao';

const __ = process.statics;

@injectable()
export class DevicesDaoFull extends BaseDaoFull {

    public constructor(
        @inject('neptuneUrl') neptuneUrl: string,
        @inject(TYPES.FullAssembler) private fullAssembler: FullAssembler,
	    @inject(TYPES.GraphSourceFactory) graphSourceFactory: () => structure.Graph
    ) {
        super(neptuneUrl, graphSourceFactory);
    }

    public async listRelated(deviceId: string, relationship: string, direction:string, template:string, filter:{ [key: string] : ModelAttributeValue}, offset:number, count:number) : Promise<Node> {
        logger.debug(`devices.full.dao listRelated: in: deviceId:${deviceId}, relationship:${relationship}, direction:${direction}, template:${template}, filter:${JSON.stringify(filter)}, offset:${offset}, count:${count}`);

        const id = `device___${deviceId}`;

        // build the queries for returning the info we need to assmeble related devices
        let connectedEdges;
        let connectedVertices;
        if (direction==='in') {
            connectedEdges = __.inE();
            connectedVertices = __.in_();
        } else if (direction==='out') {
            connectedEdges = __.outE();
            connectedVertices = __.out();
        } else {
            connectedEdges = __.bothE();
            connectedVertices = __.both();
        }
        if (relationship!=='*') {
            connectedEdges.hasLabel(relationship);
            connectedVertices.hasLabel(template);
        }
        connectedEdges.where(__.otherV().hasLabel(template)).valueMap().with_(process.withOptions.tokens).fold();
        connectedVertices.dedup().valueMap().with_(process.withOptions.tokens).fold();

        // assemble the main query
        let results;
        try {
            const traversal = super.getTraversalSource().V(id).as('device');

            if (filter!==undefined && filter!==null) {
                Object.keys(filter).forEach(k=> {
                    traversal.has(k, filter[k]);
                });
            }

            traversal.project('object','pathsIn','pathsOut','Es','Vs').
                by(__.valueMap().with_(process.withOptions.tokens)).
                by(__.inE().otherV().path().by(process.t.id).fold()).
                by(__.outE().otherV().path().by(process.t.id).fold()).
                by(connectedEdges).
                by(connectedVertices);

            // apply pagination
            if (offset!==undefined && count!==undefined) {
                // note: workaround for weird typescript issue. even though offset/count are declared as numbers
                // throughout, they are being interpreted as strings within gremlin, therefore need to force to int beforehand
                const offsetAsInt = parseInt(offset.toString(),0);
                const countAsInt = parseInt(count.toString(),0);
                traversal.range(offsetAsInt, offsetAsInt + countAsInt);
            }

            // execute and retrieve the results
            // logger.debug(`devices.full.dao listRelatedDevices: traverser: ${traversal}`);
            results = await traversal.toList();
            logger.debug(`devices.full.dao listRelatedDevices: results: ${JSON.stringify(results)}`);
        } finally {
            super.closeTraversalSource();
        }

        if (results===undefined || results.length===0) {
            logger.debug(`devices.full.dao listRelatedDevices: exit: node: undefined`);
            return undefined;
        }

        // there should be only one result as its by deviceId, but we still process as an array so we can reuse the existing assemble methods
        const nodes: Node[] = [];
        for(const result of results) {
            const r = JSON.parse(JSON.stringify(result)) as NodeDto;

            // assemble the device
            let node: Node;
            if (r) {
                node = this.fullAssembler.assembleDeviceNode(r.object);
                this.fullAssembler.assembleAssociations(node, r);
            }
            nodes.push(node);
        }

        logger.debug(`devices.full.dao listRelatedDevices: exit: node: ${JSON.stringify(nodes[0])}`);
        return nodes[0];

    }

    public async get(deviceIds:string[], expandComponents:boolean, attributes:string[], includeGroups:boolean): Promise<Node[]> {

        logger.debug(`device.full.dao get: in: deviceIds:${deviceIds}, expandComponents:${expandComponents}, attributes:${attributes}, includeGroups:${includeGroups}`);

        const ids:string[] = deviceIds.map(d=> `device___${d}`);

        // build the queries for returning the info we need to assemble groups and/or component relationships
        let connectedEdges;
        let connectedVertices;
        if (expandComponents===true && includeGroups===true) {
            connectedEdges = __.bothE().valueMap().with_(process.withOptions.tokens).fold();
            connectedVertices = __.both().dedup().valueMap().with_(process.withOptions.tokens).fold();
        } else if (expandComponents===true && includeGroups===false) {
            connectedEdges = __.bothE().hasLabel('component_of').valueMap().with_(process.withOptions.tokens).fold();
            connectedVertices = __.both().hasLabel('component_of').dedup().valueMap().with_(process.withOptions.tokens).fold();
        } else if (expandComponents===false && includeGroups===true) {
            connectedEdges = __.bothE().not(__.hasLabel('component_of')).valueMap().with_(process.withOptions.tokens).fold();
            connectedVertices = __.both().not(__.hasLabel('component_of')).dedup().valueMap().with_(process.withOptions.tokens).fold();
        }

        // build the query for optionally filtering the returned attributes
        const deviceValueMap = (attributes===undefined) ?
            __.valueMap().with_(process.withOptions.tokens):
            __.valueMap('state', 'deviceId', ...attributes).with_(process.withOptions.tokens);

        // assemble the main query
        let results;
        try {
            const traverser = super.getTraversalSource().V(ids).as('device');
            if (connectedEdges!==undefined) {
                traverser.project('object','pathsIn','pathsOut','Es','Vs').
                    by(deviceValueMap).
                    by(__.inE().otherV().path().by(process.t.id).fold()).
                    by(__.outE().otherV().path().by(process.t.id).fold()).
                    by(connectedEdges).
                    by(connectedVertices);
            } else {
                traverser.project('object','paths').
                    by(deviceValueMap).
                    by(__.bothE().otherV().path().by(process.t.id).fold());
            }

            // execute and retrieve the results
            results = await traverser.toList();
            logger.debug(`device.full.dao get: query: ${traverser.toString()}`);
        } finally {
            super.closeTraversalSource();
        }

        if (results===undefined || results.length===0) {
            logger.debug(`device.full.dao get: exit: node: undefined`);
            return undefined;
        }
        logger.debug(`device.full.dao get: results: ${JSON.stringify(results)}`);

        const nodes: Node[] = [];
        for(const result of results) {
            const r = JSON.parse(JSON.stringify(result)) as NodeDto;

            // assemble the device
            let node: Node;
            if (r) {
                node = this.fullAssembler.assembleDeviceNode(r.object);
                this.fullAssembler.assembleAssociations(node, r);
            }
            nodes.push(node);
        }

        logger.debug(`device.full.dao get: exit: nodes: ${JSON.stringify(nodes)}`);
        return nodes;
    }

    public async getLabels(deviceId: string): Promise<string[]> {
        logger.debug(`devices.full.dao getLabels: in: deviceId: ${deviceId}`);

        const id = 'device___' + deviceId;

        let labelResults;
        try {
            labelResults = await super.getTraversalSource().V(id).label().toList();
        } finally {
            super.closeTraversalSource();
        }

        if (labelResults===undefined || labelResults.length===0) {
            logger.debug('devices.full.dao getLabels: exit: labels:undefined');
            return undefined;
        } else {
            const labels:string[] = JSON.parse(JSON.stringify(labelResults)) as string[];
            if (labels.length===1) {
                // all devices/groups should have 2 labels
                // if only 1 is returned it is an older version of the Neptune engine
                // which returns labels as a concatinated string (label1::label2)
                // attempt to be compatable with this
                const splitLabels:string[] = labels[0].split('::');
                if (splitLabels.length < 2) {
                    logger.error(`devices.full.dao getLabels: device ${deviceId} does not have correct labels`);
                    throw new Error('INVALID_LABELS');
                }
                logger.debug(`devices.full.dao getLabels: exit: labels: ${labels}`);
                return labels;
            } else {
                logger.debug(`devices.full.dao getLabels: exit: labels: ${labels}`);
                return labels;
            }
        }
    }

    public async create(n:Node, groups:DirectionStringToArrayMap, devices:DirectionStringToArrayMap, components:Node[]): Promise<string> {
        logger.debug(`devices.full.dao create: in: n:${JSON.stringify(n)}, groups:${groups}, devices:${JSON.stringify(devices)}, components:${components}`);

        const id = `device___${n.attributes['deviceId']}`;
        const labels = n.types.join('::');

        /*  create the device  */
        try {
            const traversal = super.getTraversalSource().addV(labels).
                property(process.t.id, id);

            /*  set all the device properties  */
            for (const key of Object.keys(n.attributes)) {
                if (n.attributes[key]!==undefined) {
                    traversal.property(process.cardinality.single, key, n.attributes[key]);
                }
            }
            traversal.as('device');

            /*  associate with the groups  */
            if (groups) {
                if (groups.in) {
                    Object.keys(groups.in).forEach(rel=> {
                        groups.in[rel].forEach(v=> {
                            const groupId = `group___${v}`;
                            traversal.V(groupId).addE(rel).to('device');
                        });
                    });
                }
                if (groups.out) {
                    Object.keys(groups.out).forEach(rel=> {
                        groups.out[rel].forEach(v=> {
                            const groupId = `group___${v}`;
                            traversal.V(groupId).addE(rel).from_('device');
                        });
                    });
                }
            }

            /*  associate with the devices  */
            if (devices) {
                if (devices.in) {
                    Object.keys(devices.in).forEach(rel=> {
                        devices.in[rel].forEach(v=> {
                            const deviceId = `device___${v}`;
                            traversal.V(deviceId).addE(rel).to('device');
                        });
                    });
                }
                if (devices.out) {
                    Object.keys(devices.out).forEach(rel=> {
                        devices.out[rel].forEach(v=> {
                            const deviceId = `device___${v}`;
                            traversal.V(deviceId).addE(rel).from_('device');
                        });
                    });
                }
            }

            /*  create the components  */
            if (components) {
                components.forEach(c=> {
                    const componentId = (c.attributes['deviceId'] as string);
                    const componentDbId = `${id}___${componentId}`;
                    const componentLabels = c.types.join('::');

                    traversal.addV(componentLabels).
                        property(process.t.id, componentDbId);

                    for (const key of Object.keys(c.attributes)) {
                        if (c.attributes[key]!==undefined) {
                            traversal.property(process.cardinality.single, key, c.attributes[key]);
                        }
                    }

                    traversal.as(componentId).
                        addE('component_of').from_(componentId).to('device');

                });
            }

            logger.debug(`devices.full.dao create: traversal:${traversal}`);
            await traversal.iterate();
        } finally {
            super.closeTraversalSource();
        }

        logger.debug(`devices.full.dao create: exit: id:${id}`);
        return id;

    }

    public async createComponent(deviceId:string, n:Node): Promise<string> {
        logger.debug(`devices.full.dao createComponent: in: deviceId:${deviceId}, n:${JSON.stringify(n)}`);

        const id = `device___${deviceId}`;
        const componentId = `${id}___${n.attributes['deviceId']}`;
        const labels = n.types.join('::');

        /*  create the component  */
        try {
            const traversal = super.getTraversalSource().addV(labels).
                property(process.t.id, componentId);

            for (const key of Object.keys(n.attributes)) {
                if (n.attributes[key]!==undefined) {
                    traversal.property(process.cardinality.single, key, n.attributes[key]);
                }
            }
            traversal.as('component');

            /*  add to the parent device  */
            traversal.V(id).as('device').
                addE('component_of').from_('component').to('device');

            logger.debug(`devices.full.dao createComponent: traversal:${traversal}`);
            await traversal.iterate();
        } finally {
            super.closeTraversalSource();
        }

        logger.debug(`devices.full.dao createComponent: exit: componentId:${componentId}`);
        return componentId;

    }

    public async update(n: Node): Promise<void> {
        logger.debug(`devices.full.dao update: in: n:${JSON.stringify(n)}`);

        const id = `device___${n.attributes['deviceId']}`;

        try {
            const traversal = super.getTraversalSource().V(id);

            for (const key of Object.keys(n.attributes)) {
                const val = n.attributes[key];
                if (val!==undefined) {
                    if (val===null) {
                        traversal.properties(key).drop();
                    } else {
                        traversal.property(process.cardinality.single, key, val);
                    }
                }
            }

            await traversal.iterate();
        } finally {
            super.closeTraversalSource();
        }

        logger.debug(`devices.full.dao update: exit:`);

    }

    public async delete(deviceId: string): Promise<void> {
        logger.debug(`devices.full.dao delete: in: deviceId:${deviceId}`);

        const id = `device___${deviceId}`;

        try {
            await super.getTraversalSource().V(id).drop().iterate();
        } finally {
            super.closeTraversalSource();
        }

        logger.debug(`devices.full.dao delete: exit`);
    }

    public async attachToGroup(deviceId:string, relationship:string, direction:string, groupPath:string) : Promise<void> {
        logger.debug(`device.full.dao attachToGroup: in: deviceId:${deviceId}, relationship:${relationship}, direction:${direction}, groupPath:${groupPath}`);

        let sourceId:string;
        let targetId:string;

        if (direction==='out') {
            sourceId = `device___${deviceId}`;
            targetId = `group___${groupPath}`;
        } else {
            sourceId = `group___${groupPath}`;
            targetId = `device___${deviceId}`;
        }

        try {
            const result = await super.getTraversalSource().V(targetId).as('target').
                V(sourceId).as('source').addE(relationship).to('target').
                iterate();

            logger.debug(`devices.full.dao attachToGroup: result:${JSON.stringify(result)}`);
        } finally {
            super.closeTraversalSource();
        }

        logger.debug(`devices.full.dao attachToGroup: exit:`);
    }

    public async detachFromGroup(deviceId:string, relationship:string, direction:string, groupPath:string) : Promise<void> {
        logger.debug(`device.full.dao detachFromGroup: in: deviceId:${deviceId}, relationship:${relationship}, direction:${direction}, groupPath:${groupPath}`);

        let sourceId:string;
        let targetId:string;

        if (direction==='out') {
            sourceId = `device___${deviceId}`;
            targetId = `group___${groupPath}`;
        } else {
            sourceId = `group___${groupPath}`;
            targetId = `device___${deviceId}`;
        }

        try {
            const result = await super.getTraversalSource().V(sourceId).as('source').
                outE(relationship).as('edge').
                inV().has(process.t.id, targetId).as('target').
                select('edge').dedup().drop().
                iterate();

            logger.debug(`devices.full.dao detachFromGroup: result:${JSON.stringify(result)}`);
        } finally {
            super.closeTraversalSource();
        }

        logger.debug(`devices.full.dao detachFromGroup: exit:`);
    }

    public async attachToDevice(deviceId:string, relationship:string, direction:string, otherDeviceId:string) : Promise<void> {
        logger.debug(`device.full.dao attachToDevice: in: deviceId:${deviceId}, relationship:${relationship}, direction:${direction}, otherDeviceId:${otherDeviceId}`);

        const source = (direction==='out') ? deviceId : otherDeviceId;
        const target = (direction==='out') ? otherDeviceId : deviceId;

        const sourceId = `device___${source}`;
        const targetId = `device___${target}`;

        try {
            const result = await super.getTraversalSource().V(targetId).as('other').
                V(sourceId).addE(relationship).to('other').
                iterate();

            logger.debug(`devices.full.dao attachToDevice: result:${JSON.stringify(result)}`);
        } finally {
            super.closeTraversalSource();
        }

        logger.debug(`devices.full.dao attachToDevice: exit:`);
    }

    public async detachFromDevice(deviceId:string, relationship:string, direction:string, otherDeviceId:string) : Promise<void> {
        logger.debug(`device.full.dao detachFromDevice: in: deviceId:${deviceId}, relationship:${relationship}, direction:${direction}, otherDeviceId:${otherDeviceId}`);

        const source = (direction==='out') ? deviceId : otherDeviceId;
        const target = (direction==='out') ? otherDeviceId : deviceId;

        const sourceId = `device___${source}`;
        const targetId = `device___${target}`;

        try {
            const result = await super.getTraversalSource().V(sourceId).
                outE(relationship).as('e').
                inV().has(process.t.id, targetId).
                select('e').dedup().drop().
                iterate();

            logger.debug(`devices.full.dao detachFromDevice: result:${JSON.stringify(result)}`);
        } finally {
            super.closeTraversalSource();
        }

        logger.debug(`devices.full.dao detachFromDevice: exit:`);
    }

}
