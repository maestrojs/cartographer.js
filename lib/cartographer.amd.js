define(['jquery', 'underscore', 'infuser', 'DOMBuilder'], function($, _, infuser) {
  var configuration, createChildren, createFqn, elementTemplate, getActualValue, getHtmlFromList, getNestedValue;
configuration = {
  elementIdentifier: 'data-id',
  templateIdentifier: 'data-template'
};
createChildren = function(iterations, templateInstance, model, modelFqn, id, context, onChildren) {
  var callList, childFqn, childId, childModel, children, fx, isCollection, iteration, _i, _len, _ref;
  children = context.childrenToCreate;
  isCollection = iterations > 0;
  if (!iterations) {
    iterations = 1;
  }
  childId = id;
  childModel = model;
  childFqn = modelFqn;
  callList = [];
  for (iteration = 0, _ref = iterations - 1; 0 <= _ref ? iteration <= _ref : iteration >= _ref; 0 <= _ref ? iteration++ : iteration--) {
    if (id === void 0 && isCollection) {
      childId = iteration;
      childModel = model[childId];
      childFqn = "" + modelFqn + "." + childId;
    }
    for (_i = 0, _len = children.length; _i < _len; _i++) {
      fx = children[_i];
      callList.push(createCallback(self, fx, [templateInstance, childModel, childFqn, childId]));
    }
  }
  return forkJoin(callList, onChildren);
};
createFqn = function(namespace, id, name, filterName) {
  var delimiter, newId, newNs, result;
  newNs = namespace || "";
  newId = id === void 0 ? "" : id;
  delimiter = newNs !== "" && newId !== "" ? "." : "";
  result = "" + newNs + delimiter + newId;
  return result;
};
elementTemplate = function(element) {
  var _ref;
  return element != null ? (_ref = element.attributes[configuration.templateIdentifier]) != null ? _ref.value : void 0 : void 0;
};
getActualValue = function(value, context) {
  if (_.isFunction(value)) {
    return value.call(context);
  } else {
    return value;
  }
};
getHtmlFromList = function(list, html) {
  return $(html["DIV"]({}, list)).html();
};
getNestedValue = function(value, property) {
  if (value && value[property]) {
    return value[property];
  } else {
    return;
  }
};
var createCallback, forkJoin, queueByArgList, queueByFunctionList;
forkJoin = function(work, done, iterations) {
  var callCounter, count, fx, iteration, list, onList, total, _ref, _results;
  if (!iterations) {
    iterations = 1;
  }
  total = work.length * iterations;
  list = new Array(total);
  count = 0;
  onList = function(index, result) {
    count++;
    list[index] = result;
    if (count === total) {
      return done(list);
    }
  };
  callCounter = 0;
  _results = [];
  for (iteration = 0, _ref = iterations - 1; 0 <= _ref ? iteration <= _ref : iteration >= _ref; 0 <= _ref ? iteration++ : iteration--) {
    _results.push((function() {
      var _i, _len, _results2;
      _results2 = [];
      for (_i = 0, _len = work.length; _i < _len; _i++) {
        fx = work[_i];
        fx(function(y) {
          return onList(callCounter, y);
        });
        _results2.push(callCounter++);
      }
      return _results2;
    })());
  }
  return _results;
};
queueByArgList = function(context, worker, argList) {
  var count, index, list, _ref;
  count = argList.length;
  list = new Array(count);
  for (index = 0, _ref = count - 1; 0 <= _ref ? index <= _ref : index >= _ref; 0 <= _ref ? index++ : index--) {
    list[index] = createCallback(context, worker, argList[index]);
  }
  return list;
};
queueByFunctionList = function(context, workers, args) {
  var count, index, list, _ref;
  count = workers.length;
  list = new Array(count);
  for (index = 0, _ref = count - 1; 0 <= _ref ? index <= _ref : index >= _ref; 0 <= _ref ? index++ : index--) {
    list[index] = createCallback(context, workers[index], args);
  }
  return list;
};
createCallback = function(context, callback, args) {
  return function(x) {
    return callback.apply(context, args.concat(x));
  };
};
var SourceResolver, infuser, resolver;
SourceResolver = (function() {
  function SourceResolver() {
    this.sources = [];
  }
  SourceResolver.prototype.appendSource = function(source) {
    return this.sources.push(source);
  };
  SourceResolver.prototype.prependSource = function(source) {
    return this.sources.unshift(source);
  };
  SourceResolver.prototype.resolve = function(name, onFound, notFound) {
    var finder, index, self;
    self = this;
    index = 0;
    finder = function() {};
    finder = function() {
      var call;
      call = self.sources[index];
      if (call) {
        return call(name, function(x) {
          return onFound($(x));
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
  return SourceResolver;
})();
resolver = new SourceResolver();
resolver.appendSource(function(name, success, fail) {
  var template;
  template = $('#' + name + '-template');
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
Cartographer = (function() {
  function Cartographer() {
    this.config = configuration;
    this.templates = {};
    this.containerLookup = {};
    this.instanceCache = {};
    this.resolver = resolver;
  }
  Cartographer.prototype.map = function(name) {
    var template;
    template = new Template(name);
    this.templates[name] = template;
    return true;
  };
  Cartographer.prototype.render = function(name, id, model, onMarkup, onError) {
    var self, template, templateName;
    self = this;
    this.containerLookup[id] = this.templates[name];
    if (this.templates[name]) {
      template = this.templates[name];
      return template.apply(id, model, function(id, op, result) {
        self.instanceCache[id] = result;
        return onMarkup(id, op, result);
      });
    } else if (model.__template__ && id) {
      templateName = model.__template__;
      this.map(templateName);
      return this.render(templateName, id, model, onMarkup, onError);
    } else {
      return onError(id, "render", "No template with " + name + " has been mapped");
    }
  };
  Cartographer.prototype.add = function(id, listId, model, onMarkup) {
    var template;
    if (this.containerLookup[id]) {
      template = this.containerLookup[id];
      return template.add(listId, model, onMarkup);
    }
  };
  Cartographer.prototype.update = function(id, controlId, model, onMarkup) {
    var template;
    if (this.containerLookup[id]) {
      template = this.containerLookup[id];
      return template.update(controlId, model, onMarkup);
    }
  };
  return Cartographer;
})();
cartographer = new Cartographer();
cartographer;
var Template;
Template = (function() {
  function Template(name) {
    var self;
    this.name = name;
    self = this;
    this.name = name;
    this.fqn = "";
    this.html = DOMBuilder.dom;
    this.templates = {};
    this.deferredApplyCalls = [];
    this.renderTemplate = function() {};
    this.ready = false;
    this.factories = {};
    this.crawl(this.name, void 0, {}, function(x) {
      var call, _i, _len, _ref, _results;
      self.renderTemplate = x;
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
  }
  Template.prototype.handleTemplate = function(template, templateId, onTemplate) {
    var self;
    self = this;
    if (self.templates[templateId]) {
      onTemplate(self.templates[templateId]);
      return true;
    } else {
      resolver.resolve(template, function(x) {
        return onTemplate(x);
      }, function() {
        return console.log("Could not resolve tempalte " + template);
      });
      return true;
    }
  };
  Template.prototype.buildCreateCall = function(element, elementId, elementFqn, childrenToCreate, templates) {
    var context, self, tag;
    self = this;
    tag = element.tagName.toUpperCase();
    context = {
      tag: tag,
      element: element,
      elementId: elementId,
      elementFqn: elementFqn,
      childrenToCreate: childrenToCreate,
      templates: templates
    };
    return function(instance, model, fqn, id, onElement) {
      return self.create(instance, model, fqn, id, context, onElement);
    };
  };
  Template.prototype.crawl = function(namespace, markup, templates, onDone) {
    var argList, child, childFunctionsExpected, children, continueProcessing, elementFqn, elementId, i, queue1, self, template, total, workQueue, _ref;
    self = this;
    if ((markup != null ? markup.length : void 0) && (!markup.nodeType || markup.nodeType === 1)) {
      if (markup.length > 1) {
        total = markup.length;
        argList = (function() {
          var _ref, _results;
          _results = [];
          for (i = 0, _ref = total - 1; 0 <= _ref ? i <= _ref : i >= _ref; 0 <= _ref ? i++ : i--) {
            _results.push([namespace, markup[i], templates]);
          }
          return _results;
        })();
        workQueue = queueByArgList(self, self.crawl, argList);
        return forkJoin(workQueue, function(callList) {
          return onDone(function(instance, model, fqn, id, onElement) {
            var crawlQueue;
            crawlQueue = queueByFunctionList(self, callList, [instance, model, fqn, id]);
            return forkJoin(crawlQueue, function(result) {
              return onElement(result);
            });
          });
        });
      } else {
        return self.crawl(namespace, markup[0], templates, onDone);
      }
    } else {
      if ((markup != null ? markup.nodeType : void 0) && markup.nodeType !== 1) {
        return onDone(function() {
          return arguments[4](markup.nodeValue);
        });
      } else {
        template = markup ? template = elementTemplate(markup) : namespace;
        elementId = markup != null ? (_ref = markup.attributes[configuration.elementIdentifier]) != null ? _ref.value : void 0 : void 0;
        elementFqn = namespace + (elementId ? "." + elementId : '');
        if (template) {
          if (!templates[template]) {
            templates[template] = template;
            return self.handleTemplate(template, elementFqn + "." + template, function(x) {
              return self.crawl(namespace, x, templates, function(f) {
                self.factories[template] = f;
                return onDone(f);
              });
            });
          } else {
            return onDone(function() {
              return self.factories[template].apply(self, [].slice.call(arguments, 0));
            });
          }
        } else {
          children = markup.childNodes;
          childFunctionsExpected = children.length;
          continueProcessing = function(contentList) {
            var factory;
            factory = self.buildCreateCall(markup, elementId, elementFqn, contentList, templates);
            self.factories[elementFqn] = factory;
            return onDone(factory);
          };
          if (children.length > 0) {
            argList = (function() {
              var _i, _len, _results;
              _results = [];
              for (_i = 0, _len = children.length; _i < _len; _i++) {
                child = children[_i];
                _results.push([elementFqn, child, templates]);
              }
              return _results;
            })();
            queue1 = queueByArgList(self, self.crawl, argList);
            return forkJoin(queue1, continueProcessing);
          } else {
            return continueProcessing([]);
          }
        }
      }
    }
  };
  Template.prototype.handleModelTemplate = function(template, templateInstance, model, modelFqn, id, context, onElement) {
    var self;
    self = this;
    if (self.templates[template]) {
      return self.templates[template](templateInstance, model, modelFqn, id, onElement);
    } else {
      return self.handleTemplate(template, template, function(x) {
        return self.crawl(context.elementFqn, x, templates, function(callback) {
          self.templates[template] = callback;
          return callback(templateInstance, model, modelFqn, id, onElement);
        });
      });
    }
  };
  Template.prototype.create = function(templateInstance, model, modelFqn, id, context, onElement) {
    var childElementCount, childElements, childModel, collection, collectionLength, elementId, idForFqn, isBound, isCollection, memberTemplate, memberValue, modelTemplate, newFqn, self, _ref;
    self = this;
    elementId = context.elementId;
    id = elementId || id;
    isBound = elementId !== void 0 && elementId !== "";
    idForFqn = isBound ? id : "";
    newFqn = createFqn(modelFqn, idForFqn, false, self.name);
    if (isBound && !model[id]) {
      onElement("");
      return;
    }
    modelTemplate = getActualValue(model.__template__, model);
    memberTemplate = getActualValue((_ref = model[id]) != null ? _ref.__template__ : void 0, model);
    memberValue = getActualValue(getNestedValue(model[id], "__value__") || model[id] || getNestedValue(model, "__value__"), model);
    childModel = isBound ? model[id] : model;
    if (modelTemplate) {
      delete model.__template__;
      return self.handleModelTemplate(modelTemplate, templateInstance, model, modelFqn, id, context, function(x) {
        return onElement(self.makeTag(context.tag, context.element, newFqn, id, isBound, x, model, templateInstance));
      });
    } else if (memberTemplate) {
      delete model[id].__template__;
      return self.handleModelTemplate(modelTemplate, templateInstance, model, modelFqn, id, context, onElement);
    } else {
      childElements = context != null ? context.childrenToCreate.slice(0) : void 0;
      childElementCount = childElements.length;
      if (childElementCount > 0) {
        collection = getNestedValue(memberValue, "__items__") || memberValue;
        collectionLength = collection ? collection.length : 0;
        isCollection = collectionLength && !_.isString(collection) ? collection : void 0;
        self.factories[newFqn + "_add"] = function(itemIndex, itemModel, onItem) {
          newFqn = "" + newFqn + "." + itemIndex;
          return createChildren(0, templateInstance, itemModel, newFqn, itemIndex, context, onItem);
        };
        if (isCollection) {
          return createChildren(collectionLength, templateInstance, childModel, newFqn, void 0, context, function(list) {
            return onElement(self.makeTag(context.tag, context.element, newFqn, id, context.elementId, list, model, templateInstance));
          });
        } else {
          return createChildren(0, templateInstance, childModel, newFqn, id, context, function(list) {
            return onElement(self.makeTag(context.tag, context.element, newFqn, id, context.elementId, list, model, templateInstance));
          });
        }
      } else {
        return onElement(self.makeTag(context.tag, context.element, newFqn, id, isBound, memberValue, model, templateInstance));
      }
    }
  };
  Template.prototype.makeTag = function(tag, originalElement, fqn, id, hasId, val, model, templateInstance) {
    var content, element, properties, self, _ref;
    self = this;
    properties = {};
    content = _.isString(val) ? val : _.isArray(val) ? val || (val != null ? val[id] : void 0) : (val != null ? val[id] : void 0) || val;
    content = originalElement.children.length === 0 && id === void 0 && (_.isObject(val) || _.isArray(val)) ? originalElement.textContent : content;
    element = {};
    if (hasId) {
      properties[configuration.elementIdentifier] = fqn;
    }
    if (originalElement["className"]) {
      properties["class"] = originalElement["className"];
    }
    if (originalElement["type"]) {
      properties["type"] = originalElement["type"];
    }
    if (originalElement["value"]) {
      properties["value"] = originalElement["value"];
    }
    if (originalElement["id"]) {
      properties["id"] = originalElement["id"];
    }
    if (model != null ? (_ref = model[id]) != null ? _ref["class"] : void 0 : void 0) {
      properties["class"] = model[id]["class"];
    }
    if (tag === "INPUT") {
      if (!_.isObject(content)) {
        properties.value = content;
      }
      element = self.html[tag](properties);
    } else if (tag === "IMG") {
      properties = $.extend(properties, {
        src: content.src || content || originalElement.src,
        alt: content.alt || content || originalElement.alt,
        width: content.width || originalElement.width || "",
        height: content.height || originalElement.height || ""
      });
      element = self.html[tag](properties);
    } else if (tag === "A") {
      properties = $.extend(properties, {
        href: model.link || originalElement.href,
        alt: model.alt || content || originalElement.alt
      });
      element = self.html[tag](properties, content);
    } else {
      element = self.html[tag](properties, content);
    }
    return element;
  };
  Template.prototype.render = function(id, originalModel, onResult) {
    var model, self;
    self = this;
    model = $.extend(true, {}, originalModel);
    if (!self.ready) {
      return self.deferredApplyCalls.push(function() {
        return self.render(id, model, onResult);
      });
    } else {
      return self.renderTemplate(id, model, id, void 0, function(x) {
        var result;
        result = {};
        if (!x.length) {
          result = $(x)[0];
          $(result).attr(configuration.elementIdentifier, id);
        } else {
          result = getHtmlFromList(x, self.html);
        }
        return onResult(id, result, "render");
      });
    }
  };
  Template.prototype.update = function(fqn, model, onResult) {
    var childKey, lastIndex, parentKey, self, templateId;
    self = this;
    lastIndex = fqn.lastIndexOf(".");
    templateId = fqn.split('.')[0];
    parentKey = fqn.substring(0, lastIndex);
    childKey = fqn.substring(lastIndex + 1);
    if (self.factories[fqn]) {
      return self.factories[fqn](templateId, model, parentKey, childKey, (function(dom) {
        var newElement;
        newElement = dom;
        return onResult(fqn, newElement, "update");
      }));
    }
  };
  Template.prototype.add = function(fqn, model, onResult) {
    var addName, childKey, count, lastIndex, parentKey, self, templateId;
    self = this;
    lastIndex = fqn.lastIndexOf(".");
    templateId = fqn.split('.')[0];
    parentKey = fqn.substring(0, lastIndex);
    childKey = fqn.substring(lastIndex + 1);
    addName = fqn + "_add";
    if (self.factories[addName]) {
      count = $("[" + configuration.elementIdentifier + "=\"" + fqn + "\"]").children.length + 1;
      return self.factories[addName](count, model, (function(dom) {
        var newElement;
        newElement = getHtmlFromList(dom, self.html);
        return onResult(fqn, newElement, "add");
      }));
    }
  };
  return Template;
})();  return cartographer;
});