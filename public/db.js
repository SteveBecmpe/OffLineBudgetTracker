//reference: https://javascript.info/indexeddb
//

//creates empty variable(object) named db.
let db;
// Request (can be named anything) to create a new index db request for a "budget" database.
const request = indexedDB.open("budget", 1);

//Checks to see if the version of the host server is different from user local server.
// the funtion will execute when onupgradeneeded is true.
//This function executes when onupgradeneeded is true, which happens when:
// the local user version is different from the hosting server version.
// event when the user version is ahead or behind, even when both in the case of two tabs. one left open while rev changed
// the function only executes if the versions are different.
// if the versions are the same ".onupgradeneeded" does NOT execute the function but does complete with out error allowing ".onsuccess" to be true.
request.onupgradeneeded = function(event) {
   // create object store called "pending" and set autoIncrement to true
  const db = event.target.result;
  //let db = openRequest.result;
  

  //create object store is the same as creating a table or collection. "pending" is the name of that store(table/collection), autoincrement is the index/key option
  //Can NOT store objects with circular references
  //keyOption can point to an object to generate index/key
  //ignoring this option will force providing the key later for storing
  db.createObjectStore("pending", { autoIncrement: true });//Synchronous execution
  //.createIndex is like defining the schema it sets up the columns


  //Success without failures of this functional check will allow ".onsucess" be true
  //Any errors in version value will trigger ".onerror" to be true
};

// listening for the return of the creat new index db.
// request is the return value. onsuccess will execute the function when it is true. ??
request.onsuccess = function(event) {
  db = event.target.result;//

  // check if app is online before reading from db
  if (navigator.onLine) {
    checkDatabase();
  }
};

//this function will execute when onerror is true.
request.onerror = function(event) {
  console.log("Woops! " + event.target.errorCode);
};

// for saving an object in idex db
function saveRecord(record) {
  // create a transaction on the pending db with readwrite access
  const transaction = db.transaction(["pending"], "readwrite");

  // access your pending object store
  const store = transaction.objectStore("pending");

  // add record to your store with add method.
  // .put can be used to add data but it overwrites anything that already exits.
  // .add will fail if there is date in the destination index/key
  store.add(record);
}

function checkDatabase() {
  // open a transaction on your pending db
  const transaction = db.transaction(["pending"], "readwrite");
  // access your pending object store
  const store = transaction.objectStore("pending");
  // get all records from store and set to a variable
  const getAll = store.getAll();

  getAll.onsuccess = function() {
    if (getAll.result.length > 0) {
      fetch("/api/transaction/bulk", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json"
        }
      })
      .then(response => response.json())
      .then(() => {
        // if successful, open a transaction on your pending db
        const transaction = db.transaction(["pending"], "readwrite");

        // access your pending object store
        const store = transaction.objectStore("pending");

        // clear all items in your store
        store.clear();
      });
    }
  };
}

// listen for app coming back online
window.addEventListener("online", checkDatabase);
