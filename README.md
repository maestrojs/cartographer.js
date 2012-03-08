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
* Integration with Postal for messaging
	* all API methods supported through Postal topography
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

### Apply - cartographer.render( templateName, templateId, model, onMarkup )
Renders the templateName and assigns the rendered instance templateId. The template instance id becomes the top of the fqn for all controls in the rendered instance. onMarkup is a function with 3 arguments: template id, markup and operation ( included for integration purposes ).

### Add - cartographer.add( templateId, containerControlFqn, model, onMarkup )
Adding creates a new set of markup for an existing template / model collection. The containerControlFqn is the fully qualified name of the containing list control. The other arguments are like the 'apply' call.

### Update - cartographer.update( templateId, targetFqn, model, onMarkup )
Updating creates a new render at any level in the template hierarchy. The targetFqn is the level of the DOM template where the render should begin.

### Adding Template Resolvers - cartographer.resolver.appendSource|prependSource( resolverFunction )
Cartographer looks for the HTML using the template name. It searches its resolvers, in order, and by default has resolvers for in-page and infuser. If you glance at template-source.coffee under the spec folder, you'll see that it's trivial to create these and provide markup from any source you like.

You can add a resolver and control when it will be checked by either appending or prepending your resolver to the list.

The resolver has the signature function(name, success, fail). It uses the name argument to search for an HTML template based on the name and calls success with the HTML when it's found or fail when something tanks.

### Changing The Element Id Attribute

By default, Cartographer uses 'data-id' as the means to identify and correlate a DOM element to your model. This can be changed as follows:

	cartographer.config.elementIdentifier

## Examples
Currently, there aren't a lot of great examples but the unit tests actually show all of the features.

## Dependencies

Cartographer has a number of dependencies which you must either include on your page OR have available via some AMD system (I've only tested it against Require at this point).

If you happen to use require, here are the path aliases it expects:

	'jQuery', 'underscore', 'infuser', 'DOMBuilder'