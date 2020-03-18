
// import
import { Server } from '../src/index';
import { ServerError, Forbidden } from '../src/errors';

// database
class App extends Server {
  /**
   * Default data for server mock.
   */
  data() {
    const getAuthor = post => this.get('authors', post.author_id);
    const getComments = post => this.get('comments').filter(x => x.post_id === post.id);
    return {
      profile: {
        username: 'admin',
      },
      posts: [
        {
          title: 'Foo',
          body: 'foo bar',
          author_id: 1,
          author: getAuthor,
          comments: getComments,
        },
        {
          title: 'Bar',
          body: 'bar baz',
          author_id: 1,
          author: getAuthor,
          comments: getComments,
        },
      ],
      history: [
        { delta: 'foo', post_id: 1 },
        { delta: 'bar', post_id: 1 },
      ],
      authors: [
        { name: 'Jane Doe', email: 'jane@doe.com' },
        { name: 'John Doe', email: 'john@doe.com' },
      ],
      comments: [
        { user: 'jack', body: 'foo comment', post_id: 1 },
        { user: 'jill', body: 'bar comment', post_id: 1 },
      ],
    };
  }

  api() {
    return {
      // profile
      '/profile': this.singleton({ model: 'profile' }),

      // posts
      '/posts': this.collection({
        model: 'posts',
        exclude: ['author', 'comments'],
      }),
      '/posts/:id': this.model({
        model: 'posts',
        exclude: ['author_id'],
      }),
      '/posts/:id/author': this.model({
        model: 'authors',
        key: 'author_id',
      }),
      '/posts/:id/history': this.collection({
        model: 'history',
        key: 'post_id',
      }),
      '/posts/:id/archive': {
        post: (id) => {
          this.db.posts[id].archived = true;
          return this.get('posts', id);
        },
      },

      // authors
      '/authors': this.collection('authors'),
      '/authors/:id': this.model('authors'),
      '/authors/:id/posts': this.collection({
        model: 'posts',
        key: 'author_id',
        exclude: ['author', 'comments'],
      }),

      // errors
      '/errors/server': {
        get: () => {
          throw new ServerError()
        },
      },
      '/errors/forbidden': {
        get: () => {
          throw new Forbidden()
        },
      }
    };
  }
}

// exports
export default new App('blog');
