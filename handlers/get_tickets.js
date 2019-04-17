/**
 * Get all tickets
 * 
 * In: Query string
 * - limit: <Integer> [optional, default 10]
 * - offset: <Integer> [optional, default 0]
 * 
 * Out:
 *  Success: JSON; status == 200
 * [{
 *  "id": <Integer>,
 *  "title": <String>,
 *  "message": <String, up to first 32 chars>,
 *  "response": <String, up to first 32 chars> [optional],
 *  "open_time": <String>,
 *  "close_time": <String> [optional],
 *  "priority": <Integer> [optional],
 *  "severity": <Integer> [optional],
 *  "opener_user": <String>,
 *  "assigned_team": <Integer> [optional],
 *  "status_flag": <Integer>
 * }, ...]
 *  Failure: JSON; status != 200
 * {
 *  "error": <String>
 * }
 * 
 * Preconditions:
 * - User is authenticated with session token
 * - Calling user is admin
 * - Limit and offset are integers
 * 
 * Postconditions:
 * - No change to database
 * - Output is sorted by insertion order, with most recent first
 */
exports.getAll = async function (req, res) {
    const knex = req.app.locals.knex;
    
    // console.log(`limit: ${typeof req.query.limit} ` + 
    //         `offset: ${typeof req.query.offset}`);
    
    let t_limit = req.query.limit || 10;
    let t_offset = req.query.offset || 0;

    let query = knex('tickets')
        .select('id', 'title',
            // Truncate overly long text
            knex.raw('concat(left(message, 32), if(length(message) > 32, "...", "")) as message'), 
            knex.raw('concat(left(response, 32), if(length(response) > 32, "...", "")) as response'),
            'open_time', 'close_time', 'priority', 'severity', 'opener_user', 
            'assigned_team', 'status_flag')
        .orderBy('id', 'desc')
        .limit(t_limit)
        .offset(t_offset);
    console.log(query.toString());

    let rows;
    try {
        rows = await query;
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: 'Db error'
        });
        return;
    }

    if (typeof rows === 'undefined') {
        res.status(404).json({
            error: 'Tickets not found'
        });
        return;
    }
    
    res.json(rows);
};

/**
 * Get a ticket by its id
 * 
 * In: URL params
 * - ticketId: <Integer>
 *  
 * Out:
 *  Success: JSON; status == 200
 * {
 *  "id": <Integer>,
 *  "title": <String>,
 *  "message": <String>,
 *  "response": <String> [optional],
 *  "open_time": <String>,
 *  "close_time": <String> [optional],
 *  "priority": <Integer> [optional],
 *  "severity": <Integer> [optional],
 *  "opener_user": <String>,
 *  "assigned_team": <Integer> [optional],
 *  "status_flag": <Integer>
 * }
 *  Failure: JSON; status != 200
 * {
 *  "error": <String>
 * }
 * 
 * Preconditions:
 * - User is authenticated with session token
 * - Calling user is either the owner of this ticket or an admin
 * 
 * Postconditions:
 * - No change to database
 */
exports.getById = async function (req, res) {
    console.log('Getting ' + req.params.ticketId);
    // let query = req.app.locals.knex('tickets')
    //     .first('tickets.id', 'tickets.title', 'tickets.message',
    //         'tickets.open_time', 
    //         'tickets.close_time', 'tickets.priority', 'tickets.severity',
    //         'tickets.assigned_team', 'tickets.opener_user',
    //         'users.username', 'users.long_name', 
    //         'teams.team_name')
    //     // Want my ticket even if these columns are null
    //     .leftJoin('users', 'tickets.opener_user', '=', 'users.id')
    //     .leftJoin('teams', 'tickets.assigned_team', '=', 'teams.id')
    //     .where('tickets.id', req.params.ticketId);
    
    const user_object_id = req.acn_session.user.objectId;
    const user_axios = req.app.locals.user_axios;

    const knex = req.app.locals.knex;
    let query = knex('tickets')
        .first('id', 'title', 'message', 'response', 'open_time', 'close_time',
            'priority', 'severity', 'opener_user', 'assigned_team', 
            'status_flag')
        .where('id', req.params.ticketId);

    console.log(query.toString());

    let row;
    try {
        row = await query;
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: 'Db error'
        });
        return;
    }

    if (typeof row === 'undefined') {
        res.status(404).json({
            error: 'Ticket not found'
        });
        return;
    }

    if (row.opener_user !== user_object_id) {
        // Check current user for admin status
        try {
            let res2 = await user_axios.get(
                    `/user/acn:${user_object_id}/public`);

            if (res2.data.is_admin === false) {
                res.status(403).json({
                    error: 'You are not authorized to view this ticket'
                });
                return;
            }
        } catch (err) {
            console.error(err);
            res.status(500).json({
                error: 'Could not verify user with user service'
            });
            return;
        }
    }
    
    res.json(row);
};

/**
 * Get all tickets by the current user
 * 
 * In: Query string
 * - limit: <Integer> [optional, default 10]
 * - offset: <Integer> [optional, default 0]
 * 
 * Out:
 *  Success: JSON; status == 200
 * [{
 *  "id": <Integer>,
 *  "title": <String>,
 *  "message": <String, up to first 32 chars>,
 *  "response": <String, up to first 32 chars> [optional],
 *  "open_time": <String>,
 *  "close_time": <String> [optional],
 *  "priority": <Integer> [optional],
 *  "severity": <Integer> [optional],
 *  "opener_user": <String>,
 *  "assigned_team": <Integer> [optional],
 *  "status_flag": <Integer>
 * }, ...]
 *  Failure: JSON; status != 200
 * {
 *  "error": <String>
 * }
 * 
 * Preconditions:
 * - User is authenticated with session token
 * - Limit and offset are integers
 * 
 * Postconditions:
 * - No change to database
 * - Output is sorted by insertion order, with most recent first
 */
exports.getAllByUser = async function (req, res) {
    // Grab the user profile
    let user_object_id = req.acn_session.user.objectId;
    const knex = req.app.locals.knex;
    
    let t_limit = req.query.limit || 10;
    let t_offset = req.query.offset || 0;

    let query = knex('tickets')
        .select('id', 'title',
            // Truncate overly long text
            knex.raw('concat(left(message, 32), if(length(message) > 32, "...", "")) as message'), 
            knex.raw('concat(left(response, 32), if(length(response) > 32, "...", "")) as response'),
            'open_time', 'close_time', 'priority', 'severity', 'opener_user', 
            'assigned_team', 'status_flag')
        .where('opener_user', user_object_id)
        .orderBy('id', 'desc')
        .limit(t_limit)
        .offset(t_offset);
    console.log(query.toString());

    let rows;
    try {
        rows = await query;
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: 'Db error'
        });
        return;
    }

    if (typeof rows === 'undefined') {
        res.status(404).json({
            error: 'Tickets not found'
        });
        return;
    }
    
    res.json(rows);
};

exports.getAllByTeam = async function (req, res) {
    const knex = req.app.locals.knex;
    let team_id = req.params.teamId;
    const knex = req.app.locals.knex;
    
    let t_limit = req.query.limit || 10;
    let t_offset = req.query.offset || 0;

    let query = knex('tickets')
        .select('id', 'title',
            // Truncate overly long text
            knex.raw('concat(left(message, 32), if(length(message) > 32, "...", "")) as message'), 
            knex.raw('concat(left(response, 32), if(length(response) > 32, "...", "")) as response'),
            'open_time', 'close_time', 'priority', 'severity', 'opener_user', 
            'assigned_team', 'status_flag')
        .where('assigned_team', team_id)
        .orderBy('id', 'desc')
        .limit(t_limit)
        .offset(t_offset);
    console.log(query.toString());

    let rows;
    try {
        rows = await query;
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: 'Db error'
        });
        return;
    }

    if (typeof rows === 'undefined') {
        res.status(404).json({
            error: 'Tickets not found'
        });
        return;
    }
    
    res.json(rows);
};