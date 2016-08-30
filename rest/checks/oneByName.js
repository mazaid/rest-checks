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
                }
            },

            onlyPrivate: false,

            callback: function(req, res) {
                var logger = req.di.logger;
                var api = req.di.api;

                api.checks.getByName(req.params.name)
                    .then((check) => {
                        if (!check) {
                            throw api.checks.NotFoundError();
                        }

                        res.result(api.servers.clearSystemFields(check));
                    })
                    .catch((error) => {
                        var ec = {
                            checks: api.checks.errorCodes
                        };

                        if (!error.checkable) {
                            return res.logServerError(error);
                        }

                        error.getCheckChain(res.logServerError)
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

                        error.getCheckChain(res.logServerError)
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

                        error.getCheckChain(res.logServerError)
                           .check();
                    });


            }
        }
    }
};
