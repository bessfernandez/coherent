/*jsl:import ../../foundation.js*/


/** Constructor for the data kept for each observable/observed key.
  
    @property __uid An unique identifier for this key info, used in creating the
            parent link information.
    @property getter  A reference to the getter function (if one exists) used
              to retrieve the current value from an object.
    @property setter   A reference to the setter function (if one exists) which
              will be used to update the key for an object.
    @property validator A reference to the validation method (usually in the
              form `validate` + key) which _may_ be invoked to
              determine whether a value is valid. This method is
              **never** called by `setValueForKey` and should only be
              called by user interface code.
    @property key The original key name that this KeyInfo object represents.
    @property mutable Is the field with this key name mutable on objects? A
              field is not mutable if a getter function exists but no
              setter function exists.
    @property changeCount The number of times `willChangeValueForKey` has been
                called. This is decremented each time
                `didChangeValueForKey` is called.
  
    @private
 */
coherent.KeyInfo= Class._create({

  /** Create a new KeyInfo object.
      
      @param {Object} obj the object on which the key is defined
      @param {String} key the name of the key to manage
   */
  constructor: function(key, obj)
  {
    var info= coherent.KeyInfo.getInfoForKeyOnObject(key, obj);
    
    this.__uid= [key, coherent.generateUid()].join('_');

    this.key= key;
    this.getter= info.methods.get;
    this.setter= info.methods.set;
    this.validator= info.methods.validate;
    // this.methods= info.methods;
    this.properties= info.properties;
    
    //  Obviously, a key is mutable if there's a setter defined, but
    //  if the key has neither getter or setter methods, then I
    //  access it via direct property access and the key is mutable
    this.mutable= ((this.setter||!this.getter)?true:false);

    if (!this.getter && !this.setter)
      this.mutable= true;

    //  changeCount is the number of times willChangeValueForKey has been
    //  called. This is decremented for each call to didChangeValueForKey.
    //  When this value returns to 0, a change notification is issued. The
    //  previous value is only cached for the first change.
    this.changeCount= 0;
    
    var value=null;
    
    if (this.properties)
    {
      if (!obj.__lookupGetter__(key))
      {
        value= this.value= obj[key];
        delete obj[key];
      }
      else
        value= this.value= ('value' in info) ? info.value : null;
      if ('undefined'===typeof(this.value))
        value= this.value= null;
    }
    else
      value= (key in obj)?obj[key]:null;
      
    //  Setup initial parent link for value if there is one
    if (!value || !value.addObserverForKeyPath)
      return;
      
    coherent.KVO.linkChildToParent(value, obj, this);
  },
  
  /** Retrieve the value of this key for a given object. If the value can have
      a parent link, this method will create it.
    
      @param {coherent.KVO} obj the KVO instance from which to fetch the
           value.
      @returns the current value of the key for the specified object
   */
  get: function(obj)
  {
    //  This is kind of tortured logic, because undefined is reserved to
    //  mean that there's a missing object in the keyPath chain. So the
    //  result of valueForKey should NEVER be undefined.

    //  Note, these methods are the original methods rather than the
    //  wrapped methods that get installed on the object or prototype.
    var value;
    
    if (this.getter)
      value= this.getter.call(obj);
    else if (this.properties)
      value= this.value;
    else
      value= (this.key in obj)?obj[this.key]:null;
    
    if (value && value.addObserverForKeyPath)
      coherent.KVO.linkChildToParent(value, obj, this);
    else if (this.parentLink)
      coherent.KVO.breakParentChildLink(this);
      
    return value;
  },
  
  /** Store a new value for a given object. This method will call a setter
      method if one exists, or otherwise will call `willChangeValueForKey`,
      update the field directly, and then call `didChangeValueForKey`.
    
      @param obj  the object to modify
      @param newValue the new value that will replace the old value.
   */
  set: function(obj, newValue)
  {
    //  bracket modification of the value with change notifications.
    //  This should only ever be executed for MSIE or other browsers
    //  that don't support properties.
    obj.willChangeValueForKey(this.key, this);
    
    if (this.setter)
      this.setter.call(obj, newValue);
    else if (this.properties)
      this.value= ('undefined'===typeof(newValue))?null:newValue;
    else
      obj[this.key]= newValue;
      
    obj.didChangeValueForKey(this.key, this);
  },
  
  /** Validate the new value for a given object. This method will call a
    validator function if one exists. Otherwise, it will simply return true.
   */
  validate: function(obj, newValue)
  {
    if (!this.validator)
      return newValue;
    return this.validator.call(obj, newValue);
  },
  
  /** Remove the parent link for this KeyInfo object. Child object reference
      the parentLink rather than the owner object directly. This gives the
      owner a method to disconnect from the child without maintaining a
      reference to the child.
   */
  unlinkParentLink: function()
  {
    if (!this.parentLink)
      return;
    this.parentLink.observer= null;
    this.parentLink.callback= null;
    this.parentLink= null;
  }

});

coherent.KeyInfo.getInfoForKeyOnObject= function(key, object)
{
  var KeyInfo= coherent.KeyInfo;
  var classInfo= coherent.KVO.getClassInfoForObject(object);
  var classKeyInfo= classInfo && classInfo.methods[key];
  
  if (classKeyInfo)
    return classKeyInfo;
  
  var constructor= object.constructor;
  var proto= constructor.prototype;
  var objectIsPrototype= (proto==object);
  var target= (proto!=Object.prototype &&
              proto!=coherent.KVO.prototype)?proto:object;

  var keyAsTitle= key.titleCase();
  var names= {
    get: "get" + keyAsTitle,
    set: "set" + keyAsTitle,
    validate: "validate" + keyAsTitle,
    count: "countOf" + keyAsTitle
  };

  var value=null;
  var methods= {};
  var wrappedMethods= {};
  
  var properties= coherent.Support.Properties &&
          ('undefined'!==typeof(methods.get=target.__lookupGetter__(key)) &&
           'undefined'!==typeof(methods.set=target.__lookupSetter__(key)));

  if (!properties)
  {
    if (names.get in target)
      methods.get= object[names.get];
    else
    {
      names.get= key;
      methods.get= object[key];
    }
    methods.set= object[names.set];
  }
  methods.validate= object[names.validate];
  methods.count= object[names.count];

  /*  If the key is a to-many property on kvoClass, find the appropriate
    getter/setter methods.
   */
  if (methods.count)
  { 
    Object.extend(names, {
      objectAtIndex: "objectIn" + keyAsTitle + "AtIndex",
      objectsAtIndexes: key + "AtIndexes",
      insertObjectAtIndex: "insertObjectIn" + keyAsTitle + "AtIndex",
      insertObjectsAtIndexes: "insert" + keyAsTitle + "AtIndexes",
      addObject: "add" + keyAsTitle + "Object",
      addObjects: "add" + keyAsTitle,
      removeObject: "remove" + keyAsTitle + "Object",
      removeObjects: "remove" + keyAsTitle,
      removeObjectAtIndex: "removeObjectFrom" + keyAsTitle + "AtIndex",
      removeObjectsAtIndexes: "remove" + keyAsTitle + "AtIndexes",
      replaceObjectAtIndex: "replaceObjectIn" + keyAsTitle + "AtIndexWithObject",
      replaceObjectsAtIndexes: "replace" + keyAsTitle + "AtIndexesWith" + keyAsTitle
    });
  
    methods.objectAtIndex= object[names.objectAtIndex];
    methods.objectsAtIndexes= object[names.objectsAtIndexes];
    methods.insertObjectAtIndex= object[names.insertObjectAtIndex];
    methods.insertObjectsAtIndexes= object[names.insertObjectsAtIndexes];
    methods.addObject= object[names.addObject];
    methods.addObjects= object[names.addObjects];
    methods.removeObject= object[names.removeObject];
    methods.removeObjects= object[names.removeObjects];
    methods.removeObjectAtIndex= object[names.removeObjectAtIndex];
    methods.removeObjectsAtIndexes= object[names.removeObjectsAtIndexes];
    methods.replaceObjectAtIndex= object[names.replaceObjectAtIndex];
    methods.replaceObjectsAtIndexes= object[names.replaceObjectsAtIndexes];
  }
  else if ('function'!==typeof(methods.get))
  {
    /*  If the class doesn't define a countOf<Key> method, it's not a
      to-many relation. So if the getter isn't a function, we need to
      define property methods (if the browser supports properties).
     */
    value= methods.get;
    methods.get= methods.set= null;
    properties= coherent.Support.Properties;
    if (properties)
      KeyInfo.createWrappedPropertyMethodsForKey(wrappedMethods, key);
  }
  else
  {
    if (methods.get)
    {
      if (methods.get.__key===key)
      {
        wrappedMethods.get= methods.get;
        methods.get= methods.get.originalMethod;
      }
      else
      {
        wrappedMethods.get= KeyInfo.wrapMethod(KeyInfo.wrapGetMethod, methods.get, key);
      }
    }
    if (methods.set)
    {
      if (methods.set.__key===key)
      {
        wrappedMethods.set= methods.set;
        methods.set= methods.set.originalMethod;
      }
      else
      {
        wrappedMethods.set= KeyInfo.wrapMethod(KeyInfo.wrapSetMethod, methods.set, key);
      }
    }
  }

  wrappedMethods.validate= methods.validate;
  wrappedMethods.properties= properties;

  if (properties)
  {
    if (target.hasOwnProperty(key))
    {
      value= target[key];
      delete target[key];
    }
    target.__defineGetter__(key, wrappedMethods.get);
    target.__defineSetter__(key, wrappedMethods.set);
  }
  else if (methods.get)
  {
    if (object.hasOwnProperty(names.get))
      object[names.get]= wrappedMethods.get;
    else
      target[names.get]= wrappedMethods.get;

    if (methods.set)
    {
      if (object.hasOwnProperty(names.set))
        object[names.set]= wrappedMethods.set;
      else
        target[names.set]= wrappedMethods.set;
    }
  }

  for (var name in names)
  {
    //  Method the same
    if (!wrappedMethods[name] || wrappedMethods[name]===object[name])
      continue;
    wrappedMethods[name].displayName= names[name];
    if ('get'===name || 'set'===name)
      continue;
    if (object.hasOwnProperty(name))
      object[name]= wrappedMethods[name];
    else
      target[name]= wrappedMethods[name];
  }

  return classInfo.methods[key]= {
    value: value,
    methods: methods,
    properties: properties
  };
}

/** Create property getter/setter methods for a key. The actual value of the
    key will be stored in a field on the keyInfo for this key. The getter
    and setter methods will automatically call willChange & didChange and
    addParentLink.
  
    @param {Object} methods - The collection of methods
    @param {String} key - the name of the key to wrap
 */
coherent.KeyInfo.createWrappedPropertyMethodsForKey= function(methods, key)
{
  /** The methods that will be returned.
   */
  function propertyGetter()
  {
    var keyInfo= this.infoForKey(propertyGetter.__key);
    var value= keyInfo.value;

    if (value && value.addObserverForKeyPath)
      coherent.KVO.linkChildToParent(value, this, keyInfo);
    else if (keyInfo.parentLink)
      coherent.KVO.breakParentChildLink(keyInfo);
    return value;
  }
  
  function propertySetter(newValue)
  {
    var key= propertySetter.__key;
    var keyInfo= this.infoForKey(key);

    this.willChangeValueForKey(key, keyInfo);
    /*  Change undefined values to null, because undefined is used
      as a marker that an object in the hierarchy didn't exist.
     */
    if ('undefined'===typeof(newValue))
      newValue= null;
    keyInfo.value= newValue;
    this.didChangeValueForKey(key, keyInfo);
    return newValue;
  }

  methods.get= propertyGetter;
  methods.set= propertySetter;
  methods.get.__key= key;
  methods.set.__key= key;
  
  return methods;
}

coherent.KeyInfo.wrapMethod= function(wrapper, originalMethod, key)
{
  var newMethod= wrapper();
  newMethod.valueOf= function() { return originalMethod; }
  newMethod.toString= function() { return String(originalMethod); }
  newMethod.__key= key;
  newMethod.originalMethod= originalMethod;
  return newMethod;
}


/** Create a wrapper function that will invoke willChange before
    calling the original setter and didChange after calling the
    original setter.
  
    @type Function
 */
coherent.KeyInfo.wrapSetMethod= function()
{
  /** A wrapper around a KVO setter method that calls willChangeValueForKey
    before calling the setter and didChangeValueForKey after calling.
   */
  function wrappedSetter(value)
  {
    var keyInfo= this.infoForKey(wrappedSetter.__key);
    this.willChangeValueForKey(wrappedSetter.__key, keyInfo);
    var result= wrappedSetter.originalMethod.call(this, value);
    this.didChangeValueForKey(wrappedSetter.__key, keyInfo);
    return result;
  }
  return wrappedSetter;
}

/** Create a wrapped getter function which will ensure that the parent link
    is added to all property values.
  
    @type Function
 */
coherent.KeyInfo.wrapGetMethod= function()
{
  /** A wrapper around the KVO object's getter method that will add a
      link back to the KVO object from the value returned. This allows
      change notifications to propagate back to the original owner.
      @inner
      @function
   */
  function wrappedGetter()
  {
    var value= wrappedGetter.originalMethod.call(this);
    
    var keyInfo= this.__kvo.keys[wrappedGetter.__key];
    if (!keyInfo)
      return value;
  
    if (value && value.addObserverForKeyPath)
      coherent.KVO.linkChildToParent(value, this, keyInfo);
    else if (keyInfo.parentLink)
      coherent.KVO.breakParentChildLink(keyInfo);
      
    return value;
  }
  return wrappedGetter;
}

Object.markMethods(coherent.KeyInfo);