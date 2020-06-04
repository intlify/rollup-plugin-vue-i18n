'use strict'

// Make a map and return a function for checking if a key
// is in that map.
//
// IMPORTANT: all calls of this function must be prefixed with /*#__PURE__*/
// So that rollup can tree-shake them if necessary.
function makeMap(str, expectsLowerCase) {
  const map = Object.create(null)
  const list = str.split(',')
  for (let i = 0; i < list.length; i++) {
    map[list[i]] = true
  }
  return expectsLowerCase ? val => !!map[val.toLowerCase()] : val => !!map[val]
}

const GLOBALS_WHITE_LISTED =
  'Infinity,undefined,NaN,isFinite,isNaN,parseFloat,parseInt,decodeURI,' +
  'decodeURIComponent,encodeURI,encodeURIComponent,Math,Number,Date,Array,' +
  'Object,Boolean,String,RegExp,Map,Set,JSON,Intl'
const isGloballyWhitelisted = /*#__PURE__*/ makeMap(GLOBALS_WHITE_LISTED)

/**
 * On the client we only need to offer special cases for boolean attributes that
 * have different names from their corresponding dom properties:
 * - itemscope -> N/A
 * - allowfullscreen -> allowFullscreen
 * - formnovalidate -> formNoValidate
 * - ismap -> isMap
 * - nomodule -> noModule
 * - novalidate -> noValidate
 * - readonly -> readOnly
 */
const specialBooleanAttrs = `itemscope,allowfullscreen,formnovalidate,ismap,nomodule,novalidate,readonly`
const isSpecialBooleanAttr = /*#__PURE__*/ makeMap(specialBooleanAttrs)

function normalizeStyle(value) {
  if (isArray(value)) {
    const res = {}
    for (let i = 0; i < value.length; i++) {
      const item = value[i]
      const normalized = normalizeStyle(
        isString(item) ? parseStringStyle(item) : item
      )
      if (normalized) {
        for (const key in normalized) {
          res[key] = normalized[key]
        }
      }
    }
    return res
  } else if (isObject(value)) {
    return value
  }
}
const listDelimiterRE = /;(?![^(]*\))/g
const propertyDelimiterRE = /:(.+)/
function parseStringStyle(cssText) {
  const ret = {}
  cssText.split(listDelimiterRE).forEach(item => {
    if (item) {
      const tmp = item.split(propertyDelimiterRE)
      tmp.length > 1 && (ret[tmp[0].trim()] = tmp[1].trim())
    }
  })
  return ret
}
function normalizeClass(value) {
  let res = ''
  if (isString(value)) {
    res = value
  } else if (isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      res += normalizeClass(value[i]) + ' '
    }
  } else if (isObject(value)) {
    for (const name in value) {
      if (value[name]) {
        res += name + ' '
      }
    }
  }
  return res.trim()
}

function looseEqual(a, b) {
  if (a === b) return true
  const isObjectA = isObject(a)
  const isObjectB = isObject(b)
  if (isObjectA && isObjectB) {
    try {
      const isArrayA = isArray(a)
      const isArrayB = isArray(b)
      if (isArrayA && isArrayB) {
        return a.length === b.length && a.every((e, i) => looseEqual(e, b[i]))
      } else if (a instanceof Date && b instanceof Date) {
        return a.getTime() === b.getTime()
      } else if (!isArrayA && !isArrayB) {
        const keysA = Object.keys(a)
        const keysB = Object.keys(b)
        return (
          keysA.length === keysB.length &&
          keysA.every(key => looseEqual(a[key], b[key]))
        )
      } else {
        /* istanbul ignore next */
        return false
      }
    } catch (e) {
      /* istanbul ignore next */
      return false
    }
  } else if (!isObjectA && !isObjectB) {
    return String(a) === String(b)
  } else {
    return false
  }
}
function looseIndexOf(arr, val) {
  return arr.findIndex(item => looseEqual(item, val))
}

// For converting {{ interpolation }} values to displayed strings.
const toDisplayString = val => {
  return val == null
    ? ''
    : isObject(val)
    ? JSON.stringify(val, replacer, 2)
    : String(val)
}
const replacer = (_key, val) => {
  if (val instanceof Map) {
    return {
      [`Map(${val.size})`]: [...val.entries()].reduce((entries, [key, val]) => {
        entries[`${key} =>`] = val
        return entries
      }, {})
    }
  } else if (val instanceof Set) {
    return {
      [`Set(${val.size})`]: [...val.values()]
    }
  } else if (isObject(val) && !isArray(val) && !isPlainObject(val)) {
    return String(val)
  }
  return val
}

const EMPTY_OBJ = {}
const EMPTY_ARR = []
const NOOP = () => {}
/**
 * Always return false.
 */
const NO = () => false
const onRE = /^on[^a-z]/
const isOn = key => onRE.test(key)
const extend = (a, b) => {
  for (const key in b) {
    a[key] = b[key]
  }
  return a
}
const remove = (arr, el) => {
  const i = arr.indexOf(el)
  if (i > -1) {
    arr.splice(i, 1)
  }
}
const hasOwnProperty = Object.prototype.hasOwnProperty
const hasOwn = (val, key) => hasOwnProperty.call(val, key)
const isArray = Array.isArray
const isFunction = val => typeof val === 'function'
const isString = val => typeof val === 'string'
const isSymbol = val => typeof val === 'symbol'
const isObject = val => val !== null && typeof val === 'object'
const isPromise = val => {
  return isObject(val) && isFunction(val.then) && isFunction(val.catch)
}
const objectToString = Object.prototype.toString
const toTypeString = value => objectToString.call(value)
const toRawType = value => {
  return toTypeString(value).slice(8, -1)
}
const isPlainObject = val => toTypeString(val) === '[object Object]'
const isReservedProp = /*#__PURE__*/ makeMap(
  'key,ref,' +
    'onVnodeBeforeMount,onVnodeMounted,' +
    'onVnodeBeforeUpdate,onVnodeUpdated,' +
    'onVnodeBeforeUnmount,onVnodeUnmounted'
)
const cacheStringFunction = fn => {
  const cache = Object.create(null)
  return str => {
    const hit = cache[str]
    return hit || (cache[str] = fn(str))
  }
}
const camelizeRE = /-(\w)/g
const camelize = cacheStringFunction(str => {
  return str.replace(camelizeRE, (_, c) => (c ? c.toUpperCase() : ''))
})
const hyphenateRE = /\B([A-Z])/g
const hyphenate = cacheStringFunction(str => {
  return str.replace(hyphenateRE, '-$1').toLowerCase()
})
const capitalize = cacheStringFunction(str => {
  return str.charAt(0).toUpperCase() + str.slice(1)
})
// compare whether a value has changed, accounting for NaN.
const hasChanged = (value, oldValue) =>
  value !== oldValue && (value === value || oldValue === oldValue)
const invokeArrayFns = (fns, arg) => {
  for (let i = 0; i < fns.length; i++) {
    fns[i](arg)
  }
}
const def = (obj, key, value) => {
  Object.defineProperty(obj, key, {
    configurable: true,
    value
  })
}

const targetMap = new WeakMap()
const effectStack = []
let activeEffect
const ITERATE_KEY = Symbol('')
const MAP_KEY_ITERATE_KEY = Symbol('')
function isEffect(fn) {
  return fn && fn._isEffect === true
}
function effect(fn, options = EMPTY_OBJ) {
  if (isEffect(fn)) {
    fn = fn.raw
  }
  const effect = createReactiveEffect(fn, options)
  if (!options.lazy) {
    effect()
  }
  return effect
}
function stop(effect) {
  if (effect.active) {
    cleanup(effect)
    if (effect.options.onStop) {
      effect.options.onStop()
    }
    effect.active = false
  }
}
let uid = 0
function createReactiveEffect(fn, options) {
  const effect = function reactiveEffect(...args) {
    if (!effect.active) {
      return options.scheduler ? undefined : fn(...args)
    }
    if (!effectStack.includes(effect)) {
      cleanup(effect)
      try {
        enableTracking()
        effectStack.push(effect)
        activeEffect = effect
        return fn(...args)
      } finally {
        effectStack.pop()
        resetTracking()
        activeEffect = effectStack[effectStack.length - 1]
      }
    }
  }
  effect.id = uid++
  effect._isEffect = true
  effect.active = true
  effect.raw = fn
  effect.deps = []
  effect.options = options
  return effect
}
function cleanup(effect) {
  const { deps } = effect
  if (deps.length) {
    for (let i = 0; i < deps.length; i++) {
      deps[i].delete(effect)
    }
    deps.length = 0
  }
}
let shouldTrack = true
const trackStack = []
function pauseTracking() {
  trackStack.push(shouldTrack)
  shouldTrack = false
}
function enableTracking() {
  trackStack.push(shouldTrack)
  shouldTrack = true
}
function resetTracking() {
  const last = trackStack.pop()
  shouldTrack = last === undefined ? true : last
}
function track(target, type, key) {
  if (!shouldTrack || activeEffect === undefined) {
    return
  }
  let depsMap = targetMap.get(target)
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()))
  }
  let dep = depsMap.get(key)
  if (!dep) {
    depsMap.set(key, (dep = new Set()))
  }
  if (!dep.has(activeEffect)) {
    dep.add(activeEffect)
    activeEffect.deps.push(dep)
  }
}
function trigger(target, type, key, newValue, oldValue, oldTarget) {
  const depsMap = targetMap.get(target)
  if (!depsMap) {
    // never been tracked
    return
  }
  const effects = new Set()
  const computedRunners = new Set()
  const add = effectsToAdd => {
    if (effectsToAdd) {
      effectsToAdd.forEach(effect => {
        if (effect !== activeEffect || !shouldTrack) {
          if (effect.options.computed) {
            computedRunners.add(effect)
          } else {
            effects.add(effect)
          }
        }
      })
    }
  }
  if (type === 'clear' /* CLEAR */) {
    // collection being cleared
    // trigger all effects for target
    depsMap.forEach(add)
  } else if (key === 'length' && isArray(target)) {
    depsMap.forEach((dep, key) => {
      if (key === 'length' || key >= newValue) {
        add(dep)
      }
    })
  } else {
    // schedule runs for SET | ADD | DELETE
    if (key !== void 0) {
      add(depsMap.get(key))
    }
    // also run for iteration key on ADD | DELETE | Map.SET
    const isAddOrDelete =
      type === 'add' /* ADD */ ||
      (type === 'delete' /* DELETE */ && !isArray(target))
    if (isAddOrDelete || (type === 'set' /* SET */ && target instanceof Map)) {
      add(depsMap.get(isArray(target) ? 'length' : ITERATE_KEY))
    }
    if (isAddOrDelete && target instanceof Map) {
      add(depsMap.get(MAP_KEY_ITERATE_KEY))
    }
  }
  const run = effect => {
    if (effect.options.scheduler) {
      effect.options.scheduler(effect)
    } else {
      effect()
    }
  }
  // Important: computed effects must be run first so that computed getters
  // can be invalidated before any normal effects that depend on them are run.
  computedRunners.forEach(run)
  effects.forEach(run)
}

const builtInSymbols = new Set(
  Object.getOwnPropertyNames(Symbol)
    .map(key => Symbol[key])
    .filter(isSymbol)
)
const get = /*#__PURE__*/ createGetter()
const shallowGet = /*#__PURE__*/ createGetter(false, true)
const readonlyGet = /*#__PURE__*/ createGetter(true)
const arrayInstrumentations = {}
;['includes', 'indexOf', 'lastIndexOf'].forEach(key => {
  arrayInstrumentations[key] = function (...args) {
    const arr = toRaw(this)
    for (let i = 0, l = this.length; i < l; i++) {
      track(arr, 'get' /* GET */, i + '')
    }
    // we run the method using the original args first (which may be reactive)
    const res = arr[key](...args)
    if (res === -1 || res === false) {
      // if that didn't work, run it again using raw values.
      return arr[key](...args.map(toRaw))
    } else {
      return res
    }
  }
})
function createGetter(isReadonly = false, shallow = false) {
  return function get(target, key, receiver) {
    if (key === '__v_isReactive' /* isReactive */) {
      return !isReadonly
    } else if (key === '__v_isReadonly' /* isReadonly */) {
      return isReadonly
    } else if (key === '__v_raw' /* raw */) {
      return target
    }
    const targetIsArray = isArray(target)
    if (targetIsArray && hasOwn(arrayInstrumentations, key)) {
      return Reflect.get(arrayInstrumentations, key, receiver)
    }
    const res = Reflect.get(target, key, receiver)
    if ((isSymbol(key) && builtInSymbols.has(key)) || key === '__proto__') {
      return res
    }
    if (shallow) {
      !isReadonly && track(target, 'get' /* GET */, key)
      return res
    }
    if (isRef(res)) {
      if (targetIsArray) {
        !isReadonly && track(target, 'get' /* GET */, key)
        return res
      } else {
        // ref unwrapping, only for Objects, not for Arrays.
        return res.value
      }
    }
    !isReadonly && track(target, 'get' /* GET */, key)
    return isObject(res)
      ? isReadonly
        ? // need to lazy access readonly and reactive here to avoid
          // circular dependency
          readonly(res)
        : reactive(res)
      : res
  }
}
const set = /*#__PURE__*/ createSetter()
const shallowSet = /*#__PURE__*/ createSetter(true)
function createSetter(shallow = false) {
  return function set(target, key, value, receiver) {
    const oldValue = target[key]
    if (!shallow) {
      value = toRaw(value)
      if (!isArray(target) && isRef(oldValue) && !isRef(value)) {
        oldValue.value = value
        return true
      }
    }
    const hadKey = hasOwn(target, key)
    const result = Reflect.set(target, key, value, receiver)
    // don't trigger if target is something up in the prototype chain of original
    if (target === toRaw(receiver)) {
      if (!hadKey) {
        trigger(target, 'add' /* ADD */, key, value)
      } else if (hasChanged(value, oldValue)) {
        trigger(target, 'set' /* SET */, key, value)
      }
    }
    return result
  }
}
function deleteProperty(target, key) {
  const hadKey = hasOwn(target, key)
  const oldValue = target[key]
  const result = Reflect.deleteProperty(target, key)
  if (result && hadKey) {
    trigger(target, 'delete' /* DELETE */, key, undefined)
  }
  return result
}
function has(target, key) {
  const result = Reflect.has(target, key)
  track(target, 'has' /* HAS */, key)
  return result
}
function ownKeys(target) {
  track(target, 'iterate' /* ITERATE */, ITERATE_KEY)
  return Reflect.ownKeys(target)
}
const mutableHandlers = {
  get,
  set,
  deleteProperty,
  has,
  ownKeys
}
const readonlyHandlers = {
  get: readonlyGet,
  has,
  ownKeys,
  set(target, key) {
    return true
  },
  deleteProperty(target, key) {
    return true
  }
}
const shallowReactiveHandlers = {
  ...mutableHandlers,
  get: shallowGet,
  set: shallowSet
}

const toReactive = value => (isObject(value) ? reactive(value) : value)
const toReadonly = value => (isObject(value) ? readonly(value) : value)
const toShallow = value => value
const getProto = v => Reflect.getPrototypeOf(v)
function get$1(target, key, wrap) {
  target = toRaw(target)
  const rawKey = toRaw(key)
  if (key !== rawKey) {
    track(target, 'get' /* GET */, key)
  }
  track(target, 'get' /* GET */, rawKey)
  const { has, get } = getProto(target)
  if (has.call(target, key)) {
    return wrap(get.call(target, key))
  } else if (has.call(target, rawKey)) {
    return wrap(get.call(target, rawKey))
  }
}
function has$1(key) {
  const target = toRaw(this)
  const rawKey = toRaw(key)
  if (key !== rawKey) {
    track(target, 'has' /* HAS */, key)
  }
  track(target, 'has' /* HAS */, rawKey)
  const has = getProto(target).has
  return has.call(target, key) || has.call(target, rawKey)
}
function size(target) {
  target = toRaw(target)
  track(target, 'iterate' /* ITERATE */, ITERATE_KEY)
  return Reflect.get(getProto(target), 'size', target)
}
function add(value) {
  value = toRaw(value)
  const target = toRaw(this)
  const proto = getProto(target)
  const hadKey = proto.has.call(target, value)
  const result = proto.add.call(target, value)
  if (!hadKey) {
    trigger(target, 'add' /* ADD */, value, value)
  }
  return result
}
function set$1(key, value) {
  value = toRaw(value)
  const target = toRaw(this)
  const { has, get, set } = getProto(target)
  let hadKey = has.call(target, key)
  if (!hadKey) {
    key = toRaw(key)
    hadKey = has.call(target, key)
  }
  const oldValue = get.call(target, key)
  const result = set.call(target, key, value)
  if (!hadKey) {
    trigger(target, 'add' /* ADD */, key, value)
  } else if (hasChanged(value, oldValue)) {
    trigger(target, 'set' /* SET */, key, value)
  }
  return result
}
function deleteEntry(key) {
  const target = toRaw(this)
  const { has, get, delete: del } = getProto(target)
  let hadKey = has.call(target, key)
  if (!hadKey) {
    key = toRaw(key)
    hadKey = has.call(target, key)
  }
  const oldValue = get ? get.call(target, key) : undefined
  // forward the operation before queueing reactions
  const result = del.call(target, key)
  if (hadKey) {
    trigger(target, 'delete' /* DELETE */, key, undefined)
  }
  return result
}
function clear() {
  const target = toRaw(this)
  const hadItems = target.size !== 0
  // forward the operation before queueing reactions
  const result = getProto(target).clear.call(target)
  if (hadItems) {
    trigger(target, 'clear' /* CLEAR */, undefined, undefined)
  }
  return result
}
function createForEach(isReadonly, shallow) {
  return function forEach(callback, thisArg) {
    const observed = this
    const target = toRaw(observed)
    const wrap = isReadonly ? toReadonly : shallow ? toShallow : toReactive
    !isReadonly && track(target, 'iterate' /* ITERATE */, ITERATE_KEY)
    // important: create sure the callback is
    // 1. invoked with the reactive map as `this` and 3rd arg
    // 2. the value received should be a corresponding reactive/readonly.
    function wrappedCallback(value, key) {
      return callback.call(thisArg, wrap(value), wrap(key), observed)
    }
    return getProto(target).forEach.call(target, wrappedCallback)
  }
}
function createIterableMethod(method, isReadonly, shallow) {
  return function (...args) {
    const target = toRaw(this)
    const isMap = target instanceof Map
    const isPair = method === 'entries' || (method === Symbol.iterator && isMap)
    const isKeyOnly = method === 'keys' && isMap
    const innerIterator = getProto(target)[method].apply(target, args)
    const wrap = isReadonly ? toReadonly : shallow ? toShallow : toReactive
    !isReadonly &&
      track(
        target,
        'iterate' /* ITERATE */,
        isKeyOnly ? MAP_KEY_ITERATE_KEY : ITERATE_KEY
      )
    // return a wrapped iterator which returns observed versions of the
    // values emitted from the real iterator
    return {
      // iterator protocol
      next() {
        const { value, done } = innerIterator.next()
        return done
          ? { value, done }
          : {
              value: isPair ? [wrap(value[0]), wrap(value[1])] : wrap(value),
              done
            }
      },
      // iterable protocol
      [Symbol.iterator]() {
        return this
      }
    }
  }
}
function createReadonlyMethod(type) {
  return function (...args) {
    return type === 'delete' /* DELETE */ ? false : this
  }
}
const mutableInstrumentations = {
  get(key) {
    return get$1(this, key, toReactive)
  },
  get size() {
    return size(this)
  },
  has: has$1,
  add,
  set: set$1,
  delete: deleteEntry,
  clear,
  forEach: createForEach(false, false)
}
const shallowInstrumentations = {
  get(key) {
    return get$1(this, key, toShallow)
  },
  get size() {
    return size(this)
  },
  has: has$1,
  add,
  set: set$1,
  delete: deleteEntry,
  clear,
  forEach: createForEach(false, true)
}
const readonlyInstrumentations = {
  get(key) {
    return get$1(this, key, toReadonly)
  },
  get size() {
    return size(this)
  },
  has: has$1,
  add: createReadonlyMethod('add' /* ADD */),
  set: createReadonlyMethod('set' /* SET */),
  delete: createReadonlyMethod('delete' /* DELETE */),
  clear: createReadonlyMethod('clear' /* CLEAR */),
  forEach: createForEach(true, false)
}
const iteratorMethods = ['keys', 'values', 'entries', Symbol.iterator]
iteratorMethods.forEach(method => {
  mutableInstrumentations[method] = createIterableMethod(method, false, false)
  readonlyInstrumentations[method] = createIterableMethod(method, true, false)
  shallowInstrumentations[method] = createIterableMethod(method, true, true)
})
function createInstrumentationGetter(isReadonly, shallow) {
  const instrumentations = shallow
    ? shallowInstrumentations
    : isReadonly
    ? readonlyInstrumentations
    : mutableInstrumentations
  return (target, key, receiver) => {
    if (key === '__v_isReactive' /* isReactive */) {
      return !isReadonly
    } else if (key === '__v_isReadonly' /* isReadonly */) {
      return isReadonly
    } else if (key === '__v_raw' /* raw */) {
      return target
    }
    return Reflect.get(
      hasOwn(instrumentations, key) && key in target
        ? instrumentations
        : target,
      key,
      receiver
    )
  }
}
const mutableCollectionHandlers = {
  get: createInstrumentationGetter(false, false)
}
const shallowCollectionHandlers = {
  get: createInstrumentationGetter(false, true)
}
const readonlyCollectionHandlers = {
  get: createInstrumentationGetter(true, false)
}

const collectionTypes = new Set([Set, Map, WeakMap, WeakSet])
const isObservableType = /*#__PURE__*/ makeMap(
  'Object,Array,Map,Set,WeakMap,WeakSet'
)
const canObserve = value => {
  return (
    !value.__v_skip &&
    isObservableType(toRawType(value)) &&
    !Object.isFrozen(value)
  )
}
function reactive(target) {
  // if trying to observe a readonly proxy, return the readonly version.
  if (target && target.__v_isReadonly) {
    return target
  }
  return createReactiveObject(
    target,
    false,
    mutableHandlers,
    mutableCollectionHandlers
  )
}
// Return a reactive-copy of the original object, where only the root level
// properties are reactive, and does NOT unwrap refs nor recursively convert
// returned properties.
function shallowReactive(target) {
  return createReactiveObject(
    target,
    false,
    shallowReactiveHandlers,
    shallowCollectionHandlers
  )
}
function readonly(target) {
  return createReactiveObject(
    target,
    true,
    readonlyHandlers,
    readonlyCollectionHandlers
  )
}
function createReactiveObject(
  target,
  isReadonly,
  baseHandlers,
  collectionHandlers
) {
  if (!isObject(target)) {
    return target
  }
  // target is already a Proxy, return it.
  // exception: calling readonly() on a reactive object
  if (target.__v_raw && !(isReadonly && target.__v_isReactive)) {
    return target
  }
  // target already has corresponding Proxy
  if (
    hasOwn(
      target,
      isReadonly ? '__v_readonly' /* readonly */ : '__v_reactive' /* reactive */
    )
  ) {
    return isReadonly ? target.__v_readonly : target.__v_reactive
  }
  // only a whitelist of value types can be observed.
  if (!canObserve(target)) {
    return target
  }
  const observed = new Proxy(
    target,
    collectionTypes.has(target.constructor) ? collectionHandlers : baseHandlers
  )
  def(
    target,
    isReadonly ? '__v_readonly' /* readonly */ : '__v_reactive' /* reactive */,
    observed
  )
  return observed
}
function isReactive(value) {
  if (isReadonly(value)) {
    return isReactive(value.__v_raw)
  }
  return !!(value && value.__v_isReactive)
}
function isReadonly(value) {
  return !!(value && value.__v_isReadonly)
}
function isProxy(value) {
  return isReactive(value) || isReadonly(value)
}
function toRaw(observed) {
  return (observed && toRaw(observed.__v_raw)) || observed
}

const convert = val => (isObject(val) ? reactive(val) : val)
function isRef(r) {
  return r ? r.__v_isRef === true : false
}
function ref(value) {
  return createRef(value)
}
function createRef(rawValue, shallow = false) {
  if (isRef(rawValue)) {
    return rawValue
  }
  let value = shallow ? rawValue : convert(rawValue)
  const r = {
    __v_isRef: true,
    get value() {
      track(r, 'get' /* GET */, 'value')
      return value
    },
    set value(newVal) {
      if (hasChanged(toRaw(newVal), rawValue)) {
        rawValue = newVal
        value = shallow ? newVal : convert(newVal)
        trigger(r, 'set' /* SET */, 'value', void 0)
      }
    }
  }
  return r
}

function computed(getterOrOptions) {
  let getter
  let setter
  if (isFunction(getterOrOptions)) {
    getter = getterOrOptions
    setter = NOOP
  } else {
    getter = getterOrOptions.get
    setter = getterOrOptions.set
  }
  let dirty = true
  let value
  let computed
  const runner = effect(getter, {
    lazy: true,
    // mark effect as computed so that it gets priority during trigger
    computed: true,
    scheduler: () => {
      if (!dirty) {
        dirty = true
        trigger(computed, 'set' /* SET */, 'value')
      }
    }
  })
  computed = {
    __v_isRef: true,
    // expose effect so computed can be stopped
    effect: runner,
    get value() {
      if (dirty) {
        value = runner()
        dirty = false
      }
      track(computed, 'get' /* GET */, 'value')
      return value
    },
    set value(newValue) {
      setter(newValue)
    }
  }
  return computed
}

const stack = []
function warn(msg, ...args) {
  // avoid props formatting or warn handler tracking deps that might be mutated
  // during patch, leading to infinite recursion.
  pauseTracking()
  const instance = stack.length ? stack[stack.length - 1].component : null
  const appWarnHandler = instance && instance.appContext.config.warnHandler
  const trace = getComponentTrace()
  if (appWarnHandler) {
    callWithErrorHandling(appWarnHandler, instance, 11 /* APP_WARN_HANDLER */, [
      msg + args.join(''),
      instance && instance.proxy,
      trace
        .map(({ vnode }) => `at <${formatComponentName(vnode.type)}>`)
        .join('\n'),
      trace
    ])
  } else {
    const warnArgs = [`[Vue warn]: ${msg}`, ...args]
    if (
      trace.length &&
      // avoid spamming console during tests
      !false
    ) {
      warnArgs.push(`\n`, ...formatTrace(trace))
    }
    console.warn(...warnArgs)
  }
  resetTracking()
}
function getComponentTrace() {
  let currentVNode = stack[stack.length - 1]
  if (!currentVNode) {
    return []
  }
  // we can't just use the stack because it will be incomplete during updates
  // that did not start from the root. Re-construct the parent chain using
  // instance parent pointers.
  const normalizedStack = []
  while (currentVNode) {
    const last = normalizedStack[0]
    if (last && last.vnode === currentVNode) {
      last.recurseCount++
    } else {
      normalizedStack.push({
        vnode: currentVNode,
        recurseCount: 0
      })
    }
    const parentInstance =
      currentVNode.component && currentVNode.component.parent
    currentVNode = parentInstance && parentInstance.vnode
  }
  return normalizedStack
}
function formatTrace(trace) {
  const logs = []
  trace.forEach((entry, i) => {
    logs.push(...(i === 0 ? [] : [`\n`]), ...formatTraceEntry(entry))
  })
  return logs
}
function formatTraceEntry({ vnode, recurseCount }) {
  const postfix =
    recurseCount > 0 ? `... (${recurseCount} recursive calls)` : ``
  const isRoot = vnode.component ? vnode.component.parent == null : false
  const open = ` at <${formatComponentName(vnode.type, isRoot)}`
  const close = `>` + postfix
  return vnode.props
    ? [open, ...formatProps(vnode.props), close]
    : [open + close]
}
function formatProps(props) {
  const res = []
  const keys = Object.keys(props)
  keys.slice(0, 3).forEach(key => {
    res.push(...formatProp(key, props[key]))
  })
  if (keys.length > 3) {
    res.push(` ...`)
  }
  return res
}
function formatProp(key, value, raw) {
  if (isString(value)) {
    value = JSON.stringify(value)
    return raw ? value : [`${key}=${value}`]
  } else if (
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    value == null
  ) {
    return raw ? value : [`${key}=${value}`]
  } else if (isRef(value)) {
    value = formatProp(key, toRaw(value.value), true)
    return raw ? value : [`${key}=Ref<`, value, `>`]
  } else if (isFunction(value)) {
    return [`${key}=fn${value.name ? `<${value.name}>` : ``}`]
  } else {
    value = toRaw(value)
    return raw ? value : [`${key}=`, value]
  }
}
function callWithErrorHandling(fn, instance, type, args) {
  let res
  try {
    res = args ? fn(...args) : fn()
  } catch (err) {
    handleError(err, instance, type)
  }
  return res
}
function callWithAsyncErrorHandling(fn, instance, type, args) {
  if (isFunction(fn)) {
    const res = callWithErrorHandling(fn, instance, type, args)
    if (res && isPromise(res)) {
      res.catch(err => {
        handleError(err, instance, type)
      })
    }
    return res
  }
  const values = []
  for (let i = 0; i < fn.length; i++) {
    values.push(callWithAsyncErrorHandling(fn[i], instance, type, args))
  }
  return values
}
function handleError(err, instance, type) {
  const contextVNode = instance ? instance.vnode : null
  if (instance) {
    let cur = instance.parent
    // the exposed instance is the render proxy to keep it consistent with 2.x
    const exposedInstance = instance.proxy
    // in production the hook receives only the error code
    const errorInfo = type
    while (cur) {
      const errorCapturedHooks = cur.ec
      if (errorCapturedHooks) {
        for (let i = 0; i < errorCapturedHooks.length; i++) {
          if (errorCapturedHooks[i](err, exposedInstance, errorInfo)) {
            return
          }
        }
      }
      cur = cur.parent
    }
    // app-level handling
    const appErrorHandler = instance.appContext.config.errorHandler
    if (appErrorHandler) {
      callWithErrorHandling(appErrorHandler, null, 10 /* APP_ERROR_HANDLER */, [
        err,
        exposedInstance,
        errorInfo
      ])
      return
    }
  }
  logError(err)
}
function logError(err, type, contextVNode) {
  // default behavior is crash in prod & test, recover in dev.
  {
    throw err
  }
}

const queue = []
const postFlushCbs = []
const p = Promise.resolve()
let isFlushing = false
let isFlushPending = false
function nextTick(fn) {
  return fn ? p.then(fn) : p
}
function queueJob(job) {
  if (!queue.includes(job)) {
    queue.push(job)
    queueFlush()
  }
}
function invalidateJob(job) {
  const i = queue.indexOf(job)
  if (i > -1) {
    queue[i] = null
  }
}
function queuePostFlushCb(cb) {
  if (!isArray(cb)) {
    postFlushCbs.push(cb)
  } else {
    postFlushCbs.push(...cb)
  }
  queueFlush()
}
function queueFlush() {
  if (!isFlushing && !isFlushPending) {
    isFlushPending = true
    nextTick(flushJobs)
  }
}
function flushPostFlushCbs(seen) {
  if (postFlushCbs.length) {
    const cbs = [...new Set(postFlushCbs)]
    postFlushCbs.length = 0
    for (let i = 0; i < cbs.length; i++) {
      cbs[i]()
    }
  }
}
const getId = job => (job.id == null ? Infinity : job.id)
function flushJobs(seen) {
  isFlushPending = false
  isFlushing = true
  let job
  // Sort queue before flush.
  // This ensures that:
  // 1. Components are updated from parent to child. (because parent is always
  //    created before the child so its render effect will have smaller
  //    priority number)
  // 2. If a component is unmounted during a parent component's update,
  //    its update can be skipped.
  // Jobs can never be null before flush starts, since they are only invalidated
  // during execution of another flushed job.
  queue.sort((a, b) => getId(a) - getId(b))
  while ((job = queue.shift()) !== undefined) {
    if (job === null) {
      continue
    }
    callWithErrorHandling(job, null, 14 /* SCHEDULER */)
  }
  flushPostFlushCbs()
  isFlushing = false
  // some postFlushCb queued jobs!
  // keep flushing until it drains.
  if (queue.length || postFlushCbs.length) {
    flushJobs()
  }
}

// mark the current rendering instance for asset resolution (e.g.
// resolveComponent, resolveDirective) during render
let currentRenderingInstance = null
function setCurrentRenderingInstance(instance) {
  currentRenderingInstance = instance
}
// dev only flag to track whether $attrs was used during render.
// If $attrs was used during render then the warning for failed attrs
// fallthrough can be suppressed.
let accessedAttrs = false
function markAttrsAccessed() {
  accessedAttrs = true
}
function renderComponentRoot(instance) {
  const {
    type: Component,
    parent,
    vnode,
    proxy,
    withProxy,
    props,
    slots,
    attrs,
    emit,
    renderCache
  } = instance
  let result
  currentRenderingInstance = instance
  try {
    let fallthroughAttrs
    if (vnode.shapeFlag & 4 /* STATEFUL_COMPONENT */) {
      // withProxy is a proxy with a different `has` trap only for
      // runtime-compiled render functions using `with` block.
      const proxyToUse = withProxy || proxy
      result = normalizeVNode(
        instance.render.call(proxyToUse, proxyToUse, renderCache)
      )
      fallthroughAttrs = attrs
    } else {
      // functional
      const render = Component
      // in dev, mark attrs accessed if optional props (attrs === props)
      if ('production' !== 'production' && attrs === props) {
        markAttrsAccessed()
      }
      result = normalizeVNode(
        render.length > 1
          ? render(
              props,
              'production' !== 'production'
                ? {
                    get attrs() {
                      markAttrsAccessed()
                      return attrs
                    },
                    slots,
                    emit
                  }
                : { attrs, slots, emit }
            )
          : render(props, null /* we know it doesn't need it */)
      )
      fallthroughAttrs = Component.props ? attrs : getFallthroughAttrs(attrs)
    }
    // attr merging
    // in dev mode, comments are preserved, and it's possible for a template
    // to have comments along side the root element which makes it a fragment
    let root = result
    let setRoot = undefined
    if ('production' !== 'production') {
      ;[root, setRoot] = getChildRoot(result)
    }
    if (
      Component.inheritAttrs !== false &&
      fallthroughAttrs &&
      Object.keys(fallthroughAttrs).length
    ) {
      if (
        root.shapeFlag & 1 /* ELEMENT */ ||
        root.shapeFlag & 6 /* COMPONENT */
      ) {
        root = cloneVNode(root, fallthroughAttrs)
      } else if (
        'production' !== 'production' &&
        !accessedAttrs &&
        root.type !== Comment
      ) {
        const allAttrs = Object.keys(attrs)
        const eventAttrs = []
        const extraAttrs = []
        for (let i = 0, l = allAttrs.length; i < l; i++) {
          const key = allAttrs[i]
          if (isOn(key)) {
            // remove `on`, lowercase first letter to reflect event casing accurately
            eventAttrs.push(key[2].toLowerCase() + key.slice(3))
          } else {
            extraAttrs.push(key)
          }
        }
        if (extraAttrs.length) {
          warn(
            `Extraneous non-props attributes (` +
              `${extraAttrs.join(', ')}) ` +
              `were passed to component but could not be automatically inherited ` +
              `because component renders fragment or text root nodes.`
          )
        }
        if (eventAttrs.length) {
          warn(
            `Extraneous non-emits event listeners (` +
              `${eventAttrs.join(', ')}) ` +
              `were passed to component but could not be automatically inherited ` +
              `because component renders fragment or text root nodes. ` +
              `If the listener is intended to be a component custom event listener only, ` +
              `declare it using the "emits" option.`
          )
        }
      }
    }
    // inherit scopeId
    const parentScopeId = parent && parent.type.__scopeId
    if (parentScopeId) {
      root = cloneVNode(root, { [parentScopeId]: '' })
    }
    // inherit directives
    if (vnode.dirs) {
      if ('production' !== 'production' && !isElementRoot(root)) {
        warn(
          `Runtime directive used on component with non-element root node. ` +
            `The directives will not function as intended.`
        )
      }
      root.dirs = vnode.dirs
    }
    // inherit transition data
    if (vnode.transition) {
      if ('production' !== 'production' && !isElementRoot(root)) {
        warn(
          `Component inside <Transition> renders non-element root node ` +
            `that cannot be animated.`
        )
      }
      root.transition = vnode.transition
    }
    if ('production' !== 'production' && setRoot) {
      setRoot(root)
    } else {
      result = root
    }
  } catch (err) {
    handleError(err, instance, 1 /* RENDER_FUNCTION */)
    result = createVNode(Comment)
  }
  currentRenderingInstance = null
  return result
}
const getChildRoot = vnode => {
  if (vnode.type !== Fragment) {
    return [vnode, undefined]
  }
  const rawChildren = vnode.children
  const dynamicChildren = vnode.dynamicChildren
  const children = rawChildren.filter(child => {
    return !(isVNode(child) && child.type === Comment)
  })
  if (children.length !== 1) {
    return [vnode, undefined]
  }
  const childRoot = children[0]
  const index = rawChildren.indexOf(childRoot)
  const dynamicIndex = dynamicChildren
    ? dynamicChildren.indexOf(childRoot)
    : null
  const setRoot = updatedRoot => {
    rawChildren[index] = updatedRoot
    if (dynamicIndex !== null) dynamicChildren[dynamicIndex] = updatedRoot
  }
  return [normalizeVNode(childRoot), setRoot]
}
const getFallthroughAttrs = attrs => {
  let res
  for (const key in attrs) {
    if (key === 'class' || key === 'style' || isOn(key)) {
      ;(res || (res = {}))[key] = attrs[key]
    }
  }
  return res
}
const isElementRoot = vnode => {
  return (
    vnode.shapeFlag & 6 /* COMPONENT */ ||
    vnode.shapeFlag & 1 /* ELEMENT */ ||
    vnode.type === Comment // potential v-if branch switch
  )
}
function shouldUpdateComponent(
  prevVNode,
  nextVNode,
  parentComponent,
  optimized
) {
  const { props: prevProps, children: prevChildren } = prevVNode
  const { props: nextProps, children: nextChildren, patchFlag } = nextVNode
  // force child update for runtime directive or transition on component vnode.
  if (nextVNode.dirs || nextVNode.transition) {
    return true
  }
  if (patchFlag > 0) {
    if (patchFlag & 1024 /* DYNAMIC_SLOTS */) {
      // slot content that references values that might have changed,
      // e.g. in a v-for
      return true
    }
    if (patchFlag & 16 /* FULL_PROPS */) {
      // presence of this flag indicates props are always non-null
      return hasPropsChanged(prevProps, nextProps)
    } else if (patchFlag & 8 /* PROPS */) {
      const dynamicProps = nextVNode.dynamicProps
      for (let i = 0; i < dynamicProps.length; i++) {
        const key = dynamicProps[i]
        if (nextProps[key] !== prevProps[key]) {
          return true
        }
      }
    }
  } else if (!optimized) {
    // this path is only taken by manually written render functions
    // so presence of any children leads to a forced update
    if (prevChildren || nextChildren) {
      if (!nextChildren || !nextChildren.$stable) {
        return true
      }
    }
    if (prevProps === nextProps) {
      return false
    }
    if (!prevProps) {
      return !!nextProps
    }
    if (!nextProps) {
      return true
    }
    return hasPropsChanged(prevProps, nextProps)
  }
  return false
}
function hasPropsChanged(prevProps, nextProps) {
  const nextKeys = Object.keys(nextProps)
  if (nextKeys.length !== Object.keys(prevProps).length) {
    return true
  }
  for (let i = 0; i < nextKeys.length; i++) {
    const key = nextKeys[i]
    if (nextProps[key] !== prevProps[key]) {
      return true
    }
  }
  return false
}
function updateHOCHostEl(
  { vnode, parent },
  el // HostNode
) {
  while (parent && parent.subTree === vnode) {
    ;(vnode = parent.vnode).el = el
    parent = parent.parent
  }
}

const isSuspense = type => type.__isSuspense
function queueEffectWithSuspense(fn, suspense) {
  if (suspense && !suspense.isResolved) {
    if (isArray(fn)) {
      suspense.effects.push(...fn)
    } else {
      suspense.effects.push(fn)
    }
  } else {
    queuePostFlushCb(fn)
  }
}

/**
 * Wrap a slot function to memoize current rendering instance
 * @internal
 */
function withCtx(fn, ctx = currentRenderingInstance) {
  if (!ctx) return fn
  return function renderFnWithContext() {
    const owner = currentRenderingInstance
    setCurrentRenderingInstance(ctx)
    const res = fn.apply(null, arguments)
    setCurrentRenderingInstance(owner)
    return res
  }
}

// SFC scoped style ID management.
let currentScopeId = null

const isTeleport = type => type.__isTeleport
const NULL_DYNAMIC_COMPONENT = Symbol()

const Fragment = Symbol(undefined)
const Text = Symbol(undefined)
const Comment = Symbol(undefined)
const Static = Symbol(undefined)
// Since v-if and v-for are the two possible ways node structure can dynamically
// change, once we consider v-if branches and each v-for fragment a block, we
// can divide a template into nested blocks, and within each block the node
// structure would be stable. This allows us to skip most children diffing
// and only worry about the dynamic nodes (indicated by patch flags).
const blockStack = []
let currentBlock = null
/**
 * Open a block.
 * This must be called before `createBlock`. It cannot be part of `createBlock`
 * because the children of the block are evaluated before `createBlock` itself
 * is called. The generated code typically looks like this:
 *
 * ```js
 * function render() {
 *   return (openBlock(),createBlock('div', null, [...]))
 * }
 * ```
 * disableTracking is true when creating a v-for fragment block, since a v-for
 * fragment always diffs its children.
 *
 * @internal
 */
function openBlock(disableTracking = false) {
  blockStack.push((currentBlock = disableTracking ? null : []))
}
/**
 * Create a block root vnode. Takes the same exact arguments as `createVNode`.
 * A block root keeps track of dynamic nodes within the block in the
 * `dynamicChildren` array.
 *
 * @internal
 */
function createBlock(type, props, children, patchFlag, dynamicProps) {
  const vnode = createVNode(
    type,
    props,
    children,
    patchFlag,
    dynamicProps,
    true /* isBlock: prevent a block from tracking itself */
  )
  // save current block children on the block vnode
  vnode.dynamicChildren = currentBlock || EMPTY_ARR
  // close block
  blockStack.pop()
  currentBlock = blockStack[blockStack.length - 1] || null
  // a block is always going to be patched, so track it as a child of its
  // parent block
  if (currentBlock) {
    currentBlock.push(vnode)
  }
  return vnode
}
function isVNode(value) {
  return value ? value.__v_isVNode === true : false
}
function isSameVNodeType(n1, n2) {
  return n1.type === n2.type && n1.key === n2.key
}
const InternalObjectKey = `__vInternal`
const normalizeKey = ({ key }) => (key != null ? key : null)
const normalizeRef = ({ ref }) =>
  ref != null ? (isArray(ref) ? ref : [currentRenderingInstance, ref]) : null
const createVNode = _createVNode
function _createVNode(
  type,
  props = null,
  children = null,
  patchFlag = 0,
  dynamicProps = null,
  isBlockNode = false
) {
  if (!type || type === NULL_DYNAMIC_COMPONENT) {
    type = Comment
  }
  // class component normalization.
  if (isFunction(type) && '__vccOpts' in type) {
    type = type.__vccOpts
  }
  // class & style normalization.
  if (props) {
    // for reactive or proxy objects, we need to clone it to enable mutation.
    if (isProxy(props) || InternalObjectKey in props) {
      props = extend({}, props)
    }
    let { class: klass, style } = props
    if (klass && !isString(klass)) {
      props.class = normalizeClass(klass)
    }
    if (isObject(style)) {
      // reactive state objects need to be cloned since they are likely to be
      // mutated
      if (isProxy(style) && !isArray(style)) {
        style = extend({}, style)
      }
      props.style = normalizeStyle(style)
    }
  }
  // encode the vnode type information into a bitmap
  const shapeFlag = isString(type)
    ? 1 /* ELEMENT */
    : isSuspense(type)
    ? 128 /* SUSPENSE */
    : isTeleport(type)
    ? 64 /* TELEPORT */
    : isObject(type)
    ? 4 /* STATEFUL_COMPONENT */
    : isFunction(type)
    ? 2 /* FUNCTIONAL_COMPONENT */
    : 0
  const vnode = {
    __v_isVNode: true,
    __v_skip: true,
    type,
    props,
    key: props && normalizeKey(props),
    ref: props && normalizeRef(props),
    scopeId: currentScopeId,
    children: null,
    component: null,
    suspense: null,
    dirs: null,
    transition: null,
    el: null,
    anchor: null,
    target: null,
    targetAnchor: null,
    staticCount: 0,
    shapeFlag,
    patchFlag,
    dynamicProps,
    dynamicChildren: null,
    appContext: null
  }
  normalizeChildren(vnode, children)
  // presence of a patch flag indicates this node needs patching on updates.
  // component nodes also should always be patched, because even if the
  // component doesn't need to update, it needs to persist the instance on to
  // the next vnode so that it can be properly unmounted later.
  if (
    !isBlockNode &&
    currentBlock &&
    // the EVENTS flag is only for hydration and if it is the only flag, the
    // vnode should not be considered dynamic due to handler caching.
    patchFlag !== 32 /* HYDRATE_EVENTS */ &&
    (patchFlag > 0 ||
    shapeFlag & 128 /* SUSPENSE */ ||
    shapeFlag & 64 /* TELEPORT */ ||
    shapeFlag & 4 /* STATEFUL_COMPONENT */ ||
      shapeFlag & 2) /* FUNCTIONAL_COMPONENT */
  ) {
    currentBlock.push(vnode)
  }
  return vnode
}
function cloneVNode(vnode, extraProps) {
  const props = extraProps
    ? vnode.props
      ? mergeProps(vnode.props, extraProps)
      : extend({}, extraProps)
    : vnode.props
  // This is intentionally NOT using spread or extend to avoid the runtime
  // key enumeration cost.
  return {
    __v_isVNode: true,
    __v_skip: true,
    type: vnode.type,
    props,
    key: props && normalizeKey(props),
    ref: props && normalizeRef(props),
    scopeId: vnode.scopeId,
    children: vnode.children,
    target: vnode.target,
    targetAnchor: vnode.targetAnchor,
    staticCount: vnode.staticCount,
    shapeFlag: vnode.shapeFlag,
    // if the vnode is cloned with extra props, we can no longer assume its
    // existing patch flag to be reliable and need to bail out of optimized mode.
    // however we don't want block nodes to de-opt their children, so if the
    // vnode is a block node, we only add the FULL_PROPS flag to it.
    patchFlag: extraProps
      ? vnode.dynamicChildren
        ? vnode.patchFlag | 16 /* FULL_PROPS */
        : -2 /* BAIL */
      : vnode.patchFlag,
    dynamicProps: vnode.dynamicProps,
    dynamicChildren: vnode.dynamicChildren,
    appContext: vnode.appContext,
    dirs: vnode.dirs,
    transition: vnode.transition,
    // These should technically only be non-null on mounted VNodes. However,
    // they *should* be copied for kept-alive vnodes. So we just always copy
    // them since them being non-null during a mount doesn't affect the logic as
    // they will simply be overwritten.
    component: vnode.component,
    suspense: vnode.suspense,
    el: vnode.el,
    anchor: vnode.anchor
  }
}
/**
 * @internal
 */
function createTextVNode(text = ' ', flag = 0) {
  return createVNode(Text, null, text, flag)
}
function normalizeVNode(child) {
  if (child == null || typeof child === 'boolean') {
    // empty placeholder
    return createVNode(Comment)
  } else if (isArray(child)) {
    // fragment
    return createVNode(Fragment, null, child)
  } else if (typeof child === 'object') {
    // already vnode, this should be the most common since compiled templates
    // always produce all-vnode children arrays
    return child.el === null ? child : cloneVNode(child)
  } else {
    // strings and numbers
    return createVNode(Text, null, String(child))
  }
}
// optimized normalization for template-compiled render fns
function cloneIfMounted(child) {
  return child.el === null ? child : cloneVNode(child)
}
function normalizeChildren(vnode, children) {
  let type = 0
  const { shapeFlag } = vnode
  if (children == null) {
    children = null
  } else if (isArray(children)) {
    type = 16 /* ARRAY_CHILDREN */
  } else if (typeof children === 'object') {
    // Normalize slot to plain children
    if (
      (shapeFlag & 1 /* ELEMENT */ || shapeFlag & 64) /* TELEPORT */ &&
      children.default
    ) {
      normalizeChildren(vnode, children.default())
      return
    } else {
      type = 32 /* SLOTS_CHILDREN */
      if (!children._ && !(InternalObjectKey in children)) {
        children._ctx = currentRenderingInstance
      }
    }
  } else if (isFunction(children)) {
    children = { default: children, _ctx: currentRenderingInstance }
    type = 32 /* SLOTS_CHILDREN */
  } else {
    children = String(children)
    // force teleport children to array so it can be moved around
    if (shapeFlag & 64 /* TELEPORT */) {
      type = 16 /* ARRAY_CHILDREN */
      children = [createTextVNode(children)]
    } else {
      type = 8 /* TEXT_CHILDREN */
    }
  }
  vnode.children = children
  vnode.shapeFlag |= type
}
const handlersRE = /^on|^vnode/
function mergeProps(...args) {
  const ret = {}
  extend(ret, args[0])
  for (let i = 1; i < args.length; i++) {
    const toMerge = args[i]
    for (const key in toMerge) {
      if (key === 'class') {
        if (ret.class !== toMerge.class) {
          ret.class = normalizeClass([ret.class, toMerge.class])
        }
      } else if (key === 'style') {
        ret.style = normalizeStyle([ret.style, toMerge.style])
      } else if (handlersRE.test(key)) {
        // on*, vnode*
        const existing = ret[key]
        const incoming = toMerge[key]
        if (existing !== incoming) {
          ret[key] = existing ? [].concat(existing, toMerge[key]) : incoming
        }
      } else {
        ret[key] = toMerge[key]
      }
    }
  }
  return ret
}

function emit(instance, event, ...args) {
  const props = instance.vnode.props || EMPTY_OBJ
  let handler = props[`on${capitalize(event)}`]
  // for v-model update:xxx events, also trigger kebab-case equivalent
  // for props passed via kebab-case
  if (!handler && event.startsWith('update:')) {
    event = hyphenate(event)
    handler = props[`on${capitalize(event)}`]
  }
  if (handler) {
    callWithAsyncErrorHandling(
      handler,
      instance,
      6 /* COMPONENT_EVENT_HANDLER */,
      args
    )
  }
}
function normalizeEmitsOptions(options) {
  if (!options) {
    return
  } else if (isArray(options)) {
    if (options._n) {
      return options._n
    }
    const normalized = {}
    options.forEach(key => (normalized[key] = null))
    def(options, '_n', normalized)
    return normalized
  } else {
    return options
  }
}
// Check if an incoming prop key is a declared emit event listener.
// e.g. With `emits: { click: null }`, props named `onClick` and `onclick` are
// both considered matched listeners.
function isEmitListener(emits, key) {
  return (
    isOn(key) &&
    (hasOwn(
      (emits = normalizeEmitsOptions(emits)),
      key[2].toLowerCase() + key.slice(3)
    ) ||
      hasOwn(emits, key.slice(2)))
  )
}

function initProps(
  instance,
  rawProps,
  isStateful, // result of bitwise flag comparison
  isSSR = false
) {
  const props = {}
  const attrs = {}
  def(attrs, InternalObjectKey, 1)
  setFullProps(instance, rawProps, props, attrs)
  const options = instance.type.props
  if (isStateful) {
    // stateful
    instance.props = isSSR ? props : shallowReactive(props)
  } else {
    if (!options) {
      // functional w/ optional props, props === attrs
      instance.props = attrs
    } else {
      // functional w/ declared props
      instance.props = props
    }
  }
  instance.attrs = attrs
}
function updateProps(instance, rawProps, rawPrevProps, optimized) {
  const {
    props,
    attrs,
    vnode: { patchFlag }
  } = instance
  const rawOptions = instance.type.props
  const rawCurrentProps = toRaw(props)
  const { 0: options } = normalizePropsOptions(rawOptions)
  if ((optimized || patchFlag > 0) && !((patchFlag & 16) /* FULL_PROPS */)) {
    if (patchFlag & 8 /* PROPS */) {
      // Compiler-generated props & no keys change, just set the updated
      // the props.
      const propsToUpdate = instance.vnode.dynamicProps
      for (let i = 0; i < propsToUpdate.length; i++) {
        const key = propsToUpdate[i]
        // PROPS flag guarantees rawProps to be non-null
        const value = rawProps[key]
        if (options) {
          // attr / props separation was done on init and will be consistent
          // in this code path, so just check if attrs have it.
          if (hasOwn(attrs, key)) {
            attrs[key] = value
          } else {
            const camelizedKey = camelize(key)
            props[camelizedKey] = resolvePropValue(
              options,
              rawCurrentProps,
              camelizedKey,
              value
            )
          }
        } else {
          attrs[key] = value
        }
      }
    }
  } else {
    // full props update.
    setFullProps(instance, rawProps, props, attrs)
    // in case of dynamic props, check if we need to delete keys from
    // the props object
    let kebabKey
    for (const key in rawCurrentProps) {
      if (
        !rawProps ||
        (!hasOwn(rawProps, key) &&
          // it's possible the original props was passed in as kebab-case
          // and converted to camelCase (#955)
          ((kebabKey = hyphenate(key)) === key || !hasOwn(rawProps, kebabKey)))
      ) {
        if (options) {
          if (rawPrevProps && rawPrevProps[kebabKey] !== undefined) {
            props[key] = resolvePropValue(
              options,
              rawProps || EMPTY_OBJ,
              key,
              undefined
            )
          }
        } else {
          delete props[key]
        }
      }
    }
    // in the case of functional component w/o props declaration, props and
    // attrs point to the same object so it should already have been updated.
    if (attrs !== rawCurrentProps) {
      for (const key in attrs) {
        if (!rawProps || !hasOwn(rawProps, key)) {
          delete attrs[key]
        }
      }
    }
  }
}
function setFullProps(instance, rawProps, props, attrs) {
  const { 0: options, 1: needCastKeys } = normalizePropsOptions(
    instance.type.props
  )
  const emits = instance.type.emits
  if (rawProps) {
    for (const key in rawProps) {
      const value = rawProps[key]
      // key, ref are reserved and never passed down
      if (isReservedProp(key)) {
        continue
      }
      // prop option names are camelized during normalization, so to support
      // kebab -> camel conversion here we need to camelize the key.
      let camelKey
      if (options && hasOwn(options, (camelKey = camelize(key)))) {
        props[camelKey] = value
      } else if (!emits || !isEmitListener(emits, key)) {
        // Any non-declared (either as a prop or an emitted event) props are put
        // into a separate `attrs` object for spreading. Make sure to preserve
        // original key casing
        attrs[key] = value
      }
    }
  }
  if (needCastKeys) {
    const rawCurrentProps = toRaw(props)
    for (let i = 0; i < needCastKeys.length; i++) {
      const key = needCastKeys[i]
      props[key] = resolvePropValue(
        options,
        rawCurrentProps,
        key,
        rawCurrentProps[key]
      )
    }
  }
}
function resolvePropValue(options, props, key, value) {
  const opt = options[key]
  if (opt != null) {
    const hasDefault = hasOwn(opt, 'default')
    // default values
    if (hasDefault && value === undefined) {
      const defaultValue = opt.default
      value = isFunction(defaultValue) ? defaultValue() : defaultValue
    }
    // boolean casting
    if (opt[0 /* shouldCast */]) {
      if (!hasOwn(props, key) && !hasDefault) {
        value = false
      } else if (
        opt[1 /* shouldCastTrue */] &&
        (value === '' || value === hyphenate(key))
      ) {
        value = true
      }
    }
  }
  return value
}
function normalizePropsOptions(raw) {
  if (!raw) {
    return EMPTY_ARR
  }
  if (raw._n) {
    return raw._n
  }
  const normalized = {}
  const needCastKeys = []
  if (isArray(raw)) {
    for (let i = 0; i < raw.length; i++) {
      const normalizedKey = camelize(raw[i])
      if (validatePropName(normalizedKey)) {
        normalized[normalizedKey] = EMPTY_OBJ
      }
    }
  } else {
    for (const key in raw) {
      const normalizedKey = camelize(key)
      if (validatePropName(normalizedKey)) {
        const opt = raw[key]
        const prop = (normalized[normalizedKey] =
          isArray(opt) || isFunction(opt) ? { type: opt } : opt)
        if (prop) {
          const booleanIndex = getTypeIndex(Boolean, prop.type)
          const stringIndex = getTypeIndex(String, prop.type)
          prop[0 /* shouldCast */] = booleanIndex > -1
          prop[1 /* shouldCastTrue */] =
            stringIndex < 0 || booleanIndex < stringIndex
          // if the prop needs boolean casting or default value
          if (booleanIndex > -1 || hasOwn(prop, 'default')) {
            needCastKeys.push(normalizedKey)
          }
        }
      }
    }
  }
  const normalizedEntry = [normalized, needCastKeys]
  def(raw, '_n', normalizedEntry)
  return normalizedEntry
}
// use function string name to check type constructors
// so that it works across vms / iframes.
function getType(ctor) {
  const match = ctor && ctor.toString().match(/^\s*function (\w+)/)
  return match ? match[1] : ''
}
function isSameType(a, b) {
  return getType(a) === getType(b)
}
function getTypeIndex(type, expectedTypes) {
  if (isArray(expectedTypes)) {
    for (let i = 0, len = expectedTypes.length; i < len; i++) {
      if (isSameType(expectedTypes[i], type)) {
        return i
      }
    }
  } else if (isFunction(expectedTypes)) {
    return isSameType(expectedTypes, type) ? 0 : -1
  }
  return -1
}
function validatePropName(key) {
  if (key[0] !== '$') {
    return true
  }
  return false
}

const isInternalKey = key => key[0] === '_' || key === '$stable'
const normalizeSlotValue = value =>
  isArray(value) ? value.map(normalizeVNode) : [normalizeVNode(value)]
const normalizeSlot = (key, rawSlot, ctx) =>
  withCtx(props => {
    return normalizeSlotValue(rawSlot(props))
  }, ctx)
const normalizeObjectSlots = (rawSlots, slots) => {
  const ctx = rawSlots._ctx
  for (const key in rawSlots) {
    if (isInternalKey(key)) continue
    const value = rawSlots[key]
    if (isFunction(value)) {
      slots[key] = normalizeSlot(key, value, ctx)
    } else if (value != null) {
      const normalized = normalizeSlotValue(value)
      slots[key] = () => normalized
    }
  }
}
const normalizeVNodeSlots = (instance, children) => {
  const normalized = normalizeSlotValue(children)
  instance.slots.default = () => normalized
}
const initSlots = (instance, children) => {
  if (instance.vnode.shapeFlag & 32 /* SLOTS_CHILDREN */) {
    if (children._ === 1) {
      instance.slots = children
    } else {
      normalizeObjectSlots(children, (instance.slots = {}))
    }
  } else {
    instance.slots = {}
    if (children) {
      normalizeVNodeSlots(instance, children)
    }
  }
  def(instance.slots, InternalObjectKey, 1)
}
const updateSlots = (instance, children) => {
  const { vnode, slots } = instance
  let needDeletionCheck = true
  let deletionComparisonTarget = EMPTY_OBJ
  if (vnode.shapeFlag & 32 /* SLOTS_CHILDREN */) {
    if (children._ === 1) {
      // compiled slots.
      if (
        // bail on dynamic slots (v-if, v-for, reference of scope variables)
        !((vnode.patchFlag & 1024) /* DYNAMIC_SLOTS */) &&
        // bail on HRM updates
        !('production' !== 'production')
      ) {
        // compiled AND static.
        // no need to update, and skip stale slots removal.
        needDeletionCheck = false
      } else {
        // compiled but dynamic - update slots, but skip normalization.
        extend(slots, children)
      }
    } else {
      needDeletionCheck = !children.$stable
      normalizeObjectSlots(children, slots)
    }
    deletionComparisonTarget = children
  } else if (children) {
    // non slot object children (direct value) passed to a component
    normalizeVNodeSlots(instance, children)
    deletionComparisonTarget = { default: 1 }
  }
  // delete stale slots
  if (needDeletionCheck) {
    for (const key in slots) {
      if (!isInternalKey(key) && !(key in deletionComparisonTarget)) {
        delete slots[key]
      }
    }
  }
}
/**
 * Adds directives to a VNode.
 */
function withDirectives(vnode, directives) {
  const internalInstance = currentRenderingInstance
  if (internalInstance === null) {
    return vnode
  }
  const instance = internalInstance.proxy
  const bindings = vnode.dirs || (vnode.dirs = [])
  for (let i = 0; i < directives.length; i++) {
    let [dir, value, arg, modifiers = EMPTY_OBJ] = directives[i]
    if (isFunction(dir)) {
      dir = {
        mounted: dir,
        updated: dir
      }
    }
    bindings.push({
      dir,
      instance,
      value,
      oldValue: void 0,
      arg,
      modifiers
    })
  }
  return vnode
}
function invokeDirectiveHook(vnode, prevVNode, instance, name) {
  const bindings = vnode.dirs
  const oldBindings = prevVNode && prevVNode.dirs
  for (let i = 0; i < bindings.length; i++) {
    const binding = bindings[i]
    if (oldBindings) {
      binding.oldValue = oldBindings[i].value
    }
    const hook = binding.dir[name]
    if (hook) {
      callWithAsyncErrorHandling(hook, instance, 8 /* DIRECTIVE_HOOK */, [
        vnode.el,
        binding,
        vnode,
        prevVNode
      ])
    }
  }
}

function createAppContext() {
  return {
    config: {
      isNativeTag: NO,
      devtools: true,
      performance: false,
      globalProperties: {},
      optionMergeStrategies: {},
      isCustomElement: NO,
      errorHandler: undefined,
      warnHandler: undefined
    },
    mixins: [],
    components: {},
    directives: {},
    provides: Object.create(null)
  }
}
function createAppAPI(render, hydrate) {
  return function createApp(rootComponent, rootProps = null) {
    if (rootProps != null && !isObject(rootProps)) {
      rootProps = null
    }
    const context = createAppContext()
    const installedPlugins = new Set()
    let isMounted = false
    const app = {
      _component: rootComponent,
      _props: rootProps,
      _container: null,
      _context: context,
      get config() {
        return context.config
      },
      set config(v) {},
      use(plugin, ...options) {
        if (installedPlugins.has(plugin));
        else if (plugin && isFunction(plugin.install)) {
          installedPlugins.add(plugin)
          plugin.install(app, ...options)
        } else if (isFunction(plugin)) {
          installedPlugins.add(plugin)
          plugin(app, ...options)
        }
        return app
      },
      mixin(mixin) {
        {
          if (!context.mixins.includes(mixin)) {
            context.mixins.push(mixin)
          }
        }
        return app
      },
      component(name, component) {
        if (!component) {
          return context.components[name]
        }
        context.components[name] = component
        return app
      },
      directive(name, directive) {
        if (!directive) {
          return context.directives[name]
        }
        context.directives[name] = directive
        return app
      },
      mount(rootContainer, isHydrate) {
        if (!isMounted) {
          const vnode = createVNode(rootComponent, rootProps)
          // store app context on the root VNode.
          // this will be set on the root instance on initial mount.
          vnode.appContext = context
          if (isHydrate && hydrate) {
            hydrate(vnode, rootContainer)
          } else {
            render(vnode, rootContainer)
          }
          isMounted = true
          app._container = rootContainer
          return vnode.component.proxy
        }
      },
      unmount() {
        if (isMounted) {
          render(null, app._container)
        }
      },
      provide(key, value) {
        // TypeScript doesn't allow symbols as index type
        // https://github.com/Microsoft/TypeScript/issues/24587
        context.provides[key] = value
        return app
      }
    }
    return app
  }
}

const prodEffectOptions = {
  scheduler: queueJob
}
const queuePostRenderEffect = queueEffectWithSuspense
/**
 * The createRenderer function accepts two generic arguments:
 * HostNode and HostElement, corresponding to Node and Element types in the
 * host environment. For example, for runtime-dom, HostNode would be the DOM
 * `Node` interface and HostElement would be the DOM `Element` interface.
 *
 * Custom renderers can pass in the platform specific types like this:
 *
 * ``` js
 * const { render, createApp } = createRenderer<Node, Element>({
 *   patchProp,
 *   ...nodeOps
 * })
 * ```
 */
function createRenderer(options) {
  return baseCreateRenderer(options)
}
// implementation
function baseCreateRenderer(options, createHydrationFns) {
  const {
    insert: hostInsert,
    remove: hostRemove,
    patchProp: hostPatchProp,
    createElement: hostCreateElement,
    createText: hostCreateText,
    createComment: hostCreateComment,
    setText: hostSetText,
    setElementText: hostSetElementText,
    parentNode: hostParentNode,
    nextSibling: hostNextSibling,
    setScopeId: hostSetScopeId = NOOP,
    cloneNode: hostCloneNode,
    insertStaticContent: hostInsertStaticContent
  } = options
  // Note: functions inside this closure should use `const xxx = () => {}`
  // style in order to prevent being inlined by minifiers.
  const patch = (
    n1,
    n2,
    container,
    anchor = null,
    parentComponent = null,
    parentSuspense = null,
    isSVG = false,
    optimized = false
  ) => {
    // patching & not same type, unmount old tree
    if (n1 && !isSameVNodeType(n1, n2)) {
      anchor = getNextHostNode(n1)
      unmount(n1, parentComponent, parentSuspense, true)
      n1 = null
    }
    if (n2.patchFlag === -2 /* BAIL */) {
      optimized = false
      n2.dynamicChildren = null
    }
    const { type, ref, shapeFlag } = n2
    switch (type) {
      case Text:
        processText(n1, n2, container, anchor)
        break
      case Comment:
        processCommentNode(n1, n2, container, anchor)
        break
      case Static:
        if (n1 == null) {
          mountStaticNode(n2, container, anchor, isSVG)
        }
        break
      case Fragment:
        processFragment(
          n1,
          n2,
          container,
          anchor,
          parentComponent,
          parentSuspense,
          isSVG,
          optimized
        )
        break
      default:
        if (shapeFlag & 1 /* ELEMENT */) {
          processElement(
            n1,
            n2,
            container,
            anchor,
            parentComponent,
            parentSuspense,
            isSVG,
            optimized
          )
        } else if (shapeFlag & 6 /* COMPONENT */) {
          processComponent(
            n1,
            n2,
            container,
            anchor,
            parentComponent,
            parentSuspense,
            isSVG,
            optimized
          )
        } else if (shapeFlag & 64 /* TELEPORT */) {
          type.process(
            n1,
            n2,
            container,
            anchor,
            parentComponent,
            parentSuspense,
            isSVG,
            optimized,
            internals
          )
        } else if (shapeFlag & 128 /* SUSPENSE */) {
          type.process(
            n1,
            n2,
            container,
            anchor,
            parentComponent,
            parentSuspense,
            isSVG,
            optimized,
            internals
          )
        }
    }
    // set ref
    if (ref != null && parentComponent) {
      const refValue =
        shapeFlag & 4 /* STATEFUL_COMPONENT */ ? n2.component.proxy : n2.el
      setRef(ref, n1 && n1.ref, parentComponent, refValue)
    }
  }
  const processText = (n1, n2, container, anchor) => {
    if (n1 == null) {
      hostInsert((n2.el = hostCreateText(n2.children)), container, anchor)
    } else {
      const el = (n2.el = n1.el)
      if (n2.children !== n1.children) {
        hostSetText(el, n2.children)
      }
    }
  }
  const processCommentNode = (n1, n2, container, anchor) => {
    if (n1 == null) {
      hostInsert(
        (n2.el = hostCreateComment(n2.children || '')),
        container,
        anchor
      )
    } else {
      // there's no support for dynamic comments
      n2.el = n1.el
    }
  }
  const mountStaticNode = (n2, container, anchor, isSVG) => {
    ;[n2.el, n2.anchor] = hostInsertStaticContent(
      n2.children,
      container,
      anchor,
      isSVG
    )
  }
  const processElement = (
    n1,
    n2,
    container,
    anchor,
    parentComponent,
    parentSuspense,
    isSVG,
    optimized
  ) => {
    isSVG = isSVG || n2.type === 'svg'
    if (n1 == null) {
      mountElement(
        n2,
        container,
        anchor,
        parentComponent,
        parentSuspense,
        isSVG,
        optimized
      )
    } else {
      patchElement(n1, n2, parentComponent, parentSuspense, isSVG, optimized)
    }
  }
  const mountElement = (
    vnode,
    container,
    anchor,
    parentComponent,
    parentSuspense,
    isSVG,
    optimized
  ) => {
    let el
    let vnodeHook
    const {
      type,
      props,
      shapeFlag,
      transition,
      scopeId,
      patchFlag,
      dirs
    } = vnode
    if (
      vnode.el &&
      hostCloneNode !== undefined &&
      patchFlag === -1 /* HOISTED */
    ) {
      // If a vnode has non-null el, it means it's being reused.
      // Only static vnodes can be reused, so its mounted DOM nodes should be
      // exactly the same, and we can simply do a clone here.
      el = vnode.el = hostCloneNode(vnode.el)
    } else {
      el = vnode.el = hostCreateElement(vnode.type, isSVG, props && props.is)
      // props
      if (props) {
        for (const key in props) {
          if (!isReservedProp(key)) {
            hostPatchProp(el, key, null, props[key], isSVG)
          }
        }
        if ((vnodeHook = props.onVnodeBeforeMount)) {
          invokeVNodeHook(vnodeHook, parentComponent, vnode)
        }
      }
      if (dirs) {
        invokeDirectiveHook(vnode, null, parentComponent, 'beforeMount')
      }
      // scopeId
      if (scopeId) {
        hostSetScopeId(el, scopeId)
      }
      const treeOwnerId = parentComponent && parentComponent.type.__scopeId
      // vnode's own scopeId and the current patched component's scopeId is
      // different - this is a slot content node.
      if (treeOwnerId && treeOwnerId !== scopeId) {
        hostSetScopeId(el, treeOwnerId + '-s')
      }
      // children
      if (shapeFlag & 8 /* TEXT_CHILDREN */) {
        hostSetElementText(el, vnode.children)
      } else if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
        mountChildren(
          vnode.children,
          el,
          null,
          parentComponent,
          parentSuspense,
          isSVG && type !== 'foreignObject',
          optimized || !!vnode.dynamicChildren
        )
      }
      if (transition && !transition.persisted) {
        transition.beforeEnter(el)
      }
    }
    hostInsert(el, container, anchor)
    if (
      (vnodeHook = props && props.onVnodeMounted) ||
      (transition && !transition.persisted) ||
      dirs
    ) {
      queuePostRenderEffect(() => {
        vnodeHook && invokeVNodeHook(vnodeHook, parentComponent, vnode)
        transition && !transition.persisted && transition.enter(el)
        dirs && invokeDirectiveHook(vnode, null, parentComponent, 'mounted')
      }, parentSuspense)
    }
  }
  const mountChildren = (
    children,
    container,
    anchor,
    parentComponent,
    parentSuspense,
    isSVG,
    optimized,
    start = 0
  ) => {
    for (let i = start; i < children.length; i++) {
      const child = (children[i] = optimized
        ? cloneIfMounted(children[i])
        : normalizeVNode(children[i]))
      patch(
        null,
        child,
        container,
        anchor,
        parentComponent,
        parentSuspense,
        isSVG,
        optimized
      )
    }
  }
  const patchElement = (
    n1,
    n2,
    parentComponent,
    parentSuspense,
    isSVG,
    optimized
  ) => {
    const el = (n2.el = n1.el)
    let { patchFlag, dynamicChildren, dirs } = n2
    const oldProps = (n1 && n1.props) || EMPTY_OBJ
    const newProps = n2.props || EMPTY_OBJ
    let vnodeHook
    if ((vnodeHook = newProps.onVnodeBeforeUpdate)) {
      invokeVNodeHook(vnodeHook, parentComponent, n2, n1)
    }
    if (dirs) {
      invokeDirectiveHook(n2, n1, parentComponent, 'beforeUpdate')
    }
    if (patchFlag > 0) {
      // the presence of a patchFlag means this element's render code was
      // generated by the compiler and can take the fast path.
      // in this path old node and new node are guaranteed to have the same shape
      // (i.e. at the exact same position in the source template)
      if (patchFlag & 16 /* FULL_PROPS */) {
        // element props contain dynamic keys, full diff needed
        patchProps(
          el,
          n2,
          oldProps,
          newProps,
          parentComponent,
          parentSuspense,
          isSVG
        )
      } else {
        // class
        // this flag is matched when the element has dynamic class bindings.
        if (patchFlag & 2 /* CLASS */) {
          if (oldProps.class !== newProps.class) {
            hostPatchProp(el, 'class', null, newProps.class, isSVG)
          }
        }
        // style
        // this flag is matched when the element has dynamic style bindings
        if (patchFlag & 4 /* STYLE */) {
          hostPatchProp(el, 'style', oldProps.style, newProps.style, isSVG)
        }
        // props
        // This flag is matched when the element has dynamic prop/attr bindings
        // other than class and style. The keys of dynamic prop/attrs are saved for
        // faster iteration.
        // Note dynamic keys like :[foo]="bar" will cause this optimization to
        // bail out and go through a full diff because we need to unset the old key
        if (patchFlag & 8 /* PROPS */) {
          // if the flag is present then dynamicProps must be non-null
          const propsToUpdate = n2.dynamicProps
          for (let i = 0; i < propsToUpdate.length; i++) {
            const key = propsToUpdate[i]
            const prev = oldProps[key]
            const next = newProps[key]
            if (prev !== next) {
              hostPatchProp(
                el,
                key,
                prev,
                next,
                isSVG,
                n1.children,
                parentComponent,
                parentSuspense,
                unmountChildren
              )
            }
          }
        }
      }
      // text
      // This flag is matched when the element has only dynamic text children.
      if (patchFlag & 1 /* TEXT */) {
        if (n1.children !== n2.children) {
          hostSetElementText(el, n2.children)
        }
      }
    } else if (!optimized && dynamicChildren == null) {
      // unoptimized, full diff
      patchProps(
        el,
        n2,
        oldProps,
        newProps,
        parentComponent,
        parentSuspense,
        isSVG
      )
    }
    const areChildrenSVG = isSVG && n2.type !== 'foreignObject'
    if (dynamicChildren) {
      patchBlockChildren(
        n1.dynamicChildren,
        dynamicChildren,
        el,
        parentComponent,
        parentSuspense,
        areChildrenSVG
      )
    } else if (!optimized) {
      // full diff
      patchChildren(
        n1,
        n2,
        el,
        null,
        parentComponent,
        parentSuspense,
        areChildrenSVG
      )
    }
    if ((vnodeHook = newProps.onVnodeUpdated) || dirs) {
      queuePostRenderEffect(() => {
        vnodeHook && invokeVNodeHook(vnodeHook, parentComponent, n2, n1)
        dirs && invokeDirectiveHook(n2, n1, parentComponent, 'updated')
      }, parentSuspense)
    }
  }
  // The fast path for blocks.
  const patchBlockChildren = (
    oldChildren,
    newChildren,
    fallbackContainer,
    parentComponent,
    parentSuspense,
    isSVG
  ) => {
    for (let i = 0; i < newChildren.length; i++) {
      const oldVNode = oldChildren[i]
      const newVNode = newChildren[i]
      // Determine the container (parent element) for the patch.
      const container =
        // - In the case of a Fragment, we need to provide the actual parent
        // of the Fragment itself so it can move its children.
        oldVNode.type === Fragment ||
        // - In the case of different nodes, there is going to be a replacement
        // which also requires the correct parent container
        !isSameVNodeType(oldVNode, newVNode) ||
        // - In the case of a component, it could contain anything.
        oldVNode.shapeFlag & 6 /* COMPONENT */
          ? hostParentNode(oldVNode.el)
          : // In other cases, the parent container is not actually used so we
            // just pass the block element here to avoid a DOM parentNode call.
            fallbackContainer
      patch(
        oldVNode,
        newVNode,
        container,
        null,
        parentComponent,
        parentSuspense,
        isSVG,
        true
      )
    }
  }
  const patchProps = (
    el,
    vnode,
    oldProps,
    newProps,
    parentComponent,
    parentSuspense,
    isSVG
  ) => {
    if (oldProps !== newProps) {
      for (const key in newProps) {
        if (isReservedProp(key)) continue
        const next = newProps[key]
        const prev = oldProps[key]
        if (next !== prev) {
          hostPatchProp(
            el,
            key,
            prev,
            next,
            isSVG,
            vnode.children,
            parentComponent,
            parentSuspense,
            unmountChildren
          )
        }
      }
      if (oldProps !== EMPTY_OBJ) {
        for (const key in oldProps) {
          if (!isReservedProp(key) && !(key in newProps)) {
            hostPatchProp(
              el,
              key,
              oldProps[key],
              null,
              isSVG,
              vnode.children,
              parentComponent,
              parentSuspense,
              unmountChildren
            )
          }
        }
      }
    }
  }
  const processFragment = (
    n1,
    n2,
    container,
    anchor,
    parentComponent,
    parentSuspense,
    isSVG,
    optimized
  ) => {
    const fragmentStartAnchor = (n2.el = n1 ? n1.el : hostCreateText(''))
    const fragmentEndAnchor = (n2.anchor = n1 ? n1.anchor : hostCreateText(''))
    let { patchFlag, dynamicChildren } = n2
    if (patchFlag > 0) {
      optimized = true
    }
    if (n1 == null) {
      hostInsert(fragmentStartAnchor, container, anchor)
      hostInsert(fragmentEndAnchor, container, anchor)
      // a fragment can only have array children
      // since they are either generated by the compiler, or implicitly created
      // from arrays.
      mountChildren(
        n2.children,
        container,
        fragmentEndAnchor,
        parentComponent,
        parentSuspense,
        isSVG,
        optimized
      )
    } else {
      if (
        patchFlag > 0 &&
        patchFlag & 64 /* STABLE_FRAGMENT */ &&
        dynamicChildren
      ) {
        // a stable fragment (template root or <template v-for>) doesn't need to
        // patch children order, but it may contain dynamicChildren.
        patchBlockChildren(
          n1.dynamicChildren,
          dynamicChildren,
          container,
          parentComponent,
          parentSuspense,
          isSVG
        )
      } else {
        // keyed / unkeyed, or manual fragments.
        // for keyed & unkeyed, since they are compiler generated from v-for,
        // each child is guaranteed to be a block so the fragment will never
        // have dynamicChildren.
        patchChildren(
          n1,
          n2,
          container,
          fragmentEndAnchor,
          parentComponent,
          parentSuspense,
          isSVG,
          optimized
        )
      }
    }
  }
  const processComponent = (
    n1,
    n2,
    container,
    anchor,
    parentComponent,
    parentSuspense,
    isSVG,
    optimized
  ) => {
    if (n1 == null) {
      if (n2.shapeFlag & 512 /* COMPONENT_KEPT_ALIVE */) {
        parentComponent.ctx.activate(n2, container, anchor, isSVG, optimized)
      } else {
        mountComponent(
          n2,
          container,
          anchor,
          parentComponent,
          parentSuspense,
          isSVG,
          optimized
        )
      }
    } else {
      updateComponent(n1, n2, parentComponent, optimized)
    }
  }
  const mountComponent = (
    initialVNode,
    container,
    anchor,
    parentComponent,
    parentSuspense,
    isSVG,
    optimized
  ) => {
    const instance = (initialVNode.component = createComponentInstance(
      initialVNode,
      parentComponent,
      parentSuspense
    ))
    // inject renderer internals for keepAlive
    if (isKeepAlive(initialVNode)) {
      instance.ctx.renderer = internals
    }
    setupComponent(instance)
    // setup() is async. This component relies on async logic to be resolved
    // before proceeding
    if (instance.asyncDep) {
      if (!parentSuspense) {
        return
      }
      parentSuspense.registerDep(instance, setupRenderEffect)
      // Give it a placeholder if this is not hydration
      if (!initialVNode.el) {
        const placeholder = (instance.subTree = createVNode(Comment))
        processCommentNode(null, placeholder, container, anchor)
      }
      return
    }
    setupRenderEffect(
      instance,
      initialVNode,
      container,
      anchor,
      parentSuspense,
      isSVG,
      optimized
    )
  }
  const updateComponent = (n1, n2, parentComponent, optimized) => {
    const instance = (n2.component = n1.component)
    if (shouldUpdateComponent(n1, n2, parentComponent, optimized)) {
      if (instance.asyncDep && !instance.asyncResolved) {
        updateComponentPreRender(instance, n2, optimized)
        return
      } else {
        // normal update
        instance.next = n2
        // in case the child component is also queued, remove it to avoid
        // double updating the same child component in the same flush.
        invalidateJob(instance.update)
        // instance.update is the reactive effect runner.
        instance.update()
      }
    } else {
      // no update needed. just copy over properties
      n2.component = n1.component
      n2.el = n1.el
    }
  }
  const setupRenderEffect = (
    instance,
    initialVNode,
    container,
    anchor,
    parentSuspense,
    isSVG,
    optimized
  ) => {
    // create reactive effect for rendering
    instance.update = effect(function componentEffect() {
      if (!instance.isMounted) {
        let vnodeHook
        const { el, props } = initialVNode
        const { bm, m, a, parent } = instance
        const subTree = (instance.subTree = renderComponentRoot(instance))
        // beforeMount hook
        if (bm) {
          invokeArrayFns(bm)
        }
        // onVnodeBeforeMount
        if ((vnodeHook = props && props.onVnodeBeforeMount)) {
          invokeVNodeHook(vnodeHook, parent, initialVNode)
        }
        if (el && hydrateNode) {
          // vnode has adopted host node - perform hydration instead of mount.
          hydrateNode(initialVNode.el, subTree, instance, parentSuspense)
        } else {
          patch(
            null,
            subTree,
            container,
            anchor,
            instance,
            parentSuspense,
            isSVG
          )
          initialVNode.el = subTree.el
        }
        // mounted hook
        if (m) {
          queuePostRenderEffect(m, parentSuspense)
        }
        // onVnodeMounted
        if ((vnodeHook = props && props.onVnodeMounted)) {
          queuePostRenderEffect(() => {
            invokeVNodeHook(vnodeHook, parent, initialVNode)
          }, parentSuspense)
        }
        // activated hook for keep-alive roots.
        if (
          a &&
          initialVNode.shapeFlag & 256 /* COMPONENT_SHOULD_KEEP_ALIVE */
        ) {
          queuePostRenderEffect(a, parentSuspense)
        }
        instance.isMounted = true
      } else {
        // updateComponent
        // This is triggered by mutation of component's own state (next: null)
        // OR parent calling processComponent (next: VNode)
        let { next, bu, u, parent, vnode } = instance
        let vnodeHook
        if (next) {
          updateComponentPreRender(instance, next, optimized)
        } else {
          next = vnode
        }
        const nextTree = renderComponentRoot(instance)
        const prevTree = instance.subTree
        instance.subTree = nextTree
        next.el = vnode.el
        // beforeUpdate hook
        if (bu) {
          invokeArrayFns(bu)
        }
        // onVnodeBeforeUpdate
        if ((vnodeHook = next.props && next.props.onVnodeBeforeUpdate)) {
          invokeVNodeHook(vnodeHook, parent, next, vnode)
        }
        // reset refs
        // only needed if previous patch had refs
        if (instance.refs !== EMPTY_OBJ) {
          instance.refs = {}
        }
        patch(
          prevTree,
          nextTree,
          // parent may have changed if it's in a teleport
          hostParentNode(prevTree.el),
          // anchor may have changed if it's in a fragment
          getNextHostNode(prevTree),
          instance,
          parentSuspense,
          isSVG
        )
        next.el = nextTree.el
        if (next === null) {
          // self-triggered update. In case of HOC, update parent component
          // vnode el. HOC is indicated by parent instance's subTree pointing
          // to child component's vnode
          updateHOCHostEl(instance, nextTree.el)
        }
        // updated hook
        if (u) {
          queuePostRenderEffect(u, parentSuspense)
        }
        // onVnodeUpdated
        if ((vnodeHook = next.props && next.props.onVnodeUpdated)) {
          queuePostRenderEffect(() => {
            invokeVNodeHook(vnodeHook, parent, next, vnode)
          }, parentSuspense)
        }
      }
    }, prodEffectOptions)
  }
  const updateComponentPreRender = (instance, nextVNode, optimized) => {
    nextVNode.component = instance
    const prevProps = instance.vnode.props
    instance.vnode = nextVNode
    instance.next = null
    updateProps(instance, nextVNode.props, prevProps, optimized)
    updateSlots(instance, nextVNode.children)
  }
  const patchChildren = (
    n1,
    n2,
    container,
    anchor,
    parentComponent,
    parentSuspense,
    isSVG,
    optimized = false
  ) => {
    const c1 = n1 && n1.children
    const prevShapeFlag = n1 ? n1.shapeFlag : 0
    const c2 = n2.children
    const { patchFlag, shapeFlag } = n2
    // fast path
    if (patchFlag > 0) {
      if (patchFlag & 128 /* KEYED_FRAGMENT */) {
        // this could be either fully-keyed or mixed (some keyed some not)
        // presence of patchFlag means children are guaranteed to be arrays
        patchKeyedChildren(
          c1,
          c2,
          container,
          anchor,
          parentComponent,
          parentSuspense,
          isSVG,
          optimized
        )
        return
      } else if (patchFlag & 256 /* UNKEYED_FRAGMENT */) {
        // unkeyed
        patchUnkeyedChildren(
          c1,
          c2,
          container,
          anchor,
          parentComponent,
          parentSuspense,
          isSVG,
          optimized
        )
        return
      }
    }
    // children has 3 possibilities: text, array or no children.
    if (shapeFlag & 8 /* TEXT_CHILDREN */) {
      // text children fast path
      if (prevShapeFlag & 16 /* ARRAY_CHILDREN */) {
        unmountChildren(c1, parentComponent, parentSuspense)
      }
      if (c2 !== c1) {
        hostSetElementText(container, c2)
      }
    } else {
      if (prevShapeFlag & 16 /* ARRAY_CHILDREN */) {
        // prev children was array
        if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
          // two arrays, cannot assume anything, do full diff
          patchKeyedChildren(
            c1,
            c2,
            container,
            anchor,
            parentComponent,
            parentSuspense,
            isSVG,
            optimized
          )
        } else {
          // no new children, just unmount old
          unmountChildren(c1, parentComponent, parentSuspense, true)
        }
      } else {
        // prev children was text OR null
        // new children is array OR null
        if (prevShapeFlag & 8 /* TEXT_CHILDREN */) {
          hostSetElementText(container, '')
        }
        // mount new if array
        if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
          mountChildren(
            c2,
            container,
            anchor,
            parentComponent,
            parentSuspense,
            isSVG,
            optimized
          )
        }
      }
    }
  }
  const patchUnkeyedChildren = (
    c1,
    c2,
    container,
    anchor,
    parentComponent,
    parentSuspense,
    isSVG,
    optimized
  ) => {
    c1 = c1 || EMPTY_ARR
    c2 = c2 || EMPTY_ARR
    const oldLength = c1.length
    const newLength = c2.length
    const commonLength = Math.min(oldLength, newLength)
    let i
    for (i = 0; i < commonLength; i++) {
      const nextChild = (c2[i] = optimized
        ? cloneIfMounted(c2[i])
        : normalizeVNode(c2[i]))
      patch(
        c1[i],
        nextChild,
        container,
        null,
        parentComponent,
        parentSuspense,
        isSVG,
        optimized
      )
    }
    if (oldLength > newLength) {
      // remove old
      unmountChildren(c1, parentComponent, parentSuspense, true, commonLength)
    } else {
      // mount new
      mountChildren(
        c2,
        container,
        anchor,
        parentComponent,
        parentSuspense,
        isSVG,
        optimized,
        commonLength
      )
    }
  }
  // can be all-keyed or mixed
  const patchKeyedChildren = (
    c1,
    c2,
    container,
    parentAnchor,
    parentComponent,
    parentSuspense,
    isSVG,
    optimized
  ) => {
    let i = 0
    const l2 = c2.length
    let e1 = c1.length - 1 // prev ending index
    let e2 = l2 - 1 // next ending index
    // 1. sync from start
    // (a b) c
    // (a b) d e
    while (i <= e1 && i <= e2) {
      const n1 = c1[i]
      const n2 = (c2[i] = optimized
        ? cloneIfMounted(c2[i])
        : normalizeVNode(c2[i]))
      if (isSameVNodeType(n1, n2)) {
        patch(
          n1,
          n2,
          container,
          null,
          parentComponent,
          parentSuspense,
          isSVG,
          optimized
        )
      } else {
        break
      }
      i++
    }
    // 2. sync from end
    // a (b c)
    // d e (b c)
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1]
      const n2 = (c2[e2] = optimized
        ? cloneIfMounted(c2[e2])
        : normalizeVNode(c2[e2]))
      if (isSameVNodeType(n1, n2)) {
        patch(
          n1,
          n2,
          container,
          null,
          parentComponent,
          parentSuspense,
          isSVG,
          optimized
        )
      } else {
        break
      }
      e1--
      e2--
    }
    // 3. common sequence + mount
    // (a b)
    // (a b) c
    // i = 2, e1 = 1, e2 = 2
    // (a b)
    // c (a b)
    // i = 0, e1 = -1, e2 = 0
    if (i > e1) {
      if (i <= e2) {
        const nextPos = e2 + 1
        const anchor = nextPos < l2 ? c2[nextPos].el : parentAnchor
        while (i <= e2) {
          patch(
            null,
            (c2[i] = optimized ? cloneIfMounted(c2[i]) : normalizeVNode(c2[i])),
            container,
            anchor,
            parentComponent,
            parentSuspense,
            isSVG
          )
          i++
        }
      }
    }
    // 4. common sequence + unmount
    // (a b) c
    // (a b)
    // i = 2, e1 = 2, e2 = 1
    // a (b c)
    // (b c)
    // i = 0, e1 = 0, e2 = -1
    else if (i > e2) {
      while (i <= e1) {
        unmount(c1[i], parentComponent, parentSuspense, true)
        i++
      }
    }
    // 5. unknown sequence
    // [i ... e1 + 1]: a b [c d e] f g
    // [i ... e2 + 1]: a b [e d c h] f g
    // i = 2, e1 = 4, e2 = 5
    else {
      const s1 = i // prev starting index
      const s2 = i // next starting index
      // 5.1 build key:index map for newChildren
      const keyToNewIndexMap = new Map()
      for (i = s2; i <= e2; i++) {
        const nextChild = (c2[i] = optimized
          ? cloneIfMounted(c2[i])
          : normalizeVNode(c2[i]))
        if (nextChild.key != null) {
          keyToNewIndexMap.set(nextChild.key, i)
        }
      }
      // 5.2 loop through old children left to be patched and try to patch
      // matching nodes & remove nodes that are no longer present
      let j
      let patched = 0
      const toBePatched = e2 - s2 + 1
      let moved = false
      // used to track whether any node has moved
      let maxNewIndexSoFar = 0
      // works as Map<newIndex, oldIndex>
      // Note that oldIndex is offset by +1
      // and oldIndex = 0 is a special value indicating the new node has
      // no corresponding old node.
      // used for determining longest stable subsequence
      const newIndexToOldIndexMap = new Array(toBePatched)
      for (i = 0; i < toBePatched; i++) newIndexToOldIndexMap[i] = 0
      for (i = s1; i <= e1; i++) {
        const prevChild = c1[i]
        if (patched >= toBePatched) {
          // all new children have been patched so this can only be a removal
          unmount(prevChild, parentComponent, parentSuspense, true)
          continue
        }
        let newIndex
        if (prevChild.key != null) {
          newIndex = keyToNewIndexMap.get(prevChild.key)
        } else {
          // key-less node, try to locate a key-less node of the same type
          for (j = s2; j <= e2; j++) {
            if (
              newIndexToOldIndexMap[j - s2] === 0 &&
              isSameVNodeType(prevChild, c2[j])
            ) {
              newIndex = j
              break
            }
          }
        }
        if (newIndex === undefined) {
          unmount(prevChild, parentComponent, parentSuspense, true)
        } else {
          newIndexToOldIndexMap[newIndex - s2] = i + 1
          if (newIndex >= maxNewIndexSoFar) {
            maxNewIndexSoFar = newIndex
          } else {
            moved = true
          }
          patch(
            prevChild,
            c2[newIndex],
            container,
            null,
            parentComponent,
            parentSuspense,
            isSVG,
            optimized
          )
          patched++
        }
      }
      // 5.3 move and mount
      // generate longest stable subsequence only when nodes have moved
      const increasingNewIndexSequence = moved
        ? getSequence(newIndexToOldIndexMap)
        : EMPTY_ARR
      j = increasingNewIndexSequence.length - 1
      // looping backwards so that we can use last patched node as anchor
      for (i = toBePatched - 1; i >= 0; i--) {
        const nextIndex = s2 + i
        const nextChild = c2[nextIndex]
        const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1].el : parentAnchor
        if (newIndexToOldIndexMap[i] === 0) {
          // mount new
          patch(
            null,
            nextChild,
            container,
            anchor,
            parentComponent,
            parentSuspense,
            isSVG
          )
        } else if (moved) {
          // move if:
          // There is no stable subsequence (e.g. a reverse)
          // OR current node is not among the stable sequence
          if (j < 0 || i !== increasingNewIndexSequence[j]) {
            move(nextChild, container, anchor, 2 /* REORDER */)
          } else {
            j--
          }
        }
      }
    }
  }
  const move = (vnode, container, anchor, moveType, parentSuspense = null) => {
    const { el, type, transition, children, shapeFlag } = vnode
    if (shapeFlag & 6 /* COMPONENT */) {
      move(vnode.component.subTree, container, anchor, moveType)
      return
    }
    if (shapeFlag & 128 /* SUSPENSE */) {
      vnode.suspense.move(container, anchor, moveType)
      return
    }
    if (shapeFlag & 64 /* TELEPORT */) {
      type.move(vnode, container, anchor, internals)
      return
    }
    if (type === Fragment) {
      hostInsert(el, container, anchor)
      for (let i = 0; i < children.length; i++) {
        move(children[i], container, anchor, moveType)
      }
      hostInsert(vnode.anchor, container, anchor)
      return
    }
    // single nodes
    const needTransition =
      moveType !== 2 /* REORDER */ && shapeFlag & 1 /* ELEMENT */ && transition
    if (needTransition) {
      if (moveType === 0 /* ENTER */) {
        transition.beforeEnter(el)
        hostInsert(el, container, anchor)
        queuePostRenderEffect(() => transition.enter(el), parentSuspense)
      } else {
        const { leave, delayLeave, afterLeave } = transition
        const remove = () => hostInsert(el, container, anchor)
        const performLeave = () => {
          leave(el, () => {
            remove()
            afterLeave && afterLeave()
          })
        }
        if (delayLeave) {
          delayLeave(el, remove, performLeave)
        } else {
          performLeave()
        }
      }
    } else {
      hostInsert(el, container, anchor)
    }
  }
  const unmount = (
    vnode,
    parentComponent,
    parentSuspense,
    doRemove = false
  ) => {
    const {
      type,
      props,
      ref,
      children,
      dynamicChildren,
      shapeFlag,
      patchFlag,
      dirs
    } = vnode
    const shouldInvokeDirs = shapeFlag & 1 /* ELEMENT */ && dirs
    const shouldKeepAlive = shapeFlag & 256 /* COMPONENT_SHOULD_KEEP_ALIVE */
    let vnodeHook
    // unset ref
    if (ref != null && parentComponent) {
      setRef(ref, null, parentComponent, null)
    }
    if ((vnodeHook = props && props.onVnodeBeforeUnmount) && !shouldKeepAlive) {
      invokeVNodeHook(vnodeHook, parentComponent, vnode)
    }
    if (shapeFlag & 6 /* COMPONENT */) {
      if (shouldKeepAlive) {
        parentComponent.ctx.deactivate(vnode)
      } else {
        unmountComponent(vnode.component, parentSuspense, doRemove)
      }
    } else {
      if (shapeFlag & 128 /* SUSPENSE */) {
        vnode.suspense.unmount(parentSuspense, doRemove)
        return
      }
      if (shouldInvokeDirs) {
        invokeDirectiveHook(vnode, null, parentComponent, 'beforeUnmount')
      }
      if (
        dynamicChildren &&
        // #1153: fast path should not be taken for non-stable (v-for) fragments
        (type !== Fragment ||
          (patchFlag > 0 && patchFlag & 64) /* STABLE_FRAGMENT */)
      ) {
        // fast path for block nodes: only need to unmount dynamic children.
        unmountChildren(dynamicChildren, parentComponent, parentSuspense)
      } else if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
        unmountChildren(children, parentComponent, parentSuspense)
      }
      // an unmounted teleport should always remove its children
      if (shapeFlag & 64 /* TELEPORT */) {
        vnode.type.remove(vnode, internals)
      }
      if (doRemove) {
        remove(vnode)
      }
    }
    if (
      ((vnodeHook = props && props.onVnodeUnmounted) || shouldInvokeDirs) &&
      !shouldKeepAlive
    ) {
      queuePostRenderEffect(() => {
        vnodeHook && invokeVNodeHook(vnodeHook, parentComponent, vnode)
        shouldInvokeDirs &&
          invokeDirectiveHook(vnode, null, parentComponent, 'unmounted')
      }, parentSuspense)
    }
  }
  const remove = vnode => {
    const { type, el, anchor, transition } = vnode
    if (type === Fragment) {
      removeFragment(el, anchor)
      return
    }
    const performRemove = () => {
      hostRemove(el)
      if (transition && !transition.persisted && transition.afterLeave) {
        transition.afterLeave()
      }
    }
    if (
      vnode.shapeFlag & 1 /* ELEMENT */ &&
      transition &&
      !transition.persisted
    ) {
      const { leave, delayLeave } = transition
      const performLeave = () => leave(el, performRemove)
      if (delayLeave) {
        delayLeave(vnode.el, performRemove, performLeave)
      } else {
        performLeave()
      }
    } else {
      performRemove()
    }
  }
  const removeFragment = (cur, end) => {
    // For fragments, directly remove all contained DOM nodes.
    // (fragment child nodes cannot have transition)
    let next
    while (cur !== end) {
      next = hostNextSibling(cur)
      hostRemove(cur)
      cur = next
    }
    hostRemove(end)
  }
  const unmountComponent = (instance, parentSuspense, doRemove) => {
    const { bum, effects, update, subTree, um, da, isDeactivated } = instance
    // beforeUnmount hook
    if (bum) {
      invokeArrayFns(bum)
    }
    if (effects) {
      for (let i = 0; i < effects.length; i++) {
        stop(effects[i])
      }
    }
    // update may be null if a component is unmounted before its async
    // setup has resolved.
    if (update) {
      stop(update)
      unmount(subTree, instance, parentSuspense, doRemove)
    }
    // unmounted hook
    if (um) {
      queuePostRenderEffect(um, parentSuspense)
    }
    // deactivated hook
    if (
      da &&
      !isDeactivated &&
      instance.vnode.shapeFlag & 256 /* COMPONENT_SHOULD_KEEP_ALIVE */
    ) {
      queuePostRenderEffect(da, parentSuspense)
    }
    queuePostRenderEffect(() => {
      instance.isUnmounted = true
    }, parentSuspense)
    // A component with async dep inside a pending suspense is unmounted before
    // its async dep resolves. This should remove the dep from the suspense, and
    // cause the suspense to resolve immediately if that was the last dep.
    if (
      parentSuspense &&
      !parentSuspense.isResolved &&
      !parentSuspense.isUnmounted &&
      instance.asyncDep &&
      !instance.asyncResolved
    ) {
      parentSuspense.deps--
      if (parentSuspense.deps === 0) {
        parentSuspense.resolve()
      }
    }
  }
  const unmountChildren = (
    children,
    parentComponent,
    parentSuspense,
    doRemove = false,
    start = 0
  ) => {
    for (let i = start; i < children.length; i++) {
      unmount(children[i], parentComponent, parentSuspense, doRemove)
    }
  }
  const getNextHostNode = vnode => {
    if (vnode.shapeFlag & 6 /* COMPONENT */) {
      return getNextHostNode(vnode.component.subTree)
    }
    if (vnode.shapeFlag & 128 /* SUSPENSE */) {
      return vnode.suspense.next()
    }
    return hostNextSibling(vnode.anchor || vnode.el)
  }
  const setRef = (rawRef, oldRawRef, parent, value) => {
    const [owner, ref] = rawRef
    const oldRef = oldRawRef && oldRawRef[1]
    const refs = owner.refs === EMPTY_OBJ ? (owner.refs = {}) : owner.refs
    const setupState = owner.setupState
    // unset old ref
    if (oldRef != null && oldRef !== ref) {
      if (isString(oldRef)) {
        refs[oldRef] = null
        if (hasOwn(setupState, oldRef)) {
          setupState[oldRef] = null
        }
      } else if (isRef(oldRef)) {
        oldRef.value = null
      }
    }
    if (isString(ref)) {
      refs[ref] = value
      if (hasOwn(setupState, ref)) {
        setupState[ref] = value
      }
    } else if (isRef(ref)) {
      ref.value = value
    } else if (isFunction(ref)) {
      callWithErrorHandling(ref, parent, 12 /* FUNCTION_REF */, [value, refs])
    }
  }
  const render = (vnode, container) => {
    if (vnode == null) {
      if (container._vnode) {
        unmount(container._vnode, null, null, true)
      }
    } else {
      patch(container._vnode || null, vnode, container)
    }
    flushPostFlushCbs()
    container._vnode = vnode
  }
  const internals = {
    p: patch,
    um: unmount,
    m: move,
    r: remove,
    mt: mountComponent,
    mc: mountChildren,
    pc: patchChildren,
    pbc: patchBlockChildren,
    n: getNextHostNode,
    o: options
  }
  let hydrate
  let hydrateNode
  if (createHydrationFns) {
    ;[hydrate, hydrateNode] = createHydrationFns(internals)
  }
  return {
    render,
    hydrate,
    createApp: createAppAPI(render, hydrate)
  }
}
function invokeVNodeHook(hook, instance, vnode, prevVNode = null) {
  callWithAsyncErrorHandling(hook, instance, 7 /* VNODE_HOOK */, [
    vnode,
    prevVNode
  ])
}
// https://en.wikipedia.org/wiki/Longest_increasing_subsequence
function getSequence(arr) {
  const p = arr.slice()
  const result = [0]
  let i, j, u, v, c
  const len = arr.length
  for (i = 0; i < len; i++) {
    const arrI = arr[i]
    if (arrI !== 0) {
      j = result[result.length - 1]
      if (arr[j] < arrI) {
        p[i] = j
        result.push(i)
        continue
      }
      u = 0
      v = result.length - 1
      while (u < v) {
        c = ((u + v) / 2) | 0
        if (arr[result[c]] < arrI) {
          u = c + 1
        } else {
          v = c
        }
      }
      if (arrI < arr[result[u]]) {
        if (u > 0) {
          p[i] = result[u - 1]
        }
        result[u] = i
      }
    }
  }
  u = result.length
  v = result[u - 1]
  while (u-- > 0) {
    result[u] = v
    v = p[v]
  }
  return result
}

const isKeepAlive = vnode => vnode.type.__isKeepAlive
function onActivated(hook, target) {
  registerKeepAliveHook(hook, 'a' /* ACTIVATED */, target)
}
function onDeactivated(hook, target) {
  registerKeepAliveHook(hook, 'da' /* DEACTIVATED */, target)
}
function registerKeepAliveHook(hook, type, target = currentInstance) {
  // cache the deactivate branch check wrapper for injected hooks so the same
  // hook can be properly deduped by the scheduler. "__wdc" stands for "with
  // deactivation check".
  const wrappedHook =
    hook.__wdc ||
    (hook.__wdc = () => {
      // only fire the hook if the target instance is NOT in a deactivated branch.
      let current = target
      while (current) {
        if (current.isDeactivated) {
          return
        }
        current = current.parent
      }
      hook()
    })
  injectHook(type, wrappedHook, target)
  // In addition to registering it on the target instance, we walk up the parent
  // chain and register it on all ancestor instances that are keep-alive roots.
  // This avoids the need to walk the entire component tree when invoking these
  // hooks, and more importantly, avoids the need to track child components in
  // arrays.
  if (target) {
    let current = target.parent
    while (current && current.parent) {
      if (isKeepAlive(current.parent.vnode)) {
        injectToKeepAliveRoot(wrappedHook, type, target, current)
      }
      current = current.parent
    }
  }
}
function injectToKeepAliveRoot(hook, type, target, keepAliveRoot) {
  injectHook(type, hook, keepAliveRoot, true /* prepend */)
  onUnmounted(() => {
    remove(keepAliveRoot[type], hook)
  }, target)
}

function injectHook(type, hook, target = currentInstance, prepend = false) {
  if (target) {
    const hooks = target[type] || (target[type] = [])
    // cache the error handling wrapper for injected hooks so the same hook
    // can be properly deduped by the scheduler. "__weh" stands for "with error
    // handling".
    const wrappedHook =
      hook.__weh ||
      (hook.__weh = (...args) => {
        if (target.isUnmounted) {
          return
        }
        // disable tracking inside all lifecycle hooks
        // since they can potentially be called inside effects.
        pauseTracking()
        // Set currentInstance during hook invocation.
        // This assumes the hook does not synchronously trigger other hooks, which
        // can only be false when the user does something really funky.
        setCurrentInstance(target)
        const res = callWithAsyncErrorHandling(hook, target, type, args)
        setCurrentInstance(null)
        resetTracking()
        return res
      })
    if (prepend) {
      hooks.unshift(wrappedHook)
    } else {
      hooks.push(wrappedHook)
    }
  }
}
const createHook = lifecycle => (hook, target = currentInstance) =>
  // post-create lifecycle registrations are noops during SSR
  !isInSSRComponentSetup && injectHook(lifecycle, hook, target)
const onBeforeMount = createHook('bm' /* BEFORE_MOUNT */)
const onMounted = createHook('m' /* MOUNTED */)
const onBeforeUpdate = createHook('bu' /* BEFORE_UPDATE */)
const onUpdated = createHook('u' /* UPDATED */)
const onBeforeUnmount = createHook('bum' /* BEFORE_UNMOUNT */)
const onUnmounted = createHook('um' /* UNMOUNTED */)
const onRenderTriggered = createHook('rtg' /* RENDER_TRIGGERED */)
const onRenderTracked = createHook('rtc' /* RENDER_TRACKED */)
const onErrorCaptured = (hook, target = currentInstance) => {
  injectHook('ec' /* ERROR_CAPTURED */, hook, target)
}

const invoke = fn => fn()
// initial value for watchers to trigger on undefined initial values
const INITIAL_WATCHER_VALUE = {}
// implementation
function watch(source, cb, options) {
  return doWatch(source, cb, options)
}
function doWatch(
  source,
  cb,
  { immediate, deep, flush, onTrack, onTrigger } = EMPTY_OBJ
) {
  const instance = currentInstance
  let getter
  if (isArray(source)) {
    getter = () =>
      source.map(s => {
        if (isRef(s)) {
          return s.value
        } else if (isReactive(s)) {
          return traverse(s)
        } else if (isFunction(s)) {
          return callWithErrorHandling(s, instance, 2 /* WATCH_GETTER */)
        }
      })
  } else if (isRef(source)) {
    getter = () => source.value
  } else if (isReactive(source)) {
    getter = () => source
    deep = true
  } else if (isFunction(source)) {
    if (cb) {
      // getter with cb
      getter = () =>
        callWithErrorHandling(source, instance, 2 /* WATCH_GETTER */)
    } else {
      // no cb -> simple effect
      getter = () => {
        if (instance && instance.isUnmounted) {
          return
        }
        if (cleanup) {
          cleanup()
        }
        return callWithErrorHandling(source, instance, 3 /* WATCH_CALLBACK */, [
          onInvalidate
        ])
      }
    }
  } else {
    getter = NOOP
  }
  if (cb && deep) {
    const baseGetter = getter
    getter = () => traverse(baseGetter())
  }
  let cleanup
  const onInvalidate = fn => {
    cleanup = runner.options.onStop = () => {
      callWithErrorHandling(fn, instance, 4 /* WATCH_CLEANUP */)
    }
  }
  let oldValue = isArray(source) ? [] : INITIAL_WATCHER_VALUE
  const applyCb = cb
    ? () => {
        if (instance && instance.isUnmounted) {
          return
        }
        const newValue = runner()
        if (deep || hasChanged(newValue, oldValue)) {
          // cleanup before running cb again
          if (cleanup) {
            cleanup()
          }
          callWithAsyncErrorHandling(cb, instance, 3 /* WATCH_CALLBACK */, [
            newValue,
            // pass undefined as the old value when it's changed for the first time
            oldValue === INITIAL_WATCHER_VALUE ? undefined : oldValue,
            onInvalidate
          ])
          oldValue = newValue
        }
      }
    : void 0
  let scheduler
  if (flush === 'sync') {
    scheduler = invoke
  } else if (flush === 'pre') {
    scheduler = job => {
      if (!instance || instance.isMounted) {
        queueJob(job)
      } else {
        // with 'pre' option, the first call must happen before
        // the component is mounted so it is called synchronously.
        job()
      }
    }
  } else {
    scheduler = job => queuePostRenderEffect(job, instance && instance.suspense)
  }
  const runner = effect(getter, {
    lazy: true,
    // so it runs before component update effects in pre flush mode
    computed: true,
    onTrack,
    onTrigger,
    scheduler: applyCb ? () => scheduler(applyCb) : scheduler
  })
  recordInstanceBoundEffect(runner)
  // initial run
  if (applyCb) {
    if (immediate) {
      applyCb()
    } else {
      oldValue = runner()
    }
  } else {
    runner()
  }
  return () => {
    stop(runner)
    if (instance) {
      remove(instance.effects, runner)
    }
  }
}
// this.$watch
function instanceWatch(source, cb, options) {
  const publicThis = this.proxy
  const getter = isString(source)
    ? () => publicThis[source]
    : source.bind(publicThis)
  const stop = watch(getter, cb.bind(publicThis), options)
  onBeforeUnmount(stop, this)
  return stop
}
function traverse(value, seen = new Set()) {
  if (!isObject(value) || seen.has(value)) {
    return value
  }
  seen.add(value)
  if (isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      traverse(value[i], seen)
    }
  } else if (value instanceof Map) {
    value.forEach((v, key) => {
      // to register mutation dep for existing keys
      traverse(value.get(key), seen)
    })
  } else if (value instanceof Set) {
    value.forEach(v => {
      traverse(v, seen)
    })
  } else {
    for (const key in value) {
      traverse(value[key], seen)
    }
  }
  return value
}

function provide(key, value) {
  if (!currentInstance);
  else {
    let provides = currentInstance.provides
    // by default an instance inherits its parent's provides object
    // but when it needs to provide values of its own, it creates its
    // own provides object using parent provides object as prototype.
    // this way in `inject` we can simply look up injections from direct
    // parent and let the prototype chain do the work.
    const parentProvides =
      currentInstance.parent && currentInstance.parent.provides
    if (parentProvides === provides) {
      provides = currentInstance.provides = Object.create(parentProvides)
    }
    // TS doesn't allow symbol as index type
    provides[key] = value
  }
}
function inject(key, defaultValue) {
  // fallback to `currentRenderingInstance` so that this can be called in
  // a functional component
  const instance = currentInstance || currentRenderingInstance
  if (instance) {
    const provides = instance.provides
    if (key in provides) {
      // TS doesn't allow symbol as index type
      return provides[key]
    } else if (arguments.length > 1) {
      return defaultValue
    }
  }
}
function applyOptions(
  instance,
  options,
  deferredData = [],
  deferredWatch = [],
  asMixin = false
) {
  const {
    // composition
    mixins,
    extends: extendsOptions,
    // state
    props: propsOptions,
    data: dataOptions,
    computed: computedOptions,
    methods,
    watch: watchOptions,
    provide: provideOptions,
    inject: injectOptions,
    // assets
    components,
    directives,
    // lifecycle
    beforeMount,
    mounted,
    beforeUpdate,
    updated,
    activated,
    deactivated,
    beforeUnmount,
    unmounted,
    renderTracked,
    renderTriggered,
    errorCaptured
  } = options
  const publicThis = instance.proxy
  const ctx = instance.ctx
  const globalMixins = instance.appContext.mixins
  // call it only during dev
  // applyOptions is called non-as-mixin once per instance
  if (!asMixin) {
    callSyncHook('beforeCreate', options, publicThis, globalMixins)
    // global mixins are applied first
    applyMixins(instance, globalMixins, deferredData, deferredWatch)
  }
  // extending a base component...
  if (extendsOptions) {
    applyOptions(instance, extendsOptions, deferredData, deferredWatch, true)
  }
  // local mixins
  if (mixins) {
    applyMixins(instance, mixins, deferredData, deferredWatch)
  }
  // options initialization order (to be consistent with Vue 2):
  // - props (already done outside of this function)
  // - inject
  // - methods
  // - data (deferred since it relies on `this` access)
  // - computed
  // - watch (deferred since it relies on `this` access)
  if (injectOptions) {
    if (isArray(injectOptions)) {
      for (let i = 0; i < injectOptions.length; i++) {
        const key = injectOptions[i]
        ctx[key] = inject(key)
      }
    } else {
      for (const key in injectOptions) {
        const opt = injectOptions[key]
        if (isObject(opt)) {
          ctx[key] = inject(opt.from, opt.default)
        } else {
          ctx[key] = inject(opt)
        }
      }
    }
  }
  if (methods) {
    for (const key in methods) {
      const methodHandler = methods[key]
      if (isFunction(methodHandler)) {
        ctx[key] = methodHandler.bind(publicThis)
      }
    }
  }
  if (dataOptions) {
    if (asMixin) {
      deferredData.push(dataOptions)
    } else {
      resolveData(instance, dataOptions, publicThis)
    }
  }
  if (!asMixin) {
    if (deferredData.length) {
      deferredData.forEach(dataFn => resolveData(instance, dataFn, publicThis))
    }
  }
  if (computedOptions) {
    for (const key in computedOptions) {
      const opt = computedOptions[key]
      const get = isFunction(opt)
        ? opt.bind(publicThis, publicThis)
        : isFunction(opt.get)
        ? opt.get.bind(publicThis, publicThis)
        : NOOP
      const set =
        !isFunction(opt) && isFunction(opt.set)
          ? opt.set.bind(publicThis)
          : NOOP
      const c = computed$1({
        get,
        set
      })
      Object.defineProperty(ctx, key, {
        enumerable: true,
        configurable: true,
        get: () => c.value,
        set: v => (c.value = v)
      })
    }
  }
  if (watchOptions) {
    deferredWatch.push(watchOptions)
  }
  if (!asMixin && deferredWatch.length) {
    deferredWatch.forEach(watchOptions => {
      for (const key in watchOptions) {
        createWatcher(watchOptions[key], ctx, publicThis, key)
      }
    })
  }
  if (provideOptions) {
    const provides = isFunction(provideOptions)
      ? provideOptions.call(publicThis)
      : provideOptions
    for (const key in provides) {
      provide(key, provides[key])
    }
  }
  // asset options
  if (components) {
    extend(instance.components, components)
  }
  if (directives) {
    extend(instance.directives, directives)
  }
  // lifecycle options
  if (!asMixin) {
    callSyncHook('created', options, publicThis, globalMixins)
  }
  if (beforeMount) {
    onBeforeMount(beforeMount.bind(publicThis))
  }
  if (mounted) {
    onMounted(mounted.bind(publicThis))
  }
  if (beforeUpdate) {
    onBeforeUpdate(beforeUpdate.bind(publicThis))
  }
  if (updated) {
    onUpdated(updated.bind(publicThis))
  }
  if (activated) {
    onActivated(activated.bind(publicThis))
  }
  if (deactivated) {
    onDeactivated(deactivated.bind(publicThis))
  }
  if (errorCaptured) {
    onErrorCaptured(errorCaptured.bind(publicThis))
  }
  if (renderTracked) {
    onRenderTracked(renderTracked.bind(publicThis))
  }
  if (renderTriggered) {
    onRenderTriggered(renderTriggered.bind(publicThis))
  }
  if (beforeUnmount) {
    onBeforeUnmount(beforeUnmount.bind(publicThis))
  }
  if (unmounted) {
    onUnmounted(unmounted.bind(publicThis))
  }
}
function callSyncHook(name, options, ctx, globalMixins) {
  callHookFromMixins(name, globalMixins, ctx)
  const baseHook = options.extends && options.extends[name]
  if (baseHook) {
    baseHook.call(ctx)
  }
  const mixins = options.mixins
  if (mixins) {
    callHookFromMixins(name, mixins, ctx)
  }
  const selfHook = options[name]
  if (selfHook) {
    selfHook.call(ctx)
  }
}
function callHookFromMixins(name, mixins, ctx) {
  for (let i = 0; i < mixins.length; i++) {
    const fn = mixins[i][name]
    if (fn) {
      fn.call(ctx)
    }
  }
}
function applyMixins(instance, mixins, deferredData, deferredWatch) {
  for (let i = 0; i < mixins.length; i++) {
    applyOptions(instance, mixins[i], deferredData, deferredWatch, true)
  }
}
function resolveData(instance, dataFn, publicThis) {
  const data = dataFn.call(publicThis, publicThis)
  if (!isObject(data));
  else if (instance.data === EMPTY_OBJ) {
    instance.data = reactive(data)
  } else {
    // existing data: this is a mixin or extends.
    extend(instance.data, data)
  }
}
function createWatcher(raw, ctx, publicThis, key) {
  const getter = () => publicThis[key]
  if (isString(raw)) {
    const handler = ctx[raw]
    if (isFunction(handler)) {
      watch(getter, handler)
    }
  } else if (isFunction(raw)) {
    watch(getter, raw.bind(publicThis))
  } else if (isObject(raw)) {
    if (isArray(raw)) {
      raw.forEach(r => createWatcher(r, ctx, publicThis, key))
    } else {
      watch(getter, raw.handler.bind(publicThis), raw)
    }
  }
}
function resolveMergedOptions(instance) {
  const raw = instance.type
  const { __merged, mixins, extends: extendsOptions } = raw
  if (__merged) return __merged
  const globalMixins = instance.appContext.mixins
  if (!globalMixins.length && !mixins && !extendsOptions) return raw
  const options = {}
  globalMixins.forEach(m => mergeOptions(options, m, instance))
  extendsOptions && mergeOptions(options, extendsOptions, instance)
  mixins && mixins.forEach(m => mergeOptions(options, m, instance))
  mergeOptions(options, raw, instance)
  return (raw.__merged = options)
}
function mergeOptions(to, from, instance) {
  const strats = instance.appContext.config.optionMergeStrategies
  for (const key in from) {
    const strat = strats && strats[key]
    if (strat) {
      to[key] = strat(to[key], from[key], instance.proxy, key)
    } else if (!hasOwn(to, key)) {
      to[key] = from[key]
    }
  }
}

const publicPropertiesMap = {
  $: i => i,
  $el: i => i.vnode.el,
  $data: i => i.data,
  $props: i => i.props,
  $attrs: i => i.attrs,
  $slots: i => i.slots,
  $refs: i => i.refs,
  $parent: i => i.parent && i.parent.proxy,
  $root: i => i.root && i.root.proxy,
  $emit: i => i.emit,
  $options: i => resolveMergedOptions(i),
  $forceUpdate: i => () => queueJob(i.update),
  $nextTick: () => nextTick,
  $watch: i => instanceWatch.bind(i)
}
const PublicInstanceProxyHandlers = {
  get({ _: instance }, key) {
    const {
      ctx,
      setupState,
      data,
      props,
      accessCache,
      type,
      appContext
    } = instance
    // let @vue/reatvitiy know it should never observe Vue public instances.
    if (key === '__v_skip' /* skip */) {
      return true
    }
    // data / props / ctx
    // This getter gets called for every property access on the render context
    // during render and is a major hotspot. The most expensive part of this
    // is the multiple hasOwn() calls. It's much faster to do a simple property
    // access on a plain object, so we use an accessCache object (with null
    // prototype) to memoize what access type a key corresponds to.
    if (key[0] !== '$') {
      const n = accessCache[key]
      if (n !== undefined) {
        switch (n) {
          case 0 /* SETUP */:
            return setupState[key]
          case 1 /* DATA */:
            return data[key]
          case 3 /* CONTEXT */:
            return ctx[key]
          case 2 /* PROPS */:
            return props[key]
          // default: just fallthrough
        }
      } else if (setupState !== EMPTY_OBJ && hasOwn(setupState, key)) {
        accessCache[key] = 0 /* SETUP */
        return setupState[key]
      } else if (data !== EMPTY_OBJ && hasOwn(data, key)) {
        accessCache[key] = 1 /* DATA */
        return data[key]
      } else if (
        // only cache other properties when instance has declared (thus stable)
        // props
        type.props &&
        hasOwn(normalizePropsOptions(type.props)[0], key)
      ) {
        accessCache[key] = 2 /* PROPS */
        return props[key]
      } else if (ctx !== EMPTY_OBJ && hasOwn(ctx, key)) {
        accessCache[key] = 3 /* CONTEXT */
        return ctx[key]
      } else {
        accessCache[key] = 4 /* OTHER */
      }
    }
    const publicGetter = publicPropertiesMap[key]
    let cssModule, globalProperties
    // public $xxx properties
    if (publicGetter) {
      return publicGetter(instance)
    } else if (
      // css module (injected by vue-loader)
      (cssModule = type.__cssModules) &&
      (cssModule = cssModule[key])
    ) {
      return cssModule
    } else if (ctx !== EMPTY_OBJ && hasOwn(ctx, key)) {
      // user may set custom properties to `this` that start with `$`
      accessCache[key] = 3 /* CONTEXT */
      return ctx[key]
    } else if (
      // global properties
      ((globalProperties = appContext.config.globalProperties),
      hasOwn(globalProperties, key))
    ) {
      return globalProperties[key]
    }
  },
  set({ _: instance }, key, value) {
    const { data, setupState, ctx } = instance
    if (setupState !== EMPTY_OBJ && hasOwn(setupState, key)) {
      setupState[key] = value
    } else if (data !== EMPTY_OBJ && hasOwn(data, key)) {
      data[key] = value
    } else if (key in instance.props) {
      return false
    }
    if (key[0] === '$' && key.slice(1) in instance) {
      return false
    } else {
      {
        ctx[key] = value
      }
    }
    return true
  },
  has({ _: { data, setupState, accessCache, ctx, type, appContext } }, key) {
    return (
      accessCache[key] !== undefined ||
      (data !== EMPTY_OBJ && hasOwn(data, key)) ||
      (setupState !== EMPTY_OBJ && hasOwn(setupState, key)) ||
      (type.props && hasOwn(normalizePropsOptions(type.props)[0], key)) ||
      hasOwn(ctx, key) ||
      hasOwn(publicPropertiesMap, key) ||
      hasOwn(appContext.config.globalProperties, key)
    )
  }
}
const RuntimeCompiledPublicInstanceProxyHandlers = {
  ...PublicInstanceProxyHandlers,
  get(target, key) {
    // fast path for unscopables when using `with` block
    if (key === Symbol.unscopables) {
      return
    }
    return PublicInstanceProxyHandlers.get(target, key, target)
  },
  has(_, key) {
    const has = key[0] !== '_' && !isGloballyWhitelisted(key)
    return has
  }
}

const emptyAppContext = createAppContext()
let uid$1 = 0
function createComponentInstance(vnode, parent, suspense) {
  // inherit parent app context - or - if root, adopt from root vnode
  const appContext =
    (parent ? parent.appContext : vnode.appContext) || emptyAppContext
  const instance = {
    uid: uid$1++,
    vnode,
    parent,
    appContext,
    type: vnode.type,
    root: null,
    next: null,
    subTree: null,
    update: null,
    render: null,
    proxy: null,
    withProxy: null,
    effects: null,
    provides: parent ? parent.provides : Object.create(appContext.provides),
    accessCache: null,
    renderCache: [],
    // state
    ctx: EMPTY_OBJ,
    data: EMPTY_OBJ,
    props: EMPTY_OBJ,
    attrs: EMPTY_OBJ,
    slots: EMPTY_OBJ,
    refs: EMPTY_OBJ,
    setupState: EMPTY_OBJ,
    setupContext: null,
    // per-instance asset storage (mutable during options resolution)
    components: Object.create(appContext.components),
    directives: Object.create(appContext.directives),
    // suspense related
    suspense,
    asyncDep: null,
    asyncResolved: false,
    // lifecycle hooks
    // not using enums here because it results in computed properties
    isMounted: false,
    isUnmounted: false,
    isDeactivated: false,
    bc: null,
    c: null,
    bm: null,
    m: null,
    bu: null,
    u: null,
    um: null,
    bum: null,
    da: null,
    a: null,
    rtg: null,
    rtc: null,
    ec: null,
    emit: null // to be set immediately
  }
  {
    instance.ctx = { _: instance }
  }
  instance.root = parent ? parent.root : instance
  instance.emit = emit.bind(null, instance)
  return instance
}
let currentInstance = null
const getCurrentInstance = () => currentInstance || currentRenderingInstance
const setCurrentInstance = instance => {
  currentInstance = instance
}
let isInSSRComponentSetup = false
function setupComponent(instance, isSSR = false) {
  isInSSRComponentSetup = isSSR
  const { props, children, shapeFlag } = instance.vnode
  const isStateful = shapeFlag & 4 /* STATEFUL_COMPONENT */
  initProps(instance, props, isStateful, isSSR)
  initSlots(instance, children)
  const setupResult = isStateful
    ? setupStatefulComponent(instance, isSSR)
    : undefined
  isInSSRComponentSetup = false
  return setupResult
}
function setupStatefulComponent(instance, isSSR) {
  const Component = instance.type
  // 0. create render proxy property access cache
  instance.accessCache = {}
  // 1. create public instance / render proxy
  // also mark it raw so it's never observed
  instance.proxy = new Proxy(instance.ctx, PublicInstanceProxyHandlers)
  // 2. call setup()
  const { setup } = Component
  if (setup) {
    const setupContext = (instance.setupContext =
      setup.length > 1 ? createSetupContext(instance) : null)
    currentInstance = instance
    pauseTracking()
    const setupResult = callWithErrorHandling(
      setup,
      instance,
      0 /* SETUP_FUNCTION */,
      [instance.props, setupContext]
    )
    resetTracking()
    currentInstance = null
    if (isPromise(setupResult)) {
      if (isSSR) {
        // return the promise so server-renderer can wait on it
        return setupResult.then(resolvedResult => {
          handleSetupResult(instance, resolvedResult)
        })
      } else {
        // async setup returned Promise.
        // bail here and wait for re-entry.
        instance.asyncDep = setupResult
      }
    } else {
      handleSetupResult(instance, setupResult)
    }
  } else {
    finishComponentSetup(instance)
  }
}
function handleSetupResult(instance, setupResult, isSSR) {
  if (isFunction(setupResult)) {
    // setup returned an inline render function
    instance.render = setupResult
  } else if (isObject(setupResult)) {
    // setup returned bindings.
    // assuming a render function compiled from template is present.
    instance.setupState = reactive(setupResult)
  }
  finishComponentSetup(instance)
}
function finishComponentSetup(instance, isSSR) {
  const Component = instance.type
  // template / render function normalization
  if (!instance.render) {
    instance.render = Component.render || NOOP
    // for runtime-compiled render functions using `with` blocks, the render
    // proxy used needs a different `has` handler which is more performant and
    // also only allows a whitelist of globals to fallthrough.
    if (instance.render._rc) {
      instance.withProxy = new Proxy(
        instance.ctx,
        RuntimeCompiledPublicInstanceProxyHandlers
      )
    }
  }
  // support for 2.x options
  {
    currentInstance = instance
    applyOptions(instance, Component)
    currentInstance = null
  }
}
function createSetupContext(instance) {
  {
    return {
      attrs: instance.attrs,
      slots: instance.slots,
      emit: instance.emit
    }
  }
}
// record effects created during a component's setup() so that they can be
// stopped when the component unmounts
function recordInstanceBoundEffect(effect) {
  if (currentInstance) {
    ;(currentInstance.effects || (currentInstance.effects = [])).push(effect)
  }
}
const classifyRE = /(?:^|[-_])(\w)/g
const classify = str =>
  str.replace(classifyRE, c => c.toUpperCase()).replace(/[-_]/g, '')
function formatComponentName(Component, isRoot = false) {
  let name = isFunction(Component)
    ? Component.displayName || Component.name
    : Component.name
  if (!name && Component.__file) {
    const match = Component.__file.match(/([^/\\]+)\.vue$/)
    if (match) {
      name = match[1]
    }
  }
  return name ? classify(name) : isRoot ? `App` : `Anonymous`
}

function computed$1(getterOrOptions) {
  const c = computed(getterOrOptions)
  recordInstanceBoundEffect(c.effect)
  return c
}

// implementation, close to no-op
function defineComponent(options) {
  return isFunction(options) ? { setup: options } : options
}

// Actual implementation
function h(type, propsOrChildren, children) {
  if (arguments.length === 2) {
    if (isObject(propsOrChildren) && !isArray(propsOrChildren)) {
      // single vnode without props
      if (isVNode(propsOrChildren)) {
        return createVNode(type, null, [propsOrChildren])
      }
      // props without children
      return createVNode(type, propsOrChildren)
    } else {
      // omit props
      return createVNode(type, null, propsOrChildren)
    }
  } else {
    if (isVNode(children)) {
      children = [children]
    }
    return createVNode(type, propsOrChildren, children)
  }
}
/**
 * @internal
 */
const _toDisplayString = toDisplayString
/**
 * @internal
 */
const _camelize = camelize

const svgNS = 'http://www.w3.org/2000/svg'
const doc = typeof document !== 'undefined' ? document : null
let tempContainer
let tempSVGContainer
const nodeOps = {
  insert: (child, parent, anchor) => {
    if (anchor) {
      parent.insertBefore(child, anchor)
    } else {
      parent.appendChild(child)
    }
  },
  remove: child => {
    const parent = child.parentNode
    if (parent) {
      parent.removeChild(child)
    }
  },
  createElement: (tag, isSVG, is) =>
    isSVG
      ? doc.createElementNS(svgNS, tag)
      : doc.createElement(tag, is ? { is } : undefined),
  createText: text => doc.createTextNode(text),
  createComment: text => doc.createComment(text),
  setText: (node, text) => {
    node.nodeValue = text
  },
  setElementText: (el, text) => {
    el.textContent = text
  },
  parentNode: node => node.parentNode,
  nextSibling: node => node.nextSibling,
  querySelector: selector => doc.querySelector(selector),
  setScopeId(el, id) {
    el.setAttribute(id, '')
  },
  cloneNode(el) {
    return el.cloneNode(true)
  },
  // __UNSAFE__
  // Reason: innerHTML.
  // Static content here can only come from compiled templates.
  // As long as the user only uses trusted templates, this is safe.
  insertStaticContent(content, parent, anchor, isSVG) {
    const temp = isSVG
      ? tempSVGContainer ||
        (tempSVGContainer = doc.createElementNS(svgNS, 'svg'))
      : tempContainer || (tempContainer = doc.createElement('div'))
    temp.innerHTML = content
    const first = temp.firstChild
    let node = first
    let last = node
    while (node) {
      last = node
      nodeOps.insert(node, parent, anchor)
      node = temp.firstChild
    }
    return [first, last]
  }
}

// compiler should normalize class + :class bindings on the same element
// into a single binding ['staticClass', dynamic]
function patchClass(el, value, isSVG) {
  if (value == null) {
    value = ''
  }
  if (isSVG) {
    el.setAttribute('class', value)
  } else {
    // directly setting className should be faster than setAttribute in theory
    // if this is an element during a transition, take the temporary transition
    // classes into account.
    const transitionClasses = el._vtc
    if (transitionClasses) {
      value = (value
        ? [value, ...transitionClasses]
        : [...transitionClasses]
      ).join(' ')
    }
    el.className = value
  }
}

function patchStyle(el, prev, next) {
  const style = el.style
  if (!next) {
    el.removeAttribute('style')
  } else if (isString(next)) {
    style.cssText = next
  } else {
    for (const key in next) {
      setStyle(style, key, next[key])
    }
    if (prev && !isString(prev)) {
      for (const key in prev) {
        if (!next[key]) {
          setStyle(style, key, '')
        }
      }
    }
  }
}
const importantRE = /\s*!important$/
function setStyle(style, name, val) {
  if (name.startsWith('--')) {
    // custom property definition
    style.setProperty(name, val)
  } else {
    const prefixed = autoPrefix(style, name)
    if (importantRE.test(val)) {
      // !important
      style.setProperty(
        hyphenate(prefixed),
        val.replace(importantRE, ''),
        'important'
      )
    } else {
      style[prefixed] = val
    }
  }
}
const prefixes = ['Webkit', 'Moz', 'ms']
const prefixCache = {}
function autoPrefix(style, rawName) {
  const cached = prefixCache[rawName]
  if (cached) {
    return cached
  }
  let name = _camelize(rawName)
  if (name !== 'filter' && name in style) {
    return (prefixCache[rawName] = name)
  }
  name = capitalize(name)
  for (let i = 0; i < prefixes.length; i++) {
    const prefixed = prefixes[i] + name
    if (prefixed in style) {
      return (prefixCache[rawName] = prefixed)
    }
  }
  return rawName
}

const xlinkNS = 'http://www.w3.org/1999/xlink'
function patchAttr(el, key, value, isSVG) {
  if (isSVG && key.startsWith('xlink:')) {
    if (value == null) {
      el.removeAttributeNS(xlinkNS, key.slice(6, key.length))
    } else {
      el.setAttributeNS(xlinkNS, key, value)
    }
  } else {
    // note we are only checking boolean attributes that don't have a
    // corresponding dom prop of the same name here.
    const isBoolean = isSpecialBooleanAttr(key)
    if (value == null || (isBoolean && value === false)) {
      el.removeAttribute(key)
    } else {
      el.setAttribute(key, isBoolean ? '' : value)
    }
  }
}

// __UNSAFE__
// functions. The user is reponsible for using them with only trusted content.
function patchDOMProp(
  el,
  key,
  value,
  // the following args are passed only due to potential innerHTML/textContent
  // overriding existing VNodes, in which case the old tree must be properly
  // unmounted.
  prevChildren,
  parentComponent,
  parentSuspense,
  unmountChildren
) {
  if (key === 'innerHTML' || key === 'textContent') {
    if (prevChildren) {
      unmountChildren(prevChildren, parentComponent, parentSuspense)
    }
    el[key] = value == null ? '' : value
    return
  }
  if (key === 'value' && el.tagName !== 'PROGRESS') {
    // store value as _value as well since
    // non-string values will be stringified.
    el._value = value
    el.value = value == null ? '' : value
    return
  }
  if (value === '' && typeof el[key] === 'boolean') {
    // e.g. <select multiple> compiles to { multiple: '' }
    el[key] = true
  } else if (value == null && typeof el[key] === 'string') {
    // e.g. <div :id="null">
    el[key] = ''
  } else {
    // some properties perform value validation and throw
    try {
      el[key] = value
    } catch (e) {}
  }
}

// Async edge case fix requires storing an event listener's attach timestamp.
let _getNow = Date.now
// Determine what event timestamp the browser is using. Annoyingly, the
// timestamp can either be hi-res ( relative to page load) or low-res
// (relative to UNIX epoch), so in order to compare time we have to use the
// same timestamp type when saving the flush timestamp.
if (
  typeof document !== 'undefined' &&
  _getNow() > document.createEvent('Event').timeStamp
) {
  // if the low-res timestamp which is bigger than the event timestamp
  // (which is evaluated AFTER) it means the event is using a hi-res timestamp,
  // and we need to use the hi-res version for event listeners as well.
  _getNow = () => performance.now()
}
// To avoid the overhead of repeatedly calling performance.now(), we cache
// and use the same timestamp for all event listeners attached in the same tick.
let cachedNow = 0
const p$1 = Promise.resolve()
const reset = () => {
  cachedNow = 0
}
const getNow = () => cachedNow || (p$1.then(reset), (cachedNow = _getNow()))
function addEventListener(el, event, handler, options) {
  el.addEventListener(event, handler, options)
}
function removeEventListener(el, event, handler, options) {
  el.removeEventListener(event, handler, options)
}
function patchEvent(el, rawName, prevValue, nextValue, instance = null) {
  const name = rawName.slice(2).toLowerCase()
  const prevOptions = prevValue && 'options' in prevValue && prevValue.options
  const nextOptions = nextValue && 'options' in nextValue && nextValue.options
  const invoker = prevValue && prevValue.invoker
  const value =
    nextValue && 'handler' in nextValue ? nextValue.handler : nextValue
  if (prevOptions || nextOptions) {
    const prev = prevOptions || EMPTY_OBJ
    const next = nextOptions || EMPTY_OBJ
    if (
      prev.capture !== next.capture ||
      prev.passive !== next.passive ||
      prev.once !== next.once
    ) {
      if (invoker) {
        removeEventListener(el, name, invoker, prev)
      }
      if (nextValue && value) {
        const invoker = createInvoker(value, instance)
        nextValue.invoker = invoker
        addEventListener(el, name, invoker, next)
      }
      return
    }
  }
  if (nextValue && value) {
    if (invoker) {
      prevValue.invoker = null
      invoker.value = value
      nextValue.invoker = invoker
      invoker.lastUpdated = getNow()
    } else {
      addEventListener(
        el,
        name,
        createInvoker(value, instance),
        nextOptions || void 0
      )
    }
  } else if (invoker) {
    removeEventListener(el, name, invoker, prevOptions || void 0)
  }
}
function createInvoker(initialValue, instance) {
  const invoker = e => {
    // async edge case #6566: inner click event triggers patch, event handler
    // attached to outer element during patch, and triggered again. This
    // happens because browsers fire microtask ticks between event propagation.
    // the solution is simple: we save the timestamp when a handler is attached,
    // and the handler would only fire if the event passed to it was fired
    // AFTER it was attached.
    if (e.timeStamp >= invoker.lastUpdated - 1) {
      callWithAsyncErrorHandling(
        patchStopImmediatePropagation(e, invoker.value),
        instance,
        5 /* NATIVE_EVENT_HANDLER */,
        [e]
      )
    }
  }
  invoker.value = initialValue
  initialValue.invoker = invoker
  invoker.lastUpdated = getNow()
  return invoker
}
function patchStopImmediatePropagation(e, value) {
  if (isArray(value)) {
    const originalStop = e.stopImmediatePropagation
    e.stopImmediatePropagation = () => {
      originalStop.call(e)
      e._stopped = true
    }
    return value.map(fn => e => !e._stopped && fn(e))
  } else {
    return value
  }
}

const nativeOnRE = /^on[a-z]/
const patchProp = (
  el,
  key,
  prevValue,
  nextValue,
  isSVG = false,
  prevChildren,
  parentComponent,
  parentSuspense,
  unmountChildren
) => {
  switch (key) {
    // special
    case 'class':
      patchClass(el, nextValue, isSVG)
      break
    case 'style':
      patchStyle(el, prevValue, nextValue)
      break
    default:
      if (isOn(key)) {
        // ignore v-model listeners
        if (!key.startsWith('onUpdate:')) {
          patchEvent(el, key, prevValue, nextValue, parentComponent)
        }
      } else if (
        isSVG
          ? // most keys must be set as attribute on svg elements to work
            // ...except innerHTML
            key === 'innerHTML' ||
            // or native onclick with function values
            (key in el && nativeOnRE.test(key) && isFunction(nextValue))
          : // for normal html elements, set as a property if it exists
            key in el &&
            // except native onclick with string values
            !(nativeOnRE.test(key) && isString(nextValue))
      ) {
        patchDOMProp(
          el,
          key,
          nextValue,
          prevChildren,
          parentComponent,
          parentSuspense,
          unmountChildren
        )
      } else {
        // special case for <input v-model type="checkbox"> with
        // :true-value & :false-value
        // store value as dom properties since non-string values will be
        // stringified.
        if (key === 'true-value') {
          el._trueValue = nextValue
        } else if (key === 'false-value') {
          el._falseValue = nextValue
        }
        patchAttr(el, key, nextValue, isSVG)
      }
      break
  }
}

const getModelAssigner = vnode => {
  const fn = vnode.props['onUpdate:modelValue']
  return isArray(fn) ? value => invokeArrayFns(fn, value) : fn
}
/**
 * @internal
 */
const vModelSelect = {
  // use mounted & updated because <select> relies on its children <option>s.
  mounted(el, { value }, vnode) {
    setSelected(el, value)
    el._assign = getModelAssigner(vnode)
    addEventListener(el, 'change', () => {
      const selectedVal = Array.prototype.filter
        .call(el.options, o => o.selected)
        .map(getValue)
      el._assign(el.multiple ? selectedVal : selectedVal[0])
    })
  },
  beforeUpdate(el, _binding, vnode) {
    el._assign = getModelAssigner(vnode)
  },
  updated(el, { value }) {
    setSelected(el, value)
  }
}
function setSelected(el, value) {
  const isMultiple = el.multiple
  if (isMultiple && !isArray(value)) {
    return
  }
  for (let i = 0, l = el.options.length; i < l; i++) {
    const option = el.options[i]
    const optionValue = getValue(option)
    if (isMultiple) {
      option.selected = looseIndexOf(value, optionValue) > -1
    } else {
      if (looseEqual(getValue(option), value)) {
        el.selectedIndex = i
        return
      }
    }
  }
  if (!isMultiple) {
    el.selectedIndex = -1
  }
}
// retrieve raw value set via :value bindings
function getValue(el) {
  return '_value' in el ? el._value : el.value
}

const rendererOptions = {
  patchProp,
  ...nodeOps
}
// lazy create the renderer - this makes core renderer logic tree-shakable
// in case the user only imports reactivity utilities from Vue.
let renderer
function ensureRenderer() {
  return renderer || (renderer = createRenderer(rendererOptions))
}
const createApp = (...args) => {
  const app = ensureRenderer().createApp(...args)
  const { mount } = app
  app.mount = containerOrSelector => {
    const container = normalizeContainer(containerOrSelector)
    if (!container) return
    const component = app._component
    if (!isFunction(component) && !component.render && !component.template) {
      component.template = container.innerHTML
    }
    // clear content before mounting
    container.innerHTML = ''
    const proxy = mount(container)
    container.removeAttribute('v-cloak')
    return proxy
  }
  return app
}
function normalizeContainer(container) {
  if (isString(container)) {
    const res = document.querySelector(container)
    return res
  }
  return container
}

/*!
 * vue-i18n v9.0.0-alpha.10
 * (c) 2020 kazuya kawaguchi
 * Released under the MIT License.
 */
/* eslint-enable @typescript-eslint/no-explicit-any */
const generateFormatCacheKey = (locale, key, source) =>
  friendlyJSONstringify({ l: locale, k: key, s: source })
const friendlyJSONstringify = json =>
  JSON.stringify(json)
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
    .replace(/\u0027/g, '\\u0027')
const isNumber = val => typeof val === 'number' && isFinite(val)
const isDate = val => toTypeString$1(val) === '[object Date]'
const isRegExp = val => toTypeString$1(val) === '[object RegExp]'
const isEmptyObject = val =>
  isPlainObject$1(val) && Object.keys(val).length === 0
function warn$1(msg, err) {
  if (typeof console !== 'undefined') {
    console.warn('[vue-i18n] ' + msg)
    /* istanbul ignore if */
    if (err) {
      console.warn(err.stack)
    }
  }
}
/**
 * Useful Utilites By Evan you
 * Modified by kazuya kawaguchi
 * MIT License
 * https://github.com/vuejs/vue-next/blob/master/packages/shared/src/index.ts
 * https://github.com/vuejs/vue-next/blob/master/packages/shared/src/codeframe.ts
 */
const isArray$1 = Array.isArray
const isFunction$1 = val => typeof val === 'function'
const isString$1 = val => typeof val === 'string'
const isBoolean = val => typeof val === 'boolean'
const isObject$1 = (
  val // eslint-disable-line
) => val !== null && typeof val === 'object'
const objectToString$1 = Object.prototype.toString
const toTypeString$1 = value => objectToString$1.call(value)
const isPlainObject$1 = val => toTypeString$1(val) === '[object Object]'
// for converting list and named values to displayed strings.
const toDisplayString$1 = val => {
  return val == null
    ? ''
    : isArray$1(val) ||
      (isPlainObject$1(val) && val.toString === objectToString$1)
    ? JSON.stringify(val, null, 2)
    : String(val)
}

function createPosition(line, column, offset) {
  return { line, column, offset }
}
function createLocation(start, end, source) {
  const loc = { start, end }
  if (source != null) {
    loc.source = source
  }
  return loc
}
function createCompileError(code, loc, optinos = {}) {
  const { domain, messages, args } = optinos
  const msg = code
  const error = new SyntaxError(String(msg))
  error.code = code
  if (loc) {
    error.location = loc
  }
  error.domain = domain
  return error
}
function defaultOnError(error) {
  throw error
}

const CHAR_SP = ' '
const CHAR_CR = '\r'
const CHAR_LF = '\n'
const CHAR_LS = String.fromCharCode(0x2028)
const CHAR_PS = String.fromCharCode(0x2029)
function createScanner(str) {
  const _buf = str
  let _index = 0
  let _line = 1
  let _column = 1
  let _peekOffset = 0
  const isCRLF = index => _buf[index] === CHAR_CR && _buf[index + 1] === CHAR_LF
  const isLF = index => _buf[index] === CHAR_LF
  const isPS = index => _buf[index] === CHAR_PS
  const isLS = index => _buf[index] === CHAR_LS
  const isLineEnd = index =>
    isCRLF(index) || isLF(index) || isPS(index) || isLS(index)
  const index = () => _index
  const line = () => _line
  const column = () => _column
  const peekOffset = () => _peekOffset
  const charAt = offset =>
    isCRLF(offset) || isPS(offset) || isLS(offset) ? CHAR_LF : _buf[offset]
  const currentChar = () => charAt(_index)
  const currentPeek = () => charAt(_index + _peekOffset)
  function next() {
    _peekOffset = 0
    if (isLineEnd(_index)) {
      _line++
      _column = 0
    }
    if (isCRLF(_index)) {
      _index++
    }
    _index++
    _column++
    return _buf[_index]
  }
  function peek() {
    if (isCRLF(_index + _peekOffset)) {
      _peekOffset++
    }
    _peekOffset++
    return _buf[_index + _peekOffset]
  }
  function reset() {
    _index = 0
    _line = 1
    _column = 1
    _peekOffset = 0
  }
  function resetPeek(offset = 0) {
    _peekOffset = offset
  }
  function skipToPeek() {
    const target = _index + _peekOffset
    // eslint-disable-next-line no-unmodified-loop-condition
    while (target !== _index) {
      next()
    }
    _peekOffset = 0
  }
  return {
    index,
    line,
    column,
    peekOffset,
    charAt,
    currentChar,
    currentPeek,
    next,
    peek,
    reset,
    resetPeek,
    skipToPeek
  }
}

const EOF = undefined
const LITERAL_DELIMITER = "'"
const ERROR_DOMAIN = 'tokenizer'
function createTokenizer(source, options = {}) {
  const location = !options.location
  const _scnr = createScanner(source)
  const currentOffset = () => _scnr.index()
  const currentPosition = () =>
    createPosition(_scnr.line(), _scnr.column(), _scnr.index())
  const _initLoc = currentPosition()
  const _initOffset = currentOffset()
  const _context = {
    currentType: 14 /* EOF */,
    offset: _initOffset,
    startLoc: _initLoc,
    endLoc: _initLoc,
    lastType: 14 /* EOF */,
    lastOffset: _initOffset,
    lastStartLoc: _initLoc,
    lastEndLoc: _initLoc,
    braceNest: 0,
    inLinked: false
  }
  const context = () => _context
  const { onError } = options
  function emitError(code, pos, offset, ...args) {
    const ctx = context()
    pos.column += offset
    pos.offset += offset
    if (onError) {
      const loc = createLocation(ctx.startLoc, pos)
      const err = createCompileError(code, loc, {
        domain: ERROR_DOMAIN,
        args
      })
      onError(err)
    }
  }
  function getToken(context, type, value) {
    context.endLoc = currentPosition()
    context.currentType = type
    const token = { type }
    if (location) {
      token.loc = createLocation(context.startLoc, context.endLoc)
    }
    if (value != null) {
      token.value = value
    }
    return token
  }
  const getEndToken = context => getToken(context, 14 /* EOF */)
  function eat(scnr, ch) {
    if (scnr.currentChar() === ch) {
      scnr.next()
      return ch
    } else {
      emitError(0 /* EXPECTED_TOKEN */, currentPosition(), 0, ch)
      return ''
    }
  }
  function peekSpaces(scnr) {
    let buf = ''
    while (scnr.currentPeek() === CHAR_SP || scnr.currentPeek() === CHAR_LF) {
      buf += scnr.currentPeek()
      scnr.peek()
    }
    return buf
  }
  function skipSpaces(scnr) {
    const buf = peekSpaces(scnr)
    scnr.skipToPeek()
    return buf
  }
  function isIdentifierStart(ch) {
    if (ch === EOF) {
      return false
    }
    const cc = ch.charCodeAt(0)
    return (
      (cc >= 97 && cc <= 122) || // a-z
      (cc >= 65 && cc <= 90)
    ) // A-Z
  }
  function isNumberStart(ch) {
    if (ch === EOF) {
      return false
    }
    const cc = ch.charCodeAt(0)
    return cc >= 48 && cc <= 57 // 0-9
  }
  function isNamedIdentifierStart(scnr, context) {
    const { currentType } = context
    if (currentType !== 2 /* BraceLeft */) {
      return false
    }
    peekSpaces(scnr)
    const ret = isIdentifierStart(scnr.currentPeek())
    scnr.resetPeek()
    return ret
  }
  function isListIdentifierStart(scnr, context) {
    const { currentType } = context
    if (currentType !== 2 /* BraceLeft */) {
      return false
    }
    peekSpaces(scnr)
    const ch = scnr.currentPeek() === '-' ? scnr.peek() : scnr.currentPeek()
    const ret = isNumberStart(ch)
    scnr.resetPeek()
    return ret
  }
  function isLiteralStart(scnr, context) {
    const { currentType } = context
    if (currentType !== 2 /* BraceLeft */) {
      return false
    }
    peekSpaces(scnr)
    const ret = scnr.currentPeek() === LITERAL_DELIMITER
    scnr.resetPeek()
    return ret
  }
  function isLinkedDotStart(scnr, context) {
    const { currentType } = context
    if (currentType !== 8 /* LinkedAlias */) {
      return false
    }
    peekSpaces(scnr)
    const ret = scnr.currentPeek() === '.' /* LinkedDot */
    scnr.resetPeek()
    return ret
  }
  function isLinkedModifierStart(scnr, context) {
    const { currentType } = context
    if (currentType !== 9 /* LinkedDot */) {
      return false
    }
    peekSpaces(scnr)
    const ret = isIdentifierStart(scnr.currentPeek())
    scnr.resetPeek()
    return ret
  }
  function isLinkedDelimiterStart(scnr, context) {
    const { currentType } = context
    if (
      !(
        (
          currentType === 8 /* LinkedAlias */ || currentType === 12
        ) /* LinkedModifier */
      )
    ) {
      return false
    }
    peekSpaces(scnr)
    const ret = scnr.currentPeek() === ':' /* LinkedDelimiter */
    scnr.resetPeek()
    return ret
  }
  function isLinkedReferStart(scnr, context) {
    const { currentType } = context
    if (currentType !== 10 /* LinkedDelimiter */) {
      return false
    }
    const fn = () => {
      const ch = scnr.currentPeek()
      if (ch === '{' /* BraceLeft */) {
        return isIdentifierStart(scnr.peek())
      } else if (
        ch === '@' /* LinkedAlias */ ||
        ch === '%' /* Modulo */ ||
        ch === '|' /* Pipe */ ||
        ch === ':' /* LinkedDelimiter */ ||
        ch === '.' /* LinkedDot */ ||
        ch === CHAR_SP ||
        !ch
      ) {
        return false
      } else if (ch === CHAR_LF) {
        scnr.peek()
        return fn()
      } else {
        // other charactors
        return isIdentifierStart(ch)
      }
    }
    const ret = fn()
    scnr.resetPeek()
    return ret
  }
  function isPluralStart(scnr) {
    peekSpaces(scnr)
    const ret = scnr.currentPeek() === '|' /* Pipe */
    scnr.resetPeek()
    return ret
  }
  function isTextStart(scnr) {
    const fn = (hasSpace = false) => {
      const ch = scnr.currentPeek()
      if (
        ch === '{' /* BraceLeft */ ||
        ch === '}' /* BraceRight */ ||
        ch === '%' /* Modulo */ ||
        ch === '@' /* LinkedAlias */ ||
        !ch
      ) {
        return hasSpace
      } else if (ch === '|' /* Pipe */) {
        return false
      } else if (ch === CHAR_SP) {
        scnr.peek()
        return fn(true)
      } else if (ch === CHAR_LF) {
        scnr.peek()
        return fn(true)
      } else {
        return true
      }
    }
    const ret = fn()
    scnr.resetPeek()
    return ret
  }
  function takeChar(scnr, fn) {
    const ch = scnr.currentChar()
    if (ch === EOF) {
      return EOF
    }
    if (fn(ch)) {
      scnr.next()
      return ch
    }
    return null
  }
  function takeIdentifierChar(scnr) {
    const closure = ch => {
      const cc = ch.charCodeAt(0)
      return (
        (cc >= 97 && cc <= 122) || // a-z
        (cc >= 65 && cc <= 90) || // A-Z
        (cc >= 48 && cc <= 57) || // 0-9
        cc === 95 ||
        cc === 36
      ) // _ $
    }
    return takeChar(scnr, closure)
  }
  function takeDigit(scnr) {
    const closure = ch => {
      const cc = ch.charCodeAt(0)
      return cc >= 48 && cc <= 57 // 0-9
    }
    return takeChar(scnr, closure)
  }
  function takeHexDigit(scnr) {
    const closure = ch => {
      const cc = ch.charCodeAt(0)
      return (
        (cc >= 48 && cc <= 57) || // 0-9
        (cc >= 65 && cc <= 70) || // A-F
        (cc >= 97 && cc <= 102)
      ) // a-f
    }
    return takeChar(scnr, closure)
  }
  function getDigits(scnr) {
    let ch = ''
    let num = ''
    while ((ch = takeDigit(scnr))) {
      num += ch
    }
    return num
  }
  function readText(scnr) {
    const fn = buf => {
      const ch = scnr.currentChar()
      if (
        ch === '{' /* BraceLeft */ ||
        ch === '}' /* BraceRight */ ||
        ch === '%' /* Modulo */ ||
        ch === '@' /* LinkedAlias */ ||
        ch === EOF
      ) {
        return buf
      } else if (ch === CHAR_SP || ch === CHAR_LF) {
        if (isPluralStart(scnr)) {
          return buf
        } else {
          buf += ch
          scnr.next()
          return fn(buf)
        }
      } else {
        buf += ch
        scnr.next()
        return fn(buf)
      }
    }
    return fn('')
  }
  function readNamedIdentifier(scnr) {
    skipSpaces(scnr)
    let ch = ''
    let name = ''
    while ((ch = takeIdentifierChar(scnr))) {
      name += ch
    }
    if (scnr.currentChar() === EOF) {
      emitError(6 /* UNTERMINATED_CLOSING_BRACE */, currentPosition(), 0)
    }
    return name
  }
  function readListIdentifier(scnr) {
    skipSpaces(scnr)
    let value = ''
    if (scnr.currentChar() === '-') {
      scnr.next()
      value += `-${getDigits(scnr)}`
    } else {
      value += getDigits(scnr)
    }
    if (scnr.currentChar() === EOF) {
      emitError(6 /* UNTERMINATED_CLOSING_BRACE */, currentPosition(), 0)
    }
    return value
  }
  function readLiteral(scnr) {
    skipSpaces(scnr)
    eat(scnr, `\'`)
    let ch = ''
    let literal = ''
    const fn = x => x !== LITERAL_DELIMITER && x !== CHAR_LF
    while ((ch = takeChar(scnr, fn))) {
      if (ch === '\\') {
        literal += readEscapeSequence(scnr)
      } else {
        literal += ch
      }
    }
    const current = scnr.currentChar()
    if (current === CHAR_LF || current === EOF) {
      emitError(
        2 /* UNTERMINATED_SINGLE_QUOTE_IN_PLACEHOLDER */,
        currentPosition(),
        0
      )
      // TODO: Is it correct really?
      if (current === CHAR_LF) {
        scnr.next()
        eat(scnr, `\'`)
      }
      return literal
    }
    eat(scnr, `\'`)
    return literal
  }
  function readEscapeSequence(scnr) {
    const ch = scnr.currentChar()
    switch (ch) {
      case '\\':
      case `\'`:
        scnr.next()
        return `\\${ch}`
      case 'u':
        return readUnicodeEscapeSequence(scnr, ch, 4)
      case 'U':
        return readUnicodeEscapeSequence(scnr, ch, 6)
      default:
        emitError(3 /* UNKNOWN_ESCAPE_SEQUENCE */, currentPosition(), 0, ch)
        return ''
    }
  }
  function readUnicodeEscapeSequence(scnr, unicode, digits) {
    eat(scnr, unicode)
    let sequence = ''
    for (let i = 0; i < digits; i++) {
      const ch = takeHexDigit(scnr)
      if (!ch) {
        emitError(
          4 /* INVALID_UNICODE_ESCAPE_SEQUENCE */,
          currentPosition(),
          0,
          `\\${unicode}${sequence}${scnr.currentChar()}`
        )
        break
      }
      sequence += ch
    }
    return `\\${unicode}${sequence}`
  }
  function readInvalidIdentifier(scnr) {
    skipSpaces(scnr)
    let ch = ''
    let identifiers = ''
    const closure = ch =>
      ch !== '{' /* BraceLeft */ &&
      ch !== '}' /* BraceRight */ &&
      ch !== CHAR_SP &&
      ch !== CHAR_LF
    while ((ch = takeChar(scnr, closure))) {
      identifiers += ch
    }
    return identifiers
  }
  function readLinkedModifier(scnr) {
    let ch = ''
    let name = ''
    while ((ch = takeIdentifierChar(scnr))) {
      name += ch
    }
    return name
  }
  function readLinkedRefer(scnr) {
    const fn = (detect = false, buf) => {
      const ch = scnr.currentChar()
      if (
        ch === '{' /* BraceLeft */ ||
        ch === '%' /* Modulo */ ||
        ch === '@' /* LinkedAlias */ ||
        ch === '|' /* Pipe */ ||
        !ch
      ) {
        return buf
      } else if (ch === CHAR_SP) {
        return buf
      } else if (ch === CHAR_LF) {
        buf += ch
        scnr.next()
        return fn(detect, buf)
      } else {
        buf += ch
        scnr.next()
        return fn(true, buf)
      }
    }
    return fn(false, '')
  }
  function readPlural(scnr) {
    skipSpaces(scnr)
    const plural = eat(scnr, '|' /* Pipe */)
    skipSpaces(scnr)
    return plural
  }
  // TODO: We need refactoring of token parsing ...
  function readTokenInPlaceholder(scnr, context) {
    let token = null
    const ch = scnr.currentChar()
    switch (ch) {
      case '{' /* BraceLeft */:
        if (context.braceNest >= 1) {
          emitError(8 /* NOT_ALLOW_NEST_PLACEHOLDER */, currentPosition(), 0)
        }
        scnr.next()
        token = getToken(context, 2 /* BraceLeft */, '{' /* BraceLeft */)
        skipSpaces(scnr)
        context.braceNest++
        return token
      case '}' /* BraceRight */:
        if (
          context.braceNest > 0 &&
          context.currentType === 2 /* BraceLeft */
        ) {
          emitError(7 /* EMPTY_PLACEHOLDER */, currentPosition(), 0)
        }
        scnr.next()
        token = getToken(context, 3 /* BraceRight */, '}' /* BraceRight */)
        context.braceNest--
        context.braceNest > 0 && skipSpaces(scnr)
        if (context.inLinked && context.braceNest === 0) {
          context.inLinked = false
        }
        return token
      case '@' /* LinkedAlias */:
        if (context.braceNest > 0) {
          emitError(6 /* UNTERMINATED_CLOSING_BRACE */, currentPosition(), 0)
        }
        token = readTokenInLinked(scnr, context) || getEndToken(context)
        context.braceNest = 0
        return token
      default:
        let validNamedIdentifier = true
        let validListIdentifier = true
        let validLeteral = true
        if (isPluralStart(scnr)) {
          if (context.braceNest > 0) {
            emitError(6 /* UNTERMINATED_CLOSING_BRACE */, currentPosition(), 0)
          }
          token = getToken(context, 1 /* Pipe */, readPlural(scnr))
          // reset
          context.braceNest = 0
          context.inLinked = false
          return token
        }
        if (
          context.braceNest > 0 &&
          (context.currentType === 5 /* Named */ ||
          context.currentType === 6 /* List */ ||
            context.currentType === 7) /* Literal */
        ) {
          emitError(6 /* UNTERMINATED_CLOSING_BRACE */, currentPosition(), 0)
          context.braceNest = 0
          return readToken(scnr, context)
        }
        if ((validNamedIdentifier = isNamedIdentifierStart(scnr, context))) {
          token = getToken(context, 5 /* Named */, readNamedIdentifier(scnr))
          skipSpaces(scnr)
          return token
        }
        if ((validListIdentifier = isListIdentifierStart(scnr, context))) {
          token = getToken(context, 6 /* List */, readListIdentifier(scnr))
          skipSpaces(scnr)
          return token
        }
        if ((validLeteral = isLiteralStart(scnr, context))) {
          token = getToken(context, 7 /* Literal */, readLiteral(scnr))
          skipSpaces(scnr)
          return token
        }
        if (!validNamedIdentifier && !validListIdentifier && !validLeteral) {
          // TODO: we should be re-designed invalid cases, when we will extend message syntax near the future ...
          token = getToken(
            context,
            13 /* InvalidPlace */,
            readInvalidIdentifier(scnr)
          )
          emitError(
            1 /* INVALID_TOKEN_IN_PLACEHOLDER */,
            currentPosition(),
            0,
            token.value
          )
          skipSpaces(scnr)
          return token
        }
        break
    }
    return token
  }
  // TODO: We need refactoring of token parsing ...
  function readTokenInLinked(scnr, context) {
    const { currentType } = context
    let token = null
    const ch = scnr.currentChar()
    if (
      (currentType === 8 /* LinkedAlias */ ||
      currentType === 9 /* LinkedDot */ ||
      currentType === 12 /* LinkedModifier */ ||
        currentType === 10) /* LinkedDelimiter */ &&
      (ch === CHAR_LF || ch === CHAR_SP)
    ) {
      emitError(9 /* INVALID_LINKED_FORMAT */, currentPosition(), 0)
    }
    switch (ch) {
      case '@' /* LinkedAlias */:
        scnr.next()
        token = getToken(context, 8 /* LinkedAlias */, '@' /* LinkedAlias */)
        context.inLinked = true
        return token
      case '.' /* LinkedDot */:
        skipSpaces(scnr)
        scnr.next()
        return getToken(context, 9 /* LinkedDot */, '.' /* LinkedDot */)
      case ':' /* LinkedDelimiter */:
        skipSpaces(scnr)
        scnr.next()
        return getToken(
          context,
          10 /* LinkedDelimiter */,
          ':' /* LinkedDelimiter */
        )
      default:
        if (isPluralStart(scnr)) {
          token = getToken(context, 1 /* Pipe */, readPlural(scnr))
          // reset
          context.braceNest = 0
          context.inLinked = false
          return token
        }
        if (
          isLinkedDotStart(scnr, context) ||
          isLinkedDelimiterStart(scnr, context)
        ) {
          skipSpaces(scnr)
          return readTokenInLinked(scnr, context)
        }
        if (isLinkedModifierStart(scnr, context)) {
          skipSpaces(scnr)
          return getToken(
            context,
            12 /* LinkedModifier */,
            readLinkedModifier(scnr)
          )
        }
        if (isLinkedReferStart(scnr, context)) {
          skipSpaces(scnr)
          if (ch === '{' /* BraceLeft */) {
            // scan the placeholder
            return readTokenInPlaceholder(scnr, context) || token
          } else {
            return getToken(context, 11 /* LinkedKey */, readLinkedRefer(scnr))
          }
        }
        if (currentType === 8 /* LinkedAlias */) {
          emitError(9 /* INVALID_LINKED_FORMAT */, currentPosition(), 0)
        }
        context.braceNest = 0
        context.inLinked = false
        return readToken(scnr, context)
    }
  }
  // TODO: We need refactoring of token parsing ...
  function readToken(scnr, context) {
    let token = { type: 14 /* EOF */ }
    if (context.braceNest > 0) {
      return readTokenInPlaceholder(scnr, context) || getEndToken(context)
    }
    if (context.inLinked) {
      return readTokenInLinked(scnr, context) || getEndToken(context)
    }
    const ch = scnr.currentChar()
    switch (ch) {
      case '{' /* BraceLeft */:
        return readTokenInPlaceholder(scnr, context) || getEndToken(context)
      case '}' /* BraceRight */:
        emitError(5 /* UNBALANCED_CLOSING_BRACE */, currentPosition(), 0)
        scnr.next()
        return getToken(context, 3 /* BraceRight */, '}' /* BraceRight */)
      case '@' /* LinkedAlias */:
        return readTokenInLinked(scnr, context) || getEndToken(context)
      case '%' /* Modulo */:
        scnr.next()
        return getToken(context, 4 /* Modulo */, '%' /* Modulo */)
      default:
        if (isPluralStart(scnr)) {
          token = getToken(context, 1 /* Pipe */, readPlural(scnr))
          // reset
          context.braceNest = 0
          context.inLinked = false
          return token
        }
        if (isTextStart(scnr)) {
          return getToken(context, 0 /* Text */, readText(scnr))
        }
        break
    }
    return token
  }
  function nextToken() {
    const { currentType, offset, startLoc, endLoc } = _context
    _context.lastType = currentType
    _context.lastOffset = offset
    _context.lastStartLoc = startLoc
    _context.lastEndLoc = endLoc
    _context.offset = currentOffset()
    _context.startLoc = currentPosition()
    if (_scnr.currentChar() === EOF) {
      return getToken(_context, 14 /* EOF */)
    }
    return readToken(_scnr, _context)
  }
  return {
    nextToken,
    currentOffset,
    currentPosition,
    context
  }
}

const ERROR_DOMAIN$1 = 'parser'
// Backslash backslash, backslash quote, uHHHH, UHHHHHH.
const KNOWN_ESCAPES = /(?:\\\\|\\'|\\u([0-9a-fA-F]{4})|\\U([0-9a-fA-F]{6}))/g
function fromEscapeSequence(match, codePoint4, codePoint6) {
  switch (match) {
    case `\\\\`:
      return `\\`
    case `\\\'`:
      return `\'`
    default: {
      const codePoint = parseInt(codePoint4 || codePoint6, 16)
      if (codePoint <= 0xd7ff || codePoint >= 0xe000) {
        return String.fromCodePoint(codePoint)
      }
      // invalid ...
      // Replace them with U+FFFD REPLACEMENT CHARACTER.
      return '�'
    }
  }
}
function createParser(options = {}) {
  const location = !options.location
  const { onError } = options
  function emitError(tokenzer, code, start, offset, ...args) {
    const end = tokenzer.currentPosition()
    end.offset += offset
    end.column += offset
    if (onError) {
      const loc = createLocation(start, end)
      const err = createCompileError(code, loc, {
        domain: ERROR_DOMAIN$1,
        args
      })
      onError(err)
    }
  }
  function startNode(type, offset, loc) {
    const node = {
      type,
      start: offset,
      end: offset
    }
    if (location) {
      node.loc = { start: loc, end: loc }
    }
    return node
  }
  function endNode(node, offset, pos, type) {
    node.end = offset
    if (type) {
      node.type = type
    }
    if (location && node.loc) {
      node.loc.end = pos
    }
  }
  function parseText(tokenizer, value) {
    const context = tokenizer.context()
    const node = startNode(3 /* Text */, context.offset, context.startLoc)
    node.value = value
    endNode(node, tokenizer.currentOffset(), tokenizer.currentPosition())
    return node
  }
  function parseList(tokenizer, index) {
    const context = tokenizer.context()
    const { lastOffset: offset, lastStartLoc: loc } = context // get brace left loc
    const node = startNode(5 /* List */, offset, loc)
    node.index = parseInt(index, 10)
    tokenizer.nextToken() // skip brach right
    endNode(node, tokenizer.currentOffset(), tokenizer.currentPosition())
    return node
  }
  function parseNamed(tokenizer, key) {
    const context = tokenizer.context()
    const { lastOffset: offset, lastStartLoc: loc } = context // get brace left loc
    const node = startNode(4 /* Named */, offset, loc)
    node.key = key
    tokenizer.nextToken() // skip brach right
    endNode(node, tokenizer.currentOffset(), tokenizer.currentPosition())
    return node
  }
  function parseLiteral(tokenizer, value) {
    const context = tokenizer.context()
    const { lastOffset: offset, lastStartLoc: loc } = context // get brace left loc
    const node = startNode(9 /* Literal */, offset, loc)
    node.value = value.replace(KNOWN_ESCAPES, fromEscapeSequence)
    tokenizer.nextToken() // skip brach right
    endNode(node, tokenizer.currentOffset(), tokenizer.currentPosition())
    return node
  }
  function parseLinkedModifier(tokenizer) {
    const token = tokenizer.nextToken()
    const context = tokenizer.context()
    // check token
    if (token.value == null) {
      emitError(
        tokenizer,
        11 /* UNEXPECTED_LEXICAL_ANALYSIS */,
        context.lastStartLoc,
        0,
        token.type
      )
    }
    const { lastOffset: offset, lastStartLoc: loc } = context // get linked dot loc
    const node = startNode(8 /* LinkedModifier */, offset, loc)
    node.value = token.value || ''
    endNode(node, tokenizer.currentOffset(), tokenizer.currentPosition())
    return node
  }
  function parseLinkedKey(tokenizer, value) {
    const context = tokenizer.context()
    const node = startNode(7 /* LinkedKey */, context.offset, context.startLoc)
    node.value = value
    endNode(node, tokenizer.currentOffset(), tokenizer.currentPosition())
    return node
  }
  function parseLinked(tokenizer) {
    const context = tokenizer.context()
    const linkedNode = startNode(
      6 /* Linked */,
      context.offset,
      context.startLoc
    )
    let token = tokenizer.nextToken()
    if (token.type === 9 /* LinkedDot */) {
      linkedNode.modifier = parseLinkedModifier(tokenizer)
      token = tokenizer.nextToken()
    }
    // asset check token
    if (token.type !== 10 /* LinkedDelimiter */) {
      emitError(
        tokenizer,
        11 /* UNEXPECTED_LEXICAL_ANALYSIS */,
        context.lastStartLoc,
        0,
        token.type
      )
    }
    token = tokenizer.nextToken()
    // skip brace left
    if (token.type === 2 /* BraceLeft */) {
      token = tokenizer.nextToken()
    }
    switch (token.type) {
      case 11 /* LinkedKey */:
        if (token.value == null) {
          emitError(
            tokenizer,
            11 /* UNEXPECTED_LEXICAL_ANALYSIS */,
            context.lastStartLoc,
            0,
            token.type
          )
        }
        linkedNode.key = parseLinkedKey(tokenizer, token.value || '')
        break
      case 5 /* Named */:
        if (token.value == null) {
          emitError(
            tokenizer,
            11 /* UNEXPECTED_LEXICAL_ANALYSIS */,
            context.lastStartLoc,
            0,
            token.type
          )
        }
        linkedNode.key = parseNamed(tokenizer, token.value || '')
        break
      case 6 /* List */:
        if (token.value == null) {
          emitError(
            tokenizer,
            11 /* UNEXPECTED_LEXICAL_ANALYSIS */,
            context.lastStartLoc,
            0,
            token.type
          )
        }
        linkedNode.key = parseList(tokenizer, token.value || '')
        break
      case 7 /* Literal */:
        if (token.value == null) {
          emitError(
            tokenizer,
            11 /* UNEXPECTED_LEXICAL_ANALYSIS */,
            context.lastStartLoc,
            0,
            token.type
          )
        }
        linkedNode.key = parseLiteral(tokenizer, token.value || '')
        break
    }
    endNode(linkedNode, tokenizer.currentOffset(), tokenizer.currentPosition())
    return linkedNode
  }
  function parseMessage(tokenizer) {
    const context = tokenizer.context()
    const startOffset =
      context.currentType === 1 /* Pipe */
        ? tokenizer.currentOffset()
        : context.offset
    const startLoc =
      context.currentType === 1 /* Pipe */ ? context.endLoc : context.startLoc
    const node = startNode(2 /* Message */, startOffset, startLoc)
    node.items = []
    do {
      const token = tokenizer.nextToken()
      switch (token.type) {
        case 0 /* Text */:
          if (token.value == null) {
            emitError(
              tokenizer,
              11 /* UNEXPECTED_LEXICAL_ANALYSIS */,
              context.lastStartLoc,
              0,
              token.type
            )
          }
          node.items.push(parseText(tokenizer, token.value || ''))
          break
        case 6 /* List */:
          if (token.value == null) {
            emitError(
              tokenizer,
              11 /* UNEXPECTED_LEXICAL_ANALYSIS */,
              context.lastStartLoc,
              0,
              token.type
            )
          }
          node.items.push(parseList(tokenizer, token.value || ''))
          break
        case 5 /* Named */:
          if (token.value == null) {
            emitError(
              tokenizer,
              11 /* UNEXPECTED_LEXICAL_ANALYSIS */,
              context.lastStartLoc,
              0,
              token.type
            )
          }
          node.items.push(parseNamed(tokenizer, token.value || ''))
          break
        case 7 /* Literal */:
          if (token.value == null) {
            emitError(
              tokenizer,
              11 /* UNEXPECTED_LEXICAL_ANALYSIS */,
              context.lastStartLoc,
              0,
              token.type
            )
          }
          node.items.push(parseLiteral(tokenizer, token.value || ''))
          break
        case 8 /* LinkedAlias */:
          node.items.push(parseLinked(tokenizer))
          break
      }
    } while (
      context.currentType !== 14 /* EOF */ &&
      context.currentType !== 1 /* Pipe */
    )
    // adjust message node loc
    const endOffset =
      context.currentType === 1 /* Pipe */
        ? context.lastOffset
        : tokenizer.currentOffset()
    const endLoc =
      context.currentType === 1 /* Pipe */
        ? context.lastEndLoc
        : tokenizer.currentPosition()
    endNode(node, endOffset, endLoc)
    return node
  }
  function parsePlural(tokenizer, offset, loc, msgNode) {
    const context = tokenizer.context()
    let hasEmptyMessage = msgNode.items.length === 0
    const node = startNode(1 /* Plural */, offset, loc)
    node.cases = []
    node.cases.push(msgNode)
    do {
      const msg = parseMessage(tokenizer)
      if (!hasEmptyMessage) {
        hasEmptyMessage = msg.items.length === 0
      }
      node.cases.push(msg)
    } while (context.currentType !== 14 /* EOF */)
    if (hasEmptyMessage) {
      emitError(tokenizer, 10 /* MUST_HAVE_MESSAGES_IN_PLURAL */, loc, 0)
    }
    endNode(node, tokenizer.currentOffset(), tokenizer.currentPosition())
    return node
  }
  function parseResource(tokenizer) {
    const context = tokenizer.context()
    const { offset, startLoc } = context
    const msgNode = parseMessage(tokenizer)
    if (context.currentType === 14 /* EOF */) {
      return msgNode
    } else {
      return parsePlural(tokenizer, offset, startLoc, msgNode)
    }
  }
  function parse(source) {
    const tokenizer = createTokenizer(source, { ...options })
    const context = tokenizer.context()
    const node = startNode(0 /* Resource */, context.offset, context.startLoc)
    node.body = parseResource(tokenizer)
    // assert wheather achieved to EOF
    if (context.currentType !== 14 /* EOF */) {
      emitError(
        tokenizer,
        11 /* UNEXPECTED_LEXICAL_ANALYSIS */,
        context.lastStartLoc,
        0,
        context.currentType
      )
    }
    endNode(node, tokenizer.currentOffset(), tokenizer.currentPosition())
    return node
  }
  return { parse }
}

function createTransformer(
  ast,
  options = {} // eslint-disable-line
) {
  const _context = {
    ast,
    helpers: new Set()
  }
  const context = () => _context
  const helper = name => {
    _context.helpers.add(name)
    return name
  }
  return { context, helper }
}
function traverseNodes(nodes, transformer) {
  for (let i = 0; i < nodes.length; i++) {
    traverseNode(nodes[i], transformer)
  }
}
function traverseNode(node, transformer) {
  // TODO: if we need pre-hook of transform, should be implemeted to here
  switch (node.type) {
    case 1 /* Plural */:
      traverseNodes(node.cases, transformer)
      transformer.helper('pluralIndex' /* PLURAL_INDEX */)
      transformer.helper('pluralRule' /* PLURAL_RULE */)
      transformer.helper('orgPluralRule' /* ORG_PLURAL_RULE */)
      break
    case 2 /* Message */:
      traverseNodes(node.items, transformer)
      break
    case 6 /* Linked */:
      const linked = node
      if (linked.modifier) {
        traverseNode(linked.modifier, transformer)
        transformer.helper('modifier' /* MODIFIER */)
        transformer.helper('type' /* TYPE */)
      }
      traverseNode(linked.key, transformer)
      transformer.helper('message' /* MESSAGE */)
      break
    case 5 /* List */:
      transformer.helper('interpolate' /* INTERPOLATE */)
      transformer.helper('list' /* LIST */)
      break
    case 4 /* Named */:
      transformer.helper('interpolate' /* INTERPOLATE */)
      transformer.helper('named' /* NAMED */)
      break
  }
  // TODO: if we need post-hook of transform, should be implemeted to here
}
// transform AST
function transform(
  ast,
  options = {} // eslint-disable-line
) {
  const transformer = createTransformer(ast)
  transformer.helper('normalize' /* NORMALIZE */)
  // traverse
  ast.body && traverseNode(ast.body, transformer)
  // set meta information
  const context = transformer.context()
  ast.helpers = [...context.helpers]
}

function createCodeGenerator(source) {
  const _context = {
    source,
    code: '',
    indentLevel: 0
  }
  const context = () => _context
  function push(code) {
    _context.code += code
  }
  function _newline(n) {
    push('\n' + `  `.repeat(n))
  }
  function indent() {
    _newline(++_context.indentLevel)
  }
  function deindent(withoutNewLine) {
    if (withoutNewLine) {
      --_context.indentLevel
    } else {
      _newline(--_context.indentLevel)
    }
  }
  function newline() {
    _newline(_context.indentLevel)
  }
  const helper = key => `_${key}`
  return {
    context,
    push,
    indent,
    deindent,
    newline,
    helper
  }
}
function generateLinkedNode(generator, node) {
  const { helper } = generator
  if (node.modifier) {
    generator.push(`${helper('modifier' /* MODIFIER */)}(`)
    generateNode(generator, node.modifier)
    generator.push(')(')
  }
  generator.push(`${helper('message' /* MESSAGE */)}(`)
  generateNode(generator, node.key)
  generator.push(')(ctx)')
  if (node.modifier) {
    generator.push(`, ${helper('type' /* TYPE */)})`)
  }
}
function generateMessageNode(generator, node) {
  const { helper } = generator
  generator.push(`${helper('normalize' /* NORMALIZE */)}([`)
  generator.indent()
  const length = node.items.length
  for (let i = 0; i < length; i++) {
    generateNode(generator, node.items[i])
    if (i === length - 1) {
      break
    }
    generator.push(', ')
  }
  generator.deindent()
  generator.push('])')
}
function generatePluralNode(generator, node) {
  const { helper } = generator
  if (node.cases.length > 1) {
    generator.push('[')
    generator.indent()
    const length = node.cases.length
    for (let i = 0; i < length; i++) {
      generateNode(generator, node.cases[i])
      if (i === length - 1) {
        break
      }
      generator.push(', ')
    }
    generator.deindent()
    generator.push(
      `][${helper('pluralRule' /* PLURAL_RULE */)}(${helper(
        'pluralIndex' /* PLURAL_INDEX */
      )}, ${length}, ${helper('orgPluralRule' /* ORG_PLURAL_RULE */)})]`
    )
  }
}
function generateResource(generator, node) {
  if (node.body) {
    generateNode(generator, node.body)
  } else {
    generator.push('null')
  }
}
function generateNode(generator, node) {
  const { helper } = generator
  switch (node.type) {
    case 0 /* Resource */:
      generateResource(generator, node)
      break
    case 1 /* Plural */:
      generatePluralNode(generator, node)
      break
    case 2 /* Message */:
      generateMessageNode(generator, node)
      break
    case 6 /* Linked */:
      generateLinkedNode(generator, node)
      break
    case 8 /* LinkedModifier */:
      generator.push(JSON.stringify(node.value))
      break
    case 7 /* LinkedKey */:
      generator.push(JSON.stringify(node.value))
      break
    case 5 /* List */:
      generator.push(
        `${helper('interpolate' /* INTERPOLATE */)}(${helper(
          'list' /* LIST */
        )}(${node.index}))`
      )
      break
    case 4 /* Named */:
      generator.push(
        `${helper('interpolate' /* INTERPOLATE */)}(${helper(
          'named' /* NAMED */
        )}(${JSON.stringify(node.key)}))`
      )
      break
    case 9 /* Literal */:
      generator.push(JSON.stringify(node.value))
      break
    case 3 /* Text */:
      generator.push(JSON.stringify(node.value))
      break
  }
}
// generate code from AST
const generate = (
  ast,
  options = {} // eslint-disable-line
) => {
  const mode = isString$1(options.mode) ? options.mode : 'normal'
  const helpers = ast.helpers || []
  const generator = createCodeGenerator(ast.loc && ast.loc.source)
  generator.push(mode === 'normal' ? `function __msg__ (ctx) {` : `(ctx) => {`)
  generator.indent()
  if (helpers.length > 0) {
    generator.push(
      `const { ${helpers.map(s => `${s}: _${s}`).join(', ')} } = ctx`
    )
    generator.newline()
  }
  generator.push(`return `)
  generateNode(generator, ast)
  generator.deindent()
  generator.push(`}`)
  return generator.context().code
}
const defaultOnCacheKey = source => source
let compileCache = Object.create(null)
function baseCompile(source, options = {}) {
  // parse source codes
  const parser = createParser({ ...options })
  const ast = parser.parse(source)
  // transform ASTs
  transform(ast, { ...options })
  // generate javascript codes
  const code = generate(ast, { ...options })
  return { ast, code }
}
function compile(source, options = {}) {
  // check caches
  const onCacheKey = options.onCacheKey || defaultOnCacheKey
  const key = onCacheKey(source)
  const cached = compileCache[key]
  if (cached) {
    return cached
  }
  // compile error detecting
  let occured = false
  const onError = options.onError || defaultOnError
  options.onError = err => {
    occured = true
    onError(err)
  }
  // compile
  const { code } = baseCompile(source, options)
  // evaluate function
  const msg = new Function(`return ${code}`)()
  // if occured compile error, don't cache
  return !occured ? (compileCache[key] = msg) : msg
}

const DEFAULT_MODIFIER = str => str
const DEFAULT_MESSAGE = ctx => '' // eslint-disable-line
const DEFAULT_MESSAGE_DATA_TYPE = 'text'
const DEFAULT_NORMALIZE = values => (values.length === 0 ? '' : values.join(''))
const DEFAULT_INTERPOLATE = toDisplayString$1
function pluralDefault(choice, choicesLength) {
  choice = Math.abs(choice)
  if (choicesLength === 2) {
    // prettier-ignore
    return choice
            ? choice > 1
                ? 1
                : 0
            : 1;
  }
  return choice ? Math.min(choice, 2) : 0
}
function getPluralIndex(options) {
  // prettier-ignore
  const index = isNumber(options.pluralIndex)
        ? options.pluralIndex
        : -1;
  // prettier-ignore
  return options.named && (isNumber(options.named.count) || isNumber(options.named.n))
        ? isNumber(options.named.count)
            ? options.named.count
            : isNumber(options.named.n)
                ? options.named.n
                : index
        : index;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeNamed(pluralIndex, named) {
  if (!named.count) {
    named.count = pluralIndex
  }
  if (!named.n) {
    named.n = pluralIndex
  }
}
function createMessageContext(options = {}) {
  const locale = options.locale
  const pluralIndex = getPluralIndex(options)
  const pluralRule =
    isObject$1(options.pluralRules) &&
    isString$1(locale) &&
    isFunction$1(options.pluralRules[locale])
      ? options.pluralRules[locale]
      : pluralDefault
  const orgPluralRule =
    isObject$1(options.pluralRules) &&
    isString$1(locale) &&
    isFunction$1(options.pluralRules[locale])
      ? pluralDefault
      : undefined
  const _list = options.list || []
  const list = index => _list[index]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const _named = options.named || {}
  isNumber(options.pluralIndex) && normalizeNamed(pluralIndex, _named)
  const named = key => _named[key]
  const modifier = name =>
    options.modifiers ? options.modifiers[name] : DEFAULT_MODIFIER
  function message(name) {
    // TODO: need to design resolve message function?
    // prettier-ignore
    const msg = isFunction$1(options.messages)
            ? options.messages(name)
            : isObject$1(options.messages)
                ? options.messages[name]
                : false;
    return !msg
      ? options.parent
        ? options.parent.message(name) // resolve from parent messages
        : DEFAULT_MESSAGE
      : msg
  }
  const type =
    isPlainObject$1(options.processor) && isString$1(options.processor.type)
      ? options.processor.type
      : DEFAULT_MESSAGE_DATA_TYPE
  const normalize =
    isPlainObject$1(options.processor) &&
    isFunction$1(options.processor.normalize)
      ? options.processor.normalize
      : DEFAULT_NORMALIZE
  const interpolate =
    isPlainObject$1(options.processor) &&
    isFunction$1(options.processor.interpolate)
      ? options.processor.interpolate
      : DEFAULT_INTERPOLATE
  return {
    ['list' /* LIST */]: list,
    ['named' /* NAMED */]: named,
    ['pluralIndex' /* PLURAL_INDEX */]: pluralIndex,
    ['pluralRule' /* PLURAL_RULE */]: pluralRule,
    ['orgPluralRule' /* ORG_PLURAL_RULE */]: orgPluralRule,
    ['modifier' /* MODIFIER */]: modifier,
    ['message' /* MESSAGE */]: message,
    ['type' /* TYPE */]: type,
    ['interpolate' /* INTERPOLATE */]: interpolate,
    ['normalize' /* NORMALIZE */]: normalize
  }
}

const DEFAULT_LINKDED_MODIFIERS = {
  upper: (val, type) =>
    type === DEFAULT_MESSAGE_DATA_TYPE ? val.toUpperCase() : val,
  lower: (val, type) =>
    type === DEFAULT_MESSAGE_DATA_TYPE ? val.toLowerCase() : val,
  // prettier-ignore
  capitalize: (val, type) => type === DEFAULT_MESSAGE_DATA_TYPE
        ? `${val.charAt(0).toLocaleUpperCase()}${val.substr(1)}`
        : val
}
const NOT_REOSLVED = -1
const MISSING_RESOLVE_VALUE = ''
function createRuntimeContext(options = {}) {
  const locale = isString$1(options.locale) ? options.locale : 'en-US'
  const fallbackLocale =
    isArray$1(options.fallbackLocale) ||
    isPlainObject$1(options.fallbackLocale) ||
    options.fallbackLocale === false
      ? options.fallbackLocale
      : locale
  const messages = isPlainObject$1(options.messages)
    ? options.messages
    : { [locale]: {} }
  const datetimeFormats = isPlainObject$1(options.datetimeFormats)
    ? options.datetimeFormats
    : { [locale]: {} }
  const numberFormats = isPlainObject$1(options.numberFormats)
    ? options.numberFormats
    : { [locale]: {} }
  const modifiers = Object.assign(
    {},
    options.modifiers || {},
    DEFAULT_LINKDED_MODIFIERS
  )
  const pluralRules = options.pluralRules || {}
  const missing = isFunction$1(options.missing) ? options.missing : null
  const missingWarn =
    isBoolean(options.missingWarn) || isRegExp(options.missingWarn)
      ? options.missingWarn
      : true
  const fallbackWarn =
    isBoolean(options.fallbackWarn) || isRegExp(options.fallbackWarn)
      ? options.fallbackWarn
      : true
  const fallbackFormat = !!options.fallbackFormat
  const unresolving = !!options.unresolving
  const postTranslation = isFunction$1(options.postTranslation)
    ? options.postTranslation
    : null
  const processor = isPlainObject$1(options.processor)
    ? options.processor
    : null
  const warnHtmlMessage = isBoolean(options.warnHtmlMessage)
    ? options.warnHtmlMessage
    : true
  const messageCompiler = isFunction$1(options.messageCompiler)
    ? options.messageCompiler
    : compile
  const onWarn = isFunction$1(options.onWarn) ? options.onWarn : warn$1
  const _datetimeFormatters = isObject$1(options._datetimeFormatters)
    ? options._datetimeFormatters
    : new Map()
  const _numberFormatters = isObject$1(options._numberFormatters)
    ? options._numberFormatters
    : new Map()
  return {
    locale,
    fallbackLocale,
    messages,
    datetimeFormats,
    numberFormats,
    modifiers,
    pluralRules,
    missing,
    missingWarn,
    fallbackWarn,
    fallbackFormat,
    unresolving,
    postTranslation,
    processor,
    warnHtmlMessage,
    messageCompiler,
    onWarn,
    _datetimeFormatters,
    _numberFormatters
  }
}
function handleMissing(context, key, locale, missingWarn, type) {
  const { missing, onWarn } = context
  if (missing !== null) {
    const ret = missing(context, locale, key, type)
    return isString$1(ret) ? ret : key
  } else {
    return key
  }
}
function getLocaleChain(context, fallback, start = '') {
  if (start === '') {
    return []
  }
  if (!context._localeChainCache) {
    context._localeChainCache = new Map()
  }
  let chain = context._localeChainCache.get(start)
  if (!chain) {
    chain = []
    // first block defined by start
    let block = [start]
    // while any intervening block found
    while (isArray$1(block)) {
      block = appendBlockToChain(chain, block, fallback)
    }
    // prettier-ignore
    // last block defined by default
    const defaults = isArray$1(fallback)
            ? fallback
            : isPlainObject$1(fallback)
                ? fallback['default']
                    ? fallback['default']
                    : null
                : fallback;
    // convert defaults to array
    block = isString$1(defaults) ? [defaults] : defaults
    if (isArray$1(block)) {
      appendBlockToChain(chain, block, false)
    }
    context._localeChainCache.set(start, chain)
  }
  return chain
}
function appendBlockToChain(chain, block, blocks) {
  let follow = true
  for (let i = 0; i < block.length && isBoolean(follow); i++) {
    const locale = block[i]
    if (isString$1(locale)) {
      follow = appendLocaleToChain(chain, block[i], blocks)
    }
  }
  return follow
}
function appendLocaleToChain(chain, locale, blocks) {
  let follow
  const tokens = locale.split('-')
  do {
    const target = tokens.join('-')
    follow = appendItemToChain(chain, target, blocks)
    tokens.splice(-1, 1)
  } while (tokens.length && follow === true)
  return follow
}
function appendItemToChain(chain, target, blocks) {
  let follow = false
  if (!chain.includes(target)) {
    follow = true
    if (target) {
      follow = target[target.length - 1] !== '!'
      const locale = target.replace(/!/g, '')
      chain.push(locale)
      if (
        (isArray$1(blocks) || isPlainObject$1(blocks)) &&
        blocks[locale] // eslint-disable-line @typescript-eslint/no-explicit-any
      ) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        follow = blocks[locale]
      }
    }
  }
  return follow
}
function updateFallbackLocale(context, locale, fallback) {
  context._localeChainCache = new Map()
  getLocaleChain(context, fallback, locale)
}

const pathStateMachine = []
pathStateMachine[0 /* BEFORE_PATH */] = {
  ['w' /* WORKSPACE */]: [0 /* BEFORE_PATH */],
  ['i' /* IDENT */]: [3 /* IN_IDENT */, 0 /* APPEND */],
  ['[' /* LEFT_BRACKET */]: [4 /* IN_SUB_PATH */],
  ['o' /* END_OF_FAIL */]: [7 /* AFTER_PATH */]
}
pathStateMachine[1 /* IN_PATH */] = {
  ['w' /* WORKSPACE */]: [1 /* IN_PATH */],
  ['.' /* DOT */]: [2 /* BEFORE_IDENT */],
  ['[' /* LEFT_BRACKET */]: [4 /* IN_SUB_PATH */],
  ['o' /* END_OF_FAIL */]: [7 /* AFTER_PATH */]
}
pathStateMachine[2 /* BEFORE_IDENT */] = {
  ['w' /* WORKSPACE */]: [2 /* BEFORE_IDENT */],
  ['i' /* IDENT */]: [3 /* IN_IDENT */, 0 /* APPEND */],
  ['0' /* ZERO */]: [3 /* IN_IDENT */, 0 /* APPEND */]
}
pathStateMachine[3 /* IN_IDENT */] = {
  ['i' /* IDENT */]: [3 /* IN_IDENT */, 0 /* APPEND */],
  ['0' /* ZERO */]: [3 /* IN_IDENT */, 0 /* APPEND */],
  ['w' /* WORKSPACE */]: [1 /* IN_PATH */, 1 /* PUSH */],
  ['.' /* DOT */]: [2 /* BEFORE_IDENT */, 1 /* PUSH */],
  ['[' /* LEFT_BRACKET */]: [4 /* IN_SUB_PATH */, 1 /* PUSH */],
  ['o' /* END_OF_FAIL */]: [7 /* AFTER_PATH */, 1 /* PUSH */]
}
pathStateMachine[4 /* IN_SUB_PATH */] = {
  ["'" /* SINGLE_QUOTE */]: [5 /* IN_SINGLE_QUOTE */, 0 /* APPEND */],
  ['"' /* DOUBLE_QUOTE */]: [6 /* IN_DOUBLE_QUOTE */, 0 /* APPEND */],
  ['[' /* LEFT_BRACKET */]: [4 /* IN_SUB_PATH */, 2 /* INC_SUB_PATH_DEPTH */],
  [']' /* RIGHT_BRACKET */]: [1 /* IN_PATH */, 3 /* PUSH_SUB_PATH */],
  ['o' /* END_OF_FAIL */]: 8 /* ERROR */,
  ['l' /* ELSE */]: [4 /* IN_SUB_PATH */, 0 /* APPEND */]
}
pathStateMachine[5 /* IN_SINGLE_QUOTE */] = {
  ["'" /* SINGLE_QUOTE */]: [4 /* IN_SUB_PATH */, 0 /* APPEND */],
  ['o' /* END_OF_FAIL */]: 8 /* ERROR */,
  ['l' /* ELSE */]: [5 /* IN_SINGLE_QUOTE */, 0 /* APPEND */]
}
pathStateMachine[6 /* IN_DOUBLE_QUOTE */] = {
  ['"' /* DOUBLE_QUOTE */]: [4 /* IN_SUB_PATH */, 0 /* APPEND */],
  ['o' /* END_OF_FAIL */]: 8 /* ERROR */,
  ['l' /* ELSE */]: [6 /* IN_DOUBLE_QUOTE */, 0 /* APPEND */]
}
/**
 * Check if an expression is a literal value.
 */
const literalValueRE = /^\s?(?:true|false|-?[\d.]+|'[^']*'|"[^"]*")\s?$/
function isLiteral(exp) {
  return literalValueRE.test(exp)
}
/**
 * Strip quotes from a string
 */
function stripQuotes(str) {
  const a = str.charCodeAt(0)
  const b = str.charCodeAt(str.length - 1)
  return a === b && (a === 0x22 || a === 0x27) ? str.slice(1, -1) : str
}
/**
 * Determine the type of a character in a keypath.
 */
function getPathCharType(ch) {
  if (ch === undefined || ch === null) {
    return 'o' /* END_OF_FAIL */
  }
  const code = ch.charCodeAt(0)
  switch (code) {
    case 0x5b: // [
    case 0x5d: // ]
    case 0x2e: // .
    case 0x22: // "
    case 0x27: // '
      return ch
    case 0x5f: // _
    case 0x24: // $
    case 0x2d: // -
      return 'i' /* IDENT */
    case 0x09: // Tab (HT)
    case 0x0a: // Newline (LF)
    case 0x0d: // Return (CR)
    case 0xa0: // No-break space (NBSP)
    case 0xfeff: // Byte Order Mark (BOM)
    case 0x2028: // Line Separator (LS)
    case 0x2029: // Paragraph Separator (PS)
      return 'w' /* WORKSPACE */
  }
  return 'i' /* IDENT */
}
/**
 * Format a subPath, return its plain form if it is
 * a literal string or number. Otherwise prepend the
 * dynamic indicator (*).
 */
function formatSubPath(path) {
  const trimmed = path.trim()
  // invalid leading 0
  if (path.charAt(0) === '0' && isNaN(parseInt(path))) {
    return false
  }
  return isLiteral(trimmed)
    ? stripQuotes(trimmed)
    : '*' /* ASTARISK */ + trimmed
}
/**
 * Parse a string path into an array of segments
 */
function parse(path) {
  const keys = []
  let index = -1
  let mode = 0 /* BEFORE_PATH */
  let subPathDepth = 0
  let c
  let key // eslint-disable-line
  let newChar
  let type
  let transition
  let action
  let typeMap
  const actions = []
  actions[0 /* APPEND */] = () => {
    if (key === undefined) {
      key = newChar
    } else {
      key += newChar
    }
  }
  actions[1 /* PUSH */] = () => {
    if (key !== undefined) {
      keys.push(key)
      key = undefined
    }
  }
  actions[2 /* INC_SUB_PATH_DEPTH */] = () => {
    actions[0 /* APPEND */]()
    subPathDepth++
  }
  actions[3 /* PUSH_SUB_PATH */] = () => {
    if (subPathDepth > 0) {
      subPathDepth--
      mode = 4 /* IN_SUB_PATH */
      actions[0 /* APPEND */]()
    } else {
      subPathDepth = 0
      if (key === undefined) {
        return false
      }
      key = formatSubPath(key)
      if (key === false) {
        return false
      } else {
        actions[1 /* PUSH */]()
      }
    }
  }
  function maybeUnescapeQuote() {
    const nextChar = path[index + 1]
    if (
      (mode === 5 /* IN_SINGLE_QUOTE */ &&
        nextChar === "'") /* SINGLE_QUOTE */ ||
      (mode === 6 /* IN_DOUBLE_QUOTE */ && nextChar === '"') /* DOUBLE_QUOTE */
    ) {
      index++
      newChar = '\\' + nextChar
      actions[0 /* APPEND */]()
      return true
    }
  }
  while (mode !== null) {
    index++
    c = path[index]
    if (c === '\\' && maybeUnescapeQuote()) {
      continue
    }
    type = getPathCharType(c)
    typeMap = pathStateMachine[mode]
    transition = typeMap[type] || typeMap['l' /* ELSE */] || 8 /* ERROR */
    // check parse error
    if (transition === 8 /* ERROR */) {
      return
    }
    mode = transition[0]
    if (transition[1] !== undefined) {
      action = actions[transition[1]]
      if (action) {
        newChar = c
        if (action() === false) {
          return
        }
      }
    }
    // check parse finish
    if (mode === 7 /* AFTER_PATH */) {
      return keys
    }
  }
}
// path token cache
const cache = new Map()
function resolveValue(obj, path) {
  // check object
  if (!isObject$1(obj)) {
    return null
  }
  // parse path
  let hit = cache.get(path)
  if (!hit) {
    hit = parse(path)
    if (hit) {
      cache.set(path, hit)
    }
  }
  // check hit
  if (!hit) {
    return null
  }
  // resolve path value
  const len = hit.length
  let last = obj
  let i = 0
  while (i < len) {
    const val = last[hit[i]]
    if (val === undefined) {
      return null
    }
    last = val
    i++
  }
  return last
}

function createCoreError(code) {
  return createCompileError(code, null, undefined)
}

const NOOP_MESSAGE_FUNCTION = () => ''
const isMessageFunction = val => isFunction$1(val)
// implementationo of `translate` function
function translate(context, ...args) {
  const {
    messages,
    fallbackFormat,
    postTranslation,
    unresolving,
    fallbackLocale,
    warnHtmlMessage,
    messageCompiler,
    onWarn
  } = context
  const [key, options] = parseTranslateArgs(...args)
  const missingWarn = isBoolean(options.missingWarn)
    ? options.missingWarn
    : context.missingWarn
  const fallbackWarn = isBoolean(options.fallbackWarn)
    ? options.fallbackWarn
    : context.fallbackWarn
  // prettier-ignore
  const defaultMsgOrKey = isString$1(options.default) || isBoolean(options.default) // default by function option
        ? !isBoolean(options.default)
            ? options.default
            : key
        : fallbackFormat // default by `fallbackFormat` option
            ? key
            : '';
  const enableDefaultMsg = fallbackFormat || defaultMsgOrKey !== ''
  const locale = isString$1(options.locale) ? options.locale : context.locale
  const locales = getLocaleChain(context, fallbackLocale, locale)
  // resolve message format
  let message = {}
  let targetLocale
  let format = null
  for (let i = 0; i < locales.length; i++) {
    targetLocale = locales[i]
    message = messages[targetLocale] || {}
    if ((format = resolveValue(message, key)) === null) {
      // if null, resolve with object key path
      format = message[key] // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    if (isString$1(format) || isFunction$1(format)) break
    handleMissing(context, key, targetLocale, missingWarn, 'translate')
  }
  let cacheBaseKey = key
  // if you use default message, set it as message format!
  if (!(isString$1(format) || isMessageFunction(format))) {
    if (enableDefaultMsg) {
      format = defaultMsgOrKey
      cacheBaseKey = format
    }
  }
  // checking message format and target locale
  if (
    !(isString$1(format) || isMessageFunction(format)) ||
    !isString$1(targetLocale)
  ) {
    return unresolving ? NOT_REOSLVED : key
  }
  // setup compile error detecting
  let occured = false
  const errorDetector = () => {
    occured = true
  }
  // compile message format
  let msg
  if (!isMessageFunction(format)) {
    msg = messageCompiler(
      format,
      getCompileOptions(
        targetLocale,
        cacheBaseKey,
        format,
        warnHtmlMessage,
        errorDetector
      )
    )
    msg.locale = targetLocale
    msg.key = key
    msg.source = format
  } else {
    msg = format
    msg.locale = msg.locale || targetLocale
    msg.key = msg.key || key
  }
  // if occured compile error, return the message format
  if (occured) {
    return format
  }
  // evaluate message with context
  const ctxOptions = getMessageContextOptions(
    context,
    targetLocale,
    message,
    options
  )
  const msgContext = createMessageContext(ctxOptions)
  const messaged = msg(msgContext)
  // if use post translation option, procee it with handler
  return postTranslation ? postTranslation(messaged) : messaged
}
function parseTranslateArgs(...args) {
  const [arg1, arg2, arg3] = args
  const options = {}
  if (!isString$1(arg1)) {
    throw createCoreError(12 /* INVALID_ARGUMENT */)
  }
  const key = arg1
  if (isNumber(arg2)) {
    options.plural = arg2
  } else if (isString$1(arg2)) {
    options.default = arg2
  } else if (isPlainObject$1(arg2) && !isEmptyObject(arg2)) {
    options.named = arg2
  } else if (isArray$1(arg2)) {
    options.list = arg2
  }
  if (isNumber(arg3)) {
    options.plural = arg3
  } else if (isString$1(arg3)) {
    options.default = arg3
  } else if (isPlainObject$1(arg3)) {
    Object.assign(options, arg3)
  }
  return [key, options]
}
function getCompileOptions(
  locale,
  key,
  source,
  warnHtmlMessage,
  errorDetector
) {
  return {
    warnHtmlMessage,
    onError: err => {
      errorDetector && errorDetector(err)
      {
        throw err
      }
    },
    onCacheKey: source => generateFormatCacheKey(locale, key, source)
  }
}
function getMessageContextOptions(context, locale, message, options) {
  const { modifiers, pluralRules, messageCompiler } = context
  const resolveMessage = key => {
    const val = resolveValue(message, key)
    if (isString$1(val)) {
      let occured = false
      const errorDetector = () => {
        occured = true
      }
      const msg = messageCompiler(
        val,
        getCompileOptions(
          locale,
          key,
          val,
          context.warnHtmlMessage,
          errorDetector
        )
      )
      return !occured ? msg : NOOP_MESSAGE_FUNCTION
    } else if (isMessageFunction(val)) {
      return val
    } else {
      // TODO: should be implemented warning message
      return NOOP_MESSAGE_FUNCTION
    }
  }
  const ctxOptions = {
    locale,
    modifiers,
    pluralRules,
    messages: resolveMessage
  }
  if (context.processor) {
    ctxOptions.processor = context.processor
  }
  if (options.list) {
    ctxOptions.list = options.list
  }
  if (options.named) {
    ctxOptions.named = options.named
  }
  if (isNumber(options.plural)) {
    ctxOptions.pluralIndex = options.plural
  }
  return ctxOptions
}

// implementation of `datetime` function
function datetime(context, ...args) {
  const {
    datetimeFormats,
    unresolving,
    fallbackLocale,
    onWarn,
    _datetimeFormatters
  } = context
  const [key, value, options, orverrides] = parseDateTimeArgs(...args)
  const missingWarn = isBoolean(options.missingWarn)
    ? options.missingWarn
    : context.missingWarn
  const fallbackWarn = isBoolean(options.fallbackWarn)
    ? options.fallbackWarn
    : context.fallbackWarn
  const part = !!options.part
  const locale = isString$1(options.locale) ? options.locale : context.locale
  const locales = getLocaleChain(context, fallbackLocale, locale)
  if (!isString$1(key) || key === '') {
    return new Intl.DateTimeFormat(locale).format(value)
  }
  // resolve format
  let datetimeFormat = {}
  let targetLocale
  let format = null
  for (let i = 0; i < locales.length; i++) {
    targetLocale = locales[i]
    datetimeFormat = datetimeFormats[targetLocale] || {}
    format = datetimeFormat[key]
    if (isPlainObject$1(format)) break
    handleMissing(context, key, targetLocale, missingWarn, 'datetime')
  }
  // checking format and target locale
  if (!isPlainObject$1(format) || !isString$1(targetLocale)) {
    return unresolving ? NOT_REOSLVED : key
  }
  let id = `${targetLocale}__${key}`
  if (!isEmptyObject(orverrides)) {
    id = `${id}__${JSON.stringify(orverrides)}`
  }
  let formatter = _datetimeFormatters.get(id)
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(
      targetLocale,
      Object.assign({}, format, orverrides)
    )
    _datetimeFormatters.set(id, formatter)
  }
  return !part ? formatter.format(value) : formatter.formatToParts(value)
}
function parseDateTimeArgs(...args) {
  const [arg1, arg2, arg3, arg4] = args
  let options = {}
  let orverrides = {}
  if (!(isNumber(arg1) || isDate(arg1))) {
    throw createCoreError(12 /* INVALID_ARGUMENT */)
  }
  const value = arg1
  if (isString$1(arg2)) {
    options.key = arg2
  } else if (isPlainObject$1(arg2)) {
    options = arg2
  }
  if (isString$1(arg3)) {
    options.locale = arg3
  } else if (isPlainObject$1(arg3)) {
    orverrides = arg3
  }
  if (isPlainObject$1(arg4)) {
    orverrides = arg4
  }
  return [options.key || '', value, options, orverrides]
}
function clearDateTimeFormat(context, locale, format) {
  for (const key in format) {
    const id = `${locale}__${key}`
    if (!context._datetimeFormatters.has(id)) {
      continue
    }
    context._datetimeFormatters.delete(id)
  }
}

// implementation of `number` function
function number(context, ...args) {
  const {
    numberFormats,
    unresolving,
    fallbackLocale,
    onWarn,
    _numberFormatters
  } = context
  const [key, value, options, orverrides] = parseNumberArgs(...args)
  const missingWarn = isBoolean(options.missingWarn)
    ? options.missingWarn
    : context.missingWarn
  const fallbackWarn = isBoolean(options.fallbackWarn)
    ? options.fallbackWarn
    : context.fallbackWarn
  const part = !!options.part
  const locale = isString$1(options.locale) ? options.locale : context.locale
  const locales = getLocaleChain(context, fallbackLocale, locale)
  if (!isString$1(key) || key === '') {
    return new Intl.NumberFormat(locale).format(value)
  }
  // resolve format
  let numberFormat = {}
  let targetLocale
  let format = null
  for (let i = 0; i < locales.length; i++) {
    targetLocale = locales[i]
    numberFormat = numberFormats[targetLocale] || {}
    format = numberFormat[key]
    if (isPlainObject$1(format)) break
    handleMissing(context, key, targetLocale, missingWarn, 'number')
  }
  // checking format and target locale
  if (!isPlainObject$1(format) || !isString$1(targetLocale)) {
    return unresolving ? NOT_REOSLVED : key
  }
  let id = `${targetLocale}__${key}`
  if (!isEmptyObject(orverrides)) {
    id = `${id}__${JSON.stringify(orverrides)}`
  }
  let formatter = _numberFormatters.get(id)
  if (!formatter) {
    formatter = new Intl.NumberFormat(
      targetLocale,
      Object.assign({}, format, orverrides)
    )
    _numberFormatters.set(id, formatter)
  }
  return !part ? formatter.format(value) : formatter.formatToParts(value)
}
function parseNumberArgs(...args) {
  const [arg1, arg2, arg3, arg4] = args
  let options = {}
  let orverrides = {}
  if (!isNumber(arg1)) {
    throw createCoreError(12 /* INVALID_ARGUMENT */)
  }
  const value = arg1
  if (isString$1(arg2)) {
    options.key = arg2
  } else if (isPlainObject$1(arg2)) {
    options = arg2
  }
  if (isString$1(arg3)) {
    options.locale = arg3
  } else if (isPlainObject$1(arg3)) {
    orverrides = arg3
  }
  if (isPlainObject$1(arg4)) {
    orverrides = arg4
  }
  return [options.key || '', value, options, orverrides]
}
function clearNumberFormat(context, locale, format) {
  for (const key in format) {
    const id = `${locale}__${key}`
    if (!context._numberFormatters.has(id)) {
      continue
    }
    context._numberFormatters.delete(id)
  }
}

function createI18nError(code, ...args) {
  return createCompileError(code, null, undefined)
}

/**
 *  Composer
 *
 *  Composer is offered composable API for Vue 3
 *  This module is offered new style vue-i18n API
 */
let composerID = 0
function defineRuntimeMissingHandler(missing) {
  return (ctx, locale, key, type) => {
    return missing(locale, key, getCurrentInstance() || undefined, type)
  }
}
function getLocaleMessages(options, locale) {
  const { messages, __i18n } = options
  // prettier-ignore
  let ret = isPlainObject$1(messages)
        ? messages
        : isArray$1(__i18n)
            ? {}
            : { [locale]: {} };
  // merge locale messages of i18n custom block
  if (isArray$1(__i18n)) {
    __i18n.forEach(raw => {
      ret = Object.assign(ret, isString$1(raw) ? JSON.parse(raw) : raw)
    })
    return ret
  }
  if (isFunction$1(__i18n)) {
    const { functions } = __i18n()
    addPreCompileMessages(ret, functions)
  }
  return ret
}
function addPreCompileMessages(messages, functions) {
  const keys = Object.keys(functions)
  keys.forEach(key => {
    const compiled = functions[key]
    const { l, k } = JSON.parse(key)
    if (!messages[l]) {
      messages[l] = {}
    }
    const targetLocaleMessage = messages[l]
    const paths = parse(k)
    if (paths != null) {
      const len = paths.length
      let last = targetLocaleMessage // eslint-disable-line @typescript-eslint/no-explicit-any
      let i = 0
      while (i < len) {
        const path = paths[i]
        if (i === len - 1) {
          last[path] = compiled
          break
        } else {
          let val = last[path]
          if (!val) {
            last[path] = val = {}
          }
          last = val
          i++
        }
      }
    }
  })
}
/**
 * Create composer interface factory
 *
 * @internal
 */
function createComposer(options = {}) {
  const { __root } = options
  const _isGlobal = __root === undefined
  let _inheritLocale = isBoolean(options.inheritLocale)
    ? options.inheritLocale
    : true
  const _locale = ref(
    // prettier-ignore
    __root && _inheritLocale
        ? __root.locale.value
        : isString$1(options.locale)
            ? options.locale
            : 'en-US'
  )
  const _fallbackLocale = ref(
    // prettier-ignore
    __root && _inheritLocale
        ? __root.fallbackLocale.value
        : isString$1(options.fallbackLocale) ||
            isArray$1(options.fallbackLocale) ||
            isPlainObject$1(options.fallbackLocale) ||
            options.fallbackLocale === false
            ? options.fallbackLocale
            : _locale.value
  )
  const _messages = ref(getLocaleMessages(options, _locale.value))
  const _datetimeFormats = ref(
    isPlainObject$1(options.datetimeFormats)
      ? options.datetimeFormats
      : { [_locale.value]: {} }
  )
  const _numberFormats = ref(
    isPlainObject$1(options.numberFormats)
      ? options.numberFormats
      : { [_locale.value]: {} }
  )
  // warning supress options
  // prettier-ignore
  let _missingWarn = __root
        ? __root.missingWarn
        : isBoolean(options.missingWarn) || isRegExp(options.missingWarn)
            ? options.missingWarn
            : true;
  // prettier-ignore
  let _fallbackWarn = __root
        ? __root.fallbackWarn
        : isBoolean(options.fallbackWarn) || isRegExp(options.fallbackWarn)
            ? options.fallbackWarn
            : true;
  let _fallbackRoot = isBoolean(options.fallbackRoot)
    ? options.fallbackRoot
    : true
  // configure fall bakck to root
  let _fallbackFormat = !!options.fallbackFormat
  // runtime missing
  let _missing = isFunction$1(options.missing) ? options.missing : null
  let _runtimeMissing = isFunction$1(options.missing)
    ? defineRuntimeMissingHandler(options.missing)
    : null
  // postTranslation handler
  let _postTranslation = isFunction$1(options.postTranslation)
    ? options.postTranslation
    : null
  let _warnHtmlMessage = isBoolean(options.warnHtmlMessage)
    ? options.warnHtmlMessage
    : true
  // custom linked modifiers
  // prettier-ignore
  const _modifiers = __root
        ? __root.modifiers
        : isPlainObject$1(options.modifiers)
            ? options.modifiers
            : {};
  // pluralRules
  const _pluralRules = options.pluralRules
  // runtime context
  let _context // eslint-disable-line prefer-const
  function getRuntimeContext() {
    return createRuntimeContext({
      locale: _locale.value,
      fallbackLocale: _fallbackLocale.value,
      messages: _messages.value,
      datetimeFormats: _datetimeFormats.value,
      numberFormats: _numberFormats.value,
      modifiers: _modifiers,
      pluralRules: _pluralRules,
      missing: _runtimeMissing === null ? undefined : _runtimeMissing,
      missingWarn: _missingWarn,
      fallbackWarn: _fallbackWarn,
      fallbackFormat: _fallbackFormat,
      unresolving: true,
      postTranslation: _postTranslation === null ? undefined : _postTranslation,
      warnHtmlMessage: _warnHtmlMessage,
      _datetimeFormatters: isPlainObject$1(_context)
        ? _context._datetimeFormatters
        : undefined,
      _numberFormatters: isPlainObject$1(_context)
        ? _context._numberFormatters
        : undefined
    })
  }
  _context = getRuntimeContext()
  updateFallbackLocale(_context, _locale.value, _fallbackLocale.value)
  /*!
   * define properties
   */
  // locale
  const locale = computed$1({
    get: () => _locale.value,
    set: val => {
      _locale.value = val
      _context.locale = _locale.value
    }
  })
  // fallbackLocale
  const fallbackLocale = computed$1({
    get: () => _fallbackLocale.value,
    set: val => {
      _fallbackLocale.value = val
      _context.fallbackLocale = _fallbackLocale.value
      updateFallbackLocale(_context, _locale.value, val)
    }
  })
  // messages
  const messages = computed$1(() => _messages.value)
  // datetimeFormats
  const datetimeFormats = computed$1(() => _datetimeFormats.value)
  // numberFormats
  const numberFormats = computed$1(() => _numberFormats.value)
  /**
   * define methods
   */
  // getPostTranslationHandler
  const getPostTranslationHandler = () =>
    isFunction$1(_postTranslation) ? _postTranslation : null
  // setPostTranslationHandler
  function setPostTranslationHandler(handler) {
    _postTranslation = handler
    _context.postTranslation = handler
  }
  // getMissingHandler
  const getMissingHandler = () => _missing
  // setMissingHandler
  function setMissingHandler(handler) {
    if (handler !== null) {
      _runtimeMissing = defineRuntimeMissingHandler(handler)
    }
    _missing = handler
    _context.missing = _runtimeMissing
  }
  function defineComputed(
    fn,
    argumentParser,
    warnType,
    fallbackSuccess,
    fallbackFail,
    successCondition
  ) {
    // NOTE:
    // if this composer is global (__root is `undefined`), add dependency trakcing!
    // by containing this, we can reactively notify components that reference the global composer.
    if (!_isGlobal) {
      _locale.value
    }
    return computed$1(() => {
      const ret = fn(_context)
      if (isNumber(ret) && ret === NOT_REOSLVED) {
        const key = argumentParser()
        return _fallbackRoot && __root
          ? fallbackSuccess(__root)
          : fallbackFail(key)
      } else if (successCondition(ret)) {
        return ret
      } else {
        /* istanbul ignore next */
        throw createI18nError(12 /* UNEXPECTED_RETURN_TYPE */)
      }
    })
  }
  // t
  function t(...args) {
    return defineComputed(
      context => translate(context, ...args),
      () => parseTranslateArgs(...args)[0],
      'translate',
      root => root.t(...args),
      key => key,
      val => isString$1(val)
    ).value
  }
  // d
  function d(...args) {
    return defineComputed(
      context => datetime(context, ...args),
      () => parseDateTimeArgs(...args)[0],
      'datetime format',
      root => root.d(...args),
      () => MISSING_RESOLVE_VALUE,
      val => isString$1(val)
    ).value
  }
  // n
  function n(...args) {
    return defineComputed(
      context => number(context, ...args),
      () => parseNumberArgs(...args)[0],
      'number format',
      root => root.n(...args),
      () => MISSING_RESOLVE_VALUE,
      val => isString$1(val)
    ).value
  }
  // for custom processor
  function normalize(values) {
    return values.map(val =>
      isString$1(val) ? createVNode(Text, null, val, 0) : val
    )
  }
  const interpolate = val => val
  const processor = {
    type: 'vnode',
    normalize,
    interpolate
  }
  // __transrateVNode, using for `i18n-t` component
  function __transrateVNode(...args) {
    return defineComputed(
      context => {
        let ret
        try {
          context.processor = processor
          ret = translate(context, ...args)
        } finally {
          context.processor = null
        }
        return ret
      },
      () => parseTranslateArgs(...args)[0],
      'translate',
      root => root.__transrateVNode(...args),
      key => key,
      val => isArray$1(val)
    ).value
  }
  // __numberParts, using for `i18n-n` component
  function __numberParts(...args) {
    return defineComputed(
      context => number(context, ...args),
      () => parseNumberArgs(...args)[0],
      'number format',
      root => root.__numberParts(...args),
      () => [],
      val => isString$1(val) || isArray$1(val)
    ).value
  }
  // __datetimeParts, using for `i18n-d` component
  function __datetimeParts(...args) {
    return defineComputed(
      context => datetime(context, ...args),
      () => parseDateTimeArgs(...args)[0],
      'datetime format',
      root => root.__datetimeParts(...args),
      () => [],
      val => isString$1(val) || isArray$1(val)
    ).value
  }
  // getLocaleMessage
  const getLocaleMessage = locale => _messages.value[locale] || {}
  // setLocaleMessage
  function setLocaleMessage(locale, message) {
    _messages.value[locale] = message
    _context.messages = _messages.value
  }
  // mergeLocaleMessage
  function mergeLocaleMessage(locale, message) {
    _messages.value[locale] = Object.assign(
      _messages.value[locale] || {},
      message
    )
    _context.messages = _messages.value
  }
  // getDateTimeFormat
  const getDateTimeFormat = locale => _datetimeFormats.value[locale] || {}
  // setDateTimeFormat
  function setDateTimeFormat(locale, format) {
    _datetimeFormats.value[locale] = format
    _context.datetimeFormats = _datetimeFormats.value
    clearDateTimeFormat(_context, locale, format)
  }
  // mergeDateTimeFormat
  function mergeDateTimeFormat(locale, format) {
    _datetimeFormats.value[locale] = Object.assign(
      _datetimeFormats.value[locale] || {},
      format
    )
    _context.datetimeFormats = _datetimeFormats.value
    clearDateTimeFormat(_context, locale, format)
  }
  // getNumberFormat
  const getNumberFormat = locale => _numberFormats.value[locale] || {}
  // setNumberFormat
  function setNumberFormat(locale, format) {
    _numberFormats.value[locale] = format
    _context.numberFormats = _numberFormats.value
    clearNumberFormat(_context, locale, format)
  }
  // mergeNumberFormat
  function mergeNumberFormat(locale, format) {
    _numberFormats.value[locale] = Object.assign(
      _numberFormats.value[locale] || {},
      format
    )
    _context.numberFormats = _numberFormats.value
    clearNumberFormat(_context, locale, format)
  }
  // for debug
  composerID++
  // watch root locale & fallbackLocale
  if (__root) {
    watch(__root.locale, val => {
      if (_inheritLocale) {
        _locale.value = val
        _context.locale = val
        updateFallbackLocale(_context, _locale.value, _fallbackLocale.value)
      }
    })
    watch(__root.fallbackLocale, val => {
      if (_inheritLocale) {
        _fallbackLocale.value = val
        _context.fallbackLocale = val
        updateFallbackLocale(_context, _locale.value, _fallbackLocale.value)
      }
    })
  }
  // export composable API!
  const composer = {
    // properties
    locale,
    fallbackLocale,
    get inheritLocale() {
      return _inheritLocale
    },
    set inheritLocale(val) {
      _inheritLocale = val
      if (val && __root) {
        _locale.value = __root.locale.value
        _fallbackLocale.value = __root.fallbackLocale.value
        updateFallbackLocale(_context, _locale.value, _fallbackLocale.value)
      }
    },
    get availableLocales() {
      return Object.keys(_messages.value).sort()
    },
    messages,
    datetimeFormats,
    numberFormats,
    get modifiers() {
      return _modifiers
    },
    get pluralRules() {
      return _pluralRules
    },
    get isGlobal() {
      return _isGlobal
    },
    get missingWarn() {
      return _missingWarn
    },
    set missingWarn(val) {
      _missingWarn = val
      _context.missingWarn = _missingWarn
    },
    get fallbackWarn() {
      return _fallbackWarn
    },
    set fallbackWarn(val) {
      _fallbackWarn = val
      _context.fallbackWarn = _fallbackWarn
    },
    get fallbackRoot() {
      return _fallbackRoot
    },
    set fallbackRoot(val) {
      _fallbackRoot = val
    },
    get fallbackFormat() {
      return _fallbackFormat
    },
    set fallbackFormat(val) {
      _fallbackFormat = val
      _context.fallbackFormat = _fallbackFormat
    },
    get warnHtmlMessage() {
      return _warnHtmlMessage
    },
    set warnHtmlMessage(val) {
      _warnHtmlMessage = val
      _context.warnHtmlMessage = val
    },
    __id: composerID,
    // methods
    t,
    d,
    n,
    getLocaleMessage,
    setLocaleMessage,
    mergeLocaleMessage,
    getDateTimeFormat,
    setDateTimeFormat,
    mergeDateTimeFormat,
    getNumberFormat,
    setNumberFormat,
    mergeNumberFormat,
    getPostTranslationHandler,
    setPostTranslationHandler,
    getMissingHandler,
    setMissingHandler,
    __transrateVNode,
    __numberParts,
    __datetimeParts
  }
  return composer
}

/**
 *  Legacy
 *
 *  This module is offered legacy vue-i18n API compatibility
 */
/**
 * Convert to I18n Composer Options from VueI18n Options
 *
 * @internal
 */
function convertComposerOptions(options) {
  const locale = isString$1(options.locale) ? options.locale : 'en-US'
  const fallbackLocale =
    isString$1(options.fallbackLocale) ||
    isArray$1(options.fallbackLocale) ||
    isPlainObject$1(options.fallbackLocale) ||
    options.fallbackLocale === false
      ? options.fallbackLocale
      : locale
  const missing = isFunction$1(options.missing) ? options.missing : undefined
  const missingWarn =
    isBoolean(options.silentTranslationWarn) ||
    isRegExp(options.silentTranslationWarn)
      ? !options.silentTranslationWarn
      : true
  const fallbackWarn =
    isBoolean(options.silentFallbackWarn) ||
    isRegExp(options.silentFallbackWarn)
      ? !options.silentFallbackWarn
      : true
  const fallbackRoot = isBoolean(options.fallbackRoot)
    ? options.fallbackRoot
    : true
  const fallbackFormat = !!options.formatFallbackMessages
  const pluralizationRules = options.pluralizationRules
  const postTranslation = isFunction$1(options.postTranslation)
    ? options.postTranslation
    : undefined
  const warnHtmlMessage = isString$1(options.warnHtmlInMessage)
    ? options.warnHtmlInMessage !== 'off'
    : true
  const inheritLocale = isBoolean(options.sync) ? options.sync : true
  let messages = options.messages
  if (isPlainObject$1(options.sharedMessages)) {
    const sharedMessages = options.sharedMessages
    const locales = Object.keys(sharedMessages)
    messages = locales.reduce((messages, locale) => {
      const message = messages[locale] || { [locale]: {} }
      Object.assign(message, sharedMessages[locale])
      return messages
    }, messages || {})
  }
  const { __i18n, __root } = options
  const datetimeFormats = options.datetimeFormats
  const numberFormats = options.numberFormats
  return {
    locale,
    fallbackLocale,
    messages,
    datetimeFormats,
    numberFormats,
    missing,
    missingWarn,
    fallbackWarn,
    fallbackRoot,
    fallbackFormat,
    pluralRules: pluralizationRules,
    postTranslation,
    warnHtmlMessage,
    inheritLocale,
    __i18n,
    __root
  }
}
/**
 * create VueI18n interface factory
 *
 * @internal
 */
function createVueI18n(options = {}) {
  const composer = createComposer(convertComposerOptions(options))
  // defines VueI18n
  const vueI18n = {
    /**
     * properties
     */
    // locale
    get locale() {
      return composer.locale.value
    },
    set locale(val) {
      composer.locale.value = val
    },
    // fallbackLocale
    get fallbackLocale() {
      return composer.fallbackLocale.value
    },
    set fallbackLocale(val) {
      composer.fallbackLocale.value = val
    },
    // messages
    get messages() {
      return composer.messages.value
    },
    // datetimeFormats
    get datetimeFormats() {
      return composer.datetimeFormats.value
    },
    // numberFormats
    get numberFormats() {
      return composer.numberFormats.value
    },
    // availableLocales
    get availableLocales() {
      return composer.availableLocales
    },
    // formatter
    get formatter() {
      // dummy
      return {
        interpolate() {
          return []
        }
      }
    },
    set formatter(val) {},
    // missing
    get missing() {
      return composer.getMissingHandler()
    },
    set missing(handler) {
      composer.setMissingHandler(handler)
    },
    // silentTranslationWarn
    get silentTranslationWarn() {
      return isBoolean(composer.missingWarn)
        ? !composer.missingWarn
        : composer.missingWarn
    },
    set silentTranslationWarn(val) {
      composer.missingWarn = isBoolean(val) ? !val : val
    },
    // silentFallbackWarn
    get silentFallbackWarn() {
      return isBoolean(composer.fallbackWarn)
        ? !composer.fallbackWarn
        : composer.fallbackWarn
    },
    set silentFallbackWarn(val) {
      composer.fallbackWarn = isBoolean(val) ? !val : val
    },
    // formatFallbackMessages
    get formatFallbackMessages() {
      return composer.fallbackFormat
    },
    set formatFallbackMessages(val) {
      composer.fallbackFormat = val
    },
    // postTranslation
    get postTranslation() {
      return composer.getPostTranslationHandler()
    },
    set postTranslation(handler) {
      composer.setPostTranslationHandler(handler)
    },
    // sync
    get sync() {
      return composer.inheritLocale
    },
    set sync(val) {
      composer.inheritLocale = val
    },
    // warnInHtmlMessage
    get warnHtmlInMessage() {
      return composer.warnHtmlMessage ? 'warn' : 'off'
    },
    set warnHtmlInMessage(val) {
      composer.warnHtmlMessage = val !== 'off'
    },
    // preserveDirectiveContent
    get preserveDirectiveContent() {
      return true
    },
    set preserveDirectiveContent(val) {},
    // for internal
    __id: composer.__id,
    __composer: composer,
    /**
     * methods
     */
    // t
    t(...args) {
      const [arg1, arg2, arg3] = args
      const options = {}
      let list = null
      let named = null
      if (!isString$1(arg1)) {
        throw createI18nError(13 /* INVALID_ARGUMENT */)
      }
      const key = arg1
      if (isString$1(arg2)) {
        options.locale = arg2
      } else if (isArray$1(arg2)) {
        list = arg2
      } else if (isPlainObject$1(arg2)) {
        named = arg2
      }
      if (isArray$1(arg3)) {
        list = arg3
      } else if (isPlainObject$1(arg3)) {
        named = arg3
      }
      return composer.t(key, list || named || {}, options)
    },
    // tc
    tc(...args) {
      const [arg1, arg2, arg3] = args
      const options = { plural: 1 }
      let list = null
      let named = null
      if (!isString$1(arg1)) {
        throw createI18nError(13 /* INVALID_ARGUMENT */)
      }
      const key = arg1
      if (isString$1(arg2)) {
        options.locale = arg2
      } else if (isNumber(arg2)) {
        options.plural = arg2
      } else if (isArray$1(arg2)) {
        list = arg2
      } else if (isPlainObject$1(arg2)) {
        named = arg2
      }
      if (isString$1(arg3)) {
        options.locale = arg3
      } else if (isArray$1(arg3)) {
        list = arg3
      } else if (isPlainObject$1(arg3)) {
        named = arg3
      }
      return composer.t(key, list || named || {}, options)
    },
    // te
    te(key, locale) {
      const targetLocale = isString$1(locale) ? locale : composer.locale.value
      const message = composer.getLocaleMessage(targetLocale)
      return resolveValue(message, key) !== null
    },
    // getLocaleMessage
    getLocaleMessage(locale) {
      return composer.getLocaleMessage(locale)
    },
    // setLocaleMessage
    setLocaleMessage(locale, message) {
      composer.setLocaleMessage(locale, message)
    },
    // mergeLocaleMessasge
    mergeLocaleMessage(locale, message) {
      composer.mergeLocaleMessage(locale, message)
    },
    // d
    d(...args) {
      return composer.d(...args)
    },
    // getDateTimeFormat
    getDateTimeFormat(locale) {
      return composer.getDateTimeFormat(locale)
    },
    // setDateTimeFormat
    setDateTimeFormat(locale, format) {
      composer.setDateTimeFormat(locale, format)
    },
    // mergeDateTimeFormat
    mergeDateTimeFormat(locale, format) {
      composer.mergeDateTimeFormat(locale, format)
    },
    // n
    n(...args) {
      return composer.n(...args)
    },
    // getNumberFormat
    getNumberFormat(locale) {
      return composer.getNumberFormat(locale)
    },
    // setNumberFormat
    setNumberFormat(locale, format) {
      composer.setNumberFormat(locale, format)
    },
    // mergeNumberFormat
    mergeNumberFormat(locale, format) {
      composer.mergeNumberFormat(locale, format)
    },
    // getChoiceIndex
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    getChoiceIndex(choice, choicesLength) {
      return -1
    },
    // for internal
    __onComponentInstanceCreated(target) {
      const { componentInstanceCreatedListener } = options
      if (componentInstanceCreatedListener) {
        componentInstanceCreatedListener(target, vueI18n)
      }
    }
  }
  return vueI18n
}

const baseFormatProps = {
  tag: {
    type: String
  },
  locale: {
    type: String
  },
  scope: {
    type: String,
    validator: val => val === 'parent' || val === 'global',
    default: 'parent'
  }
}

const Translation = defineComponent({
  /* eslint-disable */
  name: 'i18n-t',
  props: {
    ...baseFormatProps,
    keypath: {
      type: String,
      required: true
    },
    plural: {
      type: [Number, String],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      validator: val => isNumber(val) || !isNaN(val)
    }
  },
  /* eslint-enable */
  setup(props, context) {
    const { slots, attrs } = context
    const i18n = useI18n({ useScope: props.scope })
    const keys = Object.keys(slots).filter(key => key !== '_')
    return () => {
      const options = {}
      if (props.locale) {
        options.locale = props.locale
      }
      if (props.plural !== undefined) {
        options.plural = isString$1(props.plural) ? +props.plural : props.plural
      }
      const arg = getInterpolateArg(context, keys)
      const children = i18n.__transrateVNode(props.keypath, arg, options)
      return props.tag
        ? h(props.tag, { ...attrs }, children)
        : h(Fragment, { ...attrs }, children)
    }
  }
})
function getInterpolateArg({ slots }, keys) {
  if (keys.length === 1 && keys[0] === 'default') {
    // default slot only
    return slots.default ? slots.default() : []
  } else {
    // named slots
    return keys.reduce((arg, key) => {
      const slot = slots[key]
      if (slot) {
        arg[key] = slot()
      }
      return arg
    }, {})
  }
}

function renderFormatter(props, context, slotKeys, partFormatter) {
  const { slots, attrs } = context
  return () => {
    const options = { part: true }
    let orverrides = {}
    if (props.locale) {
      options.locale = props.locale
    }
    if (isString$1(props.format)) {
      options.key = props.format
    } else if (isPlainObject$1(props.format)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (isString$1(props.format.key)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        options.key = props.format.key
      }
      // Filter out number format options only
      orverrides = Object.keys(props.format).reduce((options, prop) => {
        return slotKeys.includes(prop)
          ? Object.assign({}, options, { [prop]: props.format[prop] }) // eslint-disable-line @typescript-eslint/no-explicit-any
          : options
      }, {})
    }
    const parts = partFormatter(...[props.value, options, orverrides])
    let children = [options.key]
    if (isArray$1(parts)) {
      children = parts.map((part, index) => {
        const slot = slots[part.type]
        return slot
          ? slot({ [part.type]: part.value, index, parts })
          : [part.value]
      })
    } else if (isString$1(parts)) {
      children = [parts]
    }
    return props.tag
      ? h(props.tag, { ...attrs }, children)
      : h(Fragment, { ...attrs }, children)
  }
}

const NUMBER_FORMAT_KEYS = [
  'localeMatcher',
  'style',
  'unit',
  'unitDisplay',
  'currency',
  'currencyDisplay',
  'useGrouping',
  'numberingSystem',
  'minimumIntegerDigits',
  'minimumFractionDigits',
  'maximumFractionDigits',
  'minimumSignificantDigits',
  'maximumSignificantDigits',
  'notation',
  'formatMatcher'
]
const NumberFormat = defineComponent({
  /* eslint-disable */
  name: 'i18n-n',
  props: {
    ...baseFormatProps,
    value: {
      type: Number,
      required: true
    },
    format: {
      type: [String, Object]
    }
  },
  /* eslint-enable */
  setup(props, context) {
    const i18n = useI18n({ useScope: 'parent' })
    return renderFormatter(props, context, NUMBER_FORMAT_KEYS, (...args) =>
      i18n.__numberParts(...args)
    )
  }
})

const DATETIME_FORMAT_KEYS = [
  'dateStyle',
  'timeStyle',
  'fractionalSecondDigits',
  'calendar',
  'dayPeriod',
  'numberingSystem',
  'localeMatcher',
  'timeZone',
  'hour12',
  'hourCycle',
  'formatMatcher',
  'weekday',
  'era',
  'year',
  'month',
  'day',
  'hour',
  'minute',
  'second',
  'timeZoneName'
]
const DatetimeFormat = defineComponent({
  /* eslint-disable */
  name: 'i18n-d',
  props: {
    ...baseFormatProps,
    value: {
      type: [Number, Date],
      required: true
    },
    format: {
      type: [String, Object]
    }
  },
  /* eslint-enable */
  setup(props, context) {
    const i18n = useI18n({ useScope: 'parent' })
    return renderFormatter(props, context, DATETIME_FORMAT_KEYS, (...args) =>
      i18n.__datetimeParts(...args)
    )
  }
})

function getComposer(i18n, instance) {
  if (i18n.mode === 'composable') {
    return i18n._getComposer(instance) || i18n.global
  } else {
    const vueI18n = i18n._getLegacy(instance)
    return vueI18n != null ? vueI18n.__composer : i18n.global
  }
}
function vTDirective(i18n) {
  const bind = (el, { instance, value, modifiers }) => {
    /* istanbul ignore if */
    if (!instance || !instance.$) {
      throw createI18nError(15 /* UNEXPECTED_ERROR */)
    }
    const composer = getComposer(i18n, instance.$)
    if (!composer) {
      throw createI18nError(19 /* NOT_FOUND_COMPOSER */)
    }
    const parsedValue = parseValue(value)
    el.textContent = composer.t(...makeParams(parsedValue))
  }
  return {
    beforeMount: bind,
    beforeUpdate: bind
  }
}
function parseValue(value) {
  if (isString$1(value)) {
    return { path: value }
  } else if (isPlainObject$1(value)) {
    if (!('path' in value)) {
      throw createI18nError(17 /* REQUIRED_VALUE */, 'path')
    }
    return value
  } else {
    throw createI18nError(18 /* INVALID_VALUE */)
  }
}
function makeParams(value) {
  const { path, locale, args, choice } = value
  const options = {}
  const named = args || {}
  if (isString$1(locale)) {
    options.locale = locale
  }
  if (isNumber(choice)) {
    options.plural = choice
  }
  return [path, named, options]
}

function apply(app, i18n, ...options) {
  const pluginOptions = isPlainObject$1(options[0]) ? options[0] : {}
  const useI18nComponentName = !!pluginOptions.useI18nComponentName
  const globalInstall = isBoolean(pluginOptions.globalInstall)
    ? pluginOptions.globalInstall
    : true
  if (globalInstall) {
    // install components
    app.component(
      !useI18nComponentName ? Translation.name : 'i18n',
      Translation
    )
    app.component(NumberFormat.name, NumberFormat)
    app.component(DatetimeFormat.name, DatetimeFormat)
  }
  // install directive
  app.directive('t', vTDirective(i18n))
  // setup global provider
  app.provide(I18nSymbol, i18n)
}

// supports compatibility for legacy vue-i18n APIs
function defineMixin(legacy, composer, i18n) {
  return {
    beforeCreate() {
      const instance = getCurrentInstance()
      /* istanbul ignore if */
      if (!instance) {
        throw createI18nError(15 /* UNEXPECTED_ERROR */)
      }
      const options = this.$options
      if (options.i18n) {
        const optionsI18n = options.i18n
        if (options.__i18n) {
          optionsI18n.__i18n = options.__i18n
        }
        optionsI18n.__root = composer
        this.$i18n = createVueI18n(optionsI18n)
        legacy.__onComponentInstanceCreated(this.$i18n)
        i18n._setLegacy(instance, this.$i18n)
      } else if (options.__i18n) {
        this.$i18n = createVueI18n({
          __i18n: options.__i18n,
          __root: composer
        })
        legacy.__onComponentInstanceCreated(this.$i18n)
        i18n._setLegacy(instance, this.$i18n)
      } else {
        // set global
        this.$i18n = legacy
      }
      // defines vue-i18n legacy APIs
      this.$t = (...args) => this.$i18n.t(...args)
      this.$tc = (...args) => this.$i18n.tc(...args)
      this.$te = (key, locale) => this.$i18n.te(key, locale)
      this.$d = (...args) => this.$i18n.d(...args)
      this.$n = (...args) => this.$i18n.n(...args)
    },
    mounted() {
      this.$el.__intlify__ = this.$i18n.__composer
    },
    beforeDestroy() {
      const instance = getCurrentInstance()
      /* istanbul ignore if */
      if (!instance) {
        throw createI18nError(15 /* UNEXPECTED_ERROR */)
      }
      delete this.$el.__intlify__
      delete this.$t
      delete this.$tc
      delete this.$te
      delete this.$d
      delete this.$n
      i18n._deleteLegacy(instance)
      delete this.$i18n
    }
  }
}

/**
 * I18n instance injectin key
 * @internal
 */
const I18nSymbol = Symbol.for('vue-i18n')
/**
 * I18n factory function
 *
 * @param options - see the {@link I18nOptions}
 * @returns {@link I18n} object
 *
 * @remarks
 * When you use Composable API, you need to specify options of {@link ComposerOptions}.
 * When you use Legacy API, you need toto specify options of {@link VueI18nOptions} and `legacy: true` option.
 *
 * @example
 * case: for Composable API
 * ```js
 * import { createApp } from 'vue'
 * import { createI18n, useI18n } from 'vue-i18n'
 *
 * // call with I18n option
 * const i18n = createI18n({
 *   locale: 'ja',
 *   messages: {
 *     en: { ... },
 *     ja: { ... }
 *   }
 * })
 *
 * const App = {
 *   setup() {
 *     // ...
 *     const { t } = useI18n({ ... })
 *     return { ... , t }
 *   }
 * }
 *
 * const app = createApp(App)
 *
 * // install!
 * app.use(i18n)
 * app.mount('#app')
 * ```
 *
 * @example
 * case: for Legacy API
 * ```js
 * import { createApp } from 'vue'
 * import { createI18n } from 'vue-i18n'
 *
 * // call with I18n option
 * const i18n = createI18n({
 *   legacy: true, // you must specify 'lagacy: true' option
 *   locale: 'ja',
 *   messages: {
 *     en: { ... },
 *     ja: { ... }
 *   }
 * })
 *
 * const App = {
 *   // ...
 * }
 *
 * const app = createApp(App)
 *
 * // install!
 * app.use(i18n)
 * app.mount('#app')
 * ```
 */
function createI18n(options = {}) {
  const __legacyMode = !!options.legacy
  const __composers = new Map()
  const __legaceis = new Map()
  const __global = __legacyMode
    ? createVueI18n(options)
    : createComposer(options)
  const i18n = {
    // mode
    get mode() {
      return __legacyMode ? 'legacy' : 'composable'
    },
    install(app, ...options) {
      apply(app, i18n, ...options)
      if (__legacyMode) {
        app.mixin(defineMixin(__global, __global.__composer, i18n))
      }
    },
    get global() {
      return __legacyMode ? __global.__composer : __global
    },
    _getComposer(instance) {
      return __composers.get(instance) || null
    },
    _setComposer(instance, composer) {
      __composers.set(instance, composer)
    },
    _deleteComposer(instance) {
      __composers.delete(instance)
    },
    _getLegacy(instance) {
      return __legaceis.get(instance) || null
    },
    _setLegacy(instance, legacy) {
      __legaceis.set(instance, legacy)
    },
    _deleteLegacy(instance) {
      __legaceis.delete(instance)
    }
  }
  return i18n
}
/**
 * Use Composable API starting function
 *
 * @param options - See {@link UseI18nOptions}
 * @returns {@link Composer} object
 *
 * @remarks
 * This function is mainly used by `setup`.
 * If options are specified, Composer object is created for each component and you can be localized on the component.
 * If options are not specified, you can be localized using the global Composer.
 *
 * @example
 * case: Component resource base localization
 * ```html
 * <template>
 *   <form>
 *     <label>{{ t('language') }}</label>
 *     <select v-model="locale">
 *       <option value="en">en</option>
 *       <option value="ja">ja</option>
 *     </select>
 *   </form>
 *   <p>message: {{ t('hello') }}</p>
 * </template>
 *
 * <script>
 * import { useI18n } from 'vue-i18n'
 *
 * export default {
 *  setup() {
 *    const { t, locale } = useI18n({
 *      locale: 'ja',
 *      messages: {
 *        en: { ... },
 *        ja: { ... }
 *      }
 *    })
 *    // Something to do ...
 *
 *    return { ..., t, locale }
 *  }
 * }
 * </script>
 * ```
 */
function useI18n(options = {}) {
  const i18n = inject(I18nSymbol)
  if (!i18n) {
    throw createI18nError(14 /* NOT_INSLALLED */)
  }
  const global = i18n.global
  let emptyOption = false
  // prettier-ignore
  const scope = (emptyOption = isEmptyObject(options)) // eslint-disable-line no-cond-assign
        ? 'global'
        : !options.useScope
            ? 'local'
            : options.useScope;
  if (emptyOption) {
    return global
  }
  const instance = getCurrentInstance()
  /* istanbul ignore if */
  if (instance == null) {
    throw createI18nError(15 /* UNEXPECTED_ERROR */)
  }
  if (scope === 'parent') {
    let composer = getComposer$1(i18n, instance)
    if (composer == null) {
      composer = global
    }
    return composer
  } else if (scope === 'global') {
    return global
  }
  // scope 'local' case
  if (i18n.mode === 'legacy') {
    throw createI18nError(16 /* NOT_AVAILABLE_IN_LEGACY_MODE */)
  }
  let composer = i18n._getComposer(instance)
  if (composer == null) {
    const type = instance.type
    const composerOptions = {
      ...options
    }
    if (type.__i18n) {
      composerOptions.__i18n = type.__i18n
    }
    if (global) {
      composerOptions.__root = global
    }
    composer = createComposer(composerOptions)
    setupLifeCycle(i18n, instance, composer)
    i18n._setComposer(instance, composer)
  }
  return composer
}
function getComposer$1(i18n, target) {
  let composer = null
  const root = target.root
  let current = target.parent
  while (current != null) {
    if (i18n.mode === 'composable') {
      composer = i18n._getComposer(current)
    } else {
      const vueI18n = i18n._getLegacy(current)
      if (vueI18n != null) {
        composer = vueI18n.__composer
      }
    }
    if (composer != null) {
      break
    }
    if (root === current) {
      break
    }
    current = current.parent
  }
  return composer
}
function setupLifeCycle(i18n, target, composer) {
  onMounted(() => {
    // inject composer instance to DOM for intlify-devtools
    if (target.proxy) {
      target.proxy.$el.__intlify__ = composer
    }
  }, target)
  onUnmounted(() => {
    // remove composer instance from DOM for intlify-devtools
    if (target.proxy && target.proxy.$el.__intlify__) {
      delete target.proxy.$el.__intlify__
    }
    i18n._deleteComposer(target)
  }, target)
}

//
//
//
//
//
//
//
//
//
//
//

var script = {
  name: 'App'
}

const _hoisted_1 = /*#__PURE__*/ createVNode(
  'option',
  { value: 'en' },
  'en',
  -1 /* HOISTED */
)
const _hoisted_2 = /*#__PURE__*/ createVNode(
  'option',
  { value: 'ja' },
  'ja',
  -1 /* HOISTED */
)

function render(_ctx, _cache) {
  return (
    openBlock(),
    createBlock(
      Fragment,
      null,
      [
        createVNode('form', null, [
          createVNode(
            'label',
            null,
            _toDisplayString(_ctx.$t('language')),
            1 /* TEXT */
          ),
          withDirectives(
            createVNode(
              'select',
              {
                'onUpdate:modelValue':
                  _cache[1] ||
                  (_cache[1] = $event => (_ctx.$i18n.locale = $event))
              },
              [_hoisted_1, _hoisted_2],
              512 /* NEED_PATCH */
            ),
            [[vModelSelect, _ctx.$i18n.locale]]
          )
        ]),
        createVNode('p', null, _toDisplayString(_ctx.$t('hello')), 1 /* TEXT */)
      ],
      64 /* STABLE_FRAGMENT */
    )
  )
}

function i18n(Component) {
  const options =
    typeof Component === 'function' ? Component.options : Component
  options.__i18n = options.__i18n || []
  options.__i18n.push({
    en: { language: 'Language', hello: 'hello, world!' },
    ja: { language: '言語', hello: 'こんにちは、世界！' }
  })
}

if (typeof i18n === 'function') i18n(script)

script.render = render
script.__file = 'examples/legacy/App.vue'

const i18n$1 = createI18n({
  legacy: true,
  locale: 'ja',
  messages: {}
})

const app = createApp(script)

app.use(i18n$1)
app.mount('#app')
