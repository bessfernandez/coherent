/*jsl:import FieldGroup.js*/

/** Support for HTML forms.

    @binding {String} actionUrl
        This is the url to which the form data should be submitted.
    
    @binding {String} method
        This is the method (GET or POST) that should be used to submit the form.
        
 */
coherent.Form= Class.create(coherent.FieldGroup, {

    exposedBindings: ['actionUrl', 'method'],
    
    //  Only send the action on submit of the form.
    sendActionOn: ['submit'],
    
    onsubmit: function(event)
    {
        if (!this.action || !this.sendActionOn.containsObject('submit'))
            return;
            
        Event.stop(event);
        this.sendAction();
    },
    
    actionUrl: function()
    {
        return this.node.action;
    },
    
    setActionUrl: function(newUrl)
    {
        this.node.action= newUrl;
    },
    
    method: function()
    {
        return this.node.method;
    },
    
    setMethod: function(newMethod)
    {
        this.node.method= newMethod;
    }

});

if (coherent.Browser.IE)
    Class.extend(coherent.Form, {

        onfocus: function(event)
        {
            var node= this.node;
            Event.stopObserving(node, 'submit', this.__submitHandler);
            Event.stopObserving(node, 'reset', this.__resetHandler);
            this.__submitHandler= Event.observe(node, 'submit', this.onsubmit.bind(this));
            this.__resetHandler= Event.observe(node, 'reset', this.onreset.bind(this));
        },
    
        onblur: function(event)
        {
            var node= this.node;
            Event.stopObserving(node, 'submit', this.__submitHandler);
            Event.stopObserving(node, 'reset', this.__resetHandler);
        }
    
    });
