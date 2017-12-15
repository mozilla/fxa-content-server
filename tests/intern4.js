const intern = require('intern').default;

intern.configure({
  functionalSuites: ['tests/functional/404.js'],
  environments: { browserName: 'firefox' },
  reporters: 'runner',
  tunnelOptions: {
    'drivers': ['firefox']
  }
});
intern.run();


