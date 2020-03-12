# Singleton

The [Models](/guide/models/singleton.md) section of the documentation detailed how to define a data model for a `singleton` object in an application. You can similarly set up `singleton` configuration for the store directly.

As a refresher, here is the endpoint we use to manage `profile` information about the current user of the application.

```
GET /profile - Get all profile data for current user.
PUT /profile - Update profile data for current user.
```

With this endpoint, there are no collections to manage and no model instances to keep track of - we only need to query or update profile information. To define a singleton object with store configuration, simply set the `singleton` parameter in the model store configuration:

```javascript
import v from 'validator';

const profile = {
  singleton: true,
  default: {},
  api: {
    model: '/profile',
  },
  contract: {
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
  },
};
```

With this singleton model, we can access data like we do with other models, but without needing to track multiple model instances:

```javascript
// fetch profile data and add to store
await store.dispatch('profile.fetch');

// get profile data from store
const profile = store.getters['profile']();

// get username
profile.username

// update token
profile.token = '...';
await store.dispatch('profile.update', profile);
```

Additionally, all of the property configuration defined in `contract` is honored like other models:

```javascript
profile.username = 'Invalid Username';
await store.dispatch('profile.update', profile); // throws validation error
```
