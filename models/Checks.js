'use strict';

var Abstract = require('./Abstract');

class Checks extends Abstract {

    constructor(db) {
        super(db);

        this._collectionName = 'checks';

        this._indexes = [
            {
                fields: {
                    name: 1
                },
                options: {
                    name: 'name',
                    unique: true,
                    background: true
                }
            }
        ];
    }

}

module.exports = Checks;
