describe("Model dependent keys", function() {

  beforeEach(function(){
    coherent.Model._resetModels();
  });

  it("should create model with keyDependencies", function() {
    var M= Model("Foo", {
    
      firstName: Model.Property({
                  type: String
                }),
      lastName: Model.Property({
                  type: String
                }),
      
      fullName: function()
      {
        var firstName= this.firstName(),
            lastName= this.lastName();

        if (!firstName)
          return lastName;
        if (!lastName)
          return firstName;
        return [firstName, lastName].join(' ');
      },
      
      keyDependencies: {
        'fullName': ['firstName', 'lastName']
      }
    });
    
    var object= new M({
                  firstName: 'Bozo',
                  lastName: 'Clown'
                });
    var observer= new TestObserver();
    spyOn(observer, 'observeChange');
    
    object.addObserverForKeyPath(observer, 'observeChange', 'fullName');
    object.setValueForKey('The Clown', 'lastName');
    expect(observer.observeChange).toHaveBeenCalled();
  });
});