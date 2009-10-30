/*jsl:import ImageView.js*/


/** A View for laying out images.  This is a subclass of coherent.ImageView 
 *  which proxies an image wrapped in a div to a real image view"
 *  
 *  @declare coherent.ImageLayout
 *  @extends coherent.ImageView
 **/

coherent.ImageLayout= Class.create(coherent.ImageView,{
    constructor: function(view, parameters) 
    {        
        var mediaElement = view.getElementsByTagName("img")[0];
                             
        if (!mediaElement) {
            mediaElement = document.createElement('img');
            view.appendChild(mediaElement);
        }

        this.setContainer(view);
        this._mediaElement = mediaElement;
        
        this.base(view, parameters);
    },
    
    viewElement: function(){
        return this._mediaElement;
    },
    
    superview: function(){
        var sv = null;
        var originalViewElement = this.viewElement;
        
        this.viewElement = function(){
            return this.container();
        }
        
        sv = this.base();
        
        this.viewElement = originalViewElement;
        
        return sv;
    }
});