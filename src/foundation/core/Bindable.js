/*jsl:import kvo.js*/


/** Bindable is a base class that provides a simple mechanism for keeping one
  object's properties in sync with the properties of another. Views and
  Controllers are subclasses of Bindable.
  
  @property {Object} bindings - A map of the bindings that have been
    established for this object.
 */
coherent.Bindable= Class.create(coherent.KVO, {

  /** Construct a new Bindable instance. This initialises the bindings
    property to an empty hash.
    
    @param {Object} parameters - An object containing name/value pairs that
         will be copied to this object upon initialisation.
   */
  constructor: function(parameters)
  {
    this.bindings={};
    this.__context= coherent.dataModel;
    this.__copyParameters(parameters||{});
  },

  /** Create factory objects for instances of this class. Because Bindable
    instances may have factory objects that should participate in the
    binding context, this method overrides the default implementation
    provided by {@link Class.create} to switch the global context to this
    instances context before constructing the factory objects.
    
    @private
   */
  __createFactoryObjects: function()
  {
    var oldDataModel= coherent.dataModel;
    var oldContext= this.__context;
    
    coherent.dataModel= this.__context= this;
    
    //  Create declarative objects
    var p;
    var v;
    for (p in this.__factories__)
    {
      v= this[p];
      if (!v.__factoryFn__)
        continue;
      this[p]= v.call(this);
    }
    
    //  Restore data model
    coherent.dataModel= oldDataModel;
    this.__context= oldContext;
  },
  
  /** This is a declarative way of specifying what bindings the object exposes.
    Subclasses should declare their own `exposedBindings` property, which
    will be merged with their superclass' value.
    @type String[]
   */
  exposedBindings: [],
  
  /** Sometimes a subclass doesn't want to expose all the bindings available
    from its superclasses.
    @type String[]
   */
  maskedBindings: [],
  
  /** Declarative structure for placeholders based on the binding.
    For example:
    
      defaultPlaceholders: {
        value: {
          nullValue: "No Value",
          multipleValues: "Multiple Values",
          noSelection: "No Selection"
        }
      }
  
    The exact value will be sent when the binding receives the specified
    marker value.
    
    You may also use localised strings for placeholders:

      defaultPlaceholders: {
        value: {
          nullValue: _("placeholder.no-value"),
          multipleValues: _("placeholder.multiple-values"),
          noSelection: _("placeholder.no-selection")
        }
      }
    
   */
  defaultPlaceholders: {},
  
  /** Return the default placeholder value for the given marker value.
  
    @param {String} marker - The marker type. May be one of 'nullValue',
         'multipleValues', and 'noSelection'.
    @param {String} binding - The binding name. This should be a binding
         listed in {@link #exposedBindings}
         
    @returns The placeholder value or null if none was registered
   */
  defaultPlaceholderForMarkerWithBinding: function(marker, binding)
  {
    var placeholders= this.defaultPlaceholders[binding];
    if (!placeholders)
      return null;
    
    return placeholders[marker]||null;
  },
  
  /** Create an observer method that simply calls {@link #setValueForKey} to
    note the change. This allows simple bindings to be implemented with only
    a getter and setter pair.
    
    Note: this isn't really a good choice for Array oriented bindings,
    because it ignores change notifications other than setting.
    
    @param {String} name - The name of the binding, which is also the name
         of the property to set.
    @type Function
   */
  __createObserverMethod: function(name)
  {
    function observer(change)
    {
      if (coherent.ChangeType.setting!==change.changeType)
        return;
      this.setValueForKey(change.newValue, observer.key);
    }
    observer.key= name;
    
    return observer;
  },
  
  /** Bind an exposed binding name to a given key path. The instance must
    implement an observer method for the exposed binding. The observer
    method must be named `observe<Binding>Change` where <Binding> is the
    titlecase version of `name`. If the observer doesn't implement this
    method, a default implementation is created.
        
    @param {String} name - the name of the binding exposed via exposedBindings
    @param {Object} object - the model object to be bound to this object
    @param {String} keyPath - the path to the value used for this binding
   */
  bindNameToObjectWithKeyPath: function(name, object, keyPath)
  {
    var fn;
    var binding;
    var info= {};
    
    if (!this.bindings)
      this.bindings={};
    
    fn= this["observe" + name.titleCase() + "Change"] ||
      this.__createObserverMethod(name);
  
    //  Unbind the old value
    if (this.bindings[name])
      this.bindings[name].unbind();

    if ('object'===typeof(keyPath))
    {
      Object.extend(info, keyPath);
      keyPath= info.keypath;
    }
    
    //  parse out the keypath and transformer from the binding string
    Object.extend(info, coherent.Binding.bindingInfoFromString(keyPath));
    
    if ('transformedValue' in info)
    {
      info.transformer= {
        transformedValue: info.transformedValue,
        reverseTransformedValue: info.reverseTransformedValue||null
      };
      
      delete info.transformValue;
      delete info.reverseTransformedValue;
    }
    
    //  Create the Binding based on the object, keypath and transformer
    info.name= name;
    info.object= object;
    info.observer= this;
    info.observerFn= fn;

    binding= new coherent.Binding(info);
    binding.bind();
    this.bindings[name]= binding;
  },
  
  /** After all contructors execute, the Oop framework calls this method.
    
    This method performs the following steps:
    1. Setup the bindings defined in the parameters (calls {@link #setupBindings})
    2. Call the init method
    3. Retrieve the current value of each binding (calls {@link #updateBindings})
   */
  __postConstruct: function()
  {
    this.setupBindings();
    if (this.init)
      this.init();
    this.updateBindings();
  },
  
  /** Copy the parameters hash to this object. This method explicitly skips
    any parameter name that ends in `Binding`, because those are expected to
    be binding declarations.
    
    The values in the `parameters` hash will be adapted to be KVO-compliant
    if they are not already.
    
    If there is a setter method for the parameter value, it will be invoked
    rather than directly setting the value on this object. However, this
    doesn't call {@link #setValueForKey}.
    
    @param {Object} parameters - A hash of name/value pairs that should be
      copied to this object.
   */
  __copyParameters: function(parameters)
  {
    if (!parameters)
      return;
      
    var p;
    var v;
    var setter;
    var adaptTree= coherent.KVO.adaptTree;
    
    for (p in parameters)
    {
      if (-1!==p.search(/Binding$/))
        continue;
      v= parameters[p];
      if ('object'===coherent.typeOf(v) && !('addObserverForKeyPath' in v))
        adaptTree(v);
      setter= 'set' + p.titleCase();
      if (setter in this)
        this[setter](v);
      else
        this[p]= v;
    }

    this.__parameters= parameters;
  },
  
  /** Return the binding declaration originally passed as `parameters` to the
    constructor.
    
    @param {String} bindingName - The name of the binding for which the
      binding declaration should be retrieved.
         
    @returns {String} A string value should be considered to be the keypath
      that the binding should reference.
    @returns {Object} A binding declaration object that specifies the keypath,
      transformer methods, and placeholder values.
   */
  bindingInfoForName: function(bindingName)
  {
    if (!this.__parameters)
      return null;
    return this.__parameters[bindingName+"Binding"];
  },
  
  /** Establish all the exposed bindings. This merely sets up the binding. No
    update notification will occur for the initial value.
   */
  setupBindings: function()
  {
    //  setup bindings
    var exposed= this.exposedBindings;
    var len= exposed.length;
    var keyPath;
    var b;
    var i;

    for (i=0; i<len; ++i)
    {
      b= exposed[i];
      keyPath= this.bindingInfoForName(b);
      if (!keyPath)
        continue;
      this.bindNameToObjectWithKeyPath(b, this.__context, keyPath);
    }
    
  },

  /** Update the value of all bindings. Updated in the same order they were
    declared via exposedBindings.
   */
  updateBindings: function()
  {
    var bindings= this.bindings;
    var exposed= this.exposedBindings;
    var len= exposed.length;
    var b;
    var i;
    
    for (i=0; i<len; ++i)
    {
      b= bindings[exposed[i]];
      if (!b)
        continue;
      b.update();
    }
  },
  
  /** Unbind all the established bindings.
   */
  unbind: function()
  {
    for (var b in this.bindings)
      this.bindings[b].unbind();
  }

});

/** Handler for creation of subclasses of Bindable: this fixes up the exposed
  bindings silliness by adding all the base class exposed bindings to the
  prototype value. Any bindings listed in the {@link #maskedBindings} will be
  removed fromt the final list of available bindings.
  
  @function
  @param {Class} subclass - a reference to the constructor of the new class
       derived from {@link coherent.Bindable} which needs its exposedBindings
       property fixed up.
 */
coherent.Bindable.__subclassCreated__= function(subclass)
{
  var baseproto= subclass.superclass.prototype;
  var proto= subclass.prototype;
  
  //  Handle default placeholders
  if (proto.hasOwnProperty('defaultPlaceholders'))
  {
    var placeholders= Object.clone(baseproto.defaultPlaceholders);
    proto.defaultPlaceholders= Object.extend(placeholders,
                         proto.defaultPlaceholders);
  }
  
  //  Nothing to do if the exposedBindings is the same as the superclass and
  //  there are no masked bindings
  if (baseproto.exposedBindings===proto.exposedBindings &&
    !proto.maskedBindings)
      return;

  //  create a set of the maskedBindings.  Masked bindings are those unique to this class
  //  as any masks have already been applied to the base class.  
  var masked= (baseproto.maskedBindings===proto.maskedBindings)?{}:coherent.Set(proto.maskedBindings);
  
  function isBindingExposed(binding)
  {
    return !(binding in masked);
  }

  //  gather all the exposed superclass bindings
  var bindings= baseproto.exposedBindings.filter(isBindingExposed);
  
  //  if the class defines its own bindings, filter those
  if (baseproto.exposedBindings!==proto.exposedBindings)
    bindings= bindings.concat(proto.exposedBindings.filter(isBindingExposed));

  //  stash the exposed bindings
  proto.exposedBindings= bindings;
};
