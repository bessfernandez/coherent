/*jsl:import ../model.js*/

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
coherent.ModelKeyInfo= Class._create({

  /** Create a new KeyInfo object.
      
      @param {Object} obj the object on which the key is defined
      @param {String} key the name of the key to manage
   */
  constructor: function(key, obj)
  {
    var classInfo= coherent.KVO.getClassInfoForObject(obj);
    var classKeyInfo= (classInfo && classInfo.methods[key])||{};

    this.key= key;
    this.changeCount=0;
    this.getter= classKeyInfo.getter;
    this.setter= classKeyInfo.setter;
    
    this.mutable= !obj[key] || !!obj['set'+key.titleCase()];
  },
  
  /** Retrieve the value of this key for a given object. If the value can have
      a parent link, this method will create it.
    
      @param {coherent.KVO} obj the KVO instance from which to fetch the
           value.
      @returns the current value of the key for the specified object
   */
  get: function(obj)
  {
    var value= this.getter ? this.getter.call(obj) : obj.primitiveValueForKey(this.key);

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
    obj.willChangeValueForKey(this.key, this);
    this.setter ? this.setter.call(obj, newValue, this.key) : obj.setPrimitiveValueForKey(newValue, this.key);
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
