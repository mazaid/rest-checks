var request = require('superagent');

var config = {
    checkUrl: 'http://localhost:8082'
};


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

        var promises = [];

        for (var i in result) {
            var check = result[i];

            promises.push(new Promise((resolve, reject) => {
                request.post(config.checkUrl + '/checks/' + check.name + '/check')
                    .end((err, res) => {
                        if (err) {
                            return reject(err);
                        }

                        resolve();
                    });
            }));
        }

        Promise.all(promises)
            .then((result) => {
                console.log(result.length);
            })
            .catch((error) => {
                console.log(error);
            });
    });
