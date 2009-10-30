/*jsl:import test-helpers.js*/

Test.create('deferred', {

    setup: function()
    {
    },
    
    testResult: function(t)
    {
        var deferred= new coherent.Deferred();
        t.assertNotNull(deferred);
        deferred.callback(5);
        t.assertEqual(deferred.result(), 5);
    },
    
    testCallback: function(t)
    {
        var deferred= new coherent.Deferred();
        var callbackValue;
        
        function callbackFn(result)
        {
            callbackValue= result;
            return result;
        }
        
        t.assertNotNull(deferred);
        deferred.addMethods(callbackFn);
        deferred.callback(5);
        
        t.assertEqual(callbackValue, 5);
    },
    
    testFailure: function(t)
    {
        var deferred= new coherent.Deferred();
        var callbackValue;
        var failureValue;
        
        function callbackFn(result)
        {
            callbackValue= result;
            return result;
        }

        function failureFn(result)
        {
            failureValue= result;
            return result;
        }
        
        t.assertNotNull(deferred);
        deferred.addMethods(callbackFn, failureFn);
        deferred.failure(new Error("failed"));
        
        t.assertInstanceOf(failureValue, Error);
    },
    
    testMultipleCallback: function(t)
    {
        var deferred= new coherent.Deferred();
        var callbackValues=[];
        
        function callbackFn(result)
        {
            callbackValues.push(result);
            return result+1;
        }
        
        t.assertNotNull(deferred);
        deferred.addMethods(callbackFn);
        deferred.addMethods(callbackFn);
        deferred.callback(5);
        
        t.assertEqual(callbackValues, [5, 6]);
    },

    testMultipleWithSkippedCallback: function(t)
    {
        var deferred= new coherent.Deferred();
        var callbackValues=[];
        
        function callbackFn(result)
        {
            callbackValues.push(result);
            return result+1;
        }
        
        function failureFn(result)
        {
            return result;
        }
        
        t.assertNotNull(deferred);
        deferred.addMethods(callbackFn);
        deferred.addMethods(null, failureFn);
        deferred.addMethods(callbackFn);
        deferred.callback(5);
        
        t.assertEqual(callbackValues, [5, 6]);
    },
    
    testMultipleFailures: function(t)
    {
        var deferred= new coherent.Deferred();
        var failureCount= 0;
        
        function failureFn(result)
        {
            failureCount++;
            return result;
        }
        
        t.assertNotNull(deferred);
        deferred.addMethods(null, failureFn);
        deferred.addMethods(null, failureFn);
        deferred.callback(new Error('failure'));
        
        t.assertEqual(failureCount, 2);
    },

    testMultipleFailuresWithSkipped: function(t)
    {
        var deferred= new coherent.Deferred();
        var failureCount= 0;
        
        function failureFn(result)
        {
            failureCount++;
            return result;
        }
        
        function callbackFn(result)
        {
            t.fail('callback called');
        }
        
        t.assertNotNull(deferred);
        deferred.addMethods(null, failureFn);
        deferred.addMethods(callbackFn, null);
        deferred.addMethods(null, failureFn);
        deferred.callback(new Error('failure'));
        
        t.assertEqual(failureCount, 2);
    },
    
    testCallbackAsync: function(t)
    {
        var deferred= new coherent.Deferred();
        deferred.addMethods(callback);
        
        function timer()
        {
            deferred.callback(5);
        }
        
        function callback()
        {
            t.passed('callback called');
        }
        
        timer.delay(500);
        
        return t.async(1000);
    },

    testCallbackDeferred: function(t)
    {
        var deferred= new coherent.Deferred();
        var d2;
        
        deferred.addMethods(callback);
        deferred.addMethods(finalCallback);
        
        function timer()
        {
            d2.callback(5);
        }
        
        function finalCallback(result)
        {
            t.assertEqual(result, 5);
            t.passed();
        }
        
        function callback(result)
        {
            d2= new coherent.Deferred();
            timer.delay(500);
            return d2;
        }
        
        deferred.callback(2);
        return t.async(1000);
    }

});

