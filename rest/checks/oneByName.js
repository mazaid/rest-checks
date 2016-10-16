var joi = require('joi');
var _ = require('lodash');

module.exports = {

    resource: '/checks/:name',

    title: 'get, update, delete check by name',

    methods: {

        GET: {
            title: 'get check by name',

            schema: {
                path: {
                    ':name': joi.string().required()
                },
                query: {
                    fields: joi.alternatives().try(joi.array().items(joi.string()), joi.string()).default(null),
                    withCheckTasks: joi.alternatives().try(
                        joi.boolean(),
                        joi.object().keys({
                            fields: joi.alternatives().try(
                                joi.array().items(joi.string()),
                                joi.string())
                                .default(null)
                        })
                    ),
                    withExecTasks: joi.alternatives().try(
                        joi.boolean(),
                        joi.object().keys({
                            fields: joi.alternatives().try(
                                joi.array().items(joi.string()),
                                joi.string())
                                .default(null)
                        })
                    )
                }
            },

            onlyPrivate: false,

            callback: function(req, res) {
                var logger = req.di.logger;
                var api = req.di.api;

                var fields = null;

                if (typeof req.query.fields === 'string') {
                    fields = _.map(req.query.fields.split(','), v => _.trim(v));
                } else if (Array.isArray(req.query.fields)) {
                    fields = req.query.fields;
                }

                var check = null;
                var metadata = null;

                api.checks.getByName(req.params.name, fields)
                    .then((_check) => {

                        check = _check;

                        if (!check) {
                            throw api.checks.NotFoundError();
                        }

                        var checkTasksFields = _.get(req.query.withCheckTasks, 'fields', null);

                        return api.checkTasksClient.getLatestByCheckId([check.id], checkTasksFields);

                    })
                    .then((checkTaskResult) => {
                        if (req.query.withCheckTasks) {
                            metadata = {checkTask: _.get(checkTaskResult, '0', null)};
                        }

                        var execTaskId = _.get(checkTaskResult, '0.execTaskId', null);

                        if (execTaskId) {
                            return api.execTasksClient.getById(execTaskId);
                        } else {
                            return null;
                        }

                    })
                    .then((execTaskResult) => {

                        if (req.query.withCheckTasks && metadata && execTaskResult) {
                            metadata.execTask = execTaskResult;
                        }

                        res.result(api.checks.clearSystemFields(check), metadata);
                    })
                    .catch((error) => {
                        var ec = {
                            checks: api.checks.ErrorCodes
                        };

                        if (!error.checkable) {
                            return res.logServerError(error);
                        }

                        error.checkChain(res.logServerError)
                            .ifEntity(api.checks.entityName)
                            .ifCode(ec.checks.NOT_FOUND, res.notFound)
                            .end()
                            .check();

                    });
            }
        },

        PATCH: {
            title: 'update check by name',

            schema: {
                path: {
                    ':name': joi.string().required()
                }
            },

            preHook: function (method, di) {
                method.schema.body = di.api.checks.getModificationSchema();
            },

            callback: function (req, res) {
                var logger = req.di.logger;
                var api = req.di.api;

                api.checks.updateByName(req.params.name, req.body)
                    .then(function (updated) {
                        res.result(api.checks.clearSystemFields(updated));
                    })
                    .catch(function (error) {
                        var ec = {
                            checks: api.checks.errorCodes
                        };

                        if (!error.checkable) {
                            return res.logServerError(error);
                        }

                        error.checkChain(res.logServerError)
                           .ifEntity(api.checks.entityName)
                           .ifCode(ec.checks.NOT_FOUND, res.notFound)
                           .ifCode(ec.checks.INVALID_DATA, res.badRequest)
                           .end()
                           .check();

                    });
            }
        },

        DELETE: {
            title: 'delete check by name',

            schema: {
                path: {
                    ':name': joi.string().required()
                }
            },

            callback: function (req, res) {
                var logger = req.di.logger;
                var api = req.di.api;

                api.checks.deleteByName(req.params.name)
                    .then((removed) => {
                        res.result(removed);
                    })
                    .catch((error) => {
                        var ec = {
                            checks: api.checks.errorCodes
                        };

                        if (!error.checkable) {
                            return res.logServerError(error);
                        }

                        error.checkChain(res.logServerError)
                           .check();
                    });


            }
        }
    }
};
