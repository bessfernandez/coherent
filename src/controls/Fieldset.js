/*jsl:import ../views/FieldGroup.js*/

/** A specialisation of {@link coherent.FieldGroup} that implements an improved method
    of presenting errors. Errors are collected and displayed in a coherent.Bubble
    when a field receives the focus. Before submitting data from a form, it would
    be a good idea to call {@link coherent.FieldGroup#validate} to check whether all
    fields have valid values.
 */
coherent.Fieldset= Class.create(coherent.FieldGroup, {
    
    constructor: function(view, parameters)
    {
        this.base(view, parameters);
        this.__currentViewId= false;
        this.__fieldErrors= {};
    },
    
    init: function()
    {
        coherent.page.addObserverForKeyPath(this, 'observeFirstResponderChange',
                                            'firstResponder');
    },
    
    teardown: function()
    {
        coherent.page.removeObserverForKeyPath(this, 'firstResponder');
    },
    
    presentError: function(error)
    {
        var field= error.field;
        if (!field)
            return;
        
        this.__fieldErrors[field.id]= error;
    },
    
    clearAllErrors: function(field)
    {
        delete this.__fieldErrors[field.id];
        if (this.__currentViewId==field.id)
        {
            this.__currentViewId= false;
            // @TODO: Hide the bubble here...
            // coherent.Bubble.hide({
            //             target: document.getElementById(field.id)
            //         });
        }
    },
    
    observeFirstResponderChange: function(change)
    {
        var newFirstResponder= change.newValue;
        var error= !!newFirstResponder && this.__fieldErrors[newFirstResponder.id];
            
        if (!error || !newFirstResponder.isDescendantOf(this))
        {
            if (this.__currentViewId)
                coherent.Bubble.hide({
                            target: document.getElementById(this.__currentViewId)
                        });
            this.__currentViewId= false;
            return;
        }
        
        this.__currentViewId= newFirstResponder.id;
        
        // @TODO: Need to display the error here...
        
        // coherent.Bubble.display({
        //             classname: this.bubbleClass,
        //             error: error,
        //             position: this.bubblePosition,
        //             target: newFirstResponder.viewElement(),
        //             within: this.viewElement()
        //         });
    }
});
