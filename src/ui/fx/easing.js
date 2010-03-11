/*jsl:import ../../foundation.js*/

coherent.easing= (function(){

    var halfPI= Math.PI/2;
    var PI= Math.PI;

    return {
        linear: function(t)
        {
        	return t;
        },
        
        // a linear transition that goes from 0 -> 1 -> 0 over t=0->1
        // good for pulsing
        linearCompleteAndReverse: function(t)
        {
            return (t > 0.5) ? 2-2*t : 2*t;
        },

        // sinusoidal easing in - accelerating from zero velocity
        // t: current time (0..1)
        inSine: function(t)
        {
        	return 1 - Math.cos(t * halfPI);
        },

        // sinusoidal easing out - decelerating to zero velocity
        // t: current time (0..1)
        outSine: function(t)
        {
        	return Math.sin(t * halfPI);
        },

        // sinusoidal easing in/out - accelerating until halfway, then decelerating
        // t: current time (0..1)
        inOutSine: function(t)
        {
            return (1-Math.cos(t*PI))/2;
        },

        inBack: function(t, s)
        {
        	if (s == undefined) s = 1.70158;
        	return t*t*((s+1)*t - s);
        },

        // back easing out - moving towards target, overshooting it slightly, then reversing and coming back to target
        outBack: function(t, s)
        {
        	if (s == undefined) s = 1.70158;
        	t= t-1;
        	return (t*t*((s+1)*t + s) + 1);
        },

        outBackStrong: function(t, s)
        {
        	if (s == undefined) s = 1.70158*1.5;
        	t= t-1;
        	return (t*t*((s+1)*t + s) + 1);
        }

    };
    
})();
