/*jsl:import ../ui.js*/

coherent.PagingView= Class.create(coherent.View, {

  exposedBindings: ['selectedIndex'],

  autoAdvanceDirection: 1,
  
  animationOptions: {
    selection: {
      classname: coherent.Style.kSelectedClass
    },
    next: {
      classname: coherent.Style.kNext
    },
    previous: {
      classname: coherent.Style.kPrevious
    }
  },
  
  init: function()
  {
    //  find all the DIVs within the slideshow container
    var container= this.container();
    var children= container.children;
    var len= children.length;
    var node;
    var selectedClass= coherent.Style.kSelectedClass;
    var view;
    var fromNode= coherent.View.fromNode;
    var View= coherent.View;
    
    var selectedNode= null;
    
    this.__selectedIndex= -1;
    
    while (len--)
    {
      node= children[len];
      view= fromNode(node) || new View(node);
      
      if (Element.hasClassName(node, selectedClass))
      {
        if (-1!==this.__selectedIndex)
        {
          console.log('SlideshowView#init: more than one slide selected');
          Element.removeClassName(selectedNode, selectedClass);
          selectedNode.style.display='none';
        }
        selectedNode= node;
        this.__selectedIndex= len;
      }
      else
        node.style.display= 'none';
    }
    
    if (-1==this.__selectedIndex)
    {
      this.__selectedIndex=0;
      node= children[0];
      node.style.display='';
      Element.addClassName(node, selectedClass);
    }

    var hoverInfo={
      owner: this,
      onmouseenter: this.onmouseenter,
      onmouseleave: this.onmouseleave
    };
    
    this.addTrackingInfo(hoverInfo);
  },
  
  selectedIndex: function()
  {
    return this.__selectedIndex;
  },
  
  setSelectedIndex: function(selectedIndex)
  {
    if (this.__selectedIndex===selectedIndex || 'number'!==typeof(selectedIndex))
      return;

    var lastPage= this.numberOfPages()-1;
    if (selectedIndex<-1 || selectedIndex>lastPage)
      return;
      
    var selectionOptions= this.__animationOptionsForProperty('selection');
    var fromNode= coherent.View.fromNode;
    var container= this.container();
    var view;

    if (-1===this.__selectedIndex)
    {
      view= fromNode(container.children[selectedIndex]);
      view.setVisible(true);
      view.animateClassName(selectionOptions);
      return;
    }

    var old= fromNode(container.children[this.__selectedIndex]);
    old.animateClassName(selectionOptions, true);

    if (-1===selectedIndex)
    {
      old.setVisible(false);
      return;
    }

    view= fromNode(container.children[selectedIndex]);
    view.animateClassName(selectionOptions);
    
    var nextOptions= this.__animationOptionsForProperty('next');
    var prevOptions= this.__animationOptionsForProperty('previous');
    var direction= (selectedIndex > this.__selectedIndex) ? 1 : -1;
    
    if (0===selectedIndex && lastPage===this.__selectedIndex)
      direction= 1;
    else if (0===this.__selectedIndex && lastPage===selectedIndex)
      direction= -1;
      
    if (direction>0)
    {
      prevOptions.callback= function()
      {
        old.node.style.display='none';
        Element.removeClassName(old.node, prevOptions.classname||prevOptions.add);
      }
      old.animateClassName(prevOptions, false);
      
      Element.addClassName(view.node, nextOptions.classname||nextOptions.add);
      view.node.style.display='';
      view.animateClassName(nextOptions, true);
    }
    else
    {
      nextOptions.callback= function()
      {
        old.node.style.display='none';
        Element.removeClassName(old.node, nextOptions.classname||nextOptions.add);
      }
      old.animateClassName(nextOptions, false);
      
      Element.addClassName(view.node, prevOptions.classname||prevOptions.add);
      view.node.style.display='';
      view.animateClassName(prevOptions, true);
    }
    
    this.__selectedIndex= selectedIndex;
  },
  
  numberOfPages: function()
  {
    return this.node ? this.node.children.length : 0;
  },
  
  pauseOnMouseHover: function()
  {
    return this.__pauseOnMouseHover;
  },
  
  setPauseOnMouseHover: function(pause)
  {
    this.__pauseOnMouseHover= pause;
  },
  
  onmouseenter: function()
  {
    if (!this.__pauseOnMouseHover)
      return;
    if (this.__advanceTimer)
      window.clearTimeout(this.__advanceTimer);
    this.__advanceTimer= null;
  },
  
  onmouseleave: function()
  {
    if (!this.__pauseOnMouseHover)
      return;
    if (this.__autoAdvanceDelay)
      this.setAutoAdvanceDelay(this.__autoAdvanceDelay);
  },
  
  autoAdvanceDelay: function()
  {
    return this.__autoAdvanceDelay;
  },
  
  setAutoAdvanceDelay: function(delay)
  {
    if (this.__advanceTimer)
      window.clearTimeout(this.__advanceTimer);
    this.__autoAdvanceDelay= delay;
    this.__advanceTimer= window.setTimeout(this.__autoAdvance.bind(this), delay);
  },
  
  __autoAdvance: function()
  {
    var newIndex= (this.__selectedIndex||0) + this.autoAdvanceDirection;
    
    if (newIndex<0)
      newIndex= this.numberOfPages()-1;
    else if (newIndex>=this.numberOfPages())
      newIndex= 0;
    
    this.setSelectedIndex(newIndex);
    if (this.bindings.selectedIndex)
      this.bindings.selectedIndex.setValue(newIndex);
    this.__advanceTimer= window.setTimeout(this.__autoAdvance.bind(this),
                                           this.__autoAdvanceDelay);
  }
  
});