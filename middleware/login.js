// Middleware function to check tokens against acnapi
// If the token checks out, the session object is injected into request object
// Use it to check if this user is authorized to access the object
exports.checkSessionToken = async function (req, res, next) {
    let session_token = req.header('X-Parse-Session-Token');

    if (typeof session_token === 'undefined') {
        res.status(401).json({
            error: 'No session token'
        });
        return;
    }

    const acn_axios = req.app.locals.acn_axios;

    try {
        let res2 = await acn_axios.get('/sessions/me', {
            headers: {
                'X-Parse-Session-Token': session_token
            }
        });

        req.acn_session = res2.data;
    } catch (err) {
        if (err.response) {
            // Invalid session token
            if (err.response.status === 400 && err.response.data.code === 209) {
                res.status(401).json({
                    error: 'Invalid session token'
                });
            } else if (err.response.status === 504) {
                console.log('acn timeout');
                res.status(504).json({
                    error: 'Upstream timeout in acn session management'
                });
            } else {
                console.log('error in session verification');
                let status_string = err.response.status + ' ' + 
                        err.response.statusText;
                console.log(status_string);
                res.status(500).json({
                    error: 'Upstream error from acn session management',
                    response: status_string
                });
            }
        } else if (err.code === 'ECONNABORTED') {
            console.log('acn timeout');
            res.status(504).json({
                error: 'Upstream timeout in acn session management'
            });
        } else {
            console.log('error in session verification - no response');
            console.log(err);
            res.status(500).json({
                error: 'Check server log',
                error_code: err.code 
            });
        }
        return;
    }
    
    if (typeof next === 'function') {
        next();
    }
};

exports.userIsAdmin = async function (req, res, next) {
    if (typeof req.acn_session === 'undefined') {
        throw new Error('No acn user management object found in req');
    }

    let user_object_id = req.acn_session.user.objectId;
    const user_axios = req.app.locals.user_axios;

    let res2;
    try {
        res2 = await user_axios.get(`/user/acn:${user_object_id}/public`);
    } catch (err) {
        if (err.response && err.response.status === 404) {
            res.status(404).json({
                error: 'User not found'
            });
        } else {
            console.error(err);
            res.status(500).json({
                error: 'Db error'
            });
        }
        return;
    }
    
    if (res2.data.user_type !== 2) {
        res.status(403).json({
            error: 'Only an admin can perform this action'
        });
        return;
    } 

    // Ok, all is well
    if (typeof next === 'function') {
        next();
    }
}