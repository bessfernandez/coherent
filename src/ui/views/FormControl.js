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
        return this.node.value;
    },
    
    setValue: function(newValue)
    {
        this.node.value= newValue;
    },
    
    /** Callback for tracking changes to the value binding. This updates the
        value that the form control will send to the server.
        
        @param change   a ChangeNotification with the new value for the field
      */
    observeValueChange: function(change)
    {
        var node= this.node;

        //  determine whether this value is a marker
        var markerType= this.bindings.value && this.bindings.value.markerType;
        
        if (coherent.NoSelectionMarkerType===markerType)
            node.disabled= true;
        else if (!this.bindings.enabled)
            node.disabled= false;
    
        if (!this.bindings.editable)
            node.readOnly= !this.bindings.value.mutable();

        if (node.readOnly)
            Element.addClassName(node, coherent.Style.kReadOnlyClass);
        else
            Element.removeClassName(node, coherent.Style.kReadOnlyClass);

        if (node.disabled)
            Element.addClassName(node, coherent.Style.kDisabledClass);
        else
            Element.removeClassName(node, coherent.Style.kDisabledClass);
            
        this.setValue(change.newValue);
    },
    
    name: function()
    {
        return this.node.name;
    },
    
    setName: function(newName)
    {
        this.node.name= newName;
    },
    
    validate: function()
    {
        return this.node.value;
    }
    
});
