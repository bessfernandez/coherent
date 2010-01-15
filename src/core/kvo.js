/*jsl:import startup.js*/
/*jsl:import Error.js*/
/*jsl:import KeyInfo.js*/
/*jsl:import ChangeNotification.js*/
/*jsl:import ObserverEntry.js*/






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
        if (hash)
            for (var p in hash)
                this.setValueForKey(hash[p], p);
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
        if ("string"==typeof(keyPath))
            keyPath= keyPath.split(".");

        var key= keyPath[0];
        
        //  Handle degenerate case where there is only one key
        if (1==keyPath.length)
        {
            this.setValueForKey(value, key);
            return;
        }
        
        if ('@'==key.charAt(0))
        {
            //  silently fail, because keyPaths with array operators are immutable.
            return;
        }

        //  Find the key value
        var object= this.valueForKey(key);
    
        if (!object)
            return;
                                    
        //  ask it to set the value based on the remaining key path
        object.setValueForKeyPath(value, keyPath.slice(1));
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
        if ("string"==typeof(keyPath))
            keyPath= keyPath.split(".");

        var key= keyPath[0];
        
        //  Handle degenerate case where there is only one key
        if (1==keyPath.length)
            return this.valueForKey(key);
        
        if ('@'==key.charAt(0))
        {
            var operator= key.substr(1);
            var values= this.valueForKeyPath( keyPath.slice(1) );
            return coherent.ArrayOperator[operator]( values );
        }

        //  Find the key value
        var object= this.valueForKey(key);
    
        //  if there is no value for the container, return null for the terminal
        //  value -- this makes bindings work for containers that haven't been
        //  created yet.
        if ('undefined'===typeof(object) || null===object)
            return undefined;
    
        //  ask it to get the value based on the remaining key path
        return object.valueForKeyPath(keyPath.slice(1));
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

        var key= keyPath[0];
        
        //  Handle degenerate case where there is only one key
        if (1==keyPath.length)
            return this.validateValueForKey(value, key);

        //  Find the key value
        var object= this.valueForKey(key);
    
        //  if there is no value for the container, then just return the
        //  value...
        //  TODO: Is this really correct?
        if ('undefined'===typeof(object) || null===object)
            return value;
    
        //  ask it to validate the value based on the remaining key path
        return object.validateValueForKeyPath(value, keyPath.slice(1));
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
        if (coherent.KVO.kAllPropertiesKey!=keyPath)
            keyPath= context + '.' + keyPath;
        else
            keyPath= context;

        var changeClone= Object.clone(change);
        changeClone.object= this;
        this.notifyObserversOfChangeForKeyPath( changeClone, keyPath );
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
        
        var key= keyPath[0];
        
        //  Handle degenerate case where there is only one key
        if (1==keyPath.length)
            return this.infoForKey(key);
        else if ('@'==key.charAt(0))
        {
            //  Array operators make a keyPath immutable.
            var keyInfo= new coherent.KeyInfo(null, null);
            keyInfo.mutable= false;
            return keyInfo;
        }
        else
        {
            //  Find the key value
            var object= this.valueForKey(key);

            //  If an object along the way is null, then return that the key in
            //  question can't be read and can't be written.
            if (!object)
                return undefined;

            if (!object.infoForKeyPath)
                return undefined;
            //  ask it to set the value based on the remaining key path
            return object.infoForKeyPath(keyPath.slice(1));
        }
    },

    /** Discover information about the specified key.
      
        @param {String} key - The name of the key to retrieve information about.
        @returns {coherent.KeyInfo} an instance of KeyInfo for the specified key
     */
    infoForKey: function(key)
    {
        var keyInfo;

        if (!this.__keys)
            this.__keys= {};
            
        if (coherent.KVO.kAllPropertiesKey==key)
            return null;
            
        keyInfo= this.__keys[key];
    
        if (keyInfo)
            return keyInfo;
        
        keyInfo= new coherent.KeyInfo(this, key);
    
        this.__keys[key]= keyInfo;
        return keyInfo;
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
            
        var key;
        var keyInfo;
        var keyIndex;
        var dependentKeys;

        if ('string'===typeof(keys))
            keys= [keys];
            
        if (!this.__dependentKeys)
            this.__dependentKeys= {};

        for (keyIndex=0; keyIndex<keys.length; ++keyIndex)
        {
            key= keys[keyIndex];
            if (!key)
                throw new InvalidArgumentError("key at index " + keyIndex +
                                               " was null");

            if (!(key in this.__dependentKeys))
                this.__dependentKeys[key]= [];

            //  swizzle the getter/mutator methods if necessary for this key.
            coherent.KVO.getPropertyMethodsForKeyOnObject(key, this);
            
            dependentKeys= this.__dependentKeys[key];

            if (-1==dependentKeys.indexOf(dependentKey))
                dependentKeys.push(dependentKey);
        }
    },

    /** Determine the list of mutable keys.
        @returns {String[]} an array of the names of the mutable keys.
     */
    mutableKeys: function()
    {
        var keys=[];
        var k;
        var v;
        var firstChar;
    
        //  If there is a __mutableKeys property, return that instead of calculating
        //  the list of mutable keys.
        if ("__mutableKeys" in this && this.__mutableKeys.concat)
            return this.__mutableKeys;
        
        var keysToIgnore= Set.union(coherent.KVO.keysToIgnore, this.__keysToIgnore);
    
        for (k in this)
        {
            if (k in keysToIgnore || '__'===k.substr(0,2))
                continue;
            
            v= this[k];
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
    },

    /** Initialise Key Value Observing for this object.
     */
    initialiseKeyValueObserving: function()
    {
        //  Setting observers early helps prevent cycles when initialising
        //  key-value observing
        this.__uid= this.__uid||coherent.generateUid();
        this.__observers= {};
    },

    _addParentLink: function(parent, keyInfo, uid)
    {
        if (!this.hasOwnProperty('__observers'))
            this.initialiseKeyValueObserving();

        var parentObservers= this.__observers[coherent.KVO.kAllPropertiesKey];
        if (!parentObservers)
            parentObservers= this.__observers[coherent.KVO.kAllPropertiesKey]= {};
        
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
            
        keyInfo.unlinkParentLink();
        keyInfo.parentLink= parentLink;
    },
    
    _removeParentLink: function(parent, keyInfo, uid)
    {
        if (!this.__observers)
            return;
            
        var parentObservers= this.__observers[coherent.KVO.kAllPropertiesKey];
        if (!parentObservers)
            parentObservers= this.__observers[coherent.KVO.kAllPropertiesKey]= {};
        
        uid= uid||keyInfo.__uid;

        if (keyInfo && keyInfo.parentLink===parentObservers[uid])
            keyInfo.unlinkParentLink();

        //  remove the parent link
        delete parentObservers[uid];
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

        if (!observer.__uid)
            observer.__uid= coherent.generateUid();

        if (!callback)
            callback= observer["observeChangeForKeyPath"];
        
        if ('string'===typeof(callback))
            callback= observer[callback];
            
        if (!callback)
            throw new InvalidArgumentError( "Missing callback method" );

        if (!this.hasOwnProperty('__observers'))
            this.initialiseKeyValueObserving();

        if (!this.__observers[keyPath])
        {
            //  fetch the keyInfo for this keyPath, to swizzle setter methods
            //  along the path to fire willChange/didChange methods.
            this.infoForKeyPath(keyPath);
            this.__observers[keyPath]= [];
        }
        
        var observerEntry= new coherent.ObserverEntry(observer, callback,
                                                      context);

        this.__observers[keyPath].push(observerEntry);
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

        if (!this.__observers || !this.__observers[keyPath])
            return;

        var allObservers= this.__observers[keyPath];
        var entryIndex=-1;
        var entry;
        var len= allObservers.length;
    
        //  TODO: This could be faster... It shouldn't be necessary to scan
        //  the entire list of observers.
        for (entryIndex=0; entryIndex<len; ++entryIndex)
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
        if (!key)
            throw new InvalidArgumentError("key may not be null");

        keyInfo= (keyInfo instanceof coherent.KeyInfo) ? keyInfo : this.infoForKey(key);
        if (!keyInfo)
            return;

        //  Only remember the previous value the first time
        //  willChangeValueForKey is called.
        if (1!==++keyInfo.changeCount)
            return;

        //  Prepare change notification for dependent keys
        var dependentKeys= (this.__dependentKeys && this.__dependentKeys[key]);
        if (dependentKeys)
            dependentKeys.forEach(this.willChangeValueForKey, this);
            
        keyInfo.previousValue= keyInfo.get(this);
    },

    forceChangeNotificationForKey: function(key, keyInfo)
    {
        if (!key)
            throw new InvalidArgumentError( "key may not be null" );

        keyInfo= (keyInfo instanceof coherent.KeyInfo) ? keyInfo : this.infoForKey(key);
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
        if (!key)
            throw new InvalidArgumentError( "key may not be null" );

        keyInfo= (keyInfo instanceof coherent.KeyInfo) ? keyInfo : this.infoForKey(key);
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
            if (previousValue && previousValue._removeParentLink)
                previousValue._removeParentLink(this, keyInfo);

            //  observe changes to the new value
            if (newValue && newValue._addParentLink)
                newValue._addParentLink(this, keyInfo);
        }

        //  Fire change notification for dependent keys
        var dependentKeys= (this.__dependentKeys && this.__dependentKeys[key]);
        if (dependentKeys)
            dependentKeys.forEach(this.didChangeValueForKey, this);
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
        if (!this.__observers)
            return;

        var observerIndex;
        var observers;
        var len;
        
        //  First notify containers -- registered as observers for the
        //  KVO.kAllPropertiesKey key
        observers= this.__observers[coherent.KVO.kAllPropertiesKey];
        if (observers)
        {
            var changeClone= Object.clone(change);
            change.notifiedObserverUids[this.__uid]= true;

            for (observerIndex in observers)
            {
                var o= observers[observerIndex];
                o.observeChangeForKeyPath(changeClone, keyPath);
            }
            delete change.notifiedObserverUids[this.__uid];
        }
    
        //  don't bother with the rest of notifications for whole-object changes
        if (coherent.KVO.kAllPropertiesKey==keyPath)
            return;
        
        //  Next notify actual observers for the specified keyPath
        observers= this.__observers[keyPath];
        if (observers && observers.length)
        {
            len= observers.length;
            for (observerIndex=0; observerIndex < len; ++observerIndex)
                observers[observerIndex].observeChangeForKeyPath(change, keyPath);
        }
    
        //  Notify observers for a subkey: for example, if someone is observing
        //  foo.bar.baz and foo.bar is changed, a change notification should
        //  be sent out for baz.
        var subkey= keyPath + ".";
        var subkeyLength= subkey.length;
        var restOfKeyPath;
        var observerKeyPath;
        var subkeyChange;
        var oldSubValue;
        var newSubValue;
        var isIndexedChange= (coherent.ChangeType.setting!==change.changeType);
        var hasPreviousValue= !(null===change.oldValue ||
                                'undefined'===typeof(change.oldValue));
        
        for (observerKeyPath in this.__observers)
        {
            if (observerKeyPath.substr(0, subkeyLength)!=subkey)
                continue;

            observers= this.__observers[observerKeyPath];
            if (!observers || !observers.length)
                continue;
            
            restOfKeyPath= observerKeyPath.substr(subkeyLength);

            oldSubValue= change.oldValue;
            if (oldSubValue && oldSubValue.valueForKeyPath)
                oldSubValue= oldSubValue.valueForKeyPath(restOfKeyPath);
            else
                oldSubValue= null;
            newSubValue= change.newValue;
            if (newSubValue && newSubValue.valueForKeyPath)
                newSubValue= newSubValue.valueForKeyPath(restOfKeyPath);
            else
                newSubValue= null;
                
            //  skip notifications if the value hasn't really changed
            if (hasPreviousValue && oldSubValue===newSubValue)
                continue;
            subkeyChange= new coherent.ChangeNotification(change.object,
                                                      change.changeType,
                                                      newSubValue, oldSubValue,
                                                      change.indexes);
            len= observers.length;
            for (observerIndex=0; observerIndex < len; ++observerIndex)
            {
                observers[observerIndex].observeChangeForKeyPath(subkeyChange,
                                                               observerKeyPath);
            }
        }
    }
});

//  Internal key used for observing property changes to a KVO-compliant object
coherent.KVO.kAllPropertiesKey= "*";

/** Set of keys which should be ignored when computing the list of mutable keys
    and when adapting an existing object.
 */
coherent.KVO.keysToIgnore= $S("__keys","__observers","__keysToIgnore",
                              "__dependentKeys", "__mutableKeys",
                              "__factories__");

/** Set of value types which will be ignored when adapting an object and when
    attempting to observe child object changes.
 */
coherent.KVO.typesOfKeyValuesToIgnore= $S("string", "number", "boolean", "date",
                                          "regexp", "function");


/** Private method for getting property methods for an object.
    @private
    @function
 */
coherent.KVO.getPropertyMethodsForKeyOnObject= (function(){

    /** Create property getter/setter methods for a key. The actual value of the
        key will be stored in __kvo_prop_+key. The getter and setter methods
        will automatically call willChange & didChange and addParentLink.
        
        @param key  the name of the key to wrap
        @param [privateKey] the name of the private key to use.
        
        @inner
     */
    function createPropertyMethods(key, privateKey)
    {
        privateKey= privateKey || '__kvo_prop_' + key;
        
        /** The methods that will be returned.
         */
        var methods= {
        
            getter: function()
            {
                var value= null;
                if (privateKey in this)
                    value= this[privateKey];
                var keyInfo= this.__keys?this.__keys[key]:null;
                if (!keyInfo)
                    return value;
                    
                if (value && value._addParentLink)
                    value._addParentLink(this, keyInfo);
                else
                    keyInfo.unlinkParentLink();
                return value;
            },
            
            mutator: function(newValue)
            {
                this.willChangeValueForKey(key);
                //  Change undefined values to null, because undefined is used
                //  as a marker that an object in the hierarchy didn't exist.
                if ('undefined'===typeof(newValue))
                    newValue= null;
                this[privateKey]= newValue;
                this.didChangeValueForKey(key);
                return newValue;
            }
            
        };
        
        //  Setting the __key property on the mutator to the name of the key
        //  allows us to tell that this function was created by the library.
        methods.mutator.__key= key;
        methods.getter.__key= key;
        
        return methods;
    }
    
    /** Create a wrapper function that will invoke willChange before
        calling the original mutator and didChange after calling the
        original mutator.
        
        @param mutator  the original mutator function to wrap
        @param key      the name of the key
        @returns a wrapped function
        
        @inner
     */
    function wrapMutatorWithChangeNotificationForKey(mutator, key)
    {
        /** A wrapper around a KVO mutator method that calls willChangeValueForKey
            before calling the mutator and didChangeValueForKey after calling.
         */
        function wrappedSetter(value)
        {
            this.willChangeValueForKey(key);
            var result= mutator.call(this, value);
            this.didChangeValueForKey(key);
            return result;
        }
        wrappedSetter.__key= key;
        wrappedSetter.valueOf= function()
        {
            return mutator;
        }
        wrappedSetter.toString= function()
        {
            return String(mutator);
        }
        return wrappedSetter;
    }

    /** Create a wrapped getter function which will ensure that the parent link
        is added to all property values.
        
        @param getter   the original getter function to wrap
        @param key      the name of the key
        @returns a wrapped function
        
        @inner
     */
    function wrapGetterWithAddParentLinkForKey(getter, key)
    {
        /** A wrapper around the KVO object's getter method that will add a
            link back to the KVO object from the value returned. This allows
            change notifications to propagate back to the original owner.
            @inner
            @function
         */
        function wrappedGetter()
        {
            var value= getter.call(this);
            var keyInfo= this.__keys?this.__keys[key]:null;
            if (!keyInfo)
                return value;

            if (value && value._addParentLink)
                value._addParentLink(this, keyInfo);
            else
                keyInfo.unlinkParentLink();
                
            return value;
        }
        wrappedGetter.__key= key;
        wrappedGetter.valueOf= function()
        {
            return getter;
        }
        wrappedGetter.toString= function()
        {
            return String(getter);
        }
        return wrappedGetter;
    }
    
    /** The actual implementation of getPropertyMethodsForKeyOnObject for
     *  browsers that support JavaScript getters and setters.
     *  
     *  @inner
     */
    function getPropertyMethodsForKeyOnObject(key, obj)
    {
        var proto= obj.constructor.prototype;
        var objectIsPrototype= (proto==obj);
        var where= (proto!=Object.prototype &&
                    proto!=coherent.KVO.prototype)?proto:obj;

        var keyAsTitle= key.titleCase();
        var getterName= "get" + keyAsTitle;
        var mutatorName= "set" + keyAsTitle;
        var validatorName= "validate" + keyAsTitle;
        var getter;
        var mutator;
        var value;
        var validator= obj[validatorName];
        
        //  Are the getter & mutator properties?
        var properties= ('undefined'!==typeof(getter=obj.__lookupGetter__(key)) &&
                         'undefined'!==typeof(mutator=obj.__lookupSetter__(key)));

        if (!properties)
        {
            getterName= (getterName in obj)?getterName:key;
            getter= obj[getterName];
            mutator= obj[mutatorName];
        }

        //  If the getter isn't a function, then there can be no mutator
        if ('function'!==typeof(getter))
        {
            var privateKey= '__kvo_prop_' + key;
            var methods= createPropertyMethods(key, privateKey);

            //  determine whether to remember the initial value
            if (key in obj)
            {
                value= obj[privateKey]= ('undefined'==typeof(getter)?null:getter);
                delete obj[key];
            }
            
            getter= methods.getter;
            mutator= methods.mutator;
            properties= true;
        }
        else
        {
            //  determine the initial value of the key, can't be after wrapping
            //  the getter because the KeyInfo might not yet be created...
            if (getter && !objectIsPrototype)
                value= getter.valueOf().call(obj);

            //  If the getter hasn't already been wrapped to call _addParentLink
            //  wrap it now
            if (getter && key!==getter.__key)
                getter= wrapGetterWithAddParentLinkForKey(getter, key);
                
            //  If the mutator hasn't already been wrapped to call willChange &
            //  didChange, wrap it now
            if (mutator && key!==mutator.__key)
                mutator= wrapMutatorWithChangeNotificationForKey(mutator, key);
        }
        
        if (properties)
        {
            where.__defineGetter__(key, getter);
            where.__defineSetter__(key, mutator);
        }
        else
        {
            if (getter)
            {
                if (obj.hasOwnProperty(getterName))
                    obj[getterName]= getter;
                else
                    where[getterName]= getter;
            }
            
            if (mutator)
            {
                if (obj.hasOwnProperty(mutatorName))
                    obj[mutatorName]= mutator;
                else
                    where[mutatorName]= mutator;
            }
        }
        
        //  return the getter & mutator methods
        return {
            getter: getter,
            mutator: mutator,
            validator: validator,
            value: value
        };
    }

    /** The implementation for getPropertyMethodsForKeyOnObject for browsers
     *  that don't support JavaScript getters and setters (MSIE).
     *  
     *  @inner
     */
    function getPropertyMethodsForKeyOnObject_MSIE(key, obj)
    {
        var proto= obj.constructor.prototype;
        var objectIsPrototype= (proto==obj);
        var where= (proto!=Object.prototype &&
                    proto!=coherent.KVO.prototype)?proto:obj;

        var keyAsTitle= key.titleCase();
        var mutatorName= "set" + keyAsTitle;
        var getterName= "get" + keyAsTitle;
        var validatorName= "validate" + keyAsTitle;

        getterName= (getterName in obj)?getterName:key;
        
        var getter= obj[getterName];
        var mutator= obj[mutatorName];
        var validator= obj[validatorName];
        var value;
        
        //  If the getter isn't a function, then there can be no mutator
        if ('function'!==typeof(getter))
        {
            if (key in obj)
                value= getter;
            getter= null;
            mutator= null;
        }
        else
        {
            //  determine the initial value of the key, can't be after wrapping
            //  the getter because the KeyInfo might not yet be created...
            if (getter && !objectIsPrototype)
                value= getter.valueOf().call(obj);

            //  If the getter hasn't already been wrapped to call _addParentLink
            //  wrap it now
            if (getter && key!==getter.__key)
                getter= wrapGetterWithAddParentLinkForKey(getter, key);
                
            //  If the mutator hasn't already been wrapped to call willChange &
            //  didChange, wrap it now
            if (mutator && key!==mutator.__key)
                mutator= wrapMutatorWithChangeNotificationForKey(mutator, key);
        }
        
        if (getter)
        {
            if (obj.hasOwnProperty(getterName))
                obj[getterName]= getter;
            else
                where[getterName]= getter;
        }
        
        if (mutator)
        {
            if (obj.hasOwnProperty(mutatorName))
                obj[mutatorName]= mutator;
            else
                where[mutatorName]= mutator;
        }
            
        return {
            getter: getter,
            mutator: mutator,
            validator: validator,
            value: value
        };
    }

    if (coherent.Support.Properties)
        return getPropertyMethodsForKeyOnObject;
    else
        return getPropertyMethodsForKeyOnObject_MSIE;
    
})();


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


/** Perform magic to automatically create key dependencies when a subclass of
 *  KVO is created.
 *  
 *  This processes the subclass's `keyDependencies` to create dependent keys by
 *  calling `setKeysTriggerChangeNotificationsForDependentKey`.
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
