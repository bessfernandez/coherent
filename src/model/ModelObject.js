/*jsl:import ../model.js*/
(function(){

  /** Define the base class for all Model objects. */
  coherent.ModelObject= Class.create(coherent.KVO, {

    constructor: function(hash)
    {
      var classInfo= coherent.KVO.getClassInfoForObject(this);
      var info;
      var value;
    
      hash= Object.extend({}, hash);
    
      for (var key in classInfo.methods)
      {
        info= classInfo.methods[key];
        /*  It's possible to specify the type of a property as a string. This
            makes it easy to avoid circular references when you're defining your
            models. However, that's not particularly useful when actually using
            the property, so this would be a good place to fix that up.
         */
        if ('string'===typeof(info.type))
          info.type= coherent.Model.modelWithName(info.type);
        
        if (!(key in hash))
          continue;

        value= hash[key];
      
        if (info.type)
        {
          if (null===value)
            value= new (info.type)();
          else if (Date===info.type)
            value= new Date(Date.parse(value));
          else
            value= new (info.type)(value);
          
          if (info.primitive && Date!==info.type)
              value=value.valueOf();
        }
      
        hash[key]= value;
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
      var methodInfo= this.constructor.__classInfo.methods[key];
      var previous;

      if (methodInfo && methodInfo.type &&
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
    
      if (!methodInfo || !methodInfo.inverse || !methodInfo.relation)
        return;
      
      var TO_ONE= coherent.Model.ToOne,
          TO_MANY= coherent.Model.ToMany;
    
      var inverse= methodInfo.type.__classInfo.methods[methodInfo.inverse];
      var previousInverse= previous ? previous.primitiveValueForKey(methodInfo.inverse) : null;
      var valueInverse= value ? value.primitiveValueForKey(methodInfo.inverse) : null;
      
      if (inverse.relation===coherent.Model.ToOne)
      {
        if (this===previousInverse)
          previous.setValueForKey(null, methodInfo.inverse);
        if (this!==valueInverse)
          value.setValueForKey(this, methodInfo.inverse);
      }
      else if (inverse.relation===coherent.Model.ToMany)
      {
        var previousIndexOfThis= previousInverse ? previousInverse.indexOfObject(this) : -1;
        var valueIndexOfThis= value ? value.indexOfObject(this) : -1;
        
        if (-1!==previousIndexOfThis)
          previousInverse.removeObjectAtIndex(previousIndexOfThis);
        if (-1===valueIndexOfThis)
          value.addObject(this);
      }
    },
  
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
    }

  });

})();