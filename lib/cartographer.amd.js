define(['jQuery', 'underscore', 'postal', 'infuser', 'DOMBuilder'], function($, _, postal, infuser, DOMBuilder) {
  var configuration;
configuration = {
  elementIdentifier: 'map-id'
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
      console.log("got " + x);
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
    onMarkup = onMarkup || function(result) {
      return postal.publish("cartographer", "render." + id, {
        id: id,
        markup: result
      });
    };
    onError = onError || function(result) {
      return postal.publish("cartographer", "render." + id + ".error", result);
    };
    if (self.templates[id]) {
      template = self.templates[id];
      return template.apply(model, function(result) {
        return onMarkup(result);
      });
    } else if (model.__template__ && id) {
      self.map(id, model.__template__, model);
      return self.apply(id, model, onMarkup, onError);
    } else {
      return onError("No template with " + id + " has been mapped");
    }
  };
  this.resolver = resolver;
  return self;
};
cartographer = new Cartographer();
postal.subscribe("cartographer", "api.*", function(message, envelope) {
  if (envelope.topic === "api.map") {
    return cartographer.map(message.id, message.name);
  } else if (envelope.topic === "api.apply") {
    return cartographer.apply(message.id, message.model);
  } else if (envelope.topic === "api.prepend.resolver") {
    return cartographer.resolver.prependSource(message.resolver);
  } else if (envelope.topic === "api.append.resolver") {
    return cartographer.resolver.appendSource(message.resolver);
  }
});
postal.subscribe("cartographer", "event.*", function(message, envelope) {
  var template;
  if (envelope.topic === "event.watch") {
    template = cartographer.templates[message.id];
    return template != null ? template.watchEvent(message.event) : void 0;
  } else if (envelope.topic === "event.ignore") {
    template = cartographer.templates[message.id];
    return template != null ? template.ignoreEvent(message.event) : void 0;
  }
});
postal.subscribe("postal", "subscription.*", function(message, envelope) {
  var parts, template, templateId;
  if (envelope.topic === "subscription.created" && message.exchange.match(/^cartographer[.].+/)) {
    templateId = message.exchange.split('.')[1];
    template = cartographer.templates[templateId];
    if (template) {
      parts = message.topic.split('.');
      return template.watchEvent(parts[parts.length - 1]);
    }
  } else if (message.exchange.match(/^cartographer[.]*/)) {
    templateId = message.exchange.split('.')[1];
    template = cartographer.templates[templateId];
    if (template) {
      parts = message.topic.split('.');
      return template.ignoreEvent(parts[parts.length - 1]);
    }
  }
});
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
  if (filterName) {
    if (namespace === "" && id === name) {
      return "";
    } else {
      newNs = newNs === name ? "" : newNs;
    }
  }
  newId = id || "";
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
  var buildCreateElement, crawl, handleTemplateChange, makeTag, onElement, self, subscribe, wireUp;
  self = this;
  crawl = function(model, namespace, element, onDone, templates) {
    var elementId, missingElement, modelId, template, templateLoaded, _ref;
    elementId = (element != null ? (_ref = element.attributes[configuration.elementIdentifier]) != null ? _ref.value : void 0 : void 0) || "";
    elementId = elementId === self.name ? "" : elementId;
    modelId = createFqn(namespace, elementId, self.name, true);
    missingElement = !element;
    template = externalTemplate(model, elementId) || self.name;
    templateLoaded = !templates[namespace + '.' + modelId];
    if ((templateLoaded && !isCurrent(modelId, namespace) && externalTemplate(model, elementId)) || missingElement) {
      return resolver.resolve(template, function(x) {
        templates[namespace + '.' + modelId] = true;
        return onElement(model, namespace, x, onDone, templates);
      }, function() {
        return console.log("No template could be found for " + template);
      });
    } else {
      return onElement(model, namespace, element, onDone, templates);
    }
  };
  buildCreateElement = function(tag, element, elementId, model, childrenToCreate) {
    var createElement;
    return createElement = function(elementModel, modelFqn, idx) {
      var childElement, childFactory, collection, controls, createElement, factory, indx, list, newFqn, newId, val, _ref;
      newId = elementId === "" ? idx : elementId;
      newFqn = createFqn(modelFqn, newId, true, self.name);
      val = (newId === newFqn || newId === void 0 ? elementModel : elementModel[newId]) || elementModel;
      if (val != null ? val.value : void 0) {
        val = val.value;
      }
      collection = (val != null ? val.length : void 0) ? val : val != null ? val.items : void 0;
      if (collection && collection.length) {
        list = [];
        childFactory = childrenToCreate[0];
        self.template[newFqn + "_add"] = function(newIndex, newModel) {
          return childFactory(newModel, newFqn, newIndex);
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
        childElement = makeTag(tag, element, newFqn, newId, list, model, elementModel);
        self[newFqn] = childElement;
        return childElement;
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
        childElement = makeTag(tag, element, newFqn, newId, controls, model, elementModel);
        self[newFqn] = childElement;
        return childElement;
      }
    };
  };
  onElement = function(model, namespace, element, onDone, templates) {
    var child, childCallback, childrenCount, childrenToCreate, createElement, elementId, fqn, onChildElement, tag, template, _i, _len, _ref, _ref2, _ref3, _results;
    if (!element) {
      console.log("ELEMENT IS NULL AND SHOULDN'T BE!!!!!!");
    }
    elementId = (element != null ? (_ref = element.attributes[configuration.elementIdentifier]) != null ? _ref.value : void 0 : void 0) || "";
    fqn = createFqn(namespace, elementId, true, self.name);
    tag = element.tagName.toUpperCase();
    template = externalItemTemplate(model, elementId);
    if (template && !templates[namespace + '.' + elementId]) {
      return resolver.resolve(template, function(x) {
        var child, childCallback, children, childrenCount, childrenToCreate, onChildElement, _i, _len, _results;
        templates[namespace + '.' + elementId] = true;
        children = x.length > 1 ? x : [x];
        childrenCount = children.length;
        if (childrenCount > 0) {
          childrenToCreate = [];
          onChildElement = function(child) {
            var createElement;
            childrenToCreate.push(child);
            if (childrenToCreate.length === childrenCount) {
              createElement = buildCreateElement(tag, element, elementId, model, childrenToCreate);
              self.template[fqn] = createElement;
              return onDone(createElement);
            }
          };
          childCallback = function(y) {
            return onChildElement(y);
          };
          _results = [];
          for (_i = 0, _len = children.length; _i < _len; _i++) {
            child = children[_i];
            _results.push(crawl(model, fqn, child, childCallback, templates));
          }
          return _results;
        }
      }, function() {
        return console.log("No template could be found for " + template);
      });
    } else {
      childrenCount = (_ref2 = element.children) != null ? _ref2.length : void 0;
      if (childrenCount > 0) {
        childrenToCreate = [];
        onChildElement = function(child) {
          var createElement;
          childrenToCreate.push(child);
          if (childrenToCreate.length === childrenCount) {
            createElement = buildCreateElement(tag, element, elementId, model, childrenToCreate);
            self.template[fqn] = createElement;
            return onDone(createElement);
          }
        };
        childCallback = function(x) {
          return onChildElement(x);
        };
        _ref3 = element.children;
        _results = [];
        for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
          child = _ref3[_i];
          _results.push(crawl(model, fqn, child, childCallback, templates));
        }
        return _results;
      } else {
        createElement = function(elementModel, modelFqn, idx) {
          var childElement, newFqn, newId, val;
          newId = elementId === "" ? idx : elementId;
          newFqn = createFqn(modelFqn, newId, true, self.name);
          val = newId === newFqn || newId === void 0 ? elementModel : elementModel[newId];
          if (val != null ? val.value : void 0) {
            val = val.value;
          }
          childElement = makeTag(tag, element, newFqn, newId, val, model, elementModel);
          self[newFqn] = childElement;
          return childElement;
        };
        self.template[fqn] = createElement;
        return onDone(createElement);
      }
    }
  };
  makeTag = function(tag, template, fqn, id, val, root, model) {
    var content, element, properties, templateSource;
    properties = {};
    templateSource = template.textContent ? template.textContent : template.value;
    content = (val != null ? val[id] : void 0) || (val && id) || template.children.length > 1 ? val || (val != null ? val[id] : void 0) : templateSource;
    element = {};
    if (id || id === 0) {
      properties[configuration.elementIdentifier] = id;
    }
    if (template) {
      copyProperties(template, properties, templateProperties);
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
    return element;
  };
  handleTemplateChange = function(message) {
    var addName, childKey, control, lastIndex, newElement, op, parentKey;
    control = self[message.key];
    op = message.operation;
    lastIndex = message.key.lastIndexOf(".");
    parentKey = message.key.substring(0, lastIndex);
    childKey = message.key.substring(lastIndex + 1);
    if (op === "add") {
      addName = message.key + "_add";
      if (self.template[addName]) {
        newElement = self.template[addName](message.value, parentKey, childKey);
        return postal.publish("cartographer", "markup.added", {
          operation: "added",
          parent: parentKey,
          markup: newElement
        });
      }
    } else if (op = "change") {
      return self.template[message.key](message.value, parentKey, childKey, function(x) {
        return postal.publish("cartographer", "markup.created", {
          operation: "created",
          parent: parentKey,
          markup: x
        });
      });
    }
  };
  subscribe = function() {
    if (self.changeSubscription !== void 0) {
      self.changeSubscription.unsubscribe();
    }
    return self.changeSubscription = postal.subscribe("cartographer", "template." + self.id + ".*", handleTemplateChange);
  };
  wireUp = function() {
    var x, _i, _len, _ref, _results;
    _ref = self.watching;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      x = _ref[_i];
      _results.push(self.watchEvent(x));
    }
    return _results;
  };
  this.apply = function(model, onResult) {
    return crawl(model, "", self.element, function(x) {
      self.top = x(model, "");
      wireUp();
      return onResult(self.top);
    }, {});
  };
  this.watchEvent = function(eventName) {
    if (self.top) {
      $(self.top).on(eventName, function(ev) {
        var topic, _ref;
        topic = ((_ref = ev.target.attributes[configuration.elementIdentifier]) != null ? _ref.value : void 0) + '.' + ev.type;
        return postal.publish("cartographer." + self.id, topic, ev.target);
      });
    }
    self.watching.push(eventName);
    return self.watching = _.uniq(self.watching);
  };
  this.ignoreEvent = function(eventName) {
    self.top.off(eventname);
    return self.watching = _.reject(self.watching, function(x) {
      return x === eventName;
    });
  };
  this.name = name;
  this.id = id;
  this.fqn = "";
  this.element = void 0;
  this.html = DOMBuilder.dom;
  this.template = {};
  this.top = void 0;
  this.changeSubscription = void 0;
  this.watching = [];
  resolver.resolve(name, function(x) {
    return self.element = x;
  }, function() {
    return console.log("No template could be found for " + name);
  });
  subscribe();
  return self;
};
});