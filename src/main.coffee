class Cartographer

  constructor: ->
    @config = configuration
    @templates = {}
    @containerLookup = {}
    @instanceCache = {}
    @resolver = resolver

  map: ( name ) ->
    template = new Template name
    @templates[name] = template
    true

  render: ( name, id, model, onMarkup, onError ) ->
    self = this
    @containerLookup[id] = @templates[name]
    if @templates[name]
      template = @templates[name]
      template.render id, model, (id, op, result) ->
        self.instanceCache[id] = result
        onMarkup id, op, result
    else if model.__template__ and id
      templateName = model.__template__
      @map templateName
      @render templateName, id, model, onMarkup, onError
    else
      onError id, "render", "No template with #{name} has been mapped"

  add: (id, listId, model, onMarkup) ->
    if @containerLookup[id]
      template = @containerLookup[id]
      template.add listId, model, onMarkup

  update: (id, controlId, model, onMarkup) ->
    if @containerLookup[id]
      template = @containerLookup[id]
      template.update controlId, model, onMarkup

cartographer = new Cartographer()

cartographer