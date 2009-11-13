/*jsl:import Responder.js*/
/*jsl:import ../nib/NIB.js*/

coherent.ViewController= Class.create(coherent.Responder, {

    /** When displaying the name of this view, what value should be used? */
    title: null,
    
    view: function()
    {
        return this.__view;
    },
    
    setView: function(view)
    {
        if (this.__view)
            this.__view.setNextResponder(null);
        this.__view= view;
        view.setNextResponder(this);
    },

    /** Load the NIB from the associated bundle... the view property will be
        connected by the standard NIB loading mechanism.
        
        @returns a deferred object instance
     */
    loadView: function()
    {
        var url= this.valueForKey('nibUrl');
        if (!url)
            throw new Error('No URL specified for ViewController NIB.');
        return NIB.load(url, this);
    },
    
    nextResponder: function()
    {
        return this.__nextResponder||this.__view.superview();
    }
        
});
