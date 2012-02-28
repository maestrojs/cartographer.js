define(['jquery', 'underscore', 'postal', 'infuser', 'DOMBuilder'], function($, _, postal, infuser) {
  var configuration;
configuration = {
  elementIdentifier: 'map-id',
  templateIdentifier: 'template-id'
};
var SourceResolver, infuser, resolver;
SourceResolver = function() {
  var self, sources;
  self = this;
  sources = [];
  this.appendSource = function(source) {
    return sources.push(source);
  };
  this.prependSource = function(source) {
    return sources.unshift(source);
  };
  this.resolve = function(name, onFound, notFound) {
    var finder, index;
    index = 0;
    finder = function() {};
    finder = function() {
      var call;
      call = sources[index];
      if (call) {
        return call(name, function(x) {
          return onFound($(x)[0]);
        }, function() {
          index++;
          return finder();
        });
      } else {
        return notFound();
      }
    };
    return finder();
  };
  return self;
};
resolver = new SourceResolver();
resolver.appendSource(function(name, success, fail) {
  var template;
  template = $('[' + configuration.elementIdentifier + '="' + name + '-template"]');
  if (template.length > 0) {
    return success(template[0]);
  } else {
    return fail();
  }
});
infuser = infuser || window.infuser;
if (infuser) {
  resolver.appendSource(function(name, success, fail) {
    return infuser.get(name, function(x) {
      return success(x);
    }, function(x) {
      return fail();
    });
  });
}
var Cartographer, cartographer;
Cartographer = function() {
  var self;
  self = this;
  this.config = configuration;
  this.templates = {};
  this.map = function(id, name) {
    var template;
    template = new Template(id, name);
    self.templates[id] = template;
    return true;
  };
  this.apply = function(id, model, onMarkup, onError) {
    var template;
    if (self.templates[id]) {
      template = self.templates[id];
      return template.apply(model, function(id, op, result) {
        return onMarkup(id, op, result);
      });
    } else if (model.__template__ && id) {
      self.map(id, model.__template__, model);
      return self.apply(id, model, onMarkup, onError);
    } else {
      return onError(id, "render", "No template with " + id + " has been mapped");
    }
  };
  this.resolver = resolver;
  return self;
};
cartographer = new Cartographer();
cartographer;
var eventHandlers, modelTargets, modelTargetsForCollections, templateProperties;
eventHandlers = {
  click: "onclick",
  dblclick: "ondblclick",
  mousedown: "onmousedown",
  mouseup: "onmouseup",
  mouseover: "onmouseover",
  mousemove: "onmousemove",
  mouseout: "onmouseout",
  keydown: "onkeydown",
  keypress: "onkeypress",
  keyup: "onkeyup",
  select: "onselect",
  change: "onchange",
  focus: "onfocus",
  blur: "onblur",
  scroll: "onscroll",
  resize: "onresize",
  submit: "onsubmit"
};
modelTargets = {
  hide: "hidden",
  title: "title",
  "class": "className",
  value: ["value", "textContent"]
};
modelTargetsForCollections = {
  hide: "hidden",
  title: "title",
  value: "value",
  "class": "className"
};
templateProperties = {
  id: "id",
  name: "name",
  title: "title",
  className: "class",
  type: "type",
  width: "width",
  height: "height",
  value: "value"
};
var conditionalCopy, copyProperties, createFqn, externalItemTemplate, externalTemplate, isCurrent, propertyCopy;
createFqn = function(namespace, id, name, filterName) {
  var delimiter, newId, newNs, result;
  newNs = namespace || "";
  newId = id === void 0 ? "" : id;
  delimiter = newNs !== "" && newId !== "" ? "." : "";
  result = "" + newNs + delimiter + newId;
  return result;
};
conditionalCopy = function(target, targetId, value) {
  var original;
  original = target[targetId];
  if (original || value) {
    return target[targetId] = value || original;
  }
};
propertyCopy = function(source, target, sourceId, targetId) {
  var x, _i, _len, _results;
  if (_.isArray(targetId)) {
    _results = [];
    for (_i = 0, _len = targetId.length; _i < _len; _i++) {
      x = targetId[_i];
      _results.push(conditionalCopy(target, x, source[sourceId]));
    }
    return _results;
  } else {
    return conditionalCopy(target, targetId, source[sourceId]);
  }
};
copyProperties = function(source, target, list) {
  var x, _i, _len, _ref, _results;
  if (source && target) {
    _ref = _.keys(list);
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      x = _ref[_i];
      _results.push(propertyCopy(source, target, x, list[x]));
    }
    return _results;
  }
};
isCurrent = function(id, namespace) {
  return id === namespace;
};
externalTemplate = function(model, id) {
  var _ref;
  return (_ref = model[id]) != null ? _ref.__template__ : void 0;
};
externalItemTemplate = function(model, id) {
  var _ref, _ref2;
  if (_(model[id]).isArray()) {
    return (_ref = model[id]) != null ? (_ref2 = _ref[0]) != null ? _ref2.__template__ : void 0 : void 0;
  }
};
var Template;
Template = function(id, name) {
  var buildCreateElement, crawl, elementTemplate, handleTemplate, makeTag, self, wireUp;
  self = this;
  handleTemplate = function(template, templateId, onTemplate) {
    if (self.templates[templateId]) {
      onTemplate(self.templates[templateId]);
      return true;
    } else {
      resolver.resolve(template, function(x) {
        self.templates[templateId] = x;
        return onTemplate(x);
      }, function() {
        return console.log("Could not resolve tempalte " + template);
      });
      return true;
    }
  };
  elementTemplate = function(element) {
    var _ref;
    return element != null ? (_ref = element.attributes[configuration.templateIdentifier]) != null ? _ref.value : void 0 : void 0;
  };
  crawl = function(namespace, element, templates, onDone) {
    var addChildFunction, child, childFunctionsExpected, children, childrenFunctions, continueProcessing, elementFqn, elementId, template, _i, _len, _ref, _results;
    if ((element != null ? element.nodeType : void 0) && element.nodeType !== 1) {
      return onDone(function() {
        return element.nodeValue;
      });
    } else {
      template = elementTemplate(element) || (!element ? self.name : void 0);
      elementId = element != null ? (_ref = element.attributes[configuration.elementIdentifier]) != null ? _ref.value : void 0 : void 0;
      elementFqn = namespace + (elementId ? "." + elementId : '');
      if (template) {
        return handleTemplate(template, elementFqn + "." + template, function(x) {
          return crawl(namespace, x, templates, onDone);
        });
      } else {
        children = element.childNodes;
        childFunctionsExpected = children.length;
        continueProcessing = function(contentList) {
          var factory;
          factory = buildCreateElement(element, elementId, elementFqn, contentList, templates);
          self.factories[elementFqn] = factory;
          return onDone(factory);
        };
        if (children.length > 0) {
          childrenFunctions = [];
          addChildFunction = function(factory) {
            childrenFunctions.push(factory);
            if (childrenFunctions.length === childFunctionsExpected) {
              return continueProcessing(childrenFunctions);
            }
          };
          _results = [];
          for (_i = 0, _len = children.length; _i < _len; _i++) {
            child = children[_i];
            _results.push(crawl(elementFqn, child, templates, addChildFunction));
          }
          return _results;
        } else {
          return continueProcessing([]);
        }
      }
    }
  };
  buildCreateElement = function(element, elementId, elementFqn, childrenToCreate, templates) {
    var tag;
    tag = element.tagName.toUpperCase();
    return function(model, modelFqn, id) {
      var children, collection, controls, createElement, factory, indx, list, newFqn, newId, template, val, _ref;
      newId = id === void 0 ? elementId : id;
      newFqn = createFqn(modelFqn, newId, true, self.name);
      val = newId === void 0 ? model : model != null ? model[newId] : void 0;
      val = (val != null ? val.value : void 0) || val;
      template = val != null ? val.__template__ : void 0;
      if (template && !templates[newFqn]) {
        templates[newFqn] = true;
        return handleTemplate(template, template, function(x) {
          return crawl(elementFqn, x, templates, function(callback) {
            return callback(model, modelFqn, id);
          });
        });
      } else {
        if (childrenToCreate && childrenToCreate.length > 0) {
          collection = (val != null ? val.length : void 0) ? val : val != null ? val.items : void 0;
          if (collection && collection.length) {
            list = [];
            children = childrenToCreate.slice(0);
            self.factories[newFqn + "_add"] = function(newIndex, newModel) {
              var factory, _i, _len, _results;
              _results = [];
              for (_i = 0, _len = children.length; _i < _len; _i++) {
                factory = children[_i];
                _results.push(factory(newModel, newFqn, newIndex));
              }
              return _results;
            };
            for (indx = 0, _ref = collection.length - 1; 0 <= _ref ? indx <= _ref : indx >= _ref; 0 <= _ref ? indx++ : indx--) {
              list.push((function() {
                var _i, _len, _results;
                _results = [];
                for (_i = 0, _len = childrenToCreate.length; _i < _len; _i++) {
                  factory = childrenToCreate[_i];
                  _results.push(factory(collection, newFqn, indx));
                }
                return _results;
              })());
            }
            return makeTag(tag, element, newFqn, newId, elementId !== void 0, list, model);
          } else {
            controls = (function() {
              var _i, _len, _results;
              _results = [];
              for (_i = 0, _len = childrenToCreate.length; _i < _len; _i++) {
                createElement = childrenToCreate[_i];
                _results.push(createElement(val, newFqn));
              }
              return _results;
            })();
            return makeTag(tag, element, newFqn, newId, elementId !== void 0, controls, model);
          }
        } else {
          return makeTag(tag, element, newFqn, newId, elementId !== void 0, val, model);
        }
      }
    };
  };
  makeTag = function(tag, originalElement, fqn, id, hasId, val, model) {
    var content, element, properties;
    properties = {};
    content = _.isArray(val) && !_.isString(val) ? val || (val != null ? val[id] : void 0) : (val != null ? val[id] : void 0) || val;
    content = originalElement.children.length === 0 && id === void 0 ? originalElement.textContent : content;
    element = {};
    if (hasId) {
      properties[configuration.elementIdentifier] = fqn;
    }
    if (originalElement) {
      copyProperties(originalElement, properties, templateProperties);
    }
    if (tag === "INPUT") {
      if (!_.isObject(content)) {
        properties.value = content;
      }
      element = self.html[tag](properties);
    } else {
      element = self.html[tag](properties, content);
    }
    if (model != null ? model[id] : void 0) {
      if (val instanceof Array) {
        copyProperties(model[id], element, modelTargetsForCollections);
      } else {
        copyProperties(model[id], element, modelTargets);
      }
    }
    if (hasId) {
      self[fqn] = element;
    }
    return element;
  };
  wireUp = function() {
    var x, _i, _len, _ref, _results;
    _ref = self.watching;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      x = _ref[_i];
      _results.push(self.watchEvent(x.event, x.handler));
    }
    return _results;
  };
  this.apply = function(model, onResult) {
    if (!self.ready) {
      return self.deferredApplyCalls.push(function() {
        return self.apply(model, onResult);
      });
    } else {
      self.top = self.render(model, self.id);
      $(self.top).attr(configuration.elementIdentifier, self.id);
      wireUp();
      return onResult(self.id, "render", self.top);
    }
  };
  this.watchEvent = function(eventName, onEvent) {
    if (self.top) {
      $(self.top).on(eventName, function(ev) {
        var elementId, _ref;
        elementId = (_ref = ev.target.attributes[configuration.elementIdentifier]) != null ? _ref.value : void 0;
        return onEvent(self.id, elementId, ev.target, ev.type);
      });
    }
    self.watching.push({
      event: eventName,
      handler: onEvent
    });
    return self.watching = _.uniq(self.watching);
  };
  this.ignoreEvent = function(eventName) {
    if (self.top) {
      self.top.off(eventname);
    }
    return self.watching = _.reject(self.watching, function(x) {
      return x.event === eventName;
    });
  };
  this.update = function(fqn, model, onResult) {
    var childKey, lastIndex, newElement, parentKey;
    lastIndex = fqn.lastIndexOf(".");
    parentKey = fqn.substring(0, lastIndex);
    childKey = fqn.substring(lastIndex + 1);
    if (self.factories[fqn]) {
      newElement = self.factories[fqn](model, parentKey, childKey);
      return onResult(fqn, "update", newElement);
    }
  };
  this.add = function(fqn, model, onResult) {
    var addName, childKey, count, lastIndex, newElement, parentKey;
    lastIndex = fqn.lastIndexOf(".");
    parentKey = fqn.substring(0, lastIndex);
    childKey = fqn.substring(lastIndex + 1);
    addName = fqn + "_add";
    if (self.factories[addName]) {
      count = self[fqn].children.length;
      newElement = self.factories[addName](count, model);
      return onResult(fqn, "add", newElement);
    }
  };
  this.name = name;
  this.id = id;
  this.fqn = "";
  this.html = DOMBuilder.dom;
  this.templates = {};
  this.top = void 0;
  this.changeSubscription = void 0;
  this.watching = [];
  this.deferredApplyCalls = [];
  this.render = function() {};
  this.ready = false;
  this.factories = {};
  crawl(self.id, void 0, {}, function(x) {
    var call, _i, _len, _ref, _results;
    self.render = x;
    self.ready = true;
    if (self.deferredApplyCalls.length > 0) {
      _ref = self.deferredApplyCalls;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        call = _ref[_i];
        _results.push(call());
      }
      return _results;
    }
  });
  return self;
};
var PostalSetup, setup;
PostalSetup = function() {
  var self;
  self = this;
  this.apply = function(message) {
    var model, template;
    template = message.template;
    model = message.model;
    return cartographer.apply(template, model, (function(id, op, markup) {
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
    return cartographer.map(message.template, message.name);
  };
  this.resolver = function(message) {
    if (message.order === "prepend") {
      return cartographer.resolver.prependSource(message.resolver);
    } else {
      return cartographer.resolver.appendSource(message.resolver);
    }
  };
  this.add = function(message) {
    var fqn, model, template, templateId;
    templateId = message.template;
    fqn = message.id;
    model = message.model;
    template = cartographer.templates[templateId];
    return template.add(fqn, model, function(id, op, markup) {
      return postal.publish("cartographer", "render.{templateId}", {
        template: templateId,
        parent: fqn,
        markup: markup,
        operation: "add"
      });
    });
  };
  this.update = function(message) {
    var fqn, model, template, templateId;
    templateId = message.template;
    fqn = message.id;
    model = message.model;
    template = cartographer.templates[templateId];
    return template.update(fqn, model, function(id, op, markup) {
      return postal.publish("cartographer", "render.{templateId}", {
        template: templateId,
        id: fqn,
        markup: markup,
        operation: "update"
      });
    });
  };
  this.watch = function(message) {
    var template;
    template = cartographer.templates[message.template];
    return template.watchEvent(message.event, function(template, elementId, element, event) {
      return postal.publish("cartographer." + template, "" + elementId + "." + event, {
        element: element
      });
    });
  };
  this.ignore = function(message) {
    var template;
    template = cartographer.templates[message.template];
    return template.ignoreEvent(message.event);
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