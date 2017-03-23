const setup = require('../../../test/setup');
const config = require('../../config');
const async = require('async');
const request = require('supertest');
const routes = require('.');
const Session = require('../../models/session');
const express = require('../../services/express');
const assert = require('assert');
const jwt = require('jsonwebtoken');

var app;

var session = { provider: 'test', user: { id: 123456789, test: 'test1234' } };
var sessionModel;


beforeEach(function(done) {
    app = express('/', routes);

    Session.create(session, function (err, sess) {
        if (err) return done(err);
        sessionModel = sess;
        done();
    });
});

afterEach(function(done){
    Session.remove({}, done);
});


describe('POST /revoke', function() {
    it('respond with 401 Unauthorized (no post data)', function(done) {
        request(app)
             .post('/revoke')
            .expect(401, done);
    });

    it('respond with 401 Unauthorized (invalid refresh token)', function(done) {
        request(app)
            .post('/revoke')
            .send({refresh_token: 'invalidrefreshtoken'})
            .expect(401, done);
    });

    it('respond with 200 OK (valid refresh token)', function(done) {
        var refreshToken = jwt.sign({user: session.user, session: sessionModel.serializeJwt()}, config.jwtSecret);
        request(app)
            .post('/revoke')
            .send({refresh_token: refreshToken})
            .expect(200)
            .end(function(err, res) {
                if (err) done(err);
                assert(!res.body.err, 'request returned error');
                assert(res.body.result === 'ok', 'result is not ok');

                Session.findOne({_id: sessionModel.id}, function(err, sess){
                    if(err) done(err);
                    assert(!sess, 'session still exists in the database');
                    done();
                });
            });
    });
});