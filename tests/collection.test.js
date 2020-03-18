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
server.init();
beforeEach(() => {
  server.reset();
});


// tests
// -----
describe('collection', () => {
  let res;

  test('collection.get', async () => {
    res = await axios.get('/posts');
    assert.equal(res.status, 200);
    assert.deepEqual(res.data, [
      {},
    ]);
  });

  // test('collection.post', async () => {
  //
  // });

});
