/*jsl:import ../../ui.js*/
/*jsl:import ../../foundation/core/asset.js*/

/** Creator for NIBs.
 */
function NIB(def)
{
    var oldDataModel= coherent.dataModel;
    var model= coherent.dataModel= NIB.__model;
    var applicationNib= !model;
    
    //  When there's no model predefined, we default to the application
    if (applicationNib)
    {
        model= coherent.dataModel= new coherent.KVO();
        model.setValueForKey(coherent.Application.shared, 'owner');
        model.setValueForKey(coherent.Application.shared, 'application');
    }
    
    var v;
    var p;
    var ignore= coherent.KVO.typesOfKeyValuesToIgnore;
    var ctypeof= coherent.typeOf;
    var views= [];
    var specialKeys= NIB.specialKeys;
    var awake= [];
    
    for (p in def)
    {
        //  Skip owner, because it's special
        if (p in specialKeys)
            continue;
    
        v= def[p];

        if (v && 'function'===typeof(v) && v.__factoryFn__)
            v= v.call(model);

        if (v instanceof coherent.Asset)
            v= v.content();
        
        var type= ctypeof(v);
        if ('array'===type || !(type in ignore || 'addObserverForKeyPath' in v))
            coherent.KVO.adaptTree(v);

        //  Remember all the views we've created, but don't add them to the list
        //  of things to awake, because we special process views.
        if (v instanceof coherent.View)
            views.push(v);
        else if ('awakeFromNib' in v)
            awake.push(v);
        model.setValueForKey(v, p);
    }

    model.__views= views;

    //  Setup linkages to the special objects
    for (var key in specialKeys)
    {
        var specialDef= def[key];
        var special= model.valueForKey(key);
        var modelValue;
    
        if (!special)
            continue;
        
        for (p in specialDef)
        {
            v= specialDef[p];
            if ('string'!==typeof(v))
            {
                special.setValueForKeyPath(v, p);
                continue;
            }
        
            //  See if the value is a keypath into the current model
            modelValue= model.valueForKeyPath(v);
            if (null===modelValue || 'undefined'===typeof(modelValue))
            {
                special.setValueForKeyPath(v, p);
                continue;
            }
        
            special.setValueForKeyPath(modelValue, p);
        }
    }

    var len= awake.length;
    while (len--)
        awake[len].awakeFromNib();

    len= views.length;
    while (len--)
        NIB.__awakeViewsFromNib(views[len]);
        
    coherent.dataModel= oldDataModel;
    
    if (applicationNib)
        coherent.Application.shared.__bundleLoaded(model);
}

Object.extend(NIB, {

    asset: function(href, content)
    {
        return new coherent.Asset(href, content);
    },

    /** Visit all elements in the node tree rooted at the view in depth first
        order. Call the view's awakeFromNib method only after calling the
        awakeFromNib method for all its subviews.
     */
    __awakeViewsFromNib: function(view)
    {
        var node= view.node;
        
        if (!node)
            return;
        var end= node.nextSibling||node.parentNode;
        var viewFromNode= coherent.View.fromNode;
        
        while (node!==end)
        {
            if (1===node.nodeType && node.firstChild)
            {
                node= node.firstChild;
                continue;
            }

            while (!node.nextSibling)
            {
                // if (1===node.nodeType)
                //     console.log('awakeViewsFromNib: ', node);
                // 
                if (1===node.nodeType && (view= viewFromNode(node)) && view.awakeFromNib)
                    view.awakeFromNib();
                node= node.parentNode;
                if (node===end)
                    return;
            }

            // if (1===node.nodeType)
            //     console.log('awakeViewsFromNib: ', node);
            // 
            if (1===node.nodeType && (view= viewFromNode(node)) && view.awakeFromNib)
                view.awakeFromNib();
            node= node.nextSibling;
        }
    },
    
    __scriptLoaded: function(href, owner, source)
    {
        var head= document.getElementsByTagName('head')[0];
        var script= document.createElement('script');
        script.type = 'text/javascript';
        script.defer = false;

        window.__filename__= String(href);
        var model= NIB.__model= new coherent.KVO();

        NIB.__model.setValueForKey(owner, 'owner');
        NIB.__model.setValueForKey(coherent.Application.shared, 'application');

        if (coherent.Browser.IE)
            script.text= source;
        else
            script.appendChild(document.createTextNode(source));
        head.appendChild(script);

        NIB.__model= null;
        window.__filename__= null;
        return model;
    },

    load: function(href, owner)
    {
        var d= XHR.get(href, null, {
                        responseContentType: 'text/plain'
                    });
        d.addCallback(NIB.__scriptLoaded.bind(null, href, owner));
        return d;
    },

    specialKeys: {
        'owner': true,
        'application': true
    }

});
