/**
 * Modules
 */

 const forEach = require('@f/foreach')
 const clone = require('@f/clone-shallow')
 const fs = require('fs')

/**
 * Expose
 */

module.exports = terraGateway

/**
 * Variables
 */

terraGateway.DEPTH = 20

/**
 * terra-gateway
 */

function terraGateway (spec, output) {
  spec.base = spec.base || ''
  const {resources, depends} = init(spec)
  fill(spec, resources, depends)
  out(resources, output)
}

function init (spec) {
  const resources = {}
  const depends = []

  // API

  resources["aws_api_gateway_rest_api"] = {
    [spec.id]: {
      name: spec.name,
      description: spec.description
    }
  }

  resources["aws_api_gateway_resource"] = {}
  resources["aws_api_gateway_method"] = {}
  resources["aws_api_gateway_integration"] = {}
  resources["aws_api_gateway_integration_response"] = {}
  resources["aws_api_gateway_method_response"] = {}

  resources["aws_api_gateway_deployment"] = {
    [spec.stage]: {
      depends_on: depends,
      rest_api_id: getRestAPI(spec.id),
      stage_name: spec.stage
    }
  }

  return {resources, depends}
}

function fill (spec, resources, depends) {
  const r = resources["aws_api_gateway_resource"]
  const m = resources["aws_api_gateway_method"]
  const gi = resources["aws_api_gateway_integration"]
  const ir = resources["aws_api_gateway_integration_response"]
  const mr = resources["aws_api_gateway_method_response"]
  const api = getRestAPI(spec.id)
  for (var i = 0; i < terraGateway.DEPTH; i++) {
    var name = `${spec.id}_${i}`
    var parent = `${spec.id}_${i - 1}`
    var resource
    // gateway resource

    if (i === 0 && spec.base === '/') {
      resource = getRootResource(spec.id)
    } else if (i === 0) {
      r[name] = {
        rest_api_id: api,
        parent_id: getRootResource(spec.id),
        path_part: spec.base
      }
      resource = getResource(name)
    } else {
      r[name] = {
        rest_api_id: api,
        parent_id: getResource(parent),
        path_part: `{path${i}}`
      }
      resource = getResource(name)
    }

    forEach((methodSpec, method) => {
      var methodName = name + '_' + method
      m[methodName] = {
        "rest_api_id": api,
        "resource_id": resource,
        "http_method": method,
        "authorization": "NONE"
      }
      gi[methodName] = {
        "rest_api_id": api,
        "resource_id": resource,
        "http_method": getMethod(methodName),
        "type": "AWS",
        "integration_http_method": "POST",
        "credentials": methodSpec.request.credentials,
        "uri": getUri(methodSpec.request.lambda_arn),
        "request_templates": getTemplates(methodSpec.request.templates, i)
      }
      depends.push("aws_api_gateway_integration." + methodName)
      forEach((responseSpec, response) => {
        var statusName = methodName + '_' + response
        ir[statusName] = {
          "rest_api_id": api,
          "resource_id": resource,
          "http_method": getMethod(methodName),
          "status_code": getStatusCode(statusName),
          "response_templates": responseSpec.body
        }
        depends.push("aws_api_gateway_integration_response." + statusName)
        mr[statusName] = {
          "rest_api_id": api,
          "resource_id": resource,
          "http_method": getMethod(methodName),
          "status_code": response,
          "response_models": responseSpec.models
        }

        if (responseSpec.headers) {
          var keys = Object.keys(responseSpec.headers)
          var irResponse = {}
          var mrResponse = {}
          keys.forEach(function (key) {
            irResponse['method.response.header.' + key] = responseSpec.headers[key]
            mrResponse['method.response.header.' + key] = true
          })
          ir[statusName].response_parameters_in_json = JSON.stringify(irResponse)
          ir[statusName]["depends_on"] = ["aws_api_gateway_method_response." + statusName]
          mr[statusName].response_parameters_in_json = JSON.stringify(mrResponse)
        }

      }, methodSpec.responses)
    }, spec.methods)
  }
}

function out (resources, filename) {
  fs.writeFileSync(filename, JSON.stringify({
    resource: resources
  }, null, 2))
}

function getResource (name) {
  return `\${aws_api_gateway_resource.${name}.id}`
}

function getUri (lambdaARN) {
  return `arn:aws:apigateway:\${var.aws_region}:lambda:path/2015-03-31/functions/${lambdaARN}/invocations`
}

function getStatusCode (name) {
  return `\${aws_api_gateway_method_response.${name}.status_code}`
}

function getRootResource (id) {
  return `\${aws_api_gateway_rest_api.${id}.root_resource_id}`
}

function getMethod (name) {
  return `\${aws_api_gateway_method.${name}.http_method}`
}

function getRestAPI (id) {
  return `\${aws_api_gateway_rest_api.${id}.id}`
}

function getTemplates (templates, depth) {
  templates = clone(templates)
  var inputs = ''
  for (var i = 0; i < depth; i++) {
    inputs += `/$input.params('path${i+1}')`
  }
  inpurts = inputs || '/'
  var prefix = `#set($url = "${inputs}")`
  forEach((obj, key) => {
    templates[key] = prefix + '\n' + JSON.stringify(obj, null, 2)
  }, templates)
  return templates
}
