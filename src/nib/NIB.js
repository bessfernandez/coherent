/*jsl:import ../core/startup.js*/

/*jsl:declare NIB*/

(function() {

    function findNibScript()
    {
        var scripts= document.getElementsByTagName('script');
        var s;

        for (var i=scripts.length-1; i>=0; --i)
        {
            s= scripts[i];
            if (s.onnibload)
                return s;
        }

        return null;
    }

    function NIB(def)
    {
        var nibScript= findNibScript();
        if (!nibScript)
            throw new Error("Couldn't find NIB script");

        def.objects= def.objects||{};
    
        var oldDataModel= coherent.dataModel;
        var model= coherent.dataModel= nibScript.model;
    
        var v;
        var p;
        var ignore= coherent.KVO.typesOfKeyValuesToIgnore;
        var ctypeof= coherent.typeOf;
    
        for (p in def.objects)
        {
            //  Skip owner, because it's special
            if ('owner'===p)
                continue;
            
            v= def.objects[p];
            if (v && 'function'===typeof(v) && v.__factoryFn__)
                v= v.call(model);

            if (!(ctypeof(v) in ignore) && !('addObserverForKeyPath' in v))
                coherent.KVO.adaptTree(v);
        
            model.setValueForKey(v, p);
        }

        coherent.dataModel= oldDataModel;

        if (def.setup)
            def.setup(model);

        nibScript.onnibload(model);
    }

    Object.extend(NIB, {

        load: function(href, owner)
        {
            var head= document.getElementsByTagName('head')[0];
            var script= document.createElement('script');
            var d= new coherent.Deferred();

            script.type = 'text/javascript';
            script.defer = false;
            script.model= new coherent.KVO();
            script.model.setValueForKey(owner, 'owner');
        
            script.onnibload= function(nib)
            {
                d.callback(nib);
                script.onnibload= null;
            }
            script.src= href;
            head.appendChild(script);

            return d;
        }

    });

    window.NIB= NIB;
    
})();