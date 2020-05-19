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

  test('collection.put', async () => {

    // single item
    res = await axios.put('/posts', { id: 1, title: 'Test', body: 'test bar', author_id: 1 });
    assert.equal(res.status, 200);
    assert.deepEqual(res.data, {
      id: 1,
      title: 'Test',
      body: 'test bar',
      author_id: 1
    });

    // several items
    res = await axios.put('/posts', [
      { id: 1, title: 'Footest', body: 'foo bar test', author_id: 1 },
      { id: 2, title: 'Bartest', body: 'bar baz test', author_id: 1 },
    ]);
    assert.equal(res.status, 200);
    assert.deepEqual(res.data, [
      { id: 1, title: 'Footest', body: 'foo bar test', author_id: 1 },
      { id: 2, title: 'Bartest', body: 'bar baz test', author_id: 1 },
    ]);
  });

  test('collection.post', async () => {

    // single item
    res = await axios.post('/posts', { title: 'Baz', body: 'baz baz', author_id: 2 });
    assert.equal(res.status, 201);
    assert.deepEqual(res.data, {
      id: 3,
      title: 'Baz',
      body: 'baz baz',
      author_id: 2
    });

    // several items
    res = await axios.post('/posts', [
      { title: 'One', body: 'test' },
      { title: 'Two', body: 'test' }
    ]);
    assert.equal(res.status, 201);
    assert.deepEqual(res.data, [
      { id: 4, title: 'One', body: 'test' },
      { id: 5, title: 'Two', body: 'test' }
    ]);

  });

  test('collection.delete', async () => {

    // single item
    res = await axios.delete('/posts', { id: 1, title: 'Test', body: 'test bar', author_id: 1 });
    assert.equal(res.status, 204);
    res = await axios.get('/posts');
    assert.equal(res.data.length, 1);

    // several items
    res = await axios.delete('/posts', [
      { id: 2, title: 'Bar', body: 'bar baz test', author_id: 1 },
    ]);
    assert.equal(res.status, 204);
    res = await axios.get('/posts');
    assert.equal(res.data.length, 0);
  });

});
