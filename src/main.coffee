configuration =
  elementIdentifier = 'map-id'

Cartographer = () ->
  self = this

  postal.channel("cartographer").subscribe (m) ->
    if m.map
      self.map m.name, m.namespace
    else if m.apply
      self.apply m.template, m.proxy, m.render, m.error
    else if m.addSource
      self.resolver.addSource m.provider

  postal.subscribe "postal", "subscription.*", (m) ->
    if m.event == "subscription.created"

    else if m.event == "susbcription.removed"

  @config = configuration

  @templates = {}

  @map = ( name, namespace, target ) ->
  template = new Template name, namespace, target
  self.templates[name] = template

  @apply = ( template, proxy, render, error ) ->
    template = template or= proxy.__template__
    templateInstance = self.templates[template]
    if templateInstance
      templateInstance.apply proxy, (result) ->
        if render
          render( result, templateInstance.target, templateInstance.fqn )
        else
          $( '#'+templateInstance.target ).fadeOut 200, ->
            $(this).html(result).fadeIn(300)
    else
      self.map template, proxy.getPath()
      self.apply template, proxy

  @resolver = resolver

  self

new Cartographer()