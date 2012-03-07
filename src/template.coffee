class Template

  constructor: (@name) ->
    self = this
    @name = name
    @fqn = ""
    @html = DOMBuilder.dom
    @templates = {}
    @deferredApplyCalls = []
    @render = () ->
    @ready = false
    @factories = {}

    @crawl @name, undefined, {}, (x) ->
      self.render = x
      self.ready = true
      if self.deferredApplyCalls.length > 0
        for call in self.deferredApplyCalls
          call()

  handleTemplate: ( template, templateId, onTemplate ) ->
    self = this
    if self.templates[templateId]
      onTemplate self.templates[templateId]
      true
    else
      resolver.resolve(
        template,
        (x) ->
          onTemplate(x)
        ,
        () -> console.log "Could not resolve tempalte #{template}")
      true

  buildCreateCall: ( element, elementId, elementFqn, childrenToCreate, templates ) ->
    self = this
    tag = element.tagName.toUpperCase()
    context =
      tag: tag,
      element: element,
      elementId: elementId,
      elementFqn: elementFqn,
      childrenToCreate: childrenToCreate,
      templates: templates

    return ( instance, model, fqn, id, onElement ) ->
      self.create( instance, model, fqn, id, context, onElement )

  crawl: ( namespace, markup, templates, onDone ) ->
    self = this
    if markup?.length and ( not markup.nodeType || markup.nodeType == 1 )
      if markup.length > 1
        total = markup.length
        argList = ([namespace, markup[i], templates] for i in [0..total-1])
        workQueue = queueByArgList(self, self.crawl, argList)
        forkJoin workQueue, (callList) ->
          onDone (instance, model, fqn, id, onElement) ->
            crawlQueue = queueByFunctionList self, callList, [instance, model, fqn, id]
            forkJoin crawlQueue, (result) -> onElement result

      else self.crawl namespace, markup[0], templates, onDone
    else
      if markup?.nodeType and markup.nodeType != 1
        onDone( () ->
          arguments[4] markup.nodeValue
        )
      else
        template = if markup then template = elementTemplate markup else namespace
        elementId = markup?.attributes[configuration.elementIdentifier]?.value
        elementFqn = namespace + if elementId then ".#{elementId}" else ''

        if template
          if not templates[template]
            templates[template] = template
            self.handleTemplate(
              template,
              elementFqn + "." + template,
              (x) -> self.crawl namespace, x, templates, (f) ->
                self.factories[template] = f
                onDone f
            )
          else
            onDone () -> self.factories[template].apply(self, [].slice.call(arguments,0))
        else
          children = markup.childNodes
          childFunctionsExpected = children.length

          continueProcessing = (contentList) ->
            factory = self.buildCreateCall markup, elementId, elementFqn, contentList, templates
            self.factories[elementFqn] = factory
            onDone( factory )

          if children.length > 0
            argList = ( [elementFqn, child, templates] for child in children )
            queue1 = queueByArgList self, self.crawl, argList
            forkJoin queue1, continueProcessing
          else
            continueProcessing []

  handleModelTemplate: (template, templateInstance, model, modelFqn, id, context, onElement) ->
    self = this
    if self.templates[template]
      self.templates[template]( templateInstance, model, modelFqn, id, onElement )
    else
      self.handleTemplate(template, template, (x) ->
          self.crawl context.elementFqn, x, templates, ( callback ) ->
            self.templates[template] = callback
            callback templateInstance, model, modelFqn, id, onElement
      )

  create: ( templateInstance, model, modelFqn, id, context, onElement ) ->
    self = this
    elementId = context.elementId
    id = elementId || id #set id to the current position or the dom position
    # is this bound to the model or just structural
    isBound = elementId != undefined and elementId != ""
    idForFqn = if isBound then id else ""
    newFqn = createFqn modelFqn, idForFqn, false, self.name

    # if the element is bound but no model is present, skip this render
    if isBound and not model[id]
      onElement ""
      return

    # does this poisition of the model have a template?
    modelTemplate = getActualValue model.__template__, model

    # does the member we're on have a template?
    memberTemplate = getActualValue model[id]?.__template__, model
    memberValue = getActualValue( getNestedValue(model[id], "__value__" ) || model[id], model)

    # used to advance the model to the next level
    childModel = if isBound then model[id] else model

    # if there is a template on the model itself
    #    then we parse this element but replace it's children
    if modelTemplate
      delete model.__template__
      self.handleModelTemplate modelTemplate, templateInstance, model, modelFqn, id, context, (x) ->
        onElement (self.makeTag context.tag, context.element, newFqn, id, isBound, x, model, templateInstance)

    # if there is a template on the member
    #    then we replace/insert an element at the current location
    else if memberTemplate
      delete model[id].__template__
      self.handleModelTemplate modelTemplate, templateInstance, model, modelFqn, id, context, onElement

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

        self.factories[newFqn+"_add"] = (itemIndex, itemModel, onItem) ->
          newFqn = "#{newFqn}.#{itemIndex}"
          createChildren 0, templateInstance, itemModel, newFqn, itemIndex, context, onItem

        if isCollection
          createChildren collectionLength, templateInstance, childModel, newFqn, undefined, context, (list) ->
            onElement self.makeTag context.tag, context.element, newFqn, id, context.elementId, list, model, templateInstance

        else # the current value is not a collection, but there are still child elements
          createChildren 0, templateInstance, childModel, newFqn, id, context, (list) ->
            onElement self.makeTag context.tag, context.element, newFqn, id, context.elementId, list, model, templateInstance

      else # this element has no children, it only holds the value
        onElement self.makeTag( context.tag, context.element, newFqn, id, isBound, memberValue, model, templateInstance )

  makeTag: (tag, originalElement, fqn, id, hasId, val, model, templateInstance ) ->
    self = this
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
    element

  apply: (id, originalModel, onResult) ->
    self = this
    model = $.extend(true, {}, originalModel);
    if not self.ready
      self.deferredApplyCalls.push( () -> self.apply(id, model, onResult ) );
    else
      self.render( id, model, id, undefined, (x) ->
          result = {}
          if not x.length
            result = $(x)[0]
            $(result).attr(configuration.elementIdentifier, id)
          else
            result = getHtmlFromList(x, self.html)
          onResult id, result, "render"
      )

  update: (fqn, model, onResult) ->
    self = this
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
          newElement = dom
          onResult fqn, newElement, "update")
      )

  add: (fqn, model, onResult) ->
    self = this
    lastIndex = fqn.lastIndexOf "."
    templateId = fqn.split('.')[0]
    parentKey = fqn.substring 0, lastIndex
    childKey = fqn.substring ( lastIndex + 1 )

    addName = fqn + "_add"
    if self.factories[addName]
      count = $("[#{configuration.elementIdentifier}=\"#{fqn}\"]").children.length + 1
      self.factories[addName](
        count,
        model,
        ((dom) ->
          newElement = getHtmlFromList(dom, self.html)
          onResult fqn, newElement, "add")
      )
