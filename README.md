# Installing
Make sure that you have node greater than `0.10.38` and run the following command
```bash
npm install
```

# Linting
Run the following command
```bash
npm run lint
```

>Linting uses [eslint](https://eslint.org/) with the [airbnb](https://github.com/airbnb/javascript) style configuration.  To set up automatic linting on file save, consult the [eslint integration guide](https://eslint.org/docs/user-guide/integrations).  You may need to run the following commands for the linter to work in your IDE on file save

# Tests
Run the following command for [Mocha](https://mochajs.org/) tests with and without [jsDOM](https://github.com/tmpvar/jsdom)
```bash
npm run test
```

# Test Coverage Reports
Run the following command and visit [http://localhost:8080]()
```bash
npm run coverage
```
