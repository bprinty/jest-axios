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
describe('singleton', () => {
  let res;

  test('singleton.get', async () => {
    res = await axios.get('/profile');
    assert.equal(res.status, 200);
    assert.deepEqual(res.data, { username: 'admin' });
  });

  test('singleton.put', async () => {
    // udpate
    res = await axios.put('/profile', { username: 'test' });
    assert.equal(res.status, 200);
    assert.deepEqual(res.data, { username: 'test' });

    // check
    res = await axios.get('/profile');
    assert.deepEqual(res.data, { username: 'test' });
  });

  test('singleton.delete', async () => {
    // update and delete
    await axios.put('/profile', { username: 'test' });
    res = await axios.delete('/profile');
    assert.equal(res.status, 204);

    // check
    res = await axios.get('/profile');
    assert.deepEqual(res.data, { username: 'admin' });
  });

});
