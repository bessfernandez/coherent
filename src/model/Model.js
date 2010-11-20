/*jsl:import ../model.js*/

(function(){

  var PRIMITIVE_TYPES= [String, Number, RegExp, Boolean, Date];
  
  /** Hash from name of model to the model definition */
  var models= {};

  function makeGetter(key)
  {
    function getter()
    {
      var value= this.primitiveValueForKey(getter.__key);
    
      var keyInfo= this.__kvo.keys[getter.__key];
      if (!keyInfo)
        return value;
  
      if (value && value.addObserverForKeyPath)
        coherent.KVO.linkChildToParent(value, this, keyInfo);
      else if (keyInfo.parentLink)
        coherent.KVO.breakParentChildLink(keyInfo);
      
      return value;
    }
    getter.__key= key;
    return getter;
  }
  
  function makeSetter(key)
  {
    function setter(value)
    {
      var keyInfo= this.infoForKey(setter.__key);
      this.willChangeValueForKey(setter.__key, keyInfo);
      var result= this.setPrimitiveValueForKey(value, setter.__key);
      this.didChangeValueForKey(setter.__key, keyInfo);
      return result;
    }
    setter.__key= key;
    return setter;
  }
  
  coherent.Model= function(name, decl)
  {
    if (name in models)
      throw new Error("Model " + name + " already defined");
    
    var Klass= Class.create(coherent.ModelObject,{});
    var classInfo= coherent.KVO.getClassInfoForObject(Klass.prototype);
    var value;
    var setKey;
    var setter;
    var wrapMethod= coherent.KeyInfo.wrapMethod;
    var wrapGetMethod= coherent.KeyInfo.wrapGetMethod;
    var wrapSetMethod= coherent.KeyInfo.wrapSetMethod;
    var Property= coherent.Model.Property;
    
    Klass.modelName= name;
    Klass.__classInfo= classInfo;
    models[name]= Klass;
    
    decl= decl||{};
    
    for (var key in decl)
    {
      setKey= 'set'+key.titleCase();
        
      value= decl[key];
      
      if (value instanceof Property)
      {
        if (value.get)
          decl[key]= wrapMethod(wrapGetMethod, value.get, key);
        else
          decl[key]= makeGetter(key);
        if (value.set)
          decl[setKey]= wrapMethod(wrapSetMethod, value.set, key);
        else if (!value.readOnly)
          decl[setKey]= makeSetter(key);
          
        classInfo.methods[key]= {
          getter: value.get,
          setter: value.set,
          mutable: !value.readOnly,
          type: value.type,
          primitive: value.primitive,
          relation: value.relation,
          composite: value.composite,
          inverse: value.inverse
        };
        
        continue;
      }
      
      if ('function'!==typeof(value))
        continue;
      
      if (-1!==PRIMITIVE_TYPES.indexOf(value))
      {
        decl[key]= makeGetter(key);
        decl[setKey]= makeSetter(key);
        classInfo.methods[key]= {
          getter: decl[key],
          setter: decl[setKey],
          type: value,
          primitive: true
        };
        
        continue;
      }
      
      if ('modelName' in value)
      {
        decl[key]= makeGetter(key);
        decl[setKey]= makeSetter(key);
        classInfo.methods[key]= {
          getter: decl[key],
          setter: decl[setKey],
          type: value,
          primitive: false
        };
        
        continue;
      }

      /* TODO: How should this specify type? */
      setter= decl[setKey];
      if (!setter)
        continue;
        
      decl[key]= wrapMethod(wrapGetMethod, value, key);
      decl[setKey]= wrapMethod(wrapSetMethod, setter, key);
      
      classInfo.methods[key]= {
        setter: setter,
        getter: value
      };
    }
    
    Class.extend(Klass, decl);
    Object.applyDefaults(Klass, coherent.Model.ClassMethods);
    
    Klass.collection= [];
    
    return Klass;
  }

  coherent.Model._resetModels= function()
  {
    models= {};
  }
  
  coherent.Model.modelWithName= function(name)
  {
    var model= models[name];
    if (!model)
      throw new Error("No model with name: "+name);
    return model;
  }
  
  coherent.Model.Property= function(decl)
  {
    if (!(this instanceof coherent.Model.Property))
      return new coherent.Model.Property(decl);
    Object.extend(this, decl);
    Object.applyDefaults(this, coherent.Model.Property.DEFAULTS);
    this.primitive= (-1!==PRIMITIVE_TYPES.indexOf(this.type));
    return void(0);
  }
  
  coherent.Model.Property.DEFAULTS= {
    composite: true
  };



  coherent.Model.ToOne= function(decl)
  {
    decl= Object.extend(coherent.Model.ToOne.DEFAULTS, decl);
    return new coherent.Model.Property(decl);
  }
  
  coherent.Model.ToOne.DEFAULTS= {
    relation: coherent.Model.ToOne,
    composite: false
  };



  coherent.Model.ToMany= function(decl)
  {
    throw new Error("Not implemented yet");
  }
  
  coherent.Model.ToMany.DEFAULTS= {
    relation: coherent.Model.ToMany,
    composite: false
  };
  
  Object.markMethods(coherent.Model);
  coherent.__export("Model");
})();