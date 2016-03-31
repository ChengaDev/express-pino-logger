'use strict'

var pino = require('pino')
// var onFinished = require('on-finished')
var eos = require('end-of-stream')
var uuid = require('uuid')

function pinoLogger (stream, opts) {
  opts = opts || {}

  opts.serializers = opts.serializers || {}
  opts.serializers.req = opts.serializers.req || asReqValue
  opts.serializers.res = opts.serializers.res || pino.stdSerializers.res

  var logger = pino(opts, stream)

  loggingMiddleware.logger = logger

  return loggingMiddleware

  function onResFinished (err, res) {
    var log = res.log

    if (err) {
      log.error({
        res: res,
        err: err
      }, 'request errored')
      return
    }

    log.info({
      res: res
    }, 'request completed')
  }

  function loggingMiddleware (req, res, next) {
    req.id = uuid.v4()

    var child = logger.child({ req: req })

    req.log = child
    res.log = child

    eos(res, function (err) {
      onResFinished(err, res)
    })

    if (next) {
      next()
    }
  }
}

function asReqValue (req) {
  return {
    id: req.id,
    method: req.method,
    url: req.url,
    headers: req.headers,
    remoteAddress: req.connection.remoteAddress,
    remotePort: req.connection.remotePort
  }
}

module.exports = pinoLogger
