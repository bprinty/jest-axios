/**
 * Testing for package.
 */


// imports
// -------
import axios from 'axios';
import { assert } from 'chai';
import server from './server';


// config
// ------
jest.mock('axios');
server.init(axios);
beforeEach(() => {
  server.reset();
});


// tests
// -----
describe('errors', () => {
  let res;

  test('errors.notfound', async () => {
    try {
      await axios.get('/errors/missing');
      assert.fail('Request should have thrown an error.');
    } catch (err) {
      assert.equal(err.status, 404);
    }
  });

  test('errors.forbidden', async () => {
    try {
      await axios.get('/errors/forbidden');
      assert.fail('Request should have thrown an error.');
    } catch (err) {
      assert.equal(err.status, 403);
    }
  });

  test('errors.inernal', async () => {
    try {
      await axios.get('/errors/server');
      assert.fail('Request should have thrown an error.');
    } catch (err) {
      assert.equal(err.status, 500);
    }
  });

});
