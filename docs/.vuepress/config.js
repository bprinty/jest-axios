module.exports = {
  base: '/jest-axios/',
  locales: {
    '/': {
      lang: 'en-US',
      title: 'Jest Axios',
      description: 'Axios request mocking for REST API testing.'
    }
  },
  theme: '@vuepress/theme-default',
  plugins: [
    // 'autodoc'
    require('../../../vuepress-plugin-autodoc/dist/index.cjs.js')
  ],
  themeConfig: {
    repo: 'bprinty/jest-axios',
    docsDir: 'docs',
    docsBranch: 'master',
    editLinks: true,
    displayAllHeaders: true,
    sidebarDepth: 1,
    locales: {
      '/': {
        label: 'English',
        selectText: 'Languages',
        lastUpdated: 'Last Updated',
        editLinkText: 'Edit this page on GitHub',
        sidebar: {
          '/': [
            {
              title: 'Setup',
              path: '/setup/',
              collapsable: false,
            },
            {
              title: 'Guide',
              path: '/guide/',
              collapsable: false,
            },
            {
              title: 'API',
              path: '/api/',
              collapsable: true,
            }
          ]
        }
      }
    }
  }
}
