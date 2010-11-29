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

    observeChildObjectChangeForKeyPath: function(change, keypath, context)
    {
      //  Faster than calling base.
      coherent.KVO.prototype.observeChildObjectChangeForKeyPath.call(this, change, keypath, context);

      //  Ignore notifications from deeper in the object graph
      if ('*'!==keypath)
        return;
      
      //  Handle insertion & deletion from to-many relations
      //  The context holds the key name of the child that's changing.
      var info= this.constructor.schema[context];
      if (!info || !info.inverse)
        return;

      var inverse= info.type.schema[info.inverse];
      var len, i;
      
      switch (change.changeType)
      {
        case coherent.ChangeType.insertion:
          //  relate each of the new items to this object
          for (i=0, len= change.newValue.length; i<len; ++i)
            inverse.relateObjects(change.newValue[i], this);
          break;
          
        case coherent.ChangeType.deletion:
          for (i=0, len= change.oldValue.length; i<len; ++i)
            inverse.unrelateObjects(change.oldValue[i], this);
          break;
          
        case coherent.ChangeType.replacement:
          for (i=0, len= change.oldValue.length; i<len; ++i)
          {
            inverse.unrelateObjects(change.oldValue[i], this);
            inverse.relateObjects(change.newValue[i], this);
          }
          break;
        
        default:
          //  I don't think there's anything I should do here...
          break;
      }
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
    
      var info= this.constructor.schema[key];
      if (info instanceof coherent.Model.ToMany)
        return this.changes[key]= [];
        
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
      
      var inverse= methodInfo.type.schema[methodInfo.inverse];
      if (previous)
        inverse.unrelateObjects(previous, this);
      if (value)
        inverse.relateObjects(value, this);
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
      Object.extend(json, this.changes);
      
      var schema= this.constructor.schema;
      var info, value;
      
      for (var p in schema)
      {
        info= schema[p];
        if (info.composite || !(info.type && info.type.prototype instanceof coherent.ModelObject))
          continue;
        value= json[p];
        if (!value)
          continue;
          
        if (info instanceof coherent.Model.ToOne)
          json[p]= value.id();
        else if (info instanceof coherent.Model.ToMany)
          json[p]= value.map(function(obj){ return obj.id(); });
      }
      return json;
    }

  });

})();