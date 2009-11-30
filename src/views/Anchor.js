/*jsl:import View.js*/

/** A view providing support for anchor elements.

    @binding {String} href - The URL to which the browser should navigate when
        the visitor clicks on this anchor.
        
    @binding {String} title - The text displayed in a tool-tip when the visitor
        points at this anchor.
        
*/

coherent.Anchor= Class.create(coherent.View, {

    exposedBindings: ['href', 'title'],
    
    /** Retrieve the value of the href attribute on the anchor.
        @type String
     */
    href: function()
    {
        var node= this.node;
        return node.getAttribute('href');
    },
    
    /** Set the href attribute on the anchor to a new value. This doesn't update
        the href binding.
        @param {String} newHref - The new URL value to set the href attribute to.
     */
    setHref: function(newHref)
    {
        var node= this.node;
        node.href= newHref;
    },
    
    /** Retrieve the value of the title attribute on the anchor. Most browsers
        use the title to display a tooltip when the visitor hovers over the
        anchor.
        @type String
     */
    title: function()
    {
        var node= this.node;
        return node.getAttribute('title');
    },
    
    /** Set the title attribute on the anchor.
        @param {String} newTitle - The new value of the title attribute for the
            anchor. This is usually used by browsers to display a tooltip.
     */
    setTitle: function(newTitle)
    {
        var node= this.node;
        node.title= newTitle;
    },
    
    /** Handle button clicks on the anchor. If the Href attribute specifies an
        empty hash (#), this method cancels the navigation before passing the
        event to the base implementation in {@link coherent.View#onclick}.
     */
    onclick: function(event)
    {
        var href= this.href();
        if ('#'===href)
            Event.preventDefault(event);
        this.base(event);
    }
    
});
