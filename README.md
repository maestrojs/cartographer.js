# Cartographer
Cartographer is an HTML templating engine that works with plain HTML and simple JSON. It does this by inferring intention based on the structure of the markup and JSON. Cartographer will never place the generated markup on the page, it hands it back to the provided callback.

Though Cartographer's performance should be sufficient for most applications, several trade-offs were made in order to make the advanced features (not provided by the majority of other template engines) possible.

## Philosophy
I wanted to create a templating engine that would compliment more complex, asynchronous applications in the browser. Cartographer's APIs are built to provide responses to user provided callbacks. It has been designed to be complimentary with other OSS JS Libraries that encourage decoupled application design: (infuser, postal and machina specifically).

## Advanced Features
* Generate partial templates
* Nest templates
* Specify external templates in the markup or the model
* Generate new markup for new collection items
* Fully qualified namespacing for elements that map to the model
* A flexible way to define custom sources for templates
* Event handling through delegation to the top level element of the rendered instance
* Integration with Postal for messaging
	* all API methods supported through Postal topography
	* Convention for auto-wiring topic subscriptions that correlate with template control/event to DOM event
* Configurable element identifier
	* The default attribute used to identify the element for Cartographer is "data-id"
* Configurable template attribute
	* The default attribute used to specify a replacement template is "data-template"

## Concepts
Cartographer creates named templates based on the name of the template source. If your source is an external file, the name of the template is the name of the file. If the source of the template is a DOM element then the data-template property would match the template name.

Once the template has been created, it can be used to create instances which must be uniquely identified (more on why later). The rendered instance is give fully qualified, hierarchical namespaces for all of the controls that had a data-id (mapped to a model property).

Partial renders can be done as an add or update. Adding is intended to support rendered a specific item template for a collection when new elements are added to the model that produced the original render. Updates allow you to regenerate the template, starting at any level, in order to get updated markup for the section of the template that should be reproduced.

## API

### Map - cartographer.map(templateName)
Creates a template from a named HTML source that will be used to generate markup from JSON.

### Apply - cartographer.apply( templateName, templateId, model, onMarkup )
Renders the templateName and assigns the rendered instance templateId. The template instance id becomes the top of the fqn for all controls in the rendered instance. onMarkup is a function with 3 arguments: template id, markup and operation ( included for integration purposes ).

### Add - cartographer.add( templateId, containerControlFqn, model, onMarkup )
Adding creates a new set of markup for an existing template / model collection. The containerControlFqn is the fully qualified name of the containing list control. The other arguments are like the 'apply' call.

### Update - cartographer.update( templateId, targetFqn, model, onMarkup )
Updating creates a new render at any level in the template hierarchy. The targetFqn is the level of the DOM template where the render should begin.

### Watch Event - cartographer.watchEvent( templateId, event, onEvent )
Watching an event attaches a top-level, delegated, event handler to the parent element of the rendered instance. The event name and handler behave as expected. The event handlers are cached so that even in the event of an additional render of the instance or a delay in rendering, the events are wired up once the top element is available.

The onEvent callback gets the following arguments:
 * The template instance id
 * The control fqn
 * The original element the event triggered for
 * The event name that triggered

### Ignore Event - cartographer( templateId, event )
Removes a previously attached event.

### Adding Template Resolvers - cartographer.resolver.appendSource|prependSource( resolverFunction )
Cartographer looks for the HTML using the template name. It searches its resolvers, in order, and by default has resolvers for in-page and infuser. If you glance at template-source.coffee under the spec folder, you'll see that it's trivial to create these and provide markup from any source you like.

You can add a resolver and control when it will be checked by either appending or prepending your resolver to the list.

The resolver has the signature function(name, success, fail). It uses the name argument to search for an HTML template based on the name and calls success with the HTML when it's found or fail when something tanks.

### Changing The Element Id Attribute

By default, Cartographer uses 'data-id' as the means to identify and correlate a DOM element to your model. This can be changed as follows:

	cartographer.config.elementIdentifier


## Examples
Currently, there aren't a lot of great examples but the unit tests actually show all of the features except for eventing.




## Dependencies

Cartographer has a number of dependencies which you must either include on your page OR have available via some AMD system (I've only tested it against Require at this point).

If you happen to use require, here are the path aliases it expects:

	'jQuery', 'underscore', 'postal', 'infuser', 'DOMBuilder'


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

## Watch Event
    exchange            cartographer
    topic               api
#### Message Properties
    operation           "watch"
    template            template instance id
    event               event to watch for

## Ignore Event
    exchange            cartographer
    topic               api
#### Message Properties
    operation           "ignore"
    template            template instance id
    event               event to watch for
