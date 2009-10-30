/*jsl:import Overlay.js*/

coherent.Bubble= Class.create(coherent.Overlay, {

    relativePosition: 'above',

    arrowSelector: '.arrow',
    
    constrainToView: function(constraint)
    {
        this.__within= (constraint.viewElement?constraint.viewElement():constraint);
        if (this.visible())
            this.updatePosition();
    },
    
    attachToView: function(anchor)
    {
        this.__anchor= (anchor.viewElement?anchor.viewElement():anchor);
        if (this.visible())
            this.updatePosition();
    },
    
    updatePosition: function()
    {
        var view= this.viewElement();
        var arrow= Element.query(view, this.arrowSelector);
        if (!arrow)
            throw new Error('No arrow element in Bubble: selector="' + this.arrowSelector + '"');
            
        var targetRect= Element.getRect(this.__anchor);
        var viewport= Element.getViewport();
        var withinRect;
        var _opacity= view.style.opacity;
        var _display= view.style.display;
        
        Element.setStyle(view, 'opacity', 0);
        view.style.display='';
        
        if (this.__within)
            withinRect= Element.getRect(this.__within);
        else
        {
            var dimensions= Element.getDimensions(view);
            var x= parseInt(targetRect.left,10) + Math.floor(targetRect.width/2);
            var halfW= Math.floor(dimensions.width/2);
            
            withinRect= {   left: x-halfW,
                            right: x+halfW,
                            width: dimensions.width
                        };
        }
    
        view.style.left= withinRect.left + 'px';
        view.style.width= withinRect.width + 'px';

        Element.removeClassName(view, 'below');
        var arrowHeight= arrow.offsetHeight;
        var topOffset= arrowHeight + parseInt(Element.getStyle(arrow, 'marginBottom')||0,10);
        
        var top= parseInt(targetRect.top,10) - view.offsetHeight - topOffset;
    
        if (top < viewport.top || 'below'==this.relativePosition)
        {
            Element.addClassName(view, 'below');
            topOffset= arrowHeight + parseInt(Element.getStyle(arrow, 'marginTop')||0,10);
            top= parseInt(targetRect.bottom,10) + topOffset;
        }
        
        view.style.top= top + 'px';
        
        arrow.style.left= (targetRect.left - withinRect.left + targetRect.width/2) + 'px';
        
        view.style.opacity= _opacity;
        view.style.display= _display;
    }
    
});