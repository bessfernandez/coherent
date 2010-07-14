/*jsl:import ../../foundation.js*/

/** Make a shallow-copy clone of an object. Modifications are copy-on-write.
    Note, because this is a shallow copy, only properties actually on the cloned
    object will be copy-on-write. For example, if you clone foo into bar and
    then change bar.baz.foo, the change will propagate to the original, foo.
  
    @param {Object} obj - The object to clone.
    @returns {Object} A new object with all the same properties as obj.
 */
Object.clone= function(obj)
{
  var fn = (function(){});
  fn.prototype = obj;
  return new fn();
}

/** Simple way to find an object using its property path.
 */
Object.get= function(path, context)
{
  var obj= context||coherent.global;
  var parts= path.split('.');
  var p;
  
  for (var i=0; obj && (p=parts[i]); ++i)
    obj= obj[p];
  return obj;
}

/** Apply default values to an object.
  
    @param {Object} obj - The object to receive default values. If this
         happens to be null or undefined, a new object will be created.
    @param {Object} defaults - The object from which copy the default values.
    @returns {Object} The value of `obj` or a new object.
 */
Object.applyDefaults = function(obj, defaults)
{
  obj= obj||{};
  
  if (!defaults)
    return obj;

  for (var p in defaults)
  {
    if (p in obj)
      continue;
    obj[p]= defaults[p];
  }
  return obj;
}

/** Extend an object by copying values from another object. Unlike
    {@link Object.applyDefaults}, this function will overwrite properties that are
    already present.
  
    @param {Object} obj - The object to extend. If this happens to be null or
         undefined, a new object gets created.
    @param {Object} extensions - The object to copy values from.
    @returns {Object} The value of `obj` or a new object.
 */
Object.extend= function(obj, extensions)
{
  obj= obj||{};
  
  for (var p in extensions)
    obj[p]= extensions[p];

  return obj;
}

/** Mark all methods within an object. This takes advantage of the `displayName`
    property on functions (introduced with WebKit) to provide more meaningful
    names in the debugger and profiler.
  
    This function iterates over all the properties of an object, and for each
    property with a function value, assigns its `displayName` property to the
    name of the property. If a prefix was specified, it will be prepended to
    the name of the property.
  
    It isn't necessary to call `markMethods` when defining a class, because
    {@link Class.create} includes this functionality.
  
    @param {Object} obj - The object to mark.
    @param {String} [prefix] - An optional prefix to prepend to the name of the
         function being marked.
 */
Object.markMethods=function(obj, prefix)
{
  var v;
  prefix= prefix?(prefix+'.'):'';
  
  for (var p in obj)
  {
    v= obj[p];
    if ('function'===typeof(v))
      v.displayName= prefix+p;
  }
}

/** Create a new object and copy the properties from the arguments.

    @TODO This should probably be rewritten to allow an arbitrary number of
        arguments.
       
    @param {Object} obj1 - The first object to copy to the returned value.
    @param {Object} obj2 - The second object to copy to the returned value.
    @returns {Object} A new object with all the properties of the arguments.
 */
Object.merge = function(obj1, obj2)
{
  var o= {};
  var prop;

  for (prop in obj1)
    o[prop]= obj1[prop];

  for (prop in obj2)
  {
    if (prop in o)
      continue;
    o[prop]= obj2[prop];
  }
  
  return o;
};

/** Query string handling extensions to Object.
 */
(function(){

  var typesToExclude= {file:1, submit:1, image:1, reset:1, button:1};
  var genericObject={};
  
  function setValue(object, name, value)
  {
    var previousValue= object[name];
    var previousType= coherent.typeOf(previousValue);
    
    if ('string'===previousType)
      object[name]= [previousValue, value];
    else if ('array'===previousType)
      previousValue.push(value);
    else
      object[name]= value;
  }

  function fromFormVisitNode(node)
  {
    var name= node.name;
    var type= (node.type||'').toLowerCase();
    
    if (node.disabled || type in typesToExclude)
      return;
      
    if ('radio'===type || 'checkbox'===type)
    {
      if (node.checked)
        setValue(this, name, node.value);
    }
    else if (node.multiple)
    {
      function visitOption(option)
      {
        if (option.selected)
          setValue(this, name, option.value);
      }
      this[name]= [];
      Array.forEach(node.options, visitOption, this);
    }
    else
    {
      setValue(this, name, node.value);
      if ('image'===type)
      {
        setValue(this, name+'.x', 0);
        setValue(this, name+'.y', 0);
      }
    }
  }
  
  /** Create a new object from the fields in a form. This will not include the
      values of any buttons. If there are multiple fields with the same name,
      their values will be collected into an array.
    
      @param {Form} node - A DOM Form element that should be scanned to
           determine the values for the new object.
      @returns {Object} A new object with properties corresponding to the
           fields of the form.
   */
  Object.fromForm=function(node)
  {
    var object= {};
    Array.forEach(node.elements, fromFormVisitNode, object);
    return object;
  };
  
  function fromQueryStringProcessPair(pair)
  {
    pair= pair.split('=');
    if (1===pair.length)
      return;
    
    var key= decodeURIComponent(pair[0].trim());
    var value= decodeURIComponent(pair[1].trim())||null;
    
    setValue(this, key, value);
  }
  
  /** Convert the URL encoded query string into an object. This method
      considers the value after the equal sign to be a literal value and will
      not interpret it at all. However, if the same key appears multiple times,
      the values will be collected in an array and added to the result.
    
      For example:

        var query= "abc=123&zebra=456&zebra=789&foo=bar";
        var obj= Object.fromQueryString(query);
      
      The value of obj would be:
    
        {
          abc: 123,
          zebra: [456, 789],
          foo: "bar"
        }
      
      It is possible to create an object where the keys are not valid
      identifiers. In that case, it is necessary to access them via the index
      operator rather than directly.
    
      @param {String} query - The URL encoded query string (with or without the
           ? at the beginning).
      @returns {Object} A new object representing the keys and values in the
           query string.
   */
  Object.fromQueryString = function(query)
  {
    if ("?"==query.charAt(0))
      query= query.slice(1);
    
    query= query.split(/\s*&\s*/);

    var object= {};

    query.forEach(fromQueryStringProcessPair, object);
    return object;
  };

  /** Create a query string from an object. This method expects the object to
      be largely flat and will only perform special processing for property
      values that are arrays. In the case of arrays, each value of the array
      will be added with the same key. For example:
    
        var test= {
          abc: 123,
          zebra: [456, 789],
          foo: "bar"
        };
    
        var query= Object.toQueryString(test);
    
      The value of query will be:
    
        abc=123&zebra=456&zebra=789&foo=bar
    
      The behaviour of `Object.toQueryString` for values that aren't strings or
      numbers should be locked down, but is currently undefined.
    
      @param {Object} obj - The object to convert into a query string.
      @returns {String} The query string representation of the obj parameter.
   */
  Object.toQueryString = function(obj)
  {
    if (!obj)
      return "";

    var key;
    var value;
    var typeOfValue;
    var args= [];

    /** Add a value to the args array. Assumes key has already been
        encoded using encodeURIComponent.
     */
    function addValue(value)
    {
      if (null!==value && 'undefined'!==typeof(value))
        value= encodeURIComponent(value);
      else
        value= '';

      if (value)
        args.push(key+'='+value);
      else
        args.push(key);
    }
    
    for (key in obj)
    {
      value= obj[key];
      typeOfValue= coherent.typeOf(value);
      
      //  skip properties defined on Object
      if ('function'===typeOfValue || value===genericObject[key])
        continue;

      key= encodeURIComponent(key);
      if ('array'===typeOfValue)
        value.forEach(addValue);
      else
        addValue(value);
    }
  
    return args.join("&");
  };
  
})();

Object.markMethods(Object, 'Object');