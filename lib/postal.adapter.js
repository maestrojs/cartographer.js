var PostalSetup, setup;
PostalSetup = (function() {
  function PostalSetup() {
    var self;
    self = this;
    postal.subscribe("cartographer", "api", function(message, envelope) {
      var operation;
      operation = message.operation;
      return self[operation](message);
    });
  }
  PostalSetup.prototype.apply = function(message) {
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
  PostalSetup.prototype.map = function(message) {
    return cartographer.map(message.name);
  };
  PostalSetup.prototype.resolver = function(message) {
    if (message.order === "prepend") {
      return cartographer.resolver.prependSource(message.resolver);
    } else {
      return cartographer.resolver.appendSource(message.resolver);
    }
  };
  PostalSetup.prototype.add = function(message) {
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
  PostalSetup.prototype.update = function(message) {
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
  return PostalSetup;
})();
setup = new PostalSetup();