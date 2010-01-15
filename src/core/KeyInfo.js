/*jsl:import startup.js*/

/** Constructor for the data kept for each observable/observed key.
    
    @property __uid An unique identifier for this key info, used in creating the
                    parent link information.
    @property reader    A reference to the getter function (if one exists) used
                        to retrieve the current value from an object.
    @property mutator   A reference to the setter function (if one exists) which
                        will be used to update the key for an object.
    @property validator A reference to the validation method (usually in the
                        form `validate` + key) which _may_ be invoked to
                        determine whether a value is valid. This method is
                        **never** called by `setValueForKey` and should only be
                        called by user interface code.
    @property key   The original key name that this KeyInfo object represents.
    @property mutable   Is the field with this key name mutable on objects? A
                        field is not mutable if a getter function exists but no
                        setter function exists.
    @property changeCount   The number of times `willChangeValueForKey` has been
                            called. This is decremented each time
                            `didChangeValueForKey` is called.
    
    @private
 */
coherent.KeyInfo= Class.create({

    /** Create a new KeyInfo object.
        
        @param {Object} obj - the object on which the key is defined
        @param {String} key - the name of the key to manage
     */
    constructor: function(obj, key)
    {
        var methods= coherent.KVO.getPropertyMethodsForKeyOnObject(key, obj);

        this.__uid= [key, coherent.generateUid()].join('_');

        //  store accessor & mutator
        this.reader= methods.getter;
        this.mutator= methods.mutator;
        this.validator= methods.validator;
        this.key= key;
        
        //  Obviously, a key is mutable if there's a mutator defined, but
        //  if the key has neither reader or mutator methods, then I
        //  access it via direct property access and the key is mutable
        this.mutable= ((this.mutator||!this.reader)?true:false);

        if (!this.reader && !this.mutator)
            this.mutable= true;

        //  changeCount is the number of times willChangeValueForKey has been
        //  called. This is decremented for each call to didChangeValueForKey.
        //  When this value returns to 0, a change notification is issued. The
        //  previous value is only cached for the first change.
        this.changeCount= 0;
        
        //  Setup initial parent link for value if there is one
        var value= methods.value;
        if (!value)
            return;
            
        var valueType= coherent.typeOf(value);
        if (valueType in coherent.KVO.typesOfKeyValuesToIgnore ||
            !value._addParentLink)
            return;

        value._addParentLink(obj, this);
    },
    
    /** Retrieve the value of this key for a given object. If the value can have
        a parent link, this method will create it.
        
        @param {coherent.KVO} obj - the KVO instance from which to fetch the
               value.
        @returns the current value of the key for the specified object
     */
    get: function(obj)
    {
        //  This is kind of tortured logic, because undefined is reserved to
        //  mean that there's a missing object in the keyPath chain. So the
        //  result of valueForKey should NEVER be undefined.

        //  Note, a reader method will get wrapped to handle adding the parent
        //  link for this property (because someone might access the value
        //  directly via the getter method). So there's no need to handle it
        //  here.
        if (this.reader)
            return this.reader.call(obj);
            
        var value;

        if (this.key in obj)
            value= obj[this.key];
        else
            value= null;
        
        if (value && value._addParentLink)
            value._addParentLink(obj, this);
            
        return value;
    },
    
    /** Store a new value for a given object. This method will call a mutator
        method if one exists, or otherwise will call `willChangeValueForKey`,
        update the field directly, and then call `didChangeValueForKey`.
        
        @param obj  the object to modify
        @param newValue the new value that will replace the old value.
     */
    set: function(obj, newValue)
    {
        if (this.mutator)
            this.mutator.call(obj, newValue);
        else
        {
            //  bracket modification of the value with change notifications.
            //  This should only ever be executed for MSIE or other browsers
            //  that don't support properties.
            obj.willChangeValueForKey(this.key, this);
            obj[this.key]= newValue;
            obj.didChangeValueForKey(this.key, this);
        }
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
