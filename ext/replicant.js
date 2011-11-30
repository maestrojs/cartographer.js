(function(context) {
/*
  replicant
  author: Alex Robson <@A_Robson>
  License: MIT ( http://www.opensource.org/licenses/mit-license )
  Version: 0.1.0
*/
var buildFqn, onProxyOf;
buildFqn = function(path, name) {
  if (path === "") {
    return name;
  } else {
    return "" + path + "." + name;
  }
};
onProxyOf = function(value, ifArray, ifObject, otherwise) {
  var isArray, isFunction, isObject;
  isObject = _(value).isObject();
  isArray = _(value).isArray();
  isFunction = _(value).isFunction();
  if (!isFunction && (isObject || isArray)) {
    if (isArray) {
      return ifArray();
    } else {
      return ifObject();
    }
  } else {
    return otherwise();
  }
};
var Dependency, DependencyList, DependencyManager, dependencyManager;
Dependency = function(context, key, dependencies) {
  var self;
  self = this;
  _(dependencies).chain().each(function(x) {
    return self[x] = true;
  });
  this.add = function(dependency) {
    return self[dependency] = true;
  };
  this.isHit = function(fqn) {
    return self[fqn];
  };
  this.key = key;
  this.target = context;
  return self;
};
DependencyList = function(namespace) {
  var channelName, dependencies, fqn, self, subscription, watchingFor;
  dependencies = [];
  watchingFor = null;
  self = this;
  subscription = {};
  fqn = namespace;
  this.addDependency = function(context, key) {
    var dependency;
    dependency = _.detect(dependencies, function(x) {
      return x.key === fqn;
    });
    if (dependency) {
      return dependency.add(key);
    } else {
      dependency = new Dependency(context, fqn, [key]);
      return dependencies.push(dependency);
    }
  };
  this.checkDependencies = function(key) {
    var hits;
    hits = _.select(dependencies, function(x) {
      return x.isHit(key);
    });
    return _.each(hits, function(x) {
      return self[channelName].publish({
        event: "wrote",
        parent: x.target,
        key: fqn,
        info: {
          value: x.target[fqn],
          previous: null
        }
      });
    });
  };
  this.clear = function() {
    dependencies = [];
    subscription.unsubscribe();
    return subscription = {};
  };
  channelName = fqn.split('.')[0] + "_model";
  self[channelName] = postal.channel(channelName);
  subscription = self[channelName].subscribe(function(m) {
    if (m.event === "wrote" || m.event === "added" || m.event === "removed") {
      return self.checkDependencies(m.key);
    }
  });
  return self;
};
DependencyManager = function() {
  var lists, self, watchingFor;
  lists = {};
  watchingFor = null;
  self = this;
  this.watchFor = function(fqn) {
    watchingFor = fqn;
    return self.addNamespace(fqn);
  };
  this.endWatch = function() {
    return watchingFor = null;
  };
  this.recordAccess = function(proxy, key) {
    if (watchingFor) {
      return lists[watchingFor].addDependency(proxy, key);
    }
  };
  this.addNamespace = function(namespace) {
    if (lists[namespace]) {
      lists[namespace].clear();
    }
    console.log("Setting up " + namespace + " for dependency manager");
    return lists[namespace] = new DependencyList(namespace);
  };
  return self;
};
dependencyManager = new DependencyManager();
var ArrayWrapper, ObjectWrapper, Proxy;
ObjectWrapper = function(target, onEvent, namespace, addChild, removeChild) {
  var proxy;
  proxy = new Proxy(this, target, onEvent, namespace, addChild, removeChild);
  this.change_path = function(p) {
    return proxy.change_path(p);
  };
  this.addDependencyProperty = function(key, observable) {
    return proxy.addDependencyProperty(key, observable);
  };
  this.extractAs = function(alias) {
    proxy.unsubscribe();
    return replicant.create(proxy.original, null, alias);
  };
  this.getOriginal = function() {
    return proxy.original;
  };
  this.isProxy = true;
  this.subscribe = function(channelName) {
    return proxy.subscribe(channelName);
  };
  this.unsubscribe = function() {
    return proxy.unsubscribe();
  };
  this.getPath = function() {
    return proxy.getPath();
  };
  this.getRoot = function() {
    return proxy.getRoot();
  };
  this.getChannel = function() {
    return proxy.getChannel();
  };
  return this;
};
ArrayWrapper = function(target, onEvent, namespace, addChild, removeChild) {
  var proxy;
  proxy = new Proxy(this, target, onEvent, namespace, addChild, removeChild);
  this.change_path = function(p) {
    return proxy.change_path(p);
  };
  this.addDependencyProperty = function(key, observable) {
    return proxy.addDependencyProperty(key, observable);
  };
  this.extractAs = function(alias) {
    proxy.unsubscribe();
    return replicant.create(proxy.original, null, alias);
  };
  this.getOriginal = function() {
    return proxy.original;
  };
  this.getPath = function() {
    return proxy.getPath();
  };
  this.getChannel = function() {
    return proxy.getChannel();
  };
  this.getRoot = function() {
    return proxy.getRoot();
  };
  this.isProxy = true;
  this.pop = function() {
    return proxy.pop();
  };
  this.push = function(value) {
    return proxy.push(value);
  };
  this.shift = function() {
    return proxy.shift();
  };
  this.sort = function(compare) {
    return proxy.sort(compare);
  };
  this.subscribe = function(channelName) {
    return proxy.subscribe(channelName);
  };
  this.unsubscribe = function() {
    return proxy.unsubscribe();
  };
  this.unshift = function(value) {
    return proxy.unshift(value);
  };
  return this;
};
Proxy = function(wrapper, target, onEvent, namespace, addChild, removeChild) {
  var addChildPath, addToParent, ancestors, createMemberProxy, createProxyFor, fullPath, getLocalFqn, getLocalPath, notify, path, proxy, readHook, removeChildPath, removeFromParent, self, subject, unwindAncestralDependencies, walk;
  self = this;
  fullPath = namespace || (namespace = "");
  addToParent = addChild || function() {};
  getLocalPath = function() {
    var parts;
    parts = fullPath.split('.');
    if (parts.length > 0) {
      return parts[parts.length - 1];
    } else {
      return fullPath;
    }
  };
  path = getLocalPath();
  proxy = {};
  removeFromParent = removeChild || function() {};
  subject = target;
  ancestors = [];
  readHook = null;
  this.proxySubscription = {
    unsubscribe: function() {}
  };
  addChildPath = function(lqn, child, key) {
    var fqn, isRoot, propertyName;
    isRoot = ancestors.length === 0;
    fqn = buildFqn(path, lqn);
    propertyName = isRoot ? fqn : lqn;
    Object.defineProperty(wrapper, propertyName, {
      get: function() {
        return child[key];
      },
      set: function(value) {
        return child[key] = value;
      },
      configurable: true
    });
    if (child !== wrapper && !_.any(child.ancestors, function(x) {
      return x === wrapper;
    })) {
      child.ancestors.push(wrapper);
    }
    return addToParent(fqn, child, key);
  };
  this.subscribe = function(channelName) {
    self.unsubscribe();
    return self.proxySubscription = postal.channel(channelName).subscribe(function(m) {
      if (m.event === "onchange") {
        return wrapper[m.id] = m.control.value;
      } else if (wrapper[m.id] && wrapper[m.id][m.alias]) {
        return wrapper[m.id][m.alias].apply(m.model, [
          m.root, {
            id: m.id,
            control: m.control,
            event: m.event,
            context: m.context,
            info: m.x
          }
        ]);
      }
    });
  };
  this.unsubscribe = function() {
    if (self.proxySubscription) {
      return self.proxySubscription.unsubscribe();
    }
  };
  this.getHandler = function() {
    return onEvent;
  };
  createMemberProxy = function(key) {
    var fqn, isRoot;
    fqn = buildFqn(path, key);
    createProxyFor(true, buildFqn(fullPath, key), key);
    Object.defineProperty(wrapper, key, {
      get: function() {
        var fqn1, value;
        fqn1 = buildFqn(fullPath, key);
        value = createProxyFor(false, fqn1, key);
        notify(fqn1, "read", {
          value: value
        });
        dependencyManager.recordAccess(wrapper, fqn1);
        unwindAncestralDependencies();
        return value;
      },
      set: function(value) {
        var fqn1, newValue, old;
        fqn1 = buildFqn(fullPath, key);
        old = proxy[key];
        subject[key] = value;
        newValue = createProxyFor(true, fqn1, key);
        return notify(fqn1, "wrote", {
          value: value,
          previous: old
        });
      },
      configurable: true,
      enumerable: true
    });
    isRoot = ancestors.length === 0;
    if (isRoot && fullPath !== "") {
      return addChildPath(key, wrapper, key);
    } else {
      return addToParent(fqn, wrapper, key);
    }
  };
  createProxyFor = function(writing, fqn, key) {
    var value;
    value = subject[key];
    value = value.getOriginal ? value.getOriginal() : value;
    if (writing || proxy[key] === void 0) {
      proxy[key] = onProxyOf(value, function() {
        return new ArrayWrapper(value, onEvent, fqn, addChildPath, removeChildPath);
      }, function() {
        return new ObjectWrapper(value, onEvent, fqn, addChildPath, removeChildPath);
      }, function() {
        return value;
      });
    }
    return proxy[key];
  };
  getLocalFqn = function(fqn) {
    var base, parts, result;
    parts = fqn.split(".");
    base = subject.constructor.name;
    return result = (function() {
      switch (parts.length) {
        case 0:
          return base;
        default:
          return "" + base + "." + parts[parts.length - 1];
      }
    })();
  };
  notify = function(key, event, info) {
    return onEvent(wrapper, key, event, info);
  };
  removeChildPath = function(fqn) {
    delete wrapper[fqn];
    return removeFromParent(fqn);
  };
  unwindAncestralDependencies = function() {
    return _(ancestors).chain().select(function(x) {
      return x instanceof ArrayWrapper;
    }).each(function(x) {
      return dependencyManager.recordAccess(x, "" + x.getPath + ".length");
    });
  };
  walk = function(target) {
    var dependencyList;
    _(target).chain().keys().select(function(x) {
      return x !== "__dependencies__";
    }).each(function(key) {
      return createMemberProxy(key);
    });
    dependencyList = target.__dependencies__;
    if (dependencyList) {
      return _(dependencyList).chain().keys().each(function(key) {
        return self.addDependencyProperty(key, dependencyList[key]);
      });
    }
  };
  this.change_path = function(p) {
    return fullPath = p;
  };
  this.getChannel = function() {
    return proxySubscription;
  };
  this.getHandler = function() {
    return onEvent;
  };
  this.getPath = function() {
    return fullPath;
  };
  this.getRoot = function() {
    if (ancestors.length < 1) {
      return wrapper;
    } else {
      return ancestors[ancestors.length - 1];
    }
  };
  this.original = subject;
  this.add = function(key, keys) {
    var k, _i, _len;
    for (_i = 0, _len = keys.length; _i < _len; _i++) {
      k = keys[_i];
      createMemberProxy(k);
    }
    notify(buildFqn(fullPath, "length"), "wrote", {
      value: subject.length,
      previous: -1 + subject.length
    });
    return notify(buildFqn(fullPath, key), "added", {
      index: key,
      value: wrapper[key]
    });
  };
  this.push = function(value) {
    var key;
    key = -1 + subject.push(value);
    return this.add(key, [key]);
  };
  this.unshift = function(value) {
    var _i, _ref, _results;
    subject.unshift(value);
    return this.add(0, (function() {
      _results = [];
      for (var _i = 0, _ref = subject.length - 1; 0 <= _ref ? _i <= _ref : _i >= _ref; 0 <= _ref ? _i++ : _i--){ _results.push(_i); }
      return _results;
    }).apply(this));
  };
  this.remove = function(key, value, keys) {
    var k, _i, _len;
    for (_i = 0, _len = keys.length; _i < _len; _i++) {
      k = keys[_i];
      createMemberProxy(k);
    }
    notify(buildFqn(fullPath, "length"), "wrote", {
      value: subject.length,
      previous: 1 + subject.length
    });
    notify(buildFqn(fullPath, key), "removed", {
      index: subject.length,
      value: value
    });
    console.log(wrapper);
    return value;
  };
  this.pop = function() {
    var key, value;
    key = subject.length - 1;
    value = wrapper[key];
    subject.pop();
    removeChildPath(key);
    return this.remove(key, value, []);
  };
  this.shift = function() {
    var key, value, _i, _ref, _results;
    key = 0;
    value = wrapper[key];
    subject.shift();
    removeChildPath(key);
    return this.remove(key, value, (function() {
      _results = [];
      for (var _i = 0, _ref = subject.length - 1; 0 <= _ref ? _i <= _ref : _i >= _ref; 0 <= _ref ? _i++ : _i--){ _results.push(_i); }
      return _results;
    }).apply(this));
  };
  this.sort = function(sorter) {
    var old;
    old = subject;
    subject = subject.sort(sorter);
    walk(subject);
    return notify(fullPath, "wrote", {
      value: wrapper,
      previous: old
    });
  };
  Object.defineProperty(wrapper, "length", {
    get: function() {
      var fqn1;
      fqn1 = buildFqn(fullPath, "length");
      notify(fqn1, "read", {
        value: subject.length
      });
      dependencyManager.recordAccess(wrapper, fqn1);
      return subject.length;
    }
  });
  Object.defineProperty(wrapper, "ancestors", {
    get: function() {
      return ancestors;
    },
    set: function(x) {
      return ancestors = x;
    },
    enumerable: false,
    configurable: true
  });
  this.addDependencyProperty = function(key, observable) {
    var fqn1, isRoot;
    fqn1 = buildFqn(fullPath, key);
    Object.defineProperty(wrapper, key, {
      get: function() {
        var result;
        dependencyManager.watchFor(fqn1);
        result = observable(wrapper);
        dependencyManager.endWatch();
        return result;
      }
    });
    wrapper[key];
    isRoot = ancestors.length === 0;
    if (isRoot && fullPath !== "") {
      return addChildPath(key, wrapper, key);
    } else {
      return addToParent(buildFqn(path, key), wrapper, key);
    }
  };
  walk(target);
  addToParent(buildFqn(path, "length"), wrapper, "length");
  return this;
};
var Replicant;
Replicant = function() {
  var add, proxies, self;
  self = this;
  proxies = {};
  add = function(name, proxy) {
    proxies[name] = proxy;
    if (!self[name]) {
      return Object.defineProperty(self, name, {
        get: function() {
          return proxies[name];
        }
      });
    }
  };
  postal.channel("replicant").subscribe(function(m) {
    if (m.create) {
      return self.create(m.target, m.onevent, m.namespace);
    } else if (m.get) {
      return m.callback(proxies[m.name]);
    } else {
      return _(proxies).each(function(x) {
        return x.getChannel().publish(m);
      });
    }
  });
  this.create = function(target, onevent, namespace) {
    var channel, onEvent, proxy;
    if (proxies[namespace]) {
      proxies[namespace].unsubscribe();
    }
    dependencyManager.addNamespace(namespace);
    channel = postal.channel(namespace + "_model");
    onEvent = onevent || (onevent = function(parent, key, event, info) {
      return channel.publish({
        event: event,
        parent: parent,
        key: key,
        info: info
      });
    });
    namespace = namespace || (namespace = "");
    proxy = onProxyOf(target, function() {
      return new ArrayWrapper(target, onEvent, namespace);
    }, function() {
      return new ObjectWrapper(target, onEvent, namespace);
    }, function() {
      return target;
    });
    (function() {
      return target;
    });
    proxy.subscribe(namespace + "_events");
    add(namespace, proxy);
    return proxy;
  };
  return self;
};
context["replicant"] = new Replicant();
})(window);