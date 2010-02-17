/*jsl:import startup.js*/

coherent.KeyPathTrie= Class._create({

    constructor: function()
    {
        this.root = {value: null, children: {}};
    },

    add: function(keypath, value)
    {
        var children, key, currentNode = this.root;

        if ('string'===typeof(keypath))
            keypath= keypath.split('.');
            
        for (var i=0, keypathLength=keypath.length; i<keypathLength; i++)
        {
            key = keypath[i];
            children = currentNode.children;
            if (key in children)
                currentNode= children[key];
            else
                currentNode= children[key]= {value: null, children: {}};
        }
        currentNode.value = value;
    },

    find: function(keypath)
    {
        var key, currentNode = this.root;
        
        if ('string'===typeof(keypath))
            keypath= keypath.split('.');
            
        for (var i=0, keypathLength=keypath.length; i<keypathLength; i++)
        {
            key = keypath[i];
            if (!(currentNode= currentNode.children[key]))
                return null;
        }
        return currentNode.value;
    },

    findByPrefix: function(keypath)
    {
        var key, currentNode = this.root;

        if ('string'===typeof(keypath))
            keypath= keypath.split('.');
            
        for (var i=0, keypathLength=keypath.length; i<keypathLength; i++)
        {
            key = keypath[i];
            if (key in currentNode.children)
                currentNode = currentNode.children[key];
            else
                return {
                    value: currentNode.value,
                    remainder: keypath.slice(i)
                };
        }
        return {
            value: currentNode.value,
            remainder: []
        };
    },

    getValuesWithPrefix: function(keypath)
    {
        if ('string'===typeof(keypath))
            keypath= keypath.split('.');
            
        var key, children, currentNode = this.root;

        for (var i=0, keypathLength=keypath.length; i<keypathLength; i++)
        {
            key = keypath[i];
            if (!(currentNode = currentNode.children[key]))
                return [];
        }

        var node, stack = [currentNode], ret = [];
        
        while (stack.length>0)
        {
            node = stack.pop();
            
            if (node.value)
                ret.unshift(node.value);
                
            children= node.children;
            for (var child in children)
                stack.push(children[child]);
        }
        
        return ret;
    }
    
});
