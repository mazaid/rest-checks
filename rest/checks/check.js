var joi = require('joi');
var _ = require('lodash');

module.exports = {

    resource: '/checks/:name/check',

    title: 'check',

    methods: {
        POST: {
            title: 'check',

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

                        var checkTaskData = {
                            checkId: check.id,
                            checker: check.checker,
                            data: check.data,
                            timeout: check.timeout
                        };

                        return api.checkTasksClient.create(checkTaskData);
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
