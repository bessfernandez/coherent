/*jsl:import startup.js*/
/*jsl:import Error.js*/
/*jsl:import ChangeNotification.js*/
/*jsl:import ObserverEntry.js*/
/*jsl:import KeyInfo.js*/
/*jsl:import KeyPathTrie.js*/


/** KVO is the base of all key value observing compliant classes. Classes which
    intend to participate in binding and change notifications should (probably)
    be subclasses of KVO.

    @property __mutableKeys - An array of keys which should be assumed to be
      the sum total mutable properties on the object or class, regardless of
      what introspection might otherwise reveal.
 */
coherent.KVO= Class.create({

    /** Initialiser for the KVO class. This doesn't actually do anything
        specific. Most initialisation is defered to exactly when it's needed.
        This is a practical decision rather than an optimisation decision,
        because objects which are not directly derived from coherent.KVO may be
        adapted for key value compliance. Therefore, the KVO constructor would
        not have executed for those objects.
     */
    constructor: function(hash)
    {
        this.initialiseKeyValueObserving();
        
        var v;
        
        if (!hash)
            return;
            
        for (var p in hash)
        {
            v= hash[p];
            if ('function'===typeof(v))
                this[p]= v;
            else
                this.setValueForKey(v, p);
        }
    },

    /** The factory method for KVO and any derived classes. This factory method
        simply passes along the parameters to the constructor.
     */
    __factory__: function()
    {
        var args= Array.from(arguments);
        var klass= this;
    
        function dummyConstructor(){}
    
        return function()
        {
            dummyConstructor.prototype= klass.prototype;
            var obj= new dummyConstructor();
            klass.prototype.constructor.apply(obj, args);
            return obj;
        };
    },

    /** Set a value for a particular key path on the given object.

        @param value - the value to assign
        @param {String} keyPath - where to store the value

        @throws `InvalidArgumentError` if the keyPath is null
     */
    setValueForKeyPath: function(value, keyPath)
    {
        if (!keyPath || 0===keyPath.length)
            throw new InvalidArgumentError( "keyPath may not be empty" );

        //  if the keyPath is a string, split it into an array on the period
        //  between each key
        if ("string"===typeof(keyPath))
            keyPath= keyPath.split(".");

        var key= keyPath.shift();
        
        //  Handle degenerate case where there is only one key
        if (!keyPath.length)
        {
            this.setValueForKey(value, key);
            return;
        }
    
        //  silently fail, because keyPaths with array operators are immutable.
        if ('@'===key.charAt(0))
            return;

        //  Find the key value
        var object= this.valueForKey(key);

        if (!object)
            return;
                                
        //  ask it to set the value based on the remaining key path
        object.setValueForKeyPath(value, keyPath);
    },

    /** Set a value for a particular key on the given object. A key is a leaf
        attribute.

        @param value - the value to assign
        @param {String} key - the name of the attribute to assign

        @throws `InvalidArgumentError` if a null key is used
     */
    setValueForKey: function(value, key)
    {
        if (!key || 0===key.length)
            throw new InvalidArgumentError( "key may not be empty" );

        //  can't change value of readonly attributes
        var keyInfo= this.infoForKey(key);
        if (!keyInfo || !keyInfo.mutable)
            return;

        keyInfo.set(this, value);
    },

    /** Retrieve the value for a particular key path on the given object.
  
        @param {String} keyPath - where to find the value
  
        @returns the value of the given key or `undefined` if an object in the
             keypath chain was missing.
    
        @throws `InvalidArgumentError` if the keyPath is empty
     */
    valueForKeyPath: function(keyPath)
    {
        if (!keyPath || 0===keyPath.length)
            throw new InvalidArgumentError( "keyPath may not be empty" );
    
        //  if the keyPath is a string, split it into an array on the period
        //  between each key
        if ("string"===typeof(keyPath))
            keyPath= keyPath.split(".");

        var key= keyPath.shift();
    
        //  Handle degenerate case where there is only one key
        if (!keyPath.length)
            return this.valueForKey(key);
    
        if ('@'===key.charAt(0))
        {
            var operator= key.substr(1);
            var values= this.valueForKeyPath(keyPath);
            return coherent.ArrayOperator[operator](values);
        }

        //  Find the key value
        var object= this.valueForKey(key);

        //  if there is no value for the container, return null for the terminal
        //  value -- this makes bindings work for containers that haven't been
        //  created yet.
        if ('undefined'===typeof(object) || null===object)
            return undefined;

        //  ask it to get the value based on the remaining key path
        return object.valueForKeyPath(keyPath);
    },

    /** Retrieve the value of a particular key for this object.

        @param {String} key  the name of the attribute to retrieve.

        @returns the value of the key
        @throws `InvalidArgumentError` if the key is null
     */
    valueForKey: function(key)
    {
        if (!key || 0===key.length)
            throw new InvalidArgumentError( "the key is empty" );

        var keyInfo= this.infoForKey(key);

        if (!keyInfo)
            return null;

        return keyInfo.get(this);
    },

    /** Determine whether the value may be assigned to the property represented
        by keyPath.
  
        @param value - the value to validate
        @param {String} keyPath - where to find the value
  
        @returns a valid value or an instance of {@link coherent.Error} if the
            value could not be coerced into a valid value.
    
        @throws `InvalidArgumentError` if the keyPath is empty
     */
    validateValueForKeyPath: function(value, keyPath)
    {
        if (!keyPath || 0===keyPath.length)
            throw new InvalidArgumentError( "keyPath may not be empty" );
    
        //  if the keyPath is a string, split it into an array on the period
        //  between each key
        if ("string"==typeof(keyPath))
            keyPath= keyPath.split(".");

        var key= keyPath.shift();
    
        //  Handle degenerate case where there is only one key
        if (!keyPath.length)
            return this.validateValueForKey(value, key);

        //  Find the key value
        var object= this.valueForKey(key);

        //  if there is no value for the container, then just return the
        //  value...
        //  TODO: Is this really correct?
        if ('undefined'===typeof(object) || null===object)
            return value;

        //  ask it to validate the value based on the remaining key path
        return object.validateValueForKeyPath(value, keyPath);
    },


    /** Validate the value to be assigned to a key.
    
        @param value - the value to check
        @param {String} key - the key to check
    
        @returns A valid value or an instance of {@link coherent.Error} to
            signify that the value could not be coerced into a valid value.
    
        @throws `InvalidArgumentError` if the key is null or empty.
     */
    validateValueForKey: function(value, key)
    {
        if (!key || !key.length)
            throw new InvalidArgumentError("missing key");
        
        var keyInfo= this.infoForKey(key);
        return keyInfo.validate(this, value);
    },

    /** Change notification handler for property values. This handler receives a
        notification for changes to the key values of contained objects.
  
        @private
  
        @param {coherent.ChangeNotification} change - a ChangeNotification object
        @param {String} keyPath - the key path that has changed
        @param context - the context information original specified for this key
     */
    observeChildObjectChangeForKeyPath: function(change, keyPath, context)
    {
        //  Pass this along up the change
        if (coherent.KVO.kAllPropertiesKey!==keyPath)
            // keyPath= context + '.' + keyPath;
            keyPath= [context,'.',keyPath].join('');
        else
            keyPath= context;

        var previousObject= change.object;
        change.object= this;
        this.notifyObserversOfChangeForKeyPath(change, keyPath);
        change.object= previousObject;
    },

    /** Discover information about the specified key.
  
        @param {String} keyPath - path to the attribute
        @returns {coherent.KeyInfo} an instance of KeyInfo for the specified keyPath
        @throws `InvalidArgumentError` if the keyPath is null
     */
    infoForKeyPath: function(keyPath)
    {
        if (!keyPath || 0===keyPath.length)
            throw new InvalidArgumentError( "keyPath is empty" );

        //  if the keyPath is a string, split it into an array on the period
        //  between each key
        if ("string"==typeof(keyPath))
            keyPath= keyPath.split(".");
    
        var key= keyPath.shift();
    
        //  Handle degenerate case where there is only one key
        if (!keyPath.length)
            return this.infoForKey(key);
            
        if ('@'===key.charAt(0))
            //  Array operators make a keyPath immutable.
            return {
                mutable: false
            };
        //  Find the key value
        var object= this.valueForKey(key);

        //  If an object along the way is null, then return that the key in
        //  question can't be read and can't be written.
        if (!object)
            return undefined;

        if (!object.infoForKeyPath)
            return undefined;
            
        //  ask it to set the value based on the remaining key path
        return object.infoForKeyPath(keyPath);
    },

    /** Discover information about the specified key.
        @type coherent.KeyInfo
        @param {String} key - The name of the key to retrieve information about.
     */
    infoForKey: function(key)
    {
        if (coherent.KVO.kAllPropertiesKey==key)
            return null;
        
        if (!this.__kvo)
            this.initialiseKeyValueObserving();
    
        var keys= this.__kvo.keys;
        if (key in keys)
            return keys[key];
        return keys[key]= new coherent.KeyInfo(key, this);
    },

    /** Register dependent key for a set of keys. When any one of the set of
        keys changes, observers of the dependent key will be notified of a
        change to the dependent key. This is useful for a (read-only) composite
        value or similar.
    
        Consider declaring key dependencies via the keyDependencies prototype
        member instead of calling this method directly.
  
        @param {String[]} keys - an array of keys which will trigger a change
            notification to the dependent key.
        @param {String} dependentKey - the name of a dependent key
        @throws `InvalidArgumentError` if either the keys or dependentKey is null.
     */
    setKeysTriggerChangeNotificationsForDependentKey: function(keys, dependentKey)
    {
        if (!keys || !keys.length)
            throw new InvalidArgumentError("keys array is not valid");

        if (!dependentKey)
            throw new InvalidArgumentError("dependentKey can not be null");
    
        if (-1!==dependentKey.indexOf('.'))
            throw new InvalidArgumentError('dependentKey may not be a key path');
        
        if ('string'===typeof(keys))
            keys= [keys];
    
        var dependentKeys;
        var isPrototype= (this.constructor.prototype===this);
        
        //  Find the correct location for the dependent key info
        if (isPrototype)
            dependentKeys= coherent.KVO.getClassInfoForObject(this).dependentKeys;
        else
        {
            if (!this.__kvo)
                this.initialiseKeyValueObserving();
            dependentKeys= this.__kvo.dependentKeys;
        }
        
        var swizzle= coherent.KeyInfo.getInfoForKeyOnObject;

        var key;
        var keyIndex= keys.length;
        var dependencies;
        
        while (keyIndex--)
        {
            key= keys[keyIndex];
            if (!key)
                throw new InvalidArgumentError("key at index " + keyIndex +
                                               " was null");

            if (isPrototype)
                swizzle(key, this);
            else
                this.infoForKey(key);
                
            if (key in dependentKeys)
                dependencies= dependentKeys[key];
            else
                dependencies= (dependentKeys[key]=[]);
                
            if (-1==dependencies.indexOf(dependentKey))
                dependencies.push(dependentKey);
        }
    },

    /** Initialise Key Value Observing for this object.
     */
    initialiseKeyValueObserving: function()
    {
        //  Setting observers early helps prevent cycles when initialising
        //  key-value observing
        if (!this.hasOwnProperty("__uid"))
            this.__uid= coherent.generateUid();
        coherent.KVO.createInstanceDataForObject(this);
    },

    /** Register for changes to a particular key path.
  
        @param observer     the object interested in changes to the value of key
                            path
        @param callback     (optional) the function to call when the key changes,
                            defaults to "observeChangesForKeyPath"
        @param keyPath      the key path of interest
        @param context      a value passed back to the callback -- meaningful only
                            to the observer
    
        @throws `InvalidArgumentError` when the keypath is empty, observer is null,
                callback is null.
     */
    addObserverForKeyPath: function(observer, callback, keyPath, context)
    {
        if (!keyPath || 0===keyPath.length)
            throw new InvalidArgumentError( "keyPath is empty" );
                                
        if (!observer)
            throw new InvalidArgumentError( "Observer may not be null" );

        if (!observer.hasOwnProperty('__uid'))
            observer.__uid= coherent.generateUid();

        if (!callback)
            callback= observer["observeChangeForKeyPath"];
    
        if ('string'===typeof(callback))
            callback= observer[callback];
        
        if (!callback)
            throw new InvalidArgumentError( "Missing callback method" );

        if (!this.__kvo)
            this.initialiseKeyValueObserving();

        var __observers= this.__kvo.observers;
        if (!__observers[keyPath])
        {
            //  fetch the keyInfo for this keyPath, to swizzle setter methods
            //  along the path to fire willChange/didChange methods.
            this.infoForKeyPath(keyPath);
            __observers[keyPath]= [];
        }

        this.__kvo.keypathTrie.add(keyPath, keyPath);
    
        var observerEntry= new coherent.ObserverEntry(observer, callback,
                                                      context);

        __observers[keyPath].push(observerEntry);
    },

    /** Remove an observer for a keyPath.
  
        @param {Object} observer - the object interested in changes to the value
            of key path
        @param {String} keyPath - the key path of interest
     */
    removeObserverForKeyPath: function(observer, keyPath)
    {
        if (!keyPath || 0===keyPath.length)
            throw new InvalidArgumentError( "keyPath may not be empty" );
                                
        if (!observer)
            throw new InvalidArgumentError( "Observer may not be null" );

        if (!this.__kvo)
            this.initialiseKeyValueObserving();
        
        var __observers= this.__kvo.observers;
    
        if (!__observers[keyPath])
            return;

        var allObservers= __observers[keyPath];
        
        var entryIndex=allObservers.length;
        var entry;

        //  TODO: This could be faster... It shouldn't be necessary to scan
        //  the entire list of observers.
        while (entryIndex--)
        {
            entry= allObservers[entryIndex];
            if (entry.observer==observer)
            {
                allObservers.splice(entryIndex, 1);
                return;
            }
        }
        
    },

    /** Prepares for a later invocation of didChangeValueForKey by caching the
        previous value in the key's KeyInfo structure. Should be called for
        manual KVO implementation.
  
        @param {String} key - the key that has changed
        @throws `InvalidArgumentError` if the key is null
     */
    willChangeValueForKey: function(key, keyInfo)
    {
        if (!this.__kvo)
            return;
            
        if (!key)
            throw new InvalidArgumentError("key may not be null");

        keyInfo= (keyInfo && 'get' in keyInfo) ? keyInfo : this.infoForKey(key);
        // keyInfo= (keyInfo && 'get' in keyInfo) ? keyInfo : this.__kvo.keys[key];
        if (!keyInfo)
            return;

        //  Only remember the previous value the first time
        //  willChangeValueForKey is called.
        if (1!==++keyInfo.changeCount)
            return;

        keyInfo.previousValue= keyInfo.get(this);
    },

    forceChangeNotificationForKey: function(key, keyInfo)
    {
        if (!key)
            throw new InvalidArgumentError( "key may not be null" );

        keyInfo= (keyInfo && 'get' in keyInfo) ? keyInfo : this.infoForKey(key);
        // keyInfo= (keyInfo && 'get' in keyInfo) ? keyInfo : this.__kvo.keys[key];
        if (!keyInfo)
            return;
        
        if (0!==keyInfo.changeCount)
            return;
        keyInfo.changeCount=1;
        this.didChangeValueForKey(key, keyInfo);
    },

    /** Invoked to notify observers that the value has changed.
  
        @param {String} key - the key that has changed
        @throws `InvalidArgumentError` if the key is null
     */
    didChangeValueForKey: function(key, keyInfo)
    {
        if (!this.__kvo)
            return;
            
        if (!key)
            throw new InvalidArgumentError( "key may not be null" );

        keyInfo= (keyInfo && 'get' in keyInfo) ? keyInfo : this.infoForKey(key);
        // keyInfo= (keyInfo && 'get' in keyInfo) ? keyInfo : this.__kvo.keys[key];
        if (!keyInfo)
            return;

        //  If this isn't the final call to didChangeValueForKey, don't issue
        //  the change notification.
        if (0!==--keyInfo.changeCount)
            return;
        
        var newValue= keyInfo.get(this);
        var previousValue= keyInfo.previousValue;
        keyInfo.previousValue= null;
    
        if (newValue!==previousValue)
        {
            var change= new coherent.ChangeNotification(this,
                                                        coherent.ChangeType.setting,
                                                        newValue, previousValue);
            this.notifyObserversOfChangeForKeyPath(change, key);
    
            //  stop observing changes to old value
            if (previousValue && previousValue.addObserverForKeyPath)
                coherent.KVO.unlinkChildFromParent(previousValue, this, keyInfo);

            //  observe changes to the new value
            if (newValue && newValue.addObserverForKeyPath)
                coherent.KVO.linkChildToParent(newValue, this, keyInfo);
        }

        //  Fire change notification for dependent keys
        var dependentKeys= this.__kvo.dependentKeys[key];
        var len= dependentKeys && dependentKeys.length;
        
        while (len--)
        {
            keyInfo= this.infoForKey(dependentKeys[len]);
            if (0!==keyInfo.changeCount)
                continue;
            keyInfo.changeCount=1;
            this.didChangeValueForKey(keyInfo.key, keyInfo);
        }
    },

    /** Notify all observers that the specified keyPath has changed. Not usually
        called by external code.
    
        @private
        @param {coherent.ChangeNotification} change - The change notification object
        @param change.newValue - new value of the key
        @param change.oldValue - original value of the key
        @param change.changeType - what kind of change is this
        @param {String} keyPath - path to the key that has changed
     */
    notifyObserversOfChangeForKeyPath: function(change, keyPath)
    {
        if (!keyPath)
            throw new InvalidArgumentError( "keyPath may not be null" );

        //  Nothing to do if no-one is observing changes in this object
        if (!this.__kvo)
            return;

        var __observers= this.__kvo.observers;
    
        var observerIndex;
        var observers;
        var len;
        var o;
        
        //  First notify containers -- registered as observers for the
        //  coherent.KVO.kAllPropertiesKey key
        if ((observers= __observers[coherent.KVO.kAllPropertiesKey]))
        {
            var notifiedObserverUids= change.notifiedObserverUids;
            notifiedObserverUids[this.__uid]= true;

            for (observerIndex in observers)
            {
                o= observers[observerIndex];
                //  @TODO: Need to clean these up. They are parent link observers
                //  that have been severed.
                if (!o.observer || notifiedObserverUids[o.observer.__uid])
                    continue;
                
                o.callback.call(o.observer, change, keyPath, o.context);
            }
            notifiedObserverUids[this.__uid]= false;
        }

        //  don't bother with the rest of notifications for whole-object changes
        if (coherent.KVO.kAllPropertiesKey===keyPath)
            return;
    
        //  Next notify actual observers for the specified keyPath
        // observers= __observers[keyPath];
        if ((observers= __observers[keyPath]) && (len=observers.length))
        {
            while (len--)
            {
                o= observers[len];
                o.callback.call(o.observer, change, keyPath, o.context);
            }
        }

        //  Notify observers for a subkey: for example, if someone is observing
        //  foo.bar.baz and foo.bar is changed, a change notification should
        //  be sent out for baz.
        var subkeyLength= keyPath.length + 1;
        var restOfKeyPath;
        var observerKeyPath;
        var newValue= change.newValue;
        var oldValue= change.oldValue;
        var object= change.object;
        var indexes= change.indexes;
        var oldSubValue;
        var newSubValue;
        var subkeyChange;

        if (null===oldValue || 'undefined'===typeof(oldValue) || !oldValue.valueForKey)
            oldValue= null;
        if (null===newValue || 'undefined'===typeof(newValue) || !newValue.valueForKey)
            newValue= null;
            
        if (oldValue===null && newValue===null)
            return;
            
        var subkeys= this.__kvo.keypathTrie.getValuesWithPrefix(keyPath);
        var keypathIndex= subkeys.length;

        if (keypathIndex && subkeys[keypathIndex-1].length===keyPath.length)
            keypathIndex--;
            
        while (keypathIndex--)
        {
            observerKeyPath= subkeys[keypathIndex];
            
            observers= __observers[observerKeyPath];
            if (!(len= observers && observers.length))
                continue;
        
            restOfKeyPath= observerKeyPath.substr(subkeyLength);

            oldSubValue= oldValue && oldValue.valueForKeyPath(restOfKeyPath);
            newSubValue= newValue && newValue.valueForKeyPath(restOfKeyPath);
            
            //  skip notifications if the value hasn't really changed
            if (oldValue && oldSubValue===newSubValue)
                continue;
            
            subkeyChange= new coherent.ChangeNotification(object,
                                                          change.changeType,
                                                          newSubValue, oldSubValue,
                                                          indexes);
            
            while (len--)
            {
                o= observers[len];
                o.callback.call(o.observer, subkeyChange, observerKeyPath, o.context);
            }
        }
    }
});

//  Internal key used for observing property changes to a KVO-compliant object
coherent.KVO.kAllPropertiesKey= "*";

/** Set of keys which should be ignored when computing the list of mutable keys
    and when adapting an existing object.
 */
coherent.KVO.keysToIgnore= $S("__kvo","__keysToIgnore", "__mutableKeys",
                              "__factories__");

/** Set of value types which will be ignored when adapting an object and when
    attempting to observe child object changes.
 */
coherent.KVO.typesOfKeyValuesToIgnore= $S("string", "number", "boolean", "date",
                                          "regexp", "function");


/** Add KVO methods to an object that doesn't already have them.
 *  
 *  @param obj  the object to add the methods to
 */
coherent.KVO.adapt= function(obj)
{
    //  either there's no object or the object already has the methods
    if (!obj)
        throw new InvalidArgumentError( "Can't adapt a null object" );

    var p;

    for (p in coherent.KVO.prototype)
    {
        if (p in obj)
            continue;
        obj[p]= coherent.KVO.prototype[p];
    }

    //  perform magic for key dependencies
    if ('keyDependencies' in obj && !('__dependentKeys' in obj))
    {
        var depends= obj.keyDependencies;
        for (p in depends)
            obj.setKeysTriggerChangeNotificationsForDependentKey(depends[p], p);
    }

    return obj;
}




/** Add KVO methods to all the objects within an object. Allows using object
 *  literals with KVO. It is important that the object not have cycles or this
 *  code will hang your browser.
 *  
 *  @param obj  the object graph to adapt
 */
coherent.KVO.adaptTree= function(obj)
{
    coherent.KVO.adapt(obj);

    var p;
    var value;

    for (p in obj)
    {
        if (p in coherent.KVO.keysToIgnore)
            continue;
        
        value= obj[p];
    
        if (!value)
            continue;
        
        if (coherent.typeOf(value) in coherent.KVO.typesOfKeyValuesToIgnore)
            continue;

        coherent.KVO.adaptTree(value);
    }

    return obj;
}

/** Determine the list of mutable keys.
    @returns {String[]} an array of the names of the mutable keys.
 */
coherent.KVO.mutableKeys= function(kvo)
{
    var keys=[];
    var k;
    var v;
    var firstChar;

    //  If there is a __mutableKeys property, return that instead of calculating
    //  the list of mutable keys.
    if ("__mutableKeys" in kvo && kvo.__mutableKeys.concat)
        return kvo.__mutableKeys;

    var keysToIgnore= Set.union(coherent.KVO.keysToIgnore, kvo.__keysToIgnore);

    for (k in kvo)
    {
        if (k in keysToIgnore || '__'===k.substr(0,2))
            continue;
    
        v= kvo[k];
        //  If it isn't a function, then it is inherently mutable.
        if ('function'!==typeof(v))
        {
            keys.push(k);
            continue;
        }

        //  Setters must have only one argument and begin with 'set',
        //  ignore everything else.
        if (1!==v.length || 'set'!==k.substr(0,3))
            continue;

        //  Setters must have a uppercase letter following the 'set' prefix.
        firstChar= k.charAt(3);
        if (firstChar!==firstChar.toUpperCase())
            continue;

        //  Keys begin with a lowercase letter.
        k= firstChar.toLowerCase() + k.substr(4);

        //  Only add the key if I didn't already see a non-function property
        //  with the same name.
        if (-1===keys.indexOf(k))
            keys.push(k);
    }

    return keys;
}

/** Perform magic to automatically create key dependencies when a subclass of
    KVO is created.
    
    This processes the subclass's `keyDependencies` to create dependent keys by
    calling `setKeysTriggerChangeNotificationsForDependentKey`.
 */
coherent.KVO.__subclassCreated__= function(subclass)
{
    var baseproto= subclass.superclass.prototype;
    var proto= subclass.prototype;

    //  Subclass hasn't changed the key dependencies prototype property...
    if (baseproto.keyDependencies===proto.keyDependencies)
        return;

    var depends= proto.keyDependencies||{};
    for (var p in depends)
        proto.setKeysTriggerChangeNotificationsForDependentKey(depends[p], p);
}




// var KVO= coherent.KVO;
coherent.KVO.classInfo= {};

coherent.KVO.getClassInfoForObject= function(kvo)
{
    var classId= kvo.constructor.__class_id__;
    //  Allocate an anonymous class info for objects that don't have a
    //  classId or who are instances of KVO. This is a tad wasteful, but
    //  these are one-off objects anyway.
    if (!classId || classId===coherent.KVO.__class_id__)
        return {
            dependentKeys: {},
            methods: {},
            keypathTrie: new coherent.KeyPathTrie()
        };
        
    var info= coherent.KVO.classInfo[classId];
    if (info)
        return info;
    
    //  need to create the classInfo structure
    return coherent.KVO.classInfo[classId]= {
        dependentKeys: {},
        methods: {},
        keypathTrie: new coherent.KeyPathTrie()
    };
}

coherent.KVO.createInstanceDataForObject= function(kvo)
{
    var classInfo= coherent.KVO.getClassInfoForObject(kvo);
    if (Object.getPrototypeOf(kvo)===kvo)
        throw new Error('creating instance data for a prototype');
    var info= kvo.__kvo= Object.clone(classInfo);
    
    info.observers= {};
    info.keys= {};
    return info;
}

coherent.KVO.linkChildToParent= function(child, parent, keyInfo, uid)
{
    if (!child.hasOwnProperty('__kvo'))
        child.initialiseKeyValueObserving();
        
    var __observers= child.__kvo.observers;
        
    var parentObservers= __observers[coherent.KVO.kAllPropertiesKey] ||
                         (__observers[coherent.KVO.kAllPropertiesKey]= {});
    
    uid= uid||keyInfo.__uid;

    //  already has parent link
    if (uid in parentObservers)
        return;

    var parentLink= new coherent.ObserverEntry(parent,
                                parent.observeChildObjectChangeForKeyPath,
                                keyInfo?keyInfo.key:'');
                                
    parentObservers[uid]= parentLink;

    if (!keyInfo)
        return;
    
    if (keyInfo.parentLink)
        coherent.KVO.breakParentChildLink(keyInfo);
    keyInfo.parentLink= parentLink;
}

coherent.KVO.unlinkChildFromParent= function(child, parent, keyInfo, uid)
{
    if (!child.hasOwnProperty('__kvo'))
        child.initialiseKeyValueObserving();

    var __observers= child.__kvo.observers;
    
    var parentObservers= __observers[coherent.KVO.kAllPropertiesKey];
    if (!parentObservers)
        return;
    
    uid= uid||keyInfo.__uid;

    if (keyInfo && keyInfo.parentLink===parentObservers[uid])
        coherent.KVO.breakParentChildLink(keyInfo);

    //  remove the parent link
    delete parentObservers[uid];
}

coherent.KVO.breakParentChildLink= function(keyInfo)
{
    if (!keyInfo || !keyInfo.parentLink)
        return;
    keyInfo.parentLink.observer= null;
    keyInfo.parentLink.callback= null;
    keyInfo.parentLink= null;
}

Object.markMethods(coherent.KVO);