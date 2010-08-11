/*jsl:import Bubble.js*/

coherent.AnchoredBubble= Class.create(coherent.Bubble, {

  updatePosition: function()
  {
    var node= this.node;
    var arrow= Element.query(node, this.arrowSelector);
    if (!arrow)
    {
      this.base();
      return;
    }
    
    var viewport= Element.getViewport();
    var _visibility= node.style.visibility;
    var _display= node.style.display;

    node.style.visibility='hidden';
    node.style.display='';

    var nodeRect= Element.getRect(this.node);
    var targetRect= Element.getRect(this.anchor);
    var arrowRect= Element.getRect(arrow);
    
    node.style.left= (targetRect.left + nodeRect.left - arrowRect.left) + 'px';
    node.style.top= (targetRect.top + nodeRect.top - arrowRect.top) + 'px';
    
    node.style.visibility= _visibility;
    node.style.display= _display;
  }
  
});