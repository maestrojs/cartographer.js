# Postal Topology


## Map
    exchange            cartographer
    topic               api
#### Message Properties
    name                template
    operation           "map"

## Apply
    exchange            cartographer
    topic               api
#### Message Properties
	name                template name
    template            template instance id
    model               object to base the render on
    operation           "apply"
### Responds With
    exchange            cartographer
    topic               render.{templateId}
#### Message Properties
    template            template instance id
    markup              the generated DOM
    operation           "render"

## Add
    exchange            cartographer
    topic               api
### Message
    template            the template instance id
    id                  the fully qualified id of the list control to add to
    model               object to create the new item template from
    operation           "add"
### Responds With
    exchange            cartographer
    topic               render.{templateId}
#### Message Properties
    template            template instance id
    parent              the fully qualified id for the parent
    markup              the generated DOM for the new item
    operation           "add"

## Update
    exchange            cartographer
    topic               api
#### Message Properties
    template            the template instance id
    id                  the fully qualified id of the control to update
    model               object to update the control template with
    operation           "update"
### RespondsWith
    exchange            cartographer
    topic               render.{templateId}
#### Message Properties
    template            template instance id
    id                  the fully qualified id of the item
    markup              the generated DOM for the new item
    operation           "update"

## Append Resolver
    exchange            cartographer
    topic               api
#### Message Properties
    order               "append"
    operation           "resolver"
    resolver            callback in the form of function( name, onSuccess, onFailure )

## Prepend Resolver
    exchange            cartographer
    topic               api
#### Message Properties
    order               "prepend"
    operation           "resolver"
    resolver            callback in the form of function( name, onSuccess, onFailure )
    template            template instance id