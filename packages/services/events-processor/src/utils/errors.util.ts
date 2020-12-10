/*-------------------------------------------------------------------------------
# Copyright (c) 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
#
# This source code is subject to the terms found in the AWS Enterprise Customer Agreement.
#-------------------------------------------------------------------------------*/
import { Response } from 'express';
import { logger } from './logger.util';

export function handleError(e:Error, res:Response): void {
    logger.error(`errors.util handleError: in: ${e}`);

    if (e.name === 'ArgumentError' || e.message === 'UNSUPPORTED_TARGET_TYPE') {
        res.status(400).json({error: e.message}).end();
    } else if (e.message?.endsWith('NOT_FOUND')) {
        res.status(404).json({error: 'Item not found'}).end();
    } else if (e.name==='ResourceNotFoundException') {
        res.status(404).json({error: e.message}).end();
    } else if (e.name === 'ConditionalCheckFailedException' || e.name === 'ResourceAlreadyExistsException') {
        res.status(409).json({error: 'Item already exists'}).end();
    } else if (e.message === 'SUBSCRIPTION_FOR_USER_PRINCIPAL_ALREADY_EXISTS') {
        res.status(409).json({error: 'A subscription for this event / user / principal already exists'}).end();
    } else if (e.message === 'NOT_SUPPORTED') {
        res.status(415).json({error: 'Requested action not supported for the requested API version'}).end();
    } else if (e.message==='NOT_IMPLEMENTED' ) {
        res.status(501).json({error: 'TODO:  Not yet implemented'}).end();
    } else {
        res.status(500).json({error: e.message}).end();
    }

    logger.error(`errors.util handleError: exit: ${res.status}`);
}
