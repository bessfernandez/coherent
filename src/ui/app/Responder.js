/*jsl:import ../../ui.js*/

/*jsl:declare FIRST_RESPONDER*/
window.FIRST_RESPONDER='__first_responder__';


/** The base class for all event handlers in the framework. This provides a
    default implementation for most event handlers.
 */
coherent.Responder= Class.create(coherent.Bindable, {

  /** Perform a command by bubbling up the responder chain.
      @param command    the name of the command to execute
    
      @returns the responder that ultimately handled the command or null if 
           the command was never handled.
   */
  sendActionToView: function(action, view)
  {
    if (FIRST_RESPONDER===view)
      view= coherent.Page.shared.firstResponder;
      
    var target= view||coherent.Page.shared.firstResponder||this;
    
    while (target)
    {
      if (action in target)
      {
        target[action](this);
        return true;
      }

      target= target.nextResponder();
    }

    return false;
  },
  
  /** Does this object want to be the first responder?
   */
  acceptsFirstResponder: function()
  {
    return false;
  },
  
  /** Called when attempting to make the object a first responder.
      @returns true if the object accepts first responder status, false if
           the view doesn't want to be first responder.
   */
  becomeFirstResponder: function()
  {
    return true;
  },

  /** Called when the view should stop being the first responder.
      @return true if the the view accepts the loss and false if it is
          unable to give up first responder status.
   */
  resignFirstResponder: function()
  {
    return true;
  },

  nextResponder: function()
  {
    return this.__nextResponder||null;
  },
  
  setNextResponder: function(newNextResponder)
  {
    this.__nextResponder= newNextResponder;
  },

  /** Return the delegate associated with this view. Rather than subclass a
      view, it is often more appropriate to respond to the view's delegate
      methods.
      @see #setDelegate for a discussion of how this method __really__ works.
      @type Object
   */
  delegate: function()
  {
    return this.__delegate;
  },
  
  /** Set the delegate for this view. This method is a bit tricky, because the
      value for the delegate might be a string representing the name of the
      delegate in the view's context. However, there might not be a value for
      that key when this method is called. In that case, a temporary method
      will be installed to override {@link #delegate}. This temporary method
      will look up the name of the delegate and return that value. Once a
      delegate is found, the temporary method is removed and the value found
      will be returned immediately when calling {@link #delegate}.
    
      @param {Object|String} newDelegate - The value to use for the delegate.
   */
  setDelegate: function(newDelegate)
  {
    if ('string'!==typeof(newDelegate))
    {
      this.__delegate= newDelegate;
      return;
    }
    
    //  Need some extra trickery for string delegates...
    var delegate= this.__context && this.__context.valueForKey(newDelegate);
    if (delegate)
    {
      this.__delegate= delegate;
      return;
    }
    
    /*  The delegate wasn't found in the context yet... so create a
        temporary function which will look it up later. Note, the temporary
        function will delete itself and return the object to using the
        prototype delegate method.
     */
    this.delegate= function()
    {
      this.__delegate= (this.__context && this.__context.valueForKey(newDelegate));
      if (this.__delegate)
        delete this.delegate;
      return this.__delegate;
    }
  },
  
  callDelegate: function(method, args)
  {
    var delegate= this.delegate();
    if (!delegate || !delegate[method])
      return null;
      
    args= [this].concat(args);
    return delegate[method].apply(delegate, args);
  },

  /** Present a non-modal error notification.
    
      @param error  an instance of coherent.Error containing information
              about the error.
      @returns true if the error was presented to the visitor.
   */
  presentError: function(error)
  {
    //  Allow this responder to customise the error message before it is
    //  presented to the visitor
    this.willPresentError(error);

    //  Note which field originated the error
    if (!('field' in error))
      error.field= this;
      
    //  By default, we'll just pass the error up the responder chain
    var nextResponder= this.nextResponder();
    if (nextResponder)
      return nextResponder.presentError(error);
    return false;
  },
  
  /** Clear any errors for a particular field. Transitory errors, like values
      not matching a regex, can be cleared after further user input. This
      method will clear the errors for a particular field. The original
      callback method will not be invoked.
    
      @param [field]  a reference to the field for which errors will be
              cleared. 
   */
  clearAllErrors: function(field)
  {
    //  By default, we'll just pass the error up the responder chain
    var nextResponder= this.nextResponder();
    if (nextResponder)
      nextResponder.clearAllErrors(field||this);
  },
  
  /** Customise an error message that has come up from down the responder
      chain. This allows a view with more information to update the error or
      even add a recovery object.
    
      @param error  the error which will be presented
   */
  willPresentError: function(error)
  {
  },

  onfocus: function(event)
  {
    var target= this.nextResponder();
    if (target)
      target.onfocus(event);
  },
  
  onblur: function(event)
  {
    var target= this.nextResponder();
    if (target)
      target.onblur(event);
  },

  onchange: function(event)
  {
  },
  
  onsubmit: function(event)
  {
  },
  
  onreset: function(event)
  {
  },
  
  onmousedown: function(event)
  {
    var target= this.nextResponder();
    if (target)
      target.onmousedown(event);
  },
  
  onmouseup: function(event)
  {
    var target= this.nextResponder();
    if (target)
      target.onmouseup(event);
  },

  onmousedrag: function(event)
  {
    var target= this.nextResponder();
    if (target)
      target.onmousedrag(event);
  },
  
  onmouseenter: function(event)
  {
    var target= this.nextResponder();
    if (target)
      target.onmouseenter(event);
  },

  onmouseleave: function(event)
  {
    var target= this.nextResponder();
    if (target)
      target.onmouseleave(event);
  },
  
  onclick: function(event)
  {
    var target= this.nextResponder();
    if (target)
      target.onclick(event);
  },

  ondblclick: function(event)
  {
    var target= this.nextResponder();
    if (target)
      target.ondblclick(event);
  },

  onkeydown: function(event)
  {
    var target= this.nextResponder();
    if (target)
      target.onkeydown(event);
  },
  
  onkeyup: function(event)
  {
    var target= this.nextResponder();
    if (target)
      target.onkeyup(event);
  },
  
  onkeypress: function(event)
  {
    var target= this.nextResponder();
    if (target)
      target.onkeypress(event);
  },
  
  ontouchstart: function(event)
  {
    var target= this.nextResponder();
    if (target)
      target.ontouchstart(event);
  },

  ontouchmove: function(event)
  {
    var target= this.nextResponder();
    if (target)
      target.ontouchmove(event);
  },

  ontouchend: function(event)
  {
    var target= this.nextResponder();
    if (target)
      target.ontouchend(event);
  },
  
  ongesturestart: function(event)
  {
    var target= this.nextResponder();
    if (target)
      target.ongesturestart(event);
  },
  
  ongesturechange: function(event)
  {
    var target= this.nextResponder();
    if (target)
      target.ongesturechange(event);
  },
  
  ongestureend: function(event)
  {
    var target= this.nextResponder();
    if (target)
      target.ongestureend(event);
  },
  
  onswipe: function(event)
  {
    var target= this.nextResponder();
    if (target)
      target.onswipe(event);
  },
  
  ondragstart: function(event)
  {
    var target= this.nextResponder();
    if (target)
      target.ondragstart(event);
  }

});
