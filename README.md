# nodeREST

This is a demo for a full stack, nodeJS based single page application that implements RESTful APIs for user authentication and managment of the resources "user" and "expense". It showcases a simple app where users can sign-up, log-in and create "expense" records as well as view stats of their expenses over time.

The user authentication is RESTful based on JWT tokens and implements 3 roles:

- admins can CRUD on all resources
- managers can CRUD on all users (except admin) and own expenses
- users can CRUD on own expenses

The front end is based on the great semantic UI and jQuery.

The goal of this app is to show best practices and provide a boilerplate for a nodeJS based single page app that implements RESTful user authentication with roles and RESTful user & resource managment.

## Configuration
For testing / dev environments copy the `test.env.tmpl` and `development.env.tmpl` files and rename them in `test.env` and `development.env` and adjust the values as needed. Then
- use `grunt test` to run tests
- use `grunt dev` to run the app in dev mode
In production environment you have to set all the environment variables from these files on your system while adjusting the values as needed. **Be sure to set `NODE_ENV=production`.** The connection to `mongodb` must be made with an admin user.
As and admin this should be all you need. As a developer you might also want to look into `config/config.js`.

## Logging
The app logs info, debug and error messages to `log/` and to the standard out. It is recommended to use the standard out to collect all messages to be sent to other services. Note that log files can become quite huge, set the log level via the `LOG_LEVEL` environment variable.

## Health Checks
The app provides a `/health` route that will return `{ "status": "OK" }` if the app runs as expected. Use this for health monitoring.

## Routes
All app API endpoints can be reached under their corresponding version as in `/v1/*`. The API behaves RESTful based on standard HTTP request methods.

## Deployment
IMPORTANT: the app **must** be deployed & used with an SSL certificate to secure the connections as passwords are being sent unencrypted!
This app was developed for any Linux OS with
- `node.js` >= 6.2.0
- `npm` >= 3.8.9
- `mongodb` >= 3.2.0
and for testing / dev environment
- `eslint` >= 2.11.0
- `grunt-cli` >= 1.2.0 & `grunt` >= 0.4.5
After installing these dependencies and configuring as described under "Configuration" run `npm install` (and `grunt test` in dev environment).
Run the service via `node server.js`.
NOTE: the connection to `mongodb` must be made as an admin user.
