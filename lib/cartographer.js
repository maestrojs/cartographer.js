(function(context) {
/*
  cartographer
  author: Alex Robson <@A_Robson>
  License: MIT ( http://www.opensource.org/licenses/mit-license )
  Version: 0.1.0
*/
var SourceResolver, resolver;
SourceResolver = function() {
  var checkPage, checkSources, self, sources;
  self = this;
  sources = [];
  checkPage = function(name) {
    var element;
    element = $('#' + name);
    if (element) {
      return element[0];
    } else {
      return null;
    }
  };
  checkSources = function(name) {
    var result;
    result = _.find(sources, function(s) {
      return s.resolve(name);
    });
    return $(result)[0];
  };
  this.addSource = function(source) {
    return sources.push(source);
  };
  this.resolve = function(name) {
    var embedded;
    embedded = checkPage(name);
    return embedded || (embedded = checkSources(name));
  };
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
    }
  });
  this.templates = {};
  this.map = function(name, namespace) {
    var template;
    template = new Template(name, namespace);
    return this.templates[name] = template;
  };
  this.apply = function(template, proxy, render, error) {
    var result, templateInstance;
    template = template || (template = proxy.__template__);
    templateInstance = this.templates[template];
    if (templateInstance) {
      result = templateInstance.apply(proxy);
      if (render) {
        return render(result, templateInstance.fqn);
      } else {
        return $("#" + templateInstance.name).replaceWith(result);
      }
    } else if (error) {
      return error();
    }
  };
  return self;
};
context["cartographer"] = new Cartographer();
var Template;
Template = function(name, namespace) {
  var conditionalCopy, copyProperties, crawl, createFqn, handleModelEvent, makeTag, self, setupEvents, subscribe, wireup;
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
  crawl = function(context, root, namespace, element) {
    var call, child, createChildren, fqn, id, tag;
    id = element["id"];
    fqn = createFqn(namespace, id);
    tag = element.tagName.toUpperCase();
    context = context || root;
    if (element.children !== void 0 && element.children.length > 0) {
      createChildren = (function() {
        var _i, _len, _ref, _results;
        _ref = element.children;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          child = _ref[_i];
          _results.push(crawl(context, root, fqn, child));
        }
        return _results;
      })();
      call = function(html, model, parentFqn, idx) {
        var actualId, call, childElement, childFactory, collection, controls, indx, list, myFqn, val, _ref;
        actualId = id === "" ? idx : id;
        myFqn = createFqn(parentFqn, actualId);
        val = actualId === myFqn || actualId === void 0 ? model : model != null ? model[actualId] : void 0;
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
      return call;
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
      return call;
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
    var accessKey, addName, childKey, control, lastIndex, newElement, parentKey, target, value;
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
        if (control && self.template[accessKey] && m.info.value && m.info.value.isProxy) {
          value = m.info.value.getRoot ? m.info.value.getRoot() : m.info.value;
          return $(self[accessKey]).replaceWith(self.template[accessKey](self.html, value, parentKey));
        } else {
          return conditionalCopy(m.info, control, "value", modelTargets[target]);
        }
      } else if (m.event === "added") {
        addName = parentKey + "_add";
        newElement = self.template[addName](childKey, m.parent);
        return $(self[parentKey]).append(newElement);
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
  this.apply = function(model) {
    var fn;
    fn = crawl(this, model, namespace, this.element, this.apply);
    console.log("applying to " + namespace);
    subscribe(self, namespace + "_model");
    return fn(this.html, model);
  };
  this.name = name;
  this.namespace = namespace;
  this.fqn = "";
  this.element = resolver.resolve(name);
  this.eventChannel = postal.channel(namespace + "_events");
  this.html = DOMBuilder.dom;
  this.template = {};
  this.changeSubscription = void 0;
  subscribe(self, namespace + "_model");
  return this;
};
})(window);