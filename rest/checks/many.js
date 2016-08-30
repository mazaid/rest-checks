var joi = require('joi');
var _ = require('lodash');

module.exports = {

    resource: '/checks',

    title: 'find, create checks',

    methods: {
        GET: {
            title: 'find checks',

            schema: {
                query: {
                    limit: joi.number().default(10).min(0).max(100),
                    offset: joi.number().default(0).min(0).max(100)
                }
            },

            callback: function (req, res) {
                var logger = req.di.logger;
                var api = req.di.api;

                api.checks.find()
                    .limit(req.query.limit)
                    .skip(req.query.offset)
                    .exec()
                    .then((result) => {
                        var docs = [];

                        for (var doc of result.docs) {
                            docs.push(api.checks.clearSystemFields(doc));
                        }

                        res.result(docs, {
                            resultset: {
                                count: result.docs.length,
                                total: result.total,
                                limit: req.query.limit,
                                offset: req.query.offset
                            }
                        });
                    })
                    .catch((error) => {
                        var ec = {
                            checks: api.checks.ErrorCodes
                        };

                        if (!error.checkable) {
                            return res.logServerError(error);
                        }

                        error.getCheckChain(res.logServerError)
                           .check();
                    });
            }
        },

        POST: {
            title: 'create',

            schema: {
                body: {}
            },

            preHook: function (method, di) {
                method.schema.body = di.api.checks.getCreationSchema();
            },

            callback: function (req, res) {
                var logger = req.di.logger;
                var api = req.di.api;

                api.checks.getByName(req.body.name)
                    .then((check) => {
                        if (check) {
                            throw api.checks.Error(
                                'check already exists. name = ' + req.body.name,
                                api.checks.ErrorCodes.ALREADY_EXISTS
                            );
                        }

                        return api.checks.create(req.body);
                    })
                    .then((check) => {
                        res.result(check);
                    })
                    .catch((error) => {
                        var ec = {
                            checks: api.checks.ErrorCodes
                        };

                        if (!error.checkable) {
                            return res.logServerError(error);
                        }

                        error.getCheckChain(res.logServerError)
                           .ifEntity(api.checks.entityName)
                           .ifCode(ec.checks.INVALID_DATA, res.badRequest)
                           .ifCode(ec.checks.ALREADY_EXISTS, res.badRequest)
                           .end()
                           .check();
                    });
            }
        }
    }
};
