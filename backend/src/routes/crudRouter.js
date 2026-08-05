const express = require("express");
const crudFactory = require("../controllers/crudFactory");
const { protect, adminOnly } = require("../middleware/auth");

// Builds a router with:
//   GET    /            -> public list (visible items only)
//   GET    /admin/all    -> admin list (all items)
//   GET    /:id          -> single item
//   POST   /             -> create (admin)
//   PUT    /:id          -> update (admin)
//   PATCH  /:id/hide     -> toggle visibility (admin)
//   DELETE /:id          -> delete (admin)
function crudRouter(Model, options) {
  const router = express.Router();
  const handlers = crudFactory(Model, options);

  router.get("/", handlers.listPublic);
  router.get("/admin/all", protect, adminOnly, handlers.listAdmin);
  router.get("/:id", handlers.getOne);
  router.post("/", protect, adminOnly, handlers.create);
  router.put("/:id", protect, adminOnly, handlers.update);
  router.patch("/:id/hide", protect, adminOnly, handlers.toggleHide);
  router.delete("/:id", protect, adminOnly, handlers.remove);

  return router;
}

module.exports = crudRouter;
