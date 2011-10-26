Cartographer = () ->
  self = this

  postal.channel("cartographer").subscribe (m) ->
    if m.map
      self.map m.target, m.namespace
    else if m.apply
      self.apply m.template, m.proxy, m.render, m.error

  @templates = {}

  @map = ( target, namespace ) ->
    template = new Template target, namespace
    @templates[template.fqn] = template

  @apply = ( template, proxy, render, error ) ->
    templateInstance = @templates[template]
    if templateInstance
      result = templateInstance.apply proxy
      if render
        render( result, templateInstance.fqn )
      else
        $("#" + templateInstance.fqn ).replaceWith( result )
    else if error
      error()

  self

context["cartographer"] = new Cartographer()