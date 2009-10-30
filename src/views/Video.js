/*jsl:import Media.js*/

coherent.Video= Class.create(coherent.Media, {

    exposedBindings: ['poster', 'height', 'width' ],

    poster: function()
    {
        var view= this.viewElement();
        return view.poster;
    },
    
    setPoster: function(newPoster)
    {
        if (this.bindings.poster)
            this.bindings.poster.setValue(newPoster);

        var view= this.viewElement();

        view.poster = newPoster;
    },
        
    width: function()
    {
        return parseInt(this.viewElement().width,10);
    },

    setWidth: function(newWidth)
    {
        var view= this.viewElement();
        var width= parseInt(newWidth,10);

        if (isNaN(width))
            view.removeAttribute('width');
        else
            view.width= width;
    },

    height: function()
    {
        return parseInt(this.viewElement().height,10);
    },

    setHeight: function(newHeight)
    {
        var view= this.viewElement();
        var height= parseInt(newHeight,10);

        if (isNaN(height))
            view.removeAttribute('height');
        else
            view.height= height;
    }
    
});
