/*jsl:import ../../foundation.js*/


/** The base class for all transformers.

    Some predefined transformers include:
  
    - {@link coherent.transformer.Not} `not` - A transformer that reverses the
      logical value. This applies to truthy and falsy values as well.
    - {@link coherent.transformer.Truncate} `truncated` - A transformer that
      will shorten a string longer than 50 characters.
    - {@link coherent.transformer.StringToObject} `StringToObject` - A
      transformer that will convert an array of strings into an array of
      objects with each object having a key `string`.
    - {@link coherent.transformer.Trim} `trim` - A transformer that will
      remove the spaces at the beginning and end of a string.
 */
coherent.ValueTransformer = Class.create({

  /** Create a new ValueTransformer. If only one argument is passed, and it's
      an object, this method will copy all the properties of the argument to
      this transformer.
   */
  constructor: function()
  {
    if (arguments.length==1 && 'object'===typeof(arguments[0]))
      Object.extend(this, arguments[0]);
  },
  
  /** Transform a model value into a presentational value.
  
      @param value - The model value.
      @return The presentation value.
   */
  transformedValue: function(value)
  {
    return value;
  },

  /** Convert a presentation value back into a model value.
  
      Note: Unless a subclass specifically overrides this method it will
      get removed by the subclass hook ({@link coherent.ValueTransformer.__subclassCreated__}).
    
      @param value - The presentation value
      @returns The model value
   */
  reverseTransformedValue: function(value)
  {
    return value;
  },

  /** Allow factory creation of transformers.
      @returns {Function} A factory method that will instantiate a new
           transformer instance with the arguments passed to the constructor.
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
  }
  
});

/** Capture creation of subclasses of ValueTransformer. Mask the
    {@link coherent.ValueTransformer#reverseTransformedValue} method if not
    overridden in a subclass. This enables the detection of whether the
    Transformer _really_ supports reverse transformation, while at the same
    time, clearly documenting the API for reverseTransformedValue.
  
    @param {Class} subclass - The new subclass of coherent.ValueTransformer
 */
coherent.ValueTransformer.__subclassCreated__= function(subclass)
{
  var rootproto= coherent.ValueTransformer.prototype;
  var proto= subclass.prototype;
  
  /*  @JEFF: I think this may be a bit dangerous, because if someone were just
      inspecting the code, he might be confused about why
      reverseTransformedValue wasn't executing...
   */
  if (rootproto.reverseTransformedValue == proto.reverseTransformedValue)
    subclass.prototype.reverseTransformedValue = null;
}

/** @namespace
    This is where all the ValueTransformer classes are registered.
 */
coherent.transformer= {};

/** @namespace
    This is where all the registered instances of ValueTransformers live.
 */
coherent.transformerInstances= {};

/** Lookup a ValueTransformer instance by name.
  
    @param {String} transformerName - The name of the value transformer
    @returns {coherent.ValueTransformer} a reference to the specifed value transformer
    @throws {InvalidArgumentError} If the transformerName does not specify
        a pre-registered value transformer
 */
coherent.findTransformerWithName= function(transformerName)
{
  var valueTransformer= coherent.transformerInstances[transformerName.toLowerCase()];
  if (valueTransformer)
    return valueTransformer;

  //  Try to create an instance of the transformer assuming the transformerName
  //  value is a class name
  if (-1===transformerName.indexOf('.'))
    valueTransformer= coherent.transformer[transformerName];
  
  //  If there were dots in the name or the undotted name wasn't found, try to
  //  evaluate the string to see if it resolves to an instance, constructor, or
  //  finally a factory function.    
  if (!valueTransformer)
  {
    try
    {
      valueTransformer= coherent.globalEval(transformerName);
    }
    catch(e)
    {}
  }
  
  if (!valueTransformer)
    throw new InvalidArgumentError("The transformerName argument does not specify a valid ValueTransformer: " +
                     transformerName);

  //  If the valueTransformer isn't a function, just return it
  if ('function'!==typeof(valueTransformer))
    return valueTransformer;
    
  //  valueTransformer is now either a factory function or a constructor.
  //  Create an instance of the transformer, if you need arguments, you should
  //  probably consider using the factory function version...
  if (valueTransformer.__factoryFn__)
    valueTransformer= valueTransformer();
  else
    valueTransformer= new valueTransformer();

  return valueTransformer;
}

/** Register an instance of a ValueTransformer with a specific name.

    @param {coherent.ValueTransformer} valueTransformer - The value transformer
      instance or constructor to register.
    @param {String} name - The name by which this value transformer is known.
  
    @throws {InvalidArgumentError} if the valueTransformer parameter
        doesn't specify either a constructor or an instance of a valid
        ValueTransformer subclass.
 */
coherent.registerTransformerWithName= function(valueTransformer, name)
{
  //  make certain it really is a value transformer
  if (!valueTransformer.transformedValue)
    throw new InvalidArgumentError( "The valueTransformer argument does not support the ValueTransformer method transformedValue" );

  name= name.toLowerCase();  
  coherent.transformerInstances[name]= valueTransformer;
}




























