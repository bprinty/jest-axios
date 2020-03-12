# Singleton

Previous sections of the documentation detailed how to define front-end models for managing collections of objects. However, some data models aren't tied to a collection and simply represent some type of state on the backend. For these `singleton` models, developers typically only need to access or update their state, and they're usually user or context-specific.

Let's use user `Profile` data as an example. In this example, we fetch and update profile data form a single endpoint:

```
GET /profile - Get all profile data for current user.
PUT /profile - Update profile data for current user.
```

With this endpoint, there are no collections to manage and no model instances to keep track of - we only need to query or update profile information. To do so, let's define a model that extends from the `Singleton` object provided by this library:

```javascript
import v from 'validator';
import { Singleton } from 'vuex-reflect';

class Profile extends Singleton {

  static api() {
    model: '/profile',
  }

  static props() {
    return {
      /**
       * Username for current user.
       */
      username: {
        required: true,
        default: '<anonymous>',
        validate: value => !/\s/g.test(value),
        mutate: value => value.toLowerCase(),
        type: String,
      },
      /**
       * Authentication token for current user.
       */
      token: {
        default: null,
        validate: v.isJWT,
      }
    };
  }
}

```

With this singleton model, we can access data like we do with other models, but without needing to track multiple model instances:

```javascript
// fetch profile data and add to store
await Profile.fetch();

// instantiate profile from store
const profile = new Profile();

// get username
profile.username // locally
profile.$.username // in store

// update token
profile.token = '...';
await profile.commit();
```

Additionally, all of the property configuration defined in `props()` is honored like other models:

```javascript
profile.username = 'Invalid Username';
profile.commit() // throws validation error
```
