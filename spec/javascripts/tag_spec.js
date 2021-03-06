describe("Tag", function() {

  var graph, tag, ajaxSpy;


  beforeEach(function() {

    loadFixtures('graph.html');

    jasmine.Ajax.install();

    ajaxSpy = spyOn($, "ajax").and.callFake(function(object) {

      var response;

      if      (object.url == '/spectrums/9.json') response = object.success(TestResponses.spectrum.success.responseText);
      else if (object.url == '/spectrums/9/tags') response = object.success(TestResponses.tags.success.responseText);
      else if (object.url == '/tags')             response = object.success({'saved':[[1,1]]}); // && object.method == "PUT" // method doesn't work and isn't necessary as of yet
      else if (object.url == '/tags/1')           response = object.success('success'); // && object.method == "DELETE"
      else response = 'none';

      // check this if you have trouble faking a server response: 
      if (response != 'none') console.log('Faked response to:', object.url)
      else console.log('Failed to fake response to:', object.url)

    });


  });


  afterEach(function() {

    jasmine.Ajax.uninstall();

  });


  var initCallbackSpy;

  it("spectrum is initialized", function(done) {

    initCallbackSpy = jasmine.createSpy('success');

    graph = new SpectralWorkbench.Graph({
      spectrum_id: 9,
      calibrated: true,
      onComplete: initCallbackSpy,
      onImageComplete: function() { done(); } // fires when graph.image is loaded, so that later tests can run

    });

    expect(graph).toBeDefined();
    expect(graph.datum).toBeDefined();

  });


  it("spectrum init callback is called", function() {

    expect(initCallbackSpy).toHaveBeenCalled();

  });


  var addTagCallbackSpy = jasmine.createSpy('success');

  it("creates properly for simple tagname like 'sodium', and returns with datum.getTag()", function(done) {

    tag = graph.datum.addTag('sodium', function(tag, ajaxResponse) {

      // beware; these can fail silently if this callback is not called; add a toHaveBeenCalled() test
      expect(tag.json).toBeDefined();
      expect(tag.id).toBeDefined();
      expect(tag.id).toBe(1);

      addTagCallbackSpy();

      done();

    });

    // tag should then be parsed

    expect(tag).toBeDefined();
    expect(tag.isNew).toBe(true);
    expect(tag.json).toEqual({});
    expect(tag.id).toBeDefined(); // once it's loaded...
    expect(tag.id).toBe(1);

    var gottenTag = graph.datum.getTag('sodium');

    expect(gottenTag).toBeDefined();
    expect(gottenTag).not.toBe(false);
    expect(gottenTag.id).toBeDefined();
    expect(gottenTag.id).toBe(1);

  });


  it("datum.addTag callback is called", function() {

    expect(addTagCallbackSpy).toHaveBeenCalled();

  });


  var uploadCallbackSpy = jasmine.createSpy('success');

  it("uploads and saves", function(done) {

    // tag.upload() is failing because tag is undefined here. 
    // so, we're making it again. But this time, unlike on line 87, we can't seem to get 
    // a tag with getTag('sodium'). What gives? Asked on the Jasmine forum here: https://groups.google.com/forum/#!topic/jasmine-js/yfMjRSeerzE
    //tag = graph.datum.getTag('sodium');
    tag = graph.datum.getTag('upload');
    expect(tag).toBeDefined();
    expect(tag).not.toBe(false);

    // this is already run in datum.addTag, but testing it again: 

    var uploadCallback = function(response) {

      expect(response).toBeDefined();

      uploadCallbackSpy();

      done();

    }

    tag.upload(uploadCallback);

  });


  it("upload callback is called", function() {

    expect(uploadCallbackSpy).toHaveBeenCalled();

  });


  // strangely, by this point, getTag('sodium') DOES work... 

  it("with tagname 'sodium' is not a powertag", function() {

    var gottenTag = graph.datum.getTag('sodium');

    // not to be a powertag:
    expect(gottenTag).not.toBe(false);
    expect(gottenTag.key).not.toBeDefined();
    expect(gottenTag.value).not.toBeDefined();
    expect(gottenTag.powertag).toEqual(false);

  });


  var deletionCallbackSpy = jasmine.createSpy('success');

  it("deletes properly with datum.removeTag()", function(done) {

    graph.datum.removeTag('sodium', function(tag) {

      expect(tag).toBeDefined(); // the response

      expect(graph.datum.getTag('sodium')).toBe(false);

      deletionCallbackSpy();

      done(); // complete asynchronous call

    });

  });


  it("deletion callback is called", function() {

    expect(deletionCallbackSpy).toHaveBeenCalled();

  });


  it("creates properly for powertag like 'range'", function() {

    tag = graph.datum.addTag('range:400-700');

    // tag should then be parsed

    expect(tag).toBeDefined();

  });


  it("with tag key 'range' is a powertag", function() {

    // not to be a powertag:
    expect(tag.key).toBeDefined();
    expect(tag.key).toBe('range');
    expect(tag.value).toBeDefined();
    expect(tag.value).toBe('400-700');
    expect(tag.powertag).toEqual(true);

  });


  // these are all tested as part of the above, but could be individually tested as well:

  // Delete it from the server, then from the DOM;
  // tag.destroy()
  // scrubs local tag data; for use after deletion
  // tag.cleanUp()

});
