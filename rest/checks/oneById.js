var joi = require('joi');
var _ = require('lodash');

module.exports = {

    resource: '/checks/byId/:id',

    title: 'get check by id',

    methods: {
        GET: {
            title: 'get check by id',

            schema: {
                path: {
                    ':id': joi.string().required()
                },
                query: {
                    fields: joi.alternatives().try(joi.array().items(joi.string()), joi.string()).default(null),
                }
            },

            callback: function (req, res) {
                var logger = req.di.logger;
                var api = req.di.api;

                var fields = null;

                if (typeof req.query.fields === 'string') {
                    fields = _.map(req.query.fields.split(','), v => _.trim(v));
                } else if (Array.isArray(req.query.fields)) {
                    fields = req.query.fields;
                }

                api.checks.getById(req.params.id, fields)
                    .then((check) => {

                        if (!check) {
                            throw api.checks.NotFoundError();
                        }

                        res.result(check);

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
        }
    }
};
