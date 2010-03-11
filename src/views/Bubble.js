/*jsl:import Overlay.js*/

/** An overlay view that is associated with another view. The Bubble will
    position itself either above or below the target view.
    
    The default mark up for a Bubble is:

        <div class="bubble">
            <span class="chrome tl"></span>
            <span class="chrome tr"></span>
            <span class="chrome top"></span>
            <span class="chrome left"></span>
            <span class="chrome right"></span>
            <span class="chrome bottom"></span>
            <span class="chrome bl"></span>
            <span class="chrome br"></span>
            <span class="chrome center"></span>
            <div class="container">
                <div class="content"></div>
            </div>
            <span class="chrome arrow"></span>
        </div>

    In the absense of multiple CSS background images or the border image property,
    this should yield enough markup to style the bubble in an attractive manner.
    Special attention needs to be paid to the arrow element. It should obey some
    simple rules:
    
    * The content of the arrow should be centered over its left coordinate using
      a negative left-margin.
    
    * The content of the arrow should extend below the content of the bubble to
      make calculating the size of the bubble easier. When the bubble has the
      `below` class name, the arrow should extend above the content of the
      bubble.

    An example of the CSS rules for a bubble follow:
    
        .bubble .arrow
        {
            position: absolute;
            background-image: url(images/bubble-arrow-bottom.png);
            background-repeat: no-repeat;
            width: 18px;
            height: 16px;
            margin-left: -9px;
            bottom: -14px;
        }

        .bubble.below .arrow
        {
            background-image: url(images/bubble-arrow-top.png);
            top: -14px;
            bottom: auto;
        }

    ## Notes for Subclassing ##
    
    In many cases, subclasses will need to update the mark up used to display
    the bubble. Therefore, subclasses should override the
    {@link #contentSelector} field to specify the correct selector if the new
    mark up does not match the default mark up provided.
    
 */
coherent.Bubble= Class.create(coherent.Overlay, {

    /** The CSS selector used to determine which DOM node represents the content
        region of the bubble. This is important because to mark up a bubble it
        may be necessary to use a number of extra elements. So the content might
        not be directly below the bubble's DOM node.
     */
    contentSelector: '.content',
    
    markup: '<div class="bubble"></div>',
    
    innerHTML: '<span class="chrome tl"></span><span class="chrome tr"></span><span class="chrome top"></span><span class="chrome left"></span><span class="chrome right"></span><span class="chrome bottom"></span><span class="chrome bl"></span><span class="chrome br"></span><span class="chrome center"></span><div class="container"><div class="content"></div></div><span class="chrome arrow"></span>',

    /** The visual position for the Bubble relative to the anchor view. This
        relative position is used as a classname added to the Bubble's DOM node
        to trigger alternate CSS rules. The valid values for this field are:
        `above` and `below`.
        @type String
     */
    relativePosition: 'above',

    /** The CSS selector used to locate the arrow DOM node within the Bubble. If
        the bubble can't locate the arrow, {@link #updatePosition} will throw an
        error.
        @type String
     */
    arrowSelector: '.arrow',

    /** In order to know how wide to make a bubble, it's useful to constrain it
        within the bounds of another node.
        @param {coherent.View} constraint - The node or view to which the bounds
            of the bubble should be constrained.
     */
    constrainToView: function(constraint)
    {
        this.within= (constraint.node?constraint.node:constraint);
        if (this.visible())
            this.updatePosition();
    },
    
    /** A Bubble is always attached to a view. The arrow node will be centered
        horizontally above or below the anchor view.
        @param {coherent.View} anchor - The anchor view
     */
    attachToView: function(anchor)
    {
        this.anchor= (anchor.node?anchor.node:anchor);
        if (this.visible())
            this.updatePosition();
    },
    
    /** Initialise the Bubble instance. This sets the {@link #container} to the
        DOM node that matches the {@link #contentSelector}.
     */
    init: function()
    {
        this.base();
        this.setContainer(Element.query(this.node, this.contentSelector));
    },
    
    /** Update the position of the Bubble relative to the anchor view and within
        the constraint view (if specified). If there is no constraint specified,
        the bubble will use its natural dimensions as specified by CSS.
     */
    updatePosition: function()
    {
        var node= this.node;
        var arrow= Element.query(node, this.arrowSelector);
        if (!arrow)
            throw new Error('No arrow element in Bubble: selector="' + this.arrowSelector + '"');
            
        var targetRect= Element.getRect(this.anchor);
        var viewport= Element.getViewport();
        var withinRect;
        var _opacity= node.style.opacity;
        var _display= node.style.display;
        
        Element.setStyle(node, 'opacity', 0);
        node.style.display='';
        
        if (this.within)
            withinRect= Element.getRect(this.within);
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