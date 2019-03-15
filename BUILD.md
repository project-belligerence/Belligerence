# How to build BELLIGERENCE

## Linux

### Prerequisites

* A host of some kind (Ubuntu 18.04 recommended)
* Node >8.0
* MySQL Server
* Redis Server
    
### Preparing the environment

This section assumes you're using a Virtual Machine running Ubuntu 18.04

First, install `node` (preferrably from node-source ppa), `mysql-server` and `redis` packages from apt

For `node-gyp`, you will also need `gcc g++ make`


### Installing Belligerence
1. Create a database for Belligerence to use:
```sql
CREATE DATABASE myBelligerenceDatabase;
```

2. Create a user that will manipulate database:
```sql
USE myBelligerenceDatabase;
GRANT ALL PRIVILEGES ON myBelligerenceDatabase.* TO 'user'@'localhost' IDENTIFIED BY 'supersecretpassword';
```

3. Clone repository somewhere and copy `.env.dist` into `.env` file. Edit resulting file, changing Database name and credentials that you've created previously. You will also need Steam API key that you can grab from [here](https://steamcommunity.com/dev/apikey)

>WARNING: OAuth return url won't work if your server is not running on port 80, for that you will need to either proxy the server with `nginx`, or run `node` as superuser (not recommended)

4. Run `npm install && npm run build`

5. If everything went well you should be able to run the app with `node app.js` and access it from `PROTOCOL://ADDRESS:PORT` as specified in .env
