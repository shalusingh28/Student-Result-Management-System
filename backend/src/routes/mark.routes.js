const express = require("express");

const markController = require("../controllers/mark.controller");
const { requireRoles } = require("../middleware/auth");

const router = express.Router();

router.get("/", markController.getAll);
router.get("/:id", markController.getById);
router.post("/", markController.create);
router.put("/:id", markController.update);
router.delete("/:id", requireRoles("SUPER_ADMIN", "ADMIN"), markController.remove);

module.exports = router;
