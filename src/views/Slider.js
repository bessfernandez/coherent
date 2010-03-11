/*jsl:import FormControl.js*/

/**
 **/
coherent.Slider= Class.create(coherent.FormControl, {
    
    exposedBindings: ['minValue', 'maxValue'],
    
    handleSelector: "a",
    
    init: function()
    {
        this.base();
        this.nativeInput= ('INPUT'===this.node.tagName);
        if (!this.nativeInput)
            this.handle= Element.query(this.node, this.handleSelector);
    },

    value: function()
    {
        return parseInt(this.node.value||0,10);
    },
    
    setValue: function(newValue)
    {
        var node= this.node;
        newValue= parseInt(newValue||0,10);
        
        node.value= newValue;
        if (this.nativeInput)
            return;
        
        //  update handle position
        this.__updateCurrentMetrics();
        var x= newValue*this.__stepWidth + this.__paddingLeft;
        this.handle.style.left= x.toFixed(3) + "px";
    },
    
    /** Callback for tracking changes to the value binding. This method will
        disable the control if the value is undefined (meaning one of the
        objects along the key path doesn't exist). Additionally, the control
        will be set to readonly if the value binding isn't mutable or if the new
        value is one of the marker values (MultipleValuesMarker or
        NoSelectionMarker).
      
        @param change   a ChangeNotification with the new value for the slider
      */
    observeValueChange: function(change)
    {
        var node= this.node;
        var newValue= change.newValue;

        //  determine whether this value is a marker
        var markerType= this.bindings.value && this.bindings.value.markerType;
        
        if (!markerType && this.formatter)
            newValue= this.formatter.stringForValue(newValue);

        if (coherent.NoSelectionMarkerType===markerType)
            node.disabled= true;
        else if (!this.bindings.enabled)
            node.disabled= false;
    
        if (!this.bindings.editable)
            node.readOnly= !this.bindings.value.mutable();

        if (node.readOnly)
            Element.addClassName(node, coherent.Style.kReadOnlyClass);
        else
            Element.removeClassName(node, coherent.Style.kReadOnlyClass);

        if (node.disabled)
            Element.addClassName(node, coherent.Style.kDisabledClass);
        else
            Element.removeClassName(node, coherent.Style.kDisabledClass);
                
        this.setValue(newValue);
    },
    
    onchange: function(event)
    {
        var value= parseInt(this.node.value,10);
        
        if (this.bindings.value)
            this.bindings.value.setValue(value);
    },
    
    minValue: function()
    {
        return parseInt(this.node.getAttribute('min'),10);
    },

    setMinValue: function(minValue)
    {
        var node= this.node;

        minValue= parseInt(minValue||0,10);
        
        node.setAttribute('min',minValue);
        
        if (this.bindings.value)
        {
            var boundValue = this.bindings.value.value();
            
            if (boundValue > minValue)
                this.setValue(boundValue);
        }

    },
    
    maxValue: function()
    {
        return parseInt(this.node.getAttribute('max'),10);
    },

    setMaxValue: function(maxValue)
    {
        var node= this.node;

        maxValue= parseInt(maxValue||0,10);
        
        node.setAttribute('max', maxValue);
        
        if (this.bindings.value)
        {
            var boundValue = this.bindings.value.value();
            
            if (boundValue < maxValue)
                this.setValue(boundValue);
        }
    },
    
    updateHandlePosition: function(event)
    {
        var rect= this.__currentRect;
        var x= event.clientX - rect.left - this.__handleWidth/2;
        
        if (x<0)
            x= 0;
        else if (x+this.__handleWidth>rect.width)
            x= rect.width-this.__handleWidth;
        
        var value= Math.round(x/this.__stepWidth);
        
        x= value*this.__stepWidth + this.__paddingLeft;

        this.handle.style.left= x.toFixed(3) + "px";
        if (this.bindings.value)
            this.bindings.value.setValue(value);
    },
    
    __updateCurrentMetrics: function()
    {
        var node= this.node;
        var rect= this.__currentRect= Element.getRect(node, true);
        
        var padding= Element.getStyles(node, ['paddingRight', 'paddingLeft']);
        padding.paddingLeft= parseInt(padding.paddingLeft||0, 10);
        padding.paddingRight= parseInt(padding.paddingRight||0, 10);
        
        rect.left += padding.paddingLeft;
        rect.right-= padding.paddingRight;
        rect.width-= (padding.paddingLeft + padding.paddingRight);
        
        this.__paddingLeft= padding.paddingLeft;
        this.__handleWidth= this.handle.offsetWidth;
        this.__stepWidth= (this.__currentRect.width-this.__handleWidth)/(this.maxValue() - this.minValue());
        if (isNaN(this.__stepWidth))
            this.__stepWidth=1;
    },
    
    onmousedown: function(event)
    {
        var node= this.node;
        
        if (this.nativeInput || node.readOnly || node.disabled)
            return;
            
        this.__updateCurrentMetrics();
        this.updateHandlePosition(event);
        Event.preventDefault(event);
    },
    
    onmousedrag: function(event)
    {
        var node= this.node;
        
        if (this.nativeInput || node.readOnly || node.disabled)
            return;
            
        this.updateHandlePosition(event);
    },
    
    onmouseup: function(event)
    {
        var node= this.node;
        
        if (this.nativeInput || node.readOnly || node.disabled)
            return;
        
        this.updateHandlePosition(event);
    },
    
    onclick: function(event)
    {
        Event.preventDefault(event);
    }
    
});
