/*jsl:import ../../foundation.js*/
/**#nocode+*/

    if (coherent.Browser.IE)
        Class.extend(coherent.fx.OpacityStepper, {
            step: function(t)
            {
                if (this.curve)
                    t= this.curve(t);
                var opacity = t * this.delta + this.start;
                this.element.style.filter = (opacity>=1) ? '' : 'Alpha(Opacity='+opacity*100+')';
            },
            
            cleanup: function()
            {
                this.element.style.filter = '';
            }
        });
        
/**#nocode-*/
