# Installing
Make sure that you have node greater than `0.10.38` and run the following command
```
npm install
```
# Tests
Start the sixpack server locally

```bash
redis-server /usr/local/etc/redis.conf
cd $SIXPACK_PATH
workon sixpack
SIXPACK_CONFIG=./config.yml bin/sixpack
```

Back in this repo, run the following command

```bash
npm run mocha
```
