var request = require('superagent');

var config = {
    checkUrl: 'http://localhost:8082'
};

var limit = 5;
var interval = 3000;

if (process.argv[2]) {
    limit = parseInt(process.argv[2], 10);
}

if (process.argv[3]) {
    interval = parseInt(process.argv[3], 10);
}

console.log(`limit = ${limit}, interval = ${interval}`);

request.get(config.checkUrl + '/checks')
    .query({
        limit: 100,
        active: true,
        fields: 'name'
    })
    .end(function (err, res) {

        if (err) {
            console.log(err);
            return;
        }

        var result = res.body.result;

        var done = 0;
        var total = result.length;

        // var promises = [];

        var intervalFn = null;

        intervalFn = setInterval(function () {

            if (!result.length) {
                clearInterval(intervalFn);
            }

            var promises = [];

            for (var i = 1; i <= limit; i++) {

                var check = result.shift();

                if (typeof check === 'undefined') {
                    clearInterval(intervalFn);
                    break;
                }

                promises.push(new Promise((resolve, reject) => {

                    request.post(config.checkUrl + '/checks/' + check.name + '/check')
                        .end((err) => {
                            if (err) {
                                return reject(err);
                            }

                            resolve();
                        });

                }));
            }

            Promise.all(promises)
                .then((result) => {
                    done += result.length;
                    console.log(`done ${done} of ${total}`);
                })
                .catch((error) => {
                    console.log(error);
                });


        }, interval);

    });
