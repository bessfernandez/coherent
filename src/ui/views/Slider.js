/*jsl:import FormControl.js*/

/**
 **/
coherent.Slider= Class.create(coherent.FormControl, {
    
    exposedBindings: ['minValue', 'maxValue', 'incrementValue'],
    
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
        var increment= this.incrementValue();
        newValue= Math.floor(parseInt(newValue||0,10)/increment)*increment;
        
        node.value= newValue;
        if (this.nativeInput)
            return;
        
        //  update handle position
        this.__updateCurrentMetrics();

        var x= (newValue-this.minValue())/increment*this.__stepWidth + this.__paddingLeft;
        
        this.handle.style.left= x.toFixed(3) + "px";
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
    
    incrementValue: function()
    {
        return parseInt(this.node.getAttribute('step'), 10)||1;
    },
    
    setIncrementValue: function(incrementValue)
    {
        var node= this.node;
        var value= this.value();

        incrementValue= parseInt(incrementValue||0, 10)||1;
        
        node.setAttribute('step', incrementValue);
        value= Math.floor(value/incrementValue)*incrementValue;
        this.setValue(value);
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
            this.bindings.value.setValue(value*this.incrementValue()+this.minValue());
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
        this.__stepWidth= (this.__currentRect.width-this.__handleWidth)/(this.maxValue() - this.minValue())*this.incrementValue();
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
