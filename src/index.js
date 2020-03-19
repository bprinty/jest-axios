/**
 * Main exports for project.
 */


// imports
// -------
import { Server } from './server';
import { Singleton, Collection } from './models';
import {
 Forbidden, NotFound, Missing, ServerError,
} from './errors';


// exports
// -------
export default {
  // main
  Server,
  // models
  Singleton,
  Collection,
  // errors
  Forbidden,
  NotFound,
  Missing,
  ServerError,
};
