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

    animationOptions: {
        placeholder: {
            classname: coherent.Style.kMarkerClass
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
        matches any of the placeholder values, the field is cleared before
        editing begins. This method will call {@link #beginEditing} to allow
        derived views to perform something clever when editing begins.
     */
    becomeFirstResponder: function()
    {
        var view= this.node;

        if (view.disabled || view.readOnly)
            return false;
    
        //  clear out any marker text
        // this.hidePlaceholder();
        if (this.__showingPlaceholder)
            Function.delay(this.setSelectedRange, 0, this, [0,0]);
            // this.setSelectedRange(0,0);

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
        either an attribute on the node or a property on the view. In addition
        to updating the value of the view, `setMarkerValue` stores the text of
        the marker in the `markerValue` property and adds the marker class to
        the view's node.
        
        @param marker   which marker value to display
     */
    showPlaceholder: function()
    {
        if (!this.placeholder)
            return;

        this.node.value= String(this.placeholder);
        
        this.__showingPlaceholder= true;
        this.animateClassName(this.__animationOptionsForProperty('placeholder'));
    },

    /** Remove a marker value. In addition to clearing the value of the field,
        this method resets the `markerValue` property to `false` and removes the
        marker class from the view's node.
     */
    hidePlaceholder: function()
    {
        if (!this.__showingPlaceholder)
            return;
        
        var view= this.node;

        if (view.value===this.placeholder)
            view.value= "";
        this.__showingPlaceholder= false;
        this.animateClassName(this.__animationOptionsForProperty('placeholder'), true);
    },

    /** Retrieve the value of the field.
     */
    value: function()
    {
        if (this.__showingPlaceholder)
            return "";
            
        if (this.formatter)
            return this.formatter.valueForString(this.node.value);
            
        return this.node.value;
    },
    
    /** Set the value of the field.
     */
    setValue: function(newValue)
    {
        var markerType= this.bindings.value && this.bindings.value.markerType;
        
        if (markerType)
        {
            newValue= String(newValue);
            if (newValue)
                this.placeholder= newValue;
            this.node.value= "";
            this.showPlaceholder();
        }
        else
        {
            if (this.formatter)
                newValue= this.formatter.stringForValue(newValue);
            
            this.node.value= newValue;
            this.hidePlaceholder();
        }
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
    
        if (this.__showingPlaceholder)
            start=end=0;
            
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
        a timer event (or if a timer event is pending), the timer is cleared.
        If the new value isn't one of the marker values, then pass it along to
        the value binding.
     */
    onchange: function(event)
    {
        if (this.updateTimer)
            this.updateTimer.cancel();
        
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
        var keyCode = event.keyCode;

        if (this.accessoryView && Event.KEY_ESCAPE===keyCode)
        {
            this.hideAccessoryView();
            return;
        }
                
        if (Event.isAlphaNumKey(keyCode) || Event.KEY_SPACE===keyCode ||
            Event.KEY_BACKSPACE===keyCode || Event.KEY_DELETE===keyCode)
        {
            var delegate= this.delegate();
            if (delegate && delegate.completionsForFieldWithText)
            {
                var value= this.node.value;
                var completions= delegate.completionsForFieldWithText(this, value);
                if (!completions)
                    this.hideAccessoryView();
                else
                {
                    var first= completions[0];
                    if (Event.KEY_BACKSPACE!==keyCode && Event.KEY_DELETE!==keyCode &&
                        'string'===typeof(first) &&
                        first.toLowerCase().beginsWith(value.toLowerCase()))
                    {
                        this.node.value= first;
                        this.setSelectedRange(value.length, first.length);
                    }
                    this.showAccessoryViewForCompletions(completions);
                }
            }
        }
        
        if (!this.continuallyUpdatesValue)
            return;
            
        var view= this.node;

        if (this.updateTimer)
            this.updateTimer.cancel();
        
        if (view.readOnly || view.disabled)
            return;
        
        this.updateTimer= Function.delay(this.onchange, this.keypressUpdateTimeout, this);    
    },
    
    /** Handler for keydown events. This will invoke the action on Return, if present.
     */
    onkeydown: function(event)
    {
        this.hidePlaceholder();
        
        var keyCode= event.keyCode;
        
        if (this.accessoryView && Event.KEY_TAB===keyCode)
            this.hideAccessoryView();
            
        if (this.action && Event.KEY_ENTER===keyCode)
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
    
    observeErrorMessageChange: function(change)
    {
        if (!change.newValue)
        {
            this.clearAllErrors();
            return;
        }
    
        var error= new coherent.Error({
                            description: change.newValue
                        });
        this.presentError(error);
    },
    
    __completionSelected: function(sender)
    {
        var selection= sender.selectionIndexes();
        var content= sender.content();
        var text= content.objectAtIndex(selection[0]);
        this.setValue(text);
        this.accessoryView.setVisible(false);
        coherent.page.makeFirstResponder(this);
    },
    
    showAccessoryViewForCompletions: function(completions)
    {
        if (!this.accessoryView)
        {
            var view= new coherent.Bubble(null, {
                            relativePosition: 'below',
                            clickOutsideToDismiss: true
                        });
            view.node.tabIndex=-1;
            view.attachToView(this);
            view.constrainToView(this);
            view.setNextResponder(this);
            view.acceptsFirstResponder= function() { console.log('view first?'); return true; }
            view.becomeFirstResponder= function() { console.log('become...'); Function.delay(function(){coherent.page.makeFirstResponder(this.nextResponder()); return true;}, 0, this); }
            var listNode= document.createElement('ul');
            listNode.innerHTML= '<li></li>';
            var list= new coherent.CollectionView(listNode, {
                            action: '__completionSelected',
                            viewTemplate: VIEW({
                                ':root': coherent.View({
                                            textBinding: 'representedObject'
                                        })
                                })
                        });
            list.acceptsFirstResponder= function() { console.log('list first?'); return false; }
            view.addSubview(list);
            view.completionsList= list;
            
            this.accessoryView= view;
        }
        this.accessoryView.completionsList.setContent(completions);
        this.accessoryView.setVisible(true);
    },
    
    hideAccessoryView: function()
    {
        if (this.accessoryView)
            this.accessoryView.setVisible(false);
    }
    
});
