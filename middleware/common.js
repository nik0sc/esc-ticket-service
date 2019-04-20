const allowed_origins = [
    /^http:\/\/localhost(:\d+)*$/,
    /^https:\/\/(frontend.)?ticket.lepak.sg$/
];

exports.xhrAllowWhitelistOrigins = function (req, res, next) {
    res.header('Access-Control-Allow-Headers', 'Origin, X-Parse-Session-Token, X-Requested-With, Content-Type');
    res.header('Vary', 'Origin');

    const origin = req.header('Origin');
    
    if (typeof origin !== 'undefined') {
        if (allowed_origins.some((regexp) => origin.match(regexp))) {
            res.header('Access-Control-Allow-Origin', origin);
            console.log(`Origin: ${origin} is allowed`);
        } else {
            console.log(`Disallowed origin: ${origin}`);
        }
    } else {
        console.log('No origin');
    }

    if (typeof next === 'function') {
        next();
    }
};

exports.xhrOrigins = function (origin, callback) {
    if (typeof origin === 'undefined' 
            || allowed_origins.some((regexp) => origin.match(regexp))) {
        callback(null, true);
    } else {
        callback(new Error('Not allowed by CORS'));
    }
};

const {validationResult} = require('express-validator/check');

exports.failOnInvalid = function (req, res, next) {
    let result = validationResult(req);

    if (!result.isEmpty()) {
        res.status(400).json({
            validation_errors: result.mapped()
        });
        return;
    }

    if (typeof next === 'function') {
        next();
    }
};