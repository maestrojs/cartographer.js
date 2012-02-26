Cartographer = () ->
  self = this
  @config = configuration
  @templates = {}

  @map = ( id, name ) ->
    template = new Template id, name
    self.templates[id] = template
    true

  @apply = ( id, model, onMarkup, onError ) ->
    if self.templates[id]
      template = self.templates[id]
      template.apply model, (id, op, result) ->
        onMarkup id, op, result
    else if model.__template__ and id
      self.map id, model.__template__, model
      self.apply id, model, onMarkup, onError
    else
      onError id, "render", "No template with #{id} has been mapped"

  @resolver = resolver
  self

cartographer = new Cartographer()

cartographer