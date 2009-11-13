/*jsl:import ../views/FieldGroup.js*/
/*jsl:import ../views/ErrorBubble.js*/

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
        if (!this.__bubble)
            coherent.Fieldset.prototype.__bubble= new coherent.ErrorBubble();
        coherent.page.addObserverForKeyPath(this, 'observeFirstResponderChange',
                                            'firstResponder');
    },
    
    teardown: function()
    {
        coherent.page.removeObserverForKeyPath(this, 'firstResponder');
        this.base();
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
            this.__bubble.setVisible(false);
        }
    },
    
    observeFirstResponderChange: function(change)
    {
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

        this.__currentViewId= newFirstResponder.id;

        this.__bubble.constrainToView(this);
        this.__bubble.attachToView(newFirstResponder);
        this.__bubble.setError(error);
        this.__bubble.setVisible(true);
    }
});
