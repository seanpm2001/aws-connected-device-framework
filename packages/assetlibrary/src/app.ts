/*-------------------------------------------------------------------------------
# Copyright (c) 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
#
# This source code is subject to the terms found in the AWS Enterprise Customer Agreement.
#-------------------------------------------------------------------------------*/
import 'reflect-metadata';
import { container } from './di/inversify.config';
import { InversifyExpressServer } from 'inversify-express-utils';
import * as bodyParser from 'body-parser';
import {logger} from './utils/logger';
import config from 'config';
import {Application, Request, Response, NextFunction} from 'express';

const CDF_V1_TYPE = 'application/vnd.aws-cdf-v1.0+json';
const corsAllowedOrigin = config.get('cors.origin') as string;

// Start the server
const server = new InversifyExpressServer(container);

server.setConfig((app:Application) => {
  // only process requests with the correct versioned content type
  app.use(bodyParser.json({ type: CDF_V1_TYPE }));

  // set the versioned content type for all responses, send CORS origin header
  app.use( (__:Request,res:Response,next:NextFunction)=> {
    res.setHeader('Content-Type', CDF_V1_TYPE);
    if (corsAllowedOrigin !== null && corsAllowedOrigin !== '') {
      res.setHeader('Access-Control-Allow-Origin', corsAllowedOrigin);
    }
    next();
  });
});

export const serverInstance:Application = server.build();
serverInstance.listen(3000);

logger.info('Server started on port 3000 :)');
