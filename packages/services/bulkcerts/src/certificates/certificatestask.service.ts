/*-------------------------------------------------------------------------------
# Copyright (c) 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
#
# This source code is subject to the terms found in the AWS Enterprise Customer Agreement.
#-------------------------------------------------------------------------------*/

import { injectable, inject } from 'inversify';
import {logger} from '../utils/logger';
import {v1 as uuid} from 'uuid';
import AWS = require('aws-sdk');
import { TYPES } from '../di/types';
import ow from 'ow';
import { CertificatesTaskDao } from './certificatestask.dao';
import { TaskStatus, CertificateBatchTaskWithChunks, CertificateInfo, CertInfoValidationResult, CommonNameGenerator } from './certificatestask.models';
import { CertificateChunkRequest } from './certificates.models';
import { SNS } from 'aws-sdk';

@injectable()
export class CertificatesTaskService {

    private _sns: AWS.SNS;

    public constructor(@inject('events.request.topic') private requestTopic: string,
                        @inject('deviceCertificateInfo.commonName') private commonName: string,
                        @inject('deviceCertificateInfo.organization') private organization: string,
                        @inject('deviceCertificateInfo.organizationalUnit') private organizationalUnit: string,
                        @inject('deviceCertificateInfo.locality') private locality: string,
                        @inject('deviceCertificateInfo.stateName') private stateName: string,
                        @inject('deviceCertificateInfo.country') private country: string,
                        @inject('deviceCertificateInfo.emailAddress') private emailAddress: string,
                        @inject('deviceCertificateInfo.distinguishedNameQualifier') private distinguishedNameQualifier: string,
                        @inject('defaults.chunkSize') private defaultChunkSize: number,
                        @inject(TYPES.CertificatesTaskDao) private dao: CertificatesTaskDao,
                        @inject(TYPES.SNSFactory) snsFactory: () => AWS.SNS) {
        this._sns  =  snsFactory();
    }

    public async createTask(quantity:number, caAlias:string,certInfo:CertificateInfo) : Promise<string> {
        logger.debug(`certificatestask.service createTask: in: quantity: ${quantity}, caAlias: ${caAlias}`);

        
        ow(caAlias, ow.string.nonEmpty);

        // validate CertInfo
        const validationResult = await this.validateCertInfo(certInfo);
        if (!validationResult.isValid) {
            logger.debug(`certificatestask.service createTask:: exit: validationResult:${JSON.stringify(certInfo)}`)
            const e = new Error(Object.values(validationResult.errors)[0]);
            e.name = Object.keys(validationResult.errors)[0];
            throw e;
        }
        certInfo = await this.constructCommonName(certInfo);
        if (typeof (certInfo['commonName']['quantity']) && certInfo['commonName']['quantity'] >0 ) {
            quantity = certInfo['commonName']['quantity'];
        }
        
        await this.validateCommonName(certInfo);

        ow(quantity, ow.number.greaterThan(0));
        // determine number of chunks
        const remainder = quantity % this.defaultChunkSize;
        const quotient = Math.floor(quantity/this.defaultChunkSize);
        const numberOfChunks = remainder > 0 ? quotient + 1 : quotient;
        logger.debug(`numberOfChunks: ${numberOfChunks}`);

        // generate task ID
        const taskID:string = uuid();

        // capture batch date/time
        const batchDate:number = Date.now();

        // loop over the chunkSize
        for (let i=1; i<=numberOfChunks; ++i) {
            let chunkQuantity = Number(this.defaultChunkSize);
            if (i === numberOfChunks && remainder !== 0) {
                chunkQuantity = remainder;
            }
            await this.dao.saveChunk(taskID, i, chunkQuantity, TaskStatus.PENDING, batchDate);
            await this.fireSNSevent(taskID, i, chunkQuantity, caAlias,certInfo);
        }

        logger.debug(`certificatestask.service createTask: exit: ${taskID}`);
        return taskID;
    }

    /**
     * fire a SNS event to another instance of bulkcerts
     */
    private async fireSNSevent(taskId:string, chunkId:number, quantity:number, caAlias:string,certInfo:CertificateInfo) : Promise<void> {
        logger.debug(`certificatestask.service fireSNSevent: in: taskId:${taskId}, chunkId:${chunkId}, quantity:${quantity}`);

        ow(taskId, ow.string.nonEmpty);
        ow(chunkId, ow.number.greaterThan(0));
        ow(quantity, ow.number.greaterThan(0));

        // Populate certInfo from config file if no arguments have been supplied
        if (typeof certInfo.commonName === 'undefined') {
            certInfo.commonName = {
                generator: CommonNameGenerator.static,
                commonNameStatic: this.commonName
            };
        }
        if (typeof certInfo.commonNameList === 'undefined') {
            certInfo.commonNameList = [];
        }
        
        if (typeof certInfo.organization === 'undefined') {
            certInfo.organization = this.organization;
        }
        if (typeof certInfo.organizationalUnit === 'undefined') {
            certInfo.organizationalUnit = this.organizationalUnit;
        }
        if (typeof certInfo.locality === 'undefined') {
            certInfo.locality = this.locality;
        }
        if (typeof certInfo.stateName === 'undefined') {
            certInfo.stateName = this.stateName;
        }
        if (typeof certInfo.country === 'undefined') {
            certInfo.country = this.country;
        }
        if (typeof certInfo.emailAddress === 'undefined') {
            certInfo.emailAddress = this.emailAddress;
        }
        if (typeof certInfo.distinguishedNameQualifier === 'undefined') {
            certInfo.distinguishedNameQualifier = this.distinguishedNameQualifier;
        }
        if (typeof certInfo.includeCA === 'undefined') {
            certInfo.includeCA = false;
        }

        const msg:CertificateChunkRequest = {
            certInfo:{
                commonName: certInfo.commonName,
                organization: certInfo.organization,
                organizationalUnit: certInfo.organizationalUnit,
                locality: certInfo.locality,
                stateName: certInfo.stateName,
                country: certInfo.country,
                emailAddress: certInfo.emailAddress,
                distinguishedNameQualifier: certInfo.distinguishedNameQualifier,
                includeCA: certInfo.includeCA
            },
            taskId,
            chunkId,
            quantity,
            caAlias
        };
        const params:SNS.Types.PublishInput = {
            Subject: 'CreateChunk',
            Message: JSON.stringify(msg),
            TopicArn: this.requestTopic
        };
        logger.debug(`certificatestask.service fireSNSevent: publishing:${JSON.stringify(params)}`);
        await this._sns.publish(params).promise();
        logger.debug('certificatestask.service fireSNSevent: exit:');
    }

    public async getTask(taskId:string) : Promise<CertificateBatchTaskWithChunks> {
        logger.debug(`certificatestask.service getTask: in: taskId: ${taskId}`);

        ow(taskId, ow.string.nonEmpty);

        const task = await this.dao.getTask(taskId);
        if (task===undefined) {
            throw new Error('NOT_FOUND');
        }

        logger.debug(`certificatestask.service getTask: exit: ${JSON.stringify(task)}`);
        return task;
    }

 private async validateCertInfo(certInfo: CertificateInfo): Promise<CertInfoValidationResult> {
        logger.debug(`certificatestask.service validateCertInfo: in: certInfo:${JSON.stringify(certInfo)}`);
        
        const commonNameRE = /^[0-9A-Fa-f]+$/g;
        // remove any undefined properties from the input document
        const docAsJson = JSON.parse(JSON.stringify(certInfo));
        
        Object.keys(docAsJson).forEach(k => {
            if (docAsJson[k] === undefined) {
                delete docAsJson[k];
            }
            if (k === 'commonName') {
                Object.keys(docAsJson[k]).forEach( k2 => {
                    if (docAsJson[k][k2] === undefined) {
                        delete docAsJson[k][k2];
                    }
                }
                );
            } else if(k === 'country'){
                ow(docAsJson[k],'country',ow.string.length(2));
            }

        });
        certInfo = docAsJson;
        const result = new CertInfoValidationResult();
        result.isValid = true;

        // Generator exists and value is valid
        // RangeStart
        if (typeof certInfo['commonName'] !== 'undefined') {
            certInfo = await this.constructCommonName(certInfo);
            const commonName = certInfo['commonName'];
            if (typeof commonName['generator'] !== 'undefined' &&  ['list', 'increment', 'static'].includes(commonName['generator'])) {
                const generator = commonName['generator'];
                if (generator === 'increment') {
                    if (typeof commonName['commonNameStart'] !== 'undefined') {
                        if (!commonNameRE.test(commonName['commonNameStart'])) {
                            result.isValid = false;
                            result.errors['ArgumentError'] = 'certInfo/commonName string should contain a hexadecimal value';
                        }
                    } else {
                        result.isValid = false;
                        result.errors['ArgumentError'] = 'certInfo/commonName increment section missing value';
                    }
                } else if (generator === 'list') {

                    if (typeof certInfo['commonNameList'] !== 'undefined') {
                        const names:string[] = certInfo['commonNameList'];
                        if (names.length === 0) {
                            result.isValid = false;
                            result.errors['ArgumentError'] = 'certInfo/commonNameList property should be an array of string values';
                        }
                    } else {
                        result.isValid = false;
                        result.errors['ArgumentError'] = 'certInfo/commonNameList property missing';
                    }
                } else if (generator === 'static') {
                    if (typeof commonName['commonNameStatic'] === 'undefined') {
                        result.isValid = false;
                        result.errors['ArgumentError'] = 'certinfo/commonName property missing';
                    } else if (!commonNameRE.test(commonName['commonNameStatic'])) {
                        result.isValid = false;
                        result.errors['ArgumentError'] = 'certInfo/commonName string should only contain hexadecimal value';
                    }
                }
            } else {
                result.isValid = false;
                result.errors['ArgumentError'] = 'certinfo/commonName Generator section missing or invalid';
            }

        }

        return await result;
    }
    

    private async constructCommonName(certInfo:CertificateInfo): Promise<CertificateInfo> {
        let prefix:string;
        let generator:string;

        if (typeof certInfo === 'undefined' || Object.keys(certInfo).length === 0) {
           certInfo = {};
           certInfo['commonName'] = this.commonName;
        }

        const certInfoRes:CertificateInfo =  Object.assign({},certInfo);
        certInfoRes['commonName'] = {};

        const prefixRE =  /`((.*?)`)/g;
        const generatorRE = /\${((.*?)\})/g;
        const incrementRE = /\(((.*?)\))/g;

        let commonName = certInfo.commonName.toString();

        // Construct Prefix
        const prefixArr = commonName.match(prefixRE);
        if(typeof prefixArr !== 'undefined' && prefixArr !== null && prefixArr.length !== 0 ){
            prefix = prefixArr[0].replace(/[`/]/gi,'');
            certInfoRes['commonName']['prefix'] = prefix;
            commonName = commonName.replace(prefixRE,'');
        }

        // Construct Generator
        const generatorArr = commonName.match(generatorRE);
        if (typeof generatorArr !== 'undefined' &&  generatorArr !== null && generatorArr.length !== 0 ) {
            generator = generatorArr[0].replace(/[${}/]/gi,'').replace(incrementRE,'').toLowerCase();
            certInfoRes['commonName']['generator'] = CommonNameGenerator[generator];
            if(typeof generator !== 'undefined' && generator === 'increment' ) {
                const quantityArr = commonName.match(incrementRE);
                if (typeof quantityArr !== 'undefined' &&  quantityArr !== null) {
                    certInfoRes['commonName']['quantity'] = parseInt(quantityArr[0].replace(/[()/]/gi,''));
                }
                certInfoRes['commonName']['commonNameStart'] = commonName.replace(generatorRE,'');
            } else if (generator === 'static') {
                certInfoRes['commonName']['commonNameStatic'] = commonName.replace(generatorRE,'');
            } else if (generator === 'list') {
                certInfoRes['commonName']['quantity'] = certInfoRes.commonNameList.length;
                certInfoRes['commonName']['commonNameList'] = certInfoRes.commonNameList;
            }

        } else {
            certInfoRes['commonName']['generator'] = CommonNameGenerator.static;
            certInfoRes['commonName']['commonNameStatic'] = commonName;
        }
        return certInfoRes;
    }

        // Use the last value generated for commonName to validate its max length
        private async validateCommonName(certInfo:CertificateInfo): Promise<void>{
        logger.debug(`certificatesTask.service ValidateCommonName: certInfo ${JSON.stringify(certInfo)}`);
        const commonName = certInfo.commonName;
        let commonNameValue:string;
        if ( typeof commonName === 'object') {
            if (typeof commonName.prefix === 'undefined') {
                commonName.prefix = '';
            }
            if (commonName.generator === 'increment') {
                logger.debug(`certificates.service createCommonName: increment` );
                commonNameValue = commonName.prefix+(parseInt(commonName.commonNameStart,16) + commonName.quantity).toString(16).toUpperCase();
            } else if (commonName.generator === 'list') {
                logger.debug(`certificates.service createCommonName: list` );
                commonNameValue = commonName.prefix+certInfo.commonNameList[commonName.quantity-1].toUpperCase();
            } else if (commonName.generator === 'static') {
                logger.debug(`certificates.service createCommonName: static` );
                commonNameValue = commonName.prefix + commonName.commonNameStatic.toUpperCase();
            }
        } else {
            commonNameValue = commonName;
        }
        //convert string to base64
        commonNameValue = Buffer.from(commonNameValue.toString()).toString('base64');
        logger.debug(`certificates.service createCommonName: commonNameValue ${commonNameValue} lenght:${commonNameValue.length}`);
        ow(commonNameValue,`base64 encoded commonName` ,ow.string.maxLength(64));
        
    }
}
