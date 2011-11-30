Cartographer = () ->
  self = this

  postal.channel("cartographer").subscribe (m) ->
    if m.map
      self.map m.name, m.namespace
    else if m.apply
      self.apply m.template, m.proxy, m.render, m.error
    else if m.addSource
      self.resolver.addSource m.provider

  @templates = {}

  @map = ( name, namespace ) ->
    template = new Template name, namespace
    @templates[name] = template

  @apply = ( template, proxy, render, error ) ->
    template = template or= proxy.__template__
    templateInstance = @templates[template]
    if templateInstance
      templateInstance.apply proxy, (result) ->
        if render
          render( result, templateInstance.fqn )
        else
          $( '#' + templateInstance.name ).replaceWith( result )
    else if error
      error()

  @resolver = resolver

  self

context["cartographer"] = new Cartographer()