define(['postal', 'cartographer'], function(postal, cartographer) {
  var PostalSetup, setup;
PostalSetup = function() {
  var self;
  self = this;
  this.apply = function(message) {
    var model, name, template;
    name = message.name;
    template = message.template;
    model = message.model;
    return cartographer.apply(name, template, model, (function(id, markup, op) {
      return postal.publish("cartographer", "render." + template, {
        template: template,
        markup: markup,
        operation: "render"
      });
    }), (function(error) {
      return postal.publish("cartographer", "render." + error, {
        template: template,
        error: error,
        operation: "render"
      });
    }));
  };
  this.map = function(message) {
    return cartographer.map(message.name);
  };
  this.resolver = function(message) {
    if (message.order === "prepend") {
      return cartographer.resolver.prependSource(message.resolver);
    } else {
      return cartographer.resolver.appendSource(message.resolver);
    }
  };
  this.add = function(message) {
    var fqn, model, templateId;
    templateId = message.template;
    fqn = message.id;
    model = message.model;
    return cartographer.add(templateId, fqn, model, function(id, markup, op) {
      return postal.publish("cartographer", "render.{templateId}", {
        template: templateId,
        parent: fqn,
        markup: markup,
        operation: "add"
      });
    });
  };
  this.update = function(message) {
    var fqn, model, templateId;
    templateId = message.template;
    fqn = message.id;
    model = message.model;
    return cartographer.update(templateId, fqn, model, function(id, markup, op) {
      return postal.publish("cartographer", "render.{templateId}", {
        template: templateId,
        id: fqn,
        markup: markup,
        operation: "update"
      });
    });
  };
  this.watch = function(message) {
    return cartographer.watchEvent(message.template, message.event, function(template, elementId, element, event) {
      return postal.publish("cartographer." + template, "" + elementId + "." + event, {
        element: element
      });
    });
  };
  this.ignore = function(message) {
    return cartographer.ignoreEvent(message.template, message.event);
  };
  postal.subscribe("cartographer", "api", function(message, envelope) {
    var operation;
    operation = message.operation;
    return self[operation](message);
  });
  return postal.subscribe("postal", "subscription.*", function(message, envelope) {
    var command, parts, templateId;
    if (message.exchange.match(/^cartographer[.]*/)) {
      templateId = message.exchange.split('.')[1];
      if (cartographer.templates[templateId]) {
        parts = message.topic.split('.');
        command = {
          template: templateId,
          event: parts[parts.length - 1]
        };
        if (envelope.topic === "subscription.created" && message.exchange.match(/^cartographer/)) {
          return self.watch(command);
        } else if (message.exchange.match(/^cartographer/)) {
          return self.ignore(command);
        }
      }
    }
  });
};
setup = new PostalSetup();
});