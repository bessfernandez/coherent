/*jsl:import ../model.js*/

(function(){

  /** Define the base class for all Model objects. */
  coherent.ModelObject= Class.create(coherent.KVO, {

    constructor: function(hash)
    {
      var schema= this.constructor.schema;
      var info;
      var value;
    
      hash= Object.extend({}, hash);

      if (!schema.__initialised)
      {
        for (var p in schema)
        {
          info= schema[p];
          /*  It's possible to specify the type of a property as a string. This
              makes it easy to avoid circular references when you're defining your
              models. However, that's not particularly useful when actually using
              the property, so this would be a good place to fix that up.
           */
          if ('string'===typeof(info.type))
            info.type= coherent.Model.modelWithName(info.type);
        }
        schema.__initialised= true;
      }
      
      for (var key in hash)
      {
        info= schema[key];
        if (!info)
        {
          coherent.KVO.adaptTree(hash[key]);
          continue;
        }
        hash[key]= coherent.KVO.adaptTree(info.fromValue(hash[key]));
      }
    
      this.original= hash;
      this.changes= {};
      this.changeCount=0;
    },

    id: function(key)
    {
      return this.original[this.constructor.uniqueId];
    },
  
    isNew: function()
    {
      return void(0)==this.id();
    },
  
    isUpdated: function()
    {
      return this.changeCount>0;
    },
  
    reset: function()
    {
      this.changes= {};
      this.changeCount= 0;
    },
  
    primitiveValueForKey: function(key)
    {
      if (key in this.changes)
        return this.changes[key];
      else if (key in this.original)
        return this.original[key];
    
      return null;
    },
  
    setPrimitiveValueForKey: function(value, key)
    {
      var methodInfo= this.constructor.schema[key];
      var previous;

      if (void(0)!=value && methodInfo && methodInfo.type &&
          ((methodInfo.primitive && value.constructor!==methodInfo.type) ||
           (!methodInfo.primitive && !(value instanceof methodInfo.type))))
      {
        throw new Error("Invalid type for " + key);
      }

      if (this.original[key]===value)
      {
        previous= key in this.changes ? this.changes[key] : null;
        delete this.changes[key];
        this.changeCount--;
      }
      else
      {
        if (!(key in this.changes))
          this.changeCount++;
        previous= key in this.changes ? this.changes[key] : this.original[key];
        this.changes[key]= value;
      }
    
      if (!methodInfo || !methodInfo.inverse)
        return;
      
      var TO_ONE= coherent.Model.ToOne,
          TO_MANY= coherent.Model.ToMany;
    
      var inverse= methodInfo.type.schema[methodInfo.inverse];
      var previousInverse= previous ? previous.primitiveValueForKey(methodInfo.inverse) : null;
      var valueInverse= value ? value.primitiveValueForKey(methodInfo.inverse) : null;

      if (inverse.relation===coherent.Model.ToOne)
      {
        if (previous && this===previousInverse)
          previous.setValueForKey(null, methodInfo.inverse);
        if (value && this!==valueInverse)
          value.setValueForKey(this, methodInfo.inverse);
      }
      else if (inverse.relation===coherent.Model.ToMany)
      {
        var previousIndexOfThis= previousInverse ? previousInverse.indexOfObject(this) : -1;
        var valueIndexOfThis= value ? value.indexOfObject(this) : -1;
        
        if (previousInverse && -1!==previousIndexOfThis)
          previousInverse.removeObjectAtIndex(previousIndexOfThis);
        if (value && -1===valueIndexOfThis)
          value.addObject(this);
      }
    },

    // observeChildObjectChangeForKeyPath: function
    infoForKey: function(key)
    {
      if (coherent.KVO.kAllPropertiesKey==key)
        return null;
  
      if (!this.__kvo)
        this.initialiseKeyValueObserving();

      var keys= this.__kvo.keys;
      if (key in keys)
        return keys[key];
      return keys[key]= new coherent.ModelKeyInfo(key, this);
    },
    
    toJSON: function()
    {
      var json= Object.extend({}, this.original);
      return Object.extend(json, this.changes);
    }

  });

})();