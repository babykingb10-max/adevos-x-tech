const { broadcastContentChange } = require("../utils/liveEvents");

// Generic CRUD handlers for simple content models managed from the Admin App
// (Hero Slides, Services, InTouch cards, Testimonials, StayConnected links,
// Footer links, Menu items, Updates, Tutorials, Banners, Plans, Payment methods,
// Packages, Deployment platforms/music). Cuts down repetition across routes.
//
// `contentType` is broadcast to all connected public clients after any
// mutation, so the frontend's useContentRefresh(type) hook can silently
// refetch instead of the person needing to manually reload the page.
function crudFactory(Model, { publicFilter = { isHidden: false }, contentType } = {}) {
  return {
    // Public: list only visible items, sorted by `order` where present
    listPublic: async (req, res) => {
      const items = await Model.find(publicFilter).sort({ order: 1, createdAt: 1 });
      res.json(items);
    },

    // Admin: list everything, including hidden
    listAdmin: async (req, res) => {
      const items = await Model.find().sort({ order: 1, createdAt: 1 });
      res.json(items);
    },

    getOne: async (req, res) => {
      const item = await Model.findById(req.params.id);
      if (!item) return res.status(404).json({ message: "Not found" });
      res.json(item);
    },

    create: async (req, res) => {
      const item = await Model.create(req.body);
      res.status(201).json(item);
      if (contentType) broadcastContentChange(req.app, contentType);
    },

    update: async (req, res) => {
      const item = await Model.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });
      if (!item) return res.status(404).json({ message: "Not found" });
      res.json(item);
      if (contentType) broadcastContentChange(req.app, contentType);
    },

    toggleHide: async (req, res) => {
      const item = await Model.findById(req.params.id);
      if (!item) return res.status(404).json({ message: "Not found" });
      item.isHidden = !item.isHidden;
      await item.save();
      res.json(item);
      if (contentType) broadcastContentChange(req.app, contentType);
    },

    remove: async (req, res) => {
      const item = await Model.findByIdAndDelete(req.params.id);
      if (!item) return res.status(404).json({ message: "Not found" });
      res.json({ message: "Deleted" });
      if (contentType) broadcastContentChange(req.app, contentType);
    },
  };
}

module.exports = crudFactory;
