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
Ext.define('Ext.calendar.EventBase', {extend:'Ext.Gadget', config:{defaultTitle:'(New Event)', endDate:null, mode:null, model:null, palette:null, resize:false, startDate:null, title:'', touchAction:{panX:false, panY:false}, view:null}, cloneForProxy:function() {
  var result = new this.self(this.config);
  result.el.unselectable();
  return result;
}, updateModel:function(model) {
  var me = this, dom;
  if (model) {
    me.setStartDate(model.getStartDate());
    me.setEndDate(model.getEndDate());
    me.setTitle(model.getTitle());
    dom = me.element.dom;
    dom.setAttribute('data-eventId', model.id);
    dom.setAttribute('data-calendarId', model.getCalendarId());
  }
}, updateResize:function(resize) {
  this.toggleCls(this.$allowResizeCls, resize);
}, privates:{$allowResizeCls:Ext.baseCSSPrefix + 'calendar-event-resizable'}});
Ext.define('Ext.calendar.Event', {extend:'Ext.calendar.EventBase', xtype:'calendar-event', config:{timeFormat:'H:i'}, smallSize:60, getElementConfig:function() {
  var cfg = this.callParent();
  cfg.cls = Ext.baseCSSPrefix + 'calendar-event';
  cfg.children = [{cls:Ext.baseCSSPrefix + 'calendar-event-inner', reference:'innerElement', children:[{cls:Ext.baseCSSPrefix + 'calendar-event-time', reference:'timeElement', children:[{tag:'span', reference:'startElement', cls:Ext.baseCSSPrefix + 'calendar-event-time-start'}, {tag:'span', html:' - ', reference:'separatorElement', cls:Ext.baseCSSPrefix + 'calendar-event-time-separator'}, {tag:'span', reference:'endElement', cls:Ext.baseCSSPrefix + 'calendar-event-time-end'}]}, {reference:'titleElement', 
  tag:'span', cls:Ext.baseCSSPrefix + 'calendar-event-title'}, {cls:Ext.baseCSSPrefix + 'calendar-event-resizer', reference:'resizerElement'}]}];
  return cfg;
}, updateEndDate:function(date) {
  this.endElement.setText(this.displayDate(date));
  this.calculateSize();
}, updateMode:function(mode) {
  var me = this;
  me.addCls(this.modes[mode]);
  if (mode === 'weekinline' || mode === 'weekspan') {
    me.addCls(me.$inlineTitleCls);
  }
}, updatePalette:function(palette) {
  var inner = this.innerElement.dom.style, mode = this.getMode();
  if (mode === 'weekspan' || mode === 'day') {
    inner.backgroundColor = palette.primary;
    inner.color = palette.secondary;
    if (mode === 'day') {
      this.element.dom.style.borderColor = palette.border;
    }
  } else {
    inner.color = palette.primary;
  }
}, updateStartDate:function(date) {
  this.startElement.setText(this.displayDate(date));
  this.calculateSize();
}, updateTitle:function(title) {
  title = title || this.getDefaultTitle();
  this.titleElement.setText(title);
}, privates:{$inlineTitleCls:Ext.baseCSSPrefix + 'calendar-event-inline-title', modes:{day:Ext.baseCSSPrefix + 'calendar-event-day', weekspan:Ext.baseCSSPrefix + 'calendar-event-week-span', weekinline:Ext.baseCSSPrefix + 'calendar-event-week-inline'}, calculateSize:function() {
  var me = this, start = me.getStartDate(), end = me.getEndDate(), ms = me.getView().MS_TO_MINUTES, isDay = me.getMode() === 'day', small;
  if (!isDay || start && end) {
    small = !isDay || end - start <= me.smallSize * ms;
    me.element.toggleCls(me.$inlineTitleCls, small);
  }
}, displayDate:function(d) {
  if (d) {
    d = this.getView().utcToLocal(d);
    return Ext.Date.format(d, this.getTimeFormat());
  }
}}});
Ext.define('Ext.calendar.AbstractList', {extend:'Ext.view.View', updateNavigationModel:function(navigationModel, oldNavigationModel) {
  navigationModel.focusCls = '';
}, onItemClick:function(record, item, index, e) {
  this.callParent([record, item, index, e]);
  this.handleItemTap(record);
}});
Ext.define('Ext.calendar.List', {extend:'Ext.calendar.AbstractList', xtype:'calendar-list', config:{enableToggle:true}, cls:Ext.baseCSSPrefix + 'calendar-list', itemTpl:'\x3cdiv class\x3d"' + '\x3ctpl if\x3d"hidden"\x3e' + Ext.baseCSSPrefix + 'calendar-list-item-hidden' + '\x3c/tpl\x3e"\x3e' + '\x3cdiv class\x3d"' + Ext.baseCSSPrefix + 'calendar-list-icon" style\x3d"background-color: {color};"\x3e\x3c/div\x3e' + '\x3cdiv class\x3d"' + Ext.baseCSSPrefix + 'calendar-list-text"\x3e{title:htmlEncode}\x3c/div\x3e' + 
'\x3c/div\x3e', itemSelector:'.' + Ext.baseCSSPrefix + 'calendar-list-item', itemCls:Ext.baseCSSPrefix + 'calendar-list-item', scrollable:true, prepareData:function(data, index, record) {
  return {id:record.id, editable:record.isEditable(), hidden:record.isHidden(), color:record.getBaseColor(), title:record.getTitle()};
}, handleItemTap:function(record) {
  if (this.getEnableToggle()) {
    record.setHidden(!record.isHidden());
  }
}});
Ext.define('Ext.calendar.date.Range', {end:null, start:null, isRange:true, statics:{fly:function() {
  var range = null;
  return function(start, end) {
    if (start.isRange) {
      return start;
    }
    if (!range) {
      range = new Ext.calendar.date.Range;
    }
    range.start = start;
    range.end = end;
    return range;
  };
}()}, constructor:function(start, end) {
  this.start = start;
  this.end = end;
}, clone:function() {
  var D = Ext.Date, T = this.self;
  return new T(D.clone(this.start), D.clone(this.end));
}, contains:function(d) {
  return this.start <= d && d <= this.end;
}, containsRange:function(start, end) {
  var other = this.self.fly(start, end);
  return other.start >= this.start && other.end <= this.end;
}, equals:function(start, end) {
  if (!start) {
    return false;
  }
  var other = this.self.fly(start, end);
  return this.start.getTime() === other.start.getTime() && this.end.getTime() === other.end.getTime();
}, getDuration:function() {
  return this.end.getTime() - this.start.getTime();
}, isContainedBy:function(start, end) {
  var other = this.self.fly(start, end);
  return other.containsRange(this);
}, overlaps:function(start, end) {
  var other = this.self.fly(start, end);
  return other.start < this.end && this.start < other.end;
}});
Ext.define('Ext.calendar.date.Util', {singleton:true, clearTimeUtc:function(d, clone) {
  if (clone) {
    d = Ext.Date.clone(d);
  }
  d.setUTCHours(0);
  d.setUTCMinutes(0);
  d.setUTCSeconds(0);
  d.setUTCMilliseconds(0);
  return d;
}, privates:{getDefaultTimezoneOffset:function() {
  return (new Date).getTimezoneOffset();
}, getLocalNow:function() {
  return new Date;
}, expandRange:function(range) {
  var D = Ext.Date, start = range.start, end = range.end;
  start = D.clone(start);
  start.setUTCHours(0);
  if (end.getUTCHours() !== 0) {
    end = D.clone(end);
    end.setUTCHours(24);
  }
  return new Ext.calendar.date.Range(start, end);
}}});
Ext.define('Ext.calendar.dd.WeeksProxy', {extend:'Ext.drag.proxy.Placeholder', alias:'drag.proxy.calendar-weeks', config:{titleTpl:'\x3ctpl if\x3d"days \x26gt; 1"\x3e' + '({days} days) ' + '\x3c/tpl\x3e' + '{title}', width:null}, draggingCls:Ext.baseCSSPrefix + 'calendar-event-dragging', applyTitleTpl:function(titleTpl) {
  if (titleTpl && !titleTpl.isXTemplate) {
    titleTpl = new Ext.XTemplate(titleTpl);
  }
  return titleTpl;
}, getElement:function(info) {
  var me = this, view = info.view, clone = info.widget.cloneForProxy(), el = clone.element;
  clone.removeCls(view.$staticEventCls);
  clone.addCls(me.draggingCls);
  clone.addCls(me.placeholderCls);
  view.element.appendChild(el);
  clone.setWidth(me.getWidth());
  me.setTitle(clone);
  me.clone = clone;
  return el;
}, cleanup:function() {
  this.clone = Ext.destroy(this.clone);
  this.callParent();
}, privates:{setTitle:function(clone) {
  var titleTpl = this.getTitleTpl(), model;
  if (titleTpl) {
    model = clone.getModel();
    clone.setTitle(titleTpl.apply({model:model, title:clone.getTitle(), days:this.getSource().getView().getEventDaysSpanned(model)}));
  }
}}});
Ext.define('Ext.calendar.util.Dom', {singleton:true, extractPositions:function(parentNode, method) {
  var len = parentNode.length, pos = [], i;
  for (i = 0; i < len; ++i) {
    pos.push(Ext.fly(parentNode[i])[method]());
  }
  return pos;
}, getIndexPosition:function(positions, pos) {
  var len = positions.length, index, i;
  if (pos < positions[0]) {
    index = 0;
  } else {
    if (pos > positions[len - 1]) {
      index = len - 1;
    } else {
      for (i = len - 1; i >= 0; --i) {
        if (pos > positions[i]) {
          index = i;
          break;
        }
      }
    }
  }
  return index;
}});
Ext.define('Ext.calendar.dd.DaysAllDaySource', {extend:'Ext.drag.Source', requires:['Ext.calendar.dd.WeeksProxy', 'Ext.calendar.util.Dom'], activateOnLongPress:'touch', config:{proxy:{type:'calendar-weeks', width:200}, view:null}, describe:function(info) {
  var view = this.getView(), event = view.getEvent(info.eventTarget);
  info.event = event;
  info.widget = view.getEventWidget(event);
  info.setData('calendar-event-allday', event);
  info.view = view;
}, beforeDragStart:function(info) {
  return this.getView().handleChangeStart('drag', info.event);
}, updateView:function(view) {
  if (view) {
    this.setHandle('.' + view.$eventCls);
    this.setElement(view.allDayContent);
  }
}, destroy:function() {
  this.setView(null);
  this.callParent();
}, privates:{setup:function(info) {
  this.callParent([info]);
  var view = info.view, event = info.event, positions = Ext.calendar.util.Dom.extractPositions(view.backgroundCells, 'getX');
  info.index = Ext.calendar.util.Dom.getIndexPosition(positions, info.cursor.current.x);
  info.positions = positions;
  info.span = view.getEventDaysSpanned(event);
}}});
Ext.define('Ext.calendar.dd.DaysAllDayTarget', {extend:'Ext.drag.Target', requires:['Ext.calendar.util.Dom', 'Ext.calendar.date.Range'], config:{view:null}, updateView:function(view) {
  if (view) {
    this.setElement(view.allDayContent);
  }
}, accepts:function(info) {
  return Ext.Array.contains(info.types, 'calendar-event-allday');
}, onDragMove:function(info) {
  var view = info.view, index;
  if (info.valid) {
    index = Ext.calendar.util.Dom.getIndexPosition(info.positions, info.cursor.current.x);
    view.selectRange(index, index + info.span - 1);
  }
  this.callParent([info]);
}, onDragLeave:function(info) {
  this.getView().clearSelected();
  this.callParent([info]);
}, onDrop:function(info) {
  var D = Ext.Date, view = info.view, event = info.event, index = Ext.calendar.util.Dom.getIndexPosition(info.positions, info.cursor.current.x), newStart = view.utcTimezoneOffset(D.add(view.dateInfo.full.start, D.DAY, index, true)), start = event.getStartDate(), before = newStart < start, difference = D.diff(before ? newStart : start, before ? start : newStart, D.DAY);
  if (before) {
    difference = -difference;
  }
  view.handleChange('drop', event, new Ext.calendar.date.Range(D.add(event.getStartDate(), D.DAY, difference, true), D.add(event.getEndDate(), D.DAY, difference, true)), function() {
    view.clearSelected();
  });
  this.callParent([info]);
}, destroy:function() {
  this.setView(null);
  this.callParent();
}});
Ext.define('Ext.calendar.dd.DaysProxy', {extend:'Ext.drag.proxy.Placeholder', alias:'drag.proxy.calendar-days', config:{cursorOffset:null}, draggingCls:Ext.baseCSSPrefix + 'calendar-event-dragging', getElement:function(info) {
  var me = this, view = info.view, widget = info.widget, clone = widget.cloneForProxy(), el = clone.element, eventColumn = view.getEventColumn(0);
  clone.removeCls(view.$staticEventCls);
  clone.addCls(me.draggingCls);
  clone.setWidth(Ext.fly(eventColumn).getWidth());
  clone.setHeight(widget.getHeight());
  view.bodyWrap.appendChild(el);
  me.element = el;
  me.clone = clone;
  info.widgetClone = clone;
  return el;
}, cleanup:function(info) {
  if (info && info.deferCleanup) {
    return;
  }
  this.clone = Ext.destroy(this.clone);
  this.callParent();
}});
Ext.define('Ext.calendar.dd.DaysBodySource', {extend:'Ext.drag.Source', requires:['Ext.calendar.dd.DaysProxy', 'Ext.calendar.util.Dom'], activateOnLongPress:'touch', config:{proxy:{type:'calendar-days'}, view:null}, describe:function(info) {
  var view = this.getView();
  info.event = view.getEvent(info.eventTarget);
  info.widget = view.getEventWidget(info.event);
  info.setData('calendar-event', info.event);
  info.view = view;
}, beforeDragStart:function(info) {
  var cls = this.getView().$resizerCls;
  if (Ext.fly(info.eventTarget).hasCls(cls)) {
    return false;
  }
  return this.getView().handleChangeStart('drag', info.event);
}, updateView:function(view) {
  var me = this;
  if (view) {
    me.setHandle('.' + view.$eventCls);
    me.setElement(view.bodyWrap);
    me.setConstrain({snap:{x:me.snapX, y:me.snapY}});
  }
}, onDragStart:function(info) {
  this.callParent([info]);
  info.widget.element.hide();
}, onDragEnd:function(info) {
  this.callParent([info]);
  var w = info.widget;
  if (!w.destroyed && !info.deferCleanup) {
    w.element.show();
  }
}, destroy:function() {
  this.setView(null);
  this.callParent();
}, privates:{startMarginName:'left', setup:function(info) {
  this.callParent([info]);
  var view = info.view, days = view.getVisibleDays(), positions = [], i;
  for (i = 0; i < days; ++i) {
    positions.push(Ext.fly(view.getEventColumn(i)).getX());
  }
  info.sizes = {height:info.proxy.element.getHeight(), slotStyle:view.getSlotStyle(), margin:view.getEventStyle().margin, startPositions:positions, startOffset:info.cursor.initial.y - info.widget.element.getY()};
}, snapX:function(info, x) {
  var sizes = info.sizes, positions = sizes.startPositions, index = Ext.calendar.util.Dom.getIndexPosition(positions, x);
  info.dayIndex = index;
  return positions[index] + sizes.margin[info.source.startMarginName];
}, snapY:function(info, y) {
  var sizes = info.sizes, view = info.view, bodyOffset = view.bodyTable.getY(), halfHeight = sizes.slotStyle.halfHeight, maxSlots = view.maxSlots, offsetY = Math.max(0, y - sizes.startOffset - bodyOffset);
  y = bodyOffset + sizes.margin.top + Ext.Number.roundToNearest(offsetY, halfHeight);
  return Math.min(y, bodyOffset + maxSlots * halfHeight - sizes.height);
}}});
Ext.define('Ext.calendar.dd.DaysBodyTarget', {extend:'Ext.drag.Target', config:{view:null}, updateView:function(view) {
  if (view) {
    this.setElement(view.bodyWrap);
  }
}, accepts:function(info) {
  return Ext.Array.contains(info.types, 'calendar-event');
}, onDragMove:function(info) {
  var sizes = info.sizes, view = info.view, event = info.event, D = Ext.Date, y, start, end, slot;
  if (info.valid) {
    y = Math.max(0, info.proxy.current.y - view.bodyTable.getY());
    slot = Math.floor(y / sizes.slotStyle.halfHeight);
    start = D.clone(view.dateInfo.visible.start);
    start = D.add(start, D.DAY, info.dayIndex || 0, true);
    start = D.add(start, D.MINUTE, view.minimumEventMinutes * slot, true);
    end = D.add(start, D.MINUTE, event.getDuration(), true);
    info.widgetClone.setStartDate(start);
    info.widgetClone.setEndDate(end);
    info.range = [start, end];
  }
  this.callParent([info]);
}, onDrop:function(info) {
  var view = this.getView(), proxy = info.source.getProxy();
  info.deferCleanup = true;
  view.handleChange('drop', info.event, new Ext.calendar.date.Range(info.range[0], info.range[1]), function() {
    proxy.cleanup();
    var w = info.widget;
    if (!w.destroyed) {
      w.element.show();
    }
    view.clearSelected();
  });
  this.callParent([info]);
}, destroy:function() {
  this.setView(null);
  this.callParent();
}});
Ext.define('Ext.calendar.dd.WeeksSource', {extend:'Ext.drag.Source', requires:['Ext.calendar.dd.WeeksProxy'], activateOnLongPress:'touch', config:{proxy:{type:'calendar-weeks', width:200}, view:null}, describe:function(info) {
  var view = this.getView();
  info.event = view.getEvent(info.eventTarget);
  info.widget = view.getEventWidget(info.eventTarget);
  info.setData('calendar-event', info.event);
  info.view = view;
}, beforeDragStart:function(info) {
  return this.getView().handleChangeStart('drag', info.event);
}, onDragStart:function(info) {
  var view = info.view, cursor = info.cursor.current, cell = view.getCellByPosition(cursor.x, cursor.y), event = info.event;
  info.span = view.getEventDaysSpanned(event);
  info.startDate = view.getDateFromCell(cell);
  this.callParent([info]);
}, updateView:function(view) {
  if (view) {
    this.setHandle('.' + view.$eventCls);
    this.setElement(view.element);
  }
}, destroy:function() {
  this.setView(null);
  this.callParent();
}});
Ext.define('Ext.calendar.dd.WeeksTarget', {extend:'Ext.drag.Target', requires:['Ext.calendar.date.Range'], config:{view:null}, updateView:function(view) {
  if (view) {
    this.setElement(view.element);
  }
}, accepts:function(info) {
  return Ext.Array.contains(info.types, 'calendar-event');
}, onDragMove:function(info) {
  var D = Ext.Date, view = info.view, cursor = info.cursor.current, span = info.span, cell, d, end;
  if (info.valid) {
    cell = view.getCellByPosition(cursor.x, cursor.y);
    d = end = view.getDateFromCell(cell);
    end = D.add(d, D.DAY, span - 1, true);
    view.selectRange(d, end);
  }
  this.callParent([info]);
}, onDragLeave:function(info) {
  this.getView().clearSelected();
  this.callParent([info]);
}, onDrop:function(info) {
  var D = Ext.Date, cursor = info.cursor.current, view = info.view, cell = view.getCellByPosition(cursor.x, cursor.y), event = info.event, difference = this.calculateDifference(event, view.getDateFromCell(cell), info.startDate);
  view.handleChange('drop', event, new Ext.calendar.date.Range(D.add(event.getStartDate(), D.DAY, difference, true), D.add(event.getEndDate(), D.DAY, difference, true)), function() {
    view.clearSelected();
  });
  this.callParent([info]);
}, destroy:function() {
  this.setView(null);
  this.callParent();
}, privates:{calculateDifference:function(event, d, startDate) {
  var D = Ext.Date, start = event.getStartDate(), before, difference;
  if (event.getAllDay()) {
    d = D.localToUtc(d);
    before = d < start;
  } else {
    before = d < startDate;
    start = startDate;
  }
  difference = D.diff(before ? d : start, before ? start : d, D.DAY);
  if (before) {
    difference = -difference;
  }
  return difference;
}}});
Ext.define('Ext.calendar.form.CalendarPicker', {extend:'Ext.form.field.ComboBox', xtype:'calendar-calendar-picker', cls:Ext.baseCSSPrefix + 'calendar-picker-field', listConfig:{cls:Ext.baseCSSPrefix + 'calendar-picker-list', getInnerTpl:function(displayField) {
  return '\x3cdiv class\x3d"' + Ext.baseCSSPrefix + 'calendar-picker-list-icon" style\x3d"background-color: {color};"\x3e\x3c/div\x3e' + '\x3cdiv class\x3d"' + Ext.baseCSSPrefix + 'calendar-picker-list-text"\x3e{' + displayField + '}\x3c/div\x3e';
}, prepareData:function(data, index, record) {
  return {id:record.id, title:record.getTitle(), color:record.getBaseColor()};
}}, afterRender:function() {
  this.callParent();
  this.updateValue();
}, updateValue:function() {
  var me = this, el, record;
  me.callParent();
  record = me.valueCollection.first();
  if (me.rendered) {
    el = me.iconEl;
    if (!el) {
      me.iconEl = el = me.inputWrap.createChild({cls:Ext.baseCSSPrefix + 'calendar-picker-field-icon'});
    }
    if (record) {
      el.setDisplayed(true);
      el.setStyle('background-color', record.getBaseColor());
    } else {
      el.setDisplayed(false);
    }
  }
}});
Ext.define('Ext.calendar.form.AbstractForm', {extend:'Ext.window.Window', requires:['Ext.layout.container.Fit', 'Ext.layout.container.VBox', 'Ext.layout.container.HBox', 'Ext.form.Panel', 'Ext.form.field.Text', 'Ext.form.field.Date', 'Ext.form.field.Time', 'Ext.form.field.Checkbox', 'Ext.calendar.form.CalendarPicker'], layout:'fit', modal:true, closable:false, defaultListenerScope:true, config:{calendarField:{xtype:'calendar-calendar-picker', fieldLabel:'Calendar', name:'calendarId', forceSelection:true, 
editable:false, queryMode:'local', displayField:'title', valueField:'id'}, titleField:{xtype:'textfield', fieldLabel:'Title', name:'title', allowBlank:false}, fromContainer:{xtype:'fieldcontainer', fieldLabel:'From', layout:'hbox'}, startDateField:{xtype:'datefield', itemId:'startDate', name:'startDate', allowBlank:false}, startTimeField:{xtype:'timefield', itemId:'startTime', name:'startTime', margin:'0 0 0 5'}, toContainer:{xtype:'fieldcontainer', fieldLabel:'To', layout:'hbox'}, endDateField:{xtype:'datefield', 
itemId:'endDate', name:'endDate', allowBlank:false}, endTimeField:{xtype:'timefield', itemId:'endTime', name:'endTime', margin:'0 0 0 5'}, allDayField:{xtype:'checkbox', itemId:'allDay', name:'allDay', boxLabel:'All Day', hideEmptyLabel:false, handler:'onAllDayChange'}, descriptionField:{xtype:'textarea', fieldLabel:'Description', name:'description', flex:1}, dropButton:{text:'Delete', handler:'onDropTap'}, saveButton:{text:'Save', handler:'onSaveTap'}, cancelButton:{text:'Cancel', handler:'onCancelTap'}}, 
initComponent:function() {
  var me = this;
  me.initForm();
  me.fbar = me.generateButtons();
  me.callParent();
  me.form = me.items.first();
  me.checkFields();
  me.applyValues();
}, generateButtons:function() {
  var buttons = [], drop = this.getDropButton();
  if (drop) {
    buttons.push(drop);
  }
  buttons.push({xtype:'component', flex:1}, this.getSaveButton(), this.getCancelButton());
  return buttons;
}, applyValues:function() {
  this.form.getForm().setValues(this.consumeEventData());
}, createItems:function() {
  var me = this, calField = me.getCalendarField(), fromCt = me.getFromContainer(), toCt = me.getToContainer();
  if (!calField.store) {
    calField.store = me.getCalendarStore();
  }
  if (!fromCt.items) {
    fromCt.items = [me.getStartDateField(), me.getStartTimeField()];
  }
  if (!toCt.items) {
    toCt.items = [me.getEndDateField(), me.getEndTimeField()];
  }
  this.items = [{xtype:'form', border:false, trackResetOnLoad:true, layout:{type:'vbox', align:'stretch'}, bodyPadding:10, items:[calField, me.getTitleField(), fromCt, toCt, me.getAllDayField(), me.getDescriptionField()]}];
}, privates:{checkFields:function() {
  var checked = this.down('#allDay').checked;
  this.down('#startTime').setDisabled(checked);
  this.down('#endTime').setDisabled(checked);
}, onAllDayChange:function() {
  this.checkFields();
}, onCancelTap:function() {
  this.fireCancel();
}, onDropTap:function() {
  this.fireDrop();
}, onSaveTap:function() {
  var form = this.form, values = form.getForm().getFieldValues();
  if (!form.isValid()) {
    return;
  }
  values.allDay = this.down('#allDay').checked;
  this.fireSave(this.produceEventData(values));
}}});
Ext.define('Ext.calendar.form.Base', {extend:'Ext.Mixin', requires:['Ext.data.ChainedStore'], config:{event:null, view:null}, fireCancel:function() {
  this.fireEvent('cancel', this);
}, fireDrop:function() {
  this.fireEvent('drop', this);
}, fireSave:function(data) {
  this.fireEvent('save', this, {data:data});
}, getCalendarStore:function() {
  return {type:'chained', autoDestroy:true, source:this.getView().getStore(), filters:[{filterFn:function(cal) {
    return cal.isEditable();
  }}]};
}});
Ext.define('Ext.calendar.form.Form', {extend:'Ext.calendar.form.AbstractForm', mixins:['Ext.calendar.form.Base'], defaultStartTime:[9, 0], defaultEndTime:[10, 0], initForm:function() {
  this.createItems();
}, consumeEventData:function() {
  var me = this, D = Ext.Date, view = me.getView(), event = me.getEvent(), start = event.getStartDate(), end = event.getEndDate(), allDay = event.getAllDay(), startDate = allDay ? D.utcToLocal(start) : view.utcToLocal(start), endDate = allDay ? D.utcToLocal(end) : view.utcToLocal(end), ignoreTimes = allDay || startDate.getTime() === endDate.getTime(), data = {calendarId:event.getCalendarId(), title:event.getTitle(), description:event.getDescription(), allDay:allDay, startDate:startDate, endDate:endDate}, 
  editable;
  if (!ignoreTimes) {
    data.startTime = startDate;
    data.endTime = endDate;
  }
  if (allDay) {
    data.endDate = D.subtract(endDate, D.DAY, 1, true);
  }
  me.setDefaultTime(data, 'startTime', me.defaultStartTime);
  me.setDefaultTime(data, 'endTime', me.defaultEndTime);
  if (!data.calendarId) {
    editable = view.getEditableCalendars();
    if (editable.length) {
      data.calendarId = editable[0].id;
    }
  }
  return data;
}, produceEventData:function(values) {
  var D = Ext.Date, view = this.getView(), startTime = values.startTime, endTime = values.endTime, startDate = values.startDate, endDate = values.endDate, sYear = startDate.getFullYear(), sMonth = startDate.getMonth(), sDate = startDate.getDate(), eYear = endDate.getFullYear(), eMonth = endDate.getMonth(), eDate = endDate.getDate();
  if (values.allDay) {
    startDate = D.utc(sYear, sMonth, sDate);
    endDate = D.add(D.utc(eYear, eMonth, eDate), D.DAY, 1, true);
    delete values.startTime;
    delete values.endTime;
  } else {
    startDate = view.toUtcOffset(new Date(sYear, sMonth, sDate, startTime.getHours(), startTime.getMinutes()));
    endDate = view.toUtcOffset(new Date(eYear, eMonth, eDate, endTime.getHours(), endTime.getMinutes()));
  }
  values.startDate = startDate;
  values.endDate = endDate;
  return values;
}, privates:{setDefaultTime:function(data, key, time) {
  if (!data[key]) {
    data[key] = new Date(2010, 0, 1, time[0], time[1]);
  }
}}});
Ext.define('Ext.calendar.form.Add', {extend:'Ext.calendar.form.Form', xtype:'calendar-form-add', dropButton:null, title:'Add Event'});
Ext.define('Ext.calendar.form.Edit', {extend:'Ext.calendar.form.Form', xtype:'calendar-form-edit', title:'Edit Event'});
Ext.define('Ext.calendar.header.Base', {extend:'Ext.Gadget', mixins:['Ext.mixin.ConfigState'], alternateStateConfig:'compactOptions', config:{cellCls:'', compact:false, compactOptions:null, format:'', value:null, visibleDays:null}, baseCls:Ext.baseCSSPrefix + 'calendar-header', constructor:function(config) {
  this.callParent([config]);
  this.redrawCells();
}, updateCompact:function(compact) {
  var me = this, baseCls = me.baseCls;
  me.element.toggleCls(baseCls + '-compact', compact);
  me.element.toggleCls(baseCls + '-large', !compact);
  me.toggleConfigState(compact);
}, updateCompactOptions:function() {
  if (!this.isConfiguring && this.getCompact()) {
    this.toggleConfigState();
  }
}, updateFormat:function() {
  if (!this.isConfiguring) {
    this.setHeaderText(true);
  }
}, applyValue:function(value, oldValue) {
  if (value && oldValue && value - oldValue === 0) {
    value = undefined;
  }
  return value;
}, updateValue:function() {
  if (!this.isConfiguring) {
    this.setHeaderText();
  }
}, updateVisibleDays:function() {
  if (!this.isConfiguring) {
    this.redrawCells();
  }
}, getElementConfig:function() {
  return {tag:'table', cls:this.$tableCls, reference:'element', children:[{tag:'tbody', children:[{tag:'tr', reference:'row'}]}]};
}, privates:{domFormat:'Y-m-d', useDates:true, $headerCls:Ext.baseCSSPrefix + 'calendar-header-cell', $hiddenCls:Ext.baseCSSPrefix + 'calendar-header-hidden-cell', $tableCls:Ext.baseCSSPrefix + 'calendar-header-table', clearCells:function(limit) {
  limit = limit || 0;
  var row = this.row.dom, childNodes = row.childNodes;
  while (childNodes.length > limit) {
    row.removeChild(childNodes[limit]);
  }
}, createCells:function() {
  var me = this, row = me.row.dom, cells = [], days = me.getCreateDays(), cls = Ext.baseCSSPrefix + 'unselectable ' + me.$headerCls, cellCls = me.getCellCls(), cell, i;
  if (cellCls) {
    cls += ' ' + cellCls;
  }
  for (i = 0; i < days; ++i) {
    cell = document.createElement('td');
    cell.className = cls;
    cell.setAttribute('data-index', i);
    me.onCellCreate(cell, i);
    row.appendChild(cell);
    cells.push(cell);
  }
  return cells;
}, getCreateDays:function() {
  return this.getVisibleDays();
}, onCellCreate:Ext.privateFn, redrawCells:function() {
  this.clearCells();
  this.cells = this.createCells();
  this.setHeaderText();
}, setHeaderText:function() {
  var me = this, D = Ext.Date, value = me.getValue(), format = me.getFormat(), domFormat = me.domFormat, cells = me.cells, len = cells.length, useDates = me.useDates, cell, i;
  if (!value) {
    return;
  }
  value = D.clone(value);
  for (i = 0; i < len; ++i) {
    cell = cells[i];
    if (useDates) {
      cell.setAttribute('data-date', D.format(value, domFormat));
    }
    cell.setAttribute('data-day', value.getDay());
    cell.innerHTML = D.format(value, format);
    value = D.add(value, D.DAY, 1, true);
  }
}}});
Ext.define('Ext.calendar.header.Days', {extend:'Ext.calendar.header.Base', xtype:'calendar-daysheader', format:'D m/d', compactOptions:{format:'d'}, getElementConfig:function() {
  var result = this.callParent();
  result.cls = this.$tableCls;
  delete result.reference;
  return {cls:Ext.baseCSSPrefix + 'calendar-header', reference:'element', children:[result]};
}, privates:{headerScrollOffsetName:'padding-right', $gutterCls:Ext.baseCSSPrefix + 'calendar-header-gutter', createCells:function() {
  var me = this, row = me.row, cells = me.callParent();
  row.insertFirst({tag:'td', cls:me.$headerCls + ' ' + me.$gutterCls});
  row.append({tag:'td', style:'display: none;'});
  return cells;
}, setOverflowWidth:function(width) {
  this.element.setStyle(this.headerScrollOffsetName, width + 'px');
}}});
Ext.define('Ext.calendar.header.Weeks', {extend:'Ext.calendar.header.Base', xtype:'calendar-weeksheader', format:'D', privates:{useDates:false, getCreateDays:function() {
  return Ext.Date.DAYS_IN_WEEK;
}, onCellCreate:function(cell, index) {
  Ext.fly(cell).toggleCls(this.$hiddenCls, index >= this.getVisibleDays());
}}});
Ext.define('Ext.calendar.model.EventBase', {extend:'Ext.Mixin', requires:['Ext.calendar.date.Range'], inheritableStatics:{getDaysSpanned:function(start, end) {
  var D = Ext.Date, count = 0;
  start = D.clearTime(start, true);
  while (start < end) {
    ++count;
    start = D.add(start, D.DAY, 1, true);
  }
  return count;
}, sort:function(a, b) {
  return a.getStartDate().getTime() - b.getStartDate().getTime() || b.getDuration() - a.getDuration() || a.getTitle() - b.getTitle();
}}, containsRange:function(start, end) {
  return this.getRange().containsRange(start, end);
}, getCalendar:function() {
  return this.calendar || null;
}, getRange:function() {
  return new Ext.calendar.date.Range(this.getStartDate(), this.getEndDate());
}, isContainedByRange:function(start, end) {
  return this.getRange().isContainedBy(start, end);
}, isSpan:function() {
  return this.getAllDay() || this.getDuration() >= 1440;
}, occursInRange:function(start, end) {
  return this.getRange().overlaps(start, end);
}, setCalendar:function(calendar, dirty) {
  dirty = dirty !== false;
  this.calendar = calendar;
  this.setCalendarId(calendar ? calendar.id : null, dirty);
}});
Ext.define('Ext.calendar.model.Event', {extend:'Ext.data.Model', mixins:['Ext.calendar.model.EventBase'], requires:['Ext.data.field.String', 'Ext.data.field.Integer', 'Ext.data.field.Date', 'Ext.data.field.Boolean'], fields:[{name:'title', type:'string'}, {name:'calendarId'}, {name:'color', type:'string'}, {name:'description', type:'string'}, {name:'startDate', type:'date', dateFormat:'c'}, {name:'endDate', type:'date', dateFormat:'c'}, {name:'allDay', type:'boolean'}, {name:'duration', type:'int', 
depends:['startDate', 'endDate'], calculate:function(data) {
  var start = data.startDate, end = data.endDate, ms = 0;
  if (end && start) {
    ms = end.getTime() - start.getTime();
  }
  return ms / 60000;
}}], getAllDay:function() {
  return this.data.allDay;
}, getCalendarId:function() {
  return this.data.calendarId;
}, getColor:function() {
  return this.data.color;
}, getDescription:function() {
  return this.data.description;
}, getDuration:function() {
  return this.data.duration;
}, getEndDate:function() {
  return this.data.endDate;
}, getRange:function() {
  var me = this, range = me.range;
  if (!range) {
    me.range = range = new Ext.calendar.date.Range(me.getStartDate(), me.getEndDate());
  }
  return range;
}, getStartDate:function() {
  return this.data.startDate;
}, getTitle:function() {
  return this.data.title;
}, isEditable:function() {
  var calendar = this.getCalendar();
  return calendar ? calendar.isEditable() : true;
}, setAllDay:function(allDay) {
  this.set('allDay', allDay);
}, setCalendarId:function(calendarId, dirty) {
  dirty = dirty !== false;
  this.set('calendarId', calendarId, {dirty:dirty});
}, setColor:function(color) {
  this.set('color', color);
}, setData:function(data) {
  var duration = data.duration;
  if (duration) {
    data = Ext.apply({}, data);
    delete data.duration;
    this.setDuration(duration);
  } else {
    if (data.startDate && data.endDate) {
      this.range = null;
    }
  }
  this.set(data);
}, setDescription:function(description) {
  this.set('description', description);
}, setDuration:function(duration) {
  var D = Ext.Date;
  this.range = null;
  this.set('endDate', D.add(this.data.startDate, D.MINUTE, duration, true));
}, setRange:function(start, end) {
  var D = Ext.Date;
  if (start.isRange) {
    end = start.end;
    start = start.start;
  }
  this.range = null;
  this.set({startDate:D.clone(start), endDate:D.clone(end)});
}, setTitle:function(title) {
  this.set('title', title);
}});
Ext.define('Ext.calendar.store.Events', {extend:'Ext.data.Store', alias:'store.calendar-events', model:'Ext.calendar.model.Event', requires:['Ext.calendar.model.Event', 'Ext.calendar.date.Range'], config:{calendar:null, calendarParam:'calendar', dateFormat:'C', endParam:'endDate', prefetchMode:'month', startParam:'startDate'}, remoteSort:false, pageSize:0, sorters:[{direction:'ASC', sorterFn:function(a, b) {
  return Ext.calendar.model.Event.sort(a, b);
}}], prefetchSettings:{month:{unit:Ext.Date.MONTH, amount:2}, week:{unit:Ext.Date.WEEK, amount:2}, day:{unit:Ext.Date.DAY, amount:4}}, constructor:function(config) {
  this.requests = {};
  this.callParent([config]);
}, getInRange:function(start, end) {
  var records = this.data.items, len = records.length, ret = [], i, rec;
  for (i = 0; i < len; ++i) {
    rec = records[i];
    if (rec.occursInRange(start, end)) {
      ret.push(rec);
    }
  }
  return ret;
}, hasRangeCached:function(range) {
  var current = this.range, ret = false;
  if (current) {
    ret = current.full.containsRange(range);
  }
  return ret;
}, setRange:function(range) {
  var me = this, D = Ext.Date, R = Ext.calendar.date.Range, current = me.range, prefetchSettings = me.getPrefetchSetting(), fullStart = D.subtract(range.start, prefetchSettings.unit, prefetchSettings.amount, true), fullEnd = D.add(range.end, prefetchSettings.unit, prefetchSettings.amount, true), newRange = {actual:range.clone(), full:new R(fullStart, fullEnd)}, fetchCount = 0, isLeading = false, fetchStart, fetchEnd;
  if (me.compareRange(current, newRange)) {
    return;
  }
  if (current && current.full.containsRange(newRange.full)) {
    return;
  }
  if (me.hasRangeCached(range)) {
    if (!me.hasRangeCached(newRange.full)) {
      if (current.full.start > fullStart) {
        fetchStart = fullStart;
        fetchEnd = current.full.start;
        ++fetchCount;
        isLeading = true;
      }
      if (current.full.end < fullEnd) {
        fetchStart = current.full.end;
        fetchEnd = fullEnd;
        ++fetchCount;
      }
      if (fetchCount === 1) {
        me.prefetchRange(fetchStart, fetchEnd, isLeading, newRange);
      } else {
        if (fetchCount === 2) {
          me.loadRange(fullStart, fullEnd, newRange);
        } else {
          Ext.raise('Should never be here.');
        }
      }
    }
  } else {
    me.loadRange(newRange.full.start, newRange.full.end, newRange);
  }
  me.requested = newRange;
}, onProxyLoad:function(operation) {
  var me = this;
  if (operation.wasSuccessful()) {
    me.range = me.requested;
    me.requested = null;
  }
  me.setCalendarFromLoad = true;
  me.callParent([operation]);
  me.setCalendarFromLoad = false;
}, onCollectionAdd:function(collection, info) {
  var me = this;
  me.setRecordCalendar(me.getCalendar(), info.items, !me.setCalendarFromLoad);
  me.callParent([collection, info]);
}, onCollectionRemove:function(collection, info) {
  this.callParent([collection, info]);
  if (!this.isMoving) {
    this.setRecordCalendar(null, info.items, true);
  }
}, privates:{isMoving:0, abortAll:function() {
  var requests = this.requests, id;
  for (id in requests) {
    requests[id].abort();
  }
  this.requests = {};
}, compareRange:function(a, b) {
  var ret = false;
  if (!a || !b) {
    ret = (a || null) === (b || null);
  } else {
    ret = a.full.equals(b.full) && a.actual.equals(b.actual);
  }
  return ret;
}, getPrefetchSetting:function() {
  return this.prefetchSettings[this.getPrefetchMode()];
}, loadRange:function(start, end, newRequested) {
  var me = this, requested = me.requested, range = new Ext.calendar.date.Range(start, end);
  if (!(requested && requested.full.equals(range))) {
    me.abortAll();
    me.load({params:me.setupParams(start, end), requested:newRequested});
  }
}, onBeforeLoad:function(operation) {
  this.requests[operation._internalId] = operation;
}, onPrefetch:function(operation) {
  var me = this, records = operation.getRecords() || [], toPrune = [], toAdd = [], map = Ext.Array.toMap(records, 'id'), range = me.getDataSource().getRange(), len = range.length, start = me.range.full.start, end = me.range.full.end, i, rec;
  if (operation.wasSuccessful()) {
    me.range = me.requested;
    me.requested = null;
  }
  delete me.requests[operation._internalId];
  me.suspendEvents();
  for (i = 0; i < len; ++i) {
    rec = range[i];
    if (!(map[rec.id] || rec.occursInRange(start, end))) {
      toPrune.push(rec);
    }
  }
  for (i = 0, len = records.length; i < len; ++i) {
    rec = records[i];
    if (!me.getById(rec.id)) {
      toAdd.push(rec);
    }
  }
  me.ignoreCollectionRemove = me.setCalendarFromLoad = true;
  me.getData().splice(0, toPrune, toAdd);
  me.ignoreCollectionRemove = me.setCalendarFromLoad = false;
  me.resumeEvents();
  me.fireEvent('prefetch', me, toAdd, toPrune);
}, prefetch:function(options) {
  var me = this, operation;
  options = Ext.apply({internalScope:me, internalCallback:me.onPrefetch}, options);
  me.setLoadOptions(options);
  operation = me.createOperation('read', options);
  me.requests[operation._internalId] = operation;
  operation.execute();
}, prefetchRange:function(start, end, isLeading, newRequested) {
  this.prefetch({params:this.setupParams(start, end), isLeading:isLeading, newRequested:newRequested});
}, setRecordCalendar:function(calendar, records, dirty) {
  var len = records.length, i, record;
  for (i = 0; i < len; ++i) {
    record = records[i];
    record.$moving = true;
    record.setCalendar(calendar, dirty);
    delete record.$moving;
  }
}, setupParams:function(start, end) {
  var me = this, D = Ext.Date, format = me.getDateFormat(), params = {};
  params[me.getCalendarParam()] = me.getCalendar().id;
  params[me.getStartParam()] = D.format(start, format);
  params[me.getEndParam()] = D.format(end, format);
  return params;
}}});
Ext.define('Ext.calendar.theme.Theme', {singleton:true, requires:['Ext.util.Color'], colors:['#F44336', '#3F51B5', '#4CAF50', '#FF9800', '#E91E63', '#2196F3', '#8BC34A', '#FF5722', '#673AB7', '#009688', '#FFC107', '#607D8B'], lightColor:'#FFFFFF', darkColor:'#000000', generatePalette:function(color) {
  var me = this, light = me.light, dark = me.dark, lightColor = me.lightColor, darkColor = me.darkColor, brightness = color.getBrightness(), lightContrast, darkConstrast;
  if (!light) {
    me.light = light = Ext.util.Color.fromString(lightColor);
    me.dark = dark = Ext.util.Color.fromString(darkColor);
  }
  lightContrast = Math.abs(light.getBrightness() - brightness);
  darkConstrast = Math.abs(dark.getBrightness() - brightness);
  return {primary:color.toString(), secondary:lightContrast > darkConstrast ? lightColor : darkColor, border:color.createDarker(0.2).toString()};
}, getBaseColor:function(calendar) {
  var me = this, map = me.idMap, colors = me.colors, id = calendar.id, color;
  color = map[id];
  if (!color) {
    color = colors[me.current % colors.length];
    map[id] = color;
    ++me.current;
  }
  return color;
}, getPalette:function(color) {
  var map = this.colorMap, palette = map[color], o;
  if (!palette) {
    o = Ext.util.Color.fromString(color);
    map[color] = palette = this.generatePalette(o);
  }
  return palette;
}, privates:{colorMap:{}, idMap:{}, current:0, onIdChanged:function(newId, oldId) {
  var map = this.idMap, val = map[oldId];
  if (val) {
    delete map[oldId];
    map[newId] = val;
  }
}}});
Ext.define('Ext.calendar.model.CalendarBase', {extend:'Ext.Mixin', requires:['Ext.calendar.store.Events', 'Ext.calendar.theme.Theme'], config:{eventStoreDefaults:{type:'calendar-events', proxy:{type:'ajax'}}}, events:function() {
  var me = this, store = me._eventStore, cfg;
  if (!store) {
    cfg = Ext.merge({calendar:me}, me.config.eventStoreDefaults, me.eventStoreDefaults);
    me._eventStore = store = Ext.Factory.store(me.getEventStoreConfig(cfg));
  }
  return store;
}, getBaseColor:function() {
  var color = this.getColor() || this.getAssignedColor();
  if (!color) {
    color = Ext.calendar.theme.Theme.getBaseColor(this);
    this.setAssignedColor(color);
  }
  return color;
}, isEditable:function() {
  return this.getEditable();
}, isHidden:function() {
  return this.getHidden();
}, privates:{onIdChanged:function(newId, oldId) {
  Ext.calendar.theme.Theme.onIdChanged(newId, oldId);
}}});
Ext.define('Ext.calendar.model.Calendar', {extend:'Ext.data.Model', mixins:['Ext.calendar.model.CalendarBase'], requires:['Ext.data.field.String', 'Ext.data.field.Boolean'], fields:[{name:'title', type:'string'}, {name:'description', type:'string'}, {name:'color', type:'string'}, {name:'assignedColor', type:'string', persist:false}, {name:'hidden', type:'bool'}, {name:'editable', type:'bool', defaultValue:true}, {name:'eventStore', type:'auto', persist:false}], constructor:function(data, session) {
  this.callParent([data, session]);
  this.getBaseColor();
}, getAssignedColor:function() {
  return this.data.assignedColor;
}, getColor:function() {
  return this.data.color;
}, getDescription:function() {
  return this.data.description;
}, getEditable:function() {
  return this.data.editable;
}, getEventStoreConfig:function(cfg) {
  return Ext.merge(cfg, this.data.eventStore);
}, getHidden:function() {
  return this.data.hidden;
}, getTitle:function() {
  return this.data.title;
}, setAssignedColor:function(color) {
  this.set('assignedColor', color);
}, setColor:function(color) {
  this.set('color', color);
}, setDescription:function(description) {
  this.set('description', description);
}, setEditable:function(editable) {
  this.set('editable', editable);
}, setHidden:function(hidden) {
  this.set('hidden', hidden);
}, setTitle:function(title) {
  this.set('title', title);
}});
Ext.define('Ext.calendar.panel.AbstractBase', {extend:'Ext.panel.Panel', requires:['Ext.layout.container.Fit'], layout:'fit', updateDayHeader:function(dayHeader) {
  if (dayHeader) {
    this.addItem(dayHeader, 'dockedItems', 'addDocked');
  }
}, updateView:function(view) {
  this.addItem(view, 'items', 'add');
}, afterComponentLayout:function(width, height, oldWidth, oldHeight) {
  this.callParent([width, height, oldWidth, oldHeight]);
  this.syncHeaders();
}, privates:{addItem:function(item, existing, addMethod) {
  var me = this, items = me[existing];
  if (items) {
    if (items.isMixedCollection) {
      me[addMethod](item);
    } else {
      if (!Ext.isArray(items)) {
        items = [items];
      }
      me[existing] = items.concat(item);
    }
  } else {
    me[existing] = item;
  }
}, syncHeaders:function() {
  var me = this, header;
  if (me.syncHeaderSize) {
    header = me.getDayHeader();
    if (header && header.setOverflowWidth) {
      header.setOverflowWidth(me.getView().scrollable.getScrollbarSize().width);
    }
  }
}}});
Ext.define('Ext.calendar.panel.Base', {extend:'Ext.calendar.panel.AbstractBase', config:{dayHeader:null, eventRelayers:{view:{beforeeventadd:true, beforeeventedit:true, eventadd:true, eventedit:true, eventdrop:true, eventtap:true, validateeventadd:true, validateeventedit:true, validateeventdrop:true, valuechange:true}}, view:null}, platformConfig:{'!desktop':{compact:true}}, configExtractor:{view:{addForm:true, compact:true, compactOptions:true, controlStoreRange:true, editForm:true, eventDefaults:true, 
gestureNavigation:true, store:true, timezoneOffset:true, value:true}}, twoWayBindable:{value:1}, cls:[Ext.baseCSSPrefix + 'calendar-base', Ext.baseCSSPrefix + 'unselectable'], constructor:function(config) {
  var me = this, C = Ext.Config, extractor = me.configExtractor, extracted = {}, cfg, key, item, extractedItem, proxyKey;
  config = Ext.apply({}, config);
  me.extracted = extracted;
  for (cfg in extractor) {
    item = extractor[cfg];
    extracted[cfg] = extractedItem = {};
    for (key in config) {
      if (key in item) {
        proxyKey = item[key];
        if (proxyKey === true) {
          proxyKey = key;
        }
        extractedItem[proxyKey] = config[key];
        delete config[key];
      }
    }
    me.setupProxy(item, C.get(cfg).names.get);
  }
  me.callParent([config]);
  me.initRelayers();
}, onClassExtended:function(cls, data, hooks) {
  var extractor = data.configExtractor;
  if (extractor) {
    delete data.configExtractor;
    cls.prototype.configExtractor = Ext.merge({}, cls.prototype.configExtractor, extractor);
  }
}, getDisplayRange:function() {
  return this.getView().getDisplayRange();
}, getVisibleRange:function() {
  return this.getView().getVisibleRange();
}, moveNext:function() {
  this.getView().moveNext();
}, movePrevious:function() {
  this.getView().movePrevious();
}, navigate:function(amount, interval) {
  this.getView().navigate(amount, interval);
}, showAddForm:function(data, options) {
  this.getView().showAddForm(data, options);
}, showEditForm:function(event, options) {
  this.getView().showEditForm(event, options);
}, applyDayHeader:function(dayHeader) {
  if (dayHeader) {
    dayHeader = Ext.apply(this.extracted.dayHeader, dayHeader);
    dayHeader = Ext.create(dayHeader);
  }
  return dayHeader;
}, updateDayHeader:function(dayHeader, oldDayHeader) {
  if (oldDayHeader) {
    oldDayHeader.destroy();
  }
  if (dayHeader) {
    this.getView().setHeader(dayHeader);
  }
  this.callParent([dayHeader, oldDayHeader]);
}, applyView:function(view) {
  if (view) {
    view = Ext.create(Ext.apply(this.extracted.view, view));
  }
  return view;
}, updateView:function(view, oldView) {
  if (oldView) {
    oldView.destroy();
  }
  this.callParent([view, oldView]);
}, privates:{calculateMoveNext:function() {
  return this.getView().calculateMoveNext();
}, calculateMovePrevious:function() {
  return this.getView().calculateMovePrevious();
}, createItemRelayer:function(name) {
  var me = this;
  return function(view, o) {
    return me.fireEvent(name, me, o);
  };
}, generateProxyMethod:function(thisCfg, targetCfg, targetName) {
  var me = this, targetSetter = targetCfg.names.set, targetGetter = targetCfg.names.get, setter = thisCfg.names.set, getter = thisCfg.names.get;
  if (!me[setter]) {
    me[setter] = function(value) {
      var o = me[targetName]();
      if (o) {
        o[targetSetter](value);
      }
    };
  }
  if (!me[getter]) {
    me[getter] = function() {
      var o = me[targetName]();
      if (o) {
        return o[targetGetter]();
      }
    };
  }
}, initRelayers:function() {
  var C = Ext.Config, relayers = this.getEventRelayers(), key, events, c, name, prefix;
  for (key in relayers) {
    events = relayers[key];
    c = this[C.get(key).names.get]();
    prefix = events.$prefix || '';
    for (name in events) {
      c.on(name, this.createItemRelayer(prefix + name));
    }
  }
}, refreshEvents:function() {
  this.getView().refreshEvents();
}, setupProxy:function(configs, targetName) {
  var me = this, C = Ext.Config, key, targetCfg, thisCfg, val;
  for (key in configs) {
    val = configs[key];
    thisCfg = C.get(key);
    if (val === true) {
      targetCfg = thisCfg;
    } else {
      targetCfg = C.get(val);
    }
    me.generateProxyMethod(thisCfg, targetCfg, targetName);
  }
}}});
Ext.define('Ext.calendar.store.EventSource', {extend:'Ext.data.Store', requires:['Ext.calendar.date.Range'], config:{source:null}, sorters:[{direction:'ASC', sorterFn:function(a, b) {
  return Ext.calendar.model.Event.sort(a, b);
}}], trackRemoved:false, constructor:function(config) {
  this.calendarMap = {};
  this.callParent([config]);
}, createEvent:function(data) {
  if (!this.getSource()) {
    Ext.raise('Cannot create event, no source specified.');
  }
  if (!this.getSource().first()) {
    Ext.raise('Cannot create event, source is empty.');
  }
  var T = this.getSource().first().events().getModel(), event = new T;
  if (data) {
    event.setData(data);
  }
  return event;
}, updateSource:function(source) {
  var me = this;
  me.sourceListeners = Ext.destroy(me.sourceListeners);
  if (source) {
    me.sourceListeners = source.on({destroyable:true, scope:me, add:'checkData', remove:'checkData', refresh:'checkData'});
    me.checkData();
  }
}, add:function(record) {
  var events = this.getEventsForCalendar(record.getCalendarId());
  if (!events) {
    Ext.raise('Unknown calendar: ' + record.getCalendarId());
    return;
  }
  events.add(record);
}, move:function(record, oldCalendar) {
  var store = this.getEventsForCalendar(oldCalendar), newCalendar = record.getCalendar(), removed;
  if (newCalendar) {
    store.suspendAutoSync();
    ++store.isMoving;
  }
  store.remove(record);
  if (newCalendar) {
    --store.isMoving;
    store.resumeAutoSync();
    record.unjoin(store);
    removed = store.removed;
    if (removed) {
      Ext.Array.remove(removed, record);
    }
    store = this.getEventsForCalendar(newCalendar);
    store.suspendAutoSync();
    store.add(record);
    store.resumeAutoSync();
  }
}, remove:function(record) {
  var events = this.getEventsForCalendar(record.getCalendarId());
  if (!events) {
    Ext.raise('Unknown calendar: ' + record.getCalendarId());
    return;
  }
  events.remove(record);
}, hasRangeCached:function(range) {
  var map = this.calendarMap, current = this.range, id, store, hasAny;
  if (!current) {
    return false;
  }
  for (id in map) {
    hasAny = true;
    store = this.getEventsForCalendar(map[id]);
    if (!store.hasRangeCached(range)) {
      return false;
    }
  }
  if (!hasAny) {
    return current.containsRange(range);
  }
  return true;
}, setRange:function(range) {
  var me = this, map = me.calendarMap, success = true, allCached = true, cached, store, id, loads, hasAny;
  me.range = range.clone();
  for (id in map) {
    hasAny = true;
    store = me.getEventsForCalendar(map[id]);
    cached = store.hasRangeCached(range);
    allCached = allCached && cached;
    store.setRange(range);
    if (!cached) {
      loads = loads || [];
      store.on('load', function(s, records, successful) {
        Ext.Array.remove(loads, s);
        success = success && successful;
        if (loads.length === 0) {
          me.doBulkLoad(success);
        }
      }, null, {single:true});
      loads.push(store);
      me.activeLoad = true;
    }
  }
  if (hasAny && allCached) {
    me.checkData(true);
  } else {
    if (loads) {
      me.fireEvent('beforeload', me);
    }
  }
}, doDestroy:function() {
  var me = this, map = this.calendarMap, id;
  for (id in map) {
    me.untrackCalendar(map[id]);
  }
  me.calendarMap = me.stores = null;
  me.setSource(null);
  me.callParent();
}, privates:{checkData:function(fromSetRange) {
  var me = this, map = me.calendarMap, o = Ext.apply({}, map), source = me.getSource(), calendars = source.getRange(), len = calendars.length, records = [], range = me.range, i, id, calendar, events, start, end;
  if (range) {
    start = range.start;
    end = range.end;
  }
  for (i = 0; i < len; ++i) {
    calendar = calendars[i];
    id = calendar.getId();
    if (o[id]) {
      delete o[id];
      me.untrackCalendar(map[id]);
    }
    me.trackCalendar(calendar);
    if (range) {
      events = me.getEventsForCalendar(calendar);
      if (events.getCount()) {
        Ext.Array.push(records, events.getInRange(start, end));
      }
    }
    map[id] = calendar;
  }
  for (id in o) {
    me.untrackCalendar(o[id]);
    delete map[id];
  }
  if (fromSetRange !== true && range) {
    me.setRange(range);
  }
  me.loadRecords(records);
}, doBulkLoad:function(success) {
  var me = this, map = me.calendarMap, range = me.range, records = [], id, events;
  if (success) {
    for (id in map) {
      events = me.getEventsForCalendar(map[id]);
      Ext.Array.push(records, events.getInRange(range.start, range.end));
    }
    me.loadRecords(records);
  }
  me.fireEvent('load', me, records, success);
  me.activeLoad = false;
}, fireChangeEvent:function() {
  return false;
}, getEventsForCalendar:function(calendar) {
  var ret = null;
  if (!calendar.isModel) {
    calendar = this.calendarMap[calendar];
  }
  if (calendar) {
    ret = calendar.events();
  }
  return ret;
}, onEventStoreAdd:function(store, records) {
  var range = this.range, len = records.length, toAdd = [], i, rec;
  for (i = 0; i < len; ++i) {
    rec = records[i];
    if (rec.occursInRange(range.start, range.end)) {
      toAdd.push(rec);
    }
  }
  if (toAdd.length > 0) {
    this.getDataSource().add(toAdd);
  }
}, onEventStoreBeforeUpdate:function(store, record) {
  if (!record.$moving) {
    this.suspendEvents();
    this.lastIndex = this.indexOf(record);
  }
}, onEventStoreClear:function(store, records) {
  var me = this, result;
  if (records.length > 0) {
    me.suspendEvents();
    result = me.getDataSource().remove(records);
    me.resumeEvents();
    if (result) {
      me.fireEvent('refresh', me);
    }
  }
}, onEventStorePrefetch:function(store, added, pruned) {
  this.getDataSource().remove(pruned);
}, onEventStoreRefresh:function() {
  if (this.activeLoad) {
    return;
  }
  this.checkData();
}, onEventStoreRemove:function(store, records) {
  this.getDataSource().remove(records);
}, onEventStoreUpdate:function(store, record, type, modifiedFieldNames, info) {
  if (record.$moving) {
    return;
  }
  var me = this, range = me.range, oldIndex = me.lastIndex, contained = me.lastIndex !== -1, contains = me.contains(record);
  me.resumeEvents();
  if (contained && contains) {
    me.fireEvent('update', me, record, type, modifiedFieldNames, info);
  } else {
    if (contained && !contains) {
      me.fireEvent('remove', me, [record], oldIndex, false);
    } else {
      if (!contained && contains) {
        me.fireEvent('add', me, [record], me.indexOf(record));
      }
    }
  }
}, trackCalendar:function(calendar) {
  var events = this.getEventsForCalendar(calendar);
  events.sourceListeners = events.on({destroyable:true, scope:this, add:'onEventStoreAdd', beforeupdate:'onEventStoreBeforeUpdate', clear:'onEventStoreClear', prefetch:'onEventStorePrefetch', refresh:'onEventStoreRefresh', remove:'onEventStoreRemove', update:'onEventStoreUpdate'});
}, untrackCalendar:function(calendar) {
  var events = this.getEventsForCalendar(calendar);
  events.sourceListeners = Ext.destroy(events.sourceListeners);
}}});
Ext.define('Ext.calendar.store.Calendars', {extend:'Ext.data.Store', alias:'store.calendar-calendars', requires:['Ext.calendar.store.EventSource', 'Ext.calendar.model.Calendar'], config:{eventStoreDefaults:null}, model:'Ext.calendar.model.Calendar', getEventSource:function() {
  var source = this.eventSource;
  if (!source) {
    this.eventSource = source = new Ext.calendar.store.EventSource({source:this});
  }
  return source;
}, onCollectionAdd:function(collection, info) {
  var cfg = this.getEventStoreDefaults(), items = info.items, len = items.length, i, rec;
  this.callParent([collection, info]);
  if (cfg) {
    for (i = 0; i < len; ++i) {
      rec = items[i];
      if (!rec.hasOwnProperty('eventStoreDefaults')) {
        rec.eventStoreDefaults = Ext.merge({}, rec.eventStoreDefaults, cfg);
      }
    }
  }
}, doDestroy:function() {
  this.eventSource = Ext.destroy(this.eventSource);
  this.callParent();
}});
Ext.define('Ext.calendar.view.Base', {extend:'Ext.Gadget', requires:['Ext.calendar.store.Calendars', 'Ext.calendar.theme.Theme', 'Ext.calendar.Event', 'Ext.Promise', 'Ext.calendar.date.Range', 'Ext.calendar.date.Util'], mixins:['Ext.mixin.ConfigState'], alternateStateConfig:'compactOptions', config:{addForm:{xtype:'calendar-form-add'}, compact:false, compactOptions:null, controlStoreRange:true, editForm:{xtype:'calendar-form-edit'}, eventDefaults:{xtype:'calendar-event'}, gestureNavigation:true, 
header:null, store:null, timezoneOffset:undefined, value:undefined}, platformConfig:{'!desktop':{compact:true}}, twoWayBindable:{value:1}, constructor:function(config) {
  this.eventMap = {};
  this.eventPool = {};
  this.callParent([config]);
}, getForm:function() {
  return this.form || null;
}, moveNext:function() {
  this.setValue(this.calculateMoveNext());
}, movePrevious:function() {
  this.setValue(this.calculateMovePrevious());
}, navigate:function(amount, interval) {
  var D = Ext.Date;
  if (amount !== 0) {
    this.setValue(D.add(this.getValue(), interval || D.DAY, amount, true));
  }
}, showAddForm:function(event, options) {
  var me = this, D = Ext.Date, range;
  if (me.getAddForm()) {
    if (!event) {
      range = me.getDefaultCreateRange();
      event = me.createModel({startDate:range.start, endDate:D.add(range.end, D.DAY, 1, true), allDay:true});
    }
    me.doShowForm(event, 'add', me.createAddForm(), 'onFormCreateSave', options);
  }
}, showEditForm:function(event, options) {
  if (this.getEditForm()) {
    this.doShowForm(event, 'edit', this.createEditForm(), 'onFormEditSave', options);
  }
}, createAddForm:function() {
  return Ext.merge({view:this}, this.getAddForm());
}, createEditForm:function(event) {
  return Ext.merge({view:this}, this.getEditForm());
}, getEventSource:function() {
  return this.eventSource;
}, updateCompact:function(compact) {
  var me = this, baseCls = me.baseCls, header = me.getHeader();
  me.toggleCls(Ext.baseCSSPrefix + 'calendar-compact', compact);
  me.toggleCls(baseCls + '-compact', compact);
  me.toggleCls(Ext.baseCSSPrefix + 'calendar-large', !compact);
  me.toggleCls(baseCls + '-large', !compact);
  if (header) {
    header.setCompact(compact);
  }
  me.toggleConfigState(compact);
}, updateCompactOptions:function() {
  if (!this.isConfiguring && this.getCompact()) {
    this.toggleConfigState(true);
  }
}, updateGestureNavigation:function(gestureNavigation) {
  var method;
  if (Ext.supports.Touch) {
    method = gestureNavigation ? 'on' : 'un';
    this.getBodyElement()[method]('swipe', 'onBodySwipe', this);
  }
}, updateHeader:function(header, oldHeader) {
  if (oldHeader) {
    oldHeader.destroy();
  }
  if (header) {
    header.setCompact(this.getCompact());
    this.refreshHeaders();
  }
}, applyStore:function(store) {
  if (store) {
    store = Ext.StoreManager.lookup(store, 'calendar-calendars');
  }
  return store;
}, updateStore:function(store, oldStore) {
  var me = this;
  me.eventSource = null;
  if (oldStore) {
    if (oldStore.getAutoDestroy()) {
      oldStore.destroy();
    } else {
      oldStore.getEventSource().un(me.getSourceListeners());
      oldStore.un(me.getStoreListeners());
    }
  }
  if (store) {
    store.on(me.getStoreListeners());
    me.eventSource = store.getEventSource();
    me.eventSource.on(me.getSourceListeners());
    if (!me.isConfiguring) {
      me.onSourceAttach();
      me.refreshEvents();
    }
  }
}, applyTimezoneOffset:function(timezoneOffset) {
  this.autoOffset = false;
  if (timezoneOffset === undefined) {
    timezoneOffset = Ext.calendar.date.Util.getDefaultTimezoneOffset();
    this.autoOffset = true;
  }
  return timezoneOffset;
}, applyValue:function(value, oldValue) {
  value = Ext.Date.clearTime(value || Ext.calendar.date.Util.getLocalNow(), true);
  if (oldValue && oldValue.getTime() === value.getTime()) {
    value = undefined;
  }
  return value;
}, updateValue:function(value) {
  if (!this.isConfiguring) {
    this.fireEvent('valuechange', this, {value:value});
  }
}, doDestroy:function() {
  var me = this;
  me.clearEvents();
  me.form = Ext.destroy(me.form);
  me.setHeader(null);
  me.setStore(null);
  me.callParent();
}, privates:{$eventCls:Ext.baseCSSPrefix + 'calendar-event', $eventInnerCls:Ext.baseCSSPrefix + 'calendar-event-inner', $eventColorCls:Ext.baseCSSPrefix + 'calendar-event-marker-color', $staticEventCls:Ext.baseCSSPrefix + 'calendar-event-static', $tableCls:Ext.baseCSSPrefix + 'calendar-table', eventRefreshSuspend:0, refreshCounter:0, forwardDirection:'left', backwardDirection:'right', dateInfo:null, calculateMove:function(offset) {
  var interval = this.getMoveInterval(), val = this.getMoveBaseValue();
  return Ext.Date.add(val, interval.unit, offset * interval.amount, true);
}, calculateMoveNext:function() {
  return this.calculateMove(1);
}, calculateMovePrevious:function() {
  return this.calculateMove(-1);
}, clearEvents:function() {
  var map = this.eventMap, key;
  for (key in map) {
    map[key].destroy();
  }
  this.eventMap = {};
}, createEvent:function(event, cfg, dummy) {
  var me = this, defaults = Ext.apply({}, me.getEventDefaults()), widget, d;
  if (dummy) {
    d = me.getUtcNow();
    cfg.startDate = d;
    cfg.endDate = d;
  } else {
    cfg.palette = me.getEventPalette(event);
  }
  cfg = cfg || {};
  cfg.model = event;
  cfg.view = me;
  widget = Ext.widget(Ext.apply(cfg, defaults));
  if (!dummy) {
    me.eventMap[widget.id] = widget;
  }
  return widget;
}, createEvents:function(events, cfg) {
  var len = events.length, ret = [], i;
  for (i = 0; i < len; ++i) {
    ret.push(this.createEvent(events[i], Ext.apply({}, cfg)));
  }
  return ret;
}, createModel:function(data) {
  return this.getEventSource().createEvent(data);
}, doRefresh:Ext.privateFn, doRefreshEvents:Ext.privateFn, doShowForm:function(event, type, cfg, successFn, options) {
  var me = this, c;
  if (!me.getStore() || !event.isEditable()) {
    return;
  }
  if (me.fireEvent('beforeevent' + type, me, {event:event}) === false) {
    return;
  }
  options = options || {};
  me.form = c = Ext.create(Ext.apply({event:event}, cfg));
  c.on({save:function(form, context) {
    var data = context.data, o = {event:event, data:data, validate:Ext.Promise.resolve(true)};
    me.fireEvent('validateevent' + type, me, o);
    o.validate.then(function(v) {
      if (v !== false) {
        if (options.onSave) {
          options.onSave.call(options.scope || me, me, event, data);
        }
        me[successFn](form, event, data);
        me.fireEvent('event' + type, me, {event:event, data:data});
      } else {
        me.onFormCancel(form);
      }
    });
  }, cancel:function(form, context) {
    if (options.onCancel) {
      options.onCancel.call(options.scope || me, me, event);
    }
    me.onFormCancel(form);
    me.fireEvent('event' + type + 'cancel', me, {event:event});
  }, close:function(form) {
    if (options.onCancel) {
      options.onCancel.call(options.scope || me, me, event);
    }
    me.onFormCancel(form);
  }, drop:function(form) {
    var o = {event:event, validate:Ext.Promise.resolve(true)};
    me.fireEvent('validateeventdrop', me, o);
    o.validate.then(function(v) {
      if (v !== false) {
        if (options.onDrop) {
          options.onDrop.call(options.scope || me, me, event);
        }
        me.onFormDrop(form, event);
        me.fireEvent('eventdrop', me, {event:event});
      } else {
        me.onFormCancel(form);
      }
    });
  }});
  c.show();
}, getBodyElement:function() {
  return this.element;
}, getCalendar:function(id) {
  return this.getStore().getById(id);
}, getDaysSpanned:function(start, end, allDay) {
  var D = Ext.Date, ret;
  if (allDay) {
    ret = D.diff(start, end, D.DAY);
  } else {
    start = this.utcToLocal(start);
    end = this.utcToLocal(end);
    ret = Ext.calendar.model.Event.getDaysSpanned(start, end);
  }
  return ret;
}, getDefaultCreateRange:function() {
  var me = this, now = Ext.calendar.date.Util.getLocalNow(), displayRange = me.getDisplayRange(), d;
  now = me.toUtcOffset(Ext.Date.clearTime(now, true));
  if (displayRange.contains(now)) {
    d = Ext.Date.localToUtc(now);
  } else {
    d = me.toUtcOffset(displayRange.start);
  }
  return new Ext.calendar.date.Range(d, d);
}, getDefaultPalette:function() {
  var store = this.getStore(), Theme = Ext.calendar.theme.Theme, rec, color;
  if (store) {
    rec = store.first();
    if (rec) {
      color = rec.getBaseColor();
    }
  }
  return Theme.getPalette(color || Theme.colors[0]);
}, getEditableCalendars:function() {
  var store = this.getStore(), ret;
  if (store) {
    ret = Ext.Array.filter(store.getRange(), function(cal) {
      return cal.isEditable();
    });
  }
  return ret || [];
}, getEvent:function(el) {
  var cls = this.$eventCls, id;
  if (el.isEvent) {
    el = el.target;
  }
  if (!Ext.fly(el).hasCls(cls)) {
    el = Ext.fly(el).up('.' + cls, this.element, true);
  }
  id = el.getAttribute('data-eventId');
  return this.getEventSource().getById(id);
}, getEventDaysSpanned:function(event) {
  return this.getDaysSpanned(event.getStartDate(), event.getEndDate(), event.getAllDay());
}, getEventPalette:function(event) {
  var color = event.getColor() || event.getCalendar().getBaseColor();
  return Ext.calendar.theme.Theme.getPalette(color);
}, getMoveBaseValue:function() {
  return this.getValue();
}, getMoveInteral:Ext.privateFn, getSourceListeners:function() {
  return {scope:this, add:'onSourceAdd', refresh:'onSourceRefresh', remove:'onSourceRemove', update:'onSourceUpdate'};
}, getStoreListeners:function() {
  return {scope:this, update:'onStoreUpdate'};
}, getUtcNow:function() {
  return Ext.Date.utcToLocal(new Date);
}, handleChange:function(type, event, newRange, callback) {
  var me = this, o = {event:event, newRange:newRange.clone(), validate:Ext.Promise.resolve(true)}, fn = callback ? callback : Ext.emptyFn;
  me.fireEvent('validateevent' + type, me, o);
  o.validate.then(function(v) {
    if (v !== false) {
      fn(true);
      event.setRange(newRange);
      me.fireEvent('event' + type, me, {event:event, newRange:newRange.clone()});
    } else {
      fn(false);
    }
  });
}, handleChangeStart:function(type, event) {
  var ret = event.isEditable();
  if (ret) {
    ret = this.fireEvent('beforeevent' + type + 'start', this, {event:event});
  }
  return ret;
}, handleResize:Ext.privateFn, hasEditableCalendars:function() {
  return this.getEditableCalendars().length > 0;
}, isEventHidden:function(event) {
  var cal = event.getCalendar();
  return cal ? cal.isHidden() : true;
}, onBodySwipe:function(e) {
  var me = this;
  if (e.direction === me.forwardDirection) {
    me.moveNext();
  } else {
    if (e.direction === me.backwardDirection) {
      me.movePrevious();
    }
  }
}, onEventTap:function(event) {
  this.fireEvent('eventtap', this, {event:event});
  this.showEditForm(event);
}, onFormCreateSave:function(form, event, data) {
  event.setData(data);
  event.setCalendar(this.getCalendar(event.getCalendarId()));
  this.getEventSource().add(event);
  this.form = Ext.destroy(form);
}, onFormEditSave:function(form, event, data) {
  var me = this, oldCalendar = event.getCalendar(), id;
  me.suspendEventRefresh();
  event.setData(data);
  id = event.getCalendarId();
  if (oldCalendar.id !== id) {
    event.setCalendar(me.getCalendar(id));
    me.getEventSource().move(event, oldCalendar);
  }
  me.resumeEventRefresh();
  me.refreshEvents();
  me.form = Ext.destroy(form);
}, onFormDrop:function(form, event) {
  this.getEventSource().remove(event);
  this.form = Ext.destroy(form);
}, onFormCancel:function(form) {
  this.form = Ext.destroy(form);
}, onSourceAdd:function() {
  this.refreshEvents();
}, onSourceAttach:Ext.privateFn, onSourceRefresh:function() {
  this.refreshEvents();
}, onSourceRemove:function() {
  this.refreshEvents();
}, onSourceUpdate:function() {
  this.refreshEvents();
}, onStoreUpdate:function() {
  this.refreshEvents();
}, refresh:function() {
  var me = this;
  if (!me.isConfiguring) {
    ++me.refreshCounter;
    me.doRefresh();
    if (me.hasListeners.refresh) {
      me.fireEvent('refresh', me);
    }
  }
}, refreshEvents:function() {
  var me = this;
  if (!me.eventRefreshSuspend && !me.isConfiguring) {
    if (!me.refreshCounter) {
      me.refresh();
    }
    me.doRefreshEvents();
  }
}, refreshHeaders:Ext.privateFn, resumeEventRefresh:function() {
  --this.eventRefreshSuspend;
}, setSourceRange:function(range) {
  if (!this.getControlStoreRange()) {
    return;
  }
  var eventSource = this.getEventSource(), cached;
  if (eventSource) {
    range = Ext.calendar.date.Util.expandRange(range);
    cached = eventSource.hasRangeCached(range);
    eventSource.setRange(range);
    if (cached) {
      this.refreshEvents();
    }
  }
}, suspendEventRefresh:function() {
  ++this.eventRefreshSuspend;
}, toUtcOffset:function(date) {
  var D = Ext.Date, d = D.localToUtc(date), autoOffset = this.autoOffset, tzOffset = autoOffset ? d.getTimezoneOffset() : this.getTimezoneOffset(), dOffset;
  if (autoOffset) {
    dOffset = date.getTimezoneOffset();
    if (dOffset !== tzOffset) {
      tzOffset += dOffset - tzOffset;
    }
  }
  return D.add(d, D.MINUTE, tzOffset, true);
}, utcToLocal:function(d) {
  var D = Ext.Date, viewOffset = this.getTimezoneOffset(), localOffset = d.getTimezoneOffset(), ret;
  if (this.autoOffset) {
    ret = D.clone(d);
  } else {
    ret = D.subtract(d, D.MINUTE, viewOffset - localOffset, true);
  }
  return ret;
}, utcTimezoneOffset:function(date) {
  var D = Ext.Date, tzOffset = this.autoOffset ? date.getTimezoneOffset() : this.getTimezoneOffset();
  return D.subtract(date, D.MINUTE, tzOffset, true);
}}});
Ext.define('Ext.overrides.calendar.view.Base', {override:'Ext.calendar.view.Base', constructor:function(config) {
  this.callParent([config]);
  this.initialized = true;
}, render:function(container, position) {
  var me = this;
  me.callParent([container, position]);
  if (me.initialized && !me.getRefOwner()) {
    me.refresh();
  }
}, afterComponentLayout:function(width, height, oldWidth, oldHeight) {
  this.callParent([width, height, oldWidth, oldHeight]);
  this.handleResize();
}, privates:{refreshEvents:function() {
  if (this.element.dom.offsetHeight === 0) {
    return;
  }
  this.callParent();
}}});
Ext.define('Ext.calendar.view.DaysRenderer', {end:null, start:null, view:null, constructor:function(config) {
  var me = this, view, slotTicks;
  Ext.apply(me, config);
  view = me.view;
  slotTicks = view.slotTicks;
  me.slots = (view.getEndTime() - view.getStartTime()) * (60 / slotTicks);
  me.offset = view.MS_TO_MINUTES * slotTicks;
  me.events = [];
}, addIf:function(event) {
  var me = this, start = me.start, view = me.view, offset = me.offset, startSlot, endSlot;
  if (!event.isSpan() && event.isContainedByRange(start, me.end)) {
    startSlot = Math.max(0, (view.roundDate(event.getStartDate()) - start) / offset);
    endSlot = Math.min(me.slots, (view.roundDate(event.getEndDate()) - start) / offset);
    this.events.push({event:event, start:startSlot, end:endSlot, len:endSlot - startSlot, colIdx:-1, overlaps:[], edgeWeight:-1, forwardPos:-1, backwardPos:-1});
  }
}, calculate:function() {
  var me = this, events = me.events, columns, len, i, firstCol;
  events.sort(me.sortEvents);
  columns = me.buildColumns(events);
  me.constructOverlaps(columns);
  firstCol = columns[0];
  if (firstCol) {
    len = firstCol.length;
    for (i = 0; i < len; ++i) {
      me.calculateEdgeWeights(firstCol[i]);
    }
    for (i = 0; i < len; ++i) {
      me.calculatePositions(firstCol[i], 0, 0);
    }
  }
}, hasEvents:function() {
  return this.events.length > 0;
}, privates:{appendOverlappingEvents:function(event, candidates) {
  this.doOverlap(event, candidates, event.overlaps);
}, buildColumns:function(events) {
  var len = events.length, columns = [], i, j, colLen, event, idx;
  for (i = 0; i < len; ++i) {
    idx = -1;
    event = events[i];
    for (j = 0, colLen = columns.length; j < colLen; ++j) {
      if (!this.hasOverlappingEvents(event, columns[j])) {
        idx = j;
        break;
      }
    }
    if (idx === -1) {
      idx = columns.length;
      columns[idx] = [];
    }
    columns[idx].push(event);
    event.colIdx = idx;
  }
  return columns;
}, calculateEdgeWeights:function(event) {
  var overlaps = event.overlaps, len = overlaps.length, weight = event.edgeWeight, i;
  if (weight === -1) {
    weight = 0;
    for (i = 0; i < len; ++i) {
      weight = Math.max(weight, this.calculateEdgeWeights(overlaps[i]) + 1);
    }
    event.edgeWeight = weight;
  }
  return weight;
}, calculatePositions:function(event, edgeOffset, backOffset) {
  var overlaps = event.overlaps, len = overlaps.length, nextEdgeOffset = edgeOffset + 1, fwd, i, first, availWidth;
  if (event.forwardPos === -1) {
    if (len === 0) {
      event.forwardPos = 1;
    } else {
      overlaps.sort(this.sortOverlaps);
      first = overlaps[0];
      this.calculatePositions(first, nextEdgeOffset, backOffset);
      event.forwardPos = first.backwardPos;
    }
    fwd = event.forwardPos;
    availWidth = fwd - backOffset;
    event.backwardPos = fwd - availWidth / nextEdgeOffset;
    for (i = 1; i < len; ++i) {
      this.calculatePositions(overlaps[i], 0, fwd);
    }
  }
}, constructOverlaps:function(columns) {
  var len = columns.length, col, i, j, k, colLen, event;
  for (i = 0; i < len; ++i) {
    col = columns[i];
    for (j = 0, colLen = col.length; j < colLen; ++j) {
      event = col[j];
      for (k = i + 1; k < len; ++k) {
        this.appendOverlappingEvents(event, columns[k]);
      }
    }
  }
}, doOverlap:function(event, candidates, append) {
  var len = candidates.length, ret = false, i, other;
  for (i = 0; i < len; ++i) {
    other = candidates[i];
    if (this.overlaps(event, other)) {
      if (append) {
        append.push(other);
        ret = true;
      } else {
        return true;
      }
    }
  }
  return ret;
}, hasOverlappingEvents:function(event, candidates) {
  return this.doOverlap(event, candidates);
}, overlaps:function(e1, e2) {
  return e1.start < e2.end && e1.end > e2.start;
}, sortEvents:function(e1, e2) {
  return Ext.calendar.model.EventBase.sort(e1.event, e2.event);
}, sortOverlaps:function(e1, e2) {
  return e2.edgeWeight - e1.edgeWeight || (e1.backwardPos || 0) - (e2.backwardPos || 0) || Ext.calendar.model.EventBase.sort(e1.event, e2.event);
}}});
Ext.define('Ext.calendar.view.Days', {extend:'Ext.calendar.view.Base', xtype:'calendar-daysview', requires:['Ext.calendar.view.DaysRenderer', 'Ext.calendar.Event', 'Ext.scroll.Scroller', 'Ext.calendar.util.Dom'], uses:['Ext.calendar.dd.DaysAllDaySource', 'Ext.calendar.dd.DaysAllDayTarget', 'Ext.calendar.dd.DaysBodySource', 'Ext.calendar.dd.DaysBodyTarget'], isDaysView:true, baseCls:Ext.baseCSSPrefix + 'calendar-days', cellOverflowScrollBug:Ext.isGecko || Ext.isIE11m || Ext.isEdge, config:{allowSelection:true, 
compactOptions:{displayOverlap:false, showNowMarker:false, timeFormat:'g', timeRenderer:function(hour, formatted, firstInGroup) {
  var D = Ext.Date, suffix = '', d, cls;
  if (firstInGroup) {
    cls = Ext.baseCSSPrefix + 'calendar-days-time-ampm';
    d = D.clone(this.baseDate);
    d.setHours(hour);
    suffix = '\x3cdiv class\x3d"' + cls + '"\x3e' + Ext.Date.format(d, 'a') + '\x3c/div\x3e';
  }
  return formatted + suffix;
}}, displayOverlap:true, draggable:true, droppable:true, endTime:20, resizeEvents:true, showNowMarker:true, startTime:8, timeFormat:'H:i', timeRenderer:null, visibleDays:4}, constructor:function(config) {
  var me = this;
  me.slotsPerHour = 60 / me.slotTicks;
  me.callParent([config]);
  me.scrollable = me.createScroller();
  me.bodyTable.on('tap', 'handleEventTap', me, {delegate:'.' + me.$eventCls});
  me.allDayContent.on('tap', 'handleEventTap', me, {delegate:'.' + me.$eventCls});
  me.recalculate();
  me.refreshHeaders();
}, getDisplayRange:function() {
  var me = this, range;
  if (me.isConfiguring) {
    me.recalculate();
  }
  range = me.dateInfo.active;
  return new Ext.calendar.date.Range(me.utcToLocal(range.start), me.utcToLocal(range.end));
}, getVisibleRange:function() {
  var D = Ext.Date, range;
  if (this.isConfiguring) {
    this.recalculate();
  }
  range = this.dateInfo.active;
  return new Ext.calendar.date.Range(D.clone(range.start), D.clone(range.end));
}, setTimeRange:function(start, end) {
  var me = this;
  me.isConfiguring = true;
  me.setStartTime(start);
  me.setEndTime(end);
  this.isConfiguring = false;
  me.suspendEventRefresh();
  me.recalculate();
  me.resumeEventRefresh();
  me.refresh();
}, updateAllowSelection:function(allowSelection) {
  var me = this;
  me.allDaySelectionListeners = me.selectionListeners = Ext.destroy(me.selectionListeners, me.allDaySelectionListeners);
  if (allowSelection) {
    me.bodySelectionListeners = me.bodyTable.on({destroyable:true, scope:me, touchstart:'onBodyTouchStart', touchmove:'onBodyTouchMove', touchend:'onBodyTouchEnd'});
    me.allDaySelectionListeners = me.headerWrap.on({destroyable:true, scope:me, touchstart:'onAllDayTouchStart', touchmove:'onAllDayTouchMove', touchend:'onAllDayTouchEnd'});
  }
}, updateDisplayOverlap:function(displayOverlap) {
  if (!this.isConfiguring) {
    this.refreshEvents();
  }
}, applyDraggable:function(draggable) {
  if (draggable) {
    draggable = new Ext.calendar.dd.DaysBodySource;
  }
  return draggable;
}, updateDraggable:function(draggable, oldDraggable) {
  var me = this;
  if (oldDraggable) {
    oldDraggable.destroy();
    me.allDayDrag = Ext.destroy(me.allDayDrag);
  }
  if (draggable) {
    draggable.setView(me);
    me.allDayDrag = new Ext.calendar.dd.DaysAllDaySource;
    me.allDayDrag.setView(me);
  }
}, applyDroppable:function(droppable) {
  if (droppable && !droppable.isInstance) {
    droppable = new Ext.calendar.dd.DaysBodyTarget(droppable);
  }
  return droppable;
}, updateDroppable:function(droppable, oldDroppable) {
  var me = this;
  if (oldDroppable) {
    oldDroppable.destroy();
    me.allDayDrop = Ext.destroy(me.allDayDrop);
  }
  if (droppable) {
    droppable.setView(me);
    me.allDayDrop = new Ext.calendar.dd.DaysAllDayTarget;
    me.allDayDrop.setView(me);
  }
}, updateEndTime:function() {
  this.calculateSlots();
  if (!this.isConfiguring) {
    this.refresh();
  }
}, updateResizeEvents:function(resizeEvents) {
  var me = this;
  me.dragListeners = Ext.destroy(me.dragListeners);
  if (resizeEvents) {
    me.dragListeners = me.bodyTable.on({scope:me, dragstart:'onResizerDragStart', drag:'onResizerDrag', dragend:'onResizerDragEnd', destroyable:true, delegate:'.' + me.$resizerCls, priority:1001});
  }
  if (!(me.isConfiguring || me.destroying)) {
    me.refreshEvents();
  }
}, updateShowNowMarker:function(showNowMarker) {
  var me = this, markerEl = me.markerEl;
  Ext.uninterval(me.showNowInterval);
  me.showNowInterval = null;
  me.markerEl = null;
  if (markerEl) {
    Ext.fly(markerEl).remove();
  }
  if (showNowMarker) {
    if (!me.isConfiguring) {
      me.checkNowMarker();
    }
    me.showNowInterval = Ext.interval(me.checkNowMarker, 300000, me);
  }
}, updateStartTime:function() {
  this.calculateSlots();
  if (!this.isConfiguring) {
    this.refresh();
  }
}, updateTimeFormat:function() {
  if (!this.isConfiguring) {
    this.updateTimeLabels();
  }
}, updateTimeRenderer:function() {
  if (!this.isConfiguring) {
    this.updateTimeLabels();
  }
}, updateTimezoneOffset:function() {
  if (!this.isConfiguring) {
    this.recalculate();
  }
}, updateValue:function(value, oldValue) {
  var me = this;
  if (!me.isConfiguring) {
    me.recalculate();
    me.refreshHeaders();
    me.checkNowMarker();
    me.refreshEvents();
  }
  me.callParent([value, oldValue]);
}, updateVisibleDays:function() {
  var me = this;
  if (!me.isConfiguring) {
    me.suspendEventRefresh();
    me.recalculate();
    me.resumeEventRefresh();
    me.refresh();
  }
}, getElementConfig:function() {
  var me = this, result = me.callParent(), table = [{tag:'table', cls:me.$tableCls + ' ' + me.$bodyTableCls, reference:'bodyTable', children:[{tag:'tbody', children:[{tag:'tr', reference:'timeRow', children:[{tag:'td', reference:'timeContainer', cls:me.$timeContainerCls}]}]}]}];
  result.children = [{cls:Ext.baseCSSPrefix + 'calendar-days-table-wrap', reference:'tableWrap', children:[{cls:Ext.baseCSSPrefix + 'calendar-days-header-wrap', reference:'headerWrap', children:[{cls:Ext.baseCSSPrefix + 'calendar-days-allday-background-wrap', reference:'allDayBackgroundWrap', children:[{tag:'table', cls:me.$tableCls + ' ' + Ext.baseCSSPrefix + 'calendar-days-allday-background-table', children:[{tag:'tbody', children:[{tag:'tr', reference:'allDayBackgroundRow', children:[{tag:'td', 
  cls:me.$headerGutterCls}]}]}]}]}, {tag:'table', cls:me.$tableCls + ' ' + Ext.baseCSSPrefix + 'calendar-days-allday-events', children:[{tag:'tbody', reference:'allDayContent', children:[{tag:'tr', reference:'allDayEmptyRow'}]}]}]}, {cls:Ext.baseCSSPrefix + 'calendar-days-body-row', children:[{cls:Ext.baseCSSPrefix + 'calendar-days-body-cell', reference:me.cellOverflowScrollBug ? null : 'bodyWrap', children:me.cellOverflowScrollBug ? [{cls:Ext.baseCSSPrefix + 'calendar-days-body-wrap', reference:'bodyWrap', 
  children:table}] : table}]}]}];
  return result;
}, doDestroy:function() {
  var me = this;
  me.scrollable = Ext.destroy(me.scrollable);
  me.setAllowSelection(false);
  me.setShowNowMarker(false);
  me.setResizeEvents(false);
  me.callParent();
}, privates:{$allDayBackgroundCls:Ext.baseCSSPrefix + 'calendar-days-allday-background-cell', $allDayEmptyRowCls:Ext.baseCSSPrefix + 'calendar-days-allday-empty-cell', $bodyCls:Ext.baseCSSPrefix + 'calendar-days-body', $bodyTableCls:Ext.baseCSSPrefix + 'calendar-days-body-table', $dayColumnCls:Ext.baseCSSPrefix + 'calendar-days-day-column', $dayEventContainerCls:Ext.baseCSSPrefix + 'calendar-days-day-event-container', $headerGutterCls:Ext.baseCSSPrefix + 'calendar-days-header-gutter', $markerAltCls:Ext.baseCSSPrefix + 
'calendar-days-marker-alt', $markerCls:Ext.baseCSSPrefix + 'calendar-days-marker', $nowMarkerCls:Ext.baseCSSPrefix + 'calendar-days-now-marker', $resizerCls:Ext.baseCSSPrefix + 'calendar-event-resizer', $resizingCls:Ext.baseCSSPrefix + 'calendar-event-resizing', $selectionCls:Ext.baseCSSPrefix + 'calendar-days-selection', $tableCls:Ext.baseCSSPrefix + 'calendar-days-table', $timeCls:Ext.baseCSSPrefix + 'calendar-days-time', $timeContainerCls:Ext.baseCSSPrefix + 'calendar-days-time-ct', baseDate:new Date(2008, 
0, 1), MS_TO_MINUTES:60000, minimumEventMinutes:30, slotTicks:5, slotsPerHour:null, backPosName:'left', forwardPosName:'right', headerScrollOffsetName:'padding-right', calculateSlots:function() {
  this.maxSlots = (this.getEndTime() - this.getStartTime()) * 2;
}, checkNowMarker:function() {
  if (this.getShowNowMarker()) {
    this.doCheckNowMarker();
  }
}, clearAndPopulate:function(row, nodes, clearAll) {
  var children = row.dom.childNodes, len = nodes.length, limit = clearAll ? 0 : 1, i;
  while (children.length > limit) {
    row.removeChild(children[limit]);
  }
  for (i = 0; i < len; ++i) {
    row.appendChild(nodes[i], true);
  }
}, clearEvents:function() {
  this.callParent();
  var body = this.allDayContent.dom, childNodes = body.childNodes;
  while (childNodes.length > 1) {
    body.removeChild(childNodes[0]);
  }
}, clearSelected:function() {
  this.selectRange(-1, -1);
}, constructAllDayEvents:function(events) {
  var me = this, D = Ext.Date, len = events.length, visibleDays = me.getVisibleDays(), before = me.allDayEmptyRow.dom, content = me.allDayContent.dom, week, event, i, rows, row, j, item, widget, rowLen, rowEl, cell;
  week = new Ext.calendar.view.WeeksRenderer({view:me, start:D.clone(this.dateInfo.full.start), days:visibleDays, index:0, maxEvents:null});
  for (i = 0; i < len; ++i) {
    event = events[i];
    if (!me.isEventHidden(event) && event.isSpan()) {
      week.addIf(event);
    }
  }
  if (before.firstChild.className === me.$headerGutterCls) {
    before.removeChild(before.firstChild);
  }
  if (week.hasEvents()) {
    week.calculate();
    rows = week.rows;
    for (i = 0, len = rows.length; i < len; ++i) {
      row = week.compress(i);
      rowEl = document.createElement('tr');
      for (j = 0, rowLen = row.length; j < rowLen; ++j) {
        item = row[j];
        cell = document.createElement('td');
        cell.colSpan = item.len;
        if (!item.isEmpty) {
          widget = me.createEvent(item.event, {}, false);
          widget.addCls(me.$staticEventCls);
          cell.appendChild(widget.element.dom);
        }
        rowEl.appendChild(cell);
      }
      content.insertBefore(rowEl, before);
    }
  }
  Ext.fly(content.firstChild).insertFirst({tag:'td', cls:me.$headerGutterCls, rowSpan:content.childNodes.length});
}, constructEvents:function() {
  var me = this, D = Ext.Date, events = me.getEventSource().getRange(), len = events.length, visibleDays = me.getVisibleDays(), start = D.clone(me.dateInfo.visible.start), end = start, hours = me.getEndTime() - me.getStartTime(), i, j, day, frag, event;
  me.constructAllDayEvents(events);
  for (i = 0; i < visibleDays; ++i) {
    end = D.add(start, D.HOUR, hours, true);
    frag = document.createDocumentFragment();
    day = new Ext.calendar.view.DaysRenderer({view:me, start:start, end:end});
    for (j = 0; j < len; ++j) {
      event = events[j];
      if (!me.isEventHidden(event)) {
        day.addIf(event);
      }
    }
    if (day.hasEvents()) {
      day.calculate();
      me.processDay(day, frag);
    }
    me.getEventColumn(i).appendChild(frag);
    start = D.add(start, D.DAY, 1, true);
  }
}, createEvent:function(event, cfg, dummy) {
  cfg = cfg || {};
  var allDay = event ? event.getAllDay() : false;
  cfg.mode = allDay ? 'weekspan' : 'day';
  if (!allDay) {
    cfg.resize = this.getResizeEvents();
  }
  return this.callParent([event, cfg, dummy]);
}, createScroller:function() {
  return new Ext.scroll.Scroller({element:this.bodyWrap, x:false, y:true});
}, doCheckNowMarker:function() {
  var me = this, D = Ext.Date, markerEl = me.markerEl, now = me.roundDate(Ext.calendar.date.Util.getLocalNow()), active = me.dateInfo.visible, current = me.utcToLocal(active.start), end = me.utcToLocal(active.end), visibleDays = me.getVisibleDays(), y = now.getFullYear(), m = now.getMonth(), d = now.getDate(), h = now.getHours(), min = now.getMinutes(), startTime = me.getStartTime(), endTime = me.getEndTime(), offset, pos, i;
  if (markerEl) {
    Ext.fly(markerEl).remove();
  }
  me.markerEl = null;
  if (!me.element.isVisible(true)) {
    return;
  }
  if (current <= now && now < end) {
    for (i = 0; i < visibleDays; ++i) {
      if (current.getFullYear() === y && current.getMonth() === m && current.getDate() === d) {
        if (startTime <= h && (h < endTime || h === endTime && min === 0)) {
          current.setHours(startTime);
          offset = D.diff(current, now, D.MINUTE);
          pos = offset / me.slotTicks * me.getSlotStyle().minSlotHeight;
        }
        break;
      }
      current = D.add(current, D.DAY, 1, true);
    }
  }
  if (pos !== undefined) {
    me.markerEl = Ext.fly(me.getColumn(i)).createChild({cls:me.$nowMarkerCls, style:{top:pos + 'px'}}, null, true);
  }
}, doRecalculate:function(start) {
  var me = this, D = Ext.Date, R = Ext.calendar.date.Range, end, activeEnd;
  if (!start) {
    start = D.clone(me.getValue());
  }
  start = me.toUtcOffset(D.clearTime(start, true));
  end = D.add(start, D.DAY, me.getVisibleDays(), true);
  activeEnd = D.subtract(end, D.DAY, 1, true);
  return {full:new R(start, end), active:new R(start, activeEnd), visible:new R(D.add(start, D.HOUR, me.getStartTime(), true), D.subtract(end, D.HOUR, 24 - me.getEndTime(), true))};
}, doRefresh:function() {
  var me = this, timeContainer = me.timeContainer, allDayBackgroundRow = me.allDayBackgroundRow, nodes;
  if (!me.dateInfo) {
    me.suspendEventRefresh();
    me.recalculate();
    me.resumeEventRefresh();
  }
  timeContainer.dom.innerHTML = '';
  timeContainer.appendChild(me.generateTimeElements());
  me.clearAndPopulate(me.allDayEmptyRow, me.generateAllDayCells(me.$allDayEmptyRowCls, '\x26#160;'), true);
  me.clearAndPopulate(allDayBackgroundRow, me.generateAllDayCells(me.$allDayBackgroundCls));
  me.clearAndPopulate(me.timeRow, me.generateColumns());
  nodes = Ext.Array.toArray(me.allDayBackgroundRow.dom.childNodes);
  me.backgroundCells = Ext.Array.slice(nodes, 1);
  me.checkNowMarker();
  me.refreshHeaders();
  me.syncHeaderScroll();
  me.refreshEvents();
}, doRefreshEvents:function() {
  var source = this.getEventSource();
  this.clearEvents();
  if (source && source.getCount()) {
    this.constructEvents();
  }
}, generateAllDayCells:function(cls, html) {
  var ret = [], days = this.getVisibleDays(), i;
  for (i = 0; i < days; ++i) {
    ret.push({tag:'td', cls:cls, html:html});
  }
  return ret;
}, generateColumns:function() {
  var me = this, days = me.getVisibleDays(), start = me.getStartTime(), end = me.getEndTime(), ret = [], col, i, j, markers;
  for (i = 0; i < days; ++i) {
    markers = [];
    col = {tag:'td', cls:me.$dayColumnCls, 'data-index':i, children:[{cls:me.$dayEventContainerCls}, {cls:me.$markerContainerCls, children:markers}]};
    for (j = start; j < end; ++j) {
      markers.push({cls:me.$markerCls, children:[{cls:me.$markerAltCls}]});
    }
    ret.push(col);
  }
  return ret;
}, generateTimeElements:function() {
  var times = this.generateTimeLabels(), len = times.length, ret = [], i;
  for (i = 0; i < len; ++i) {
    ret.push({cls:this.$timeCls, html:times[i]});
  }
  return ret;
}, generateTimeLabels:function() {
  var me = this, D = Ext.Date, current = D.clone(me.baseDate), start = me.getStartTime(), end = me.getEndTime(), format = me.getTimeFormat(), ret = [], renderer = me.getTimeRenderer(), seenAM, seenPM, formatted, i, firstInGroup;
  for (i = start; i < end; ++i) {
    current.setHours(i);
    formatted = D.format(current, format);
    if (renderer) {
      firstInGroup = false;
      if (i < 12 && !seenAM) {
        firstInGroup = seenAM = true;
      } else {
        if (i >= 12 && !seenPM) {
          firstInGroup = seenPM = true;
        }
      }
      formatted = renderer.call(this, i, formatted, firstInGroup);
    }
    ret.push(formatted);
  }
  return ret;
}, getBodyElement:function() {
  return this.bodyTable;
}, getColumn:function(index) {
  return this.getColumns()[index];
}, getColumns:function() {
  return this.bodyTable.query('.' + this.$dayColumnCls);
}, getEventColumn:function(index) {
  return Ext.fly(this.getColumn(index)).down('.' + this.$dayEventContainerCls);
}, getEventStyle:function() {
  var me = this, eventStyle = me.eventStyle, fakeEvent, el, margin;
  if (!eventStyle) {
    fakeEvent = me.createEvent(null, {resize:true}, true);
    el = fakeEvent.element;
    el.dom.style.visibility = 'hidden';
    me.getEventColumn(0).appendChild(el.dom);
    margin = el.getMargin();
    margin.height = margin.top + margin.bottom;
    me.eventStyle = eventStyle = {margin:margin, resizerWidth:Ext.fly(el.down('.' + this.$resizerCls, true)).getWidth()};
    fakeEvent.destroy();
  }
  return eventStyle;
}, getEventWidget:function(event) {
  var map = this.eventMap, id = event.id, key, w;
  for (key in map) {
    w = map[key];
    if (w.getModel().id === id) {
      return w;
    }
  }
  return null;
}, getMoveInterval:function() {
  return {unit:Ext.Date.DAY, amount:this.getVisibleDays()};
}, getSlotStyle:function() {
  var me = this, slotStyle = me.slotStyle, h;
  if (!slotStyle) {
    h = Ext.fly(me.bodyTable.down('.' + me.$markerCls, true)).getHeight();
    me.slotStyle = slotStyle = {hourHeight:h, halfHeight:h / 2, minSlotHeight:h / me.slotsPerHour};
  }
  return slotStyle;
}, handleEventTap:function(e) {
  var event = this.getEvent(e);
  if (event) {
    this.onEventTap(event);
  }
}, handleResize:function() {
  var me = this;
  me.slotStyle = null;
  me.callParent();
  me.refreshEvents();
  me.checkNowMarker();
  me.syncHeaderScroll();
}, onAllDayTouchEnd:function(e) {
  var me = this, D = Ext.Date, creating = me.isAllDayCreating, startPos, endPos, start, end, diff, event;
  if (creating) {
    startPos = creating.initialIndex;
    endPos = Ext.calendar.util.Dom.getIndexPosition(creating.positions, e.pageX);
    start = creating.startDate;
    diff = Math.abs(endPos - startPos);
    if (startPos > endPos) {
      end = start;
      start = D.subtract(end, D.DAY, diff, true);
    } else {
      end = D.add(start, D.DAY, diff, true);
    }
    event = me.createModel({startDate:D.localToUtc(start), endDate:D.add(D.localToUtc(end), D.DAY, 1, true), allDay:true});
    me.showAddForm(event, {scope:me, onSave:me.clearSelected, onCancel:me.clearSelected});
    me.isAllDayCreating = null;
  }
}, onAllDayTouchMove:function(e) {
  var me = this, creating = me.isAllDayCreating, startPos, endPos;
  if (!creating) {
    return;
  }
  startPos = creating.initialIndex;
  endPos = Ext.calendar.util.Dom.getIndexPosition(creating.positions, e.pageX);
  me.selectRange(startPos, endPos);
}, onAllDayTouchStart:function(e) {
  var me = this, D = Ext.Date, positions, index, start = this.utcToLocal(me.dateInfo.full.start);
  if (e.pointerType === 'touch' || e.getTarget('.' + me.$eventCls, me.headerWrap)) {
    return;
  }
  positions = Ext.calendar.util.Dom.extractPositions(me.backgroundCells, 'getX');
  index = Ext.calendar.util.Dom.getIndexPosition(positions, e.pageX);
  me.isAllDayCreating = {positions:positions, initialIndex:index, startDate:D.add(start, D.DAY, index, true)};
  me.selectRange(index, index);
}, onBodyTouchEnd:function(e) {
  var me = this, creating = me.isBodyCreating, w, fn, event, start, end;
  if (creating) {
    w = creating.widget;
    if (w) {
      start = w.getStartDate();
      end = w.getEndDate();
      fn = function() {
        w.destroy();
      };
      event = me.createModel({startDate:start, endDate:end});
      me.showAddForm(event, {onSave:fn, onCancel:fn});
    }
    me.isBodyCreating = null;
  }
}, onBodyTouchMove:function(e) {
  var me = this, D = Ext.Date, creating = me.isBodyCreating, resizeMins = me.minimumEventMinutes, margin = me.getEventStyle().margin, el, w, slot, startSlot, topSlot, bottomSlot, start, end;
  if (!creating) {
    return;
  }
  w = creating.widget;
  if (!w) {
    w = me.createEvent(null, {}, true);
    el = w.element;
    w.setPalette(me.getDefaultPalette());
    w.addCls(me.$resizingCls);
    w.setWidth('100%');
    el.setZIndex(999);
    me.getEventColumn(creating.index).appendChild(el);
    creating.widget = w;
  }
  el = w.element;
  slot = me.slotFromPosition(e.getY());
  if (slot < 0 || slot > me.maxSlots) {
    return;
  }
  startSlot = creating.startSlot;
  if (startSlot === slot) {
    slot = startSlot + 1;
  }
  if (startSlot > slot) {
    topSlot = slot;
    bottomSlot = startSlot;
  } else {
    topSlot = startSlot;
    bottomSlot = slot;
  }
  el.setStyle({top:margin.top + me.slotToPosition(topSlot) + 'px', marginTop:0, marginBottom:0});
  w.setHeight((bottomSlot - topSlot) * me.getSlotStyle().halfHeight - margin.bottom);
  start = D.clone(creating.baseDate);
  start = D.add(start, D.MINUTE, topSlot * resizeMins, true);
  end = D.add(start, D.MINUTE, (bottomSlot - topSlot) * resizeMins, true);
  w.setStartDate(start);
  w.setEndDate(end);
}, onBodyTouchStart:function(e) {
  var me = this, D = Ext.Date, col, index, d;
  if (e.pointerType === 'touch' || e.getTarget('.' + me.$eventCls, me.bodyTable)) {
    return;
  }
  col = e.getTarget('.' + me.$dayColumnCls);
  if (col) {
    index = parseInt(col.getAttribute('data-index'), 10);
    d = D.add(me.dateInfo.visible.start, D.DAY, index, true);
    me.isBodyCreating = {col:col, index:index, baseDate:d, startSlot:me.slotFromPosition(e.getY())};
  }
}, onResizerDrag:function(e) {
  if (!this.resizing) {
    return;
  }
  var me = this, D = Ext.Date, resizing = me.resizing, event = resizing.event, w = resizing.widget, halfHeight = me.getSlotStyle().halfHeight, slot = me.slotFromPosition(e.getY()), h = slot * halfHeight - resizing.eventTop, startSlot = resizing.startSlot, start = event.getStartDate(), resizeMins = me.minimumEventMinutes, end;
  e.stopEvent();
  if (slot < 0 || slot > me.maxSlots || slot <= startSlot) {
    return;
  }
  resizing.current = end = D.add(start, D.MINUTE, resizeMins * (slot - startSlot), true);
  w.setHeight(h);
  w.setEndDate(end);
}, onResizerDragEnd:function() {
  if (!this.resizing) {
    return;
  }
  var me = this, R = Ext.calendar.date.Range, resizing = me.resizing, d = resizing.current, w = resizing.widget, originalHeight = resizing.height, event = resizing.event, fn = function(success) {
    if (!w.destroyed) {
      w.element.setZIndex(resizing.oldZIndex);
      w.removeCls(me.$resizingCls);
    }
    if (!success) {
      w.setHeight(originalHeight);
      w.setEndDate(event.getEndDate());
    }
  };
  me.resizing = null;
  if (d) {
    me.handleChange('resize', event, new R(event.getStartDate(), d), fn);
  } else {
    fn();
  }
}, onResizerDragStart:function(e) {
  var me = this, event = me.getEvent(e), w, el, top;
  e.stopEvent();
  if (me.handleChangeStart('resize', event) !== false) {
    w = me.getEventWidget(event);
    el = w.element;
    top = el.getTop(true);
    me.resizing = {height:w.getHeight(), event:event, eventTop:top, startSlot:me.slotFromPosition(top, true), widget:w, oldZIndex:el.getZIndex()};
    w.addCls(me.$resizingCls);
    el.setZIndex(999);
  }
}, onSourceAttach:function() {
  this.recalculate();
}, processDay:function(day, frag) {
  var me = this, events = day.events, len = events.length, slotHeight = me.getSlotStyle().minSlotHeight, eventStyle = me.getEventStyle(), margin = eventStyle.margin, resizerOffset = 0, allowOverlap = me.getDisplayOverlap(), i, item, w, back, fwd, forwardPos, backwardPos, styles;
  if (me.getResizeEvents()) {
    resizerOffset = eventStyle.resizerWidth + 5;
  }
  for (i = 0; i < len; ++i) {
    item = events[i];
    forwardPos = item.forwardPos;
    backwardPos = item.backwardPos;
    if (allowOverlap) {
      forwardPos = Math.min(1, backwardPos + (forwardPos - backwardPos) * 2);
    }
    back = backwardPos;
    fwd = 1 - forwardPos;
    w = me.createEvent(item.event);
    styles = {marginTop:0, marginBottom:0, top:item.start * slotHeight + margin.top + 'px', zIndex:item.colIdx + 1};
    styles[me.backPosName] = back * 100 + '%';
    styles[me.forwardPosName] = fwd * 100 + '%';
    if (allowOverlap && item.edgeWeight > 0) {
      styles.marginRight = resizerOffset + 'px';
    }
    w.setStyle(styles);
    w.setHeight(item.len * slotHeight - margin.bottom);
    frag.appendChild(w.element.dom);
  }
}, recalculate:function() {
  var dateInfo = this.doRecalculate();
  this.dateInfo = dateInfo;
  this.setSourceRange(dateInfo.full);
}, refreshHeaders:function() {
  var me = this, header = me.getHeader(), dateInfo = me.dateInfo;
  if (header) {
    header.setVisibleDays(me.getVisibleDays());
    if (dateInfo) {
      header.setValue(me.utcToLocal(dateInfo.full.start));
    }
  }
}, roundDate:function(d) {
  return new Date(Ext.Number.roundToNearest(d.getTime(), this.slotTicks));
}, selectRange:function(start, end) {
  var cells = this.backgroundCells, len = cells.length, i;
  if (start > end) {
    i = start;
    start = end;
    end = i;
  }
  for (i = 0; i < len; ++i) {
    Ext.fly(cells[i]).toggleCls(this.$selectionCls, i >= start && i <= end);
  }
}, slotFromPosition:function(pageY, local) {
  var y = pageY - (local ? 0 : this.bodyTable.getY());
  return Math.round(y / this.getSlotStyle().halfHeight);
}, slotToPosition:function(slot) {
  return slot * this.getSlotStyle().halfHeight;
}, syncHeaderScroll:function() {
  var me = this, scrollable = me.scrollable, name = me.headerScrollOffsetName, w, len;
  if (scrollable) {
    w = scrollable.getScrollbarSize().width + 'px';
    me.headerWrap.setStyle(name, w);
    me.allDayBackgroundWrap.setStyle(name, w);
  }
}, updateTimeLabels:function() {
  var times = this.generateTimeLabels(), nodes = this.timeContainer.dom.childNodes, i;
  if (times.length !== nodes.length) {
    Ext.raise('Number of generated times did not match');
  }
  for (i = 0, len = times.length; i < len; ++i) {
    nodes[i].innerHTML = times[i];
  }
}}});
Ext.define('Ext.overrides.calendar.view.Days', {override:'Ext.calendar.view.Days', requires:['Ext.calendar.form.Edit', 'Ext.calendar.form.Add'], privates:{doRefresh:function() {
  this.setBodyWrapSize();
  this.callParent();
  this.updateLayout();
}, doRefreshEvents:function() {
  var me = this, bodyWrap = me.bodyWrap;
  me.callParent();
  me.setBodyWrapSize();
  me.syncHeaderScroll();
  me.fireEvent('eventrefresh', me, {});
}, setBodyWrapSize:function() {
  var tableWrap = this.tableWrap, bodyWrap = this.bodyWrap, tableHeight;
  if (Ext.isIE10m) {
    tableHeight = Ext.fly(tableWrap.dom.parentNode).getHeight();
    tableWrap.setHeight(tableHeight);
    bodyWrap.setHeight(tableHeight - this.headerWrap.getHeight());
  }
}}});
Ext.define('Ext.calendar.panel.Days', {extend:'Ext.calendar.panel.Base', xtype:'calendar-days', requires:['Ext.calendar.header.Days', 'Ext.calendar.view.Days', 'Ext.scroll.Scroller'], config:{dayHeader:{xtype:'calendar-daysheader'}, eventRelayers:{view:{beforeeventdragstart:true, validateeventdrop:true, eventdrop:true, beforeeventresizestart:true, validateeventresize:true, eventresize:true}}, view:{xtype:'calendar-daysview'}}, configExtractor:{dayHeader:{dayHeaderFormat:'format'}, view:{allowSelection:true, 
displayOverlap:true, draggable:true, droppable:true, endTime:true, resizeEvents:true, showNowMarker:true, startTime:true, timeFormat:true, visibleDays:true}}, setTimeRange:function(start, end) {
  this.getView().setTimeRange(start, end);
}, privates:{syncHeaderSize:true}});
Ext.define('Ext.overrides.calendar.panel.Days', {override:'Ext.calendar.panel.Days', updateView:function(view, oldView) {
  this.callParent([view, oldView]);
  view.on('eventrefresh', 'onEventRefresh', this);
}, privates:{onEventRefresh:function() {
  this.syncHeaders();
}}});
Ext.define('Ext.calendar.view.Day', {extend:'Ext.calendar.view.Days', xtype:'calendar-dayview', config:{compactOptions:{displayOverlap:true}, visibleDays:1}, privates:{getMoveInterval:function() {
  return {unit:Ext.Date.DAY, amount:1};
}}});
Ext.define('Ext.calendar.panel.Day', {extend:'Ext.calendar.panel.Days', xtype:'calendar-day', requires:['Ext.calendar.view.Day'], config:{view:{xtype:'calendar-dayview'}}});
Ext.define('Ext.calendar.view.WeeksRenderer', {days:null, index:null, maxEvents:null, overflow:true, start:null, view:null, constructor:function(config) {
  var me = this, D = Ext.Date, start, end;
  Ext.apply(me, config);
  start = me.start;
  me.end = end = D.add(start, D.DAY, me.days, true);
  me.utcStart = this.view.utcTimezoneOffset(start);
  me.utcEnd = D.add(me.utcStart, D.DAY, me.days, true);
  me.hasMaxEvents = me.maxEvents !== null;
  me.rows = [];
  me.events = [];
  me.seen = {};
  me.overflows = [];
}, addIf:function(event) {
  var me = this, start, end;
  if (event.getAllDay()) {
    start = me.utcStart;
    end = me.utcEnd;
  } else {
    start = me.start;
    end = me.end;
  }
  if (event.occursInRange(start, end)) {
    me.events.push(event);
  }
}, calculate:function() {
  var me = this, D = Ext.Date, view = me.view, seen = me.seen, events = me.events, len = events.length, days = me.days, rangeEnd = me.end, utcRangeEnd = me.utcEnd, start = D.clone(me.start), utcStart = D.clone(me.utcStart), maxEvents = me.maxEvents, hasMaxEvents = me.hasMaxEvents, overflows = me.overflows, overflowOffset = me.overflow ? 1 : 0, dayEventList = [], i, j, dayEvents, event, eLen, utcEnd, end, id, eventEnd, span, offsetStart, offsetEnd, offsetRangeEnd, allDay, item, offset, isSpan, dayLen, 
  hasAnyOverflows, overflow, map, prev, dayOverflows;
  for (i = 0; i < days; ++i) {
    end = D.add(start, D.DAY, 1, true);
    utcEnd = D.add(utcStart, D.DAY, 1, true);
    dayEvents = [];
    for (j = 0; j < len; ++j) {
      event = events[j];
      id = event.id;
      allDay = event.getAllDay();
      if (allDay) {
        offsetStart = utcStart;
        offsetEnd = utcEnd;
        offsetRangeEnd = utcRangeEnd;
      } else {
        offsetStart = start;
        offsetEnd = end;
        offsetRangeEnd = rangeEnd;
      }
      if (event.occursInRange(offsetStart, offsetEnd)) {
        isSpan = event.isSpan();
        if (!seen[id]) {
          span = 1;
          if (isSpan) {
            eventEnd = event.getEndDate();
            if (eventEnd > offsetRangeEnd) {
              span = days - i;
            } else {
              span = view.getDaysSpanned(offsetStart, eventEnd, allDay);
            }
          }
          seen[id] = span;
          dayEvents.push({event:event, id:id});
        } else {
          if (isSpan) {
            dayEvents.push({isPlaceholder:true, event:event, id:id});
          }
        }
      }
    }
    eLen = dayEvents.length;
    dayEvents.sort(me.sortEvents);
    if (hasMaxEvents) {
      map = {};
      overflows[i] = overflow = [];
      overflow.$map = map;
      if (i > 0) {
        prev = overflows[i - 1].$map;
        for (j = 0; j < eLen; ++j) {
          item = dayEvents[j];
          id = item.id;
          if (prev[id]) {
            overflow.push(item.event);
            map[id] = true;
            dayEvents.splice(j, 1);
            hasAnyOverflows = true;
            --j;
            --eLen;
          }
        }
      }
      if (eLen > 0) {
        if (eLen > maxEvents) {
          offset = Math.max(0, maxEvents - overflowOffset);
          dayOverflows = Ext.Array.splice(dayEvents, offset);
          for (j = 0, dayLen = dayOverflows.length; j < dayLen; ++j) {
            item = dayOverflows[j];
            overflow.push(item.event);
            map[item.id] = true;
          }
          hasAnyOverflows = true;
        } else {
          if (overflowOffset > 0 && overflow.length && eLen === maxEvents) {
            item = dayEvents.pop();
            overflow.push(item.event);
            map[item.id] = true;
          }
        }
      }
    }
    dayEventList.push(dayEvents);
    start = end;
    utcStart = utcEnd;
  }
  if (hasAnyOverflows && maxEvents > 0) {
    me.calculateOverflows(dayEventList, overflows);
  }
  for (i = 0; i < days; ++i) {
    dayEvents = dayEventList[i];
    eLen = dayEvents.length;
    for (j = 0; j < eLen; ++j) {
      item = dayEvents[j];
      if (!item.isPlaceholder) {
        event = item.event;
        me.addToRow(event, i, seen[event.id]);
      }
    }
  }
}, compress:function(rowIdx) {
  var row = this.rows[rowIdx], ret = [], days = this.days, count = 0, i = 0, inc, item;
  while (i < days) {
    inc = 1;
    item = row[i];
    if (item.event) {
      if (count > 0) {
        ret.push({isEmpty:true, len:count});
        count = 0;
      }
      ret.push(item);
      i += item.len;
    } else {
      ++count;
      ++i;
    }
  }
  if (count > 0) {
    ret.push({isEmpty:true, len:count});
  }
  return ret;
}, hasEvents:function() {
  return this.events.length > 0;
}, privates:{addToRow:function(event, dayIdx, days) {
  var me = this, rows = me.rows, len = rows.length, end = days + dayIdx, found, i, j, row, idx;
  for (i = 0; i < len; ++i) {
    row = rows[i];
    for (j = dayIdx; j < end; ++j) {
      if (row[j]) {
        break;
      }
    }
    if (j === end) {
      found = row;
      idx = i;
      break;
    }
  }
  if (!found) {
    found = me.makeRow();
    rows.push(found);
    idx = rows.length - 1;
  }
  me.occupy(event, found, idx, dayIdx, end - 1);
}, calculateOverflows:function(dayEventList, overflows) {
  var days = this.days, maxEvents = this.maxEvents, i, dayEvents, len, item, id;
  for (i = days - 2; i >= 0; --i) {
    dayEvents = dayEventList[i];
    len = dayEvents.length;
    if (len > 0 && overflows[i].length === 0 && len === maxEvents) {
      item = dayEvents[len - 1];
      id = item.id;
      if (overflows[i + 1].$map[id]) {
        overflows[i].unshift(item.event);
        overflows[i].$map[id] = true;
        dayEvents.length = len - 1;
      }
    }
  }
}, makeRow:function() {
  var row = [], days = this.days, i;
  for (i = 0; i < days; ++i) {
    row[i] = 0;
  }
  return row;
}, occupy:function(event, row, rowIdx, fromIdx, toIdx) {
  var len = toIdx - fromIdx + 1, i;
  for (i = fromIdx; i <= toIdx; ++i) {
    row[i] = i === fromIdx ? {event:event, len:len, start:fromIdx, weekIdx:this.index, localIdx:rowIdx} : true;
  }
}, sortEvents:function(event1, event2) {
  event1 = event1.event;
  event2 = event2.event;
  return +event2.isSpan() - +event1.isSpan() || Ext.calendar.model.Event.sort(event1, event2);
}}});
Ext.define('Ext.calendar.view.Weeks', {extend:'Ext.calendar.view.Base', xtype:'calendar-weeksview', requires:['Ext.calendar.view.WeeksRenderer'], uses:['Ext.calendar.dd.WeeksSource', 'Ext.calendar.dd.WeeksTarget'], isWeeksView:true, baseCls:Ext.baseCSSPrefix + 'calendar-weeks', config:{addOnSelect:true, allowSelection:true, compactOptions:{overflowText:'+{0}', showOverflow:'top'}, dayFormat:'j', draggable:true, droppable:true, firstDayOfWeek:undefined, overflowText:'+{0} more', showOverflow:'bottom', 
value:undefined, visibleDays:7, visibleWeeks:2, weekendDays:undefined}, constructor:function(config) {
  var me = this;
  me.callParent([config]);
  me.el.on('tap', 'handleEventTap', me, {delegate:'.' + me.$eventCls});
  me.cellTable.on('click', 'onOverflowClick', me, {delegate:'.' + me.$overflowCls});
  me.recalculate();
  me.refreshHeaders();
}, getDisplayRange:function() {
  var me = this, range;
  if (me.isConfiguring) {
    me.recalculate();
  }
  range = me.dateInfo[me.displayRangeProp];
  return new Ext.calendar.date.Range(me.utcToLocal(range.start), me.utcToLocal(range.end));
}, getVisibleRange:function() {
  var D = Ext.Date, range;
  if (this.isConfiguring) {
    this.recalculate();
  }
  range = this.dateInfo.visible;
  return new Ext.calendar.date.Range(D.clone(range.start), D.clone(range.end));
}, updateAllowSelection:function(allowSelection) {
  var me = this;
  me.selectionListeners = Ext.destroy(me.selectionListeners);
  if (allowSelection) {
    me.el.on({destroyable:true, scope:me, touchstart:'onTouchStart', touchmove:'onTouchMove', touchend:'onTouchEnd'});
  }
}, updateDayFormat:function(dayFormat) {
  if (!this.isConfiguring) {
    this.refresh();
  }
}, updateDaysInWeek:function() {
  this.refresh();
}, applyDraggable:function(draggable) {
  if (draggable) {
    draggable = new Ext.calendar.dd.WeeksSource(draggable);
  }
  return draggable;
}, updateDraggable:function(draggable, oldDraggable) {
  if (oldDraggable) {
    oldDraggable.destroy();
  }
  if (draggable) {
    draggable.setView(this);
  }
}, applyDroppable:function(droppable) {
  if (droppable) {
    droppable = new Ext.calendar.dd.WeeksTarget;
  }
  return droppable;
}, updateDroppable:function(droppable, oldDroppable) {
  if (oldDroppable) {
    oldDroppable.destroy();
  }
  if (droppable) {
    droppable.setView(this);
  }
}, applyFirstDayOfWeek:function(firstDayOfWeek) {
  if (typeof firstDayOfWeek !== 'number') {
    firstDayOfWeek = Ext.Date.firstDayOfWeek;
  }
  return firstDayOfWeek;
}, updateFirstDayOfWeek:function(firstDayOfWeek) {
  var me = this;
  if (!me.isConfiguring) {
    me.recalculate();
    me.refreshHeaders();
    me.refresh();
  }
}, updateShowOverflow:function(showOverflow, oldShowOverflow) {
  var base = Ext.baseCSSPrefix + 'calendar-weeks-with-overflow-', el = this.element;
  if (oldShowOverflow) {
    el.removeCls(base + oldShowOverflow);
  }
  if (showOverflow) {
    el.addCls(base + showOverflow);
  }
  if (!this.isConfiguring) {
    this.refresh();
  }
}, updateTimezoneOffset:function() {
  if (!this.isConfiguring) {
    this.recalculate();
  }
}, updateValue:function(value, oldValue) {
  var me = this;
  if (!me.isConfiguring) {
    me.suspendEventRefresh();
    me.recalculate();
    me.resumeEventRefresh();
    me.refreshHeaders();
    me.refresh();
  }
  me.callParent([value, oldValue]);
}, updateVisibleDays:function() {
  var me = this;
  if (!me.isConfiguring) {
    me.recalculate();
    me.refreshHeaders();
    me.refresh();
  }
}, updateVisibleWeeks:function(visibleWeeks) {
  var me = this, table = me.cellTable;
  me.suspendEventRefresh();
  me.recalculate();
  me.resumeEventRefresh();
  table.removeChild(table.dom.firstChild);
  table.createChild({tag:'tbody', children:me.generateCells(me.dateInfo.requiredWeeks, true)});
  me.cells = me.queryCells();
  if (!me.isConfiguring) {
    me.refresh();
  }
}, applyWeekendDays:function(weekendDays) {
  return weekendDays || Ext.Date.weekendDays;
}, updateWeekendDays:function(weekendDays) {
  this.weekendDayMap = Ext.Array.toMap(weekendDays);
  this.refresh();
}, getElementConfig:function() {
  var me = this, result = me.callParent();
  result.children = [{tag:'table', reference:'cellTable', cls:me.$tableCls + ' ' + Ext.baseCSSPrefix + 'calendar-weeks-week-rows', children:[{tag:'tbody'}]}];
  return result;
}, doDestroy:function() {
  var me = this;
  me.setAllowSelection(false);
  me.setDraggable(null);
  me.setDroppable(null);
  me.callParent();
}, privates:{displayRangeProp:'visible', domFormat:'Y-m-d', eventGutter:5, maxDayMonth:new Date(2000, 0, 1), sundayDay:new Date(2000, 9, 1), startMarginName:'left', trackRanges:false, $rowCls:Ext.baseCSSPrefix + 'calendar-weeks-row', $cellCls:Ext.baseCSSPrefix + 'calendar-weeks-cell', $weekendCls:Ext.baseCSSPrefix + 'calendar-weeks-weekend-cell', $outsideCls:Ext.baseCSSPrefix + 'calendar-weeks-outside-cell', $pastCls:Ext.baseCSSPrefix + 'calendar-weeks-past-cell', $futureCls:Ext.baseCSSPrefix + 'calendar-weeks-future-cell', 
$todayCls:Ext.baseCSSPrefix + 'calendar-weeks-today-cell', $selectionCls:Ext.baseCSSPrefix + 'calendar-weeks-selection', $dayTextCls:Ext.baseCSSPrefix + 'calendar-weeks-day-text', $hiddenCellCls:Ext.baseCSSPrefix + 'calendar-weeks-hidden-cell', $cellInnerCls:Ext.baseCSSPrefix + 'calendar-weeks-cell-inner', $overflowCls:Ext.baseCSSPrefix + 'calendar-weeks-overflow', $cellOverflowCls:Ext.baseCSSPrefix + 'calendar-weeks-overflow-cell', $overflowPopupCls:Ext.baseCSSPrefix + 'calendar-weeks-overflow-popup', 
clearSelected:function() {
  var cells = this.cells, len = cells.length, i;
  for (i = 0; i < len; ++i) {
    Ext.fly(cells[i]).removeCls(this.$selectionCls);
  }
}, constructEvents:function() {
  var me = this, D = Ext.Date, daysInWeek = Ext.Date.DAYS_IN_WEEK, events = me.getEventSource().getRange(), len = events.length, visibleDays = me.getVisibleDays(), visibleWeeks = me.dateInfo.requiredWeeks, current = D.clone(me.dateInfo.visible.start), eventHeight = me.getEventStyle().fullHeight, maxEvents = Math.floor(me.getDaySizes().heightForEvents / eventHeight), overflow = me.getShowOverflow() === 'bottom', weeks = [], i, j, week, frag, event;
  me.weeks = weeks;
  frag = document.createDocumentFragment();
  for (i = 0; i < visibleWeeks; ++i) {
    week = new Ext.calendar.view.WeeksRenderer({view:me, start:current, days:visibleDays, index:i, overflow:overflow, maxEvents:maxEvents});
    for (j = 0; j < len; ++j) {
      event = events[j];
      if (!me.isEventHidden(event)) {
        week.addIf(event);
      }
    }
    if (week.hasEvents()) {
      week.calculate();
    }
    me.processWeek(week, frag);
    weeks.push(week);
    current = D.add(current, D.DAY, daysInWeek, true);
  }
  me.element.appendChild(frag);
}, createEvent:function(event, cfg, dummy) {
  var span = event ? event.isSpan() : true;
  cfg = Ext.apply({mode:span ? 'weekspan' : 'weekinline'}, cfg);
  return this.callParent([event, cfg, dummy]);
}, doRecalculate:function(start) {
  var me = this, D = Ext.Date, daysInWeek = D.DAYS_IN_WEEK, visibleWeeks = me.getVisibleWeeks(), R = Ext.calendar.date.Range, value, startOffset, end;
  start = start || me.getValue();
  start = D.clearTime(start, true);
  startOffset = (start.getDay() + daysInWeek - me.getFirstDayOfWeek()) % daysInWeek;
  value = me.toUtcOffset(start);
  start = D.subtract(value, D.DAY, startOffset, true);
  end = D.add(start, D.DAY, visibleWeeks * daysInWeek - (daysInWeek - me.getVisibleDays()), true);
  return {full:new R(start, end), visible:new R(start, end), active:new R(start, D.subtract(end, D.DAY, 1, true)), requiredWeeks:visibleWeeks};
}, doRefresh:function() {
  var me = this, D = Ext.Date, dateInfo = me.dateInfo, dayFormat = me.getDayFormat(), weekendDayMap = me.weekendDayMap, now = D.clearTime(Ext.calendar.date.Util.getLocalNow()), current = me.utcToLocal(dateInfo.visible.start), classes = [], trackRanges = me.trackRanges, visibleDays = me.getVisibleDays(), daysInWeek = Ext.Date.DAYS_IN_WEEK, y = now.getFullYear(), m = now.getMonth(), d = now.getDate(), cells, len, i, cell, firstDate, lastDate;
  if (trackRanges) {
    firstDate = me.utcToLocal(dateInfo.month.start);
    lastDate = me.utcToLocal(dateInfo.month.end);
  }
  cells = me.cells;
  for (i = 0, len = cells.length; i < len; ++i) {
    cell = cells[i];
    classes.length = 0;
    classes.push(me.$cellCls);
    if (weekendDayMap[current.getDay()]) {
      classes.push(me.$weekendCls);
    }
    if (trackRanges) {
      if (current < firstDate) {
        classes.push(me.$pastCls, me.$outsideCls);
      } else {
        if (current > lastDate) {
          classes.push(me.$futureCls, me.$outsideCls);
        }
      }
    }
    if (current.getFullYear() === y && current.getMonth() === m && current.getDate() === d) {
      classes.push(me.$todayCls);
    }
    if (i % daysInWeek >= visibleDays) {
      classes.push(me.$hiddenCellCls);
    }
    cell.className = classes.join(' ');
    cell.setAttribute('data-date', D.format(current, me.domFormat));
    cell.firstChild.firstChild.innerHTML = D.format(current, dayFormat);
    current = D.add(current, D.DAY, 1, true);
  }
  me.refreshEvents();
}, doRefreshEvents:function() {
  var me = this, source = me.getEventSource();
  me.clearEvents();
  me.hideOverflowPopup();
  if (source && source.getCount()) {
    me.constructEvents();
  }
}, findIndex:function(sizes, offset) {
  var i = 0, len = sizes.length;
  while (i < len) {
    offset -= sizes[i];
    if (offset <= 0) {
      break;
    }
    ++i;
  }
  return i;
}, generateCells:function(numRows, setHeights) {
  var me = this, daysInWeek = Ext.Date.DAYS_IN_WEEK, rows = [], i, j, cells, style;
  if (setHeights) {
    style = {height:100 / numRows + '%'};
  }
  for (i = 0; i < numRows; ++i) {
    cells = [];
    for (j = 0; j < daysInWeek; ++j) {
      cells.push({tag:'td', 'data-index':j, cls:me.$cellCls, children:[{cls:me.$cellInnerCls, children:[{tag:'span', cls:me.$dayTextCls}, {cls:me.$overflowCls}]}]});
    }
    rows.push({tag:'tr', cls:me.$rowCls, 'data-week':i, children:cells, style:style});
  }
  return rows;
}, getCell:function(date) {
  var ret = null, cells = this.cells, len = cells.length, i, cell;
  if (Ext.isDate(date)) {
    date = Ext.Date.format(date, this.domFormat);
  }
  for (i = 0; i < len; ++i) {
    cell = cells[i];
    if (cell.getAttribute('data-date') === date) {
      ret = cell;
      break;
    }
  }
  return ret;
}, getCellByPosition:function(pageX, pageY) {
  var me = this, daySize, containerXY, cellIdx, rowIdx;
  daySize = me.getDaySizes();
  containerXY = me.element.getXY();
  cellIdx = me.findIndex(daySize.widths, pageX - containerXY[0]);
  rowIdx = me.findIndex(daySize.heights, pageY - containerXY[1]);
  return me.cells[rowIdx * Ext.Date.DAYS_IN_WEEK + cellIdx];
}, getCellFromEvent:function(e, inferFromWidget) {
  var ret, xy;
  ret = e.getTarget('.' + this.$cellCls, this.element);
  if (!ret && inferFromWidget) {
    xy = e.getXY();
    ret = this.getCellByPosition(xy[0], xy[1]);
  }
  return ret;
}, getDateFromCell:function(cell) {
  return Ext.Date.parse(cell.getAttribute('data-date'), this.domFormat);
}, getDaySizes:function() {
  var me = this, daySizes = me.daySizes, cells = me.cells, visibleDays = me.getVisibleDays(), smallest = Number.MAX_VALUE, cell, headerHeight, fly, widths, heights, i, h;
  if (!me.daySizes) {
    cell = cells[0];
    fly = Ext.fly(cell.firstChild);
    headerHeight = fly.getPadding('tb') + Ext.fly(cell.firstChild.firstChild).getHeight();
    widths = [];
    heights = [];
    for (i = 0; i < visibleDays; ++i) {
      fly = Ext.fly(cells[i]);
      widths.push(fly.getWidth());
      h = fly.getHeight();
      heights.push(h);
      if (h < smallest) {
        smallest = h;
      }
    }
    me.daySizes = daySizes = {widths:widths, heights:heights, headerHeight:headerHeight, heightForEvents:Math.max(0, smallest - headerHeight - me.eventGutter)};
  }
  return daySizes;
}, getEventStyle:function() {
  var me = this, eventStyle = me.eventStyle, fakeEvent, el, margin, height;
  if (!eventStyle) {
    fakeEvent = me.createEvent(null, null, true);
    el = fakeEvent.element;
    el.dom.style.visibility = 'hidden';
    me.element.appendChild(el);
    height = el.getHeight();
    margin = el.getMargin();
    margin.height = margin.top + margin.bottom;
    margin.width = margin.left + margin.right;
    me.eventStyle = eventStyle = {margin:margin, height:height, fullHeight:height + margin.height};
    fakeEvent.destroy();
  }
  return eventStyle;
}, getEventWidget:function(el) {
  var cls = this.$eventCls, id;
  if (el.isEvent) {
    el = el.target;
  }
  if (!Ext.fly(el).hasCls(cls)) {
    el = Ext.fly(el).up('.' + cls, this.element, true);
  }
  id = el.getAttribute('data-componentid');
  return this.eventMap[id];
}, getMoveBaseValue:function() {
  return this.utcToLocal(this.dateInfo.visible.start);
}, getMoveInterval:function() {
  var D = Ext.Date;
  return {unit:D.DAY, amount:D.DAYS_IN_WEEK * this.getVisibleWeeks()};
}, handleEventTap:function(e) {
  var event = this.getEvent(e);
  if (event) {
    this.hideOverflowPopup();
    this.onEventTap(event);
  }
}, handleResize:function() {
  var me = this;
  me.callParent();
  me.daySizes = null;
  me.hideOverflowPopup();
  me.refreshEvents();
}, hideOverflowPopup:Ext.privateFn, onOverflowClick:function(e) {
  var me = this, cell = me.getCellFromEvent(e), date = me.getDateFromCell(cell), week = parseInt(cell.parentNode.getAttribute('data-week'), 10), index = parseInt(cell.getAttribute('data-index'), 10);
  me.showOverflowPopup(me.weeks[week].overflows[index], date, cell);
}, onSourceAttach:function() {
  this.recalculate();
}, onTouchEnd:function() {
  var me = this, D = Ext.Date, cells = me.cells, start, end, temp, event;
  if (me.isSelecting) {
    start = me.selectedStartIndex;
    end = me.selectedEndIndex;
    if (start === end) {
      start = end = me.getDateFromCell(cells[start]);
      me.fireEvent('select', me, {date:start});
    } else {
      if (start > end) {
        temp = end;
        end = start;
        start = temp;
      }
      start = me.getDateFromCell(cells[start]);
      end = me.getDateFromCell(cells[end]);
      me.fireEvent('selectrange', me, {range:new Ext.calendar.date.Range(start, end)});
    }
    if (me.getAddOnSelect()) {
      if (me.hasEditableCalendars() && me.getAddForm()) {
        event = me.createModel({allDay:true, startDate:D.localToUtc(start), endDate:D.add(D.localToUtc(end), D.DAY, 1, true)});
        me.showAddForm(event, {scope:me, onSave:me.clearSelected, onCancel:me.clearSelected});
      } else {
        me.clearSelected();
      }
    }
    me.isSelecting = false;
  }
}, onTouchMove:function(e) {
  var me = this, start = me.selectedStartIndex, cells = me.cells, len = cells.length, end, current, i, cell, swap;
  if (me.isSelecting) {
    cell = me.getCellFromEvent(e, true);
    current = Ext.Array.indexOf(cells, cell);
    if (current > start) {
      end = current;
    } else {
      if (current < start) {
        end = start;
        start = current;
        swap = true;
      } else {
        end = start;
      }
    }
    me.selectedEndIndex = swap ? start : end;
    for (i = 0; i < len; ++i) {
      Ext.fly(cells[i]).toggleCls(me.$selectionCls, i >= start && i <= end);
    }
  }
}, onTouchStart:function(e, t) {
  var me = this, el = me.element, cell;
  if (e.pointerType === 'touch' || e.getTarget('.' + me.$overflowCls, el) || e.getTarget('.' + me.$overflowPopupCls, el)) {
    return;
  }
  cell = me.getCellFromEvent(e);
  if (cell) {
    me.isSelecting = true;
    me.selectedStartIndex = me.selectedEndIndex = Ext.Array.indexOf(me.cells, cell);
    Ext.fly(cell).addCls(me.$selectionCls);
  }
}, positionEvent:function(el, item) {
  var me = this, daySizes = me.getDaySizes(), eventStyle = me.getEventStyle(), margin = eventStyle.margin, widths = daySizes.widths, start = item.start, idx = item.localIdx, weekIdx = item.weekIdx, headerOffset;
  headerOffset = daySizes.headerHeight + eventStyle.height * idx + (idx + 1) * margin.height;
  el.setTop(me.positionSum(0, weekIdx, daySizes.heights) + headerOffset);
  el.setLeft(me.positionSum(0, start, widths) + margin[me.startMarginName]);
  el.setWidth(me.positionSum(start, item.len, widths) - margin.width);
}, positionSum:function(start, len, sizes) {
  var sum = 0, end = start + len, i;
  for (i = start; i < end; ++i) {
    sum += sizes[i];
  }
  return sum;
}, processWeek:function(week, frag) {
  var me = this, rows = week.rows, days = week.days, overflows = week.overflows, cellOffset = week.index * Ext.Date.DAYS_IN_WEEK, showOverflow = me.getShowOverflow(), cells = me.cells, overflowCls = me.$cellOverflowCls, overflowText = me.getOverflowText(), overflow, row, i, rowLen, j, item, widget, el, cell, len;
  if (rows) {
    for (i = 0, len = rows.length; i < len; ++i) {
      row = week.compress(i);
      for (j = 0, rowLen = row.length; j < rowLen; ++j) {
        item = row[j];
        if (!item.isEmpty) {
          widget = me.createEvent(item.event);
          el = widget.element;
          el.dom.style.margin = '0';
          frag.appendChild(el.dom);
          me.positionEvent(el, item);
        }
      }
    }
  }
  for (i = 0; i < days; ++i) {
    cell = cells[cellOffset + i];
    overflow = overflows && overflows[i];
    if (overflow && overflow.length && showOverflow) {
      Ext.fly(cell).addCls(overflowCls);
      cell.firstChild.lastChild.innerHTML = Ext.String.format(overflowText, overflow.length);
    } else {
      Ext.fly(cell).removeCls(overflowCls);
    }
  }
}, queryCells:function() {
  return this.element.query('.' + this.$cellCls);
}, recalculate:function() {
  var dateInfo = this.doRecalculate();
  this.dateInfo = dateInfo;
  this.setSourceRange(dateInfo.visible);
}, refreshHeaders:function() {
  var me = this, header = me.getHeader(), dateInfo = me.dateInfo;
  if (header) {
    header.setVisibleDays(this.getVisibleDays());
    if (dateInfo) {
      header.setValue(me.utcToLocal(dateInfo.visible.start));
    }
  }
}, selectRange:function(from, to) {
  var me = this, D = Ext.Date, range = me.dateInfo.active, cells = me.cells, len = cells.length, highlight = false, i, cell;
  if (from < range.start) {
    from = range.start;
  }
  if (to > range.end) {
    to = range.end;
  }
  from = me.getCell(D.clearTime(from, true));
  to = me.getCell(D.clearTime(to, true));
  if (from && to) {
    for (i = 0; i < len; ++i) {
      cell = cells[i];
      if (cell === from) {
        highlight = true;
      }
      Ext.fly(cell).toggleCls(me.$selectionCls, highlight);
      if (cell === to) {
        highlight = false;
      }
    }
  }
}, showOverflowPopup:Ext.privateFn}});
Ext.define('Ext.overrides.calendar.view.Weeks', {override:'Ext.calendar.view.Weeks', requires:['Ext.calendar.form.Edit', 'Ext.calendar.form.Add'], doDestroy:function() {
  this.tip = Ext.destroy(this.tip);
  this.callParent();
}, privates:{doRefresh:function() {
  this.callParent();
  this.updateLayout();
}, hideOverflowPopup:function() {
  var tip = this.tip;
  if (tip) {
    tip.hide();
    tip.removeAll();
  }
}, showOverflowPopup:function(events, date, cell) {
  var me = this, tip = me.tip;
  if (!tip) {
    me.tip = tip = new Ext.tip.ToolTip({ui:'calendar-overflow', anchor:true, renderTo:document.body, hidden:true, autoHide:false, cls:me.$overflowPopupCls, minWidth:200, defaultAlign:'tc-bc?'});
    me.tip.el.on('tap', 'handleEventTap', me, {delegate:'.' + me.$eventCls});
  }
  tip.removeAll();
  events = me.createEvents(events, {cls:me.$staticEventCls});
  tip.add(events);
  tip.el.dom.setAttribute('data-date', Ext.Date.format(date, me.domFormat));
  tip.showBy(cell);
}}});
Ext.define('Ext.calendar.panel.Weeks', {extend:'Ext.calendar.panel.Base', xtype:'calendar-weeks', requires:['Ext.calendar.header.Weeks', 'Ext.calendar.view.Weeks'], config:{dayHeader:{xtype:'calendar-weeksheader'}, eventRelayers:{view:{beforeeventdragstart:true, validateeventdrop:true, eventdrop:true}}, view:{xtype:'calendar-weeksview'}}, configExtractor:{dayHeader:{dayHeaderFormat:'format'}, view:{addOnSelect:true, allowSelection:true, dayFormat:true, draggable:true, droppable:true, firstDayOfWeek:true, 
overflowText:true, showOverflow:true, visibleDays:true, visibleWeeks:true, weekendDays:true}}});
Ext.define('Ext.calendar.view.Month', {extend:'Ext.calendar.view.Weeks', xtype:'calendar-monthview', config:{value:undefined, visibleWeeks:6}, nextMonth:function(months) {
  this.navigate(this.getNavigateValue(months), Ext.Date.MONTH);
}, nextYear:function(years) {
  this.navigate(this.getNavigateValue(years), Ext.Date.YEAR);
}, previousMonth:function(months) {
  this.navigate(-this.getNavigateValue(months), Ext.Date.MONTH);
}, previousYear:function(years) {
  this.navigate(-this.getNavigateValue(years), Ext.Date.YEAR);
}, privates:{displayRangeProp:'month', maxWeeks:6, $rowClasses:[Ext.baseCSSPrefix + 'calendar-month-4weeks', Ext.baseCSSPrefix + 'calendar-month-5weeks', Ext.baseCSSPrefix + 'calendar-month-6weeks'], trackRanges:true, doRecalculate:function(start) {
  var me = this, D = Ext.Date, daysInWeek = D.DAYS_IN_WEEK, firstDayOfWeek = me.getFirstDayOfWeek(), requiredWeeks = me.maxWeeks, visibleWeeks = me.getVisibleWeeks(), visibleDays = me.getVisibleDays(), R = Ext.calendar.date.Range, days, end, first, l, last, startOffset;
  start = D.getFirstDateOfMonth(start || me.getValue());
  startOffset = (start.getDay() + daysInWeek - firstDayOfWeek) % daysInWeek;
  first = me.toUtcOffset(start);
  l = D.getLastDateOfMonth(start);
  last = me.toUtcOffset(l);
  if (visibleWeeks === null) {
    if (startOffset >= visibleDays) {
      startOffset = visibleDays - startOffset;
    }
    days = startOffset + D.getDaysInMonth(start);
    requiredWeeks = Math.ceil(days / daysInWeek);
  }
  end = daysInWeek * requiredWeeks - (daysInWeek - visibleDays);
  start = D.subtract(first, D.DAY, startOffset, true);
  end = D.add(start, D.DAY, end, true);
  return {full:new R(start, end), visible:new R(start, end), active:new R(start, D.subtract(end, D.DAY, 1, true)), month:new R(first, last), requiredWeeks:requiredWeeks};
}, doRefresh:function() {
  var me = this, cls = me.$rowClasses, weeks = me.dateInfo.requiredWeeks;
  me.element.replaceCls(cls, cls[weeks - 1 - cls.length]);
  me.callParent();
}, getMoveBaseValue:function() {
  return this.utcToLocal(this.dateInfo.month.start);
}, getMoveInterval:function() {
  return {unit:Ext.Date.MONTH, amount:1};
}, generateCells:function() {
  return this.callParent([this.maxWeeks, false]);
}, getNavigateValue:function(n) {
  return n || n === 0 ? n : 1;
}}});
Ext.define('Ext.calendar.panel.Month', {extend:'Ext.calendar.panel.Weeks', xtype:'calendar-month', requires:['Ext.calendar.view.Month'], config:{view:{xtype:'calendar-monthview'}}, autoSize:false, nextMonth:function(months) {
  this.getView().nextMonth(months);
}, nextYear:function(years) {
  this.getView().nextYear(yers);
}, previousMonth:function(months) {
  this.getView().previousMonth(months);
}, previousYear:function(years) {
  this.getView().previousYears(years);
}});
Ext.define('Ext.calendar.panel.AbstractPanel', {extend:'Ext.panel.Panel', requires:['Ext.layout.container.Border', 'Ext.button.Segmented', 'Ext.toolbar.Toolbar'], layout:'border', config:{createButton:{ui:'default-small'}, sideBar:{region:'west', collapsible:true}}, items:[{xtype:'panel', reference:'mainContainer', region:'center', layout:'fit'}], initComponent:function() {
  var me = this, ct;
  me.callParent();
  ct = me.lookup('mainContainer');
  me.addSideBar({collapsed:me.getCompact()});
  me.addTitleBar();
  ct.add(me.createView());
  me.refreshCalTitle();
}, onRender:function(parentNode, containerIdx) {
  this.callParent([parentNode, containerIdx]);
  this.body.unselectable();
}, updateCompact:function(compact) {
  if (!this.isConfiguring) {
    this.reconfigureItems();
  }
}, updateCreateButtonPosition:function() {
  var me = this, sheet = me.sheet, vis;
  if (!me.isConfiguring) {
    vis = sheet && sheet.isVisible();
    me.reconfigureItems();
    if (vis) {
      me.showSheet();
    }
  }
}, updateSwitcherPosition:function() {
  var me = this, sheet = me.sheet, vis;
  if (!me.isConfiguring) {
    vis = sheet && sheet.isVisible();
    me.reconfigureItems();
    if (vis) {
      me.showSheet();
    }
  }
}, privates:{addSideBar:function() {
  var cfg = this.createSideBar();
  if (cfg) {
    this.add(cfg);
  }
}, addTitleBar:function() {
  var cfg = this.createTitleBar();
  if (cfg) {
    this.lookup('mainContainer').addDocked(cfg);
  }
}, createSideBar:function(cfg) {
  var me = this, items = [];
  if (me.getCreateButtonPosition() === 'sideBar') {
    items.push({xtype:'container', margin:'0 0 10 0', layout:{type:'hbox', pack:'center'}, items:me.createCreateButton()});
  }
  items.push(me.createCalendarList());
  if (me.getSwitcherPosition() === 'sideBar') {
    items.push(me.createSwitcher({vertical:true}));
  }
  cfg = Ext.merge({reference:'sideBar', layout:{type:'vbox', align:'stretch'}}, cfg);
  return this.createContainerWithChildren(cfg, this.getSideBar(), items);
}, createTitleBar:function() {
  var me = this, items = [];
  if (me.getCreateButtonPosition() === 'titleBar') {
    items.push(me.createCreateButton({margin:'0 10 0 0'}));
  }
  items.push(me.createTodayButton(), {xtype:'segmentedbutton', allowToggle:false, items:[me.createPreviousButton(), me.createNextButton()]}, me.createDateTitle());
  if (me.getSwitcherPosition() === 'titleBar') {
    items.push({xtype:'component', flex:1}, me.createSwitcher());
  }
  return this.createContainerWithChildren({reference:'titleBar'}, this.getTitleBar(), items);
}, onSwitcherChange:function(btn, value) {
  this.doSetView(value, true);
}, reconfigureItems:function() {
  var me = this;
  Ext.suspendLayouts();
  Ext.destroy(me.lookup('titleBar'), me.lookup('sideBar'));
  me.addTitleBar();
  me.addSideBar({collapsed:me.getCompact()});
  me.refreshCalTitle();
  Ext.resumeLayouts(true);
}, setSwitcherValue:function(value) {
  var switcher = this.lookup('switcher');
  if (switcher) {
    switcher.setValue(value);
  } else {
    this.setView(value, true);
  }
}}});
Ext.define('Ext.calendar.view.Week', {extend:'Ext.calendar.view.Days', xtype:'calendar-weekview', config:{firstDayOfWeek:undefined, visibleDays:7}, applyFirstDayOfWeek:function(firstDayOfWeek) {
  if (typeof firstDayOfWeek !== 'number') {
    firstDayOfWeek = Ext.Date.firstDayOfWeek;
  }
  return firstDayOfWeek;
}, updateFirstDayOfWeek:function() {
  var me = this;
  if (!me.isConfiguring) {
    me.recalculate();
    me.refreshHeaders();
    me.checkNowMarker();
  }
}, privates:{doRecalculate:function(start) {
  var me = this, D = Ext.Date, R = Ext.calendar.date.Range, daysInWeek = D.DAYS_IN_WEEK, startOffset, activeEnd, end;
  start = start || me.getValue();
  start = D.clearTime(start, true);
  startOffset = (start.getDay() + daysInWeek - me.getFirstDayOfWeek()) % daysInWeek;
  start = me.toUtcOffset(start);
  start = D.subtract(start, D.DAY, startOffset, true);
  end = D.add(start, D.DAY, me.getVisibleDays(), true);
  activeEnd = D.subtract(end, D.DAY, 1, true);
  return {full:new R(start, end), active:new R(start, activeEnd), visible:new R(D.add(start, D.HOUR, me.getStartTime(), true), D.subtract(end, D.HOUR, 24 - me.getEndTime(), true))};
}, getMoveBaseValue:function() {
  return this.utcToLocal(this.dateInfo.full.start);
}, getMoveInterval:function() {
  var D = Ext.Date;
  return {unit:D.DAY, amount:D.DAYS_IN_WEEK};
}}});
Ext.define('Ext.calendar.panel.Week', {extend:'Ext.calendar.panel.Days', xtype:'calendar-week', requires:['Ext.calendar.view.Week'], config:{view:{xtype:'calendar-weekview'}}, configExtractor:{view:{firstDayOfWeek:true}}});
Ext.define('Ext.calendar.view.Multi', {extend:'Ext.container.Container', xtype:'calendar-multiview', requires:['Ext.calendar.date.Util'], layout:'fit', platformConfig:{'!desktop':{compact:true}}, config:{compact:false, compactOptions:null, store:null, timezoneOffset:undefined, value:undefined, views:null}, defaultView:null, constructor:function(config) {
  this.callParent([config]);
  var view = this.defaultView;
  if (view) {
    this.setView(view);
  }
}, moveNext:function() {
  this.setValue(this.activeView.calculateMoveNext());
}, movePrevious:function() {
  this.setValue(this.activeView.calculateMovePrevious());
}, navigate:function(amount, interval) {
  var D = Ext.Date;
  if (amount !== 0) {
    this.setValue(D.add(this.getValue(), interval || D.DAY, amount, true));
  }
}, setView:function(view) {
  var me = this, active = me.activeView, cfg;
  if (active && active.$key === view) {
    return;
  }
  Ext.suspendLayouts();
  if (active) {
    me.remove(active);
  }
  cfg = me.getViews()[view];
  if (!cfg) {
    Ext.raise('Invalid view specified: "' + view + '".');
  }
  me.activeView = me.add(me.createView(cfg, view));
  me.activeView.on('valuechange', 'onValueChange', me);
  me.recalculate(me.getValue());
  Ext.resumeLayouts(true);
}, updateCompact:function(compact) {
  this.setViewCfg('setCompact', compact);
}, applyStore:function(store) {
  if (store) {
    store = Ext.StoreManager.lookup(store, 'calendar-calendars');
  }
  return store;
}, updateStore:function(store) {
  var me = this;
  me.setViewCfg('setStore', store);
  if (!me.isConfiguring) {
    me.recalculate(me.getValue());
  }
}, applyTimezoneOffset:function(timezoneOffset) {
  this.autoOffset = false;
  if (timezoneOffset === undefined) {
    timezoneOffset = Ext.calendar.date.Util.getDefaultTimezoneOffset();
    this.autoOffset = true;
  }
  return timezoneOffset;
}, updateTimezoneOffset:function(timezoneOffset) {
  this.setViewCfg('setTimezoneOffset', timezoneOffset);
}, applyValue:function(value, oldValue) {
  value = Ext.Date.clearTime(value || Ext.calendar.date.Util.getLocalNow(), true);
  if (oldValue && oldValue.getTime() === value.getTime()) {
    value = undefined;
  }
  return value;
}, updateValue:function(value) {
  if (!this.isConfiguring) {
    this.recalculate(value);
  }
}, showAddForm:function(data, options) {
  return this.activeView.showAddForm(data, options);
}, showEditForm:function(event, options) {
  return this.activeView.showEditForm(event, options);
}, privates:{createView:function(cfg, key) {
  var me = this;
  return Ext.apply({$key:key, controlStoreRange:false, compact:me.getCompact(), store:me.getStore(), timezoneOffset:me.autoOffset ? undefined : me.getTimezoneOffset(), value:me.getValue()}, cfg);
}, getActiveKey:function() {
  var active = this.activeView;
  return active ? active.$key : '';
}, onValueChange:function(view, context) {
  this.setValue(context.value);
  this.fireEvent('valuechange', this, context);
}, recalculate:function(value) {
  var view = this.activeView, store = this.getStore(), range, eventSource;
  if (view && store) {
    eventSource = store.getEventSource();
    range = Ext.calendar.date.Util.expandRange(view.getView().doRecalculate(value).full);
    eventSource.setRange(range);
    view.setValue(value);
  }
}, setViewCfg:function(setterName, value) {
  if (!this.isConfiguring) {
    var view = this.activeView;
    if (view) {
      view[setterName](value);
    }
  }
}}});
Ext.define('Ext.calendar.panel.Panel', {extend:'Ext.calendar.panel.AbstractPanel', xtype:'calendar', mixins:['Ext.mixin.ConfigState'], alternateStateConfig:'compactOptions', requires:['Ext.calendar.panel.Day', 'Ext.calendar.panel.Week', 'Ext.calendar.panel.Month', 'Ext.calendar.List', 'Ext.calendar.view.Multi', 'Ext.calendar.date.Util'], referenceHolder:true, platformConfig:{'!desktop':{compact:true}}, config:{calendarList:{xtype:'calendar-list', reference:'list', flex:1}, compact:false, compactOptions:{}, 
createButton:{xtype:'button', cls:Ext.baseCSSPrefix + 'calendar-panel-create-button', text:'Create'}, createButtonPosition:'sideBar', dateTitle:{xtype:'component', reference:'calTitle', cls:Ext.baseCSSPrefix + 'calendar-panel-title', margin:'0 0 0 10'}, nextButton:{xtype:'button', text:'\x3e'}, previousButton:{xtype:'button', text:'\x3c'}, sideBar:{xtype:'panel', cls:Ext.baseCSSPrefix + 'calendar-sidebar'}, store:null, switcher:{xtype:'segmentedbutton', reference:'switcher', cls:Ext.baseCSSPrefix + 
'calendar-panel-switcher', allowMultiple:false}, switcherPosition:'titleBar', timezoneOffset:undefined, titleBar:{xtype:'toolbar'}, todayButton:{xtype:'button', text:'Today', margin:'0 10 0 0'}, value:undefined, views:{day:{xtype:'calendar-day', titleTpl:'{start:date("l F d, Y")}', controlStoreRange:false, label:'Day', weight:10, dayHeader:null}, week:{xtype:'calendar-week', dayHeaderFormat:'D d', controlStoreRange:false, titleTpl:'{start:date("j M")} - {end:date("j M Y")}', label:'Week', weight:20}, 
month:{xtype:'calendar-month', titleTpl:'{start:date("F Y")}', label:'Month', weight:30}}}, defaultView:'month', cls:Ext.baseCSSPrefix + 'calendar-panel', moveNext:function() {
  this.getView().moveNext();
}, movePrevious:function() {
  this.getView().movePrevious();
}, navigate:function(amount, interval) {
  this.getView().navigate(amount, interval);
}, setView:function(view) {
  this.doSetView(view);
}, updateCompact:function(compact, oldCompact) {
  var me = this;
  me.toggleCls(Ext.baseCSSPrefix + 'compact', compact);
  me.toggleConfigState(compact);
  me.callParent([compact, oldCompact]);
  me.setViewCfg('setCompact', compact);
}, updateCompactOptions:function() {
  if (!this.isConfiguring && this.getCompact()) {
    this.toggleConfigState(true);
  }
}, applyStore:function(store) {
  if (store) {
    store = Ext.StoreManager.lookup(store, 'calendar-calendars');
  }
  return store;
}, updateStore:function(store) {
  var list = this.lookup('list');
  this.setViewCfg('setStore', store);
  if (list) {
    list.setStore(store);
  }
}, applyTimezoneOffset:function(timezoneOffset) {
  this.autoOffset = false;
  if (timezoneOffset === undefined) {
    timezoneOffset = Ext.calendar.date.Util.getDefaultTimezoneOffset();
    this.autoOffset = true;
  }
  return timezoneOffset;
}, updateTimezoneOffset:function(timezoneOffset) {
  this.setViewCfg('setTimezoneOffset', timezoneOffset);
}, applyValue:function(value, oldValue) {
  value = Ext.Date.clearTime(value || Ext.calendar.date.Util.getLocalNow(), true);
  if (oldValue && oldValue.getTime() === value.getTime()) {
    value = undefined;
  }
  return value;
}, updateValue:function(value) {
  this.setViewCfg('setValue', value);
  this.refreshCalTitle();
}, getValue:function() {
  var view = this.getView();
  return view ? view.getValue() : this.callParent();
}, getView:function() {
  return this.lookup('view');
}, privates:{weightStart:0, weightIncrement:10, createCalendarList:function(cfg) {
  return Ext.apply({store:this.getStore()}, this.getCalendarList());
}, createCreateButton:function(cfg) {
  cfg = cfg || {};
  cfg = Ext.apply(cfg, this.getCreateButton());
  return Ext.apply({handler:'onCreateTap', scope:this}, cfg);
}, createContainerWithChildren:function(defaults, cfg, items) {
  cfg = Ext.apply({}, cfg);
  var me = this, cfgItems = cfg.items, weight = me.weightStart, incr = me.weightIncrement, len, i, item;
  if (cfgItems) {
    if (!Ext.isArray(cfgItems)) {
      cfgItems = [cfgItems];
    }
    items = Ext.Array.clone(items);
    for (i = 0, len = items.length; i < len; ++i) {
      item = items[i];
      if (item.weight == null) {
        items[i] = Ext.apply({weight:weight}, item);
      }
      weight += incr;
    }
    items = items.concat(cfgItems);
    Ext.Array.sort(items, me.weightSorter);
    delete cfg.items;
  }
  cfg.items = items;
  return Ext.apply(cfg, defaults);
}, createDateTitle:function(cfg) {
  cfg = cfg || {};
  return Ext.apply(cfg, this.getDateTitle());
}, createNextButton:function() {
  return Ext.apply({handler:'onNextTap', scope:this}, this.getNextButton());
}, createPreviousButton:function() {
  return Ext.apply({handler:'onPrevTap', scope:this}, this.getPreviousButton());
}, createSwitcher:function(cfg) {
  var me = this, view = me.getView();
  cfg = Ext.apply({value:view && view.getActiveKey() || me.defaultView, listeners:{scope:me, change:'onSwitcherChange'}, items:me.getSwitcherItems()}, cfg);
  return Ext.apply(cfg, me.getSwitcher());
}, createTodayButton:function() {
  return Ext.apply({handler:'onTodayTap', scope:this}, this.getTodayButton());
}, createView:function() {
  var me = this;
  return {xtype:'calendar-multiview', reference:'view', compact:me.getCompact(), defaultView:me.defaultView, store:me.getStore(), timezoneOffset:me.autoOffset ? undefined : me.getTimezoneOffset(), value:me.getValue(), views:me.getViews(), listeners:{scope:me, valuechange:'onValueChange'}};
}, doSetView:function(view, fromSwitcher) {
  if (!fromSwitcher) {
    this.setSwitcherValue(view);
    return;
  }
  this.getView().setView(view);
  this.refreshCalTitle();
}, getSwitcherItems:function() {
  var views = this.getViews(), items = [], key, o;
  for (key in views) {
    o = views[key];
    if (o) {
      items.push({text:o.label, value:key, weight:o.weight});
    }
  }
  items.sort(this.weightSorter);
  return items;
}, onCreateTap:function() {
  this.getView().showAddForm();
}, onNextTap:function() {
  this.moveNext();
}, onPrevTap:function() {
  this.movePrevious();
}, onValueChange:function(view, context) {
  this.setValue(context.value);
}, onTodayTap:function() {
  this.setValue(new Date);
}, refreshCalTitle:function() {
  var me = this, view = me.getView(), calTitle = me.lookup('calTitle'), tpl;
  if (view && calTitle) {
    view = view.activeView;
    tpl = view.lookupTpl('titleTpl');
    if (tpl) {
      calTitle.setHtml(tpl.apply(view.getDisplayRange()));
    }
  }
}, setViewCfg:function(setterName, value) {
  if (!this.isConfiguring) {
    var view = this.getView();
    if (view) {
      view[setterName](value);
    }
  }
}, weightSorter:function(a, b) {
  return a.weight - b.weight;
}}});
Ext.define('Ext.calendar.theme.Palette', {primary:null, secondary:null, border:null, constructor:function(config) {
  Ext.apply(this, config);
}});
