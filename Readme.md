
# terra-gateway

[![Build status][travis-image]][travis-url]
[![Git tag][git-image]][git-url]
[![NPM version][npm-image]][npm-url]
[![Code style][standard-image]][standard-url]

Create terraform_api_gateway configs from a simple spec. The goal is to make it relatively easy to build out large complex gateways.

## Installation

    $ npm install terra-gateway

## Usage

```js
var terraGateway = require('terra-gateway')

const spec = {
  "id": "function_router",
  "name": "Function Router API",
  "description": "Route requests to functions.",
  "methods": {
    "GET": {
      "request": {
        "credentials": "${aws_iam_role.gateway_invoke_lambda.arn}",
        "lambda_arn": tfvars.apex_function_route,
        "templates": {
          "application/json": {
            "body": "$input.json('$')",
            "name": "$input.params('name')",
            "url": "$url",
            "headers": {
              "Content-Type": "$input.params().get('Content-Type')",
              "Host": "$input.params().header.get('Host')",
              "cookie": "$input.params('cookie')",
            },
            "header-params": "$input.params().header"
          }
        }
      },
      "responses": {
        "200": {
          "models": {
            "application/json": "Empty",
            "text/html": "Empty"
          },
          "headers": {
            "Content-Type": "integration.response.body.type"
          },
          "body": {
            "application/json": "$input.path('$.body')"
          }
        }
      }
    }
  },
  "stage": "prod"
}

terraGateway(spec, './function_router.tf.json')

```

## API

### terraGateway(spec, output)

- `spec` - api gateway spec
- `output` - output file path

#### spec

Type: `object`

##### id

Type: `string`

Unique terraform identifier.

##### name

Type: `string`

Name of API.

##### description

Type: `string`

API description.

##### methods

Map of HTTP methods to their respective **request** and responses.

**request**

Type: `object`

- `credentials` - {string} - Gateway lambda invoke role arn.
- `lambda_arn` - {string} - Lambda arn.
- `templates` - {object} - Request mapping template.

**responses**

Map of response codes to body and header maps.

Type: `object`

- `models` - {object} - Response models per content-type.
- `headers` - {object} - Map integration response to header.
- `body` - {object} - Map integration response to method response body.

##### stage

Type: 'string'

## License

MIT

[travis-image]: https://img.shields.io/travis/joshrtay/terra-gateway.svg?style=flat-square
[travis-url]: https://travis-ci.org/joshrtay/terra-gateway
[git-image]: https://img.shields.io/github/tag/joshrtay/terra-gateway.svg?style=flat-square
[git-url]: https://github.com/joshrtay/terra-gateway
[standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square
[standard-url]: https://github.com/feross/standard
[npm-image]: https://img.shields.io/npm/v/terra-gateway.svg?style=flat-square
[npm-url]: https://npmjs.org/package/terra-gateway
