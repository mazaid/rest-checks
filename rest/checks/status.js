var joi = require('joi');
var _ = require('lodash');

module.exports = {

    resource: '/checks/:name/status',

    title: 'status',

    methods: {
        POST: {
            title: 'get check status',

            schema: {
                path: {
                    ':name': joi.string().required()
                }
            },

            callback: function (req, res) {
                var logger = req.di.logger;
                var api = req.di.api;

                api.checks.getByName(req.params.name)
                    .then((check) => {

                        if (!check) {
                            throw api.checks.NotFoundError();
                        }

                        return api.checkTasksClient.getLastByCheckId(check.id);

                    })
                    .then((checkTask) => {
                        res.result(checkTask);
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
