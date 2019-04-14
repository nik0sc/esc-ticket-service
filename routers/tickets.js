const router = require('express').Router();
const {check, query, body} = require('express-validator/check');

const tickets = require('../handlers/tickets');
const login = require('../middleware/login');
const common = require('../middleware/common');

router.get('/',
        login.checkSessionToken,
        login.userIsAdmin,
        query('limit').optional().toInt(),
        query('offset').optional().toInt(),
        tickets.getAll);

router.get('/:ticketId(\\d+)',
        login.checkSessionToken,
        tickets.getById);

router.get('/byUser', 
        login.checkSessionToken, 
        query('limit').optional().toInt(),
        query('offset').optional().toInt(),
        tickets.getAllByUser);

router.get('/byTeam/:teamId(\\d+)',
        query('limit').optional().toInt(),
        query('offset').optional().toInt(),
        tickets.getAllByTeam);

router.post('/', 
        login.checkSessionToken, 
        body('title', 'Title cannot be empty')
            .isString().trim().isLength({min: 1}),
        body('message', 'Message cannot be empty')
            .isString().trim().isLength({min: 1}),
        common.failOnInvalid,
        tickets.createNew);

router.put('/:ticketId(\\d+)', 
        login.checkSessionToken,
        tickets.updateProtected);

module.exports = router;