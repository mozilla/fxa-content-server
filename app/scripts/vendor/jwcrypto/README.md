## build jwcrypto.*.js

jwcrypto.*.js is built from source using browserify:

```bash
browserify -s jwcrypto index.ds.js > jwcrypto.ds.js
browserify -s jwcrypto index.rs.js > jwcrypto.rs.js
```

`jwcrypto.ds.js` is used by the content server.
`jwcrypto.rs.js` is used by the unit tests.


