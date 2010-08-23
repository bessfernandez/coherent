/*jsl:import ObjectController.js*/

/** A controller for managing arrays of objects.

    @binding {Number[]} selectionIndexes
      The indexes of the selected items.
  
    @binding {coherent.SortDescriptor[]} sortDescriptors 
      An array of sort descriptors which define how the content should be
      ordered before display.
    
    @binding {Function} filterPredicate
      A function that returns `true` if an object should be included in the
      {@link #arrangedObjects} collection.
    
    @binding {Object[]} content
      The ArrayController expects the value of the countent binding to be an
      array of objects that it should manage.
 */
coherent.ArrayController= Class.create(coherent.ObjectController, { 

  /** Create a new ArrayController instance.
    
      @param {Object} [parameters=null] Generic name/value pairs used to
        initialise this instance. See {@link coherent.Bindable} for the
        parameter implementation.
   */
  constructor: function(parameters)
  {
    this.base(parameters);
    this.__arrangedObjects= [];
    this.__sortDescriptors= [];
    this.__filterPredicate= null;
    this.__selectionIndexes= [];
    this.__selectedObjects= [];
    this.__content= [];
  },

  exposedBindings: ["selectionIndexes", "sortDescriptors", "filterPredicate"],
  
  /** Should the ArrayController attempt to preserve its original selection
      when the content changes?
      @type Boolean
      @default true
   */
  preservesSelection: true,
  
  /** When set, the ArrayController will avoid an empty selection. If there
      is no other selection, the first element will be selected.
      @type Boolean
      @default true
   */
  avoidsEmptySelection: true,
  
  /** Should the ArrayController select inserted objects? This makes it easier
      to edit newly inserted objects.
      @type Boolean
      @default true
   */
  selectsInsertedObjects: true,
  
  /** Retrieve the content managed by this controller.
      @type Object[]
   */
  content: function()
  {
    return this.__content;
  },
  
  /** Set the content managed by this controller. This method **always** makes
      a copy of the `newContent` parameter.
      @param {Object[]} newContent - The new content to be managed by this
        controller.
   */
  setContent: function(newContent)
  {
    //  create a copy of the content
    this.__content= newContent?newContent.copy():[];
    this.rearrangeObjects();
    
    if (this.bindings.content)
      this.bindings.content.setValue(newContent);

    if (!this.preservesSelection)
      this.setSelectionIndexes([]);
  },
  
  /** Observe changes to the content binding. This method is **only** invoked
      when the bound value for content changes.
      @param {coherent.ChangeNotification} change - the change notification
   */
  observeContentChange: function(change)
  {
    if (coherent.ChangeType.setting===change.changeType)
    {
      this.setContent(change.newValue);
      return;
    }
    
    switch (change.changeType)
    {
      case coherent.ChangeType.insertion:
        this.__content.insertObjectsAtIndexes(change.newValue, change.indexes);
        this.__insertObjectsIntoArrangedObjects(change.newValue);
        break;
        
      case coherent.ChangeType.replacement:
        this.__content.replaceObjectsAtIndexesWithObjects(change.indexes, change.newValue);
        this.__removeObjectsFromArrangedObjects(change.oldValue);
        this.__insertObjectsIntoArrangedObjects(change.newValue);
        break;
        
      case coherent.ChangeType.deletion:
        this.__content.removeObjectsAtIndexes(change.indexes);
        this.__removeObjectsFromArrangedObjects(change.oldValue);
        break;
      
      case coherent.ChangeType.validationError:
        /*  @TODO: I don't think there's anything that needs to be done
            for a validationError here. Although, it might be desirable
            to translate this into a validationError notification for
            the appropriate arranged objects, selected objects, and 
            selection.
         */
        break;
        
      default:
        console.log("Unknown change type: "+change.changeType);
        break;
    }
  
  },
  
  /** Retrieve the sort descriptors for this ArrayController.
      @type coherent.SortDescriptor[]
   */
  sortDescriptors: function()
  {
    return this.__sortDescriptors;
  },
  
  /** Set the sort descriptors for this coherent.ArrayController. Setting the
      sort descriptors will trigger the content to be rearranged according to
      the new sort information.
    
      @param {coherent.SortDescriptor[]} descriptors - the sort descriptors
           used for sorting the contents of this coherent.ArrayController.
   */
  setSortDescriptors: function(descriptors)
  {
    //  copy the array
    descriptors= descriptors ? descriptors.copy() : [];
    this.__sortDescriptors= descriptors;
    
    if (this.bindings.sortDescriptors)
      this.bindings.sortDescriptors.setValue(descriptors);
    this.rearrangeObjects();
  },
  
  /** Observe changes to the **bound** sort descriptors.
      @param {coherent.ChangeNotification} change - the change notification
   */
  observeSortDescriptorsChange: function(change)
  {
    if (coherent.ChangeType.setting===change.changeType)
    {
      this.setSortDescriptors(change.newValue);
      return;
    }

    switch (change.changeType)
    {
      case coherent.ChangeType.insertion:
        this.__sortDescriptors.insertObjectsAtIndexes(change.newValue, change.indexes);
        break;
        
      case coherent.ChangeType.replacement:
        this.__sortDescriptors.replaceObjectsAtIndexesWithObjects(change.indexes, change.newValue);
        break;
        
      case coherent.ChangeType.deletion:
        this.__sortDescriptors.removeObjectsAtIndexes(change.indexes);
        break;
        
      case coherent.ChangeType.validationError:
        /*  @TODO: What is the proper behaviour here? I can't imagine
            a sort descriptor having a validation error... Possibly, the
            right answer is to remove the sort descriptor?
         */
        break;
        
      default:
        console.log("Unknown change type: "+change.changeType);
        break;
    }
  
    this.rearrangeObjects();
  },
  
  /** Retrieve the function used to filter the content or null if no predicate
      has been specified.
      @type Function
   */
  filterPredicate: function()
  {
    return this.__filterPredicate;
  },
  
  /** Set the filter predicate for this ArrayController. Calls rearrangeObjects
      to update the value of arrangedObjects.
    
      @param {Function} predicate - The filter predicate that should be used
           to limit the content presented via the arrangedObjects property.
   */
  setFilterPredicate: function(predicate)
  {
    this.__filterPredicate= predicate;
    if (this.bindings.filterPredicate)
      this.bindings.filterPredicate.setValue(predicate);
    this.rearrangeObjects();
  },
  
  /** Rearranged the content objects. Only objects that match the filter
      predicate will be included in the arranged objects.
   */
  rearrangeObjects: function()
  {
    var selectedObjects;
    var selectionIndexes;
    
    if (this.preservesSelection)
      selectedObjects= this.selectedObjects();
    
    this.willChangeValueForKey('arrangedObjects');
    this.__arrangedObjects= this.arrangeObjects(this.__content);
    this.didChangeValueForKey('arrangedObjects');
    
    if (this.preservesSelection)
    {
      selectionIndexes= this.__arrangedObjects.indexesOfObjects(selectedObjects);
      this.setSelectionIndexes(selectionIndexes);
    }
  },
  
  /** Retrieve the arranged objects.
      @type Object[]
   */
  arrangedObjects: function()
  {
    return this.__arrangedObjects;
  },

  /** Arrange an array of objects according to the filter predicate and sort
      descriptors.
      @param {Object[]} objects - the objects to filter and sort
      @type Object[]
   */
  arrangeObjects: function(objects)
  {
    objects= objects.copy();
    var filteredObjects= this.filterObjects(objects);
    var sortedObjects= this.sortObjects(filteredObjects);
    return sortedObjects;
  },

  /** Find the correct position within the arranged objects and insert it.
      @param {Object[]} objects - the objects to insert into the arranged
        objects collection.
   */
  __insertObjectsIntoArrangedObjects: function(objects)
  {
    //  sort and filter the new objects
    var sorted= this.arrangeObjects(objects);
    var sortedLen= sorted.length;

    var arranged= this.__arrangedObjects;
    var arrangedLen= arranged.length;

    var indexes= [];
    var arrangedPos= 0;
    var arrangedObj;
    var obj;
    var i;

    var selectedObjects;

    var compareFn= coherent.SortDescriptor.comparisonFunctionFromDescriptors(this.sortDescriptors());

    if (this.selectsInsertedObjects)
      selectedObjects= sorted;
    else if (this.preservesSelection)
      selectedObjects= this.selectedObjects();
    
    if (compareFn)
    {
      //  The indexes array will always be the same length as the sorted
      //  array of objects
      indexes.length= sortedLen;
    
      //  consider each new object
      for (i=0; i<sortedLen; ++i)
      {
        obj= sorted[i];
      
        while (arrangedPos<arrangedLen)
        {
          arrangedObj= arranged[arrangedPos];
        
          //  obj appears before arrangedObj
          if (-1===compareFn(obj, arrangedObj))
            break;
        
          ++arrangedPos;
        }

        //  record where the arrangedObject will be inserted
        indexes[i]= arrangedPos + i;
      }

      arranged.insertObjectsAtIndexes(sorted, indexes);
    }
    else
      arranged.addObjects(sorted);
      
    if (selectedObjects)
      this.setSelectedObjects(selectedObjects);
  },
  
  /** Remove the specified objects from the arranged object collection.
      @param {Object[]} objects - the objects to remove
   */
  __removeObjectsFromArrangedObjects: function(objects)
  {
    var selectedObjects= this.selectedObjects();
    var arranged= this.__arrangedObjects.removeObjects(objects);
    this.setSelectedObjects(selectedObjects);
  },
  
  /** Filter an array of objects according to the filterPredicate.
      @param {Object[]} objects - the array of objects to filter
      @type Object[]
   */
  filterObjects: function(objects)
  {
    var filterPredicate= this.__filterPredicate;

    if (!filterPredicate)
      return objects;

    return objects.filter(filterPredicate);
  },

  /** Sort an array of objects according to the sortDescriptors.
      @param {Object[]} objects - the content array to sort
      @type Object[]
   */
  sortObjects: function(objects)
  {
    var compareFunction= coherent.SortDescriptor.comparisonFunctionFromDescriptors(this.sortDescriptors());
    if (!compareFunction)
      return objects;
      
    return objects.sort(compareFunction);
  },

  /** Retrieve the collection of selected objects.
      @type Object[]
   */
  selectedObjects: function()
  {
    return this.__selectedObjects;
  },
  
  /** Set the selected objects. This actually finds the indexes of the objects
      and sets the selectionIndexes property.
      @param {Object[]} selectedObjects - the new selected objects
   */
  setSelectedObjects: function(selectedObjects)
  {
    var indexes= this.__arrangedObjects.indexesOfObjects(selectedObjects);
    return this.setSelectionIndexes(indexes);
  },

  /** Retrieve the selection index -- the first element in the selection
      indexes or -1 if there is no selection.
      @type Number
   */
  selectionIndex: function()
  {
    var selectionIndexes= this.__selectionIndexes;
    if (0===selectionIndexes.length)
      return -1;
    
    return selectionIndexes[0];
  },
  
  /** Set the single selection index -- for single-select controls.
    
      @param {Number} selectedIndex - the index of the object to select or -1
        to clear the selection.
      @returns {Boolean} `true` if the selection changed
   */
  setSelectionIndex: function(selectionIndex)
  {
    if (-1===selectionIndex)
      return this.setSelectionIndexes([]);
    return this.setSelectionIndexes([selectionIndex]);
  },
  
  /** Helper method to determine whether the controller has a selection. This
      is often used in bindings rather than the more arcane method of checking
      for a non-zero length of the selectionIndexes property.
      @type Boolean
   */
  hasSelection: function()
  {
    return this.__selectionIndexes.length;
  },

  /** Retrieve the array of selected indexes. This is the canonical selection
      for the ArrayController.
      @type Number[]
   */
  selectionIndexes: function()
  {
    return this.__selectionIndexes;
  },
  
  /** Set the selection indexes. If the selectionIndexes array is empty, and
      {@link #avoidsEmptySelection} is `true`, then the selection will be set
      to the first item in the content.
  
      @param {Number[]} selectionIndexes - the new selection
      @returns {Boolean} `true` if the selection changed.
   */
  setSelectionIndexes: function(selectionIndexes)
  {
    //  First I need to sort the selectionIndexes, otherwise I can't compare them
    //  against the current selectionIndexes.
    selectionIndexes= selectionIndexes || [];
    selectionIndexes.sort(coherent.compareNumbers);

    if (this.avoidsEmptySelection && !selectionIndexes.length && this.__content.length)
      selectionIndexes= [0];
      
    this.willChangeValueForKey('selectionIndex');
    this.willChangeValueForKey('selectedObjects');
    this.willChangeValueForKey('hasSelection');
    this.willChangeValueForKey('canSelectNext');
    this.willChangeValueForKey('canSelectPrevious');
    this.willChangeValueForKey('canRemove');
    
    //  If the selected indexes are the same, then don't bother changing them
    if (this.__selectionIndexes.compare(selectionIndexes))
      this.__selectionIndexes= selectionIndexes.copy();

    this.__selectedObjects= this.__arrangedObjects.objectsAtIndexes(selectionIndexes);
    
    if (this.bindings.selectionIndexes)
      this.bindings.selectionIndexes.setValue(selectionIndexes);

    this.didChangeValueForKey('canRemove');
    this.didChangeValueForKey('canSelectNext');
    this.didChangeValueForKey('canSelectPrevious');
    this.didChangeValueForKey('hasSelection');
    this.didChangeValueForKey('selectedObjects');
    this.didChangeValueForKey('selectionIndex');
    this.forceChangeNotificationForKey('selection');

    return true;
  },
  
  /** Observe changes to the **bound** selection property.
      @param {coherent.ChangeNotification} change - the change notification
   */
  observeSelectionIndexesChange: function(change)
  {
    if (coherent.ChangeType.setting===change.changeType)
    {
      this.setSelectionIndexes(change.newValue);
      return;
    }

    switch (change.changeType)
    {
      case coherent.ChangeType.insertion:
        this.__selectionIndexes.insertObjectsAtIndexes(change.newValue, change.indexes);
        break;
        
      case coherent.ChangeType.replacement:
        this.__selectionIndexes.replaceObjectsAtIndexesWithObjects(change.indexes, change.newValue);
        break;
        
      case coherent.ChangeType.deletion:
        this.__selectionIndexes.removeObjectsAtIndexes(change.indexes);
        break;
        
      case coherent.ChangeType.validationError:
        /*  There's nothing to do here. This change notification shouldn't
            occur, because the values are numbers rather than objects.
         */
        break;
        
      default:
        console.log("Unknown change type: "+change.changeType);
        break;
    }

    this.willChangeValueForKey('selectionIndex');
    this.willChangeValueForKey('selectedObjects');
    this.__selectedObjects= this.__arrangedObjects.objectsAtIndexes(this.__selectionIndexes);
    this.didChangeValueForKey('selectedObjects');
    this.didChangeValueForKey('selectionIndex');
    this.forceChangeNotificationForKey('selection');
  },
  
  /** Add an object to the content managed by this controller. The specified
      object is added at the end of the content.
      @param {Object} object - the object to add
   */
  addObject: function(object)
  {
    var objects= [object];
    if (this.bindings.content)
    {
      var value= this.bindings.content.value();
      if (value)
      {
        value.addObject(object);
        return;
      }

      //  setValue prevents call through to observeContentChange
      this.bindings.content.setValue(objects);
    }
    
    this.__content.addObject(object);
    this.__insertObjectsIntoArrangedObjects(objects);
  },
  
  /** Add an array of objects to the content managed by this controller. The
      objects are appended to the content.
      @param {Object[]} objects - the objects to add
   */
  addObjects: function(objects)
  {
    if (this.bindings.content)
    {
      var value= this.bindings.content.value();
      if (value)
      {
        value.addObjects(objects);
        return;
      }

      //  setValue prevents call through to observeContentChange
      this.bindings.content.setValue(objects);
    }

    this.__content.addObjects(objects);
    this.__insertObjectsIntoArrangedObjects(objects);
  },
  
  /** Remove a specific object from the array managed by the controller.
      @param {Object} object - the object to remove
   */
  removeObject: function(object)
  {
    var value= this.bindings.content && this.bindings.content.value();
    if (value)
    {
      value.removeObject(object);
      return;
    }

    this.__content.removeObject(object);
    this.__removeObjectsFromArrangedObjects([object]);
  },

  /** Remove an array of objects from the controller.
      @param {Object[]} objects - the objects to remove
   */
  removeObjects: function(objects)
  {
    var value= this.bindings.content && this.bindings.content.value();
    if (value)
    {
      value.removeObjects(objects);
      return;
    }

    this.__content.removeObjects(objects);
    this.__removeObjectsFromArrangedObjects(objects);
  },

  /** Create a new instance of the {@link #objectClass}
      class. This method is used by the {@link #add} method.
      @type Object
   */
  newObject: function()
  {
    return new (this.objectClass)();
  },
  
  /** Determine whether new items may be added to the array managed by this
      controller.
    
      @returns {Boolean} `true` when this controller is editable.
   */
  canAdd: function()
  {
    return this.editable();
  },

  /** Add a new instance of the class managed by this controller
      {@link coherent.ObjectController#objectClass}.
   */
  add: function()
  {
    var newObject= new (this.objectClass)();
    this.addObject(newObject);
  },
  
  /** Can the currently selected elements be removed from the content?
      @returns {Boolean} `true` if the controller is editable and the array of
           {@link #selectionIndexes} is not empty.
   */
  canRemove: function()
  {
    return this.editable() && this.hasSelection();
  },
  
  /** Remove the currently selected elements from the content.
   */
  remove: function()
  {
    var selectedObjects= this.selectedObjects();
    this.removeObjects(selectedObjects);
  },
  
  /** Can the next item be selected?
      @returns {Boolean} `false` when the last item is selected.
  */
  canSelectNext: function()
  {
    var index= this.selectionIndex();
    var len= this.__arrangedObjects.length;

    return len && index<len-1;
  },
  
  /** Select the next element in the content array.
   */
  selectNext: function()
  {
    var index= this.selectionIndex();
    var len= this.__arrangedObjects.length;
    
    if (!len || index===len-1)
      return;
    this.setSelectionIndexes([index+1]);
  },
  
  /** Can the previous item be selected?
      @returns {Boolean} `false` when there is no selection or the first item
        is selected.
   */
  canSelectPrevious: function()
  {
    var index= this.selectionIndex();
    var len= this.__arrangedObjects.length;
    
    return len && index>0;
  },

  /** Select the previous item from the content array.
   */
  selectPrevious: function()
  {
    var index= this.selectionIndex();
    var len= this.__arrangedObjects.length;
    
    if (!len || index<1)
      return;
    this.setSelectionIndexes([index-1]);
  }
  
});
