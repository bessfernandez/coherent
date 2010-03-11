/*jsl:import FormControl.js*/

/** A View that represents basic input controls -- text, password, and search
 *  fields, and textareas. A TextField can be enabled or disabled based on a
 *  binding (or automatically if the value is undefined). Additionally, a
 *  TextField is set to readonly if the value binding is not mutable.
 */
coherent.TextField= Class.create(coherent.FormControl, {

    init: function()
    {
        //  chain to parent init.
        this.base();

        if (""===this.node.value)
            this.showPlaceholder();

        this.editing= false;
        this.validationError= null;
    },

    /** In addition to bindings exposed by FormControl, the TextField also
        exposes a binding for an error message. This error message is intended
        to allow servers to send back validation messages.
     */
    exposedBindings: ['errorMessage'],

    maskedBindings: ['text', 'html'],
    
    defaultPlaceholders: {
        value: {
            nullValue: _("marker.input.placeholder"),
            multipleValues: _("marker.input.multipleValues"),
            noSelection: _("marker.input.noSelection")
        }
    },
    
    /** Number of milliseconds before sending value change notification for a
     *  series of key presses.
     */
    keypressUpdateTimeout: 500,
    
    /** Does the input field update its value continuously or wait until typing
     *  has stopped?
     */
    continuallyUpdatesValue: true,
    
    /** Should the text field send its associated action only when the visitor
        hits enter (false) or any time editing ends (true) (e.g. onblur).
     */
    sendsActionOnEndEditing: true,
    
    //  Don't send the action for any of the usual events (click)
    sendActionOn: ['blur', 'keydown'],
    
    /** Method called when the input field has received the focus. Derived Views
     *  can override this method to perform specific operations when editing begins.
     */
    beginEditing: function()
    {
        this.editing= true;
    },
    
    /** Method called when the input field has lost the focus or editing has ended
     *  for any other reason. Derived Views may override this method to perform
     *  special cleanup operations.
     */
    endEditing: function()
    {
        this.editing= false;
        if (this.sendsActionOnEndEditing && this.action)
            this.sendAction();
            
        var view= this.node;

        if (""===view.value)
            this.showPlaceholder();

        if (!this.validationError && !this.__showingPlaceholder && this.formatter)
        {
            var value= this.formatter.valueForString(view.value);
            value= this.formatter.stringForValue(value);
            view.value= value;
        }
    },

    /** Check the value of the TextField's view to see if it is valid.
     *  Returns either the validated (transformed) value, or a coherent.Error.
     */
    validate: function()
    {
        var view= this.node;
        var value= view.value;

        if (this.__showingPlaceholder)
            value= "";
            
        if (this.formatter)
        {
            var err= this.formatter.isStringValid(value);
            if (err !== true)
            {
                this.presentError(err);
                return err;
            }
            value= this.formatter.valueForString(value);
        }
        
        if (this.bindings.value)
        {
            value= this.bindings.value.validateProposedValue(value);
            if (value instanceof coherent.Error)
            {
                this.presentError(value);
                return value;
            }
        }
        
        return value;
    },
    
    presentError: function(error)
    {
        this.validationError= error;
        Element.addClassName(this.node, coherent.Style.kInvalidValueClass);
        return this.base.apply(this, arguments);
    },
    
    clearAllErrors: function()
    {
        this.validationError= null;
        Element.removeClassName(this.node, coherent.Style.kInvalidValueClass);
        return this.base.apply(this, arguments);
    },

    /** Input fields want to be first responders...
     */
    acceptsFirstResponder: function()
    {
        var view= this.node;

        if (view.disabled || view.readOnly)
            return false;
        return true;
    },
    
    /** Focus handler for text input fields. If the present value of the field
     *  matches any of the placeholder values, the field is cleared before
     *  editing begins. This method will call {@link #beginEditing} to allow
     *  derived views to perform something clever when editing begins.
     */
    becomeFirstResponder: function()
    {
        var view= this.node;

        if (view.disabled || view.readOnly)
            return false;
    
        //  clear out any marker text
        this.hidePlaceholder();

        this.hasFocus= true;
        this.beginEditing();
        return true;
    },
    
    /** Blur handler for text input fields. If the value of the view is empty,
     *  the `placeholder` text will be set in the field. This handler also
     *  triggers a call to {@link #endEditing}.
     */
    resignFirstResponder: function(event)
    {
        var view= this.node;
        this.hasFocus= false;
        // this.onchange(event);
        this.endEditing();
        return true;
    },
    
    /** Display a marker value. The actual value of the marker is pulled from
     *  either an attribute on the node or a property on the view. In addition
     *  to updating the value of the view, `setMarkerValue` stores the text of
     *  the marker in the `markerValue` property and adds the marker class to
     *  the view's node.
     *  
     *  @param marker   which marker value to display
     */
    showPlaceholder: function()
    {
        var view= this.node;
        
        if (this.bindings.value)
            view.value= this.bindings.value.placeholderValue();
        else if (this.placeholder)
            view.value= this.placeholder;
        else
            return;
        
        this.__showingPlaceholder= true;
        Element.addClassName(view, coherent.Style.kMarkerClass);
    },

    /** Remove a marker value. In addition to clearing the value of the field,
     *  this method resets the `markerValue` property to `false` and removes the
     *  marker class from the view's node.
     */
    hidePlaceholder: function()
    {
        if (!this.__showingPlaceholder)
            return;
            
        var view= this.node;
        var placeholder; 
        
        if (this.bindings.value)
            placeholder= this.bindings.value.placeholderValue();
        else if (this.placeholder)
            placeholder= this.placeholder;

        placeholder= String(placeholder);
        
        if (view.value===placeholder)
            view.value= "";
        this.__showingPlaceholder= false;
        Element.removeClassName(view, coherent.Style.kMarkerClass);
    },

    /** Return the starting and ending selection point.
     */
    selectedRange: function()
    {
        var node= this.node;
        if (!node)
            return {
                start: 0,
                end: 0
            };
        
        if (coherent.Browser.IE)
        {
            var selectedRange = document.selection.createRange();
            var range= selectedRange.duplicate();
            range.moveToElementText(node);
            range.setEndPoint('EndToStart', selectedRange);
            var start= range.text.length;
            var end= start + selectedRange.text.length;

            return {
                start: start,
                end: end
            };
        }
        else
        {
            return {
                start: node.selectionStart,
                end: node.selectionEnd
            };
        }
    },
    
    setSelectedRange: function(start, end)
    {
        var node= this.node;
        if (!node)
            return;
        
        end= Math.max(start, end);
        
        if (coherent.Browser.IE)
        {
            var selection= node.createTextRange();
            selection.moveStart('textedit', -1);
            selection.moveEnd('textedit', -1);
            selection.moveStart('character', start);
            selection.moveEnd('character', end-start);
            selection.select();
        }
        else
        {
            node.selectionStart= start;
            node.selectionEnd= end;
        }
    },
    
    /** Value change handler for edit fields. It this handler was triggered via
     *  a timer event (or if a timer event is pending), the timer is cleared.
     *  If the new value isn't one of the marker values, then pass it along to
     *  the value binding.
     */
    onchange: function(event)
    {
        if (this.updateTimer)
        {
            window.clearTimeout(this.updateTmer);
            this.updateTimer= null;
        }
        
        var value = this.validate();
        
        if (!(value instanceof coherent.Error) && this.bindings.value)
        {
            this.bindings.value.setValue(value);
            if (this.validationError)
                this.clearAllErrors();
        }
    },
    
    /** Handler for keyup events. Because I don't want to flood the browser with
        update events, when continuallyUpdatesValue is true, this will wait for
        the visitor to stop typing for `keypressUpdateTimeout` milliseconds
        before triggering the onchange event.
     */
    onkeyup: function(event)
    {
        if (!this.continuallyUpdatesValue)
            return;
            
        var view= this.node;

        if (this.updateTimer)
            window.clearTimeout(this.updateTimer);
        
        if (view.readOnly || view.disabled)
            return;
            
        this.updateTimer= this.onchange.bindAndDelay(this, this.keypressUpdateTimeout);
    },
    
    /** Handler for keydown events. This will invoke the action on Return, if present.
     */
    onkeydown: function(event)
    {
        if (this.action && event.keyCode===Event.KEY_ENTER)
        {
            // Ensure we have the most up-to-date value from the field.
            this.onchange(null);
            
            if (this.validationError)
                return;
            this.sendAction();
            Event.stop(event);
        }
    },
    
    /** Handler for keypress events.
     */
    onkeypress: function(event)
    {
        if (!this.formatter)
            return;
        
        // In Mozilla, arrow keys and backspace trigger a keypress event with charCode = 0
        if (!event.charCode || event.altKey || event.metaKey || event.ctrlKey)
            return;

        var c= String.fromCharCode(event.charCode || event.keyCode);
        if (!this.formatter.isValidInputCharacter(c))
            Event.stop(event);
    },
    
    /** Callback for tracking changes to the value binding. This method will
     *  disable the control if the value is undefined (meaning one of the
     *  objects along the key path doesn't exist). Additionally, the control
     *  will be set to readonly if the value binding isn't mutable or if the new
     *  value is one of the marker values (MultipleValuesMarker or
     *  NoSelectionMarker).
     *
     *  @param change   a ChangeNotification with the new value for the field
     */
    observeValueChange: function(change)
    {
        var view= this.node;
        var newValue= change.newValue;

        //  determine whether this value is a marker
        var markerType= this.bindings.value && this.bindings.value.markerType;
        
        if (!markerType && this.formatter)
            newValue= this.formatter.stringForValue(newValue);

        if (coherent.NoSelectionMarkerType===markerType)
            view.disabled= true;
        else if (!this.bindings.enabled)
            view.disabled= false;
    
        if (!this.bindings.editable)
            view.readOnly= !this.bindings.value.mutable();

        if (view.readOnly)
            Element.addClassName(view, coherent.Style.kReadOnlyClass);
        else
            Element.removeClassName(view, coherent.Style.kReadOnlyClass);

        if (view.disabled)
            Element.addClassName(view, coherent.Style.kDisabledClass);
        else
            Element.removeClassName(view, coherent.Style.kDisabledClass);
        
        if (!this.bindings.errorMessage)
            this.clearAllErrors();

        //  don't change the value if the field has the focus
        if (this.hasFocus)
            return;
        
        if (markerType)
        {
            this.placeholder= newValue;
            view.value= "";
            this.showPlaceholder();
        }
        else
        {
            view.value= newValue;
            this.hidePlaceholder();
        }
    },
    
    observeErrorMessageChange: function(change)
    {
        var newValue= change.newValue;
        if (!newValue)
        {
            this.clearAllErrors();
            return;
        }
    
        var error= new coherent.Error({
                            description: change.newValue
                        });
        this.presentError(error);
    }
    
});
