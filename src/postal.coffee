PostalSetup = () ->
  self = this

  @apply = (message) ->
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

  @map = (message) ->
    cartographer.map message.name

  @resolver = (message) ->
    if message.order == "prepend"
      cartographer.resolver.prependSource message.resolver
    else
      cartographer.resolver.appendSource message.resolver

  @add = (message) ->
    templateId = message.template
    fqn = message.id
    model = message.model
    cartographer.add templateId, fqn, model, (id,markup, op) ->
      postal.publish "cartographer", "render.{templateId}",
        template: templateId
        parent: fqn
        markup: markup
        operation: "add"

  @update = (message) ->
    templateId = message.template
    fqn = message.id
    model = message.model
    cartographer.update templateId, fqn, model, (id, markup, op) ->
      postal.publish "cartographer", "render.{templateId}",
          template: templateId
          id: fqn
          markup: markup
          operation: "update"

  @watch = (message) ->
    cartographer.watchEvent(
      message.template,
      message.event,
      (template, elementId, element, event) ->
        postal.publish "cartographer.#{template}", "#{elementId}.#{event}", { element: element }
    )

  @ignore = (message) ->
    cartographer.ignoreEvent message.template, message.event

  postal.subscribe "cartographer", "api", (message, envelope) ->
    operation = message.operation
    self[operation](message)

  postal.subscribe "postal", "subscription.*", (message, envelope) ->
    if message.exchange.match /^cartographer[.]*/
      templateId = message.exchange.split('.')[1]
      if cartographer.templates[templateId]
        parts = message.topic.split('.')
        command =
          template: templateId
          event: parts[parts.length-1]

        if envelope.topic == "subscription.created" && message.exchange.match /^cartographer/
          self.watch command
        else if message.exchange.match /^cartographer/
          self.ignore command

setup = new PostalSetup()