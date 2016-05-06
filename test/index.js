/**
 * Imports
 */

const test = require('tape')
const terraGateway = require('..')

/**
 * Tests
 */

test('should work', (t) => {

  const spec = {
    "id": "function_router",
    "name": "Function Router API",
    "description": "Route requests to functions.",
    "methods": {
      "GET": {
        "request": {
          "credentials": "${aws_iam_role.gateway_invoke_lambda.arn}",
          "lambda_arn": "function_router",
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

  terraGateway.DEPTH = 2
  const out = terraGateway(spec)

  t.ok(out.resource)
  t.ok(out.resource["aws_api_gateway_rest_api"])
  t.ok(out.resource["aws_api_gateway_resource"])
  t.ok(out.resource["aws_api_gateway_method"])
  t.ok(out.resource["aws_api_gateway_integration"])
  t.ok(out.resource["aws_api_gateway_integration_response"])
  t.ok(out.resource["aws_api_gateway_deployment"])
  t.end()
})
