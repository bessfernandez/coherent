/*jsl:import ObjectController.js*/

coherent.ArrayController= Class.create(coherent.ObjectController, { 

    /** Create a new ArrayController instance.
        
        @param {Object} [parameters=null]  generic name/value pairs used to
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
        this.objectClass= coherent.KVO;
    },

    exposedBindings: ["selectionIndexes", "sortDescriptors", "filterPredicate"],
    
    preservesSelection: true,
    avoidsEmptySelection: true,
    selectsInsertedObjects: true,
    
    content: function()
    {
        return this.__content;
    },
    
    setContent: function(newContent)
    {
        //  create a copy of the content
        this.__content= newContent?newContent.concat():[];
        this.rearrangeObjects();
        
        if (!this.preservesSelection)
            this.setSelectionIndexes([]);
    },
    
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
                this.__content.replaceObjectsAtIndexes(change.newValue, change.indexes);
                this.__removeObjectsFromArrangedObjects(change.oldValue);
                this.__insertObjectsIntoArrangedObjects(change.newValue);
                break;
                
            case coherent.ChangeType.deletion:
                this.__content.removeObjectsAtIndexes(change.indexes);
                this.__removeObjectsFromArrangedObjects(change.oldValue);
                break;
                
            default:
                console.log("Unknown change type: "+change.changeType);
                break;
        }
    
    },
    
    /** Retrieve the sort descriptors for this ArrayController.
        @returns {coherent.SortDescriptor[]} an array of sort descriptors or an empty array if there are no
                 sort descriptors defined.
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
        descriptors= descriptors.concat();
        this.__sortDescriptors= descriptors;
        
        if (this.bindings.sortDescriptors)
            this.bindings.sortDescriptors.setValue(descriptors);
        this.rearrangeObjects();
    },
    
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
                this.__sortDescriptors.replaceObjectsAtIndexes(change.newValue, change.indexes);
                break;
                
            case coherent.ChangeType.deletion:
                this.__sortDescriptors.removeObjectsAtIndexes(change.indexes);
                break;
                
            default:
                console.log("Unknown change type: "+change.changeType);
                break;
        }
    
        this.rearrangeObjects();
    },
    
    /** Retrieve the filter predicate function.
        @returns {Function} the function used to filter the content or null if no predicate
                 has been specified.
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
    
    arrangedObjects: function()
    {
        return this.__arrangedObjects;
    },

    arrangeObjects: function(objects)
    {
        var filteredObjects= this.filterObjects(objects);
        var sortedObjects= this.sortObjects(filteredObjects);
        return sortedObjects;
    },

    /** Find the correct position within the arranged objects and insert it.
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

        var compareFn= this.createCompareFunction();

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
    
    __removeObjectsFromArrangedObjects: function(objects)
    {
        var selectedObjects= this.selectedObjects();
        var arranged= this.__arrangedObjects.removeObjects(objects);
        this.setSelectedObjects(selectedObjects);
    },
    
    /** Filter an array of objects according to the filterPredicate.
      
        @param {Object[]} objects - the array of objects to filter
      
        @returns {Object[]} the objects that pass the filter predicate.
     */
    filterObjects: function(objects)
    {
        var filterPredicate= this.__filterPredicate;

        if (!filterPredicate)
            return objects.concat();

        return objects.filter(filterPredicate);
    },

    /** Compare two objects according to the specified sort descriptors.
        @returns -1 if obj1 appears before obj2, 1 if obj1 appears after obj2,
                 and 0 if obj1 is equal to obj2. If no sort descriptors have
                 been set, all objects are equal.
     */
    createCompareFunction: function()
    {
        /** A simple sort function that uses all the sort descriptors associated
            with this coherent.ArrayController. The first descriptor that returns
            a non-zero value (AKA not equal) terminates the comparison. Note,
            this sort function receives the indexes from the arranged array and
            uses those indexes to find the objects to compare in the content
            array.
        
            @param index1   the index in the content array of the first object
            @param index2   the index in the content array of the second object
            @returns -1 if obj1 is less than obj2, 0 if the two objects are equal,
                     1 if obj1 is greater than obj2.
         */
        var sortDescriptors= this.sortDescriptors();
        var numberOfSortDescriptors= sortDescriptors.length;

        if (!numberOfSortDescriptors)
            return null;
        else
            return function compareObjects(obj1, obj2)
            {
                var s;
                var result;
        
                for (s=0; s<numberOfSortDescriptors; ++s)
                {
                    result= sortDescriptors[s].compareObjects(obj1, obj2);
                    if (!sortDescriptors[s].ascending)
                        result*=-1;
                    if (0!==result)
                        return result>0?1:-1;
                }
    
                return 0;
            };
    },
    
    /** Sort an array of objects according to the sortDescriptors.
      
        @param objects - the content array to sort
      
        @returns the objects sorted according to the sort descriptors
     */
    sortObjects: function(objects)
    {
        var compareFunction= this.createCompareFunction();
        if (!compareFunction)
            return objects.concat();
            
        return objects.sort(compareFunction);
    },

    /** Retrieve the selected objects.
     */
    selectedObjects: function()
    {
        return this.__selectedObjects;
    },
    
    setSelectedObjects: function(selectedObjects)
    {
        var indexes= this.__arrangedObjects.indexesOfObjects(selectedObjects);
        return this.setSelectionIndexes(indexes);
    },

    /** Retrieve the selection index -- the first element in the selection
        indexes.
        @returns the first element in the selectionIndexes array.
     */
    selectionIndex: function()
    {
        var selectionIndexes= this.__selectionIndexes;
        if (0===selectionIndexes.length)
            return -1;
        
        return selectionIndexes[0];
    },
    
    /** Set the single selection index -- for single-select controls.
      
        @param selectedIndex    the index of the object to select.
        @returns true if the selection changed
     */
    setSelectionIndex: function(selectionIndex)
    {
        return this.setSelectionIndexes([selectionIndex]);
    },
    
    /** Helper method to determine whether the controller has a selection. This
        is often used in bindings rather than the more arcane method of checking
        for a non-zero length of the selectionIndexes property.
        
        @returns {Boolean} whether there's a selection
     */
    hasSelection: function()
    {
        return this.__selectionIndexes.length;
    },

    selectionIndexes: function()
    {
        return this.__selectionIndexes;
    },
    
    setSelectionIndexes: function(selectionIndexes)
    {
        //  First I need to sort the selectionIndexes, otherwise I can't compare them
        //  against the current selectionIndexes.
        selectionIndexes= selectionIndexes || [];
        selectionIndexes.sort(coherent.compareNumbers);

        //  If the selected indexes are the same, then don't bother changing them
        if (!this.__selectionIndexes.compare(selectionIndexes))
            return false;

        this.willChangeValueForKey('selectionIndex');
        this.willChangeValueForKey('selectedObjects');
        this.__selectionIndexes= selectionIndexes.concat();
        this.__selectedObjects= this.__arrangedObjects.objectsAtIndexes(selectionIndexes);
        
        if (this.bindings.selectionIndexes)
            this.bindings.selectionIndexes.setValue(selectionIndexes);

        this.didChangeValueForKey('selectedObjects');
        this.didChangeValueForKey('selectionIndex');
        this.forceChangeNotificationForKey('selection');

        return true;
    },
    
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
                this.__selectionIndexes.replaceObjectsAtIndexes(change.newValue, change.indexes);
                break;
                
            case coherent.ChangeType.deletion:
                this.__selectionIndexes.removeObjectsAtIndexes(change.indexes);
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
    
    addObject: function(object)
    {
        this.__content.addObject(object);
        this.__insertObjectsIntoArrangedObjects([object]);
    },
    
    addObjects: function(objects)
    {
        this.__content.addObjects(objects);
        this.__insertObjectsIntoArrangedObjects(objects);
    },
    
    removeObject: function(object)
    {
        this.__content.removeObject(object);
        this.__removeObjectsFromArrangedObjects([object]);
    },

    removeObjects: function(objects)
    {
        this.__content.removeObjects(objects);
        this.__removeObjectsFromArrangedObjects(objects);
    },

    newObject: function()
    {
        return new (this.objectClass)();
    },
    
    /** Determine whether new items may be added to the array managed by this
        controller.
        
        @returns {Boolean} true when this controller is editable.
     */
    canAdd: function()
    {
        return this.editable();
    },

    /** Add a new instance of the class managed by this controller {@link objectClass}.
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
        @returns false when the last item is selected.
    */
    canSelectNext: function()
    {
        var index= this.selectionIndex();
        var len= this.__arrangedObjects.length;

        return len && index<len-1;
    },
    
    /** Select the next element in the content array. */
    selectNext: function()
    {
        var index= this.selectionIndex();
        var len= this.__arrangedObjects.length;
        
        if (!len || index===len-1)
            return;
        this.setSelectionIndexes([index+1]);
    },
    
    /** Can the previous item be selected?
        @returns false when there is no selection or the first item is selected.
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
        
        if (!len || !index)
            return;
        this.setSelectionIndexes([index-1]);
    }
    
});
