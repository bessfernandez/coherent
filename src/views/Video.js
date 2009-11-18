/*jsl:import Media.js*/

/** HTML5 video element */
coherent.Video= Class.create(coherent.Media, {

    exposedBindings: ['poster', 'height', 'width' ],

    poster: function()
    {
        return this.node.poster;
    },
    
    setPoster: function(newPoster)
    {
        if (this.bindings.poster)
            this.bindings.poster.setValue(newPoster);

        this.node.poster = newPoster;
    },
        
    width: function()
    {
        return parseInt(this.node.width,10);
    },

    setWidth: function(newWidth)
    {
        var node= this.node;
        var width= parseInt(newWidth,10);

        if (isNaN(width))
            node.removeAttribute('width');
        else
            node.width= width;
    },

    height: function()
    {
        return parseInt(this.node.height,10);
    },

    setHeight: function(newHeight)
    {
        var node= this.node;
        var height= parseInt(newHeight,10);

        if (isNaN(height))
            node.removeAttribute('height');
        else
            node.height= height;
    }
    
});
