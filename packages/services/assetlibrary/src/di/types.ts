/*-------------------------------------------------------------------------------
# Copyright (c) 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
#
# This source code is subject to the terms found in the AWS Enterprise Customer Agreement.
#-------------------------------------------------------------------------------*/
export const TYPES = {

    TypesService: Symbol.for('TypesService'),
    TypesDao: Symbol.for('TypesDao'),

    SchemaValidatorService: Symbol.for('SchemaValidatorService'),

    GroupsService: Symbol.for('GroupsService'),
    GroupsDao: Symbol.for('GroupsDao'),
    GroupsAssembler: Symbol.for('GroupsAssembler'),

    DevicesService: Symbol.for('DevicesService'),
    DevicesDao: Symbol.for('DevicesDao'),
    DevicesAssembler: Symbol.for('DevicesAssembler'),

    SearchService: Symbol.for('SearchService'),
    SearchDao: Symbol.for('SearchDao'),
    SearchAssembler: Symbol.for('SearchAssembler'),

    PoliciesService: Symbol.for('PoliciesService'),
    PoliciesDao: Symbol.for('PoliciesDao'),
    PoliciesAssembler: Symbol.for('PoliciesAssembler'),

    ProfilesService: Symbol.for('ProfilesService'),
    ProfilesDao: Symbol.for('ProfilesDao'),
    ProfilesAssembler: Symbol.for('ProfilesAssembler'),

    NodeAssembler: Symbol.for('NodeAssembler'),

    EventEmitter: Symbol.for('EventEmitter'),

    InitService: Symbol.for('InitService'),
    InitDao: Symbol.for('InitDao'),

    Controller: Symbol.for('Controller'),

    HttpHeaderUtils: Symbol.for('HttpHeaderUtils'),

    GraphTraversalSource: Symbol.for('GraphTraversalSource'),
    GraphTraversalSourceFactory: Symbol.for('Factory<GraphTraversalSource>'),

    IotData: Symbol.for('IotData'),
    IotDataFactory: Symbol.for('Factory<IotData>'),

    Iot: Symbol.for('Iot'),
    IotFactory: Symbol.for('Factory<Iot>')
};
