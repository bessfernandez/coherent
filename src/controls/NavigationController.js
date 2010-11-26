/*jsl:import coherent*/

coherent.NavigationController= Class.create(coherent.ViewController, {

  constructor: function(params)
  {
    this.__viewControllers= [];
    this.base(params);
  },
  
  rootViewController: function()
  {
    return this.__viewControllers[0];
  },
  
  setRootViewController: function(viewController)
  {
    if (this.__viewControllers.length)
      throw new Error("Can't set root view controller after initialisation");
    if (!viewController)
      return;
      
    this.__viewControllers= [viewController];
    viewController.view().addClassName(coherent.Style.NavigationSubview);
    this.view().addSubview(viewController.view());
  },
  
  topViewController: function()
  {
    return this.__viewControllers && this.__viewControllers[this.__viewControllers.length-1];
  },
  
  visibleViewController: function()
  {
    var viewController= this.topViewController();
    
    return viewController && (viewController.__modalViewController || viewController);
  },
  
  viewControllers: function()
  {
    return this.__viewControllers;
  },

  //  TODO: Implement animations
  setViewControllers: function(viewControllers, animated)
  {
    var len= this.__viewControllers ? this.__viewControllers.length : 0;
    var node;
    var i;
    
    while (len--)
    {
      node= this.__viewControllers[len].view().node;
      node.parentNode.removeChild(node);
    }
    
    for (i=0, len=viewControllers.length; i<len; ++i)
      this.view().addSubview(viewControllers[i].view());
  },
  
  pushViewController: function(viewController, animated)
  {
    var outgoingNode= this.visibleViewController().view().node;
    var incomingNode= viewController.view().node;
    
    function ontransitionendOutgoing(event)
    {
      if (event.target!=outgoingNode)
        return;
      Event.stopObserving(outgoingNode, 'webkitAnimationEnd', outgoingHandler);
      
    }
    var outgoingHandler= Event.observe(outgoingNode, 'webkitAnimationEnd', ontransitionendOutgoing);
    Element.updateClass(outgoingNode, ['ui-slide', 'out'], ['in', 'reverse']);
    
    function ontransitionendIncoming(event)
    {
      if (event.target!=incomingNode)
        return;
      Event.stopObserving(incomingNode, 'webkitAnimationEnd', incomingHandler);
    }
    
    this.view().addSubview(viewController.view());
    
    var incomingHandler= Event.observe(incomingNode, 'webkitAnimationEnd', ontransitionendIncoming);
    Element.updateClass(incomingNode, [coherent.Style.NavigationSubview, 'ui-slide', 'in'], ['out', 'reverse']);
    this.__viewControllers.addObject(viewController);
  },
  
  popViewController: function(animated)
  {
  },

  popToViewController: function(viewController, animated)
  {
  },
  
  popToRootViewController: function(animated)
  {
  }
  
});
