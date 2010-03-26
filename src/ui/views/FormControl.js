/*jsl:import View.js*/

/** A base class for all form controls.

    @binding {String} name - The name of the form control. This is used when
             submitting the form.
    @binding {String} value - The value of the form control. This value will be
             submitted when the form is submitted.
             
 */
coherent.FormControl= Class.create(coherent.View, {

    exposedBindings: ['value', 'name'],
    maskedBindings: ['text', 'html'],

    value: function()
    {
        if (this.formatter)
            return this.formatter.valueForString(this.node.value);
            
        return this.node.value;
    },
    
    setValue: function(newValue)
    {
        var markerType= this.bindings.value && this.bindings.value.markerType;

        if (!markerType && this.formatter)
            newValue= this.formatter.stringForValue(newValue);
            
        this.node.value= newValue;
    },
    
    /** Callback for tracking changes to the value binding. This method will
        disable the control if the value is undefined (meaning one of the
        objects along the key path doesn't exist). Additionally, the control
        will be set to readonly if the value binding isn't mutable or if the new
        value is one of the marker values (MultipleValuesMarker or
        NoSelectionMarker).
      
        @param {coherent.ChangeNotification} change - an object with the newValue
            and oldValue for the binding.
      */
    observeValueChange: function(change)
    {
        var newValue= change.newValue;

        if (coherent.ChangeType.validationError===change.changeType)
        {
            this.presentError(newValue);
            return;
        }
        
        //  determine whether this value is a marker
        var markerType= this.bindings.value && this.bindings.value.markerType;

        if (!markerType && this.formatter)
            newValue= this.formatter.stringForValue(newValue);
        
        if (coherent.NoSelectionMarkerType===markerType)
            this.setEnabled(false);
        else if (!this.bindings.enabled)
            this.setEnabled(true);
    
        if (!this.bindings.editable)
            this.setEditable(this.bindings.value.mutable());

        if (!this.bindings.errorMessage)
            this.clearAllErrors();

        //  don't change the value if the field has the focus
        if (this.hasFocus)
            return;

        this.setValue(newValue);
    },
    
    name: function()
    {
        return this.node.name;
    },
    
    setName: function(newName)
    {
        this.node.name= newName;
    },
    
    /** Check the value of the FormControl to see if it is valid. If the value
        is not valid, this will present the error and return it. Otherwise, the
        method will return the valid value.
        @type {coherent.Error|Any}
     */
    validate: function()
    {
        var value= this.node.value;
        
        /*  TODO: the placeholder bit is from the TextField... */
        if (this.__showingPlaceholder)
            value= "";
            
        if (this.formatter)
        {
            var err= this.formatter.isStringValid(value);
            if (err instanceof coherent.Error)
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
    }
    
});
