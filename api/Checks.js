'use strict';

var Abstract = require('./Abstract');
var joi = require('joi');
var moment = require('moment');
var _ = require('lodash');
var md5 = require('md5');

var ErrorCodes = require('maf/Api/ErrorCodes');

var apiError = require('mazaid-error/create')(ErrorCodes);


var Chain = require('maf/Chain');

class Checks extends Abstract {

    constructor (config, models, api) {
        super(models, api);

        this._config = config;

        this.entityName = 'check';

        this.ErrorCodes = ErrorCodes;

        this._creationSchema = {
            name:  joi.string().trim().required(),
            title:  joi.string().trim().required(),
            description:  joi.string().trim().default(null).allow(null),
            checker:  joi.string().trim().required(),
            timeout: joi.number().integer().min(1).default(60),
            data: joi.object().unknown(true).required(),
            userAnalyzeFn: joi.string().default(null).allow(null),
            active: joi.boolean().default(false)
        };

        this._modificationSchema = {
            name:  joi.string().trim(),
            title:  joi.string().trim(),
            description:  joi.string().trim().allow(null),
            checker:  joi.string().trim(),
            timeout: joi.number().integer().min(1),
            data: joi.object().unknown(true),
            userAnalyzeFn: joi.string().default(null).allow(null).description('custom user analyze function'),
            active: joi.boolean(),
            deleted: joi.boolean()
        };

        this._systemFields = [
            '_id'
        ];
    }


    getById (id, fields) {

        var query = {
            _id: id
        };

        if (Array.isArray(fields)) {
            fields = this._prepareFields(fields);
        }

        return new Promise((resolve, reject) => {
            this._model().findOne(query, {fields: fields})
                .then((doc) => {
                    resolve(doc);
                })
                .catch((error) => {
                    reject(error);
                });
        });

    }

    getByName (name, fields) {

        return new Promise((resolve, reject) => {
            var query = {
                name: name
            };

            if (Array.isArray(fields)) {
                fields = this._prepareFields(fields);
            }

            this._model().findOne(query, {fields: fields})
                .then((doc) => {
                    resolve(doc);
                })
                .catch((error) => {
                    reject(error);
                });

        });
    }

    find (filters, fields) {

        var chain = new Chain({
            steps: {
                limit: 10,
                skip: 0
            }
        });

        if (Array.isArray(fields)) {
            fields = this._prepareFields(fields);
        }

        chain.onExec((data) => {

            return new Promise((resolve, reject) => {
                this._model().find(filters, fields)
                    .mapToChain(data)
                    .exec()
                        .then((result) => {
                            resolve(result);
                        })
                        .catch((error) => {
                            reject(error);
                        });
            });

        });

        return chain;

    }

    create (data) {

        return new Promise((resolve, reject) => {

            if (!data) {
                return reject(this.Error('empty data', this.ErrorCodes.INVALID_DATA));
            }

            this._validateCreation(data)
                .then((data) => {
                    return this._create(data);
                })
                .then((doc) => {
                    resolve(doc);
                })
                .catch((error) => {
                    reject(error);
                });
        });

    }

    createTest () {
        var data = {
            name: 'test',
            title: 'test',
            checker: 'test',
            data: {
                test: 'test'
            }
        };

        return this.create(data);
    }

    updateById (id, data) {

        return new Promise((resolve, reject) => {
            if (this._isEmptyObject(data)) {
                return reject(this.Error('empty data', this.errorCodes.INVALID_DATA));
            }

            this.getById(id)
                .then((check) => {
                    if (!check) {
                        throw this.Error(
                            `${this.entityName} not found: id = ${id}`,
                            this.errorCodes.NOT_FOUND
                        );
                    }

                    return this._validateModification(data);
                })
                .then((valid) => {

                    if (this._isEmptyObject(data)) {
                        throw this.Error('empty data', this.errorCodes.INVALID_DATA);
                    }

                    valid.modificationDate = this._time();

                    return this._model().findOneAndUpdate({_id: id}, {$set: valid});
                })
                .then((updated) => {
                    resolve(updated);
                })
                .catch((error) => {
                    reject(error);
                });
        });

    }

    updateByName (name, data) {

        return new Promise((resolve, reject) => {
            if (!data) {
                return reject(this.Error('empty data', this.errorCodes.INVALID_DATA));
            }

            this.getByName(name)
                .then((doc) => {

                    if (!doc) {
                        throw this.Error(
                            `${this.entityName} not found: name = ${name}`,
                            this.errorCodes.NOT_FOUND
                        );
                    }

                    return this.updateById(doc.id, data);
                })
                .then((updated) => {
                    resolve(updated);
                })
                .catch(function (error) {
                    reject(error);
                });

        });

    }

    deleteById (id) {

        return new Promise((resolve, reject) => {

            this.getById(id)
                .then((doc) => {

                    if (!doc) {
                        throw this.Error(
                            `${this.entityName} not found: id = ${id}`,
                            this.errorCodes.NOT_FOUND
                        );
                    }

                    return this._model().findOneAndUpdate(
                        {
                            _id: id
                        },
                        {
                            $set: {
                                deleted: true,
                                modificationDate: this._time()
                            }
                        }
                    );
                })
                .then((result) => {
                    resolve(result);
                })
                .catch((error) => {
                    reject(error);
                });
        });

    }

    deleteByName (name) {

        return new Promise((resolve, reject) => {
            this.getByName(name)
                .then((doc) => {

                    if (!doc) {
                        throw this.Error(
                            `${this.entityName} not found: id = ${id}`,
                            this.errorCodes.NOT_FOUND
                        );
                    }

                    return this.deleteById(doc.id);
                })
                .then((result) => {
                    resolve(result);
                })
                .catch((error) => {
                    reject(error);
                });
        });

    }

    _create (data, options) {

        return new Promise((resolve, reject) => {
            data.active = true;
            data.deleted = false;

            data.creationDate = this._time();
            data.modificationDate = null;

            if (!data.id) {
                data.id = this._generateUuid();
            }

            this._model().insertOne(data)
                .then((doc) => {
                    resolve(doc);
                })
                .catch((error) => {
                    if (error.code && error.code === 'already_exists') {
                        reject(this.Error(`${this.entityName} already exists`, ErrorCodes.INVALID_DATA));
                    } else {
                        reject(error);
                    }
                });
        });

    }

    /**
     * @param {String} checkName
     * @return {Error}
     */
    NotFoundError (name) {
        var message = this.entityName + ' not found';

        if (name) {
            message = `${this.entityName} with name = "${name}" not found`;
        }

        return this.Error(message, this.ErrorCodes.NOT_FOUND);
    }

    /**
     * base model of api
     *
     * @return {model}
     */
    _model () {
        return this._models.checks;
    }
}

module.exports = Checks;
