Cartographer = () ->
  self = this

  postal.channel("cartographer").subscribe (m) ->
    if m.map
      self.map m.name
    else if m.apply
      self.apply m.template, m.proxy, m.render, m.error

  @templates = {}

  @map = ( name, namespace ) ->
    template = new Template name, namespace
    @templates[name] = template

  @apply = ( template, proxy, render, error ) ->
    template = template or= proxy.__template__
    templateInstance = @templates[template]
    if templateInstance
      result = templateInstance.apply proxy
      if render
        render( result, templateInstance.fqn )
      else
        $("#" + templateInstance.name ).replaceWith( result )
    else if error
      error()

  self

context["cartographer"] = new Cartographer()