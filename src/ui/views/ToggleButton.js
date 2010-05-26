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

    checked: function()
    {
        return this.node.checked;
    },
    
    setChecked: function(checked)
    {
        this.node.checked= !!checked;
    },
    
    setValue: function(newValue)
    {
        this.base(newValue);
        if (this.bindings.selection)
            this.node.checked= (this.bindings.selection.value()==newValue);
    },
    
    observeSelectionChange: function(change, keyPath, context)
    {
        this.node.checked= (change.newValue==this.node.value);
    }
    
});
