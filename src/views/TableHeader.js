/*jsl:import View.js*/


/** A view for managing the header for a tabular list.
 */
coherent.TableHeader= Class.create(coherent.View, {

    exposedBindings: ['sortDescriptors'],

    constructor: function(node, parameters)
    {
        this.base(node, parameters);
        this.__selectedColumn=-1;
    },
    
    sortKeys: function()
    {
        return this.__sortKeys;
    },
    
    setSortKeys: function(sortKeys)
    {
        this.__sortKeys= (sortKeys= sortKeys ? sortKeys.concat() : []);
        
        //  compute the sortKeyToIndex map
        var len= sortKeys.length;
        var i;
        
        this.__sortKeyIndex= {};
        for (i=0; i<len; ++i)
        {
            if (!sortKeys[i])
                continue;
            this.__sortKeyIndex[sortKeys[i]]= i;
        }
    },
        
    selectedColumn: function()
    {
        return this.__selectedColumn;
    },
    
    setSelectedColumn: function(newSelectedColumn)
    {
        var view= this.node;
        if (!view.rows.length)
            return;

        if (this.__selectedColumn===newSelectedColumn)
            return;
        
        var column;
        var headerRow= view.rows[0];
    
        //  clear previously selected column
        if (-1!==this.__selectedColumn)
        {
            column= headerRow.cells[this.__selectedColumn];
            var sortClass= column.__ascending?coherent.Style.kAscendingClass:
                                              coherent.Style.kDescendingClass;
            Element.updateClass(column, [],
                                [coherent.Style.kSelectedClass, sortClass]);
        }
    
        this.__selectedColumn= newSelectedColumn;

        if (-1!==this.__selectedColumn)
        {
            column= headerRow.cells[this.__selectedColumn];
            if ('undefined'===typeof(column.__ascending))
                column.__ascending= true;
            var addClass= column.__ascending?coherent.Style.kAscendingClass:
                                            coherent.Style.kDescendingClass;
            var removeClass= column.__ascending?coherent.Style.kDescendingClass:
                                                coherent.Style.kAscendingClass;
            Element.updateClass(column, [coherent.Style.kSelectedClass, addClass],
                                removeClass);
        }
    },
    
    onclick: function(event)
    {
        var view= this.node;
        var target= event.target || event.srcElement;
        var headerRow= view.rows[0];
        
        while (target && target.parentNode!==headerRow)
            target= target.parentNode;

        if (!target)
            return;

        var columnIndex= target.cellIndex;
        var sortKey= this.__sortKeys[columnIndex];
        
        //  Not a sortable column
        if (!sortKey)
            return;

        //  check for click that changes sort order
        if (this.__selectedColumn==columnIndex)
        {
            target.__ascending = target.__ascending?false:true;
            var ascending= coherent.Style.kAscendingClass;
            var descending= coherent.Style.kDescendingClass;
            if (target.__ascending)
                Element.updateClass(target, ascending, descending);
            else
                Element.updateClass(target, descending, ascending);
        }
        else
            this.setSelectedColumn(columnIndex);
        
        //  update the sort descriptor
        var newSortDescriptor= new coherent.SortDescriptor(sortKey, target.__ascending?true:false);
        if (this.bindings.sortDescriptors)
            this.bindings.sortDescriptors.setValue([newSortDescriptor]);
    },
    
    observeSortDescriptorsChange: function(change)
    {
        var descriptors= change.newValue;
        
        if (!descriptors || !descriptors.length || descriptors.length>1)
        {
            this.setSelectedColumn(-1);
            return;
        }
    
        var columnIndex= this.__sortKeyIndex[descriptors[0].keyPath];
        if ('undefined'===typeof(columnIndex) || null===columnIndex)
            columnIndex=-1;
        this.setSelectedColumn(columnIndex);
    }

});
