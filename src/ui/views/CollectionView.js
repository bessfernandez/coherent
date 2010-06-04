/*jsl:import View.js*/
/*jsl:import ../controllers/ArrayController.js*/
/*jsl:import ../../foundation/core/IndexRange.js*/


/** @interface coherent.CollectionViewItem
  
    A CollectionViewItem contains information about each entry in the
    content of the collection view. It represents the Binding context for
    the individual subviews of the CollectionView.
  
    @property {coherent.KVO} representedObject - This is the object from
      the content array associated with a specific element of the
      CollectionView.
    
    @property {coherent.View} view - The view that is displaying the
      representedObject. Subclasses of CollectionView may change this
      to whatever type of view is appropriate for the representedObject,
      however, the default behaviour instantiates an instance of the
      {@link coherent.CollectionView#viewTemplate}.
    
    @property {Element} node - The DOM element associated with this item.
  
*/

/** Collection view...

    @property {coherent.VIEW} viewTemplate - The template for the individual
      views used to display the content. The {@link #init} method will throw
      an Error if a viewTemplate is not specified.
    
    @property {Element} templateNode - The DOM node that will be cloned to
      display each content item. This is typically the first child of the
      view container, however, if there are no children, the mark up will be
      taken from the {@link #viewTemplate}.

    @binding {coherent.KVO[]} content - The content to be displayed by the view.
  
    @binding {Number[]} selectionIndexes - The indexes of the selected items in
      the data array.
    
 */
coherent.CollectionView= Class.create(coherent.View, {

  animationOptions: {
    selection: {
      classname: coherent.Style.kSelectedClass
    },
    content: {
      classname: coherent.Style.kUpdatingClass
    },
    insertion: {
      classname: coherent.Style.kInsertedClass,
      duration: 100
    },
    deletion: {
      classname: coherent.Style.kDeletedClass,
      duration: 100
    },
    replacement: {
      classname: coherent.Style.kReplacingClass
    }
  },

  exposedBindings: ['content', 'selectionIndexes'],

  /** Should the selection be permitted to become empty? If `false`, there
      will always be one item selected at all times.
      @type Boolean
      @default true
   */
  allowsEmptySelection: true,

  /** Is multiple selection permitted?
      @type Boolean
      @default false
   */
  multiple: false,

  /** Should multiple selection require using Cmd/Ctrl or Shift?
      @type Boolean
      @default false
   */
  multipleSelectWithoutModifiers: false,
  
  /** Initialise the CollectionView instance. This method identifies the 
      templateNode element based on the `tagName` of the view node.
   */
  init: function()
  {
    //  Call base init
    this.base();

    this.__content= [];
    this.__items=[];
    this.__selectionIndexes= [];
  
    var node= this.node;
    var container;
    var templateNode;
    
    if ('TABLE'===node.tagName)
    {
      container= this.setContainer(node.tBodies[0]);
      templateNode= container.rows.length && container.rows[0];
    }
    else
    {
      container= this.container();
      templateNode= container.children[0];
    }

    if (templateNode)
      this.templateNode= Element.clone(templateNode);
    
    //  remove all children, can't use innerHTML on MSIE.
    while (container.firstChild)
      container.removeChild(container.firstChild);
    
    if (!this.viewTemplate)
      throw new Error('No view template specified for CollectionView');
    
    //  If the viewTemplate is specified as simply a class (rather than a
    //  factory function, via a declarative constructor), then convert it
    //  to a factory function. This makes the logic less complex later.
    if (this.viewTemplate && !this.viewTemplate.__factoryFn__)
      this.viewTemplate= this.viewTemplate();
  },

  /** Should the view accept being the first responder?
      @type Boolean
   */
  acceptsFirstResponder: function()
  {
    var node= this.node;
    return !(node.disabled || node.readOnly);
  },
    
  /** Create a new view for the representedObject. This method swizzles the
      global dataModel to point to the created item, then creates an instance
      of the {@link #viewTemplate} to associate with the new item. Because the
      represented object is a property of the item, and the item is the binding
      context for the view, the view can bind to properties on the represented
      object via the key 'representedObject'.
  
      Subclasses may want to implement this method to return a different type
      of view rather than whatever is provided by the {@link #viewTemplate}.

      @param {coherent.KVO} representedObject - The object for which a new
        item and view should be created.
      
      @type coherent.CollectionViewItem
   */
  newItemForRepresentedObject: function(representedObject)
  {
    var oldDataModel= coherent.dataModel;
    var item= new coherent.KVO.Proxy(this.__context);
    
    coherent.dataModel= item;
    
    var node;
    if (this.templateNode)
      node= Element.clone(this.templateNode);

    item.setValueForKey(representedObject, 'representedObject');
    item.setValueForKey(this.viewTemplate(node, null), 'view');
    item.setValueForKey(node||item.view.node, 'node');
    
    coherent.dataModel= oldDataModel;
    
    return item;
  },
  
  /** Return the content associated with this view.
      @type coherent.KVO[]
   */
  content: function()
  {
    return this.__content;
  },
  
  /** Set the content associated with this view. The view makes a shallow
      copy of the `newContent` argument, so changes to the original array will
      not be reflected in the view. Nor will the view receive change
      notifications. If you want the view to automatically track changes to
      the content array, use the content binding.
   
      @param {coherent.KVO[]} newContent - The new content.
   */
  setContentStatic: function(newContent)
  {
    var container= this.container();

    this.__content= newContent= newContent ? newContent.copy() : [];
    
    var items= this.__items;
    var numberOfItems= items.length;

    var newContentLength= newContent.length;
    var numberToReuse= Math.min(numberOfItems, newContentLength);
    
    var i=0;
    var item;
    
    while (i<numberToReuse)
    {
      items[i].setValueForKey(newContent[i], 'representedObject');
      ++i;
    }
    
    //  Create new wrapper items for new content items
    if (i<newContentLength)
    {
      var frag= document.createDocumentFragment();
      
      while (i<newContentLength)
      {
        item= this.newItemForRepresentedObject(newContent[i]);
        items.push(item);
        frag.appendChild(item.node);
        ++i;
      }

      container.appendChild(frag);
    }
    else
    {
      while (i<numberOfItems)
      {
        this.removeChild(items[i].node);
        ++i;
      }
      
      //  trim content array
      items.length= newContentLength;
    }
  },

  setContent: function(newContent)
  {
    var _this= this;
    var animator= coherent.Animator;
    var container= this.container();

    var insertionAnimationOptions= this.__animationOptionsForProperty('insertion');
    insertionAnimationOptions.reverse= true;

    var deletionAnimationOptions= this.__animationOptionsForProperty('deletion');
    deletionAnimationOptions.callback= function(node)
    {
      node.style.display='none';
      Element.removeClassName(node, deletionAnimationOptions.classname);
      _this.removeChild(node);
    }
    
    if (!insertionAnimationOptions.duration && !deletionAnimationOptions.duration)
    {
      this.setContentStatic(newContent);
      return;
    }

    newContent= newContent ? newContent.copy() : [];    
    var oldContent= this.__content;
    
    var oldLen= oldContent.length;
    var newLen= newContent.length;
    var oldIndex= 0;
    var newIndex= 0;
    var newPosition;
    
    var oldItems= this.__items;
    var newItems= [];
    var newSelectionIndexes= [];
    var item;
    var newItem;
    
    while (oldIndex<oldLen && newIndex<newLen)
    {
      item= oldItems[oldIndex];
      
      //  same element, don't need to do anything
      if (newContent[newIndex]===oldContent[oldIndex])
      {
        if (item.selected)
          newSelectionIndexes.push(newIndex);
        newItems.push(item);
        newIndex++;
        oldIndex++;
        continue;
      }
      
      newPosition= newContent.indexOf(oldContent[oldIndex], newIndex+1);
      
      //  The old content item doesn't appear in the new content after the
      //  current position, delete it
      if (-1===newPosition)
      {
        //  move to the next old content item, but keep the current position
        //  in the new content.
        oldIndex++;
        animator.animateClassName(item.node, deletionAnimationOptions);
        continue;
      }
      
      //  The old content item appears later in the new content, insert
      //  all the new items between the current newIndex and the position
      //  of the old content item: [newIndex, newPosition)
      while (newIndex<newPosition)
      {
        newItem= this.newItemForRepresentedObject(newContent[newIndex]);
        newItems.push(newItem);
        Element.addClassName(newItem.node, insertionAnimationOptions.classname);
        container.insertBefore(newItem.node, item?item.node:null);
        animator.animateClassName(newItem.node, insertionAnimationOptions);
        
        newIndex++;
      }

      //  newIndex now equals newPosition, and the content items should be
      //  the same. So I don't have to make any checks...
      if (item.selected)
        newSelectionIndexes.push(newIndex);
      newItems.push(item);
      newIndex++;
      oldIndex++;
    }
    
    //  If I've run off the end of the newContent array, then delete all the
    //  remaining oldContent items
    while (oldIndex<oldLen)
    {
      item= oldItems[oldIndex];
      oldIndex++;
      animator.animateClassName(item.node, deletionAnimationOptions);
    }
    
    //  If I've run off the end of the oldContent array, then add all the
    //  remaining newContent items
    while (newIndex<newLen)
    {
      newItem= this.newItemForRepresentedObject(newContent[newIndex]);
      newItems.push(newItem);
      Element.addClassName(newItem.node, insertionAnimationOptions.classname);
      container.insertBefore(newItem.node, null);
      animator.animateClassName(newItem.node, insertionAnimationOptions);
      
      newIndex++;
    }
    
    //  All done updating the dom
    this.willChangeValueForKey('selectionIndexes');
    this.__content= newContent;
    this.__items= newItems;
    this.__selectionIndexes= newSelectionIndexes;
    this.didChangeValueForKey('selectionIndexes');
  },
  
  /** Track changes to the bound content value.
  
      @private
      @param {coherent.ChangeNotification} change - The change notification
   */
  observeContentChange: function(change)
  {
    if (change.changeType===coherent.ChangeType.setting)
    {
      this.setContent(change.newValue);
      return;
    }
    
    var container= this.container();
    var items= this.__items;
    var newItems;
    var index;
    var len= change.indexes.length;
    var nodeIndex;
    var indexes= change.indexes;
    var item;
    var animationOptions;
    var animated;
    var animator= coherent.Animator;
    var _this= this;
    
    switch (change.changeType)
    {
      case coherent.ChangeType.insertion:
        animationOptions= this.__animationOptionsForProperty('insertion');
        animationOptions.reverse= true;
        animated= !!animationOptions.duration;
        
        newItems= change.newValue.map(this.newItemForRepresentedObject, this);
        
        //  add the specific indexes.
        for (index=0; index<len; ++index)
        {
          nodeIndex= indexes[index];
          item= items[nodeIndex];
          if (animated)
            Element.addClassName(newItems[index].node, animationOptions.classname);
          container.insertBefore(newItems[index].node, item?item.node:null);
          if (animated)
            animator.animateClassName(newItems[index].node, animationOptions);
        }
        this.__content.insertObjectsAtIndexes(change.newValue, indexes);
        items.insertObjectsAtIndexes(newItems, indexes);
        break;

      case coherent.ChangeType.deletion:
        animationOptions= this.__animationOptionsForProperty('deletion');
        animationOptions.callback= function(node)
          {
            node.style.display='none';
            Element.removeClassName(node, animationOptions.classname);
            _this.removeChild(node);
          }
        animated= !!animationOptions.duration;
          
        indexes.sort(coherent.reverseCompareNumbers);
        for (index=0; index<len; ++index)
        {
          nodeIndex= indexes[index];
          if (animated)
            animator.animateClassName(items[nodeIndex].node, animationOptions);
          else
            this.removeChild(items[nodeIndex].node);
        }
        items.removeObjectsAtIndexes(indexes);
        this.__content.removeObjectsAtIndexes(indexes);
        break;

      case coherent.ChangeType.replacement:
        for (index=0; index<len; ++index)
        {
          items[indexes[index]].setValueForKey(change.newValue[index], 'representedObject');
        }
        this.__content.replaceObjectsAtIndexesWithObjects(indexes, change.newValue);
        break;

      case coherent.ChangeType.validationError:
        /*  @TODO: Is there something I should do when an item in the
            content is not valid? Possibly apply a class name to the 
            item.
         */
        break;
          
      default:
        console.log("Unknown change type: "+change.changeType);
        break;
    }
  },

  /** Retrieve the array of selected indexes. When the view does not allow
      multiple selection, this should be an array with 0 or 1 entries.
      @type Number[]
   */
  selectionIndexes: function()
  {
    return this.__selectionIndexes;
  },
  
  /** Set the selection for the view. A copy of the array of selected indexes
      is made before highlighting the new selection.
    
      @param {Number[]} newSelectionIndexes - The array of selected indexes
   */
  setSelectionIndexes: function(newSelectionIndexes)
  {
    var items= this.__items;
    var len= items.length;
    var index;
    var item;
    var selection;
    var nextSelected;
    var animationOptions= this.__animationOptionsForProperty('selection');
    
    if (newSelectionIndexes)
      this.__selectionIndexes= newSelectionIndexes.sort(coherent.compareNumbers);
    else
      this.__selectionIndexes= [];
    
    //  create a copy
    selection= this.__selectionIndexes.copy();
    nextSelected= selection.shift();
    
    for (index=0; index<len; ++index)
    {
      item= items[index];
      
      if ((item.selected= (index===nextSelected)))
        nextSelected= selection.shift();
        
      item.view.animateClassName(animationOptions, !item.selected);
    }
  },

  /** Observe changes to the bound array of selected indexes.
      @param {coherent.ChangeNotification} change - The change notification.
   */
  observeSelectionIndexesChange: function(change)
  {
    if (coherent.ChangeType.setting===change.changeType)
    {
      this.setSelectionIndexes(change.newValue);
      return;
    }
    
    var animationOptions= this.__animationOptionsForProperty('selection');
    var items= this.__items;
    var item;
    
    switch (change.changeType)
    {
      case coherent.ChangeType.insertion:
        this.__selectionIndexes.insertObjectsAtIndexes(change.newValue, change.indexes);
        change.newValue.forEach(function(i) {
                  item= items[i];
                  item.selected= true;
                  item.view.animateClassName(animationOptions);
                });
        break;

      case coherent.ChangeType.deletion:
        this.__selectionIndexes.removeObjectsAtIndexes(change.indexes);
        change.oldValue.forEach(function(i) {
                  item= items[i];
                  item.selected= false;
                  item.view.animateClassName(animationOptions, true);
                });
        break;

      case coherent.ChangeType.replacement:
        this.__selectionIndexes.replaceObjectsAtIndexesWithObjects(change.indexes, change.newValue);
        change.oldValue.forEach(function(i) {
                  item= items[i];
                  item.selected= false;
                  item.view.animateClassName(animationOptions, true);
                });
        change.newValue.forEach(function(i) {
                  item= items[i];
                  item.selected= true;
                  item.view.animateClassName(animationOptions);
                });
        break;

      case coherent.ChangeType.validationError:
        /*  Don't need to worry about this, because validationError
            notifications shouldn't occur for the selection indexes.
         */
        break;

      default:
        console.log("Unknown change type: "+change.changeType);
        break;
    }
  },

  /** Determine the node associated with an event. Because click or touch
      events may be fired on a deeply nested node, this method ascends the
      parent change to find the node that is an immediate child of this view's
      container node -- essentially one of the view items.
    
      @param {Event} event - The DOM event, usually a click event.
      @type Element
      @private
   */
  itemNodeFromEvent: function(event)
  {
    var e = event.target||event.srcElement;
    var container= this.container();
    
    if (e===container)
      return null;
      
    while (e && e.parentNode!=container)
      e = e.parentNode;
  
    if (e===container)
      return null;
    
    return e;
  },
  
  /** Handle a touch start event. This event handler remembers the DOM node
      of the item associated with the touch event. The mouse down event will
      be fired with a stale event object, so by remembering the row, there's
      no chance of running into problems with the stale event.
    
      @param {Event} event - A touch event
   */
  ontouchstart: function(event)
  {
    // get the row now instead of onmousedown because it will be called after a delay.
    this.__touchedRow= this.itemNodeFromEvent(event);
  }, 
  
  /** Handle a mouse down event within the CollectionView. This handler sets
      the active class on the item node associated with the event.
    
      @param {Event} event - The mouse event.
   */
  onmousedown: function(event)
  {
    if (this.node.disabled)
      return;

    var node= (coherent.Support.Touches && this.__touchedRow) ||
           this.itemNodeFromEvent(event);

    if (!node)
      return;
      
    this.__activeNode= node;
    Element.addClassName(node, coherent.Style.kActiveClass);
  },

  /** Handle the event fired when the visitor releases the mouse button after
      depressing it on this view. This handler removes the active state from
      the DOM node associated with the item that was clicked on.
      @param {Event} event - The mouse up event.
   */
  onmouseup: function(event)
  {
    if (this.node.disabled)
      return;
      
    if (this.__activeNode)
      Element.removeClassName(this.__activeNode, coherent.Style.kActiveClass);
    this.__activeNode= null;
  },

  /** Handle a touch move event. This handler removes the active state from
      the DOM node associated with the previous mousedown event before passing
      the event to the base implementation.
    
      @param {Event} event - The touch move event
   */
  ontouchmove: function(event)
  {
    if (this.node.disabled)
      return;
      
    if (this.__activeNode)
      Element.removeClassName(this.__activeNode, coherent.Style.kActiveClass);
    this.__activeNode= null;
    this.base(event);
  },
  
  /** Handle click events for items within the view. This supports multiple
      and discontiguous selection. This method updates the bound selection
      indexes value.
    
      @param {Event} event - The click event.
   */
  onclick: function(event)
  {
    var node= this.node;
    
    //  When the ListView is disabled, pass the click event up the Responder
    //  chain to see if anyone up above would like to handle it.
    if (node.disabled)
    {
      this.base(event);
      Event.stop(event);
      return;
    }
    
    var e= this.itemNodeFromEvent(event);
    if (!e)
      return;
      
    var container= this.container();
    var itemIndex= Array.from(container.children).indexOf(e);
    
    var selectionIndexes= this.selectionIndexes().copy();

    var ctrlKeyDown= event.ctrlKey || event.metaKey;
    var shiftKeyDown= event.shiftKey;
    
    this.extendIndex= itemIndex;
    
    if (this.multipleSelectWithoutModifiers || ctrlKeyDown)
    {
      this.anchorIndex= itemIndex;
      
      var pos= selectionIndexes.indexOf(itemIndex);
      //  If itemIndex isn't already selected, select it.
      if (-1===pos)
      {
        if (this.multiple)
          selectionIndexes.push(itemIndex);
        else
          selectionIndexes= [itemIndex];
      }
      //  If it is selected, deselect it only if an empty selection is permitted or
      //  there are other items selected.
      else if (this.allowsEmptySelection || selectionIndexes.length>1)
        selectionIndexes.splice(pos, 1);
    }
    else if (shiftKeyDown && this.multiple)
      selectionIndexes= IndexRange(itemIndex, this.anchorIndex);
    else
      selectionIndexes= [this.anchorIndex= itemIndex];

    this.setSelectionIndexes(selectionIndexes);
    if (this.bindings.selectionIndexes)
      this.bindings.selectionIndexes.setValue(selectionIndexes);
      
    //  Send the action to let the target know a selection was made
    this.sendAction();
  },

  /** Handle a keydown notification to update selection. If the view doesn't
      have the focus, then the view ignores key events. This event handler
      only processes KEY_UP_ARROW (cursor up) and KEY_DOWN_ARROW (cursor down)
      events.
    
      Keyboard selection without the shift key works according to the Mac
      standard (up selects the previous element or the last element in the
      collection if none are presently selected, down selects the next element
      or the first element in the collection if no elements are selected).
    
      @param {Event} event - the keydown event object
   **/
  onkeydown: function(event)
  {
    var node= this.node;
    if (node.disabled)
      return;

    //  Only need to trap up & down arrows
    var keyCode= event.keyCode;
    if (Event.KEY_UP_ARROW !== keyCode && Event.KEY_DOWN_ARROW !== keyCode)
      return;

    Event.stop(event);
    
    var selectionIndexes= this.selectionIndexes().copy();
    var maxIndex= this.__content.length-1;
    var hasSelection= selectionIndexes.length;
    var newIndex= this.extendIndex;

    if (Event.KEY_UP_ARROW==keyCode)
      newIndex= hasSelection ? Math.max(0, newIndex-1) : maxIndex;
    else
      newIndex= hasSelection ? Math.min(maxIndex, newIndex+1) : 0;

    if (newIndex===this.extendIndex)
      return;
    
    this.extendIndex= newIndex;
    
    if (hasSelection && this.multiple && event.shiftKey)
      selectionIndexes= IndexRange(this.anchorIndex, newIndex);
    else
      selectionIndexes= [this.anchorIndex= newIndex];

    //  Scroll the parent to make certain the new index can be seen
    var container= this.container();
    var item= container.children[newIndex];

    var scrollParent= Element.scrollParent(node);
    var scrollParentHeight= scrollParent.offsetHeight;

    var scrollTop= item.offsetTop - scrollParent.scrollTop;
    var itemHeight= item.offsetHeight;
    
    if (item.offsetParent !== container)
      scrollTop-= container.offsetTop;

    if (scrollTop<0)
      item.scrollIntoView(true);
    else if (scrollTop+itemHeight>scrollParentHeight)
      item.scrollIntoView(false);

    //  Update the selection indexes and binding
    this.setSelectionIndexes(selectionIndexes);
    if (this.bindings.selectionIndexes)
      this.bindings.selectionIndexes.setValue(selectionIndexes);
  }

});
