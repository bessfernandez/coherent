/*jsl:import ../../ui.js*/

/*jsl:import ../app/Responder.js*/
/*jsl:import ../nib/NIB.js*/

coherent.ModalPresentation= {
  /**
  The presented view covers the screen.
  */
  FullScreen: 'ui-fullscreen',
  /**
  The height of the presented view is set to the height of the screen and the
  view’s width is set to the width of the screen in a portrait orientation. Any
  uncovered areas are dimmed to prevent the user from interacting with them. (In
  portrait orientations, this option is essentially the same as
  UIModalPresentationFullScreen.)
  */
  PageSheet: 'ui-pagesheet',
  /**
  The width and height of the presented view are smaller than those of the
  screen and the view is centered on the screen. If the device is in a landscape
  orientation and the keyboard is visible, the position of the view is adjusted
  upward so that the view remains visible. All uncovered areas are dimmed to
  prevent the user from interacting with them.
  */
  FormSheet: 'ui-formsheet',
  /**
  The view is presented using the same style as its parent view controller.
  */
  CurrentContext: null
};


coherent.ModalTransitionStyle= {  
  /**
  When the view controller is presented, its view slides up from the bottom of
  the screen. On dismissal, the view slides back down. This is the default
  transition style.
  */
  CoverVertical: "ui-slideup",
  /**
  When the view controller is presented, the current view initiates a horizontal
  3D flip from right-to-left, resulting in the revealing of the new view as if it
  were on the back of the previous view. On dismissal, the flip occurs from
  left-to-right, returning to the original view.
  */
  FlipHorizontal: "ui-flip",
  /**
  When the view controller is presented, the current view fades out while the new
  view fades in at the same time. On dismissal, a similar type of cross-fade is
  used to return to the original view.
  */
  CrossDissolve: "ui-fade"
};

/** The ViewController. More documentation coming.
    @property {String} title
      The title for the view. This might be used to provide externally 
      customisable titles for a view loaded from a NIB.
    @property {String} nibName
    @property {coherent.Bundle} bundle
*/
coherent.ViewController= Class.create(coherent.Responder, {

  exposedBindings: ['representedObject'],
  
  /** When displayed modally, this view controller should occupy the full screen */
  modalPresentationStyle: coherent.ModalPresentation.FullScreen,
  
  title: function()
  {
    return this.__title;
  },
  
  setTitle: function(newTitle)
  {
    this.__title= newTitle;
  },
  
  /** Retrieve the view associated with this ViewController.
      @type coherent.View
   */
  view: function()
  {
    if (!this.__loading && !this.__view && this.nibName)
      this.loadView();
    return this.__view;
  },
  
  /** Set the view associated with this ViewController. The ViewController
      will insert itself as the next responder for the view.
    
      @param {coherent.View} view - a reference to the view
   */
  setView: function(view)
  {
    if (this.__view)
      this.__view.setNextResponder(null);
      
    this.__view= view;
    if (view)
      view.setNextResponder(this);
  },

  /** Load the NIB from the associated bundle... the view property will be
      connected by the standard NIB loading mechanism.
   */
  loadView: function()
  {
    if (!this.nibName)
      throw new Error("ViewController is not associated with a NIB.");
      
    if (this.bundle)
      this.nib= NIB.withNameInBundle(this.nibName, this.bundle);
    else
      this.nib= NIB.withName(this.nibName);
    if (!this.nib)
      throw new Error("Could not find NIB with name \""+this.nibName +"\" in bundle \""+this.bundle+"\"");
    
    this.__loading= true;  
    this.nib.instantiateNibWithOwner(this);
    delete this.__loading;
    
    if (!this.__view)
      throw new Error("NIB does not seem to have set the view for the ViewController.");
      
    this.viewDidLoad();
  },
  
  viewDidLoad: function()
  {
  },
  
  parentViewController: function()
  {
    var responder= this;
    
    while ((responder= responder.nextResponder()))
      if (responder instanceof coherent.ViewController)
        return responder;
    
    return null;
  },
  
  /** If the next responder has been set explicitly via a call to
      {@link #setNextResponder}, return that value. Otherwise, return the
      superview of the view associated with this ViewController.
      @type coherent.Responder
   */
  nextResponder: function()
  {
    return this.__nextResponder||this.__view.superview();
  },
  
  presentModalViewController: function(viewController)
  {
    var node;
    
    if (this.modalViewController)
    {
      node= this.modalViewController.view().node;
      Element.updateClass(node, 'out', 'in');
    }

    viewController.setNextResponder(this);
    this.modalViewController= viewController;
    node= viewController.view().node;
    
    var presentationStyle= viewController.modalPresentationStyle ||
                           this.modalPresentationStyle;
    var transitionStyle= viewController.modalTransitionStyle ||
                         coherent.ModalTransitionStyle.CoverVertical;
                         
    Element.addClassName(node, presentationStyle);
  },
  
  dismissModalViewController: function(animated)
  {
  }
 
});
