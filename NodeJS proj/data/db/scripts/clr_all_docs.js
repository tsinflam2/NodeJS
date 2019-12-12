db.getCollectionNames().forEach(
  function(collection_name) {
    db[collection_name].remove()
  }
);
