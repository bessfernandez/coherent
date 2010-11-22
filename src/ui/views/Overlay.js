/*jsl:import View.js*/

/**
    Recommended z-index values:
  
        100 < z < 200 : general overlays
             200      : modal page obscuring layer
        200 < z < 300 : modal overlays
             300      : error page obscuring layer
        300 < z < 400 : error notifications
    
 */
coherent.Overlay= Class.create(coherent.View, {

  /** Should this overlay be displayed modally? Modal overlays obscure the
      page below them and can't be dismissed by clicking outside the overlay.
      @type boolean
      @default false
   */
  modal: false,
  
  /** Should clicks outside the overlay dismiss it? When set to false, the
      overlay must be explicitly dismissed.
      @type boolean
      @default false
   */
  clickOutsideToDismiss: false,

  /** Should clicks inside the overlay dismiss it? 
      @type boolean
      @default false
   */
  clickInsideToDismiss: false,
  
  /** The classname to use when creating the modal backdrop DIV. The backdrop is
      used to obscure the content of the page and can be styled however you wish.
      @type String
      @default "modal-overlay-backdrop"
   */
  backdropClassName: "ui-modal-overlay-backdrop",
  /** The classname to use when creating the modal guard DIV. The guard DIV prevents
      clicks from interacting with other modal overlays or the page. This DIV
      will always appear just below the current modal overlay in z-index.
      @type String
      @default "modal-overlay-guard"
   */
  guardClassName: "ui-modal-overlay-guard",
  
  init: function()
  {
    this.node.style.display="none";
  },
  
  showModalBackdrop: function(show)
  {
    var animationOptions= this.__animationOptionsForProperty('visible');
    var backdrop= coherent.Overlay.modalLayer;

    if (!backdrop)
    {
      backdrop= document.createElement('div');
      backdrop.className= this.backdropClassName;
      backdrop.style.display="none";
      Element.addClassName(backdrop, animationOptions.classname);
      document.body.appendChild(backdrop);
      coherent.Overlay.modalLayer= backdrop;
    }
    
    var node= this.node;
    node.parentNode.insertBefore(backdrop, node);
    
    backdrop.style.display="";
    function callback()
    {
      backdrop.style.display= show?"":"none";
    }
    animationOptions.callback= callback;
    animationOptions.reverse= show;
    coherent.Animator.animateClassName(backdrop, animationOptions);
  },

  showGuard: function(show)
  {
    var animationOptions= this.__animationOptionsForProperty('visible');
    var guard= this.guard;
    
    if (!guard)
    {
      this.guard= guard= document.createElement('div');
      guard.className= this.guardClassName;
      guard.style.display="none";
      Element.addClassName(guard, animationOptions.classname);
      document.body.appendChild(guard);
    }
    
    var node= this.node;
    
    node.parentNode.insertBefore(guard, node);
    guard.style.display="";
    function callback()
    {
      guard.style.display= show?"":"none";
    }
    animationOptions.callback= callback;
    animationOptions.reverse= show;
    coherent.Animator.animateClassName(guard, animationOptions);
  },

  /** This is a hook function which allows overlays to set their position
      prior to being displayed.
   */
  updatePosition: function()
  {
  },
  
  /** This is a hook function which allows overlays to update their content
      before being displayed.
   */
  updateContent: function()
  {
  },
  
  onmouseup: function(event)
  {
    var target= event.target||event.srcElement;
    var contains= this.node.contains(target);
    if ((contains && this.clickInsideToDismiss) ||
        (!contains && this.clickOutsideToDismiss))
    {
      //  Delay hiding the overlay, because on IE, this will cause the click
      //  event to get lost. Which is rather undesirable.
      Function.delay(this.setVisible, 100, this, [false]);
    }
  },
  
  setVisible: function(isVisible)
  {
    document.body.appendChild(this.node);
    
    isVisible= !!isVisible;

    var listeners= coherent.page.__mouseEventListeners;
    var index= listeners.indexOf(this);
    
    if (isVisible)
    {
      this.updateContent();
      this.updatePosition();
      
      if (this.clickOutsideToDismiss && -1===index)
        coherent.page.__mouseEventListeners.push(this);
    }
    else if (-1!==index)
    {
      coherent.page.__mouseEventListeners.removeObjectAtIndex(index);
    }
    
    //  If the overlay is already visible, there's nothing more to do
    if (isVisible===this.visible())
      return;

    if (isVisible)
      this.callDelegate('willShowOverlay');
    else
      this.callDelegate('willHideOverlay');
      
    if (!this.modal)
    {
      this.base(isVisible);
      return;
    }

    if (isVisible)
    {
      if (!coherent.Overlay.numberOfModalOverlays)
        this.showModalBackdrop(isVisible);
      coherent.Overlay.numberOfModalOverlays++;
    }
    else
    {
      coherent.Overlay.numberOfModalOverlays= Math.max(0, coherent.Overlay.numberOfModalOverlays-1);
      if (!coherent.Overlay.numberOfModalOverlays)
        this.showModalBackdrop(isVisible);
    }

    this.showGuard(isVisible);
    this.base(isVisible);
  }
});

coherent.Overlay.numberOfModalOverlays=0;

/** @namespace
    Valid values for where an overlay may be positioned relative to an anchor
    view or element.
 */
coherent.Overlay.Position= {
  ABOVE: coherent.Style.kOverlayAbove,
  BELOW: coherent.Style.kOverlayBelow,
  LEFT: coherent.Style.kOverlayLeft,
  RIGHT: coherent.Style.kOverlayRight
};
