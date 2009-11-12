/*jsl:import Video.js*/


/** A View for laying out videos.  This is a subclass of coherent.Video 
 *  which proxies an video wrapped in a div to a real video view"
 **/

coherent.VideoLayout= Class.create(coherent.Video,{
    constructor: function(view, parameters) 
    {        
        // Replace the video layout with the actual video
        var mediaElement = view.getElementsByTagName("video")[0];
        
        if (!mediaElement) {
            mediaElement = document.createElement('video');
            view.appendChild(mediaElement);
        }
        
        // Is the video tag natively supported?
        if (mediaElement && ("paused" in mediaElement)) {
            this.setContainer(view);
            this._mediaElement = mediaElement;  
            
            this.base(view, parameters);
        } else {
            return new coherent.VideoLegacy(view, parameters, mediaElement);
        }
        //  need to return null here to make lint happy, can't return this or
        //  it will short-circuit the default constructor logic
        return null;
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