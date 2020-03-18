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
describe('model', () => {
  let res;

  test('model.get', async () => {
    assert.isTrue(true);
  });

  // test('model.put', async () => {
  //
  // });
  //
  // test('model.delete', async () => {
  //
  // });

});
