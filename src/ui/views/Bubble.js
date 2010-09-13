/*jsl:import Overlay.js*/

/** An overlay view that is associated with another view. The Bubble will
    position itself either above or below the target view.
  
    The default mark up for a Bubble is:

        <div class="ui-bubble">
          <span class="ui-bubble-chrome ui-bubble-tl"></span>
          <span class="ui-bubble-chrome ui-bubble-tr"></span>
          <span class="ui-bubble-chrome ui-bubble-top"></span>
          <span class="ui-bubble-chrome ui-bubble-left"></span>
          <span class="ui-bubble-chrome ui-bubble-right"></span>
          <span class="ui-bubble-chrome ui-bubble-bottom"></span>
          <span class="ui-bubble-chrome ui-bubble-bl"></span>
          <span class="ui-bubble-chrome ui-bubble-br"></span>
          <span class="ui-bubble-chrome ui-bubble-center"></span>
          <div class="ui-bubble-container">
            <div class="ui-bubble-content"></div>
          </div>
          <span class="ui-bubble-chrome ui-bubble-arrow"></span>
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
  
        .ui-bubble .ui-bubble-arrow
        {
          position: absolute;
          background-image: url(images/bubble-arrow-bottom.png);
          background-repeat: no-repeat;
          width: 18px;
          height: 16px;
          margin-left: -9px;
          bottom: -14px;
        }

        .ui-bubble.ui-overlay-below .ui-bubble-arrow
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
  contentSelector: '.ui-bubble-content',
  
  markup: '<div class="ui-bubble"></div>',
  
  innerHTML: '<span class="ui-bubble-chrome ui-bubble-tl"></span><span class="ui-bubble-chrome ui-bubble-tr"></span><span class="ui-bubble-chrome ui-bubble-top"></span><span class="ui-bubble-chrome ui-bubble-left"></span><span class="ui-bubble-chrome ui-bubble-right"></span><span class="ui-bubble-chrome ui-bubble-bottom"></span><span class="ui-bubble-chrome ui-bubble-bl"></span><span class="ui-bubble-chrome ui-bubble-br"></span><span class="ui-bubble-chrome ui-bubble-center"></span><div class="ui-bubble-container"><div class="ui-bubble-content"></div></div><span class="ui-bubble-chrome ui-bubble-arrow"></span>',

  /** The visual position for the Bubble relative to the anchor view. This
      relative position is used as a classname added to the Bubble's DOM node
      to trigger alternate CSS rules. The valid values for this field are:
      `above` and `below`.
      @type coherent.Overlay.Position
      @default coherent.Overlay.Position.ABOVE
   */
  relativePosition: coherent.Overlay.Position.ABOVE,

  /** The CSS selector used to locate the arrow DOM node within the Bubble.
      @type String
      @default '.ui-bubble-arrow'
   */
  arrowSelector: '.ui-bubble-arrow',

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
    // if (!arrow)
    //     throw new Error('No arrow element in Bubble: selector="' + this.arrowSelector + '"');
      
    var targetRect= Element.getRect(this.anchor);
    var viewport= Element.getViewport();
    var withinRect;
    var _visibility= node.style.visibility;
    var _display= node.style.display;

    node.style.visibility='hidden';
    node.style.display='';
    
    if (this.within)
      withinRect= Element.getRect(this.within);
    else
    {
      var dimensions= Element.getDimensions(node);
      var x= parseInt(targetRect.left,10) + Math.floor(targetRect.width/2);
      var halfW= Math.floor(dimensions.width/2);
      
      withinRect= { left: Math.max(0, x-halfW),
                    right: Math.max(0, x-halfW) + dimensions.width,
                    width: dimensions.width
                  };
    }
  
    node.style.left= withinRect.left + 'px';
    node.style.width= withinRect.width + 'px';
    //  quick adjust width to account for border and padding
    node.style.width= (withinRect.width - (node.offsetWidth-withinRect.width)) + 'px';
    
    Element.removeClassName(node, 'below');
    
    var arrowHeight;
    var marginNode;
    
    if (arrow)
    {
      arrowHeight= arrow.offsetHeight;
      marginNode= arrow;
    }
    else
    {
      arrowHeight= 0;
      marginNode= node;
    }
    
    var topOffset= arrowHeight + parseInt(Element.getStyle(marginNode, 'marginBottom')||0,10);
    var top= targetRect.top - node.offsetHeight - topOffset;
  
    if (top < viewport.top || 'below'===this.relativePosition)
    {
      Element.addClassName(node, 'below');
      topOffset= arrowHeight + parseInt(Element.getStyle(marginNode, 'marginTop')||0,10);
      top= targetRect.bottom + topOffset;
    }
    
    node.style.top= top + 'px';
    
    if (arrow)
      arrow.style.left= (targetRect.left - withinRect.left + targetRect.width/2) + 'px';
    
    node.style.visibility= _visibility;
    node.style.display= _display;
  },

  /** Handle mouseup events. If the mouseup occurs in the anchor for the bubble,
      don't dismiss the bubble. Otherwise, defer to {@link coherent.Overlay#onmouseup}.
      @param Event event
   */
  onmouseup: function(event)
  {
    var target= event.target||event.srcElement;
    if (this.anchor.contains(target))
      return;
      
    this.base(event);
  }
  
});

