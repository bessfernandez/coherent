/*jsl:import View.js*/
/*jsl:import ../views/ErrorBubble.js*/

/** A specialisation of {@link coherent.View} that implements an improved
    method of presenting errors. Errors are collected and displayed in a
    {@link coherent.ErrorBubble} when a field receives the focus.
  
    All instances of FieldGroup share a single ErrorBubble instance. So only one
    error may be presented at a single time.
 */
coherent.FieldGroup= Class.create(coherent.View, {
  
  /** Should errors be displayed using an instance of {@link coherent.ErrorBubble}
      or via the default mechanism?
      @type Boolean
      @default true
   */
  capturePresentError: true,

  /** Should errors be presented immediately or should they be displayed when
      the field next regains focus?
      @type Boolean
      @default false
   */
  presentErrorsImmediately: false,
  
  /** Initialise the FieldGroup. This will create the shared instance of the
      {@link coherent.ErrorBubble} if it hasn't already been created.
      Additionally, the FieldGroup will register as an observer of the Page's
      firstResponder property.
   */
  init: function()
  {
    this.__currentViewId= false;
    this.__fieldErrors= {};
    if (!this.__bubble)
      coherent.FieldGroup.prototype.__bubble= new coherent.ErrorBubble();
    coherent.page.addObserverForKeyPath(this, 'observeFirstResponderChange',
                      'firstResponder');
  },
  
  /** Tear down a FieldGroup instance. This unregisters the observer from the
      Page before calling the base teardown method.
   */
  teardown: function()
  {
    coherent.page.removeObserverForKeyPath(this, 'firstResponder');
    this.base();
  },

  /** Validate all input and textarea fields. Set focus to the first field
      that does not have a valid value.
    
      @returns {Boolean} `true` if all fields are valid, otherwise `false`.
   */
  validateFields: function()
  {
    var fields= Element.queryAll(this.node, 'input,textarea');
    
    var len= fields.length;
    var f;
    var firstInvalidField;
    var validationResult;
    var valid= true;
    
    for (var i=0; i<len; ++i)
    {
      f= coherent.View.fromNode(fields[i]);
      if (!f)
        continue;
      
      if ('validate' in f)
      {
        validationResult= f.validate();
        
        if (validationResult instanceof coherent.Error)
        {
          valid= false;
          firstInvalidField= firstInvalidField || f;
        }
      }
    }
    
    if (firstInvalidField)
      firstInvalidField.focus();
      
    return valid;
  },
  
  /** Hijack the standard error presentation (a modal dialog box). This
      remembers the error in a hash keyed by the field id. When the field
      next receives the focus, the FieldGroup will display the error bubble.
   */
  presentError: function(error)
  {
    if (!this.capturePresentError)
    {
      this.base(error);
      return;
    }
    
    var field= error.field;
    if (!field)
      return;
    
    this.__fieldErrors[field.id]= error;
    if (this.presentErrorsImmediately)
      this.__presentError(error);
  },
  
  __presentError: function(error)
  {
    var field= error.field;
    this.__currentViewId= field.id;

    this.__bubble.constrainToView(this);
    this.__bubble.attachToView(field);
    this.__bubble.setError(error);
    this.__bubble.setVisible(true);
  },
  
  /** Clear all errors associated with a specific field. If the error bubble
      is currently displayed for the specified field, it will be hidden.
    
      @param {coherent.View} field - the field for which the errors should be
          cleared.
   */
  clearAllErrors: function(field)
  {
    if (!this.capturePresentError)
    {
      this.base(field);
      return;
    }
    
    delete this.__fieldErrors[field.id];
    if (this.__currentViewId==field.id)
    {
      if (this.__bubble.anchor && this.__currentViewId===this.__bubble.anchor.id)
        this.__bubble.setVisible(false);
      this.__currentViewId= false;
    }
  },
  
  /** Observer method for changes to the global first responder. This method
      determines whether there is an error for the new first responder and
      displays the bubble.
    
      @param {coherent.ChangeNotification} change - the updated firstResponder
   */
  observeFirstResponderChange: function(change)
  {
    if (!this.capturePresentError)
      return;
      
    var newFirstResponder= change.newValue;
    var error= !!newFirstResponder && this.__fieldErrors[newFirstResponder.id];
      
    if (!error || !newFirstResponder.isDescendantOf(this))
    {
      if (this.__bubble.anchor && this.__currentViewId===this.__bubble.anchor.id)
        this.__bubble.setVisible(false);
      this.__currentViewId= "";
      return;
    }
    
    if (this.__currentViewId===newFirstResponder.id)
      return;

    this.__presentError(error);
  }
  
});
