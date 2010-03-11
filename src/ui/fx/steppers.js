/*jsl:import ../../ui.js*/
/*jsl:import ../../foundation/core/colour.js*/

/** @namespace
 */
coherent.fx= coherent.fx||{};

(function(){

    /** Base methods for all Steppers.
     */
    coherent.fx.StepperBase= Class._create({
        cleanup: function()
        {
            this.element.style[this.property]= '';
        }
    });

    function convertKeywords(keywords)
    {
        switch (keywords)
        {
            case 'top':
                return '0% 50%';
            case 'right':
                return '100% 50%';
            case 'bottom':
                return '50% 100%';
            case 'left':
                return '0% 50%';
            case 'center':
                return '50% 50%';
            default:
                keywords = keywords.replace(/top|left/g, '0%');
                keywords = keywords.replace(/bottom|right/g, '100%');
                return keywords;   
        }
    }

    function stripUnits(item)
    {
        return parseInt(item, 10);
    }

    /** An animation stepper for colour properties.
        @constructor
     */
    coherent.fx.ColourStepper= Class._create(coherent.fx.StepperBase, {
        constructor: function(property, element, start, end, shouldCleanup)
        {
            this.property= property;
            this.element= element;
            this.start= Colour.fromString(start);
            this.end= Colour.fromString(end);
    
            if (coherent.Support.CSS3ColorModel)
            {

                this.step = this.stepRGBA;
            }
            else
            {
                this.step = this.stepRGB;
            }
    
            this.delta= {
                r: this.end.r-this.start.r,
                g: this.end.g-this.start.g,
                b: this.end.b-this.start.b,
                a: this.end.a-this.start.a
            };

            this.shouldCleanup= !!shouldCleanup;
        },

        stepRGB: function(t)
        {
            if (this.curve)
                t= this.curve(t);
        
            var rgb= ['rgb(',
                       Math.round(t * this.delta.r + this.start.r), ',',
                       Math.round(t * this.delta.g + this.start.g), ',',
                       Math.round(t * this.delta.b + this.start.b), ')'].join('');
            this.element.style[this.property]= rgb;
        },
    
        stepRGBA: function(t)
        {
            if (this.curve)
                t= this.curve(t);
            var rgba= ['rgba(',
                       Math.round(t * this.delta.r + this.start.r), ',',
                       Math.round(t * this.delta.g + this.start.g), ',',
                       Math.round(t * this.delta.b + this.start.b), ',',
                                  t * this.delta.a + this.start.a, ')'].join('');
            this.element.style[this.property]= rgba;
        },
    
        normaliseAlpha: function()
        {
            // We assume here that if you are fading to/from alpha=0, then you don't
            // want a color shift, so make sure the RGB values are equal.
            if (this.start.a === 0)
            {
                this.start.r = this.end.r;
                this.start.g = this.end.g;
                this.start.b = this.end.b;
            }
            else if (this.end.a === 0)
            {
                this.end.r = this.start.r;
                this.end.g = this.start.g;
                this.end.b = this.start.b;
            }
        }
    
    });

    if (!coherent.Support.CSS3ColorModel)
    {
        coherent.fx.ColourStepper.prototype.step= coherent.fx.ColourStepper.prototype.stepRGB;
        coherent.fx.ColourStepper.prototype.normaliseAlpha= Class.emptyFn;
    }



    /** An animation stepper for numeric property values (integers) like left,
        top, width, height, etc.
        @constructor
     */
    coherent.fx.NumericStepper= Class._create(coherent.fx.StepperBase, {
        constructor: function(property, element, start, end, shouldCleanup)
        {
            this.property= property;
            this.element= element;
            this.start= parseInt(start||0, 10);
            this.end= parseInt(end||0, 10);
            this.delta= this.end-this.start;
            this.shouldCleanup = !!shouldCleanup;
        },
        
        step: function(t)
        {
            if (this.curve)
                t= this.curve(t);
            this.element.style[this.property]= Math.round(t*this.delta + this.start) + 'px';
        }
    });




    /** An animation stepper for element opacity. There's a special case step
        function to handle IE.
        @constructor
     */
    coherent.fx.OpacityStepper= Class._create(coherent.fx.StepperBase, {
    
        constructor: function(element, start, end, shouldCleanup)
        {
            this.element= element;
            this.start= parseFloat(start||0);
            this.end= parseFloat(end||0);
            this.delta= end-start;
            this.shouldCleanup = !!shouldCleanup;
        },

        step: function(t)
        {
            if (this.curve)
                t= this.curve(t);
            var opacity= t*this.delta + this.start;
            this.element.style.opacity= (opacity>=1)?1:opacity;
        },
        
        cleanup: function()
        {
            this.element.style.opacity= '';
        }
    
    });




    /** An animation stepper for discrete values like display. The value clicks
        over to the end value half way through the animation.
        @constructor
     */
    coherent.fx.DiscreteStepper= Class._create(coherent.fx.StepperBase, {
        constructor: function(property, element, start, end, shouldCleanup)
        {
            this.property= property;
            this.element= element;
            this.start= start;
            this.end= end;
            this.shouldCleanup= !!shouldCleanup;
        },

        step: function(t)
        {
            if (t<this.discreteTransitionPoint)
                return;
            this.element.style[this.property] = this.end;
            this.step= Class.emptyFn;
        }
    });


    /** An animation stepper for the class name of a node.
        @constructor
     */
    coherent.fx.ClassNameStepper= Class._create(coherent.fx.StepperBase, {
        constructor: function(element, start, end)
        {
            this.element= element;
            this.start= start;
            this.end= end;
        },

        step: function(t)
        {
            if (t<this.discreteTransitionPoint)
                return;
                
            this.element.className = this.end;
            this.step = Class.emptyFn;
        },
        
        cleanup: false
    });
    
    
    /** An animation stepper for background image positioning. It can support all
        permutations of background-position, including keywords like top, left, etc.
        Caveat: It's not possible to animate from percentages/keywords to pixels.
        In this case, we'll fall back to a DiscreteStepper.
        @constructor
     */
    coherent.fx.BackgroundPositionStepper= Class._create(coherent.fx.StepperBase, {
        constructor: function(element, start, end, shouldCleanup)
        {
            start = convertKeywords(start);
            end = convertKeywords(end);
    
            var startUnit = start.match(/%|px/)[0];
            var endUnit = end.match(/%|px/)[0];
            if (startUnit != endUnit)
                return new coherent.fx.DiscreteStepper('backgroundPosition', element, start, end,
                                           shouldCleanup);
    
            this.element = element;
            this.unit = startUnit;
            this.start = Array.map(start.split(' '), stripUnits);
            this.end = Array.map(end.split(' '), stripUnits);
            this.delta = [this.end[0]-this.start[0], this.end[1]-this.start[1]];
            this.shouldCleanup= !!shouldCleanup;
    
            return this;
        },
        
        step: function(t)
        {
            if (this.curve)
                t= this.curve(t);
            this.element.style.backgroundPosition= Math.round(t * this.delta[0] + this.start[0])+this.unit+' '+
                                                   Math.round(t * this.delta[1] + this.start[1])+this.unit;
        },
        
        cleanup: function()
        {
            if (coherent.Browser.IE) {
                this.element.style.backgroundPositionX = '';
                this.element.style.backgroundPositionY = '';
            } else {
                this.element.style.backgroundPosition = '';
            }
        }
    });
    


    Object.extend(coherent.fx, {
        getStepper: function(property, element, start, end, cleanup)
        {
            switch(property)
            {
                case 'classname':
                    return new coherent.fx.ClassNameStepper(element, start, end);
            
                case 'display':
                    return new coherent.fx.DiscreteStepper(property, element, start, end, cleanup);
        
                case 'backgroundPosition':
                    return new coherent.fx.BackgroundPositionStepper(element, start, end, cleanup);
            
                case 'backgroundColor':
                case 'color':
                case 'borderColor':
                case 'borderTopColor':
                case 'borderRightColor':
                case 'borderBottomColor':
                case 'borderLeftColor':
                    return new coherent.fx.ColourStepper(property, element, start, end, cleanup);
        
                case 'opacity':
                    return new coherent.fx.OpacityStepper(element, start, end, cleanup);
        
                default:
                    return new coherent.fx.NumericStepper(property, element, start, end, cleanup);
            }
        }
    });
        
})();
