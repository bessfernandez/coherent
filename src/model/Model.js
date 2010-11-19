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
    
    Klass.modelName= name;
    decl= decl||{};
    
    for (var key in decl)
    {
      value= decl[key];
      if ('function'!==typeof(value))
        continue;
      
      setKey= 'set'+key.titleCase();
        
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
      }
      else if ('modelName' in value)
      {
        decl[key]= makeGetter(key);
        decl[setKey]= makeSetter(key);
        classInfo.methods[key]= {
          getter: decl[key],
          setter: decl[setKey],
          type: value,
          primitive: false
        };
      }
      
    }
    
    Class.extend(Klass, decl);
    Object.applyDefaults(Klass, coherent.Model.ClassMethods);
    
    Klass.collection= [];
    
    return Klass;
  }

  coherent.__export("Model");

})();