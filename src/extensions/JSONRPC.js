/*jsl:import ../src/net/XHR.js*/

function JSONRPC(method, url, parameters, options)
{
    options= Object.applyDefaults(options, JSONRPC.DEFAULTS);
    var deferred= XHR.request(method, url, parameters, options);
                        
    deferred.addCallback(JSONRPC.__requestComplete);
    return deferred;
}

Object.extend(JSONRPC, {

    DEFAULTS: {
        sync: false,
        responseContentType: 'application/json'
    },

    get: function(url, parameters, options)
    {
        return JSONRPC('GET', url, parameters, options);
    },
    
    post: function(url, parameters, options)
    {
        return JSONRPC('POST', url, parameters, options);
    },

    __requestComplete: function(response)
    {
        if (!response.head)
            return new Error('Invalid response format. Does not contain header block.');
    
        var status= parseInt(response.head.status,10);

        if (status>=300 && status<400)
        {
            JSONRPC.issueRedirect(response);
            return new Error('Response redirected');
        }
        else if (status>=400 && status<600)
        {
            var err= new Error(response.head.errorMessage);
            err.status= status;
            err.response= response;
            return err;
        }

        //  only pass the body along
        return response.body;
    },
    
    issueRedirect: function(response)
    {
        var url= response.head.location;
        var method= response.head.method;
        var args= response.head.args;
    
        if ('post'===method)
            JSONRPC.issuePostRedirect(url, args);
        else
            JSONRPC.issueGetRedirect(url, args);
        
        return true;
    },
    
    issuePostRedirect: function(url, args)
    {
		//build the form
		var form = document.createElement("form");

		form.action = url;
		form.method = "post";

		//generate hidden
		var p;
	    var v;
	    var o= {};

		function createHidden(fn, key, value)
		{
			var tn = document.createElement("input");
			fn.appendChild(tn);
			tn.type = "hidden";
			tn.name = key;
			tn.value = value;
	    }

		//loop over arguments and create hidden elements
	    for (p in args)
	    {
			v= args[p];
			//  skip properties defined on Object
			if (args[p]===o[p])
				continue;
	        if (v instanceof Array)
				v.forEach(function(value) { createHidden(form, p, value); });
			else
				createHidden(form, p, v);
		}

		//  Firefox won't submit the form unless it is part of the DOM...
		form.style.position='absolute';
		form.style.visibility='hidden';
		form.style.height='0px';
		form.style.width='0px';
		document.body.appendChild(form);

		//send it
		form.submit();
    },

    issueGetRedirect: function(url, args)
    {
    	if (!url)
    	    return;
	    
		args= Object.toQueryString(args);

        if (args)
        {
            if (url.indexOf('?'))
                url+= '&';
            else
                url+= '?';
            url+= args;
        }

		/*
		WebKit will not add the current page to the page history when doing
		a window.location.href to change the browser location. It requires a
		user interaction (such as a mouse click on a link). To work around this
		we do a window open to _top.
		http://bugs.webkit.org/show_bug.cgi?id=9148
		*/
		window.open(url, "_top");
    }
});
