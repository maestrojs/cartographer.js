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