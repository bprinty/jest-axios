# Jest Axios

## Overview

This is placeholder documentation for a generic javascript package. For a new project, this section should be changed.


## Prerequisites

Talk about prerequisites for understanding the project. If there are ideas or concepts the user should reference if they're confused, those should go here with [links](https://en.wikipedia.org/wiki/ECMAScript).


## Why is this Useful?

Talk about why this module is necessary/useful.

## Quickstart

### Idea

Cover the nuances of the main concepts in these idea blocks, with code:

```javascript
import { Server } from 'jest-axios';

class App extends Server {

  data() {
    return {
      posts: [
        { title: 'Foo', body: 'foo bar' },
        { title: 'Bar', body: 'bar baz' },
      ],
    };
  }

  api() {
    return {
      '/posts': this.collection('posts'),
      '/posts/:id': this.model('posts')
    };
  }
}
```

### Diagrams

Diagrams are helpful for explaining abstract concepts.

<mermaid>
graph TD;
    A-->B;
    A-->C;
    B-->D;
    C-->D;
</mermaid>

### A Minimal Application

Provide an example of a minimal application using the package, with code.


## Table of Contents

- [Setup](/guide/setup/configure.md)
- [Usage](/guide/usage/overview.md)
- [API](/api/)


## Additional Resources

- [Jest](https://jestjs.io/)
- [Jest Mocking Tools](https://jestjs.io/docs/en/mock-functions)
- [Axios](https://github.com/axios/axios)
