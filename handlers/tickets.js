const _ = require('lodash');

/**
 * Create a new ticket (attachments uploaded separately)
 * 
 * In: JSON
 * {
 *  "title": <String>,
 *  "message": <String>
 * }
 * 
 * Out:
 *  Success: JSON; status == 200
 * {
 *  "id": <Integer>
 * }
 *  Failure: JSON; status != 200
 * {
 *  "error": <String>
 * }
 * 
 * Preconditions:
 * - User is authenticated with session token
 * - Title is string and not empty/whitespace
 * - Message is string and not empty/whitespace
 * 
 * Postconditions:
 * - Ticket is inserted into database
 * - Ticket is associated with this user; only the owner and admins can see it
 * - Other tickets are not affected
 */
exports.createNew = async function (req, res) {
    console.log('Creating new ticket');

    const user_object_id = req.acn_session.user.objectId;
    const knex = req.app.locals.knex;
    
    // // Validate title
    // let t_title = req.body.title;
    // if (typeof t_title !== 'string') {
    //     res.status(400).json({
    //         error: 'Title must be a string'
    //     });
    //     return;
    // }
    
    // t_title = t_title.trim();
    // if (t_title.length === 0) {
    //     res.status(400).json({
    //         error: 'Title is empty or whitespace'
    //     });
    //     return;
    // }

    // // Validate message body
    // let t_message = req.body.message;
    // if (typeof t_message !== 'string') {
    //     res.status(400).json({
    //         error: 'Message must be a string'
    //     });
    //     return;
    // }

    // t_message = t_message.trim();
    // if (t_message.length === 0) {
    //     res.status(400).json({
    //         error: 'Message is empty or whitespace'
    //     });
    //     return;
    // }

    let t_priority = (typeof req.body.priority !== 'undefined')
            ? parseInt(req.body.priority) : 0;
    
    let t_severity = (typeof req.body.severity !== 'undefined')
            ? parseInt(req.body.severity) : 0;

    let query = knex('tickets').insert({
        // Validated in router by express-validator
        title: req.body.title,
        message: req.body.message,
        open_time: knex.fn.now(),
        opener_user: user_object_id,
        priority: t_priority,
        severity: t_severity
    });

    console.log(query.toString());
    
    let id;
    try {
        id = await query;
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: 'Database error while inserting ticket',
            ex: err.toString()
        });
        return;
    }
    
    res.json({
        id: (typeof id === 'object' && id.length === 1) ? id[0] : id
    });
};

/**
 * Update the protected fields of an existing ticket (attachments uploaded
 * separately)
 * 
 * In: JSON
 * {
 *  "title": <String> [optional],
 *  "message": <String> [optional],
 *  "response": <String> [optional],
 *  "close_time": <String> [optional],
 *  "priority": <Integer> [optional],
 *  "severity": <Integer> [optional],
 *  "assigned_team": <Integer> [optional],
 *  "status_flag": <Integer> [optional]
 * }
 * 
 * Out:
 *  Success: JSON; status == 200
 * {
 *  "id": <Integer>
 * }
 *  Failure: JSON; status != 200
 * {
 *  "error": <String>, [and/or]
 *  "validation_errors": 
 *  {
 *   <field_name>: 
 *   {
 *    "name": <String>,
 *      
 *   }
 *  }, ...
 * }
 * 
 * Preconditions:
 * - User is authenticated with session token
 * - User is admin 
 * - Title is string and not empty/whitespace
 * - Message is string and not empty/whitespace
 * - Response is string and not empty/whitespace
 * - Close time is string and matches timestamp format
 * - Priority is integer
 * - Severity is integer
 * - Assigned team is integer
 * - Status flag is integer
 * 
 * Postconditions:
 * - Ticket is updated in database
 * - Other tickets are not affected
 * - Idempotent
 */
exports.updateProtected = async function (req, res) {
    let ticket_id = req.params.ticketId;
    let user_object_id = req.acn_session.user.objectId;
    const knex = req.app.locals.knex;
    const user_axios = req.app.locals.user_axios;

    console.log('Update ticket ' + ticket_id 
            + ' from user id ' + user_object_id);

    // Check that user is authorized to do this!
    // Admins (user_type=2) or owners only
    let query_ownership = knex('tickets')
        .first('id', 'opener_user')
        .where('id', ticket_id);
    let query_ownership_row;
    try {
        query_ownership_row = await query_ownership;
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: 'Database error while verifying ticket',
            ex: err.toString()
        });
        return;
    }

    if (typeof query_ownership_row === 'undefined') {
        res.status(404).json({
            error: 'Ticket not found'
        });
        return;
    }

    if (query_ownership_row.opener_user !== user_object_id) {
        // Check admin status
        try {
            let res2 = await user_axios.get(
                `/user/acn:${user_object_id}/public`);

            if (res2.data.is_admin === false) {
                res.status(403).json({
                    error: 'You are not authorized to update this ticket'
                });
                return;
            }
        } catch (err) {
            res.status(500).json({
                error: 'Could not verify user with user service'
            });
            return;
        }
    }

    // All checks are ok, update the ticket
    // Whitelist only
    let update_fields = ['title', 'message', 'response', 'close_time',
            'priority', 'severity', 'assigned_team', 'status_flag'];
    let update_object = _.pick(req.body, update_fields);

    if (_.isEmpty(update_object)) {
        res.status(400).json({
            error: 'No valid updatable fields were specified'
        });
        return;
    }
    
    let update_query = knex('tickets')
        .update(update_object)
        .where('id', ticket_id)
        .limit(1);
    
    console.log(update_query.toString());

    let rows_updated;
    try {
        rows_updated = await update_query;
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: 'Database error while updating ticket',
            ex: err.toString()
        });
        return;
    }

    if (rows_updated === 0) {
        res.status(404).json({
            error: 'Ticket not found'
        });
    } else if (rows_updated === 1) {
        res.end();
    } else {
        res.status(500).json({
            error: 'Unexpected rows_updated value',
            rows_updated: rows_updated,
            typeof: typeof rows_updated
        });
    }
};

exports.updateOwner = async function (req, res) {
    res.status(501).end();
}