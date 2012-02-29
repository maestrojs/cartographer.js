# Cartographer

Cartographer is an HTML templating engine that works with plain HTML and simple JSON. It does this by inferring intention based on the structure of the markup and JSON.

Aside from simple markup generation, it also has more advanced features that are at various stages of completion. Here's a quick feature list:

	* Markup generation from HTML files and JSON
	* A flexible way to define resolvers for HTML templates
		* Built-in source checks the page for template first
		* Built-in integration with infuser which is checked second
	* Integration with Postal for messaging
	* Automatic wire-up of Postal subscription convention to DOM events
	* Targeted, partial generation
	* Configurable element identifier
		* The default attribute used to identify the element for Cartographer is "data-id"
		* You can change this very easily through a single configuration setting

Cartographer will never inject markup onto the page. It only ever generates markup and makes it available through a callback or a Postal endpoint.

## Philosophy

I wanted to create a templating engine that would compliment more complex, asynchronous applications in the browser. Cartographer has been built to have synergy with libraries that Jim Cowart has written, specifically:

	* Postal - messaging
	* Infuser - fetching external templates
	* Aribiter - finite state machine implementation

It is my intention to provide declarative conventions and idioms for DOM interaction with the rest of the application that are easy to tailor to the application's needs.

## Use

Cartographer creates (and manages) template instances by mapping markup and JSON. You can either make direct API calls
 against the object or integrate with it via Postal (or any combination you like).

### Examples

#### Very simple:

	//template
	<div>
		<h3>Simple</h3>
		<div>
			<span data-id="one"></span><span>, </span><span data-id="two"></span>
		</div>
	</div>

	// model
	{
		one: "Hello",
		two: "World"
	}

	//result
	<div>
		<h3>Simple</h3>
		<div>
			<span data-id="one">Hello</span><span>, </span><span data-id="two">World</span>
		</div>
	</div>

#### List:

	//template
	<div data-id="iterative">
	 <h3>Grocery List</h3>
	 <div data-id="listItems">
		<div>
		  <span data-id="name"></span><span> - </span><span data-id="qty"></span>
		</div>
	 </div>
	</div>

	// model
	{
		listItems: [
		  { name: "banana", qty: "all of them" },
		  { name: "apple", qty: "2"},
		  { name: "oranges", qty: "three"},
		]
	}

	//result
	<div>
		<h3>Grocery List</h3>
		<div data-id="listItems">
			<div data-id="0">
				<span data-id="name">banana</span><span> - </span><span data-id="qty">all of them</span>
			</div>
			<div data-id="1">
				<span data-id="name">apple</span><span> - </span><span data-id="qty">2</span>
			</div>
			<div data-id="2">
				<span data-id="name">oranges</span><span> - </span><span data-id="qty">three</span>
			</div>
		</div>
	</div>


### Creating a Template Instance

There are two ways to create a template:

	// Creating a template
	cartographer.map( "{instance id}", "{template name}" );

	// Using Postal
	postal.publish( "cartographer", "api.map", { id: "{instance id}", name: "{template name}" } );

The instance id is what you will address the template with while the template name is the markup template as it will be searched for by the available template resolvers.

### Generating Markup With Templates and JSON

Once you have created a template instance, you can produce markup in one of three ways:

	// Requesting markup and handling it yourself
	cartographer.apply( "{instance id}", jsonObject,
		function(markup) { /* on success you get a DOM element */ },
		function(error) { /* on failure you get a DOM element */ }
	);

	// Requesting markup without handlers
	cartographer.apply( "{instance id"}, jsonObject );

		/* OR */

	// Using Postal
	postal.publish( "cartographer", "api.apply", { id: "{instance id}", model: jsonObject } );

	/* BOTH produce results via Postal

	postal.subscribe("cartographer", "render.{instance id}", function( message, envelope ) {
		if( envelop.topic.match(/{instance id}$/ ) { /* successs */ }
		else { /* failure */ }
	});

### Adding Template Resolvers

Cartographer looks for the HTML using the template name. It searches its resolvers, in order, and by default has resolvers for in-page and infuser. If you glance at template-source.coffee under the spec folder, you'll see that it's trivial to create these and provide markup from any source you like.

To add a resolver, you can either append it to the end of the list or prepend it to the beginning using the API or Postal:

	var shamefullySimple = function(name, onSuccess, onFail) { onSuccess("<div>Worst template ever!</div>"); };

	// Prepending adds the source to the front of the chain (will always be searched first )
	cartographer.resolver.prepend(shamefullySimple);

	// Appending adds it to the end of the chain (will always be searched last)
	cartographer.resolver.append(shamefullySimple);

	// Adding a resolver via Postal
	postal.publish( "cartographer", "api.resolver|api.resolver", { operation: "append|prepend", resolver: shamefullySimple } );

### Changing The Element Id Attribute

By default, Cartographer uses 'data-id' as the means to identify and correlate a DOM element to your model. This can be changed as follows:

	cartographer.config.elementIdentifier

### Markup Hierarchy

As Cartographer is generating markup, it attempts to produce unique, internal namespaces for each


## Advanced Features

Many of these are in early stages of maturity and you should think of most of them as being largely experimental.

### Element Attributes

By default, Cartographer will copy over all attributes from the template to the generated elements. Most attributes can be overridden in the model by nesting the attribute hash and the original property value below the actual model property.

	// Simple example of a normal model property
	{
		property: value
	};

	//Nesting the value to get additional control over the element that maps to this same id
	{
		property: {
			value: value,
			class: "special-class"
		}
	};

	//Setting a specific template up to replace the default DOM element
	//Not quite ready for mainstream use
	{
		property: {
			value: value,
			__template__: "specialTemplate"
		}
	};


## Dependencies

Cartographer has a number of dependencies which you must either include on your page OR have available via some AMD system (I've only tested it against Require at this point).

If you happen to use require, here are the path aliases it expects:

	'jQuery', 'underscore', 'postal', 'infuser', 'DOMBuilder'
m


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
