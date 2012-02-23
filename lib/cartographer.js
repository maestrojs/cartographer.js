/*
  cartographer
  author: Alex Robson <@A_Robson>
  License: MIT ( http://www.opensource.org/licenses/mit-license )
  Version: 0.1.0
*/define(['postal', 'infuser', 'DOMBuilder'], function(postal, infuser) {
  var SourceResolver, resolver;
SourceResolver = function() {
  var self, sources;
  self = this;
  sources = [];
  this.addSource = function(source) {
    return sources.push(source);
  };
  this.resolve = function(name, onFound, notFound) {
    var finder, index;
    index = 0;
    finder = function() {};
    finder = function() {
      var call, _ref;
      call = (_ref = sources[index]) != null ? _ref.resolve : void 0;
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
resolver.addSource({
  resolve: function(name, success, fail) {
    var template;
    template = $('[' + configuration.elementIdentifier + '="' + name + '-template"]');
    if (template.length > 0) {
      return success(template[0]);
    } else {
      return fail();
    }
  }
});
if (infuser) {
  resolver.addSource({
    resolve: function(name, success, fail) {
      return infuser.get(name, function(x) {
        return success(x);
      }, function(x) {
        console.log("got " + x);
        return fail();
      });
    }
  });
}
  var Cartographer, cartographer, configuration;
configuration = {
  elementIdentifier: 'map-id'
};
Cartographer = function() {
  var self;
  self = this;
  this.config = configuration;
  this.templates = {};
  this.map = function(id, name, model) {
    var template;
    template = new Template(id, name, model);
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
      return postal.publish("cartographer", "render.error." + id, result);
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
    return cartographer.map(message.id, message.name, message.model);
  } else if (envelope.topic === "api.apply") {
    return cartographer.apply(message.id, message.model);
  } else if (envelope.topic === "api.templateSource") {
    return cartographer.resolver.addSource(message.provider);
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
  var conditionalCopy, copyProperties, createFqn, externalTemplate, isCurrent;
createFqn = function(namespace, id, name, filterName) {
  var delimiter, newId, newNs, result;
  newNs = namespace || "";
  if (filterName) {
    newNs = newNs === name ? "" : newNs;
  }
  newId = id || "";
  delimiter = newNs !== "" && newId !== "" ? "." : "";
  result = "" + newNs + delimiter + newId;
  return result;
};
conditionalCopy = function(source, target, sourceId, targetId) {
  var x, _i, _len, _results;
  if (_.isArray(targetId)) {
    _results = [];
    for (_i = 0, _len = targetId.length; _i < _len; _i++) {
      x = targetId[_i];
      _results.push((target[x] = source[sourceId] || target[x]));
    }
    return _results;
  } else {
    return target[targetId] = source[sourceId] || target[targetId];
  }
};
copyProperties = function(source, target, list) {
  var x, _i, _len, _ref, _results;
  if (source && target) {
    _ref = _.keys(list);
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      x = _ref[_i];
      _results.push(conditionalCopy(source, target, x, list[x]));
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
  var Template;
Template = function(id, name, model) {
  var crawl, handleTemplateChange, makeTag, onElement, self, subscribe, wireUp;
  self = this;
  crawl = function(model, namespace, element, onDone) {
    var elementId, missingElement, modelId, template, _ref;
    elementId = (element != null ? (_ref = element.attributes[configuration.elementIdentifier]) != null ? _ref.value : void 0 : void 0) || "";
    modelId = createFqn(namespace, elementId, self.name, true);
    missingElement = !element;
    template = externalTemplate(model, elementId) || self.name;
    if ((!isCurrent(modelId, namespace) && externalTemplate(model, elementId)) || missingElement) {
      return resolver.resolve(template, function(x) {
        x.nested = true;
        return onElement(model, namespace, x, onDone);
      }, function() {
        return console.log("No template could be found for " + template);
      });
    } else {
      return onElement(model, namespace, element, onDone);
    }
  };
  onElement = function(model, namespace, element, onDone) {
    var child, childrenCount, childrenToCreate, createElement, elementId, fqn, onChildElement, tag, _i, _len, _ref, _ref2, _ref3, _results;
    if (!element) {
      console.log("ELEMENT IS NULL AND SHOULDN'T BE!!!!!!");
    }
    elementId = (element != null ? (_ref = element.attributes[configuration.elementIdentifier]) != null ? _ref.value : void 0 : void 0) || "";
    fqn = createFqn(namespace, elementId, false, self.name);
    tag = element.tagName.toUpperCase();
    childrenCount = (_ref2 = element.children) != null ? _ref2.length : void 0;
    if (childrenCount > 0) {
      childrenToCreate = [];
      onChildElement = function(child) {
        var createElement;
        childrenToCreate.push(child);
        if (childrenToCreate.length === childrenCount) {
          createElement = function(elementModel, modelFqn, idx) {
            var childElement, childFactory, collection, controls, createElement, factory, indx, list, newFqn, newId, val, _ref3;
            newId = elementId === "" ? idx : elementId;
            newFqn = createFqn(modelFqn, newId, false, self.name);
            val = newId === newFqn || newId === void 0 ? elementModel : elementModel[newId];
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
              for (indx = 0, _ref3 = collection.length - 1; 0 <= _ref3 ? indx <= _ref3 : indx >= _ref3; 0 <= _ref3 ? indx++ : indx--) {
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
                  _results.push(createElement(self.html, val, newFqn));
                }
                return _results;
              })();
              childElement = makeTag(tag, element, newFqn, newId, controls, model, elementModel);
              self[newFqn] = childElement;
              return childElement;
            }
          };
          self.template[fqn] = createElement;
          return onDone(createElement);
        }
      };
      _ref3 = element.children;
      _results = [];
      for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
        child = _ref3[_i];
        _results.push(crawl(model, fqn, child, function(x) {
          return onChildElement(x);
        }));
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
  };
  makeTag = function(tag, template, fqn, id, val, root, model) {
    var content, element, properties, templateSource;
    properties = {};
    templateSource = template.textContent ? template.textContent : template.value;
    content = val ? val : templateSource;
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
      addName = parentKey + "_add";
      if (self.template[addName]) {
        newElement = self.template[addName](message.value, parentKey, childKey);
        return postal.publish("cartographer", "markup.added", {
          operation: "added",
          parent: parentKey,
          element: newElement
        });
      }
    } else if (op = "change") {
      return self.template[message.key](message.value, parentKey, childKey, function(x) {
        return postal.publish("cartographer", "markup.created", {
          operation: "created",
          parent: parentKey,
          element: x
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
      self.top = x(self.html, model);
      wireUp();
      return onResult(self.top);
    });
  };
  this.watchEvent = function(eventName) {
    self.top.on(eventName, function(ev) {
      var topic, _ref;
      topic = self.id + '.' + ((_ref = ev.target.attributes[configuration.elementIdentifier]) != null ? _ref.value : void 0) + '.' + ev.type;
      return postal.publish("cartographer", topic, ev.target);
    });
    return self.watching = _.uniq(self.watching.push(eventName));
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