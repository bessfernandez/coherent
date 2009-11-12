/*jsl:import Overlay.js*/

coherent.Bubble= Class.create(coherent.Overlay, {

    relativePosition: 'above',

    arrowSelector: '.arrow',
    
    constrainToView: function(constraint)
    {
        this.__within= (constraint.node?constraint.node:constraint);
        if (this.visible())
            this.updatePosition();
    },
    
    attachToView: function(anchor)
    {
        this.__anchor= (anchor.node?anchor.node:anchor);
        if (this.visible())
            this.updatePosition();
    },
    
    updatePosition: function()
    {
        var node= this.node;
        var arrow= Element.query(node, this.arrowSelector);
        if (!arrow)
            throw new Error('No arrow element in Bubble: selector="' + this.arrowSelector + '"');
            
        var targetRect= Element.getRect(this.__anchor);
        var viewport= Element.getViewport();
        var withinRect;
        var _opacity= node.style.opacity;
        var _display= node.style.display;
        
        Element.setStyle(node, 'opacity', 0);
        node.style.display='';
        
        if (this.__within)
            withinRect= Element.getRect(this.__within);
        else
        {
            var dimensions= Element.getDimensions(node);
            var x= parseInt(targetRect.left,10) + Math.floor(targetRect.width/2);
            var halfW= Math.floor(dimensions.width/2);
            
            withinRect= {   left: x-halfW,
                            right: x+halfW,
                            width: dimensions.width
                        };
        }
    
        node.style.left= withinRect.left + 'px';
        node.style.width= withinRect.width + 'px';

        Element.removeClassName(node, 'below');
        var arrowHeight= arrow.offsetHeight;
        var topOffset= arrowHeight + parseInt(Element.getStyle(arrow, 'marginBottom')||0,10);
        
        var top= parseInt(targetRect.top,10) - node.offsetHeight - topOffset;
    
        if (top < viewport.top || 'below'==this.relativePosition)
        {
            Element.addClassName(node, 'below');
            topOffset= arrowHeight + parseInt(Element.getStyle(arrow, 'marginTop')||0,10);
            top= parseInt(targetRect.bottom,10) + topOffset;
        }
        
        node.style.top= top + 'px';
        
        arrow.style.left= (targetRect.left - withinRect.left + targetRect.width/2) + 'px';
        
        node.style.opacity= _opacity;
        node.style.display= _display;
    }
    
});