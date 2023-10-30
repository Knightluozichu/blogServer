/* global use, db */
// MongoDB Playground
// Use Ctrl+Space inside a snippet or a string literal to trigger completions.

const database = 'blog';
const collection = 'blogDocuments';

// Create a new database.
use(database);

// Create a new collection.
// db.createCollection(collection);

// db.getCollection(collection).insertMany([
//   {
//     title: 'My First Blog Post',
//       content: 'This is my first blog post.',
//       tags: ['mongodb', 'blog', 'javascript'],
//       creator: {
//           name: 'John Doe',
//           email: 'rainknightpox@gmail.com',
//       },
//       comments: [
//           {
//               name: 'Jane Doe',
//               email: 'rainknightpox@gmail.com',
//               text: 'Nice post!',
//           },
//       ],
//       createdAt: new Date(),
//   },
//   {
//     title: 'My Second Blog Post',
//       content: 'This is my second blog post.',
//       tags: ['mongodb', 'blog', 'javascript'],
//       creator: {
//           name: 'John Doe',
//           email: 'rainknightpox@gmail.com',
//       },
//       comments: [
//           {
//               name: 'Jane Doe',
//               email: 'rainknightpox@gmail.com',
//               text: 'Nice post!',
//           },
//       ],
//       createdAt: new Date(),
//   },

// ]);

const col = db.getCollection(collection);

col.find({}).forEach((doc) => {
  print(doc.title);
});

// The prototype form to create a collection:
/* db.createCollection( <name>,
  {
    capped: <boolean>,
    autoIndexId: <boolean>,
    size: <number>,
    max: <number>,
    storageEngine: <document>,
    validator: <document>,
    validationLevel: <string>,
    validationAction: <string>,
    indexOptionDefaults: <document>,
    viewOn: <string>,
    pipeline: <pipeline>,
    collation: <document>,
    writeConcern: <document>,
    timeseries: { // Added in MongoDB 5.0
      timeField: <string>, // required for time series collections
      metaField: <string>,
      granularity: <string>,
      bucketMaxSpanSeconds: <number>, // Added in MongoDB 6.3
      bucketRoundingSeconds: <number>, // Added in MongoDB 6.3
    },
    expireAfterSeconds: <number>,
    clusteredIndex: <document>, // Added in MongoDB 5.3
  }
)*/

// More information on the `createCollection` command can be found at:
// https://www.mongodb.com/docs/manual/reference/method/db.createCollection/
