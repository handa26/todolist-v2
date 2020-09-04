const express = require("express");
const bodyParser = require("body-parser");
const moongose = require("mongoose");
const _ = require("lodash");

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.set("view engine", "ejs");
// mongodb://localhost:27017/todolistDB
// 
// Create mongoose database
moongose.connect(
  "mongodb+srv://admin-handa:manjaddawajada@cluster0.nnubg.mongodb.net/todolistDB?retryWrites=true&w=majority",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

const itemsSchema = new moongose.Schema({
  name: String,
});

const listSchema = new moongose.Schema({
  name: String,
  items: [itemsSchema],
});

// Created new collection / Model
const Item = moongose.model("Item", itemsSchema);
const List = moongose.model("List", listSchema);

const item1 = new Item({ name: "Welcome to your to do list!" });
const item2 = new Item({ name: "Hit the + button to add a new item" });
const item3 = new Item({ name: "<--- Hit the X button to delete an item" });

const defaultItems = [item1, item2, item3];

app.get("/", (req, res) => {
  Item.find({}, function (err, docs) {
    // Check if the database is empty
    if (docs.length === 0) {
      // If empty then add to DB
      Item.insertMany(defaultItems, (err) => {
        err ? console.log(err) : console.log("Successfully added to DB.");
      });
      res.redirect("/");
    } else {
      // Otherwise just run it
      res.render("list", { listTitle: "Today", newListItems: docs });
    }
  });
});

app.get("/:customListName", (req, res) => {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName }, (err, docs) => {
    if (!err) {
      if (!docs) {
        // Create new list
        const list = new List({
          name: customListName,
          items: defaultItems,
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        // Render an existing list
        res.render("list", { listTitle: docs.name, newListItems: docs.items });
      }
    }
  });
});

app.post("/", (req, res) => {
  // Take the input value and store them on variable
  const itemName = req.body.todo;
  const listName = req.body.list;

  const item = new Item({
    name: itemName,
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }, (err, docs) => {
      docs.items.push(item);
      docs.save();
      res.redirect("/" + listName);
    });
  }
});

app.post("/delete", (req, res) => {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, (err) => {
      if (!err) {
        console.log("Successfully delete an item.");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } },
      (err, docs) => {
        if (!err) {
          res.redirect("/" + listName);
        }
      }
    );
  }
});

app.get("/about", (req, res) => {
  res.render("about");
});

app.listen(3000, () => {
  console.log("Server running at port 3000...");
});
