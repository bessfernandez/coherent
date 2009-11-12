/*jsl:import View.js*/

/** A view providing support for anchor elements.

    @binding {String} href - The URL to which the browser should navigate when
        the visitor clicks on this anchor.
        
    @binding {String} title - The text displayed in a tool-tip when the visitor
        points at this anchor.
        
*/

coherent.Anchor= Class.create(coherent.View, {

    exposedBindings: ['href', 'title'],
    
    /** Retrieve the value of the href attribute...
     */
    href: function()
    {
        var node= this.node;
        return node.getAttribute('href');
    },
    
    setHref: function(newHref)
    {
        var node= this.node;
        node.href= newHref;
    },
    
    title: function()
    {
        var node= this.node;
        return node.getAttribute('title');
    },
    
    setTitle: function(newTitle)
    {
        var node= this.node;
        node.title= newTitle;
    },
    
    onclick: function(event)
    {
        var href= this.href();
        if ('#'===href)
            Event.preventDefault(event);
        this.base(event);
    }
    
});
