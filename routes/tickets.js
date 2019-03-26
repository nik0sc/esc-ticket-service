// GET /ticket/:ticketId(\\d+)
exports.getById = function (req, res) {
    console.log('Getting ' + req.params.ticketId);
    var query = req.app.locals.knex('tickets')
        .first('tickets.id', 'tickets.title', 'tickets.message',
            'tickets.open_time', 
            'tickets.close_time', 'tickets.priority', 'tickets.severity',
            'tickets.assigned_team', 'tickets.opener_user',
            'users.username', 'users.long_name', 
            'teams.team_name')
        // Want my ticket even if these columns are null
        .leftJoin('users', 'tickets.opener_user', '=', 'users.id')
        .leftJoin('teams', 'tickets.assigned_team', '=', 'teams.id')
        .where('tickets.id', req.params.ticketId);
    
    console.log(query.toString());
    
    query.then((row) => {
        res.json(row);
    });
};

exports.getAllByUser = function (req, res) {
    // Grab the user profile
    let user_object_id = req.acn_session.user.objectId;
    const knex = req.app.locals.knex;

    console.log("User ACN object id: " + user_object_id);

    let query = knex('tickets')
    .select('tickets.id', 'tickets.title', 'tickets.message',
        'tickets.open_time', 
        'tickets.close_time', 'tickets.priority', 'tickets.severity',
        'tickets.assigned_team', 'tickets.opener_user',
        'users.username', 'users.long_name', 
        'teams.team_name')
    .join('users', 'tickets.opener_user', '=', 'users.id')
    // Left join: Want all rows in tickets that match the where condition,
    // even if a row doesn't have an assigned team
    .leftJoin('teams', 'tickets.assigned_team', '=', 'teams.id')
    .where('users.id', 
        knex('users')
        .first('users.id')
        .where('users.acn_id', user_object_id)
    );

    console.log(query.toString());

    query.then((rows) => {
        res.json(rows);
    })
    .catch((err) => {
        res.status(500).json({
            error: 'Db error'
        });
    });
};

exports.createNew = function (req, res) {
    console.log('Creating new ticket');

    let user_object_id = req.acn_session.user.objectId;
    const knex = req.app.locals.knex;
    
    let query = knex('tickets').insert({
        title: req.body.title,
        message: req.body.message,
        open_time: knex.fn.now(),
        priority: req.body.priority,
        severity: req.body.severity,
        opener_user: knex('users')
            .first('id')
            .where('acn_id', user_object_id)
    });

    console.log(query.toString());
    
    query.then((id) => {
        res.json({
            success: 'true',
            id: (typeof id === 'object' && id.length === 1) ? id[0] : id
        });
    })
    .catch((err) => {
        res.status(500).json({
            error: 'Database error while inserting ticket',
            ex: err.toString()
        });
    });

};

// PUT /ticket/:ticketId(\\d+)
exports.update = function (req, res) {
    let ticket_id = req.params.ticketId;
    let user_object_id = req.acn_session.user.objectId;
    const knex = req.app.locals.knex;

    console.log('Update ticket ' + ticket_id 
            + ' from user id ' + user_object_id);

    // Check that user is authorized to do this!
    knex('tickets').update();
};