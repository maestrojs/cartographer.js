Cartographer = () ->
  self = this
  @config = configuration
  @templates = {}

  @map = ( id, name, model ) ->
    template = new Template id, name, model
    self.templates[id] = template
    true

  @apply = ( id, model, onMarkup, onError ) ->
    onMarkup = onMarkup ||
      (result) -> postal.publish "cartographer", "render.#{id}", { id: id, markup: result }
    onError = onError ||
      (result) -> postal.publish "cartographer", "render.error.#{id}", result

    if self.templates[id]
      template = self.templates[id]
      template.apply model, (result) ->
        onMarkup result
    else if model.__template__ and id
      self.map id, model.__template__, model
      self.apply id, model, onMarkup, onError
    else
      onError "No template with #{id} has been mapped"

  @resolver = resolver
  self

cartographer = new Cartographer()

# subscribe to api calls
postal.subscribe "cartographer", "api.*", (message, envelope) ->
  if envelope.topic == "api.map"
    cartographer.map message.id, message.name, message.model
  else if envelope.topic == "api.apply"
    cartographer.apply message.id, message.model
  else if envelope.topic == "api.templateSource"
    cartographer.resolver.appendSource message.provider

# subscribe to watch/unwatch events
postal.subscribe "cartographer", "event.*", (message, envelope) ->
  if envelope.topic == "event.watch"
    template = cartographer.templates[message.id]
    template?.watchEvent(message.event)
  else if envelope.topic == "event.ignore"
    template = cartographer.templates[message.id]
    template?.ignoreEvent(message.event)

postal.subscribe "postal", "subscription.*", (message, envelope) ->
  if envelope.topic == "subscription.created" && message.exchange.match /^cartographer[.].+/
    templateId = message.exchange.split('.')[1]
    template = cartographer.templates[templateId]
    if template
      parts = message.topic.split('.')
      template.watchEvent parts[parts.length-1]
  else if message.exchange.match /^cartographer[.]*/
    templateId = message.exchange.split('.')[1]
    template = cartographer.templates[templateId]
    if template
      parts = message.topic.split('.')
      template.ignoreEvent parts[parts.length-1]

cartographer