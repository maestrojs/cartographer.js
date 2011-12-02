(function(context) {
/*
  cartographer
  author: Alex Robson <@A_Robson>
  License: MIT ( http://www.opensource.org/licenses/mit-license )
  Version: 0.1.0
*/
var SourceResolver, resolver;
SourceResolver = function() {
  var checkPage, self, sources;
  self = this;
  sources = [];
  checkPage = function(name) {
    var templateElement;
    templateElement = $('#' + name + '-template > :only-child');
    if (templateElement.length > 0) {
      return templateElement[0];
    } else {
      return null;
    }
  };
  this.addSource = function(source) {
    return sources.push(source);
  };
  this.resolve = function(name, onFound, notFound) {
    var finder, index, onPage;
    onPage = checkPage(name);
    if (onPage) {
      return onFound(onPage);
    } else {
      index = 0;
      finder = function() {};
      finder = function() {
        return sources[index].resolve(name, function(x) {
          return onFound($(x)[0], function() {
            index++;
            return finder();
          });
        });
      };
      return finder();
    }
  };
  if (infuser) {
    self.addSource({
      resolve: function(name, success, fail) {
        return infuser.get(name, function(x) {
          return success(x);
        }, fail);
      }
    });
  }
  return self;
};
resolver = new SourceResolver();
var Cartographer;
Cartographer = function() {
  var self;
  self = this;
  postal.channel("cartographer").subscribe(function(m) {
    if (m.map) {
      return self.map(m.name, m.namespace);
    } else if (m.apply) {
      return self.apply(m.template, m.proxy, m.render, m.error);
    } else if (m.addSource) {
      return self.resolver.addSource(m.provider);
    }
  });
  this.templates = {};
  this.map = function(name, namespace, target) {
    var template;
    template = new Template(name, namespace, target);
    return self.templates[name] = template;
  };
  this.apply = function(template, proxy, render, error) {
    var templateInstance;
    template = template || (template = proxy.__template__);
    templateInstance = self.templates[template];
    if (templateInstance) {
      return templateInstance.apply(proxy, function(result) {
        if (render) {
          return render(result, templateInstance.target, templateInstance.fqn);
        } else {
          return $('#' + templateInstance.target).fadeOut(200, function() {
            return $(this).html(result).fadeIn(300);
          });
        }
      });
    } else {
      self.map(template, proxy.getPath());
      return self.apply(template, proxy);
    }
  };
  this.resolver = resolver;
  return self;
};
context["cartographer"] = new Cartographer();
var Template;
Template = function(name, namespace, target) {
  var conditionalCopy, copyProperties, crawl, createFqn, handleModelEvent, makeTag, onElement, self, setupEvents, subscribe, wireup;
  self = this;
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
  conditionalCopy = function(source, target, sourceId, targetId) {
    var val, x, _i, _len, _results;
    if (source && target) {
      val = source[sourceId];
      if (val !== void 0) {
        if (_.isArray(targetId)) {
          _results = [];
          for (_i = 0, _len = targetId.length; _i < _len; _i++) {
            x = targetId[_i];
            _results.push((target[x] = val));
          }
          return _results;
        } else {
          return target[targetId] = val;
        }
      }
    }
  };
  copyProperties = function(source, target, list) {
    var x, _i, _len, _ref, _results;
    _ref = _.keys(list);
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      x = _ref[_i];
      _results.push(conditionalCopy(source, target, x, list[x]));
    }
    return _results;
  };
  crawl = function(context, root, namespace, element, onDone) {
    var checkResource, template, tmpId, _ref;
    tmpId = createFqn(namespace, element != null ? element.id : void 0);
    template = "";
    checkResource = true;
    if (tmpId !== namespace && ((_ref = root[tmpId]) != null ? _ref.__template__ : void 0)) {
      template = root[tmpId].__template__;
    } else {
      checkResource = false;
      template = namespace;
    }
    if (!element || checkResource) {
      return resolver.resolve(template, function(x) {
        element = x;
        element.nested = true;
        return onElement(context, root, namespace, element, onDone);
      });
    } else {
      return onElement(context, root, namespace, element, onDone);
    }
  };
  onElement = function(context, root, namespace, element, onDone) {
    var call, child, createChildren, fqn, id, onCall, tag, _i, _len, _ref, _results;
    id = element["id"];
    fqn = createFqn(namespace, id);
    tag = element.tagName.toUpperCase();
    context = context || root;
    if (element.children !== void 0 && element.children.length > 0) {
      createChildren = [];
      onCall = function(x) {
        var call;
        createChildren.push(x);
        if (createChildren.length === element.children.length) {
          call = function(html, model, parentFqn, idx) {
            var actualId, call, childElement, childFactory, collection, controls, indx, list, myFqn, val, _ref;
            actualId = id === "" ? idx : id;
            myFqn = createFqn(parentFqn, actualId);
            val = actualId === myFqn || actualId === void 0 ? model : model != null ? model[actualId] : void 0;
            if (val.value) {
              val = val.value;
            }
            collection = val.length ? val : val != null ? val.items : void 0;
            if (collection && collection.length) {
              list = [];
              childFactory = createChildren[0];
              context.template[myFqn + "_add"] = function(newIndex, newModel) {
                return childFactory(html, newModel, myFqn, newIndex);
              };
              for (indx = 0, _ref = collection.length - 1; 0 <= _ref ? indx <= _ref : indx >= _ref; 0 <= _ref ? indx++ : indx--) {
                list.push((function() {
                  var _i, _len, _results;
                  _results = [];
                  for (_i = 0, _len = createChildren.length; _i < _len; _i++) {
                    call = createChildren[_i];
                    _results.push(call(html, collection, myFqn, indx));
                  }
                  return _results;
                })());
              }
              childElement = makeTag(context, html, tag, element, myFqn, actualId, list, root, model);
              context[myFqn] = childElement;
              return childElement;
            } else {
              controls = (function() {
                var _i, _len, _results;
                _results = [];
                for (_i = 0, _len = createChildren.length; _i < _len; _i++) {
                  call = createChildren[_i];
                  _results.push(call(html, val, myFqn));
                }
                return _results;
              })();
              childElement = makeTag(context, html, tag, element, myFqn, actualId, controls, root, model);
              context[myFqn] = childElement;
              return childElement;
            }
          };
          context.template[fqn] = call;
          return onDone(call);
        }
      };
      _ref = element.children;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        child = _ref[_i];
        _results.push(crawl(context, root, fqn, child, function(x) {
          return onCall(x);
        }));
      }
      return _results;
    } else {
      call = function(html, model, parentFqn, idx) {
        var actualId, childElement, myFqn, val;
        actualId = id === "" ? idx : id;
        myFqn = createFqn(parentFqn, actualId);
        val = actualId === fqn ? model : model != null ? model[actualId] : void 0;
        childElement = makeTag(context, html, tag, element, myFqn, actualId, val, root, model);
        context[myFqn] = childElement;
        return childElement;
      };
      context.template[fqn] = call;
      return onDone(call);
    }
  };
  createFqn = function(namespace, id) {
    var result;
    if (id === void 0 || id === "") {
      result = namespace;
    } else if (namespace === void 0 || namespace === "") {
      result = id;
    } else if (namespace === id) {
      result = id;
    } else {
      result = "" + namespace + "." + id;
    }
    return result;
  };
  makeTag = function(context, html, tag, template, myFqn, id, val, root, model) {
    var content, element, properties, templateSource;
    properties = {};
    templateSource = template.textContent ? template.textContent : template.value;
    content = val ? val : templateSource;
    element = {};
    if (id || id === 0) {
      properties.id = id;
    }
    if (template) {
      copyProperties(template, properties, templateProperties);
    }
    if (tag === "INPUT") {
      if (!_.isObject(content)) {
        properties.value = content;
      }
      element = html[tag](properties);
    } else {
      element = html[tag](properties, content);
    }
    if (model != null ? model[id] : void 0) {
      if (val instanceof Array) {
        copyProperties(model[id], element, modelTargetsForCollections);
      } else {
        copyProperties(model[id], element, modelTargets);
      }
    }
    setupEvents(model != null ? model[id] : void 0, root, myFqn, element, context);
    return element;
  };
  setupEvents = function(model, root, fqn, element, context) {
    var x, _i, _len, _ref, _results;
    if (model) {
      _ref = _.keys(eventHandlers);
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        x = _ref[_i];
        _results.push(wireup(x, eventHandlers[x], model, root, fqn, element, context));
      }
      return _results;
    }
  };
  handleModelEvent = function(m) {
    var accessKey, addName, childKey, control, lastIndex, newElement, parentKey, value;
    if (m.event !== "read") {
      control = self[m.key];
      lastIndex = m.key.lastIndexOf(".");
      parentKey = m.key.substring(0, lastIndex);
      childKey = m.key.substring(lastIndex + 1);
      target = "value";
      accessKey = m.key;
      if (childKey === "value" || !control) {
        control = self[parentKey];
        target = childKey;
        accessKey = parentKey;
      }
      if (m.event === "wrote") {
        if (childKey === "__template__") {
          return cartographer.apply(m.info.value, m.parent);
        } else if (control && self.template[accessKey] && m.info.value && m.info.value.isProxy) {
          value = m.info.value.getRoot ? m.info.value.getRoot() : m.info.value;
          return $(self[accessKey]).replaceWith(self.template[accessKey](self.html, value, parentKey));
        } else {
          return conditionalCopy(m.info, control, "value", modelTargets[target]);
        }
      } else if (m.event === "added") {
        addName = parentKey + "_add";
        if (self.template[addName]) {
          newElement = self.template[addName](childKey, m.parent);
          return $(self[parentKey]).append(newElement);
        }
      }
    }
  };
  subscribe = function(context, channelName) {
    if (self.changeSubscription !== void 0) {
      self.changeSubscription.unsubscribe();
    }
    return self.changeSubscription = postal.channel(channelName).subscribe(handleModelEvent);
  };
  wireup = function(alias, event, model, root, fqn, element, context) {
    var handler, handlerProxy;
    handler = model[alias];
    if (handler) {
      handlerProxy = function(x) {
        return handler.apply(model, [
          root, {
            id: fqn,
            control: context[fqn],
            event: event,
            context: context,
            info: x
          }
        ]);
      };
      return element[event] = handlerProxy;
    } else {
      return element[event] = function(x) {
        if (event === "onchange") {
          x.stopPropagation();
        }
        return context.eventChannel.publish({
          id: fqn,
          model: model,
          control: context[fqn],
          event: event,
          context: context,
          info: x
        });
      };
    }
  };
  this.apply = function(model, onResult) {
    return crawl(self, model, namespace, self.element, function(x) {
      return onResult(x(self.html, model));
    });
  };
  this.name = name;
  this.namespace = namespace;
  this.fqn = "";
  this.element = void 0;
  this.eventChannel = postal.channel(namespace + "_events");
  this.html = DOMBuilder.dom;
  this.template = {};
  this.changeSubscription = void 0;
  this.target = target || (target = namespace);
  resolver.resolve(name, function(x) {
    return self.element = x;
  });
  subscribe(self, namespace + "_model");
  return self;
};
})(window);