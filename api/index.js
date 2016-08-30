module.exports = (config, models, di) => {

    return new Promise((resolve, reject) => {

        var A = {
            Checks: require('./Checks'),
        };

        var api = {};

        api.checks = new A.Checks({}, models, api);

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
