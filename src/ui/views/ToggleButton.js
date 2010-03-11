/*jsl:import FormControl.js*/

/** Specialisation of View that handles radio buttons and checkboxes.
 */
coherent.ToggleButton= Class.create(coherent.FormControl, {

    exposedBindings: ['checked', 'selection'],
    
    onclick: function(event)
    {
        var view= this.node;
        var checked= view.checked;
        var value= view.value;

        if (this.bindings.selection)
            this.bindings.selection.setValue(value);
        if (this.bindings.checked)
            this.bindings.checked.setValue(checked);
            
        this.sendAction();
    },

    /** Callback for tracking changes to the value binding. This updates the
        value that the checkbox or radio button will send to the server.
        
        @param change   a ChangeNotification with the new value for the field
      */
    observeValueChange: function(change)
    {
        this.base(change);

        var view= this.node;
        var newValue= change.newValue;

        view.value= newValue;
        
        if (!this.bindings.selection)
            return;

        view.checked= (this.bindings.selection.value()==newValue);
        
        if (this.bindings.checked)
            this.bindings.checked.setValue(view.checked);
    },
    
    observeCheckedChange: function(change, keyPath, context)
    {
        var view= this.node;

        var newValue= !!change.newValue;
        view.checked= newValue;
        if (this.bindings.selection)
            this.bindings.selection.setValue(view.value);
    },
    
    observeSelectionChange: function(change, keyPath, context)
    {
        var view= this.node;
        
        var checked= (change.newValue==view.value);
        view.checked= checked;
        
        if (this.bindings.checked)
            this.bindings.checked.setValue(checked);
    }
    
});
