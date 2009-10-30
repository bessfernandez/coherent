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
    
    init: function()
    {
        this.base();
        
        var view= this.viewElement();
        Event.observe(view, 'submit', this.onsubmit.bind(this));
    },
    
    onsubmit: function(event)
    {
        if (!this.action || !this.sendActionOn.containsObject('submit'))
            return;
            
        Event.stop(event);
        this.sendAction();
    },
    
    actionUrl: function()
    {
        return this.viewElement().action;
    },
    
    setActionUrl: function(newUrl)
    {
        this.viewElement().action= newUrl;
    },
    
    method: function()
    {
        return this.viewElement().method;
    },
    
    setMethod: function(newMethod)
    {
        this.viewElement().method= newMethod;
    }

});

if (coherent.Browser.IE)
    Class.extend(coherent.Form, {

        onfocus: function(event)
        {
            var view= this.viewElement();
            Event.stopObserving(view, 'submit', this.__submitHandler);
            Event.stopObserving(view, 'reset', this.__resetHandler);
            this.__submitHandler= Event.observe(view, 'submit', this.onsubmit.bind(this));
            this.__resetHandler= Event.observe(view, 'reset', this.onreset.bind(this));
        },
    
        onblur: function(event)
        {
            var view= this.viewElement();
            Event.stopObserving(view, 'submit', this.__submitHandler);
            Event.stopObserving(view, 'reset', this.__resetHandler);
        }
    
    });
