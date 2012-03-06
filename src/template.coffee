Template = (name) ->
  self = this

# conditionally combine the current namespace and the current element id
  createFqn = ( namespace, id, name, filterName ) ->
    newNs = namespace || ""
    newId = if id == undefined then "" else id
    delimiter = if newNs != "" and newId != "" then "." else ""
    result = "#{newNs}#{delimiter}#{newId}"
    result

  handleTemplate = ( template, templateId, onTemplate ) ->
    if self.templates[templateId]
      onTemplate self.templates[templateId]
      true
    else
      resolver.resolve(
        template,
        (x) ->
          #self.templates[templateId] = x
          onTemplate(x)
        ,
        () -> console.log "Could not resolve tempalte #{template}")
      true

  elementTemplate = ( element ) ->
    element?.attributes[configuration.templateIdentifier]?.value

  crawl = ( namespace, markup, templates, onDone ) ->
    if markup?.length and ( not markup.nodeType || markup.nodeType == 1 )
      if markup.length > 1
        total = markup.length
        index = 0
        list = new Array(total)
        onFactory = (factory) ->
          list[index++] = factory
          console.log("got factory #{factory} for index #{index}")
          if index == total
            onDone (templateInstance, model, fqn, id, callback) ->
              ( fx templateInstance, model, fqn, id, callback ) for fx in list
        for elementIndex in [0..total-1]
          crawl namespace, markup[elementIndex], templates, onFactory
      else crawl namespace, markup[0], templates, onDone
    else
      if markup?.nodeType and markup.nodeType != 1
        onDone( () ->
          arguments[4] markup.nodeValue
        )
      else
        template = if markup then template = elementTemplate markup else namespace
        elementId = markup?.attributes[configuration.elementIdentifier]?.value
        elementFqn = namespace + if elementId then ".#{elementId}" else ''

        # if there's a template here, it takes the place of the current element
        if template
          if not templates[template]
            templates[template] = template
            handleTemplate(
              template,
              elementFqn + "." + template,
              (x) -> crawl namespace, x, templates, (f) ->
                self.factories[template] = f
                onDone f
            )
          else
            onDone () -> self.factories[template].apply(self, [].slice.call(arguments,0))


          ###if self.templates[template]
            onDone self.templates[template]
          else
            handleTemplate(template, template, (x) ->
                crawl elementFqn, x, templates, ( callback ) ->
                  self.templates[template] = callback
                  onDone callback
            )###
        else
          # otherwise, process this element directly
          # this requires a depth-first approach since we don't know
          # what it will take to produce this element until we know all
          # the children involved
          children = markup.childNodes
          childFunctionsExpected = children.length

          continueProcessing = (contentList) ->
            factory = buildCreateElement markup, elementId, elementFqn, contentList, templates
            self.factories[elementFqn] = factory
            onDone( factory )

          if children.length > 0
            childrenFunctions = []
            addChildFunction = ( factory ) ->
              childrenFunctions.push( factory )
              if childrenFunctions.length == childFunctionsExpected
                continueProcessing( childrenFunctions )
            ( crawl elementFqn, child, templates, addChildFunction ) for child in children
          else
            continueProcessing []

  getActualValue = (value, context) ->
    if _.isFunction value then value.call(context) else value

  getNestedValue = (value, property) ->
    if value and value[property] then value[property] else undefined

  handleModelTemplate = (template, templateInstance, model, modelFqn, id, context, onElement) ->
    # we've parsed this template before, it's ready to run
    if self.templates[template]
      #self.templates[template]( templateInstance, model, modelFqn, id, context, onElement )
      self.templates[template]( templateInstance, model, modelFqn, id, onElement )
    else
      handleTemplate(template, template, (x) ->
        crawl context.elementFqn, x, templates, ( callback ) ->
          self.templates[template] = callback
          #callback  templateInstance, model, modelFqn, id, context, onElement
          callback  templateInstance, model, modelFqn, id, onElement
      )

  createChildren = ( iterations, templateInstance, model, modelFqn, id, context, onElement) ->
    isCollection = iterations > 0
    if not isCollection
      iterations = 1

    children = context.childrenToCreate
    total = children.length * iterations

    index = 0
    list = new Array(total)
    onChild = (childIndex, child) ->
      list[index++] = child
      if index >= total
        onElement makeTag context.tag, context.element, modelFqn, childIndex, context.elementId, list, model, templateInstance

    for iteration in [0..iterations-1]
      for create in children
        childId = id
        childModel = model
        childFqn = modelFqn
        if id == undefined and isCollection
          childId = iteration
          childModel = model[childId]
          childFqn = "#{modelFqn}.#{childId}"
        create templateInstance, childModel, childFqn, childId, (x) -> onChild(childId, x)

  create = ( templateInstance, model, modelFqn, id, context, onElement ) ->
    elementId = context.elementId
    #console.log "#{elementId} || #{id} -> #{JSON.stringify(model)}"
    id = elementId || id #set id to the current position or the dom position


    # is this bound to the model or just structural
    isBound = elementId != undefined and elementId != ""
    idForFqn = if isBound then id else ""

    newFqn = createFqn modelFqn, idForFqn, false, self.name
    #console.log "#{isBound} - #{idForFqn} - #{newFqn}"

    # does this poisition of the model have a template?
    modelTemplate = getActualValue model.__template__, model

    # does the member we're on have a template?
    memberTemplate = getActualValue model[id]?.__template__, model
    memberValue = getActualValue( getNestedValue(model[id], "__value__" ) || model[id], model)

    # used to advance the model to the next level
    childModel = if isBound then model[id] else model

    # if there is a template on the model itself
    #    then we parse this element but replace it's children
    ###if modelTemplate
      delete model.__template__
      context.childrenToCreate = [
        ( templateInstance, model, modelFqn, id, context, onElement ) ->
          handleModelTemplate modelTemplate, templateInstance, model, modelFqn, id, context, onElement
      ]###

    # if there is a template on the member
    #    then we replace/insert an element at the current location
    #if memberTemplate or modelTemplate
    #  delete model[id].__template__
    template = ""
    if memberTemplate
      template = memberTemplate
      delete model[id].__template__
    if modelTemplate
      template = modelTemplate
      delete model.__template__
    if template
      handleModelTemplate template, templateInstance, model, modelFqn, id, context, onElement

    #if not memberTemplate
    else
      childElements = context?.childrenToCreate.slice(0)
      childElementCount = childElements.length
      # are there elements to create under this one?
      if childElementCount > 0

        # if the value has items
        collection = getNestedValue(memberValue, "__items__") || memberValue
        collectionLength = if collection then collection.length else 0
        isCollection = if collectionLength and not _.isString(collection) then collection

        # create a 'point-in-time' closure around the creation of this set of
        # child elements so that new items can be added to the collection
        # without having to rebuild all the state/metadata required
        self.factories[newFqn+"_add"] = ( itemIndex, itemModel, onItem ) ->
          createChildren 0, templateInstance, itemModel, newFqn, itemIndex, context, onItem

        if isCollection
          createChildren collectionLength, templateInstance, childModel, newFqn, undefined, context, onElement

        else # the current value is not a collection, but there are still child elements
          createChildren 0, templateInstance, childModel, newFqn, id, context, onElement

      else # this element has no children, it only holds the value
        onElement makeTag( context.tag, context.element, newFqn, id, isBound, memberValue, model, templateInstance )

  buildCreateElement = ( element, elementId, elementFqn, childrenToCreate, templates ) ->
    #create closure around element creation
    tag = element.tagName.toUpperCase()

    context =
      tag: tag,
      element: element,
      elementId: elementId,
      elementFqn: elementFqn,
      childrenToCreate: childrenToCreate,
      templates: templates

    return ( instance, model, fqn, id, onElement ) ->
      create( instance, model, fqn, id, context, onElement )

  makeTag = (tag, originalElement, fqn, id, hasId, val, model, templateInstance ) ->
    properties = {}
    content =
      if _.isString(val)
        val
      else if _.isArray(val)
        val || val?[id]
      else
        val?[id] || val
    content = if originalElement.children.length == 0 and id == undefined and (_.isObject(val) or _.isArray(val)) then originalElement.textContent else content
    element = {}

    if hasId
      properties[configuration.elementIdentifier] = fqn
    if originalElement["className"]
      properties["class"] = originalElement["className"]
    if originalElement["type"]
      properties["type"] = originalElement["type"]
    if originalElement["value"]
      properties["value"] = originalElement["value"]
    if originalElement["id"]
      properties["id"] = originalElement["id"]
    if model?[id]?.class
      properties["class"] = model[id].class


    #console.log("#{tag} - #{fqn} - #{id} - #{val} - #{JSON.stringify(model)}")

    if tag == "INPUT"
      if not _.isObject content
        properties.value = content
      element = self.html[tag]( properties )
    else if tag == "IMG"
      properties = $.extend(properties, {
        src: content.src || content || originalElement.src,
        alt: content.alt || content || originalElement.alt,
        width: content.width || originalElement.width || "",
        height: content.height || originalElement.height || ""
      })
      element = self.html[tag]( properties )
    else if tag == "A"
      properties = $.extend(properties, {
        href: model.link || originalElement.href,
        alt: model.alt || content || originalElement.alt
      })
      element = self.html[tag]( properties, content )
    else
      element = self.html[tag]( properties, content )

    if hasId
      self.generated[templateInstance][fqn] = element
    element

  wireUp = (id) ->
    (self.watchEvent id, x.event, x.handler ) for x in self.watching

  @apply = (id, originalModel, onResult) ->
      model = $.extend(true, {}, originalModel);
      self.generated[id] = {}
      if not self.ready
        self.deferredApplyCalls.push( () -> self.apply(id, model, onResult ) );
      else
        result = self.render( id, model, id, undefined, (x) ->
            element = $(x)[0]
            $(element).attr(configuration.elementIdentifier, id)
            self.generated[id].top = element
            wireUp(id)
            onResult id, element, "render"
        )

  @watchEvent = (id, eventName, onEvent) ->
      $(self.generated[id].top).on eventName, (ev) ->
        elementId = ev.target.attributes[configuration.elementIdentifier]?.value
        onEvent self.id, elementId, ev.target, ev.type
      self.watching.push { event: eventName, handler: onEvent }
      self.watching = _.uniq( self.watching )

  @ignoreEvent = (id, eventName) ->
    if self.generated[id].top
      self.generated[id].top.off eventname
    self.watching = _.reject( self.watching, (x) -> x.event == eventName )

  @update = (fqn, model, onResult) ->
    lastIndex = fqn.lastIndexOf "."
    templateId = fqn.split('.')[0]
    parentKey = fqn.substring 0, lastIndex
    childKey = fqn.substring ( lastIndex + 1 )

    if self.factories[fqn]
      self.factories[fqn](
        templateId
        model,
        parentKey,
        childKey,
        ((dom) ->
          #markup = dom.toString()
          newElement = dom
          onResult fqn, newElement, "update")
      )

  @add = (fqn, model, onResult) ->
    lastIndex = fqn.lastIndexOf "."
    templateId = fqn.split('.')[0]
    parentKey = fqn.substring 0, lastIndex
    childKey = fqn.substring ( lastIndex + 1 )

    addName = fqn + "_add"
    if self.factories[addName]
      count = $(self.generated[templateId][fqn])[0].children.length
      self.factories[addName](
        count,
        model,
        ((dom) ->
          #dom = markup.toString()
          newElement = dom
          onResult fqn, newElement, "add")
      )

  @name = name
  @fqn = ""
  @html = DOMBuilder.dom
  @templates = {}
  @generated = {}
  @changeSubscription = undefined
  @watching = []
  @deferredApplyCalls = []
  @render = () ->
  @ready = false
  @factories = {}

  crawl self.name, undefined, {}, (x) ->
    self.render = x
    self.ready = true
    if self.deferredApplyCalls.length > 0
      for call in self.deferredApplyCalls
        call()

  self
