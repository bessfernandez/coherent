/*jsl:import View.js*/


/** A View for images. In addition to the bindings exposed by Views,
 *  coherent.ImageViews have a src binding that represents the URL of the
 *  image to display. ImageViews also have a width and height binding to
 *  reflect those properties as well.
 *  
 *  Like TextFields, coherent.ImageViews have placeholder values for invalid
 *  values. These placeholders should be URLs to the appropriate image to
 *  display under those circumstances. The default values are empty, so no image
 *  will be displayed.
 *  
 *  @declare coherent.ImageView
 *  @extends coherent.View
 */
coherent.ImageView= Class.create(coherent.View, {
    
    exposedBindings: ['src', 'alt', 'width', 'height'],
    maskedBindings: ['text','html'],
    
    init: function()
    {
        this.base();
        
        var view= this.viewElement();
        
        // Set the original src, if any to be the default 
        // placeholder for null and no selection values 
        if (!this.defaultPlaceholders.src && view.src)
        { 
            var srcPH = this.defaultPlaceholders.src= {}; 
            srcPH.nullValue = srcPH.noSelection = view.src; 
        }
    },

    onload: function()
    {
        var view= this.viewElement();
        this.setValueForKey(false, 'loading');
        Element.removeClassName(view, coherent.Style.kLoadingClass);

        Event.stopObserving(view, 'load', this.__onloadHandler);
        Event.stopObserving(view, 'error', this.__onerrorHandler);
    },
    
    onerror: function()
    {
        var view= this.viewElement();
        this.setValueForKey(false, 'loading');
        
        Element.updateClass(view, coherent.Style.kInvalidValueClass,
                            coherent.Style.kLoadingClass);

        Event.stopObserving(view, 'load', this.__onloadHandler);
        Event.stopObserving(view, 'error', this.__onerrorHandler);
    },
    
    src: function()
    {
        var src= this.viewElement().src;
        return ('about:blank'===src)?null:src;
    },
    
    setSrc: function(newSrc)
    {
        if (this.bindings.src)
            this.bindings.src.setValue(newSrc);
            
        this.setValueForKey(true, 'loading');
        
        var view= this.viewElement();
        Element.updateClass(view, coherent.Style.kLoadingClass,
                            coherent.Style.kInvalidValueClass);

        if (!newSrc)
            newSrc= 'about:blank';

        Event.stopObserving(view, 'load', this.__onloadHandler);
        Event.stopObserving(view, 'error', this.__onerrorHandler);
        this.__onloadHandler= Event.observe(view, 'load', this.onload.bind(this));
        this.__onerrorHandler= Event.observe(view, 'error', this.onerror.bind(this));

        var originalSrc= view.src;
        view.src= newSrc;
        
        //  Safari 3 & 4 don't fire the onload event if the new src is the same
        //  as the previous src. See <rdar://problem/6660795>.
        if (coherent.Browser.Safari && view.src===originalSrc)
            this.onload();
    },
    
    observeSrcChange: function(change)
    {
        var view= this.viewElement();
        var markerType= this.bindings.src && this.bindings.src.markerType;

        if (markerType)
            Element.addClassName(view, coherent.Style.kMarkerClass);
        else
            Element.removeClassName(view, coherent.Style.kMarkerClass);
        
        this.setSrc(change.newValue);
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
    },
    
    alt: function()
    {
        return this.viewElement().alt;
    },
    
    setAlt: function(newAlt)
    {
        this.viewElement().alt= (newAlt||'');
    }

});
