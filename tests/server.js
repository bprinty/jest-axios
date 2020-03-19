
// import
import { Server } from '../src/server';
import { ServerError, Forbidden } from '../src/errors';

// database
class App extends Server {
  /**
   * Default data for server mock.
   */
  data() {
    const getAuthor = post => this.db.authors.get(post.author_id) || null;
    const getComments = post => this.db.comments.all().filter(x => x.post_id === post.id);
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
        exclude: ['author_id', 'comments'],
      }),
      '/posts/:id/author': this.model({
        model: 'authors',
        relation: 'posts',
        key: 'author_id',
      }),
      '/posts/:id/history': this.collection({
        model: 'history',
        relation: 'posts',
        key: 'post_id',
      }),
      '/posts/:id/archive': {
        post: (data, id) => {
          this.db.posts.update(id, { archived: true });
          return this.db.posts.get(id);
        },
      },

      // authors
      '/authors': this.collection('authors'),
      '/authors/:id': this.model('authors'),
      '/authors/:id/posts': this.collection({
        model: 'posts',
        relation: 'authors',
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
