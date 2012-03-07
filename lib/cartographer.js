var configuration;
configuration = {
  elementIdentifier: 'data-id',
  templateIdentifier: 'data-template'
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
  return self;
};
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
Cartographer = function() {
  var self;
  self = this;
  this.config = configuration;
  this.templates = {};
  this.containerLookup = {};
  this.instanceCache = {};
  this.map = function(name) {
    var template;
    template = new Template(name);
    self.templates[name] = template;
    return true;
  };
  this.apply = function(name, id, model, onMarkup, onError) {
    var template, templateName;
    this.containerLookup[id] = self.templates[name];
    if (self.templates[name]) {
      template = self.templates[name];
      return template.apply(id, model, function(id, op, result) {
        self.instanceCache[id] = result;
        return onMarkup(id, op, result);
      });
    } else if (model.__template__ && id) {
      templateName = model.__template__;
      self.map(templateName);
      return self.apply(templateName, id, model, onMarkup, onError);
    } else {
      return onError(id, "render", "No template with " + name + " has been mapped");
    }
  };
  this.add = function(id, listId, model, onMarkup) {
    var template;
    if (self.containerLookup[id]) {
      template = self.containerLookup[id];
      return template.add(listId, model, onMarkup);
    }
  };
  this.update = function(id, controlId, model, onMarkup) {
    var template;
    if (self.containerLookup[id]) {
      template = self.containerLookup[id];
      return template.update(controlId, model, onMarkup);
    }
  };
  this.watchEvent = function(id, event, onEvent) {
    var template;
    if (self.containerLookup[id]) {
      template = self.containerLookup[id];
      return template.watchEvent(id, event, onEvent);
    }
  };
  this.ignoreEvent = function(id, event) {
    var template;
    if (self.containerLookup[id]) {
      template = self.containerLookup[id];
      return template.ignore(id, event);
    }
  };
  this.resolver = resolver;
  return self;
};
cartographer = new Cartographer();
cartographer;
var Template;
Template = function(name) {
  var buildCreateElement, crawl, create, createChildren, createFqn, elementTemplate, getActualValue, getNestedValue, handleModelTemplate, handleTemplate, makeTag, self, wireUp;
  self = this;
  createFqn = function(namespace, id, name, filterName) {
    var delimiter, newId, newNs, result;
    newNs = namespace || "";
    newId = id === void 0 ? "" : id;
    delimiter = newNs !== "" && newId !== "" ? "." : "";
    result = "" + newNs + delimiter + newId;
    return result;
  };
  handleTemplate = function(template, templateId, onTemplate) {
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
  elementTemplate = function(element) {
    var _ref;
    return element != null ? (_ref = element.attributes[configuration.templateIdentifier]) != null ? _ref.value : void 0 : void 0;
  };
  crawl = function(namespace, markup, templates, onDone) {
    var argList, child, childFunctionsExpected, children, continueProcessing, elementFqn, elementId, i, queue1, template, workQueue, _ref, _ref2;
    if ((markup != null ? markup.length : void 0) && (!markup.nodeType || markup.nodeType === 1)) {
      if (markup.length > 1) {
        /*total = markup.length
        index = 0
        list = new Array(total)
        onFactory = (factory) ->
          list[index++] = factory
          if index == total
            onDone (templateInstance, model, fqn, id, callback) ->
              ( fx templateInstance, model, fqn, id, callback ) for fx in list
        for elementIndex in [0..total-1]
          crawl namespace, markup[elementIndex], templates, onFactory*/
        for (i = 0, _ref = total - 1; 0 <= _ref ? i <= _ref : i >= _ref; 0 <= _ref ? i++ : i--) {
          argList = [namespace, markup[i], templates];
        }
        workQueue = queueByArgList(self, crawl, argList);
        return forkJoin(workQueue, function(callList) {
          var crawlQueue;
          crawlQueue = queueByFunctionList(self, callList, [templateInstance, model, fqn, id]);
          return forkJoin(crawlQueue, function(result) {
            return onDone(result);
          });
        });
      } else {
        return crawl(namespace, markup[0], templates, onDone);
      }
    } else {
      if ((markup != null ? markup.nodeType : void 0) && markup.nodeType !== 1) {
        return onDone(function() {
          return arguments[4](markup.nodeValue);
        });
      } else {
        template = markup ? template = elementTemplate(markup) : namespace;
        elementId = markup != null ? (_ref2 = markup.attributes[configuration.elementIdentifier]) != null ? _ref2.value : void 0 : void 0;
        elementFqn = namespace + (elementId ? "." + elementId : '');
        if (template) {
          if (!templates[template]) {
            templates[template] = template;
            return handleTemplate(template, elementFqn + "." + template, function(x) {
              return crawl(namespace, x, templates, function(f) {
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
            factory = buildCreateElement(markup, elementId, elementFqn, contentList, templates);
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
            queue1 = queueByArgList(self, crawl, argList);
            return forkJoin(queue1, continueProcessing);
          } else {
            return continueProcessing([]);
          }
        }
      }
    }
  };
  getActualValue = function(value, context) {
    if (_.isFunction(value)) {
      return value.call(context);
    } else {
      return value;
    }
  };
  getNestedValue = function(value, property) {
    if (value && value[property]) {
      return value[property];
    } else {
      return;
    }
  };
  handleModelTemplate = function(template, templateInstance, model, modelFqn, id, context, onElement) {
    if (self.templates[template]) {
      return self.templates[template](templateInstance, model, modelFqn, id, onElement);
    } else {
      return handleTemplate(template, template, function(x) {
        return crawl(context.elementFqn, x, templates, function(callback) {
          self.templates[template] = callback;
          return callback(templateInstance, model, modelFqn, id, onElement);
        });
      });
    }
  };
  createChildren = function(iterations, templateInstance, model, modelFqn, id, context, onElement) {
    var callbackCounter, childCounter, childFqn, childId, childModel, children, create, index, isCollection, iteration, iterationCounter, list, onChild, total, _i, _len, _ref, _results;
    isCollection = iterations > 0;
    if (!isCollection) {
      iterations = 1;
    }
    children = context.childrenToCreate;
    total = children.length * iterations;
    index = 0;
    list = new Array(total);
    onChild = function(childIndex, child) {
      list[index++] = child;
      if (index === total) {
        onElement(makeTag(context.tag, context.element, modelFqn, childIndex, context.elementId, list, model, templateInstance));
      }
      if (index > total) {
        return console.log("BUSTED, SON!");
      }
    };
    iterationCounter = 0;
    childCounter = 0;
    _results = [];
    for (iteration = 0, _ref = iterations - 1; 0 <= _ref ? iteration <= _ref : iteration >= _ref; 0 <= _ref ? iteration++ : iteration--) {
      for (_i = 0, _len = children.length; _i < _len; _i++) {
        create = children[_i];
        childId = id;
        childModel = model;
        childFqn = modelFqn;
        if (id === void 0 && isCollection) {
          childId = iteration;
          childModel = model[childId];
          childFqn = "" + modelFqn + "." + childId;
        }
        callbackCounter = 0;
        create(templateInstance, childModel, childFqn, childId, function(x) {
          callbackCounter++;
          return onChild(childId, x);
        });
        childCounter++;
      }
      _results.push(iterationCounter++);
    }
    return _results;
  };
  create = function(templateInstance, model, modelFqn, id, context, onElement) {
    var childElementCount, childElements, childModel, collection, collectionLength, elementId, idForFqn, isBound, isCollection, memberTemplate, memberValue, modelTemplate, newFqn, _ref;
    elementId = context.elementId;
    id = elementId || id;
    isBound = elementId !== void 0 && elementId !== "";
    idForFqn = isBound ? id : "";
    newFqn = createFqn(modelFqn, idForFqn, false, self.name);
    modelTemplate = getActualValue(model.__template__, model);
    memberTemplate = getActualValue((_ref = model[id]) != null ? _ref.__template__ : void 0, model);
    memberValue = getActualValue(getNestedValue(model[id], "__value__") || model[id], model);
    childModel = isBound ? model[id] : model;
    if (modelTemplate) {
      delete model.__template__;
      return handleModelTemplate(modelTemplate, templateInstance, model, modelFqn, id, context, function(x) {
        return console.log("Hay, I got a thingy back from " + modelTemplate);
      });
    } else if (memberTemplate) {
      delete model[id].__template__;
      return handleModelTemplate(modelTemplate, templateInstance, model, modelFqn, id, context, onElement);
    } else {
      childElements = context != null ? context.childrenToCreate.slice(0) : void 0;
      childElementCount = childElements.length;
      if (childElementCount > 0) {
        collection = getNestedValue(memberValue, "__items__") || memberValue;
        collectionLength = collection ? collection.length : 0;
        isCollection = collectionLength && !_.isString(collection) ? collection : void 0;
        self.factories[newFqn + "_add"] = function(itemIndex, itemModel, onItem) {
          return createChildren(0, templateInstance, itemModel, newFqn, itemIndex, context, onItem);
        };
        if (isCollection) {
          return createChildren(collectionLength, templateInstance, childModel, newFqn, void 0, context, onElement);
        } else {
          return createChildren(0, templateInstance, childModel, newFqn, id, context, onElement);
        }
      } else {
        return onElement(makeTag(context.tag, context.element, newFqn, id, isBound, memberValue, model, templateInstance));
      }
    }
  };
  buildCreateElement = function(element, elementId, elementFqn, childrenToCreate, templates) {
    var context, tag;
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
      return create(instance, model, fqn, id, context, onElement);
    };
  };
  makeTag = function(tag, originalElement, fqn, id, hasId, val, model, templateInstance) {
    var content, element, properties, _ref;
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
    if (hasId) {
      self.generated[templateInstance][fqn] = element;
    }
    return element;
  };
  wireUp = function(id) {
    var x, _i, _len, _ref, _results;
    _ref = self.watching;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      x = _ref[_i];
      _results.push(self.watchEvent(id, x.event, x.handler));
    }
    return _results;
  };
  this.apply = function(id, originalModel, onResult) {
    var model, result;
    model = $.extend(true, {}, originalModel);
    self.generated[id] = {};
    if (!self.ready) {
      return self.deferredApplyCalls.push(function() {
        return self.apply(id, model, onResult);
      });
    } else {
      return result = self.render(id, model, id, void 0, function(x) {
        var element;
        element = $(x)[0];
        $(element).attr(configuration.elementIdentifier, id);
        self.generated[id].top = element;
        wireUp(id);
        return onResult(id, element, "render");
      });
    }
  };
  this.watchEvent = function(id, eventName, onEvent) {
    $(self.generated[id].top).on(eventName, function(ev) {
      var elementId, _ref;
      elementId = (_ref = ev.target.attributes[configuration.elementIdentifier]) != null ? _ref.value : void 0;
      return onEvent(self.id, elementId, ev.target, ev.type);
    });
    self.watching.push({
      event: eventName,
      handler: onEvent
    });
    return self.watching = _.uniq(self.watching);
  };
  this.ignoreEvent = function(id, eventName) {
    if (self.generated[id].top) {
      self.generated[id].top.off(eventname);
    }
    return self.watching = _.reject(self.watching, function(x) {
      return x.event === eventName;
    });
  };
  this.update = function(fqn, model, onResult) {
    var childKey, lastIndex, parentKey, templateId;
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
  this.add = function(fqn, model, onResult) {
    var addName, childKey, count, lastIndex, parentKey, templateId;
    lastIndex = fqn.lastIndexOf(".");
    templateId = fqn.split('.')[0];
    parentKey = fqn.substring(0, lastIndex);
    childKey = fqn.substring(lastIndex + 1);
    addName = fqn + "_add";
    if (self.factories[addName]) {
      count = $(self.generated[templateId][fqn])[0].children.length;
      return self.factories[addName](count, model, (function(dom) {
        var newElement;
        newElement = dom;
        return onResult(fqn, newElement, "add");
      }));
    }
  };
  this.name = name;
  this.fqn = "";
  this.html = DOMBuilder.dom;
  this.templates = {};
  this.generated = {};
  this.changeSubscription = void 0;
  this.watching = [];
  this.deferredApplyCalls = [];
  this.render = function() {};
  this.ready = false;
  this.factories = {};
  crawl(self.name, void 0, {}, function(x) {
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