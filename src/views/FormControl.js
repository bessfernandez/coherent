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
        return this.viewElement().value;
    },
    
    setValue: function(newValue)
    {
        this.viewElement().value= newValue;
    },
    
    /** Callback for tracking changes to the value binding. This updates the
        value that the form control will send to the server.
        
        @param change   a ChangeNotification with the new value for the field
      */
    observeValueChange: function(change)
    {
        var view= this.viewElement();

        //  determine whether this value is a marker
        var markerType= this.bindings.value && this.bindings.value.markerType;
        
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
            
        this.setValue(change.newValue);
    },
    
    name: function()
    {
        return this.viewElement().name;
    },
    
    setName: function(newName)
    {
        this.viewElement().name= newName;
    },
    
    validate: function()
    {
        return this.viewElement().value;
    }
    
});
