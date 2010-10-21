/*jsl:import ../ui.js*/

coherent.PopupButton= Class.create(coherent.View, {

  willHideOverlay: function(overlay)
  {
    this.setActive(false);
  },
  
  onclick: function(event)
  {
    var node= this.node;
    if ('A'===node.tagName)
      Event.preventDefault(event);

    if (this!=this.popupView.delegate())
    {
      this.popupView.setDelegate(this);
      this.popupView.attachToView(this);
    }
    if (this.active())
    {
      this.popupView.setVisible(false);
      this.setActive(false);
    }
    else
    {
      this.popupView.setVisible(true);
      this.setActive(true);
    }
  }
  
});
