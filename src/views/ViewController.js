/*jsl:import Responder.js*/
/*jsl:import ../nib/NIB.js*/

/** The ViewController. More documentation coming.
    @property {String} title
        The title for the view. This might be used to provide externally 
        customisable titles for a view loaded from a NIB.
    @property {String} nibUrl
        The URL of the NIB to load for this ViewController. This can be set via
        the standard parameters when instantiating the ViewController:
        
            var controller= new coherent.ViewController({
                                        title: 'Sample',
                                        nibUrl: 'nibs/sample.nib'
                                    });
        
        Or this property may be set explicitly.
*/
coherent.ViewController= Class.create(coherent.Responder, {

    /** Retrieve the view associated with this ViewController.
        @type coherent.View
     */
    view: function()
    {
        return this.__view;
    },
    
    /** Set the view associated with this ViewController. The ViewController
        will insert itself as the next responder for the view.
        
        @param {coherent.View} view - a reference to the view
     */
    setView: function(view)
    {
        if (this.__view)
            this.__view.setNextResponder(null);
        this.__view= view;
        view.setNextResponder(this);
    },

    /** Load the NIB from the associated bundle... the view property will be
        connected by the standard NIB loading mechanism.
        
        @type coherent.Deferred
     */
    loadView: function()
    {
        var url= this.valueForKey('nibUrl');
        if (!url)
            throw new Error('No URL specified for ViewController NIB.');
        return NIB.load(url, this);
    },
    
    /** If the next responder has been set explicitly via a call to
        {@link #setNextResponder}, return that value. Otherwise, return the
        superview of the view associated with this ViewController.
        @type coherent.Responder
     */
    nextResponder: function()
    {
        return this.__nextResponder||this.__view.superview();
    }
        
});
