console.log = function() {};
const fs = require('fs');
const expect = require('chai').expect;
const assert = require('chai').assert;
const code = fs.readFileSync('app.js', 'utf8');
const Structured = require('structured');
const request = require('supertest');
const rewire = require('rewire');
process.env.IS_TEST_ENV = true;

describe('', function() {
  it('', function(done) {
    process.env.PORT = 8002;
    let appModule = rewire('../app.js');
    const app = appModule.__get__('app');
    let validateCard
    try {
      validateCard = appModule.__get__('validateCard');
    } catch (e) {

    }
    expect(validateCard, 'Did you create a `validateCard` function?').to.be.a('function');
    expect(validateCard.length, 'Does `validateCard` take three arguments?').to.equal(3);

    let status = null;;
    let sent = null;
    const req = {
      body: {
        suit: 'invalid',
        rank: '2',
      }
    }
    const res = {
      status: function(code) { 
        status = code;
        return this;
      },
      send: function(arg) {
        sent = arg;
      }
    };
    let nextCalled = false;
    const next = () => {
      nextCalled = true;
    }

    // call learner middleware with invalid suit
    validateCard(req, res, next);
    expect(status, 'Did you set the proper status for invalid card data?').to.equal(400);
    expect(sent, 'Did you sent the same `Invalid card!` message for invalid input?').to.equal('Invalid card!');
    expect(nextCalled, 'Don\'t call `next` with invalid card formats').to.be.false;

    status = null;
    sent = null;
    nextCalled = false;
    req.body = {
      suit: 'Clubs',
      rank: 'Invalid',
    }
    validateCard(req, res, next);
    expect(status, 'Did you set the proper status for invalid card data?').to.equal(400);
    expect(sent, 'Did you sent the same `Invalid card!` message for invalid input?').to.equal('Invalid card!');
    expect(nextCalled, 'Don\'t call `next` with invalid card formats').to.be.false;

    // verify that next is called for correct input
    status = null;
    sent = null;
    nextCalled = false;
    req.body = {
      suit: 'Clubs',
      rank: '3',
    }
    validateCard(req, res, next);
    expect(nextCalled, 'Did you call `next` for cards that pass the validations?').to.be.true;

    // Ensure that duplicate checks are removed
    let validRanksMatch = code.match(/validRanks/g);
    let validSuitsMatch = code.match(/validSuits/g);
    expect(validRanksMatch.length, 'Did you remove duplicate versions of the validation logic?').to.equal(2);
    expect(validSuitsMatch.length, 'Did you remove duplicate versions of the validation logic?').to.equal(2);

    // Ensure that `validateCard` is used in the middleware stack.
    let validateCardMatch = code.match(/validateCard/g);
    expect(validateCardMatch.length, 'Did you use `validateCard` in the middleware stacks for PUT and POST routes?').to.equal(3);

    // Double check behavior in context of the app.
    request(app)
    .post('/cards/')
    .send({
      suit: 'Invalid',
      rank: '2',
    })
    .then(response => {
      expect(response.status, 'You should still allow for proper app.post behavior').to.equal(400);
    })
    .then(() => {
      return request(app)
      .post('/cards/')
      .send({
        suit: 'Clubs',
        rank: 'Invalid',
      });
    })
    .then(response => {
      expect(response.status, 'You should still allow for proper app.post behavior').to.equal(400);
    })
    .then(() => {
      return request(app)
      .post('/cards/')
      .send({
        suit: 'Clubs',
        rank: '3',
      });
    })
    .then(response => {
      expect(response.status, 'You should still allow for proper app.post behavior').to.equal(201);
    })
    .then(() => {
      return request(app)
      .get('/cards/1');
    })
    .then(response => {
      expect(response.status).to.equal(200);
      expect(response.body, 'Your middleware should not change how GET /cards/:cardId behaves.').to.deep.equal(appModule.__get__('cards')[0])
    })
    .then(() => {
      return request(app)
      .put('/cards/1')
      .send({
        suit: 'Diamonds',
        rank: 'Ace',
      });
    })
    .then((response) => {
      expect(response.body, 'Your middleware should not affect how PUT /cards/:cardId sends back an updated card object.').to.deep.equal({
        id: 1,
        suit: 'Diamonds',
        rank: 'Ace',
      });
      expect(response.body, 'Your middleware should not change how PUT /cards/:cardId behaves.').to.deep.equal(appModule.__get__('cards')[0]);
    })
    .then(() => {
      return request(app)
      .del('/cards/1');
    })
    .then(response => {
      expect(response.status, 'Your middleware should not change how DELETE /cards/:cardId behaves.').to.equal(204);
      const cards = appModule.__get__('cards');
      const foundIndex = cards.findIndex(card => card.id === 1);
      expect(foundIndex, 'Your middleware should not change how DELETE /cards/:cardId behaves.').to.equal(-1);
      done();
    })
    .catch(done);
  });
});