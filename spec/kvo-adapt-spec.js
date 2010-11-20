describe("KVO#adapt", function() {

  it("should add KVO methods to an object", function() {
    var obj= coherent.KVO.adapt({});
    expect(obj).toHaveMethod('valueForKey');
    expect(obj).toHaveMethod('setValueForKey');
    expect(obj).toHaveMethod('valueForKeyPath');
    expect(obj).toHaveMethod('setValueForKeyPath');
  });
  
});