const z7w79 = require("express");
const e480 = z7w79.Router();
const {
  protect: z937f,
  authorize: xmlg8
} = require("../middlewares/denim.middleware")
const l4op1u = require("../controllers/wallpaperContact.controller");
e480.use(z937f);

// Any logged-in user can view contacts
e480.get("/", l4op1u.listContacts);

// CourierHandler | OperationsManager | Administrator can create/update/delete
e480.post("/", xmlg8("CourierHandler", "OperationsManager", "Administrator"), l4op1u.createContact);
e480.put("/:id", xmlg8("CourierHandler", "OperationsManager", "Administrator"), l4op1u.updateContact);
e480.delete("/:id", xmlg8("CourierHandler", "OperationsManager", "Administrator"), l4op1u.deleteContact);
module.exports = e480;