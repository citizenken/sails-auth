/**
 * Authentication Controller
 */
'use strict';

module.exports = {

  /**
   * Log out a user and return them to the homepage
   *
   * Passport exposes a logout() function on req (also aliased as logOut()) that
   * can be called from any route handler which needs to terminate a login
   * session. Invoking logout() will remove the req.user property and clear the
   * login session (if any).
   *
   * For more information on logging out users in Passport.js, check out:
   * http://passportjs.org/guide/logout/
   *
   * @param {Object} req
   * @param {Object} res
   */
  logout: function logout(req, res) {
    req.logout();
    delete req.user;
    delete req.session.passport;
    req.session.authenticated = false;

    if (!req.isSocket) {
      res.redirect(req.query.next || '/');
    } else {
      res.ok();
    }
  },

  /**
   * Create a third-party authentication endpoint
   *
   * @param {Object} req
   * @param {Object} res
   */
  provider: function provider(req, res) {
    sails.services.passport.endpoint(req, res);
  },

  /**
   * Create a authentication callback endpoint
   *
   * This endpoint handles everything related to creating and verifying Pass-
   * ports and users, both locally and from third-aprty providers.
   *
   * Passport exposes a login() function on req (also aliased as logIn()) that
   * can be used to establish a login session. When the login operation
   * completes, user will be assigned to req.user.
   *
   * For more information on logging in users in Passport.js, check out:
   * http://passportjs.org/guide/login/
   *
   * @param {Object} req
   * @param {Object} res
   */
  callback: function callback(req, res) {
    var action = req.param('action');

    function negotiateError(err) {
      res.send(err.status, err);
    }

    sails.services.passport.callback(req, res, function (err, user) {
      if (err || !user) {
        sails.log.warn(user, err);
        return negotiateError(err);
      }

      req.login(user, function (err) {
        if (err) {
          sails.log.warn(err);
          return negotiateError(err);
        }

        req.session.authenticated = true;

        // Upon successful login, optionally redirect the user if there is a
        // `next` query param
        var provider = req.param('provider'),
            next = null;

        if (req.query.next || sails.config.passport[provider] && sails.config.passport[provider].nextUrl) {
          next = req.query.next || sails.config.passport[provider].nextUrl;
        }

        if (next) {
          var url = sails.services.authservice.buildCallbackNextUrl(next, req);
          res.status(302).set('Location', url);
        }

        sails.log.info('user', user, 'authenticated successfully');
        return res.json(user);
      });
    });
  },

  /**
   * Disconnect a passport from a user
   *
   * @param {Object} req
   * @param {Object} res
   */
  disconnect: function disconnect(req, res) {
    sails.services.passport.disconnect(req, res);
  }
};