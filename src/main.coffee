Cartographer = () ->
  self = this
  @config = configuration
  @templates = {}
  @containerLookup = {}
  @instanceCache = {}



  @map = ( name ) ->
    template = new Template name
    self.templates[name] = template
    true

  @apply = ( name, id, model, onMarkup, onError ) ->
    @containerLookup[id] = self.templates[name]
    if self.templates[name]
      template = self.templates[name]
      template.apply id, model, (id, op, result) ->
        self.instanceCache[id] = result
        onMarkup id, op, result
    else if model.__template__ and id
      templateName = model.__template__
      self.map templateName
      self.apply templateName, id, model, onMarkup, onError
    else
      onError id, "render", "No template with #{name} has been mapped"

  @add = (id, listId, model, onMarkup) ->
    if self.containerLookup[id]
      template = self.containerLookup[id]
      template.add listId, model, onMarkup

  @update = (id, controlId, model, onMarkup) ->
    if self.containerLookup[id]
      template = self.containerLookup[id]
      template.update controlId, model, onMarkup

  @watchEvent = (id, event, onEvent) ->
    if self.containerLookup[id]
      template = self.containerLookup[id]
      template.watchEvent id, event, onEvent

  @ignoreEvent = (id, event) ->
    if self.containerLookup[id]
      template = self.containerLookup[id]
      template.ignore id, event

  @resolver = resolver
  self

cartographer = new Cartographer()

cartographer