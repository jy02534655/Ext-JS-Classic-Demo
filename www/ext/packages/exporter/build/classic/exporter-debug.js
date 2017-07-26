/*
 @source http://purl.eligrey.com/github/FileSaver.js/blob/master/FileSaver.js */
var $jscomp = $jscomp || {};
$jscomp.scope = {};
$jscomp.defineProperty = typeof Object.defineProperties == 'function' ? Object.defineProperty : function(target, property, descriptor) {
  descriptor = (descriptor);
  if (target == Array.prototype || target == Object.prototype) {
    return;
  }
  target[property] = descriptor.value;
};
$jscomp.getGlobal = function(maybeGlobal) {
  return typeof window != 'undefined' && window === maybeGlobal ? maybeGlobal : typeof global != 'undefined' && global != null ? global : maybeGlobal;
};
$jscomp.global = $jscomp.getGlobal(this);
$jscomp.polyfill = function(target, polyfill, fromLang, toLang) {
  if (!polyfill) {
    return;
  }
  var obj = $jscomp.global;
  var split = target.split('.');
  for (var i = 0; i < split.length - 1; i++) {
    var key = split[i];
    if (!(key in obj)) {
      obj[key] = {};
    }
    obj = obj[key];
  }
  var property = split[split.length - 1];
  var orig = obj[property];
  var impl = polyfill(orig);
  if (impl == orig || impl == null) {
    return;
  }
  $jscomp.defineProperty(obj, property, {configurable:true, writable:true, value:impl});
};
$jscomp.polyfill('Array.prototype.copyWithin', function(orig) {
  if (orig) {
    return orig;
  }
  var polyfill = function(target, start, opt_end) {
    var len = this.length;
    target = Number(target);
    start = Number(start);
    opt_end = Number(opt_end != null ? opt_end : len);
    if (target < start) {
      opt_end = Math.min(opt_end, len);
      while (start < opt_end) {
        if (start in this) {
          this[target++] = this[start++];
        } else {
          delete this[target++];
          start++;
        }
      }
    } else {
      opt_end = Math.min(opt_end, len + start - target);
      target += opt_end - start;
      while (opt_end > start) {
        if (--opt_end in this) {
          this[--target] = this[opt_end];
        } else {
          delete this[target];
        }
      }
    }
    return this;
  };
  return polyfill;
}, 'es6-impl', 'es3');
$jscomp.SYMBOL_PREFIX = 'jscomp_symbol_';
$jscomp.initSymbol = function() {
  $jscomp.initSymbol = function() {
  };
  if (!$jscomp.global['Symbol']) {
    $jscomp.global['Symbol'] = $jscomp.Symbol;
  }
};
$jscomp.symbolCounter_ = 0;
$jscomp.Symbol = function(opt_description) {
  return ($jscomp.SYMBOL_PREFIX + (opt_description || '') + $jscomp.symbolCounter_++);
};
$jscomp.initSymbolIterator = function() {
  $jscomp.initSymbol();
  var symbolIterator = $jscomp.global['Symbol'].iterator;
  if (!symbolIterator) {
    symbolIterator = $jscomp.global['Symbol'].iterator = $jscomp.global['Symbol']('iterator');
  }
  if (typeof Array.prototype[symbolIterator] != 'function') {
    $jscomp.defineProperty(Array.prototype, symbolIterator, {configurable:true, writable:true, value:function() {
      return $jscomp.arrayIterator(this);
    }});
  }
  $jscomp.initSymbolIterator = function() {
  };
};
$jscomp.arrayIterator = function(array) {
  var index = 0;
  return $jscomp.iteratorPrototype(function() {
    if (index < array.length) {
      return {done:false, value:array[index++]};
    } else {
      return {done:true};
    }
  });
};
$jscomp.iteratorPrototype = function(next) {
  $jscomp.initSymbolIterator();
  var iterator = {next:next};
  iterator[$jscomp.global['Symbol'].iterator] = function() {
    return this;
  };
  return (iterator);
};
$jscomp.iteratorFromArray = function(array, transform) {
  $jscomp.initSymbolIterator();
  if (array instanceof String) {
    array = array + '';
  }
  var i = 0;
  var iter = {next:function() {
    if (i < array.length) {
      var index = i++;
      return {value:transform(index, array[index]), done:false};
    }
    iter.next = function() {
      return {done:true, value:void 0};
    };
    return iter.next();
  }};
  iter[Symbol.iterator] = function() {
    return iter;
  };
  return iter;
};
$jscomp.polyfill('Array.prototype.entries', function(orig) {
  if (orig) {
    return orig;
  }
  var polyfill = function() {
    return $jscomp.iteratorFromArray(this, function(i, v) {
      return [i, v];
    });
  };
  return polyfill;
}, 'es6-impl', 'es3');
$jscomp.polyfill('Array.prototype.fill', function(orig) {
  if (orig) {
    return orig;
  }
  var polyfill = function(value, opt_start, opt_end) {
    var length = this.length || 0;
    if (opt_start < 0) {
      opt_start = Math.max(0, length + (opt_start));
    }
    if (opt_end == null || opt_end > length) {
      opt_end = length;
    }
    opt_end = Number(opt_end);
    if (opt_end < 0) {
      opt_end = Math.max(0, length + opt_end);
    }
    for (var i = Number(opt_start || 0); i < opt_end; i++) {
      this[i] = value;
    }
    return this;
  };
  return polyfill;
}, 'es6-impl', 'es3');
$jscomp.findInternal = function(array, callback, thisArg) {
  if (array instanceof String) {
    array = (String(array));
  }
  var len = array.length;
  for (var i = 0; i < len; i++) {
    var value = array[i];
    if (callback.call(thisArg, value, i, array)) {
      return {i:i, v:value};
    }
  }
  return {i:-1, v:void 0};
};
$jscomp.polyfill('Array.prototype.find', function(orig) {
  if (orig) {
    return orig;
  }
  var polyfill = function(callback, opt_thisArg) {
    return $jscomp.findInternal(this, callback, opt_thisArg).v;
  };
  return polyfill;
}, 'es6-impl', 'es3');
$jscomp.polyfill('Array.prototype.findIndex', function(orig) {
  if (orig) {
    return orig;
  }
  var polyfill = function(callback, opt_thisArg) {
    return $jscomp.findInternal(this, callback, opt_thisArg).i;
  };
  return polyfill;
}, 'es6-impl', 'es3');
$jscomp.polyfill('Array.from', function(orig) {
  if (orig) {
    return orig;
  }
  var polyfill = function(arrayLike, opt_mapFn, opt_thisArg) {
    $jscomp.initSymbolIterator();
    opt_mapFn = opt_mapFn != null ? opt_mapFn : function(x) {
      return x;
    };
    var result = [];
    var iteratorFunction = (arrayLike)[Symbol.iterator];
    if (typeof iteratorFunction == 'function') {
      arrayLike = iteratorFunction.call(arrayLike);
      var next;
      while (!(next = arrayLike.next()).done) {
        result.push(opt_mapFn.call((opt_thisArg), next.value));
      }
    } else {
      var len = arrayLike.length;
      for (var i = 0; i < len; i++) {
        result.push(opt_mapFn.call((opt_thisArg), arrayLike[i]));
      }
    }
    return result;
  };
  return polyfill;
}, 'es6-impl', 'es3');
$jscomp.polyfill('Object.is', function(orig) {
  if (orig) {
    return orig;
  }
  var polyfill = function(left, right) {
    if (left === right) {
      return left !== 0 || 1 / left === 1 / (right);
    } else {
      return left !== left && right !== right;
    }
  };
  return polyfill;
}, 'es6-impl', 'es3');
$jscomp.polyfill('Array.prototype.includes', function(orig) {
  if (orig) {
    return orig;
  }
  var includes = function(searchElement, opt_fromIndex) {
    var array = this;
    if (array instanceof String) {
      array = (String(array));
    }
    var len = array.length;
    for (var i = opt_fromIndex || 0; i < len; i++) {
      if (array[i] == searchElement || Object.is(array[i], searchElement)) {
        return true;
      }
    }
    return false;
  };
  return includes;
}, 'es7', 'es3');
$jscomp.polyfill('Array.prototype.keys', function(orig) {
  if (orig) {
    return orig;
  }
  var polyfill = function() {
    return $jscomp.iteratorFromArray(this, function(i) {
      return i;
    });
  };
  return polyfill;
}, 'es6-impl', 'es3');
$jscomp.polyfill('Array.of', function(orig) {
  if (orig) {
    return orig;
  }
  var polyfill = function(var_args) {
    return Array.from(arguments);
  };
  return polyfill;
}, 'es6-impl', 'es3');
$jscomp.polyfill('Array.prototype.values', function(orig) {
  if (orig) {
    return orig;
  }
  var polyfill = function() {
    return $jscomp.iteratorFromArray(this, function(k, v) {
      return v;
    });
  };
  return polyfill;
}, 'es6', 'es3');
$jscomp.makeIterator = function(iterable) {
  $jscomp.initSymbolIterator();
  var iteratorFunction = (iterable)[Symbol.iterator];
  return iteratorFunction ? iteratorFunction.call(iterable) : $jscomp.arrayIterator((iterable));
};
$jscomp.EXPOSE_ASYNC_EXECUTOR = true;
$jscomp.FORCE_POLYFILL_PROMISE = false;
$jscomp.polyfill('Promise', function(NativePromise) {
  if (NativePromise && !$jscomp.FORCE_POLYFILL_PROMISE) {
    return NativePromise;
  }
  function AsyncExecutor() {
    this.batch_ = null;
  }
  AsyncExecutor.prototype.asyncExecute = function(f) {
    if (this.batch_ == null) {
      this.batch_ = [];
      this.asyncExecuteBatch_();
    }
    this.batch_.push(f);
    return this;
  };
  AsyncExecutor.prototype.asyncExecuteBatch_ = function() {
    var self = this;
    this.asyncExecuteFunction(function() {
      self.executeBatch_();
    });
  };
  var nativeSetTimeout = $jscomp.global['setTimeout'];
  AsyncExecutor.prototype.asyncExecuteFunction = function(f) {
    nativeSetTimeout(f, 0);
  };
  AsyncExecutor.prototype.executeBatch_ = function() {
    while (this.batch_ && this.batch_.length) {
      var executingBatch = this.batch_;
      this.batch_ = [];
      for (var i = 0; i < executingBatch.length; ++i) {
        var f = executingBatch[i];
        delete executingBatch[i];
        try {
          f();
        } catch (error) {
          this.asyncThrow_(error);
        }
      }
    }
    this.batch_ = null;
  };
  AsyncExecutor.prototype.asyncThrow_ = function(exception) {
    this.asyncExecuteFunction(function() {
      throw exception;
    });
  };
  var PromiseState = {PENDING:0, FULFILLED:1, REJECTED:2};
  var PolyfillPromise = function(executor) {
    this.state_ = PromiseState.PENDING;
    this.result_ = undefined;
    this.onSettledCallbacks_ = [];
    var resolveAndReject = this.createResolveAndReject_();
    try {
      executor(resolveAndReject.resolve, resolveAndReject.reject);
    } catch (e) {
      resolveAndReject.reject(e);
    }
  };
  PolyfillPromise.prototype.createResolveAndReject_ = function() {
    var thisPromise = this;
    var alreadyCalled = false;
    function firstCallWins(method) {
      return function(x) {
        if (!alreadyCalled) {
          alreadyCalled = true;
          method.call(thisPromise, x);
        }
      };
    }
    return {resolve:firstCallWins(this.resolveTo_), reject:firstCallWins(this.reject_)};
  };
  PolyfillPromise.prototype.resolveTo_ = function(value) {
    if (value === this) {
      this.reject_(new TypeError('A Promise cannot resolve to itself'));
    } else {
      if (value instanceof PolyfillPromise) {
        this.settleSameAsPromise_((value));
      } else {
        if (isObject(value)) {
          this.resolveToNonPromiseObj_((value));
        } else {
          this.fulfill_(value);
        }
      }
    }
  };
  PolyfillPromise.prototype.resolveToNonPromiseObj_ = function(obj) {
    var thenMethod = undefined;
    try {
      thenMethod = obj.then;
    } catch (error) {
      this.reject_(error);
      return;
    }
    if (typeof thenMethod == 'function') {
      this.settleSameAsThenable_(thenMethod, (obj));
    } else {
      this.fulfill_(obj);
    }
  };
  function isObject(value) {
    switch(typeof value) {
      case 'object':
        return value != null;
      case 'function':
        return true;
      default:
        return false;
    }
  }
  PolyfillPromise.prototype.reject_ = function(reason) {
    this.settle_(PromiseState.REJECTED, reason);
  };
  PolyfillPromise.prototype.fulfill_ = function(value) {
    this.settle_(PromiseState.FULFILLED, value);
  };
  PolyfillPromise.prototype.settle_ = function(settledState, valueOrReason) {
    if (this.state_ != PromiseState.PENDING) {
      throw new Error('Cannot settle(' + settledState + ', ' + valueOrReason | '): Promise already settled in state' + this.state_);
    }
    this.state_ = settledState;
    this.result_ = valueOrReason;
    this.executeOnSettledCallbacks_();
  };
  PolyfillPromise.prototype.executeOnSettledCallbacks_ = function() {
    if (this.onSettledCallbacks_ != null) {
      var callbacks = this.onSettledCallbacks_;
      for (var i = 0; i < callbacks.length; ++i) {
        (callbacks[i]).call();
        callbacks[i] = null;
      }
      this.onSettledCallbacks_ = null;
    }
  };
  var asyncExecutor = new AsyncExecutor;
  PolyfillPromise.prototype.settleSameAsPromise_ = function(promise) {
    var methods = this.createResolveAndReject_();
    promise.callWhenSettled_(methods.resolve, methods.reject);
  };
  PolyfillPromise.prototype.settleSameAsThenable_ = function(thenMethod, thenable) {
    var methods = this.createResolveAndReject_();
    try {
      thenMethod.call(thenable, methods.resolve, methods.reject);
    } catch (error) {
      methods.reject(error);
    }
  };
  PolyfillPromise.prototype.then = function(onFulfilled, onRejected) {
    var resolveChild;
    var rejectChild;
    var childPromise = new PolyfillPromise(function(resolve, reject) {
      resolveChild = resolve;
      rejectChild = reject;
    });
    function createCallback(paramF, defaultF) {
      if (typeof paramF == 'function') {
        return function(x) {
          try {
            resolveChild(paramF(x));
          } catch (error) {
            rejectChild(error);
          }
        };
      } else {
        return defaultF;
      }
    }
    this.callWhenSettled_(createCallback(onFulfilled, resolveChild), createCallback(onRejected, rejectChild));
    return childPromise;
  };
  PolyfillPromise.prototype['catch'] = function(onRejected) {
    return this.then(undefined, onRejected);
  };
  PolyfillPromise.prototype.callWhenSettled_ = function(onFulfilled, onRejected) {
    var thisPromise = this;
    function callback() {
      switch(thisPromise.state_) {
        case PromiseState.FULFILLED:
          onFulfilled(thisPromise.result_);
          break;
        case PromiseState.REJECTED:
          onRejected(thisPromise.result_);
          break;
        default:
          throw new Error('Unexpected state: ' + thisPromise.state_);
      }
    }
    if (this.onSettledCallbacks_ == null) {
      asyncExecutor.asyncExecute(callback);
    } else {
      this.onSettledCallbacks_.push(function() {
        asyncExecutor.asyncExecute(callback);
      });
    }
  };
  PolyfillPromise.resolve = function(opt_value) {
    if (opt_value instanceof PolyfillPromise) {
      return opt_value;
    } else {
      return new PolyfillPromise(function(resolve, reject) {
        resolve(opt_value);
      });
    }
  };
  PolyfillPromise.reject = function(opt_reason) {
    return new PolyfillPromise(function(resolve, reject) {
      reject(opt_reason);
    });
  };
  PolyfillPromise.race = function(thenablesOrValues) {
    return new PolyfillPromise(function(resolve, reject) {
      var iterator = $jscomp.makeIterator(thenablesOrValues);
      for (var iterRec = iterator.next(); !iterRec.done; iterRec = iterator.next()) {
        PolyfillPromise.resolve(iterRec.value).callWhenSettled_(resolve, reject);
      }
    });
  };
  PolyfillPromise.all = function(thenablesOrValues) {
    var iterator = $jscomp.makeIterator(thenablesOrValues);
    var iterRec = iterator.next();
    if (iterRec.done) {
      return PolyfillPromise.resolve([]);
    } else {
      return new PolyfillPromise(function(resolveAll, rejectAll) {
        var resultsArray = [];
        var unresolvedCount = 0;
        function onFulfilled(i) {
          return function(ithResult) {
            resultsArray[i] = ithResult;
            unresolvedCount--;
            if (unresolvedCount == 0) {
              resolveAll(resultsArray);
            }
          };
        }
        do {
          resultsArray.push(undefined);
          unresolvedCount++;
          PolyfillPromise.resolve(iterRec.value).callWhenSettled_(onFulfilled(resultsArray.length - 1), rejectAll);
          iterRec = iterator.next();
        } while (!iterRec.done);
      });
    }
  };
  if ($jscomp.EXPOSE_ASYNC_EXECUTOR) {
    PolyfillPromise['$jscomp$new$AsyncExecutor'] = function() {
      return new AsyncExecutor;
    };
  }
  return PolyfillPromise;
}, 'es6-impl', 'es3');
$jscomp.executeAsyncGenerator = function(generator) {
  function passValueToGenerator(value) {
    return generator.next(value);
  }
  function passErrorToGenerator(error) {
    return generator['throw'](error);
  }
  return new Promise(function(resolve, reject) {
    function handleGeneratorRecord(genRec) {
      if (genRec.done) {
        resolve(genRec.value);
      } else {
        Promise.resolve(genRec.value).then(passValueToGenerator, passErrorToGenerator).then(handleGeneratorRecord, reject);
      }
    }
    handleGeneratorRecord(generator.next());
  });
};
$jscomp.owns = function(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
};
$jscomp.polyfill('WeakMap', function(NativeWeakMap) {
  function isConformant() {
    if (!NativeWeakMap || !Object.seal) {
      return false;
    }
    try {
      var x = Object.seal({});
      var y = Object.seal({});
      var map = new (NativeWeakMap)([[x, 2], [y, 3]]);
      if (map.get(x) != 2 || map.get(y) != 3) {
        return false;
      }
      map['delete'](x);
      map.set(y, 4);
      return !map.has(x) && map.get(y) == 4;
    } catch (err) {
      return false;
    }
  }
  if (isConformant()) {
    return NativeWeakMap;
  }
  var prop = '$jscomp_hidden_' + Math.random().toString().substring(2);
  function insert(target) {
    if (!$jscomp.owns(target, prop)) {
      var obj = {};
      $jscomp.defineProperty(target, prop, {value:obj});
    }
  }
  function patch(name) {
    var prev = Object[name];
    if (prev) {
      Object[name] = function(target) {
        insert(target);
        return prev(target);
      };
    }
  }
  patch('freeze');
  patch('preventExtensions');
  patch('seal');
  var index = 0;
  var PolyfillWeakMap = function(opt_iterable) {
    this.id_ = (index += Math.random() + 1).toString();
    if (opt_iterable) {
      $jscomp.initSymbol();
      $jscomp.initSymbolIterator();
      var iter = $jscomp.makeIterator(opt_iterable);
      var entry;
      while (!(entry = iter.next()).done) {
        var item = entry.value;
        this.set((item[0]), (item[1]));
      }
    }
  };
  PolyfillWeakMap.prototype.set = function(key, value) {
    insert(key);
    if (!$jscomp.owns(key, prop)) {
      throw new Error('WeakMap key fail: ' + key);
    }
    key[prop][this.id_] = value;
    return this;
  };
  PolyfillWeakMap.prototype.get = function(key) {
    return $jscomp.owns(key, prop) ? key[prop][this.id_] : undefined;
  };
  PolyfillWeakMap.prototype.has = function(key) {
    return $jscomp.owns(key, prop) && $jscomp.owns(key[prop], this.id_);
  };
  PolyfillWeakMap.prototype['delete'] = function(key) {
    if (!$jscomp.owns(key, prop) || !$jscomp.owns(key[prop], this.id_)) {
      return false;
    }
    return delete key[prop][this.id_];
  };
  return PolyfillWeakMap;
}, 'es6-impl', 'es3');
$jscomp.MapEntry = function() {
  this.previous;
  this.next;
  this.head;
  this.key;
  this.value;
};
$jscomp.ASSUME_NO_NATIVE_MAP = false;
$jscomp.polyfill('Map', function(NativeMap) {
  var isConformant = !$jscomp.ASSUME_NO_NATIVE_MAP && function() {
    if (!NativeMap || !NativeMap.prototype.entries || typeof Object.seal != 'function') {
      return false;
    }
    try {
      NativeMap = (NativeMap);
      var key = Object.seal({x:4});
      var map = new NativeMap($jscomp.makeIterator([[key, 's']]));
      if (map.get(key) != 's' || map.size != 1 || map.get({x:4}) || map.set({x:4}, 't') != map || map.size != 2) {
        return false;
      }
      var iter = map.entries();
      var item = iter.next();
      if (item.done || item.value[0] != key || item.value[1] != 's') {
        return false;
      }
      item = iter.next();
      if (item.done || item.value[0].x != 4 || item.value[1] != 't' || !iter.next().done) {
        return false;
      }
      return true;
    } catch (err) {
      return false;
    }
  }();
  if (isConformant) {
    return NativeMap;
  }
  $jscomp.initSymbol();
  $jscomp.initSymbolIterator();
  var idMap = new WeakMap;
  var PolyfillMap = function(opt_iterable) {
    this.data_ = {};
    this.head_ = createHead();
    this.size = 0;
    if (opt_iterable) {
      var iter = $jscomp.makeIterator(opt_iterable);
      var entry;
      while (!(entry = iter.next()).done) {
        var item = (entry).value;
        this.set((item[0]), (item[1]));
      }
    }
  };
  PolyfillMap.prototype.set = function(key, value) {
    var r = maybeGetEntry(this, key);
    if (!r.list) {
      r.list = this.data_[r.id] = [];
    }
    if (!r.entry) {
      r.entry = {next:this.head_, previous:this.head_.previous, head:this.head_, key:key, value:value};
      r.list.push(r.entry);
      this.head_.previous.next = r.entry;
      this.head_.previous = r.entry;
      this.size++;
    } else {
      r.entry.value = value;
    }
    return this;
  };
  PolyfillMap.prototype['delete'] = function(key) {
    var r = maybeGetEntry(this, key);
    if (r.entry && r.list) {
      r.list.splice(r.index, 1);
      if (!r.list.length) {
        delete this.data_[r.id];
      }
      r.entry.previous.next = r.entry.next;
      r.entry.next.previous = r.entry.previous;
      r.entry.head = null;
      this.size--;
      return true;
    }
    return false;
  };
  PolyfillMap.prototype.clear = function() {
    this.data_ = {};
    this.head_ = this.head_.previous = createHead();
    this.size = 0;
  };
  PolyfillMap.prototype.has = function(key) {
    return !!maybeGetEntry(this, key).entry;
  };
  PolyfillMap.prototype.get = function(key) {
    var entry = maybeGetEntry(this, key).entry;
    return (entry && (entry.value));
  };
  PolyfillMap.prototype.entries = function() {
    return makeIterator(this, function(entry) {
      return [entry.key, entry.value];
    });
  };
  PolyfillMap.prototype.keys = function() {
    return makeIterator(this, function(entry) {
      return entry.key;
    });
  };
  PolyfillMap.prototype.values = function() {
    return makeIterator(this, function(entry) {
      return entry.value;
    });
  };
  PolyfillMap.prototype.forEach = function(callback, opt_thisArg) {
    var iter = this.entries();
    var item;
    while (!(item = iter.next()).done) {
      var entry = item.value;
      callback.call((opt_thisArg), (entry[1]), (entry[0]), this);
    }
  };
  (PolyfillMap.prototype)[Symbol.iterator] = PolyfillMap.prototype.entries;
  var maybeGetEntry = function(map, key) {
    var id = getId(key);
    var list = map.data_[id];
    if (list && $jscomp.owns(map.data_, id)) {
      for (var index = 0; index < list.length; index++) {
        var entry = list[index];
        if (key !== key && entry.key !== entry.key || key === entry.key) {
          return {id:id, list:list, index:index, entry:entry};
        }
      }
    }
    return {id:id, list:list, index:-1, entry:undefined};
  };
  var makeIterator = function(map, func) {
    var entry = map.head_;
    return $jscomp.iteratorPrototype(function() {
      if (entry) {
        while (entry.head != map.head_) {
          entry = entry.previous;
        }
        while (entry.next != entry.head) {
          entry = entry.next;
          return {done:false, value:func(entry)};
        }
        entry = null;
      }
      return {done:true, value:void 0};
    });
  };
  var createHead = function() {
    var head = {};
    head.previous = head.next = head.head = head;
    return head;
  };
  var mapIndex = 0;
  var getId = function(obj) {
    var type = obj && typeof obj;
    if (type == 'object' || type == 'function') {
      obj = (obj);
      if (!idMap.has(obj)) {
        var id = '' + ++mapIndex;
        idMap.set(obj, id);
        return id;
      }
      return idMap.get(obj);
    }
    return 'p_' + obj;
  };
  return PolyfillMap;
}, 'es6-impl', 'es3');
$jscomp.polyfill('Math.acosh', function(orig) {
  if (orig) {
    return orig;
  }
  var polyfill = function(x) {
    x = Number(x);
    return Math.log(x + Math.sqrt(x * x - 1));
  };
  return polyfill;
}, 'es6-impl', 'es3');
$jscomp.polyfill('Math.asinh', function(orig) {
  if (orig) {
    return orig;
  }
  var polyfill = function(x) {
    x = Number(x);
    if (x === 0) {
      return x;
    }
    var y = Math.log(Math.abs(x) + Math.sqrt(x * x + 1));
    return x < 0 ? -y : y;
  };
  return polyfill;
}, 'es6-impl', 'es3');
$jscomp.polyfill('Math.log1p', function(orig) {
  if (orig) {
    return orig;
  }
  var polyfill = function(x) {
    x = Number(x);
    if (x < 0.25 && x > -0.25) {
      var y = x;
      var d = 1;
      var z = x;
      var zPrev = 0;
      var s = 1;
      while (zPrev != z) {
        y *= x;
        s *= -1;
        z = (zPrev = z) + s * y / ++d;
      }
      return z;
    }
    return Math.log(1 + x);
  };
  return polyfill;
}, 'es6-impl', 'es3');
$jscomp.polyfill('Math.atanh', function(orig) {
  if (orig) {
    return orig;
  }
  var log1p = Math.log1p;
  var polyfill = function(x) {
    x = Number(x);
    return (log1p(x) - log1p(-x)) / 2;
  };
  return polyfill;
}, 'es6-impl', 'es3');
$jscomp.polyfill('Math.cbrt', function(orig) {
  if (orig) {
    return orig;
  }
  var polyfill = function(x) {
    if (x === 0) {
      return x;
    }
    x = Number(x);
    var y = Math.pow(Math.abs(x), 1 / 3);
    return x < 0 ? -y : y;
  };
  return polyfill;
}, 'es6-impl', 'es3');
$jscomp.polyfill('Math.clz32', function(orig) {
  if (orig) {
    return orig;
  }
  var polyfill = function(x) {
    x = Number(x) >>> 0;
    if (x === 0) {
      return 32;
    }
    var result = 0;
    if ((x & 4294901760) === 0) {
      x <<= 16;
      result += 16;
    }
    if ((x & 4278190080) === 0) {
      x <<= 8;
      result += 8;
    }
    if ((x & 4026531840) === 0) {
      x <<= 4;
      result += 4;
    }
    if ((x & 3221225472) === 0) {
      x <<= 2;
      result += 2;
    }
    if ((x & 2147483648) === 0) {
      result++;
    }
    return result;
  };
  return polyfill;
}, 'es6-impl', 'es3');
$jscomp.polyfill('Math.cosh', function(orig) {
  if (orig) {
    return orig;
  }
  var exp = Math.exp;
  var polyfill = function(x) {
    x = Number(x);
    return (exp(x) + exp(-x)) / 2;
  };
  return polyfill;
}, 'es6-impl', 'es3');
$jscomp.polyfill('Math.expm1', function(orig) {
  if (orig) {
    return orig;
  }
  var polyfill = function(x) {
    x = Number(x);
    if (x < .25 && x > -.25) {
      var y = x;
      var d = 1;
      var z = x;
      var zPrev = 0;
      while (zPrev != z) {
        y *= x / ++d;
        z = (zPrev = z) + y;
      }
      return z;
    }
    return Math.exp(x) - 1;
  };
  return polyfill;
}, 'es6-impl', 'es3');
$jscomp.polyfill('Math.hypot', function(orig) {
  if (orig) {
    return orig;
  }
  var polyfill = function(x, y, var_args) {
    x = Number(x);
    y = Number(y);
    var i, z, sum;
    var max = Math.max(Math.abs(x), Math.abs(y));
    for (i = 2; i < arguments.length; i++) {
      max = Math.max(max, Math.abs(arguments[i]));
    }
    if (max > 1e100 || max < 1e-100) {
      x = x / max;
      y = y / max;
      sum = x * x + y * y;
      for (i = 2; i < arguments.length; i++) {
        z = Number(arguments[i]) / max;
        sum += z * z;
      }
      return Math.sqrt(sum) * max;
    } else {
      sum = x * x + y * y;
      for (i = 2; i < arguments.length; i++) {
        z = Number(arguments[i]);
        sum += z * z;
      }
      return Math.sqrt(sum);
    }
  };
  return polyfill;
}, 'es6-impl', 'es3');
$jscomp.polyfill('Math.imul', function(orig) {
  if (orig) {
    return orig;
  }
  var polyfill = function(a, b) {
    a = Number(a);
    b = Number(b);
    var ah = a >>> 16 & 65535;
    var al = a & 65535;
    var bh = b >>> 16 & 65535;
    var bl = b & 65535;
    var lh = ah * bl + al * bh << 16 >>> 0;
    return al * bl + lh | 0;
  };
  return polyfill;
}, 'es6-impl', 'es3');
$jscomp.polyfill('Math.log10', function(orig) {
  if (orig) {
    return orig;
  }
  var polyfill = function(x) {
    return Math.log(x) / Math.LN10;
  };
  return polyfill;
}, 'es6-impl', 'es3');
$jscomp.polyfill('Math.log2', function(orig) {
  if (orig) {
    return orig;
  }
  var polyfill = function(x) {
    return Math.log(x) / Math.LN2;
  };
  return polyfill;
}, 'es6-impl', 'es3');
$jscomp.polyfill('Math.sign', function(orig) {
  if (orig) {
    return orig;
  }
  var polyfill = function(x) {
    x = Number(x);
    return x === 0 || isNaN(x) ? x : x > 0 ? 1 : -1;
  };
  return polyfill;
}, 'es6-impl', 'es3');
$jscomp.polyfill('Math.sinh', function(orig) {
  if (orig) {
    return orig;
  }
  var exp = Math.exp;
  var polyfill = function(x) {
    x = Number(x);
    if (x === 0) {
      return x;
    }
    return (exp(x) - exp(-x)) / 2;
  };
  return polyfill;
}, 'es6-impl', 'es3');
$jscomp.polyfill('Math.tanh', function(orig) {
  if (orig) {
    return orig;
  }
  var polyfill = function(x) {
    x = Number(x);
    if (x === 0) {
      return x;
    }
    var y = Math.exp(-2 * Math.abs(x));
    var z = (1 - y) / (1 + y);
    return x < 0 ? -z : z;
  };
  return polyfill;
}, 'es6-impl', 'es3');
$jscomp.polyfill('Math.trunc', function(orig) {
  if (orig) {
    return orig;
  }
  var polyfill = function(x) {
    x = Number(x);
    if (isNaN(x) || x === Infinity || x === -Infinity || x === 0) {
      return x;
    }
    var y = Math.floor(Math.abs(x));
    return x < 0 ? -y : y;
  };
  return polyfill;
}, 'es6-impl', 'es3');
$jscomp.polyfill('Number.EPSILON', function(orig) {
  return Math.pow(2, -52);
}, 'es6-impl', 'es3');
$jscomp.polyfill('Number.MAX_SAFE_INTEGER', function() {
  return 9007199254740991;
}, 'es6-impl', 'es3');
$jscomp.polyfill('Number.MIN_SAFE_INTEGER', function() {
  return -9007199254740991;
}, 'es6-impl', 'es3');
$jscomp.polyfill('Number.isFinite', function(orig) {
  if (orig) {
    return orig;
  }
  var polyfill = function(x) {
    if (typeof x !== 'number') {
      return false;
    }
    return !isNaN(x) && x !== Infinity && x !== -Infinity;
  };
  return polyfill;
}, 'es6-impl', 'es3');
$jscomp.polyfill('Number.isInteger', function(orig) {
  if (orig) {
    return orig;
  }
  var polyfill = function(x) {
    if (!Number.isFinite(x)) {
      return false;
    }
    return x === Math.floor(x);
  };
  return polyfill;
}, 'es6-impl', 'es3');
$jscomp.polyfill('Number.isNaN', function(orig) {
  if (orig) {
    return orig;
  }
  var polyfill = function(x) {
    return typeof x === 'number' && isNaN(x);
  };
  return polyfill;
}, 'es6-impl', 'es3');
$jscomp.polyfill('Number.isSafeInteger', function(orig) {
  if (orig) {
    return orig;
  }
  var polyfill = function(x) {
    return Number.isInteger(x) && Math.abs(x) <= Number.MAX_SAFE_INTEGER;
  };
  return polyfill;
}, 'es6-impl', 'es3');
$jscomp.polyfill('Object.assign', function(orig) {
  if (orig) {
    return orig;
  }
  var polyfill = function(target, var_args) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];
      if (!source) {
        continue;
      }
      for (var key in source) {
        if ($jscomp.owns(source, key)) {
          target[key] = source[key];
        }
      }
    }
    return target;
  };
  return polyfill;
}, 'es6-impl', 'es3');
$jscomp.polyfill('Object.entries', function(orig) {
  if (orig) {
    return orig;
  }
  var entries = function(obj) {
    var result = [];
    for (var key in obj) {
      if ($jscomp.owns(obj, key)) {
        result.push([key, obj[key]]);
      }
    }
    return result;
  };
  return entries;
}, 'es8', 'es3');
$jscomp.polyfill('Object.getOwnPropertySymbols', function(orig) {
  if (orig) {
    return orig;
  }
  return function() {
    return [];
  };
}, 'es6-impl', 'es5');
$jscomp.polyfill('Reflect.ownKeys', function(orig) {
  if (orig) {
    return orig;
  }
  var symbolPrefix = 'jscomp_symbol_';
  function isSymbol(key) {
    return key.substring(0, symbolPrefix.length) == symbolPrefix;
  }
  var polyfill = function(target) {
    var keys = [];
    var names = Object.getOwnPropertyNames(target);
    var symbols = Object.getOwnPropertySymbols(target);
    for (var i = 0; i < names.length; i++) {
      (isSymbol(names[i]) ? symbols : keys).push(names[i]);
    }
    return keys.concat(symbols);
  };
  return polyfill;
}, 'es6', 'es5');
$jscomp.polyfill('Object.getOwnPropertyDescriptors', function(orig) {
  if (orig) {
    return orig;
  }
  var getOwnPropertyDescriptors = function(obj) {
    var result = {};
    var keys = Reflect.ownKeys(obj);
    for (var i = 0; i < keys.length; i++) {
      result[keys[i]] = Object.getOwnPropertyDescriptor(obj, keys[i]);
    }
    return result;
  };
  return getOwnPropertyDescriptors;
}, 'es8', 'es5');
$jscomp.polyfill('Object.setPrototypeOf', function(orig) {
  if (orig) {
    return orig;
  }
  if (typeof ''.__proto__ != 'object') {
    return null;
  }
  var polyfill = function(target, proto) {
    target.__proto__ = proto;
    if (target.__proto__ !== proto) {
      throw new TypeError(target + ' is not extensible');
    }
    return target;
  };
  return polyfill;
}, 'es6', 'es5');
$jscomp.polyfill('Object.values', function(orig) {
  if (orig) {
    return orig;
  }
  var values = function(obj) {
    var result = [];
    for (var key in obj) {
      if ($jscomp.owns(obj, key)) {
        result.push(obj[key]);
      }
    }
    return result;
  };
  return values;
}, 'es8', 'es3');
$jscomp.polyfill('Reflect.apply', function(orig) {
  if (orig) {
    return orig;
  }
  var apply = Function.prototype.apply;
  var polyfill = function(target, thisArg, argList) {
    return apply.call(target, thisArg, argList);
  };
  return polyfill;
}, 'es6', 'es3');
$jscomp.polyfill('Reflect.construct', function(orig) {
  if (orig) {
    return orig;
  }
  var polyfill = function(target, argList, opt_newTarget) {
    if (opt_newTarget === undefined) {
      opt_newTarget = target;
    }
    var proto = opt_newTarget.prototype || Object.prototype;
    var obj = Object.create(proto);
    var out = Reflect.apply(target, obj, argList);
    return out || obj;
  };
  return polyfill;
}, 'es6', 'es5');
$jscomp.polyfill('Reflect.defineProperty', function(orig) {
  if (orig) {
    return orig;
  }
  var polyfill = function(target, propertyKey, attributes) {
    try {
      Object.defineProperty(target, propertyKey, attributes);
      var desc = Object.getOwnPropertyDescriptor(target, propertyKey);
      if (!desc) {
        return false;
      }
      return desc.configurable === (attributes.configurable || false) && desc.enumerable === (attributes.enumerable || false) && ('value' in desc ? desc.value === attributes.value && desc.writable === (attributes.writable || false) : desc.get === attributes.get && desc.set === attributes.set);
    } catch (err) {
      return false;
    }
  };
  return polyfill;
}, 'es6', 'es5');
$jscomp.polyfill('Reflect.deleteProperty', function(orig) {
  if (orig) {
    return orig;
  }
  var polyfill = function(target, propertyKey) {
    if (!$jscomp.owns(target, propertyKey)) {
      return true;
    }
    try {
      return delete target[propertyKey];
    } catch (err) {
      return false;
    }
  };
  return polyfill;
}, 'es6', 'es3');
$jscomp.polyfill('Reflect.getOwnPropertyDescriptor', function(orig) {
  return orig || Object.getOwnPropertyDescriptor;
}, 'es6', 'es5');
$jscomp.polyfill('Reflect.getPrototypeOf', function(orig) {
  return orig || Object.getPrototypeOf;
}, 'es6', 'es5');
$jscomp.findDescriptor = function(target, propertyKey) {
  var obj = target;
  while (obj) {
    var property = Reflect.getOwnPropertyDescriptor(obj, propertyKey);
    if (property) {
      return property;
    }
    obj = Reflect.getPrototypeOf(obj);
  }
  return undefined;
};
$jscomp.polyfill('Reflect.get', function(orig) {
  if (orig) {
    return orig;
  }
  var polyfill = function(target, propertyKey, opt_receiver) {
    if (arguments.length <= 2) {
      return target[propertyKey];
    }
    var property = $jscomp.findDescriptor(target, propertyKey);
    if (property) {
      return property.get ? property.get.call(opt_receiver) : property.value;
    }
    return undefined;
  };
  return polyfill;
}, 'es6', 'es5');
$jscomp.polyfill('Reflect.has', function(orig) {
  if (orig) {
    return orig;
  }
  var polyfill = function(target, propertyKey) {
    return propertyKey in target;
  };
  return polyfill;
}, 'es6', 'es3');
$jscomp.polyfill('Reflect.isExtensible', function(orig) {
  if (orig) {
    return orig;
  }
  if (typeof Object.isExtensible == 'function') {
    return Object.isExtensible;
  }
  return function() {
    return true;
  };
}, 'es6', 'es3');
$jscomp.polyfill('Reflect.preventExtensions', function(orig) {
  if (orig) {
    return orig;
  }
  if (typeof Object.preventExtensions != 'function') {
    return function() {
      return false;
    };
  }
  var polyfill = function(target) {
    Object.preventExtensions(target);
    return !Object.isExtensible(target);
  };
  return polyfill;
}, 'es6', 'es3');
$jscomp.polyfill('Reflect.set', function(orig) {
  if (orig) {
    return orig;
  }
  var polyfill = function(target, propertyKey, value, opt_receiver) {
    var property = $jscomp.findDescriptor(target, propertyKey);
    if (!property) {
      if (Reflect.isExtensible(target)) {
        target[propertyKey] = value;
        return true;
      }
      return false;
    }
    if (property.set) {
      property.set.call(arguments.length > 3 ? opt_receiver : target, value);
      return true;
    } else {
      if (property.writable && !Object.isFrozen(target)) {
        target[propertyKey] = value;
        return true;
      }
    }
    return false;
  };
  return polyfill;
}, 'es6', 'es5');
$jscomp.polyfill('Reflect.setPrototypeOf', function(orig) {
  if (orig) {
    return orig;
  }
  if (typeof ''.__proto__ != 'object') {
    return null;
  }
  var polyfill = function(target, proto) {
    try {
      target.__proto__ = proto;
      return target.__proto__ === proto;
    } catch (err) {
      return false;
    }
  };
  return polyfill;
}, 'es6', 'es5');
$jscomp.ASSUME_NO_NATIVE_SET = false;
$jscomp.polyfill('Set', function(NativeSet) {
  var isConformant = !$jscomp.ASSUME_NO_NATIVE_SET && function() {
    if (!NativeSet || !NativeSet.prototype.entries || typeof Object.seal != 'function') {
      return false;
    }
    try {
      NativeSet = (NativeSet);
      var value = Object.seal({x:4});
      var set = new NativeSet($jscomp.makeIterator([value]));
      if (!set.has(value) || set.size != 1 || set.add(value) != set || set.size != 1 || set.add({x:4}) != set || set.size != 2) {
        return false;
      }
      var iter = set.entries();
      var item = iter.next();
      if (item.done || item.value[0] != value || item.value[1] != value) {
        return false;
      }
      item = iter.next();
      if (item.done || item.value[0] == value || item.value[0].x != 4 || item.value[1] != item.value[0]) {
        return false;
      }
      return iter.next().done;
    } catch (err) {
      return false;
    }
  }();
  if (isConformant) {
    return NativeSet;
  }
  $jscomp.initSymbol();
  $jscomp.initSymbolIterator();
  var PolyfillSet = function(opt_iterable) {
    this.map_ = new Map;
    if (opt_iterable) {
      var iter = $jscomp.makeIterator(opt_iterable);
      var entry;
      while (!(entry = iter.next()).done) {
        var item = (entry).value;
        this.add(item);
      }
    }
    this.size = this.map_.size;
  };
  PolyfillSet.prototype.add = function(value) {
    this.map_.set(value, value);
    this.size = this.map_.size;
    return this;
  };
  PolyfillSet.prototype['delete'] = function(value) {
    var result = this.map_['delete'](value);
    this.size = this.map_.size;
    return result;
  };
  PolyfillSet.prototype.clear = function() {
    this.map_.clear();
    this.size = 0;
  };
  PolyfillSet.prototype.has = function(value) {
    return this.map_.has(value);
  };
  PolyfillSet.prototype.entries = function() {
    return this.map_.entries();
  };
  PolyfillSet.prototype.values = function() {
    return this.map_.values();
  };
  PolyfillSet.prototype.keys = PolyfillSet.prototype.values;
  (PolyfillSet.prototype)[Symbol.iterator] = PolyfillSet.prototype.values;
  PolyfillSet.prototype.forEach = function(callback, opt_thisArg) {
    var set = this;
    this.map_.forEach(function(value) {
      return callback.call((opt_thisArg), value, value, set);
    });
  };
  return PolyfillSet;
}, 'es6-impl', 'es3');
$jscomp.checkStringArgs = function(thisArg, arg, func) {
  if (thisArg == null) {
    throw new TypeError("The 'this' value for String.prototype." + func + ' must not be null or undefined');
  }
  if (arg instanceof RegExp) {
    throw new TypeError('First argument to String.prototype.' + func + ' must not be a regular expression');
  }
  return thisArg + '';
};
$jscomp.polyfill('String.prototype.codePointAt', function(orig) {
  if (orig) {
    return orig;
  }
  var polyfill = function(position) {
    var string = $jscomp.checkStringArgs(this, null, 'codePointAt');
    var size = string.length;
    position = Number(position) || 0;
    if (!(position >= 0 && position < size)) {
      return void 0;
    }
    position = position | 0;
    var first = string.charCodeAt(position);
    if (first < 55296 || first > 56319 || position + 1 === size) {
      return first;
    }
    var second = string.charCodeAt(position + 1);
    if (second < 56320 || second > 57343) {
      return first;
    }
    return (first - 55296) * 1024 + second + 9216;
  };
  return polyfill;
}, 'es6-impl', 'es3');
$jscomp.polyfill('String.prototype.endsWith', function(orig) {
  if (orig) {
    return orig;
  }
  var polyfill = function(searchString, opt_position) {
    var string = $jscomp.checkStringArgs(this, searchString, 'endsWith');
    searchString = searchString + '';
    if (opt_position === void 0) {
      opt_position = string.length;
    }
    var i = Math.max(0, Math.min(opt_position | 0, string.length));
    var j = searchString.length;
    while (j > 0 && i > 0) {
      if (string[--i] != searchString[--j]) {
        return false;
      }
    }
    return j <= 0;
  };
  return polyfill;
}, 'es6-impl', 'es3');
$jscomp.polyfill('String.fromCodePoint', function(orig) {
  if (orig) {
    return orig;
  }
  var polyfill = function(var_args) {
    var result = '';
    for (var i = 0; i < arguments.length; i++) {
      var code = Number(arguments[i]);
      if (code < 0 || code > 1114111 || code !== Math.floor(code)) {
        throw new RangeError('invalid_code_point ' + code);
      }
      if (code <= 65535) {
        result += String.fromCharCode(code);
      } else {
        code -= 65536;
        result += String.fromCharCode(code >>> 10 & 1023 | 55296);
        result += String.fromCharCode(code & 1023 | 56320);
      }
    }
    return result;
  };
  return polyfill;
}, 'es6-impl', 'es3');
$jscomp.polyfill('String.prototype.includes', function(orig) {
  if (orig) {
    return orig;
  }
  var polyfill = function(searchString, opt_position) {
    var string = $jscomp.checkStringArgs(this, searchString, 'includes');
    return string.indexOf(searchString, opt_position || 0) !== -1;
  };
  return polyfill;
}, 'es6-impl', 'es3');
$jscomp.polyfill('String.prototype.repeat', function(orig) {
  if (orig) {
    return orig;
  }
  var polyfill = function(copies) {
    var string = $jscomp.checkStringArgs(this, null, 'repeat');
    if (copies < 0 || copies > 1342177279) {
      throw new RangeError('Invalid count value');
    }
    copies = copies | 0;
    var result = '';
    while (copies) {
      if (copies & 1) {
        result += string;
      }
      if (copies >>>= 1) {
        string += string;
      }
    }
    return result;
  };
  return polyfill;
}, 'es6-impl', 'es3');
$jscomp.stringPadding = function(padString, padLength) {
  var padding = padString !== undefined ? String(padString) : ' ';
  if (!(padLength > 0) || !padding) {
    return '';
  }
  var repeats = Math.ceil(padLength / padding.length);
  return padding.repeat(repeats).substring(0, padLength);
};
$jscomp.polyfill('String.prototype.padEnd', function(orig) {
  if (orig) {
    return orig;
  }
  var padEnd = function(targetLength, opt_padString) {
    var string = $jscomp.checkStringArgs(this, null, 'padStart');
    var padLength = targetLength - string.length;
    return string + $jscomp.stringPadding(opt_padString, padLength);
  };
  return padEnd;
}, 'es8', 'es3');
$jscomp.polyfill('String.prototype.padStart', function(orig) {
  if (orig) {
    return orig;
  }
  var padStart = function(targetLength, opt_padString) {
    var string = $jscomp.checkStringArgs(this, null, 'padStart');
    var padLength = targetLength - string.length;
    return $jscomp.stringPadding(opt_padString, padLength) + string;
  };
  return padStart;
}, 'es8', 'es3');
$jscomp.polyfill('String.prototype.startsWith', function(orig) {
  if (orig) {
    return orig;
  }
  var polyfill = function(searchString, opt_position) {
    var string = $jscomp.checkStringArgs(this, searchString, 'startsWith');
    searchString = searchString + '';
    var strLen = string.length;
    var searchLen = searchString.length;
    var i = Math.max(0, Math.min((opt_position) | 0, string.length));
    var j = 0;
    while (j < searchLen && i < strLen) {
      if (string[i++] != searchString[j++]) {
        return false;
      }
    }
    return j >= searchLen;
  };
  return polyfill;
}, 'es6-impl', 'es3');
$jscomp.arrayFromIterator = function(iterator) {
  var i;
  var arr = [];
  while (!(i = iterator.next()).done) {
    arr.push(i.value);
  }
  return arr;
};
$jscomp.arrayFromIterable = function(iterable) {
  if (iterable instanceof Array) {
    return iterable;
  } else {
    return $jscomp.arrayFromIterator($jscomp.makeIterator(iterable));
  }
};
$jscomp.inherits = function(childCtor, parentCtor) {
  function tempCtor() {
  }
  tempCtor.prototype = parentCtor.prototype;
  childCtor.superClass_ = parentCtor.prototype;
  childCtor.prototype = new tempCtor;
  childCtor.prototype.constructor = childCtor;
  for (var p in parentCtor) {
    if (Object.defineProperties) {
      var descriptor = Object.getOwnPropertyDescriptor(parentCtor, p);
      if (descriptor) {
        Object.defineProperty(childCtor, p, descriptor);
      }
    } else {
      childCtor[p] = parentCtor[p];
    }
  }
};
$jscomp.polyfill('WeakSet', function(NativeWeakSet) {
  function isConformant() {
    if (!NativeWeakSet || !Object.seal) {
      return false;
    }
    try {
      var x = Object.seal({});
      var y = Object.seal({});
      var set = new (NativeWeakSet)([x]);
      if (!set.has(x) || set.has(y)) {
        return false;
      }
      set['delete'](x);
      set.add(y);
      return !set.has(x) && set.has(y);
    } catch (err) {
      return false;
    }
  }
  if (isConformant()) {
    return NativeWeakSet;
  }
  var PolyfillWeakSet = function(opt_iterable) {
    this.map_ = new WeakMap;
    if (opt_iterable) {
      $jscomp.initSymbol();
      $jscomp.initSymbolIterator();
      var iter = $jscomp.makeIterator(opt_iterable);
      var entry;
      while (!(entry = iter.next()).done) {
        var item = entry.value;
        this.add(item);
      }
    }
  };
  PolyfillWeakSet.prototype.add = function(elem) {
    this.map_.set(elem, true);
    return this;
  };
  PolyfillWeakSet.prototype.has = function(elem) {
    return this.map_.has(elem);
  };
  PolyfillWeakSet.prototype['delete'] = function(elem) {
    return this.map_['delete'](elem);
  };
  return PolyfillWeakSet;
}, 'es6-impl', 'es3');
try {
  if (Array.prototype.values.toString().indexOf('[native code]') == -1) {
    delete Array.prototype.values;
  }
} catch (e) {
}
Ext.define('Ext.overrides.exporter.util.Format', {override:'Ext.util.Format', decToHex:function(dec, bytes) {
  var hex = '', i;
  for (i = 0; i < bytes; i++) {
    hex += String.fromCharCode(dec & 255);
    dec = dec >>> 8;
  }
  return hex;
}});
Ext.define('Ext.exporter.data.Base', {requires:['Ext.util.Collection'], config:{idPrefix:'id', id:null, autoGenerateId:true, autoGenerateKey:{$value:false, merge:function(newValue, oldValue) {
  return newValue ? Ext.concat(newValue, oldValue || null) : false;
}}}, internalCols:null, clearPropertiesOnDestroy:false, constructor:function(config) {
  var me = this;
  me.internalCols = [];
  me.initConfig(config);
  if (!me._id) {
    me.setId(null);
  }
  return me.callParent([config]);
}, destroy:function() {
  this.destroyCollections();
  this.callParent();
  this.internalCols = null;
}, destroyCollections:function() {
  var cols = this.internalCols, len = cols.length, i, j, length, col;
  for (i = 0; i < len; i++) {
    col = cols[i];
    length = col.length;
    for (j = 0; j < length; j++) {
      col.items[j].destroy();
    }
    col.destroy();
  }
  cols.length = 0;
}, clearCollections:function(cols) {
  var i, len, col;
  cols = cols ? Ext.Array.from(cols) : this.internalCols;
  len = cols.length;
  for (i = len - 1; i >= 0; i--) {
    col = cols[i];
    if (col) {
      col.destroy();
    }
    Ext.Array.remove(this.internalCols, col);
  }
}, applyId:function(data) {
  var id;
  if (!data && this._autoGenerateId) {
    id = this._idPrefix + ++Ext.idSeed;
  } else {
    id = data;
  }
  return id;
}, checkCollection:function(data, dataCollection, className) {
  var col;
  if (data) {
    col = this.constructCollection(className);
    col.add(data);
  }
  if (dataCollection) {
    Ext.Array.remove(this.internalCols, dataCollection);
    Ext.destroy(dataCollection.items, dataCollection);
  }
  return col;
}, constructCollection:function(className) {
  var cls = Ext.ClassManager.get(className), cfg = {decoder:this.getCollectionDecoder(cls)}, col;
  if (typeof cls.prototype.getKey === 'function') {
    cfg.keyFn = this.getCollectionItemKey;
  }
  col = new Ext.util.Collection(cfg);
  this.internalCols.push(col);
  return col;
}, getCollectionDecoder:function(klass) {
  return function(config) {
    return config && config.isInstance ? config : new klass(config || {});
  };
}, getCollectionItemKey:function(item) {
  return item.getKey ? item.getKey() : item._id || item.getId();
}, getKey:function() {
  var generate = this.getAutoGenerateKey(), key = '', config = this.getConfig(), len, i;
  if (!Ext.isArray(generate) || !generate.length) {
    return this.getId();
  }
  len = generate.length;
  for (i = 0; i < len; i++) {
    key += this.serializeKeyValue(config[generate[i]]);
  }
  return key;
}, serializeKeyValue:function(value) {
  var key = '', keys, len, i;
  if (value === null) {
    key = '_';
  } else {
    if (Ext.isDate(value)) {
      key = value.getTime();
    } else {
      if (Ext.isArray(value)) {
        len = value.length;
        for (i = 0; i < len; i++) {
          key += this.serializeKeyValue(value[i]);
        }
      } else {
        if (typeof value === 'object') {
          if (value.isInstance) {
            key = value.getKey ? value.getKey() : '_';
          } else {
            keys = Ext.Object.getAllKeys(value);
            keys = Ext.Array.sort(keys);
            len = keys.length;
            for (i = 0; i < len; i++) {
              key += this.serializeKeyValue(value[keys[i]]);
            }
          }
        } else {
          key = value;
        }
      }
    }
  }
  return key;
}});
Ext.define('Ext.exporter.data.Cell', {extend:'Ext.exporter.data.Base', config:{style:null, value:null}});
Ext.define('Ext.exporter.data.Row', {extend:'Ext.exporter.data.Base', requires:['Ext.exporter.data.Cell'], config:{cells:null}, destroy:function() {
  this.clearCollections();
}, applyCells:function(data, dataCollection) {
  return this.checkCollection(data, dataCollection, 'Ext.exporter.data.Cell');
}, addCell:function(config) {
  if (!this._cells) {
    this.setCells([]);
  }
  return this._cells.add(config || {});
}, getCell:function(id) {
  return this._cells ? this._cells.get(id) : null;
}});
Ext.define('Ext.exporter.data.Group', {extend:'Ext.exporter.data.Base', requires:['Ext.exporter.data.Row'], config:{text:null, rows:null, summaries:null, summary:null, groups:null}, applyRows:function(data, dataCollection) {
  return this.checkCollection(data, dataCollection, 'Ext.exporter.data.Row');
}, addRow:function(config) {
  if (!this._rows) {
    this.setRows([]);
  }
  return this._rows.add(config || {});
}, getRow:function(id) {
  return this._rows ? this._rows.get(id) : null;
}, applyGroups:function(data, dataCollection) {
  return this.checkCollection(data, dataCollection, 'Ext.exporter.data.Group');
}, addGroup:function(config) {
  if (!this._groups) {
    this.setGroups([]);
  }
  return this._groups.add(config || {});
}, getGroup:function(id) {
  return this._groups ? this._groups.get(id) : null;
}, applySummaries:function(data, dataCollection) {
  return this.checkCollection(data, dataCollection, 'Ext.exporter.data.Row');
}, applySummary:function(value) {
  if (value) {
    this.addSummary(value);
  }
  return null;
}, addSummary:function(config) {
  if (!this._summaries) {
    this.setSummaries([]);
  }
  return this._summaries.add(config || {});
}, getSummary:function(id) {
  return this._summaries ? this._summaries.get(id) : null;
}});
Ext.define('Ext.exporter.data.Column', {extend:'Ext.exporter.data.Base', config:{table:null, text:null, style:null, width:null, mergeAcross:null, mergeDown:null, level:0, index:null, columns:null}, destroy:function() {
  this.setTable(null);
  this.callParent();
}, updateTable:function(table) {
  var cols = this.getColumns(), i, length;
  if (cols) {
    length = cols.length;
    for (i = 0; i < length; i++) {
      cols.getAt(i).setTable(table);
    }
  }
}, applyColumns:function(data, dataCollection) {
  return this.checkCollection(data, dataCollection, 'Ext.exporter.data.Column');
}, updateColumns:function(collection, oldCollection) {
  var me = this;
  if (oldCollection) {
    oldCollection.un({add:me.onColumnAdd, remove:me.onColumnRemove, scope:me});
    Ext.destroy(oldCollection.items, oldCollection);
  }
  if (collection) {
    collection.on({add:me.onColumnAdd, remove:me.onColumnRemove, scope:me});
    me.onColumnAdd(collection, {items:collection.getRange()});
  }
}, sync:function(level, depth) {
  var me = this, count = me.getColumnCount() - 1, cols = me.getColumns(), i, length, down;
  me.setLevel(level);
  if (cols) {
    length = cols.length;
    for (i = 0; i < length; i++) {
      cols.items[i].sync(level + 1, depth);
    }
    me.setMergeDown(null);
  } else {
    down = depth - level;
    me.setMergeDown(down > 0 ? down : null);
  }
  me.setMergeAcross(count > 0 ? count : null);
}, onColumnAdd:function(collection, details) {
  var items = details.items, length = items.length, table = this.getTable(), i, item;
  for (i = 0; i < length; i++) {
    item = items[i];
    item.setTable(table);
  }
  if (table) {
    table.syncColumns();
  }
}, onColumnRemove:function(collection, details) {
  var table = this.getTable();
  Ext.destroy(details.items);
  if (table) {
    table.syncColumns();
  }
}, getColumnCount:function(columns) {
  var s = 0, cols;
  if (!columns) {
    columns = this.getColumns();
    if (!columns) {
      return 1;
    }
  }
  for (var i = 0; i < columns.length; i++) {
    cols = columns.getAt(i).getColumns();
    if (!cols) {
      s += 1;
    } else {
      s += this.getColumnCount(cols);
    }
  }
  return s;
}, addColumn:function(config) {
  if (!this.getColumns()) {
    this.setColumns([]);
  }
  return this.getColumns().add(config || {});
}, getColumn:function(id) {
  return this.getColumns().get(id);
}});
Ext.define('Ext.exporter.data.Table', {extend:'Ext.exporter.data.Group', requires:['Ext.exporter.data.Column'], isDataTable:true, config:{columns:null}, autoGenerateId:false, applyColumns:function(data, dataCollection) {
  return this.checkCollection(data, dataCollection, 'Ext.exporter.data.Column');
}, updateColumns:function(collection, oldCollection) {
  var me = this;
  if (oldCollection) {
    oldCollection.un({add:me.onColumnAdd, remove:me.onColumnRemove, scope:me});
    Ext.destroy(oldCollection.items, oldCollection);
  }
  if (collection) {
    collection.on({add:me.onColumnAdd, remove:me.onColumnRemove, scope:me});
    me.onColumnAdd(collection, {items:collection.getRange()});
    me.syncColumns();
  }
}, syncColumns:function() {
  var cols = this.getColumns(), depth = this.getColDepth(cols, -1), result = {}, i, j, length, len, keys, arr, prevCol, index;
  if (!cols) {
    return;
  }
  length = cols.length;
  for (i = 0; i < length; i++) {
    cols.items[i].sync(0, depth);
  }
  this.getColumnLevels(cols, depth, result);
  keys = Ext.Object.getKeys(result);
  length = keys.length;
  for (i = 0; i < length; i++) {
    arr = result[keys[i]];
    len = arr.length;
    for (j = 0; j < len; j++) {
      if (j === 0) {
        index = 1;
      } else {
        if (arr[j - 1]) {
          prevCol = arr[j - 1].getConfig();
          index += prevCol.mergeAcross ? prevCol.mergeAcross + 1 : 1;
        } else {
          index++;
        }
      }
      if (arr[j]) {
        arr[j].setIndex(index);
      }
    }
  }
}, getLeveledColumns:function() {
  var cols = this.getColumns(), depth = this.getColDepth(cols, -1), result = {};
  this.getColumnLevels(cols, depth, result, true);
  return result;
}, getBottomColumns:function() {
  var result = this.getLeveledColumns(), keys, len;
  keys = Ext.Object.getKeys(result);
  len = keys.length;
  return len ? result[keys[keys.length - 1]] : [];
}, getColumnLevels:function(columns, depth, result, topDown) {
  var col, i, j, len, name, level, cols;
  if (!columns) {
    return;
  }
  len = columns.length;
  for (i = 0; i < len; i++) {
    col = columns.items[i];
    level = col.getLevel();
    cols = col.getColumns();
    name = 's' + level;
    result[name] = result[name] || [];
    result[name].push(col);
    if (!cols) {
      for (j = level + 1; j <= depth; j++) {
        name = 's' + j;
        result[name] = result[name] || [];
        result[name].push(topDown ? col : null);
      }
    } else {
      this.getColumnLevels(cols, depth, result, topDown);
    }
  }
}, onColumnAdd:function(collection, details) {
  var items = details.items, length = items.length, i, item;
  for (i = 0; i < length; i++) {
    item = items[i];
    item.setTable(this);
  }
  this.syncColumns();
}, onColumnRemove:function(collection, details) {
  Ext.destroy(details.items);
  this.syncColumns();
}, getColumnCount:function() {
  var cols = this._columns, s = 0, i, length;
  if (cols) {
    length = cols.length;
    for (i = 0; i < length; i++) {
      s += cols.items[i].getColumnCount();
    }
  }
  return s;
}, getColDepth:function(columns, level) {
  var m = 0, len;
  if (!columns) {
    return level;
  }
  len = columns.length;
  for (var i = 0; i < len; i++) {
    m = Math.max(m, this.getColDepth(columns.items[i]._columns, level + 1));
  }
  return m;
}, addColumn:function(config) {
  if (!this._columns) {
    this.setColumns([]);
  }
  return this._columns.add(config || {});
}, getColumn:function(id) {
  return this._columns ? this._columns.get(id) : null;
}});
Ext.define('Ext.exporter.file.Base', {extend:'Ext.exporter.data.Base', requires:['Ext.XTemplate'], tpl:null, destroy:function() {
  this.tpl = null;
  this.callParent();
}, render:function() {
  var me = this, data = me.processRenderData(me.getRenderData());
  return me.tpl ? Ext.XTemplate.getTpl(me, 'tpl').apply(data) : '';
}, processRenderData:function(data) {
  return data;
}, getRenderData:function() {
  var data = this.getConfig();
  data.self = this;
  return data;
}});
Ext.define('Ext.exporter.file.Style', {extend:'Ext.exporter.file.Base', config:{name:null, alignment:null, font:null, interior:null, format:null, borders:null, checks:{alignment:{horizontal:['Automatic', 'Left', 'Center', 'Right', 'Justify'], readingOrder:['LeftToRight', 'RightToLeft', 'Context'], vertical:['Automatic', 'Top', 'Bottom', 'Center']}, font:{bold:[true, false], italic:[true, false], strikeThrough:[true, false], underline:['None', 'Single']}, border:{position:['Left', 'Top', 'Right', 
'Bottom'], lineStyle:['None', 'Continuous', 'Dash', 'Dot']}, interior:{pattern:['None', 'Solid']}}}, datePatterns:{'General Date':'Y-m-d H:i:s', 'Long Date':'l, F d, Y', 'Medium Date':'Y-m-d', 'Short Date':'n/j/Y', 'Long Time':'g:i:s A', 'Medium Time':'H:i:s', 'Short Time':'g:i A'}, numberPatterns:{'General Number':'0', 'Fixed':'0.00', 'Standard':'0.00'}, booleanPatterns:{'Yes/No':['Yes', 'No'], 'True/False':['True', 'False'], 'On/Off':['On', 'Off']}, isStyle:true, autoGenerateKey:['alignment', 'font', 
'interior', 'format', 'borders'], constructor:function(config) {
  this.callParent([this.uncapitalizeKeys(config)]);
}, uncapitalizeKeys:function(config) {
  var ret = config, keys, len, i, key, v;
  if (Ext.isObject(config)) {
    ret = {};
    keys = Ext.Object.getAllKeys(config);
    len = keys.length;
    for (i = 0; i < len; i++) {
      key = keys[i];
      ret[Ext.String.uncapitalize(key)] = this.uncapitalizeKeys(config[key]);
    }
  } else {
    if (Ext.isArray(config)) {
      ret = [];
      len = config.length;
      for (i = 0; i < len; i++) {
        ret.push(this.uncapitalizeKeys(config[i]));
      }
    }
  }
  return ret;
}, destroy:function() {
  var me = this;
  me.setAlignment(null);
  me.setFont(null);
  me.setInterior(null);
  me.setBorders(null);
  me.setChecks(null);
  me.callParent();
}, updateAlignment:function(data) {
  this.checkAttribute(data, 'alignment');
}, updateFont:function(data) {
  this.checkAttribute(data, 'font');
}, updateInterior:function(data) {
  this.checkAttribute(data, 'interior');
}, applyBorders:function(borders, oldBolders) {
  if (!borders) {
    return borders;
  }
  borders = Ext.Array.from(borders);
  if (Ext.Array.unique(Ext.Array.pluck(borders, 'position')).length != borders.length) {
    Ext.raise('Invalid border positions supplied');
  }
  return borders;
}, updateBorders:function(data) {
  this.checkAttribute(data, 'border');
}, checkAttribute:function(data, checkName) {
  var checks = this.getChecks(), values, keys, len, i, j, arr, key, obj, lenV, valid;
  if (!data || !checks || !checks[checkName]) {
    return;
  }
  values = Ext.Array.from(data);
  lenV = values.length;
  for (i = 0; i < lenV; i++) {
    obj = values[i];
    keys = Ext.Object.getKeys(obj || {});
    len = keys.length;
    for (j = 0; j < len; j++) {
      key = keys[j];
      if (arr = checks[checkName][key] && obj[key]) {
        valid = Ext.isArray(arr) ? Ext.Array.indexOf(arr, obj[key]) : arr === obj[key];
        if (!valid) {
          delete obj[key];
          Ext.raise(Ext.String.format('Invalid key (%0) or value (%1) provided for Style!', key, obj[key]));
        }
      }
    }
  }
}, getFormattedValue:function(v) {
  var me = this, f = me.getFormat(), ret = v, fmt = Ext.util.Format;
  if (!f || f === 'General' || Ext.isEmpty(v)) {
    return ret;
  }
  if (f === 'Currency') {
    return fmt.currency(v);
  } else {
    if (f === 'Euro Currency') {
      return fmt.currency(v, '€');
    } else {
      if (f === 'Percent') {
        return fmt.number(v * 100, '0.00') + '%';
      } else {
        if (f === 'Scientific') {
          return Number(v).toExponential();
        } else {
          if (me.datePatterns[f]) {
            return fmt.date(v, me.datePatterns[f]);
          } else {
            if (me.numberPatterns[f]) {
              return fmt.number(v, me.numberPatterns[f]);
            } else {
              if (me.booleanPatterns[f]) {
                return v ? me.booleanPatterns[f][0] : me.booleanPatterns[f][1];
              } else {
                if (Ext.isFunction(f)) {
                  return f(v);
                }
              }
            }
          }
        }
      }
    }
  }
  return fmt.number(v, f);
}});
Ext.define('Ext.exporter.File', {singleton:true, requires:['Ext.promise.Promise', 'Ext.Deferred'], textPopupWait:'You may close this window after the file is downloaded!', textPopupBlocker:'The file was not saved because pop-up blocker might be enabled! Please check your browser settings.', url:'https://exporter.sencha.com', forceDownload:false, requiresPopup:function() {
  var pt = Ext.platformTags;
  return this.forceDownload || Ext.isSafari || pt.phone || pt.tablet;
}, initializePopup:function(binary) {
  var me = this, required = me.requiresPopup(), win;
  if (!required && binary) {
    required = !me.saveBlobAs;
  }
  me.popup = null;
  if (required) {
    win = window.open('', '_blank');
    if (win) {
      me.popup = win;
      win.document.write(Ext.dom.Helper.markup({tag:'html', children:[{tag:'head'}, {tag:'body', children:[{tag:'p', html:me.textPopupWait}]}]}));
    }
  }
}, saveBinaryAs:function(content, filename, charset, mimeType) {
  var me = this, saveAs = me.downloadBinaryAs;
  if (!me.requiresPopup() && me.saveBlobAs) {
    saveAs = me.saveBlobAs;
  }
  return saveAs.call(me, content, filename, charset, mimeType);
}, downloadBinaryAs:function(content, filename, charset, mimeType) {
  var deferred = new Ext.Deferred, markup, win;
  if (!this.url) {
    Ext.raise('Cannot download file since no URL was defined!');
    return deferred.promise;
  }
  markup = Ext.dom.Helper.markup({tag:'html', children:[{tag:'head'}, {tag:'body', children:[{tag:'form', method:'POST', action:this.url, children:[{tag:'input', type:'hidden', name:'content', value:Ext.util.Base64.encode(content)}, {tag:'input', type:'hidden', name:'filename', value:filename}, {tag:'input', type:'hidden', name:'charset', value:charset || 'UTF-8'}, {tag:'input', type:'hidden', name:'mime', value:mimeType || 'application/octet-stream'}]}, {tag:'script', type:'text/javascript', children:'document.getElementsByTagName("form")[0].submit();'}]}]});
  win = this.popup || window.open('', '_blank');
  if (win) {
    win.document.write(markup);
    deferred.resolve();
  } else {
    deferred.reject(this.textPopupBlocker);
  }
  this.popup = null;
  return deferred.promise;
}}, function(File) {
  var navigator = window.navigator, saveAs = window.saveAs || function(view) {
    if (typeof navigator !== 'undefined' && /MSIE [1-9]\./.test(navigator.userAgent)) {
      return;
    }
    var doc = view.document, get_URL = function() {
      return view.URL || view.webkitURL || view;
    }, save_link = doc.createElementNS('http://www.w3.org/1999/xhtml', 'a'), can_use_save_link = 'download' in save_link, click = function(node) {
      var event = new MouseEvent('click');
      node.dispatchEvent(event);
    }, is_safari = /Version\/[\d\.]+.*Safari/.test(navigator.userAgent), webkit_req_fs = view.webkitRequestFileSystem, req_fs = view.requestFileSystem || webkit_req_fs || view.mozRequestFileSystem, throw_outside = function(ex) {
      (view.setImmediate || view.setTimeout)(function() {
        throw ex;
      }, 0);
    }, force_saveable_type = 'application/octet-stream', fs_min_size = 0, arbitrary_revoke_timeout = 1000 * 40, revoke = function(file) {
      var revoker = function() {
        if (typeof file === 'string') {
          get_URL().revokeObjectURL(file);
        } else {
          file.remove();
        }
      };
      setTimeout(revoker, arbitrary_revoke_timeout);
    }, dispatch = function(filesaver, event_types, event) {
      event_types = [].concat(event_types);
      var i = event_types.length;
      while (i--) {
        var listener = filesaver['on' + event_types[i]];
        if (typeof listener === 'function') {
          try {
            listener.call(filesaver, event || filesaver);
          } catch (ex) {
            throw_outside(ex);
          }
        }
      }
    }, auto_bom = function(blob) {
      if (/^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(blob.type)) {
        return new Blob(['﻿', blob], {type:blob.type});
      }
      return blob;
    }, FileSaver = function(blob, name, no_auto_bom) {
      if (!no_auto_bom) {
        blob = auto_bom(blob);
      }
      var filesaver = this, type = blob.type, blob_changed = false, object_url, target_view, dispatch_all = function() {
        dispatch(filesaver, 'writestart progress write writeend'.split(' '));
      }, fs_error = function() {
        if (target_view && is_safari && typeof FileReader !== 'undefined') {
          var reader = new FileReader;
          reader.onloadend = function() {
            var base64Data = reader.result;
            target_view.location.href = 'data:attachment/file' + base64Data.slice(base64Data.search(/[,;]/));
            filesaver.readyState = filesaver.DONE;
            dispatch_all();
          };
          reader.readAsDataURL(blob);
          filesaver.readyState = filesaver.INIT;
          return;
        }
        if (blob_changed || !object_url) {
          object_url = get_URL().createObjectURL(blob);
        }
        if (target_view) {
          target_view.location.href = object_url;
        } else {
          var new_tab = view.open(object_url, '_blank');
          if (new_tab === undefined && is_safari) {
            view.location.href = object_url;
          }
        }
        filesaver.readyState = filesaver.DONE;
        dispatch_all();
        revoke(object_url);
      }, abortable = function(func) {
        return function() {
          if (filesaver.readyState !== filesaver.DONE) {
            return func.apply(this, arguments);
          }
        };
      }, create_if_not_found = {create:true, exclusive:false}, slice;
      filesaver.readyState = filesaver.INIT;
      if (!name) {
        name = 'download';
      }
      if (can_use_save_link) {
        object_url = get_URL().createObjectURL(blob);
        setTimeout(function() {
          save_link.href = object_url;
          save_link.download = name;
          click(save_link);
          dispatch_all();
          revoke(object_url);
          filesaver.readyState = filesaver.DONE;
        });
        return;
      }
      if (view.chrome && type && type !== force_saveable_type) {
        slice = blob.slice || blob.webkitSlice;
        blob = slice.call(blob, 0, blob.size, force_saveable_type);
        blob_changed = true;
      }
      if (webkit_req_fs && name !== 'download') {
        name += '.download';
      }
      if (type === force_saveable_type || webkit_req_fs) {
        target_view = view;
      }
      if (!req_fs) {
        fs_error();
        return;
      }
      fs_min_size += blob.size;
      req_fs(view.TEMPORARY, fs_min_size, abortable(function(fs) {
        fs.root.getDirectory('saved', create_if_not_found, abortable(function(dir) {
          var save = function() {
            dir.getFile(name, create_if_not_found, abortable(function(file) {
              file.createWriter(abortable(function(writer) {
                writer.onwriteend = function(event) {
                  target_view.location.href = file.toURL();
                  filesaver.readyState = filesaver.DONE;
                  dispatch(filesaver, 'writeend', event);
                  revoke(file);
                };
                writer.onerror = function() {
                  var error = writer.error;
                  if (error.code !== error.ABORT_ERR) {
                    fs_error();
                  }
                };
                'writestart progress write abort'.split(' ').forEach(function(event) {
                  writer['on' + event] = filesaver['on' + event];
                });
                writer.write(blob);
                filesaver.abort = function() {
                  writer.abort();
                  filesaver.readyState = filesaver.DONE;
                };
                filesaver.readyState = filesaver.WRITING;
              }), fs_error);
            }), fs_error);
          };
          dir.getFile(name, {create:false}, abortable(function(file) {
            file.remove();
            save();
          }), abortable(function(ex) {
            if (ex.code === ex.NOT_FOUND_ERR) {
              save();
            } else {
              fs_error();
            }
          }));
        }), fs_error);
      }), fs_error);
    }, FS_proto = FileSaver.prototype, saveAs = function(blob, name, no_auto_bom) {
      return new FileSaver(blob, name, no_auto_bom);
    };
    if (typeof navigator !== 'undefined' && navigator.msSaveOrOpenBlob) {
      return function(blob, name, no_auto_bom) {
        if (!no_auto_bom) {
          blob = auto_bom(blob);
        }
        return navigator.msSaveOrOpenBlob(blob, name || 'download');
      };
    }
    FS_proto.abort = function() {
      var filesaver = this;
      filesaver.readyState = filesaver.DONE;
      dispatch(filesaver, 'abort');
    };
    FS_proto.readyState = FS_proto.INIT = 0;
    FS_proto.WRITING = 1;
    FS_proto.DONE = 2;
    FS_proto.error = FS_proto.onwritestart = FS_proto.onprogress = FS_proto.onwrite = FS_proto.onabort = FS_proto.onerror = FS_proto.onwriteend = null;
    return saveAs;
  }(typeof self !== 'undefined' && self || typeof window !== 'undefined' && window || this.content);
  if (typeof module !== 'undefined' && module.exports) {
    module.exports.saveAs = saveAs;
  } else {
    if (typeof define !== 'undefined' && define !== null && define.amd !== null) {
      define([], function() {
        return saveAs;
      });
    }
  }
  var saveTextAs = window.saveTextAs || function(textContent, fileName, charset) {
    fileName = fileName || 'download.txt';
    charset = charset || 'utf-8';
    textContent = (textContent || '').replace(/\r?\n/g, '\r\n');
    if (saveAs && Blob) {
      var blob = new Blob([textContent], {type:'text/plain;charset\x3d' + charset});
      saveAs(blob, fileName);
      return true;
    } else {
      var saveTxtWindow = window.frames.saveTxtWindow;
      if (!saveTxtWindow) {
        saveTxtWindow = document.createElement('iframe');
        saveTxtWindow.id = 'saveTxtWindow';
        saveTxtWindow.style.display = 'none';
        document.body.insertBefore(saveTxtWindow, null);
        saveTxtWindow = window.frames.saveTxtWindow;
        if (!saveTxtWindow) {
          saveTxtWindow = File.popup || window.open('', '_temp', 'width\x3d100,height\x3d100');
          if (!saveTxtWindow) {
            return false;
          }
        }
      }
      var doc = saveTxtWindow.document;
      doc.open('text/html', 'replace');
      doc.charset = charset;
      doc.write(textContent);
      doc.close();
      var retValue = doc.execCommand('SaveAs', null, fileName);
      saveTxtWindow.close();
      return retValue;
    }
  };
  File.saveAs = function(content, filename, charset, mimeType) {
    var deferred;
    if (this.requiresPopup()) {
      return this.downloadBinaryAs(content, filename, charset || 'UTF-8', mimeType || 'text/plain');
    } else {
      deferred = new Ext.Deferred;
      if (saveTextAs(content, filename, charset)) {
        deferred.resolve();
      } else {
        deferred.reject();
      }
      return deferred.promise;
    }
  };
  if (saveAs && Blob) {
    File.saveBlobAs = function(textContent, fileName, charset, mimeType) {
      var deferred = new Ext.Deferred;
      var uint8 = new Uint8Array(textContent.length), len = uint8.length, bType = {type:mimeType || 'application/octet-stream'}, blob, i;
      for (i = 0; i < len; i++) {
        uint8[i] = textContent.charCodeAt(i);
      }
      blob = new Blob([uint8], bType);
      saveAs(blob, fileName);
      deferred.resolve();
      return deferred.promise;
    };
  }
});
Ext.define('Ext.exporter.Base', {mixins:['Ext.mixin.Factoryable'], alias:'exporter.base', requires:['Ext.exporter.data.Table', 'Ext.exporter.file.Style', 'Ext.exporter.File'], config:{data:null, showSummary:true, title:null, author:'Sencha', fileName:'export.txt', charset:'UTF-8', mimeType:'text/plain', binary:false}, constructor:function(config) {
  this.initConfig(config || {});
  Ext.exporter.File.initializePopup(this.getBinary());
  return this.callParent([config]);
}, destroy:function() {
  this.setData(Ext.destroy(this.getData()));
  this.callParent();
}, getContent:Ext.identityFn, saveAs:function() {
  var me = this, deferred = new Ext.Deferred;
  Ext.asap(me.delayedSave, me, [deferred]);
  return deferred.promise;
}, delayedSave:function(deferred) {
  var me = this, fn = me.getBinary() ? 'saveBinaryAs' : 'saveAs', promise = Ext.exporter.File[fn](me.getContent(), me.getFileName(), me.getCharset(), me.getMimeType());
  promise.then(function() {
    deferred.resolve();
  }, function(msg) {
    deferred.reject(msg);
  });
}, getColumnCount:function(columns) {
  var s = 0;
  if (!columns) {
    return s;
  }
  for (var i = 0; i < columns.length; i++) {
    if (!columns[i].columns) {
      s += 1;
    } else {
      s += this.getColumnCount(columns[i].columns);
    }
  }
  return s;
}, applyData:function(data) {
  if (!data || data.isDataTable) {
    return data;
  }
  return new Ext.exporter.data.Table(data);
}});
Ext.define('Ext.overrides.exporter.Base', {override:'Ext.exporter.Base', applyTitle:function(title) {
  return title ? 'Produced by Ext JS Trial - ' + title : title;
}});
Ext.define('Ext.exporter.file.ooxml.Base', {extend:'Ext.exporter.file.Base', config:{tplAttributes:{$value:[], merge:function(newValue, oldValue) {
  return [].concat(newValue, oldValue);
}}, tplNonAttributes:{$value:['idPrefix', 'id', 'autoGenerateId', 'self', 'tplAttributes', 'tplNonAttributes'], merge:function(newValue, oldValue) {
  return [].concat(newValue, oldValue);
}}}, generateTplAttributes:false, processRenderData:function(data) {
  var attr = this.getTplAttributes(), nonAttr = this.getTplNonAttributes(), keys = Ext.Object.getAllKeys(data), len = keys.length, str = '', i, key;
  if (!this.generateTplAttributes) {
    data.attributes = '';
    return data;
  }
  for (i = 0; i < len; i++) {
    key = keys[i];
    if (attr && attr.length) {
      if (Ext.Array.indexOf(attr, key) >= 0 && data[key] !== null) {
        str += (str.length ? ' ' : '') + this.processTplAttribute(key, data[key]);
      }
    } else {
      if (nonAttr && nonAttr.length) {
        if (Ext.Array.indexOf(nonAttr, key) < 0 && data[key] !== null) {
          str += (str.length ? ' ' : '') + this.processTplAttribute(key, data[key]);
        }
      }
    }
  }
  data.attributes = str;
  return data;
}, processTplAttribute:function(attr, value) {
  var v = value;
  if (typeof value === 'boolean') {
    v = Number(value);
  } else {
    if (typeof value === 'string') {
      v = Ext.util.Base64._utf8_encode(Ext.util.Format.htmlEncode(value || ''));
    }
  }
  return attr + '\x3d"' + v + '"';
}});
Ext.define('Ext.exporter.file.ooxml.Relationship', {extend:'Ext.exporter.file.Base', isRelationship:true, config:{idPrefix:'rId', schema:'', target:'', parentFolder:null, path:null}, tpl:['\x3cRelationship Id\x3d"{id}" Type\x3d"{schema}" Target\x3d"{path}"/\x3e'], updateTarget:function(target) {
  this.calculatePath();
}, applyParentFolder:function(folder) {
  folder = folder || '';
  if (folder[folder.length - 1] == '/') {
    folder = folder.slice(0, folder.length - 1);
  }
  return folder;
}, updateParentFolder:function(folder) {
  this.calculatePath();
}, calculatePath:function() {
  var from = String(this.getParentFolder() || ''), to = String(this.getTarget() || ''), fromParts = from.split('/'), toParts = to.split('/'), length = Math.min(fromParts.length, toParts.length), samePartsLength = length, path = '', outputParts = [], i;
  for (i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }
  if (samePartsLength == 0) {
    path = to;
  } else {
    for (i = samePartsLength; i < fromParts.length; i++) {
      outputParts.push('..');
    }
    outputParts = outputParts.concat(toParts.slice(samePartsLength));
    path = outputParts.join('/');
  }
  this.setPath(path);
}});
Ext.define('Ext.exporter.file.ooxml.ContentType', {extend:'Ext.exporter.file.Base', isContentType:true, config:{tag:'Override', partName:'', contentType:'', extension:''}, tpl:['\x3c{tag}', '\x3ctpl if\x3d"extension"\x3e Extension\x3d"{extension}"\x3c/tpl\x3e', '\x3ctpl if\x3d"partName"\x3e PartName\x3d"{partName}"\x3c/tpl\x3e', '\x3ctpl if\x3d"contentType"\x3e ContentType\x3d"{contentType}"\x3c/tpl\x3e', '/\x3e']});
Ext.define('Ext.exporter.file.ooxml.Xml', {extend:'Ext.exporter.file.ooxml.Base', requires:['Ext.exporter.file.ooxml.Relationship', 'Ext.exporter.file.ooxml.ContentType'], config:{folder:null, fileName:null, path:null, relationship:null, contentType:null}, cachedConfig:{fileNameTemplate:'{fileName}.xml'}, tplNonAttributes:['path', 'relationship', 'contentType', 'fileName', 'folder', 'fileNameTemplate'], destroy:function() {
  this.setRelationship(null);
  this.setContentType(null);
  this.callParent();
}, applyFolder:function(folder) {
  folder = folder || '';
  if (folder[folder.length - 1] !== '/') {
    folder += '/';
  }
  return folder;
}, updateFolder:function() {
  this.generatePath();
}, updateFileName:function() {
  this.generatePath();
}, getFileNameFromTemplate:function() {
  var tpl = Ext.XTemplate.getTpl(this, '_fileNameTemplate');
  return tpl ? tpl.apply(this.getConfig()) : '';
}, generatePath:function() {
  this.setPath((this.getFolder() || '') + this.getFileNameFromTemplate());
}, updatePath:function(path) {
  var relationship = this.getRelationship(), type = this.getContentType();
  if (relationship) {
    relationship.setTarget(path);
  }
  if (type) {
    type.setPartName(path);
  }
}, applyRelationship:function(data) {
  if (!data || data.isRelationship) {
    return data;
  }
  return new Ext.exporter.file.ooxml.Relationship(data);
}, updateRelationship:function(data, oldData) {
  Ext.destroy(oldData);
}, applyContentType:function(data) {
  if (!data || data.isContentType) {
    return data;
  }
  return new Ext.exporter.file.ooxml.ContentType(data);
}, updateContentType:function(data, oldData) {
  Ext.destroy(oldData);
}, collectFiles:Ext.emptyFn});
Ext.define('Ext.exporter.file.ooxml.Relationships', {extend:'Ext.exporter.file.ooxml.Xml', isRelationships:true, currentIndex:1, config:{parentFolder:null, items:[]}, contentType:{contentType:'application/vnd.openxmlformats-package.relationships+xml'}, fileNameTemplate:'{fileName}.rels', tpl:['\x3c?xml version\x3d"1.0" encoding\x3d"UTF-8" standalone\x3d"yes"?\x3e', '\x3cRelationships xmlns\x3d"http://schemas.openxmlformats.org/package/2006/relationships"\x3e', '\x3ctpl if\x3d"items"\x3e\x3ctpl for\x3d"items.getRange()"\x3e{[values.render()]}\x3c/tpl\x3e\x3c/tpl\x3e', 
'\x3c/Relationships\x3e'], collectFiles:function(files) {
  var items = this.getItems(), length = items.length, folder = this.getParentFolder(), i;
  if (length) {
    for (i = 0; i < length; i++) {
      items.getAt(i).setParentFolder(folder);
    }
    files[this.getPath()] = this.render();
  }
}, applyFolder:function(folder, oldFolder) {
  folder = this.callParent([folder, oldFolder]);
  return folder + '_rels/';
}, applyItems:function(data, dataCollection) {
  return this.checkCollection(data, dataCollection, 'Ext.exporter.file.ooxml.Relationship');
}, updateItems:function(collection, oldCollection) {
  var me = this;
  if (oldCollection) {
    oldCollection.un({add:me.updateIds, remove:me.updateIds, scope:me});
  }
  if (collection) {
    collection.on({add:me.updateIds, remove:me.updateIds, scope:me});
  }
}, updateIds:function(items) {
  var i, len, item;
  if (!items) {
    return;
  }
  len = items.length;
  for (i = 0; i < len; i++) {
    item = items.getAt(i);
    item.setId('rId' + (i + 1));
  }
}, addRelationship:function(config) {
  return this.getItems().add(config || {});
}, removeRelationship:function(config) {
  return this.getItems().remove(config);
}});
Ext.define('Ext.exporter.file.ooxml.XmlRels', {extend:'Ext.exporter.file.ooxml.Xml', requires:['Ext.exporter.file.ooxml.Relationships'], config:{index:null, name:null, relationships:{contentType:{contentType:'application/vnd.openxmlformats-package.relationships+xml'}}}, cachedConfig:{nameTemplate:'{name}'}, tplNonAttributes:['index', 'relationships', 'nameTemplate'], contentType:{}, relationship:{}, fileNameTemplate:'{fileName}{index}.xml', destroy:function() {
  this.setRelationships(null);
  this.callParent();
}, updateFolder:function(folder, oldFolder) {
  var rels = this.getRelationships();
  if (rels) {
    rels.setFolder(folder);
  }
  this.callParent([folder, oldFolder]);
}, applyRelationships:function(data) {
  if (!data || data.isRelationships) {
    return data;
  }
  return new Ext.exporter.file.ooxml.Relationships(data);
}, updateRelationships:function(data, oldData) {
  Ext.destroy(oldData);
}, updateIndex:function() {
  this.generatePath();
}, generateName:function() {
  var tpl = Ext.XTemplate.getTpl(this, '_nameTemplate');
  this.setName(tpl ? tpl.apply(this.getConfig()) : '');
}, collectFiles:function(files) {
  this.collectRelationshipsFiles(files);
  files[this.getPath()] = this.render();
}, collectRelationshipsFiles:function(files) {
  var rels = this.getRelationships(), name = this.getFileName();
  if (rels) {
    rels.setFileName(name ? this.getFileNameFromTemplate() : '');
    rels.setParentFolder(this.getFolder());
    rels.collectFiles(files);
  }
}, collectContentTypes:function(types) {
  types.push(this.getContentType());
}});
Ext.define('Ext.exporter.file.zip.File', {extend:'Ext.Base', requires:['Ext.overrides.exporter.util.Format'], config:{path:'', data:null, dateTime:null, folder:false}, constructor:function(config) {
  var me = this;
  me.initConfig(config);
  if (!me.getDateTime()) {
    me.setDateTime(new Date);
  }
  return me.callParent([config]);
}, getId:function() {
  return this.getPath();
}, crc32:function(input, crc) {
  var table = this.self.crcTable, x = 0, y = 0, b = 0, isArray;
  if (typeof input === 'undefined' || !input.length) {
    return 0;
  }
  isArray = typeof input !== 'string';
  if (typeof crc == 'undefined') {
    crc = 0;
  }
  crc = crc ^ -1;
  for (var i = 0, iTop = input.length; i < iTop; i++) {
    b = isArray ? input[i] : input.charCodeAt(i);
    y = (crc ^ b) & 255;
    x = table[y];
    crc = crc >>> 8 ^ x;
  }
  return crc ^ -1;
}, getHeader:function(offset) {
  var data = this.getData(), path = this.getPath(), utfName = Ext.util.Base64._utf8_encode(path), useUTF8 = utfName !== path, dateTime = this.getDateTime(), extraFields = '', unicodePathExtraField = '', decToHex = Ext.util.Format.decToHex, header = '', dosTime, dosDate, fileHeader, dirHeader;
  dosTime = dateTime.getHours();
  dosTime = dosTime << 6;
  dosTime = dosTime | dateTime.getMinutes();
  dosTime = dosTime << 5;
  dosTime = dosTime | dateTime.getSeconds() / 2;
  dosDate = dateTime.getFullYear() - 1980;
  dosDate = dosDate << 4;
  dosDate = dosDate | dateTime.getMonth() + 1;
  dosDate = dosDate << 5;
  dosDate = dosDate | dateTime.getDate();
  if (useUTF8) {
    unicodePathExtraField = decToHex(1, 1) + decToHex(this.crc32(utfName), 4) + utfName;
    extraFields += 'up' + decToHex(unicodePathExtraField.length, 2) + unicodePathExtraField;
  }
  header += '\n\x00';
  header += useUTF8 ? '\x00\b' : '\x00\x00';
  header += '\x00\x00';
  header += decToHex(dosTime, 2);
  header += decToHex(dosDate, 2);
  header += decToHex(data ? this.crc32(data) : 0, 4);
  header += decToHex(data ? data.length : 0, 4);
  header += decToHex(data ? data.length : 0, 4);
  header += decToHex(utfName.length, 2);
  header += decToHex(extraFields.length, 2);
  fileHeader = 'PK' + header + utfName + extraFields;
  dirHeader = 'PK' + '\x00' + header + '\x00\x00' + '\x00\x00' + '\x00\x00' + (this.getFolder() === true ? '\x00\x00\x00' : '\x00\x00\x00\x00') + decToHex(offset, 4) + utfName + extraFields;
  return {fileHeader:fileHeader, dirHeader:dirHeader, data:data || ''};
}}, function(File) {
  var c, table = [];
  for (var n = 0; n < 256; n++) {
    c = n;
    for (var k = 0; k < 8; k++) {
      c = c & 1 ? 3.988292384E9 ^ c >>> 1 : c >>> 1;
    }
    table[n] = c;
  }
  File.crcTable = table;
});
Ext.define('Ext.exporter.file.zip.Folder', {extend:'Ext.exporter.file.zip.File', folder:true});
Ext.define('Ext.exporter.file.zip.Archive', {extend:'Ext.exporter.file.Base', requires:['Ext.exporter.file.zip.Folder'], config:{folders:[], files:[]}, destroy:function() {
  this.setFolders(null);
  this.setFiles(null);
  this.callParent();
}, applyFolders:function(data, dataCollection) {
  return this.checkCollection(data, dataCollection, 'Ext.exporter.file.zip.Folder');
}, applyFiles:function(data, dataCollection) {
  return this.checkCollection(data, dataCollection, 'Ext.exporter.file.zip.File');
}, updateFiles:function(collection, oldCollection) {
  var me = this;
  if (oldCollection) {
    oldCollection.un({add:me.onFileAdd, remove:me.onFileRemove, scope:me});
  }
  if (collection) {
    collection.on({add:me.onFileAdd, remove:me.onFileRemove, scope:me});
    me.onFileAdd(collection, {items:collection.getRange()});
  }
}, onFileAdd:function(collection, details) {
  var folders = this.getFolders(), items = details.items, length = items.length, i, item, folder;
  for (i = 0; i < length; i++) {
    item = items[i];
    folder = this.getParentFolder(item.getPath());
    if (folder) {
      folders.add({path:folder});
    }
  }
}, onFileRemove:function(collection, details) {
  Ext.destroy(details.items);
}, getParentFolder:function(path) {
  var lastSlash;
  if (path.slice(-1) == '/') {
    path = path.substring(0, path.length - 1);
  }
  lastSlash = path.lastIndexOf('/');
  return lastSlash > 0 ? path.substring(0, lastSlash + 1) : '';
}, addFile:function(config) {
  return this.getFiles().add(config || {});
}, removeFile:function(config) {
  return this.getFiles().remove(config);
}, getContent:function() {
  var fileData = '', dirData = '', localDirLength = 0, centralDirLength = 0, decToHex = Ext.util.Format.decToHex, files = [], len, dirEnd, i, file, header;
  Ext.Array.insert(files, 0, this._folders.items);
  Ext.Array.insert(files, files.length, this._files.items);
  len = files.length;
  for (i = 0; i < len; i++) {
    file = files[i];
    header = file.getHeader(localDirLength);
    localDirLength += header.fileHeader.length + header.data.length;
    centralDirLength += header.dirHeader.length;
    fileData += header.fileHeader + header.data;
    dirData += header.dirHeader;
  }
  dirEnd = 'PK' + '\x00\x00' + '\x00\x00' + decToHex(len, 2) + decToHex(len, 2) + decToHex(centralDirLength, 4) + decToHex(localDirLength, 4) + '\x00\x00';
  fileData += dirData + dirEnd;
  return fileData;
}});
Ext.define('Ext.exporter.file.ooxml.excel.Sheet', {extend:'Ext.exporter.file.ooxml.XmlRels', config:{workbook:null}, folder:'sheet', fileName:'sheet', nameTemplate:'Sheet{index}', fileNameTemplate:'{fileName}{index}.xml', nameLengthLimit:31, destroy:function() {
  this.callParent();
  this.setWorkbook(null);
}, updateIndex:function() {
  if (this._name == null) {
    this.generateName();
  }
  this.callParent(arguments);
}, applyName:function(value) {
  return Ext.util.Format.htmlEncode(Ext.String.ellipsis(String(value), this.nameLengthLimit));
}});
Ext.define('Ext.exporter.file.ooxml.excel.Column', {extend:'Ext.exporter.file.ooxml.Base', config:{min:1, max:1, width:10, autoFitWidth:false, hidden:false, styleId:null}, tpl:['\x3ccol ', 'min\x3d"{min}" ', 'max\x3d"{max}" ', 'width\x3d"{width}"', '\x3ctpl if\x3d"styleId"\x3e style\x3d"{styleId}"\x3c/tpl\x3e', '\x3ctpl if\x3d"hidden"\x3e hidden\x3d"1"\x3c/tpl\x3e', '\x3ctpl if\x3d"autoFitWidth"\x3e bestFit\x3d"1"\x3c/tpl\x3e', '\x3ctpl if\x3d"width !\x3d 10"\x3e customWidth\x3d"1"\x3c/tpl\x3e', 
'/\x3e']});
Ext.define('Ext.exporter.file.ooxml.excel.Cell', {extend:'Ext.exporter.file.Base', isCell:true, config:{row:null, dataType:null, showPhonetic:null, index:null, styleId:null, mergeAcross:null, mergeDown:null, value:null, serializeDateToNumber:true}, isMergedCell:false, tpl:['\x3cc r\x3d"{ref}"', '\x3ctpl if\x3d"value !\x3d null"\x3e t\x3d"{dataType}"\x3c/tpl\x3e', '\x3ctpl if\x3d"showPhonetic"\x3e ph\x3d"1"\x3c/tpl\x3e', '\x3ctpl if\x3d"styleId"\x3e s\x3d"{styleId}"\x3c/tpl\x3e', '\x3ctpl if\x3d"value \x3d\x3d null"\x3e/\x3e\x3ctpl else\x3e\x3e\x3cv\x3e{value}\x3c/v\x3e\x3c/c\x3e\x3c/tpl\x3e'], 
constructor:function(config) {
  var cfg = config;
  if (config == null || Ext.isDate(config) || Ext.isPrimitive(config)) {
    cfg = {value:config};
  }
  return this.callParent([cfg]);
}, destroy:function() {
  this.setRow(null);
  this.callParent();
}, getRef:function() {
  return this.getNotation(this._index) + this._row._index;
}, getRenderData:function() {
  var me = this, data = {}, ws = me._row && me._row._worksheet, wb = ws && ws._workbook;
  data.dataType = me._dataType;
  data.value = me._value;
  data.showPhonetic = me._showPhonetic;
  data.styleId = me._styleId;
  if (this.isMergedCell && ws) {
    ws.setMergedCellsNo(ws._mergedCellsNo + 1);
  }
  if (data.dataType === 's' && wb) {
    data.value = wb._sharedStrings.addString(data.value);
  }
  data.ref = this.getRef();
  return data;
}, applyValue:function(v) {
  var me = this, dt;
  if (v != null) {
    if (typeof v === 'number') {
      dt = 'n';
    } else {
      if (typeof v === 'string') {
        dt = 's';
        v = Ext.util.Format.stripTags(v);
      } else {
        if (v instanceof Date) {
          if (me.getSerializeDateToNumber()) {
            dt = 'n';
            v = me.dateValue(v);
          } else {
            dt = 'd';
            v = Ext.Date.format(v, 'Y-m-d\\TH:i:s.u');
          }
        } else {
          dt = 'b';
        }
      }
    }
    me.setDataType(dt);
  }
  return v;
}, updateMergeAcross:function(v) {
  this.isMergedCell = v || this._mergeDown;
}, updateMergeDown:function(v) {
  this.isMergedCell = v || this._mergeAcross;
}, getMergedCellRef:function() {
  var me = this, currIndex = me._index, rowIndex = me._row._index, mAcross = me._mergeAcross, mDown = me._mergeDown, s = me.getNotation(currIndex) + rowIndex + ':';
  if (mAcross) {
    currIndex += mAcross;
  }
  if (mDown) {
    rowIndex += mDown;
  }
  s += me.getNotation(currIndex) + rowIndex;
  return s;
}, getNotation:function(index) {
  var code = 65, length = 26, getChar = String.fromCharCode, r, n;
  if (index <= 0) {
    index = 1;
  }
  n = Math.floor(index / length);
  r = index % length;
  if (n === 0 || index === length) {
    return getChar(code + index - 1);
  } else {
    if (r === 0) {
      return this.getNotation(n - 1) + 'Z';
    } else {
      if (n < length) {
        return getChar(code + n - 1) + getChar(code + r - 1);
      } else {
        return this.getNotation(n) + getChar(code + r - 1);
      }
    }
  }
}, dateValue:function(d) {
  return 25569 + (d.getTime() - d.getTimezoneOffset() * 60 * 1000) / (1000 * 60 * 60 * 24);
}});
Ext.define('Ext.exporter.file.ooxml.excel.Row', {extend:'Ext.exporter.file.Base', requires:['Ext.exporter.file.ooxml.excel.Cell'], config:{collapsed:null, hidden:null, height:null, outlineLevel:null, showPhonetic:null, index:null, styleId:null, worksheet:null, cells:[], cachedCells:null}, tpl:['\x3crow', '\x3ctpl if\x3d"index"\x3e r\x3d"{index}"\x3c/tpl\x3e', '\x3ctpl if\x3d"collapsed"\x3e collapsed\x3d"{collapsed}"\x3c/tpl\x3e', '\x3ctpl if\x3d"hidden"\x3e hidden\x3d"1"\x3c/tpl\x3e', '\x3ctpl if\x3d"height"\x3e ht\x3d"{height}" customHeight\x3d"1"\x3c/tpl\x3e', 
'\x3ctpl if\x3d"outlineLevel"\x3e outlineLevel\x3d"{outlineLevel}"\x3c/tpl\x3e', '\x3ctpl if\x3d"styleId"\x3e s\x3d"{styleId}" customFormat\x3d"1"\x3c/tpl\x3e', '\x3ctpl if\x3d"cachedCells"\x3e', '\x3e{cachedCells}\x3c/row\x3e', '\x3ctpl elseif\x3d"cells \x26\x26 cells.length"\x3e', '\x3e\x3ctpl for\x3d"cells.items"\x3e{[values.render()]}\x3c/tpl\x3e\x3c/row\x3e', '\x3ctpl else\x3e', '/\x3e', '\x3c/tpl\x3e'], lastCellIndex:1, constructor:function(config) {
  var cfg = config;
  if (Ext.isArray(config)) {
    cfg = {cells:config};
  }
  return this.callParent([cfg]);
}, destroy:function() {
  this.setWorksheet(null);
  this.callParent();
}, applyCells:function(data, dataCollection) {
  return this.checkCollection(data, dataCollection, 'Ext.exporter.file.ooxml.excel.Cell');
}, updateCells:function(collection, oldCollection) {
  var me = this;
  if (oldCollection) {
    collection.un({add:me.onCellAdd, remove:me.onCellRemove, scope:me});
  }
  if (collection) {
    collection.on({add:me.onCellAdd, remove:me.onCellRemove, scope:me});
    me.onCellAdd(collection, {items:collection.getRange()});
  }
}, onCellAdd:function(collection, details) {
  var items = details.items, length = items.length, i, item, index;
  for (i = 0; i < length; i++) {
    item = items[i];
    item.setRow(this);
    index = item._index;
    if (!index) {
      item.setIndex(this.lastCellIndex++);
    } else {
      this.lastCellIndex = Math.max(collection.length, index) + 1;
    }
  }
}, onCellRemove:function(collection, details) {
  Ext.destroy(details.items);
  this.updateCellIndexes();
}, addCell:function(config) {
  if (!this._cells) {
    this.setCells([]);
  }
  return this._cells.add(config || {});
}, getCell:function(id) {
  return this._cells ? this._cells.get(id) : null;
}, beginCellRendering:function() {
  var me = this;
  me.tempCells = [];
  me.startCaching = true;
  me.lastCellIndex = 1;
  if (!me.cachedCell) {
    me.cachedCell = new Ext.exporter.file.ooxml.excel.Cell({row:me});
    me.cachedCellConfig = me.cachedCell.getConfig();
    me.cachedCellConfig.id = null;
  }
}, endCellRendering:function() {
  var me = this;
  me.setCachedCells(me.tempCells.join(''));
  me.tempCells = null;
  me.startCaching = false;
  me.lastCellIndex = 1;
}, renderCells:function(cells) {
  var me = this, ret = {first:null, last:null, row:'', merged:''}, len = cells.length, mergedCells = [], i, cell, config, cache, index;
  me.beginCellRendering();
  cache = me.cachedCell;
  for (i = 0; i < len; i++) {
    cell = cells[i] || {};
    if (typeof cell === 'object' && !(cell instanceof Date)) {
      config = cell;
    } else {
      config = {value:cell};
    }
    Ext.applyIf(config, me.cachedCellConfig);
    cache.setValue(config.value);
    cache.setShowPhonetic(config.showPhonetic);
    cache.setStyleId(config.styleId);
    cache.setMergeAcross(config.mergeAcross);
    cache.setMergeDown(config.mergeDown);
    cache.setIndex(config.index);
    index = cache.getIndex();
    if (!index) {
      cache.setIndex(me.lastCellIndex++);
    } else {
      me.lastCellIndex = Math.max(me.lastCellIndex, index) + 1;
    }
    if (i === 0) {
      ret.first = ret.last = cache.getRef();
    } else {
      if (i === len - 1) {
        ret.last = cache.getRef();
      }
    }
    me.tempCells.push(cache.render());
    if (cache.isMergedCell) {
      mergedCells.push('\x3cmergeCell ref\x3d"' + cache.getMergedCellRef() + '"/\x3e');
    }
  }
  me.endCellRendering();
  ret.row = me.render();
  ret.merged = mergedCells.join('');
  return ret;
}});
Ext.define('Ext.exporter.file.ooxml.excel.Location', {extend:'Ext.exporter.file.ooxml.Base', config:{ref:null, firstHeaderRow:null, firstDataRow:null, firstDataCol:null, rowPageCount:null, colPageCount:null}, generateTplAttributes:true, tpl:['\x3clocation {attributes}/\x3e']});
Ext.define('Ext.exporter.file.ooxml.excel.FieldItem', {extend:'Ext.exporter.file.ooxml.Base', config:{c:null, d:null, e:null, f:null, h:null, m:null, n:null, s:null, sd:null, t:null, x:null}, generateTplAttributes:true, tpl:['\x3citem {attributes}/\x3e']});
Ext.define('Ext.exporter.file.ooxml.excel.PivotAreaReference', {extend:'Ext.exporter.file.ooxml.Base', config:{avgSubtotal:null, byPosition:null, count:null, countASubtotal:null, countSubtotal:null, defaultSubtotal:null, field:null, maxSubtotal:null, minSubtotal:null, productSubtotal:null, relative:null, selected:null, stdDevPSubtotal:null, stdDevSubtotal:null, sumSubtotal:null, varPSubtotal:null, varSubtotal:null, items:[]}, tplNonAttributes:['items'], generateTplAttributes:true, tpl:['\x3creference {attributes}\x3e', 
'\x3ctpl if\x3d"items"\x3e\x3ctpl for\x3d"items"\x3e\x3cx v\x3d"{.}"/\x3e\x3c/tpl\x3e\x3c/tpl\x3e', '\x3c/reference\x3e'], getCount:function() {
  return this.getItems().length;
}, applyItems:function(items) {
  return items !== null ? Ext.Array.from(items) : null;
}});
Ext.define('Ext.exporter.file.ooxml.excel.PivotArea', {extend:'Ext.exporter.file.ooxml.Base', requires:['Ext.exporter.file.ooxml.excel.PivotAreaReference'], config:{axis:null, cacheIndex:null, collapsedLevelsAreSubtotals:null, dataOnly:null, field:null, fieldPosition:null, grandCol:null, grandRow:null, labelOnly:null, offset:null, outline:null, type:null, references:null}, tplNonAttributes:['references'], generateTplAttributes:true, tpl:['\x3cpivotArea {attributes}\x3e', '\x3ctpl if\x3d"references"\x3e\x3creferences count\x3d"{references.length}"\x3e\x3ctpl for\x3d"references.getRange()"\x3e{[values.render()]}\x3c/tpl\x3e\x3c/references\x3e\x3c/tpl\x3e', 
'\x3c/pivotArea\x3e'], applyReferences:function(data, dataCollection) {
  return this.checkCollection(data, dataCollection, 'Ext.exporter.file.ooxml.excel.PivotAreaReference');
}});
Ext.define('Ext.exporter.file.ooxml.excel.AutoSortScope', {extend:'Ext.exporter.file.ooxml.Base', requires:['Ext.exporter.file.ooxml.excel.PivotArea'], config:{pivotArea:{}}, tpl:['\x3cautoSortScope\x3e{[values.pivotArea.render()]}\x3c/autoSortScope\x3e'], destroy:function() {
  this.setPivotArea(null);
  this.callParent();
}, applyPivotArea:function(data) {
  if (!data || data.isInstance) {
    return data;
  }
  return new Ext.exporter.file.ooxml.excel.PivotArea(data);
}, updatePivotArea:function(data, oldData) {
  Ext.destroy(oldData);
}});
Ext.define('Ext.exporter.file.ooxml.excel.PivotField', {extend:'Ext.exporter.file.ooxml.Base', requires:['Ext.exporter.file.ooxml.excel.FieldItem', 'Ext.exporter.file.ooxml.excel.AutoSortScope'], config:{allDrilled:null, autoShow:null, avgSubtotal:null, axis:null, compact:null, countASubtotal:null, countSubtotal:null, dataField:null, dataSourceSort:null, defaultAttributeDrillState:null, defaultSubtotal:null, dragOff:null, dragToCol:null, dragToData:null, dragToPage:null, dragToRow:null, hiddenLevel:null, 
hideNewItems:null, includeNewItemsInFilter:null, insertBlankRow:null, insertPageBreak:null, itemPageCount:null, maxSubtotal:null, measureFilter:null, minSubtotal:null, multipleItemSelectionAllowed:null, nonAutoSortDefault:null, numFmtId:null, outline:null, productSubtotal:null, rankBy:null, serverField:null, showAll:null, showDropDowns:null, showPropAsCaption:null, showPropCell:null, showPropTip:null, sortType:null, stdDevPSubtotal:null, stdDevSubtotal:null, subtotalCaption:null, subtotalTop:null, 
sumSubtotal:null, topAutoShow:null, uniqueMemberProperty:null, varPSubtotal:null, varSubtotal:null, items:null, autoSortScope:null}, tplNonAttributes:['items', 'autoSortScope'], generateTplAttributes:true, tpl:['\x3ctpl if\x3d"items || autoSortScope"\x3e', '\x3cpivotField {attributes}\x3e', '\x3ctpl if\x3d"items"\x3e\x3citems count\x3d"{items.length}"\x3e\x3ctpl for\x3d"items.getRange()"\x3e{[values.render()]}\x3c/tpl\x3e\x3c/items\x3e\x3c/tpl\x3e', '\x3ctpl if\x3d"autoSortScope"\x3e{[values.autoSortScope.render()]}\x3c/tpl\x3e', 
'\x3c/pivotField\x3e', '\x3ctpl else\x3e', '\x3cpivotField {attributes} /\x3e', '\x3c/tpl\x3e'], destroy:function() {
  this.setAutoSortScope(null);
  this.callParent();
}, applyItems:function(data, dataCollection) {
  return this.checkCollection(data, dataCollection, 'Ext.exporter.file.ooxml.excel.FieldItem');
}, applyAutoSortScope:function(data) {
  if (!data || data.isInstance) {
    return data;
  }
  return new Ext.exporter.file.ooxml.excel.AutoSortScope(data);
}, updateAutoSortScope:function(data, oldData) {
  Ext.destroy(oldData);
}});
Ext.define('Ext.exporter.file.ooxml.excel.Field', {extend:'Ext.exporter.file.ooxml.Base', config:{x:null}, tpl:['\x3cfield x\x3d"{x}"/\x3e']});
Ext.define('Ext.exporter.file.ooxml.excel.Item', {extend:'Ext.exporter.file.ooxml.Base', config:{i:null, r:null, t:null, x:null}, tpl:['\x3ctpl if\x3d"x"\x3e\x3ci{attr}\x3e{x}\x3c/i\x3e\x3ctpl else\x3e\x3ci{attr}/\x3e\x3c/tpl\x3e'], getRenderData:function() {
  var data = this.callParent(), len = data.x ? data.x.length : 0, str = '', attr = '', i;
  for (i = 0; i < len; i++) {
    if (data.x[i] > 0) {
      str += '\x3cx v\x3d"' + data.x[i] + '"/\x3e';
    } else {
      str += '\x3cx/\x3e';
    }
  }
  data.x = str;
  if (data.t) {
    attr += ' t\x3d"' + data.t + '"';
  }
  if (data.r > 0) {
    attr += ' r\x3d"' + data.r + '"';
  }
  if (data.i > 0) {
    attr += ' i\x3d"' + data.i + '"';
  }
  data.attr = attr;
  return data;
}, applyX:function(data) {
  return data != null ? Ext.Array.from(data) : null;
}});
Ext.define('Ext.exporter.file.ooxml.excel.DataField', {extend:'Ext.exporter.file.ooxml.Base', config:{baseField:null, baseItem:null, fld:null, name:null, numFmtId:null, showDataAs:null, subtotal:null}, generateTplAttributes:true, tpl:['\x3cdataField {attributes}/\x3e']});
Ext.define('Ext.exporter.file.ooxml.excel.Record', {extend:'Ext.exporter.file.ooxml.Base', config:{items:null}, tplNonAttributes:['items', 'stritems'], tpl:['\x3ctpl if\x3d"stritems"\x3e', '\x3cr\x3e', '{stritems}', '\x3c/r\x3e', '\x3ctpl else\x3e', '\x3cr/\x3e', '\x3c/tpl\x3e'], numberTpl:'\x3cn v\x3d"{0}"/\x3e', booleanTpl:'\x3cb v\x3d"{0}"/\x3e', stringTpl:'\x3cs v\x3d"{0}"/\x3e', dateTpl:'\x3cd v\x3d"{0}"/\x3e', constructor:function(config) {
  var cfg;
  if (Ext.isArray(config) || Ext.isDate(config) || Ext.isPrimitive(config)) {
    cfg = {items:config};
  } else {
    cfg = config;
  }
  return this.callParent([cfg]);
}, getRenderData:function() {
  var me = this, data = me.callParent(), items = data.items, str = '', types = [], i, len, v, tpl;
  if (items) {
    len = items.length;
    for (i = 0; i < len; i++) {
      v = items[i];
      if (v == null || v === '') {
      } else {
        if (typeof v === 'string') {
          tpl = me.stringTpl;
          v = Ext.util.Base64._utf8_encode(Ext.util.Format.htmlEncode(v));
          types.push('s');
        } else {
          if (typeof v === 'boolean') {
            tpl = me.booleanTpl;
            types.push('b');
          } else {
            if (typeof v === 'number') {
              tpl = me.numberTpl;
              types.push('n');
            } else {
              if (v instanceof Date) {
                tpl = me.dateTpl;
                v = Ext.Date.format(v, 'Y-m-d\\TH:i:s.u');
                types.push('d');
              }
            }
          }
        }
        str += Ext.String.format(tpl, v);
      }
    }
  }
  data.stritems = str;
  return data;
}, applyItems:function(items) {
  return items !== null ? Ext.Array.from(items) : null;
}});
Ext.define('Ext.exporter.file.ooxml.excel.PivotCacheRecords', {extend:'Ext.exporter.file.ooxml.XmlRels', requires:['Ext.exporter.file.ooxml.excel.Record'], config:{items:[]}, folder:'/xl/pivotCache/', fileName:'pivotCacheRecords', contentType:{contentType:'application/vnd.openxmlformats-officedocument.spreadsheetml.pivotCacheRecords+xml'}, relationship:{schema:'http://schemas.openxmlformats.org/officeDocument/2006/relationships/pivotCacheRecords'}, tpl:['\x3c?xml version\x3d"1.0" encoding\x3d"UTF-8" standalone\x3d"yes"?\x3e', 
'\x3cpivotCacheRecords xmlns\x3d"http://schemas.openxmlformats.org/spreadsheetml/2006/main" ', 'xmlns:r\x3d"http://schemas.openxmlformats.org/officeDocument/2006/relationships" count\x3d"{items.length}"\x3e', '\x3ctpl for\x3d"items.getRange()"\x3e{[values.render()]}\x3c/tpl\x3e', '\x3c/pivotCacheRecords\x3e'], applyItems:function(data, dataCollection) {
  return this.checkCollection(data, dataCollection, 'Ext.exporter.file.ooxml.excel.Record');
}});
Ext.define('Ext.exporter.file.ooxml.excel.WorksheetSource', {extend:'Ext.exporter.file.ooxml.Base', config:{id:null, name:null, ref:null, sheet:null}, autoGenerateId:false, tplAttributes:['id', 'name', 'ref', 'sheet'], generateTplAttributes:true, tpl:['\x3cworksheetSource {attributes} /\x3e']});
Ext.define('Ext.exporter.file.ooxml.excel.CacheSource', {extend:'Ext.exporter.file.ooxml.Base', requires:['Ext.exporter.file.ooxml.excel.WorksheetSource'], config:{type:'worksheet', worksheetSource:{}}, tplNonAttributes:['worksheetSource'], generateTplAttributes:true, tpl:['\x3ccacheSource {attributes}\x3e', '\x3ctpl if\x3d"type \x3d\x3d \'worksheet\'"\x3e', '{[values.worksheetSource.render()]}', '\x3c/tpl\x3e', '\x3c/cacheSource\x3e'], destroy:function() {
  this.setWorksheetSource(null);
  this.callParent();
}, applyWorksheetSource:function(data) {
  if (!data || data.isInstance) {
    return data;
  }
  return new Ext.exporter.file.ooxml.excel.WorksheetSource(data);
}, updateWorksheetSource:function(data, oldData) {
  Ext.destroy(oldData);
}});
Ext.define('Ext.exporter.file.ooxml.excel.SharedItems', {extend:'Ext.exporter.file.ooxml.Base', config:{containsBlank:null, containsDate:null, containsInteger:null, containsMixedTypes:null, containsNonDate:null, containsNumber:null, containsSemiMixedTypes:null, containsString:null, longText:null, maxDate:null, maxValue:null, minDate:null, minValue:null, items:null}, tplNonAttributes:['items', 'stritems'], generateTplAttributes:true, tpl:['\x3ctpl if\x3d"stritems"\x3e', '\x3csharedItems {attributes}\x3e', 
'{stritems}', '\x3c/sharedItems\x3e', '\x3ctpl else\x3e', '\x3csharedItems {attributes}/\x3e', '\x3c/tpl\x3e'], numberTpl:'\x3cn v\x3d"{0}"/\x3e', booleanTpl:'\x3cb v\x3d"{0}"/\x3e', stringTpl:'\x3cs v\x3d"{0}"/\x3e', dateTpl:'\x3cd v\x3d"{0}"/\x3e', getRenderData:function() {
  var me = this, data = me.callParent(), items = data.items, str = '', hasBlank = false, hasBool = false, hasNumber = false, hasDate = false, hasString = false, hasFloat = false, count = 0, types = [], minValue = null, maxValue = null, i, len, v, tpl;
  if (items) {
    len = items.length;
    for (i = 0; i < len; i++) {
      v = items[i];
      if (v == null || v === '') {
        hasBlank = true;
      } else {
        count++;
        if (typeof v === 'string') {
          hasString = true;
          tpl = me.stringTpl;
          v = Ext.util.Base64._utf8_encode(Ext.util.Format.htmlEncode(v));
          types.push('s');
        } else {
          if (typeof v === 'boolean') {
            hasBool = true;
            tpl = me.booleanTpl;
            types.push('b');
          } else {
            if (typeof v === 'number') {
              hasNumber = true;
              tpl = me.numberTpl;
              minValue = Math.min(minValue, v);
              maxValue = Math.max(maxValue, v);
              if (String(v).indexOf('.') >= 0) {
                hasFloat = true;
              }
              types.push('n');
            } else {
              if (v instanceof Date) {
                hasDate = true;
                tpl = me.dateTpl;
                v = Ext.Date.format(v, 'Y-m-d\\TH:i:s.u');
                types.push('d');
              }
            }
          }
        }
        str += Ext.String.format(tpl, v);
      }
    }
  }
  if (count > 0) {
    data.count = count;
  }
  data.stritems = str;
  if (hasDate) {
    data.containsSemiMixedTypes = hasString;
    data.containsDate = true;
    data.stritems = '';
  }
  if (hasNumber) {
    data.containsSemiMixedTypes = hasString;
    data.containsNumber = true;
    data.minValue = minValue;
    data.maxValue = maxValue;
    if (!hasFloat) {
      data.containsInteger = true;
    }
  }
  data.containsString = hasString;
  len = Ext.Array.unique(types);
  if (len > 0) {
    data.containsMixedTypes = len > 1;
  }
  return data;
}, applyItems:function(items) {
  return items !== null ? Ext.Array.from(items) : null;
}, updateMinValue:function(v) {
  if (v != null) {
    this.setContainsNumber(true);
  }
}, updateMaxValue:function(v) {
  if (v != null) {
    this.setContainsNumber(true);
  }
}, applyMinDate:function(v) {
  if (v) {
    v = Ext.Date.format(v, 'Y-m-d\\TH:i:s.u');
  }
  return v;
}, updateMinDate:function(v) {
  if (v != null) {
    this.setContainsDate(true);
  }
}, applyMaxDate:function(v) {
  if (v) {
    v = Ext.Date.format(v, 'Y-m-d\\TH:i:s.u');
  }
  return v;
}, updateMaxDate:function(v) {
  if (v != null) {
    this.setContainsDate(true);
  }
}});
Ext.define('Ext.exporter.file.ooxml.excel.CacheField', {extend:'Ext.exporter.file.ooxml.Base', requires:['Ext.exporter.file.ooxml.excel.SharedItems'], config:{caption:null, databaseField:null, formula:null, hierarchy:null, level:null, mappingCount:null, memberPropertyField:null, name:null, numFmtId:null, propertyName:null, serverField:null, sqlType:null, uniqueList:null, sharedItems:{}, fieldGroup:null, mpMap:null}, tplNonAttributes:['sharedItems', 'fieldGroup', 'mpMap'], generateTplAttributes:true, 
tpl:['\x3ccacheField {attributes}\x3e', '\x3ctpl if\x3d"sharedItems"\x3e{[values.sharedItems.render()]}\x3c/tpl\x3e', '\x3c/cacheField\x3e'], destroy:function() {
  this.setSharedItems(null);
  this.callParent();
}, applySharedItems:function(data) {
  if (!data || data.isInstance) {
    return data;
  }
  return new Ext.exporter.file.ooxml.excel.SharedItems(data);
}, updateSharedItems:function(data, oldData) {
  Ext.destroy(oldData);
}});
Ext.define('Ext.exporter.file.ooxml.excel.PivotCache', {extend:'Ext.exporter.file.ooxml.Base', config:{id:null, cacheId:null}, autoGenerateId:false, tpl:['\x3cpivotCache cacheId\x3d"{cacheId}" r:id\x3d"{id}"/\x3e']});
Ext.define('Ext.exporter.file.ooxml.excel.PivotCacheDefinition', {extend:'Ext.exporter.file.ooxml.XmlRels', requires:['Ext.exporter.file.ooxml.excel.PivotCacheRecords', 'Ext.exporter.file.ooxml.excel.CacheSource', 'Ext.exporter.file.ooxml.excel.CacheField', 'Ext.exporter.file.ooxml.excel.PivotCache'], config:{backgroundQuery:null, createdVersion:null, enableRefresh:null, invalid:null, minRefreshableVersion:null, missingItemsLimit:null, optimizeMemory:null, recordCount:null, refreshedBy:null, refreshedDateIso:null, 
refreshedVersion:null, refreshOnLoad:null, saveData:null, supportAdvancedDrill:null, supportSubquery:null, tupleCache:null, upgradeOnRefresh:null, cacheRecords:{}, cacheSource:{}, cacheFields:null, pivotCache:{}}, folder:'/xl/pivotCache/', fileName:'pivotCacheDefinition', contentType:{contentType:'application/vnd.openxmlformats-officedocument.spreadsheetml.pivotCacheDefinition+xml'}, relationship:{schema:'http://schemas.openxmlformats.org/officeDocument/2006/relationships/pivotCacheDefinition'}, 
tplNonAttributes:['cacheRecords', 'cacheSource', 'cacheFields', 'pivotCache'], generateTplAttributes:true, tpl:['\x3c?xml version\x3d"1.0" encoding\x3d"UTF-8" standalone\x3d"yes"?\x3e', '\x3cpivotCacheDefinition xmlns\x3d"http://schemas.openxmlformats.org/spreadsheetml/2006/main" ', 'xmlns:r\x3d"http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:id\x3d"{[values.relationship.getId()]}" {attributes}\x3e', '{[values.cacheSource.render()]}', '\x3ctpl if\x3d"cacheFields"\x3e\x3ccacheFields count\x3d"{cacheFields.length}"\x3e\x3ctpl for\x3d"cacheFields.getRange()"\x3e{[values.render()]}\x3c/tpl\x3e\x3c/cacheFields\x3e\x3c/tpl\x3e', 
'\x3c/pivotCacheDefinition\x3e'], destroy:function() {
  this.setCacheRecords(null);
  this.setCacheSource(null);
  this.setPivotCache(null);
  this.callParent();
}, getRenderData:function() {
  var data = this.callParent(), records = this.getCacheRecords();
  if (records) {
    records = records.getItems();
    data.recordCount = records.length;
  }
  return data;
}, collectFiles:function(files) {
  var records = this.getCacheRecords();
  if (records) {
    records.collectFiles(files);
  }
  this.callParent([files]);
}, collectContentTypes:function(types) {
  var records = this.getCacheRecords();
  if (records) {
    records.collectContentTypes(types);
  }
  this.callParent([types]);
}, updateIndex:function(index, oldIndex) {
  var cache = this.getCacheRecords();
  if (cache) {
    cache.setIndex(index);
  }
  this.callParent([index, oldIndex]);
}, applyPivotCache:function(data) {
  if (!data || data.isInstance) {
    return data;
  }
  return new Ext.exporter.file.ooxml.excel.PivotCache(data);
}, updatePivotCache:function(data, oldData) {
  Ext.destroy(oldData);
}, applyCacheRecords:function(data) {
  if (!data || data.isInstance) {
    return data;
  }
  return new Ext.exporter.file.ooxml.excel.PivotCacheRecords(data);
}, updateCacheRecords:function(data, oldData) {
  var rels = this.getRelationships(), rel;
  if (oldData) {
    rels.removeRelationship(oldData.getRelationship());
  }
  Ext.destroy(oldData);
  if (data) {
    rel = data.getRelationship();
    rels.addRelationship(rel);
    this.setId(rel.getId());
  }
}, applyCacheSource:function(data) {
  if (!data || data.isInstance) {
    return data;
  }
  return new Ext.exporter.file.ooxml.excel.CacheSource(data);
}, updateCacheSource:function(data, oldData) {
  Ext.destroy(oldData);
}, applyCacheFields:function(data, dataCollection) {
  return this.checkCollection(data, dataCollection, 'Ext.exporter.file.ooxml.excel.CacheField');
}});
Ext.define('Ext.exporter.file.ooxml.excel.PivotTableStyleInfo', {extend:'Ext.exporter.file.ooxml.Base', config:{name:'PivotStyleLight2', showColHeaders:true, showColStripes:null, showLastColumn:true, showRowHeaders:true, showRowStripes:null}, generateTplAttributes:true, tpl:['\x3cpivotTableStyleInfo {attributes}/\x3e']});
Ext.define('Ext.exporter.file.ooxml.excel.PivotTable', {extend:'Ext.exporter.file.ooxml.XmlRels', requires:['Ext.exporter.file.ooxml.excel.Location', 'Ext.exporter.file.ooxml.excel.PivotField', 'Ext.exporter.file.ooxml.excel.Field', 'Ext.exporter.file.ooxml.excel.Item', 'Ext.exporter.file.ooxml.excel.DataField', 'Ext.exporter.file.ooxml.excel.PivotCacheDefinition', 'Ext.exporter.file.ooxml.excel.PivotTableStyleInfo'], config:{applyAlignmentFormats:false, applyBorderFormats:false, applyFontFormats:false, 
applyNumberFormats:false, applyPatternFormats:false, applyWidthHeightFormats:true, asteriskTotals:null, autoFormatId:4096, cacheId:null, chartFormat:null, colGrandTotals:null, colHeaderCaption:null, compact:false, compactData:false, createdVersion:null, customListSort:null, dataCaption:'Values', dataOnRows:null, dataPosition:null, disableFieldList:null, editData:null, enableDrill:null, enableFieldProperties:null, enableWizard:null, errorCaption:null, fieldListSortAscending:null, fieldPrintTitles:null, 
grandTotalCaption:null, gridDropZones:null, immersive:null, indent:null, itemPrintTitles:true, mdxSubqueries:null, mergeItem:null, minRefreshableVersion:null, missingCaption:null, multipleFieldFilters:false, name:null, outline:true, outlineData:null, pageOverThenDown:null, pageStyle:null, pageWrap:null, pivotTableStyle:null, preserveFormatting:null, printDrill:null, published:null, rowGrandTotals:null, rowHeaderCaption:null, showCalcMbrs:null, showDataDropDown:null, showDataTips:null, showDrill:null, 
showDropZones:null, showEmptyCol:null, showEmptyRow:null, showError:null, showHeaders:null, showItems:null, showMemberPropertyTips:null, showMissing:null, showMultipleLabel:null, subtotalHiddenItems:null, tag:null, updatedVersion:null, useAutoFormatting:true, vacatedStyle:null, visualTotals:null, location:{}, pivotFields:null, rowFields:null, rowItems:null, colFields:null, colItems:null, pageFields:null, dataFields:null, pivotTableStyleInfo:{}, worksheet:null, cacheDefinition:{}, viewLayoutType:'outline'}, 
folder:'/xl/pivotTables/', fileName:'pivotTable', nameTemplate:'PivotTable{index}', contentType:{contentType:'application/vnd.openxmlformats-officedocument.spreadsheetml.pivotTable+xml'}, relationship:{schema:'http://schemas.openxmlformats.org/officeDocument/2006/relationships/pivotTable'}, tplNonAttributes:['location', 'worksheet', 'cacheDefinition', 'pivotFields', 'rowFields', 'rowItems', 'colFields', 'colItems', 'pageFields', 'dataFields', 'pivotTableStyleInfo', 'viewLayoutType'], generateTplAttributes:true, 
tpl:['\x3c?xml version\x3d"1.0" encoding\x3d"UTF-8" standalone\x3d"yes"?\x3e', '\x3cpivotTableDefinition xmlns\x3d"http://schemas.openxmlformats.org/spreadsheetml/2006/main" {attributes}\x3e', '{[values.location.render()]}', '\x3ctpl if\x3d"pivotFields \x26\x26 pivotFields.length"\x3e\x3cpivotFields count\x3d"{pivotFields.length}"\x3e\x3ctpl for\x3d"pivotFields.getRange()"\x3e{[values.render()]}\x3c/tpl\x3e\x3c/pivotFields\x3e\x3c/tpl\x3e', '\x3ctpl if\x3d"rowFields \x26\x26 rowFields.length"\x3e\x3crowFields count\x3d"{rowFields.length}"\x3e\x3ctpl for\x3d"rowFields.getRange()"\x3e{[values.render()]}\x3c/tpl\x3e\x3c/rowFields\x3e\x3c/tpl\x3e', 
'\x3ctpl if\x3d"rowItems \x26\x26 rowItems.length"\x3e\x3crowItems count\x3d"{rowItems.length}"\x3e\x3ctpl for\x3d"rowItems.getRange()"\x3e{[values.render()]}\x3c/tpl\x3e\x3c/rowItems\x3e\x3c/tpl\x3e', '\x3ctpl if\x3d"colFields \x26\x26 colFields.length"\x3e\x3ccolFields count\x3d"{colFields.length}"\x3e\x3ctpl for\x3d"colFields.getRange()"\x3e{[values.render()]}\x3c/tpl\x3e\x3c/colFields\x3e\x3c/tpl\x3e', '\x3ctpl if\x3d"colItems \x26\x26 colItems.length"\x3e\x3ccolItems count\x3d"{colItems.length}"\x3e\x3ctpl for\x3d"colItems.getRange()"\x3e{[values.render()]}\x3c/tpl\x3e\x3c/colItems\x3e\x3c/tpl\x3e', 
'\x3ctpl if\x3d"pageFields \x26\x26 pageFields.length"\x3e\x3cpageFields count\x3d"{pageFields.length}"\x3e\x3ctpl for\x3d"pageFields.getRange()"\x3e{[values.render()]}\x3c/tpl\x3e\x3c/pageFields\x3e\x3c/tpl\x3e', '\x3ctpl if\x3d"dataFields \x26\x26 dataFields.length"\x3e\x3cdataFields count\x3d"{dataFields.length}"\x3e\x3ctpl for\x3d"dataFields.getRange()"\x3e{[values.render()]}\x3c/tpl\x3e\x3c/dataFields\x3e\x3c/tpl\x3e', '\x3ctpl if\x3d"pivotTableStyleInfo"\x3e{[values.pivotTableStyleInfo.render()]}\x3c/tpl\x3e', 
'\x3c/pivotTableDefinition\x3e'], destroy:function() {
  var me = this;
  me.setWorksheet(null);
  me.setLocation(null);
  me.setCacheDefinition(null);
  me.setPivotTableStyleInfo(null);
  me.callParent();
}, collectFiles:function(files) {
  this.getCacheDefinition().collectFiles(files);
  this.callParent([files]);
}, collectContentTypes:function(types) {
  this.getCacheDefinition().collectContentTypes(types);
  this.callParent([types]);
}, updateIndex:function(index, oldIndex) {
  var me = this, cache = me.getCacheDefinition();
  if (cache) {
    cache.setIndex(index);
  }
  if (me._name == null) {
    me.generateName();
  }
  me.callParent([index, oldIndex]);
}, updateWorksheet:function(data, oldData) {
  var def = this.getCacheDefinition(), wb, pc;
  if (oldData && def && oldData.getWorkbook() && oldData.getWorkbook().getRelationships()) {
    oldData.getWorkbook().getRelationships().removeRelationship(def.getRelationship());
  }
  if (data && def) {
    wb = data.getWorkbook();
    wb.getRelationships().addRelationship(def.getRelationship());
    pc = def.getPivotCache();
    wb.addPivotCache(pc);
    this.setCacheId(pc.getCacheId());
    pc.setId(def.getRelationship().getId());
  }
}, applyPivotTableStyleInfo:function(data) {
  if (!data || data.isInstance) {
    return data;
  }
  return new Ext.exporter.file.ooxml.excel.PivotTableStyleInfo(data);
}, updatePivotTableStyleInfo:function(data, oldData) {
  Ext.destroy(oldData);
}, applyCacheDefinition:function(data) {
  if (!data || data.isInstance) {
    return data;
  }
  return new Ext.exporter.file.ooxml.excel.PivotCacheDefinition(data);
}, updateCacheDefinition:function(data, oldData) {
  var rels = this.getRelationships();
  if (oldData) {
    rels.removeRelationship(oldData.getRelationship());
  }
  Ext.destroy(oldData);
  if (data) {
    rels.addRelationship(data.getRelationship());
  }
}, updateViewLayoutType:function(value) {
  var me = this;
  if (value === 'compact') {
    me.setOutline(true);
    me.setOutlineData(true);
    me.setCompact(null);
    me.setCompactData(null);
  } else {
    if (value === 'outline') {
      me.setOutline(true);
      me.setOutlineData(true);
      me.setCompact(false);
      me.setCompactData(false);
    } else {
      me.setOutline(null);
      me.setOutlineData(null);
      me.setCompact(false);
      me.setCompactData(false);
    }
  }
  me.processPivotFields(me.getPivotFields().getRange());
}, applyLocation:function(data) {
  if (!data || data.isInstance) {
    return data;
  }
  return new Ext.exporter.file.ooxml.excel.Location(data);
}, updateLocation:function(data, oldData) {
  Ext.destroy(oldData);
}, applyPivotFields:function(data, dataCollection) {
  return this.checkCollection(data, dataCollection, 'Ext.exporter.file.ooxml.excel.PivotField');
}, updatePivotFields:function(collection, oldCollection) {
  var me = this;
  if (oldCollection) {
    oldCollection.un({add:me.onPivotFieldAdd, scope:me});
  }
  if (collection) {
    collection.on({add:me.onPivotFieldAdd, scope:me});
    this.processPivotFields(collection.getRange());
  }
}, onPivotFieldAdd:function(collection, details) {
  this.processPivotFields(details.items);
}, processPivotFields:function(items) {
  var layout = this.getViewLayoutType(), length = items.length, i, item, compact, outline;
  if (layout === 'compact') {
    compact = null;
    outline = null;
  } else {
    if (layout === 'outline') {
      compact = false;
      outline = null;
    } else {
      compact = false;
      outline = false;
    }
  }
  for (i = 0; i < length; i++) {
    item = items[i];
    item.setCompact(compact);
    item.setOutline(outline);
  }
}, applyRowFields:function(data, dataCollection) {
  return this.checkCollection(data, dataCollection, 'Ext.exporter.file.ooxml.excel.Field');
}, applyRowItems:function(data, dataCollection) {
  return this.checkCollection(data, dataCollection, 'Ext.exporter.file.ooxml.excel.Item');
}, applyColFields:function(data, dataCollection) {
  return this.checkCollection(data, dataCollection, 'Ext.exporter.file.ooxml.excel.Field');
}, applyColItems:function(data, dataCollection) {
  return this.checkCollection(data, dataCollection, 'Ext.exporter.file.ooxml.excel.Item');
}, applyDataFields:function(data, dataCollection) {
  return this.checkCollection(data, dataCollection, 'Ext.exporter.file.ooxml.excel.DataField');
}, applyAutoFormatId:function(value) {
  return value >= 4096 && value <= 4117 ? value : null;
}});
Ext.define('Ext.exporter.file.ooxml.excel.Worksheet', {extend:'Ext.exporter.file.ooxml.excel.Sheet', requires:['Ext.exporter.file.ooxml.excel.Column', 'Ext.exporter.file.ooxml.excel.Row', 'Ext.exporter.file.ooxml.excel.PivotTable'], isWorksheet:true, config:{columns:null, rows:[], drawings:null, tables:null, mergeCells:null, mergedCellsNo:0, topLeftRef:null, bottomRightRef:null, cachedRows:'', cachedMergeCells:'', pivotTables:null}, folder:'/xl/worksheets/', contentType:{contentType:'application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml'}, 
relationship:{schema:'http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet'}, tpl:['\x3c?xml version\x3d"1.0" encoding\x3d"UTF-8" standalone\x3d"yes"?\x3e', '\x3cworksheet xmlns\x3d"http://schemas.openxmlformats.org/spreadsheetml/2006/main" ', 'xmlns:r\x3d"http://schemas.openxmlformats.org/officeDocument/2006/relationships"\x3e', '\x3ctpl if\x3d"columns"\x3e', '\x3ccols\x3e', '\x3ctpl for\x3d"columns.items"\x3e{[values.render()]}\x3c/tpl\x3e', '\x3c/cols\x3e', '\x3c/tpl\x3e', 
'\x3ctpl if\x3d"cachedRows"\x3e', '\x3csheetData\x3e{cachedRows}\x3c/sheetData\x3e', '\x3ctpl if\x3d"cachedMergeCells"\x3e\x3cmergeCells\x3e{cachedMergeCells}\x3c/mergeCells\x3e\x3c/tpl\x3e', '\x3ctpl elseif\x3d"rows"\x3e', '\x3csheetData\x3e\x3ctpl for\x3d"rows.items"\x3e{[values.render()]}\x3c/tpl\x3e\x3c/sheetData\x3e', '\x3ctpl if\x3d"values.self.getMergedCellsNo() \x26gt; 0"\x3e', '\x3cmergeCells\x3e', '\x3ctpl for\x3d"rows.items"\x3e', '\x3ctpl for\x3d"_cells.items"\x3e', '\x3ctpl if\x3d"isMergedCell"\x3e\x3cmergeCell ref\x3d"{[values.getMergedCellRef()]}"/\x3e\x3c/tpl\x3e', 
'\x3c/tpl\x3e', '\x3c/tpl\x3e', '\x3c/mergeCells\x3e', '\x3c/tpl\x3e', '\x3ctpl else\x3e', '\x3c/sheetData\x3e', '\x3c/tpl\x3e', '\x3c/worksheet\x3e'], lastRowIndex:1, destroy:function() {
  var me = this;
  Ext.destroy(me.cachedRow);
  me.cachedRow = me.cachedRowConfig = null;
  me.callParent();
}, getRenderData:function() {
  this.setMergedCellsNo(0);
  return this.callParent();
}, collectFiles:function(files) {
  var pivot = this.getPivotTables(), length, i;
  if (pivot) {
    length = pivot.length;
    for (i = 0; i < length; i++) {
      pivot.getAt(i).collectFiles(files);
    }
  }
  this.callParent([files]);
}, collectContentTypes:function(types) {
  var pivot = this.getPivotTables(), length, i;
  if (pivot) {
    length = pivot.length;
    for (i = 0; i < length; i++) {
      pivot.getAt(i).collectContentTypes(types);
    }
  }
  this.callParent([types]);
}, applyColumns:function(data, dataCollection) {
  return this.checkCollection(data, dataCollection, 'Ext.exporter.file.ooxml.excel.Column');
}, applyRows:function(data, dataCollection) {
  return this.checkCollection(data, dataCollection, 'Ext.exporter.file.ooxml.excel.Row');
}, updateRows:function(collection, oldCollection) {
  var me = this;
  if (oldCollection) {
    oldCollection.un({add:me.onRowAdd, remove:me.onRowRemove, scope:me});
  }
  if (collection) {
    collection.on({add:me.onRowAdd, remove:me.onRowRemove, scope:me});
    me.onRowAdd(collection, {items:collection.getRange()});
  }
}, onRowAdd:function(collection, details) {
  var items = details.items, length = items.length, i, item, index;
  for (i = 0; i < length; i++) {
    item = items[i];
    item.setWorksheet(this);
    index = item._index;
    if (!index) {
      item.setIndex(this.lastRowIndex++);
    } else {
      this.lastRowIndex = Math.max(collection.length, index) + 1;
    }
  }
}, onRowRemove:function(collection, details) {
  Ext.destroy(details.items);
}, updateItemIndexes:function(items) {
  var i, len, item;
  if (!items) {
    return;
  }
  len = items.length;
  for (i = 0; i < len; i++) {
    item = items.getAt(i);
    if (!item.getIndex()) {
      item.setIndex(i + 1);
    }
  }
}, updateDrawings:function(data) {
  var rels = this.getRelationships();
  if (oldData && rels) {
    rels.removeRelationship(oldData.getRelationship());
  }
  if (data && rels) {
    rels.addRelationship(data.getRelationship());
  }
}, updateTables:function(data) {
  var rels = this.getRelationships();
  if (oldData && rels) {
    rels.removeRelationship(oldData.getRelationship());
  }
  if (data && rels) {
    rels.addRelationship(data.getRelationship());
  }
}, applyPivotTables:function(data, dataCollection) {
  return this.checkCollection(data, dataCollection, 'Ext.exporter.file.ooxml.excel.PivotTable');
}, updatePivotTables:function(collection, oldCollection) {
  var me = this;
  if (oldCollection) {
    oldCollection.un({add:me.onPivotTableAdd, remove:me.onPivotTableRemove, scope:me});
  }
  if (collection) {
    collection.on({add:me.onPivotTableAdd, remove:me.onPivotTableRemove, scope:me});
    this.processPivotTables(collection.getRange());
  }
}, onPivotTableAdd:function(collection, details) {
  this.processPivotTables(details.items);
}, processPivotTables:function(items) {
  var rels = this.getRelationships(), length = items.length, i, item;
  for (i = 0; i < length; i++) {
    item = items[i];
    rels.addRelationship(item.getRelationship());
    item.setWorksheet(this);
  }
  this.updateItemIndexes(this.getPivotTables());
}, onPivotTableRemove:function(collection, details) {
  var rels = this.getRelationships(), length = details.items.length, i, item;
  for (i = 0; i < length; i++) {
    item = details.items[i];
    rels.removeRelationship(item.getRelationship());
    Ext.destroy(item);
  }
}, addColumn:function(config) {
  if (!this._columns) {
    this.setColumns([]);
  }
  return this._columns.add(config || {});
}, addRow:function(config) {
  if (!this._rows) {
    this.setRows([]);
  }
  return this._rows.add(config || {});
}, getRow:function(id) {
  return this._rows ? this._rows.get(id) : null;
}, addPivotTable:function(config) {
  if (!this._pivotTables) {
    this.setPivotTables([]);
  }
  return this._pivotTables.add(config || {});
}, getPivotTable:function(id) {
  return this._pivotTables ? this._pivotTables.get(id) : null;
}, beginRowRendering:function() {
  var me = this;
  me.tempRows = [];
  me.tempMergeCells = [];
  me.startCaching = true;
  me.setMergedCellsNo(0);
  me.lastRowIndex = 1;
  me.cachedIndex = 0;
  if (!me.cachedRow) {
    me.cachedRow = new Ext.exporter.file.ooxml.excel.Row({worksheet:me});
    me.cachedRowConfig = me.cachedRow.getConfig();
    me.cachedRowConfig.id = me.cachedRowConfig.cells = null;
  }
}, endRowRendering:function() {
  var me = this;
  me.setCachedRows(me.tempRows.join(''));
  me.setCachedMergeCells(me.tempMergeCells.join(''));
  me.tempRows = me.tempMergeCells = null;
  me.startCaching = false;
  me.lastRowIndex = 1;
}, renderRows:function(rows) {
  var items = Ext.Array.from(rows), len = items.length, i;
  for (i = 0; i < len; i++) {
    this.renderRow(items[i]);
  }
}, renderRow:function(row) {
  var me = this, config, len, i, cache, index, cells, ret;
  if (!me.startCaching) {
    me.beginRowRendering();
  }
  cache = me.cachedRow;
  if (Ext.isArray(row)) {
    cells = row;
    config = {};
  } else {
    config = row;
    cells = Ext.Array.from(config.cells || []);
  }
  delete config.cells;
  Ext.applyIf(config, me.cachedRowConfig);
  cache.setCollapsed(config.collapsed);
  cache.setHidden(config.hidden);
  cache.setHeight(config.height);
  cache.setOutlineLevel(config.outlineLevel);
  cache.setShowPhonetic(config.showPhonetic);
  cache.setStyleId(config.styleId);
  cache.setIndex(config.index);
  index = cache.getIndex();
  if (!index) {
    cache.setIndex(me.lastRowIndex++);
  } else {
    me.lastRowIndex = Math.max(me.lastRowIndex, index) + 1;
  }
  ret = cache.renderCells(cells);
  me.tempRows.push(ret.row);
  if (me.cachedIndex === 0) {
    me._topLeftRef = ret.first;
  }
  me._bottomRightRef = ret.last;
  me.tempMergeCells.push(ret.merged);
  me.cachedIndex++;
  ret.rowIndex = cache.getIndex();
  return ret;
}});
Ext.define('Ext.exporter.file.ooxml.excel.Font', {extend:'Ext.exporter.file.ooxml.Base', config:{size:10, fontName:'', family:null, charset:null, bold:false, italic:false, underline:false, outline:false, strikeThrough:false, color:null, verticalAlign:null}, mappings:{family:{Automatic:0, Roman:1, Swiss:2, Modern:3, Script:4, Decorative:5}}, tpl:['\x3cfont\x3e', '\x3ctpl if\x3d"size"\x3e\x3csz val\x3d"{size}"/\x3e\x3c/tpl\x3e', '\x3ctpl if\x3d"fontName"\x3e\x3cname val\x3d"{fontName}"/\x3e\x3c/tpl\x3e', 
'\x3ctpl if\x3d"family"\x3e\x3cfamily val\x3d"{family}"/\x3e\x3c/tpl\x3e', '\x3ctpl if\x3d"charset"\x3e\x3ccharset val\x3d"{charset}"/\x3e\x3c/tpl\x3e', '\x3ctpl if\x3d"bold"\x3e\x3cb/\x3e\x3c/tpl\x3e', '\x3ctpl if\x3d"italic"\x3e\x3ci/\x3e\x3c/tpl\x3e', '\x3ctpl if\x3d"underline"\x3e\x3cu/\x3e\x3c/tpl\x3e', '\x3ctpl if\x3d"outline"\x3e\x3coutline/\x3e\x3c/tpl\x3e', '\x3ctpl if\x3d"strikeThrough"\x3e\x3cstrike/\x3e\x3c/tpl\x3e', '\x3ctpl if\x3d"color"\x3e\x3ccolor rgb\x3d"{color}"/\x3e\x3c/tpl\x3e', 
'\x3ctpl if\x3d"verticalAlign"\x3e\x3cvertAlign val\x3d"{verticalAlign}"/\x3e\x3c/tpl\x3e', '\x3c/font\x3e'], autoGenerateKey:['size', 'fontName', 'family', 'charset', 'bold', 'italic', 'underline', 'outline', 'strikeThrough', 'color', 'verticalAlign'], constructor:function(config) {
  var cfg = {}, keys = Ext.Object.getKeys(config || {}), len = keys.length, i;
  if (config) {
    for (i = 0; i < len; i++) {
      cfg[Ext.String.uncapitalize(keys[i])] = config[keys[i]];
    }
  }
  this.callParent([cfg]);
}, applyFamily:function(value) {
  if (typeof value === 'string') {
    return this.mappings.family[value];
  }
  return value;
}, applyBold:function(value) {
  return !!value;
}, applyItalic:function(value) {
  return !!value;
}, applyStrikeThrough:function(value) {
  return !!value;
}, applyUnderline:function(value) {
  return !!value;
}, applyOutline:function(value) {
  return !!value;
}, applyColor:function(value) {
  var v;
  if (!value) {
    return value;
  }
  v = String(value);
  return v.indexOf('#') >= 0 ? v.replace('#', '') : v;
}, applyVerticalAlign:function(value) {
  return Ext.util.Format.lowercase(value);
}});
Ext.define('Ext.exporter.file.ooxml.excel.NumberFormat', {extend:'Ext.exporter.file.ooxml.Base', config:{isDate:false, numFmtId:null, formatCode:''}, tpl:['\x3cnumFmt numFmtId\x3d"{numFmtId}" formatCode\x3d"{formatCode:htmlEncode}"/\x3e'], spaceRe:/(,| )/g, getRenderData:function() {
  var data = this.callParent(), fmt = data.formatCode;
  fmt = fmt && data.isDate ? fmt.replace(this.spaceRe, '\\$1') : fmt;
  data.formatCode = fmt;
  return data;
}, getKey:function() {
  return this.getFormatCode();
}});
Ext.define('Ext.exporter.file.ooxml.excel.Fill', {extend:'Ext.exporter.file.ooxml.Base', requires:['Ext.util.Format'], config:{patternType:'none', fgColor:null, bgColor:null}, tpl:['\x3cfill\x3e', '\x3ctpl if\x3d"fgColor || bgColor"\x3e', '\x3cpatternFill patternType\x3d"{patternType}"\x3e', '\x3ctpl if\x3d"fgColor"\x3e\x3cfgColor rgb\x3d"{fgColor}"\x3e\x3c/fgColor\x3e\x3c/tpl\x3e', '\x3ctpl if\x3d"bgColor"\x3e\x3cbgColor rgb\x3d"{bgColor}"\x3e\x3c/bgColor\x3e\x3c/tpl\x3e', '\x3c/patternFill\x3e', 
'\x3ctpl else\x3e', '\x3cpatternFill patternType\x3d"{patternType}"/\x3e', '\x3c/tpl\x3e', '\x3c/fill\x3e'], autoGenerateKey:['patternType', 'fgColor', 'bgColor'], constructor:function(config) {
  var cfg = {};
  if (config) {
    cfg.id = config.id;
    cfg.bgColor = config.Color || null;
    cfg.patternType = config.Pattern || null;
  }
  this.callParent([cfg]);
}, formatColor:function(value) {
  var v;
  if (!value) {
    return value;
  }
  v = String(value);
  return v.indexOf('#') >= 0 ? v.replace('#', '') : v;
}, applyFgColor:function(value) {
  return this.formatColor(value);
}, applyBgColor:function(value) {
  return this.formatColor(value);
}, applyPatternType:function(value) {
  var possible = ['none', 'solid', 'mediumGray', 'darkGray', 'lightGray', 'darkHorizontal', 'darkVertical', 'darkDown', 'darkUp', 'darkGrid', 'darkTrellis', 'lightHorizontal', 'lightVertical', 'lightDown', 'lightUp', 'lightGrid', 'lightTrellis', 'gray125', 'gray0625'], v = Ext.util.Format.uncapitalize(value);
  return Ext.Array.indexOf(possible, v) >= 0 ? v : 'none';
}});
Ext.define('Ext.exporter.file.ooxml.excel.BorderPr', {extend:'Ext.exporter.file.ooxml.Base', isBorderPr:true, config:{tag:'left', color:null, lineStyle:'none'}, mappings:{lineStyle:{'None':'none', 'Continuous':'thin', 'Dash':'dashed', 'Dot':'dotted', 'DashDot':'dashDot', 'DashDotDot':'dashDotDot', 'SlantDashDot':'slantDashDot', 'Double':'double'}}, tpl:['\x3ctpl if\x3d"color"\x3e', '\x3c{tag} style\x3d"{lineStyle}"\x3e\x3ccolor rgb\x3d"{color}"/\x3e\x3c/{tag}\x3e', '\x3ctpl else\x3e', '\x3c{tag} style\x3d"{lineStyle}"/\x3e', 
'\x3c/tpl\x3e'], autoGenerateKey:['tag', 'color', 'lineStyle'], applyColor:function(value) {
  var v;
  if (!value) {
    return value;
  }
  v = String(value);
  return v.indexOf('#') >= 0 ? v.replace('#', '') : v;
}, applyLineStyle:function(value) {
  var possible = ['none', 'thin', 'medium', 'dashed', 'dotted', 'thick', 'double', 'hair', 'mediumDashed', 'dashDot', 'mediumDashDot', 'dashDotDot', 'mediumDashDotDot', 'slantDashDot'];
  return Ext.Array.indexOf(possible, value) >= 0 ? value : this.mappings.lineStyle[value] || 'none';
}});
Ext.define('Ext.exporter.file.ooxml.excel.Border', {extend:'Ext.exporter.file.ooxml.Base', requires:['Ext.exporter.file.ooxml.excel.BorderPr'], config:{left:null, right:null, top:null, bottom:null}, tpl:['\x3cborder\x3e', '\x3ctpl if\x3d"left"\x3e{[values.left.render()]}\x3c/tpl\x3e', '\x3ctpl if\x3d"right"\x3e{[values.right.render()]}\x3c/tpl\x3e', '\x3ctpl if\x3d"top"\x3e{[values.top.render()]}\x3c/tpl\x3e', '\x3ctpl if\x3d"bottom"\x3e{[values.bottom.render()]}\x3c/tpl\x3e', '\x3c/border\x3e'], 
autoGenerateKey:['left', 'right', 'top', 'bottom'], destroy:function() {
  this.setConfig({left:null, right:null, top:null, bottom:null});
  this.callParent();
}, applyLeft:function(border) {
  if (border && !border.isBorderPr) {
    return new Ext.exporter.file.ooxml.excel.BorderPr(border);
  }
  return border;
}, applyTop:function(border) {
  if (border && !border.isBorderPr) {
    return new Ext.exporter.file.ooxml.excel.BorderPr(border);
  }
  return border;
}, applyRight:function(border) {
  if (border && !border.isBorderPr) {
    return new Ext.exporter.file.ooxml.excel.BorderPr(border);
  }
  return border;
}, applyBottom:function(border) {
  if (border && !border.isBorderPr) {
    return new Ext.exporter.file.ooxml.excel.BorderPr(border);
  }
  return border;
}, updateLeft:function(border, oldData) {
  Ext.destroy(oldData);
  if (border) {
    border.setTag('left');
  }
}, updateTop:function(border, oldData) {
  Ext.destroy(oldData);
  if (border) {
    border.setTag('top');
  }
}, updateRight:function(border, oldData) {
  Ext.destroy(oldData);
  if (border) {
    border.setTag('right');
  }
}, updateBottom:function(border, oldData) {
  Ext.destroy(oldData);
  if (border) {
    border.setTag('bottom');
  }
}});
Ext.define('Ext.exporter.file.ooxml.excel.CellAlignment', {extend:'Ext.exporter.file.ooxml.Base', isCellAlignment:true, config:{horizontal:'general', vertical:'top', rotate:null, wrapText:false, indent:null, relativeIndent:null, justifyLastLine:false, shrinkToFit:false, readingOrder:null}, autoGenerateKey:['horizontal', 'vertical', 'rotate', 'wrapText', 'indent', 'relativeIndent', 'justifyLastLine', 'shrinkToFit', 'readingOrder'], mappings:{horizontal:{Automatic:'general', CenterAcrossSelection:'centerContinuous', 
JustifyDistributed:'distributed'}, vertical:{Automatic:'top', JustifyDistributed:'distributed'}, readingOrder:{Context:0, LeftToRight:1, RightToLeft:2}}, tpl:['\x3calignment', '\x3ctpl if\x3d"horizontal"\x3e horizontal\x3d"{horizontal}"\x3c/tpl\x3e', '\x3ctpl if\x3d"vertical"\x3e vertical\x3d"{vertical}"\x3c/tpl\x3e', '\x3ctpl if\x3d"rotate"\x3e textRotation\x3d"{rotate}"\x3c/tpl\x3e', '\x3ctpl if\x3d"wrapText"\x3e wrapText\x3d"{wrapText}"\x3c/tpl\x3e', '\x3ctpl if\x3d"indent"\x3e indent\x3d"{indent}"\x3c/tpl\x3e', 
'\x3ctpl if\x3d"relativeIndent"\x3e relativeIndent\x3d"{relativeIndent}"\x3c/tpl\x3e', '\x3ctpl if\x3d"justifyLastLine"\x3e justifyLastLine\x3d"{justifyLastLine}"\x3c/tpl\x3e', '\x3ctpl if\x3d"shrinkToFit"\x3e shrinkToFit\x3d"{shrinkToFit}"\x3c/tpl\x3e', '\x3ctpl if\x3d"readingOrder"\x3e readingOrder\x3d"{readingOrder}"\x3c/tpl\x3e', '/\x3e'], constructor:function(config) {
  var cfg = {}, keys = Ext.Object.getKeys(config || {}), len = keys.length, i;
  if (config) {
    for (i = 0; i < len; i++) {
      cfg[Ext.String.uncapitalize(keys[i])] = config[keys[i]];
    }
  }
  this.callParent([cfg]);
}, applyHorizontal:function(value) {
  var possible = ['general', 'left', 'center', 'right', 'fill', 'justify', 'centerContinuous', 'distributed'], v = Ext.util.Format.uncapitalize(value);
  return Ext.Array.indexOf(possible, v) >= 0 ? v : this.mappings.horizontal[value] || 'general';
}, applyVertical:function(value) {
  var possible = ['top', 'center', 'bottom', 'justify', 'distributed'], v = Ext.util.Format.uncapitalize(value);
  return Ext.Array.indexOf(possible, v) >= 0 ? v : this.mappings.vertical[value] || 'top';
}, applyReadingOrder:function(value) {
  if (typeof value === 'string') {
    return this.mappings.readingOrder[value] || 0;
  }
  return value;
}});
Ext.define('Ext.exporter.file.ooxml.excel.CellStyleXf', {extend:'Ext.exporter.file.ooxml.Base', requires:['Ext.exporter.file.ooxml.excel.CellAlignment'], config:{numFmtId:0, fontId:0, fillId:0, borderId:0, alignment:null}, autoGenerateKey:['numFmtId', 'fontId', 'fillId', 'borderId', 'alignment'], tpl:['\x3cxf numFmtId\x3d"{numFmtId}" fontId\x3d"{fontId}" fillId\x3d"{fillId}" borderId\x3d"{borderId}"', '\x3ctpl if\x3d"numFmtId"\x3e applyNumberFormat\x3d"1"\x3c/tpl\x3e', '\x3ctpl if\x3d"fillId"\x3e applyFill\x3d"1"\x3c/tpl\x3e', 
'\x3ctpl if\x3d"borderId"\x3e applyBorder\x3d"1"\x3c/tpl\x3e', '\x3ctpl if\x3d"fontId"\x3e applyFont\x3d"1"\x3c/tpl\x3e', '\x3ctpl if\x3d"alignment"\x3e', ' applyAlignment\x3d"1"\x3e{[values.alignment.render()]}\x3c/xf\x3e', '\x3ctpl else\x3e', '/\x3e', '\x3c/tpl\x3e'], applyAlignment:function(align) {
  if (align && !align.isCellAlignment) {
    return new Ext.exporter.file.ooxml.excel.CellAlignment(align);
  }
  return align;
}});
Ext.define('Ext.exporter.file.ooxml.excel.CellXf', {extend:'Ext.exporter.file.ooxml.excel.CellStyleXf', config:{xfId:0}, tpl:['\x3cxf numFmtId\x3d"{numFmtId}" fontId\x3d"{fontId}" fillId\x3d"{fillId}" borderId\x3d"{borderId}" xfId\x3d"{xfId}"', '\x3ctpl if\x3d"numFmtId"\x3e applyNumberFormat\x3d"1"\x3c/tpl\x3e', '\x3ctpl if\x3d"fillId"\x3e applyFill\x3d"1"\x3c/tpl\x3e', '\x3ctpl if\x3d"borderId"\x3e applyBorder\x3d"1"\x3c/tpl\x3e', '\x3ctpl if\x3d"fontId"\x3e applyFont\x3d"1"\x3c/tpl\x3e', '\x3ctpl if\x3d"alignment"\x3e', 
' applyAlignment\x3d"1"\x3e{[values.alignment.render()]}\x3c/xf\x3e', '\x3ctpl else\x3e', '/\x3e', '\x3c/tpl\x3e'], autoGenerateKey:['xfId']});
Ext.define('Ext.exporter.file.ooxml.excel.Stylesheet', {extend:'Ext.exporter.file.ooxml.Xml', requires:['Ext.exporter.file.Style', 'Ext.exporter.file.ooxml.excel.Font', 'Ext.exporter.file.ooxml.excel.NumberFormat', 'Ext.exporter.file.ooxml.excel.Fill', 'Ext.exporter.file.ooxml.excel.Border', 'Ext.exporter.file.ooxml.excel.CellXf'], isStylesheet:true, config:{fonts:[{fontName:'Arial', size:10, family:2}], numberFormats:null, fills:[{patternType:'none'}], borders:[{left:{}, top:{}, right:{}, bottom:{}}], 
cellStyleXfs:[{}], cellXfs:[{}]}, contentType:{contentType:'application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml'}, relationship:{schema:'http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles'}, folder:'/xl/', fileName:'styles', tpl:['\x3c?xml version\x3d"1.0" encoding\x3d"UTF-8" standalone\x3d"yes"?\x3e', '\x3cstyleSheet xmlns\x3d"http://schemas.openxmlformats.org/spreadsheetml/2006/main"\x3e', '\x3ctpl if\x3d"numberFormats"\x3e\x3cnumFmts count\x3d"{numberFormats.length}"\x3e\x3ctpl for\x3d"numberFormats.items"\x3e{[values.render()]}\x3c/tpl\x3e\x3c/numFmts\x3e\x3c/tpl\x3e', 
'\x3ctpl if\x3d"fonts"\x3e\x3cfonts count\x3d"{fonts.length}"\x3e\x3ctpl for\x3d"fonts.items"\x3e{[values.render()]}\x3c/tpl\x3e\x3c/fonts\x3e\x3c/tpl\x3e', '\x3ctpl if\x3d"fills"\x3e\x3cfills count\x3d"{fills.length}"\x3e\x3ctpl for\x3d"fills.items"\x3e{[values.render()]}\x3c/tpl\x3e\x3c/fills\x3e\x3c/tpl\x3e', '\x3ctpl if\x3d"borders"\x3e\x3cborders count\x3d"{borders.length}"\x3e\x3ctpl for\x3d"borders.items"\x3e{[values.render()]}\x3c/tpl\x3e\x3c/borders\x3e\x3c/tpl\x3e', '\x3ctpl if\x3d"cellStyleXfs"\x3e\x3ccellStyleXfs count\x3d"{cellStyleXfs.length}"\x3e\x3ctpl for\x3d"cellStyleXfs.items"\x3e{[values.render()]}\x3c/tpl\x3e\x3c/cellStyleXfs\x3e\x3c/tpl\x3e', 
'\x3ctpl if\x3d"cellXfs"\x3e\x3ccellXfs count\x3d"{cellXfs.length}"\x3e\x3ctpl for\x3d"cellXfs.items"\x3e{[values.render()]}\x3c/tpl\x3e\x3c/cellXfs\x3e\x3c/tpl\x3e', '\x3ctableStyles count\x3d"0" defaultTableStyle\x3d"TableStyleMedium9" defaultPivotStyle\x3d"PivotStyleMedium7"/\x3e', '\x3c/styleSheet\x3e'], lastNumberFormatId:164, datePatterns:{'General Date':'[$-F800]dddd, mmmm dd, yyyy', 'Long Date':'[$-F800]dddd, mmmm dd, yyyy', 'Medium Date':'mm/dd/yy;@', 'Short Date':'m/d/yy;@', 'Long Time':'h:mm:ss;@', 
'Medium Time':'[$-409]h:mm AM/PM;@', 'Short Time':'h:mm;@'}, numberPatterns:{'General Number':1, 'Fixed':2, 'Standard':2, 'Percent':10, 'Scientific':11, 'Currency':'"$"#,##0.00', 'Euro Currency':'"€"#,##0.00'}, booleanPatterns:{'Yes/No':'"Yes";-;"No"', 'True/False':'"True";-;"False"', 'On/Off':'"On";-;"Off"'}, applyFonts:function(data, dataCollection) {
  return this.checkCollection(data, dataCollection, 'Ext.exporter.file.ooxml.excel.Font');
}, applyNumberFormats:function(data, dataCollection) {
  return this.checkCollection(data, dataCollection, 'Ext.exporter.file.ooxml.excel.NumberFormat');
}, applyFills:function(data, dataCollection) {
  return this.checkCollection(data, dataCollection, 'Ext.exporter.file.ooxml.excel.Fill');
}, applyBorders:function(data, dataCollection) {
  return this.checkCollection(data, dataCollection, 'Ext.exporter.file.ooxml.excel.Border');
}, applyCellXfs:function(data, dataCollection) {
  return this.checkCollection(data, dataCollection, 'Ext.exporter.file.ooxml.excel.CellXf');
}, applyCellStyleXfs:function(data, dataCollection) {
  return this.checkCollection(data, dataCollection, 'Ext.exporter.file.ooxml.excel.CellStyleXf');
}, addFont:function(config) {
  var col = this._fonts, ret, font;
  if (!col) {
    this.setFonts([]);
    col = this._fonts;
  }
  font = new Ext.exporter.file.ooxml.excel.Font(config);
  ret = col.indexOfKey(font.getKey());
  if (ret >= 0) {
    font.destroy();
  } else {
    col.add(font);
    ret = col.indexOf(font);
  }
  return ret;
}, addNumberFormat:function(config) {
  var col = this._numberFormats, ret, temp;
  if (!col) {
    this.setNumberFormats([]);
    col = this._numberFormats;
  }
  temp = new Ext.exporter.file.ooxml.excel.NumberFormat(config);
  ret = col.get(temp.getKey());
  if (!ret) {
    ret = temp;
    col.add(ret);
    ret.setNumFmtId(this.lastNumberFormatId++);
  }
  return ret.getNumFmtId();
}, addFill:function(config) {
  var col = this._fills, ret, fill;
  if (!col) {
    this.setFills([]);
    col = this._fills;
  }
  fill = new Ext.exporter.file.ooxml.excel.Font(config);
  ret = col.indexOfKey(fill.getKey());
  if (ret >= 0) {
    fill.destroy();
  } else {
    col.add(fill);
    ret = col.indexOf(fill);
  }
  return ret;
}, addBorder:function(config) {
  var col = this._borders, ret, border;
  if (!col) {
    this.setBorders([]);
    col = this._borders;
  }
  border = new Ext.exporter.file.ooxml.excel.Border(config);
  ret = col.indexOfKey(border.getKey());
  if (ret >= 0) {
    border.destroy();
  } else {
    col.add(border);
    ret = col.indexOf(border);
  }
  return ret;
}, addCellXf:function(config) {
  var col = this._cellXfs, ret, style;
  if (!col) {
    this.setCellXfs([]);
    col = this._cellXfs;
  }
  style = new Ext.exporter.file.ooxml.excel.CellXf(config);
  ret = col.indexOfKey(style.getKey());
  if (ret >= 0) {
    style.destroy();
  } else {
    col.add(style);
    ret = col.indexOf(style);
  }
  return ret;
}, addCellStyleXf:function(config) {
  var col = this._cellStyleXfs, ret, style;
  if (!col) {
    this.setCellStyleXfs([]);
    col = this._cellStyleXfs;
  }
  style = new Ext.exporter.file.ooxml.excel.CellStyleXf(config);
  ret = col.indexOfKey(style.getKey());
  if (ret >= 0) {
    style.destroy();
  } else {
    col.add(style);
    ret = col.indexOf(style);
  }
  return ret;
}, getStyleParams:function(style) {
  var me = this, s = style && style.isStyle ? style : new Ext.exporter.file.Style(style), cfg = s.getConfig(), numFmtId = 0, fontId = 0, fillId = 0, borderId = 0, xfId = 0;
  cfg.parentId = style ? style.parentId : null;
  if (cfg.font) {
    fontId = me.addFont(cfg.font);
  }
  if (cfg.format) {
    numFmtId = me.getNumberFormatId(cfg.format);
  }
  if (cfg.interior) {
    fillId = me.addFill(cfg.interior);
  }
  if (cfg.borders) {
    borderId = me.getBorderId(cfg.borders);
  }
  if (cfg.parentId) {
    xfId = cfg.parentId;
  }
  return {numFmtId:numFmtId, fontId:fontId, fillId:fillId, borderId:borderId, xfId:xfId, alignment:cfg.alignment || null};
}, addStyle:function(style) {
  return this.addCellStyleXf(this.getStyleParams(style));
}, addCellStyle:function(style, parentStyleId) {
  var styles = this.getCellXfs(), parentStyle, newStyle, ret;
  if (styles) {
    parentStyle = styles.getAt(parentStyleId);
    if (parentStyle) {
      newStyle = parentStyle.getConfig();
    }
  }
  return this.addCellXf(Ext.merge(newStyle || {}, this.getStyleParams(style)));
}, getNumberFormatId:function(f) {
  var me = this, isDate = !!me.datePatterns[f], id, code;
  if (f === 'General') {
    return 0;
  }
  code = me.datePatterns[f] || me.booleanPatterns[f] || me.numberPatterns[f];
  if (Ext.isNumeric(code)) {
    id = code;
  } else {
    if (!code) {
      code = f;
    }
  }
  return id || me.addNumberFormat({isDate:isDate, formatCode:code});
}, getBorderId:function(borders) {
  var cfg = {}, len = borders.length, i, b, key;
  for (i = 0; i < len; i++) {
    b = borders[i];
    key = Ext.util.Format.lowercase(b.position);
    delete b.position;
    cfg[key] = b;
  }
  return this.addBorder(cfg);
}});
Ext.define('Ext.exporter.file.ooxml.excel.SharedStrings', {extend:'Ext.exporter.file.ooxml.Xml', isSharedStrings:true, config:{strings:[]}, contentType:{contentType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml'}, relationship:{schema:'http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings'}, folder:'/xl/', fileName:'sharedStrings', tpl:['\x3c?xml version\x3d"1.0" encoding\x3d"UTF-8" standalone\x3d"yes"?\x3e', '\x3csst xmlns\x3d"http://schemas.openxmlformats.org/spreadsheetml/2006/main" count\x3d"{strings.length}" uniqueCount\x3d"{strings.length}"\x3e', 
'\x3ctpl for\x3d"strings.getRange()"\x3e\x3csi\x3e\x3ct\x3e{.:this.utf8}\x3c/t\x3e\x3c/si\x3e\x3c/tpl\x3e', '\x3c/sst\x3e', {utf8:function(v) {
  return Ext.util.Base64._utf8_encode(v);
}}], destroy:function() {
  this.setStrings(null);
  this.callParent();
}, applyStrings:function(data, dataCollection) {
  var col;
  if (data) {
    col = new Ext.util.Collection({keyFn:Ext.identityFn});
    col.add(data);
  }
  Ext.destroy(dataCollection);
  return col;
}, addString:function(value) {
  var v = Ext.util.Format.htmlEncode(value), s = this.getStrings(), index;
  if (!s) {
    this.setStrings([]);
    s = this.getStrings();
  }
  index = s.indexOfKey(v);
  if (index < 0) {
    s.add(v);
    index = s.length - 1;
  }
  return index;
}});
Ext.define('Ext.exporter.file.ooxml.theme.Base', {extend:'Ext.exporter.file.ooxml.XmlRels', alias:'ooxmltheme.base', mixins:['Ext.mixin.Factoryable'], folder:'/theme/', fileName:'theme', contentType:{contentType:'application/vnd.openxmlformats-officedocument.theme+xml'}, relationship:{schema:'http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme'}});
Ext.define('Ext.exporter.file.ooxml.theme.Office', {extend:'Ext.exporter.file.ooxml.theme.Base', alias:'ooxmltheme.office', tpl:['\x3c?xml version\x3d"1.0" encoding\x3d"UTF-8" standalone\x3d"yes"?\x3e', '\x3ca:theme xmlns:a\x3d"http://schemas.openxmlformats.org/drawingml/2006/main" name\x3d"Office Theme"\x3e', '\x3ca:themeElements\x3e', '\x3ca:clrScheme name\x3d"Office"\x3e', '\x3ca:dk1\x3e', '\x3ca:sysClr val\x3d"windowText" lastClr\x3d"000000"/\x3e', '\x3c/a:dk1\x3e', '\x3ca:lt1\x3e', '\x3ca:sysClr val\x3d"window" lastClr\x3d"FFFFFF"/\x3e', 
'\x3c/a:lt1\x3e', '\x3ca:dk2\x3e', '\x3ca:srgbClr val\x3d"44546A"/\x3e', '\x3c/a:dk2\x3e', '\x3ca:lt2\x3e', '\x3ca:srgbClr val\x3d"E7E6E6"/\x3e', '\x3c/a:lt2\x3e', '\x3ca:accent1\x3e', '\x3ca:srgbClr val\x3d"4472C4"/\x3e', '\x3c/a:accent1\x3e', '\x3ca:accent2\x3e', '\x3ca:srgbClr val\x3d"ED7D31"/\x3e', '\x3c/a:accent2\x3e', '\x3ca:accent3\x3e', '\x3ca:srgbClr val\x3d"A5A5A5"/\x3e', '\x3c/a:accent3\x3e', '\x3ca:accent4\x3e', '\x3ca:srgbClr val\x3d"FFC000"/\x3e', '\x3c/a:accent4\x3e', '\x3ca:accent5\x3e', 
'\x3ca:srgbClr val\x3d"5B9BD5"/\x3e', '\x3c/a:accent5\x3e', '\x3ca:accent6\x3e', '\x3ca:srgbClr val\x3d"70AD47"/\x3e', '\x3c/a:accent6\x3e', '\x3ca:hlink\x3e', '\x3ca:srgbClr val\x3d"0563C1"/\x3e', '\x3c/a:hlink\x3e', '\x3ca:folHlink\x3e', '\x3ca:srgbClr val\x3d"954F72"/\x3e', '\x3c/a:folHlink\x3e', '\x3c/a:clrScheme\x3e', '\x3ca:fontScheme name\x3d"Office"\x3e', '\x3ca:majorFont\x3e', '\x3ca:latin typeface\x3d"Calibri Light" panose\x3d"020F0302020204030204"/\x3e', '\x3ca:ea typeface\x3d""/\x3e', 
'\x3ca:cs typeface\x3d""/\x3e', '\x3ca:font script\x3d"Jpan" typeface\x3d"Yu Gothic Light"/\x3e', '\x3ca:font script\x3d"Hang" typeface\x3d"{[this.utf8(\'맑은 고딕\')]}"/\x3e', '\x3ca:font script\x3d"Hans" typeface\x3d"DengXian Light"/\x3e', '\x3ca:font script\x3d"Hant" typeface\x3d"{[this.utf8(\'新細明體\')]}"/\x3e', '\x3ca:font script\x3d"Arab" typeface\x3d"Times New Roman"/\x3e', '\x3ca:font script\x3d"Hebr" typeface\x3d"Times New Roman"/\x3e', '\x3ca:font script\x3d"Thai" typeface\x3d"Tahoma"/\x3e', 
'\x3ca:font script\x3d"Ethi" typeface\x3d"Nyala"/\x3e', '\x3ca:font script\x3d"Beng" typeface\x3d"Vrinda"/\x3e', '\x3ca:font script\x3d"Gujr" typeface\x3d"Shruti"/\x3e', '\x3ca:font script\x3d"Khmr" typeface\x3d"MoolBoran"/\x3e', '\x3ca:font script\x3d"Knda" typeface\x3d"Tunga"/\x3e', '\x3ca:font script\x3d"Guru" typeface\x3d"Raavi"/\x3e', '\x3ca:font script\x3d"Cans" typeface\x3d"Euphemia"/\x3e', '\x3ca:font script\x3d"Cher" typeface\x3d"Plantagenet Cherokee"/\x3e', '\x3ca:font script\x3d"Yiii" typeface\x3d"Microsoft Yi Baiti"/\x3e', 
'\x3ca:font script\x3d"Tibt" typeface\x3d"Microsoft Himalaya"/\x3e', '\x3ca:font script\x3d"Thaa" typeface\x3d"MV Boli"/\x3e', '\x3ca:font script\x3d"Deva" typeface\x3d"Mangal"/\x3e', '\x3ca:font script\x3d"Telu" typeface\x3d"Gautami"/\x3e', '\x3ca:font script\x3d"Taml" typeface\x3d"Latha"/\x3e', '\x3ca:font script\x3d"Syrc" typeface\x3d"Estrangelo Edessa"/\x3e', '\x3ca:font script\x3d"Orya" typeface\x3d"Kalinga"/\x3e', '\x3ca:font script\x3d"Mlym" typeface\x3d"Kartika"/\x3e', '\x3ca:font script\x3d"Laoo" typeface\x3d"DokChampa"/\x3e', 
'\x3ca:font script\x3d"Sinh" typeface\x3d"Iskoola Pota"/\x3e', '\x3ca:font script\x3d"Mong" typeface\x3d"Mongolian Baiti"/\x3e', '\x3ca:font script\x3d"Viet" typeface\x3d"Times New Roman"/\x3e', '\x3ca:font script\x3d"Uigh" typeface\x3d"Microsoft Uighur"/\x3e', '\x3ca:font script\x3d"Geor" typeface\x3d"Sylfaen"/\x3e', '\x3c/a:majorFont\x3e', '\x3ca:minorFont\x3e', '\x3ca:latin typeface\x3d"Calibri" panose\x3d"020F0502020204030204"/\x3e', '\x3ca:ea typeface\x3d""/\x3e', '\x3ca:cs typeface\x3d""/\x3e', 
'\x3ca:font script\x3d"Jpan" typeface\x3d"Yu Gothic"/\x3e', '\x3ca:font script\x3d"Hang" typeface\x3d"{[this.utf8(\'맑은 고딕\')]}"/\x3e', '\x3ca:font script\x3d"Hans" typeface\x3d"DengXian"/\x3e', '\x3ca:font script\x3d"Hant" typeface\x3d"{[this.utf8(\'新細明體\')]}"/\x3e', '\x3ca:font script\x3d"Arab" typeface\x3d"Arial"/\x3e', '\x3ca:font script\x3d"Hebr" typeface\x3d"Arial"/\x3e', '\x3ca:font script\x3d"Thai" typeface\x3d"Tahoma"/\x3e', '\x3ca:font script\x3d"Ethi" typeface\x3d"Nyala"/\x3e', '\x3ca:font script\x3d"Beng" typeface\x3d"Vrinda"/\x3e', 
'\x3ca:font script\x3d"Gujr" typeface\x3d"Shruti"/\x3e', '\x3ca:font script\x3d"Khmr" typeface\x3d"DaunPenh"/\x3e', '\x3ca:font script\x3d"Knda" typeface\x3d"Tunga"/\x3e', '\x3ca:font script\x3d"Guru" typeface\x3d"Raavi"/\x3e', '\x3ca:font script\x3d"Cans" typeface\x3d"Euphemia"/\x3e', '\x3ca:font script\x3d"Cher" typeface\x3d"Plantagenet Cherokee"/\x3e', '\x3ca:font script\x3d"Yiii" typeface\x3d"Microsoft Yi Baiti"/\x3e', '\x3ca:font script\x3d"Tibt" typeface\x3d"Microsoft Himalaya"/\x3e', '\x3ca:font script\x3d"Thaa" typeface\x3d"MV Boli"/\x3e', 
'\x3ca:font script\x3d"Deva" typeface\x3d"Mangal"/\x3e', '\x3ca:font script\x3d"Telu" typeface\x3d"Gautami"/\x3e', '\x3ca:font script\x3d"Taml" typeface\x3d"Latha"/\x3e', '\x3ca:font script\x3d"Syrc" typeface\x3d"Estrangelo Edessa"/\x3e', '\x3ca:font script\x3d"Orya" typeface\x3d"Kalinga"/\x3e', '\x3ca:font script\x3d"Mlym" typeface\x3d"Kartika"/\x3e', '\x3ca:font script\x3d"Laoo" typeface\x3d"DokChampa"/\x3e', '\x3ca:font script\x3d"Sinh" typeface\x3d"Iskoola Pota"/\x3e', '\x3ca:font script\x3d"Mong" typeface\x3d"Mongolian Baiti"/\x3e', 
'\x3ca:font script\x3d"Viet" typeface\x3d"Arial"/\x3e', '\x3ca:font script\x3d"Uigh" typeface\x3d"Microsoft Uighur"/\x3e', '\x3ca:font script\x3d"Geor" typeface\x3d"Sylfaen"/\x3e', '\x3c/a:minorFont\x3e', '\x3c/a:fontScheme\x3e', '\x3ca:fmtScheme name\x3d"Office"\x3e', '\x3ca:fillStyleLst\x3e', '\x3ca:solidFill\x3e', '\x3ca:schemeClr val\x3d"phClr"/\x3e', '\x3c/a:solidFill\x3e', '\x3ca:gradFill rotWithShape\x3d"1"\x3e', '\x3ca:gsLst\x3e', '\x3ca:gs pos\x3d"0"\x3e', '\x3ca:schemeClr val\x3d"phClr"\x3e', 
'\x3ca:lumMod val\x3d"110000"/\x3e', '\x3ca:satMod val\x3d"105000"/\x3e', '\x3ca:tint val\x3d"67000"/\x3e', '\x3c/a:schemeClr\x3e', '\x3c/a:gs\x3e', '\x3ca:gs pos\x3d"50000"\x3e', '\x3ca:schemeClr val\x3d"phClr"\x3e', '\x3ca:lumMod val\x3d"105000"/\x3e', '\x3ca:satMod val\x3d"103000"/\x3e', '\x3ca:tint val\x3d"73000"/\x3e', '\x3c/a:schemeClr\x3e', '\x3c/a:gs\x3e', '\x3ca:gs pos\x3d"100000"\x3e', '\x3ca:schemeClr val\x3d"phClr"\x3e', '\x3ca:lumMod val\x3d"105000"/\x3e', '\x3ca:satMod val\x3d"109000"/\x3e', 
'\x3ca:tint val\x3d"81000"/\x3e', '\x3c/a:schemeClr\x3e', '\x3c/a:gs\x3e', '\x3c/a:gsLst\x3e', '\x3ca:lin ang\x3d"5400000" scaled\x3d"0"/\x3e', '\x3c/a:gradFill\x3e', '\x3ca:gradFill rotWithShape\x3d"1"\x3e', '\x3ca:gsLst\x3e', '\x3ca:gs pos\x3d"0"\x3e', '\x3ca:schemeClr val\x3d"phClr"\x3e', '\x3ca:satMod val\x3d"103000"/\x3e', '\x3ca:lumMod val\x3d"102000"/\x3e', '\x3ca:tint val\x3d"94000"/\x3e', '\x3c/a:schemeClr\x3e', '\x3c/a:gs\x3e', '\x3ca:gs pos\x3d"50000"\x3e', '\x3ca:schemeClr val\x3d"phClr"\x3e', 
'\x3ca:satMod val\x3d"110000"/\x3e', '\x3ca:lumMod val\x3d"100000"/\x3e', '\x3ca:shade val\x3d"100000"/\x3e', '\x3c/a:schemeClr\x3e', '\x3c/a:gs\x3e', '\x3ca:gs pos\x3d"100000"\x3e', '\x3ca:schemeClr val\x3d"phClr"\x3e', '\x3ca:lumMod val\x3d"99000"/\x3e', '\x3ca:satMod val\x3d"120000"/\x3e', '\x3ca:shade val\x3d"78000"/\x3e', '\x3c/a:schemeClr\x3e', '\x3c/a:gs\x3e', '\x3c/a:gsLst\x3e', '\x3ca:lin ang\x3d"5400000" scaled\x3d"0"/\x3e', '\x3c/a:gradFill\x3e', '\x3c/a:fillStyleLst\x3e', '\x3ca:lnStyleLst\x3e', 
'\x3ca:ln w\x3d"6350" cap\x3d"flat" cmpd\x3d"sng" algn\x3d"ctr"\x3e', '\x3ca:solidFill\x3e', '\x3ca:schemeClr val\x3d"phClr"/\x3e', '\x3c/a:solidFill\x3e', '\x3ca:prstDash val\x3d"solid"/\x3e', '\x3ca:miter lim\x3d"800000"/\x3e', '\x3c/a:ln\x3e', '\x3ca:ln w\x3d"12700" cap\x3d"flat" cmpd\x3d"sng" algn\x3d"ctr"\x3e', '\x3ca:solidFill\x3e', '\x3ca:schemeClr val\x3d"phClr"/\x3e', '\x3c/a:solidFill\x3e', '\x3ca:prstDash val\x3d"solid"/\x3e', '\x3ca:miter lim\x3d"800000"/\x3e', '\x3c/a:ln\x3e', '\x3ca:ln w\x3d"19050" cap\x3d"flat" cmpd\x3d"sng" algn\x3d"ctr"\x3e', 
'\x3ca:solidFill\x3e', '\x3ca:schemeClr val\x3d"phClr"/\x3e', '\x3c/a:solidFill\x3e', '\x3ca:prstDash val\x3d"solid"/\x3e', '\x3ca:miter lim\x3d"800000"/\x3e', '\x3c/a:ln\x3e', '\x3c/a:lnStyleLst\x3e', '\x3ca:effectStyleLst\x3e', '\x3ca:effectStyle\x3e', '\x3ca:effectLst/\x3e', '\x3c/a:effectStyle\x3e', '\x3ca:effectStyle\x3e', '\x3ca:effectLst/\x3e', '\x3c/a:effectStyle\x3e', '\x3ca:effectStyle\x3e', '\x3ca:effectLst\x3e', '\x3ca:outerShdw blurRad\x3d"57150" dist\x3d"19050" dir\x3d"5400000" algn\x3d"ctr" rotWithShape\x3d"0"\x3e', 
'\x3ca:srgbClr val\x3d"000000"\x3e', '\x3ca:alpha val\x3d"63000"/\x3e', '\x3c/a:srgbClr\x3e', '\x3c/a:outerShdw\x3e', '\x3c/a:effectLst\x3e', '\x3c/a:effectStyle\x3e', '\x3c/a:effectStyleLst\x3e', '\x3ca:bgFillStyleLst\x3e', '\x3ca:solidFill\x3e', '\x3ca:schemeClr val\x3d"phClr"/\x3e', '\x3c/a:solidFill\x3e', '\x3ca:solidFill\x3e', '\x3ca:schemeClr val\x3d"phClr"\x3e', '\x3ca:tint val\x3d"95000"/\x3e', '\x3ca:satMod val\x3d"170000"/\x3e', '\x3c/a:schemeClr\x3e', '\x3c/a:solidFill\x3e', '\x3ca:gradFill rotWithShape\x3d"1"\x3e', 
'\x3ca:gsLst\x3e', '\x3ca:gs pos\x3d"0"\x3e', '\x3ca:schemeClr val\x3d"phClr"\x3e', '\x3ca:tint val\x3d"93000"/\x3e', '\x3ca:satMod val\x3d"150000"/\x3e', '\x3ca:shade val\x3d"98000"/\x3e', '\x3ca:lumMod val\x3d"102000"/\x3e', '\x3c/a:schemeClr\x3e', '\x3c/a:gs\x3e', '\x3ca:gs pos\x3d"50000"\x3e', '\x3ca:schemeClr val\x3d"phClr"\x3e', '\x3ca:tint val\x3d"98000"/\x3e', '\x3ca:satMod val\x3d"130000"/\x3e', '\x3ca:shade val\x3d"90000"/\x3e', '\x3ca:lumMod val\x3d"103000"/\x3e', '\x3c/a:schemeClr\x3e', 
'\x3c/a:gs\x3e', '\x3ca:gs pos\x3d"100000"\x3e', '\x3ca:schemeClr val\x3d"phClr"\x3e', '\x3ca:shade val\x3d"63000"/\x3e', '\x3ca:satMod val\x3d"120000"/\x3e', '\x3c/a:schemeClr\x3e', '\x3c/a:gs\x3e', '\x3c/a:gsLst\x3e', '\x3ca:lin ang\x3d"5400000" scaled\x3d"0"/\x3e', '\x3c/a:gradFill\x3e', '\x3c/a:bgFillStyleLst\x3e', '\x3c/a:fmtScheme\x3e', '\x3c/a:themeElements\x3e', '\x3ca:objectDefaults/\x3e', '\x3ca:extraClrSchemeLst/\x3e', '\x3c/a:theme\x3e', {utf8:function(v) {
  return Ext.util.Base64._utf8_encode(v || '');
}}]});
Ext.define('Ext.exporter.file.ooxml.excel.Workbook', {extend:'Ext.exporter.file.ooxml.XmlRels', requires:['Ext.exporter.file.ooxml.excel.Worksheet', 'Ext.exporter.file.ooxml.excel.Stylesheet', 'Ext.exporter.file.ooxml.excel.SharedStrings', 'Ext.exporter.file.ooxml.theme.Office'], isWorkbook:true, currentSheetIndex:1, currentPivotCacheIndex:0, config:{stylesheet:{}, sharedStrings:{}, sheets:[], pivotCaches:null, theme:{type:'office', folder:'/xl/theme/', index:1}}, contentType:{contentType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml'}, 
relationship:{schema:'http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument'}, folder:'/xl/', fileName:'workbook', tpl:['\x3c?xml version\x3d"1.0" encoding\x3d"UTF-8" standalone\x3d"yes"?\x3e', '\x3cworkbook xmlns\x3d"http://schemas.openxmlformats.org/spreadsheetml/2006/main" ', 'xmlns:r\x3d"http://schemas.openxmlformats.org/officeDocument/2006/relationships"\x3e', '\x3ctpl if\x3d"sheets"\x3e', '\x3csheets\x3e', '\x3ctpl if\x3d"sheets"\x3e\x3ctpl for\x3d"sheets.items"\x3e\x3csheet name\x3d"{[this.utf8(values.getName())]}" sheetId\x3d"{[xindex]}" state\x3d"visible" r:id\x3d"{[values.getRelationship().getId()]}"/\x3e\x3c/tpl\x3e\x3c/tpl\x3e', 
'\x3c/sheets\x3e', '\x3c/tpl\x3e', '\x3ctpl if\x3d"pivotCaches"\x3e', '\x3cpivotCaches\x3e', '\x3ctpl for\x3d"pivotCaches.getRange()"\x3e{[values.render()]}\x3c/tpl\x3e', '\x3c/pivotCaches\x3e', '\x3c/tpl\x3e', '\x3c/workbook\x3e', {utf8:function(v) {
  return Ext.util.Base64._utf8_encode(v || '');
}}], destroy:function() {
  var me = this;
  me.setStylesheet(null);
  me.setSharedStrings(null);
  me.setTheme(null);
  me.callParent();
}, collectFiles:function(files) {
  var me = this, style = me._stylesheet, strings = me._sharedStrings, theme = me._theme, ws, i, length;
  ws = me._sheets;
  length = ws.length;
  for (i = 0; i < length; i++) {
    ws.items[i].collectFiles(files);
  }
  files[me._path] = me.render();
  files[style._path] = style.render();
  files[strings._path] = strings.render();
  files[theme._path] = theme.render();
  me.collectRelationshipsFiles(files);
}, collectContentTypes:function(types) {
  var me = this, ws, i, length;
  types.push(me.getStylesheet().getContentType());
  types.push(me.getSharedStrings().getContentType());
  types.push(me.getTheme().getContentType());
  ws = me.getSheets();
  length = ws.length;
  for (i = 0; i < length; i++) {
    ws.getAt(i).collectContentTypes(types);
  }
  me.callParent([types]);
}, applyStylesheet:function(data) {
  if (!data || data.isStylesheet) {
    return data;
  }
  return new Ext.exporter.file.ooxml.excel.Stylesheet;
}, updateStylesheet:function(data, oldData) {
  var rels = this.getRelationships();
  if (oldData && rels) {
    rels.removeRelationship(oldData.getRelationship());
  }
  if (data && rels) {
    rels.addRelationship(data.getRelationship());
  }
  Ext.destroy(oldData);
}, applySharedStrings:function(data) {
  if (!data || data.isSharedStrings) {
    return data;
  }
  return new Ext.exporter.file.ooxml.excel.SharedStrings;
}, updateSharedStrings:function(data, oldData) {
  var rels = this.getRelationships();
  if (oldData && rels) {
    rels.removeRelationship(oldData.getRelationship());
  }
  if (data) {
    rels.addRelationship(data.getRelationship());
  }
  Ext.destroy(oldData);
}, applyPivotCaches:function(data, dataCollection) {
  return this.checkCollection(data, dataCollection, 'Ext.exporter.file.ooxml.excel.PivotCache');
}, updatePivotCaches:function(collection, oldCollection) {
  var me = this;
  if (oldCollection) {
    oldCollection.un({add:me.onPivotCacheAdd, scope:me});
  }
  if (collection) {
    collection.on({add:me.onPivotCacheAdd, scope:me});
  }
}, onPivotCacheAdd:function(collection, details) {
  var length = details.items.length, i, item;
  for (i = 0; i < length; i++) {
    item = details.items[i];
    item.setCacheId(this.currentPivotCacheIndex++);
  }
}, applySheets:function(data, dataCollection) {
  return this.checkCollection(data, dataCollection, 'Ext.exporter.file.ooxml.excel.Sheet');
}, updateSheets:function(collection, oldCollection) {
  var me = this;
  if (oldCollection) {
    oldCollection.un({add:me.onSheetAdd, remove:me.onSheetRemove, scope:me});
  }
  if (collection) {
    collection.on({add:me.onSheetAdd, remove:me.onSheetRemove, scope:me});
  }
}, applyTheme:function(value) {
  var cfg = {type:'office'};
  if (value) {
    if (typeof value == 'string') {
      cfg.type = value;
    } else {
      Ext.apply(cfg, value);
    }
    value = Ext.Factory.ooxmltheme(value);
  }
  return value;
}, updateTheme:function(data, oldData) {
  var rels = this.getRelationships();
  if (oldData && rels) {
    rels.removeRelationship(oldData.getRelationship());
  }
  if (data && rels) {
    rels.addRelationship(data.getRelationship());
  }
  Ext.destroy(oldData);
}, onSheetAdd:function(collection, details) {
  var rels = this.getRelationships(), length = details.items.length, i, item;
  for (i = 0; i < length; i++) {
    item = details.items[i];
    item.setIndex(this.currentSheetIndex++);
    item.setWorkbook(this);
    rels.addRelationship(item.getRelationship());
  }
}, onSheetRemove:function(collection, details) {
  var rels = this.getRelationships(), length = details.items.length, i, item;
  for (i = 0; i < length; i++) {
    item = details.items[i];
    rels.removeRelationship(item.getRelationship());
    Ext.destroy(item);
  }
}, addWorksheet:function(config) {
  var ws = Ext.Array.from(config || {}), length = ws.length, i, w;
  for (i = 0; i < length; i++) {
    w = ws[i];
    if (w && !w.isWorksheet) {
      w.workbook = this;
      ws[i] = new Ext.exporter.file.ooxml.excel.Worksheet(w);
    }
  }
  return this.getSheets().add(ws);
}, removeWorksheet:function(config) {
  return this.getSheets().remove(config);
}, addPivotCache:function(config) {
  if (!this.getPivotCaches()) {
    this.setPivotCaches([]);
  }
  return this.getPivotCaches().add(config || {});
}, removePivotCache:function(config) {
  return this.getPivotCaches().remove(config);
}, addStyle:function(config) {
  return this.getStylesheet().addStyle(config);
}, addCellStyle:function(config) {
  return this.getStylesheet().addCellStyle(config);
}});
Ext.define('Ext.exporter.file.ooxml.ContentTypes', {extend:'Ext.exporter.file.ooxml.Xml', requires:['Ext.exporter.file.ooxml.ContentType'], isContentTypes:true, config:{contentTypes:[{tag:'Default', contentType:'application/vnd.openxmlformats-package.relationships+xml', extension:'rels'}, {tag:'Default', contentType:'application/xml', extension:'xml'}]}, tpl:['\x3c?xml version\x3d"1.0" encoding\x3d"UTF-8" standalone\x3d"yes"?\x3e', '\x3cTypes xmlns\x3d"http://schemas.openxmlformats.org/package/2006/content-types"\x3e', 
'\x3ctpl if\x3d"contentTypes"\x3e\x3ctpl for\x3d"contentTypes.getRange()"\x3e{[values.render()]}\x3c/tpl\x3e\x3c/tpl\x3e', '\x3c/Types\x3e'], folder:'/', fileName:'[Content_Types]', applyContentTypes:function(data, dataCollection) {
  return this.checkCollection(data, dataCollection, 'Ext.exporter.file.ooxml.ContentType');
}, addContentType:function(config) {
  return this.getContentTypes().add(config || {});
}});
Ext.define('Ext.exporter.file.ooxml.CoreProperties', {extend:'Ext.exporter.file.ooxml.Xml', isCoreProperties:true, config:{title:'Workbook', author:'Sencha', subject:''}, contentType:{contentType:'application/vnd.openxmlformats-package.core-properties+xml', partName:'/docProps/core.xml'}, relationship:{schema:'http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties', target:'docProps/core.xml'}, path:'/docProps/core.xml', tpl:['\x3ccoreProperties xmlns\x3d"http://schemas.openxmlformats.org/package/2006/metadata/core-properties" ', 
'xmlns:dcterms\x3d"http://purl.org/dc/terms/" ', 'xmlns:dc\x3d"http://purl.org/dc/elements/1.1/" ', 'xmlns:xsi\x3d"http://www.w3.org/2001/XMLSchema-instance"\x3e', '   \x3cdc:creator\x3e{author:this.utf8}\x3c/dc:creator\x3e', '   \x3cdc:title\x3e{title:this.utf8}\x3c/dc:title\x3e', '   \x3cdc:subject\x3e{subject:this.utf8}\x3c/dc:subject\x3e', '\x3c/coreProperties\x3e', {utf8:function(v) {
  return Ext.util.Base64._utf8_encode(v || '');
}}]});
Ext.define('Ext.exporter.file.ooxml.Excel', {extend:'Ext.exporter.file.ooxml.XmlRels', requires:['Ext.exporter.file.zip.Archive', 'Ext.exporter.file.ooxml.excel.Workbook', 'Ext.exporter.file.ooxml.Relationships', 'Ext.exporter.file.ooxml.ContentTypes', 'Ext.exporter.file.ooxml.CoreProperties'], config:{properties:null, workbook:{}}, folder:'/', fileName:null, tpl:[], constructor:function(config) {
  var ret = this.callParent([config]);
  if (!this.getWorkbook()) {
    this.setWorkbook({});
  }
  return ret;
}, destroy:function() {
  var me = this;
  me.setWorkbook(null);
  me.setProperties(null);
  me.setRelationships(null);
  me.callParent();
}, render:function() {
  var files = {}, paths, path, content, i, len, zip;
  this.collectFiles(files);
  paths = Ext.Object.getKeys(files);
  len = paths.length;
  if (!len) {
    return;
  }
  zip = new Ext.exporter.file.zip.Archive;
  for (i = 0; i < len; i++) {
    path = paths[i];
    content = files[path];
    path = path.substr(1);
    if (path.indexOf('.xml') !== -1 || path.indexOf('.rel') !== -1) {
      zip.addFile({path:path, data:content});
    }
  }
  content = zip.getContent();
  zip = Ext.destroy(zip);
  return content;
}, collectFiles:function(files) {
  var contentTypes = new Ext.exporter.file.ooxml.ContentTypes, wb = this.getWorkbook(), props = this.getProperties(), types = [];
  wb.collectFiles(files);
  if (props) {
    contentTypes.addContentType(props.getContentType());
    files[props.getPath()] = props.render();
  }
  wb.collectContentTypes(types);
  contentTypes.addContentType(types);
  files[contentTypes.getPath()] = contentTypes.render();
  Ext.destroy(contentTypes);
  this.collectRelationshipsFiles(files);
}, applyProperties:function(data) {
  if (!data || data.isCoreProperties) {
    return data;
  }
  return new Ext.exporter.file.ooxml.CoreProperties(data);
}, updateProperties:function(data, oldData) {
  var rels = this.getRelationships();
  if (oldData) {
    rels.removeRelationship(oldData.getRelationship());
    oldData.destroy();
  }
  if (data) {
    rels.addRelationship(data.getRelationship());
  }
}, applyWorkbook:function(data) {
  if (!data || data.isWorkbook) {
    return data;
  }
  return new Ext.exporter.file.ooxml.excel.Workbook(data);
}, updateWorkbook:function(data, oldData) {
  var rels = this.getRelationships();
  if (oldData) {
    rels.removeRelationship(oldData.getRelationship());
    oldData.destroy();
  }
  if (data) {
    rels.addRelationship(data.getRelationship());
  }
}, addWorksheet:function(config) {
  return this.getWorkbook().addWorksheet(config);
}, addStyle:function(config) {
  return this.getWorkbook().getStylesheet().addStyle(config);
}, addCellStyle:function(config, parentStyleId) {
  return this.getWorkbook().getStylesheet().addCellStyle(config, parentStyleId);
}});
Ext.define('Ext.exporter.excel.Xlsx', {extend:'Ext.exporter.Base', alternateClassName:'Ext.exporter.Excel', alias:['exporter.excel07', 'exporter.xlsx', 'exporter.excel'], requires:['Ext.exporter.file.ooxml.Excel'], config:{defaultStyle:{alignment:{vertical:'Top'}, font:{fontName:'Arial', family:'Swiss', size:11, color:'#000000'}}, titleStyle:{alignment:{horizontal:'Center', vertical:'Center'}, font:{fontName:'Arial', family:'Swiss', size:18, color:'#1F497D'}}, groupHeaderStyle:{borders:[{position:'Bottom', 
lineStyle:'Continuous', weight:1, color:'#4F81BD'}]}, groupFooterStyle:{borders:[{position:'Top', lineStyle:'Continuous', weight:1, color:'#4F81BD'}]}, tableHeaderStyle:{alignment:{horizontal:'Center', vertical:'Center'}, borders:[{position:'Bottom', lineStyle:'Continuous', weight:1, color:'#4F81BD'}], font:{fontName:'Arial', family:'Swiss', size:11, color:'#1F497D'}}}, fileName:'export.xlsx', charset:'ascii', mimeType:'application/zip', binary:true, titleRowHeight:22.5, headerRowHeight:20.25, destroy:function() {
  var me = this;
  me.excel = me.worksheet = Ext.destroy(me.excel, me.worksheet);
  me.callParent();
}, getContent:function() {
  var me = this, config = this.getConfig(), data = config.data, colMerge, ws;
  me.excel = new Ext.exporter.file.ooxml.Excel({properties:{title:config.title, author:config.author}});
  me.worksheet = ws = me.excel.addWorksheet({name:config.title});
  me.tableHeaderStyleId = me.excel.addCellStyle(config.tableHeaderStyle);
  colMerge = data ? data.getColumnCount() : 1;
  ws.beginRowRendering();
  me.addTitle(config, colMerge);
  if (data) {
    ws.renderRows(me.buildHeader());
    ws.renderRows(me.buildRows(data, colMerge, -1));
  }
  ws.endRowRendering();
  me.columnStylesNormal = me.columnStylesNormalId = me.columnStylesFooter = me.columnStylesFooterId = null;
  me.headerStyles = me.footerStyles = null;
  return me.excel.render();
}, addTitle:function(config, colMerge) {
  if (!Ext.isEmpty(config.title)) {
    this.worksheet.renderRow({height:this.titleRowHeight, cells:[{mergeAcross:colMerge - 1, value:config.title, styleId:this.excel.addCellStyle(config.titleStyle)}]});
  }
}, buildRows:function(group, colMerge, level) {
  var me = this, showSummary = me._showSummary, rows = [], groups, row, styleH, styleF, cells, i, j, k, gLen, sLen, cLen, oneLine, text, items, cell, temp, style;
  if (!group) {
    return rows;
  }
  groups = group._groups;
  text = group._text;
  oneLine = !groups && !group._rows;
  if (showSummary !== false && !Ext.isEmpty(text) && !oneLine) {
    styleH = me.getGroupHeaderStyleByLevel(level);
    rows.push({styleId:styleH, cells:[{mergeAcross:colMerge - 1, value:text, styleId:styleH}]});
  }
  if (groups) {
    gLen = groups.length;
    for (i = 0; i < gLen; i++) {
      Ext.Array.insert(rows, rows.length, me.buildRows(groups.items[i], colMerge, level + 1));
    }
  }
  if (group._rows) {
    items = group._rows.items;
    sLen = items.length;
    for (k = 0; k < sLen; k++) {
      temp = items[k];
      row = {id:temp._id, cells:[]};
      cells = temp._cells;
      cLen = cells.length;
      for (j = 0; j < cLen; j++) {
        cell = cells.items[j];
        style = me.columnStylesNormalId[j];
        row.cells.push({id:cell._id, value:cell._value, styleId:me.getCellStyleId(cell._style, style)});
      }
      rows.push(row);
    }
  }
  items = group._summaries && group._summaries.items;
  if (items && (showSummary || oneLine)) {
    styleF = me.getGroupFooterStyleByLevel(level);
    sLen = items.length;
    for (k = 0; k < sLen; k++) {
      temp = items[k];
      row = {id:temp._id, cells:[]};
      cells = temp._cells;
      cLen = cells.length;
      for (j = 0; j < cLen; j++) {
        cell = cells.items[j];
        style = oneLine ? me.columnStylesNormalId[j] : j === 0 ? styleF : me.columnStylesFooterId[j];
        row.cells.push({id:cell._id, value:cell._value, styleId:me.getCellStyleId(cell._style, style)});
      }
      rows.push(row);
    }
  }
  group.destroy();
  return rows;
}, getGroupHeaderStyleByLevel:function(level) {
  var me = this, key = 'l' + level, styles = me.headerStyles;
  if (!styles) {
    me.headerStyles = styles = {};
  }
  if (!styles.hasOwnProperty(key)) {
    styles[key] = me.excel.addCellStyle(Ext.applyIf({alignment:{Indent:level > 0 ? level : 0}}, me._groupHeaderStyle));
  }
  return styles[key];
}, getGroupFooterStyleByLevel:function(level) {
  var me = this, key = 'l' + level, styles = me.footerStyles;
  if (!styles) {
    me.footerStyles = styles = {};
  }
  if (!styles.hasOwnProperty(key)) {
    styles[key] = me.excel.addCellStyle(Ext.applyIf({alignment:{Indent:level > 0 ? level : 0}}, me.columnStylesFooter[0]));
  }
  return styles[key];
}, buildHeader:function() {
  var me = this, ret = {}, data = me.getData(), rows = [], keys, row, i, j, len, lenCells, style, arr, fStyle, col, colCfg, cell;
  me.buildHeaderRows(data.getColumns(), ret);
  keys = Ext.Object.getKeys(ret);
  len = keys.length;
  for (i = 0; i < len; i++) {
    row = {height:me.headerRowHeight, styleId:me.tableHeaderStyleId, cells:[]};
    arr = ret[keys[i]];
    lenCells = arr.length;
    for (j = 0; j < lenCells; j++) {
      cell = arr[j];
      cell.styleId = me.tableHeaderStyleId;
      row.cells.push(cell);
    }
    rows.push(row);
  }
  arr = data.getBottomColumns();
  lenCells = arr.length;
  me.columnStylesNormal = [];
  me.columnStylesNormalId = [];
  me.columnStylesFooter = [];
  me.columnStylesFooterId = [];
  fStyle = me.getGroupFooterStyle();
  for (j = 0; j < lenCells; j++) {
    col = arr[j];
    colCfg = {style:col.getStyle(), width:col.getWidth()};
    style = Ext.applyIf({parentId:0}, fStyle);
    style = Ext.merge(style, colCfg.style);
    me.columnStylesFooter.push(style);
    me.columnStylesFooterId.push(me.excel.addCellStyle(style));
    style = Ext.applyIf({parentId:0}, colCfg.style);
    me.columnStylesNormal.push(style);
    colCfg.styleId = me.excel.addCellStyle(style);
    me.columnStylesNormalId.push(colCfg.styleId);
    colCfg.min = colCfg.max = j + 1;
    colCfg.style = null;
    if (colCfg.width) {
      colCfg.width = colCfg.width / 10;
    }
    me.worksheet.addColumn(colCfg);
  }
  return rows;
}, getCellStyleId:function(style, parentStyleId) {
  return style ? this.excel.addCellStyle(style, parentStyleId) : parentStyleId;
}, buildHeaderRows:function(columns, result) {
  var col, cols, i, len, name;
  if (!columns) {
    return;
  }
  len = columns.length;
  for (i = 0; i < len; i++) {
    col = columns.items[i].getConfig();
    col.value = col.text;
    cols = col.columns;
    delete col.columns;
    delete col.table;
    name = 's' + col.level;
    result[name] = result[name] || [];
    result[name].push(col);
    this.buildHeaderRows(cols, result);
  }
}});
Ext.define('Ext.exporter.Plugin', {extend:'Ext.plugin.Abstract', alias:['plugin.exporterplugin'], requires:['Ext.exporter.data.Table', 'Ext.exporter.Excel'], init:function(cmp) {
  var me = this;
  cmp.saveDocumentAs = Ext.bind(me.saveDocumentAs, me);
  cmp.getDocumentData = Ext.bind(me.getDocumentData, me);
  me.cmp = cmp;
  return me.callParent([cmp]);
}, destroy:function() {
  var me = this, cmp = me.cmp;
  cmp.saveDocumentAs = cmp.getDocumentData = me.cmp = me.delayedSaveTimer = Ext.unasap(me.delayedSaveTimer);
  me.callParent();
}, saveDocumentAs:function(config) {
  var cmp = this.cmp, deferred = new Ext.Deferred, exporter = this.getExporter(config);
  cmp.fireEvent('beforedocumentsave', cmp, {config:config, exporter:exporter});
  this.delayedSaveTimer = Ext.asap(this.delayedSave, this, [exporter, config, deferred]);
  return deferred.promise;
}, delayedSave:function(exporter, config, deferred) {
  var cmp = this.cmp;
  if (this.disabled || !cmp) {
    Ext.destroy(exporter);
    deferred.reject();
    return;
  }
  this.setExporterData(exporter, config);
  exporter.saveAs().then(function() {
    deferred.resolve(config);
  }, function(msg) {
    deferred.reject(msg);
  }).always(function() {
    var canFire = cmp && !cmp.destroyed;
    if (canFire) {
      cmp.fireEvent('documentsave', cmp, {config:config, exporter:exporter});
    }
    Ext.destroy(exporter);
    if (canFire) {
      cmp.fireEvent('exportfinished', cmp, {config:config});
    }
  });
}, getDocumentData:function(config) {
  var exporter, ret;
  if (this.disabled) {
    return;
  }
  exporter = this.getExporter(config);
  this.setExporterData(exporter, config);
  ret = exporter.getContent();
  Ext.destroy(exporter);
  return ret;
}, getExporter:function(config) {
  var cfg = Ext.apply({type:'excel'}, config);
  return Ext.Factory.exporter(cfg);
}, setExporterData:function(exporter, config) {
  var cmp = this.cmp;
  exporter.setData(this.prepareData(config));
  cmp.fireEvent('dataready', cmp, {config:config, exporter:exporter});
}, getExportStyle:function(style, config) {
  var type = config && config.type, types, def, index;
  if (Ext.isArray(style)) {
    types = Ext.Array.pluck(style, 'type');
    index = Ext.Array.indexOf(types, undefined);
    if (index >= 0) {
      def = style[index];
    }
    index = Ext.Array.indexOf(types, type);
    return index >= 0 ? style[index] : def;
  } else {
    return style;
  }
}, prepareData:Ext.emptyFn});
Ext.define('Ext.exporter.file.excel.Worksheet', {extend:'Ext.exporter.file.Base', config:{name:'Sheet', protection:null, rightToLeft:null, showGridLines:true, tables:[]}, tpl:['   \x3cWorksheet ss:Name\x3d"{name:htmlEncode}"', '\x3ctpl if\x3d"this.exists(protection)"\x3e ss:Protected\x3d"{protection:this.toNumber}"\x3c/tpl\x3e', '\x3ctpl if\x3d"this.exists(rightToLeft)"\x3e ss:RightToLeft\x3d"{rightToLeft:this.toNumber}"\x3c/tpl\x3e', '\x3e\n', '\x3ctpl if\x3d"tables"\x3e\x3ctpl for\x3d"tables.getRange()"\x3e{[values.render()]}\x3c/tpl\x3e\x3c/tpl\x3e', 
'       \x3cWorksheetOptions xmlns\x3d"urn:schemas-microsoft-com:office:excel"\x3e\n', '          \x3cPageSetup\x3e\n', '              \x3cLayout x:CenterHorizontal\x3d"1" x:Orientation\x3d"Portrait" /\x3e\n', '              \x3cHeader x:Margin\x3d"0.3" /\x3e\n', '              \x3cFooter x:Margin\x3d"0.3" x:Data\x3d"Page \x26amp;P of \x26amp;N" /\x3e\n', '              \x3cPageMargins x:Bottom\x3d"0.75" x:Left\x3d"0.7" x:Right\x3d"0.7" x:Top\x3d"0.75" /\x3e\n', '          \x3c/PageSetup\x3e\n', 
'          \x3cFitToPage /\x3e\n', '          \x3cPrint\x3e\n', '              \x3cPrintErrors\x3eBlank\x3c/PrintErrors\x3e\n', '              \x3cFitWidth\x3e1\x3c/FitWidth\x3e\n', '              \x3cFitHeight\x3e32767\x3c/FitHeight\x3e\n', '              \x3cValidPrinterInfo /\x3e\n', '              \x3cVerticalResolution\x3e600\x3c/VerticalResolution\x3e\n', '          \x3c/Print\x3e\n', '          \x3cSelected /\x3e\n', '\x3ctpl if\x3d"!showGridLines"\x3e', '          \x3cDoNotDisplayGridlines /\x3e\n', 
'\x3c/tpl\x3e', '          \x3cProtectObjects\x3eFalse\x3c/ProtectObjects\x3e\n', '          \x3cProtectScenarios\x3eFalse\x3c/ProtectScenarios\x3e\n', '      \x3c/WorksheetOptions\x3e\n', '   \x3c/Worksheet\x3e\n', {exists:function(value) {
  return !Ext.isEmpty(value);
}, toNumber:function(value) {
  return Number(Boolean(value));
}}], destroy:function() {
  this.setTables(null);
  this.callParent();
}, applyTables:function(data, dataCollection) {
  return this.checkCollection(data, dataCollection, 'Ext.exporter.file.excel.Table');
}, addTable:function(config) {
  return this.getTables().add(config || {});
}, getTable:function(id) {
  return this.getTables().get(id);
}, applyName:function(value) {
  return Ext.String.ellipsis(String(value), 31);
}});
Ext.define('Ext.exporter.file.excel.Table', {extend:'Ext.exporter.file.Base', config:{expandedColumnCount:null, expandedRowCount:null, fullColumns:1, fullRows:1, defaultColumnWidth:48, defaultRowHeight:12.75, styleId:null, leftCell:1, topCell:1, columns:[], rows:[]}, tpl:['       \x3cTable x:FullColumns\x3d"{fullColumns}" x:FullRows\x3d"{fullRows}"', '\x3ctpl if\x3d"this.exists(expandedRowCount)"\x3e ss:ExpandedRowCount\x3d"{expandedRowCount}"\x3c/tpl\x3e', '\x3ctpl if\x3d"this.exists(expandedColumnCount)"\x3e ss:ExpandedColumnCount\x3d"{expandedColumnCount}"\x3c/tpl\x3e', 
'\x3ctpl if\x3d"this.exists(defaultRowHeight)"\x3e ss:DefaultRowHeight\x3d"{defaultRowHeight}"\x3c/tpl\x3e', '\x3ctpl if\x3d"this.exists(defaultColumnWidth)"\x3e ss:DefaultColumnWidth\x3d"{defaultColumnWidth}"\x3c/tpl\x3e', '\x3ctpl if\x3d"this.exists(leftCell)"\x3e ss:LeftCell\x3d"{leftCell}"\x3c/tpl\x3e', '\x3ctpl if\x3d"this.exists(topCell)"\x3e ss:TopCell\x3d"{topCell}"\x3c/tpl\x3e', '\x3ctpl if\x3d"this.exists(styleId)"\x3e ss:StyleID\x3d"{styleId}"\x3c/tpl\x3e', '\x3e\n', '\x3ctpl if\x3d"columns"\x3e\x3ctpl for\x3d"columns.getRange()"\x3e{[values.render()]}\x3c/tpl\x3e\x3c/tpl\x3e', 
'\x3ctpl if\x3d"rows"\x3e', '\x3ctpl for\x3d"rows.getRange()"\x3e{[values.render()]}\x3c/tpl\x3e', '\x3ctpl else\x3e         \x3cRow ss:AutoFitHeight\x3d"0"/\x3e\n\x3c/tpl\x3e', '       \x3c/Table\x3e\n', {exists:function(value) {
  return !Ext.isEmpty(value);
}}], destroy:function() {
  this.setColumns(null);
  this.setRows(null);
  this.callParent();
}, applyColumns:function(data, dataCollection) {
  return this.checkCollection(data, dataCollection, 'Ext.exporter.file.excel.Column');
}, applyRows:function(data, dataCollection) {
  return this.checkCollection(data, dataCollection, 'Ext.exporter.file.excel.Row');
}, addColumn:function(config) {
  return this.getColumns().add(config || {});
}, getColumn:function(id) {
  return this.getColumns().get(id);
}, addRow:function(config) {
  return this.getRows().add(config || {});
}, getRow:function(id) {
  return this.getRows().get(id);
}});
Ext.define('Ext.exporter.file.excel.Style', {extend:'Ext.exporter.file.Style', config:{parentId:null, protection:null}, checks:{alignment:{horizontal:['Automatic', 'Left', 'Center', 'Right', 'Fill', 'Justify', 'CenterAcrossSelection', 'Distributed', 'JustifyDistributed'], shrinkToFit:[true, false], vertical:['Automatic', 'Top', 'Bottom', 'Center', 'Justify', 'Distributed', 'JustifyDistributed'], verticalText:[true, false], wrapText:[true, false]}, font:{family:['Automatic', 'Decorative', 'Modern', 
'Roman', 'Script', 'Swiss'], outline:[true, false], shadow:[true, false], underline:['None', 'Single', 'Double', 'SingleAccounting', 'DoubleAccounting'], verticalAlign:['None', 'Subscript', 'Superscript']}, border:{position:['Left', 'Top', 'Right', 'Bottom', 'DiagonalLeft', 'DiagonalRight'], lineStyle:['None', 'Continuous', 'Dash', 'Dot', 'DashDot', 'DashDotDot', 'SlantDashDot', 'Double'], weight:[0, 1, 2, 3]}, interior:{pattern:['None', 'Solid', 'Gray75', 'Gray50', 'Gray25', 'Gray125', 'Gray0625', 
'HorzStripe', 'VertStripe', 'ReverseDiagStripe', 'DiagStripe', 'DiagCross', 'ThickDiagCross', 'ThinHorzStripe', 'ThinVertStripe', 'ThinReverseDiagStripe', 'ThinDiagStripe', 'ThinHorzCross', 'ThinDiagCross']}, protection:{'protected':[true, false], hideFormula:[true, false]}}, tpl:['       \x3cStyle ss:ID\x3d"{id}"', '\x3ctpl if\x3d"this.exists(parentId)"\x3e ss:Parent\x3d"{parentId}"\x3c/tpl\x3e', '\x3ctpl if\x3d"this.exists(name)"\x3e ss:Name\x3d"{name}"\x3c/tpl\x3e', '\x3e\n', '\x3ctpl if\x3d"this.exists(alignment)"\x3e           \x3cAlignment{[this.getAttributes(values.alignment, "alignment")]}/\x3e\n\x3c/tpl\x3e', 
'\x3ctpl if\x3d"this.exists(borders)"\x3e', '           \x3cBorders\x3e\n', '\x3ctpl for\x3d"borders"\x3e               \x3cBorder{[this.getAttributes(values, "border")]}/\x3e\n\x3c/tpl\x3e', '           \x3c/Borders\x3e\n', '\x3c/tpl\x3e', '\x3ctpl if\x3d"this.exists(font)"\x3e           \x3cFont{[this.getAttributes(values.font, "font")]}/\x3e\n\x3c/tpl\x3e', '\x3ctpl if\x3d"this.exists(interior)"\x3e           \x3cInterior{[this.getAttributes(values.interior, "interior")]}/\x3e\n\x3c/tpl\x3e', 
'\x3ctpl if\x3d"this.exists(format)"\x3e           \x3cNumberFormat ss:Format\x3d"{format}"/\x3e\n\x3c/tpl\x3e', '\x3ctpl if\x3d"this.exists(protection)"\x3e           \x3cProtection{[this.getAttributes(values.protection, "protection")]}/\x3e\n\x3c/tpl\x3e', '       \x3c/Style\x3e\n', {exists:function(value) {
  return !Ext.isEmpty(value);
}, getAttributes:function(obj, checkName) {
  var template = ' ss:{0}\x3d"{1}"', keys = Ext.Object.getKeys(obj || {}), len = keys.length, s = '', i, key;
  for (i = 0; i < len; i++) {
    key = keys[i];
    s += Ext.String.format(template, Ext.String.capitalize(key), Ext.isBoolean(obj[key]) ? Number(obj[key]) : obj[key]);
  }
  return s;
}}], autoGenerateKey:['parentId', 'protection']});
Ext.define('Ext.exporter.file.excel.Row', {extend:'Ext.exporter.file.Base', config:{autoFitHeight:false, caption:null, cells:[], height:null, index:null, span:null, styleId:null}, tpl:['           \x3cRow', '\x3ctpl if\x3d"this.exists(index)"\x3e ss:Index\x3d"{index}"\x3c/tpl\x3e', '\x3ctpl if\x3d"this.exists(caption)"\x3e c:Caption\x3d"{caption}"\x3c/tpl\x3e', '\x3ctpl if\x3d"this.exists(autoFitHeight)"\x3e ss:AutoFitHeight\x3d"{autoFitHeight:this.toNumber}"\x3c/tpl\x3e', '\x3ctpl if\x3d"this.exists(span)"\x3e ss:Span\x3d"{span}"\x3c/tpl\x3e', 
'\x3ctpl if\x3d"this.exists(height)"\x3e ss:Height\x3d"{height}"\x3c/tpl\x3e', '\x3ctpl if\x3d"this.exists(styleId)"\x3e ss:StyleID\x3d"{styleId}"\x3c/tpl\x3e', '\x3e\n', '\x3ctpl if\x3d"cells"\x3e\x3ctpl for\x3d"cells.getRange()"\x3e{[values.render()]}\x3c/tpl\x3e\x3c/tpl\x3e', '           \x3c/Row\x3e\n', {exists:function(value) {
  return !Ext.isEmpty(value);
}, toNumber:function(value) {
  return Number(Boolean(value));
}}], destroy:function() {
  this.setCells(null);
  this.callParent();
}, applyCells:function(data, dataCollection) {
  return this.checkCollection(data, dataCollection, 'Ext.exporter.file.excel.Cell');
}, addCell:function(config) {
  return this.getCells().add(config || {});
}, getCell:function(id) {
  return this.getCells().get(id);
}});
Ext.define('Ext.exporter.file.excel.Column', {extend:'Ext.exporter.file.Base', config:{autoFitWidth:false, caption:null, hidden:null, index:null, span:null, styleId:null, width:null}, tpl:['\x3cColumn', '\x3ctpl if\x3d"this.exists(index)"\x3e ss:Index\x3d"{index}"\x3c/tpl\x3e', '\x3ctpl if\x3d"this.exists(caption)"\x3e c:Caption\x3d"{caption}"\x3c/tpl\x3e', '\x3ctpl if\x3d"this.exists(styleId)"\x3e ss:StyleID\x3d"{styleId}"\x3c/tpl\x3e', '\x3ctpl if\x3d"this.exists(hidden)"\x3e ss:Hidden\x3d"{hidden}"\x3c/tpl\x3e', 
'\x3ctpl if\x3d"this.exists(span)"\x3e ss:Span\x3d"{span}"\x3c/tpl\x3e', '\x3ctpl if\x3d"this.exists(width)"\x3e ss:Width\x3d"{width}"\x3c/tpl\x3e', '\x3ctpl if\x3d"this.exists(autoFitWidth)"\x3e ss:AutoFitWidth\x3d"{autoFitWidth:this.toNumber}"\x3c/tpl\x3e', '/\x3e\n', {exists:function(value) {
  return !Ext.isEmpty(value);
}, toNumber:function(value) {
  return Number(Boolean(value));
}}]});
Ext.define('Ext.exporter.file.excel.Cell', {extend:'Ext.exporter.file.Base', config:{dataType:'String', formula:null, index:null, styleId:null, mergeAcross:null, mergeDown:null, value:''}, tpl:['               \x3cCell', '\x3ctpl if\x3d"this.exists(index)"\x3e ss:Index\x3d"{index}"\x3c/tpl\x3e', '\x3ctpl if\x3d"this.exists(styleId)"\x3e ss:StyleID\x3d"{styleId}"\x3c/tpl\x3e', '\x3ctpl if\x3d"this.exists(mergeAcross)"\x3e ss:MergeAcross\x3d"{mergeAcross}"\x3c/tpl\x3e', '\x3ctpl if\x3d"this.exists(mergeDown)"\x3e ss:MergeDown\x3d"{mergeDown}"\x3c/tpl\x3e', 
'\x3ctpl if\x3d"this.exists(formula)"\x3e ss:Formula\x3d"{formula}"\x3c/tpl\x3e', '\x3e\n', '                   \x3cData ss:Type\x3d"{dataType}"\x3e{value}\x3c/Data\x3e\n', '               \x3c/Cell\x3e\n', {exists:function(value) {
  return !Ext.isEmpty(value);
}}], applyValue:function(v) {
  var dt = 'String', format = Ext.util.Format;
  if (v instanceof Date) {
    dt = 'DateTime';
    v = Ext.Date.format(v, 'Y-m-d\\TH:i:s.u');
  } else {
    if (Ext.isNumber(v)) {
      dt = 'Number';
    } else {
      if (Ext.isBoolean(v)) {
        dt = 'Boolean';
        v = Number(v);
      } else {
        v = format.htmlEncode(format.htmlDecode(v));
      }
    }
  }
  this.setDataType(dt);
  return v;
}});
Ext.define('Ext.exporter.file.excel.Workbook', {extend:'Ext.exporter.file.Base', requires:['Ext.exporter.file.excel.Worksheet', 'Ext.exporter.file.excel.Table', 'Ext.exporter.file.excel.Style', 'Ext.exporter.file.excel.Row', 'Ext.exporter.file.excel.Column', 'Ext.exporter.file.excel.Cell'], config:{title:'Workbook', author:'Sencha', windowHeight:9000, windowWidth:50000, protectStructure:false, protectWindows:false, styles:[], worksheets:[]}, tpl:['\x3c?xml version\x3d"1.0" encoding\x3d"utf-8"?\x3e\n', 
'\x3c?mso-application progid\x3d"Excel.Sheet"?\x3e\n', '\x3cWorkbook ', 'xmlns\x3d"urn:schemas-microsoft-com:office:spreadsheet" ', 'xmlns:o\x3d"urn:schemas-microsoft-com:office:office" ', 'xmlns:x\x3d"urn:schemas-microsoft-com:office:excel" ', 'xmlns:ss\x3d"urn:schemas-microsoft-com:office:spreadsheet" ', 'xmlns:html\x3d"http://www.w3.org/TR/REC-html40"\x3e\n', '   \x3cDocumentProperties xmlns\x3d"urn:schemas-microsoft-com:office:office"\x3e\n', '       \x3cTitle\x3e{title:htmlEncode}\x3c/Title\x3e\n', 
'       \x3cAuthor\x3e{author:htmlEncode}\x3c/Author\x3e\n', '       \x3cCreated\x3e{createdAt}\x3c/Created\x3e\n', '   \x3c/DocumentProperties\x3e\n', '   \x3cExcelWorkbook xmlns\x3d"urn:schemas-microsoft-com:office:excel"\x3e\n', '       \x3cWindowHeight\x3e{windowHeight}\x3c/WindowHeight\x3e\n', '       \x3cWindowWidth\x3e{windowWidth}\x3c/WindowWidth\x3e\n', '       \x3cProtectStructure\x3e{protectStructure}\x3c/ProtectStructure\x3e\n', '       \x3cProtectWindows\x3e{protectWindows}\x3c/ProtectWindows\x3e\n', 
'   \x3c/ExcelWorkbook\x3e\n', '   \x3cStyles\x3e\n', '\x3ctpl if\x3d"styles"\x3e\x3ctpl for\x3d"styles.getRange()"\x3e{[values.render()]}\x3c/tpl\x3e\x3c/tpl\x3e', '   \x3c/Styles\x3e\n', '\x3ctpl if\x3d"worksheets"\x3e\x3ctpl for\x3d"worksheets.getRange()"\x3e{[values.render()]}\x3c/tpl\x3e\x3c/tpl\x3e', '\x3c/Workbook\x3e'], destroy:function() {
  this.setStyles(null);
  this.setWorksheets(null);
  this.callParent();
}, applyStyles:function(data, dataCollection) {
  return this.checkCollection(data, dataCollection, 'Ext.exporter.file.excel.Style');
}, applyWorksheets:function(data, dataCollection) {
  return this.checkCollection(data, dataCollection, 'Ext.exporter.file.excel.Worksheet');
}, addStyle:function(config) {
  var styles = this.getStyles(), items = styles.decodeItems(arguments, 0), len = items.length, ret = [], i, found, item;
  for (i = 0; i < len; i++) {
    item = items[i];
    found = styles.get(item.getKey());
    ret.push(found ? found : styles.add(item));
    if (found) {
      item.destroy();
    }
  }
  return ret.length === 1 ? ret[0] : ret;
}, getStyle:function(id) {
  return this.getStyles().get(id);
}, addWorksheet:function(config) {
  return this.getWorksheets().add(config || {});
}, getWorksheet:function(id) {
  return this.getWorksheets().get(id);
}});
Ext.define('Ext.exporter.excel.Xml', {extend:'Ext.exporter.Base', alias:'exporter.excel03', requires:['Ext.exporter.file.excel.Workbook'], config:{windowHeight:9000, windowWidth:50000, protectStructure:false, protectWindows:false, defaultStyle:{alignment:{vertical:'Top'}, font:{fontName:'Calibri', family:'Swiss', size:11, color:'#000000'}}, titleStyle:{name:'Title', parentId:'Default', alignment:{horizontal:'Center', vertical:'Center'}, font:{fontName:'Cambria', family:'Swiss', size:18, color:'#1F497D'}}, 
groupHeaderStyle:{name:'Group Header', parentId:'Default', borders:[{position:'Bottom', lineStyle:'Continuous', weight:1, color:'#4F81BD'}]}, groupFooterStyle:{borders:[{position:'Top', lineStyle:'Continuous', weight:1, color:'#4F81BD'}]}, tableHeaderStyle:{name:'Heading 1', parentId:'Default', alignment:{horizontal:'Center', vertical:'Center'}, borders:[{position:'Bottom', lineStyle:'Continuous', weight:1, color:'#4F81BD'}], font:{fontName:'Calibri', family:'Swiss', size:11, color:'#1F497D'}}}, 
fileName:'export.xml', mimeType:'text/xml', titleRowHeight:22.5, headerRowHeight:20.25, destroy:function() {
  var me = this;
  me.workbook = me.table = Ext.destroy(me.workbook);
  me.callParent();
}, applyDefaultStyle:function(newValue) {
  return Ext.applyIf({id:'Default', name:'Normal'}, newValue || {});
}, getContent:function() {
  var me = this, config = this.getConfig(), data = config.data, colMerge;
  me.workbook = new Ext.exporter.file.excel.Workbook({title:config.title, author:config.author, windowHeight:config.windowHeight, windowWidth:config.windowWidth, protectStructure:config.protectStructure, protectWindows:config.protectWindows});
  me.table = me.workbook.addWorksheet({name:config.title}).addTable();
  me.workbook.addStyle(config.defaultStyle);
  me.tableHeaderStyleId = me.workbook.addStyle(config.tableHeaderStyle).getId();
  me.groupHeaderStyleId = me.workbook.addStyle(config.groupHeaderStyle).getId();
  colMerge = data ? data.getColumnCount() : 1;
  me.addTitle(config, colMerge);
  if (data) {
    me.buildHeader();
    me.table.addRow(me.buildRows(data, colMerge, -1));
  }
  me.columnStylesFooter = me.columnStylesNormal = null;
  me.headerStyles = me.footerStyles = null;
  return me.workbook.render();
}, addTitle:function(config, colMerge) {
  if (!Ext.isEmpty(config.title)) {
    this.table.addRow({autoFitHeight:1, height:this.titleRowHeight, styleId:this.workbook.addStyle(config.titleStyle).getId()}).addCell({mergeAcross:colMerge - 1, value:config.title});
  }
}, buildRows:function(group, colMerge, level) {
  var me = this, showSummary = me.getShowSummary(), rows = [], groups, row, styleH, styleF, cells, i, j, k, gLen, sLen, cLen, oneLine, cell, text, style;
  if (!group) {
    return;
  }
  groups = group._groups;
  text = group._text;
  oneLine = !groups && !group._rows;
  if (showSummary !== false && !Ext.isEmpty(text) && !oneLine) {
    styleH = me.getGroupHeaderStyleByLevel(level);
    rows.push({cells:[{mergeAcross:colMerge - 1, value:text, styleId:styleH}]});
  }
  if (groups) {
    gLen = groups.length;
    for (i = 0; i < gLen; i++) {
      Ext.Array.insert(rows, rows.length, me.buildRows(groups.items[i], colMerge, level + 1));
    }
  }
  if (group._rows) {
    sLen = group._rows.length;
    for (k = 0; k < sLen; k++) {
      row = {cells:[]};
      cells = group._rows.items[k]._cells;
      cLen = cells.length;
      for (j = 0; j < cLen; j++) {
        cell = cells.items[j];
        style = me.columnStylesNormal[j];
        row.cells.push({value:cell._value, styleId:me.getCellStyleId(cell._style, style)});
      }
      rows.push(row);
    }
  }
  if (group._summaries && (showSummary || oneLine)) {
    styleF = me.getGroupFooterStyleByLevel(level);
    sLen = group._summaries.length;
    for (k = 0; k < sLen; k++) {
      row = {cells:[]};
      cells = group._summaries.items[k]._cells;
      cLen = cells.length;
      for (j = 0; j < cLen; j++) {
        cell = cells.items[j];
        style = oneLine ? me.columnStylesNormal[j] : j === 0 ? styleF : me.columnStylesFooter[j];
        row.cells.push({value:cell._value, styleId:me.getCellStyleId(cell._style, style)});
      }
      rows.push(row);
    }
  }
  return rows;
}, getCellStyleId:function(style, parentStyleId) {
  var config = Ext.applyIf({parentId:parentStyleId}, style);
  return style ? this.workbook.addStyle(config).getId() : parentStyleId;
}, getGroupHeaderStyleByLevel:function(level) {
  var me = this, key = 'l' + level, styles = me.headerStyles;
  if (!styles) {
    me.headerStyles = styles = {};
  }
  if (!styles.hasOwnProperty(key)) {
    styles[key] = me.workbook.addStyle({parentId:me.groupHeaderStyleId, alignment:{Indent:level > 0 ? level : 0}}).getId();
  }
  return styles[key];
}, getGroupFooterStyleByLevel:function(level) {
  var me = this, key = 'l' + level, styles = me.footerStyles;
  if (!styles) {
    me.footerStyles = styles = {};
  }
  if (!styles.hasOwnProperty(key)) {
    styles[key] = me.workbook.addStyle({parentId:me.columnStylesFooter[0], alignment:{Indent:level > 0 ? level : 0}}).getId();
  }
  return styles[key];
}, buildHeader:function() {
  var me = this, ret = {}, data = me.getData(), keys, row, i, j, len, lenCells, style, arr, fStyle, col, colCfg;
  me.buildHeaderRows(data.getColumns(), ret);
  keys = Ext.Object.getKeys(ret);
  len = keys.length;
  for (i = 0; i < len; i++) {
    row = me.table.addRow({height:me.headerRowHeight, autoFitHeight:1});
    arr = ret[keys[i]];
    lenCells = arr.length;
    for (j = 0; j < lenCells; j++) {
      row.addCell(arr[j]).setStyleId(me.tableHeaderStyleId);
    }
  }
  arr = data.getBottomColumns();
  lenCells = arr.length;
  me.columnStylesNormal = [];
  me.columnStylesFooter = [];
  fStyle = me.getGroupFooterStyle();
  for (j = 0; j < lenCells; j++) {
    col = arr[j];
    colCfg = {width:col.getWidth()};
    style = Ext.applyIf({parentId:'Default'}, fStyle);
    style = Ext.merge(style, col.getStyle());
    style.id = null;
    me.columnStylesFooter.push(me.workbook.addStyle(style).getId());
    style = Ext.merge({parentId:'Default'}, col.getStyle());
    colCfg.styleId = me.workbook.addStyle(style).getId();
    me.columnStylesNormal.push(colCfg.styleId);
    me.table.addColumn(colCfg);
  }
}, buildHeaderRows:function(columns, result) {
  var col, cols, i, len, name;
  if (!columns) {
    return;
  }
  len = columns.length;
  for (i = 0; i < len; i++) {
    col = columns.items[i].getConfig();
    col.value = col.text;
    cols = col.columns;
    delete col.columns;
    delete col.table;
    name = 's' + col.level;
    result[name] = result[name] || [];
    result[name].push(col);
    this.buildHeaderRows(cols, result);
  }
}});
Ext.define('Ext.exporter.file.html.Style', {extend:'Ext.exporter.file.Style', idPrefix:'ext-', indentation:10, mappings:{readingOrder:{LeftToRight:'ltr', RightToLeft:'rtl', Context:'initial', Automatic:'initial'}, horizontal:{Automatic:'initial', Left:'left', Center:'center', Right:'right', Justify:'justify'}, vertical:{Top:'top', Bottom:'bottom', Center:'middle', Automatic:'baseline'}, lineStyle:{None:'none', Continuous:'solid', Dash:'dashed', Dot:'dotted'}}, updateId:function(id) {
  if (id && !this.getName()) {
    this.setName('.' + id);
  }
}, render:function() {
  var cfg = this.getConfig(), map = this.mappings, s = '', align = cfg.alignment, font = cfg.font, borders = cfg.borders, interior = cfg.interior, i, length, name, border;
  if (align) {
    if (align.horizontal) {
      s += 'text-align: ' + map.horizontal[align.horizontal] + ';\n';
    }
    if (align.readingOrder) {
      s += 'direction: ' + map.readingOrder[align.readingOrder] + ';\n';
    }
    if (align.vertical) {
      s += 'vertical-align: ' + map.vertical[align.vertical] + ';\n';
    }
    if (align.indent) {
      s += 'padding-left: ' + align.indent * this.indentation + 'px;\n';
    }
  }
  if (font) {
    if (font.size) {
      s += 'font-size: ' + font.size + 'px;\n';
    }
    if (font.bold) {
      s += 'font-weight: bold;\n';
    }
    if (font.italic) {
      s += 'font-style: italic;\n';
    }
    if (font.strikeThrough) {
      s += 'text-decoration: line-through;\n';
    }
    if (font.underline === 'Single') {
      s += 'text-decoration: underline;\n';
    }
    if (font.color) {
      s += 'color: ' + font.color + ';\n';
    }
  }
  if (interior && interior.color) {
    s += 'background-color: ' + interior.color + ';\n';
  }
  if (borders) {
    length = borders.length;
    for (i = 0; i < length; i++) {
      border = borders[i];
      name = 'border-' + border.position.toLowerCase();
      s += name + '-width: ' + (border.weight || 0) + 'px;\n';
      s += name + '-style: ' + (map.lineStyle[border.lineStyle] || 'initial') + ';\n';
      s += name + '-color: ' + (border.color || 'initial') + ';\n';
    }
  }
  return cfg.name + '{\n' + s + '}\n';
}});
Ext.define('Ext.exporter.file.html.Doc', {extend:'Ext.exporter.file.Base', requires:['Ext.exporter.file.html.Style'], config:{title:'Title', author:'Sencha', charset:'UTF-8', styles:[], table:null}, destroy:function() {
  this.setStyles(null);
  this.setTable(null);
  this.callParent();
}, applyStyles:function(data, dataCollection) {
  return this.checkCollection(data, dataCollection, 'Ext.exporter.file.html.Style');
}, addStyle:function(config) {
  var styles = this.getStyles(), items = styles.decodeItems(arguments, 0), len = items.length, ret = [], i, found, item;
  for (i = 0; i < len; i++) {
    item = items[i];
    found = styles.get(item.getKey());
    ret.push(found ? found : styles.add(item));
    if (found) {
      item.destroy();
    }
  }
  return ret.length === 1 ? ret[0] : ret;
}, getStyle:function(id) {
  return this.getStyles().get(id);
}});
Ext.define('Ext.exporter.file.ooxml.excel.PageField', {extend:'Ext.exporter.file.ooxml.Base', config:{cap:null, fld:null, hier:null, item:null, name:null}, generateTplAttributes:true, tpl:['\x3cpageField {attributes} /\x3e']});
Ext.define('Ext.exporter.text.CSV', {extend:'Ext.exporter.Base', alias:'exporter.csv', requires:['Ext.util.CSV'], fileName:'export.csv', getHelper:function() {
  return Ext.util.CSV;
}, getContent:function() {
  var me = this, result = [], data = me.getData();
  if (data) {
    me.buildHeader(result);
    me.buildRows(data, result, data.getColumnCount());
    me.columnStyles = Ext.destroy(me.columnStyles);
  }
  return me.getHelper().encode(result);
}, buildHeader:function(result) {
  var me = this, ret = {}, data = me.getData(), arr, lenCells, i, style;
  me.buildHeaderRows(data.getColumns(), ret);
  result.push.apply(result, Ext.Object.getValues(ret));
  arr = data.getBottomColumns();
  lenCells = arr.length;
  me.columnStyles = [];
  for (i = 0; i < lenCells; i++) {
    style = arr[i].getStyle() || {};
    if (!style.id) {
      style.id = 'c' + i;
    }
    style.name = '.' + style.id;
    me.columnStyles.push(new Ext.exporter.file.Style(style));
  }
}, buildHeaderRows:function(columns, result) {
  var col, i, len, name, mAcross, mDown, j, level;
  if (!columns) {
    return;
  }
  len = columns.length;
  for (i = 0; i < len; i++) {
    col = columns.items[i];
    mAcross = col._mergeAcross;
    mDown = col._mergeDown;
    level = col._level;
    name = 's' + level;
    result[name] = result[name] || [];
    result[name].push(col._text);
    for (j = 1; j <= mAcross; j++) {
      result[name].push('');
    }
    for (j = 1; j <= mDown; j++) {
      name = 's' + (level + j);
      result[name] = result[name] || [];
      result[name].push('');
    }
    this.buildHeaderRows(col._columns, result);
  }
}, buildRows:function(group, result, length) {
  var showSummary = this._showSummary, groups, i, row, gLen, j, rLen, k, cLen, r, cells, oneLine, cell, style, text;
  if (!group) {
    return;
  }
  groups = group._groups;
  text = group._text;
  oneLine = !groups && !group._rows;
  if (!Ext.isEmpty(text) && !oneLine) {
    row = [];
    row.length = length;
    row[group.level || 0] = text;
    result.push(row);
  }
  if (groups) {
    gLen = groups.length;
    for (i = 0; i < gLen; i++) {
      this.buildRows(groups.items[i], result, length);
    }
  }
  if (group._rows) {
    rLen = group._rows.length;
    for (j = 0; j < rLen; j++) {
      row = [];
      r = group._rows.items[j];
      cells = r._cells;
      cLen = cells.length;
      for (k = 0; k < cLen; k++) {
        cell = cells.items[k];
        style = this.columnStyles[k];
        cell = style ? style.getFormattedValue(cell._value) : cell._value;
        row.push(cell);
      }
      result.push(row);
    }
  }
  if (group._summaries && (showSummary || oneLine)) {
    rLen = group._summaries.length;
    for (j = 0; j < rLen; j++) {
      row = [];
      r = group._summaries.items[j];
      cells = r._cells;
      cLen = cells.length;
      for (k = 0; k < cLen; k++) {
        cell = cells.items[k];
        style = this.columnStyles[k];
        cell = style ? style.getFormattedValue(cell._value) : cell._value;
        row.push(cell);
      }
      result.push(row);
    }
  }
}});
Ext.define('Ext.exporter.text.Html', {extend:'Ext.exporter.Base', alias:'exporter.html', requires:['Ext.exporter.file.html.Doc'], config:{tpl:['\x3c!DOCTYPE html\x3e\n', '\x3chtml\x3e\n', '   \x3chead\x3e\n', '       \x3cmeta charset\x3d"{charset}"\x3e\n', '       \x3ctitle\x3e{title}\x3c/title\x3e\n', '       \x3cstyle\x3e\n', '       table { border-collapse: collapse; border-spacing: 0; }\n', '\x3ctpl if\x3d"styles"\x3e\x3ctpl for\x3d"styles.getRange()"\x3e{[values.render()]}\x3c/tpl\x3e\x3c/tpl\x3e', 
'       \x3c/style\x3e\n', '   \x3c/head\x3e\n', '   \x3cbody\x3e\n', '       \x3ch1\x3e{title}\x3c/h1\x3e\n', '       \x3ctable\x3e\n', '           \x3cthead\x3e\n', '\x3ctpl for\x3d"table.columns"\x3e', '               \x3ctr\x3e\n', '\x3ctpl for\x3d"."\x3e', '                   \x3cth\x3ctpl if\x3d"width"\x3e width\x3d"{width}"\x3c/tpl\x3e\x3ctpl if\x3d"mergeAcross"\x3e colSpan\x3d"{mergeAcross}"\x3c/tpl\x3e\x3ctpl if\x3d"mergeDown"\x3e rowSpan\x3d"{mergeDown}"\x3c/tpl\x3e\x3e{text}\x3c/th\x3e\n', 
'\x3c/tpl\x3e', '               \x3c/tr\x3e\n', '\x3c/tpl\x3e', '           \x3c/thead\x3e\n', '           \x3ctbody\x3e\n', '\x3ctpl for\x3d"table.rows"\x3e', '               \x3ctr\x3ctpl if\x3d"cls"\x3e class\x3d"{cls}"\x3c/tpl\x3e\x3e\n', '\x3ctpl for\x3d"cells"\x3e', '                   \x3ctd\x3ctpl if\x3d"cls"\x3e class\x3d"{cls}"\x3c/tpl\x3e\x3ctpl if\x3d"mergeAcross"\x3e colSpan\x3d"{mergeAcross}"\x3c/tpl\x3e\x3ctpl if\x3d"mergeDown"\x3e rowSpan\x3d"{mergeDown}"\x3c/tpl\x3e\x3e{value}\x3c/td\x3e\n', 
'\x3c/tpl\x3e', '               \x3c/tr\x3e\n', '\x3c/tpl\x3e', '           \x3c/tbody\x3e\n', '           \x3ctfoot\x3e\n', '               \x3ctr\x3e\n', '                   \x3cth\x3ctpl if\x3d"table.columnsCount"\x3e colSpan\x3d"{table.columnsCount}"\x3c/tpl\x3e\x3e\x26nbsp;\x3c/th\x3e\n', '               \x3c/tr\x3e\n', '           \x3c/tfoot\x3e\n', '       \x3c/table\x3e\n', '   \x3c/body\x3e\n', '\x3c/html\x3e'], defaultStyle:{name:'table tbody td, table thead th', alignment:{vertical:'Top'}, 
font:{fontName:'Arial', size:12, color:'#000000'}, borders:[{position:'Left', lineStyle:'Continuous', weight:1, color:'#4F81BD'}, {position:'Right', lineStyle:'Continuous', weight:1, color:'#4F81BD'}]}, titleStyle:{name:'h1', font:{fontName:'Arial', size:18, color:'#1F497D'}}, groupHeaderStyle:{name:'.groupHeader td', borders:[{position:'Top', lineStyle:'Continuous', weight:1, color:'#4F81BD'}, {position:'Bottom', lineStyle:'Continuous', weight:1, color:'#4F81BD'}]}, groupFooterStyle:{name:'.groupFooter td', 
borders:[{position:'Bottom', lineStyle:'Continuous', weight:1, color:'#4F81BD'}]}, tableHeaderStyle:{name:'table thead th', alignment:{horizontal:'Center', vertical:'Center'}, borders:[{position:'Top', lineStyle:'Continuous', weight:1, color:'#4F81BD'}, {position:'Bottom', lineStyle:'Continuous', weight:1, color:'#4F81BD'}], font:{fontName:'Arial', size:12, color:'#1F497D'}}, tableFooterStyle:{name:'table tfoot th', borders:[{position:'Top', lineStyle:'Continuous', weight:1, color:'#4F81BD'}]}}, 
fileName:'export.html', mimeType:'text/html', getContent:function() {
  var me = this, config = me.getConfig(), data = config.data, table = {columnsCount:0, columns:[], rows:[]}, colMerge, html;
  me.doc = new Ext.exporter.file.html.Doc({title:config.title, author:config.author, tpl:config.tpl, styles:[config.defaultStyle, config.titleStyle, config.groupHeaderStyle, config.groupFooterStyle, config.tableHeaderStyle, config.tableFooterStyle]});
  if (data) {
    colMerge = data.getColumnCount();
    Ext.apply(table, {columnsCount:data.getColumnCount(), columns:me.buildHeader(), rows:me.buildRows(data, colMerge, 0)});
  }
  me.doc.setTable(table);
  html = me.doc.render();
  me.doc = me.columnStyles = Ext.destroy(me.doc);
  return html;
}, buildRows:function(group, colMerge, level) {
  var me = this, showSummary = me._showSummary, result = [], groups, row, i, j, k, gLen, rLen, cLen, cell, r, cells, oneLine, style, text;
  if (!group) {
    return result;
  }
  me.doc.addStyle({id:'.levelHeader' + level, name:'.levelHeader' + level, alignment:{Horizontal:'Left', Indent:(level > 0 ? level : 0) * 5}});
  me.doc.addStyle({id:'.levelFooter' + level, name:'.levelFooter' + level, alignment:{Horizontal:'Left', Indent:(level > 0 ? level : 0) * 5}});
  groups = group._groups;
  text = group._text;
  oneLine = !groups && !group._rows;
  if (!Ext.isEmpty(text) && !oneLine) {
    result.push({cls:'groupHeader', cells:[{value:text, mergeAcross:colMerge, cls:'levelHeader' + level}]});
  }
  if (groups) {
    gLen = groups.length;
    for (i = 0; i < gLen; i++) {
      Ext.Array.insert(result, result.length, me.buildRows(groups.items[i], colMerge, level + 1));
    }
  }
  if (group._rows) {
    rLen = group._rows.length;
    for (j = 0; j < rLen; j++) {
      row = [];
      r = group._rows.items[j];
      cells = r._cells;
      cLen = cells.length;
      for (k = 0; k < cLen; k++) {
        cell = cells.items[k].getConfig();
        style = me.columnStyles[k];
        if (style) {
          cell.cls = style._id + (cell.style ? ' ' + me.doc.addStyle(cell.style)._id : '');
          cell.value = style.getFormattedValue(cell.value);
        }
        row.push(cell);
      }
      result.push({cells:row});
    }
  }
  if (group._summaries && (showSummary || oneLine)) {
    rLen = group._summaries.length;
    for (j = 0; j < rLen; j++) {
      row = [];
      r = group._summaries.items[j];
      cells = r._cells;
      cLen = cells.length;
      for (k = 0; k < cLen; k++) {
        cell = cells.items[k].getConfig();
        style = me.columnStyles[k];
        cell.cls = k === 0 ? 'levelFooter' + level : '';
        if (style) {
          cell.cls += ' ' + style.getId() + (cell.style ? ' ' + me.doc.addStyle(cell.style).getId() : '');
          cell.value = style.getFormattedValue(cell.value);
        }
        row.push(cell);
      }
      result.push({cls:'groupFooter' + (oneLine ? ' groupHeader' : ''), cells:row});
    }
  }
  return result;
}, buildHeader:function() {
  var me = this, ret = {}, data = me.getData(), arr, lenCells, i, style;
  me.buildHeaderRows(data.getColumns(), ret);
  arr = data.getBottomColumns();
  lenCells = arr.length;
  me.columnStyles = [];
  for (i = 0; i < lenCells; i++) {
    style = arr[i].getStyle() || {};
    if (!style.id) {
      style.id = Ext.id();
    }
    style.name = '.' + style.id;
    me.columnStyles.push(me.doc.addStyle(style));
  }
  return Ext.Object.getValues(ret);
}, buildHeaderRows:function(columns, result) {
  var col, i, len, name, s;
  if (!columns) {
    return;
  }
  len = columns.length;
  for (i = 0; i < len; i++) {
    col = columns.items[i].getConfig();
    name = 's' + col.level;
    result[name] = result[name] || [];
    if (col.mergeAcross) {
      col.mergeAcross++;
    }
    if (col.mergeDown) {
      col.mergeDown++;
    }
    result[name].push(col);
    this.buildHeaderRows(col.columns, result);
  }
}});
Ext.define('Ext.exporter.text.TSV', {extend:'Ext.exporter.text.CSV', alias:'exporter.tsv', requires:['Ext.util.TSV'], getHelper:function() {
  return Ext.util.TSV;
}});
Ext.define('Ext.grid.plugin.BaseExporter', {extend:'Ext.exporter.Plugin', prepareData:function(config) {
  var me = this, store = me.cmp.getStore(), table = new Ext.exporter.data.Table, result, columns;
  result = me.getColumnHeaders(config, me.getGridColumns());
  table.setColumns(result.headers);
  if (!store || store && store.destroyed) {
    return table;
  }
  if (store && store.isBufferedStore) {
    Ext.raise("BufferedStore can't be exported because it doesn't have all data available");
  }
  columns = me.prepareDataIndexColumns(config, result.dataIndexes);
  if (store.isTreeStore) {
    me.extractNodeData(config, table, columns, store.getRoot());
  } else {
    if (config && config.includeGroups && store.isGrouped()) {
      me.extractData(config, table, columns, store.getGroups());
      me.extractSummaryRow(config, table, columns, store);
    } else {
      me.extractRows(config, table, columns, store);
    }
  }
  return table;
}, getColumnHeaders:function(config, columns) {
  var cols = [], dataIndexes = [], len = columns.length, i, result;
  for (i = 0; i < len; i++) {
    result = this.getColumnHeader(config, columns[i]);
    if (result) {
      cols.push(result.header);
      Ext.Array.insert(dataIndexes, dataIndexes.length, result.dataIndexes);
    }
  }
  return {headers:cols, dataIndexes:dataIndexes};
}, getGridColumns:function() {
  return [];
}, getColumnHeader:Ext.emptyFn, prepareDataIndexColumns:function(config, dataIndexes) {
  var len = dataIndexes.length, columns = [], i;
  for (i = 0; i < len; i++) {
    columns.push(this.prepareDataIndexColumn(config, dataIndexes[i]));
  }
  return columns;
}, prepareDataIndexColumn:function(config, column) {
  return {column:column, fn:Ext.emptyFn};
}, extractData:function(config, group, columns, collection) {
  var i, len, children, storeGroup, tableGroup;
  if (!collection) {
    return;
  }
  len = collection.getCount();
  for (i = 0; i < len; i++) {
    storeGroup = collection.getAt(i);
    children = storeGroup.getGroups();
    tableGroup = group.addGroup({text:storeGroup.getGroupKey()});
    if (children) {
      this.extractData(config, tableGroup, columns, children);
    } else {
      this.extractRows(config, tableGroup, columns, storeGroup);
    }
  }
}, extractNodeData:function(config, group, columns, node) {
  var me = this, store = me.cmp.getStore(), lenCols = columns.length, i, j, record, row, cell, column, children, len;
  if (node && node.hasChildNodes()) {
    children = node.childNodes;
    len = children.length;
    for (i = 0; i < len; i++) {
      record = children[i];
      row = {cells:[]};
      for (j = 0; j < lenCols; j++) {
        column = columns[j];
        cell = me.getCell(store, record, column) || {value:null};
        if (column.column.isTreeColumn && cell) {
          cell.style = Ext.merge(cell.style || {}, {alignment:{indent:record.getDepth() - 1}});
        }
        row.cells.push(cell);
      }
      group.addRow(row);
      if (record.hasChildNodes()) {
        me.extractNodeData(config, group, columns, record);
      }
    }
  }
}, extractRows:function(config, group, columns, collection) {
  var cmp = this.cmp, store = cmp.getStore(), len = collection.getCount(), lenCols = columns.length, rows = [], i, j, record, row, cell;
  for (i = 0; i < len; i++) {
    record = collection.getAt(i);
    row = {cells:[]};
    for (j = 0; j < lenCols; j++) {
      cell = this.getCell(store, record, columns[j]);
      row.cells.push(cell || {value:null});
    }
    rows.push(row);
  }
  group.setRows(rows);
  this.extractSummaryRow(config, group, columns, collection);
}, extractSummaryRow:function(config, group, columns, collection) {
  var lenCols = columns.length, i, record, row, cell;
  if (config.includeSummary) {
    row = {cells:[]};
    record = this.getSummaryRecord(collection, columns);
    for (i = 0; i < lenCols; i++) {
      cell = this.getSummaryCell(collection, record, columns[i]);
      row.cells.push(cell || {value:null});
    }
    group.setSummaries(row);
  }
}, getCell:Ext.emptyFn, getSummaryCell:Ext.emptyFn, getSummaryRecord:function(collection, columns) {
  var len = columns.length, summaryRecord = collection.getSummaryRecord(), record = new Ext.data.Model({id:'summary-record'}), i, colDef, records;
  record.beginEdit();
  record.set(summaryRecord.getData());
  for (i = 0; i < len; i++) {
    colDef = columns[i];
    if (colDef.summary) {
      records = collection.isStore ? collection.data.items.slice() : collection.items.slice();
      record.set(colDef.summaryIndex, colDef.summary.calculate(records, colDef.summaryIndex, 'data', 0, records.length));
    } else {
      if (colDef.summaryType) {
        record.set(colDef.summaryIndex, this.getSummary(collection, colDef.summaryType, colDef.summaryIndex));
      }
    }
  }
  record.endEdit();
  record.commit(true);
  return record;
}, getSummary:function(item, type, field) {
  var isStore = item.isStore;
  if (type) {
    if (Ext.isFunction(type)) {
      if (isStore) {
        return item.aggregate(type, null, false, [field]);
      } else {
        return item.aggregate(field, type);
      }
    }
    switch(type) {
      case 'count':
        return item.count();
      case 'min':
        return item.min(field);
      case 'max':
        return item.max(field);
      case 'sum':
        return item.sum(field);
      case 'average':
        return item.average(field);
      default:
        return null;
    }
  }
}});
Ext.define('Ext.grid.plugin.Exporter', {alias:['plugin.gridexporter'], extend:'Ext.grid.plugin.BaseExporter', lockableScope:'top', getGridColumns:function() {
  var grid = this.cmp, columns = [];
  if (grid.lockedGrid) {
    Ext.Array.insert(columns, columns.length, grid.lockedGrid.headerCt.items.items);
    Ext.Array.insert(columns, columns.length, grid.normalGrid.headerCt.items.items);
  } else {
    Ext.Array.insert(columns, columns.length, grid.headerCt.items.items);
  }
  return columns;
}, getColumnHeader:function(config, column) {
  var dataIndexes = [], obj, result, style, width;
  if (!column.hidden && !column.ignoreExport) {
    style = this.getExportStyle(column.exportStyle, config);
    width = column.getWidth();
    if (style) {
      width = style.width || width;
    }
    obj = {text:column.text, width:width, style:style};
    if (column.isGroupHeader) {
      result = this.getColumnHeaders(config, column.items.items);
      obj.columns = result.headers;
      if (obj.columns.length === 0) {
        obj = null;
      } else {
        Ext.Array.insert(dataIndexes, dataIndexes.length, result.dataIndexes);
      }
    } else {
      dataIndexes.push(column);
    }
  }
  if (obj) {
    return {header:obj, dataIndexes:dataIndexes};
  }
}, prepareDataIndexColumn:function(config, column) {
  var fn = Ext.identityFn, summaryFn = Ext.identityFn, style = this.getExportStyle(column.exportStyle, config);
  if (!style || style && !style.format) {
    fn = this.getSpecialFn({renderer:'renderer', exportRenderer:'exportRenderer', formatter:'formatter'}, column) || fn;
    summaryFn = this.getSpecialFn({renderer:'summaryRenderer', exportRenderer:'exportSummaryRenderer', formatter:'summaryFormatter'}, column) || fn;
  }
  return {dataIndex:column.dataIndex, column:column, fn:fn, summaryType:column.summaryType, summaryIndex:column.dataIndex, summaryFn:summaryFn, colIndex:Ext.Array.indexOf(this.cmp.getVisibleColumns(), column)};
}, getSpecialFn:function(names, column) {
  var exportRenderer = column[names.exportRenderer], renderer = column[names.renderer], formatter = column[names.formatter], fn, scope, tempFn;
  scope = column.rendererScope || column.scope || column;
  tempFn = exportRenderer;
  if (column.initialConfig[names.formatter] && !formatter && !tempFn) {
    fn = renderer;
  } else {
    if (tempFn === true) {
      tempFn = renderer;
    }
    if (typeof tempFn == 'string') {
      fn = function() {
        return Ext.callback(tempFn, scope, arguments, 0, column);
      };
    } else {
      if (typeof tempFn == 'function') {
        fn = function() {
          return tempFn.apply(scope, arguments);
        };
      }
    }
  }
  return fn;
}, getCell:function(store, record, colDef) {
  var v = record.get(colDef.dataIndex);
  return {value:colDef.fn(v, null, record, store.indexOf(record), colDef.colIndex, store, this.cmp.getView())};
}, getSummaryCell:function(collection, record, colDef) {
  var v = record.get(colDef.dataIndex);
  return {value:colDef.summaryFn(v, null, record, -1, colDef.colIndex, collection, this.cmp.getView())};
}});
