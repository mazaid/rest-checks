var joi = require('joi');

var config = {
    host: 'localhost',
    port: 8082,

    db: {
        dsl: 'mongodb://localhost:27017/mazaid'
    },

    nprof: {
        snapshotPath: '/data/tmp/mazaid-rest-checks'
    },

    api: {
        checkTasks: {
            base: 'http://localhost:8083'
        },
        execTasks: {
            base: 'http://localhost:8084'
        }
    }

};

module.exports = {
    host: joi.string().allow(null).default(config.host),
    port: joi.number().default(config.port),

    db: joi.object().default(config.db).keys({
        dsl: joi.string().default(config.db.dsl)
    }),

    nprof: joi.object().default(config.nprof).keys({
        snapshotPath: joi.string().default(config.nprof.snapshotPath)
    }),

    api: joi.object().default(config.api).keys({
        execTasks: joi.object().default(config.api.execTasks).keys({
            base: joi.string().default(config.api.execTasks.base)
        }),
        checkTasks: joi.object().default(config.api.checkTasks).keys({
            base: joi.string().default(config.api.checkTasks.base)
        })
    })
};
