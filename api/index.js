module.exports = (config, models, di) => {

    return new Promise((resolve, reject) => {

        var A = {
            Checks: require('./Checks'),
            RestApiClient: require('maf/Rest/Client'),
            CheckTasks: require('mazaid-rest-api-clients/CheckTasks')
        };

        var api = {};

        api.checks = new A.Checks({}, models, api);
        api.rest = new A.RestApiClient();
        api.checkTasksClient = new A.CheckTasks(di.config.api.checkTasks, api.rest);

        for (var name in api) {
            if (di.debug && api[name].setDebugger) {
                api[name].setDebugger(di.debug);
            }
        }

        api.createTest = () => {

            return new Promise((resolve, reject) => {
                api.checks.createTest()
                    .then(() => {
                        resolve();
                    })
                    .catch((error) => {
                        reject(error);
                    });
            });

        };

        resolve(api);
    });

};
