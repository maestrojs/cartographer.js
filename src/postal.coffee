class PostalSetup
  constructor: ->
    self = this
    postal.subscribe "cartographer", "api", (message, envelope) ->
      operation = message.operation
      self[operation](message)

  apply: (message) ->
    name = message.name
    template = message.template
    model = message.model
    cartographer.apply name, template, model, (
      (id, markup, op) ->
        postal.publish "cartographer", "render.#{template}",
        template: template
        markup: markup
        operation: "render"
      ),
      ( (error) ->
          postal.publish "cartographer", "render.#{error}",
          template: template
          error: error
          operation: "render"
      )

  map: (message) ->
    cartographer.map message.name

  resolver: (message) ->
    if message.order == "prepend"
      cartographer.resolver.prependSource message.resolver
    else
      cartographer.resolver.appendSource message.resolver

  add: (message) ->
    templateId = message.template
    fqn = message.id
    model = message.model
    cartographer.add templateId, fqn, model, (id,markup, op) ->
      postal.publish "cartographer", "render.{templateId}",
        template: templateId
        parent: fqn
        markup: markup
        operation: "add"

  update: (message) ->
    templateId = message.template
    fqn = message.id
    model = message.model
    cartographer.update templateId, fqn, model, (id, markup, op) ->
      postal.publish "cartographer", "render.{templateId}",
          template: templateId
          id: fqn
          markup: markup
          operation: "update"

setup = new PostalSetup()