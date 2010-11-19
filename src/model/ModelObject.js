/*jsl:import ../model.js*/

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
      if (!(key in hash) || !info.type)
        continue;

      value= hash[key];
      
      if (null===value)
        value= new (info.type)();
      else if (Date===info.type)
        value= new Date(Date.parse(value));
      else
        value= new (info.type)(value);
          
      if (info.primitive && Date!==info.type)
          value=value.valueOf();
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
    if (this.original[key]===value)
    {
      delete this.changes[key];
      this.changeCount--;
    }
    else
    {
      if (!(key in this.changes))
        this.changeCount++;
      this.changes[key]= value;
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

