configuration =
  elementIdentifier: 'data-id'
  templateIdentifier: 'data-template'

createChildren = ( iterations, templateInstance, model, modelFqn, id, context, onChildren) ->
  children = context.childrenToCreate
  isCollection = iterations > 0
  if not iterations
    iterations = 1
  childId = id
  childModel = model
  childFqn = modelFqn

  callList = []
  for iteration in [0..iterations-1]
    if id == undefined and isCollection
      childId = iteration
      childModel = model[childId]
      childFqn = "#{modelFqn}.#{childId}"
    for fx in children
      callList.push createCallback self, fx, [templateInstance, childModel, childFqn, childId]
  forkJoin callList, onChildren

createFqn = ( namespace, id, name, filterName ) ->
  newNs = namespace || ""
  newId = if id == undefined then "" else id
  delimiter = if newNs != "" and newId != "" then "." else ""
  result = "#{newNs}#{delimiter}#{newId}"
  result

elementTemplate = ( element ) ->
  element?.attributes[configuration.templateIdentifier]?.value

getActualValue = (value, context) ->
  if _.isFunction value then value.call(context) else value

getHtmlFromList = (list, html) ->
  $(html["DIV"]({}, list)).html()

getNestedValue = (value, property) ->
  if value and value[property] then value[property] else undefined