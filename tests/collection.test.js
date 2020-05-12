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
describe('collection', () => {
  let res;

  test('collection.get', async () => {
    res = await axios.get('/posts');
    assert.equal(res.status, 200);
    assert.deepEqual(res.data, [
      { id: 1, title: 'Foo', body: 'foo bar', author_id: 1 },
      { id: 2, title: 'Bar', body: 'bar baz', author_id: 1 },
    ]);
  });

  test('collection.post', async () => {
    res = await axios.post('/posts', { title: 'Baz', body: 'baz baz', author_id: 2 });
    assert.equal(res.status, 201);
    assert.deepEqual(res.data, {
      id: 3,
      title: 'Baz',
      body: 'baz baz',
      author_id: 2
    });
  });

  test('collection.post.multiple', async () => {
    res = await axios.post('/posts', [
        { title: 'One', body: 'test' },
        { title: 'Two', body: 'test' }
    ]);
    assert.equal(res.status, 201);
    assert.deepEqual(res.data, [
      { id: 3, title: 'One', body: 'test' },
      { id: 4, title: 'Two', body: 'test' }
    ]);
  });
});
