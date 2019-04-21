const router = require('express').Router();
const {check, query, body} = require('express-validator/check');

const tickets = require('../handlers/tickets');
const get_tickets = require('../handlers/get_tickets');
const login = require('../middleware/login');
const common = require('../middleware/common');

router.get('/',
        login.checkSessionToken,
        login.userIsAdmin,
        query('limit').optional().toInt(),
        query('offset').optional().toInt(),
        get_tickets.getAll);

router.get('/:ticketId(\\d+)',
        login.checkSessionToken,
        get_tickets.getById);

router.get('/byUser', 
        login.checkSessionToken, 
        query('limit').optional().toInt(),
        query('offset').optional().toInt(),
        get_tickets.getAllByUser);

router.get('/byTeam/:teamId(\\d+)',
        query('limit').optional().toInt(),
        query('offset').optional().toInt(),
        get_tickets.getAllByTeam);

router.post('/', 
        login.checkSessionToken, 
        body('title', 'Title cannot be empty')
            .isString().trim().isLength({min: 1}),
        body('message', 'Message cannot be empty')
            .isString().trim().isLength({min: 1}),
        body('priority', 'Invalid priority').optional()
            .isNumeric({no_symbols: true}),
        body('severity', 'Invalid severity').optional()
            .isNumeric({no_symbols: true}),
        common.failOnInvalid,
        tickets.createNew);
    
router.put('/:ticketId(\\d+)',
        login.checkSessionToken,
        body('message', 'Message cannot be empty').optional()
            .isString().trim().isLength({min: 1}), 
        common.failOnInvalid,
        tickets.updateOwner);

router.put('/:ticketId(\\d+)/protected', 
        login.checkSessionToken,
        // login.userIsAdmin,
        body('title', 'Title cannot be empty').optional()
            .isString().trim().isLength({min: 1}),
        body('message', 'Message cannot be empty').optional()
            .isString().trim().isLength({min: 1}), 
        body('response', 'Response cannot be empty').optional()
            .isString().trim().isLength({min: 1}),
        body('close_time', 'Invalid close_time').optional()
            // .matches(/^\S+$/),
            .matches(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/),
        body('priority', 'Invalid priority').optional()
            .isNumeric({no_symbols: true}),
        body('severity', 'Invalid severity').optional()
            .isNumeric({no_symbols: true}),
        body('assigned_team', 'Invalid assigned_team').optional()
            .isNumeric({no_symbols: true}),
        body('status_flag', 'Invalid status_flag').optional()
            .isNumeric({no_symbols: true}),
        common.failOnInvalid,
        tickets.updateProtected);

module.exports = router;