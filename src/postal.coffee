PostalSetup = () ->
  self = this

  @apply = (message) ->
    template = message.template
    model = message.model
    cartographer.apply template, model, (
      (id, op, markup) ->
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
    cartographer.map message.template, message.name

  @resolver = (message) ->
    if message.order == "prepend"
      cartographer.resolver.prependSource message.resolver
    else
      cartographer.resolver.appendSource message.resolver

  @add = (message) ->
    templateId = message.template
    fqn = message.id
    model = message.model
    template = cartographer.templates[templateId]
    template.add fqn, model, (id, op, markup) ->
      postal.publish "cartographer", "render.{templateId}",
        template: templateId
        parent: fqn
        markup: markup
        operation: "add"

  @update = (message) ->
    templateId = message.template
    fqn = message.id
    model = message.model
    template = cartographer.templates[templateId]
    template.update fqn, model, (id, op, markup) ->
      postal.publish "cartographer", "render.{templateId}",
          template: templateId
          id: fqn
          markup: markup
          operation: "update"

  @watch = (message) ->
    template = cartographer.templates[message.template]
    template.watchEvent message.event, (template, elementId, element, event) ->
      postal.publish "cartographer.#{template}", "#{elementId}.#{event}", { element: element }

  @ignore = (message) ->
    template = cartographer.templates[message.template]
    template.ignoreEvent message.event

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