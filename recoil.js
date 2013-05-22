/*! RecoilJS (Alpha) by Robert Messerle  |  https://github.com/robertmesserle/RecoilJS */
/*! This work is licensed under the Creative Commons Attribution 3.0 Unported License. To view a copy of this license, visit http://creativecommons.org/licenses/by/3.0/. */

(function($){
var Recoil;

Recoil = (function() {
  Recoil.app = null;

  Recoil.bindings = [];

  Recoil.views = {};

  Recoil.transitions = {
    intro: {},
    outro: {}
  };

  Recoil.events = 'blur focus focusin focusout load resize scroll unload click\ndblclick mousedown mouseup mousemove mouseover mouseout mouseenter\nmouseleave change select submit keydown keypress keyup error'.split(/\s+/g);

  Recoil.attributes = 'class id src href style'.split(/\s+/g);

  Recoil.init = function() {
    return (function(func, args, ctor) {
      ctor.prototype = func.prototype;
      var child = new ctor, result = func.apply(child, args);
      return Object(result) === result ? result : child;
    })(Recoil, arguments, function(){});
  };

  Recoil.createTransition = function(type, id, callback) {
    return Recoil.transitions[type][id] = callback;
  };

  function Recoil(id, controller) {
    var _this = this;

    this.id = id;
    this.controller = controller;
    if (Recoil.app) {
      throw "You may only have one app running at a time.";
    }
    $(function(element) {
      var $element;

      $element = $("[data-app='" + _this.id + "']");
      if (!$element.length) {
        throw "No element found for id '" + _this.id + "'.";
      }
      return Recoil.app = new Core($element, _this.controller);
    });
  }

  return Recoil;

})();

(function() {
  var elementList;

  elementList = typeof InstallTrigger !== 'undefined' ? [HTMLAnchorElement, HTMLAppletElement, HTMLAreaElement, HTMLAudioElement, HTMLBaseElement, HTMLBodyElement, HTMLBRElement, HTMLButtonElement, HTMLCanvasElement, HTMLDataListElement, HTMLDirectoryElement, HTMLDivElement, HTMLDListElement, HTMLElement, HTMLEmbedElement, HTMLFieldSetElement, HTMLFontElement, HTMLFormElement, HTMLFrameElement, HTMLFrameSetElement, HTMLHeadElement, HTMLHeadingElement, HTMLHtmlElement, HTMLHRElement, HTMLIFrameElement, HTMLImageElement, HTMLInputElement, HTMLLabelElement, HTMLLegendElement, HTMLLIElement, HTMLLinkElement, HTMLMapElement, HTMLMediaElement, HTMLMenuElement, HTMLMetaElement, HTMLMeterElement, HTMLModElement, HTMLObjectElement, HTMLOListElement, HTMLOptGroupElement, HTMLOptionElement, HTMLOutputElement, HTMLParagraphElement, HTMLParamElement, HTMLPreElement, HTMLProgressElement, HTMLQuoteElement, HTMLScriptElement, HTMLSelectElement, HTMLSourceElement, HTMLSpanElement, HTMLStyleElement, HTMLTableElement, HTMLTableCaptionElement, HTMLTableColElement, HTMLTableRowElement, HTMLTableSectionElement, HTMLTextAreaElement, HTMLTitleElement, HTMLUListElement, HTMLUnknownElement, HTMLVideoElement] : [Element];
  (function() {
    var originalMethod, type, _i, _len;

    for (_i = 0, _len = elementList.length; _i < _len; _i++) {
      type = elementList[_i];
      if (type.prototype.addEventListener) {
        originalMethod = type.prototype.addEventListener;
        if (!originalMethod) {
          return;
        }
        type.prototype.addEventListener = function(type, listener) {
          var args;

          args = Array.apply(null, arguments);
          args[1] = function() {
            var _ref;

            listener.apply(null, arguments);
            return (_ref = Recoil.app) != null ? _ref.checkForChanges() : void 0;
          };
          return originalMethod.apply(this, args);
        };
      }
      if (type.prototype.attachEvent) {
        originalMethod = type.prototype.attachEvent;
        if (!originalMethod) {
          return;
        }
        type.prototype.attachEvent = function(type, listener) {
          var args;

          args = Array.apply(null, arguments);
          args[1] = function() {
            var _ref;

            listener.apply(null, arguments);
            return (_ref = Recoil.app) != null ? _ref.checkForChanges() : void 0;
          };
          return originalMethod.apply(this, args);
        };
      }
    }
  })();
  return $(function() {
    $(document).ajaxComplete(function() {
      var _ref;

      return (_ref = Recoil.app) != null ? _ref.checkForChanges() : void 0;
    });
    return $(document).on('keydown click', function() {
      var _ref;

      return (_ref = Recoil.app) != null ? _ref.checkForChanges() : void 0;
    });
  });
})();

var Base;

Base = (function() {
  function Base($element) {
    this.$element = $element;
    this.logic = this.$element.data('logic');
    if (this.logic) {
      this.insertPlaceholder();
      this.unwrap();
    }
    if (this.update) {
      this.pushBinding();
    }
  }

  Base.prototype.pushBinding = function() {
    return Recoil.bindings.push(this);
  };

  Base.prototype.parseBinding = function(binding) {
    var jsBinding, _ref;

    if ((_ref = this.cachedBindings) == null) {
      this.cachedBindings = {};
    }
    jsBinding = this.cachedBindings[binding];
    if (jsBinding) {
      return jsBinding.call(this);
    }
    this.cachedBindings[binding] = this.generateFunction(binding);
    return this.cachedBindings[binding].call(this);
  };

  Base.prototype.parseString = function(str) {
    var jsString, _ref;

    if ((_ref = this.cachedStrings) == null) {
      this.cachedStrings = {};
    }
    jsString = this.cachedStrings[str];
    if (jsString) {
      return jsString.call(this);
    }
    str = str.replace(/\"/g, '\\"');
    str = '"' + str + '"';
    this.cachedStrings[str] = this.generateFunction(str);
    return this.cachedStrings[str].call(this);
  };

  Base.prototype.generateFunction = function(str) {
    var argHash, args, js, key, scopeArgs, value;

    js = CoffeeScript.compile("do -> " + str, {
      bare: true
    });
    argHash = {};
    args = [];
    scopeArgs = [];
    for (key in this.scope) {
      if (isNaN(key)) {
        argHash[key] = "this.scope[ '" + key + "' ]";
      }
    }
    for (key in this.extras) {
      if (isNaN(key)) {
        argHash[key] = "this.extras[ '" + key + "' ]";
      }
    }
    for (key in argHash) {
      value = argHash[key];
      args.push(key);
      scopeArgs.push(value);
    }
    args.push('$root, $parent, $scope, $extras');
    scopeArgs.push('this.root, this.parent, this.scope, this.extras');
    return eval("( function () {\n  return ( function ( " + (args.join(',')) + " ) {\n    return " + js + "\n  } ).call( {}, " + (scopeArgs.join(', ')) + " )\n} )");
  };

  Base.prototype.updateBinding = function(value, binding) {
    var part, parts, scope;

    if (binding == null) {
      binding = this.binding;
    }
    parts = binding.split('.');
    part = parts.pop();
    scope = this.parseBinding(parts.join('.')) || this.scope;
    if (typeof scope[part] === 'function') {
      return scope[part](value);
    } else {
      return scope[part] = value;
    }
  };

  Base.prototype.insertPlaceholder = function() {
    var attr, str;

    str = ((function() {
      var _i, _len, _ref, _results;

      _ref = this.$element.get(0).attributes;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        attr = _ref[_i];
        _results.push("" + attr.nodeName + "='" + attr.value + "'");
      }
      return _results;
    }).call(this)).join(' ');
    this.$placeholder = $("<!-- Start BoringJS Block: " + str + " -->").insertBefore(this.$element);
    return $("<!-- End BoringJS Block: " + str + " -->").insertAfter(this.$element);
  };

  Base.prototype.wrap = function() {
    if (!this.unwrapped) {
      return;
    }
    this.unwrapped = false;
    this.$contents.eq(0).before(this.$element);
    return this.$element.append(this.$contents);
  };

  Base.prototype.unwrap = function() {
    if (!this.unwrapped) {
      this.unwrapped = true;
    }
    this.$contents = this.$element.contents().insertAfter(this.$element);
    return this.$element.detach();
  };

  return Base;

})();

var AttributeText,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

AttributeText = (function(_super) {
  __extends(AttributeText, _super);

  function AttributeText(attribute, $element, scope, parent, root, extras) {
    this.attribute = attribute;
    this.$element = $element;
    this.scope = scope;
    this.parent = parent;
    this.root = root;
    this.extras = extras;
    this.template = this.attribute.nodeValue;
    if (this.attribute.nodeName.match(/^data/)) {
      return;
    }
    if (!this.template.match('{')) {
      return;
    }
    this.updateValue();
    this.pushBinding();
  }

  AttributeText.prototype.updateValue = function() {
    var value;

    value = this.parseString(this.template);
    if (this.value !== value) {
      this.value = value;
      return this.attribute.nodeValue = value;
    }
  };

  AttributeText.prototype.update = function() {
    return this.updateValue();
  };

  return AttributeText;

})(Base);

var AttributeBinding,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

AttributeBinding = (function(_super) {
  __extends(AttributeBinding, _super);

  function AttributeBinding(attribute, $element, scope, parent, root, extras) {
    this.attribute = attribute;
    this.$element = $element;
    this.scope = scope;
    this.parent = parent;
    this.root = root;
    this.extras = extras;
    this.binding = this.$element.data(this.attribute);
    this.setValue();
    this.pushBinding();
  }

  AttributeBinding.prototype.setValue = function() {
    var value;

    value = this.parseBinding(this.binding);
    if (this.value !== value) {
      this.value = value;
      return this.$element.attr(this.attribute, this.value);
    }
  };

  AttributeBinding.prototype.update = function() {
    return this.setValue();
  };

  return AttributeBinding;

})(Base);

var ComposeBinding,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

ComposeBinding = (function(_super) {
  __extends(ComposeBinding, _super);

  function ComposeBinding($element, scope, parent, root, extras, childParser) {
    var _ref;

    this.$element = $element;
    this.scope = scope;
    this.parent = parent;
    this.root = root;
    this.extras = extras != null ? extras : this.scope;
    this.childParser = childParser;
    this.renderView = __bind(this.renderView, this);
    this.binding = this.$element.data('compose');
    this.controller = this.parseBinding(this.binding);
    this.view = (_ref = this.controller) != null ? _ref.view : void 0;
    this.loadView();
    this.pushBinding();
  }

  ComposeBinding.prototype.loadView = function() {
    var url,
      _this = this;

    url = "/views/" + this.view + ".html";
    if (Recoil.views[url]) {
      return this.renderView(Recoil.views[url]);
    }
    return $.ajax({
      url: url,
      success: function(data) {
        data = Recoil.views[url] = data.replace(/<\$/g, '<div data-logic="true"').replace(/<\/\$>/g, '</div>');
        return _this.renderView(data);
      }
    });
  };

  ComposeBinding.prototype.renderView = function(data) {
    var intro, _base, _ref;

    if (data == null) {
      data = this.html;
    }
    this.html = data;
    this.$element.html(this.html);
    this.childParser(this.$element.children(), this.controller, this.scope, this.root);
    if (typeof (_base = this.controller).afterRender === "function") {
      _base.afterRender({
        $dom: this.$element,
        scope: this.scope,
        parent: this.parent,
        root: this.root
      });
    }
    intro = Recoil.transitions.intro[this.view] || ((_ref = this.controller) != null ? _ref.intro : void 0) || null;
    return typeof intro === "function" ? intro(this.$element) : void 0;
  };

  ComposeBinding.prototype.update = function() {
    var callback, controller, outro, _ref,
      _this = this;

    controller = this.parseBinding(this.binding);
    if (this.controller !== controller) {
      callback = function() {
        _this.controller = controller;
        _this.view = _this.controller.view;
        return _this.loadView();
      };
      outro = Recoil.transitions.outro[this.view] || ((_ref = this.controller) != null ? _ref.outro : void 0) || null;
      return (typeof outro === "function" ? outro(this.$element, callback) : void 0) || callback();
    }
  };

  return ComposeBinding;

})(Base);

var CSSBinding,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

CSSBinding = (function(_super) {
  __extends(CSSBinding, _super);

  function CSSBinding($element, scope, parent, root, extras) {
    this.$element = $element;
    this.scope = scope;
    this.parent = parent;
    this.root = root;
    this.extras = extras;
    this.binding = this.$element.data('css');
    this.css = this.parseBinding(this.binding);
    this.$element.css(this.css);
  }

  return CSSBinding;

})(Base);

var EachBinding,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

EachBinding = (function(_super) {
  __extends(EachBinding, _super);

  function EachBinding($element, scope, parent, root, extras, childParser) {
    this.$element = $element;
    this.scope = scope;
    this.parent = parent;
    this.root = root;
    this.extras = extras;
    this.childParser = childParser;
    this.checkForChanges = __bind(this.checkForChanges, this);
    this.binding = this.$element.data('each');
    this.getTemplate();
    this.parseItems();
    EachBinding.__super__.constructor.apply(this, arguments);
  }

  EachBinding.prototype.getTemplate = function() {
    return this.$template = this.$element.contents().remove();
  };

  EachBinding.prototype.getItems = function() {
    var items;

    items = this.parseBinding(this.binding);
    if (typeof items === 'function') {
      return items();
    } else {
      return items;
    }
  };

  EachBinding.prototype.parseItems = function(items) {
    var $item, extras, index, item, _i, _len, _results;

    if (items == null) {
      items = this.getItems();
    }
    _results = [];
    for (index = _i = 0, _len = collection.length; _i < _len; index = ++_i) {
      item = collection[index];
      $item = this.$template.clone().appendTo(this.$element);
      extras = $.extend({}, this.extras);
      if (typeof item === 'object') {
        extras[this.itemName].$index = index;
        extras[this.itemName].$total = collection.length;
      }
      _results.push(this.childParser($item, item, this.scope, this.root, extras));
    }
    return _results;
  };

  EachBinding.prototype.checkForChanges = function(collection) {
    var index, item, _i, _len, _ref;

    if (!this.collection) {
      return true;
    }
    if (collection.length !== this.collection.length) {
      return true;
    }
    _ref = collection || [];
    for (index = _i = 0, _len = _ref.length; _i < _len; index = ++_i) {
      item = _ref[index];
      if (item !== this.collection[index]) {
        return true;
      }
    }
    return false;
  };

  EachBinding.prototype.updateItems = function() {
    var collection;

    collection = this.getCollection();
    if (!this.checkForChanges(collection)) {
      return;
    }
    this.collection = collection.slice(0);
    if (this.logic) {
      this.wrap();
    }
    this.$element.empty();
    this.parseItems(collection);
    if (this.logic) {
      return this.unwrap();
    }
  };

  EachBinding.prototype.update = function() {
    return this.updateItems();
  };

  return EachBinding;

})(Base);

var EventBinding,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

EventBinding = (function(_super) {
  __extends(EventBinding, _super);

  function EventBinding(eventName, $element, scope, parent, root, extras) {
    var csString, func, str,
      _this = this;

    this.$element = $element;
    this.scope = scope;
    this.parent = parent;
    this.root = root;
    this.extras = extras;
    str = $element.data(eventName);
    csString = "-> " + str;
    func = this.parseBinding(csString);
    eventName = "" + eventName + ".boringjs";
    $element.off(eventName).on(eventName, function(event) {
      return func.call(_this, event);
    });
  }

  EventBinding.prototype.generateFunction = function(str) {
    var argHash, args, js, key, scopeArgs, value;

    js = CoffeeScript.compile("do -> " + str, {
      bare: true
    });
    argHash = {};
    args = [];
    scopeArgs = [];
    for (key in this.scope) {
      argHash[key] = "this.scope[ '" + key + "' ]";
    }
    for (key in this.extras) {
      argHash[key] = "this.extras[ '" + key + "' ]";
    }
    for (key in argHash) {
      value = argHash[key];
      args.push(key);
      scopeArgs.push(value);
    }
    args.push('$root, $parent, $data, $extras');
    scopeArgs.push('this.root, this.parent, this.scope, this.extras');
    return eval("( function ( event ) {\n  return ( function ( " + (args.join(',')) + " ) {\n    return " + js + "\n  } ).call( {}, " + (scopeArgs.join(', ')) + " )\n} )");
  };

  return EventBinding;

})(Base);

var ForBinding,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

ForBinding = (function(_super) {
  __extends(ForBinding, _super);

  function ForBinding($element, scope, parent, root, extras, childParser) {
    this.$element = $element;
    this.scope = scope;
    this.parent = parent;
    this.root = root;
    this.extras = extras;
    this.childParser = childParser;
    this.checkForChanges = __bind(this.checkForChanges, this);
    this.binding = this.$element.data('for');
    this.parts = this.binding.split(' in ');
    this.itemName = $.trim(this.parts[0]);
    this.collectionName = $.trim(this.parts[1]);
    this.getTemplate();
    this.parseItems();
    ForBinding.__super__.constructor.apply(this, arguments);
  }

  ForBinding.prototype.getTemplate = function() {
    return this.$template = this.$element.contents().remove();
  };

  ForBinding.prototype.getCollection = function() {
    var items;

    items = this.parseBinding(this.collectionName);
    if (typeof items === 'function') {
      return items();
    } else {
      return items;
    }
  };

  ForBinding.prototype.parseItems = function(collection) {
    var $item, extras, index, item, _i, _len, _results;

    if (collection == null) {
      collection = this.getCollection();
    }
    _results = [];
    for (index = _i = 0, _len = collection.length; _i < _len; index = ++_i) {
      item = collection[index];
      $item = this.$template.clone().appendTo(this.$element);
      extras = $.extend({}, this.extras);
      if (typeof item === 'object') {
        extras[this.itemName] = item;
        extras[this.itemName].$index = index;
        extras[this.itemName].$total = collection.length;
      } else {
        extras[this.itemName] = item;
      }
      _results.push(this.childParser($item, this.scope, this.parent, this.root, extras));
    }
    return _results;
  };

  ForBinding.prototype.checkForChanges = function(collection) {
    var index, item, _i, _len, _ref;

    if (!this.collection) {
      return true;
    }
    if (collection.length !== this.collection.length) {
      return true;
    }
    _ref = collection || [];
    for (index = _i = 0, _len = _ref.length; _i < _len; index = ++_i) {
      item = _ref[index];
      if (item !== this.collection[index]) {
        return true;
      }
    }
    return false;
  };

  ForBinding.prototype.updateItems = function() {
    var collection;

    collection = this.getCollection();
    if (!this.checkForChanges(collection)) {
      return;
    }
    this.collection = collection.slice(0);
    if (this.logic) {
      this.wrap();
    }
    this.$element.empty();
    this.parseItems(collection);
    if (this.logic) {
      return this.unwrap();
    }
  };

  ForBinding.prototype.update = function() {
    return this.updateItems();
  };

  return ForBinding;

})(Base);

var HTMLBinding,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

HTMLBinding = (function(_super) {
  __extends(HTMLBinding, _super);

  function HTMLBinding($element, scope, parent, root, extras) {
    this.$element = $element;
    this.scope = scope;
    this.parent = parent;
    this.root = root;
    this.extras = extras;
    this.binding = this.$element.data('html');
    this.setValue();
    this.pushBinding();
  }

  HTMLBinding.prototype.setValue = function() {
    var value;

    value = this.parseBinding(this.binding);
    if (this.value !== value) {
      this.value = value;
      return this.$element.html(this.value);
    }
  };

  HTMLBinding.prototype.update = function() {
    return this.setValue();
  };

  return HTMLBinding;

})(Base);

var IfBinding,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

IfBinding = (function(_super) {
  __extends(IfBinding, _super);

  function IfBinding($element, scope, parent, root, extras, callback) {
    this.$element = $element;
    this.scope = scope;
    this.parent = parent;
    this.root = root;
    this.extras = extras;
    this.callback = callback;
    this.binding = this.$element.data('if');
    this.insertPlaceholder();
    this.setValue();
    this.pushBinding();
  }

  IfBinding.prototype.setValue = function() {
    var value;

    value = !!this.parseBinding(this.binding);
    if (this.value !== value) {
      this.value = value;
      if (this.value) {
        this.$element.insertAfter(this.$placeholder);
        return this.callback(this.$element.contents(), this.scope, this.parent, this.root, this.extras);
      } else {
        return this.$element.detach();
      }
    }
  };

  IfBinding.prototype.update = function() {
    return this.setValue();
  };

  return IfBinding;

})(Base);

var TextNode,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

TextNode = (function(_super) {
  __extends(TextNode, _super);

  function TextNode($element, scope, parent, root, extras) {
    this.$element = $element;
    this.scope = scope;
    this.parent = parent;
    this.root = root;
    this.extras = extras;
    this.template = this.$element.text();
    if (!(this.template.indexOf('{') + 1)) {
      return;
    }
    this.element = this.$element.get(0);
    this.updateValue();
    this.pushBinding();
  }

  TextNode.prototype.updateValue = function() {
    var value;

    value = this.parseString(this.template);
    if (this.value !== value) {
      return this.element.nodeValue = this.value = value;
    }
  };

  TextNode.prototype.update = function() {
    return this.updateValue();
  };

  return TextNode;

})(Base);

var TextBinding,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

TextBinding = (function(_super) {
  __extends(TextBinding, _super);

  function TextBinding($element, scope, parent, root, extras) {
    this.$element = $element;
    this.scope = scope;
    this.parent = parent;
    this.root = root;
    this.extras = extras;
    this.binding = this.$element.data('text');
    this.setValue();
    this.pushBinding();
  }

  TextBinding.prototype.setValue = function() {
    var value;

    value = this.parseBinding(this.binding);
    if (this.value !== value) {
      this.value = value;
      return this.$element.text(this.value);
    }
  };

  TextBinding.prototype.update = function() {
    return this.setValue();
  };

  return TextBinding;

})(Base);

var UnlessBinding,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

UnlessBinding = (function(_super) {
  __extends(UnlessBinding, _super);

  function UnlessBinding($element, scope, parent, root, extras, callback) {
    this.$element = $element;
    this.scope = scope;
    this.parent = parent;
    this.root = root;
    this.extras = extras;
    this.callback = callback;
    this.binding = this.$element.data('if');
    this.insertPlaceholder();
    this.setValue();
    this.pushBinding();
  }

  UnlessBinding.prototype.setValue = function() {
    var value;

    value = !this.parseBinding(this.binding);
    if (this.value !== value) {
      this.value = value;
      if (this.value) {
        this.$element.insertAfter(this.$placeholder);
        return this.unwrap();
      } else {
        this.wrap();
        return this.$element.detach();
      }
    }
  };

  UnlessBinding.prototype.update = function() {
    return this.setValue();
  };

  return UnlessBinding;

})(Base);

var UpdateBinding,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

UpdateBinding = (function(_super) {
  __extends(UpdateBinding, _super);

  function UpdateBinding($element, scope, parent, root, extras) {
    var binding, csString;

    this.$element = $element;
    this.scope = scope;
    this.parent = parent;
    this.root = root;
    this.extras = extras;
    binding = this.$element.data('update');
    csString = "-> " + binding;
    this.func = this.parseBinding(csString);
    this.func();
    this.pushBinding();
  }

  UpdateBinding.prototype.update = function() {
    return this.func();
  };

  return UpdateBinding;

})(Base);

var ValueBinding,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

ValueBinding = (function(_super) {
  __extends(ValueBinding, _super);

  function ValueBinding($element, scope, parent, root, extras) {
    this.$element = $element;
    this.scope = scope;
    this.parent = parent;
    this.root = root;
    this.extras = extras;
    this.updateHandler = __bind(this.updateHandler, this);
    this.binding = this.$element.data('value');
    this.live = this.$element.data('live') != null;
    this.setValue();
    this.pushBinding();
    if (this.$element.is('select')) {
      this.updateHandler();
    }
    this.bindEvents();
  }

  ValueBinding.prototype.bindEvents = function() {
    var eventType;

    eventType = (function() {
      switch (this.$element.attr('type')) {
        case 'radio':
        case 'checkbox':
          return 'change';
        default:
          if (this.live) {
            return 'blur';
          }
      }
    }).call(this);
    if (eventType) {
      return this.$element.on(eventType, this.updateHandler);
    }
  };

  ValueBinding.prototype.getValue = function() {
    var value;

    if (this.$element.attr('type') === 'radio') {
      if (!this.$element.is(':checked')) {
        return;
      }
    }
    value = this.parseBinding(this.binding);
    return value = (typeof value === "function" ? value() : void 0) || value;
  };

  ValueBinding.prototype.setValue = function() {
    var value;

    value = this.getValue();
    if (this.value !== value) {
      this.value = value;
      switch (this.$element.attr('type')) {
        case 'checkbox':
          return this.$element.prop('checked', value);
        case 'radio':
          break;
        default:
          return this.$element.val(this.value);
      }
    }
  };

  ValueBinding.prototype.updateHandler = function() {
    if (this.$element.is(':radio') && !this.$element.is(':checked')) {
      return;
    }
    this.value = (function() {
      switch (this.$element.attr('type')) {
        case 'checkbox':
          return this.$element.prop('checked');
        default:
          return this.$element.val();
      }
    }).call(this);
    return this.updateBinding(this.value);
  };

  ValueBinding.prototype.update = function() {
    if (this.$element.is(':focus')) {
      if (this.live) {
        console.log('element is live');
        return this.updateHandler();
      }
    } else {
      return this.setValue();
    }
  };

  return ValueBinding;

})(Base);

var VisibleBinding,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

VisibleBinding = (function(_super) {
  __extends(VisibleBinding, _super);

  function VisibleBinding($element, scope, parent, root, extras) {
    this.$element = $element;
    this.scope = scope;
    this.parent = parent;
    this.root = root;
    this.extras = extras;
    this.binding = this.$element.data('visible');
    this.setValue();
    this.pushBinding();
  }

  VisibleBinding.prototype.setValue = function() {
    var value;

    value = !!this.parseBinding(this.binding);
    if (this.value !== value) {
      this.value = value;
      if (this.value) {
        return this.$element.show();
      } else {
        return this.$element.hide();
      }
    }
  };

  VisibleBinding.prototype.update = function() {
    return this.setValue();
  };

  return VisibleBinding;

})(Base);

var Parser;

Parser = (function() {
  function Parser($dom, scope, parent, root, extras) {
    var _this = this;

    this.scope = scope != null ? scope : {};
    this.parent = parent != null ? parent : {};
    this.root = root != null ? root : {};
    this.extras = extras != null ? extras : {};
    $dom.each(function(index, element) {
      var $element;

      $element = $(element);
      return _this.parseNode($element);
    });
  }

  Parser.prototype.parseNode = function($element) {
    var parseChildren,
      _this = this;

    parseChildren = true;
    this.attachEvents($element);
    this.parseAttributes($element);
    if ($element.get(0).nodeType === 3) {
      new TextNode($element, this.scope, this.parent, this.root, this.extras);
      return;
    }
    if ($element.data('css')) {
      new CSSBinding($element, this.scope, this.parent, this.root, this.extras);
    }
    if ($element.data('visible') != null) {
      new VisibleBinding($element, this.scope, this.parent, this.root, this.extras);
    }
    if ($element.data('if') != null) {
      parseChildren = false;
      new IfBinding($element, this.scope, this.parent, this.root, this.extras, function($element) {
        return new Parser($element, _this.scope, _this.parent, _this.root, _this.extras);
      });
    }
    if ($element.data('unless') != null) {
      parseChildren = false;
      new UnlessBinding($element, this.scope, this.parent, this.root, this.extras, function($element) {
        return new Parser($element, _this.scope, _this.parent, _this.root, _this.extras);
      });
    }
    if ($element.data('compose')) {
      parseChildren = false;
      new ComposeBinding($element, this.scope, this.parent, this.root, this.extras, function($element, scope, parent, root, extras) {
        return new Parser($element, scope, parent, root, extras);
      });
    }
    if ($element.data('for')) {
      parseChildren = false;
      new ForBinding($element, this.scope, this.parent, this.root, this.extras, function($element, scope, parent, root, extras) {
        return new Parser($element, scope, parent, root, extras);
      });
    }
    if ($element.data('each')) {
      parseChildren = false;
      new EachBinding($element, this.scope, this.parent, this.root, this.extras, function($element, scope, parent, root, extras) {
        return new Parser($element, scope, parent, root, extras);
      });
    }
    if ($element.data('text')) {
      parseChildren = false;
      new TextBinding($element, this.scope, this.parent, this.root, this.extras);
    }
    if ($element.data('html')) {
      new HTMLBinding($element, this.scope, this.parent, this.root, this.extras);
    }
    if ($element.data('value')) {
      parseChildren = false;
      new ValueBinding($element, this.scope, this.parent, this.root, this.extras);
    }
    if ($element.data('update')) {
      new UpdateBinding($element, this.scope, this.parent, this.root, this.extras);
    }
    if (!parseChildren) {
      return;
    }
    return $element.contents().each(function(index, element) {
      $element = $(element);
      return _this.parseNode($element);
    });
  };

  Parser.prototype.parseAttributes = function($element) {
    var attribute, str, _i, _j, _len, _len1, _ref, _ref1, _results;

    _ref = Recoil.attributes;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      attribute = _ref[_i];
      str = $element.data(attribute);
      if (!str) {
        continue;
      }
      new AttributeBinding(attribute, $element, this.scope, this.parent, this.root, this.extras);
    }
    _ref1 = $element.get(0).attributes || [];
    _results = [];
    for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
      attribute = _ref1[_j];
      _results.push(new AttributeText(attribute, $element, this.scope, this.parent, this.root, this.extras));
    }
    return _results;
  };

  Parser.prototype.attachEvents = function($element) {
    var event, str, _i, _len, _ref, _results;

    _ref = Recoil.events;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      event = _ref[_i];
      str = $element.data(event);
      if (!str) {
        continue;
      }
      _results.push(new EventBinding(event, $element, this.scope, this.parent, this.root, this.extras));
    }
    return _results;
  };

  Parser.prototype.parseString = function(str) {
    var part, parts, scope, value, _i, _len;

    parts = str.split('.');
    switch (parts[0]) {
      case '$root':
        scope = this.root;
        parts.shift();
        break;
      case '$parent':
        scope = this.parent;
        parts.shift();
        break;
      case '$data':
        scope = this.scope;
        parts.shift();
        break;
      default:
        scope = this.scope;
    }
    value = scope;
    for (_i = 0, _len = parts.length; _i < _len; _i++) {
      part = parts[_i];
      value = value[part];
    }
    return value;
  };

  return Parser;

})();

var Core,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

Core = (function() {
  function Core($element, controller) {
    this.$element = $element;
    this.controller = controller;
    this.afterRender = __bind(this.afterRender, this);
    if (this.controller.view) {
      this.$element.data('compose', 'controller');
    }
    this.afterRender();
  }

  Core.prototype.afterRender = function() {
    return new Parser(this.$element, this.controller, false, this.controller);
  };

  Core.prototype.checkForChanges = function() {
    var _this = this;

    return setTimeout(function() {
      var binding, _i, _len, _ref;

      _ref = Recoil.bindings;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        binding = _ref[_i];
        binding.update();
      }
      return _this.cleanBindings();
    });
  };

  Core.prototype.cleanBindings = function() {
    var binding, count, element, index, _i, _ref, _ref1, _ref2, _results;

    count = Recoil.bindings.length;
    _results = [];
    for (index = _i = _ref = count - 1; _ref <= 0 ? _i <= 0 : _i >= 0; index = _ref <= 0 ? ++_i : --_i) {
      binding = Recoil.bindings[index];
      element = ((_ref1 = binding.$placeholder) != null ? _ref1.get(0) : void 0) || ((_ref2 = binding.$element) != null ? _ref2.get(0) : void 0);
      if (!$.contains(document.body, element)) {
        _results.push(Recoil.bindings.splice(index, 1));
      } else {
        _results.push(void 0);
      }
    }
    return _results;
  };

  return Core;

})();
window.Recoil = Recoil;
})(jQuery);